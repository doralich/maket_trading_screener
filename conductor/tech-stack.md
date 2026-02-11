# Tech Stack

## Backend
- **Core Language:** Python 3.10+
- **Web Framework:** **FastAPI**
    - Why: Direct compatibility with the `tvscreener` library, high performance, and native asynchronous support.
- **Market Data Library:** `tvscreener` (unofficial TradingView Python library)
- **Data Manipulation:** **Pandas**
    - Why: The industry standard for handling dataframes and performing quantitative analysis.
- **Communication:** **WebSockets**
    - Why: Low-latency, bidirectional communication for real-time market updates.

## Frontend
- **Framework:** **React**
    - Why: Component-based architecture ideal for dynamic dashboards and interactive data tables.
- **State Management:** React Context API or Redux Toolkit
- **UI Components:** 
    - **Tailwind CSS:** For efficient styling and implementing the custom Terminal aesthetic.
    - **Xterm.js:** To provide the integrated, high-performance terminal experience.
- **Charts/Visualization:** Lightweight Charts (TradingView) or Recharts.

## Data Persistence & Management
- **Local Database:** **SQLite** with **SQLModel** (SQLAlchemy + Pydantic)
    - Why: Zero-configuration, type-safe, file-based database perfect for storing user preferences, saved queries, and presets locally.
- **Environment Management:** `pip` with `venv` or `poetry`.

## Integrated Analysis Environment
- **Implementation:** **Xterm.js with Backend Shell**
    - Why: Connects the frontend terminal emulator to a persistent Python shell session on the FastAPI backend, reinforcing the retro-future utilitarian aesthetic.

## Data & API Constraints
- **Supported Exchanges:** BINANCE, BYBIT, BITGET, OKX.
- **Asset Scope:** Full exchange indexing (~5,825 pairs).
- **Liquidity Filter:** Minimum 50,000 USD 24h Volume required for inclusion in Top Mover/Loser scans.
