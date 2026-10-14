"""
FlowAble Qdrant Memory Service
Integrates with Qdrant Cloud cluster (flowable-memory).
Handles collection initialization, deterministic UUID point storage (idempotency),
semantic vector search, memory retrieval, and deletion.
"""

import uuid
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.exceptions import UnexpectedResponse

from backend.config import settings
from backend.embeddings import embed_text
from backend.activity_logger import activity_logger

logger = logging.getLogger("flowable.memory")

# Deterministic namespace for idempotency (UUIDv5)
FLOWABLE_NAMESPACE = uuid.UUID("3d8c5208-7a54-4f40-8bbf-85662f3a67d1")


class MemoryService:
    def __init__(self):
        self._client: Optional[QdrantClient] = None
        self._collection_initialized = False

    def get_client(self) -> Optional[QdrantClient]:
        """Returns initialized Qdrant client or None if unconfigured."""
        if not settings.is_qdrant_configured():
            return None
        
        if self._client is None:
            try:
                self._client = QdrantClient(
                    url=settings.qdrant_url,
                    api_key=settings.qdrant_api_key,
                    timeout=15.0
                )
                logger.info("Initialized Qdrant client connected to %s", settings.qdrant_url)
            except Exception as e:
                logger.error("Failed to connect to Qdrant Cloud: %s", e)
                return None
        return self._client

    def ensure_collection(self) -> bool:
        """
        Validates or creates the collection 'flowable_memory' with 384-dim COSINE vectors.
        """
        client = self.get_client()
        if not client:
            return False

        try:
            collections_response = client.get_collections()
            collection_names = [col.name for col in collections_response.collections]
            
            if settings.qdrant_collection_name not in collection_names:
                logger.info(
                    "Collection '%s' does not exist. Creating with 384-dim COSINE vectors...",
                    settings.qdrant_collection_name,
                )
                client.create_collection(
                    collection_name=settings.qdrant_collection_name,
                    vectors_config=models.VectorParams(
                        size=384,
                        distance=models.Distance.COSINE
                    ),
                )
                logger.info("Collection '%s' created successfully.", settings.qdrant_collection_name)
            
            self._collection_initialized = True
            return True
        except Exception as e:
            logger.error("Error ensuring Qdrant collection: %s", e)
            return False

    def check_connectivity(self) -> Dict[str, Any]:
        """
        Actively checks connection to Qdrant Cloud and collection health.
        Never returns secrets.
        """
        if not settings.is_qdrant_configured():
            return {
                "configured": False,
                "connected": False,
                "message": "Qdrant credentials missing or incomplete in .env",
                "collection_ready": False,
                "points_count": 0,
            }

        client = self.get_client()
        if not client:
            return {
                "configured": True,
                "connected": False,
                "message": "Failed to create Qdrant client",
                "collection_ready": False,
                "points_count": 0,
            }

        try:
            ready = self.ensure_collection()
            if not ready:
                return {
                    "configured": True,
                    "connected": False,
                    "message": "Could not access or create collection 'flowable_memory'",
                    "collection_ready": False,
                    "points_count": 0,
                }

            col_info = client.get_collection(collection_name=settings.qdrant_collection_name)
            points_count = col_info.points_count if hasattr(col_info, "points_count") else 0
            
            return {
                "configured": True,
                "connected": True,
                "message": "Connected to Qdrant Cloud cluster",
                "collection_ready": True,
                "collection_name": settings.qdrant_collection_name,
                "points_count": points_count,
            }
        except Exception as e:
            logger.error("Qdrant connectivity check failed: %s", e)
            return {
                "configured": True,
                "connected": False,
                "message": f"Connection error: {str(e)}",
                "collection_ready": False,
                "points_count": 0,
            }

    def generate_point_id(self, conversation_id: str, text: str, index: int = 0) -> str:
        """
        Generates a deterministic UUIDv5 point ID to guarantee idempotency
        and avoid duplicate memories on webhook retries.
        """
        seed = f"{conversation_id}::chunk_{index}::{text.strip()}"
        return str(uuid.uuid5(FLOWABLE_NAMESPACE, seed))

    def store_memory(
        self,
        conversation_id: str,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
        chunk_index: int = 0,
    ) -> Dict[str, Any]:
        """
        Embeds transcript text and stores the vector in Qdrant with metadata.
        """
        client = self.get_client()
        if not client:
            raise RuntimeError("Qdrant is not configured. Provide QDRANT_URL and QDRANT_API_KEY in .env")

        self.ensure_collection()
        
        point_id = self.generate_point_id(conversation_id, text, chunk_index)
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # 384-dimensional embedding
        vector = embed_text(text)
        
        payload = {
            "conversation_id": conversation_id,
            "text": text,
            "timestamp": (metadata or {}).get("timestamp", now_iso),
            "stored_at": now_iso,
            "title": (metadata or {}).get("title", "Voice Note"),
            "action_items": (metadata or {}).get("action_items", []),
            "category": (metadata or {}).get("category", "general"),
            "source": (metadata or {}).get("source", "omi_voice"),
            "speaker_segments": (metadata or {}).get("speaker_segments", []),
        }

        point = models.PointStruct(
            id=point_id,
            vector=vector,
            payload=payload,
        )

        client.upsert(
            collection_name=settings.qdrant_collection_name,
            points=[point],
            wait=True,
        )

        activity_logger.log(
            event_type="memory_stored",
            message=f"Persisted voice memory '{payload['title']}' to Qdrant (ID: {point_id[:8]}...)",
            status="success",
            metadata={"point_id": point_id, "conversation_id": conversation_id},
        )

        return {"point_id": point_id, "conversation_id": conversation_id, "stored": True}

    def search_memories(
        self,
        query: str,
        limit: int = 5,
        score_threshold: float = 0.35,
    ) -> List[Dict[str, Any]]:
        """
        Performs semantic vector search across stored memories.
        Returns matching memories ranked by cosine similarity.
        """
        client = self.get_client()
        if not client or not self.ensure_collection():
            return []

        query_vector = embed_text(query)

        try:
            if hasattr(client, "query_points"):
                res = client.query_points(
                    collection_name=settings.qdrant_collection_name,
                    query=query_vector,
                    limit=limit,
                    score_threshold=score_threshold,
                    with_payload=True,
                )
                search_results = res.points
            elif hasattr(client, "search"):
                search_results = client.search(
                    collection_name=settings.qdrant_collection_name,
                    query_vector=query_vector,
                    limit=limit,
                    score_threshold=score_threshold,
                    with_payload=True,
                )
            else:
                logger.error("No compatible search method found on Qdrant client")
                return []
        except Exception as e:
            logger.error("Qdrant search error: %s", e)
            return []

        results = []
        for hit in search_results:
            payload = hit.payload or {}
            results.append({
                "id": str(hit.id),
                "score": round(float(hit.score), 4),
                "text": payload.get("text", ""),
                "title": payload.get("title", "Voice Memory"),
                "timestamp": payload.get("timestamp", ""),
                "action_items": payload.get("action_items", []),
                "category": payload.get("category", "general"),
                "source": payload.get("source", "omi_voice"),
                "conversation_id": payload.get("conversation_id", ""),
            })

        activity_logger.log(
            event_type="semantic_search",
            message=f"Retrieved {len(results)} relevant memory snippets for query",
            status="success",
            metadata={"query_preview": query[:40], "matches": len(results)},
        )

        return results

    def get_recent_memories(self, limit: int = 25) -> List[Dict[str, Any]]:
        """
        Retrieves recent memory points for the UI Memory page.
        """
        client = self.get_client()
        if not client or not self.ensure_collection():
            return []

        try:
            scroll_result, _ = client.scroll(
                collection_name=settings.qdrant_collection_name,
                limit=limit,
                with_payload=True,
                with_vectors=False,
            )
        except Exception as e:
            logger.error("Qdrant scroll error: %s", e)
            return []

        memories = []
        for point in scroll_result:
            payload = point.payload or {}
            memories.append({
                "id": str(point.id),
                "text": payload.get("text", ""),
                "title": payload.get("title", "Voice Memory"),
                "timestamp": payload.get("timestamp", ""),
                "stored_at": payload.get("stored_at", ""),
                "action_items": payload.get("action_items", []),
                "category": payload.get("category", "general"),
                "source": payload.get("source", "omi_voice"),
                "conversation_id": payload.get("conversation_id", ""),
            })

        # Sort descending by timestamp / stored_at
        memories.sort(key=lambda m: m.get("timestamp") or m.get("stored_at") or "", reverse=True)
        return memories

    def delete_memory(self, point_id: str) -> bool:
        """
        Safely deletes a memory point from Qdrant by ID.
        """
        client = self.get_client()
        if not client:
            return False

        try:
            client.delete(
                collection_name=settings.qdrant_collection_name,
                points_selector=models.PointIdsList(points=[point_id]),
                wait=True,
            )
            activity_logger.log(
                event_type="memory_deleted",
                message=f"Removed memory record {point_id[:8]}... from Qdrant",
                status="success",
                metadata={"point_id": point_id},
            )
            return True
        except Exception as e:
            logger.error("Failed to delete memory %s: %s", point_id, e)
            return False


memory_service = MemoryService()
