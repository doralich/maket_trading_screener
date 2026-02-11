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
        
        subgraph BackgroundTasks["Background Workers (asyncio)"]
            W1[broadcast_updates - 5s]
            W2[run_data_collector - 5m]
            W3[run_ticker_indexer - 24h]
            W4[run_data_purger - 24h]
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

    %% --- Logic Flow 1: Ticker Indexing ---
    TV -.->|Full Exchange Scans| IndexerSvc
    IndexerSvc ==>|1. Sync Index Table| DB
    IndexerSvc ==>|2. Prune Invalid Favs| DB

    %% --- Logic Flow 2: Live Market Data ---
    W1 -->|Trigger| ScreenerSvc
    ScreenerSvc -.->|Fetch Movers/Losers| TV
    ScreenerSvc -->|Push JSON| App
    App <==>|WebSocket| MainApp

    %% --- Logic Flow 3: History Collection ---
    W2 -->|Trigger| CollectorSvc
    DB ---|1. Read Tracked Symbols| CollectorSvc
    CollectorSvc -.->|2. Request Tech Snapshots| TV
    CollectorSvc ==>|3. Persist OHLCV + Indicators| DB

    %% --- Logic Flow 4: User Interaction ---
    Search -->|REST Request| App
    App -->|Search Query| ScreenerSvc
    ScreenerSvc -->|SQL Query| DB
    
    MainApp -->|Manage Tracked Assets| FavSvc
    FavSvc <==>|Read/Write| DB

    %% --- Component Relationships ---
    SSH -->|Spawn Process| Backend
    SSH -->|Spawn Process| Frontend
    
    MainApp --> Search
    MainApp --> Table
    MainApp --> Console

    %% Styling
    style TV fill:#f9f,stroke:#333,stroke-width:2px
    style DB fill:#00ff41,stroke:#333,stroke-width:2px,color:#000
    style Backend fill:#1a1a1a,stroke:#00ff41,stroke-width:1px,color:#00ff41
    style Frontend fill:#1a1a1a,stroke:#00ff41,stroke-width:1px,color:#00ff41
    
    %% Explicitly separating lines
    linkStyle 10 stroke:#00ff41,stroke-width:2px;
    linkStyle 12 stroke:#00ff41,stroke-width:4px;
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