import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

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

function buildSystemPrompt(context: any, coachId?: string) {
    let roleDescription = 'You are a Transformation Coach - an expert in habit formation, goal achievement, and personal development.';

    // Customize role based on coach ID
    switch (coachId) {
        case 'languages':
            roleDescription = 'You are a Language Learning Expert and Polyglot Coach. You focus on immersion strategies, overcoming speaking anxiety, and consistent practice.';
            break;
        case 'mobility':
            roleDescription = 'You are a Mobility and Movement Coach. You focus on flexibility, joint health, and building a body that moves without pain.';
            break;
        case 'emotional':
            roleDescription = 'You are an Emotional Intelligence Coach. You focus on emotional regulation, self-awareness, and building resilience.';
            break;
        case 'relationships':
            roleDescription = 'You are a Relationship and Communication Coach. You focus on empathy, active listening, and building deeper connections.';
            break;
        case 'health':
            roleDescription = 'You are a Health and Vitality Coach. You focus on sustainable fitness, nutrition habits, and physical energy.';
            break;
        case 'tolerance':
            roleDescription = 'You are a Resilience and Tolerance Coach. You focus on getting comfortable with discomfort, stoicism, and mental toughness.';
            break;
        case 'skills':
            roleDescription = 'You are a Skill Acquisition Expert. You focus on deliberate practice, the 80/20 rule of learning, and overcoming plateaus.';
            break;
        case 'habits':
            roleDescription = 'You are a Habit Formation Expert. You focus on cue-routine-reward loops, environment design, and small atomic habits.';
            break;
        default:
        // Keep default general coach
    }

    let prompt = `${roleDescription} You're warm, encouraging, and evidence-based in your approach.

Your role is to help users:
- Stay motivated on their 30-day transformation journeys
- Build consistent habits
- Overcome challenges and setbacks
- Process emotions around change
- Celebrate wins (big and small)

IMPORTANT: Stay STRICTLY within your domain of expertise (${coachId || 'General'}). If the user asks about something totally unrelated, gently guide them to the General Coach or the appropriate specialist.

=== INTERACTIVE WIDGETS PROCTOCOL ===
You can trigger interactive widgets in the chat to help the user take action.
To use a widget, output a JSON block formatted exactly like this on a separate line:
<<<{"type": "WIDGET_TYPE", "payload": { ... }}>>>

Supported Widgets:
1. Suggest Challenge (Use when user asks for a challenge or needs something to do)
   <<<{"type": "suggest_challenge", "payload": {"title": "Challenge Title", "difficulty": 5, "isRealityShift": false}}>>>

2. Log Mood (Use when user mentions feeling a certain way or you want to check in)
   <<<{"type": "log_mood", "payload": {}}>>>

3. Create Goal (Use when user wants to start a new journey or has no active goal)
   <<<{"type": "create_goal", "payload": {"title": "Suggested Goal Title", "domainId": 1}}>>>
=====================================

Guidelines:
- Keep responses concise (2-4 paragraphs max)
- Use specific, actionable advice
- Reference their ACTUAL goals and progress when relevant
- Be empathetic but also gently push users out of comfort zones
- Use occasional emojis to be warm but not excessive
- Ask follow-up questions to understand their situation better
`;

    if (context) {
        prompt += `\n=== USER'S CURRENT CONTEXT ===\n`;

        if (context.preferences?.displayName) {
            prompt += `User's Name: ${context.preferences.displayName}\n`;
        }

        if (context.preferences?.preferredDifficulty) {
            prompt += `User's Preferred Difficulty: ${context.preferences.preferredDifficulty}/10\n`;
        }

        if (context.activeGoal) {
            prompt += `\n📎 ACTIVE GOAL:
- Title: "${context.activeGoal.title}"
- Domain: ${context.activeGoal.domain?.name || 'General'}
- Day ${context.dayInJourney} of 30-day journey
- Current state: "${context.activeGoal.currentState || 'Not specified'}"
- Desired state: "${context.activeGoal.desiredState || 'Not specified'}"
- Difficulty preference: ${context.activeGoal.difficultyLevel}/10
- Reality Shift mode: ${context.activeGoal.realityShiftEnabled ? 'ON (wants extreme challenges)' : 'OFF'}
`;
        } else {
            prompt += `\n⚠️ User has no active goal set yet. Encourage them to set one using the create_goal widget!\n`;
        }

        prompt += `\n📊 PROGRESS:
- Current streak: ${context.streak} days
- Challenges completed: ${context.completedChallengesCount}
- Total challenges attempted: ${context.totalChallenges}
${context.avgMood ? `- Average mood (last 7 days): ${context.avgMood}/10` : ''}
`;

        if (context.todayChallenge) {
            prompt += `\n🎯 TODAY'S CHALLENGE:
- "${context.todayChallenge.title}"
- Difficulty: ${context.todayChallenge.difficulty}/10
- Status: ${context.todayChallenge.status}
${context.todayChallenge.description ? `- Description: ${context.todayChallenge.description}` : ''}
`;
        }

        if (context.recentChallenges && context.recentChallenges.length > 0) {
            prompt += `\n📋 RECENT CHALLENGES:\n`;
            context.recentChallenges.slice(0, 3).forEach((c: any) => {
                prompt += `- "${c.title}" (${c.status}, difficulty ${c.difficulty}/10)\n`;
            });
        }

        if (context.recentDiary && context.recentDiary.length > 0) {
            prompt += `\n🎙️ RECENT DIARY ENTRIES (Full Context):\n`;
            context.recentDiary.slice(0, 3).forEach((e: any) => {
                const date = new Date(e.createdAt).toLocaleDateString();
                let insights = '';
                let title = 'Untitled Entry';
                try {
                    const parsed = JSON.parse(e.aiInsights || '{}');
                    if (parsed.title) title = parsed.title;
                    if (parsed.sentiment) insights += `Sentiment: ${parsed.sentiment}. `;
                    if (parsed.distortions?.length) insights += `Distortions: ${parsed.distortions.join(', ')}. `;
                } catch (err) { }

                const transcriptExcerpt = e.transcript
                    ? (e.transcript.length > 500 ? e.transcript.substring(0, 500) + '...' : e.transcript)
                    : 'No transcript';

                prompt += `- [${date}] "${title}":\n`;
                prompt += `  Summary: ${e.aiSummary || 'No AI summary'}\n`;
                prompt += `  ${insights}\n`;
                prompt += `  Transcript: "${transcriptExcerpt}"\n\n`;
            });
            prompt += `(Use these diary insights to be deeply empathetic. Reference what they actually said.)\n`;
        }

        if (context.recentSurveys && context.recentSurveys.length > 0) {
            prompt += `\n📊 RECENT CHECK-INS (Daily Wellness):\n`;
            context.recentSurveys.slice(0, 3).forEach((s: any) => {
                const date = new Date(s.surveyDate).toLocaleDateString();
                prompt += `- [${date}] Energy: ${s.energyLevel}/10, Motivation: ${s.motivationLevel}/10, Mood: ${s.overallMood}/10\n`;
                if (s.biggestWin) prompt += `  Win: "${s.biggestWin}"\n`;
                if (s.biggestBlocker) prompt += `  Blocker: "${s.biggestBlocker}"\n`;
            });
            prompt += `(Reference these when discussing their recent state. If energy was low, be understanding.)\n`;
        }

        if (context.habitStats && context.habitStats.totalHabits > 0) {
            prompt += `\n✅ HABIT TRACKING:\n`;
            prompt += `Active Habits (${context.habitStats.totalHabits}):\n`;

            context.habitStats.habits.forEach((h: any) => {
                const todayLog = context.todayHabitLogs?.find((l: any) => l.habitId === h.id);
                const status = todayLog?.completed ? '✓ Done' : '○ Pending';
                const streakText = h.streak > 0 ? ` - ${h.streak} day streak 🔥` : '';
                prompt += `- "${h.name}" (${h.icon}) [${status}]${streakText}\n`;
                if (todayLog?.notes) {
                    prompt += `  Note: "${todayLog.notes}"\n`;
                }
            });

            prompt += `\nToday's Progress: ${context.habitStats.completedToday}/${context.habitStats.totalHabits}\n`;
            prompt += `Weekly Completion Rate: ${context.habitStats.weeklyCompletionRate}%\n`;
            prompt += `(Reference habits when discussing consistency. Celebrate streaks! If they're missing habits, gently encourage.)\n`;
        }

        prompt += `\n=== END OF CONTEXT ===\n`;
    }

    prompt += `\nRemember to reference this context naturally when relevant. For example, if they mention struggling, relate it to their specific goal or challenge. Celebrate their streak if it's going well!`;

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
        const { message, history, coachId } = body;

        if (!message) {
            return new Response(JSON.stringify({ success: false, error: 'Message is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get user context
        const context = await getUserContext(user.userId);
        let systemPrompt = '';

        // Check if using a custom coach
        const standardCoachIds = ['general', 'languages', 'mobility', 'emotional', 'relationships', 'health', 'tolerance', 'skills', 'habits'];

        if (coachId && !standardCoachIds.includes(coachId)) {
            const coaches = await db.getCustomCoachesByUserId(user.userId);
            const customCoach = coaches.find((c: any) => c.id === coachId);

            if (customCoach) {
                const basePrompt = buildSystemPrompt(context, 'general');
                const promptPrefix = `You are ${customCoach.name}. ${customCoach.systemPrompt}\n\n`;
                systemPrompt = promptPrefix + basePrompt.replace(/^You are a Transformation Coach[\s\S]*?\n\n/, '');
            } else {
                systemPrompt = buildSystemPrompt(context, coachId);
            }
        } else {
            systemPrompt = buildSystemPrompt(context, coachId);
        }

        // Build conversation history for Claude
        const messages: Anthropic.MessageParam[] = [];
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
                        max_tokens: 1000,
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
