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

from app.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize the database
    init_db()
    # Start the background task
    task = asyncio.create_task(broadcast_updates())
    yield
    # Shutdown: Cancel the task
    task.cancel()

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
async def get_top_movers(limit: int = 50):
    return screener_service.get_top_movers(limit=limit)

@screener_router.get("/search")
async def search_ticker(q: str = Query(..., min_length=1)):
    return screener_service.search_ticker(q)

@favorites_router.get("")
async def get_favorites():
    return favorites_service.get_favorites()

@favorites_router.post("", status_code=201)
async def add_favorite(favorite: FavoriteCreate):
    return favorites_service.add_favorite(favorite.symbol)

@favorites_router.delete("/{symbol}", status_code=204)
async def remove_favorite(symbol: str):
    favorites_service.remove_favorite(symbol)
    return None

api_router.include_router(screener_router)
api_router.include_router(favorites_router)
app.include_router(api_router)

@app.get("/")
async def read_root():
    return {"status": "ok", "message": "TradingView Screener API"}