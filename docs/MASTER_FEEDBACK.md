# Master Feedback & Improvement Checklist

> **Last Updated**: January 27, 2026  
> Consolidated from: FUNCTIONALITY_FEEDBACK.md, DESIGN_FEEDBACK.md, UI_FEEDBACK.md, user_style_feedback.md

---

---

## Jan 29 Outstanding Issues

### AI & Backend Core

- [ ] **Daily Challenge Rotation** — Challenges should reset daily (old ones disappear, new ones active).
- [ ] **Fix New Challenges Nesting** — Newly created challenges do not appear nested under the goal (Dashboard bug).
- [ ] **AI Context** — Expert/Check-in AI only knows one goal; must have context of ALL goals.
- [ ] **Voice Settings** — Add options for voice selection, speed, and emotion.

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

### Check-in Flow

- [ ] **Voice Check-in Fixes** — Port Expert Chat layout fixes (fullscreen, no cut-offs).
- [ ] **Progress Bar** — Replace coach selection with progress bar.
- [ ] **All Goals** — Check-in must ask about *all* goals, not just one.

---

## Jan 28 Outstanding Issues

### Dashboard

- [ ] **Fix new challenges not showing up** — Old challenges appear, but newly created ones are not visible under the goal.

### Navigation

- [ ] **Fix dropdown layout** — Icons/items are misplaced (side-by-side instead of stacked).
- [ ] **Fix Check-in link** — Redirects to Progress page instead of Check-in page.
- [ ] **Change Check-in icon** — Remove charts icon, use correct check-in icon.

### Voice Features (Habits & Diary)

- [ ] **Habit Log Positioning** — Should open *in front* of habits (modal/overlay), not below.
- [ ] **Habit Log Style** — Make background semi-transparent (glassmorphism).
- [ ] **Standardize Voice UI** — Pulsing center icon to finish.
- [ ] **Add Controls** — Add "Stop" and "Pause" buttons at the bottom.
- [ ] **Consistent Style** — Apply same UI/UX to Voice Diary.

### Progress Page

- [ ] **Fix Mood/Energy Graph** — Currently just lines at the bottom; needs to properly plot the graph.

### Expert Chat

- [ ] **Fix Bottom Gap** — Remove black bar; chat box must connect to bottom navigation.
- [ ] **Fix Top Overlap** — Top nav cuts off the top of the chat box/dropdown.
- [ ] **Coach Selector Grid** — Fix spacing/grid of coach items; ensure it uses full screen width.

---

## 🔴 Critical Bugsation

- [x] **Navigation bar shifting bug** — Clicking "Progress" causes Habits to disappear and Diary to appear; clicking Diary reverses it inconsistently

### Challenge System

- [ ] **Challenge Library "See details" broken** — Button shows no content
- [ ] **Challenge Library "Generate more with AI" broken** — Challenges are not generated
- [ ] **Challenge Generator quality bug** — Does not create real challenges; only generates one trivial challenge that rewords goal start/end points instead of multiple actionable challenges
- [ ] **Tips for Success are generic** — Always the same tips regardless of challenge content; should be tailored to the specific challenge
- [ ] **Challenge needs better structure** — Add separate fields: Description (what to do) and Success Criteria (how you know it's complete)

### Voice Features

- [ ] **Habits Voice Lock transcription broken** — Displays "lots of recording", acts buggy
- [ ] **Habits Voice Lock processing hangs** — No loading indicator, doesn't complete
- [ ] **Voice Diary transcription empty** — Logic runs in background but transcript text box stays empty
- [ ] **Voice Diary insights broken** — Insights section is empty, should generate insights about the entry

### Expert Chat

- [ ] **Chat doesn't fill window** — Gap at bottom, terrible UX
- [ ] **Input pushes content up** — Gap increases when typing
- [ ] **Window not locked to screen** — Can move the entire window around; should be fixed to screen with only chat content scrollable
- [ ] **Send button cut off** — Right side of send button is clipped/not visible
- [ ] **Suggestion prompts stacked vertically** — "I'm struggling with motivation" etc. should be single line, swipeable left/right for more ideas
- [ ] **Coach selector dropdown too transparent** — Background is almost see-through; only icons visible; needs less opacity/more solid background
- [ ] **Coach icons overflow screen** — With many coaches (6-7+), need to scroll horizontally; should fit within screen or have better overflow handling

### Diary Page

- [ ] **Insights numbers broken** — Numbers below insights don't do anything

---

## 🟠 High Priority Issues

### Homepage

- [ ] **Top bar branding** — Replace "Transform" text with squirrel logo image and a short motivational quote (e.g., "Let's do this!", "Go for it!")
- [ ] **Action buttons too small** — Finish/Delete goal buttons need to be larger
- [ ] **Misplaced quick actions** — Log habits, Voice diary, Check-in should be in nav, not homepage
- [ ] **Challenges not visible under goals** — Currently only shows "1 completed today" summary with no way to see actual challenges. Need:
  - Summary at top: "X completed today"
  - Below summary: Individual box for each outstanding (non-completed) challenge
  - Each challenge should be clickable/viewable
- [ ] **Completed challenges count missing** — Should show how many challenges were completed (e.g., "3 completed today")
- [ ] **New challenges don't appear after creation** — After generating challenges, they don't show up under the goal even after multiple reloads; should auto-refresh and display immediately
- [ ] **Challenge Library missing from homepage** — The "Browse Challenges" section has disappeared; restore it below goals and above stats

### Navigation

- [ ] **Redesign quick actions dropdown** — Top-right dropdown design is poor; needs visual overhaul
- [ ] **Restructure bottom navigation** — New layout: **Home | Tracking | Progress | Expert**
- [ ] **Create "Tracking" bucket** — Consolidates habits and check-in activities into one menu
  - Accessible from: Bottom nav "Tracking" button AND top-right quick action icon
  - **Tracking menu options:**
    - Log Habits
    - Voice Diary
    - Manual Check-in (written form)
    - Voice Guided Check-in (AI interactive conversation)
- [ ] **Add active page highlight** — Current page should be visibly highlighted in bottom navigation bar

### Progress Page

- [ ] **Calendar direction confusing** — Bottom-right to top-left feels unnatural
- [ ] **No date connection** — Can't tell when progress started
- [ ] **Multi-goal confusion** — Progress not goal-specific

### Diary Page

- [ ] **Header too close to top** — "Voice Diary" heading feels unfinished
- [ ] **Entries need boxing** — Group date, duration, analysis as one visual unit

### Profile & Settings

- [ ] **Challenge sliders too squished** — Difficulty slider cramped
- [ ] **"Best time for challenges" boxes unequal** — Poorly managed sizing

---

## 🟡 Medium Priority Issues

### Homepage

- [ ] **Design feels dated** — Needs more modern styling
- [ ] **Add Goal/Challenges lacks borders** — Buttons need clearer visual boundaries
- [ ] **Goal card layout squished** — Layout feels compressed
- [ ] **Text spacing inconsistent** — Some text oddly spaced
- [ ] **"Browse All" needs border** — Today's challenges section

### Progress Page

- [ ] **Icon next to "Your Progress" looks weird**
- [ ] **Poor spacing below heading** — Text looks unprofessional
- [ ] **Section spacing too tight** — Overview ↔ Last 30 Days needs more gap
- [ ] **Inconsistent navigation naming** — "Dashboard" vs "Home"; "Daily check-in" styled differently

### Habits Page

- [ ] **Heading alignment** — Consider centering with better subheading placement
- [ ] **Design uniformity needed** — Should match other pages
- [ ] **Voice log styling mismatch** — Doesn't fit rest of style
- [ ] **Voice habit logger positioning** — Opens inline below habits list; should pop up as modal/overlay in front of habits screen

### Diary Page

- [ ] **Recording area lacks boxing** — Currently text on background
- [ ] **Entry design spacing off** — Needs better visual grouping
- [ ] **Too many entries showing** — Only show last 3 recent entries; insights should appear below entries without excessive scrolling
- [ ] **Long text not truncated** — Transcript and AI analysis should be compressed with "Read more" to expand; avoid showing full text by default
- [ ] **Text border styling** — Borders should be rounded and have more padding so text doesn't touch the edge

### Profile Page

- [ ] **No profile picture upload** — Needed for both profile and homepage
- [ ] **"Add new goals" misplaced** — Shouldn't be on profile page
- [ ] **Settings boxes need separation** — Very slight black hints not enough
- [ ] **Reality Shift checkbox too simple** — Not visually nice
- [ ] **Notification checkboxes need better styling**

### Design Polish

- [ ] **Confirmation modals use browser defaults** — Goal complete/delete shows browser dialog with "improvement-app.vercel.app says: Are you sure..."; needs custom in-app modal with nicer message and styling that matches the app
- [ ] **Loading states missing** — Needs breathing animations, transitionary color fades
- [ ] **Icons too basic** — Need nicer icons throughout (especially Expert Coach)

---

## 🟢 Low Priority Issues

### Homepage

- [ ] **Stats positioning** — Consider centering stats

### Progress Page

- [ ] **Section separators weak** — Barely visible separation lines

### Habits Page

- [ ] **7-day limit display** — Only shows last 7 days (acceptable for now)

### Profile Page

- [ ] **Challenges per day** — Consider adding custom field option

---

## 🔧 Workflow Improvements

### Challenge System

- [ ] **Add Accept/Decline flow for generated challenges** — Similar to Challenge Library manual Accept flow; consider making auto-accept vs review a setting

### Expert Coach

- [ ] **Auto-select custom coach on creation** — Should be active immediately after creation
- [ ] **Suggestions UI too obstructive** — Make single line above chat input; allow swipe left/right for more
- [ ] **Add typewriter effect for responses** — Character-by-character or word-by-word appearance
- [ ] **Fix scroll anchoring** — Don't auto-scroll during generation; anchor to top of new message

### Voice Diary

- [ ] **Missing Delete/Remove/Back buttons** — Interface lacks basic controls
- [ ] **Missing progress indicator when saving** — No feedback until "Entry saved" appears

### Voice Features

- [ ] **Habits Voice Lock positioning** — Audio interface too low; should be more prominent/focal

---

## ➕ Missing Features

### Progress Page

- [ ] **Current day indicator** — Need yellow highlight or similar for current day

### Settings Parity with Onboarding

- [ ] **Primary Challenge preference** — Starting vs Consistency
- [ ] **Time investment per day**
- [ ] **Challenges per day**
- [ ] **Preferred challenge length**
- [ ] **Best time for challenges**
- [ ] **Reality Shift Mode**
- [ ] **AI Personality**
- [ ] **Scientific Basis toggle**
- [ ] **Notification preferences**

---

## 🎨 Global Design Requirements

- [ ] **Implement glassmorphism look** — Frosted glass cards, dark mode with teal accents (not purple)
- [ ] **Box accent colors too weak** — Outline and background accent colors need stronger/more vibrant saturation for better visibility
- [ ] **Boxing/Cards for all sections** — Clearer card-style boxing for visual separation
- [ ] **Consistent spacing** — Normalize padding/margins across all pages
- [ ] **Modern design system** — Research and implement best practices
- [ ] **Uniform styling** — All pages share same visual language
- [ ] **Consistent headings** — Ensure heading styles match across app
- [ ] **Expert chat microphone button** — Add voice input capability

---

## ✅ Completed

- [x] **Home Screen Goal/Challenge Display** — Challenges now appear nested under parent goals with border-left hierarchy
- [x] **Bottom navigation simplified** — Now Home, Diary, Habits, Expert (4 items)

---

## 📝 Positive Feedback (Keep These!)

- Profile page layout, stats, goals section, icon choices, green Save button
- Habits page tracking overview and unit-based design
- Expert chat overall design is very nice
