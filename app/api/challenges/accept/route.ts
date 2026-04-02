import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { validateBody, ChallengeAcceptSchema } from '@/lib/validation';
import * as db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const parsed = validateBody(ChallengeAcceptSchema, body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
        }

        const { title, description, difficulty, isRealityShift, goalId } = parsed.data;

        const challenge = await db.createChallenge({
            userId: user.userId,
            goalId: goalId || undefined,
            title,
            description: description || `Challenge: ${title}`,
            difficulty,
            isRealityShift: isRealityShift ?? false,
            scheduledDate: new Date(),
        });

        return NextResponse.json({ success: true, data: { challenge } });
    } catch (error) {
        console.error('Error accepting challenge:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
