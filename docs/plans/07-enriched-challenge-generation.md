# Plan 07: Enriched Challenge Generation with Full User Context

**Status:** Draft -- awaiting approval
**Scope:** `app/api/challenges/generate/route.ts`, `lib/db/challenges.ts`
**Risk:** Low -- single route change, no schema changes, no new dependencies

---

## Problem

Challenge generation currently operates in a context vacuum. The AI sees:
- Goal metadata (title, domain, current/desired state)
- Aggregated stats (avg difficulty, avg satisfaction, avg mood/energy)
- Last 5 challenge titles (for dedup only)
- Last 3 completion notes

It does NOT see:
- What the user wrote in diary entries
- What they told their coaches in expert chat
- Individual challenge feedback (per-challenge difficulty/satisfaction/notes)
- Survey details (biggest win, biggest blocker, stress, sleep)
- Habit data (what habits they track, completion rates)
- Onboarding answers (motivation, starting point, biggest challenge)

Tips are requested in the AI prompt but the response schema in the route doesn't include them. The `createChallenge()` DB function accepts `tips: string[]` but the route never passes tips. So challenges are saved without tips, and the UI falls back to generic placeholder tips.

## Solution

Enrich `buildUserContextMessage()` with the user's full activity history, and add `tips` to the response schema so they're co-generated with the challenge sharing the same rich context.

---

## Architecture

### Data Windows

Two time windows, chosen to balance context richness with token budget:

**All-time (compact format, ~2-3K tokens):**
- All past challenges with individual logs: title, status, difficulty assigned vs felt, satisfaction, user notes
- This enables pattern detection: "user completes morning challenges but skips evening ones", "user rates physical challenges high satisfaction"

**7-day window (detailed, ~2-3K tokens):**
- Check-in surveys: full detail (mood, energy, stress, sleep, biggest win, biggest blocker)
- Diary entries: AI summaries only (not full transcripts)
- Habit completion: which habits done/missed, weekly rate
- Expert chat: last 3 user messages per coach (themes the user is discussing)

**Static context (always included, ~500 tokens):**
- Onboarding answers (motivation, current situation, biggest challenge)
- User preferences (already included)

**Estimated total additional input:** ~5-6K tokens (~$0.015-0.018 per generation at Sonnet pricing)

### Response Schema Changes

Current schema asks for:
```json
{
  "title": "...",
  "description": "...",
  "instructions": "...",
  "difficulty": 5,
  "isRealityShift": false,
  "successCriteria": "...",
  "scientificBasis": "...",
  "estimatedMinutes": 20
}
```

New schema adds `tips` and makes them context-aware:
```json
{
  "title": "...",
  "description": "...",
  "instructions": "...",
  "difficulty": 5,
  "isRealityShift": false,
  "successCriteria": "...",
  "scientificBasis": "...",
  "estimatedMinutes": 20,
  "tips": [
    "Personalized tip referencing user history",
    "Personalized tip referencing user history",
    "Personalized tip referencing user history"
  ]
}
```

### Prompt Changes

Add to SYSTEM_PROMPT's CHALLENGE STRUCTURE section:
```
"tips": ["3 personalized tips that reference the user's specific history, patterns, or recent activity. Do NOT give generic advice like 'stay hydrated' or 'be consistent'. Instead reference what you know: their diary entries, past challenge feedback, habit patterns, or coach conversations."]
```

Add to DESIGN PRINCIPLES:
```
5. **Personalized Tips**: Each tip must reference something specific from the user's data:
   - What they said in diary entries or to their coach
   - Patterns in their challenge feedback (what they find hard/easy/satisfying)
   - Their habit completion patterns and streaks
   - Their recent mood/energy/stress trends
   - Their stated motivation and biggest challenges from onboarding
   Never generate tips that could apply to any user. Every tip should feel like it was written for THIS person.
```

---

## Implementation Steps

### Step 1: Add DB query for expert chat recent messages

Add a new function to `lib/db/coaching.ts`:

```typescript
async function getRecentChatMessagesByUser(userId: string, maxMessagesPerCoach: number = 3): Promise<{coachId: string; messages: string[]}[]>
```

This extracts the user's last N messages (role=user only) from each expert chat conversation. We only need the user's messages -- what THEY said reveals their concerns, not what the AI responded.

### Step 2: Enrich `getFullUserContext()` in the route

Add parallel fetches for:
1. `db.getDiaryEntriesByUserId(userId, 7)` -- 7-day diary entries (AI summaries)
2. `db.getSurveysByUserId(userId, 7)` -- already fetched, but we'll use full detail instead of just aggregates
3. `db.getHabitStats(userId, 7)` -- 7-day habit stats
4. `db.getRecentChatMessagesByUser(userId, 3)` -- last 3 user messages per coach
5. `user.onboardingData` -- parse onboarding answers
6. All challenge logs (already fetched via `allChallengesData` with `include: { logs: true }`)

Most of these are already fetched by `getUserContext()` in `lib/ai/context.ts` but the challenge route uses its own `getFullUserContext()`. Rather than refactoring to share, we'll enrich the existing function in-place (less risk, cleaner diff).

### Step 3: Enrich `buildUserContextMessage()`

Add new sections to the prompt:

```
=== USER BACKGROUND (from onboarding) ===
Motivation: "..."
Starting point: "..."
Biggest challenge: "..."

=== ALL PAST CHALLENGES (complete history) ===
- "Title" | completed | assigned:5 felt:7 satisfaction:8 | "user notes"
- "Title" | skipped | assigned:6 | reason: "too tired"
...

=== RECENT CHECK-INS (last 7 days) ===
- [Apr 1] Mood:7 Energy:6 Stress:4 Sleep:8 | Win: "ran 2km" | Blocker: "knee pain"
- [Mar 31] Mood:5 Energy:4 Stress:7 Sleep:5 | Win: "meditated" | Blocker: "work stress"
...

=== RECENT DIARY (last 7 days, AI summaries) ===
- [Apr 1] "User reflected on morning routine improvements, mentioned enjoying outdoor exercise more than gym"
- [Mar 30] "Expressed frustration with consistency but noted that shorter sessions feel more achievable"
...

=== HABIT PATTERNS (last 7 days) ===
Completion rate: 75% (15/20)
- "Morning Run" [5/7 days, 3-day streak]
- "Meditation" [7/7 days, 12-day streak]
- "Water" [3/7 days, no streak]
...

=== WHAT USER IS DISCUSSING WITH COACHES ===
- General Coach: "I'm struggling with motivation in the evenings", "How do I deal with knee pain during runs?"
- Run 5K Coach: "Should I run every day or take rest days?"
...
```

### Step 4: Update response schema and tip instructions

Update SYSTEM_PROMPT to include `tips` in the challenge structure and add the personalization principle. Update `max_tokens` from 1000 to 1500 to accommodate tips.

### Step 5: Pass tips when saving to DB

Currently the route does:
```typescript
const saved = await db.createChallenge({
    ...
    personalizationNotes: `${challenge.instructions}\n\n...`
});
```

Change to also pass tips:
```typescript
const saved = await db.createChallenge({
    ...
    tips: challenge.tips || [],
    personalizationNotes: `${challenge.instructions}\n\n...`
});
```

The `createChallenge()` DB function already accepts `tips?: string[]` and stringifies it as JSON into the `tips` column. No schema change needed.

### Step 6: Verify UI displays tips

Check that the challenge detail page reads and renders the `tips` JSON field. If it currently falls back to hardcoded tips when `tips` is null, it should now get real AI-generated tips.

---

## Files Changed

| File | Change | Risk |
|------|--------|------|
| `app/api/challenges/generate/route.ts` | Enrich context, update schema, pass tips | Medium -- main change |
| `lib/db/coaching.ts` | Add `getRecentChatMessagesByUser()` | Low -- new function only |
| `lib/db/index.ts` | Already exports all from coaching.ts | None |

No schema changes. No new dependencies. No migration needed.

---

## Token Budget Estimate

| Section | Est. Tokens |
|---------|-------------|
| System prompt (existing + tips principle) | ~600 |
| Goal + journey + adaptation (existing) | ~300 |
| Onboarding answers | ~150 |
| All-time challenge history (30 challenges) | ~1,500 |
| 7-day surveys (7 entries, full detail) | ~500 |
| 7-day diary summaries (3-5 entries) | ~400 |
| 7-day habit stats | ~200 |
| Expert chat user messages (3 msgs x 3 coaches) | ~400 |
| Preferences (existing) | ~200 |
| **Total input** | **~4,250** |
| **Output (1 challenge + tips)** | **~300** |

At Sonnet pricing ($3/M input, $15/M output): ~$0.017 per generation. Negligible.

---

## What This Enables (examples of AI-generated tips)

**Before (generic):**
- "Stay focused on your goal"
- "Take breaks if needed"
- "Track your progress"

**After (personalized):**
- "You mentioned knee pain in your coach chat -- try the low-impact variation and stop if pain returns"
- "Your diary shows you prefer outdoor exercise over gym. Do this challenge at the park for better motivation"
- "You've rated similar challenges 8/10 satisfaction but 7/10 difficulty. You'll find this challenging but rewarding"
- "Your Morning Run habit has a 5/7 completion rate. Stack this challenge right after your run while your energy is high"
- "Your stress has been elevated this week (avg 7/10). This challenge is intentionally lighter to maintain momentum without burnout"

---

## Testing Strategy

1. **Manual test:** Generate a challenge for the demo user (who has rich history) and verify tips reference actual user data
2. **Token check:** Log input token count to confirm we stay under 6K additional tokens
3. **Existing tests:** Run `npm test` to ensure no regressions (challenge generation tests use mocked AI responses)
4. **Build:** `npx next build` to verify TypeScript clean

---

## Out of Scope

- Refactoring `getFullUserContext()` to share with `lib/ai/context.ts` (separate sprint 4 task)
- Challenge detail UI changes (tips rendering -- verify only, fix if broken)
- The secondary OpenAI-based functions in `lib/ai.ts` (unused by the main route)
