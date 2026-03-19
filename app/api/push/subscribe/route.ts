import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { savePushSubscription } from '@/lib/db';
import { z } from 'zod';
import { validateBody } from '@/lib/validation';

const PushSubscribeSchema = z.object({
    endpoint: z.string().url().max(2000),
    keys: z.object({
        p256dh: z.string().min(1).max(500),
        auth: z.string().min(1).max(500),
    }),
});

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const parsed = validateBody(PushSubscribeSchema, body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
        }

        const { endpoint, keys } = parsed.data;
        await savePushSubscription(user.userId, endpoint, keys.p256dh, keys.auth);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error subscribing to push:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
