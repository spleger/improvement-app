import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { checkAndCreateMilestones } from '@/lib/milestones';
import { z } from 'zod';
import { validateBody } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const CelebrateSchema = z.object({
    milestoneId: z.string().min(1),
});

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Detect and create any new milestones
        const newlyCreated = await checkAndCreateMilestones(user.userId);

        // Fetch all milestones and uncelebrated ones
        const [milestones, uncelebrated] = await Promise.all([
            db.getMilestonesByUserId(user.userId),
            db.getUncelebratedMilestones(user.userId),
        ]);

        return NextResponse.json({
            milestones,
            uncelebrated,
            newlyCreated,
        });
    } catch (error) {
        console.error('Error fetching milestones:', error);
        return NextResponse.json(
            { error: 'Failed to fetch milestones' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const parsed = validateBody(CelebrateSchema, body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: parsed.error },
                { status: 400 }
            );
        }

        const milestone = await db.markMilestoneCelebrated(parsed.data.milestoneId);

        return NextResponse.json({ success: true, milestone });
    } catch (error) {
        console.error('Error celebrating milestone:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to celebrate milestone' },
            { status: 500 }
        );
    }
}
