# Specification: Favorite Tickers & Multi-Timeframe Historical Data Persistence

## Overview
This track implements a robust "Favorites" system. It expands the search capability to include all tickers from supported exchanges and allows users to track specific assets across multiple timeframes. For these "Favorite" assets, the system will persist price and indicator data for 11 distinct intervals in a local database with a 6-month retention policy.

## Functional Requirements
- **Exchange Indexing:** The backend will periodically (every 24h) fetch and index the complete list of available tickers from the configured exchanges into a local SQLite "Search Index."
- **Expanded Search:** The search UI will query the local index to provide instantaneous results across all exchange symbols.
- **Favorites Management:** 
    - Users can "Favorite" a ticker from the search results.
    - Favorites are persisted in the SQLite database.
- **Multi-Timeframe Data Persistence (ASSETS_TRACKED):**
    - For all "Favorite" tickers, the backend will fetch and store data for the following intervals: **5m, 10m, 15m, 1h, 2h, 4h, 6h, 12h, 1D, 1W, 1M**.
    - **Retention Policy:** Data for all timeframes is kept for 6 months + 1-day buffer. 
    - **Purge Logic:** A background task will run daily to delete records older than the retention window.
- **Dashboard Integration:**
    - The "ASSETS_TRACKED" section on the main dashboard will display the user's favorite tickers.
    - Users can toggle between the different stored timeframes (5m, 1h, 1D, etc.) to view historical performance directly on the dashboard.

## Technical Requirements
- **Database Schema:** 
    - `ticker_index`: Store all available symbols for search.
    - `favorites`: Store user-selected symbols.
    - `market_data_history`: Store time-series data, indexed by `symbol`, `timestamp`, and `interval`.
- **Background Tasks:** 
    - Periodic sync for the `ticker_index`.
    - Multi-interval data fetcher for all assets in the `favorites` table.
    - Daily cleanup task for the 6-month retention policy.
- **API Endpoints:**
    - `GET /api/v1/favorites`: List all favorite tickers with their tracked timeframes.
    - `POST /api/v1/favorites`: Add a ticker to favorites.
    - `DELETE /api/v1/favorites/{symbol}`: Remove a ticker from favorites.

## Acceptance Criteria
- Users can search for any ticker on the exchange.
- Favorite tickers appear in the "ASSETS_TRACKED" dashboard section.
- Historical data for all 11 intervals (5m to 1M) is correctly stored and retrievable.
- Historical data older than 6 months and 1 day is successfully purged daily.

## Out of Scope
- Real-time "Watchlist" alerts/notifications.
- Exporting historical data to external files.