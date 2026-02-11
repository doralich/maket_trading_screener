# Market Trading Screener

```mermaid
graph TD
    %% External Layer
    subgraph External["External APIs"]
        TV[TradingView Screener API]
    end

    %% DevOps/Orchestration
    subgraph DevOps["Orchestration"]
        SSH[start.sh]
    end

    %% Backend Layer
    subgraph Backend["Backend (FastAPI + Python)"]
        direction TB
        App[main.py]
        ScreenerSvc[ScreenerService]
        CollectorSvc[CollectorService]
        IndexerSvc[IndexerService]
        FavSvc[FavoritesService]
        
        subgraph BackgroundTasks["Background Workers"]
            W1[broadcast_updates - 5s]
            W2[run_data_collector - 5m]
            W3[run_ticker_indexer - 24h]
        end
    end

    %% Persistence Layer
    subgraph Storage["Persistence (SQLite)"]
        DB[(tradingview.db)]
    end

    %% Frontend Layer
    subgraph Frontend["Frontend (React + Vite)"]
        direction TB
        MainApp[App.tsx]
        subgraph Components["UI Components"]
            Search[UniversalSearch]
            Table[CryptoTable]
            Console[SystemConsole]
        end
    end

    %% Relationships & Data Flow
    SSH -->|Starts| Backend
    SSH -->|Starts| Frontend

    %% Fetching Logic
    ScreenerSvc -->|Fetch Movers| TV
    CollectorSvc -->|Fetch History| TV
    IndexerSvc -->|Fetch Tickers| TV

    %% Write to DB
    CollectorSvc -->|Persist History| DB
    IndexerSvc -->|Sync Index| DB
    FavSvc -->|Manage Favs| DB

    %% Read from DB (Return Paths)
    DB -->|Read Index| ScreenerSvc
    DB -->|Load History| App
    DB -->|Load Favs| FavSvc

    %% Internal Backend Routing
    App --> ScreenerSvc
    App --> CollectorSvc
    App --> IndexerSvc
    App --> FavSvc

    %% App to Frontend
    MainApp <-->|WebSocket: Real-time| App
    MainApp <-->|REST: Search/Favs/Live| App

    MainApp --> Search
    MainApp --> Table
    MainApp --> Console

    %% Styling
    style TV fill:#f9f,stroke:#333,stroke-width:2px
    style DB fill:#00ff41,stroke:#333,stroke-width:2px,color:#000
    style Backend fill:#1a1a1a,stroke:#00ff41,stroke-width:1px,color:#00ff41
    style Frontend fill:#1a1a1a,stroke:#00ff41,stroke-width:1px,color:#00ff41
```

A high-precision, retro-terminal style cryptocurrency screener for the "Big Four" exchanges: **Binance, Bybit, Bitget, and OKX**.

## Features
- **Real-time Monitoring**: Top Movers and Top Losers tabs with 5-second unified refresh.
- **Full Market Indexing**: Access to over 5,800+ trading pairs (Spot and USDT Perpetuals).
- **Technical Indicators**: Integrated SMA (20/50/200), MACD, and RSI values.
- **Interactive Help**: Floating terminal-style documentation for technical indicators.
- **Persistence**: Favorite assets are tracked and saved locally for long-term analysis.

---

## Setup & Installation

### 1. Prerequisites
- Python 3.10+
- Node.js & npm

### 2. Quick Start
The easiest way to start both the backend and frontend is using the provided start script:

```bash
chmod +x start.sh
./start.sh
```

### 3. Database Initialization
Since the database is local and not stored in the repository, it will be automatically created the first time you run the application.

To populate the search index with all ~5,800 tickers from the exchanges, the system runs a background sync automatically on startup. You can monitor the progress in `backend.log`.

### 4. Manual Setup
If you prefer to run the components separately:

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Configuration
- **Liquidity Floor**: The screener defaults to a 50,000 USD (24h) volume floor to filter out illiquid assets.
- **Refresh Rate**: Dashboard updates every 5 seconds.

## License
MIT