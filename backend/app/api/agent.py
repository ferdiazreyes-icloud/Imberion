"""
Agent API endpoint — POST /api/agent/chat

Accepts conversation messages + page context, runs the LangGraph agent,
and returns the final response. SSE streaming for future enhancement.
"""
from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.agent.graph import get_graph

router = APIRouter()


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class PageContext(BaseModel):
    current_page: str = "unknown"
    filters: dict = {}
    data_summary: str = ""


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    context: PageContext = PageContext()


@router.post("/agent/chat")
async def agent_chat(request: ChatRequest, db: Session = Depends(get_db)):
    """Run the AI agent and stream the response via SSE."""
    if not settings.anthropic_api_key:
        async def no_key_stream():
            yield _sse_event("error", "ANTHROPIC_API_KEY not configured on the server.")
            yield _sse_event("done")
        return StreamingResponse(no_key_stream(), media_type="text/event-stream")

    # Convert messages to LangChain format
    from langchain_core.messages import HumanMessage, AIMessage

    lc_messages = []
    for msg in request.messages:
        if msg.role == "user":
            lc_messages.append(HumanMessage(content=msg.content))
        else:
            lc_messages.append(AIMessage(content=msg.content))

    # Build initial state
    context = request.context.model_dump()
    context["_db"] = db  # Pass db session to tools

    initial_state = {
        "messages": lc_messages,
        "context": context,
        "route": "",
        "tool_results": [],
        "final_response": "",
    }

    async def generate():
        try:
            yield _sse_event("status", "Analizando tu pregunta...")

            graph = get_graph()
            result = graph.invoke(initial_state)

            final = result.get("final_response", "")
            tool_results = result.get("tool_results", [])

            # Send tool usage info
            if tool_results:
                tool_names = list({tr["tool"] for tr in tool_results})
                yield _sse_event("status", f"Consulté: {', '.join(tool_names)}")

            # Send the response in chunks for a streaming feel
            if final:
                # Split into sentences for progressive display
                chunks = _split_into_chunks(final)
                for chunk in chunks:
                    yield _sse_event("text_delta", chunk)

            yield _sse_event("done")

        except Exception as e:
            yield _sse_event("error", f"Error del agente: {str(e)}")
            yield _sse_event("done")

    return StreamingResponse(generate(), media_type="text/event-stream")


def _sse_event(event_type: str, data: str = "") -> str:
    """Format a Server-Sent Event."""
    payload = json.dumps({"type": event_type, "text": data})
    return f"data: {payload}\n\n"


def _split_into_chunks(text: str, max_chunk: int = 100) -> list[str]:
    """Split text into chunks at sentence boundaries for progressive display."""
    if len(text) <= max_chunk:
        return [text]

    chunks = []
    current = ""
    for sentence in text.replace(". ", ".|").replace("\n", "\n|").split("|"):
        if len(current) + len(sentence) > max_chunk and current:
            chunks.append(current)
            current = sentence
        else:
            current += sentence
    if current:
        chunks.append(current)
    return chunks
