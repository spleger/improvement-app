import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';

// POST /api/challenges/[id]/complete
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { difficultyFelt, satisfaction, notes } = body;
        const challengeId = params.id;
        const userId = 'demo-user-001';

        // Get the challenge
        const challenge = await db.getChallengeById(challengeId);

        if (!challenge) {
            return NextResponse.json(
                { success: false, error: 'Challenge not found' },
                { status: 404 }
            );
        }

        if (challenge.userId !== userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        if (challenge.status === 'completed') {
            return NextResponse.json(
                { success: false, error: 'Challenge already completed' },
                { status: 400 }
            );
        }

        // Update challenge status
        const updatedChallenge = await db.completeChallenge(challengeId);

        // Create completion log
        const log = await db.createChallengeLog({
            challengeId,
            userId,
            difficultyFelt,
            satisfaction,
            notes
        });

        // Calculate new streak
        const streak = await db.calculateStreak(userId);

        return NextResponse.json({
            success: true,
            data: {
                challenge: updatedChallenge,
                log,
                streakCount: streak,
                streakUpdated: true
            }
        });
    } catch (error) {
        console.error('Error completing challenge:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
