# Implementation Plan - Fix Top Losers Data Shifting Bug

## Phase 1: Diagnosis and Reproduction
- [x] Task: Create a reproduction test case that simulates the data update interval and checks for value polarity shifts. [commit: 3566bd5]
    - [x] Create `tests/test_top_losers_flicker.py` [commit: 3566bd5]
    - [x] Implement a test that mocks the data feed with mixed positive and negative values and asserts that only negative values persist in the "Top Losers" output over multiple updates. [commit: 3566bd5]
- [x] Task: Analyze `backend/app/services/screener.py` (and related files) to identify the specific sorting/filtering logic that allows positive values to slip through. [commit: N/A - Analysis performed]
- [x] Task: Conductor - User Manual Verification 'Phase 1: Diagnosis and Reproduction' (Protocol in workflow.md) [checkpoint: bfbe17f]

## Phase 2: Fix Implementation
- [~] Task: Implement the fix in the sorting/filtering logic.
    - [ ] Update the service method to strictly enforce `change < 0` for the Top Losers list.
    - [ ] Ensure the fix handles edge cases (e.g., 0.00 change, very small positive numbers).
- [ ] Task: Update the reproduction test to verify the fix.
    - [ ] Run the test from Phase 1 and ensure it now passes consistently.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Fix Implementation' (Protocol in workflow.md)

## Phase 3: Final Verification and Cleanup
- [ ] Task: Perform a comprehensive manual verification (Visual Check) as per the specification.
    - [ ] Start the application.
    - [ ] Open the "Top Losers" tab.
    - [ ] Observe for 5-10 update cycles (approx. 1 minute) to ensure no positive values appear.
- [ ] Task: Ensure no regression in "Top Movers" (Gainers) tab.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Final Verification and Cleanup' (Protocol in workflow.md)
