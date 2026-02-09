from fastapi.testclient import TestClient
from app.main import app
from app.database import engine, SQLModel
import pytest

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    # Clear database before each test
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)

def test_add_favorite():
    response = client.post("/api/v1/favorites", json={"symbol": "BINANCE:BTCUSDT"})
    assert response.status_code == 201
    assert response.json()["symbol"] == "BINANCE:BTCUSDT"

def test_get_favorites():
    # Add one first
    client.post("/api/v1/favorites", json={"symbol": "BINANCE:BTCUSDT"})
    
    response = client.get("/api/v1/favorites")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["symbol"] == "BINANCE:BTCUSDT"

def test_delete_favorite():
    # Add one first
    client.post("/api/v1/favorites", json={"symbol": "BINANCE:BTCUSDT"})
    
    response = client.delete("/api/v1/favorites/BINANCE:BTCUSDT")
    assert response.status_code == 204
    
    # Verify it's gone
    response = client.get("/api/v1/favorites")
    assert len(response.json()) == 0

def test_add_duplicate_favorite():
    client.post("/api/v1/favorites", json={"symbol": "BINANCE:BTCUSDT"})
    response = client.post("/api/v1/favorites", json={"symbol": "BINANCE:BTCUSDT"})
    assert response.status_code == 400 # or 409
