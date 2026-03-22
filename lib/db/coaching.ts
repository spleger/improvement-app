import { prisma } from './client';

export async function createCustomCoach(data: {
    userId: string;
    name: string;
    icon?: string;
    color?: string;
    systemPrompt: string;
    isGoalCoach?: boolean;
    goalId?: string;
}) {
    return await prisma.customCoach.create({
        data: {
            userId: data.userId,
            name: data.name,
            icon: data.icon ?? '\uD83E\uDD16',
            color: data.color ?? '#8b5cf6',
            systemPrompt: data.systemPrompt,
            isGoalCoach: data.isGoalCoach ?? false,
            goalId: data.goalId,
        },
    });
}

export async function getCustomCoachesByUserId(userId: string) {
    return await prisma.customCoach.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
}

export async function deleteCustomCoach(id: string, userId: string) {
    // Check ownership
    const coach = await prisma.customCoach.findFirst({
        where: { id, userId },
    });
    if (!coach) return null;

    return await prisma.customCoach.delete({
        where: { id },
    });
}

export async function createConversation(data: {
    userId: string;
    conversationType: string;
    title?: string;
    goalId?: string;
    initialMessages?: any[];
    context?: any;
}) {
    return await prisma.conversation.create({
        data: {
            userId: data.userId,
            conversationType: data.conversationType,
            title: data.title,
            goalId: data.goalId,
            messages: JSON.stringify(data.initialMessages || []),
            context: JSON.stringify(data.context || {}),
        },
    });
}

export async function getConversationsByUserId(userId: string, limit: number = 10) {
    const convs = await prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: limit,
    });

    return convs.map(row => ({
        ...row,
        messages: row.messages ? JSON.parse(row.messages) : [],
        context: row.context ? JSON.parse(row.context) : null
    }));
}

export async function getLatestConversation(userId: string) {
    const row = await prisma.conversation.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
    });

    if (!row) return null;
    return {
        ...row,
        messages: row.messages ? JSON.parse(row.messages) : [],
        context: row.context ? JSON.parse(row.context) : null
    };
}

export async function getExpertConversation(userId: string, coachId: string) {
    // Fetch recent expert chats and filter in code
    const convs = await prisma.conversation.findMany({
        where: {
            userId,
            conversationType: 'expert_chat'
        },
        orderBy: { updatedAt: 'desc' },
        take: 20, // Check last 20 chats
    });

    const match = convs.find(c => {
        const ctx = c.context ? JSON.parse(c.context) : {};
        if (coachId === 'general') {
            return !ctx.coachId || ctx.coachId === 'general';
        }
        return ctx.coachId === coachId;
    });

    if (!match) return null;

    return {
        ...match,
        messages: match.messages ? JSON.parse(match.messages) : [],
        context: match.context ? JSON.parse(match.context) : null
    };
}

export async function updateConversationMessages(id: string, messages: any[]) {
    const updated = await prisma.conversation.update({
        where: { id },
        data: {
            messages: JSON.stringify(messages),
        },
    });
    return updated;
}

export async function getConversationByType(userId: string, conversationType: string) {
    // Get the most recent conversation of a specific type for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const conv = await prisma.conversation.findFirst({
        where: {
            userId,
            conversationType,
            createdAt: { gte: todayStart }
        },
        orderBy: { updatedAt: 'desc' },
    });

    if (!conv) return null;

    return {
        ...conv,
        messages: conv.messages ? JSON.parse(conv.messages) : [],
        context: conv.context ? JSON.parse(conv.context) : null
    };
}

export async function updateConversationContext(id: string, context: any) {
    const updated = await prisma.conversation.update({
        where: { id },
        data: {
            context: JSON.stringify(context),
        },
    });
    return updated;
}

export async function getCoachMemory(userId: string, coachId: string) {
    const record = await prisma.coachMemory.findUnique({
        where: {
            userId_coachId: { userId, coachId },
        },
    });

    if (!record) return null;

    return {
        ...record,
        memories: JSON.parse(record.memories),
    };
}

export async function upsertCoachMemory(userId: string, coachId: string, memories: any[]) {
    return await prisma.coachMemory.upsert({
        where: {
            userId_coachId: { userId, coachId },
        },
        create: {
            userId,
            coachId,
            memories: JSON.stringify(memories),
        },
        update: {
            memories: JSON.stringify(memories),
        },
    });
}

export async function clearConversationMessages(conversationId: string) {
    return await prisma.conversation.update({
        where: { id: conversationId },
        data: {
            messages: JSON.stringify([]),
        },
    });
}
