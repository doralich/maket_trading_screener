# Market Trading Screener

```mermaid
flowchart TD
    %% EXTERNAL DATA SOURCE
    subgraph External["[EXTERNAL] TradingView Infrastructure"]
        TV_API[Screener API - REST Snapshots]
    end

    %% BACKEND CORE
    subgraph Backend["[BACKEND] FastAPI Engine"]
        direction TB
        Main[main.py - API & WS Gateway]
        
        subgraph Services["Service Layer"]
            S_Screen[ScreenerService]
            S_Coll[CollectorService]
            S_Idx[IndexerService]
            S_Fav[FavoritesService]
            S_Hist[FavHistoryService]
        end

        subgraph Workers["Async Background Workers"]
            W_Broad[broadcast_updates - 10s]
            W_Coll[run_data_collector - 5m]
            W_Idx[run_ticker_indexer - 24h]
            W_Purge[run_data_purger - 24h]
        end
    end

    %% PERSISTENCE
    subgraph Storage["[STORAGE] Local Persistence"]
        DB[(tradingview.db - SQLite)]
    end

    %% FRONTEND CORE
    subgraph Frontend["[FRONTEND] React Dashboard"]
        direction TB
        %% Search is placed at the top of Frontend to prevent line crossing to Backend
        Search[UniversalSearch.tsx]
        
        subgraph MainApp["App.tsx - Isolated State Manager"]
            S_Movers[(moversData)]
            S_Losers[(losersData)]
            S_Favs[(trackedData)]
        end
        
        subgraph UI["Data Display Components"]
            Table[CryptoTable.tsx]
            Console[SystemConsole.tsx]
        end
    end

    %% --- DATA FLOW 1: DISCOVERY (Indexing) ---
    TV_API -.->|1. Fetch Catalog| S_Idx
    S_Idx ==>|2. Sync Tickers| DB
    S_Idx ==>|3. Prune Tracked| DB

    %% --- DATA FLOW 2: LIVE MARKET (Streaming) ---
    W_Broad -->|Trigger| S_Screen
    S_Screen -.->|4. Fetch Snapshots| TV_API
    S_Screen -->|5. Format JSON| Main
    Main -->|6a. WebSocket Push (1D)| S_Movers
    Main -->|6b. REST Polling| S_Losers

    %% --- DATA FLOW 3: HISTORY (Collection) ---
    W_Coll -->|Trigger| S_Coll
    DB ==>|7. Read Favorites| S_Coll
    S_Coll -.->|8. Snapshot Fetch| TV_API
    S_Coll ==>|9. Append History| DB

    %% --- DATA FLOW 4: INTERACTION ---
    Search -->|10. Search Query| Main
    Main -->|11. SQL LIKE| S_Screen
    S_Screen ==>|12. Ticker Lookup| DB
    
    MainApp -->|13. Toggle Track| S_Fav
    S_Fav ==>|14. CRUD Ops| DB

    MainApp -->|15. Fetch History| S_Hist
    S_Hist ==>|16. Read Data| DB

    %% --- UI CONNECTIONS ---
    MainApp --- Search
    MainApp --- Table
    MainApp --- Console

    %% --- STYLING ---
    style TV_API fill:#f9f,stroke:#333,stroke-width:2px
    style DB fill:#00ff41,stroke:#333,stroke-width:2px,color:#000
    style Backend fill:#1a1a1a,stroke:#00ff41,stroke-width:1px,color:#00ff41
    style Frontend fill:#1a1a1a,stroke:#00ff41,stroke-width:1px,color:#00ff41
    style External fill:#000,stroke:#f9f,stroke-dasharray: 5 5
```

A high-precision, retro-terminal style cryptocurrency screener for the "Big Four" exchanges: **Binance, Bybit, Bitget, and OKX**.

## Features
- **Real-time Monitoring**: Top Movers and Top Losers tabs with **10-second** unified refresh.
- **Full Market Indexing**: Access to over 5,800+ trading pairs (Spot and USDT Perpetuals).
- **Technical Indicators**: Integrated SMA (20/50/200), MACD, and RSI values.
- **Interactive Help**: Floating terminal-style documentation for technical indicators.
- **Persistence**: Favorite assets are tracked and saved locally for long-term analysis.

---

## Technical Highlights
- **Server-Side Sorting**: True "Top Movers" and "Top Losers" are calculated across the entire 5,800+ ticker catalog via API sort commands.
- **Isolated State Management**: Frontend uses separate data stores for Movers and Losers to eliminate race conditions and data "shifting."
- **Redundant Filter Enforcement**: Dual-layer filtering (API + local) ensures Top Losers lists strictly contain negative changes.
- **Robust Column Mapping**: Case-insensitive matching for API result columns ensures high-precision interval metrics (1M, 5M, 15M, etc.) are correctly identified.
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
