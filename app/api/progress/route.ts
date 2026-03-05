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

        // Fetch all data in parallel for performance
        const [challenges, surveys, activeGoal, allGoals, streak] = await Promise.all([
            db.getChallengesByUserId(user.userId, { limit: 30 }),
            db.getSurveysByUserId(user.userId, 30),
            db.getActiveGoalByUserId(user.userId),
            db.getGoalsByUserId(user.userId),
            db.calculateStreak(user.userId)
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
        // Log error for debugging
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: `Internal server error: ${errorMessage}` },
            { status: 500 }
        );
    }
}
