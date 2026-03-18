# Browser Test Report -- ImprovementApp (feature/v2)

**Date:** 2026-03-05
**Deployment:** https://improvement-app-git-feature-v2-svens-projects-b7db0455.vercel.app
**Device:** iPhone 14 emulation (390x844)
**Browser:** Chrome (Playwright MCP)
**Tester:** Claude (automated via Playwright MCP)

---

## Executive Summary

The app is functional end-to-end: registration, onboarding, challenge generation, habit tracking, daily check-ins, expert chat, and progress tracking all work. The visual design is clean and modern with good use of gradients, glassmorphism cards, and consistent spacing. However, there are several layout bugs (duplicate bottom navs, content/nav overlap) and one critical functional bug (habit creation fails without a linked goal).

---

## Bug List

### Critical

| # | Bug | Page | Description |
|---|-----|------|-------------|
| 1 | **Habit creation fails when no goal is linked** | /habits | Zod validation error: `goalId: Expected string, received null`. The "No linked goal" dropdown option sends `null` instead of an empty string or omitting the field. Blocks all habit creation unless a goal is selected. Screenshot: `screenshots/14-habit-creation-error.png` |

### High

| # | Bug | Page | Description |
|---|-----|------|-------------|
| 2 | **Duplicate bottom navigation bars** | /profile, /settings, /challenges | Two bottom navs render: one embedded inside the page content (with different items: Home, Progress, Diary, Expert, Profile) and the global BottomNavigation component (Home, Tracking, Progress, Expert). They stack and overlap. Screenshots: `screenshots/25-profile-page.png`, `screenshots/26-settings-page.png`, `screenshots/29-challenge-history.png` |
| 3 | **"How to complete" shows challenge type instead of instructions** | /onboarding (first challenge step) | The "How to complete:" section displays just the word "physical" (the challenge type/category) instead of actual completion instructions. Screenshot: `screenshots/06-onboarding-challenge.png` |
| 4 | **Bottom nav overlaps scrollable content on most pages** | Global | Content at the bottom of pages is hidden behind the fixed bottom nav. Affected: dashboard challenge cards, diary insights section, progress pillar cards, goal creation domain cards. The page needs `padding-bottom` equal to the nav height. |

### Medium

| # | Bug | Page | Description |
|---|-----|------|-------------|
| 5 | **"Skip to Dashboard" button obscured by bottom nav** | /onboarding | The secondary skip action is partially hidden behind the bottom navigation bar on all onboarding steps. Screenshot: `screenshots/04-onboarding-goals.png` |
| 6 | **Tracking submenu renders as plain dropdown** | Global (bottom nav) | The tracking submenu appears as an unstyled dropdown list overlapping page content, rather than styled pill buttons above the nav bar. Screenshot: `screenshots/08-nav-tracking-submenu.png` |
| 7 | **Goal coach name truncated in coach selector** | /expert | "Build a Morning Ro..." is truncated in the goal-specific coach tile. Needs text wrapping or a wider tile. Screenshot: `screenshots/22-coach-selector.png` |
| 8 | **Grammar: "1 days" instead of "1 day"** | /profile | The subtitle reads "1 days on your transformation journey" -- should handle singular/plural. Screenshot: `screenshots/25-profile-page.png` |
| 9 | **Light bottom nav in dark live mode** | /expert/live | The bottom nav remains in light theme while the live voice chat page uses a dark background, creating visual clash. Screenshot: `screenshots/23-live-voice-chat.png` |
| 10 | **Challenge completion modal: satisfaction slider partially cut off** | /challenges/[id] | When the completion modal opens, the second slider (satisfaction) labels "Not happy"/"Very happy" and the score value are not fully visible without scrolling. Screenshot: `screenshots/10-challenge-completion-modal.png` |

### Low

| # | Bug | Page | Description |
|---|-----|------|-------------|
| 11 | **Favicon 404** | Global | `favicon.ico` returns 404, causing a console error on every page load. |
| 12 | **Floating Vercel analytics widget overlaps content** | Global | A small dark circle widget from Vercel appears on the right edge of the viewport, overlapping card content. Visible in all screenshots. |
| 13 | **Quick-start prompt buttons initially disabled then enable** | /expert | The suggestion buttons (e.g., "I'm struggling with motivation") render as disabled for ~2 seconds before enabling. Minor loading state flash. |

---

## Page-by-Page Layout & Design Assessment

### Login Page (/login)
**Rating: 8/10**
- Clean centered form with gradient Sign In button
- Good visual hierarchy (heading, subtitle, form fields, CTA)
- "Try Demo Mode" button is a nice touch for onboarding
- The Vercel analytics widget clips the right edge of the password field area

### Register Page (/register)
**Rating: 8/10**
- Matches login page style, consistent experience
- Password requirements shown inline (6 char minimum)
- Clean form layout

### Onboarding (/onboarding)
**Rating: 7/10**
- AI-generated goal suggestions are personalized and impressive
- Goal cards have good information density (From/To, Why, Difficulty)
- Customization step with editable fields and difficulty slider is well done
- (-) "Skip to Dashboard" hidden behind nav
- (-) "How to complete: physical" is a data display bug
- (-) Bottom nav probably shouldn't show during onboarding at all

### Dashboard (/)
**Rating: 8/10**
- Excellent information density: greeting, progress bar, challenge summary, goals, stats
- Gradient progress bar with counter (0/1, 1/1) is visually appealing
- "All challenges complete!" celebration message works well
- Goal cards with action buttons (checkmark, delete, +Challenge) are intuitive
- Challenge cards with difficulty badges are clean
- (-) Bottom content clips behind nav
- (-) Blue dot indicator on the left of challenges section seems orphaned/unclear

### Habits (/habits)
**Rating: 8/10**
- Progress ring (0/1, 1/1) with smooth fill animation is beautiful
- Weekly day indicators with dots are a nice touch
- Habit creation modal is well-designed (icon picker, frequency toggle, goal linking)
- Toggle animation for completing habits works smoothly
- Voice Log and Add Habit floating buttons are well-placed
- (-) Critical: creation fails without goal link (Bug #1)

### Diary (/diary)
**Rating: 7/10**
- Large microphone button is visually prominent and inviting
- "Recent Entries" section with empty state is clean
- Insights section with stats grid (Entries, Minutes, Avg Min, This Week) is nice
- (-) Insights section overlaps with bottom nav
- (-) Could use more visual flair for the empty state

### Daily Check-in (/survey)
**Rating: 9/10**
- Mode selector (Fill Survey vs Talk to AI) is clean and intuitive
- Survey sliders are well-sized with emoji bookends and numeric labels
- Smooth sliding experience (the known snapping issue appears resolved)
- Quick submission with redirect to dashboard works perfectly
- "Takes about 15 seconds" copy is a nice touch

### Expert Chat (/expert)
**Rating: 9/10**
- Coach selector with colorful icon grid is visually beautiful
- 6 default coaches + goal-specific coaches + custom coach creation
- Chat bubbles with proper user/AI differentiation
- Streaming responses work correctly
- Quick-start prompts are helpful for new users
- Mute button and Live Voice Mode link in the header
- AI responses are contextual (references user's goals and onboarding answers)
- (-) Goal coach name truncation in selector

### Live Voice Chat (/expert/live)
**Rating: 7/10**
- Dark theme with pulsing orb is visually striking
- Coach selector and mute button properly positioned
- Transcript shows at the bottom
- "Listening... (Hands-Free)" status indicator
- (-) Light bottom nav clashes with dark theme
- (-) Transcript overlaps with bottom nav

### Progress (/progress)
**Rating: 8/10**
- Four pillar cards (Soul, Mind, Body, Goals) with sparklines are impressive
- Overview stats grid (Streak, Completed, Success Rate, Skipped) is clean
- 30-day calendar with color-coded status (green=completed, red=skipped, orange=pending) is useful
- Trends chart with Mood/Energy/Motivation toggle buttons
- Goal filter dropdown for the calendar
- (-) Bottom nav overlap on pillar cards

### Profile (/profile)
**Rating: 7/10**
- Avatar with initials is clean
- Stats grid layout is good
- Goal listing with status badges
- Settings and Logout links
- (-) Duplicate bottom nav (Bug #2)
- (-) Grammar: "1 days" (Bug #8)

### Settings (/settings)
**Rating: 8/10**
- Comprehensive and well-organized into sections
- Theme toggle (Light/System/Dark) works correctly with smooth transition
- Accent color picker with 5 options
- Challenge generation settings (difficulty slider, count, length, time)
- AI Personality selection with 4 styles
- 9 voice options with descriptions
- Notification toggles
- (-) Duplicate bottom nav (Bug #2)
- (-) Very long page -- could benefit from collapsible sections

### New Goal (/goals/new)
**Rating: 7/10**
- Domain cards in 2-column grid are visually clean with good icons
- 8 transformation areas with descriptions
- (-) Bottom nav overlaps middle row of cards

### Challenge History (/challenges)
**Rating: 6/10**
- Basic list view with completed/pending status
- (-) Duplicate bottom nav (Bug #2)
- (-) Could use filtering/sorting options
- (-) Sparse design when few challenges exist

### Challenge Detail (/challenges/[id])
**Rating: 8/10**
- Clean card layout with difficulty badge
- "What to do" section with description
- Tips for Success section is a nice value-add
- Mark Complete / Skip buttons are prominently placed
- Completion modal with sliders and optional note

---

## Overall Design Assessment

### Strengths
- **Consistent glassmorphism style** across cards (card-glass class)
- **Gradient buttons** (teal-to-green) are visually distinctive and attractive
- **Good typography hierarchy** with clear headings, subtext, and labels
- **Emoji usage** adds personality without being overwhelming
- **Dark mode** is well-implemented with proper color adjustments
- **AI personalization** throughout (onboarding -> challenges -> expert chat) creates a cohesive experience
- **Information density** is appropriate for mobile -- pages show enough without feeling cramped
- **Color-coded status indicators** (green=complete, orange=pending) are intuitive

### Areas for Improvement
1. **Bottom navigation overlap** is the most pervasive layout issue -- needs consistent padding-bottom on all page containers
2. **Duplicate navigation rendering** on /profile, /settings, /challenges pages needs to be fixed (remove the embedded nav)
3. **Tracking submenu** should be redesigned as styled pills/chips that pop up above the nav bar, not an unstyled dropdown
4. **Live voice chat** needs the bottom nav hidden or styled to match the dark theme
5. **Empty states** could be more visually engaging (especially diary and challenge history)
6. **Onboarding flow** should hide the top nav and bottom nav entirely for a more focused experience

---

## Functional Test Results

| Feature | Status | Notes |
|---------|--------|-------|
| Registration | PASS | Creates account and redirects to onboarding |
| Onboarding survey | PASS | Captures answers, AI generates personalized goals |
| Goal selection & customization | PASS | Can select, edit, and create goal |
| First challenge generation | PASS | AI generates relevant challenge with tips |
| Dashboard data display | PASS | Shows progress, goals, challenges, stats |
| Challenge completion with sliders | PASS | Difficulty and satisfaction sliders work, data saved |
| Habit creation (with goal) | PASS | Creates habit linked to goal |
| Habit creation (without goal) | FAIL | Zod validation error on null goalId |
| Habit toggle completion | PASS | Progress ring updates, state saved |
| Daily check-in (survey sliders) | PASS | Submits mood/energy/motivation data |
| Expert chat (text) | PASS | Sends message, receives streaming AI response |
| Coach selector | PASS | Shows 6 defaults + goal coaches + custom |
| Live voice mode | PARTIAL | Page loads, layout works, cannot test mic in headless |
| Progress page | PASS | Pillar cards, calendar, charts all render with data |
| Profile page | PASS | Shows stats, goals, avatar |
| Settings page | PASS | Theme toggle, accent color, all controls work |
| Dark mode | PASS | Proper theme switching across all elements |
| Goal creation page | PASS | Domain selector grid renders correctly |
| Challenge history | PASS | Shows completed challenges with status |
| Navigation (bottom) | PASS | All tabs work, active state highlighted |
| Navigation (tracking submenu) | PASS | Opens/closes submenu with sub-links |

---

## Recommendations (Priority Order)

1. **Fix habit creation Zod schema** -- Make goalId optional/nullable in the validation schema (Critical, blocks core feature)
2. **Remove duplicate BottomNavigation** from /profile, /settings, /challenges pages (High, visual regression)
3. **Add padding-bottom** to all page containers to prevent bottom nav overlap (High, affects every page)
4. **Fix "How to complete" data** in onboarding challenge step to show actual instructions (High, confusing UX)
5. **Hide nav during onboarding** for a focused onboarding experience (Medium, UX improvement)
6. **Restyle tracking submenu** as pills/chips above the nav bar (Medium, design polish)
7. **Fix light nav in dark live mode** -- hide bottom nav or apply dark theme (Medium, visual consistency)
8. **Add favicon** to prevent 404 errors (Low, easy fix)
9. **Fix "1 days" grammar** with proper pluralization (Low, quick fix)

---

## Screenshots Index

| File | Description |
|------|-------------|
| `screenshots/01-login-page.png` | Login page |
| `screenshots/02-register-page.png` | Registration page |
| `screenshots/03-onboarding-welcome.png` | Onboarding welcome/survey |
| `screenshots/04-onboarding-goals.png` | AI-generated goal suggestions (full page) |
| `screenshots/05-onboarding-customize.png` | Goal customization step |
| `screenshots/06-onboarding-challenge.png` | First challenge presentation |
| `screenshots/07-dashboard.png` | Dashboard with active goal and challenge (full page) |
| `screenshots/08-nav-tracking-submenu.png` | Tracking submenu expanded |
| `screenshots/09-challenge-detail.png` | Challenge detail page (full page) |
| `screenshots/10-challenge-completion-modal.png` | Completion modal with sliders (full page) |
| `screenshots/11-dashboard-after-complete.png` | Dashboard after completing challenge |
| `screenshots/12-habits-empty.png` | Empty habits page |
| `screenshots/13-create-habit-modal.png` | Create habit modal |
| `screenshots/14-habit-creation-error.png` | Habit creation Zod error |
| `screenshots/15-habit-created.png` | Habit created successfully |
| `screenshots/16-habit-toggled.png` | Habit toggled to complete |
| `screenshots/17-diary-page.png` | Diary page (full page) |
| `screenshots/18-survey-mode-select.png` | Daily check-in mode selector |
| `screenshots/19-survey-sliders.png` | Survey sliders (full page) |
| `screenshots/20-expert-chat.png` | Expert chat initial state |
| `screenshots/21-expert-chat-response.png` | Expert chat with AI response (full page) |
| `screenshots/22-coach-selector.png` | Coach selector expanded |
| `screenshots/23-live-voice-chat.png` | Live voice chat page |
| `screenshots/24-progress-page.png` | Progress page (full page) |
| `screenshots/25-profile-page.png` | Profile page (full page) |
| `screenshots/26-settings-page.png` | Settings page (full page) |
| `screenshots/27-dark-mode.png` | Dark mode settings |
| `screenshots/28-new-goal.png` | New goal domain selector (full page) |
| `screenshots/29-challenge-history.png` | Challenge history page |
