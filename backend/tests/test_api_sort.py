from fastapi.testclient import TestClient
import pytest
from unittest.mock import patch
from app.main import app

client = TestClient(app)

def test_get_top_movers_sort_desc():
    with patch('app.services.screener.ScreenerService.get_top_movers') as mock_get:
        mock_get.return_value = []
        # Test default
        client.get("/api/v1/screener/top-movers")
        mock_get.assert_called_with(limit=50, interval='1D', sort_descending=True)
        
        # Test explicit desc
        client.get("/api/v1/screener/top-movers?sort=desc")
        mock_get.assert_called_with(limit=50, interval='1D', sort_descending=True)

def test_get_top_movers_sort_asc():
    with patch('app.services.screener.ScreenerService.get_top_movers') as mock_get:
        mock_get.return_value = []
        # Test asc
        client.get("/api/v1/screener/top-movers?sort=asc")
        mock_get.assert_called_with(limit=50, interval='1D', sort_descending=False)
