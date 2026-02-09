from fastapi.testclient import TestClient
import pytest
from unittest.mock import patch

def test_read_root():
    from app.main import app
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "TradingView Screener API"}

def test_get_top_movers_api():
    from app.main import app
    client = TestClient(app)
    with patch('app.services.screener.ScreenerService.get_top_movers') as mock_get:
        mock_get.return_value = [{'ticker': 'BTCUSD', 'price': 50000.0}]
        response = client.get("/api/v1/screener/top-movers")
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]['ticker'] == 'BTCUSD'

def test_search_ticker_api():
    from app.main import app
    client = TestClient(app)
    with patch('app.services.screener.ScreenerService.search_ticker') as mock_search:
        mock_search.return_value = [{'ticker': 'ETHUSD', 'price': 3000.0}]
        response = client.get("/api/v1/screener/search?q=ETH")
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]['ticker'] == 'ETHUSD'
