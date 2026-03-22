import { prisma } from './client';
import { calculateStreak } from './challenges';
import { getHabitsByUserId } from './wellness';

export async function createPartnerInvite(userId: string, inviteCode: string) {
    // Create with partnerId = userId as a placeholder (self-referencing).
    // On accept, partnerId will be updated to the accepting user's ID.
    return await prisma.accountabilityPartner.create({
        data: {
            userId,
            partnerId: userId, // placeholder until accepted
            status: 'invited',
            inviteCode,
        },
    });
}

export async function getPartnerInviteByCode(inviteCode: string) {
    return await prisma.accountabilityPartner.findUnique({
        where: { inviteCode },
        include: {
            user: { select: { id: true, displayName: true, email: true } },
        },
    });
}

export async function acceptPartnerInvite(inviteId: string, partnerId: string) {
    return await prisma.accountabilityPartner.update({
        where: { id: inviteId },
        data: {
            partnerId,
            status: 'active',
            acceptedAt: new Date(),
        },
    });
}

export async function getPartnersByUserId(userId: string) {
    // Find all active partnerships in both directions
    const partnerships = await prisma.accountabilityPartner.findMany({
        where: {
            status: 'active',
            OR: [
                { userId },
                { partnerId: userId },
            ],
        },
        include: {
            user: { select: { id: true, displayName: true, email: true } },
            partner: { select: { id: true, displayName: true, email: true } },
        },
        orderBy: { acceptedAt: 'desc' },
    });

    // For each partnership, resolve the "other" user
    return partnerships.map(p => {
        const isInviter = p.userId === userId;
        const otherUser = isInviter ? p.partner : p.user;
        return {
            id: p.id,
            partnerUserId: otherUser.id,
            displayName: otherUser.displayName || otherUser.email,
            acceptedAt: p.acceptedAt,
        };
    });
}

export async function removePartnership(partnershipId: string, userId: string) {
    // Verify the user is part of this partnership before deleting
    const partnership = await prisma.accountabilityPartner.findFirst({
        where: {
            id: partnershipId,
            OR: [
                { userId },
                { partnerId: userId },
            ],
        },
    });

    if (!partnership) return null;

    return await prisma.accountabilityPartner.delete({
        where: { id: partnershipId },
    });
}

export async function getPartnerStats(userId: string) {
    // Current streak
    const streak = await calculateStreak(userId);

    // Challenges completed this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekChallenges = await prisma.challenge.count({
        where: {
            userId,
            status: 'completed',
            completedAt: { gte: weekStart },
        },
    });

    // Active goal titles
    const activeGoals = await prisma.goal.findMany({
        where: { userId, status: 'active' },
        select: { title: true },
    });

    // Habit completion rate this week
    const habits = await getHabitsByUserId(userId);
    const weekDays = Math.min(new Date().getDay() + 1, 7);
    const totalPossible = habits.length * weekDays;

    let habitRate = 0;
    if (totalPossible > 0) {
        const logs = await prisma.habitLog.findMany({
            where: {
                habit: { userId },
                logDate: { gte: weekStart },
                completed: true,
            },
        });
        habitRate = Math.round((logs.length / totalPossible) * 100);
    }

    return {
        streak,
        weekChallenges,
        activeGoals: activeGoals.map(g => g.title),
        habitRate,
    };
}

export async function isActivePartner(userId: string, targetUserId: string): Promise<boolean> {
    const partnership = await prisma.accountabilityPartner.findFirst({
        where: {
            status: 'active',
            OR: [
                { userId, partnerId: targetUserId },
                { userId: targetUserId, partnerId: userId },
            ],
        },
    });
    return !!partnership;
}
