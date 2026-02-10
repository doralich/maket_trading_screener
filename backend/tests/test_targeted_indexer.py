from sqlmodel import Session, select, create_engine, SQLModel
from app.models import TickerIndex
from app.services.indexer import IndexerService
import pytest
import pandas as pd

@pytest.fixture
def session():
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

def test_sync_tickers_filtering(session, monkeypatch):
    # Mock the tvscreener call
    class MockScreener:
        def __init__(self):
            self.calls = []
            self.get_call_count = 0
        def set_range(self, start, end): 
            self.calls.append(('set_range', start, end))
            return self
        def sort_by(self, field, ascending=True):
            self.calls.append(('sort_by', field, ascending))
            return self
        def where(self, *args):
            self.calls.append(('where', args))
            return self
        def get(self):
            self.get_call_count += 1
            if self.get_call_count == 1:
                # First call: Top 1500
                return pd.DataFrame([
                    {"Symbol": "BINANCE:BTCUSDT", "Exchange": "BINANCE", "Name": "BTCUSDT", "Description": "Bitcoin Spot"},
                    {"Symbol": "KRAKEN:ETHUSD", "Exchange": "KRAKEN", "Name": "ETHUSD", "Description": "Ethereum Spot"},
                    {"Symbol": "BYBIT:SOLUSDT", "Exchange": "BYBIT", "Name": "SOLUSDT", "Description": "Solana Spot"},
                    {"Symbol": "BITGET:XRPUSDT", "Exchange": "BITGET", "Name": "XRPUSDT", "Description": "XRP Spot"}
                ])
            else:
                # Second call: Perps
                return pd.DataFrame([
                    {"Symbol": "BINANCE:BTCUSDT.P", "Exchange": "BINANCE", "Name": "BTCUSDT.P", "Description": "Bitcoin Perp"},
                    {"Symbol": "BYBIT:SOLUSDT.P", "Exchange": "BYBIT", "Name": "SOLUSDT.P", "Description": "Solana Perp"}
                ])

    mock_instance = MockScreener()
    monkeypatch.setattr("app.services.indexer.CryptoScreener", lambda: mock_instance)
    
    indexer = IndexerService(session)
    indexer.sync_tickers()
    
    tickers = session.exec(select(TickerIndex)).all()
    symbols = [t.symbol for t in tickers]
    
    # Should only include BINANCE, BYBIT, BITGET
    assert "KRAKEN:ETHUSD" not in symbols
    assert "BINANCE:BTCUSDT" in symbols
    assert "BYBIT:SOLUSDT" in symbols
    assert "BITGET:XRPUSDT" in symbols
    assert "BINANCE:BTCUSDT.P" in symbols
    assert "BYBIT:SOLUSDT.P" in symbols
