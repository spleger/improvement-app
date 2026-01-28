# Implementation Plan: Jan 28 UI/UX Fixes

This plan addresses **only** the urgent feedback provided on Jan 28, 2026.
Focus: Visual polish, navigation fixes, and voice feature standardization.

> **Execution Strategy**: Buckets are isolated by feature/file to allow parallel work.

---

## Bucket 1: Dashboard & Navigation

**Files**: `app/page.tsx`, `components/TopNavigation.tsx`, `components/BottomNavigation.tsx`, `components/GoalCard.tsx`

### ⛔ What Not To Do

* **Do Not Use Generic Colors**: Stick to the app's teal/glassmorphism aesthetic.
* **Do Not Break Existing Links**: Ensure other dropdown items (Habits, Voice Diary) remain functional when fixing the layout.

### Tasks

1. **Dashboard: Fix Challenge Visibility**
    * *Issue*: "New challenges do not show up... Old ones seem to do."
    * *Fix*: Investigate `app/page.tsx` or `GoalCard` state updates. Ensure that after the creation flow, the list invalidates/refreshes safely so the new item appears immediately under the goal.
2. **Navigation: Dropdown Layout**
    * *Issue*: "Icons for the drop-down list are misplaced... voice diary one is to the right of log habits."
    * *Fix*: Apply proper flex-direction (column) or grid layout to the Dropdown container in `TopNavigation.tsx` so items stack correctly.
3. **Navigation: Check-in Item**
    * *Issue*: "Check-in leads to progress page... wrong icon."
    * *Fix*:
        * Change Link href to `/check-in` (or the correct route for "Daily Check-in").
        * Replace the Chart icon with a Check/Clipboard icon.

### Verification

* Create a new challenge -> Verify it appears instantly.
* Open Top Dropdown -> Verify 3 items stacked vertically.
* Click "Check-in" -> Verify redirection to Check-in page.

---

## Bucket 2: Voice UI Standardization (Habits & Diary)

**Files**: `app/habits/HabitVoiceLogger.tsx`, `app/diary/VoiceRecorder.tsx`, `components/VoiceRecorder.tsx`

### ⛔ What Not To Do

* **Do Not Layout Inline**: The logger must be a **Modal/Overlay** (Line 112/179 feedback), not an inline block that pushes content down.
* **Do Not Use Native Alerts**: Use custom UI for confirmation if needed.

### Tasks

1. **Habit Log Positioning & Style**
    * *Issue*: "Opens up below all of the habits... should be in front... make it a little bit see-through."
    * *Fix*:
        * Change `HabitVoiceLogger` container to `position: fixed; inset: 0; z-index: 50`.
        * Apply glassmorphism background (`backdrop-filter: blur`, semi-transparent bg).
2. **Standardized Voice Controls**
    * *Issue*: "Pulsing icon... click to finish... but also option to stop and pause."
    * *Fix*:
        * **Center Element**: Large pulsing microphone icon (Tap to Finish/Stop).
        * **Bottom Controls**: Warning/Secondary buttons for "Pause" and "Cancel/Stop".
        * Apply this exact layout to both `Habits` and `Voice Diary` for consistency.

### Verification

* Open Habit Log -> Verify it overlays everything (glass effect).
* Record -> Pulse animation active.
* Check controls -> Pause/Stop are accessible.

---

## Bucket 3: Expert Chat Improvements

**Files**: `app/expert/ExpertChat.tsx`, `app/expert/page.tsx`

### ⛔ What Not To Do

* **Do Not Scroll the Whole Page**: The page body should be locked. Only the *chat messages* list should scroll.
* **Do Not Hide Inputs**: Ensure the keyboard doesn't cover the input field.

### Tasks

1. **Viewport & Layout**
    * *Issue*: "Black bar at bottom... Top nav overlaps."
    * *Fix*:
        * Calculate height dynamically (e.g., `100dvh` - nav height).
        * Fix `z-index` so Top Nav doesn't visually cut off the chat container, or add `padding-top` to the chat container.
2. **Coach Selector Modal**
    * *Issue*: "Items... needs to be spaced properly. Consistent... in a grid... using full width."
    * *Fix*:
        * Refactor the Coach Dropdown/Modal to use CSS Grid (`grid-template-columns: repeat(auto-fill, minmax(..., 1fr))`).
        * Ensure the modal container width is `100%` or `90vw`.

### Verification

* Resize window -> Chat connects perfectly to bottom/top navs.
* Open Coach Select -> Verify grid layout occupies full width.

---

## Bucket 4: Progress Page Graphs

**Files**: `app/progress/page.tsx` (and potentially `components/Charts.tsx` if separated)

### ⛔ What Not To Do

* **Do Not Remove "Last 30 Days" Grid**: Only fix the Mood/Energy graph requested.

### Tasks

1. **Mood & Energy Graph**
    * *Issue*: "Doesn't really graph anything, it's just like three different lines at the very bottom."
    * *Fix*:
        * Check the data scale (0-10 vs 0-100). If data is 0-10 but domain is 100, lines will be flat at bottom.
        * Verify `Recharts` mapping (X-axis: Date, Y-axis: Value).

### Verification

* Check Progress page -> Graph should show visible fluctuation line.
