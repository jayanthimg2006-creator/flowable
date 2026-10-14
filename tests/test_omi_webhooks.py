"""
Tests for Omi Webhook Processing and Parsing
"""

from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.omi_webhook import parse_omi_conversation_payload


@pytest.fixture
def client():
    return TestClient(app)


def test_parse_omi_conversation_payload():
    sample_payload = {
        "id": "mem_12345",
        "created_at": "2026-10-12T10:00:00Z",
        "structured": {
            "title": "Dentist Appointment Preparation",
            "overview": "Need to bring insurance card and arrive 15 minutes early.",
            "action_items": ["Find insurance card", "Arrive at 2:45 PM"],
            "category": "health",
        },
        "transcript_segments": [
            {
                "speaker": "Doctor",
                "text": "Remember to bring your dental insurance card.",
                "start": 0.0,
                "end": 3.0,
            },
            {
                "speaker": "Patient",
                "text": "Sure, and what time should I arrive?",
                "start": 3.5,
                "end": 5.0,
            },
            {
                "speaker": "Doctor",
                "text": "Arrive 15 minutes before 3 PM.",
                "start": 5.5,
                "end": 8.0,
            },
        ],
    }

    parsed = parse_omi_conversation_payload(sample_payload)
    assert parsed["memory_id"] == "mem_12345"
    assert parsed["title"] == "Dentist Appointment Preparation"
    assert "Doctor: Remember to bring your dental insurance card." in parsed["text"]
    assert len(parsed["action_items"]) == 2
    assert parsed["category"] == "health"


@patch("backend.memory.memory_service.store_memory")
def test_omi_conversation_webhook_success(mock_store, client):
    mock_store.return_value = {
        "point_id": "00000000-0000-0000-0000-000000000001",
        "stored": True,
    }

    payload = {
        "id": "mem_test_webhook_01",
        "structured": {
            "title": "Grocery Shopping List",
            "overview": "Spoken grocery items for soup.",
            "action_items": ["Buy carrots", "Buy celery", "Buy chicken broth"],
        },
        "transcript": "Buy carrots, celery, and chicken broth from the farmers market.",
    }

    response = client.post("/omi/conversation?uid=user_77", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["memory_id"] == "mem_test_webhook_01"


def test_omi_conversation_webhook_malformed(client):
    # Missing transcript and text
    payload = {
        "id": "mem_empty",
        "structured": {}
    }
    response = client.post("/omi/conversation", json=payload)
    assert response.status_code == 400


def test_omi_realtime_webhook(client):
    payload = {
        "uid": "user_42",
        "text": "I am putting my keys on the front table.",
        "speaker": "SPEAKER_00",
        "is_final": True,
        "timestamp": "2026-10-12T12:00:00Z",
    }
    response = client.post("/omi/realtime", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "received"
    assert data["is_final"] is True
