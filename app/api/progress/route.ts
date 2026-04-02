import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/progress - Get progress page data
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all data in parallel - each call is resilient to individual failures
        const [challenges, surveys, activeGoal, allGoals, streak] = await Promise.all([
            db.getChallengesByUserId(user.userId, { limit: 30 }).catch(() => []),
            db.getSurveysByUserId(user.userId, 30).catch(() => []),
            db.getActiveGoalByUserId(user.userId).catch(() => null),
            db.getGoalsByUserId(user.userId).catch(() => []),
            db.calculateStreak(user.userId).catch(() => 0)
        ]);

        return NextResponse.json({
            success: true,
            data: {
                challenges,
                surveys,
                activeGoal,
                allGoals,
                streak
            }
        });
    } catch (error) {
        console.error('Progress error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
