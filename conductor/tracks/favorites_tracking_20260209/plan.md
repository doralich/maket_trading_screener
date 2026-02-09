# Implementation Plan: Favorite Tickers & Multi-Timeframe Data Persistence

## Phase 1: Database Schema & Favorites Management [checkpoint: 5fe0c2c]
- [x] Task: Database Migration & Models (c7c2327)
    - [x] Create SQLite schema for `ticker_index`, `favorites`, and `market_data_history` (c7c2327)
    - [x] Implement SQLAlchemy/SQLModel entities for these tables (c7c2327)
- [x] Task: Favorites CRUD API (c0afaf1)
    - [x] Write unit tests for adding/removing/listing favorites (c0afaf1)
    - [x] Implement `POST /api/v1/favorites` and `DELETE /api/v1/favorites/{symbol}` (c0afaf1)
    - [x] Implement `GET /api/v1/favorites` (c0afaf1)
- [x] Task: Conductor - User Manual Verification 'Phase 1: Database Schema & Favorites Management' (5fe0c2c)

## Phase 2: Background Workers & Data Sync [checkpoint: 1a41161]
- [x] Task: Ticker Indexing Service (549c68a)
    - [x] Write tests for the full-exchange ticker indexing logic (549c68a)
    - [x] Implement background task to fetch all symbols from `tvscreener` and sync to `ticker_index` (549c68a)
- [x] Task: Multi-Timeframe Data Fetcher (1c93c30)
    - [x] Write tests for fetching data across 11 intervals (5m to 1M) (1c93c30)
    - [x] Implement the collector to fetch and store OHLCV + Indicators for all "Favorite" tickers (1c93c30)
- [x] Task: Retention & Cleanup Logic (1c93c30)
    - [x] Write tests for the 6-month + 1-day retention policy (1c93c30)
    - [x] Implement the daily background worker to purge old data (1c93c30)
- [x] Task: Conductor - User Manual Verification 'Phase 2: Background Workers & Data Sync' (1a41161)

## Phase 3: Frontend Search & Dashboard Integration
- [x] Task: Universal Search UI (3a72b01)
    - [x] Enhance the search bar to query the local `ticker_index` API (3a72b01)
    - [x] Add "Favorite" toggle/star icon to search results (3a72b01)
- [x] Task: "Assets Tracked" Dashboard Update (a40bc62)
    - [x] Refactor dashboard to pull from `/api/v1/favorites` (a40bc62)
    - [x] Implement a "Timeframe Selector" (5m, 1h, 1D, etc.) to switch the viewed data for favorites (a40bc62)
- [x] Task: Style Polish & Real-time Integration (0775fa1)
    - [x] Ensure favorite assets update via WebSocket alongside the main screener (0775fa1)
    - [x] Refactor "ASSETS_TRACKED" UI to match the requested screenshot aesthetic (0775fa1)
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Frontend Search & Dashboard Integration' (Protocol in workflow.md)