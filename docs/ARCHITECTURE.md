# Project Architecture & Technical Deep-Dive

This document provides an accurate technical overview of the Market Trading Screener architecture, mapping the exact code logic found in the backend services and frontend components.

## System Architecture Diagram

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
    TV -->|Full Exchange Scans| IndexerSvc
    IndexerSvc -->|1. Sync Index Table| DB
    IndexerSvc -->|2. Prune Invalid Favs| DB

    %% --- Logic Flow 2: Live Market Data ---
    W1 -->|Trigger| ScreenerSvc
    ScreenerSvc -->|Fetch Movers/Losers| TV
    ScreenerSvc -->|Push JSON| App
    App <-->|WebSocket| MainApp

    %% --- Logic Flow 3: History Collection ---
    W2 -->|Trigger| CollectorSvc
    DB -->|Read Tracked Symbols| CollectorSvc
    CollectorSvc -->|Request Tech Snapshots| TV
    CollectorSvc -->|Persist OHLCV + Indicators| DB

    %% --- Logic Flow 4: User Interaction ---
    Search -->|REST Request| App
    App -->|Search Query| ScreenerSvc
    ScreenerSvc -->|SQL Query| DB
    
    MainApp -->|Manage Tracked Assets| FavSvc
    FavSvc <-->|Read/Write| DB

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
```

---

## Detailed Logic Verification (100% Code-Aligned)

### 1. Service Layer Roles
- **IndexerService**: Performs paginated scans of the "Big Four" exchanges. Crucially, it manages the database integrity by **pruning** favorite assets that are no longer available on the supported exchanges.
- **ScreenerService**: 
    - **Live Scans**: Statelessly fetches the top 50 gainers or losers directly from the API.
    - **Ticker Search**: Executes a `LIKE` SQL query against the local `ticker_index` table.
- **CollectorService**: STATEFUL worker. It bridges the `favorites` table and the `market_data_history` table by taking interval-rounded snapshots.
- **FavoritesService**: Simple CRUD interface for the `favorites` table.

### 2. Synchronization Mechanisms
- **WebSocket (Movers)**: Hardcoded 5-second backend loop that broadcasts the result of `ScreenerService.get_top_movers(sort='desc')`.
- **REST Polling (Losers)**: Frontend-triggered 5-second loop that explicitly requests `get_top_movers(sort='asc')`.
- **Hybrid Merge**: `App.tsx` merges these two streams, prioritizing WebSocket for price updates but keeping the Losers sort stable during polling.

### 3. Data Flow Audit
- **TV $\rightarrow$ Backend**: Exclusively **REST (HTTP POST)** snapshots.
- **Backend $\rightarrow$ UI**: 
    - **Real-time**: WebSocket (WS).
    - **Management/Search**: REST (JSON).
- **Backend $\leftrightarrow$ DB**: **SQLModel (SQLite)**. Service-to-DB links are now explicitly mapped in the diagram (e.g., ScreenerSvc reading the index for searches).

---

## Technology Stack Justification (Updated)

| Technology | Role | Implementation Detail |
| :--- | :--- | :--- |
| **FastAPI** | Dispatcher | Uses `asyncio.create_task` for parallel background workers. |
| **SQLModel** | ORM | Implements `unique_together` constraints for history deduplication. |
| **Pandas** | Processor | Used in `ScreenerService` for rapid column renaming and sorting. |
| **Mermaid.js** | Docs | Text-based diagramming ensuring documentation stays in-sync with git history. |
