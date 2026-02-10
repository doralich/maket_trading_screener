# Implementation Plan: Targeted Indexing & Exchange Filtering

## Phase 1: Indexer Optimization & Ticker Filtering [checkpoint: 4b0d4eb]
- [x] Task: Refactor Indexer Logic (4b0d4eb)
    - [x] Update `IndexerService.sync_tickers` to filter by **BINANCE, BYBIT, BITGET** (4b0d4eb)
    - [x] Implement sorting by `MARKET_CAP_CALC` and range limited to 1500 for Spot assets (4b0d4eb)
    - [x] Implement the "Spot -> Perp" pairing logic (if Spot is indexed, its `.P` counterpart is also indexed) (4b0d4eb)
- [x] Task: Database Pruning Logic (4b0d4eb)
    - [x] Implement logic to delete stale tickers from `ticker_index` after sync (4b0d4eb)
    - [x] Implement logic to remove favorites and their history if they no longer meet exchange/rank criteria (4b0d4eb)
- [x] Task: Conductor - User Manual Verification 'Phase 1: Indexer Optimization & Ticker Filtering' (4b0d4eb)

## Phase 2: Maintenance & Verification
- [x] Task: Background Task Update (4b0d4eb)
    - [x] Update the background sync task in `main.py` to trigger the new pruning logic (4b0d4eb)
- [x] Task: UI Feedback (4b0d4eb)
    - [x] Verify that the Search UI only displays the refined Big Three tickers (4b0d4eb)
    - [x] Ensure the "ASSETS_TRACKED" count reflects the pruned favorites (4b0d4eb)
- [x] Task: Conductor - User Manual Verification 'Phase 2: Maintenance & Verification' (4b0d4eb)
