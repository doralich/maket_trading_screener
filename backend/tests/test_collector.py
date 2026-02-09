from sqlmodel import Session, select, create_engine, SQLModel
from app.models import Favorite, MarketDataHistory
from app.services.collector import CollectorService
from datetime import datetime, timezone, timedelta
import pytest
import pandas as pd

@pytest.fixture
def session():
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

def test_round_timestamp():
    collector = CollectorService()
    dt = datetime(2026, 2, 9, 10, 12, 34, tzinfo=timezone.utc)
    
    # 5m
    rounded = collector._round_timestamp(dt, "5")
    assert rounded == datetime(2026, 2, 9, 10, 10, tzinfo=timezone.utc)
    
    # 1h (60)
    rounded = collector._round_timestamp(dt, "60")
    assert rounded == datetime(2026, 2, 9, 10, 0, tzinfo=timezone.utc)
    
    # 1D
    rounded = collector._round_timestamp(dt, "1D")
    assert rounded == datetime(2026, 2, 9, 0, 0, tzinfo=timezone.utc)

def test_purge_old_data(session):
    collector = CollectorService()
    # Mock engine usage in CollectorService to use our in-memory session engine
    import app.services.collector
    app.services.collector.engine = session.get_bind()
    
    now = datetime.now(timezone.utc)
    old_date = now - timedelta(days=200)
    
    history1 = MarketDataHistory(symbol="BTCUSD", interval="1D", timestamp=now, close=100.0)
    history2 = MarketDataHistory(symbol="BTCUSD", interval="1D", timestamp=old_date, close=50.0)
    
    session.add(history1)
    session.add(history2)
    session.commit()
    
    collector.purge_old_data()
    
    remaining = session.exec(select(MarketDataHistory)).all()
    assert len(remaining) == 1
    # SQLite might return naive datetime, so we compare without tz or normalize
    assert remaining[0].timestamp.replace(tzinfo=timezone.utc) == now.replace(tzinfo=timezone.utc)

def test_collect_all(session, monkeypatch):
    collector = CollectorService()
    import app.services.collector
    app.services.collector.engine = session.get_bind()
    
    # Add a favorite
    fav = Favorite(symbol="BINANCE:BTCUSDT")
    session.add(fav)
    session.commit()
    
    # Mock tvscreener
    class MockScreener:
        def select(self, *args): pass
        def set_range(self, *args): pass
        def get(self):
            return pd.DataFrame([
                {
                    "Symbol": "BINANCE:BTCUSDT",
                    "Name": "BTCUSDT",
                    "Open (5)": 98000.0,
                    "High (5)": 98500.0,
                    "Low (5)": 97500.0,
                    "Price (5)": 98200.0,
                    "Volume (5)": 1000.0,
                    "Relative Strength Index (14) (5)": 55.0,
                    "MACD Level (12, 26) (5)": 10.0,
                    "Simple Moving Average (20) (5)": 98100.0,
                    "Simple Moving Average (50) (5)": 98000.0,
                    # ... other intervals would be here in reality
                }
            ])

    monkeypatch.setattr("app.services.collector.CryptoScreener", lambda: MockScreener())
    
    # We only test 5m interval for simplicity in mock
    collector.intervals = ["5"]
    collector.collect_all()
    
    history = session.exec(select(MarketDataHistory)).all()
    assert len(history) == 1
    assert history[0].symbol == "BINANCE:BTCUSDT"
    assert history[0].close == 98200.0
