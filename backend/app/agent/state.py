"""State schema for the LangGraph agent."""
from __future__ import annotations

from typing import Annotated, Any
from typing_extensions import TypedDict

from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    context: dict           # current_page, filters, data_summary
    route: str              # "simple" | "deep" | "direct"
    tool_results: list[dict]
    final_response: str
