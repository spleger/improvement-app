# Comprehensive Functionality Test Plan -- ImprovementApp

**Device:** iPhone 14 emulation (390x844)
**Browser:** Chrome (Playwright MCP)
**Goal:** Test 100% of user-facing functionality, capturing screenshots and logging results.

---

## Phase 1: Authentication & Session Management

### 1.1 Demo Mode Login
- [ ] Click "Try Demo Mode" on /login
- [ ] Verify redirect to dashboard (/)
- [ ] Verify user is authenticated (top nav shows profile icon)

### 1.2 Registration
- [ ] Navigate to /register
- [ ] Fill Display Name, Email, Password (min 6 chars)
- [ ] Submit and verify redirect to /onboarding
- [ ] Screenshot: registration form, success redirect

### 1.3 Login with Credentials
- [ ] Navigate to /login
- [ ] Enter valid credentials
- [ ] Verify redirect to dashboard
- [ ] Verify greeting shows user name

### 1.4 Logout
- [ ] Navigate to /profile
- [ ] Click Logout link
- [ ] Verify redirect to /login
- [ ] Verify protected pages redirect back to /login

### 1.5 Session Persistence
- [ ] After login, refresh the page
- [ ] Verify user is still authenticated (not redirected to /login)

---

## Phase 2: Onboarding Flow (New User)

### 2.1 Welcome Step
- [ ] Verify welcome heading and description
- [ ] Click Continue button
- [ ] Screenshot: welcome step

### 2.2 Survey Step
- [ ] Verify survey questions are displayed
- [ ] Interact with each slider (drag to different values)
- [ ] Verify slider labels update (emojis, numeric values)
- [ ] Submit survey answers
- [ ] Screenshot: survey sliders filled in

### 2.3 AI Analysis Step
- [ ] Verify loading state appears ("AI is analyzing your answers...")
- [ ] Wait for analysis to complete
- [ ] Screenshot: loading state

### 2.4 Goal Suggestions Step
- [ ] Verify AI-generated goal suggestions appear (cards)
- [ ] Verify each card shows: Title, From/To states, Why, Difficulty
- [ ] Select a goal card
- [ ] Screenshot: goal suggestions

### 2.5 Goal Customization Step
- [ ] Verify editable fields: title, current state, desired state
- [ ] Verify difficulty slider
- [ ] Modify a field and verify it updates
- [ ] Click Continue/Confirm
- [ ] Screenshot: customization form

### 2.6 First Challenge Step
- [ ] Verify first challenge is generated and displayed
- [ ] Verify challenge shows: title, description, how to complete, difficulty
- [ ] Click "Go to Dashboard" or "Skip to Dashboard"
- [ ] Verify redirect to dashboard with goal and challenge visible
- [ ] Screenshot: first challenge

---

## Phase 3: Dashboard / Home Page

### 3.1 Layout Verification
- [ ] Verify greeting (time-based: Good morning/afternoon/evening)
- [ ] Verify Today's Progress bar (X/Y format)
- [ ] Verify Challenge Summary card (Today, Pending, Completed counts)
- [ ] Verify Goals section heading with count
- [ ] Verify Stats grid (Streak, Total Done, Goals, Avg Mood)
- [ ] Verify Habits summary card
- [ ] Screenshot: full dashboard

### 3.2 Goal Cards
- [ ] Verify each goal card shows: icon, title, level, day/percentage
- [ ] Verify "+ Challenge" link is present on each goal
- [ ] Verify checkmark and trash buttons are present
- [ ] Click a goal's "+ Challenge" link
- [ ] Verify redirect to /challenges/generate?goalId=...

### 3.3 Challenge Cards (Nested Under Goals)
- [ ] Verify challenge cards show: difficulty number, title, description, difficulty text
- [ ] Click a challenge card
- [ ] Verify redirect to /challenges/[id]

### 3.4 Goal Completion
- [ ] Click the checkmark button on a goal
- [ ] Verify Goal Mastered celebration modal appears (if 30 days complete)
- [ ] Verify modal shows: Level Up, Keep Going, Archive & Rest buttons
- [ ] Screenshot: celebration modal

### 3.5 Goal Deletion
- [ ] Click trash button on a goal
- [ ] Verify confirmation dialog (if any)
- [ ] Verify goal is removed from the list

### 3.6 Habits Summary Widget
- [ ] Verify habits summary shows count (X/Y) and weekly rate
- [ ] Verify habit icons are shown
- [ ] Click the habits summary card
- [ ] Verify redirect to /habits

---

## Phase 4: Challenge Flow

### 4.1 Challenge Detail Page
- [ ] Navigate to a challenge via dashboard link
- [ ] Verify title, difficulty badge, description
- [ ] Verify "What to do" section
- [ ] Verify "Tips for Success" or "How to do it" section
- [ ] Verify "Why this works" section (scientific references, if present)
- [ ] Verify difficulty visualization
- [ ] Verify "Mark Complete" and "Skip" buttons
- [ ] Screenshot: challenge detail

### 4.2 Challenge Completion
- [ ] Click "Mark Complete" on a challenge
- [ ] Verify completion modal appears with:
  - Difficulty slider (How hard was it?)
  - Satisfaction slider (How do you feel?)
  - Optional notes text input
  - Submit button
- [ ] Adjust both sliders
- [ ] Add a note
- [ ] Submit
- [ ] Verify redirect to dashboard or success state
- [ ] Verify challenge shows as completed on dashboard
- [ ] Screenshot: completion modal, after submission

### 4.3 Challenge Skip
- [ ] Navigate to an incomplete challenge
- [ ] Click "Skip" button
- [ ] Verify skip confirmation or immediate skip
- [ ] Verify challenge status updates to skipped
- [ ] Screenshot: skipped challenge

### 4.4 Challenge Generation
- [ ] Navigate to /challenges/generate (via "+ Challenge" on a goal)
- [ ] Verify goal context is shown (if goalId is in URL)
- [ ] Select number of challenges (1, 2, or 3)
- [ ] Optionally type a focus area
- [ ] Click "Generate" button
- [ ] Verify loading state ("AI is generating...")
- [ ] Verify generated challenges appear
- [ ] Verify auto-redirect countdown (5 seconds to dashboard)
- [ ] Screenshot: generated challenges

### 4.5 Challenge History
- [ ] Navigate to /challenges
- [ ] Verify list of past challenges with status icons
- [ ] Verify completed, skipped, and pending challenges are shown
- [ ] Click a challenge to view detail
- [ ] Screenshot: challenge history

### 4.6 Challenge Library / Browse
- [ ] Navigate to /challenges/browse
- [ ] Verify domain filter buttons
- [ ] Click different domain filters
- [ ] Verify challenge list updates based on domain
- [ ] Screenshot: browse page

---

## Phase 5: Habits

### 5.1 Habits Page Layout
- [ ] Navigate to /habits
- [ ] Verify PageHeader (icon, title, subtitle)
- [ ] Verify progress ring (X/Y today, circular SVG)
- [ ] Verify weekly day indicators (7 dots for each day of the week)
- [ ] Verify habit list with toggle circles
- [ ] Verify FABs: Voice Log button, Add (+) button
- [ ] Screenshot: habits page

### 5.2 Habit Toggle / Completion
- [ ] Click the circle toggle on a habit
- [ ] Verify it changes to completed state (filled circle/checkmark)
- [ ] Verify progress ring updates (count increases)
- [ ] Toggle it back off
- [ ] Verify it returns to unchecked state
- [ ] Screenshot: before and after toggle

### 5.3 Habit Expansion & Notes
- [ ] Click the chevron/expand arrow on a habit
- [ ] Verify expanded section shows note input and delete button
- [ ] Type a note in the input
- [ ] Click Save
- [ ] Verify note is saved
- [ ] Screenshot: expanded habit with note

### 5.4 Habit Creation
- [ ] Click the "+" FAB button
- [ ] Verify CreateHabitModal appears with:
  - Name input
  - Description input (optional)
  - Icon selector (emoji picker or grid)
  - Frequency selector (daily/weekly)
  - Goal link dropdown
- [ ] Fill in all fields
- [ ] Select a goal from dropdown (to avoid the null goalId bug)
- [ ] Submit
- [ ] Verify new habit appears in the list
- [ ] Screenshot: creation modal, new habit in list

### 5.5 Habit Deletion
- [ ] Expand a habit
- [ ] Click the delete button
- [ ] Verify habit is removed from the list
- [ ] Verify progress ring updates

### 5.6 Voice Habit Logger
- [ ] Click the "Voice Log" button (microphone FAB)
- [ ] Verify HabitVoiceLogger overlay/modal appears
- [ ] **ASK USER:** "Please speak a habit completion (e.g., 'I completed my meditation')"
- [ ] Verify recording indicator appears
- [ ] Verify transcription and interpretation happens
- [ ] Verify habit is marked as completed based on voice
- [ ] Screenshot: voice logger active

---

## Phase 6: Diary / Voice Journaling

### 6.1 Diary Page Layout
- [ ] Navigate to /diary
- [ ] Verify microphone record button
- [ ] Verify "Recent Entries" section
- [ ] Verify Insights sidebar (stats, sentiments, themes)
- [ ] Screenshot: diary page

### 6.2 Voice Recording
- [ ] Click the record button
- [ ] Verify VoiceRecorder modal opens
- [ ] Verify recording indicator (waveform/timer)
- [ ] **ASK USER:** "Please record a brief diary entry (e.g., 'Today was a productive day, I feel motivated')"
- [ ] Stop recording
- [ ] Verify transcript appears
- [ ] Verify AI analysis appears (sentiment, summary, themes)
- [ ] Save the entry
- [ ] Verify entry appears in Recent Entries list
- [ ] Screenshot: recording, transcript, saved entry

### 6.3 Diary Entry Display
- [ ] Verify each entry card shows:
  - Date + time + duration
  - Title (AI-generated)
  - Full transcript text
  - AI Analysis section (summary, sentiment tag, distortion tags, theme tags)
- [ ] Screenshot: diary entry card detail

### 6.4 Insights Section
- [ ] Verify stats grid: Total entries, Total minutes, Avg duration, This week
- [ ] Verify top sentiments list
- [ ] Verify common themes list
- [ ] Screenshot: insights section

---

## Phase 7: Daily Check-in / Survey

### 7.1 Mode Selection
- [ ] Navigate to /survey
- [ ] Verify two mode cards: "Fill Survey" and "Talk to AI"
- [ ] Screenshot: mode selector

### 7.2 Fill Survey Mode
- [ ] Click "Fill Survey"
- [ ] Verify 3 sliders appear: Mood, Energy, Motivation
- [ ] Verify slider labels (emoji bookends, numeric value display)
- [ ] Drag each slider to different values
- [ ] Verify numeric display updates in real-time
- [ ] Optionally fill "Blockers" text input
- [ ] Click Submit
- [ ] Verify submission success (redirect to dashboard or success message)
- [ ] Screenshot: sliders at various values, after submission

### 7.3 Talk to AI Mode
- [ ] Go back to /survey
- [ ] Click "Talk to AI"
- [ ] Verify AI conversation interface appears (chat-like)
- [ ] Verify AI sends first message (guided check-in question)
- [ ] Type a response
- [ ] Verify AI responds contextually
- [ ] Continue conversation for 2-3 turns
- [ ] Verify "Submit Check-in" button appears when conversation reaches enough data
- [ ] Submit
- [ ] Verify survey data is saved
- [ ] Screenshot: AI conversation at each stage

---

## Phase 8: Expert Chat (Text)

### 8.1 Expert Chat Layout
- [ ] Navigate to /expert
- [ ] Verify coach selector at top (showing current coach name + icon)
- [ ] Verify mute button
- [ ] Verify "Live" link to /expert/live
- [ ] Verify chat history (if any previous messages)
- [ ] Verify quick-start prompt buttons (e.g., "I'm struggling with motivation")
- [ ] Verify message input bar at bottom
- [ ] Verify voice input button
- [ ] Screenshot: initial chat state

### 8.2 Send Text Message
- [ ] Type a message (e.g., "What should I focus on today?")
- [ ] Click send button
- [ ] Verify message appears in chat as user bubble
- [ ] Verify AI response streams in (text appears progressively)
- [ ] Verify AI response is contextual (references user's goals/data)
- [ ] Screenshot: user message + AI response

### 8.3 Quick-Start Prompts
- [ ] Click one of the prompt buttons (e.g., "I'm struggling with motivation")
- [ ] Verify it sends as a message
- [ ] Verify AI responds appropriately
- [ ] Screenshot: prompt interaction

### 8.4 Coach Selector
- [ ] Click the coach selector dropdown
- [ ] Verify dropdown shows:
  - 6 default coaches (General, Mindset, Fitness, Nutrition, Productivity, Relationships)
  - Goal-specific coaches (one per active goal)
  - "Create Custom Coach" button
- [ ] Select a different coach
- [ ] Verify chat clears or switches to that coach's history
- [ ] Send a message to the new coach
- [ ] Verify response personality matches the coach
- [ ] Screenshot: coach selector expanded, different coach conversation

### 8.5 Create Custom Coach
- [ ] Click "Create Custom Coach" in the coach selector
- [ ] Verify CreateCoachModal appears with:
  - Name input
  - Description input
  - System prompt textarea
- [ ] Fill in all fields (e.g., Name: "Language Tutor", Description: "German practice")
- [ ] Submit
- [ ] Verify new coach appears in the coach selector
- [ ] Select the new coach and send a message
- [ ] Screenshot: creation modal, new coach in selector

### 8.6 Voice Input in Chat
- [ ] Click the microphone/voice input button
- [ ] **ASK USER:** "Please speak a question (e.g., 'How can I improve my consistency?')"
- [ ] Verify recording indicator
- [ ] Verify transcription appears as message text
- [ ] Verify AI responds to the transcribed message
- [ ] Screenshot: voice input flow

### 8.7 Mute Toggle
- [ ] Click the mute button
- [ ] Verify visual state changes (icon update)
- [ ] Send a message
- [ ] Verify AI response does NOT auto-play audio (if TTS was previously active)

---

## Phase 9: Live Voice Chat

### 9.1 Live Mode Layout
- [ ] Navigate to /expert/live
- [ ] Verify dark theme with orb visualization
- [ ] Verify status text ("Listening..." or similar)
- [ ] Verify coach selector button
- [ ] Verify mute TTS toggle
- [ ] Verify transcript area at bottom
- [ ] Screenshot: initial live mode state

### 9.2 Voice Conversation
- [ ] **ASK USER:** "Please speak a question to the AI coach (e.g., 'What are my goals?')"
- [ ] Verify orb changes color (listening -> processing -> speaking)
- [ ] Verify transcript updates with user's speech
- [ ] Verify AI response appears in transcript
- [ ] Verify TTS audio plays (unless muted)
- [ ] Screenshot: during listening, during response

### 9.3 Coach Selection in Live Mode
- [ ] Click coach selector
- [ ] Verify coach options appear
- [ ] Switch to a different coach
- [ ] Speak another question
- [ ] Verify response matches new coach's personality
- [ ] Screenshot: coach selector in live mode

### 9.4 Mute TTS in Live Mode
- [ ] Click mute toggle
- [ ] Speak a question
- [ ] Verify AI responds in text (transcript) but does NOT play audio
- [ ] Toggle mute off
- [ ] Speak again
- [ ] Verify audio plays

### 9.5 Multi-Turn Conversation
- [ ] Have a 3+ turn conversation
- [ ] Verify transcript shows full history (at least last 2 messages)
- [ ] Verify context is maintained across turns
- [ ] Screenshot: multi-turn transcript

---

## Phase 10: Progress Page

### 10.1 Progress Layout
- [ ] Navigate to /progress
- [ ] Verify PageHeader (icon, title, subtitle)
- [ ] Verify Pillars of Health grid (4 cards: Soul, Mind, Body, Goals)
- [ ] Verify each pillar card has: icon, label, stat value, sparkline
- [ ] Verify Overview stats (Streak, Completed, Success Rate, Skipped)
- [ ] Verify "Last 30 Days" calendar section
- [ ] Verify Trends chart section
- [ ] Screenshot: full progress page

### 10.2 Calendar Heatmap
- [ ] Verify 30-day calendar grid renders
- [ ] Verify day numbers are readable (contrast fix applied)
- [ ] Verify color coding: green=completed, red/orange=skipped, gray=none
- [ ] Verify "Today" indicator (teal border)
- [ ] Verify goal filter dropdown
- [ ] Select a specific goal from filter
- [ ] Verify calendar updates to show only that goal's data
- [ ] Screenshot: calendar with filter applied

### 10.3 Trends Chart
- [ ] Verify chart renders with data (or empty state message)
- [ ] Click "mood" toggle button
- [ ] Click "energy" toggle button
- [ ] Click "motivation" toggle button
- [ ] Verify chart line updates for each metric
- [ ] Screenshot: trends chart with different metrics

### 10.4 Progress by Goal Section
- [ ] Scroll to bottom
- [ ] Verify each goal shows: name, completion percentage, challenge counts
- [ ] Verify progress bars for each goal
- [ ] Screenshot: goal progress section

---

## Phase 11: Profile Page

### 11.1 Profile Layout
- [ ] Navigate to /profile
- [ ] Verify PageHeader (icon, title, days count)
- [ ] Verify avatar display (initials or uploaded image)
- [ ] Verify Stats grid (Streak, Challenges Done, Goals Completed, Diary Entries)
- [ ] Verify "Your Goals" list with status badges (active/completed/archived)
- [ ] Verify Settings and Logout links
- [ ] Verify NO duplicate bottom nav
- [ ] Screenshot: full profile page

### 11.2 Avatar Upload
- [ ] Click the avatar/upload area
- [ ] **ASK USER:** "Please select a profile picture file"
- [ ] Verify preview appears
- [ ] Verify upload succeeds
- [ ] Verify avatar updates on the page
- [ ] Screenshot: avatar upload flow

### 11.3 Pluralization Check
- [ ] Verify "X days on your transformation journey" (not "1 days")
- [ ] Screenshot if bug persists

---

## Phase 12: Settings Page

### 12.1 Settings Layout
- [ ] Navigate to /settings
- [ ] Verify heading "Settings" (no theme toggle)
- [ ] Verify NO duplicate bottom nav
- [ ] Verify sections: Profile, Challenge Generation, Focus Areas, AI Personality, AI Voice, Notifications
- [ ] Screenshot: full settings page (scroll to capture all)

### 12.2 Profile Section
- [ ] Verify Display Name input (pre-filled)
- [ ] Change the display name
- [ ] Verify Accent Color picker (5 options: Teal, Gold, Blue, Purple, Rose)
- [ ] Click a different accent color (e.g., Gold)
- [ ] Verify app accent color changes immediately
- [ ] Screenshot: accent color changed

### 12.3 Challenge Generation Section
- [ ] Verify Difficulty slider (1-10)
- [ ] Drag slider to a different value
- [ ] Verify label updates (e.g., "Moderate - balanced challenge")
- [ ] Verify Challenges Per Day buttons (1, 2, 3, 5)
- [ ] Click a different count
- [ ] Verify Challenge Length buttons (5-15 min, 15-30 min, 30+ min)
- [ ] Verify Best Time buttons (Morning, Afternoon, Evening, Anytime)
- [ ] Verify Reality Shift toggle
- [ ] Screenshot: challenge settings modified

### 12.4 Focus Areas Section
- [ ] Verify text input for focus areas
- [ ] Type a focus area (e.g., "morning routines")
- [ ] Click "Add"
- [ ] Verify it appears as a tag/chip
- [ ] Screenshot: focus area added

### 12.5 AI Personality Section
- [ ] Verify 4 personality cards (Encouraging, Tough Love, Scientific, Casual Friend)
- [ ] Click a different personality
- [ ] Verify active state changes
- [ ] Verify "Include Scientific Basis" toggle
- [ ] Screenshot: personality selection

### 12.6 AI Voice Section
- [ ] Verify 9 voice options (Alloy, Ash, Coral, Echo, Fable, Onyx, Nova, Sage, Shimmer)
- [ ] Click a different voice
- [ ] Verify selection highlight changes
- [ ] Screenshot: voice selection

### 12.7 Notifications Section
- [ ] Verify "Daily Reminders" toggle
- [ ] Verify "Streak Protection" toggle
- [ ] Toggle each on/off
- [ ] Screenshot: notification settings

### 12.8 Save Settings
- [ ] Click "Save Settings" button
- [ ] Verify success feedback (toast notification or visual confirmation)
- [ ] Refresh the page
- [ ] Verify all changed settings persisted
- [ ] Screenshot: save confirmation

---

## Phase 13: Navigation

### 13.1 Bottom Navigation
- [ ] Verify 4 nav items: Home, Tracking, Progress, Expert
- [ ] Click Home -- verify redirect to /
- [ ] Click Progress -- verify redirect to /progress
- [ ] Click Expert -- verify redirect to /expert
- [ ] Verify active tab highlighting (teal accent, underline)
- [ ] Screenshot: each nav state

### 13.2 Tracking Submenu
- [ ] Click "Tracking" in bottom nav
- [ ] Verify submenu dropdown appears above the nav
- [ ] Verify 3 items: Daily Habits, Voice Diary, Check-in
- [ ] Click "Daily Habits" -- verify redirect to /habits
- [ ] Click "Voice Diary" -- verify redirect to /diary
- [ ] Click "Check-in" -- verify redirect to /survey
- [ ] Click outside the submenu -- verify it closes
- [ ] Screenshot: tracking submenu expanded

### 13.3 Top Navigation
- [ ] Verify profile icon (top-left)
- [ ] Click profile icon -- verify redirect to /profile
- [ ] Verify app title "Grow Daily" in center
- [ ] Click title -- verify redirect to /
- [ ] Verify settings gear icon (top-right)
- [ ] Click settings icon -- verify redirect to /settings
- [ ] Screenshot: top nav elements

---

## Phase 14: Goal Management

### 14.1 Create New Goal
- [ ] Navigate to /goals/new
- [ ] Verify domain selector grid (8 categories with icons and descriptions)
- [ ] Select a domain (e.g., "Fitness")
- [ ] Verify goal creation form appears
- [ ] Fill in: Title, Current State, Desired State
- [ ] Adjust difficulty slider
- [ ] Submit
- [ ] Verify redirect to dashboard with new goal visible
- [ ] Screenshot: domain selector, creation form, new goal on dashboard

### 14.2 Goal Actions
- [ ] On dashboard, test "+ Add Goal" link
- [ ] Verify redirect to /goals/new
- [ ] Test goal checkmark (complete) button
- [ ] Test goal trash (delete) button
- [ ] Screenshot: goal action results

---

## Phase 15: Error Handling & Edge Cases

### 15.1 404 Page
- [ ] Navigate to a non-existent URL (e.g., /this-page-does-not-exist)
- [ ] Verify dark-themed not-found page appears
- [ ] Verify "Go Home" link works
- [ ] Screenshot: 404 page

### 15.2 Error Page
- [ ] Trigger an error if possible (e.g., navigate to a page that crashes)
- [ ] Verify dark-themed error page with "Try Again" and "Go Home" buttons
- [ ] Screenshot: error page (if triggerable)

### 15.3 Empty States
- [ ] Verify diary page empty state (if no entries)
- [ ] Verify habits page with no habits
- [ ] Verify progress page with no survey data
- [ ] Screenshot: each empty state

### 15.4 Network/API Error Handling
- [ ] Verify error messages appear when API calls fail
- [ ] Check console for unhandled errors

---

## Phase 16: Dark Mode Consistency

### 16.1 Page-by-Page Dark Mode Check
- [ ] Verify EVERY page has dark background (#121212)
- [ ] Verify NO light-mode artifacts (white backgrounds, light cards)
- [ ] Verify text contrast is adequate on every page
- [ ] Verify card borders are visible on every page
- [ ] Verify bottom nav is consistently dark on every page
- [ ] Verify top nav is consistently dark on every page

---

## Phase 17: PWA & Performance

### 17.1 Service Worker
- [ ] Verify no service worker errors in console
- [ ] Verify manifest.json loads (check Network tab or console)

### 17.2 Console Errors
- [ ] Check console on each page for errors
- [ ] Document any JavaScript errors
- [ ] Document any 404 errors (favicon, etc.)

---

## Execution Notes

- Take screenshots at every checkpoint marked "Screenshot"
- For voice features, ASK USER to speak when indicated
- Document any bugs found with: page, steps to reproduce, expected vs actual behavior
- Save final report to docs/FUNCTIONALITY_TEST_REPORT.md
