from fastapi import FastAPI

app = FastAPI(title="TradingView Screener API")

@app.get("/")
async def read_root():
    return {"status": "ok", "message": "TradingView Screener API"}
