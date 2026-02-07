# Implementation Plan - Daily Challenge Auto-Generation

## Goal Description

Ensure that every day, there is a new challenge for **every single goal**. If a goal does not have a challenge for "Today", one should be automatically generated.

## User Logic
>
> "Every day there should be a new challenge for every single goal, and it should show up underneath that goal."

## Proposed Changes

### 1. Create Challenge Loader Component

#### [NEW] [DailyChallengeLoader.tsx](file:///c:/Users/spleg/IdeaProjects/ImprovementApp/app/components/DailyChallengeLoader.tsx)

A client-side component that handles the check and generation process.

- **Props**: `goalId`, `userId`, `goalTitle`.
- **Behavior**:
    1. On mount, calls the API (`/api/challenges/generate`) for the specific `goalId`.
    2. Displays a small loading state (e.g., "Generating daily challenge for [Goal]...").
    3. On success, calls `router.refresh()` to reload the server components and show the new challenge.
    4. Handles errors gracefully (maybe a retry button).

### 2. Modify Dashboard to Trigger Generation

#### [MODIFY] [page.tsx](file:///c:/Users/spleg/IdeaProjects/ImprovementApp/app/page.tsx)

- **Logic**:
  - Iterate through `activeGoals`.
  - For each goal, check if `goalChallenges` (filtered for today) is empty.
  - If empty, render `<DailyChallengeLoader />` for that goal.
  - Note: This might cause multiple concurrent API calls if multiple goals are missing challenges. This is acceptable for now but should be monitored. A more robust solution might be a single "Day Start" sync, but client-side per-goal loading allows for immediate feedback and progressive loading.

## Verification Plan

### Manual Verification

1. **Setup**:
    - Log in as a user with active goals.
    - Ensure at least one goal has NO challenges for today (delete manually if needed via DB or restart with clean data).
2. **Execution**:
    - Navigate to Dashboard (`/`).
3. **Validation**:
    - Observe the specific goal section.
    - Verify "Generating daily challenge..." message/spinner appears.
    - Verify page refreshes automatically.
    - Verify a new challenge appears under the goal.
    - Verify other goals with existing challenges DO NOT trigger generation.
