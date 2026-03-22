# Anti-Pattern & Architecture Review Report

> Generated: 2026-03-02 | Branch: feature/v2
> Last updated: 2026-03-22

---

## Executive Summary

A comprehensive review of the entire ImprovementApp codebase identified **38 findings** across security, architecture, code quality, and testing. As of 2026-03-22, all CRITICAL security items and most HIGH-priority items have been resolved through Security Sprints 1-3 and the Phase 0-5 refactoring plan.

| Severity | Count | Resolved | Remaining | Key Theme |
|----------|-------|----------|-----------|-----------|
| CRITICAL | 4 | 4 | 0 | Security: JWT fallback, middleware bypass, API key leak, `dangerouslyAllowBrowser` |
| HIGH | 11 | 8 | 3 | Missing validation, N+1 queries, code duplication, `any` types, user prefs ignored |
| MEDIUM | 17 | 3 | 14 | No Zod, inline styles, empty catches, inconsistent responses, no rate limiting |
| LOW | 6 | 0 | 6 | Minor duplication, dead code, magic numbers |

---

## CRITICAL Priority (Fix Immediately)

### SEC-01: Hardcoded fallback JWT secret -- RESOLVED
- **File:** `lib/auth.ts:5`
- **Issue:** `JWT_SECRET` falls back to `'fallback-secret-key'` if env vars are missing. Anyone reading source can forge JWTs.
- **Fix:** Throw at startup if no secret is configured.
- **Effort:** S
- **Resolution:** Lazy `getJwtSecret()` throws if `JWT_SECRET` is unset. (Security Sprint 1)

### SEC-02: Middleware does not verify JWT -- RESOLVED
- **File:** `middleware.ts:28-35`
- **Issue:** Only checks if `auth_token` cookie *exists*, not if it is valid. Setting `auth_token=anything` bypasses auth for all protected pages.
- **Fix:** Call `verifyToken(token)` in middleware. Use `jose` library for Edge runtime compatibility.
- **Effort:** S
- **Resolution:** Middleware now verifies JWT using `jose` (Edge-compatible). (Security Sprint 1)

### SEC-03: API key leaked in error responses -- RESOLVED
- **File:** `app/api/expert/chat/route.ts:136-139`
- **Issue:** First 5 chars of `ANTHROPIC_API_KEY` are included in user-facing fallback responses via `(Debug: ...)` strings on lines 240, 253, 260.
- **Fix:** Remove all key info from responses. Log server-side only. Gate debug strings behind `NODE_ENV === 'development'`.
- **Effort:** S
- **Resolution:** All debug strings with key info removed. (Security Sprint 1)

### SEC-04: `dangerouslyAllowBrowser: true` on OpenAI client -- RESOLVED
- **File:** `lib/ai.ts:7`
- **Issue:** Combined with `'dummy-key'` fallback, this could expose the real API key if the module ever loads client-side.
- **Fix:** Remove the flag. Ensure server-only usage. Fail fast if key is missing.
- **Effort:** S
- **Resolution:** Flag removed, lazy singleton pattern, no fallback key. (Security Sprint 1)

---

## HIGH Priority (Fix This Sprint)

### CODE-01: ~400 lines duplicated between ExpertChat and InterviewChat -- RESOLVED
- **Files:** `app/expert/ExpertChat.tsx`, `app/survey/InterviewChat.tsx`
- **Duplicated:** Voice recording, TTS playback, keyboard handling, SSE streaming, CSS
- **Fix:** Extract shared hooks: `useVoiceRecording()`, `useTTSPlayback()`, `useKeyboardResize()`, `useSSEStream()`
- **Effort:** L
- **Resolution:** Extracted `hooks/useKeyboardOffset.ts`, `hooks/useTTSAudio.ts`, `hooks/useVoiceRecording.ts`, `lib/streaming.ts`, `lib/coaches.ts`. ExpertChat 1504->1267 lines, InterviewChat 1212->969 lines. (Refactoring Phase 1)

### CODE-02: `getUserContext` duplicated in interview route -- RESOLVED
- **File:** `app/api/interview/route.ts:9-59`
- **Issue:** Full copy of `getUserContext` that diverges from the shared module in `lib/ai/context.ts`.
- **Fix:** Import from `@/lib/ai/context`.
- **Effort:** S
- **Resolution:** Interview route now imports from `@/lib/ai/context`. (Security Sprint 2)

### CODE-03: User preferences never fetched in challenge generation -- RESOLVED
- **File:** `app/api/challenges/generate/route.ts:34-40`
- **Issue:** Hardcodes default preferences. User's actual difficulty, focus areas, avoid areas, and reality shift setting are ignored.
- **Fix:** Call `db.getUserPreferences(user.userId)` and use actual values.
- **Effort:** S
- **Resolution:** Route now fetches real user preferences. (Previous sprint)

### CODE-04: `UserContext` interface is entirely `any`-typed
- **File:** `lib/ai/context.ts:13-28`
- **Issue:** Every field is `any`, providing no compile-time safety.
- **Fix:** Use Prisma-generated types or types from `lib/types.ts`.
- **Effort:** M

### CODE-05: `Math.random()` for UUID generation -- RESOLVED
- **File:** `lib/db.ts:10-14`
- **Issue:** Not cryptographically secure. Predictable if used for security-sensitive identifiers.
- **Fix:** Use `crypto.randomUUID()`.
- **Effort:** S
- **Resolution:** Now uses `crypto.randomUUID()` in `lib/db/client.ts`. (Security Sprint 1)

### CODE-06: N+1 query in habits GET handler
- **File:** `app/api/habits/route.ts:23-26`
- **Issue:** `calculateHabitStreak` called per-habit in a loop. 10 habits = 10 extra DB queries.
- **Fix:** Use `db.getHabitStats()` which already calculates streaks in bulk.
- **Effort:** S

### CODE-07: New Anthropic client instantiated per request -- RESOLVED
- **Files:** `app/api/expert/chat/route.ts:101`, `app/api/expert/chat/stream/route.ts:79`, `app/api/interview/route.ts:275`
- **Fix:** Create a module-level singleton client.
- **Effort:** S
- **Resolution:** Lazy singleton in `lib/anthropic.ts` via `getAnthropicClient()`. (Security Sprint 2)

### CODE-08: No rate limiting on AI-powered endpoints
- **Scope:** All `/api/expert/chat/*`, `/api/interview`, `/api/challenges/generate`, `/api/diary`
- **Issue:** Each request incurs AI API cost. No protection against abuse.
- **Fix:** Add per-user rate limiting via `upstash/ratelimit` or in-memory counter.
- **Effort:** M

### CODE-09: No input validation / Zod schemas on any API route -- PARTIALLY RESOLVED
- **Scope:** All 28 API routes
- **Issue:** All validation is ad-hoc `if (!field)` checks. No length limits, no type checking, no schema validation.
- **Fix:** Add Zod schemas for every request body. Zod is already in `package.json`.
- **Effort:** L
- **Resolution:** Zod schemas added for major routes via `lib/validation.ts` and `validateBody()` helper. Not yet applied to all 28 routes. (Security Sprint 3)

### CODE-10: `deleteGoal` manual cascade not in transaction -- RESOLVED
- **File:** `lib/db.ts:179-185`
- **Issue:** Deletes challenges, conversations, diary entries manually (despite schema cascades), not wrapped in `prisma.$transaction()`. Partial failure leaves orphaned data.
- **Fix:** Either rely on Prisma cascades or wrap in a transaction.
- **Effort:** S
- **Resolution:** Wrapped in `prisma.$transaction()`. (Security Sprint 3)

### CODE-11: `verifyToken` swallows all errors silently
- **File:** `lib/auth.ts:23-27`
- **Issue:** No distinction between expired token (normal) and forged token (security incident).
- **Fix:** Catch `TokenExpiredError` separately. Log signature failures.
- **Effort:** S

---

## MEDIUM Priority (Plan Remediation)

### PERF-01: ~45 inline style objects in progress page, many inside `.map()` loops
- **File:** `app/progress/page.tsx`
- **Fix:** Move to CSS classes or CSS modules.
- **Effort:** M

### PERF-02: ~230 lines of computation run on every render in progress page
- **File:** `app/progress/page.tsx:92-328`
- **Fix:** Wrap in `useMemo` with appropriate dependencies.
- **Effort:** M

### PERF-03: Missing `useMemo` for coach filtering in ExpertChat
- **File:** `app/expert/ExpertChat.tsx:607-609`
- **Fix:** `useMemo(() => coaches.filter(...), [coaches])`
- **Effort:** S

### ARCH-01: God Components (>500 lines with multiple responsibilities) -- PARTIALLY RESOLVED
- **Files:** `ExpertChat.tsx` (1412), `InterviewChat.tsx` (1209), `progress/page.tsx` (996), `habits/page.tsx` (728), `live/page.tsx` (715)
- **Fix:** Extract sub-components and hooks. Address as part of CODE-01.
- **Effort:** L
- **Resolution:** progress/page.tsx split (1006->145 lines + 4 sub-components), page.tsx dashboard split (729->401 lines + 2 sub-components), SettingsForm.tsx split (600->213 lines + 4 sub-components), lib/db.ts split (1570 lines -> 10 domain modules). ExpertChat/InterviewChat reduced via shared hooks. habits/page.tsx and live/page.tsx remain large. (Refactoring Phases 1-3)

### ARCH-02: Two separate `components/` directories
- **Dirs:** `app/components/` and `components/`
- **Issue:** `components/Charts.tsx` is the only file in the root `components/` dir. Everything else is in `app/components/`.
- **Fix:** Move `Charts.tsx` to `app/components/` and delete root `components/`.
- **Effort:** S

### ARCH-03: JSON stored as strings, parsed repeatedly throughout db.ts
- **File:** `lib/db.ts` (lines 56, 592, 697, 711, 724, 787)
- **Fix:** Use native JSON columns (Postgres supports this) or centralize parse/stringify in a mapping layer.
- **Effort:** M

### ARCH-04: No ownership checks in many DB mutation functions
- **File:** `lib/db.ts` - `completeChallenge`, `skipChallenge`, `updateGoalStatus`, `deleteGoal`
- **Issue:** Take only entity ID, no `userId`. Caller must enforce ownership.
- **Fix:** Add `userId` parameter to all mutation functions.
- **Effort:** M

### ARCH-05: Client-provided context used as trusted fallback in interview route
- **File:** `app/api/interview/route.ts:235`
- **Issue:** `const context = serverContext || clientContext || {};` -- trusts client data if server fetch fails.
- **Fix:** Never trust client context. Use empty context on server failure.
- **Effort:** S

### ARCH-06: Inconsistent API response formats
- **Scope:** All routes
- **Issue:** Some return `{ success, data }`, some `{ error }`, some `{ status: 500 }` in body.
- **Fix:** Standardize on `ApiResponse<T>` from `lib/types.ts`. Create helper functions.
- **Effort:** M

### ARCH-07: Duplicate `setIsStreaming(false)` in ExpertChat
- **File:** `app/expert/ExpertChat.tsx:501-502`
- **Issue:** Copy-paste error. Second call is redundant.
- **Fix:** Remove the duplicate line.
- **Effort:** S

### A11Y-01: Missing ARIA attributes across chat and progress components
- **Files:** `ExpertChat.tsx`, `InterviewChat.tsx`, `progress/page.tsx`
- **Issue:** No `role="log"`, `aria-live`, `aria-expanded`, `aria-label` on interactive regions, selectors, typing indicators.
- **Fix:** Add semantic roles and ARIA attributes.
- **Effort:** M

### MISC-01: Empty catch blocks throughout codebase
- **Files:** `ExpertChat.tsx:226,334,481`, `InterviewChat.tsx:623`, `progress/page.tsx:83`
- **Fix:** At minimum log errors in development. Show user-facing error state.
- **Effort:** S

### MISC-02: Magic numbers throughout
- **Key instances:** `4096` (TTS limit), `300` (keyboard delay), `10` (context window), `42`/`7` (calendar grid)
- **Fix:** Extract to named constants.
- **Effort:** S

### MISC-03: `stage` and `exchangeCount` not validated in interview route
- **File:** `app/api/interview/route.ts:219-220`
- **Fix:** Validate `stage` against `InterviewStage` union. Coerce `exchangeCount` to number.
- **Effort:** S

---

## LOW Priority (Address Opportunistically)

### LOW-01: Duplicated streak calculation logic
- **File:** `lib/db.ts` - `calculateStreak`, `calculateHabitStreak`, `getHabitStats` all iterate dates the same way.
- **Fix:** Extract `calculateStreakFromDates(dates: Date[])` utility.

### LOW-02: `test-utils.ts` has dead exports
- **File:** `test-utils.ts` - `dbMock`, `startDb`, `stopDb` are never used.
- **Fix:** Remove dead exports. Consolidate `createMockRequest`.

### LOW-03: Duplicate CSS properties in InterviewChat
- **File:** `app/survey/InterviewChat.tsx:980-982` - `overflow-y: auto` appears twice.
- **Fix:** Remove duplicate.

### LOW-04: Dead comments in progress page
- **File:** `app/progress/page.tsx:881-889` - Two consecutive empty separators and dead comments.
- **Fix:** Delete.

### LOW-05: `@testing-library/jest-dom` imported but `testEnvironment` is `node`
- **File:** `jest.setup.ts`
- **Fix:** Remove import or switch to jsdom for component tests.

### LOW-06: No coverage thresholds in jest config
- **File:** `jest.config.js`
- **Fix:** Add `coverageThreshold: { global: { branches: 60, functions: 60, lines: 60, statements: 60 } }`.

---

## Testing Structure Recommendations

### Current State
- **API route coverage:** 4 of 28 routes = 14%
- **Lib module coverage:** 6 of 7 = 86%
- **Component coverage:** 0%
- **Integration tests:** 1 (mislabeled `db.test.ts`)
- **E2E tests:** None

### Recommended Structure

```
__tests__/
  api/                          # One file per API route
    auth/auth.test.ts           [EXISTS] add logout, cookie security
    challenges/
      generate.test.ts          [EXISTS] add boundary cases
      accept.test.ts            [MISSING]
      complete.test.ts          [MISSING]
      skip.test.ts              [MISSING]
    coaches/coaches.test.ts     [MISSING]
    diary/diary.test.ts         [MISSING]
    expert/
      chat.test.ts              [MISSING]
      stream.test.ts            [MISSING]
    goals/goals.test.ts         [MISSING]
    habits/habits.test.ts       [MISSING]
    interview/interview.test.ts [MISSING]
    settings/settings.test.ts   [MISSING]
    surveys/surveys.test.ts     [MISSING]
    profile/profile.test.ts     [MISSING]
  lib/                          # Already mostly covered
    ai.test.ts                  [EXISTS]
    ai/context.test.ts          [EXISTS]
    ai/rotation.test.ts         [EXISTS]
    auth.test.ts                [EXISTS]
    db.test.ts                  [EXISTS] relabel as integration
  utils/
    fetchWithTimeout.test.ts    [EXISTS]
  hooks/
    useVAD.test.ts              [MISSING]

  integration/                  [MISSING - new directory]
    auth-flow.test.ts           register -> login -> protected -> logout
    challenge-lifecycle.test.ts generate -> accept -> complete

e2e/                            [MISSING - new directory]
  playwright.config.ts
  auth.spec.ts
  challenge.spec.ts
```

### Immediate Testing Actions (Ordered by Impact)

1. **Add coverage thresholds** to `jest.config.js`
2. **Guard `db.test.ts`** against production database
3. **Create shared test factories** (`createTestUser`, `createTestGoal`, `createTestContext`, `createMockNextRequest`)
4. **Test high-traffic API routes:** goals, habits, surveys, expert/chat, settings
5. **Fix `test-utils.ts`:** Remove dead exports, use proper `NextRequest` construction
6. **Add component test config:** Secondary Jest project with `testEnvironment: 'jsdom'`
7. **Add Playwright** for critical E2E flows

---

## Remediation Roadmap

### Sprint 1 (Security) -- COMPLETE
All items resolved. See individual findings above.

### Sprint 2 (High-Value Fixes) -- COMPLETE
All items resolved. See individual findings above.

### Sprint 3 (Validation & Testing) -- PARTIAL
| Item | Status | Notes |
|------|--------|-------|
| CODE-09: Add Zod schemas to all routes | Partial | Major routes done via `lib/validation.ts`; remaining routes need schemas |
| CODE-08: Add rate limiting | Open | Not yet implemented |
| Test 10 highest-priority API routes | Open | 4/28 routes covered |
| Create shared test factories | Open | |

### Sprint 4 (Architecture & Polish) -- COMPLETE
| Item | Status | Notes |
|------|--------|-------|
| CODE-01: Extract shared chat hooks | Done | 5 shared hooks/utilities extracted (Phase 1) |
| ARCH-01: Break up God Components | Done | progress, dashboard, settings, db all split (Phases 2-3) |
| PERF-01/02: Fix progress page perf | Done | Data hook extracted, computations isolated in sub-components |
| CODE-04: Type the UserContext interface | Open | Still `any`-typed |
| A11Y-01: Add ARIA attributes | Open | |

### Remaining Work (Prioritized)
| Item | Effort | Priority |
|------|--------|----------|
| CODE-04: Type UserContext interface | M | High |
| CODE-06: Fix N+1 in habits | S | High |
| CODE-08: Rate limiting on AI endpoints | M | High |
| CODE-09: Zod schemas for remaining routes | M | Medium |
| CODE-11: Differentiate token errors | S | Medium |
| A11Y-01: ARIA attributes | M | Medium |
| ARCH-02: Consolidate components/ directories | S | Low |
| ARCH-03: JSON column handling | M | Low |
| ARCH-04: Ownership checks in DB mutations | M | Low |
| Test coverage expansion | L | Ongoing |
