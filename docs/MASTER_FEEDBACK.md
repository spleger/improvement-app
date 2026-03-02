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

- [ ] **Challenge Settings UI** —
  - Sliders and numbers ("challenges per day") are hard to see/read.
  - Preference options lack outlines/boxing (need clear visual containers).
- [ ] **Duplicate Personality Setting** — Remove the duplicate "AI Personality". Keep the one with "Tough Love, Science-based" options.
- [ ] **Voice Selection** — User cannot select different voices (broken or not saving).

### Expert Chat / Goal Logic

- [ ] **Goal-less Challenges** — Challenges proposed by AI (or created without a goal) do not appear on the dashboard.
  - Need a "General Challenges" or "Other Challenges" bucket on the homepage for these orphaned items.

---

## Jan 29 Outstanding Issues (Previous)

### AI & Backend Core

- [ ] **Daily Challenge Rotation** — Challenges should reset daily (old ones disappear, new ones active).
- [ ] **Fix New Challenges Nesting** — Newly created challenges do not appear nested under the goal (Dashboard bug).
- [ ] **AI Context** — Expert/Check-in AI only knows one goal; must have context of ALL goals.

### Voice & Chat UI

- [ ] **Habit Log Overlay** — Still opens below content; MUST open *over* page (modal/overlay).
- [ ] **Voice Finish Interaction** — Pulsing mic should be clickable to finish recording.
- [ ] **Chat Interface** —
  - [ ] Fix auto-scroll (should NOT scroll to bottom on generation).
  - [ ] Hide keyboard after sending.
  - [ ] Maximize text space (hide coach icon, user icon, use full width).
- [ ] **Live Voice Chat** — New feature: "Talk to AI" button, floating pulsing UI, near-instant streaming response.

### Progress & Navigation

- [ ] **Bottom Nav Tracking** — Dropdown is broken/missing functional items from top bar. Needs styling (pills, spacing).
- [ ] **Progress Page Redesign** —
  - [ ] 30-day view: One goal selected (dropdown), clear markers.
  - [ ] Mood/Energy Graph: One goal selected, curved lines, toggle for mood/energy/motivation.
- [ ] **Remove Nav Links** — Remove "Daily Check-in" and "Home" links from bottom of Progress page.

... (Items from Jan 29 that are marked 'Done' in previous list will remain checked or removed if confirmed deployed).
