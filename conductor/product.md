# Initial Concept
I want to build a local browser based app based on the link: https://github.com/deepentropy/tvscreener?tab=readme-ov-file

## Product Definition

### Target Users
- **Retail Traders & Investors:** Individuals looking for a personalized, local tool to screen cryptocurrencies using TradingView data without complex setups.
- **Quantitative Analysts:** Professionals who need to perform local data analysis using Pandas and want a UI to quickly visualize results or build queries.

### Core Features
- **Real-time Data Visualization:** Interactive charts and tables that update as market data changes, specifically focused on the crypto market.
- **Custom Query Builder:** A user-friendly interface to select crypto assets, technical indicators, and filter conditions (e.g., RSI crossovers, volume spikes).
- **Export and Analysis:** Functionality to export screened data to CSV or open directly in a local Jupyter/Pandas environment for further analysis.

### User Experience & Interaction
- **Dashboard View:** A centralized dashboard for monitoring top crypto movers and saved custom screens.
- **Interactive Data Tables:** Sortable and filterable tables with color-coded ratings and performance indicators mimicking the TradingView UI for intuitive data consumption.
- **Integrated Terminal/Notebook:** A side-by-side view where users can run Python snippets against the fetched screener data immediately to bridge the gap between screening and analysis.

### Project Goals
- **Accessibility:** Provide a simple, local interface to access complex TradingView crypto screener data without needing to write code for every query.
- **Efficiency:** Streamline the workflow from screening assets to performing deep quantitative analysis in a single environment.
- **Customization:** Allow users to save their own custom indicators, presets, and query configurations locally for a personalized trading setup.

### Priority Asset Classes
- **Cryptocurrencies:** Focus on all available assets from the "Big Four" Centralized Exchanges (CEX): **Binance, Bybit, Bitget, and OKX**. 
- **Indexing Strategy:** Instead of limiting to global Market Cap, the system performs a full index of all tickers on supported exchanges (currently ~5,800+ pairs).
- **Contract Support:** Full support for both Spot and USDT Perpetual contracts (.P counterparts).

### Specialized Tools
- **PERSISTED_ASSETS_DETAIL:** A dedicated tracking system for "Favorite" assets that persists 6 months of historical data locally across multiple timeframes.
- **Embedded Indicator Documentation:** Interactive terminal-style "Help Notes" providing technical definitions for MACD and SMA directly within the data tables.
- **Real-time RSI Divergence Logic:** A hybrid engine capable of identifying bullish/bearish divergences using both instant API checks and sophisticated 50-candle pivot analysis.
- **Market-Wide Top Movers & Losers:** A dual-tabbed real-time scanner that identifies the absolute top 50 gainers and bottom 50 losers from the entire ~5,800+ ticker catalog.

### Technical Implementation Details
- **True Market Sorting:** To identify genuine losers, sorting is performed server-side (TradingView API) rather than locally. This ensures the results are drawn from the full market universe rather than just the currently loaded subset.
- **Liquidity Protection:** A global 50,000 USD (24h) volume floor is applied to all "Top" queries to filter out illiquid pairs and price glitches, ensuring only active, tradable assets are displayed.
- **Interval Mapping:** Uses precise `change|X` API fields for rolling intraday performance tracking (1m, 5m, 15m, 1h, 4h) to maintain consistency with standard technical analysis candles.
