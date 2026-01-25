# Feature Implementation Roadmap

This plan details the implementation of core functionality discussed, transforming the UI prototype into a fully functional application.

## Tech Stack

- **AI**: OpenAI API (for challenge generation, chat, and transcription)
- **Database**: PostgreSQL with Prisma ORM
- **Framework**: Next.js 14 (App Router)
- **Testing**: Jest + React Testing Library

---

## 1. AI Service Layer

**Goal**: Centralize AI logic to allow easy switching between models and consistent error handling.

### Implementation

- **File**: `lib/ai.ts`
- **Functions**:
  - `generateChallenge(userPrefs: UserPrefs, goal: Goal): Promise<Challenge>`
  - `transcribeAudio(audioFile: Blob): Promise<string>`
  - `chatWithExpert(messages: Message[], persona: string): Promise<Stream>`
  - `analyzeRealityShift(userProfile: UserProfile): Promise<ShiftSuggestion>`

### Test Plan

- **File**: `__tests__/lib/ai.test.ts`
- **Tests**:
  - `generateChallenge` returns structured JSON matching Challenge schema.
  - `chatWithExpert` respects system prompt based on persona.
  - Mock OpenAI API responses to ensure resilience against API failures.

---

## 2. Dynamic Challenge Generation

**Goal**: Generate personalized challenges based on user goals, preferences, and "Reality Shift" mode.

### Implementation

- **API**: `/api/challenges/generate`
- **Logic**:
  - Fetch user preferences (difficulty, focus areas, reality shift toggle)
  - Construct prompt injection: "User wants [Tough Love], focus on [Speaking]. Reality Shift: [ON]"
  - Call `lib/ai.generateChallenge`
  - Save to DB as `pending` challenge

### Test Plan

- **File**: `__tests__/api/challenges/generate.test.ts`
- **Tests**:
  - `POST /` with valid `goalId` creates a new challenge in DB.
  - Reality Shift enabled -> produced challenge has `isRealityShift: true` and higher difficulty rating.
  - Respects "Avoid Areas" (e.g., if user avoids "social", don't generate social challenges).

---

## 3. Voice Interaction (Diary & Chat)

**Goal**: Enable voice-to-text for frictionless journaling and chatting.

### Implementation

- **API**: `/api/transcribe`
- **Logic**:
  - Accept `multipart/form-data` (audio file)
  - Call `lib/ai.transcribeAudio` (Whisper)
  - Return text
- **Frontend**: Connect `VoiceRecorder` and `ExpertChat` mic button to this endpoint.

### Test Plan

- **File**: `__tests__/api/transcribe.test.ts`
- **Tests**:
  - `POST` with valid audio blob returns text string.
  - Handles large files (limit to 25MB).
  - Handles invalid file types (return 400).

---

## 4. Expert Chat Personas

**Goal**: The AI coach should adapt its personality (Tough Love, Scientific, Empathetic).

### Implementation

- **API**: `/api/expert/chat`
- **Logic**:
  - Fetch `user.preferences.aiPersonality` from DB
  - Select System Prompt:
    - *Tough Love*: "You are a drill sergeant. No excuses."
    - *Scientific*: "Cite studies. Be analytical. transformation through neuroplasticity."
  - Pass history + new message to `lib/ai.chatWithExpert`

### Test Plan

- **File**: `__tests__/api/expert/chat.test.ts`
- **Tests**:
  - `POST` maintains conversation context (history).
  - Different user preferences trigger different system prompts (verified via spy on `lib/ai`).
  - "Suggest Challenge" tool call works correctly.

---

## 5. Gamification Engine

**Goal**: Handle streaks, points, and level progression logic reliably.

### Implementation

- **File**: `lib/gamification.ts`
- **Functions**:
  - `updateStreak(userId: string): Promise<number>` (Handles "frozen" days?)
  - `calculateLevel(xp: number): number`
  - `awardXP(userId: string, amount: number, reason: string)`

### Test Plan

- **File**: `__tests__/lib/gamification.test.ts`
- **Tests**:
  - Streak increments on consecutive days.
  - Streak resets after missing a day (unless "Freeze" used).
  - XP calculation is accurate.
  - Level up event triggers notification.

---

## Execution Order

1. **Setup AI Layer**: Implement `lib/ai.ts` with mocks first.
2. **Voice**: Implement `/api/transcribe` (High value, low dependency).
3. **Challenges**: Implement `/api/challenges/generate` using AI layer.
4. **Chat**: Update `/api/expert/chat` to use real personas.
5. **Gamification**: extracted logic and rigorous testing.

## Immediate Next Step

- Create `lib/ai.ts` and its test file.
