"""
Tests for Lyzr Agent Integration and Prompt Construction
"""

from unittest.mock import patch, MagicMock
import pytest

from backend.lyzr_agent import lyzr_service


def test_action_item_extraction():
    sample_agent_response = """
Here are the steps to prepare for your dentist appointment:

1. Locate your dental insurance card in your wallet.
2. Put the card by the front door with your keys.
3. Leave your house by 2:30 PM to arrive at 2:45 PM.

Let me know if you need any other reminders!
"""
    items = lyzr_service._extract_action_items(sample_agent_response)
    assert len(items) == 3
    assert "Locate your dental insurance card" in items[0]
    assert "Leave your house" in items[2]


def test_accessible_prompt_grounding():
    question = "Where did I put my prescription glasses?"
    retrieved = [
        {
            "title": "Evening routine",
            "timestamp": "2026-10-11T21:00:00Z",
            "text": "I set my prescription glasses on the nightstand next to my water bottle.",
            "action_items": [],
        }
    ]
    prompt = lyzr_service._build_accessible_prompt(question, retrieved)
    assert "Evening routine" in prompt
    assert "nightstand" in prompt
    assert "Answer ONLY based on the facts present" in prompt
    assert "Where did I put my prescription glasses?" in prompt


@patch("backend.config.Settings.is_lyzr_configured", return_value=True)
@patch("backend.lyzr_agent.requests.post")
def test_lyzr_ask_success(mock_post, mock_config):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "response": "You left your prescription glasses on the bedside nightstand. \n1. Check beside your water bottle.\n2. Put them in their case.",
    }
    mock_post.return_value = mock_response

    result = lyzr_service.ask(
        question="Where are my glasses?",
        retrieved_memories=[{"title": "Note", "text": "On the nightstand"}],
    )
    assert "bedside nightstand" in result["answer"]
    assert len(result["action_steps"]) == 2
