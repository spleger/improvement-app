import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ANTHROPIC_MODEL } from '@/lib/anthropic';
import { buildExpertSystemPrompt, buildMessageHistory, getOrCreateExpertConversation } from '@/lib/api/expertChatSetup';

const ANTHROPIC_API_KEY_RAW = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_KEY = ANTHROPIC_API_KEY_RAW?.replace(/^["']|["']$/g, '').trim();

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const apiKey = ANTHROPIC_API_KEY;

        const body = await request.json();
        const { message, history, coachId } = body;

        if (!message) {
            return NextResponse.json(
                { success: false, error: 'Message is required' },
                { status: 400 }
            );
        }

        // Use shared context builder (fetches ALL active goals, coach memory, etc.)
        const { systemPrompt, context } = await buildExpertSystemPrompt(user.userId, coachId);
        const messages = buildMessageHistory(history, message);

        try {
            const { conversation, conversationMessages } = await getOrCreateExpertConversation(user.userId, coachId);

            // Append user message
            conversationMessages.push({
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            });

            // Call Claude API
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey || '',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: ANTHROPIC_MODEL,
                    max_tokens: 1000,
                    system: systemPrompt,
                    messages
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Claude API error [Expert Chat]:', response.status, errorText);
                throw new Error(`Claude API error: ${response.status}`);
            }

            const data = await response.json();
            const reply = data.content[0]?.text || getFallbackResponse(message, context);

            // Append assistant message
            conversationMessages.push({
                role: 'assistant',
                content: reply,
                timestamp: new Date().toISOString()
            });

            // Save updated conversation to DB
            if (conversation && conversation.id) {
                await db.updateConversationMessages(conversation.id, conversationMessages);
            }

            return NextResponse.json({
                success: true,
                data: { reply }
            });

        } catch (apiError) {
            console.error('Claude API call failed:', apiError);
            const reply = getFallbackResponse(message, context);

            const { conversation, conversationMessages } = await getOrCreateExpertConversation(user.userId, coachId);

            conversationMessages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
            conversationMessages.push({ role: 'assistant', content: reply, timestamp: new Date().toISOString() });

            if (conversation && conversation.id) {
                await db.updateConversationMessages(conversation.id, conversationMessages);
            }

            return NextResponse.json({
                success: true,
                data: { reply }
            });
        }

    } catch (error) {
        console.error('Error in expert chat:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET /api/expert/chat - Get chat history
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const coachId = request.nextUrl.searchParams.get('coachId') || 'general';
        const conversation = await db.getExpertConversation(user.userId, coachId);

        let messages = [];
        if (conversation && conversation.messages) {
            messages = conversation.messages;
        } else {
            let welcomeMsg = "Hi! I'm your Transformation Coach. I'm here to help you achieve your goals and build lasting habits.";

            switch (coachId) {
                case 'languages': welcomeMsg = "Hello! Ready to unlock your language potential?"; break;
                case 'mobility': welcomeMsg = "Welcome. Let's work on getting you moving freely and without pain."; break;
                case 'emotional': welcomeMsg = "Hi there. I'm here to help you navigate your emotional landscape."; break;
                case 'relationships': welcomeMsg = "Hello. Let's talk about building stronger, healthier connections."; break;
                case 'health': welcomeMsg = "Hi! Let's get your health and vitality to the next level."; break;
                case 'tolerance': welcomeMsg = "Welcome. Ready to embrace discomfort and build resilience?"; break;
                case 'skills': welcomeMsg = "Hi! Let's optimize your practice and master new skills."; break;
                case 'habits': welcomeMsg = "Hello! Let's build some rock-solid habits together."; break;
            }

            messages = [{
                role: 'assistant',
                content: welcomeMsg + " What would you like to discuss?",
                timestamp: new Date()
            }];
        }

        return NextResponse.json({
            success: true,
            data: { messages }
        });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        return NextResponse.json(
            { status: 500 }
        );
    }
}

// DELETE /api/expert/chat - Reset (clear) conversation for a coach
export async function DELETE(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const coachId = request.nextUrl.searchParams.get('coachId') || 'general';
        const conversation = await db.getExpertConversation(user.userId, coachId);

        if (conversation && conversation.id) {
            await db.updateConversationMessages(conversation.id, []);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error resetting conversation:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Fallback responses when AI is unavailable
function getFallbackResponse(message: string, context: any): string {
    const goalName = context?.activeGoal?.title || 'your goal';
    const streak = context?.streak || 0;
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('motivation') || lowerMessage.includes('struggling')) {
        return `I see you're working on "${goalName}" and you're on day ${context?.dayInJourney || 1}. That's real commitment!

When motivation dips, remember why you started. What was the spark that made you want this change?

${streak > 0 ? `You've got a ${streak}-day streak going - that's not nothing! Let's protect it.` : 'Every day is a chance to start fresh.'}

What specific part feels hardest right now?`;
    }

    if (lowerMessage.includes('progress') || lowerMessage.includes('how am i doing')) {
        return `Let me check your stats!

${context?.activeGoal ? `You're on Day ${context.dayInJourney} of your "${goalName}" journey.` : ''}
${context?.completedChallengesCount ? `You've completed ${context.completedChallengesCount} challenges.` : ''}
${streak > 0 ? `Current streak: ${streak} days!` : ''}
${context?.avgMood ? `Your average mood this week: ${context.avgMood}/10` : ''}

${context?.completedChallengesCount > 5 ? "You're building real momentum!" : "Every completed challenge builds the foundation."}

What would you like to focus on next?`;
    }

    return `I'm here to help with your journey toward "${goalName}".

${context?.todayChallenge ? `I see today's challenge is "${context.todayChallenge.title}" - how's that going?` : ''}

What's on your mind?`;
}
