# Market Trading Screener

```mermaid
graph TD
    %% External Layer
    subgraph External["External APIs"]
        TV[TradingView Screener API]
    end

    %% Backend Layer
    subgraph Backend["Backend (FastAPI + Python)"]
        direction TB
        App[main.py]
        ScreenerSvc[ScreenerService]
        CollectorSvc[CollectorService]
        IndexerSvc[IndexerService]
        FavSvc[FavoritesService]
        
        subgraph Workers["Background Workers"]
            W1[broadcast_updates]
            W2[run_data_collector]
            W3[run_ticker_indexer]
            W4[run_data_purger]
        end
    end

    %% Persistence Layer
    subgraph Storage["Persistence (SQLite)"]
        DB[(tradingview.db)]
    end

    %% Frontend Layer
    subgraph Frontend["Frontend (React + Vite)"]
        MainApp[App.tsx]
        Search[UniversalSearch]
        Table[CryptoTable]
    end

    %% --- 1. TICKER INDEXING (IndexerService) ---
    TV -.->|Full Scan| IndexerSvc
    IndexerSvc ==>|1. Sync Index| DB
    IndexerSvc ==>|2. Prune Stale Favs| DB

    %% --- 2. LIVE MARKET DATA (ScreenerService) ---
    W1 -->|Trigger every 5s| ScreenerSvc
    ScreenerSvc -.->|Fetch Snapshot| TV
    ScreenerSvc -->|JSON Data| App
    App <-->|WebSocket| MainApp

    %% --- 3. HISTORY COLLECTION (CollectorService) ---
    W2 -->|Trigger every 5m| CollectorSvc
    DB ==>|Step A: Read Fav List| CollectorSvc
    CollectorSvc -.->|Step B: Request Techs| TV
    CollectorSvc ==>|Step C: Persist Data| DB

    %% --- 4. USER ACTIONS (Favorites & Search) ---
    Search -->|REST Request| App
    App -->|Invoke search_ticker| ScreenerSvc
    ScreenerSvc ==>|SQL Query| DB
    
    MainApp -->|Toggle Favorite| FavSvc
    FavSvc ==>|CRUD Ops| DB

    %% Styling
    style TV fill:#f9f,stroke:#333,stroke-width:2px
    style DB fill:#00ff41,stroke:#333,stroke-width:2px,color:#000
    style Backend fill:#1a1a1a,stroke:#00ff41,stroke-width:1px,color:#00ff41
    style Frontend fill:#1a1a1a,stroke:#00ff41,stroke-width:1px,color:#00ff41
    
    %% Color Code: Green (==>) for Database, Dotted (-.->) for Internet
    linkStyle 1,2,8,10,13,15 stroke:#00ff41,stroke-width:3px;
    linkStyle 0,4,9 stroke:#f9f,stroke-width:2px,stroke-dasharray: 5 5;
```

A high-precision, retro-terminal style cryptocurrency screener for the "Big Four" exchanges: **Binance, Bybit, Bitget, and OKX**.

## Features
- **Real-time Monitoring**: Top Movers and Top Losers tabs with 5-second unified refresh.
- **Full Market Indexing**: Access to over 5,800+ trading pairs (Spot and USDT Perpetuals).
- **Technical Indicators**: Integrated SMA (20/50/200), MACD, and RSI values.
- **Interactive Help**: Floating terminal-style documentation for technical indicators.
- **Persistence**: Favorite assets are tracked and saved locally for long-term analysis.

---

## Technical Highlights
- **Server-Side Sorting**: True "Top Movers" and "Top Losers" are calculated across the entire 5,800+ ticker catalog via API sort commands.
- **Hybrid Communication**: Uses WebSockets for live gainer pushes and REST for high-precision history and loser polling.
- **Data Retention**: Local SQLite database with a 6-month rolling purge policy for favorite indicators.
- **Liquidity Guard**: Integrated 50,000 USD (24h) volume floor to filter out illiquid assets.

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

---

## Detailed Architecture
For a deep dive into the service logic, database schema, and development lifecycle, see [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## License
MIT