# Specification: Project Architecture & Development Process Documentation

## Overview
This track focuses on creating comprehensive, structural documentation for the project. It aims to provide a high-level overview of the system's logic and technology stack, specifically tailored for a developer who is new to software engineering. The core deliverable is a Mermaid.js diagram and a conceptual breakdown of the full-stack development lifecycle.

## Functional Requirements

### 1. Structure-Based Diagram (Mermaid.js)
- **Data Flow Analysis**: Visualize the journey of market data from the TradingView API, through the FastAPI backend, into the SQLite database, and eventually to the React frontend via WebSockets/REST.
- **Component Hierarchy**: Map the relationship between frontend components (App, CryptoTable, UniversalSearch, SystemConsole).
- **Service Logic**: Explicitly define the roles of `ScreenerService`, `CollectorService`, and `IndexerService`.
- **Infrastructure**: Document the orchestration handled by `start.sh` (Venv, Node modules, Process management).

### 2. High-Level Development Process Guide
- **Full-Stack Lifecycle Breakdown**: Explain the technical sequence of a feature implementation (Database -> Backend Service -> API Endpoint -> Frontend State -> UI Component).
- **Educational Annotations**: Use clear, newcomer-friendly terminology to explain "why" each technology (FastAPI, SQLModel, React, Vite) was chosen.

## Non-Functional Requirements
- **Maintainability**: The diagram must be in text-based Mermaid.js format to allow for easy updates as the project evolves.
- **Visual Clarity**: Use grouping and color-coding in the diagram to distinguish between Frontend, Backend, and Database layers.

## Acceptance Criteria
- A new file `docs/ARCHITECTURE.md` is created containing the Mermaid diagram and the lifecycle guide.
- The diagram correctly identifies the 5-second polling/websocket synchronization logic.
- The developer process guide clearly illustrates the flow of data for a single technical change.

## Out of Scope
- Detailed low-level code documentation (docstrings handle this).
- Performance benchmarking or stress test results.
