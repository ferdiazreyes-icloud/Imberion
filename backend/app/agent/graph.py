"""
LangGraph agent — multi-model ReAct with tool use.

Nodes:
  orchestrator  (Sonnet)  → classifies intent, routes
  tool_executor (Sonnet)  → executes tools in ReAct loop
  deep_analyst  (Opus)    → deep causal / strategic analysis
  synthesizer   (Sonnet)  → formats final response
"""
from __future__ import annotations

import json
from typing import Literal

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END

from app.config import settings
from app.agent.state import AgentState
from app.agent.prompts import build_orchestrator_prompt, DEEP_ANALYST_PROMPT, SYNTHESIZER_PROMPT, GUARDRAIL_RESPONSE
from app.agent import tools as tool_fns

# ---------------------------------------------------------------------------
# LangChain tool wrappers (schema only — execution is manual via db session)
# ---------------------------------------------------------------------------
TOOL_SCHEMAS = [
    {
        "name": "get_overview_kpis",
        "description": "Get high-level KPIs: total volume, revenue, avg price, avg rebate, customer/sku/territory counts. Use when user asks about overall metrics, summary, or dashboard numbers.",
        "input_schema": {
            "type": "object",
            "properties": {
                "segment": {"type": "string", "description": "Filter by segment: 'oro', 'plata', 'bronce', or comma-separated"},
                "territory_id": {"type": "string", "description": "Filter by territory ID(s), comma-separated"},
                "category_id": {"type": "string", "description": "Filter by category ID(s), comma-separated"},
                "customer_id": {"type": "string", "description": "Filter by customer/distributor ID(s), comma-separated"},
            },
        },
    },
    {
        "name": "get_revenue_by_dimension",
        "description": "Break down revenue and volume by category, segment, or territory. Use when user asks 'which category has most revenue?' or 'revenue by segment'.",
        "input_schema": {
            "type": "object",
            "properties": {
                "dimension": {"type": "string", "enum": ["category", "segment", "territory"], "description": "Dimension to group by"},
                "segment": {"type": "string", "description": "Filter by segment"},
                "territory_id": {"type": "string", "description": "Filter by territory ID(s)"},
                "category_id": {"type": "string", "description": "Filter by category ID(s)"},
                "customer_id": {"type": "string", "description": "Filter by customer ID(s)"},
            },
            "required": ["dimension"],
        },
    },
    {
        "name": "get_price_trends",
        "description": "Get monthly price, volume, and revenue trends over time. Use when user asks about trends, evolution, or historical patterns.",
        "input_schema": {
            "type": "object",
            "properties": {
                "segment": {"type": "string", "description": "Filter by segment"},
                "territory_id": {"type": "string", "description": "Filter by territory ID(s)"},
                "category_id": {"type": "string", "description": "Filter by category ID(s)"},
                "customer_id": {"type": "string", "description": "Filter by customer ID(s)"},
            },
        },
    },
    {
        "name": "get_elasticity",
        "description": "Fetch price elasticity records. Elasticity measures how volume responds to price changes. Use when user asks about elasticity, price sensitivity, or 'how elastic is product X?'.",
        "input_schema": {
            "type": "object",
            "properties": {
                "node_type": {"type": "string", "enum": ["category", "sku", "segment", "territory"], "description": "Type of entity"},
                "node_id": {"type": "integer", "description": "ID of the entity"},
                "confidence_level": {"type": "string", "enum": ["high", "medium", "low"], "description": "Filter by confidence level"},
            },
        },
    },
    {
        "name": "simulate_price_change",
        "description": "Simulate the impact of a price change on volume, revenue, and margin. Use when user says 'what if we raise/lower price by X%?' or 'simulate a price change'.",
        "input_schema": {
            "type": "object",
            "properties": {
                "product_id": {"type": "integer", "description": "Product ID to simulate"},
                "category_id": {"type": "integer", "description": "Category ID to simulate (if no specific product)"},
                "segment": {"type": "string", "description": "Filter by segment"},
                "price_change_pct": {"type": "number", "description": "Price change percentage (e.g., 5 for +5%, -10 for -10%)"},
            },
            "required": ["price_change_pct"],
        },
    },
    {
        "name": "get_recommendations",
        "description": "Get pricing recommendations: increase, protect, or decrease. Each includes expected impact and confidence level. Use when user asks 'what should we do?' or 'recommendations for segment X'.",
        "input_schema": {
            "type": "object",
            "properties": {
                "segment": {"type": "string", "description": "Filter by segment"},
                "category_id": {"type": "integer", "description": "Filter by category ID"},
                "action_type": {"type": "string", "enum": ["increase", "protect", "decrease"], "description": "Filter by action type"},
                "confidence_level": {"type": "string", "enum": ["high", "medium", "low"], "description": "Filter by confidence"},
                "limit": {"type": "integer", "description": "Max results (default 20)"},
            },
        },
    },
    {
        "name": "get_passthrough_analysis",
        "description": "Analyze price decomposition: list price, discount, rebate, and net price. Use when user asks about rebates, discounts, passthrough, or price structure.",
        "input_schema": {
            "type": "object",
            "properties": {
                "dimension": {"type": "string", "enum": ["segment", "category"], "description": "Group by segment or category"},
                "segment": {"type": "string", "description": "Filter by segment"},
                "category_id": {"type": "string", "description": "Filter by category ID(s)"},
                "customer_id": {"type": "string", "description": "Filter by customer ID(s)"},
            },
        },
    },
]

# Map tool names to actual functions
TOOL_FN_MAP = {
    "get_overview_kpis": tool_fns.get_overview_kpis,
    "get_revenue_by_dimension": tool_fns.get_revenue_by_dimension,
    "get_price_trends": tool_fns.get_price_trends,
    "get_elasticity": tool_fns.get_elasticity,
    "simulate_price_change": tool_fns.simulate_price_change,
    "get_recommendations": tool_fns.get_recommendations_data,
    "get_passthrough_analysis": tool_fns.get_passthrough_analysis,
}


def execute_tool(name: str, args: dict, db) -> dict:
    """Execute a tool function with the given arguments and db session."""
    fn = TOOL_FN_MAP.get(name)
    if not fn:
        return {"error": f"Unknown tool: {name}"}
    return fn(db=db, **args)


# ---------------------------------------------------------------------------
# Graph builder
# ---------------------------------------------------------------------------
def build_graph():
    """Build and compile the LangGraph agent."""

    def orchestrator(state: AgentState) -> dict:
        """Classify user intent and decide routing."""
        llm = ChatAnthropic(
            model=settings.agent_model_fast,
            api_key=settings.anthropic_api_key,
            max_tokens=1024,
        )

        system = build_orchestrator_prompt(state["context"])

        # Ask the LLM to classify the query
        classify_prompt = (
            "Based on the user's latest message, classify the intent:\n"
            "- 'simple': Needs data lookup (KPIs, elasticities, revenue breakdown, trends)\n"
            "- 'deep': Needs causal analysis, strategic advice, or interpretation (why, recommend, strategy)\n"
            "- 'direct': Greeting, off-topic, or simple question that doesn't need tools\n\n"
            "Respond with ONLY one word: simple, deep, or direct"
        )

        messages = state["messages"]
        response = llm.invoke([
            SystemMessage(content=system),
            *messages,
            HumanMessage(content=classify_prompt),
        ])

        route_text = response.content.strip().lower()
        if "deep" in route_text:
            route = "deep"
        elif "direct" in route_text:
            route = "direct"
        else:
            route = "simple"

        return {"route": route, "tool_results": []}

    def tool_executor(state: AgentState) -> dict:
        """Execute tools in a ReAct loop using Sonnet."""
        llm = ChatAnthropic(
            model=settings.agent_model_fast,
            api_key=settings.anthropic_api_key,
            max_tokens=4096,
        )

        system = build_orchestrator_prompt(state["context"])
        api_messages = [SystemMessage(content=system)] + list(state["messages"])

        tool_results = []
        max_iterations = 5

        for _ in range(max_iterations):
            response = llm.invoke(
                api_messages,
                tools=TOOL_SCHEMAS,
            )

            # Check if the model wants to use tools
            tool_calls = [
                block for block in response.content
                if isinstance(block, dict) and block.get("type") == "tool_use"
            ]

            if not tool_calls:
                # No more tool calls — model is done
                text_content = ""
                if isinstance(response.content, str):
                    text_content = response.content
                elif isinstance(response.content, list):
                    for block in response.content:
                        if isinstance(block, dict) and block.get("type") == "text":
                            text_content += block["text"]
                return {
                    "tool_results": tool_results,
                    "final_response": text_content,
                }

            # Execute each tool call
            api_messages.append(response)
            for tc in tool_calls:
                tool_name = tc["name"]
                tool_input = tc["input"]
                tool_id = tc["id"]

                # We need db — it's stored in context
                db = state["context"].get("_db")
                result = execute_tool(tool_name, tool_input, db)
                tool_results.append({"tool": tool_name, "input": tool_input, "result": result})

                api_messages.append(
                    ToolMessage(content=json.dumps(result, default=str), tool_call_id=tool_id)
                )

        # If we hit max iterations, return what we have
        return {"tool_results": tool_results, "final_response": ""}

    def deep_analyst(state: AgentState) -> dict:
        """Deep analysis using Opus — receives pre-fetched data."""
        llm = ChatAnthropic(
            model=settings.agent_model_deep,
            api_key=settings.anthropic_api_key,
            max_tokens=4096,
        )

        # Build context with tool results
        data_summary = json.dumps(state["tool_results"], default=str, indent=2)
        user_msg = ""
        for msg in reversed(state["messages"]):
            if hasattr(msg, "content") and (not hasattr(msg, "type") or msg.type == "human"):
                user_msg = msg.content if isinstance(msg.content, str) else str(msg.content)
                break

        response = llm.invoke([
            SystemMessage(content=DEEP_ANALYST_PROMPT),
            HumanMessage(content=(
                f"PREGUNTA DEL USUARIO: {user_msg}\n\n"
                f"DATOS CONSULTADOS:\n{data_summary}\n\n"
                "Analiza estos datos y responde la pregunta del usuario con un análisis profundo."
            )),
        ])

        return {"final_response": response.content}

    def synthesizer(state: AgentState) -> dict:
        """Format the final response."""
        # If there's already a good final_response, just pass it through
        if state.get("final_response"):
            return {"final_response": state["final_response"]}
        return {"final_response": "No pude obtener datos para responder tu pregunta. ¿Podrías reformularla?"}

    def direct_response(state: AgentState) -> dict:
        """Handle direct responses (greetings, off-topic) with guardrails."""
        llm = ChatAnthropic(
            model=settings.agent_model_fast,
            api_key=settings.anthropic_api_key,
            max_tokens=1024,
        )

        response = llm.invoke([
            SystemMessage(content=GUARDRAIL_RESPONSE),
            *state["messages"],
        ])

        return {"final_response": response.content}

    # Route function
    def route_after_orchestrator(state: AgentState) -> Literal["tool_executor", "direct_response"]:
        route = state.get("route", "simple")
        if route == "direct":
            return "direct_response"
        return "tool_executor"

    def route_after_tools(state: AgentState) -> Literal["deep_analyst", "synthesizer"]:
        route = state.get("route", "simple")
        if route == "deep":
            return "deep_analyst"
        return "synthesizer"

    # Build the graph
    graph = StateGraph(AgentState)

    graph.add_node("orchestrator", orchestrator)
    graph.add_node("tool_executor", tool_executor)
    graph.add_node("deep_analyst", deep_analyst)
    graph.add_node("synthesizer", synthesizer)
    graph.add_node("direct_response", direct_response)

    graph.set_entry_point("orchestrator")

    graph.add_conditional_edges("orchestrator", route_after_orchestrator)
    graph.add_conditional_edges("tool_executor", route_after_tools)
    graph.add_edge("deep_analyst", "synthesizer")
    graph.add_edge("synthesizer", END)
    graph.add_edge("direct_response", END)

    return graph.compile()


# Singleton compiled graph
_compiled_graph = None


def get_graph():
    """Get or create the compiled graph."""
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph
