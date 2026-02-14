# Specification: Fix Top Losers Data Shifting Bug

## 1. Overview
users have reported an issue in the "Top Losers" section (specifically the dedicated tab) where the displayed data flickers or shifts from negative gains (-gains) to positive gains (+gains) rapidly. This behavior appears to be correlated with data update intervals. The goal of this track is to identify the root cause of this logic failure and apply a fix to ensure stable and accurate data display.

## 2. Problem Description
- **Symptoms:** Data in the Top Losers tab flickers instantaneously, showing positive gains instead of the expected negative gains.
- **Scope:** Confined to the Dedicated Top Losers tab.
- **Triggers:** Correlated with the system's data update intervals.
- **Impact:** Misleading market data decreases user trust and usability of the screener.

## 3. Functional Requirements
- **Root Cause Analysis:** Investigate the data fetching, processing, and rendering logic for the Top Losers tab to identify why positive values are leaking into the negative gain filter or display.
- **Data Stability:** Ensure that the Top Losers list consistently displays only assets with negative 24h change values (or the specific time interval selected).
- **Correct Sorting:** Verify that the sorting logic correctly prioritizes the biggest losers (most negative values) and does not mix in gainers.
- **Filter Enforcement:** Implement or reinforce strict filtering to exclude any asset with a positive change from the Top Losers view.

## 4. Acceptance Criteria
- [ ] The "Top Losers" tab displays only assets with negative percentage changes.
- [ ] The data no longer flickers or shifts polarity (negative to positive) during update cycles.
- [ ] Visual verification confirms stability during multiple update intervals.

## 5. Out of Scope
- Changes to the "Top Movers" (Gainers) tab, unless they share the exact same broken shared logic.
- UI redesigns beyond what is necessary to fix the data display issue.
