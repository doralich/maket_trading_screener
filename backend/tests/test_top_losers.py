import pytest
from unittest.mock import MagicMock, patch
from app.services.screener import ScreenerService
import pandas as pd

@pytest.fixture
def screener_service():
    return ScreenerService()

def test_get_top_losers_sorting(screener_service):
    with patch('app.services.screener.CryptoScreener') as MockScreener:
        mock_instance = MockScreener.return_value
        
        # Unsorted data from API
        mock_instance.get.return_value = pd.DataFrame({
            'Symbol': ['LOSER1', 'WINNER1', 'LOSER2'],
            'Price': [10.0, 100.0, 5.0],
            'change': [-5.0, 10.0, -10.0],
            'name': ['LOSER1', 'WINNER1', 'LOSER2'],
            'exchange': ['EX1', 'EX2', 'EX1'],
            'description': ['D1', 'D2', 'D1']
        })
        
        # When ascending=True, it should return losers (sorted by change ascending)
        result = screener_service.get_top_movers(limit=3, sort_descending=False)
        
        assert len(result) == 3
        # Smallest change (-10.0) should be first
        assert result[0]['Symbol'] == 'LOSER2'
        assert result[1]['Symbol'] == 'LOSER1'
        assert result[2]['Symbol'] == 'WINNER1'

def test_get_top_movers_default_sorting(screener_service):
    with patch('app.services.screener.CryptoScreener') as MockScreener:
        mock_instance = MockScreener.return_value
        
        mock_instance.get.return_value = pd.DataFrame({
            'Symbol': ['LOSER1', 'WINNER1', 'LOSER2'],
            'Price': [10.0, 100.0, 5.0],
            'change': [-5.0, 10.0, -10.0],
            'name': ['LOSER1', 'WINNER1', 'LOSER2'],
            'exchange': ['EX1', 'EX2', 'EX1'],
            'description': ['D1', 'D2', 'D1']
        })
        
        # Default should be descending (top gainers first)
        result = screener_service.get_top_movers(limit=3)
        
        assert len(result) == 3
        assert result[0]['Symbol'] == 'WINNER1'
        assert result[1]['Symbol'] == 'LOSER1'
        assert result[2]['Symbol'] == 'LOSER2'
