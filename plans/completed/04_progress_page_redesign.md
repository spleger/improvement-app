# Implementation Plan - Progress Page Redesign

This plan implements feedback from Jan 29, specifically addressing the "overwhelming" progress page.

## User Review Required

> [!NOTE]
> **Logic Change**: The calendar and chart will now default to showing data for the **first active goal** and **Mood** respectively. Users must use dropdowns to see other goals or metrics.

## Proposed Changes

### UI & Layout (`app/progress/page.tsx`)

#### 1. Goal Selection

- Introduce `selectedGoalId` state (default: first active goal).
- Add a **Goal Selector** (Dropdown or Tabs) at the top of the "Calendar" and "Progress by Goal" sections.
- **Calendar Filtering**:
  - Only show completion dots/status for the `selectedGoalId`.
  - If `selectedGoalId` is "All" (optional, but feedback suggests explicit selection), show all (maybe keep "All" as an option but default to specific?).
  - *Decision*: Default to first goal. Allow "All" if user wants the "overwhelming" view back, but feedback says "one goal is pre-chosen". So default = single goal.

#### 2. Metric Selection (Trends)

- Introduce `selectedMetric` state (default: 'mood').
- Options: 'Mood', 'Energy', 'Motivation'.
- **Chart Filtering**:
  - Pass only the selected metric to `MoodEnergyChart`.
  - Update chart title dynamic based on selection.

#### 3. Simplified Calendar

- Remove the clutter of 5 different goal colors if filtered.
- Show clear daily status for the *selected* goal.

#### 4. Navigation Cleanup

- Ensure no redundant "Home" or "Check-in" buttons exist at the bottom of the page content. (Already verified as likely clean, but will double check).

### Components (`components/Charts.tsx`)

- Update `MoodEnergyChart` to handle single-metric display cleanly (auto-color based on metric type).

## Verification Plan

### Manual Verification

1. **Goal Selector**:
    - Switch between goals.
    - Verify calendar dots update to reflect *only* that goal's history.
2. **Metric Selector**:
    - Switch between Mood/Energy/Motivation.
    - Verify chart updates to show single line/curve.
3. **Default State**:
    - Verify page loads with 1st goal selected (not "All").
    - Verify page loads with Mood selected.
