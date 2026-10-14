"""
FlowAble FastAPI Main Application
Serves the FlowAble REST API and production React frontend build.
"""

import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from backend.config import settings
from backend.routes import router
from backend.activity_logger import activity_logger
from backend.memory import memory_service

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("flowable")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup & shutdown events."""
    logger.info("Starting FlowAble Backend (Track 4: Accessibility & Adaptive Assistants)...")
    activity_logger.log(
        event_type="system",
        message="FlowAble backend started. Listening for Omi webhooks and user queries.",
        status="success",
    )
    
    # Try initializing Qdrant collection on startup if credentials exist
    if settings.is_qdrant_configured():
        try:
            memory_service.ensure_collection()
            logger.info("Qdrant collection check completed successfully.")
        except Exception as e:
            logger.warning("Could not pre-initialize Qdrant collection on startup: %s", e)
    
    yield
    logger.info("FlowAble backend shutting down.")


app = FastAPI(
    title="FlowAble API",
    description="Voice-first accessibility assistant powered by Omi, Qdrant Cloud, and Lyzr Agent Studio.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from local Vite dev server and deployed domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)

# Mount frontend static files if built
frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    logger.info(f"Serving built React frontend from: {frontend_dist}")
    
    # Mount frontend assets
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    # Serve index.html for root and SPA client routes
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Allow specific API prefixes to 404 if not found
        if full_path.startswith(("api/", "omi/")):
            return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
        
        target_file = frontend_dist / full_path
        if target_file.is_file():
            return FileResponse(str(target_file))
        
        return FileResponse(str(frontend_dist / "index.html"))
else:
    logger.info("Frontend dist folder not found; running in API-only mode. (Build frontend to serve together)")
