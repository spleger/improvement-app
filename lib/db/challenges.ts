import { prisma, Prisma } from './client';

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
