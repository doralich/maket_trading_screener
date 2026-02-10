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
- **Cryptocurrencies:** Focus on high-liquidity assets (Top 1500 by Market Cap) from major Centralized Exchanges (CEX): **Binance, Bybit, and Bitget**. Support includes both Spot and Perpetual contracts.
