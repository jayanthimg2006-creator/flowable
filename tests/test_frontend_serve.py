"""
Tests for Frontend Static Serving and SPA Routing Fallback
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_serve_root_frontend(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")
    assert "FlowAble" in response.text


def test_serve_spa_client_routes(client):
    # Any non-API route should fallback to index.html for client-side routing
    for route in ["/dashboard", "/ask", "/memory", "/activity", "/settings"]:
        response = client.get(route)
        assert response.status_code == 200
        assert "text/html" in response.headers.get("content-type", "")
