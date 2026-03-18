# 007 - Sprint 2+3: Quick Fixes & Input Validation

> Status: In Progress
> Priority: High
> Estimated Effort: 2-3 hours

## Definition of Done

### Feature Completion Criteria

- [ ] Interview route uses shared `getUserContext` from `lib/ai/context.ts` (no local copy)
- [ ] Anthropic client is a lazy singleton shared across all 3 routes
- [ ] `deleteGoal` runs cascade deletes inside `prisma.$transaction()`
- [ ] All API routes validate request body with Zod schemas
- [ ] `npm test` passes (all 156+ tests)
- [ ] `npm run build` succeeds

### Out of Scope

- Rate limiting (requires infrastructure decision -- Redis vs in-memory)
- Component tests (Sprint 4)
- E2E tests (Sprint 4)
- Shared test factories (Sprint 4)

### Quality Gates

```bash
npx jest                    # All tests pass
npx next build              # Build succeeds (skip prisma push locally)
```

---

## Implementation Phases

### Phase 1: Anthropic Client Singleton

**Goal:** Eliminate 3 instances of `new Anthropic({ apiKey })` per request.

**File:** `lib/anthropic.ts` (new)

Create a lazy singleton following the same pattern as `lib/ai.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
    if (!_client) {
        const apiKey = process.env.ANTHROPIC_API_KEY?.replace(/^["']|["']$/g, '').trim();
        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY environment variable is required.');
        }
        _client = new Anthropic({ apiKey });
    }
    return _client;
}
```

**Then update:**
- `app/api/expert/chat/route.ts` lines 96-101 -> `getAnthropicClient()`
- `app/api/expert/chat/stream/route.ts` lines 68-76 -> `getAnthropicClient()`
- `app/api/interview/route.ts` lines 267-275 -> `getAnthropicClient()`

Remove the per-route apiKey parsing and error handling (singleton handles it).

### Phase 2: Interview Route Deduplication

**Goal:** Remove 50-line duplicate `getUserContext` from interview route.

**File:** `app/api/interview/route.ts`

- Delete lines 9-59 (local `getUserContext`)
- Add import: `import { getUserContext } from '@/lib/ai/context';`
- The centralized version already includes `allActiveGoals` and `onboardingAnswers`

### Phase 3: Transaction-Safe deleteGoal

**Goal:** Wrap cascade deletes in a Prisma transaction.

**File:** `lib/db.ts` lines 176-182

```typescript
// BEFORE:
await prisma.challenge.deleteMany({ where: { goalId: id } });
await prisma.conversation.deleteMany({ where: { goalId: id } });
await prisma.diaryEntry.deleteMany({ where: { goalId: id } });
return await prisma.goal.delete({ where: { id } });

// AFTER:
return await prisma.$transaction(async (tx) => {
    await tx.challenge.deleteMany({ where: { goalId: id } });
    await tx.conversation.deleteMany({ where: { goalId: id } });
    await tx.diaryEntry.deleteMany({ where: { goalId: id } });
    return await tx.goal.delete({ where: { id } });
});
```

### Phase 4: Zod Validation on API Routes

**Goal:** Add schema validation to all API routes that accept request bodies.

Zod is already in `package.json`. Create validation schemas per route:

| Route | Fields | Validation |
|-------|--------|------------|
| `goals` POST | title, domainId, currentState, desiredState, difficultyLevel | title: string 1-200, difficultyLevel: int 1-10 |
| `habits` POST/PUT | name, description, icon, frequency, targetDays, goalId | name: string 1-100, frequency: enum |
| `surveys` POST | overallMood, energyLevel, motivationLevel, notes | all moods: int 1-10 |
| `settings` POST | 18 preference fields | preferredDifficulty: int 1-10, voiceId: enum, etc. |
| `diary` POST | transcript, audioDurationSeconds, moodScore | moodScore: int 1-10, duration: positive |
| `challenges/generate` POST | goalId, count, focusArea | count: int 1-5, focusArea: string max 200 |
| `expert/chat` POST | message, history, coachId | message: string 1-5000, history: array max 20 |
| `interview` POST | message, stage, nextStage, exchangeCount | stage: enum, exchangeCount: int |

Add `jest.setup.ts` env var: `ANTHROPIC_API_KEY` for singleton tests.

---

## Verification

1. `npx jest` -- all tests pass
2. `npx next build` -- build succeeds (skip prisma db push)
3. Manual: login, create goal, generate challenge -- all work
4. Manual: send garbage to API routes -- get 400 errors with descriptive messages
