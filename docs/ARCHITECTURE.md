# Project Architecture & Technical Deep-Dive

This document provides a 100% code-accurate overview of the Market Trading Screener architecture.

## System Architecture Diagram

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
    App <==>|WebSocket| MainApp

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
    linkStyle 3,4,9,12,15,17 stroke:#00ff41,stroke-width:3px;
    linkStyle 2,7,11 stroke:#f9f,stroke-width:2px,stroke-dasharray: 5 5;
```

---

## Code-Logic Mapping (Audit Results)

### 1. The Persistence Layer (SQLite)
The **Green Arrows (`==>`)** in the diagram represent every point where the code interacts with `tradingview.db`. 
*   **IndexerService**: Writes the full ticker list and **deletes** favorites if they are delisted from exchanges.
*   **CollectorService**: Performs a "Read-then-Write" cycle. It reads the user's favorites, fetches live data, and writes a new row to the history table.
*   **ScreenerService**: Performs a **Read-only** query during searches to find coins in the local index.

### 2. The Communication Layer
*   **External (`-.->`)**: Represents the REST API snapshots pulled from TradingView. This is "Outbound" traffic.
*   **Internal WebSocket (`<==>`)**: The bi-directional pipe between your Backend and Browser. It only pushes the "Movers" data to keep the dashboard fast.
*   **Internal REST**: Standard "Question and Answer" requests for things like searching a coin or viewing "Top Losers."

### 3. Service Definitions
*   **IndexerService**: The "Librarian." Keeps the database index of 5,800+ coins fresh.
*   **CollectorService**: The "Time Machine." Saves snapshots every 5 minutes to build your 6-month local history.
*   **ScreenerService**: The "Navigator." Filters the whole market to find winners and losers in real-time.
*   **FavoritesService**: The "Manager." Simply handles adding or removing coins from your tracking list.

---

## Newcomer Development Workflow
To add a new feature (e.g., a "Volume Alert"):
1.  **Database**: Add an `alert_threshold` column to the `Favorite` model.
2.  **Service**: Update `ScreenerService` to check if current volume exceeds that threshold.
3.  **API**: Send an `alert` flag through the WebSocket.
4.  **UI**: Make the row in `CryptoTable` flash or glow when the flag is true.
