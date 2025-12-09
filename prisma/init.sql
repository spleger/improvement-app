-- Goal Transformation App SQLite Schema
-- Generated from Prisma schema for Windows ARM64 compatibility

-- Users Table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "themePreference" TEXT NOT NULL DEFAULT 'minimal',
    "notificationSettings" TEXT NOT NULL DEFAULT '{}',
    "onboardingCompleted" INTEGER NOT NULL DEFAULT 0,
    "onboardingData" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- Goal Domains Table
CREATE TABLE IF NOT EXISTS "GoalDomain" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "description" TEXT,
    "examples" TEXT
);

-- Goals Table
CREATE TABLE IF NOT EXISTS "Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "domainId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "currentState" TEXT,
    "desiredState" TEXT,
    "aiAnalysis" TEXT,
    "scientificFramework" TEXT,
    "difficultyLevel" INTEGER NOT NULL DEFAULT 5,
    "realityShiftEnabled" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "targetDate" DATETIME,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Goal_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "GoalDomain" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Goal_userId_idx" ON "Goal"("userId");
CREATE INDEX IF NOT EXISTS "Goal_status_idx" ON "Goal"("status");

-- Challenge Templates Table
CREATE TABLE IF NOT EXISTS "ChallengeTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domainId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" TEXT,
    "durationMinutes" INTEGER,
    "difficulty" INTEGER NOT NULL,
    "isRealityShift" INTEGER NOT NULL DEFAULT 0,
    "scientificReferences" TEXT,
    "tags" TEXT,
    "successCriteria" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChallengeTemplate_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "GoalDomain" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Challenges Table
CREATE TABLE IF NOT EXISTS "Challenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "goalId" TEXT,
    "userId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "personalizationNotes" TEXT,
    "difficulty" INTEGER NOT NULL,
    "isRealityShift" INTEGER NOT NULL DEFAULT 0,
    "scheduledDate" DATETIME NOT NULL,
    "scheduledTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" DATETIME,
    "skippedReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Challenge_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Challenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Challenge_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChallengeTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Challenge_userId_scheduledDate_idx" ON "Challenge"("userId", "scheduledDate");
CREATE INDEX IF NOT EXISTS "Challenge_status_idx" ON "Challenge"("status");

-- Challenge Logs Table
CREATE TABLE IF NOT EXISTS "ChallengeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "difficultyFelt" INTEGER,
    "satisfaction" INTEGER,
    "notes" TEXT,
    "evidenceUrls" TEXT,
    "insights" TEXT,
    "aiFeedback" TEXT,
    CONSTRAINT "ChallengeLog_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChallengeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Diary Entries Table
CREATE TABLE IF NOT EXISTS "DiaryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "goalId" TEXT,
    "challengeId" TEXT,
    "entryType" TEXT NOT NULL DEFAULT 'voice',
    "audioUrl" TEXT,
    "audioDurationSeconds" INTEGER,
    "transcript" TEXT,
    "aiSummary" TEXT,
    "aiInsights" TEXT,
    "moodDetected" TEXT,
    "moodScore" INTEGER,
    "keyThemes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiaryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DiaryEntry_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DiaryEntry_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "DiaryEntry_userId_idx" ON "DiaryEntry"("userId");
CREATE INDEX IF NOT EXISTS "DiaryEntry_createdAt_idx" ON "DiaryEntry"("createdAt");

-- Daily Surveys Table
CREATE TABLE IF NOT EXISTS "DailySurvey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "surveyDate" DATETIME NOT NULL,
    "energyLevel" INTEGER NOT NULL,
    "motivationLevel" INTEGER NOT NULL,
    "overallMood" INTEGER NOT NULL,
    "sleepQuality" INTEGER,
    "stressLevel" INTEGER,
    "biggestWin" TEXT,
    "biggestBlocker" TEXT,
    "gratitudeNote" TEXT,
    "tomorrowIntention" TEXT,
    "customMetrics" TEXT,
    "completionLevel" TEXT NOT NULL DEFAULT 'minimum',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailySurvey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "DailySurvey_userId_surveyDate_key" ON "DailySurvey"("userId", "surveyDate");
CREATE INDEX IF NOT EXISTS "DailySurvey_userId_surveyDate_idx" ON "DailySurvey"("userId", "surveyDate");

-- Conversations Table
CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "goalId" TEXT,
    "conversationType" TEXT NOT NULL,
    "title" TEXT,
    "messages" TEXT NOT NULL DEFAULT '[]',
    "context" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Conversation_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Conversation_userId_idx" ON "Conversation"("userId");

-- Progress Snapshots Table
CREATE TABLE IF NOT EXISTS "ProgressSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "snapshotDate" DATETIME NOT NULL,
    "challengesCompleted" INTEGER NOT NULL DEFAULT 0,
    "challengesSkipped" INTEGER NOT NULL DEFAULT 0,
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "avgDifficultyFelt" REAL,
    "avgSatisfaction" REAL,
    "diaryEntriesCount" INTEGER NOT NULL DEFAULT 0,
    "aiProgressAssessment" TEXT,
    "progressScore" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgressSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProgressSnapshot_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProgressSnapshot_goalId_snapshotDate_key" ON "ProgressSnapshot"("goalId", "snapshotDate");
CREATE INDEX IF NOT EXISTS "ProgressSnapshot_goalId_snapshotDate_idx" ON "ProgressSnapshot"("goalId", "snapshotDate");

-- Seed Goal Domains
INSERT OR IGNORE INTO "GoalDomain" ("id", "name", "icon", "color", "description", "examples") VALUES
(1, 'Languages', 'languages', '#6366f1', 'Learning new languages and improving fluency', '["Learn German", "Improve Spanish fluency", "Master Japanese basics"]'),
(2, 'Mobility', 'stretch', '#22c55e', 'Physical flexibility and movement improvement', '["Touch toes", "Full splits", "Improve hip mobility"]'),
(3, 'Emotional Growth', 'heart', '#ec4899', 'Emotional intelligence and regulation', '["Reduce anxiety", "Increase patience", "Better stress management"]'),
(4, 'Relationships', 'users', '#f59e0b', 'Interpersonal connections and communication', '["Deeper friendships", "Better communication", "Family bonding"]'),
(5, 'Physical Health', 'dumbbell', '#ef4444', 'Body composition and fitness', '["Build muscle", "Improve endurance", "Lose weight"]'),
(6, 'Tolerance', 'shield', '#8b5cf6', 'Building resilience to discomfort', '["Cold tolerance", "Public speaking comfort", "Pain tolerance"]'),
(7, 'Skills', 'wrench', '#06b6d4', 'Practical abilities and talents', '["Learn piano", "Master cooking", "Photography skills"]'),
(8, 'Habits', 'repeat', '#84cc16', 'Routine behaviors and lifestyle changes', '["Morning routine", "Quit smoking", "Daily meditation"]');

-- Seed Demo User
INSERT OR IGNORE INTO "User" ("id", "email", "passwordHash", "displayName", "themePreference", "onboardingCompleted", "timezone")
VALUES ('demo-user-001', 'demo@example.com', 'demo', 'Demo User', 'minimal', 1, 'UTC');

-- Seed Challenge Templates
INSERT OR IGNORE INTO "ChallengeTemplate" ("id", "domainId", "title", "description", "instructions", "durationMinutes", "difficulty", "isRealityShift", "scientificReferences", "tags", "successCriteria") VALUES
('tpl-lang-001', 1, 'Immersion Hour', 'Change all your device languages to your target language for one hour and navigate normally', 'Go to settings on your phone and computer. Change the language. Use your devices normally for the next hour.', 60, 3, 0, '["Immersive language exposure increases retention by 40%"]', '["immersion", "passive", "beginner-friendly"]', 'Complete 1 hour with devices in target language'),
('tpl-lang-002', 1, 'Think in Your Target Language', 'For 20 minutes, narrate your thoughts internally in your target language only', 'Set a timer for 20 minutes. Think about your day, plans, or surroundings entirely in the target language.', 20, 5, 0, '["Internal monologue practice builds automatic retrieval"]', '["thinking", "internal", "intermediate"]', 'Maintain internal dialogue for 20 minutes'),
('tpl-lang-003', 1, 'Stranger Conversation', 'Find a native speaker online or in person and have a 5-minute conversation', 'Use language exchange apps, local meetups, or online platforms to find a conversation partner.', 30, 7, 1, '["Active production with feedback accelerates fluency by 60%"]', '["speaking", "social", "advanced"]', 'Complete a 5+ minute conversation with a native speaker'),
('tpl-mob-001', 2, 'Morning Mobility Flow', 'Complete a 15-minute mobility routine as the first thing after waking up', 'Include: hip circles, shoulder rotations, cat-cow stretches, and gentle twists. Move slowly and breathe deeply.', 15, 3, 0, '["Morning mobility increases flexibility gains by 25%"]', '["morning", "routine", "beginner"]', 'Complete full 15-minute mobility routine before any other activity'),
('tpl-mob-002', 2, 'Deep Squat Hold', 'Accumulate 5 minutes in a deep squat position throughout the day', 'Hold a deep squat (heels down if possible) for as long as comfortable. Track total time.', 5, 5, 0, '["Deep squat practice restores natural hip mobility"]', '["squat", "flexibility", "intermediate"]', 'Total of 5 minutes accumulated in deep squat'),
('tpl-emo-001', 3, 'Emotion Labeling', 'Set 5 random alarms. When they go off, identify and write down your exact emotion', 'Use specific emotion words (not just good or bad). Examples: anxious, content, frustrated, curious.', 30, 3, 0, '["Emotion labeling reduces amygdala reactivity by 50%"]', '["awareness", "mindfulness", "beginner"]', 'Complete all 5 emotion check-ins with specific labels'),
('tpl-tol-001', 6, 'Cold Shower Finish', 'End your shower with 30 seconds of cold water', 'Take your normal shower, then switch to cold for the last 30 seconds. Breathe slowly and stay calm.', 1, 4, 0, '["Cold exposure increases dopamine by 250% and builds mental resilience"]', '["cold", "discomfort", "beginner"]', 'Complete 30 seconds of cold water at end of shower'),
('tpl-hab-001', 8, 'Habit Stacking', 'Attach your new habit to an existing routine you never skip', 'Identify a habit you do daily (brushing teeth, coffee). Add your new habit immediately before or after.', 10, 2, 0, '["Habit stacking increases habit formation success by 73%"]', '["habit", "routine", "beginner"]', 'Successfully stack new habit with existing routine');
