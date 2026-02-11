# Implementation Plan: Market Top Losers Tab

## Phase 1: Backend - Data Retrieval & API [checkpoint: 0ff8cb5]
- [x] Task: Enhance ScreenerService for Top Losers [876d3a9]
    - [x] Write unit tests for `get_top_movers` with 'bottom' sort option
    - [x] Update `ScreenerService.get_top_movers` to support an `ascending` parameter for "Change %" sorting
- [x] Task: API Endpoint Update [0ff8cb5]
    - [x] Write integration tests for `GET /api/v1/screener/top-movers` with the new sort parameter
    - [x] Update the FastAPI route to accept a `sort` or `direction` query parameter (defaulting to 'desc')
- [x] Task: Conductor - User Manual Verification 'Phase 1: Backend - Data Retrieval & API' (Protocol in workflow.md) [0ff8cb5]

## Phase 2: Frontend - Tabbed Interface & Integration [checkpoint: 0ff8cb5]
- [x] Task: Implement Dashboard Tabs [0ff8cb5]
- [x] Task: Integrated Data Fetching [0ff8cb5]
- [x] Task: Style Polish & Real-time Sync [0ff8cb5]
    - [x] Verify that live WebSocket updates correctly target the active tab
    - [x] Ensure terminal styling (borders, glow, hover states) is consistent across the tab system
- [x] Task: Conductor - User Manual Verification 'Phase 2: Frontend - Tabbed Interface & Integration' (Protocol in workflow.md) [0ff8cb5]