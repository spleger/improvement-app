import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { removePushSubscription } from '@/lib/db';
import { z } from 'zod';
import { validateBody } from '@/lib/validation';

const PushUnsubscribeSchema = z.object({
    endpoint: z.string().url().max(2000),
});

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const parsed = validateBody(PushUnsubscribeSchema, body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
        }

        await removePushSubscription(user.userId, parsed.data.endpoint);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error unsubscribing from push:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
