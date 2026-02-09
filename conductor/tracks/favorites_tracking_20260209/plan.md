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

## Phase 2: Background Workers & Data Sync
- [ ] Task: Ticker Indexing Service
    - [ ] Write tests for the full-exchange ticker indexing logic
    - [ ] Implement background task to fetch all symbols from `tvscreener` and sync to `ticker_index`
- [ ] Task: Multi-Timeframe Data Fetcher
    - [ ] Write tests for fetching data across 11 intervals (5m to 1M)
    - [ ] Implement the collector to fetch and store OHLCV + Indicators for all "Favorite" tickers
- [ ] Task: Retention & Cleanup Logic
    - [ ] Write tests for the 6-month + 1-day retention policy
    - [ ] Implement the daily background worker to purge old data
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Background Workers & Data Sync' (Protocol in workflow.md)

## Phase 3: Frontend Search & Dashboard Integration
- [ ] Task: Universal Search UI
    - [ ] Enhance the search bar to query the local `ticker_index` API
    - [ ] Add "Favorite" toggle/star icon to search results
- [ ] Task: "Assets Tracked" Dashboard Update
    - [ ] Refactor dashboard to pull from `/api/v1/favorites`
    - [ ] Implement a "Timeframe Selector" (5m, 1h, 1D, etc.) to switch the viewed data for favorites
- [ ] Task: Style Polish & Real-time Integration
    - [ ] Ensure favorite assets update via WebSocket alongside the main screener
    - [ ] Refactor "ASSETS_TRACKED" UI to match the requested screenshot aesthetic
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Frontend Search & Dashboard Integration' (Protocol in workflow.md)