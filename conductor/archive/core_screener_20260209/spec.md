# Specification: Core Crypto Screener & Terminal UI

## Overview
This track focuses on delivering the foundational components of the TradingView local browser app, specifically targeting the cryptocurrency market. It involves setting up a robust backend to fetch market data and a high-aesthetic frontend to display it.

## Functional Requirements
- **Crypto Data Integration:** Implement backend logic using the `tvscreener` library to fetch top movers and search for specific crypto tickers (e.g., BTCUSD).
- **Real-time Updates:** Establish a WebSocket-based communication layer to push price and performance updates from the FastAPI backend to the React frontend.
- **Terminal-Style Dashboard:** Create a React-based UI featuring a "Retro-Future Terminal" aesthetic.
- **Interactive Data Table:** Display fetched crypto data in a sortable, filterable table with color-coded price movements.
- **Basic Search:** Allow users to input a crypto ticker to add it to their local view.

## Technical Requirements
- **Backend:** FastAPI for the API and WebSocket server, Python 3.10+, integration with `tvscreener`.
- **Frontend:** React with Tailwind CSS for styling and Xterm.js for the terminal feedback area.
- **State Management:** Local React state/context for managing the dashboard data.
- **Real-time:** Use `websockets` or FastAPI's built-in WebSocket support.

## Success Criteria
- Backend successfully fetches and processes data from `tvscreener`.
- Frontend displays a data table that updates in real-time via WebSockets.
- The UI adheres to the monospaced, high-contrast terminal aesthetic defined in the product guidelines.
