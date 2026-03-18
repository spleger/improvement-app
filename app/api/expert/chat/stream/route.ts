import { NextRequest } from 'next/server';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getUserContext, buildEnhancedSystemPrompt } from '@/lib/ai/context';
import { getAnthropicClient } from '@/lib/anthropic';
import { ChatMessageSchema, validateBody } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const body = await request.json();
        const parsed = validateBody(ChatMessageSchema, body);
        if (!parsed.success) {
            return new Response(JSON.stringify({ success: false, error: parsed.error }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        const { message, history, coachId } = parsed.data;

        // Get user context (now includes ALL active goals)
        const context = await getUserContext(user.userId);
        let systemPrompt = '';

        // Check if using a custom coach
        const standardCoachIds = ['general', 'languages', 'mobility', 'emotional', 'relationships', 'health', 'tolerance', 'skills', 'habits'];

        if (coachId && !standardCoachIds.includes(coachId)) {
            const coaches = await db.getCustomCoachesByUserId(user.userId);
            const customCoach = coaches.find((c: any) => c.id === coachId);

            if (customCoach) {
                const basePrompt = buildEnhancedSystemPrompt(context, 'general');
                const promptPrefix = `You are ${customCoach.name}. ${customCoach.systemPrompt}\n\n`;
                systemPrompt = promptPrefix + basePrompt.replace(/^You are [^,]+,[\s\S]*?\n\n/, '');
            } else {
                systemPrompt = buildEnhancedSystemPrompt(context, coachId);
            }
        } else {
            systemPrompt = buildEnhancedSystemPrompt(context, coachId);
        }

        // Build conversation history for Claude
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

        // Add current message
        const isLiveMode = message.trim().startsWith('[LIVE VOICE MODE');
        messages.push({ role: 'user', content: message.trim() });

        // In live voice mode, constrain responses to be short and conversational
        if (isLiveMode) {
            systemPrompt += '\n\nCRITICAL: You are in live voice conversation mode. Your responses will be spoken aloud via text-to-speech. Aim for around 5 sentences. You can go up to 10 sentences if the topic genuinely requires depth, but prefer the lower end. Never use lists, bullet points, markdown formatting, or special characters. Respond naturally as if speaking face-to-face.';
        }

        // Create streaming response
        const anthropic = getAnthropicClient();
        const encoder = new TextEncoder();
        let fullResponse = '';

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const streamResponse = await anthropic.messages.stream({
                        model: 'claude-3-haiku-20240307',
                        max_tokens: isLiveMode ? 800 : 1000,
                        system: systemPrompt,
                        messages: messages
                    });

                    for await (const event of streamResponse) {
                        if (event.type === 'content_block_delta') {
                            const delta = event.delta;
                            if ('text' in delta) {
                                fullResponse += delta.text;
                                const data = JSON.stringify({ text: delta.text });
                                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                            }
                        }
                    }

                    // Send done signal
                    controller.enqueue(encoder.encode(`data: [DONE]\n\n`));

                    // Save conversation to database after streaming completes
                    try {
                        const targetCoachId = coachId || 'general';
                        let conversation = await db.getExpertConversation(user.userId, targetCoachId);
                        let conversationMessages = conversation?.messages || [];

                        if (!conversation) {
                            conversation = await db.createConversation({
                                userId: user.userId,
                                conversationType: 'expert_chat',
                                title: `${targetCoachId.charAt(0).toUpperCase() + targetCoachId.slice(1)} Coaching`,
                                initialMessages: [],
                                context: { coachId: targetCoachId }
                            });
                            conversationMessages = [];
                        }

                        // Append user message
                        conversationMessages.push({
                            role: 'user',
                            content: message,
                            timestamp: new Date().toISOString()
                        });

                        // Append assistant message
                        conversationMessages.push({
                            role: 'assistant',
                            content: fullResponse,
                            timestamp: new Date().toISOString()
                        });

                        if (conversation && conversation.id) {
                            await db.updateConversationMessages(conversation.id, conversationMessages);
                        }
                    } catch (dbError) {
                        console.error('Error saving conversation:', dbError);
                    }

                    controller.close();
                } catch (error) {
                    console.error('Streaming error:', error);
                    const errorData = JSON.stringify({ error: 'Stream error occurred' });
                    controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        });

    } catch (error) {
        console.error('Error in expert chat stream:', error);
        return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
