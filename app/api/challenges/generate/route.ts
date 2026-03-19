import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateMultipleChallenges } from '@/lib/ai';
import { UserPrefs } from '@/lib/types';
import { ChallengeGenerateSchema, validateBody } from '@/lib/validation';
import { logApiUsage } from '@/lib/ai/costs';
import { buildChallengeFeedbackContext } from '@/lib/ai/context';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const parsed = validateBody(ChallengeGenerateSchema, body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
        }
        const { goalId, count, focusArea } = parsed.data;

        // Clamp count to valid range
        const clampedCount = Math.min(Math.max(count ?? 1, 1), 5);

        let goal = null;
        if (goalId) {
            // 1. Fetch Goal and verify ownership
            const goals = await db.getGoalsByUserId(user.userId);
            goal = goals.find((g: any) => g.id === goalId);

            if (!goal) {
                return NextResponse.json({ success: false, error: 'Goal not found' }, { status: 404 });
            }
        }

        // 2. Fetch User Context (Preferences)
        const dbPrefs = await db.getUserPreferences(user.userId);
        const userPrefs: UserPrefs = {
            preferredDifficulty: dbPrefs?.preferredDifficulty ?? 5,
            focusAreas: dbPrefs?.focusAreas ?? [],
            avoidAreas: dbPrefs?.avoidAreas ?? [],
            realityShiftEnabled: dbPrefs?.realityShiftEnabled ?? false,
            aiPersonality: (dbPrefs?.aiPersonality as UserPrefs['aiPersonality']) || 'empathetic',
        };

        // 3. Fetch Recent History + Challenge Feedback
        const recentChallenges = await db.getRecentCompletedChallenges(user.userId, 5);
        const challengeLogs = await db.getRecentChallengeLogs(user.userId, 20);
        const feedbackContext = buildChallengeFeedbackContext(challengeLogs);

        // 4. Generate Multiple Challenges via AI (with feedback context)
        const challengeDataList = await generateMultipleChallenges(
            clampedCount,
            userPrefs,
            goal ? (goal as any) : null,
            recentChallenges as any,
            focusArea?.trim() || undefined,
            feedbackContext
        );

        // Log OpenAI usage for challenge generation
        const usage = (challengeDataList as any).__usage;
        if (usage) {
            logApiUsage({
                userId: user.userId,
                route: 'challenges/generate',
                provider: 'openai',
                model: 'gpt-4o',
                inputTokens: usage.prompt_tokens,
                outputTokens: usage.completion_tokens,
            });
        }

        // 5. Save all challenges to DB
        const now = new Date();
        const createdChallenges = [];

        for (let i = 0; i < challengeDataList.length; i++) {
            const challengeData = challengeDataList[i];

            // Schedule all generated challenges for today
            const scheduledDate = new Date(now);

            const newChallenge = await db.createChallenge({
                goalId: goal ? goal.id : undefined,
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
                    day: goal ? Math.floor((Date.now() - new Date(goal.startedAt).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1,
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

