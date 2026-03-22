import * as db from '@/lib/db';
import { getUserContext, buildEnhancedSystemPrompt } from '@/lib/ai/context';

const STANDARD_COACH_IDS = [
    'general', 'languages', 'mobility', 'emotional', 'relationships',
    'health', 'tolerance', 'skills', 'habits'
];

/**
 * Build the system prompt for an expert chat session, resolving custom coaches
 * and injecting coach memory. Returns both the prompt and the user context
 * (needed by the non-streaming route for fallback responses).
 */
export async function buildExpertSystemPrompt(
    userId: string,
    coachId?: string
): Promise<{ systemPrompt: string; context: any }> {
    const context = await getUserContext(userId);
    const targetCoachId = coachId || 'general';
    const coachMemory = await db.getCoachMemory(userId, targetCoachId);
    const memories = coachMemory?.memories || [];
    let systemPrompt = '';

    if (coachId && !STANDARD_COACH_IDS.includes(coachId)) {
        const coaches = await db.getCustomCoachesByUserId(userId);
        const customCoach = coaches.find((c: any) => c.id === coachId);

        if (customCoach) {
            const basePrompt = buildEnhancedSystemPrompt(context, 'general', undefined, memories);
            const promptPrefix = `You are ${customCoach.name}. ${customCoach.systemPrompt}\n\n`;
            systemPrompt = promptPrefix + basePrompt.replace(/^You are [^,]+,[\s\S]*?\n\n/, '');
        } else {
            systemPrompt = buildEnhancedSystemPrompt(context, coachId, undefined, memories);
        }
    } else {
        systemPrompt = buildEnhancedSystemPrompt(context, coachId, undefined, memories);
    }

    return { systemPrompt, context };
}

/**
 * Format chat history into the array shape Claude expects, keeping the last 6
 * history entries plus the current user message.
 */
export function buildMessageHistory(
    history: Array<{ role: string; content: string }> | undefined,
    currentMessage: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (history && Array.isArray(history)) {
        for (const msg of history.slice(-6)) {
            if (msg.content && typeof msg.content === 'string' && msg.content.trim().length > 0) {
                if (msg.role === 'user') {
                    messages.push({ role: 'user', content: msg.content.trim() });
                } else if (msg.role === 'assistant') {
                    messages.push({ role: 'assistant', content: msg.content.trim() });
                }
            }
        }
    }
    messages.push({ role: 'user', content: currentMessage.trim() });
    return messages;
}

/**
 * Get or create the expert conversation for a given coach. Returns the
 * conversation record and its current messages array.
 */
export async function getOrCreateExpertConversation(userId: string, coachId?: string) {
    const targetCoachId = coachId || 'general';
    let conversation = await db.getExpertConversation(userId, targetCoachId);
    let conversationMessages = conversation?.messages || [];

    if (!conversation) {
        conversation = await db.createConversation({
            userId,
            conversationType: 'expert_chat',
            title: `${targetCoachId.charAt(0).toUpperCase() + targetCoachId.slice(1)} Coaching`,
            initialMessages: [],
            context: { coachId: targetCoachId }
        });
        conversationMessages = [];
    }

    return { conversation, conversationMessages };
}
