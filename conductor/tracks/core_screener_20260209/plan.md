# Implementation Plan: Core Crypto Screener & Terminal UI

## Phase 1: Foundation & Backend Setup
- [x] Task: Project Scaffolding (4215321)
    - [x] Initialize FastAPI project structure (4215321)
    - [x] Configure `pip` virtual environment and install dependencies (4215321) (`fastapi`, `uvicorn`, `tvscreener`, `pandas`)
- [ ] Task: tvscreener Integration
    - [ ] Implement a service to fetch top-moving crypto assets using `tvscreener`
    - [ ] Create an endpoint for ticker search and data retrieval
- [ ] Task: WebSocket Server Implementation
    - [ ] Implement a WebSocket endpoint in FastAPI to broadcast market updates
    - [ ] Add basic periodic polling logic to push updates to connected clients
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Foundation & Backend Setup' (Protocol in workflow.md)

## Phase 2: Frontend & Terminal UI
- [ ] Task: React Dashboard Scaffolding
    - [ ] Initialize React project with Tailwind CSS
    - [ ] Implement the "Retro-Future Terminal" base layout (dark mode, monospaced fonts)
- [ ] Task: WebSocket Client Integration
    - [ ] Implement a WebSocket client in React to receive market data updates
    - [ ] Establish connection and handle data reception
- [ ] Task: Interactive Data Table
    - [ ] Build the main data table component to display crypto tickers and performance
    - [ ] Implement color-coded highlights for price changes
- [ ] Task: Xterm.js Console Log
    - [ ] Integrate Xterm.js to display a system log of data fetches and status updates
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Frontend & Terminal UI' (Protocol in workflow.md)

## Phase 3: Integration & Refinement
- [ ] Task: End-to-End Integration
    - [ ] Verify search functionality from UI to Backend
    - [ ] Ensure all real-time updates flow correctly through the dashboard
- [ ] Task: Style Polish
    - [ ] Refine "Retro-Future" aesthetic (glow effects, padding, typography)
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Integration & Refinement' (Protocol in workflow.md)
