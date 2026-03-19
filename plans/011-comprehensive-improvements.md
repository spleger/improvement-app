# Plan 011: Comprehensive App Improvements

## Overview
8 parallel work streams covering bug fixes, live voice chat improvements, streamed challenge generation, push notifications, offline mode, weekly digest, goal milestones, and shared accountability.

## Architecture Decision: Scope & Pragmatism
Given the breadth of features, each work stream focuses on the **minimum viable implementation** that delivers real user value. No over-engineering. We can iterate later.

---

## Work Stream 1: Bug Fixes (No dependencies)

### 1a. Progress Page API Error
**Root Cause**: The `/api/progress` route calls `db.getActiveGoalByUserId()` which exists in `lib/db.ts:89`. The actual error is likely a Prisma query issue when a user has no active goals (returns null, which is fine) OR the progress page client code (`app/progress/page.tsx:69-70`) fails when `result.success` is falsy but doesn't show a useful error state.

**Files to modify:**
- `app/api/progress/route.ts` - Add better error logging, ensure graceful handling when no active goal
- `app/progress/page.tsx` - Add proper error state UI instead of showing zeros

**Changes:**
- Wrap each Promise.all item individually so one failure doesn't crash all
- Add error state display in progress page

### 1b. Habit Creation goalId Validation
**Root Cause**: `HabitCreateSchema` in `lib/validation.ts:22` has `goalId: z.string().optional()`. When the modal sends `null` (no goal selected), Zod rejects it because `null !== undefined`.

**Files to modify:**
- `lib/validation.ts:22` - Change to `z.string().nullable().optional()`

### 1c. Bottom Nav Content Overlap
**Root Cause**: The `.page` class has `padding-bottom: calc(var(--spacing-xl) + 80px + env(safe-area-inset-bottom))` but some pages use custom containers or the padding doesn't account for all content correctly.

**Files to modify:**
- `app/globals.css` - Ensure consistent bottom padding on all page-level containers
- Verify `.page-chat` and other custom page classes have adequate bottom padding

### 1d. Goal Celebration Modals Stacking
**Root Cause**: `GoalCelebrationWrapper.tsx` uses `sessionStorage` which resets per session. Multiple 30-day goals trigger multiple modals in sequence.

**Files to modify:**
- `app/components/GoalCelebrationWrapper.tsx` - Use `localStorage` instead of `sessionStorage` to persist across sessions. Show only one modal and mark all as celebrated.

### 1e. Habits Page Header Dark Mode
**Root Cause**: The `PageHeader` component uses `page-header-styled` class. Need to check if the habits-specific CSS overrides are breaking dark mode.

**Files to modify:**
- `app/globals.css` - Fix `.habits-page` or `page-header-styled` dark mode styles if needed

### 1f. Profile "1 days" Grammar
**File to modify:**
- `app/profile/page.tsx:48` - Add pluralization: `${n} ${n === 1 ? 'day' : 'days'}`

---

## Work Stream 2: Live Voice Chat Improvements

### 2a. More Aggressive TTS Chunking
**Current**: Waits for sentence endings (`/[.!?]\s/`) or clause breaks at 40+ chars.
**Change**: Lower clause threshold from 40 to 25 chars. Add word-count-based splitting (every ~15 words if no punctuation detected). This gets first audio playing faster.

**Files to modify:**
- `app/expert/live/page.tsx` - Lines 337-409 (sentence splitting logic)

### 2b. Barge-In Support
**Current**: If user speaks during AI response, VAD tries to record creating collisions.
**Change**: When `isSpeaking` transitions true during `speaking` state:
1. Stop current Audio playback (`audioRef.current.pause()`)
2. Clear TTS queue (`ttsQueueRef.current = []`)
3. Cancel any pending TTS fetches (use AbortController)
4. Transition to `listening` state immediately
5. Start recording

**Files to modify:**
- `app/expert/live/page.tsx` - Lines 492-504 (VAD effect), add barge-in logic
- Add `ttsAbortControllerRef` to cancel in-flight TTS requests

### 2c. Adaptive VAD Thresholds
**Current**: Hardcoded `speechThreshold: 0.03`, `silenceThreshold: 0.01`.
**Change**: Calibration phase during first 2 seconds after mic activation:
1. Collect RMS samples for 2 seconds
2. Calculate ambient noise floor (average RMS)
3. Set `speechThreshold = Math.max(noiseFloor * 3, 0.015)` (3x above ambient, minimum 0.015)
4. Set `silenceThreshold = Math.max(noiseFloor * 1.5, 0.008)`

**Files to modify:**
- `hooks/useVAD.ts` - Add calibration phase, new `calibrating` state
- `app/expert/live/page.tsx` - Show "Calibrating..." during calibration phase

### 2d. Retry Logic
**Change**: Add retry with exponential backoff for transcription and TTS:
- Max 2 retries per operation
- Delays: 500ms, 1500ms
- Only retry on network errors and 5xx responses (not 4xx)

**Files to modify:**
- `app/expert/live/page.tsx` - Wrap `fetch('/api/transcribe')` and `fetchTTSAudio()` with retry utility

### 2e. Thinking Acknowledgment
**Change**: After VAD detects speech end and recording stops:
1. Immediately show a visual pulse on the orb (scale animation)
2. Display "Processing..." text below orb
3. Optional: play a very short "acknowledgment" sound (a single soft tone, ~100ms, generated via Web Audio API oscillator -- no extra file needed)

**Files to modify:**
- `app/expert/live/page.tsx` - Add acknowledgment between `listening` -> `processing` transition

### 2f. Reduce Silence Window
**Current**: `endWindow: 1200ms` - very long pause before AI responds.
**Change**: Reduce to `800ms`. Users can always pause intentionally; 800ms is still long enough to distinguish sentence breaks from speech end.

**Files to modify:**
- `app/expert/live/page.tsx` - Line 82, change `endWindow: 1200` to `endWindow: 800`

---

## Work Stream 3: Streamed Challenge Generation

### Architecture
Convert challenge generation from request/response to SSE streaming. Each challenge streams as it's generated and saved, so the UI shows progressive results.

### API Route Changes
**File**: `app/api/challenges/generate/route.ts`
- Keep existing POST but return SSE `ReadableStream` instead of JSON
- Generate challenges one at a time (loop over count)
- For each challenge: generate via AI -> save to DB -> emit SSE event with challenge data
- Final event: `data: {"done": true, "context": {...}}`
- Fallback: if `Accept: text/event-stream` header missing, use old JSON behavior

### AI Function Changes
**File**: `lib/ai.ts`
- Add `generateSingleChallenge()` function that generates exactly 1 challenge
- Reuse existing prompt logic from `generateMultipleChallenges` but for count=1
- Return single challenge object + usage data

### UI Changes
**File**: `app/challenges/generate/page.tsx`
- Replace `fetch().then(json())` with `EventSource` or `fetch` + `ReadableStream` reader
- Show each challenge as it arrives with a fade-in animation
- Remove fake progress lines, replace with real progress ("Generated 1 of 3...")
- Keep auto-redirect countdown after all challenges received

**File**: `app/components/DailyChallengeLoader.tsx`
- Keep simple fetch for single challenge generation (count=1)
- No need for streaming since it's just one challenge

---

## Work Stream 4: Push Notifications

### Database Schema
Add to `prisma/schema.prisma`:
```prisma
model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String
  p256dh    String   // Public key for encryption
  auth      String   // Auth secret
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, endpoint])
  @@index([userId])
}
```
Add `pushSubscriptions PushSubscription[]` to User model.

### Dependencies
- `web-push` npm package (server-side push sending)

### Environment Variables
- `VAPID_PUBLIC_KEY` - Generated VAPID public key
- `VAPID_PRIVATE_KEY` - Generated VAPID private key
- `VAPID_EMAIL` - Contact email for VAPID

### API Routes (new files)
- `app/api/push/subscribe/route.ts` - POST: Save PushSubscription to DB
- `app/api/push/unsubscribe/route.ts` - POST: Remove subscription
- `app/api/push/send/route.ts` - POST: Send push to user (internal, for cron/triggers)
- `app/api/push/vapid/route.ts` - GET: Return public VAPID key

### Service Worker Changes
- `public/sw-push.js` - New file with push event listener and notification click handler
- Register this alongside existing workbox SW, or merge into sw.js custom section

### Client Integration
- `app/components/NotificationPermission.tsx` - New component: permission request banner
- `app/settings/SettingsForm.tsx` - Wire up `notificationsEnabled` toggle to subscribe/unsubscribe
- `hooks/usePushNotifications.ts` - New hook: manages subscription state, permission, subscribe/unsubscribe

### Notification Triggers
- **Streak reminder**: Check at user's `dailyReminderTime`, if no challenge completed today
- **Daily challenge**: When new challenge is generated
- **Check-in nudge**: If no survey completed by evening
- Implementation: Use Vercel Cron Jobs (`vercel.json` cron config) or client-side scheduling

### Notification Types
```typescript
type NotificationPayload = {
  type: 'streak_reminder' | 'daily_challenge' | 'checkin_nudge';
  title: string;
  body: string;
  url: string; // Where to navigate on click
};
```

---

## Work Stream 5: Offline Mode

### Strategy
Use a layered approach:
1. **Read caching**: Service worker caches API responses for key data
2. **Write queueing**: Failed writes stored in IndexedDB, synced when online
3. **UI indicator**: Show offline banner when navigator.onLine is false

### Service Worker Enhancements
**File**: `public/sw-custom.js` (new, imported by main sw.js)
- Cache key API responses with `stale-while-revalidate` for:
  - `/api/habits` (GET)
  - `/api/progress` (GET)
  - `/api/diary` (GET)
  - `/` (dashboard page data)
- Background sync registration for queued writes

### IndexedDB Write Queue
**File**: `lib/offlineQueue.ts` (new)
- `queueWrite(url, method, body)` - Store failed POST/PUT/PATCH in IndexedDB
- `processQueue()` - Replay queued writes when online
- `getQueueSize()` - For UI indicator

### Offline Indicator
**File**: `app/components/OfflineIndicator.tsx` (new)
- Listens to `navigator.onLine` and `online`/`offline` events
- Shows a small banner: "You're offline. Changes will sync when you reconnect."
- Shows queue count if pending writes exist

### Client Integration
- `app/layout.tsx` - Add `<OfflineIndicator />` component
- Key pages (habits, diary) - Wrap mutation fetches with queue fallback

### What Works Offline
- View cached dashboard, habits, diary, progress data
- Log habit completions (queued)
- Write diary entries (queued)
- Does NOT work offline: AI chat, challenge generation, TTS (requires API)

---

## Work Stream 6: Weekly Digest

### Data Aggregation
**File**: `lib/db.ts` - Add new functions:
- `getWeeklyDigestData(userId, startDate, endDate)` - Returns:
  - Challenges: completed count, skipped count, avg difficulty, avg satisfaction
  - Surveys: avg mood/energy/motivation, trends (improving/declining/stable)
  - Diary: entry count, common themes, sentiment distribution
  - Habits: completion rate, best/worst habits, streak milestones
  - Goals: active count, days in journey

### AI Summary Generation
**File**: `lib/ai/digest.ts` (new)
- `generateWeeklyDigest(digestData)` - Calls Claude to generate:
  - 3-5 sentence progress summary
  - Top achievement of the week
  - Area needing attention
  - Personalized suggestion for next week
  - Motivational closing

### API Route
**File**: `app/api/digest/weekly/route.ts` (new)
- GET: Generate and return weekly digest for current user
- Caches result for the week (don't regenerate on every request)
- Stores digest in a new `WeeklyDigest` model or reuses `ProgressSnapshot`

### Database Schema
Add to `prisma/schema.prisma`:
```prisma
model WeeklyDigest {
  id              String   @id @default(cuid())
  userId          String
  weekStartDate   DateTime
  weekEndDate     DateTime
  rawData         String   @db.Text  // JSON: aggregated stats
  aiSummary       String   @db.Text  // AI-generated summary
  topAchievement  String?
  focusArea       String?
  suggestion      String?
  createdAt       DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, weekStartDate])
  @@index([userId])
}
```
Add `weeklyDigests WeeklyDigest[]` to User model.

### UI Page
**File**: `app/digest/page.tsx` (new)
- Shows current week's digest (or generates if not yet created)
- Previous weeks accessible via date navigation
- Stats cards + AI summary text
- Link from dashboard and bottom nav (or sidebar)

### Dashboard Integration
**File**: `app/page.tsx`
- Add a "Weekly Insights" card on dashboard linking to `/digest`
- Show brief snippet of AI summary if digest exists for current week

---

## Work Stream 7: Goal Milestones & Celebrations

### Milestone Calculation
Goals don't have explicit "progress percentage" -- they're time-based (30-day journeys). Milestones based on:
- **Day milestones**: Day 7 (1 week), Day 14 (2 weeks), Day 21 (3 weeks), Day 30 (complete)
- **Challenge milestones**: 5, 10, 20 challenges completed for a goal
- **Streak milestones**: 3-day, 7-day, 14-day, 21-day, 30-day streaks

### Database Schema
Add to `prisma/schema.prisma`:
```prisma
model Milestone {
  id          String   @id @default(cuid())
  userId      String
  goalId      String?
  type        String   // "day_7", "day_14", "day_21", "day_30", "challenges_5", "streak_7", etc.
  title       String
  description String?
  achievedAt  DateTime @default(now())
  celebrated  Boolean  @default(false)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, goalId, type])
  @@index([userId])
}
```
Add `milestones Milestone[]` to User model.

### Milestone Detection
**File**: `lib/milestones.ts` (new)
- `checkAndCreateMilestones(userId)` - Called after challenge completion, survey submission
- Checks all milestone conditions against current data
- Creates new Milestone records for newly achieved ones
- Returns list of newly achieved milestones (for celebration UI)

### API Route
**File**: `app/api/milestones/route.ts` (new)
- GET: Return user's milestones (achieved and upcoming)
- POST: Mark milestone as celebrated

### Celebration UI
**File**: `app/components/MilestoneCelebration.tsx` (new)
- Triggered when `checkAndCreateMilestones` returns new milestones
- Uses existing `canvas-confetti` library
- Shows a brief overlay: milestone icon + title + confetti burst
- Auto-dismisses after 3 seconds or on tap
- Queue multiple milestones (show one at a time)

### Dashboard Integration
- `app/page.tsx` - Check for uncelebrated milestones on load, trigger celebration
- Show "Recent Achievements" section with milestone badges

### Fix Existing GoalCelebrationWrapper
- `app/components/GoalCelebrationWrapper.tsx` - Migrate to use Milestone model instead of sessionStorage
- Check `Milestone` table for `type: "day_30"` + `celebrated: false`

---

## Work Stream 8: Shared Accountability

### Database Schema
Add to `prisma/schema.prisma`:
```prisma
model AccountabilityPartner {
  id          String   @id @default(cuid())
  userId      String   // The user who sent the invite
  partnerId   String   // The user who accepted
  status      String   @default("pending") // "pending", "active", "declined", "removed"
  inviteCode  String   @unique
  createdAt   DateTime @default(now())
  acceptedAt  DateTime?

  user    User @relation("UserPartners", fields: [userId], references: [id], onDelete: Cascade)
  partner User @relation("PartnerOf", fields: [partnerId], references: [id], onDelete: Cascade)

  @@unique([userId, partnerId])
  @@index([userId])
  @@index([partnerId])
  @@index([inviteCode])
}
```
Add relations to User model:
```prisma
partners    AccountabilityPartner[] @relation("UserPartners")
partnerOf   AccountabilityPartner[] @relation("PartnerOf")
```

### Invite Flow
**File**: `app/api/accountability/invite/route.ts` (new)
- POST: Generate unique invite code, create pending partner record
- Returns shareable link: `/accountability/join?code=ABC123`

**File**: `app/api/accountability/accept/route.ts` (new)
- POST: Accept invite by code, update status to "active"
- Creates reciprocal visibility

**File**: `app/api/accountability/route.ts` (new)
- GET: List current partners with their public stats
- DELETE: Remove partnership

### Partner Stats (shared view)
**File**: `app/api/accountability/stats/route.ts` (new)
- GET `?partnerId=xxx`: Return partner's shareable stats:
  - Current streak
  - Challenges completed this week
  - Active goals (titles only, no details)
  - Habit completion rate this week
- Privacy: Only shares aggregate stats, not specific diary/chat content

### UI Pages
**File**: `app/accountability/page.tsx` (new)
- List current partners with their stats
- "Invite Partner" button -> generates link/code
- Each partner card shows: name, streak, weekly completion rate

**File**: `app/accountability/join/page.tsx` (new)
- Accept invite page (linked from shared invite code)
- Shows who invited, preview of what's shared
- "Accept" / "Decline" buttons

### Privacy Controls
- Only share: streak, challenge count, habit rate, goal titles
- Never share: diary content, chat history, specific challenge details, survey responses
- User can remove partner at any time

### Dashboard Integration
- `app/page.tsx` - Small "Partners" section showing partner streaks
- Optional: "Your partner completed 5 challenges this week!" nudge

---

## Dependency Graph & Parallelization

```
Stream 1 (Bugs)         -- no deps, run immediately
Stream 2 (Voice)        -- no deps, run immediately
Stream 3 (Challenges)   -- no deps, run immediately
Stream 4 (Push)         -- needs DB schema (PushSubscription model)
Stream 5 (Offline)      -- no deps, run immediately
Stream 6 (Digest)       -- needs DB schema (WeeklyDigest model)
Stream 7 (Milestones)   -- needs DB schema (Milestone model)
Stream 8 (Accountability) -- needs DB schema (AccountabilityPartner model)
```

**All 8 streams can run in parallel** since DB schema changes are additive (new models only, no column modifications to existing models). Schema changes from streams 4/6/7/8 can be merged into one `prisma db push`.

## Execution Order
1. Apply all Prisma schema changes first (one combined migration)
2. Run all 8 work streams in parallel
3. Merge, test, build
4. Deploy and browser test

---

## Files Summary

### New Files
- `lib/milestones.ts`
- `lib/ai/digest.ts`
- `lib/offlineQueue.ts`
- `hooks/usePushNotifications.ts`
- `app/api/push/subscribe/route.ts`
- `app/api/push/unsubscribe/route.ts`
- `app/api/push/send/route.ts`
- `app/api/push/vapid/route.ts`
- `app/api/digest/weekly/route.ts`
- `app/api/milestones/route.ts`
- `app/api/accountability/route.ts`
- `app/api/accountability/invite/route.ts`
- `app/api/accountability/accept/route.ts`
- `app/api/accountability/stats/route.ts`
- `app/components/NotificationPermission.tsx`
- `app/components/OfflineIndicator.tsx`
- `app/components/MilestoneCelebration.tsx`
- `app/digest/page.tsx`
- `app/accountability/page.tsx`
- `app/accountability/join/page.tsx`
- `public/sw-push.js`

### Modified Files
- `prisma/schema.prisma` - Add PushSubscription, WeeklyDigest, Milestone, AccountabilityPartner models
- `lib/db.ts` - Add functions for new models + weekly digest data aggregation
- `lib/validation.ts` - Fix HabitCreateSchema goalId, add new schemas
- `lib/ai.ts` - Add generateSingleChallenge for streaming
- `app/api/progress/route.ts` - Fix error handling
- `app/api/challenges/generate/route.ts` - Add SSE streaming support
- `app/challenges/generate/page.tsx` - SSE client, progressive UI
- `app/expert/live/page.tsx` - Voice improvements (TTS, barge-in, retry, acknowledgment)
- `hooks/useVAD.ts` - Adaptive thresholds with calibration
- `app/components/GoalCelebrationWrapper.tsx` - Use localStorage + Milestone model
- `app/components/BottomNavigation.tsx` - Ensure consistent sizing
- `app/globals.css` - Bottom padding fixes, habits dark mode
- `app/profile/page.tsx` - Grammar fix
- `app/page.tsx` - Dashboard integration (digest, milestones, partners)
- `app/layout.tsx` - Add OfflineIndicator
- `app/settings/SettingsForm.tsx` - Wire notification toggle
- `package.json` - Add web-push dependency
