# Specification: Market Top Losers Tab

## Overview
This track implements a "Market Top Losers" section on the main dashboard. It will be integrated as a tabbed interface alongside the existing "Market Top Movers" table, allowing users to quickly switch between the best and worst performers in the crypto market across the "Big Four" exchanges (Binance, Bybit, Bitget, OKX).

## Functional Requirements

### 1. Backend: Top Losers Data Retrieval
- Enhance the `ScreenerService` to support fetching the "bottom" performers (sorted by Change % ascending).
- Ensure the backend correctly queries all ~5,800+ tickers to find the absolute 50 worst performers.
- Update the `/api/v1/screener/top-movers` endpoint or add a new one to allow selecting the sort direction (Top vs. Bottom).

### 2. Frontend: Tabbed Interface
- Replace the static "MARKET_TOP_MOVERS" header with a tabbed navigation system.
- Tabs: `[ TOP_MOVERS ]` and `[ TOP_LOSERS ]`.
- Active tab state must be maintained in `App.tsx`.
- The styling of the tabs must match the retro-terminal aesthetic.

### 3. Frontend: Unified Filtering & Technical Indicators
- The existing filter dashboard (Exchange buttons, RSI/SMA/MACD filters) must remain global and apply to whichever tab is currently active.
- The "Top Losers" table must share the exact same styling, column definitions (Price, Volume, Change %, Indicators), and interactive "Help Notes" as the "Top Movers" table.

### 4. Real-time Integration
- Ensure that switching to the "Top Losers" tab triggers immediate data synchronization.
- Maintain live updates (WebSocket or 10s polling) for the active tab to ensure prices remain high-precision.

## Acceptance Criteria
- User can toggle between "Top Movers" and "Top Losers" with a single click.
- "Top Losers" correctly displays the 50 tickers with the largest negative price change across the Big Four exchanges.
- UI layout remains stable and aligned when switching tabs.
- All technical indicator help popups and color-coded logic work identically in both views.

## Technical Discovery & Root Cause
- **Issue**: BTC/ETH appearing in 'Top Losers'.
- **Root Cause**: 
    1. The background polling task was hardcoded to `sort=desc`, overwriting any manual loser requests with gainers during the next 10s refresh cycle.
    2. Frontend `CryptoTable` was defaulting to local `desc` sorting, which placed assets with the 'highest' value (least negative) at the top of the loser list.
    3. The volume filter (10k) was too low, allowing illiquid 'glitch' pairs to occasionally interfere.
- **Fix**: Centralize sort state in `App.tsx`, ensure polling respects active sort, and increase volume floor to 50k USD.
