from fastapi.testclient import TestClient
import pytest
from app.main import app

def test_websocket_connection():
    client = TestClient(app)
    with client.websocket_connect("/ws") as websocket:
        data = websocket.receive_json()
        assert "type" in data
        assert data["type"] == "welcome"
        assert "message" in data

def test_websocket_broadcast():
    from app.main import manager
    import asyncio
    client = TestClient(app)
    with client.websocket_connect("/ws") as websocket:
        # Ignore welcome message
        websocket.receive_json()
        
        # Manually trigger broadcast via manager for testing
        asyncio.run(manager.broadcast({"type": "update", "data": "test_data"}))
        
        data = websocket.receive_json()
        assert data["type"] == "update"
        assert data["data"] == "test_data"
