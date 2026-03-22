import { prisma } from './client';

export async function savePushSubscription(
    userId: string,
    endpoint: string,
    p256dh: string,
    auth: string
) {
    return await prisma.pushSubscription.upsert({
        where: {
            userId_endpoint: { userId, endpoint },
        },
        create: {
            userId,
            endpoint,
            p256dh,
            auth,
        },
        update: {
            p256dh,
            auth,
        },
    });
}

export async function removePushSubscription(userId: string, endpoint: string) {
    return await prisma.pushSubscription.deleteMany({
        where: { userId, endpoint },
    });
}

export async function getPushSubscriptionsByUserId(userId: string) {
    return await prisma.pushSubscription.findMany({
        where: { userId },
    });
}
