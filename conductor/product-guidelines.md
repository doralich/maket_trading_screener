# Product Guidelines

## Visual Identity & Aesthetic
- **Retro-Future Terminal:** The application will employ a high-tech "hacker" aesthetic. This includes:
    - **Typography:** Predominantly monospaced fonts (e.g., JetBrains Mono, Fira Code) for all data and code elements.
    - **Color Palette:** A dark base with glowing, high-contrast accents (e.g., Matrix green, neon cyan, or deep amber) to highlight interactive elements and status changes.
    - **Layout:** A utilitarian, grid-based layout that prioritizes function and data flow over decorative elements.

## Communication & Prose Style
- **Technical & Precise:** All UI labels, tooltips, and documentation must be clear, concise, and technically accurate.
- **Terminology:** Favor standard industry terms (e.g., "Requesting Ticker Data," "Query Execution: 142ms," "DataFrame Export Successful").
- **Voice:** Professional and objective, acting as a reliable interface between the user and the market data.

## User Experience & Interaction
- **Dynamic Data Density:** The UI must provide toggles for "Compact," "Normal," and "Expanded" views to accommodate different screen sizes and user preferences. Users should be able to hide/show specific data columns easily.
- **Terminal-Style Feedback:** Use high-contrast color shifts (e.g., a momentary glow) for data updates. A dedicated console-style log at the bottom of the screen will provide a history of system actions and data fetches.
- **Seamless Python Integration:** The integrated terminal will be accessible as a slide-out or split-pane overlay, allowing users to quickly write and execute analysis snippets without losing sight of the primary data tables.

## Design Principles
- **Function Over Form:** Every UI element must serve a clear purpose in the screening or analysis workflow.
- **Responsiveness:** Ensure the terminal-style UI feels fast and "lag-free," even when handling large data tables or frequent updates.
- **Personalization:** Save user preferences for data density, visible columns, and layout configurations locally to ensure a consistent experience across sessions.
