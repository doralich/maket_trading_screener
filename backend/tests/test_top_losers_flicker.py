import pytest
from unittest.mock import patch, MagicMock
from app.services.screener import ScreenerService
import pandas as pd

@pytest.fixture
def screener_service():
    return ScreenerService()

def test_top_losers_excludes_positive_gains(screener_service):
    """
    Reproduction test for 'Top Losers' flickering bug.
    Ensures that when fetching Top Losers (sort_descending=False),
    NO positive gainers are returned, even if they are in the dataset.
    """
    with patch('app.services.screener.CryptoScreener') as MockScreener:
        mock_instance = MockScreener.return_value
        
        # Mock data with mixed positive and negative values
        # We simulate a scenario where we might get some positive values if not filtered
        mock_data = pd.DataFrame({
            'Symbol': ['LOSER1', 'LOSER2', 'GAINER1', 'GAINER2', 'LOSER3'],
            'Price': [100.0, 50.0, 200.0, 300.0, 10.0],
            'Change %': [-10.5, -5.0, 2.5, 15.0, -1.2],
            'Volume': [100000, 100000, 100000, 100000, 100000] # Ensure volume passes any potential floor
        })
        
        mock_instance.get.return_value = mock_data
        
        # Fetch Top Losers (sort_descending=False)
        # We expect strictly negative values.
        results = screener_service.get_top_movers(limit=10, sort_descending=False)
        
        # Assertions
        assert len(results) > 0, "Should return results"
        
        for item in results:
            change = item.get('Change %', 0)
            assert change < 0, f"Found positive change in Top Losers: {item['Symbol']} ({change}%)"

def test_top_losers_stability_updates(screener_service):
    """
    Simulate multiple updates to ensure stability.
    """
    with patch('app.services.screener.CryptoScreener') as MockScreener:
        mock_instance = MockScreener.return_value
        
        # Update 1: Mixed data
        data_1 = pd.DataFrame({
            'Symbol': ['A', 'B', 'C'],
            'Change %': [-5.0, 2.0, -1.0], 
            'Volume': [100000]*3
        })
        
        # Update 2: All Positive (Market Turnaround) - Should return empty or handle gracefully, NOT show gainers as losers
        data_2 = pd.DataFrame({
            'Symbol': ['A', 'B', 'C'],
            'Change %': [1.0, 5.0, 2.0],
            'Volume': [100000]*3
        })
        
        mock_instance.get.side_effect = [data_1, data_2]
        
        # Call 1
        results1 = screener_service.get_top_movers(limit=5, sort_descending=False)
        neg_only_1 = [r['Change %'] for r in results1]
        assert all(c < 0 for c in neg_only_1), f"Update 1 failed: {neg_only_1}"
        
        # Call 2
        results2 = screener_service.get_top_movers(limit=5, sort_descending=False)
        neg_only_2 = [r['Change %'] for r in results2]
        assert all(c < 0 for c in neg_only_2), f"Update 2 failed: {neg_only_2}"

def test_get_assets_by_symbols(screener_service):
    """
    Test get_assets_by_symbols to boost coverage.
    """
    with patch('app.services.screener.CryptoScreener') as MockScreener:
        mock_instance = MockScreener.return_value
        mock_instance.get.return_value = pd.DataFrame({
            'Symbol': ['BINANCE:BTCUSDT'],
            'Price': [95000.0],
            'Change %': [1.5]
        })
        
        results = screener_service.get_assets_by_symbols(['BINANCE:BTCUSDT'])
        assert len(results) == 1
        assert results[0]['Symbol'] == 'BINANCE:BTCUSDT'

def test_get_top_movers_error_handling(screener_service):
    """
    Test error handling in get_top_movers to hit fallback lines.
    Ensures context-aware fallback (negative for losers).
    """
    with patch('app.services.screener.CryptoScreener') as MockScreener:
        mock_instance = MockScreener.return_value
        mock_instance.get.side_effect = Exception("API Error")
        
        # Test Movers (Gainers)
        results = screener_service.get_top_movers(sort_descending=True)
        assert results[0]['Change %'] > 0
        
        # Test Losers
        results_losers = screener_service.get_top_movers(sort_descending=False)
        assert results_losers[0]['Change %'] < 0
        assert results_losers[0]['Symbol'] == "BINANCE:BTCUSDT"

def test_get_assets_by_symbols_empty(screener_service):
    """
    Test empty input for get_assets_by_symbols.
    """
    assert screener_service.get_assets_by_symbols([]) == []

def test_case_insensitive_renaming(screener_service):
    """
    Test that 'Change|5' (capital C) is correctly renamed to 'Change %'.
    """
    with patch('app.services.screener.CryptoScreener') as MockScreener:
        mock_instance = MockScreener.return_value
        # Mock data with capital 'Change|5' as returned by the API
        mock_instance.get.return_value = pd.DataFrame({
            'Symbol': ['TEST1'],
            'Price': [100.0],
            'Change|5': [-2.5],
            'Volume': [100000]
        })
        
        # Request with interval '5'
        results = screener_service.get_top_movers(interval='5')
        assert len(results) == 1
        assert 'Change %' in results[0]
        assert results[0]['Change %'] == -2.5
        assert 'Change|5' not in results[0]
