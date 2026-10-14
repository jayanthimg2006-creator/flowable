"""
Tests for FlowAble Health, Status, and Activity Logging
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.activity_logger import activity_logger


@pytest.fixture
def client():
    return TestClient(app)


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "FlowAble"
    assert "version" in data


def test_status_endpoint(client):
    response = client.get("/status")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "integrations" in data
    assert "omi" in data["integrations"]
    assert "qdrant" in data["integrations"]
    assert "lyzr" in data["integrations"]
    
    # Verify no raw secrets are exposed
    json_str = response.text.lower()
    assert "api_key" not in json_str or "key_set" in json_str


def test_activity_logger():
    activity_logger.clear()
    activity_logger.log(
        event_type="test_event",
        message="Testing log mechanism",
        status="success",
        metadata={"key": "value"},
    )
    events = activity_logger.get_recent_events(limit=10)
    assert len(events) >= 1
    assert events[0]["event_type"] == "test_event"
    assert events[0]["status"] == "success"
