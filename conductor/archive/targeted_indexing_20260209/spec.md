# Specification: Targeted Indexing & Exchange Filtering

## Overview
This track optimizes the backend ticker index to focus only on high-value assets from specific exchanges. It reduces the database footprint by limiting the search index to the top 1500 Spot tickers by market cap and restricting exchange support to Binance, Bybit, and Bitget. Additionally, it ensures that if a Spot ticker is indexed, its Perpetual counterpart is also included.

## Functional Requirements
- **Targeted Indexing:**
    - The `IndexerService` will fetch crypto assets from **BINANCE**, **BYBIT**, and **BITGET**.
    - It will identify the top 1500 **Spot** tickers based on Market Capitalization (`MARKET_CAP_CALC`).
    - For each identified Spot ticker (e.g., `BNBUSDT`), the indexer will also look for and include its corresponding **Perpetual** ticker (e.g., `BNBUSDT.P`) if available on the supported exchanges.
- **Index Pruning:**
    - On every sync (every 24h), the backend will delete any ticker in the `ticker_index` table that is NOT part of the new top 1500 set (Spot + associated Perps) or belongs to an unsupported exchange.
- **Favorites Pruning:**
    - If a currently favorited ticker belongs to an unsupported exchange or is no longer in the prioritized set, it will be automatically removed from the `favorites` table.
- **Data Retention Preservation:**
    - The 6-month + 1-day retention policy for historical market data (`market_data_history`) remains active for all valid tracked assets.
    - Historical data for pruned favorites will be deleted immediately during the pruning process.

## Technical Requirements
- **Indexer Logic:** Update the `CryptoScreener` configuration to use `sort_by(CryptoField.MARKET_CAP_CALC, ascending=False)` and `set_range(0, 1500)`.
- **Spot-Perp Pairing:** Implement logic to derive Perp symbols from Spot symbols and ensure they are indexed.
- **Database Cleanup:** Implement SQL logic to delete records in `ticker_index` and `favorites` that don't match the new criteria.
- **Background Task:** Ensure the daily sync task includes the pruning logic.

## Acceptance Criteria
- The `ticker_index` table is restricted to BINANCE, BYBIT, and BITGET.
- Only Top 1500 Spot tickers and their associated Perps are present in the search index.
- Previously favorited tickers from unsupported exchanges are removed.
- Historical data older than 6 months and 1 day continues to be purged daily.

## Out of Scope
- Adding support for new exchanges beyond the "Big Three".
- Real-time ranking updates.
