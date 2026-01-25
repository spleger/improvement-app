// Type definitions for the Goal Transformation App

export interface User {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    themePreference: string;
    onboardingCompleted: boolean;
    timezone: string;
    createdAt: Date;
}

export interface GoalDomain {
    id: number;
    name: string;
    icon: string | null;
    color: string | null;
    description: string | null;
    examples: string[];
}

export interface Goal {
    id: string;
    userId: string;
    domainId: number | null;
    title: string;
    description: string | null;
    currentState: string | null;
    desiredState: string | null;
    difficultyLevel: number;
    realityShiftEnabled: boolean;
    status: 'active' | 'completed' | 'paused' | 'abandoned';
    targetDate: Date | null;
    startedAt: Date;
    completedAt: Date | null;
    domain?: GoalDomain;
}

export interface ChallengeTemplate {
    id: string;
    domainId: number | null;
    title: string;
    description: string;
    instructions: string | null;
    durationMinutes: number | null;
    difficulty: number;
    isRealityShift: boolean;
    scientificReferences: string[];
    tags: string[];
    successCriteria: string | null;
}

export interface Challenge {
    id: string;
    goalId: string | null;
    userId: string;
    templateId: string | null;
    title: string;
    description: string;
    personalizationNotes: string | null;
    difficulty: number;
    isRealityShift: boolean;
    scheduledDate: Date;
    scheduledTime: string | null;
    status: 'pending' | 'active' | 'completed' | 'skipped';
    completedAt: Date | null;
    skippedReason: string | null;
    goal?: Goal;
    template?: ChallengeTemplate;
}

export interface ChallengeLog {
    id: string;
    challengeId: string;
    userId: string;
    completedAt: Date;
    difficultyFelt: number | null;
    satisfaction: number | null;
    notes: string | null;
    insights: string | null;
}

export interface DailySurvey {
    id: string;
    userId: string;
    surveyDate: Date;
    energyLevel: number;
    motivationLevel: number;
    overallMood: number;
    sleepQuality: number | null;
    stressLevel: number | null;
    biggestWin: string | null;
    biggestBlocker: string | null;
    gratitudeNote: string | null;
    tomorrowIntention: string | null;
    completionLevel: 'minimum' | 'extended';
}

export interface ProgressStats {
    streakCount: number;
    challengesCompleted: number;
    totalChallenges: number;
    diaryEntriesCount: number;
    averageMood: number;
    dayInJourney: number;
    progressPercentage: number;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// Challenge completion payload
export interface CompleteChallengePayload {
    difficultyFelt: number;
    satisfaction: number;
    notes?: string;
}

// Theme configuration
export type ThemeId = 'minimal' | 'playful' | 'bold' | 'nature';

export interface ThemeColors {
    primary: string;
    secondary: string;
    accent: string;
    highlight: string;
    background: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    success: string;
    warning: string;
    error: string;
}

// AI Types
export interface UserPrefs {
    preferredDifficulty: number;
    focusAreas: string[];
    avoidAreas: string[];
    realityShiftEnabled: boolean;
    aiPersonality: 'tough_love' | 'scientific' | 'empathetic';
}

export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ShiftSuggestion {
    isShiftRecommended: boolean;
    reasoning: string;
    intensity: number;
    suggestedFocus: string;
}

