"""Tests for the agent chat endpoint."""


def test_agent_chat_no_api_key(client):
    """Without ANTHROPIC_API_KEY, should return an error SSE event."""
    response = client.post("/api/agent/chat", json={
        "messages": [{"role": "user", "content": "Hola"}],
        "context": {"current_page": "overview", "filters": {}, "data_summary": ""},
    })
    assert response.status_code == 200
    # Should contain an error about missing API key
    body = response.text
    assert "ANTHROPIC_API_KEY" in body or "error" in body


def test_agent_chat_request_validation(client):
    """Request with invalid body should return 422."""
    response = client.post("/api/agent/chat", json={})
    assert response.status_code == 422


def test_agent_chat_accepts_valid_request(client):
    """Valid request structure should be accepted (even if API key is missing)."""
    response = client.post("/api/agent/chat", json={
        "messages": [{"role": "user", "content": "¿Cuál es el revenue total?"}],
        "context": {
            "current_page": "overview",
            "filters": {"segment": "oro"},
            "data_summary": "Viendo dashboard",
        },
    })
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
