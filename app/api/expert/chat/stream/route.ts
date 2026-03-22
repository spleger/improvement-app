import { NextRequest } from 'next/server';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getAnthropicClient, ANTHROPIC_MODEL } from '@/lib/anthropic';
import { logApiUsage } from '@/lib/ai/costs';
import { ChatMessageSchema, validateBody } from '@/lib/validation';
import { buildExpertSystemPrompt, buildMessageHistory, getOrCreateExpertConversation } from '@/lib/api/expertChatSetup';

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

        let { systemPrompt } = await buildExpertSystemPrompt(user.userId, coachId);
        const messages = buildMessageHistory(history, message);

        // In live voice mode, constrain responses to be short and conversational
        const isLiveMode = message.trim().startsWith('[LIVE VOICE MODE');

        // In live voice mode, constrain responses to be short and conversational
        if (isLiveMode) {
            systemPrompt += '\n\nCRITICAL: You are in live voice conversation mode. Your responses will be spoken aloud via text-to-speech. Keep responses to 2-3 sentences maximum. Be brief and conversational. Never use lists, bullet points, markdown formatting, or special characters. Respond naturally as if speaking face-to-face.';
        }

        // Create streaming response
        const anthropic = getAnthropicClient();
        const encoder = new TextEncoder();
        let fullResponse = '';

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const streamResponse = await anthropic.messages.stream({
                        model: ANTHROPIC_MODEL,
                        max_tokens: isLiveMode ? 300 : 1000,
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

                    // Log API usage
                    const finalMessage = await streamResponse.finalMessage();
                    if (finalMessage?.usage) {
                        logApiUsage({
                            userId: user.userId,
                            route: 'expert/chat/stream',
                            provider: 'anthropic',
                            model: ANTHROPIC_MODEL,
                            inputTokens: finalMessage.usage.input_tokens,
                            outputTokens: finalMessage.usage.output_tokens,
                        });
                    }

                    // Send done signal
                    controller.enqueue(encoder.encode(`data: [DONE]\n\n`));

                    // Save conversation to database after streaming completes
                    try {
                        const { conversation, conversationMessages } = await getOrCreateExpertConversation(user.userId, coachId);
                        // Strip internal LIVE VOICE MODE prefix before persisting
                        const cleanMessage = message.replace(/^\[LIVE VOICE MODE[^\]]*\]\s*/, '');
                        conversationMessages.push({ role: 'user', content: cleanMessage, timestamp: new Date().toISOString() });
                        conversationMessages.push({ role: 'assistant', content: fullResponse, timestamp: new Date().toISOString() });
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
