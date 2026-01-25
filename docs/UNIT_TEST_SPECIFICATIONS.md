# ImprovementApp Unit Test Specifications

> **Format**: Given-When-Then (BDD) + AAA Pattern (Arrange-Act-Assert)  
> **Coverage**: All app functionalities with positive and negative test cases

---

## 📋 Test Case Format

Each test follows this structure:

| Field | Description |
|-------|-------------|
| **ID** | Unique test identifier |
| **Description** | What the test verifies |
| **Given** | Preconditions/setup |
| **When** | Action performed |
| **Then (Success)** | Expected outcome for positive case |
| **Then (Failure)** | Expected outcome for negative case |

---

## 🔐 1. Authentication

### 1.1 User Registration

| ID | TC-AUTH-001 |
|----|-------------|
| **Description** | Register a new user with valid credentials |
| **Given** | Email "<newuser@test.com>" does not exist in database |
| **When** | POST `/api/auth/register` with `{email, password (6+ chars), displayName}` |
| **Then (Success)** | Status 200, returns `{success: true, user: {id, email, displayName}}`, auth cookie set |
| **Then (Failure)** | - |

| ID | TC-AUTH-002 |
|----|-------------|
| **Description** | Reject duplicate email registration |
| **Given** | Email "<existing@test.com>" already exists |
| **When** | POST `/api/auth/register` with same email |
| **Then (Success)** | - |
| **Then (Failure)** | Status 409, error "User with this email already exists" |

| ID | TC-AUTH-003 |
|----|-------------|
| **Description** | Reject short password |
| **Given** | Valid email provided |
| **When** | POST `/api/auth/register` with password < 6 characters |
| **Then (Success)** | - |
| **Then (Failure)** | Status 400, validation error for password |

| ID | TC-AUTH-004 |
|----|-------------|
| **Description** | Reject invalid email format |
| **Given** | Password is valid |
| **When** | POST `/api/auth/register` with email "not-an-email" |
| **Then (Success)** | - |
| **Then (Failure)** | Status 400, validation error for email |

---

### 1.2 User Login

| ID | TC-AUTH-010 |
|----|-------------|
| **Description** | Login with valid credentials |
| **Given** | User exists with email/password |
| **When** | POST `/api/auth/login` with correct credentials |
| **Then (Success)** | Status 200, `{success: true, user: {...}}`, auth_token cookie set |
| **Then (Failure)** | - |

| ID | TC-AUTH-011 |
|----|-------------|
| **Description** | Reject login for non-existent user |
| **Given** | Email does not exist in database |
| **When** | POST `/api/auth/login` with unknown email |
| **Then (Success)** | - |
| **Then (Failure)** | Status 401, "Invalid credentials" |

| ID | TC-AUTH-012 |
|----|-------------|
| **Description** | Reject login with wrong password |
| **Given** | User exists but password is incorrect |
| **When** | POST `/api/auth/login` with wrong password |
| **Then (Success)** | - |
| **Then (Failure)** | Status 401, "Invalid credentials" |

| ID | TC-AUTH-013 |
|----|-------------|
| **Description** | Reject login with missing fields |
| **Given** | Request body missing email or password |
| **When** | POST `/api/auth/login` |
| **Then (Success)** | - |
| **Then (Failure)** | Status 400, validation error |

---

### 1.3 Demo Login

| ID | TC-AUTH-020 |
|----|-------------|
| **Description** | Demo login creates/returns demo user |
| **Given** | No authentication required |
| **When** | POST `/api/auth/demo` |
| **Then (Success)** | Status 200, `{success: true, user: {email: "demo@example.com"}}`, auth cookie set |
| **Then (Failure)** | - |

| ID | TC-AUTH-021 |
|----|-------------|
| **Description** | Demo login seeds data for new demo user |
| **Given** | Demo user has no existing goals |
| **When** | POST `/api/auth/demo` |
| **Then (Success)** | Demo user gets seeded goals, challenges, and survey data |
| **Then (Failure)** | - |

---

### 1.4 Logout

| ID | TC-AUTH-030 |
|----|-------------|
| **Description** | Logout clears auth cookie |
| **Given** | User is logged in |
| **When** | GET `/api/auth/logout` |
| **Then (Success)** | Redirect to /login, auth cookie cleared (maxAge: 0) |
| **Then (Failure)** | - |

---

## 🎯 2. Goals

### 2.1 Goal Creation

| ID | TC-GOAL-001 |
|----|-------------|
| **Description** | Create a new goal with title |
| **Given** | User is authenticated |
| **When** | POST `/api/goals` with `{title: "Learn Piano"}` |
| **Then (Success)** | Status 200, `{success: true, data: {goal: {...}}}` |
| **Then (Failure)** | - |

| ID | TC-GOAL-002 |
|----|-------------|
| **Description** | Create goal with all optional fields |
| **Given** | User is authenticated |
| **When** | POST `/api/goals` with `{title, domainId, currentState, desiredState, description, difficultyLevel, realityShiftEnabled}` |
| **Then (Success)** | Goal created with all fields populated |
| **Then (Failure)** | - |

| ID | TC-GOAL-003 |
|----|-------------|
| **Description** | Reject goal without title |
| **Given** | User is authenticated |
| **When** | POST `/api/goals` without title field |
| **Then (Success)** | - |
| **Then (Failure)** | Status 400, "Title is required" |

| ID | TC-GOAL-004 |
|----|-------------|
| **Description** | Reject unauthenticated goal creation |
| **Given** | User is NOT authenticated |
| **When** | POST `/api/goals` |
| **Then (Success)** | - |
| **Then (Failure)** | Status 401, "Unauthorized" |

---

### 2.2 Goal Retrieval

| ID | TC-GOAL-010 |
|----|-------------|
| **Description** | Get all user goals |
| **Given** | User is authenticated, has 3 goals |
| **When** | GET `/api/goals` |
| **Then (Success)** | Status 200, returns array of 3 goals |
| **Then (Failure)** | - |

| ID | TC-GOAL-011 |
|----|-------------|
| **Description** | Get empty goals list |
| **Given** | User is authenticated, has no goals |
| **When** | GET `/api/goals` |
| **Then (Success)** | Status 200, returns empty array |
| **Then (Failure)** | - |

---

### 2.3 Goal Completion

| ID | TC-GOAL-020 |
|----|-------------|
| **Description** | Complete a goal |
| **Given** | User owns goal with id "goal-123" |
| **When** | POST `/api/goals/goal-123/complete` |
| **Then (Success)** | Goal status updated to "completed" |
| **Then (Failure)** | - |

| ID | TC-GOAL-021 |
|----|-------------|
| **Description** | Reject completing another user's goal |
| **Given** | Goal belongs to different user |
| **When** | POST `/api/goals/other-goal/complete` |
| **Then (Success)** | - |
| **Then (Failure)** | Status 404, "Goal not found" |

---

### 2.4 Goal Deletion

| ID | TC-GOAL-030 |
|----|-------------|
| **Description** | Delete a goal |
| **Given** | User owns goal with id "goal-123" |
| **When** | POST `/api/goals/goal-123/delete` |
| **Then (Success)** | `{success: true, message: "Goal deleted"}` |
| **Then (Failure)** | - |

| ID | TC-GOAL-031 |
|----|-------------|
| **Description** | Reject deleting non-existent goal |
| **Given** | Goal ID does not exist |
| **When** | POST `/api/goals/invalid-id/delete` |
| **Then (Success)** | - |
| **Then (Failure)** | Status 404, "Goal not found" |

---

### 2.5 Goal Archive

| ID | TC-GOAL-040 |
|----|-------------|
| **Description** | Archive a goal |
| **Given** | User owns active goal |
| **When** | POST `/api/goals/{id}/archive` |
| **Then (Success)** | Goal status updated to "archived" |
| **Then (Failure)** | - |

---

### 2.6 Goal Level Up

| ID | TC-GOAL-050 |
|----|-------------|
| **Description** | Level up a goal (creates next level) |
| **Given** | User owns goal "Learn Piano" with difficulty 5 |
| **When** | POST `/api/goals/{id}/levelup` |
| **Then (Success)** | Original goal completed, new goal "Learn Piano (Level 2)" created with difficulty 7 |
| **Then (Failure)** | - |

---

## ⚡ 3. Challenges

### 3.1 Challenge Generation

| ID | TC-CHAL-001 |
|----|-------------|
| **Description** | Generate AI challenges for user |
| **Given** | User authenticated, has active goal |
| **When** | POST `/api/challenges/generate` |
| **Then (Success)** | Returns array of AI-generated challenges |
| **Then (Failure)** | - |

| ID | TC-CHAL-002 |
|----|-------------|
| **Description** | Reject generation without auth |
| **Given** | User NOT authenticated |
| **When** | POST `/api/challenges/generate` |
| **Then (Success)** | - |
| **Then (Failure)** | Status 401, "Unauthorized" |

---

### 3.2 Challenge Completion

| ID | TC-CHAL-010 |
|----|-------------|
| **Description** | Complete a challenge |
| **Given** | User has pending challenge |
| **When** | POST `/api/challenges/{id}/complete` |
| **Then (Success)** | `{success: true, data: {streak, completedCount}}` |
| **Then (Failure)** | - |

| ID | TC-CHAL-011 |
|----|-------------|
| **Description** | Streak increments on completion |
| **Given** | User has streak of 5 |
| **When** | POST `/api/challenges/{id}/complete` |
| **Then (Success)** | Streak becomes 6 (if consecutive day) |
| **Then (Failure)** | - |

---

### 3.3 Challenge Skip

| ID | TC-CHAL-020 |
|----|-------------|
| **Description** | Skip a challenge with reason |
| **Given** | User has pending challenge |
| **When** | POST `/api/challenges/{id}/skip` with `{reason: "Too busy"}` |
| **Then (Success)** | `{success: true, data: {challenge: {status: "skipped"}}}` |
| **Then (Failure)** | - |

| ID | TC-CHAL-021 |
|----|-------------|
| **Description** | Skip with default reason |
| **Given** | User has pending challenge |
| **When** | POST `/api/challenges/{id}/skip` (no body) |
| **Then (Success)** | Skipped with reason "Skipped by user" |
| **Then (Failure)** | - |

| ID | TC-CHAL-022 |
|----|-------------|
| **Description** | Reject skip for non-existent challenge |
| **Given** | Challenge ID does not exist |
| **When** | POST `/api/challenges/invalid/skip` |
| **Then (Success)** | - |
| **Then (Failure)** | Status 404, "Challenge not found" |

---

### 3.4 Template Retrieval

| ID | TC-CHAL-030 |
|----|-------------|
| **Description** | Get templates by domain |
| **Given** | Database has templates for domain 1 |
| **When** | GET `/api/challenges/templates?domainId=1` |
| **Then (Success)** | Returns filtered templates for domain 1 |
| **Then (Failure)** | - |

| ID | TC-CHAL-031 |
|----|-------------|
| **Description** | Filter templates by difficulty |
| **Given** | Templates exist with various difficulties |
| **When** | GET `/api/challenges/templates?difficulty=easy` |
| **Then (Success)** | Returns templates with difficulty ≤ 3 |
| **Then (Failure)** | - |

---

## ✅ 4. Habits

### 4.1 Habit Creation

| ID | TC-HABIT-001 |
|----|-------------|
| **Description** | Create a new habit |
| **Given** | User authenticated |
| **When** | POST `/api/habits` with `{name: "Morning Meditation"}` |
| **Then (Success)** | `{success: true, data: {habit: {...}}}` |
| **Then (Failure)** | - |

| ID | TC-HABIT-002 |
|----|-------------|
| **Description** | Reject habit without name |
| **Given** | User authenticated |
| **When** | POST `/api/habits` without name |
| **Then (Success)** | - |
| **Then (Failure)** | Status 400, "Name is required" |

| ID | TC-HABIT-003 |
|----|-------------|
| **Description** | Create habit with all fields |
| **Given** | User authenticated |
| **When** | POST `/api/habits` with `{name, description, icon, frequency, targetDays, goalId}` |
| **Then (Success)** | Habit created with all fields |
| **Then (Failure)** | - |

---

### 4.2 Habit Retrieval

| ID | TC-HABIT-010 |
|----|-------------|
| **Description** | Get all active habits |
| **Given** | User has 3 active habits, 1 inactive |
| **When** | GET `/api/habits` |
| **Then (Success)** | Returns 3 habits with `completedToday`, `streak` |
| **Then (Failure)** | - |

| ID | TC-HABIT-011 |
|----|-------------|
| **Description** | Get habits including inactive |
| **Given** | User has 3 active, 1 inactive |
| **When** | GET `/api/habits?includeInactive=true` |
| **Then (Success)** | Returns 4 habits |
| **Then (Failure)** | - |

---

### 4.3 Habit Update

| ID | TC-HABIT-020 |
|----|-------------|
| **Description** | Update habit name |
| **Given** | User owns habit "Morning Run" |
| **When** | PUT `/api/habits` with `{id, name: "Evening Run"}` |
| **Then (Success)** | Habit name updated |
| **Then (Failure)** | - |

| ID | TC-HABIT-021 |
|----|-------------|
| **Description** | Reject update without ID |
| **Given** | User authenticated |
| **When** | PUT `/api/habits` without id field |
| **Then (Success)** | - |
| **Then (Failure)** | Status 400, "Habit ID is required" |

| ID | TC-HABIT-022 |
|----|-------------|
| **Description** | Reject update for another user's habit |
| **Given** | Habit belongs to different user |
| **When** | PUT `/api/habits` with that habit's ID |
| **Then (Success)** | - |
| **Then (Failure)** | Status 404, "Habit not found" |

---

### 4.4 Habit Deletion

| ID | TC-HABIT-030 |
|----|-------------|
| **Description** | Delete a habit |
| **Given** | User owns habit |
| **When** | DELETE `/api/habits?id={habitId}` |
| **Then (Success)** | `{success: true, data: {deleted: true}}` |
| **Then (Failure)** | - |

| ID | TC-HABIT-031 |
|----|-------------|
| **Description** | Reject delete without ID |
| **Given** | User authenticated |
| **When** | DELETE `/api/habits` (no id param) |
| **Then (Success)** | - |
| **Then (Failure)** | Status 400, "Habit ID is required" |

---

### 4.5 Habit Logging

| ID | TC-HABIT-040 |
|----|-------------|
| **Description** | Log habit completion |
| **Given** | User owns habit |
| **When** | POST `/api/habits/log` with `{habitId, completed: true}` |
| **Then (Success)** | Log created for today |
| **Then (Failure)** | - |

| ID | TC-HABIT-041 |
|----|-------------|
| **Description** | Update existing log (upsert) |
| **Given** | Log exists for habit today |
| **When** | POST `/api/habits/log` with same habitId |
| **Then (Success)** | Existing log updated, not duplicated |
| **Then (Failure)** | - |

---

## 📓 5. Diary

### 5.1 Diary Entry Creation

| ID | TC-DIARY-001 |
|----|-------------|
| **Description** | Create diary entry with transcript |
| **Given** | User authenticated, ANTHROPIC_API_KEY set |
| **When** | POST `/api/diary` with `{transcript: "Today was great..."}` |
| **Then (Success)** | Entry created with AI-generated `aiSummary`, `aiInsights` |
| **Then (Failure)** | - |

| ID | TC-DIARY-002 |
|----|-------------|
| **Description** | Create entry without AI (short transcript) |
| **Given** | User authenticated, transcript < 10 chars |
| **When** | POST `/api/diary` with `{transcript: "Hi"}` |
| **Then (Success)** | Entry created, aiSummary empty |
| **Then (Failure)** | - |

| ID | TC-DIARY-003 |
|----|-------------|
| **Description** | Reject unauthenticated diary creation |
| **Given** | User NOT authenticated |
| **When** | POST `/api/diary` |
| **Then (Success)** | - |
| **Then (Failure)** | Status 401, "Unauthorized" |

---

### 5.2 Diary Entry Retrieval

| ID | TC-DIARY-010 |
|----|-------------|
| **Description** | Get diary entries |
| **Given** | User has 5 entries |
| **When** | GET `/api/diary` |
| **Then (Success)** | Returns array of entries |
| **Then (Failure)** | - |

---

## 📊 6. Daily Surveys

### 6.1 Survey Creation

| ID | TC-SURV-001 |
|----|-------------|
| **Description** | Create daily survey |
| **Given** | User authenticated |
| **When** | POST `/api/surveys` with `{overallMood: 8, energyLevel: 7, motivationLevel: 9}` |
| **Then (Success)** | Survey created for today |
| **Then (Failure)** | - |

| ID | TC-SURV-002 |
|----|-------------|
| **Description** | Update existing survey (upsert) |
| **Given** | Survey exists for today |
| **When** | POST `/api/surveys` with new values |
| **Then (Success)** | Existing survey updated |
| **Then (Failure)** | - |

---

### 6.2 Survey Retrieval

| ID | TC-SURV-010 |
|----|-------------|
| **Description** | Get surveys for last 30 days |
| **Given** | User has survey data |
| **When** | GET `/api/surveys` |
| **Then (Success)** | Returns surveys for last 30 days |
| **Then (Failure)** | - |

| ID | TC-SURV-011 |
|----|-------------|
| **Description** | Get surveys with custom range |
| **Given** | User has survey data |
| **When** | GET `/api/surveys?days=7` |
| **Then (Success)** | Returns surveys for last 7 days only |
| **Then (Failure)** | - |

---

## 🤖 7. Custom Coaches

### 7.1 Coach Creation

| ID | TC-COACH-001 |
|----|-------------|
| **Description** | Create custom coach |
| **Given** | User authenticated |
| **When** | POST `/api/coaches` with `{name: "Fitness Guru", systemPrompt: "You are..."}` |
| **Then (Success)** | `{success: true, data: {coach: {...}}}` |
| **Then (Failure)** | - |

| ID | TC-COACH-002 |
|----|-------------|
| **Description** | Reject coach without name |
| **Given** | User authenticated |
| **When** | POST `/api/coaches` without name |
| **Then (Success)** | - |
| **Then (Failure)** | Status 400, "Name and instructions are required" |

| ID | TC-COACH-003 |
|----|-------------|
| **Description** | Reject coach without systemPrompt |
| **Given** | User authenticated |
| **When** | POST `/api/coaches` without systemPrompt |
| **Then (Success)** | - |
| **Then (Failure)** | Status 400, "Name and instructions are required" |

---

### 7.2 Coach Retrieval

| ID | TC-COACH-010 |
|----|-------------|
| **Description** | Get all custom coaches |
| **Given** | User has 2 coaches |
| **When** | GET `/api/coaches` |
| **Then (Success)** | Returns array of 2 coaches |
| **Then (Failure)** | - |

---

### 7.3 Coach Deletion

| ID | TC-COACH-020 |
|----|-------------|
| **Description** | Delete custom coach |
| **Given** | User owns coach |
| **When** | DELETE `/api/coaches?id={coachId}` |
| **Then (Success)** | `{success: true}` |
| **Then (Failure)** | - |

| ID | TC-COACH-021 |
|----|-------------|
| **Description** | Reject delete without ID |
| **Given** | User authenticated |
| **When** | DELETE `/api/coaches` (no id) |
| **Then (Success)** | - |
| **Then (Failure)** | Status 400, "Coach ID is required" |

---

## ⚙️ 8. Settings

### 8.1 Get Settings

| ID | TC-SET-001 |
|----|-------------|
| **Description** | Get user preferences |
| **Given** | User authenticated |
| **When** | GET `/api/settings` |
| **Then (Success)** | Returns preferences object |
| **Then (Failure)** | - |

| ID | TC-SET-002 |
|----|-------------|
| **Description** | Reject unauthenticated settings access |
| **Given** | User NOT authenticated |
| **When** | GET `/api/settings` |
| **Then (Success)** | - |
| **Then (Failure)** | Status 401, "Unauthorized" |

---

### 8.2 Update Settings

| ID | TC-SET-010 |
|----|-------------|
| **Description** | Update user preferences |
| **Given** | User authenticated |
| **When** | POST `/api/settings` with `{preferredDifficulty: 7, theme: "dark"}` |
| **Then (Success)** | `{success: true, data: {preferences: {...}}}` |
| **Then (Failure)** | - |

---

## 🔒 9. Authorization Tests (Cross-Cutting)

| ID | TC-AUTHZ-001 |
|----|-------------|
| **Description** | All protected endpoints reject unauthenticated requests |
| **Given** | No auth token provided |
| **When** | Any protected endpoint called |
| **Then (Success)** | - |
| **Then (Failure)** | Status 401, "Unauthorized" |

| ID | TC-AUTHZ-002 |
|----|-------------|
| **Description** | Users cannot access other users' resources |
| **Given** | User A tries to access User B's goal |
| **When** | GET/POST/PUT/DELETE with User B's resource ID |
| **Then (Success)** | - |
| **Then (Failure)** | Status 404, "Not found" (hides existence) |

---

## 📈 Test Coverage Summary

| Module | Test Cases | Priority |
|--------|------------|----------|
| Authentication | 13 | 🔴 Critical |
| Goals | 11 | 🔴 Critical |
| Challenges | 10 | 🟠 High |
| Habits | 12 | 🟠 High |
| Diary | 4 | 🟡 Medium |
| Surveys | 4 | 🟡 Medium |
| Coaches | 6 | 🟡 Medium |
| Settings | 3 | 🟢 Low |
| Authorization | 2 | 🔴 Critical |
| **Total** | **65** | |
