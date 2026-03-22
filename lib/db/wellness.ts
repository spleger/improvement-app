import { prisma, Prisma } from './client';
import { calculateStreak } from './challenges';

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
            icon: data.icon ?? '\u2705',
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
