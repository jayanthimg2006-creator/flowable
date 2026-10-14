"""
FlowAble Configuration Module
Safely loads and validates environment variables.
"""

import os
from typing import Optional, Dict, Any
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Explicitly load .env file from root project directory
ENV_FILE_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_FILE_PATH, override=True)


class Settings(BaseSettings):
    model_config = {
        "env_file": str(ENV_FILE_PATH),
        "extra": "ignore",
    }

    # Qdrant Memory Configuration
    qdrant_url: Optional[str] = os.getenv("QDRANT_URL")
    qdrant_api_key: Optional[str] = os.getenv("QDRANT_API_KEY")
    qdrant_collection_name: str = os.getenv("QDRANT_COLLECTION_NAME", "flowable_memory")

    # Lyzr Agent Studio Configuration
    lyzr_api_key: Optional[str] = os.getenv("LYZR_API_KEY")
    lyzr_agent_id: Optional[str] = os.getenv("LYZR_AGENT_ID")
    lyzr_chat_url: str = os.getenv(
        "LYZR_CHAT_URL", "https://agent-prod.studio.lyzr.ai/v3/inference/chat/"
    )

    # Server Configuration
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    environment: str = os.getenv("ENVIRONMENT", "development")

    # Embedding Configuration (FastEmbed default: 384 dimensions)
    fastembed_model: str = os.getenv(
        "FASTEMBED_MODEL", "BAAI/bge-small-en-v1.5"
    )

    def is_qdrant_configured(self) -> bool:
        """Returns True if Qdrant URL and API key are provided and not dummy placeholders."""
        return bool(
            self.qdrant_url
            and self.qdrant_url.strip()
            and not self.qdrant_url.startswith("your_")
            and not "your-cluster-id" in self.qdrant_url
            and self.qdrant_api_key
            and self.qdrant_api_key.strip()
            and not self.qdrant_api_key.startswith("your_")
        )

    def is_lyzr_configured(self) -> bool:
        """Returns True if Lyzr API key and Agent ID are provided and not dummy placeholders."""
        return bool(
            self.lyzr_api_key
            and self.lyzr_api_key.strip()
            and not self.lyzr_api_key.startswith("your_")
            and self.lyzr_agent_id
            and self.lyzr_agent_id.strip()
            and not self.lyzr_agent_id.startswith("your_")
        )

    def get_public_status(self) -> Dict[str, Any]:
        """
        Returns safe configuration status for the UI.
        Never returns secrets or private tokens.
        """
        return {
            "qdrant": {
                "configured": self.is_qdrant_configured(),
                "collection": self.qdrant_collection_name,
                "url_set": bool(self.qdrant_url and not "your-cluster" in self.qdrant_url),
                "key_set": bool(self.qdrant_api_key and not self.qdrant_api_key.startswith("your_")),
            },
            "lyzr": {
                "configured": self.is_lyzr_configured(),
                "agent_id_set": bool(self.lyzr_agent_id and not self.lyzr_agent_id.startswith("your_")),
                "key_set": bool(self.lyzr_api_key and not self.lyzr_api_key.startswith("your_")),
            },
            "embedding": {
                "model": self.fastembed_model,
                "vector_dimension": 384,
            },
            "server": {
                "environment": self.environment,
                "version": "1.0.0",
            },
        }


settings = Settings()
