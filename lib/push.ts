import * as webpush from 'web-push';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:noreply@transform.app';

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

export function getVapidPublicKey(): string {
    return vapidPublicKey;
}

export interface PushPayload {
    title: string;
    body: string;
    url?: string;
    type?: string;
}

export async function sendPushNotification(
    subscription: { endpoint: string; p256dh: string; auth: string },
    payload: PushPayload
): Promise<void> {
    const pushSubscription: webpush.PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
        },
    };

    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
}
