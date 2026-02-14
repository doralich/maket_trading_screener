import pytest
from unittest.mock import MagicMock, patch
from app.services.screener import ScreenerService
import pandas as pd
from app.models import TickerIndex

@pytest.fixture
def screener_service():
    return ScreenerService()

def test_get_top_movers_structure(screener_service):
    with patch('app.services.screener.CryptoScreener') as MockScreener:
        mock_instance = MockScreener.return_value
        # Mocking the get() method with the new capitalized column names
        mock_instance.get.return_value = pd.DataFrame({
            'Symbol': ['BTCUSD', 'ETHUSD'],
            'Price': [50000.0, 3000.0],
            'Change %': [2.5, -1.2]
        })
        
        result = screener_service.get_top_movers(limit=2)
        
        assert isinstance(result, list)
        assert len(result) == 2
        # Data is sorted by Change % descending, so BTC (2.5) comes first
        assert result[0]['Symbol'] == 'BTCUSD'
        assert 'Price' in result[0]

def test_search_ticker(screener_service):
    # Patching Session used in search_ticker
    with patch('app.services.screener.Session') as MockSession:
        mock_session = MockSession.return_value
        mock_session.__enter__.return_value = mock_session
        
        # Mock results
        mock_results = [
            TickerIndex(symbol='BTCUSD', exchange='BINANCE', name='BTC', description='Bitcoin')
        ]
        mock_session.exec.return_value.all.return_value = mock_results
        
        result = screener_service.search_ticker('BTC')
        
        assert isinstance(result, list)
        assert len(result) == 1
        assert result[0]['symbol'] == 'BTCUSD'
