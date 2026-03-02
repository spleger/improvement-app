# Master Feedback & Improvement Checklist

> **Last Updated**: March 2, 2026

---

## Mar 2 - Feedback (Round 2)

### Bugs

- [ ] **Diary Voice Transcript Still Not Capturing** -- SpeechRecognition fix may not work on mobile Chrome (deployed). Needs server-side Whisper fallback.
- [ ] **Live Voice Chat Responses Too Long** -- AI gives very long responses; should be 2-3 sentences max for live conversational flow.
- [ ] **Live Voice Chat Slow TTS Start** -- 5-10+ seconds before voice starts after AI responds.

### UI/UX

- [ ] **Challenge Completion Sliders Too Small** -- Difficulty/satisfaction sliders on challenge complete screen are tiny on mobile; needs larger track and thumb.
- [ ] **Daily Check-in Slider Not Smooth** -- Energy/motivation sliders snap to discrete steps; should slide continuously with a visible track.
- [ ] **Live Voice Chat UI Broken on Mobile** -- Layout overlap issues visible in screenshot.

---

## Mar 2 - Feedback (Round 1) - Addressed

- [x] **Progress Trends Graph Broken** -- Fixed: explicit 300px height for ResponsiveContainer.
- [x] **Diary Voice Recording Broken** -- Fixed: SpeechRecognition init moved to mount-once. (Still broken on mobile -- see Round 2.)
- [x] **Live Voice Mode Not Accessible** -- Fixed: added entry points in Expert Chat header and AI Conversation selector.
- [x] **Bottom Nav Active State Too Subtle** -- Fixed: background highlight + underline.
- [x] **Settings Accessibility** -- Fixed: gear icon added to top nav bar.

---

## Feb 7 - New Feedback (Prioritized)

### 🔴 Critical / Deployment

- [x] **Fix Deployment Failure** — `DailyChallengeLoader` missing from build (Done: Added to git).

### Settings & User Preferences

- [x] **Challenge Settings UI** -- Sliders enlarged (36px thumb, 12px track). Settings now accessible via gear icon.
- [x] **Duplicate Personality Setting** -- Removed in plan 02.
- [ ] **Voice Selection** -- Voice selection UI exists but may not save correctly on all platforms.

### Expert Chat / Goal Logic

- [x] **Goal-less Challenges** -- Implemented in plan 03 (Daily Growth section on dashboard).

---

## Jan 29 Outstanding Issues (Previous)

### AI & Backend Core

- [x] **Daily Challenge Rotation** -- DailyChallengeLoader auto-generates per goal (plan 01). Old challenges filtered by scheduledDate.
- [x] **Fix New Challenges Nesting** -- Challenges display nested under goals on dashboard.
- [x] **AI Context** -- All active goals now included via allActiveGoals[] in UserContext.

### Voice & Chat UI

- [x] **Habit Log Overlay** -- Uses createPortal with position:fixed overlay.
- [x] **Voice Finish Interaction** -- Pulsing mic clickable to stop recording.
- [x] **Chat Interface** --
  - [x] Fix auto-scroll (does not scroll during generation).
  - [x] Hide keyboard after sending (input.blur() in finally).
  - [x] Maximize text space (plan 05 polish).
- [x] **Live Voice Chat** -- Implemented (plan 06). Entry points in Expert Chat header and AI Conversation selector.

### Progress & Navigation

- [x] **Bottom Nav Tracking** -- Dropdown functional with pills. Active state enhanced with highlight + underline.
- [x] **Progress Page Redesign** --
  - [x] 30-day view with goal dropdown selector (plan 04).
  - [x] Mood/Energy Graph with metric selector toggle (plan 04). Chart height fixed.
- [x] **Remove Nav Links** -- Removed in feb7 initial fixes.
