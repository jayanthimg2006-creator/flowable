"""
Tests for End-to-End /ask execution pipeline
"""

from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient

from backend.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_ask_empty_question(client):
    response = client.post("/ask", json={"question": "   "})
    assert response.status_code == 400


@patch("backend.config.Settings.is_qdrant_configured", return_value=True)
@patch("backend.config.Settings.is_lyzr_configured", return_value=True)
@patch("backend.memory.memory_service.search_memories")
@patch("backend.lyzr_agent.lyzr_service.ask")
def test_ask_end_to_end_success(mock_lyzr, mock_search, mock_lyzr_cfg, mock_qdrant_cfg, client):
    mock_search.return_value = [
        {
            "id": "point-123",
            "score": 0.88,
            "title": "House Keys",
            "text": "I placed the spare keys in the blue ceramic bowl on the entryway console table.",
            "timestamp": "2026-10-12T14:30:00Z",
            "action_items": [],
        }
    ]
    mock_lyzr.return_value = {
        "answer": "Your spare keys are in the blue ceramic bowl on the entryway console table.\n1. Walk to the entryway.\n2. Look inside the blue bowl.",
        "session_id": "test_session_1",
        "action_steps": ["Walk to the entryway.", "Look inside the blue bowl."],
        "retrieved_memories": mock_search.return_value,
    }

    response = client.post("/ask", json={"question": "Where did I put the spare keys?"})
    assert response.status_code == 200
    data = response.json()
    assert "blue ceramic bowl" in data["answer"]
    assert len(data["retrieved_memories"]) == 1
    assert data["retrieved_memories"][0]["title"] == "House Keys"
    assert len(data["action_steps"]) == 2


@patch("backend.config.Settings.is_qdrant_configured", return_value=False)
@patch("backend.config.Settings.is_lyzr_configured", return_value=False)
def test_ask_graceful_when_unconfigured(mock_lyzr_cfg, mock_qdrant_cfg, client):
    response = client.post("/ask", json={"question": "What did I do yesterday?"})
    assert response.status_code == 200
    data = response.json()
    assert "warning" in data or "Lyzr" in data["answer"]
