from fastapi.testclient import TestClient
import pytest

def test_read_root():
    from app.main import app
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "TradingView Screener API"}
