from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, timezone

class TickerIndex(SQLModel, table=True):
    __tablename__ = "ticker_index"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    symbol: str = Field(index=True, unique=True)
    exchange: str
    name: Optional[str] = None
    description: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Favorite(SQLModel, table=True):
    __tablename__ = "favorites"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    symbol: str = Field(index=True, unique=True)
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MarketDataHistory(SQLModel, table=True):
    __tablename__ = "market_data_history"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    symbol: str = Field(index=True)
    timestamp: datetime = Field(index=True)
    interval: str = Field(index=True) # e.g., '5m', '1h', '1D'
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    volume: Optional[float] = None
    # We could also store indicators as JSON or separate columns
    indicators_json: Optional[str] = None # JSON string of all indicators
    
    class Config:
        unique_together = ("symbol", "timestamp", "interval")
