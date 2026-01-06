import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
    request: NextRequest,
    params: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { id } = await params.params;

        await db.updateChallengeStatus(id, 'completed');

        // Return updated stats
        const streak = await db.calculateStreak(user.userId);
        const count = await db.getCompletedChallengesCount(user.userId);

        return NextResponse.json({
            success: true,
            data: { streak, completedCount: count }
        });
    } catch (error) {
        console.error('Error completing challenge:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
