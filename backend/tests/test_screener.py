import pytest
from unittest.mock import MagicMock, patch
from app.services.screener import ScreenerService
import pandas as pd

@pytest.fixture
def screener_service():
    return ScreenerService()

def test_get_top_movers_structure(screener_service):
    with patch('app.services.screener.CryptoScreener') as MockScreener:
        mock_instance = MockScreener.return_value
        # Mocking the get() method
        mock_instance.get.return_value = pd.DataFrame({
            'ticker': ['BTCUSD', 'ETHUSD'],
            'price': [50000.0, 3000.0],
            'change': [2.5, -1.2]
        })
        
        result = screener_service.get_top_movers(limit=2)
        
        assert isinstance(result, list)
        assert len(result) == 2
        assert result[0]['ticker'] == 'BTCUSD'
        assert 'price' in result[0]

def test_search_ticker(screener_service):
    with patch('app.services.screener.CryptoScreener') as MockScreener:
        mock_instance = MockScreener.return_value
        # Mocking search logic
        mock_instance.get.return_value = pd.DataFrame({
            'ticker': ['BTCUSD'],
            'price': [50000.0]
        })
        
        result = screener_service.search_ticker('BTC')
        
        assert isinstance(result, list)
        assert len(result) == 1
        assert result[0]['ticker'] == 'BTCUSD'
