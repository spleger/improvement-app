import { prisma } from './client';

export async function getAllGoalDomains() {
    const domains = await prisma.goalDomain.findMany({
        orderBy: { id: 'asc' },
    });
    return domains.map(d => ({
        ...d,
        examples: d.examples ? JSON.parse(d.examples) : [],
    }));
}

export async function getGoalDomainById(id: number) {
    return await prisma.goalDomain.findUnique({ where: { id } });
}

export async function getGoalDomainByName(name: string) {
    return await prisma.goalDomain.findFirst({ where: { name } });
}

export async function getGoalsByUserId(userId: string) {
    const goals = await prisma.goal.findMany({
        where: { userId },
        include: { domain: true },
        orderBy: { createdAt: 'desc' },
    });

    // Map fit the expected return shape (domain propertiess merged or nested?)
    // The previous SQL returned: g.*, domainName, domainIcon, domainColor
    // And mapped it to: ...g, domain: { id, name, icon, color }
    // Prisma returns nested domain object, so we match that structure.
    return goals.map(g => ({
        ...g,
        domain: g.domain ? {
            id: g.domain.id,
            name: g.domain.name,
            icon: g.domain.icon,
            color: g.domain.color
        } : null
    }));
}

export async function getActiveGoalByUserId(userId: string) {
    const goal = await prisma.goal.findFirst({
        where: { userId, status: 'active' },
        include: { domain: true },
        orderBy: { createdAt: 'desc' },
    });

    if (!goal) return null;

    return {
        ...goal,
        domain: goal.domain ? {
            id: goal.domain.id,
            name: goal.domain.name,
            icon: goal.domain.icon,
            color: goal.domain.color
        } : null
    };
}

export async function createGoal(data: {
    userId: string;
    domainId: number;
    title: string;
    description?: string;
    currentState?: string;
    desiredState?: string;
    difficultyLevel?: number;
    realityShiftEnabled?: boolean;
}) {
    return await prisma.goal.create({
        data: {
            userId: data.userId,
            domainId: data.domainId,
            title: data.title,
            description: data.description,
            currentState: data.currentState,
            desiredState: data.desiredState,
            difficultyLevel: data.difficultyLevel ?? 5,
            realityShiftEnabled: data.realityShiftEnabled ?? false,
            status: 'active',
        },
    });
}

export async function getGoalById(id: string) {
    const goal = await prisma.goal.findUnique({
        where: { id },
        include: { domain: true },
    });

    if (!goal) return null;

    return {
        ...goal,
        domain: goal.domain ? {
            id: goal.domain.id,
            name: goal.domain.name,
            icon: goal.domain.icon,
            color: goal.domain.color
        } : null
    };
}

export async function updateGoalStatus(id: string, status: string) {
    return await prisma.goal.update({
        where: { id },
        data: { status },
    });
}

export async function deleteGoal(id: string) {
    // Challenge has onDelete: Cascade (auto-deleted by Prisma).
    // DiaryEntry and Conversation have onDelete: SetNull.
    // We explicitly delete related records for a clean removal,
    // wrapped in a transaction to prevent partial state on failure.
    return await prisma.$transaction(async (tx) => {
        await tx.challenge.deleteMany({ where: { goalId: id } });
        await tx.conversation.deleteMany({ where: { goalId: id } });
        await tx.diaryEntry.deleteMany({ where: { goalId: id } });
        return await tx.goal.delete({ where: { id } });
    });
}
