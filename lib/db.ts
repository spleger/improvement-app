// Database client using Prisma
// Replaces node-postgres (pg) to support cross-db compatibility (SQLite/Postgres)

import { randomUUID } from 'node:crypto';
import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

// Keep generateId for compatibility if imported elsewhere,
// though Prisma handles IDs automatically now.
export function generateId(): string {
    return randomUUID();
}

// ==================== USER OPERATIONS ====================

export async function getUserById(id: string) {
    return await prisma.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: string) {
    return await prisma.user.findUnique({ where: { email } });
}

export async function createUser(data: {
    email: string;
    passwordHash: string;
    displayName?: string;
}) {
    return await prisma.user.create({
        data: {
            email: data.email,
            passwordHash: data.passwordHash,
            displayName: data.displayName,
        },
    });
}

export async function updateUserAvatar(userId: string, avatarUrl: string | null): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
    });
}

// ==================== GOAL DOMAIN OPERATIONS ====================

export async function getAllGoalDomains() {
    const domains = await prisma.goalDomain.findMany({
        orderBy: { id: 'asc' },
    });
    return domains.map(d => ({
        ...d,
        examples: d.examples ? JSON.parse(d.examples) : [],
    }));
}

export async function getGoalDomainById(id: number) {
    return await prisma.goalDomain.findUnique({ where: { id } });
}

export async function getGoalDomainByName(name: string) {
    return await prisma.goalDomain.findFirst({ where: { name } });
}

// ==================== GOAL OPERATIONS ====================

export async function getGoalsByUserId(userId: string) {
    const goals = await prisma.goal.findMany({
        where: { userId },
        include: { domain: true },
        orderBy: { createdAt: 'desc' },
    });

    // Map fit the expected return shape (domain propertiess merged or nested?)
    // The previous SQL returned: g.*, domainName, domainIcon, domainColor
    // And mapped it to: ...g, domain: { id, name, icon, color }
    // Prisma returns nested domain object, so we match that structure.
    return goals.map(g => ({
        ...g,
        domain: g.domain ? {
            id: g.domain.id,
            name: g.domain.name,
            icon: g.domain.icon,
            color: g.domain.color
        } : null
    }));
}

export async function getActiveGoalByUserId(userId: string) {
    const goal = await prisma.goal.findFirst({
        where: { userId, status: 'active' },
        include: { domain: true },
        orderBy: { createdAt: 'desc' },
    });

    if (!goal) return null;

    return {
        ...goal,
        domain: goal.domain ? {
            id: goal.domain.id,
            name: goal.domain.name,
            icon: goal.domain.icon,
            color: goal.domain.color
        } : null
    };
}

export async function createGoal(data: {
    userId: string;
    domainId: number;
    title: string;
    description?: string;
    currentState?: string;
    desiredState?: string;
    difficultyLevel?: number;
    realityShiftEnabled?: boolean;
}) {
    return await prisma.goal.create({
        data: {
            userId: data.userId,
            domainId: data.domainId,
            title: data.title,
            description: data.description,
            currentState: data.currentState,
            desiredState: data.desiredState,
            difficultyLevel: data.difficultyLevel ?? 5,
            realityShiftEnabled: data.realityShiftEnabled ?? false,
            status: 'active',
        },
    });
}

export async function getGoalById(id: string) {
    const goal = await prisma.goal.findUnique({
        where: { id },
        include: { domain: true },
    });

    if (!goal) return null;

    return {
        ...goal,
        domain: goal.domain ? {
            id: goal.domain.id,
            name: goal.domain.name,
            icon: goal.domain.icon,
            color: goal.domain.color
        } : null
    };
}

export async function updateGoalStatus(id: string, status: string) {
    return await prisma.goal.update({
        where: { id },
        data: { status },
    });
}

export async function deleteGoal(id: string) {
    // Challenge has onDelete: Cascade (auto-deleted by Prisma).
    // DiaryEntry and Conversation have onDelete: SetNull.
    // We explicitly delete related records for a clean removal,
    // wrapped in a transaction to prevent partial state on failure.
    return await prisma.$transaction(async (tx) => {
        await tx.challenge.deleteMany({ where: { goalId: id } });
        await tx.conversation.deleteMany({ where: { goalId: id } });
        await tx.diaryEntry.deleteMany({ where: { goalId: id } });
        return await tx.goal.delete({ where: { id } });
    });
}

// ==================== CHALLENGE TEMPLATE OPERATIONS ====================

export async function getChallengeTemplatesByDomain(domainId: number, options?: {
    minDifficulty?: number;
    maxDifficulty?: number;
    excludeIds?: string[];
    isRealityShift?: boolean;
}) {
    const where: Prisma.ChallengeTemplateWhereInput = {
        domainId,
    };

    if (options?.minDifficulty !== undefined) {
        where.difficulty = { ...where.difficulty as any, gte: options.minDifficulty };
    }
    if (options?.maxDifficulty !== undefined) {
        where.difficulty = { ...where.difficulty as any, lte: options.maxDifficulty };
    }
    if (options?.excludeIds && options.excludeIds.length > 0) {
        where.id = { notIn: options.excludeIds };
    }
    if (options?.isRealityShift !== undefined) {
        where.isRealityShift = options.isRealityShift;
    }

    // Previous code: ORDER BY difficulty ASC LIMIT 1
    const template = await prisma.challengeTemplate.findFirst({
        where,
        orderBy: { difficulty: 'asc' },
    });
    return template;
}

// ==================== CHALLENGE OPERATIONS ====================

export async function getChallengesByUserId(userId: string, options?: { limit?: number }) {
    // Join with Goal to get title
    const challenges = await prisma.challenge.findMany({
        where: { userId },
        include: { goal: { select: { title: true } } },
        orderBy: { scheduledDate: 'desc' },
        take: options?.limit || 30,
    });

    return challenges.map(c => ({
        ...c,
        goalTitle: c.goal?.title || null,
    }));
}

export async function getTodayChallenge(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const challenge = await prisma.challenge.findFirst({
        where: {
            userId,
            scheduledDate: {
                gte: today,
                lt: tomorrow,
            },
        },
        include: {
            template: true, // instructions, successCriteria, scientificReferences
        },
        orderBy: { createdAt: 'desc' },
    });

    if (!challenge) return null;

    return {
        ...challenge,
        instructions: challenge.template?.instructions || null,
        successCriteria: challenge.template?.successCriteria || null,
        scientificReferences: challenge.template?.scientificReferences || null,
    };
}

export async function getTodayChallenges(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const challenges = await prisma.challenge.findMany({
        where: {
            userId,
            scheduledDate: {
                gte: today,
                lt: tomorrow,
            },
        },
        include: {
            template: true,
            goal: { select: { title: true } },
        },
        orderBy: [
            { status: 'asc' },
            { createdAt: 'desc' }
        ],
    });

    return challenges.map(c => ({
        ...c,
        instructions: c.template?.instructions || null,
        successCriteria: c.template?.successCriteria || null,
        scientificReferences: c.template?.scientificReferences || null,
        goalTitle: c.goal?.title || null,
    }));
}

export async function getChallengeById(id: string) {
    const challenge = await prisma.challenge.findUnique({
        where: { id },
        include: {
            template: true,
            goal: true, // need title and domainId
        },
    });

    if (!challenge) return null;

    return {
        ...challenge,
        instructions: challenge.template?.instructions || null,
        successCriteria: challenge.template?.successCriteria || null,
        scientificReferences: challenge.template?.scientificReferences || null,
        goalTitle: challenge.goal?.title || null,
        domainId: challenge.goal?.domainId || null,
    };
}

export async function createChallenge(data: {
    userId: string;
    goalId?: string;
    templateId?: string;
    title: string;
    description: string;
    difficulty: number;
    isRealityShift?: boolean;
    scheduledDate: Date;
    personalizationNotes?: string;
    tips?: string[];
    instructions?: string;
    successCriteria?: string;
}) {
    return await prisma.challenge.create({
        data: {
            userId: data.userId,
            goalId: data.goalId,
            templateId: data.templateId,
            title: data.title,
            description: data.description,
            difficulty: data.difficulty,
            isRealityShift: data.isRealityShift ?? false,
            scheduledDate: data.scheduledDate,
            personalizationNotes: data.personalizationNotes,
            tips: data.tips ? JSON.stringify(data.tips) : undefined,
            instructions: data.instructions,
            successCriteria: data.successCriteria,
            status: 'pending',
        },
    });
}

export async function completeChallenge(id: string) {
    return await prisma.challenge.update({
        where: { id },
        data: {
            status: 'completed',
            completedAt: new Date(),
        },
    });
}

export async function skipChallenge(id: string, reason?: string) {
    return await prisma.challenge.update({
        where: { id },
        data: {
            status: 'skipped',
            skippedReason: reason,
        },
    });
}

export async function getCompletedChallengesCount(userId: string) {
    return await prisma.challenge.count({
        where: {
            userId,
            status: 'completed',
        },
    });
}

export async function getRecentCompletedChallenges(userId: string, limit: number = 30) {
    return await prisma.challenge.findMany({
        where: {
            userId,
            status: 'completed',
        },
        orderBy: { completedAt: 'desc' },
        take: limit,
    });
}

// ==================== CHALLENGE LOG OPERATIONS ====================

export async function createChallengeLog(data: {
    challengeId: string;
    userId: string;
    difficultyFelt?: number;
    satisfaction?: number;
    notes?: string;
}) {
    return await prisma.challengeLog.create({
        data: {
            challengeId: data.challengeId,
            userId: data.userId,
            difficultyFelt: data.difficultyFelt,
            satisfaction: data.satisfaction,
            notes: data.notes,
            completedAt: new Date(),
        },
    });
}

export async function getChallengeLogsByUserId(userId: string, limit: number = 10) {
    return await prisma.challengeLog.findMany({
        where: { userId },
        orderBy: { completedAt: 'desc' },
        take: limit,
    });
}

// ==================== DAILY SURVEY OPERATIONS ====================

export async function createOrUpdateDailySurvey(data: {
    userId: string;
    surveyDate: Date;
    energyLevel: number;
    motivationLevel: number;
    overallMood: number;
    sleepQuality?: number;
    stressLevel?: number;
    biggestWin?: string;
    biggestBlocker?: string;
    gratitudeNote?: string;
    tomorrowIntention?: string;
    completionLevel?: string;
}) {
    // Prisma upsert requires a unique identifier (userId_surveyDate)
    return await prisma.dailySurvey.upsert({
        where: {
            userId_surveyDate: {
                userId: data.userId,
                surveyDate: data.surveyDate,
            },
        },
        update: {
            energyLevel: data.energyLevel,
            motivationLevel: data.motivationLevel,
            overallMood: data.overallMood,
            sleepQuality: data.sleepQuality,
            stressLevel: data.stressLevel,
            biggestWin: data.biggestWin,
            biggestBlocker: data.biggestBlocker,
            gratitudeNote: data.gratitudeNote,
            tomorrowIntention: data.tomorrowIntention,
            completionLevel: data.completionLevel || 'minimum',
        },
        create: {
            userId: data.userId,
            surveyDate: data.surveyDate,
            energyLevel: data.energyLevel,
            motivationLevel: data.motivationLevel,
            overallMood: data.overallMood,
            sleepQuality: data.sleepQuality,
            stressLevel: data.stressLevel,
            biggestWin: data.biggestWin,
            biggestBlocker: data.biggestBlocker,
            gratitudeNote: data.gratitudeNote,
            tomorrowIntention: data.tomorrowIntention,
            completionLevel: data.completionLevel || 'minimum',
        },
    });
}

export async function getSurveysByUserId(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await prisma.dailySurvey.findMany({
        where: {
            userId,
            surveyDate: { gte: startDate },
        },
        orderBy: { surveyDate: 'desc' },
    });
}

// ==================== DIARY ENTRY OPERATIONS ====================

export async function createDiaryEntry(data: {
    userId: string;
    goalId?: string;
    challengeId?: string;
    entryType?: string;
    audioUrl?: string;
    audioDurationSeconds?: number;
    transcript?: string;
    moodScore?: number;
    aiSummary?: string;
    aiInsights?: string;
}) {
    return await prisma.diaryEntry.create({
        data: {
            userId: data.userId,
            goalId: data.goalId,
            challengeId: data.challengeId,
            entryType: data.entryType || 'voice',
            audioUrl: data.audioUrl,
            audioDurationSeconds: data.audioDurationSeconds,
            transcript: data.transcript,
            moodScore: data.moodScore,
            aiSummary: data.aiSummary,
            aiInsights: data.aiInsights,
        },
    });
}

export async function getDiaryEntriesByUserId(userId: string, limit: number = 20) {
    return await prisma.diaryEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}

export async function getDiaryEntriesCount(userId: string) {
    return await prisma.diaryEntry.count({
        where: { userId },
    });
}

// ==================== UTILITY FUNCTIONS ====================

export async function calculateStreak(userId: string): Promise<number> {
    const recentChallenges = await getRecentCompletedChallenges(userId, 30);

    let streak = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const hasCompletion = recentChallenges.some(c =>
            c.completedAt && new Date(c.completedAt).toISOString().split('T')[0] === dateStr
        );

        if (hasCompletion) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else if (i > 0) {
            break;
        } else {
            checkDate.setDate(checkDate.getDate() - 1);
        }
    }

    return streak;
}

// ==================== USER PREFERENCES OPERATIONS ====================

export async function getUserPreferences(userId: string) {
    let prefs = await prisma.userPreferences.findUnique({
        where: { userId },
    });

    if (!prefs) {
        // Create default preferences
        try {
            prefs = await prisma.userPreferences.create({
                data: { userId },
            });
        } catch (e) {
            // Check if created concurrently
            prefs = await prisma.userPreferences.findUnique({
                where: { userId },
            });
        }
    }

    return parsePreferences(prefs);
}

function parsePreferences(row: any) {
    if (!row) return null;
    return {
        ...row,
        // Prisma on SQLite returns string for JSON? 
        // Schema: focusAreas String? // JSON string
        focusAreas: row.focusAreas ? (typeof row.focusAreas === 'string' ? JSON.parse(row.focusAreas) : row.focusAreas) : [],
        avoidAreas: row.avoidAreas ? (typeof row.avoidAreas === 'string' ? JSON.parse(row.avoidAreas) : row.avoidAreas) : [],
    };
}

export async function saveUserPreferences(userId: string, prefs: {
    displayName?: string;
    preferredDifficulty?: number;
    challengesPerDay?: number;
    realityShiftEnabled?: boolean;
    preferredChallengeTime?: string;
    focusAreas?: string[];
    avoidAreas?: string[];
    aiPersonality?: string;
    includeScientificBasis?: boolean;
    challengeLengthPreference?: string;
    notificationsEnabled?: boolean;
    dailyReminderTime?: string;
    streakReminders?: boolean;
    theme?: string;
    // AI Voice Selection
    voiceId?: string;
    // AI Personality Customization
    aiCustomName?: string;
    tonePreference?: string;
    rudeMode?: boolean;
}) {
    const data: any = { ...prefs };
    // Stringify JSON fields (Schema says String for SQLite compatibility likely, or just design)
    if (prefs.focusAreas) data.focusAreas = JSON.stringify(prefs.focusAreas);
    if (prefs.avoidAreas) data.avoidAreas = JSON.stringify(prefs.avoidAreas);

    const updated = await prisma.userPreferences.upsert({
        where: { userId },
        create: {
            userId,
            ...data
        },
        update: {
            ...data
        }
    });

    return parsePreferences(updated);
}

// ==================== CUSTOM COACH OPERATIONS ====================

export async function createCustomCoach(data: {
    userId: string;
    name: string;
    icon?: string;
    color?: string;
    systemPrompt: string;
    isGoalCoach?: boolean;
    goalId?: string;
}) {
    return await prisma.customCoach.create({
        data: {
            userId: data.userId,
            name: data.name,
            icon: data.icon ?? '🤖',
            color: data.color ?? '#8b5cf6',
            systemPrompt: data.systemPrompt,
            isGoalCoach: data.isGoalCoach ?? false,
            goalId: data.goalId,
        },
    });
}

export async function getCustomCoachesByUserId(userId: string) {
    return await prisma.customCoach.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
}

export async function deleteCustomCoach(id: string, userId: string) {
    // Check ownership
    const coach = await prisma.customCoach.findFirst({
        where: { id, userId },
    });
    if (!coach) return null;

    return await prisma.customCoach.delete({
        where: { id },
    });
}

// ==================== CONVERSATION OPERATIONS ====================

export async function createConversation(data: {
    userId: string;
    conversationType: string;
    title?: string;
    goalId?: string;
    initialMessages?: any[];
    context?: any;
}) {
    return await prisma.conversation.create({
        data: {
            userId: data.userId,
            conversationType: data.conversationType,
            title: data.title,
            goalId: data.goalId,
            messages: JSON.stringify(data.initialMessages || []),
            context: JSON.stringify(data.context || {}),
        },
    });
}

export async function getConversationsByUserId(userId: string, limit: number = 10) {
    const convs = await prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: limit,
    });

    return convs.map(row => ({
        ...row,
        messages: row.messages ? JSON.parse(row.messages) : [],
        context: row.context ? JSON.parse(row.context) : null
    }));
}

export async function getLatestConversation(userId: string) {
    const row = await prisma.conversation.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
    });

    if (!row) return null;
    return {
        ...row,
        messages: row.messages ? JSON.parse(row.messages) : [],
        context: row.context ? JSON.parse(row.context) : null
    };
}

export async function getExpertConversation(userId: string, coachId: string) {
    // Fetch recent expert chats and filter in code
    const convs = await prisma.conversation.findMany({
        where: {
            userId,
            conversationType: 'expert_chat'
        },
        orderBy: { updatedAt: 'desc' },
        take: 20, // Check last 20 chats
    });

    const match = convs.find(c => {
        const ctx = c.context ? JSON.parse(c.context) : {};
        if (coachId === 'general') {
            return !ctx.coachId || ctx.coachId === 'general';
        }
        return ctx.coachId === coachId;
    });

    if (!match) return null;

    return {
        ...match,
        messages: match.messages ? JSON.parse(match.messages) : [],
        context: match.context ? JSON.parse(match.context) : null
    };
}

export async function updateConversationMessages(id: string, messages: any[]) {
    const updated = await prisma.conversation.update({
        where: { id },
        data: {
            messages: JSON.stringify(messages),
        },
    });
    return updated;
}

export async function getConversationByType(userId: string, conversationType: string) {
    // Get the most recent conversation of a specific type for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const conv = await prisma.conversation.findFirst({
        where: {
            userId,
            conversationType,
            createdAt: { gte: todayStart }
        },
        orderBy: { updatedAt: 'desc' },
    });

    if (!conv) return null;

    return {
        ...conv,
        messages: conv.messages ? JSON.parse(conv.messages) : [],
        context: conv.context ? JSON.parse(conv.context) : null
    };
}

export async function updateConversationContext(id: string, context: any) {
    const updated = await prisma.conversation.update({
        where: { id },
        data: {
            context: JSON.stringify(context),
        },
    });
    return updated;
}

// ==================== HABIT OPERATIONS ====================

export async function createHabit(data: {
    userId: string;
    goalId?: string;
    name: string;
    description?: string;
    icon?: string;
    frequency?: string;
    targetDays?: string[];
}) {
    return await prisma.habit.create({
        data: {
            userId: data.userId,
            goalId: data.goalId,
            name: data.name,
            description: data.description,
            icon: data.icon ?? '✅',
            frequency: data.frequency ?? 'daily',
            targetDays: data.targetDays ? JSON.stringify(data.targetDays) : null,
            isActive: true,
        },
    });
}

export async function getHabitsByUserId(userId: string, includeInactive: boolean = false) {
    const where: Prisma.HabitWhereInput = { userId };
    if (!includeInactive) {
        where.isActive = true;
    }

    const habits = await prisma.habit.findMany({
        where,
        include: { goal: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
    });

    return habits.map(row => ({
        ...row,
        targetDays: row.targetDays ? JSON.parse(row.targetDays) : null,
        goalTitle: row.goal?.title || null,
    }));
}

export async function getHabitById(id: string) {
    const habit = await prisma.habit.findUnique({
        where: { id },
        include: { goal: { select: { title: true } } },
    });

    if (!habit) return null;

    return {
        ...habit,
        targetDays: habit.targetDays ? JSON.parse(habit.targetDays) : null,
        goalTitle: habit.goal?.title || null,
    };
}

export async function updateHabit(id: string, data: {
    name?: string;
    description?: string;
    icon?: string;
    frequency?: string;
    targetDays?: string[];
    goalId?: string | null;
    isActive?: boolean;
}) {
    const updateData: any = { ...data };
    if (data.targetDays) updateData.targetDays = JSON.stringify(data.targetDays);

    return await prisma.habit.update({
        where: { id },
        data: updateData,
    });
}

export async function deleteHabit(id: string) {
    await prisma.habitLog.deleteMany({ where: { habitId: id } });
    return await prisma.habit.delete({ where: { id } });
}

// ==================== HABIT LOG OPERATIONS ====================

export async function upsertHabitLog(data: {
    habitId: string;
    logDate: Date;
    completed: boolean;
    notes?: string;
    source?: string;
}) {
    // Normalize logDate to start of day UTC
    const normalizedDate = new Date(data.logDate);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    return await prisma.habitLog.upsert({
        where: {
            habitId_logDate: {
                habitId: data.habitId,
                logDate: normalizedDate,
            }
        },
        create: {
            habitId: data.habitId,
            logDate: normalizedDate,
            completed: data.completed,
            notes: data.notes,
            source: data.source ?? 'manual',
            createdAt: new Date(), // Manually set? Schema default is now(), but explicit is fine.
        },
        update: {
            completed: data.completed,
            notes: data.notes,
            source: data.source ?? 'manual',
        }
    });
}

export async function getHabitLogsForDate(userId: string, date: Date) {
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);
    const nextDay = new Date(normalizedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const logs = await prisma.habitLog.findMany({
        where: {
            habit: { userId },
            logDate: {
                gte: normalizedDate,
                lt: nextDay,
            }
        },
        include: {
            habit: true, // Need name and icon
        }
    });

    return logs.map(l => ({
        ...l,
        habitName: l.habit.name,
        habitIcon: l.habit.icon,
    }));
}

export async function getHabitLogsForRange(userId: string, startDate: Date, endDate: Date) {
    const logs = await prisma.habitLog.findMany({
        where: {
            habit: { userId },
            logDate: {
                gte: startDate,
                lt: endDate,
            }
        },
        include: {
            habit: true,
        },
        orderBy: { logDate: 'desc' }
    });

    return logs.map(l => ({
        ...l,
        habitName: l.habit.name,
        habitIcon: l.habit.icon,
        habitId: l.habit.id,
    }));
}

export async function calculateHabitStreak(habitId: string): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);

    const logs = await prisma.habitLog.findMany({
        where: {
            habitId,
            logDate: { gte: startDate },
        },
        orderBy: { logDate: 'desc' }
    });

    let streak = 0;
    const checkDate = new Date();
    checkDate.setUTCHours(0, 0, 0, 0);

    for (let i = 0; i < 60; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const log = logs.find(r => new Date(r.logDate).toISOString().split('T')[0] === dateStr);

        if (log && log.completed) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else if (i > 0) {
            break;
        } else {
            checkDate.setDate(checkDate.getDate() - 1);
        }
    }

    return streak;
}

export async function getHabitStats(userId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setUTCHours(0, 0, 0, 0);

    // Fetch all habits for user
    const habits = await getHabitsByUserId(userId);

    // Fetch logs for streak calculation (last 60 days) IN BULK
    const streakStartDate = new Date();
    streakStartDate.setDate(streakStartDate.getDate() - 60);
    streakStartDate.setUTCHours(0, 0, 0, 0);

    const allLogs = await prisma.habitLog.findMany({
        where: {
            habit: { userId },
            logDate: { gte: streakStartDate }
        },
        orderBy: { logDate: 'desc' }
    });

    // Helper to calculate streak from logs in memory
    const calculateStreakInMemory = (habitId: string, logs: any[]) => {
        const habitLogs = logs.filter(l => l.habitId === habitId);
        let streak = 0;
        const checkDate = new Date();
        checkDate.setUTCHours(0, 0, 0, 0);

        for (let i = 0; i < 60; i++) {
            const dateStr = checkDate.toISOString().split('T')[0];
            const log = habitLogs.find(l => new Date(l.logDate).toISOString().split('T')[0] === dateStr);

            if (log && log.completed) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else if (i > 0) {
                break;
            } else {
                checkDate.setDate(checkDate.getDate() - 1);
            }
        }
        return streak;
    };

    // Calculate streaks in memory without extra DB calls
    const habitsWithStreaks = habits.map(h => ({
        ...h,
        streak: calculateStreakInMemory(h.id, allLogs)
    }));

    // Stats calculation based on requested range (e.g. 7 days)
    const statsLogs = allLogs.filter(l => new Date(l.logDate) >= startDate);
    const totalPossible = habits.length * days;
    const completed = statsLogs.filter(l => l.completed).length;
    const completionRate = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;

    // Today's completion
    const todayStr = new Date().toISOString().split('T')[0];
    const completedToday = allLogs.filter(l => {
        const logDate = new Date(l.logDate).toISOString().split('T')[0];
        return logDate === todayStr && l.completed;
    }).length;

    return {
        habits: habitsWithStreaks,
        totalHabits: habits.length,
        completedToday,
        weeklyCompletionRate: completionRate
    };
}

// ==================== API USAGE OPERATIONS ====================

export async function getApiUsageTotals(userId: string) {
    const [total, last7Days] = await Promise.all([
        prisma.apiUsage.aggregate({
            where: { userId },
            _sum: { costCents: true },
            _count: true,
        }),
        prisma.apiUsage.aggregate({
            where: {
                userId,
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
            },
            _sum: { costCents: true },
            _count: true,
        }),
    ]);

    return {
        totalCostCents: total._sum.costCents || 0,
        totalRequests: total._count,
        last7DaysCostCents: last7Days._sum.costCents || 0,
        last7DaysRequests: last7Days._count,
    };
}

// ==================== COACH MEMORY OPERATIONS ====================

export async function getCoachMemory(userId: string, coachId: string) {
    const record = await prisma.coachMemory.findUnique({
        where: {
            userId_coachId: { userId, coachId },
        },
    });

    if (!record) return null;

    return {
        ...record,
        memories: JSON.parse(record.memories),
    };
}

export async function upsertCoachMemory(userId: string, coachId: string, memories: any[]) {
    return await prisma.coachMemory.upsert({
        where: {
            userId_coachId: { userId, coachId },
        },
        create: {
            userId,
            coachId,
            memories: JSON.stringify(memories),
        },
        update: {
            memories: JSON.stringify(memories),
        },
    });
}

export async function clearConversationMessages(conversationId: string) {
    return await prisma.conversation.update({
        where: { id: conversationId },
        data: {
            messages: JSON.stringify([]),
        },
    });
}

// ==================== CHALLENGE LOG OPERATIONS ====================

export async function getRecentChallengeLogs(userId: string, limit: number = 20) {
    const logs = await prisma.challengeLog.findMany({
        where: {
            userId,
        },
        orderBy: { completedAt: 'desc' },
        take: limit,
        include: {
            challenge: {
                select: {
                    title: true,
                    difficulty: true,
                    personalizationNotes: true,
                },
            },
        },
    });

    return logs;
}

// ==================== ACCOUNTABILITY PARTNER OPERATIONS ====================

export async function createPartnerInvite(userId: string, inviteCode: string) {
    // Create with partnerId = userId as a placeholder (self-referencing).
    // On accept, partnerId will be updated to the accepting user's ID.
    return await prisma.accountabilityPartner.create({
        data: {
            userId,
            partnerId: userId, // placeholder until accepted
            status: 'invited',
            inviteCode,
        },
    });
}

export async function getPartnerInviteByCode(inviteCode: string) {
    return await prisma.accountabilityPartner.findUnique({
        where: { inviteCode },
        include: {
            user: { select: { id: true, displayName: true, email: true } },
        },
    });
}

export async function acceptPartnerInvite(inviteId: string, partnerId: string) {
    return await prisma.accountabilityPartner.update({
        where: { id: inviteId },
        data: {
            partnerId,
            status: 'active',
            acceptedAt: new Date(),
        },
    });
}

export async function getPartnersByUserId(userId: string) {
    // Find all active partnerships in both directions
    const partnerships = await prisma.accountabilityPartner.findMany({
        where: {
            status: 'active',
            OR: [
                { userId },
                { partnerId: userId },
            ],
        },
        include: {
            user: { select: { id: true, displayName: true, email: true } },
            partner: { select: { id: true, displayName: true, email: true } },
        },
        orderBy: { acceptedAt: 'desc' },
    });

    // For each partnership, resolve the "other" user
    return partnerships.map(p => {
        const isInviter = p.userId === userId;
        const otherUser = isInviter ? p.partner : p.user;
        return {
            id: p.id,
            partnerUserId: otherUser.id,
            displayName: otherUser.displayName || otherUser.email,
            acceptedAt: p.acceptedAt,
        };
    });
}

export async function removePartnership(partnershipId: string, userId: string) {
    // Verify the user is part of this partnership before deleting
    const partnership = await prisma.accountabilityPartner.findFirst({
        where: {
            id: partnershipId,
            OR: [
                { userId },
                { partnerId: userId },
            ],
        },
    });

    if (!partnership) return null;

    return await prisma.accountabilityPartner.delete({
        where: { id: partnershipId },
    });
}

export async function getPartnerStats(userId: string) {
    // Current streak
    const streak = await calculateStreak(userId);

    // Challenges completed this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekChallenges = await prisma.challenge.count({
        where: {
            userId,
            status: 'completed',
            completedAt: { gte: weekStart },
        },
    });

    // Active goal titles
    const activeGoals = await prisma.goal.findMany({
        where: { userId, status: 'active' },
        select: { title: true },
    });

    // Habit completion rate this week
    const habits = await getHabitsByUserId(userId);
    const weekDays = Math.min(new Date().getDay() + 1, 7);
    const totalPossible = habits.length * weekDays;

    let habitRate = 0;
    if (totalPossible > 0) {
        const logs = await prisma.habitLog.findMany({
            where: {
                habit: { userId },
                logDate: { gte: weekStart },
                completed: true,
            },
        });
        habitRate = Math.round((logs.length / totalPossible) * 100);
    }

    return {
        streak,
        weekChallenges,
        activeGoals: activeGoals.map(g => g.title),
        habitRate,
    };
}

export async function isActivePartner(userId: string, targetUserId: string): Promise<boolean> {
    const partnership = await prisma.accountabilityPartner.findFirst({
        where: {
            status: 'active',
            OR: [
                { userId, partnerId: targetUserId },
                { userId: targetUserId, partnerId: userId },
            ],
        },
    });
    return !!partnership;
}

// ==================== PUSH SUBSCRIPTION OPERATIONS ====================

export async function savePushSubscription(
    userId: string,
    endpoint: string,
    p256dh: string,
    auth: string
) {
    return await prisma.pushSubscription.upsert({
        where: {
            userId_endpoint: { userId, endpoint },
        },
        create: {
            userId,
            endpoint,
            p256dh,
            auth,
        },
        update: {
            p256dh,
            auth,
        },
    });
}

export async function removePushSubscription(userId: string, endpoint: string) {
    return await prisma.pushSubscription.deleteMany({
        where: { userId, endpoint },
    });
}

export async function getPushSubscriptionsByUserId(userId: string) {
    return await prisma.pushSubscription.findMany({
        where: { userId },
    });
}

// ==================== MILESTONE OPERATIONS ====================

export async function getMilestonesByUserId(userId: string) {
    return await prisma.milestone.findMany({
        where: { userId },
        orderBy: { achievedAt: 'desc' },
    });
}

export async function getUncelebratedMilestones(userId: string) {
    return await prisma.milestone.findMany({
        where: { userId, celebrated: false },
        orderBy: { achievedAt: 'desc' },
    });
}

export async function createMilestone(data: {
    userId: string;
    goalId: string | null;
    type: string;
    title: string;
    description?: string;
}): Promise<any | null> {
    // Check if milestone already exists (manual check because PostgreSQL
    // treats NULL != NULL in unique constraints, so the @@unique constraint
    // does not prevent duplicate global milestones with goalId=null).
    const existing = await prisma.milestone.findFirst({
        where: {
            userId: data.userId,
            goalId: data.goalId,
            type: data.type,
        },
    });

    if (existing) return null;

    return await prisma.milestone.create({
        data: {
            userId: data.userId,
            goalId: data.goalId,
            type: data.type,
            title: data.title,
            description: data.description,
        },
    });
}

export async function markMilestoneCelebrated(milestoneId: string) {
    return await prisma.milestone.update({
        where: { id: milestoneId },
        data: { celebrated: true },
    });
}

// ==================== WEEKLY DIGEST OPERATIONS ====================

export async function getWeeklyDigest(userId: string, weekStartDate: Date) {
    return await prisma.weeklyDigest.findUnique({
        where: {
            userId_weekStartDate: { userId, weekStartDate },
        },
    });
}

export async function createWeeklyDigest(data: {
    userId: string;
    weekStartDate: Date;
    weekEndDate: Date;
    rawData: string;
    aiSummary: string;
    topAchievement?: string;
    focusArea?: string;
    suggestion?: string;
}) {
    return await prisma.weeklyDigest.create({
        data: {
            userId: data.userId,
            weekStartDate: data.weekStartDate,
            weekEndDate: data.weekEndDate,
            rawData: data.rawData,
            aiSummary: data.aiSummary,
            topAchievement: data.topAchievement,
            focusArea: data.focusArea,
            suggestion: data.suggestion,
        },
    });
}

export async function getWeeklyDigestData(userId: string, startDate: Date, endDate: Date) {
    const [
        challenges,
        surveys,
        diaryEntries,
        habits,
        activeGoals,
        streak,
        challengeLogs,
    ] = await Promise.all([
        prisma.challenge.findMany({
            where: {
                userId,
                scheduledDate: { gte: startDate, lt: endDate },
            },
            select: { status: true },
        }),
        prisma.dailySurvey.findMany({
            where: {
                userId,
                surveyDate: { gte: startDate, lt: endDate },
            },
            select: {
                overallMood: true,
                energyLevel: true,
                motivationLevel: true,
            },
        }),
        prisma.diaryEntry.findMany({
            where: {
                userId,
                createdAt: { gte: startDate, lt: endDate },
            },
            select: { keyThemes: true },
        }),
        prisma.habit.findMany({
            where: { userId, isActive: true },
            include: {
                logs: {
                    where: {
                        logDate: { gte: startDate, lt: endDate },
                    },
                },
            },
        }),
        prisma.goal.findMany({
            where: { userId, status: 'active' },
            select: { title: true },
        }),
        calculateStreak(userId),
        prisma.challengeLog.findMany({
            where: {
                userId,
                completedAt: { gte: startDate, lt: endDate },
            },
            select: { difficultyFelt: true, satisfaction: true },
        }),
    ]);

    const challengesCompleted = challenges.filter(c => c.status === 'completed').length;
    const challengesSkipped = challenges.filter(c => c.status === 'skipped').length;

    const avgMood = surveys.length > 0
        ? surveys.reduce((sum, s) => sum + s.overallMood, 0) / surveys.length
        : null;
    const avgEnergy = surveys.length > 0
        ? surveys.reduce((sum, s) => sum + s.energyLevel, 0) / surveys.length
        : null;
    const avgMotivation = surveys.length > 0
        ? surveys.reduce((sum, s) => sum + s.motivationLevel, 0) / surveys.length
        : null;

    let moodTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (surveys.length >= 4) {
        const mid = Math.floor(surveys.length / 2);
        const firstHalfAvg = surveys.slice(0, mid).reduce((s, v) => s + v.overallMood, 0) / mid;
        const secondHalfAvg = surveys.slice(mid).reduce((s, v) => s + v.overallMood, 0) / (surveys.length - mid);
        if (secondHalfAvg - firstHalfAvg > 0.5) moodTrend = 'improving';
        else if (firstHalfAvg - secondHalfAvg > 0.5) moodTrend = 'declining';
    }

    const allThemes: string[] = [];
    for (const entry of diaryEntries) {
        if (entry.keyThemes) {
            try {
                const parsed = JSON.parse(entry.keyThemes);
                if (Array.isArray(parsed)) allThemes.push(...parsed);
            } catch { /* ignore parse errors */ }
        }
    }
    const themeCounts: Record<string, number> = {};
    for (const theme of allThemes) {
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
    }
    const commonThemes = Object.entries(themeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([theme]) => theme);

    const completedLogs = habits.reduce(
        (sum, h) => sum + h.logs.filter(l => l.completed).length,
        0,
    );
    const daySpan = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalExpected = habits.length * daySpan;
    const habitCompletionRate = totalExpected > 0
        ? Math.round((completedLogs / totalExpected) * 100)
        : 0;

    let bestHabit: string | null = null;
    let worstHabit: string | null = null;
    if (habits.length > 0) {
        const habitRates = habits.map(h => ({
            name: h.name,
            rate: daySpan > 0 ? h.logs.filter(l => l.completed).length / daySpan : 0,
        }));
        habitRates.sort((a, b) => b.rate - a.rate);
        bestHabit = habitRates[0]?.name || null;
        worstHabit = habitRates[habitRates.length - 1]?.name || null;
        if (worstHabit === bestHabit) worstHabit = null;
    }

    const logsWithDifficulty = challengeLogs.filter(l => l.difficultyFelt !== null);
    const logsWithSatisfaction = challengeLogs.filter(l => l.satisfaction !== null);
    const avgDifficulty = logsWithDifficulty.length > 0
        ? logsWithDifficulty.reduce((sum, l) => sum + (l.difficultyFelt ?? 0), 0) / logsWithDifficulty.length
        : null;
    const avgSatisfaction = logsWithSatisfaction.length > 0
        ? logsWithSatisfaction.reduce((sum, l) => sum + (l.satisfaction ?? 0), 0) / logsWithSatisfaction.length
        : null;

    return {
        challengesCompleted,
        challengesSkipped,
        avgDifficulty: avgDifficulty !== null ? Math.round(avgDifficulty * 10) / 10 : null,
        avgSatisfaction: avgSatisfaction !== null ? Math.round(avgSatisfaction * 10) / 10 : null,
        avgMood: avgMood !== null ? Math.round(avgMood * 10) / 10 : null,
        avgEnergy: avgEnergy !== null ? Math.round(avgEnergy * 10) / 10 : null,
        avgMotivation: avgMotivation !== null ? Math.round(avgMotivation * 10) / 10 : null,
        moodTrend,
        diaryCount: diaryEntries.length,
        commonThemes,
        habitCompletionRate,
        bestHabit,
        worstHabit,
        activeGoalTitles: activeGoals.map(g => g.title),
        streak,
    };
}
