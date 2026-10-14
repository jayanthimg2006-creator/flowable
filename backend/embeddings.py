"""
FlowAble Embedding Service
Generates 384-dimensional dense vectors using FastEmbed (BAAI/bge-small-en-v1.5).
Consistent embedding generation for both indexing in Qdrant and retrieval.
"""

from typing import List
import logging
import threading

logger = logging.getLogger("flowable.embeddings")

_model_instance = None
_model_lock = threading.Lock()


def get_embedding_model():
    """
    Lazy initialization of FastEmbed TextEmbedding model.
    Ensures thread-safe singleton instantiation.
    """
    global _model_instance
    if _model_instance is None:
        with _model_lock:
            if _model_instance is None:
                try:
                    from fastembed import TextEmbedding
                    from backend.config import settings
                    logger.info(f"Loading FastEmbed model: {settings.fastembed_model}")
                    _model_instance = TextEmbedding(model_name=settings.fastembed_model)
                    logger.info("FastEmbed model loaded successfully (384 dimensions).")
                except Exception as e:
                    logger.error(f"Failed to initialize FastEmbed: {e}")
                    raise RuntimeError(f"Embedding initialization failed: {e}")
    return _model_instance


def embed_text(text: str) -> List[float]:
    """
    Generates a 384-dimensional vector embedding for a single string.
    """
    if not text or not text.strip():
        # Fallback 384-dim zero vector for empty text
        return [0.0] * 384
    
    model = get_embedding_model()
    # FastEmbed returns a generator of numpy arrays
    embeddings = list(model.embed([text]))
    return embeddings[0].tolist()


def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Batch embedding generation.
    """
    if not texts:
        return []
    cleaned_texts = [t if t and t.strip() else " " for t in texts]
    model = get_embedding_model()
    embeddings = list(model.embed(cleaned_texts))
    return [emb.tolist() for emb in embeddings]
