import { z } from 'zod';

// Shared validation schemas for API route request bodies

export const GoalCreateSchema = z.object({
    title: z.string().min(1).max(200),
    domainId: z.number().int().positive().optional(),
    domainName: z.string().max(100).optional(),
    description: z.string().max(2000).optional(),
    currentState: z.string().max(1000).optional(),
    desiredState: z.string().max(1000).optional(),
    difficultyLevel: z.number().int().min(1).max(10).optional().default(5),
    realityShiftEnabled: z.boolean().optional().default(false),
});

export const HabitCreateSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    icon: z.string().max(10).optional(),
    frequency: z.enum(['daily', 'weekly', 'custom']).optional().default('daily'),
    targetDays: z.array(z.string()).optional(),
    goalId: z.string().nullable().optional(),
});

export const HabitUpdateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    icon: z.string().max(10).optional(),
    frequency: z.enum(['daily', 'weekly', 'custom']).optional(),
    targetDays: z.array(z.string()).optional(),
    goalId: z.string().nullable().optional(),
});

export const SurveySchema = z.object({
    overallMood: z.number().int().min(1).max(10),
    energyLevel: z.number().int().min(1).max(10),
    motivationLevel: z.number().int().min(1).max(10),
    notes: z.string().max(2000).optional(),
    gratitudeNote: z.string().max(2000).optional(),
    biggestWin: z.string().max(1000).optional(),
    biggestBlocker: z.string().max(1000).optional(),
});

export const VALID_VOICE_IDS = [
    'alloy', 'ash', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer'
] as const;

export const SettingsSchema = z.object({
    displayName: z.string().max(100).optional().nullable(),
    preferredDifficulty: z.number().int().min(1).max(10).optional().nullable(),
    challengesPerDay: z.number().int().min(1).max(10).optional().nullable(),
    realityShiftEnabled: z.boolean().optional().nullable(),
    preferredChallengeTime: z.string().max(50).optional().nullable(),
    focusAreas: z.array(z.string().max(50)).optional().nullable(),
    avoidAreas: z.array(z.string().max(50)).optional().nullable(),
    aiPersonality: z.enum(['empathetic', 'tough_love', 'scientific', 'casual', 'encouraging']).optional().nullable(),
    includeScientificBasis: z.boolean().optional().nullable(),
    challengeLengthPreference: z.enum(['quick', 'medium', 'long']).optional().nullable(),
    notificationsEnabled: z.boolean().optional().nullable(),
    dailyReminderTime: z.string().max(10).optional().nullable(),
    streakReminders: z.boolean().optional().nullable(),
    theme: z.string().max(20).optional().nullable(),
    voiceId: z.enum(VALID_VOICE_IDS).optional().nullable(),
    aiCustomName: z.string().max(50).optional().nullable(),
    tonePreference: z.enum(['professional', 'friendly', 'casual']).optional().nullable(),
    rudeMode: z.boolean().optional().nullable(),
});

export const DiaryCreateSchema = z.object({
    transcript: z.string().min(1, 'Transcript is required').max(50000),
    audioDurationSeconds: z.number().min(0).optional(),
    moodScore: z.number().int().min(1).max(10).optional(),
});

export const ChallengeGenerateSchema = z.object({
    goalId: z.string().optional(),
    count: z.number().int().min(1).max(5).optional().default(1),
    focusArea: z.string().max(200).optional(),
});

export const ChatMessageSchema = z.object({
    message: z.string().min(1).max(5000),
    history: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
    })).max(20).optional(),
    coachId: z.string().max(100).optional(),
});

export const InterviewMessageSchema = z.object({
    message: z.string().min(1).max(5000),
    stage: z.enum(['mood', 'goals', 'challenges', 'habits', 'general', 'open']).optional().default('mood'),
    nextStage: z.enum(['mood', 'goals', 'challenges', 'habits', 'general', 'open']).nullable().optional(),
    exchangeCount: z.number().int().min(0).max(100).optional().default(0),
    clientContext: z.any().optional(),
});

export const AcceptInviteSchema = z.object({
    inviteCode: z.string().min(1).max(20),
});

export const RemovePartnerSchema = z.object({
    partnershipId: z.string().min(1),
});

/**
 * Parse and validate a request body against a Zod schema.
 * Returns the validated data or a NextResponse with a 400 error.
 */
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T } | { success: false; error: string } {
    const result = schema.safeParse(body);
    if (!result.success) {
        const firstError = result.error.errors[0];
        const path = firstError.path.join('.');
        const message = path ? `${path}: ${firstError.message}` : firstError.message;
        return { success: false, error: message };
    }
    return { success: true, data: result.data };
}
