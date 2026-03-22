# Feedback Log

Tracking feedback items for the Grow Daily app. This is an operational document -- not a spec or plan.

## Priority Levels

| Priority | Label | Meaning |
|---|---|---|
| P0 | Critical | Do immediately -- blocks testing |
| P1 | Pre-Launch | Fix before the live testing period starts |
| P2 | Post-Test | Fix right after the testing period ends |
| P3 | Next Round | Second round of changes |
| P4 | Later | Miscellaneous, no rush |

## Summary

| ID | Title | Category | Priority | Status |
|---|---|---|---|---|
| FB-001 | New challenges not displayed under goals | Bug | P1 | Fixed |
| FB-002 | Habit voice log opens below page instead of overlay | Bug | P1 | Fixed |
| FB-003 | Pulsing mic icon not clickable to stop recording | Bug | P1 | Fixed |
| FB-004 | Bottom nav tracking dropdown broken | Bug | P1 | Fixed |
| FB-005 | Progress page 30-day view overwhelming | UX | P1 | Fixed |
| FB-006 | Chat auto-scrolls during generation | Bug | P1 | Fixed |
| FB-007 | Keyboard reopens after sending chat message | Bug | P1 | Fixed |
| FB-008 | Chat interface text area too small | UX | P1 | Fixed |
| FB-009 | AI context only includes one goal | Bug | P0 | Fixed |
| FB-010 | Voice-based check-in layout broken | Bug | P1 | Fixed |
| FB-011 | Live voice mode not accessible | Feature | P1 | Fixed |
| FB-012 | Voice selection not saving on all platforms | Feature | P2 | Fixed |
| FB-013 | Daily challenge rotation not working | Bug | P0 | Fixed |
| FB-014 | Deployment failure -- DailyChallengeLoader missing | Bug | P0 | Fixed |
| FB-015 | Challenge settings slider controls too small | UX | P1 | Fixed |
| FB-016 | Duplicate personality setting | Bug | P1 | Fixed |
| FB-017 | No challenges available without goals | Feature | P1 | Fixed |
| FB-018 | Progress trends graph not rendering | Bug | P1 | Fixed |
| FB-019 | Bottom nav active state too subtle | UX | P1 | Fixed |
| FB-020 | Settings not easily accessible | UX | P1 | Fixed |
| FB-021 | Diary voice transcript not capturing on mobile | Bug | P1 | Fixed |
| FB-022 | Live voice chat responses too long | UX | P1 | Fixed |
| FB-023 | Live voice chat slow TTS start | Performance | P1 | Fixed |
| FB-024 | Challenge completion screen doesn't fill viewport | UX | P1 | Fixed |
| FB-025 | Daily check-in sliders only move one step at a time | UX | P1 | Fixed |
| FB-026 | Live voice chat UI broken on mobile | Bug | P1 | Fixed |
| FB-027 | System prompt leaks into Expert Chat messages | Bug | P0 | Fixed |
| FB-028 | Navigation visible on login/register pages | UX | P1 | Fixed |
| FB-029 | Create Goal domain cards -- 2 columns, text cut off | Bug | P1 | Fixed |
| FB-030 | "COMPLETION RATE" wraps mid-word on desktop | Bug | P1 | Fixed |
| FB-031 | Settings page throws 400 error in demo mode | Bug | P1 | Fixed |
| FB-032 | Bottom nav active state missing on /survey | Bug | P2 | Fixed |
| FB-033 | Diary insights show duplicate themes (casing) | Bug | P2 | Fixed |
| FB-034 | "Create Habit" button text wraps to two lines | UX | P2 | Fixed |
| FB-035 | Goal name text overflow in Progress cards | UX | P2 | Fixed |
| FB-036 | Goal name wraps awkwardly on Profile page | UX | P2 | Fixed |
| FB-037 | Tracking submenu dropdown overlaps page content | UX | P2 | Fixed |
| FB-038 | "Diary Entries" label wraps in Weekly Digest | UX | P2 | Fixed |
| FB-039 | Missing favicon | UX | P3 | Open |
| FB-040 | Desktop layout not optimized | UX | P4 | Open |
| FB-041 | Challenge History cards have verbose titles | UX | P3 | Won't Fix |
| FB-042 | Input autocomplete attributes missing | UX | P3 | Open |
| FB-043 | Preloaded resource console warnings | Performance | P4 | Open |
| FB-044 | Tracking submenu items too small, need pills | UX | P1 | Fixed |
| FB-045 | Challenge generation progress circle not animating | Bug | P1 | Fixed |
| FB-046 | Goal complete/delete uses browser native confirm | UX | P1 | Fixed |
| FB-047 | Slow page transitions after goal operations | Performance | P1 | Fixed |
| FB-048 | Habits page mic icon shows before content loads | Bug | P2 | Fixed |
| FB-049 | Voice diary transcript should generate before save | UX | P1 | Fixed |
| FB-050 | Voice diary save loading indicator not animated | UX | P2 | Fixed |
| FB-051 | Voice diary entries need timeframe grouping | Feature | P1 | Fixed |
| FB-052 | Talk to AI page formatting broken | Bug | P1 | Fixed |
| FB-053 | Expert chat coach pill too tall and layout issues | UX | P1 | Fixed |
| FB-054 | Mic button style inconsistent with live mode | UX | P2 | Fixed |
| FB-055 | Completed/deleted goals showing on Progress page | Bug | P1 | Fixed |
| FB-056 | Progress trends redesign | UX | P1 | Fixed |
| FB-057 | Standardize loading/progress animations app-wide | UX | P1 | Fixed |
| FB-058 | Create Habit frequency highlight text should be black | UX | P1 | Fixed |
| FB-059 | Create Habit goal linking shows completed/deleted goals | Bug | P1 | Fixed |
| FB-060 | Create Habit throws error on empty description | Bug | P1 | Fixed |
| FB-061 | Settings focus areas text box too small, add button too big | UX | P2 | Fixed |
| FB-062 | Settings AI personality pills too large | UX | P2 | Fixed |
| FB-063 | Settings options must actually affect app behavior | Bug | P1 | Fixed |
| FB-064 | Settings AI Voice should play sample on click | Feature | P1 | Fixed |
| FB-065 | Settings remove notifications section | UX | P1 | Fixed |

---

## Detail

<!--
Template for new items -- copy this block and fill it in:

### FB-XXX: Title

**Category:** Bug / UX / Feature / Performance / Visual
**Priority:** P0 / P1 / P2 / P3 / P4
**Status:** Open / In Progress / Fixed / Won't Fix

**Description:**
What is wrong or what should be added.

**Location:**
Screen, page, or component where this occurs.

**Repro Steps:**
1. Step one
2. Step two
3. Observe the issue

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | | |
-->

### FB-001: New challenges not displayed under goals

**Category:** Bug
**Priority:** P1
**Status:** Fixed

**Description:**
After creating new challenges connected to a goal, they do not appear nested under that goal on the dashboard. Old challenges display correctly but new ones are missing.

**Location:**
Dashboard -- challenge display under goals

**Repro Steps:**
1. Create a new challenge linked to a goal
2. Return to the dashboard
3. Observe the new challenge does not appear under the goal

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Fixed challenge nesting logic so new challenges display under their parent goal on the dashboard | Fixed |

---

### FB-002: Habit voice log opens below page instead of overlay

**Category:** Bug
**Priority:** P1
**Status:** Fixed

**Description:**
When trying to track habits with the voice log, it opens as a new section below the habit page content instead of as a floating overlay on top of the page.

**Location:**
Habits page -- voice log

**Repro Steps:**
1. Open the habits page
2. Tap the voice log to track a habit
3. Observe it opens below the page instead of as an overlay

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Switched to createPortal with position:fixed overlay | Fixed |

---

### FB-003: Pulsing mic icon not clickable to stop recording

**Category:** Bug
**Priority:** P1
**Status:** Fixed

**Description:**
During voice recording, the pulsing microphone icon cannot be tapped to stop the recording. The user has no way to finish the recording by tapping the mic.

**Location:**
Voice recording UI (all voice input areas)

**Repro Steps:**
1. Start a voice recording
2. Tap the pulsing mic icon
3. Observe nothing happens -- cannot stop recording

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Made pulsing mic icon clickable to stop recording | Fixed |

---

### FB-004: Bottom nav tracking dropdown broken

**Category:** Bug
**Priority:** P1
**Status:** Fixed

**Description:**
The tracking dropdown works in the top navigation bar but is broken in the bottom navigation bar. The bottom nav needs the same dropdown functionality as the top bar, with better spacing, pill-style items, and a larger popup.

**Location:**
Bottom navigation bar -- Tracking dropdown

**Repro Steps:**
1. Tap "Tracking" in the bottom navigation
2. Observe the dropdown does not function correctly

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Ported top nav dropdown to bottom nav. Added pill-style items with better spacing and larger popup | Fixed |

---

### FB-005: Progress page 30-day view overwhelming

**Category:** UX
**Priority:** P1
**Status:** Fixed

**Description:**
The 30-day calendar view on the progress page is extremely hard to read and understand. Needs redesign: keep markers for completed/skipped/pending/no-challenge, but show one pre-selected goal with a dropdown to switch between goals. Mood/energy trends should show one metric at a time (mood by default) with toggles for energy and motivation, displayed as a single curve over time.

**Location:**
Progress page (`/progress`)

**Repro Steps:**
1. Open the progress page
2. Observe the 30-day calendar view is overwhelming and hard to parse

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Redesigned with goal dropdown selector and metric selector toggle (plan 04). Single curve display per metric | Fixed |

---

### FB-006: Chat auto-scrolls during generation

**Category:** Bug
**Priority:** P1
**Status:** Fixed

**Description:**
When the AI generates a response in expert chat, the view auto-scrolls to the bottom once generation completes. The user should control scrolling -- the system should never auto-scroll.

**Location:**
Expert chat interface

**Repro Steps:**
1. Send a message in expert chat
2. While the AI generates, stay scrolled near the top
3. Observe the view jumps to the bottom when generation finishes

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Removed auto-scroll on generation complete. User now controls all scrolling | Fixed |

---

### FB-007: Keyboard reopens after sending chat message

**Category:** Bug
**Priority:** P1
**Status:** Fixed

**Description:**
After sending a message in expert chat, the keyboard closes briefly then reopens automatically. The keyboard should stay hidden after sending.

**Location:**
Expert chat interface

**Repro Steps:**
1. Open expert chat
2. Type and send a message
3. Observe the keyboard closes then reopens

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Added input.blur() in the finally block after sending | Fixed |

---

### FB-008: Chat interface text area too small

**Category:** UX
**Priority:** P1
**Status:** Fixed

**Description:**
The chat interface does not maximize text space. The coach icons on the left and user icons take up space that should be used for message text. Hide the icons and use the full width for text, including reclaiming margins on left, right, and top.

**Location:**
Expert chat interface

**Repro Steps:**
1. Open expert chat
2. Observe wasted space from icons and margins reducing the readable text area

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Removed coach/user icons, expanded text to full width, reclaimed margins (plan 05 polish) | Fixed |

---

### FB-009: AI context only includes one goal

**Category:** Bug
**Priority:** P0
**Status:** Fixed

**Description:**
All AI features (expert chat, voice check-in) only have knowledge of one goal (marathon training in the demo account). Other goals are invisible to the AI. The AI-based check-in only asks about that single goal. All AI should have full knowledge of all goals and all challenges.

**Location:**
Expert chat, voice-based check-in, all AI features

**Repro Steps:**
1. Log in to the demo account (which has multiple goals)
2. Start an AI check-in or expert chat
3. Observe the AI only references one goal

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Added allActiveGoals[] to UserContext so all AI features see every goal | Fixed |

---

### FB-010: Voice-based check-in layout broken

**Category:** Bug
**Priority:** P1
**Status:** Fixed

**Description:**
The voice-based check-in / guided interview has layout issues -- content is cut off on the right side. Needs the same layout fixes applied to expert chat (full-width text, proper margins).

**Location:**
Voice-based check-in (`/survey` -- talk to AI / guided interview)

**Repro Steps:**
1. Start a voice-based check-in via Talk to AI
2. Observe content is cut off and layout does not match the fixed expert chat

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Ported expert chat layout fixes to the voice-based check-in. Replaced expert selector with progress indicator showing check-in phases | Fixed |

---

### FB-011: Live voice mode not accessible

**Category:** Feature
**Priority:** P1
**Status:** Fixed

**Description:**
Live voice mode (real-time voice conversation with the AI) is not accessible from the UI. Should be available in both the expert chat panel and the guided interview/check-in. The interface shows a floating pulsing icon while the user talks, with a grace period after silence before the AI responds. Goal is near-real-time conversation with minimal delay.

**Location:**
Expert chat, guided interview

**Repro Steps:**
1. Open expert chat
2. Look for a live voice mode option
3. Observe there is no entry point

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Implemented live voice mode (plan 06). Added entry points in Expert Chat header and AI Conversation selector | Fixed |

---

### FB-012: Voice selection not saving on all platforms

**Category:** Feature
**Priority:** P2
**Status:** Fixed

**Description:**
Voice selection UI exists in settings, allowing users to choose different voices for all voice-based functionality. However, the selection may not save correctly on all platforms.

**Location:**
Settings -- voice selection

**Repro Steps:**
1. Open settings
2. Select a different voice
3. Use a voice feature
4. Observe whether the selected voice is used (may not persist on some platforms)

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Root cause: Settings used Web Speech API voices (platform-dependent) stored in localStorage, while TTS endpoint uses OpenAI voiceId from database. Two disconnected systems. Fix: replaced Web Speech API picker with OpenAI voice grid (alloy, ash, coral, echo, fable, onyx, nova, sage, shimmer), saves voiceId to database via /api/settings. Plays sample via /api/tts on click. | Fixed |

---

### FB-013: Daily challenge rotation not working

**Category:** Bug
**Priority:** P0
**Status:** Fixed

**Description:**
Challenges are not being removed and replaced at the end of each day. Each day should bring a new set of challenges with old ones disappearing. Default is one challenge per day (configurable in settings).

**Location:**
Dashboard -- challenges section

**Repro Steps:**
1. Note today's challenges
2. Wait until the next day
3. Observe old challenges persist and no new ones appear

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Implemented DailyChallengeLoader to auto-generate per goal (plan 01). Old challenges filtered by scheduledDate | Fixed |

---

### FB-014: Deployment failure -- DailyChallengeLoader missing

**Category:** Bug
**Priority:** P0
**Status:** Fixed

**Description:**
Vercel build fails because the DailyChallengeLoader component is missing from the committed files.

**Location:**
Build / deployment

**Repro Steps:**
1. Push to feature/v2
2. Vercel build fails with missing DailyChallengeLoader

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Added DailyChallengeLoader to git | Fixed |

---

### FB-015: Challenge settings slider controls too small

**Category:** UX
**Priority:** P1
**Status:** Fixed

**Description:**
The slider controls in challenge settings are very small and hard to interact with on mobile devices.

**Location:**
Settings -- challenge configuration

**Repro Steps:**
1. Open settings
2. Try to adjust challenge sliders on mobile
3. Observe the thumb and track are too small to tap accurately

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Enlarged sliders to 36px thumb and 12px track. Settings also made accessible via gear icon | Fixed |

---

### FB-016: Duplicate personality setting

**Category:** Bug
**Priority:** P1
**Status:** Fixed

**Description:**
The personality setting appears more than once in the settings UI.

**Location:**
Settings page

**Repro Steps:**
1. Open settings
2. Observe duplicate personality setting entries

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Removed the duplicate in plan 02 | Fixed |

---

### FB-017: No challenges available without goals

**Category:** Feature
**Priority:** P1
**Status:** Fixed

**Description:**
Users without any goals cannot receive challenges. There should be general "Daily Growth" challenges available on the dashboard regardless of whether the user has created goals.

**Location:**
Dashboard -- challenges section

**Repro Steps:**
1. Use the app without any goals
2. Observe no challenges are available

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Implemented goal-less challenges in plan 03. Added "Daily Growth" section on dashboard | Fixed |

---

### FB-018: Progress trends graph not rendering

**Category:** Bug
**Priority:** P1
**Status:** Fixed

**Description:**
On the progress page, the trends section at the bottom allows choosing between mood, energy, and motivation, but the graph below does not render regardless of which metric is selected.

**Location:**
Progress page (`/progress`) -- trends section

**Repro Steps:**
1. Open the progress page
2. Scroll to the trends section at the bottom
3. Select mood, energy, or motivation
4. Observe the graph does not render

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Set explicit 300px height for ResponsiveContainer | Fixed |

---

### FB-019: Bottom nav active state too subtle

**Category:** UX
**Priority:** P1
**Status:** Fixed

**Description:**
When clicking a nav item in the bottom bar, the currently active item is only slightly highlighted. The green text is more visually prominent than the active state indicator. Needs a stronger visual treatment.

**Location:**
Bottom navigation bar

**Repro Steps:**
1. Open the app
2. Tap different nav items
3. Observe the active state is barely visible

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Added background highlight and underline to active nav item | Fixed |

---

### FB-020: Settings not easily accessible

**Category:** UX
**Priority:** P1
**Status:** Fixed

**Description:**
Settings are only accessible via Profile (top left) then scrolling all the way down. They should also be accessible from a gear icon in the top navigation bar, replacing the lightning bolt on the far right.

**Location:**
Top navigation bar

**Repro Steps:**
1. Try to access settings
2. Must go to Profile then scroll down -- no direct shortcut

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Added gear icon to top nav bar for direct settings access | Fixed |

---

### FB-021: Diary voice transcript not capturing on mobile

**Category:** Bug
**Priority:** P1
**Status:** Fixed

**Description:**
Voice diary entries do not capture any transcript on mobile Chrome (deployed). The SpeechRecognition fix from the initial attempt works on desktop but not on mobile. Likely needs a server-side Whisper fallback for mobile browsers.

**Location:**
Voice diary (`/diary`)

**Repro Steps:**
1. Open the diary on a mobile device (deployed version)
2. Record a voice diary entry
3. Observe no transcript is captured

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Moved SpeechRecognition init to mount-once | Fixed on desktop, still broken on mobile |
| 2 | | Needs server-side Whisper fallback |

---

### FB-022: Live voice chat responses too long

**Category:** UX
**Priority:** P1
**Status:** Fixed

**Description:**
In live voice chat mode, the AI gives very long responses. For a live conversational flow, responses should be 2-3 sentences max -- short and conversational, like a real voice conversation.

**Location:**
Live voice chat (Expert chat, guided interview)

**Repro Steps:**
1. Start a live voice chat session
2. Say something and wait for the AI to respond
3. Observe the response is much too long for a conversational flow

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-023: Live voice chat slow TTS start

**Category:** Performance
**Priority:** P1
**Status:** Fixed

**Description:**
After the AI generates a response in live voice chat, there is a 5-10+ second delay before the voice starts playing. This breaks the conversational feel.

**Location:**
Live voice chat (Expert chat, guided interview)

**Repro Steps:**
1. Start a live voice chat session
2. Say something and wait for the AI to respond
3. Observe a 5-10+ second delay before the voice begins speaking

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-024: Challenge completion screen doesn't fill viewport

**Category:** UX
**Priority:** P1
**Status:** Open

**Description:**
The challenge completion area does not fill the screen. There is a large empty whitespace above the "Challenge Completed" content, and the card itself is narrower than it needs to be. The screen real estate is significantly underutilized -- it should be wider and use the vertical space above. The sliders themselves are fine.

**Location:**
Challenge completion screen

**Repro Steps:**
1. Complete a challenge
2. Observe the completion card is small and centered with large empty margins above and to the sides
3. Compare to the available viewport space -- clearly underutilized

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-025: Daily check-in sliders only move one step at a time

**Category:** UX
**Priority:** P1
**Status:** Open

**Description:**
All sliders on the survey-based daily check-in page can only move one step forward or backward at a time instead of sliding fluidly. This applies to every slider on the page (energy, motivation, and any others), not just specific ones. They should move continuously/fluidly, and there should be a visible track line so the user can see where they are on the scale.

**Location:**
Daily check-in / survey (`/survey`) -- form-based mode

**Repro Steps:**
1. Start a daily check-in in the form/survey mode
2. Try to drag any slider more than one step
3. Observe it only moves one increment at a time -- cannot drag fluidly
4. Observe there is no visible track behind the thumb

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-026: Live voice chat UI broken on mobile

**Category:** Bug
**Priority:** P1
**Status:** Fixed

**Description:**
The live voice chat interface has layout overlap issues on mobile. The UI is visually broken with elements overlapping each other.

**Location:**
Live voice chat (mobile)

**Repro Steps:**
1. Open live voice chat on a mobile device
2. Observe layout overlap and broken UI elements

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-027: System prompt leaks into Expert Chat messages

**Category:** Bug
**Priority:** P0
**Status:** Open

**Description:**
Every user message in the expert chat displays the internal system instruction prefix: `[LIVE VOICE MODE - 2-3 sentences max. Be brief and conversational, like a real voice conversation. No lists or formatting.]` before the actual user text. This exposes internal AI configuration to the end user. On desktop the full prompt is highly visible as a single-line teal bubble.

**Location:**
Expert chat (`/expert`)

**Repro Steps:**
1. Open expert chat
2. Send a message (especially from live voice mode)
3. Observe the system instruction prefix is visible in the user's chat bubble

**Screenshot:** `uat-screenshots/18-expert-chat.png`, `uat-screenshots/29-desktop-expert.png`

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-028: Navigation visible on login/register pages

**Category:** UX
**Priority:** P1
**Status:** Fixed

**Description:**
The top navigation (Profile, Logo, Settings) and bottom navigation (Home, Tracking, Progress, Expert) are fully visible and clickable on the login and register pages. Unauthenticated users should not see app navigation. Clicking nav links from these pages redirects back to login, creating a confusing loop.

**Location:**
Login (`/login`), Register (`/register`)

**Repro Steps:**
1. Open the login or register page
2. Observe the top and bottom navigation bars are visible
3. Click a nav link and get redirected back to login

**Screenshot:** `uat-screenshots/01-login-page.png`, `uat-screenshots/27-register-page.png`

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-029: Create Goal domain cards -- 2 columns, text cut off

**Category:** Bug
**Priority:** P1
**Status:** Open

**Description:**
Two issues with the Create Goal domain selection:
1. Three items per row is too many -- switch to a 2-column grid.
2. Long category names are getting cut off (e.g., "Relationships", "Physical Health"). If a word doesn't fit within the pill, it should overflow to the next line using proper hyphenation (syllable-based word breaking, like "Rela-tionships"), not truncate or break at arbitrary points.

**Location:**
Create Goal page (`/goals/new`)

**Repro Steps:**
1. Open the Create Goal page
2. Observe the domain cards use 3 columns, making each card too narrow
3. Observe long names like "Relationships" and "Physical Health" are cut off

**Screenshot:** `uat-screenshots/23-create-goal.png`

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-030: "COMPLETION RATE" wraps mid-word on desktop

**Category:** Bug
**Priority:** P1
**Status:** Fixed

**Description:**
On desktop viewport, the Goals pillar card label "COMPLETION RATE" wraps as "COMPL ETION / RATE", splitting the word "COMPLETION" across lines.

**Location:**
Progress page (`/progress`) -- desktop viewport

**Repro Steps:**
1. Open the progress page on desktop (1280px+)
2. Look at the Goals pillar card
3. Observe "COMPLETION RATE" wraps mid-word

**Screenshot:** `uat-screenshots/30-desktop-progress.png`

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-031: Settings page throws 400 error in demo mode

**Category:** Bug
**Priority:** P1
**Status:** Fixed

**Description:**
The settings API returns a 400 Bad Request when loading the settings page in demo mode. The page renders with default values but saved preferences may not load.

**Location:**
Settings page (`/settings`)

**Repro Steps:**
1. Log in as a demo user
2. Navigate to settings
3. Open browser console and observe `GET /api/settings` returns 400

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-032: Bottom nav active state missing on /survey

**Category:** Bug
**Priority:** P2
**Status:** Fixed

**Description:**
When on the Survey/Check-in page, the "Tracking" label in the bottom nav is not highlighted. "Home" appears active instead. The `/survey` path is not in the list of paths that activate the Tracking nav item.

**Location:**
Bottom navigation bar, Survey page (`/survey`)

**Repro Steps:**
1. Navigate to the survey/check-in page via Tracking submenu
2. Look at the bottom nav
3. Observe "Home" is highlighted instead of "Tracking"

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-033: Diary insights show duplicate themes (casing)

**Category:** Bug
**Priority:** P2
**Status:** Open

**Description:**
The Common Themes section in diary insights shows "#Positivity (2)" and "#positivity (2)" as separate entries. Themes should be merged case-insensitively.

**Location:**
Diary page (`/diary`) -- insights section

**Repro Steps:**
1. Create diary entries with themes that differ only in casing
2. View the Common Themes section
3. Observe duplicate entries like "#Positivity" and "#positivity"

**Screenshot:** `uat-screenshots/11-diary-bottom.png`

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-034: "Create Habit" button text wraps to two lines

**Category:** UX
**Priority:** P2
**Status:** Open

**Description:**
The "Create Habit" button at the bottom of the Create Habit modal splits "Create" and "Habit" onto separate lines due to limited button width.

**Location:**
Habits page (`/habits`) -- Create Habit modal

**Repro Steps:**
1. Open the Create Habit modal
2. Observe the button text wraps to two lines

**Screenshot:** `uat-screenshots/09-create-habit-modal.png`

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-035: Goal name text overflow in Progress cards

**Category:** UX
**Priority:** P2
**Status:** Open

**Description:**
In the Progress by Goal section on mobile, goal names truncate awkwardly mid-word (e.g., "emotional stability (Lev..."). Should use proper text ellipsis at word boundaries or allow wrapping to a second line.

**Location:**
Progress page (`/progress`) -- Progress by Goal cards (mobile)

**Repro Steps:**
1. Open the progress page on mobile
2. Look at goals with long names
3. Observe mid-word truncation

**Screenshot:** `uat-screenshots/15-progress-page.png`

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-036: Goal name wraps awkwardly on Profile page

**Category:** UX
**Priority:** P2
**Status:** Open

**Description:**
In the goals list on the profile page, "learn german (Level 2)" wraps so "(Level" is on one line and "2)" on the next.

**Location:**
Profile page (`/profile`) -- goals list

**Repro Steps:**
1. Open the profile page
2. Look at a goal with a level suffix
3. Observe "(Level 2)" breaks across lines

**Screenshot:** `uat-screenshots/20-profile-page.png`

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-037: Tracking submenu dropdown overlaps page content

**Category:** UX
**Priority:** P2
**Status:** Open

**Description:**
When clicking "Tracking" in the bottom nav, the dropdown submenu (Daily Habits, Voice Diary, Check-in) overlaps the main page content rather than floating above the nav bar cleanly.

**Location:**
Bottom navigation bar -- Tracking submenu (all pages)

**Repro Steps:**
1. Tap "Tracking" in the bottom nav
2. Observe the submenu overlaps page content instead of floating above the nav bar

**Screenshot:** `uat-screenshots/07-tracking-submenu.png`

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-038: "Diary Entries" label wraps in Weekly Digest

**Category:** UX
**Priority:** P2
**Status:** Fixed

**Description:**
In the "Week at a Glance" grid on the digest page, "Diary Entries" wraps to two lines inside the stat card, looking cramped compared to single-line labels like "Energy" and "Streak".

**Location:**
Weekly Digest page (`/digest`) -- Week at a Glance grid

**Repro Steps:**
1. Open the weekly digest
2. Look at the stat cards
3. Observe "Diary Entries" wraps to two lines

**Screenshot:** `uat-screenshots/17-digest-bottom.png`

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-039: Missing favicon

**Category:** UX
**Priority:** P3
**Status:** Open

**Description:**
No favicon is configured. Console shows `GET /favicon.ico` returns 404 on all pages.

**Location:**
All pages

**Repro Steps:**
1. Open any page
2. Check browser tab -- no favicon
3. Console shows 404 for favicon.ico

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-040: Desktop layout not optimized

**Category:** UX
**Priority:** P4
**Status:** Open

**Description:**
On desktop (1280px+), the app renders as a stretched mobile layout with a max-width container and large dark margins. The bottom tab bar persists on desktop where a sidebar or top nav would be more appropriate. Not a bug for a mobile-first PWA, but the desktop experience feels underutilized.

**Location:**
All pages (desktop viewport)

**Repro Steps:**
1. Open the app on a 1280px+ viewport
2. Observe the mobile layout with large empty margins

**Screenshot:** `uat-screenshots/28-desktop-dashboard.png`

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-041: Challenge History cards have verbose titles

**Category:** UX
**Priority:** P3
**Status:** Won't Fix

**Description:**
Challenge titles like "Enhance Vocabulary through Physical Activity" span 4 lines in the list cards, making the list feel cramped.

**Location:**
Challenge History (`/challenges`)

**Repro Steps:**
1. Open challenge history
2. Observe long titles spanning multiple lines in the cards

**Screenshot:** `uat-screenshots/24-challenge-history.png`

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-042: Input autocomplete attributes missing

**Category:** UX
**Priority:** P3
**Status:** Open

**Description:**
Login and register form inputs do not have autocomplete attributes, causing a DOM warning in the console.

**Location:**
Login (`/login`), Register (`/register`)

**Repro Steps:**
1. Open login or register page
2. Check console for "Input elements should have autocomplete attributes" warning

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-043: Preloaded resource console warnings

**Category:** Performance
**Priority:** P4
**Status:** Open

**Description:**
Console shows warnings about resources being preloaded but not used within a few seconds on multiple pages.

**Location:**
Multiple pages

**Repro Steps:**
1. Open any page
2. Check console for preloaded resource warnings

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-044: Tracking submenu items too small, need pills

**Category:** UX
**Priority:** P1
**Status:** Open

**Description:**
The three options in the tracking dropdown (Daily Habits, Voice Diary, Check-in) are too small. They need: larger text size, increased letter spacing, and a pill-shaped background around each option to visually subdivide them and make them easier to tap.

**Location:**
Bottom navigation bar -- Tracking submenu dropdown

**Repro Steps:**
1. Tap "Tracking" in the bottom nav
2. Observe the three options are small and lack visual separation
3. Compare to how a pill-style menu would look

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-045: Challenge generation progress circle not animating

**Category:** Bug
**Priority:** P1
**Status:** Open

**Description:**
While a challenge is being generated (the text breathes/pulses underneath the goal it belongs to), the circular progress bar next to it is static. It should be spinning or animating to indicate that generation is in progress. See FB-057 for animation consistency requirements.

**Location:**
Dashboard -- challenge section under a goal, during generation

**Repro Steps:**
1. Trigger challenge generation for a goal
2. Observe the text breathing/pulsing while generating
3. Observe the circular progress bar is static -- it should be animating

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-046: Goal complete/delete uses browser native confirm

**Category:** UX
**Priority:** P1
**Status:** Open

**Description:**
When completing or deleting a goal, the app triggers a browser-native `confirm()` dialog that shows "the page at HDPS improvement..." followed by the confirmation question. This looks unprofessional and breaks the app's visual design. Needs a custom in-app confirmation modal styled consistently with the rest of the app.

**Location:**
Goals -- complete/delete actions

**Repro Steps:**
1. Open a goal
2. Try to complete or delete it
3. Observe the browser-native confirm dialog appears instead of an in-app modal

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-047: Slow page transitions after goal operations

**Category:** Performance
**Priority:** P1
**Status:** Fixed

**Description:**
After completing a goal or navigating back to the dashboard, the page takes approximately 4+ seconds to load. With more content on the page, this delay is uncomfortably long. This item is an exploration -- investigate root causes and propose ideas for improvement rather than jumping to a fix.

**Location:**
Dashboard, goal-related page transitions

**Repro Steps:**
1. Complete a goal
2. Navigate back to the dashboard
3. Observe the page takes ~4+ seconds to become interactive

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Root cause: getDashboardData() ran 9+ DB queries sequentially (goals, challenges, streak, diary count, surveys, habits, milestones, partners). Fix: wrapped all independent queries in Promise.all() to run in parallel. Also added revalidatePath('/') to goal complete/delete API routes so Next.js cache invalidation works properly. Expected improvement: 50-75% faster (1-2s instead of 4+s). | Fixed |

---

### FB-048: Habits page mic icon shows before content loads

**Category:** Bug
**Priority:** P2
**Status:** Open

**Description:**
When the habits page loads, the microphone icon appears immediately while all other content is still loading. The mic icon should not be visible until the rest of the page content has finished loading.

**Location:**
Habits page (`/habits`)

**Repro Steps:**
1. Navigate to the habits page
2. Observe the mic icon appears instantly while other content is still loading

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-049: Voice diary transcript should generate before save

**Category:** UX
**Priority:** P1
**Status:** Open

**Description:**
After recording a voice diary entry, the transcript field says it will be generated when you save. Instead, transcription should begin immediately after recording finishes. While generating, the transcript field should show a loading indicator, and then the text should appear in the field once ready -- all before the user hits save.

**Location:**
Voice diary (`/diary`) -- recording and transcript

**Repro Steps:**
1. Open the voice diary
2. Record an entry
3. Stop recording
4. Observe the transcript field says it will be generated on save instead of generating immediately

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-050: Voice diary save loading indicator not animated

**Category:** UX
**Priority:** P2
**Status:** Open

**Description:**
When saving a voice diary entry, the loading indicator is static -- it does not move or pulse. It needs both movement (spinning) and a breathing/pulsing effect. See FB-057 for animation consistency requirements across the app.

**Location:**
Voice diary (`/diary`) -- save action

**Repro Steps:**
1. Record and save a voice diary entry
2. Observe the loading indicator during save is static

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-051: Voice diary entries need timeframe grouping

**Category:** Feature
**Priority:** P1
**Status:** Open

**Description:**
Recent diary entries should be organized by timeframe with expand/collapse behavior:
1. **Today and Yesterday** -- fully expanded by default, always visible
2. **Last 7 days** -- collapsed by default. When expanded, shows entries from the last 7 days excluding those already shown in Today/Yesterday
3. **Last month** -- collapsed by default. When expanded, shows entries from the last month excluding those already shown above
4. **All** -- a button at the bottom that loads all remaining entries not already displayed

Each section should never repeat entries shown in a section above it.

**Location:**
Voice diary (`/diary`) -- recent entries list

**Repro Steps:**
1. Open the voice diary with multiple entries across different dates
2. Observe all entries are shown in a flat list with no timeframe grouping

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-052: Talk to AI page formatting broken

**Category:** Bug
**Priority:** P1
**Status:** Open

**Description:**
When clicking "Talk to AI" from the daily check-in, the page that opens has two issues:
1. No whitespace/padding on the left or right sides -- content touches the screen edges
2. The daily check-in header is still visible at the top of the page

The page should only show "Back to options" and below it "Choose your conversation style" -- nothing else above that.

**Location:**
Daily check-in -- Talk to AI page

**Repro Steps:**
1. Start a daily check-in
2. Choose "Talk to AI"
3. Observe no side padding and the check-in header persists at the top

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-053: Expert chat coach pill too tall and layout issues

**Category:** UX
**Priority:** P1
**Status:** Open

**Description:**
Two issues with the expert chat layout:
1. The "General Coach" pill/button is much taller than the Clear and Sound buttons to its right because it includes a subtitle ("holistic transformation" or similar). Remove the subtitle -- keep only "General Coach" so all header buttons are the same height.
2. The entire expert chat area renders as a card/pill with padding, leaving unused space at the bottom of the screen. The chat should fill the full page height, not float as a card.

**Location:**
Expert chat (`/expert`)

**Repro Steps:**
1. Open expert chat
2. Observe the General Coach pill is much taller than adjacent buttons
3. Observe the chat area has a card-like border with space below it instead of filling the page

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-054: Mic button style inconsistent with live mode

**Category:** UX
**Priority:** P2
**Status:** Open

**Description:**
Two issues with microphone/voice mode buttons:
1. The microphone button in the chat input area has a different visual style from the live mode button. The live mode style is preferred -- use it consistently for all mic buttons.
2. The live mode icon itself is not recognizable. Replace it with an icon similar to what ChatGPT and other common chat providers use for their live/voice mode feature.

**Location:**
Expert chat -- mic button and live mode button

**Repro Steps:**
1. Open expert chat
2. Compare the mic button style to the live mode button style -- they are visually inconsistent
3. Note the live mode icon is not intuitive

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-055: Completed/deleted goals showing on Progress page

**Category:** Bug
**Priority:** P1
**Status:** Open

**Description:**
Goals that have been completed or deleted still appear on the progress page. They should be filtered out so only active goals are shown.

**Location:**
Progress page (`/progress`)

**Repro Steps:**
1. Complete or delete a goal
2. Navigate to the progress page
3. Observe the completed/deleted goal still appears

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-056: Progress trends redesign

**Category:** UX
**Priority:** P1
**Status:** Open

**Description:**
Redesign the trends section on the progress page:
1. **Remove** the top toggle for mood/energy/motivation
2. **Add time frame selector at the top** with options: Last 7 days / Last month / All time. The currently selected option should have a pill background with **black text** (not white -- white is hard to read on the current pill color)
3. **Add legend below the chart** showing all three metrics (mood, energy, motivation) plus an "All" option. The currently active metric should be in full color; inactive ones should be grayed out. Each legend item is clickable to switch to that metric
4. **"All" option** in the legend overlays all three trend lines on the same chart simultaneously

**Location:**
Progress page (`/progress`) -- trends section at the bottom

**Repro Steps:**
1. Open the progress page
2. Scroll to the trends section
3. Observe the top toggle and lack of time frame selector or proper legend

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-057: Standardize loading/progress animations app-wide

**Category:** UX
**Priority:** P1
**Status:** Fixed

**Description:**
All spinning and pulsing/breathing animations must be consistent across the entire app. Wherever a loading spinner, progress circle, or breathing animation is used, they should share the same visual style (speed, easing, size proportions). This applies to at minimum:
- Challenge generation progress circle (FB-045)
- Voice diary save loading (FB-050)
- Any other loading indicators throughout the app

Audit all loading/progress animations and unify them to a single consistent style.

**Location:**
App-wide -- all loading indicators and progress animations

**Repro Steps:**
1. Trigger loading states in different parts of the app (challenge generation, diary save, page loads)
2. Observe inconsistencies in animation style, speed, or behavior

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| 1 | Audited 18+ animation definitions across 12 components. Added shared @keyframes (spin, breathe, shimmer) and utility classes (.animate-spin, .animate-breathe, .animate-shimmer, .skeleton-breathe, .loading-breathe) to globals.css. Removed duplicate @keyframes spin from AnalysisStep.tsx, HabitVoiceLogger.tsx, diary/VoiceRecorder.tsx. Components now reference global keyframes. | Fixed |

---

### FB-058: Create Habit frequency highlight text should be black

**Category:** UX
**Priority:** P1
**Status:** Open

**Description:**
When creating a new habit, the highlighted/selected frequency option has white text on the pill highlight, making it hard to read. The text should be black when highlighted so it is clearly visible against the pill background.

**Location:**
Habits page (`/habits`) -- Create Habit modal, frequency selector

**Repro Steps:**
1. Open Create Habit modal
2. Select a frequency option
3. Observe the highlighted pill has white text that is hard to read

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-059: Create Habit goal linking shows completed/deleted goals

**Category:** Bug
**Priority:** P1
**Status:** Open

**Description:**
When creating a new habit and linking it to a goal, the goal list includes goals that have been completed or deleted. Only active goals should appear in the linking dropdown.

**Location:**
Habits page (`/habits`) -- Create Habit modal, Link Goal selector

**Repro Steps:**
1. Complete or delete a goal
2. Open Create Habit modal
3. Try to link a goal
4. Observe completed/deleted goals still appear in the list

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-060: Create Habit throws error on empty description

**Category:** Bug
**Priority:** P1
**Status:** Open

**Description:**
When creating a new habit with an empty description field, an error is thrown. The description should be optional -- if left empty, the habit should be created without a description.

**Location:**
Habits page (`/habits`) -- Create Habit modal

**Repro Steps:**
1. Open Create Habit modal
2. Fill in the name and other fields but leave description empty
3. Submit
4. Observe an error is thrown

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-061: Settings focus areas text box too small, add button too big

**Category:** UX
**Priority:** P2
**Status:** Open

**Description:**
In the settings page, the focus areas input text box is too small relative to the add button. The add button takes up disproportionate space. Move the add button further to the right and give more width to the text input field.

**Location:**
Settings page (`/settings`) -- Focus Areas section

**Repro Steps:**
1. Open settings
2. Scroll to Focus Areas
3. Observe the text box is small and the add button is oversized

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-062: Settings AI personality pills too large

**Category:** UX
**Priority:** P2
**Status:** Open

**Description:**
The AI personality choice pills are too large for the text they contain, making it hard to see all available options without excessive scrolling. Compress the pill size so more options are visible at once and the section is easier to browse. Same applies to the scientific bases options.

**Location:**
Settings page (`/settings`) -- AI Personality and Scientific Bases sections

**Repro Steps:**
1. Open settings
2. Scroll to AI Personality
3. Observe the pills are oversized relative to their text content
4. Check Scientific Bases section -- same issue

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-063: Settings options must actually affect app behavior

**Category:** Bug
**Priority:** P1
**Status:** Open

**Description:**
The settings page has multiple configurable options (AI personality, scientific bases, AI voice, and others) that may not actually affect the relevant parts of the app. Every setting must be wired through to its corresponding feature. Audit all settings and ensure they are not just empty UI -- each one must produce a real change in app behavior.

**Location:**
Settings page (`/settings`) -- all sections

**Repro Steps:**
1. Change any setting (AI personality, scientific basis, etc.)
2. Use the feature that setting should affect
3. Observe whether the change actually takes effect

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-064: Settings AI Voice should play sample on click

**Category:** Feature
**Priority:** P1
**Status:** Open

**Description:**
When selecting an AI voice option in settings, clicking on the voice should play a short voice sample so the user can hear what it sounds like before committing to it.

**Location:**
Settings page (`/settings`) -- AI Voice section

**Repro Steps:**
1. Open settings
2. Scroll to AI Voice
3. Tap a voice option
4. Observe no audio preview plays

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |

---

### FB-065: Settings remove notifications section

**Category:** UX
**Priority:** P1
**Status:** Open

**Description:**
The notifications section in settings is not implemented and should be removed entirely until notification functionality is built.

**Location:**
Settings page (`/settings`) -- Notifications section

**Repro Steps:**
1. Open settings
2. Scroll to the notifications section
3. Observe it exists but does nothing

**Solution Log:**
| Attempt | What we tried | Result |
|---|---|---|
| | | |
