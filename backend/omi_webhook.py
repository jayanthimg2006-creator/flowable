"""
FlowAble Omi Voice Webhook Service
Processes incoming webhook requests from the Omi wearable/mobile app:
  - POST /omi/conversation (memory created, structured transcripts)
  - POST /omi/realtime (real-time stream transcripts)
Extracts conversation content, metadata, timestamps, and persists vectors to Qdrant.
Includes idempotency protection, fast responses, and privacy-preserving logs.
"""

import time
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

from backend.memory import memory_service
from backend.activity_logger import activity_logger

logger = logging.getLogger("flowable.omi")

# Cache of recently processed memory IDs to prevent duplicate webhook processing
_processed_memory_ids = {}
_MAX_PROCESSED_CACHE = 500


def is_already_processed(memory_id: str) -> bool:
    """Checks if a webhook memory ID has already been indexed recently."""
    now = time.time()
    # Prune older than 24 hours
    if len(_processed_memory_ids) > _MAX_PROCESSED_CACHE:
        for mid, ts in list(_processed_memory_ids.items()):
            if now - ts > 86400:
                _processed_memory_ids.pop(mid, None)
    return memory_id in _processed_memory_ids


def mark_as_processed(memory_id: str):
    _processed_memory_ids[memory_id] = time.time()


def parse_omi_conversation_payload(payload: Dict[str, Any], uid: Optional[str] = None) -> Dict[str, Any]:
    """
    Safely inspects and extracts data from any valid Omi memory / conversation payload.
    Supports official Omi Memory schema as well as legacy or simplified variants.
    """
    if not isinstance(payload, dict):
        raise ValueError("Invalid payload: expected JSON object")

    memory_id = (
        payload.get("id")
        or payload.get("memory_id")
        or payload.get("conversation_id")
        or f"omi_mem_{int(time.time())}"
    )

    created_at = (
        payload.get("created_at")
        or payload.get("timestamp")
        or datetime.now(timezone.utc).isoformat()
    )

    structured = payload.get("structured", {})
    if not isinstance(structured, dict):
        structured = {}

    title = structured.get("title") or payload.get("title") or "Voice Conversation"
    overview = structured.get("overview") or payload.get("overview") or ""
    action_items = structured.get("action_items") or payload.get("action_items") or []
    category = structured.get("category") or payload.get("category") or "general"

    # Extract conversation transcript from transcript_segments or text
    transcript_segments = payload.get("transcript_segments") or payload.get("segments") or []
    formatted_transcript = ""

    if isinstance(transcript_segments, list) and len(transcript_segments) > 0:
        segment_lines = []
        for seg in transcript_segments:
            if isinstance(seg, dict):
                speaker = seg.get("speaker") or f"Speaker {seg.get('speaker_id', '0')}"
                text = seg.get("text", "").strip()
                if text:
                    segment_lines.append(f"{speaker}: {text}")
            elif isinstance(seg, str) and seg.strip():
                segment_lines.append(seg.strip())
        formatted_transcript = "\n".join(segment_lines)

    if not formatted_transcript:
        # Fallback to top-level text or transcript fields
        formatted_transcript = (
            payload.get("transcript")
            or payload.get("text")
            or overview
            or ""
        ).strip()

    if not formatted_transcript:
        raise ValueError("Payload contains no extractable transcript or text content")

    # If an overview exists, prepend it as high-level context
    full_text_to_embed = formatted_transcript
    if overview and overview not in formatted_transcript:
        full_text_to_embed = f"Summary: {overview}\n\nTranscript:\n{formatted_transcript}"

    return {
        "memory_id": str(memory_id),
        "user_id": uid or payload.get("uid") or "default_user",
        "title": title,
        "overview": overview,
        "text": full_text_to_embed,
        "action_items": action_items if isinstance(action_items, list) else [],
        "category": category,
        "timestamp": created_at,
        "speaker_segments": transcript_segments if isinstance(transcript_segments, list) else [],
    }


def process_omi_conversation(payload: Dict[str, Any], uid: Optional[str] = None) -> Dict[str, Any]:
    """
    Validates, extracts, and stores an Omi conversation transcript into Qdrant.
    """
    parsed = parse_omi_conversation_payload(payload, uid=uid)
    memory_id = parsed["memory_id"]

    # Idempotency check
    if is_already_processed(memory_id):
        logger.info("Duplicate Omi webhook received for memory %s; acknowledging without re-indexing", memory_id)
        return {
            "status": "already_processed",
            "memory_id": memory_id,
            "message": "Memory already stored previously",
        }

    # Store memory vector into Qdrant
    storage_res = memory_service.store_memory(
        conversation_id=memory_id,
        text=parsed["text"],
        metadata={
            "title": parsed["title"],
            "action_items": parsed["action_items"],
            "category": parsed["category"],
            "timestamp": parsed["timestamp"],
            "source": "omi_conversation_webhook",
            "user_id": parsed["user_id"],
            "speaker_segments": parsed["speaker_segments"],
        },
    )

    mark_as_processed(memory_id)
    activity_logger.record_omi_webhook(is_conversation=True, memory_id=memory_id)

    activity_logger.log(
        event_type="omi_webhook",
        message=f"Received Omi conversation '{parsed['title']}' and stored in memory",
        status="success",
        metadata={
            "memory_id": memory_id,
            "segments_count": len(parsed["speaker_segments"]),
            "action_items_count": len(parsed["action_items"]),
        },
    )

    return {
        "status": "success",
        "memory_id": memory_id,
        "point_id": storage_res.get("point_id"),
        "stored": True,
        "title": parsed["title"],
    }


def process_omi_realtime(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Processes streaming / realtime transcript segments from Omi.
    """
    if not isinstance(payload, dict):
        raise ValueError("Invalid payload: expected JSON object")

    text = payload.get("text", "").strip()
    is_final = bool(payload.get("is_final", False))
    speaker = payload.get("speaker", "Speaker")
    uid = payload.get("uid", "user")

    activity_logger.record_omi_webhook(is_conversation=False)

    if text:
        activity_logger.log(
            event_type="omi_realtime",
            message=f"Live speech segment ({speaker}): '{text[:30]}...'",
            status="info",
            metadata={"is_final": is_final, "uid": uid},
        )

    return {
        "status": "received",
        "is_final": is_final,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
