from sqlmodel import Session, select, create_engine, SQLModel
from app.models import TickerIndex, Favorite, MarketDataHistory
from app.services.indexer import IndexerService
import pytest
import pandas as pd
from datetime import datetime, timezone

@pytest.fixture
def session():
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

def test_sync_tickers_pruning(session, monkeypatch):
    # Setup initial state
    # Ticker that should be kept
    session.add(TickerIndex(symbol="BINANCE:BTCUSDT", exchange="BINANCE"))
    # Ticker that should be removed (unsupported exchange)
    session.add(TickerIndex(symbol="KRAKEN:ETHUSD", exchange="KRAKEN"))
    # Favorite that should be removed
    session.add(Favorite(symbol="KRAKEN:ETHUSD"))
    # History that should be removed
    session.add(MarketDataHistory(symbol="KRAKEN:ETHUSD", interval="5", timestamp=datetime.now(timezone.utc)))
    session.commit()

    class MockScreener:
        def __init__(self): self.get_call_count = 0
        def set_range(self, *args): return self
        def sort_by(self, *args, **kwargs): return self
        def where(self, *args): return self
        def get(self):
            self.get_call_count += 1
            if self.get_call_count == 1:
                return pd.DataFrame([{"Symbol": "BINANCE:BTCUSDT", "Exchange": "BINANCE", "Name": "BTC", "Description": ""}])
            return pd.DataFrame()

    monkeypatch.setattr("app.services.indexer.CryptoScreener", lambda: MockScreener())
    
    indexer = IndexerService(session)
    indexer.sync_tickers()
    
    # Verify pruning
    assert session.exec(select(TickerIndex).where(TickerIndex.symbol == "KRAKEN:ETHUSD")).first() is None
    assert session.exec(select(Favorite).where(Favorite.symbol == "KRAKEN:ETHUSD")).first() is None
    assert session.exec(select(MarketDataHistory).where(MarketDataHistory.symbol == "KRAKEN:ETHUSD")).first() is None
    
    # Verify kept
    assert session.exec(select(TickerIndex).where(TickerIndex.symbol == "BINANCE:BTCUSDT")).first() is not None
