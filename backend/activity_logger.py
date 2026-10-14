"""
FlowAble Activity Logger
Tracks live execution events across Omi, Qdrant, and Lyzr for frontend observability.
Maintains privacy by not recording secrets or full confidential transcripts.
"""

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import threading
import uuid


class ActivityLogger:
    def __init__(self, max_events: int = 100):
        self._max_events = max_events
        self._events: List[Dict[str, Any]] = []
        self._lock = threading.Lock()
        
        # Omi integration metrics
        self._omi_stats = {
            "total_webhooks": 0,
            "last_webhook_at": None,
            "total_transcripts_stored": 0,
            "last_error": None
        }

    def log(
        self,
        event_type: str,
        message: str,
        status: str = "success",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Records an execution event.
        status: 'success', 'pending', 'failed', 'info'
        """
        event = {
            "id": f"evt_{uuid.uuid4().hex[:8]}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,
            "status": status,
            "message": message,
            "metadata": metadata or {},
        }
        with self._lock:
            self._events.insert(0, event)
            if len(self._events) > self._max_events:
                self._events.pop()
        return event

    def record_omi_webhook(self, is_conversation: bool, memory_id: Optional[str] = None):
        """Updates internal Omi metrics and timestamp."""
        with self._lock:
            self._omi_stats["total_webhooks"] += 1
            self._omi_stats["last_webhook_at"] = datetime.now(timezone.utc).isoformat()
            if is_conversation:
                self._omi_stats["total_transcripts_stored"] += 1

    def record_omi_error(self, error_msg: str):
        with self._lock:
            self._omi_stats["last_error"] = error_msg

    def get_omi_stats(self) -> Dict[str, Any]:
        with self._lock:
            return dict(self._omi_stats)

    def get_recent_events(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self._lock:
            return list(self._events[:limit])

    def clear(self):
        with self._lock:
            self._events.clear()


# Global singleton instance
activity_logger = ActivityLogger()
