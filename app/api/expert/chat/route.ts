import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getUserContext, buildEnhancedSystemPrompt } from '@/lib/ai/context';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { message, history, coachId } = body;

        if (!message) {
            return NextResponse.json(
                { success: false, error: 'Message is required' },
                { status: 400 }
            );
        }

        // Get user context
        const context = await getUserContext(user.userId);
        let systemPrompt = '';

        // Check if using a custom coach (ID usually starts with random chars, unlike 'general', 'health')
        // We'll query DB for custom coach if ID is not in standard list
        const standardCoachIds = ['general', 'languages', 'mobility', 'emotional', 'relationships', 'health', 'tolerance', 'skills', 'habits'];

        if (coachId && !standardCoachIds.includes(coachId)) {
            // It's likely a custom coach ID - fetch from database
            const coaches = await db.getCustomCoachesByUserId(user.userId);
            const customCoach = coaches.find((c: any) => c.id === coachId);

            if (customCoach) {
                // Build base prompt with enhanced personalization and daily focus
                const basePrompt = buildEnhancedSystemPrompt(context, 'general');
                // Inject custom coach role at the beginning
                const promptPrefix = `You are ${customCoach.name}. ${customCoach.systemPrompt}\n\n`;
                // Replace the default role description with custom coach identity
                systemPrompt = promptPrefix + basePrompt.replace(/^You are [^,]+,[\s\S]*?\n\n/, '');
            } else {
                systemPrompt = buildEnhancedSystemPrompt(context, coachId);
            }
        } else {
            systemPrompt = buildEnhancedSystemPrompt(context, coachId);
        }

        // Build conversation history for Claude
        const messages = [];
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
        messages.push({ role: 'user', content: message.trim() });

        try {
            // Find specific conversation for this coach
            const targetCoachId = coachId || 'general';
            let conversation = await db.getExpertConversation(user.userId, targetCoachId);
            let conversationMessages = conversation?.messages || [];

            // If no conversation found or it's empty, create one
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

            // Append user message to our history tracking
            const userMsgObj = {
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            };
            conversationMessages.push(userMsgObj);

            // Initialize Anthropic client
            const apiKey = process.env.ANTHROPIC_API_KEY?.replace(/^["']|["']$/g, '').trim();
            if (!apiKey) {
                throw new Error('Server configuration error: Missing Anthropic Key');
            }
            const anthropic = new Anthropic({ apiKey });

            // Call Claude API using Anthropic SDK
            const response = await anthropic.messages.create({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1000,
                system: systemPrompt,
                messages: messages as Anthropic.MessageParam[]
            });

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

            // Even on error fallback, we want to save interaction to the correct context
            const targetCoachId = coachId || 'general';
            let conversation = await db.getExpertConversation(user.userId, targetCoachId);

            if (!conversation) {
                conversation = await db.createConversation({
                    userId: user.userId,
                    conversationType: 'expert_chat',
                    title: `${targetCoachId.charAt(0).toUpperCase() + targetCoachId.slice(1)} Coaching`,
                    initialMessages: [],
                    context: { coachId: targetCoachId }
                });
            }

            if (conversation && conversation.id) {
                const msgs = conversation.messages || [];
                msgs.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
                msgs.push({ role: 'assistant', content: reply, timestamp: new Date().toISOString() });
                await db.updateConversationMessages(conversation.id, msgs);
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
