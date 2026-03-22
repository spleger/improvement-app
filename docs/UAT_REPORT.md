# User Acceptance Test Report - Grow Daily (Improvement App)

**Date:** 2026-03-22
**Tester:** Claude (Automated UAT via Playwright)
**Environment:** localhost:3000 (Next.js dev server)
**Viewport tested:** Mobile (390x844) + Desktop (1280x800)
**Branch:** feature/v2
**App Version:** Demo mode login

---

## Executive Summary

The Grow Daily app is a well-designed, feature-rich PWA for goal transformation and personal development. The dark theme with teal accents provides a modern, cohesive look. Most pages function correctly with clean layouts. However, **17 issues** were identified across design, functionality, and UX categories.

**Critical:** 1 | **High:** 4 | **Medium:** 7 | **Low:** 5

---

## Issues Found

### CRITICAL

#### C1: System prompt leaks into Expert Chat user messages
- **Page:** `/expert`
- **Description:** Every user message in the chat displays the internal system instruction prefix: `[LIVE VOICE MODE - 2-3 sentences max. Be brief and conversational, like a real voice conversation. No lists or formatting.]` before the actual user text. This exposes internal AI configuration to the end user.
- **Impact:** Users see confusing technical prefixes in their own chat messages. On desktop the full prompt is highly visible as a single-line teal bubble.
- **Screenshot:** `uat-screenshots/18-expert-chat.png`, `uat-screenshots/29-desktop-expert.png`
- **Fix:** Strip the `[LIVE VOICE MODE...]` prefix from displayed user messages in the chat history. The prefix should only be sent to the AI API, not stored/displayed.

---

### HIGH

#### H1: Top and bottom navigation visible on unauthenticated pages
- **Pages:** `/login`, `/register`
- **Description:** The top navigation (Profile, Logo, Settings) and bottom navigation (Home, Tracking, Progress, Expert) are fully visible and clickable on the login and register pages. Users who are not logged in should not see app navigation that leads to authenticated routes.
- **Impact:** Clicking nav links from login/register redirects back to login, creating a confusing loop. Exposes app structure to unauthenticated users.
- **Screenshot:** `uat-screenshots/01-login-page.png`, `uat-screenshots/27-register-page.png`
- **Fix:** Conditionally hide TopNavigation and BottomNavigation on `/login`, `/register`, and `/onboarding` routes.

#### H2: Text wraps mid-word on Create Goal domain cards
- **Page:** `/goals/new`
- **Description:** The 2-column grid for domain selection causes long category names to break mid-word:
  - "Languages" wraps to "Language" + "s"
  - "Relationships" wraps to "Relationsh" + "ips"
- **Impact:** Looks broken and unprofessional. Affects first impression during goal creation.
- **Screenshot:** `uat-screenshots/23-create-goal.png`
- **Fix:** Either use a 3-column grid (like Challenge Library does successfully), or add `word-break: keep-all` / `overflow-wrap: normal` to the domain card titles, or reduce font size for longer labels.

#### H3: "COMPLETION RATE" text wraps mid-word in Progress pillar card
- **Page:** `/progress` (desktop)
- **Description:** On desktop viewport, the Goals pillar card label "COMPLETION RATE" wraps as "COMPL ETION / RATE", splitting the word "COMPLETION" across lines.
- **Impact:** Looks broken on wider viewports where the pillar cards have fixed widths.
- **Screenshot:** `uat-screenshots/30-desktop-progress.png`
- **Fix:** Use `white-space: nowrap` on pillar stat labels, or reduce font size, or abbreviate to "Completion".

#### H4: Settings page throws 400 error on `/api/settings`
- **Page:** `/settings`
- **Description:** Console shows `GET /api/settings` returns 400 Bad Request when loading the settings page in demo mode.
- **Impact:** Settings may not load saved preferences for demo users. The page still renders but with default values.
- **Fix:** Ensure the settings API handles demo mode users gracefully.

---

### MEDIUM

#### M1: Bottom nav active state missing on Check-in/Survey page
- **Page:** `/survey`
- **Description:** When on the Survey/Check-in page (accessed via Tracking submenu), the "TRACKING" label is not highlighted in the bottom nav. "HOME" appears active instead.
- **Impact:** User loses navigation context -- unclear which section they are in.
- **Fix:** Add `/survey` to the list of paths that activate the "Tracking" nav item.

#### M2: Diary insights show duplicate themes with different casing
- **Page:** `/diary`
- **Description:** Common Themes section shows both "#Positivity (2)" and "#positivity (2)" as separate entries. These should be merged case-insensitively.
- **Impact:** Inflates theme count and looks inconsistent.
- **Screenshot:** `uat-screenshots/11-diary-bottom.png`
- **Fix:** Normalize theme casing (e.g., lowercase) before aggregation.

#### M3: "Create Habit" button text wraps to two lines
- **Page:** `/habits` (Create Habit modal)
- **Description:** The "Create Habit" button at the bottom of the modal splits "Create" and "Habit" onto separate lines due to limited button width.
- **Screenshot:** `uat-screenshots/09-create-habit-modal.png`
- **Fix:** Increase button min-width or use `white-space: nowrap`.

#### M4: Goal name text overflow in Progress by Goal section (mobile)
- **Page:** `/progress` (mobile)
- **Description:** "emotional stability (Lev..." truncates awkwardly mid-word in the Progress by Goal cards on mobile viewport.
- **Screenshot:** `uat-screenshots/15-progress-page.png`
- **Fix:** Use proper text ellipsis with `text-overflow: ellipsis` at word boundaries, or allow text to wrap to a second line.

#### M5: "learn german (Level 2)" wraps awkwardly on Profile page
- **Page:** `/profile`
- **Description:** In the goals list, "learn german (Level 2)" wraps so "(Level" is on one line and "2)" on the next.
- **Screenshot:** `uat-screenshots/20-profile-page.png`
- **Fix:** Use `white-space: nowrap` for the level suffix, or reduce font size for long goal names.

#### M6: Tracking submenu dropdown overlaps page content
- **Page:** All pages (bottom navigation)
- **Description:** When clicking "Tracking" in the bottom nav, the dropdown submenu (Daily Habits, Voice Diary, Check-in) appears overlapping the main page content rather than floating above the nav bar cleanly.
- **Screenshot:** `uat-screenshots/07-tracking-submenu.png`
- **Fix:** Position the submenu above the bottom nav bar with proper z-index and negative offset.

#### M7: "Diary Entries" label wraps in Weekly Digest stat card
- **Page:** `/digest`
- **Description:** In the "Week at a Glance" grid, "Diary Entries" wraps to two lines inside the stat card, making it look cramped compared to single-line labels like "Energy" and "Streak".
- **Screenshot:** `uat-screenshots/17-digest-bottom.png`
- **Fix:** Abbreviate to "Diary" or "Entries", or increase card min-width.

---

### LOW

#### L1: Missing favicon (404)
- **All pages**
- **Description:** Console shows `GET /favicon.ico` returns 404. No favicon is configured.
- **Fix:** Add a favicon.ico to the `/public` directory (or reference the PWA icon).

#### L2: Desktop layout lacks optimization
- **All pages (desktop)**
- **Description:** On desktop (1280px), the app renders as a stretched mobile layout with a max-width container and large dark margins. The bottom tab bar persists on desktop where a sidebar or top nav would be more appropriate.
- **Impact:** Not a bug per se (this is a mobile-first PWA), but the desktop experience feels underutilized.
- **Screenshot:** `uat-screenshots/28-desktop-dashboard.png`
- **Recommendation:** Consider adding a sidebar navigation for viewports > 768px and using a 2-column layout for the dashboard.

#### L3: Challenge History cards have verbose multi-line titles
- **Page:** `/challenges`
- **Description:** Challenge titles like "Enhance Vocabulary through Physical Activity" span 4 lines in the list cards, making the list feel cramped.
- **Screenshot:** `uat-screenshots/24-challenge-history.png`
- **Recommendation:** Truncate titles to 2 lines with ellipsis in the list view.

#### L4: Input autocomplete warning in console
- **Pages:** `/login`, `/register`
- **Description:** Console shows DOM warning: "Input elements should have autocomplete attributes."
- **Fix:** Add `autoComplete` props to email/password inputs (e.g., `autoComplete="email"`, `autoComplete="current-password"`).

#### L5: Preloaded resource warnings in console
- **Multiple pages**
- **Description:** Console shows warnings about resources being preloaded but not used within a few seconds.
- **Fix:** Review `<link rel="preload">` tags and remove unnecessary preloads.

---

## Pages Tested -- Summary

| Page | Status | Notes |
|------|--------|-------|
| `/login` | PASS (with issues) | H1: Nav visible, L1: favicon, L4: autocomplete |
| `/register` | PASS (with issues) | H1: Nav visible |
| `/` (Dashboard) | PASS | Clean layout, good cards and stats |
| Bottom Navigation | PASS (with issues) | M1: active state missing on /survey, M6: submenu overlap |
| `/goals/new` | FAIL | H2: Mid-word text breaks in domain cards |
| `/challenges` | PASS | Functional, L3: verbose titles |
| `/challenges/[id]` | PASS | Clean detail page, good action buttons |
| `/challenges/browse` | PASS | Well-designed 3-column grid |
| `/habits` | PASS (with issues) | M3: button text wrap |
| `/diary` | PASS (with issues) | M2: duplicate case-sensitive themes |
| `/survey` | PASS (with issues) | M1: nav active state, clean sliders |
| `/progress` | PASS (with issues) | H3: text wrap, M4: truncation |
| `/digest` | PASS (with issues) | M7: label wrap, good AI summary |
| `/expert` | FAIL | C1: System prompt visible in messages |
| `/profile` | PASS (with issues) | M5: text wrap on goal names |
| `/settings` | PASS (with issues) | H4: API 400 error, comprehensive form |
| `/accountability` | PASS | Clean empty state |
| Desktop (1280px) | PASS (with issues) | L2: no desktop optimization, H3: text wrap |

---

## What Works Well

1. **Dark theme with teal accents** -- Cohesive, modern look across all pages
2. **Dashboard layout** -- Rich information density without feeling cluttered
3. **Coach selector grid** -- Beautiful 3D emoji icons in a well-organized grid
4. **Survey sliders** -- Intuitive with emoji anchors and numeric display
5. **Challenge detail pages** -- Clear structure with description, difficulty bar, tips
6. **Progress pillar cards (mobile)** -- Compact and informative
7. **Weekly Digest** -- AI-generated summaries are personalized and useful
8. **Settings page** -- Comprehensive with good UX patterns (toggles, sliders, icon picker)
9. **Card glass design** -- Glassmorphism cards look polished throughout
10. **Habits page** -- Clean progress ring, mini calendar, and FAB placement
11. **Challenge Library** -- 3-column grid handles text well (unlike Create Goal page)
12. **Accountability page** -- Clean empty state with clear CTA

---

## Recommendations (Beyond Bug Fixes)

1. **Priority 1:** Fix C1 (system prompt leak) -- this is user-facing and confusing
2. **Priority 2:** Hide nav on auth pages (H1) -- basic UX expectation
3. **Priority 3:** Fix all text overflow/wrapping issues (H2, H3, M3-M5, M7)
4. **Priority 4:** Normalize theme casing in diary insights (M2)
5. **Consider:** Desktop-optimized layout for wider viewports (L2)
6. **Consider:** Adding `word-break: normal` or `overflow-wrap: break-word` to a global text utility class to prevent mid-word breaks across all pill/badge/label components

---

## Test Artifacts

Screenshots saved in: `uat-screenshots/` (30 screenshots captured)

| File | Description |
|------|-------------|
| 01-login-page.png | Login page initial load |
| 02-login-empty-validation.png | Empty form validation |
| 03-dashboard-top.png | Dashboard full page |
| 04-dashboard-clean.png | Dashboard after dismissing celebration |
| 05-dashboard-bottom.png | Dashboard bottom (stats, achievements, habits) |
| 06-dashboard-mid.png | Dashboard mid (challenges, insights, stats) |
| 07-tracking-submenu.png | Bottom nav tracking dropdown |
| 08-habits-page.png | Habits page with progress ring |
| 09-create-habit-modal.png | Create Habit modal |
| 10-diary-page.png | Voice Diary page |
| 11-diary-bottom.png | Diary insights and themes |
| 12-survey-page.png | Check-in mode selector |
| 13-survey-sliders.png | Survey form with sliders |
| 14-survey-submit.png | Survey submit section |
| 15-progress-page.png | Progress page full (mobile) |
| 16-digest-loading.png | Weekly Digest loading |
| 17-digest-bottom.png | Digest stats and suggestion |
| 18-expert-chat.png | Expert Chat with system prompt leak |
| 19-coach-selector.png | Coach selector grid |
| 20-profile-page.png | Profile page full |
| 21-settings-page.png | Settings page full |
| 22-accountability-page.png | Accountability page (empty state) |
| 23-create-goal.png | Create Goal with text overflow |
| 24-challenge-history.png | Challenge History list |
| 25-challenge-detail.png | Challenge detail page |
| 26-challenge-browser.png | Challenge Library grid |
| 27-register-page.png | Register page |
| 28-desktop-dashboard.png | Desktop dashboard view |
| 29-desktop-expert.png | Desktop Expert Chat (prompt leak) |
| 30-desktop-progress.png | Desktop Progress page |
