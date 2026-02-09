from sqlmodel import Session, select, create_engine, SQLModel
from app.models import TickerIndex, Favorite, MarketDataHistory
from datetime import datetime, timezone

def test_models():
    # Use in-memory SQLite for testing
    sqlite_url = "sqlite://"
    engine = create_engine(sqlite_url)
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        # Test TickerIndex
        ticker = TickerIndex(symbol="BINANCE:BTCUSDT", exchange="BINANCE", name="BTC")
        session.add(ticker)
        session.commit()
        
        # Test Favorite
        fav = Favorite(symbol="BINANCE:BTCUSDT")
        session.add(fav)
        session.commit()
        
        # Test MarketDataHistory
        history = MarketDataHistory(
            symbol="BINANCE:BTCUSDT",
            timestamp=datetime.now(timezone.utc),
            interval="1h",
            close=98000.0
        )
        session.add(history)
        session.commit()
        
        # Verify
        statement = select(TickerIndex).where(TickerIndex.symbol == "BINANCE:BTCUSDT")
        result = session.exec(statement).first()
        assert result.symbol == "BINANCE:BTCUSDT"
        
        statement = select(Favorite).where(Favorite.symbol == "BINANCE:BTCUSDT")
        result = session.exec(statement).first()
        assert result.symbol == "BINANCE:BTCUSDT"
        
        statement = select(MarketDataHistory).where(MarketDataHistory.symbol == "BINANCE:BTCUSDT")
        result = session.exec(statement).first()
        assert result.close == 98000.0
        assert result.interval == "1h"

if __name__ == "__main__":
    test_models()
    print("Models test passed!")
