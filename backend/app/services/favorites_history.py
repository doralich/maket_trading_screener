from sqlmodel import Session, select
from app.models import Favorite, MarketDataHistory
from app.database import engine
from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
import json

router = APIRouter(prefix="/favorites")

@router.get("/history")
async def get_favorite_history(
    symbol: str = Query(...),
    interval: str = Query(...),
    limit: int = Query(100)
):
    """
    Returns historical OHLCV data for a specific favorite ticker and interval.
    """
    with Session(engine) as session:
        # Verify it's a favorite
        fav_stmt = select(Favorite).where(Favorite.symbol == symbol)
        if not session.exec(fav_stmt).first():
            raise HTTPException(status_code=404, detail="Asset not in favorites")

        statement = select(MarketDataHistory).where(
            MarketDataHistory.symbol == symbol,
            MarketDataHistory.interval == interval
        ).order_by(MarketDataHistory.timestamp.desc()).limit(limit)
        
        results = session.exec(statement).all()
        
        history = []
        for r in results:
            data = r.model_dump()
            if r.indicators_json:
                data['indicators'] = json.loads(r.indicators_json)
            history.append(data)
            
        return history
