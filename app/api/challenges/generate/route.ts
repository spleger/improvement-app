
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateMultipleChallenges } from '@/lib/ai';
import { UserPrefs } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { goalId, count = 1, focusArea } = body;

        if (!goalId) {
            return NextResponse.json({ success: false, error: 'Goal ID is required' }, { status: 400 });
        }

        // Clamp count to valid range
        const clampedCount = Math.min(Math.max(Number(count) || 1, 1), 5);

        // 1. Fetch Goal and verify ownership
        const goals = await db.getGoalsByUserId(user.userId);
        const goal = goals.find((g: any) => g.id === goalId);

        if (!goal) {
            return NextResponse.json({ success: false, error: 'Goal not found' }, { status: 404 });
        }

        // 2. Fetch User Context (Preferences)
        let userPrefs: UserPrefs = {
            preferredDifficulty: 5,
            focusAreas: [],
            avoidAreas: [],
            realityShiftEnabled: false,
            aiPersonality: 'empathetic'
        };

        // 3. Fetch Recent History
        const recentChallenges = await db.getRecentCompletedChallenges(user.userId, 5);

        // 4. Generate Multiple Challenges via AI
        const challengeDataList = await generateMultipleChallenges(
            clampedCount,
            userPrefs,
            goal as any,
            recentChallenges as any,
            focusArea?.trim() || undefined
        );

        // 5. Save all challenges to DB
        const now = new Date();
        const createdChallenges = [];

        for (let i = 0; i < challengeDataList.length; i++) {
            const challengeData = challengeDataList[i];

            // Schedule challenges on consecutive days
            const scheduledDate = new Date(now);
            scheduledDate.setDate(scheduledDate.getDate() + 1 + i);

            const newChallenge = await db.createChallenge({
                goalId: goal.id,
                userId: user.userId,
                title: challengeData.title || `Challenge ${i + 1}`,
                description: challengeData.description || 'No description provided',
                instructions: challengeData.instructions || undefined,
                successCriteria: challengeData.successCriteria || undefined,
                personalizationNotes: challengeData.personalizationNotes || undefined,
                tips: challengeData.tips ? JSON.parse(challengeData.tips) : undefined,
                difficulty: challengeData.difficulty || 5,
                isRealityShift: challengeData.isRealityShift || false,
                scheduledDate: scheduledDate
            });

            createdChallenges.push(newChallenge);
        }

        // 6. Invalidate dashboard cache so new challenges appear immediately
        revalidatePath('/');

        return NextResponse.json({
            success: true,
            data: {
                challenges: createdChallenges,
                context: {
                    day: Math.floor((Date.now() - new Date(goal.startedAt).getTime()) / (1000 * 60 * 60 * 24)) + 1,
                    adaptedDifficulty: challengeDataList[0]?.difficulty || 5,
                    totalGenerated: createdChallenges.length
                }
            }
        });

    } catch (error: any) {
        console.error('Error generating challenges:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}

