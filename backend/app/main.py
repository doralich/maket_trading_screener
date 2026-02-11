from fastapi import FastAPI, APIRouter, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.services.screener import ScreenerService
from typing import List
import asyncio
from contextlib import asynccontextmanager

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Handle stale connections
                pass

manager = ConnectionManager()
screener_service = ScreenerService()

async def broadcast_updates():
    """
    Background task to periodically fetch and broadcast market updates.
    """
    while True:
        if manager.active_connections:
            try:
                # Increased limit to 50 to match initial load
                updates = screener_service.get_top_movers(limit=50)
                await manager.broadcast({
                    "type": "market_update",
                    "data": updates
                })
            except Exception as e:
                print(f"Error in broadcast task: {e}")
        await asyncio.sleep(10) # Update every 10 seconds

from app.database import init_db, engine
from app.services.indexer import IndexerService
from app.services.collector import CollectorService
from sqlmodel import Session

async def run_ticker_indexer():
    """
    Background task to periodically sync the ticker index.
    Runs every 24 hours.
    """
    while True:
        try:
            # Run blocking indexing in a thread
            await asyncio.to_thread(_sync_tickers_blocking)
        except Exception as e:
            print(f"Error in ticker indexer task: {e}")
        await asyncio.sleep(24 * 3600) # Run every 24 hours

def _sync_tickers_blocking():
    with Session(engine) as session:
        indexer = IndexerService(session)
        indexer.sync_tickers()

async def run_data_collector():
    """
    Background task to collect data for favorite tickers.
    Runs every 5 minutes.
    """
    collector = CollectorService()
    while True:
        try:
            # Run blocking collection in a thread
            await asyncio.to_thread(collector.collect_all)
        except Exception as e:
            print(f"Error in data collector task: {e}")
        await asyncio.sleep(5 * 60) # Run every 5 minutes

async def run_data_purger():
    """
    Background task to purge old market data history.
    Runs every 24 hours.
    """
    collector = CollectorService()
    while True:
        try:
            # Run blocking purge in a thread
            await asyncio.to_thread(collector.purge_old_data)
        except Exception as e:
            print(f"Error in data purger task: {e}")
        await asyncio.sleep(24 * 3600) # Run every 24 hours

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize the database
    init_db()
    # Start the background tasks
    task = asyncio.create_task(broadcast_updates())
    index_task = asyncio.create_task(run_ticker_indexer())
    collect_task = asyncio.create_task(run_data_collector())
    purge_task = asyncio.create_task(run_data_purger())
    yield
    # Shutdown: Cancel the tasks
    task.cancel()
    index_task.cancel()
    collect_task.cancel()
    purge_task.cancel()

app = FastAPI(title="TradingView Screener API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await websocket.send_json({"type": "welcome", "message": "Connected to TradingView Screener WebSocket"})
        
        # Trigger immediate data fetch for the new client
        try:
            initial_data = screener_service.get_top_movers(limit=50)
            await websocket.send_json({
                "type": "market_update",
                "data": initial_data
            })
            print(f"Sent initial update: {len(initial_data)} assets")
        except Exception as e:
            print(f"Error sending initial update: {e}")

        while True:
            # Keep connection open
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

from app.services.favorites import FavoritesService
from pydantic import BaseModel

class FavoriteCreate(BaseModel):
    symbol: str

favorites_service = FavoritesService()

api_router = APIRouter(prefix="/api/v1")
screener_router = APIRouter(prefix="/screener")
favorites_router = APIRouter(prefix="/favorites")

@screener_router.get("/top-movers")
async def get_top_movers(limit: int = 50, interval: str = "1D", sort: str = "desc"):
    sort_descending = sort.lower() != "asc"
    return screener_service.get_top_movers(limit=limit, interval=interval, sort_descending=sort_descending)

@screener_router.get("/search")
async def search_ticker(q: str = Query(..., min_length=1)):
    return screener_service.search_ticker(q)

@favorites_router.get("")
async def get_favorites():
    return favorites_service.get_favorites()

@favorites_router.get("/live")
async def get_favorites_live(interval: str = "1D"):
    favorites = favorites_service.get_favorites()
    symbols = [f.symbol for f in favorites]
    return screener_service.get_assets_by_symbols(symbols, interval)

@favorites_router.post("", status_code=201)
async def add_favorite(favorite: FavoriteCreate):
    return favorites_service.add_favorite(favorite.symbol)

@favorites_router.delete("/{symbol}", status_code=204)
async def remove_favorite(symbol: str):
    favorites_service.remove_favorite(symbol)
    return None

from app.services.favorites_history import router as fav_history_router

api_router.include_router(screener_router)
api_router.include_router(favorites_router)
api_router.include_router(fav_history_router)
app.include_router(api_router)

@app.get("/")
async def read_root():
    return {"status": "ok", "message": "TradingView Screener API"}