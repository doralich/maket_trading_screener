# Implementation Plan: Market Top Losers Tab

## Phase 1: Backend - Data Retrieval & API [checkpoint: ]
- [x] Task: Enhance ScreenerService for Top Losers [876d3a9]
    - [ ] Write unit tests for `get_top_movers` with 'bottom' sort option
    - [ ] Update `ScreenerService.get_top_movers` to support an `ascending` parameter for "Change %" sorting
- [x] Task: API Endpoint Update [0ff8cb5]
    - [ ] Write integration tests for `GET /api/v1/screener/top-movers` with the new sort parameter
    - [ ] Update the FastAPI route to accept a `sort` or `direction` query parameter (defaulting to 'desc')
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Backend - Data Retrieval & API' (Protocol in workflow.md)

## Phase 2: Frontend - Tabbed Interface & Integration [checkpoint: ]
- [ ] Task: Implement Dashboard Tabs
    - [ ] Create a new `Tabs` component or integrate tab state into `App.tsx`
    - [ ] Replace static "MARKET_TOP_MOVERS" title with `[ TOP_MOVERS ]` and `[ TOP_LOSERS ]` interactive buttons
- [ ] Task: Integrated Data Fetching
    - [ ] Update `fetchLiveMovers` in `App.tsx` to include the `sort` parameter based on the active tab
    - [ ] Ensure the "TOP_GAINER" and "TOP_LOSER" metrics panels remain functional and shared across tabs
- [ ] Task: Style Polish & Real-time Sync
    - [ ] Verify that live WebSocket updates correctly target the active tab
    - [ ] Ensure terminal styling (borders, glow, hover states) is consistent across the tab system
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Frontend - Tabbed Interface & Integration' (Protocol in workflow.md)
