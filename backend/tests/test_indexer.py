from sqlmodel import Session, select, create_engine, SQLModel
from app.models import TickerIndex
from app.services.indexer import IndexerService
import pytest

@pytest.fixture
def session():
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

def test_sync_tickers(session, monkeypatch):
    # Mock the tvscreener call to avoid network dependency in tests
    class MockScreener:
        def set_range(self, start, end): pass
        def get(self):
            import pandas as pd
            return pd.DataFrame([
                {"Symbol": "BINANCE:BTCUSDT", "Exchange": "BINANCE", "Name": "BTC", "Description": "Bitcoin"},
                {"Symbol": "BINANCE:ETHUSDT", "Exchange": "BINANCE", "Name": "ETH", "Description": "Ethereum"}
            ])

    monkeypatch.setattr("app.services.indexer.CryptoScreener", lambda: MockScreener())
    
    indexer = IndexerService(session)
    indexer.sync_tickers()
    
    tickers = session.exec(select(TickerIndex)).all()
    assert len(tickers) == 2
    assert tickers[0].symbol == "BINANCE:BTCUSDT"
