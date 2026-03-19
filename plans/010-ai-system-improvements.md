# Plan 010: AI System Improvements

## Overview

Five interconnected improvements to make the AI system smarter, more personalized, and cost-transparent. Model upgrade from Claude 3 Haiku to Sonnet 4.6, cost tracking in profile, conversation memory that persists across resets, coaching prompt overhaul, and smarter challenge generation.

## Phase 1: Model Upgrade + Cost Tracking

### 1A. Model Upgrade

Change `claude-3-haiku-20240307` to `claude-sonnet-4-6` in all 6 Anthropic routes:

| File | Line | Current |
|------|------|---------|
| `app/api/expert/chat/stream/route.ts` | ~84 | claude-3-haiku-20240307 |
| `app/api/expert/chat/route.ts` | ~97 | claude-3-haiku-20240307 |
| `app/api/interview/route.ts` | ~225 | claude-3-haiku-20240307 |
| `app/api/diary/route.ts` | ~36 | claude-3-haiku-20240307 |
| `app/api/onboarding/analyze/route.ts` | ~66 | claude-3-haiku-20240307 |
| `app/api/habits/interpret/route.ts` | ~77 | claude-3-haiku-20240307 |

Extract model constant to `lib/anthropic.ts`:
```typescript
export const ANTHROPIC_MODEL = 'claude-sonnet-4-6';
```

### 1B. Cost Tracking

**New Prisma model:**
```prisma
model ApiUsage {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  route     String   // e.g. "expert/chat/stream", "diary", "tts"
  provider  String   // "anthropic" or "openai"
  model     String   // "claude-sonnet-4-6", "gpt-4o", "tts-1", "whisper-1"
  inputTokens  Int?
  outputTokens Int?
  costCents    Float  // cost in cents (e.g. 0.45 = $0.0045)
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([userId, createdAt])
}
```

**Cost calculation helper** (`lib/ai/costs.ts`):
```typescript
// Sonnet 4.6 pricing: $3/M input, $15/M output
// GPT-4o pricing: $2.50/M input, $10/M output
// TTS-1: $15/M chars
// Whisper: $0.006/min
export async function logApiUsage(params: {
  userId: string;
  route: string;
  provider: 'anthropic' | 'openai';
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}): Promise<void>
```

Anthropic `messages.create()` and `messages.stream()` return `usage: { input_tokens, output_tokens }` -- capture these after each call. OpenAI also returns usage in response.

**New API route** (`app/api/usage/route.ts`):
- GET: Returns `{ totalCostCents, last7DaysCostCents, breakdown[] }`
- Query: `WHERE userId = ? GROUP BY` for totals, filtered by `createdAt >= 7 days ago` for rolling

**Profile page addition** (`app/profile/page.tsx`):
- New "API Usage" card below stats grid
- Shows: Total cost (all time), Last 7 days cost
- Format: "$X.XX" (cents converted to dollars)
- Breakdown by provider optional (Anthropic vs OpenAI)

### 1B Files Changed
- `prisma/schema.prisma` -- Add ApiUsage model, add relation to User
- `lib/ai/costs.ts` -- New file: cost calculation + logging helper
- `app/api/usage/route.ts` -- New file: usage data endpoint
- `app/profile/page.tsx` -- Add usage display section
- All 6 Anthropic routes -- Add `logApiUsage()` call after API response
- `app/api/tts/route.ts` -- Log TTS usage (by character count)
- `app/api/transcribe/route.ts` -- Log Whisper usage (by duration)
- `app/api/challenges/generate/route.ts` -- Log GPT-4o usage
- `lib/db.ts` -- Add `getApiUsage(userId)` and `getApiUsageLast7Days(userId)` functions

---

## Phase 2: Conversation Reset with Memory

### 2A. CoachMemory Model

**New Prisma model:**
```prisma
model CoachMemory {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  coachId   String   // "general", "health", goal ID, custom coach ID
  memories  String   @db.Text // JSON array of memory entries
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())

  @@unique([userId, coachId])
  @@index([userId])
}
```

Memory entry structure (stored as JSON in `memories` field):
```typescript
interface MemoryEntry {
  timestamp: string;       // ISO 8601
  type: 'insight' | 'preference' | 'progress' | 'concern' | 'pattern';
  content: string;         // 1-2 sentence summary
  source: 'conversation_reset' | 'session_end' | 'explicit';
}
```

### 2B. Conversation Reset Flow

1. User clicks "Reset Conversation" in ExpertChat
2. Confirmation dialog: "This will clear messages but the coach remembers key insights."
3. Frontend calls `POST /api/expert/conversation/reset` with `{ coachId }`
4. Backend:
   a. Fetch current conversation messages
   b. Call Anthropic with a summarization prompt: "Extract 3-5 key insights, user preferences, patterns, and concerns from this conversation. Return as JSON array."
   c. Append extracted memories to CoachMemory for this user+coach
   d. Clear conversation messages (update to empty array)
5. Frontend clears message state, shows fresh chat

### 2C. Memory Injection into Prompts

In `buildEnhancedSystemPrompt()`, after user context section, add:
```
## Coach Memory (from previous conversations)
You have these memories from past sessions with this user:
- [insight] User responds well to Socratic questioning about motivation
- [progress] User completed 3 consecutive weeks of morning meditation
- [concern] User mentioned work stress causing sleep issues on 2026-03-15
...
Use these to personalize your approach. Reference past insights naturally.
```

### 2D Files Changed
- `prisma/schema.prisma` -- Add CoachMemory model, add relation to User
- `lib/db.ts` -- Add `getCoachMemory(userId, coachId)`, `upsertCoachMemory(userId, coachId, memories)`, `clearConversationMessages(conversationId)`
- `app/api/expert/conversation/reset/route.ts` -- New file: reset endpoint with summarization
- `app/expert/ExpertChat.tsx` -- Add reset button in header, confirmation dialog, call reset API
- `lib/ai/context.ts` -- Inject CoachMemory into system prompt

---

## Phase 3: System Prompt Overhaul

### Current Problems
- System prompt is functional but generic -- "you are a supportive life coach"
- No coaching methodology or framework
- No anti-patterns defined (AI can lecture, give generic advice, be overly positive)
- Context dump is unstructured (goals, challenges, habits all in one block)

### Improved Prompt Structure

Rewrite `buildEnhancedSystemPrompt()` in `lib/ai/context.ts`:

```
## Identity & Methodology
You are {coachName}, a personal development coach specializing in {domain}.
You practice motivational interviewing and Socratic coaching:
- Ask questions before giving answers
- Reflect the user's own words back to them
- Help them discover their own solutions
- Celebrate specific progress, not generic praise

## Anti-Patterns (NEVER do these)
- Do not lecture or give unsolicited advice paragraphs
- Do not say "That's great!" without specifics about what is great
- Do not list generic tips the user could find on Google
- Do not assume you know how the user feels -- ask
- Do not repeat the same advice if the user hasn't acted on it
- Do not ignore what the user said to push your own agenda

## Conversational Style
- {tonePreference}: Match this tone naturally
- Mirror the user's energy level (brief answers to brief questions)
- Use the user's name ({displayName}) occasionally, not every message
- If the user seems frustrated, acknowledge before problem-solving
- One clear question or suggestion per message, not multiple

## User Profile
Name: {displayName}
Days on journey: {dayCount}
Current streak: {streak} days
Primary focus: {primaryGoal}

## Active Goals
{structured goal data with progress percentages}

## Recent Context
{last 3 days of relevant data: challenges, mood trends, diary themes}

## Coach Memory
{memories from CoachMemory model}

## Today's Focus
{daily rotation theme}

## Interaction Protocol
- If the user asks about a specific goal, focus on that goal's data
- If mood is trending down, gently check in before task-focused advice
- Suggest challenges only when contextually relevant, not proactively
- Use widget protocol for actionable items: <<<{type: '...', payload: {...}}>>>
```

### Key Changes
- **Motivational interviewing framework** instead of generic "be supportive"
- **Explicit anti-patterns** to prevent common AI coaching failures
- **Structured context** instead of dumping everything
- **Recent context window** (3 days) instead of all-time data
- **Energy matching** -- respond with appropriate length/depth
- **Memory integration** from CoachMemory

### Files Changed
- `lib/ai/context.ts` -- Major rewrite of `buildEnhancedSystemPrompt()`
- Coach descriptions updated to include methodology specifics

---

## Phase 4: Smarter Challenge Generation

### Current State
- `lib/ai.ts` uses GPT-4o with user preferences and recent challenges
- No feedback from completion data (difficultyFelt, satisfaction in ChallengeLog)
- No learning from what types work well for the user

### Improvements

**4A. Completion Feedback Context**

Add to `getUserContext()` in `lib/ai/context.ts`:
```typescript
// Fetch challenge completion feedback
const recentLogs = await prisma.challengeLog.findMany({
  where: { challenge: { userId } },
  orderBy: { completedAt: 'desc' },
  take: 20,
  include: { challenge: { select: { title: true, difficulty: true } } }
});
```

Build feedback summary:
```
## Challenge Feedback History
Average perceived difficulty: 6.2/10 (vs assigned 5.1/10) -- challenges feel harder than rated
Average satisfaction: 7.8/10 -- user enjoys challenges
High satisfaction (8+): reflection exercises, social challenges
Low satisfaction (<5): early morning physical challenges
User notes pattern: "enjoyed" appears 8 times, "too long" appears 3 times
```

**4B. Inject into Generation Prompt**

In `lib/ai.ts` `generateChallenge()`, add feedback context:
```
Based on this user's completion history:
- They rate challenges as {avgDifficultyFelt}/10 difficulty (assigned avg: {avgAssigned}/10)
  → {adjust difficulty suggestion}
- Highest enjoyment types: {topTypes}
- Lowest enjoyment types: {bottomTypes}
- Completion rate: {completionRate}% of assigned challenges
- Recent feedback: "{recentNotes}"

Generate a challenge that plays to their strengths while gently stretching comfort zones.
```

**4C. Difficulty Curve**

Track running averages in the generation prompt:
- If user consistently rates difficulty higher than assigned -> lower difficulty
- If user rates much lower -> increase difficulty slightly
- If satisfaction drops below 5 for 3 consecutive -> switch to preferred types

### Files Changed
- `lib/ai/context.ts` -- Add `getChallengeFeedback(userId)` function
- `lib/ai.ts` -- Inject feedback context into `generateChallenge()` and `generateMultipleChallenges()`
- `lib/db.ts` -- Add `getRecentChallengeLogs(userId, limit)` function

---

## Implementation Order

**Batch 1 (parallel):**
- Phase 1A: Model upgrade (simple find-replace + constant extraction)
- Phase 2A: CoachMemory + ApiUsage schema additions (`prisma db push`)

**Batch 2 (parallel, after schema):**
- Phase 1B: Cost tracking helper + logging in all routes
- Phase 2B-C: Conversation reset endpoint + memory injection
- Phase 4: Challenge feedback queries + prompt injection

**Batch 3 (sequential, depends on Phase 2):**
- Phase 3: System prompt overhaul (needs CoachMemory integration)
- Phase 2D: ExpertChat UI reset button

**Batch 4:**
- Phase 1B (cont): Profile page cost display + /api/usage endpoint

## Testing Strategy

- Run `npm test` after each batch (156 existing tests must pass)
- Run `npx next build` before pushing (TypeScript strictness)
- Manual test: Send chat message, verify Sonnet 4.6 response quality
- Manual test: Reset conversation, verify memories extracted, new chat has context
- Manual test: Generate challenge, verify feedback data influences output
- Manual test: Check profile page shows cost data
- Verify all routes still handle errors gracefully

## Cost Impact

Sonnet 4.6 pricing vs Haiku:
- **Haiku**: $0.25/M input, $1.25/M output
- **Sonnet 4.6**: $3/M input, $15/M output
- ~12x cost increase per token

Mitigations:
- Most interactions are short (500-1000 tokens)
- Estimated cost: ~$0.01-0.03 per chat exchange (vs ~$0.001 with Haiku)
- Cost tracking makes this transparent to the user
- Quality improvement should be dramatic

## Architectural Review

- **Scalability**: ApiUsage table will grow linearly with usage. Index on (userId, createdAt) keeps queries fast. Consider monthly rollup if table exceeds 100K rows.
- **Reliability**: Cost logging is fire-and-forget (no await blocking response). CoachMemory summarization happens synchronously during reset but is bounded (max conversation length).
- **Code health**: Model constant extracted to single location. Cost helper is reusable. CoachMemory follows existing Prisma patterns.
- **Cost**: 12x per-token increase offset by dramatically better coaching quality. Cost transparency lets user monitor.
- **Fitness**: Sonnet 4.6 is the right model for nuanced coaching conversations. Haiku was underselling the app's potential.
