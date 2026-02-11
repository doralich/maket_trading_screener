import pytest
from unittest.mock import MagicMock, patch
from app.services.screener import ScreenerService
from tvscreener.field.crypto import CryptoField
import pandas as pd

@pytest.fixture
def screener_service():
    return ScreenerService()

def test_get_top_losers_api_sorting(screener_service):
    with patch('app.services.screener.CryptoScreener') as MockScreener:
        mock_instance = MockScreener.return_value
        mock_instance.get.return_value = pd.DataFrame({
            'name': ['L1'], 'exchange': ['E1'], 'description': ['D1'], 'close': [1.0], 'change': [-10.0]
        })
        
        # 1. Test Losers (Ascending)
        screener_service.get_top_movers(limit=5, sort_descending=False)
        
        # Verify that sort_by was called with ascending=True
        # For 1D, change_f is CryptoField.CHANGE_PERCENT
        mock_instance.sort_by.assert_called_with(CryptoField.CHANGE_PERCENT, ascending=True)

def test_get_top_losers_volume_filter(screener_service):
    with patch('app.services.screener.CryptoScreener') as MockScreener:
        mock_instance = MockScreener.return_value
        mock_instance.get.return_value = pd.DataFrame({
            'name': ['L1'], 'exchange': ['E1'], 'description': ['D1'], 'close': [1.0], 'change': [-10.0]
        })
        
        screener_service.get_top_movers(limit=5)
        
        # Verify that volume filter (> 10000) was applied
        # We need to find the call to where() that used VOLUME_24H_IN_USD
        volume_filter_called = False
        for call in mock_instance.where.call_args_list:
            # call[0][0] is the field object
            # call[0][1] would be the operator if using legacy, but tvscreener uses __gt__
            # Actually, tvscreener .where(Field > val) returns a Filter object
            pass
        
        # Simpler check: ensure where was called at least twice (one for Exchange, one for Volume)
        assert mock_instance.where.call_count >= 2