"""
FlowAble Server Launcher
Starts the FastAPI application serving both the API and the React frontend.
"""

import os
import sys
import uvicorn
from dotenv import load_dotenv

load_dotenv()

def main():
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")

    print("\n" + "=" * 60)
    print("  FlowAble — Accessibility & Adaptive Memory Assistant")
    print("  Track 4: Accessibility & Adaptive Assistants")
    print("=" * 60)
    print(f"  * Web Application & UI:   http://localhost:{port}")
    print(f"  * Interactive API Docs:   http://localhost:{port}/docs")
    print(f"  * System Health Status:   http://localhost:{port}/status")
    print(f"  * Omi Conversation Hook:  http://localhost:{port}/omi/conversation")
    print(f"  * Omi Real-time Hook:     http://localhost:{port}/omi/realtime")
    print("=" * 60 + "\n")

    is_dev = os.getenv("ENVIRONMENT", "development").lower() == "development"
    uvicorn.run("backend.main:app", host=host, port=port, reload=is_dev)

if __name__ == "__main__":
    main()
