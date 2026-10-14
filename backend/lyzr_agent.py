"""
FlowAble Lyzr Agent Reasoning Service
Integrates with Lyzr Agent Studio v3 Inference API (https://agent-prod.studio.lyzr.ai/v3/inference/chat/)
Provides grounded answers using retrieved Qdrant memories, adaptive assistance,
and structured accessible step checklists.
"""

import re
import uuid
import logging
from typing import List, Dict, Any, Optional
import requests

from backend.config import settings
from backend.activity_logger import activity_logger

logger = logging.getLogger("flowable.lyzr")


class LyzrService:
    def __init__(self):
        self._session_cache: Dict[str, str] = {}

    def is_configured(self) -> bool:
        return settings.is_lyzr_configured()

    def check_connectivity(self) -> Dict[str, Any]:
        """
        Validates Lyzr configuration and test connection.
        Never returns private keys.
        """
        if not self.is_configured():
            return {
                "configured": False,
                "connected": False,
                "message": "Lyzr credentials missing or incomplete in .env",
            }

        # We can verify the endpoint is reachable with an auth test or lightweight message
        headers = {
            "x-api-key": settings.lyzr_api_key,
            "Content-Type": "application/json",
        }
        test_payload = {
            "user_id": "healthcheck@flowable.ai",
            "agent_id": settings.lyzr_agent_id,
            "session_id": f"health_{uuid.uuid4().hex[:8]}",
            "message": "System status ping. Reply with 'READY'.",
            "system_prompt_variables": {},
            "filter_variables": {},
            "features": [],
        }

        try:
            resp = requests.post(
                settings.lyzr_chat_url,
                json=test_payload,
                headers=headers,
                timeout=15.0,
            )
            if resp.status_code == 200:
                return {
                    "configured": True,
                    "connected": True,
                    "message": "Lyzr Agent Studio is reachable and responding",
                    "agent_id": settings.lyzr_agent_id,
                }
            elif resp.status_code == 401 or resp.status_code == 403:
                return {
                    "configured": True,
                    "connected": False,
                    "message": f"Authentication failed with Lyzr (HTTP {resp.status_code}). Check LYZR_API_KEY.",
                }
            elif resp.status_code == 404:
                return {
                    "configured": True,
                    "connected": False,
                    "message": f"Agent ID not found in Lyzr Studio (HTTP 404). Check LYZR_AGENT_ID.",
                }
            else:
                return {
                    "configured": True,
                    "connected": False,
                    "message": f"Lyzr returned HTTP {resp.status_code}: {resp.text[:100]}",
                }
        except requests.exceptions.RequestException as e:
            logger.warning("Lyzr connectivity test failed: %s", e)
            return {
                "configured": True,
                "connected": False,
                "message": f"Failed to reach Lyzr Studio: {str(e)}",
            }

    def _build_accessible_prompt(
        self,
        question: str,
        retrieved_memories: List[Dict[str, Any]],
    ) -> str:
        """
        Builds the prompt embedding retrieved memories and instructing the agent
        to provide simple, supportive, grounded, accessible answers.
        """
        if retrieved_memories:
            memories_context_blocks = []
            for i, mem in enumerate(retrieved_memories, 1):
                timestamp = mem.get("timestamp", "Unknown time")
                title = mem.get("title", f"Memory #{i}")
                text = mem.get("text", "").strip()
                action_items = mem.get("action_items", [])
                
                block = f"[Memory {i} | {title} | {timestamp}]\n{text}"
                if action_items:
                    block += f"\nRecorded Action Items: {', '.join(action_items)}"
                memories_context_blocks.append(block)

            context_str = "\n\n".join(memories_context_blocks)
        else:
            context_str = "NO RELEVANT PAST CONVERSATIONS FOUND IN MEMORY."

        prompt = f"""You are FlowAble, an empathetic, supportive, voice-first accessibility and adaptive memory assistant.
Your user relies on you to remember spoken instructions, recall details from past conversations, and break complex tasks down into simple, accessible steps.

---
REPRESENTED RETRIEVED MEMORIES (GROUND TRUTH):
{context_str}
---

USER'S QUESTION:
{question}

GUIDELINES FOR YOUR ANSWER:
1. Grounding: Answer ONLY based on the facts present in the retrieved memories above. Do not invent conversations, people, appointments, or actions.
2. Missing Information: If the context does not contain the answer, say clearly and kindly: "I don't have a record of that in your saved conversations."
3. Accessibility: Use plain, supportive, easy-to-understand language. Keep paragraphs short (1-3 sentences).
4. Adaptive Action Steps: If the conversation mentions tasks, reminders, or instructions, clearly list them as numbered steps (e.g., "1. First step", "2. Second step") and provide an action checklist so the user can easily follow along without feeling overwhelmed.
"""
        return prompt

    def _extract_action_items(self, text: str) -> List[str]:
        """
        Extracts numbered steps or checklist items from text for interactive UI checkboxes.
        """
        items = []
        # Match lines like "1. Step", "2. Step", "- [ ] Task", "* Task"
        for line in text.split("\n"):
            line = line.strip()
            # Match 1. or 1)
            numbered_match = re.match(r"^\d+[\.\)]\s*(.+)$", line)
            if numbered_match:
                item_text = numbered_match.group(1).strip()
                # Clean markdown bolding
                item_text = re.sub(r"^\*\*(.+?)\*\*\:?\s*", r"\1: ", item_text)
                if len(item_text) > 3:
                    items.append(item_text)
            elif line.startswith("- [ ]") or line.startswith("- [x]"):
                items.append(line[5:].strip())
        return items

    def ask(
        self,
        question: str,
        retrieved_memories: List[Dict[str, Any]],
        session_id: Optional[str] = None,
        user_id: str = "user@flowable.ai",
    ) -> Dict[str, Any]:
        """
        Sends the user question and retrieved memory context to Lyzr Agent Studio.
        """
        if not self.is_configured():
            raise RuntimeError(
                "Lyzr Agent Studio is not configured. Set LYZR_API_KEY and LYZR_AGENT_ID in .env."
            )

        active_session = session_id or f"flowable_{uuid.uuid4().hex[:12]}"
        prompt = self._build_accessible_prompt(question, retrieved_memories)

        headers = {
            "x-api-key": settings.lyzr_api_key,
            "Content-Type": "application/json",
        }

        payload = {
            "user_id": user_id,
            "agent_id": settings.lyzr_agent_id,
            "session_id": active_session,
            "message": prompt,
            "system_prompt_variables": {},
            "filter_variables": {},
            "features": [],
        }

        activity_logger.log(
            event_type="lyzr_reasoning",
            message=f"Sending question with {len(retrieved_memories)} memory contexts to Lyzr Agent Studio",
            status="pending",
            metadata={"session_id": active_session, "matches": len(retrieved_memories)},
        )

        try:
            response = requests.post(
                settings.lyzr_chat_url,
                json=payload,
                headers=headers,
                timeout=45.0,
            )
            response.raise_str = None
            if response.status_code != 200:
                logger.error(f"Lyzr returned status {response.status_code}: {response.text}")
                error_msg = f"Lyzr inference error (HTTP {response.status_code}): {response.text[:200]}"
                activity_logger.log(
                    event_type="lyzr_reasoning",
                    message=error_msg,
                    status="failed",
                    metadata={"status_code": response.status_code},
                )
                raise RuntimeError(error_msg)

            data = response.json()
            
            # Extract response text flexibly across potential schema variations
            answer_text = ""
            if isinstance(data, dict):
                answer_text = (
                    data.get("response")
                    or data.get("message")
                    or data.get("content")
                    or data.get("text")
                    or ""
                )
            elif isinstance(data, str):
                answer_text = data

            if not answer_text and isinstance(data, dict):
                # Fallback to stringifying if nested
                answer_text = str(data)

            # Extract any numbered checklist steps for accessibility UI
            action_checklist = self._extract_action_items(answer_text)

            activity_logger.log(
                event_type="lyzr_reasoning",
                message="Successfully received grounded response from Lyzr Agent",
                status="success",
                metadata={
                    "session_id": active_session,
                    "action_items_count": len(action_checklist),
                },
            )

            return {
                "answer": answer_text,
                "session_id": active_session,
                "action_steps": action_checklist,
                "retrieved_memories": retrieved_memories,
            }

        except requests.exceptions.Timeout:
            err = "Lyzr Agent request timed out after 45 seconds."
            activity_logger.log(
                event_type="lyzr_reasoning", message=err, status="failed"
            )
            raise RuntimeError(err)
        except requests.exceptions.RequestException as e:
            err = f"Failed to communicate with Lyzr Studio API: {str(e)}"
            activity_logger.log(
                event_type="lyzr_reasoning", message=err, status="failed"
            )
            raise RuntimeError(err)


lyzr_service = LyzrService()
