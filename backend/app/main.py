from fastapi import FastAPI, APIRouter, Query
from app.services.screener import ScreenerService

app = FastAPI(title="TradingView Screener API")
screener_service = ScreenerService()

api_router = APIRouter(prefix="/api/v1")
screener_router = APIRouter(prefix="/screener")

@screener_router.get("/top-movers")
async def get_top_movers(limit: int = 50):
    return screener_service.get_top_movers(limit=limit)

@screener_router.get("/search")
async def search_ticker(q: str = Query(..., min_length=1)):
    return screener_service.search_ticker(q)

api_router.include_router(screener_router)
app.include_router(api_router)

@app.get("/")
async def read_root():
    return {"status": "ok", "message": "TradingView Screener API"}