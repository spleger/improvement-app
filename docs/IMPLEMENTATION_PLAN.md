# Implementation Plan: Parallel Feature Execution

This plan organizes the feedback from `MASTER_FEEDBACK.md` into isolated "buckets" that can be executed in parallel with minimal risk of merge conflicts.

> **Execution Strategy**: Each bucket works on a distinct set of files.

---

## Bucket 1: Core Challenge Logic & Schema

**Owner**: Backend/Core Agent
**Files**: `prisma/schema.prisma`, `app/api/challenge/*`, `lib/challenge/*`
**Status**: [ ] Pending

### ⛔ What Not To Do

* **Do Not Break Database Integrity**: Ensure `prisma generate` and `prisma db push` are run immediately after any schema change.
* **Do Not Create Generic Content**: The "Challenge Generator quality bug" is critical. Do not allow the AI to generate single, trivial challenges that just rephrase the goal.
* **Do Not Overwrite Completed Data**: When updating the schema, ensure `Challenge` and `ChallengeTemplate` existing data is preserved (though in dev this is less critical, the valid schema update path must be followed).

### Detailed Tasks

1. **Schema Update**
    * *Requirement*: "Add separate fields: Description (what to do) and Success Criteria (how you know it's complete)" (`MASTER_FEEDBACK.md` Line 20).
    * *Action*: Update `Challenge` and `ChallengeTemplate` models in `prisma/schema.prisma`.
2. **Prompt Engineering**
    * *Requirement*: "Challenge Generator quality bug — Does not create real challenges; only generates one trivial challenge" (`MASTER_FEEDBACK.md` Line 18).
    * *Requirement*: "Tips for Success are generic — Always the same tips regardless of challenge content" (`MASTER_FEEDBACK.md` Line 19).
    * *Action*: Refine `app/api/challenge/generate` prompts to return strict JSON with `description`, `successCriteria`, and dynamic `tips`.
3. **API Logic Fixes**
    * *Requirement*: "Challenge Library 'Generate more with AI' broken" (`MASTER_FEEDBACK.md` Line 17).
    * *Action*: Debug and fix the generation endpoint invocation from the library.

### Verification

* Run `prisma generate` and `prisma db push`.
* Generate 5 manual challenges via API/UI and verify distinct `description` vs `successCriteria`.

---

## Bucket 2: Voice Features & Architecture

**Owner**: Voice/Media Agent
**Files**: `components/VoiceRecorder.tsx`, `app/habits/HabitVoiceLogger.tsx`, `app/api/transcribe/*`
**Status**: [ ] Pending

### ⛔ What Not To Do

* **Do Not shift layout inappropriately**: The habit logger should be a modal/overlay, not inline pushing content down (per `MASTER_FEEDBACK.md` Line 112/179).
* **Do Not Leave "Hanging" States**: Never leave the user without a loading indicator or feedback (Line 25).
* **Do Not Use Third-Party Voice UI Libraries**: Stick to the current custom implementation style unless replacing the core recorder logic with a standardized hook.

### Detailed Tasks

1. **Transcription Fixes**
    * *Requirement*: "Voice Diary transcription empty — Logic runs in background but transcript text box stays empty" (`MASTER_FEEDBACK.md` Line 26).
    * *Requirement*: "Habits Voice Lock transcription broken — Displays 'lots of recording', acts buggy" (`MASTER_FEEDBACK.md` Line 24).
    * *Action*: Debug `VoiceRecorder.tsx` state management and `api/transcribe` response handling.
2. **Process Stability**
    * *Requirement*: "Habits Voice Lock processing hangs — No loading indicator, doesn't complete" (`MASTER_FEEDBACK.md` Line 25).
    * *Action*: Add timeout + error states to `HabitVoiceLogger.tsx`.
3. **UI Polish**
    * *Requirement*: "Habits Voice Lock positioning — Audio interface too low... should be in front of habits" (Jan 28 Feedback).
    * *Action*: Update `HabitVoiceLogger` CSS to be a centered modal/overlay with glassmorphism (semi-transparent).
4. **Voice UI Standardization**
    * *Requirement*: "Pulsing icon... stop and pause buttons" (Jan 28 Feedback).
    * *Action*: Implement consistent UI for both Habits and Diary: Center pulsing icon, plus distinct Stop/Pause controls.

### Verification

* Record a 10s clip. Ensure `transcript` state populates.
* Simulate a network failure/delay to test loading states.

---

## Bucket 3: Expert Chat

**Owner**: Expert Feature Agent
**Files**: `app/expert/ExpertChat.tsx`, `app/expert/page.tsx`
**Status**: [ ] Pending

### ⛔ What Not To Do

* **Do Not Remove Current Styling**: The feedback notes "Expert chat overall design is very nice" (Line 227). Keep the core aesthetic, just fix the layout bugs.
* **Do Not Introduce Tailwind**: Use specific SCSS/CSS modules or standard CSS.
* **Do Not Allow Full Page Scroll**: The "Window not locked to screen" (Line 33) is a critical UX fail. The *chat* should scroll, not the *page*.

### Detailed Tasks

1. **Layout & UX**
    * *Requirement*: "Chat doesn't fill window — Gap at bottom" (`MASTER_FEEDBACK.md` Line 31).
    * *Requirement*: "Input pushes content up" (`MASTER_FEEDBACK.md` Line 32).
    * *Requirement*: "Window not locked to screen — Can move the entire window around" (`MASTER_FEEDBACK.md` Line 33).
    * *Action*: Fix CSS height (use `dvh`?), add `overflow: hidden` to body/container, scrollable chat area.
2. **Styling**
    * *Requirement*: "Send button cut off" (`MASTER_FEEDBACK.md` Line 34).
    * *Requirement*: "Coach selector dropdown too transparent" (`MASTER_FEEDBACK.md` Line 36).
    * *Action*: Adjust padding/margins and background opacity constants.
3. **Suggestions Interface**
    * *Requirement*: "Suggestion prompts stacked vertically... should be single line, swipeable" (`MASTER_FEEDBACK.md` Line 35).
    * *Action*: Implement horizontal scroll container for suggestion chips.
4. **View Issues**
    * *Requirement*: "Black bar at bottom... Top nav overlaps" (Jan 28 Feedback).
    * *Action*: Ensure chat container height calculation includes full viewport minus safe areas, and fix z-index or padding to prevent top nav overlap.
    * *Requirement*: "Coach selector dropdown... spaced properly" (Jan 28 Feedback).
    * *Action*: Use a proper grid layout for the coach selector modal, ensuring full screen width usage.

### Verification

* Open Chat on mobile simulation. Verify keyboard doesn't break layout.
* Scroll through 10+ coach icons (Req Line 37).

---

## Bucket 4: Homepage & Navigation

**Owner**: Frontend Lead Agent
**Files**: `app/page.tsx`, `components/TopNavigation.tsx`, `components/BottomNavigation.tsx`
**Status**: [ ] Pending

### ⛔ What Not To Do

* **Do Not Use Generic Colors**: Avoid plain defaults. Use the existing "teal accents" and gradient styles (`MASTER_FEEDBACK.md` Line 205).
* **Do Not Ignore "Completed" Features**: The feedback mentions "Home Screen Goal/Challenge Display - Nested under parent goals" is completed (Line 218). Ensure we *enhance* this (with individual challenge boxes) rather than replacing it with a list that ignores hierarchy.
* **Do Not Introduce Tailwind**: Use `index.css` or component-specific styles.

### Detailed Tasks

1. **Navigation Logic**
    * *Requirement*: "Navigation bar shifting bug — Clicking 'Progress' causes Habits to disappear" (`MASTER_FEEDBACK.md` Line 12).
    * *Requirement*: "Restructure bottom navigation — New layout: Home | Tracking | Progress | Expert" (`MASTER_FEEDBACK.md` Line 63).
    * *Action*: Rewrite `BottomNavigation.tsx` items array and active state logic.
2. **Home Dashboard**
    * *Requirement*: "Challenges not visible under goals... Need: Summary at top... Individual box for each outstanding challenge" (`MASTER_FEEDBACK.md` Line 52).
    * *Action*: Refactor `app/page.tsx` goal rendering to map `todayChallenges` per goal explicitly.
3. **Branding**
    * *Requirement*: "Top bar branding — Replace 'Transform' text with squirrel logo image and a short motivational quote" (`MASTER_FEEDBACK.md` Line 49).
    * *Action*: Update `TopNavigation.tsx` or `app/page.tsx` header.
4. **Tracking & Menus**
    * *Requirement*: "Icons for the drop-down list are misplaced" (Jan 28 Feedback).
    * *Action*: Fix flex/grid layout in `TopNavigation` dropdown.
    * *Requirement*: "Check-in leads to progress page... wrong icon" (Jan 28 Feedback).
    * *Requirement*: "Check-in leads to progress page... wrong icon" (Jan 28 Feedback).
    * *Action*: Update href to `/check-in` (or proper route) and replace Chart icon with Check-in icon.
    * *Requirement*: "New challenges don't appear after creation" (Jan 28 Feedback).
    * *Action*: Fix state update/revalidation in `app/page.tsx` or `GoalCard` to ensure new challenges appear immediately under the goal. This replaces the old dashboard logic as per `MASTER_FEEDBACK.md` Line 52/57.

### Verification

* Click every nav item in random order 10 times. Ensure no items disappear.
* Verify "Tracking" menu opens and contains: Log Habits, Voice Diary, Check-in.

---

## Bucket 5: Progress, Diary, & Profile Pages

**Owner**: Frontend Secondary Agent
**Files**: `app/progress/page.tsx`, `app/diary/page.tsx`, `app/profile/page.tsx`
**Status**: [ ] Pending

### ⛔ What Not To Do

* **Do Not Break Profile Layout**: Feedback says "Profile page layout, stats... Positive Feedback" (Line 225). Keep the structure, just fix the sliders.
* **Do Not Confuse Navigation Naming**: Fix the "Dashboard" vs "Home" inconsistency (Line 106).
* **Do Not Use Browser Defaults**: Specifically for confirmation modals (Line 133) - though this is a "Design Polish" item, it applies here if touching delete/settings buttons.

### Detailed Tasks

1. **Progress Page**
    * *Requirement*: "Calendar direction confusing — Bottom-right to top-left feels unnatural" (`MASTER_FEEDBACK.md` Line 75).
    * *Action*: Fix flex-direction/grid order in calendar component.
    * *Requirement*: "No date connection — Can't tell when progress started" (`MASTER_FEEDBACK.md` Line 76).
2. **Diary UI**
    * *Requirement*: "Insights numbers broken — Numbers below insights don't do anything" (`MASTER_FEEDBACK.md` Line 41).
    * *Action*: Wire up or hide broken stats.
    * *Requirement*: "Entries need boxing" (`MASTER_FEEDBACK.md` Line 82).
3. **Profile**
    * *Requirement*: "Challenge sliders too squished" (`MASTER_FEEDBACK.md` Line 86).
    * *Action*: Increase padding/width for slider containers.
4. **Progress Graphs**
    * *Requirement*: "Mood and energy trends... doesn't really graph anything" (Jan 28 Feedback).
    * *Action*: Fix the Recharts data mapping for the mood/energy graph to properly plot lines.

### Verification

* Visually inspect Progress calendar for standard LTR/Top-Down reading order.
* Verify "Insights" matches actual data.
