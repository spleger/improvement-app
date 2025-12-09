-- User Preferences Table for Goal Transformation App
-- Run this in Supabase SQL Editor

-- Create UserPreferences table
CREATE TABLE IF NOT EXISTS "UserPreferences" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
    
    -- Profile Settings
    "displayName" TEXT,
    "timezone" TEXT DEFAULT 'auto',
    "language" TEXT DEFAULT 'en',
    
    -- Challenge Generation Preferences
    "preferredDifficulty" INTEGER DEFAULT 5,
    "challengeFrequency" TEXT DEFAULT 'daily', -- 'daily', 'twice-daily', 'custom'
    "challengesPerDay" INTEGER DEFAULT 1,
    "realityShiftEnabled" BOOLEAN DEFAULT FALSE,
    "preferredChallengeTime" TEXT DEFAULT 'morning', -- 'morning', 'afternoon', 'evening', 'anytime'
    
    -- Focus Areas (JSON array)
    "focusAreas" TEXT DEFAULT '[]',
    "avoidAreas" TEXT DEFAULT '[]',
    
    -- Notification Settings
    "notificationsEnabled" BOOLEAN DEFAULT TRUE,
    "dailyReminderTime" TEXT DEFAULT '09:00',
    "streakReminders" BOOLEAN DEFAULT TRUE,
    
    -- AI Settings
    "aiPersonality" TEXT DEFAULT 'encouraging', -- 'encouraging', 'tough-love', 'scientific', 'casual'
    "includeScientificBasis" BOOLEAN DEFAULT TRUE,
    "challengeLengthPreference" TEXT DEFAULT 'medium', -- 'short' (5-15min), 'medium' (15-30min), 'long' (30+min)
    
    -- Theme Settings
    "theme" TEXT DEFAULT 'minimal', -- 'minimal', 'dark', 'colorful'
    
    -- Timestamps
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create default preferences for demo user
INSERT INTO "UserPreferences" ("id", "userId", "displayName")
VALUES ('pref-demo-001', 'demo-user-001', 'Demo User')
ON CONFLICT ("userId") DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON "UserPreferences"("userId");
