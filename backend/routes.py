"""
FlowAble API Routes
Defines all FastAPI HTTP endpoints:
  - GET /health
  - GET /status
  - POST /ask
  - POST /omi/conversation
  - POST /omi/realtime
  - Memory CRUD & Search
  - Activity & Stats
"""

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field

from backend.config import settings
from backend.memory import memory_service
from backend.lyzr_agent import lyzr_service
from backend.omi_webhook import (
    process_omi_conversation,
    process_omi_realtime,
)
from backend.activity_logger import activity_logger

logger = logging.getLogger("flowable.routes")
router = APIRouter()


# --- Request & Response Models ---

class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Question submitted by user")
    session_id: Optional[str] = Field(None, description="Optional conversation session ID")
    limit: Optional[int] = Field(5, ge=1, le=20, description="Max memory snippets to retrieve")


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Search text")
    limit: Optional[int] = Field(5, ge=1, le=30)


class ManualMemoryRequest(BaseModel):
    title: str = Field("Voice Note", description="Title or summary label")
    text: str = Field(..., min_length=3, description="Transcript text")
    category: Optional[str] = "general"
    action_items: Optional[List[str]] = []


# --- Core System Endpoints ---

@router.get("/health", summary="Basic health check")
def get_health():
    """Returns simple 200 OK for process liveness checks."""
    return {"status": "ok", "app": "FlowAble", "version": "1.0.0"}


@router.get("/status", summary="Deep integration connectivity check")
def get_status():
    """
    Checks configuration and verifies live reachability of:
    - Omi webhook listener metrics
    - Qdrant Cloud cluster (flowable-memory)
    - Lyzr Agent Studio inference API
    """
    qdrant_status = memory_service.check_connectivity()
    lyzr_status = lyzr_service.check_connectivity()
    omi_stats = activity_logger.get_omi_stats()

    all_connected = qdrant_status.get("connected", False) and lyzr_status.get("connected", False)

    return {
        "status": "ready" if all_connected else "degraded",
        "integrations": {
            "omi": {
                "name": "Omi Voice Capture",
                "configured": True,  # endpoints are always listening
                "connected": omi_stats.get("total_webhooks", 0) > 0,
                "endpoints": ["/omi/conversation", "/omi/realtime"],
                "total_webhooks": omi_stats.get("total_webhooks", 0),
                "last_webhook_at": omi_stats.get("last_webhook_at"),
                "total_transcripts_stored": omi_stats.get("total_transcripts_stored", 0),
            },
            "qdrant": {
                "name": "Qdrant Cloud (flowable-memory)",
                **qdrant_status,
            },
            "lyzr": {
                "name": "Lyzr Agent Studio",
                **lyzr_status,
            },
        },
        "public_config": settings.get_public_status(),
    }


# --- Omi Voice Webhook Endpoints ---

@router.post("/omi/conversation", summary="Omi Conversation / Memory Webhook")
def handle_omi_conversation(
    payload: Dict[str, Any],
    uid: Optional[str] = Query(None, description="User ID query parameter sent by Omi"),
):
    """
    Webhook target for Omi memory creation.
    Extracts transcript segments, embeds with FastEmbed, and saves into Qdrant.
    """
    try:
        result = process_omi_conversation(payload, uid=uid)
        return result
    except ValueError as ve:
        activity_logger.record_omi_error(str(ve))
        logger.warning("Omi malformed payload: %s", ve)
        raise HTTPException(status_code=400, detail=f"Malformed Omi payload: {str(ve)}")
    except Exception as e:
        activity_logger.record_omi_error(str(e))
        logger.error("Error processing Omi webhook: %s", e)
        raise HTTPException(status_code=500, detail="Internal error processing voice transcript")


@router.post("/omi/realtime", summary="Omi Real-Time Transcript Stream")
def handle_omi_realtime(payload: Dict[str, Any]):
    """
    Webhook target for Omi real-time streaming segments.
    """
    try:
        return process_omi_realtime(payload)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error("Error handling Omi realtime packet: %s", e)
        raise HTTPException(status_code=500, detail="Error handling realtime stream")


# --- The Core Hackathon Loop: Ask FlowAble ---

@router.post("/ask", summary="End-to-End Grounded Memory Q&A Pipeline")
def ask_flowable(request: AskRequest):
    """
    End-to-end execution loop:
    1. Embed user's question using FastEmbed.
    2. Search Qdrant vector memory collection 'flowable_memory'.
    3. Feed retrieved conversation context and question into Lyzr Agent Studio.
    4. Return grounded answer, memory sources, and accessible actionable checklist.
    """
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # Step 1 & 2: Semantic retrieval from Qdrant
    retrieved_memories = []
    if settings.is_qdrant_configured():
        try:
            retrieved_memories = memory_service.search_memories(
                query=question,
                limit=request.limit or 5,
                score_threshold=0.30,
            )
        except Exception as e:
            logger.error("Error retrieving memories from Qdrant: %s", e)
            activity_logger.log(
                event_type="semantic_search",
                message=f"Memory search error: {str(e)}",
                status="failed",
            )
    else:
        logger.warning("Qdrant not configured; answering without memory context.")

    # Step 3 & 4: Lyzr Agent Reasoning
    if not settings.is_lyzr_configured():
        # Provide helpful unconfigured guidance instead of opaque failure
        return {
            "answer": (
                "FlowAble is ready, but Lyzr Agent Studio credentials (`LYZR_API_KEY` and `LYZR_AGENT_ID`) "
                "are not yet configured in `.env`. Once provided, Lyzr will synthesize grounded answers."
            ),
            "session_id": "unconfigured",
            "action_steps": [
                "Open your .env file",
                "Add your LYZR_API_KEY and LYZR_AGENT_ID",
                "Restart FlowAble backend"
            ],
            "retrieved_memories": retrieved_memories,
            "warning": "Lyzr agent credentials missing",
        }

    try:
        lyzr_result = lyzr_service.ask(
            question=question,
            retrieved_memories=retrieved_memories,
            session_id=request.session_id,
        )
        return lyzr_result
    except Exception as e:
        logger.error("Lyzr inference failed: %s", e)
        raise HTTPException(
            status_code=502,
            detail=f"Lyzr Agent reasoning failed: {str(e)}",
        )


# --- Memory Exploration & Management Endpoints ---

@router.get("/api/memories", summary="List stored memories")
def list_memories(limit: int = Query(25, ge=1, le=100)):
    """Returns recent stored voice transcripts and metadata."""
    return {"memories": memory_service.get_recent_memories(limit=limit)}


@router.post("/api/memories/search", summary="Search memories semantically")
def search_memories(request: SearchRequest):
    """Semantic vector search across stored voice memories."""
    results = memory_service.search_memories(query=request.query, limit=request.limit or 5)
    return {"results": results, "query": request.query}


@router.post("/api/memories/manual", summary="Simulate / insert a memory directly")
def create_manual_memory(request: ManualMemoryRequest):
    """
    Allows inserting a voice transcript memory directly.
    Ideal for hackathon demonstrations, offline testing, or user-simulated voice notes.
    """
    conv_id = f"manual_{int(logging.time.time())}"
    res = memory_service.store_memory(
        conversation_id=conv_id,
        text=request.text,
        metadata={
            "title": request.title,
            "category": request.category,
            "action_items": request.action_items,
            "source": "manual_voice_input",
        },
    )
    return {"status": "success", **res}


@router.delete("/api/memories/{point_id}", summary="Delete a memory record")
def delete_memory(point_id: str):
    """Deletes a memory point from Qdrant by ID with confirmation."""
    success = memory_service.delete_memory(point_id)
    if not success:
        raise HTTPException(status_code=404, detail="Memory not found or deletion failed")
    return {"status": "success", "point_id": point_id, "deleted": True}


# --- Activity & Observability Endpoints ---

@router.get("/api/activity", summary="Recent pipeline activity log")
def get_activity_log(limit: int = Query(50, ge=1, le=100)):
    """Returns real-time execution events for the UI Activity tab."""
    return {"events": activity_logger.get_recent_events(limit=limit)}


@router.get("/api/stats", summary="System stats and memory counts")
def get_system_stats():
    """Aggregates memory and webhook statistics."""
    connectivity = memory_service.check_connectivity()
    omi_stats = activity_logger.get_omi_stats()
    return {
        "points_count": connectivity.get("points_count", 0),
        "total_webhooks": omi_stats.get("total_webhooks", 0),
        "total_transcripts_stored": omi_stats.get("total_transcripts_stored", 0),
        "last_webhook_at": omi_stats.get("last_webhook_at"),
        "qdrant_connected": connectivity.get("connected", False),
        "lyzr_connected": lyzr_service.is_configured(),
    }
