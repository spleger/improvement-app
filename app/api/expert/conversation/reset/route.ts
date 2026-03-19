import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getAnthropicClient, ANTHROPIC_MODEL } from '@/lib/anthropic';
import { logApiUsage } from '@/lib/ai/costs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { coachId } = body;

        if (!coachId) {
            return NextResponse.json({ success: false, error: 'coachId is required' }, { status: 400 });
        }

        // Find the conversation for this coach
        const conversation = await db.getExpertConversation(user.userId, coachId);

        if (!conversation || !conversation.messages || conversation.messages.length === 0) {
            return NextResponse.json({
                success: true,
                data: { message: 'No conversation to reset', memoriesExtracted: 0 },
            });
        }

        // Extract memories from the conversation using AI
        const messages = conversation.messages;
        const conversationText = messages
            .map((m: any) => `${m.role}: ${m.content}`)
            .join('\n\n');

        let newMemories: any[] = [];

        try {
            const anthropic = getAnthropicClient();
            const response = await anthropic.messages.create({
                model: ANTHROPIC_MODEL,
                max_tokens: 500,
                system: `You are a memory extraction assistant. Analyze the conversation and extract key insights about the user that should be remembered for future coaching sessions.

Extract 3-5 concise memories. Each memory should be a JSON object with:
- type: one of "insight", "preference", "progress", "concern", "pattern"
- content: 1-2 sentence summary of the key point

Return ONLY a JSON array. No markdown, no explanation.

Example:
[{"type": "insight", "content": "User responds well to Socratic questioning about motivation."}, {"type": "progress", "content": "User completed 3 consecutive weeks of morning meditation."}]`,
                messages: [
                    {
                        role: 'user',
                        content: `Extract memories from this coaching conversation:\n\n${conversationText.slice(0, 4000)}`,
                    },
                ],
            });

            // Log usage
            if (response.usage) {
                logApiUsage({
                    userId: user.userId,
                    route: 'expert/conversation/reset',
                    provider: 'anthropic',
                    model: ANTHROPIC_MODEL,
                    inputTokens: response.usage.input_tokens,
                    outputTokens: response.usage.output_tokens,
                });
            }

            const textContent = response.content.find(b => b.type === 'text');
            if (textContent?.type === 'text') {
                const cleaned = textContent.text.replace(/```json\n?|\n?```/g, '').trim();
                const startIdx = cleaned.indexOf('[');
                const endIdx = cleaned.lastIndexOf(']');
                if (startIdx !== -1 && endIdx !== -1) {
                    const parsed = JSON.parse(cleaned.substring(startIdx, endIdx + 1));
                    if (Array.isArray(parsed)) {
                        newMemories = parsed.map((m: any) => ({
                            ...m,
                            timestamp: new Date().toISOString(),
                            source: 'conversation_reset',
                        }));
                    }
                }
            }
        } catch (aiError) {
            console.error('Failed to extract memories:', aiError);
            // Continue with reset even if memory extraction fails
        }

        // Merge new memories with existing ones
        if (newMemories.length > 0) {
            const existing = await db.getCoachMemory(user.userId, coachId);
            const existingMemories = existing?.memories || [];
            // Keep last 20 memories max to avoid context bloat
            const merged = [...existingMemories, ...newMemories].slice(-20);
            await db.upsertCoachMemory(user.userId, coachId, merged);
        }

        // Clear conversation messages
        await db.clearConversationMessages(conversation.id);

        return NextResponse.json({
            success: true,
            data: {
                message: 'Conversation reset successfully',
                memoriesExtracted: newMemories.length,
            },
        });
    } catch (error) {
        console.error('Error resetting conversation:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
