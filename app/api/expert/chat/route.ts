import { NextRequest, NextResponse } from 'next/server';
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
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const parsed = validateBody(ChatMessageSchema, body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
        }
        const { message, history, coachId } = parsed.data;

        const { systemPrompt, context } = await buildExpertSystemPrompt(user.userId, coachId);
        const messages = buildMessageHistory(history, message);

        try {
            const { conversation, conversationMessages } = await getOrCreateExpertConversation(user.userId, coachId);

            // Append user message to our history tracking
            const userMsgObj = {
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            };
            conversationMessages.push(userMsgObj);

            // Call Claude API
            const anthropic = getAnthropicClient();
            const response = await anthropic.messages.create({
                model: ANTHROPIC_MODEL,
                max_tokens: 1000,
                system: systemPrompt,
                messages: messages as any[]
            });

            // Log API usage
            if (response.usage) {
                logApiUsage({
                    userId: user.userId,
                    route: 'expert/chat',
                    provider: 'anthropic',
                    model: ANTHROPIC_MODEL,
                    inputTokens: response.usage.input_tokens,
                    outputTokens: response.usage.output_tokens,
                });
            }

            // Extract text from response
            const textContent = response.content.find(block => block.type === 'text');
            const reply = textContent?.type === 'text' ? textContent.text : getFallbackResponse(message, context);

            // Append assistant message
            const assistantMsgObj = {
                role: 'assistant',
                content: reply,
                timestamp: new Date().toISOString()
            };
            conversationMessages.push(assistantMsgObj);

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

            // Even on error fallback, save interaction to the correct context
            const fallbackConvo = await getOrCreateExpertConversation(user.userId, coachId);
            if (fallbackConvo.conversation && fallbackConvo.conversation.id) {
                fallbackConvo.conversationMessages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
                fallbackConvo.conversationMessages.push({ role: 'assistant', content: reply, timestamp: new Date().toISOString() });
                await db.updateConversationMessages(fallbackConvo.conversation.id, fallbackConvo.conversationMessages);
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
            // Default welcome message if no history
            // We can customize this based on coachId too!
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

// Fallback responses with context (used when AI API is unavailable)
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
