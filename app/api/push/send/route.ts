import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPushSubscriptionsByUserId, removePushSubscription } from '@/lib/db';
import { sendPushNotification } from '@/lib/push';
import { z } from 'zod';
import { validateBody } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const PushSendSchema = z.object({
    userId: z.string().min(1).max(200),
    title: z.string().min(1).max(200),
    body: z.string().min(1).max(1000),
    url: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const reqBody = await request.json();
        const parsed = validateBody(PushSendSchema, reqBody);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
        }

        const { userId, title, body, url } = parsed.data;
        const subscriptions = await getPushSubscriptionsByUserId(userId);

        let sent = 0;
        for (const sub of subscriptions) {
            try {
                await sendPushNotification(
                    { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
                    { title, body, url }
                );
                sent++;
            } catch (error: any) {
                // 410 Gone means the subscription has expired or been unsubscribed
                if (error?.statusCode === 410 || error?.statusCode === 404) {
                    await removePushSubscription(userId, sub.endpoint);
                } else {
                    console.error('Error sending push to subscription:', sub.endpoint, error);
                }
            }
        }

        return NextResponse.json({ success: true, sent });
    } catch (error) {
        console.error('Error sending push notifications:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
