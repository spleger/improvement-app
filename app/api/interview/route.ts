import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Interview stages following the spec framework
type InterviewStage = 'mood' | 'goals' | 'challenges' | 'habits' | 'general' | 'open';

async function getUserContext(userId: string) {
    try {
        // Get active goal
        const activeGoal = await db.getActiveGoalByUserId(userId);

        // Get recent challenges
        const challenges = await db.getChallengesByUserId(userId, { limit: 10 });
        const completedChallenges = challenges.filter(c => c.status === 'completed');
        const todayChallenge = await db.getTodayChallenge(userId);

        // Get streak
        const streak = await db.calculateStreak(userId);

        // Get user preferences
        const preferences = await db.getUserPreferences(userId);

        // Get recent surveys for mood data
        const surveys = await db.getSurveysByUserId(userId, 7);
        const avgMood = surveys.length > 0
            ? Math.round(surveys.reduce((sum, s) => sum + s.overallMood, 0) / surveys.length * 10) / 10
            : null;

        // Get habit stats
        const habitStats = await db.getHabitStats(userId, 7);
        const todayHabitLogs = await db.getHabitLogsForDate(userId, new Date());

        // Calculate day in journey
        const dayInJourney = activeGoal
            ? Math.ceil((Date.now() - new Date(activeGoal.startedAt).getTime()) / (1000 * 60 * 60 * 24))
            : 0;

        return {
            activeGoal,
            todayChallenge,
            completedChallengesCount: completedChallenges.length,
            totalChallenges: challenges.length,
            streak,
            avgMood,
            dayInJourney,
            recentChallenges: challenges.slice(0, 5),
            preferences,
            recentDiary: await db.getDiaryEntriesByUserId(userId, 3),
            recentSurveys: surveys.slice(0, 3),
            habitStats,
            todayHabitLogs
        };
    } catch (error) {
        console.error('Error fetching user context:', error);
        return null;
    }
}

function buildInterviewSystemPrompt(
    context: any,
    stage: InterviewStage,
    nextStage: InterviewStage | null,
    exchangeCount: number
) {
    const userName = context?.preferences?.displayName || 'there';

    let prompt = `You are conducting a daily check-in interview with ${userName}. You're warm, empathetic, and genuinely curious about their wellbeing and progress.

=== INTERVIEW PROTOCOL ===
This is a semi-structured daily check-in interview. You guide the conversation through specific topics while keeping it natural and conversational.

Current Stage: ${stage.toUpperCase()}
Exchange Count in Stage: ${exchangeCount}
${nextStage ? `Next Stage Hint: ${nextStage} (consider transitioning soon)` : ''}

STAGE DESCRIPTIONS:
1. MOOD (1-2 exchanges): Start by asking how they're feeling today. Be genuinely interested.
2. GOALS (2-3 exchanges): Ask about their active goal progress, challenges, and wins.
3. CHALLENGES (1-2 exchanges): Discuss today's challenge or recent challenges they've attempted.
4. HABITS (1-2 exchanges): Check in on their habit tracking and consistency.
5. GENERAL (1-2 exchanges): Open-ended growth questions about self-discovery.
6. OPEN (unlimited): Free conversation - they can discuss anything.

STAGE-SPECIFIC GUIDANCE:
`;

    // Add stage-specific instructions
    switch (stage) {
        case 'mood':
            prompt += `
- You're in the MOOD stage. Ask about their current emotional state.
- If this is the first message (__START_INTERVIEW__), greet them warmly and ask how they're feeling.
- Show empathy and validate their feelings.
- Ask one follow-up question based on their response before moving on.
`;
            break;
        case 'goals':
            prompt += `
- You're in the GOALS stage. Focus on their active goal progress.
- Reference their specific goal: "${context?.activeGoal?.title || 'their goal'}"
- Ask about progress, obstacles, or recent wins.
- Be encouraging but also help them think through challenges.
`;
            break;
        case 'challenges':
            prompt += `
- You're in the CHALLENGES stage. Discuss their daily challenges.
${context?.todayChallenge ? `- Today's challenge: "${context.todayChallenge.title}" (${context.todayChallenge.status})` : '- No specific challenge today.'}
- Ask about recent challenge experiences or what they're working on.
`;
            break;
        case 'habits':
            prompt += `
- You're in the HABITS stage. Check on their habit consistency.
${context?.habitStats?.totalHabits > 0 ? `- They're tracking ${context.habitStats.totalHabits} habits with ${context.habitStats.weeklyCompletionRate}% weekly completion.` : '- They may not have active habits tracked.'}
- Celebrate streaks and gently encourage missed habits.
`;
            break;
        case 'general':
            prompt += `
- You're in the GENERAL growth stage.
- Ask open-ended questions about self-discovery, lessons learned, or personal insights.
- Examples: "What have you learned about yourself recently?" or "What's one thing you're proud of?"
`;
            break;
        case 'open':
            prompt += `
- You're in OPEN conversation mode. The structured interview is complete.
- Be a supportive listener. Let them guide the conversation.
- Ask thoughtful follow-up questions about whatever they want to discuss.
`;
            break;
    }

    prompt += `

RESPONSE GUIDELINES:
- Keep responses concise (2-3 sentences for questions, 3-4 for responses)
- Ask only ONE question at a time
- Be warm and use occasional emojis sparingly
- Reference their actual data when relevant
- Never mention the interview "stages" or "protocol" to the user
- Make transitions between topics feel natural

SPECIAL MESSAGES:
- If message is "__START_INTERVIEW__", this is the interview start. Give a warm greeting and ask about their mood.

`;

    // Add user context data
    if (context) {
        prompt += `\n=== USER CONTEXT DATA ===\n`;

        if (context.preferences?.displayName) {
            prompt += `Name: ${context.preferences.displayName}\n`;
        }

        if (context.activeGoal) {
            prompt += `\nActive Goal: "${context.activeGoal.title}"
- Domain: ${context.activeGoal.domain?.name || 'General'}
- Day ${context.dayInJourney} of journey
- Current state: "${context.activeGoal.currentState || 'Not specified'}"
- Desired state: "${context.activeGoal.desiredState || 'Not specified'}"
`;
        } else {
            prompt += `\nNo active goal set.\n`;
        }

        prompt += `\nProgress Stats:
- Streak: ${context.streak || 0} days
- Challenges completed: ${context.completedChallengesCount || 0}
${context.avgMood ? `- Average mood (7 days): ${context.avgMood}/10` : ''}
`;

        if (context.todayChallenge) {
            prompt += `\nToday's Challenge: "${context.todayChallenge.title}" (${context.todayChallenge.status})
`;
        }

        if (context.habitStats && context.habitStats.totalHabits > 0) {
            prompt += `\nHabits: Tracking ${context.habitStats.totalHabits} habits
- Today: ${context.habitStats.completedToday}/${context.habitStats.totalHabits} done
- Weekly rate: ${context.habitStats.weeklyCompletionRate}%
`;
            if (context.habitStats.habits?.length > 0) {
                prompt += `- Active: ${context.habitStats.habits.map((h: any) => h.name).join(', ')}\n`;
            }
        }

        if (context.recentSurveys && context.recentSurveys.length > 0) {
            const latest = context.recentSurveys[0];
            prompt += `\nRecent Check-in: Energy ${latest.energyLevel}/10, Motivation ${latest.motivationLevel}/10, Mood ${latest.overallMood}/10
`;
        }

        prompt += `\n=== END CONTEXT ===\n`;
    }

    return prompt;
}

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
        const {
            message,
            stage = 'mood',
            nextStage = null,
            exchangeCount = 0,
            history = [],
            context: clientContext
        } = body;

        if (!message) {
            return new Response(JSON.stringify({ success: false, error: 'Message is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get user context (prefer server-side fetch, fall back to client-provided)
        const serverContext = await getUserContext(user.userId);
        const context = serverContext || clientContext || {};

        // Build interview-specific system prompt
        const systemPrompt = buildInterviewSystemPrompt(
            context,
            stage as InterviewStage,
            nextStage as InterviewStage | null,
            exchangeCount
        );

        // Build conversation history for Claude
        const messages: Anthropic.MessageParam[] = [];
        if (history && Array.isArray(history)) {
            for (const msg of history.slice(-10)) {
                if (msg.content && typeof msg.content === 'string' && msg.content.trim().length > 0) {
                    // Skip the special start message in history
                    if (msg.content === '__START_INTERVIEW__') continue;
                    if (msg.role === 'user') {
                        messages.push({ role: 'user', content: msg.content.trim() });
                    } else if (msg.role === 'assistant') {
                        messages.push({ role: 'assistant', content: msg.content.trim() });
                    }
                }
            }
        }

        // Add current message (handle special start message)
        const userMessage = message === '__START_INTERVIEW__'
            ? 'Start the daily check-in interview.'
            : message.trim();
        messages.push({ role: 'user', content: userMessage });

        // Initialize Anthropic client
        const apiKey = process.env.ANTHROPIC_API_KEY?.replace(/^["']|["']$/g, '').trim();
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Server configuration error: Missing Anthropic Key' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        const anthropic = new Anthropic({ apiKey });

        // Create streaming response
        const encoder = new TextEncoder();
        let fullResponse = '';

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const streamResponse = await anthropic.messages.stream({
                        model: 'claude-3-haiku-20240307',
                        max_tokens: 500,
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
                        // Find or create daily interview conversation
                        let conversation = await db.getConversationByType(user.userId, 'daily_interview');
                        let conversationMessages = conversation?.messages || [];

                        if (!conversation) {
                            conversation = await db.createConversation({
                                userId: user.userId,
                                conversationType: 'daily_interview',
                                title: `Daily Check-in - ${new Date().toLocaleDateString()}`,
                                initialMessages: [],
                                context: { stage, startedAt: new Date().toISOString() }
                            });
                            conversationMessages = [];
                        }

                        // Append user message (skip special start message)
                        if (message !== '__START_INTERVIEW__') {
                            conversationMessages.push({
                                role: 'user',
                                content: message,
                                timestamp: new Date().toISOString(),
                                stage: stage
                            });
                        }

                        // Append assistant message
                        conversationMessages.push({
                            role: 'assistant',
                            content: fullResponse,
                            timestamp: new Date().toISOString(),
                            stage: stage
                        });

                        if (conversation && conversation.id) {
                            await db.updateConversationMessages(conversation.id, conversationMessages);
                            // Update context with current stage
                            await db.updateConversationContext(conversation.id, {
                                ...(conversation.context || {}),
                                currentStage: stage,
                                lastUpdated: new Date().toISOString()
                            });
                        }
                    } catch (dbError) {
                        console.error('Error saving interview conversation:', dbError);
                    }

                    controller.close();
                } catch (error) {
                    console.error('Interview streaming error:', error);
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
        console.error('Error in interview API:', error);
        return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
