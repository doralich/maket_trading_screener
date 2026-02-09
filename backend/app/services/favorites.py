from sqlmodel import Session, select
from app.models import Favorite
from app.database import engine
from fastapi import HTTPException

class FavoritesService:
    def get_favorites(self):
        with Session(engine) as session:
            statement = select(Favorite)
            return session.exec(statement).all()

    def add_favorite(self, symbol: str):
        with Session(engine) as session:
            # Check if already exists
            statement = select(Favorite).where(Favorite.symbol == symbol)
            existing = session.exec(statement).first()
            if existing:
                raise HTTPException(status_code=400, detail="Ticker already in favorites")
            
            favorite = Favorite(symbol=symbol)
            session.add(favorite)
            session.commit()
            session.refresh(favorite)
            return favorite

    def remove_favorite(self, symbol: str):
        with Session(engine) as session:
            statement = select(Favorite).where(Favorite.symbol == symbol)
            favorite = session.exec(statement).first()
            if not favorite:
                raise HTTPException(status_code=404, detail="Favorite not found")
            
            session.delete(favorite)
            session.commit()
            return True
