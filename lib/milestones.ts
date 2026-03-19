import * as db from '@/lib/db';

interface MilestoneCheck {
    type: string;
    title: string;
    description: string;
    goalId?: string;
}

export async function checkAndCreateMilestones(userId: string): Promise<any[]> {
    const [goals, challenges, streak] = await Promise.all([
        db.getGoalsByUserId(userId),
        db.getChallengesByUserId(userId, { limit: 100 }),
        db.calculateStreak(userId),
    ]);

    const newMilestones: MilestoneCheck[] = [];
    const completedChallenges = challenges.filter((c: any) => c.status === 'completed');

    // Global streak milestones
    const streakMilestones = [
        { days: 3, type: 'streak_3', title: '3-Day Streak', description: 'Completed challenges 3 days in a row' },
        { days: 7, type: 'streak_7', title: 'Week Warrior', description: 'Completed challenges 7 days in a row' },
        { days: 14, type: 'streak_14', title: 'Two-Week Titan', description: '14 consecutive days of challenges' },
        { days: 21, type: 'streak_21', title: 'Habit Former', description: '21 days -- a new habit is born' },
        { days: 30, type: 'streak_30', title: 'Monthly Master', description: '30-day streak achieved' },
    ];

    for (const sm of streakMilestones) {
        if (streak >= sm.days) {
            newMilestones.push({ type: sm.type, title: sm.title, description: sm.description });
        }
    }

    // Total challenges milestones
    const challengeMilestones = [
        { count: 5, type: 'challenges_5', title: 'Getting Started', description: 'Completed 5 challenges' },
        { count: 10, type: 'challenges_10', title: 'Double Digits', description: 'Completed 10 challenges' },
        { count: 25, type: 'challenges_25', title: 'Quarter Century', description: 'Completed 25 challenges' },
        { count: 50, type: 'challenges_50', title: 'Half Century', description: 'Completed 50 challenges' },
        { count: 100, type: 'challenges_100', title: 'Century Club', description: 'Completed 100 challenges' },
    ];

    for (const cm of challengeMilestones) {
        if (completedChallenges.length >= cm.count) {
            newMilestones.push({ type: cm.type, title: cm.title, description: cm.description });
        }
    }

    // Per-goal day milestones
    for (const goal of goals) {
        if (goal.status !== 'active') continue;
        const daysSince = Math.ceil(
            (Date.now() - new Date(goal.startedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        const goalDayMilestones = [
            { days: 7, type: 'day_7', title: 'One Week In', description: `7 days working on "${goal.title}"` },
            { days: 14, type: 'day_14', title: 'Two Weeks Strong', description: `14 days working on "${goal.title}"` },
            { days: 21, type: 'day_21', title: 'Three Weeks Deep', description: `21 days working on "${goal.title}"` },
            { days: 30, type: 'day_30', title: 'Goal Mastered', description: `30 days of "${goal.title}" -- transformation complete` },
        ];
        for (const dm of goalDayMilestones) {
            if (daysSince >= dm.days) {
                newMilestones.push({
                    type: dm.type,
                    title: dm.title,
                    description: dm.description,
                    goalId: goal.id,
                });
            }
        }
    }

    // Create milestones that don't exist yet
    const created = [];
    for (const m of newMilestones) {
        try {
            const milestone = await db.createMilestone({
                userId,
                goalId: m.goalId || null,
                type: m.type,
                title: m.title,
                description: m.description,
            });
            if (milestone) created.push(milestone);
        } catch {
            // Unique constraint violation = already exists, skip
        }
    }

    return created;
}
