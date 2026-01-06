import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

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

        // Get user preferences (NEW)
        const preferences = await db.getUserPreferences(userId);

        // Get recent surveys for mood data
        const surveys = await db.getSurveysByUserId(userId, 7);
        const avgMood = surveys.length > 0
            ? Math.round(surveys.reduce((sum, s) => sum + s.overallMood, 0) / surveys.length * 10) / 10
            : null;

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
            preferences // Added preferences
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

        prompt += `\n=== END OF CONTEXT ===\n`;
    }

    prompt += `\nRemember to reference this context naturally when relevant. For example, if they mention struggling, relate it to their specific goal or challenge. Celebrate their streak if it's going well!`;

    return prompt;
}

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
        const systemPrompt = buildSystemPrompt(context, coachId);

        // Build conversation history for Claude
        const messages = [];

        // Add previous messages if any
        if (history && Array.isArray(history)) {
            for (const msg of history.slice(-6)) {
                if (msg.role === 'user') {
                    messages.push({ role: 'user', content: msg.content });
                } else if (msg.role === 'assistant') {
                    messages.push({ role: 'assistant', content: msg.content });
                }
            }
        }

        // Add current message
        messages.push({ role: 'user', content: message });

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

            // Call Claude API
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': ANTHROPIC_API_KEY || '',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 600,
                    system: systemPrompt,
                    messages
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                // console.error('Claude API error:', response.status, errorText); // Commented to keep logs clean
                throw new Error(`Claude API error: ${response.status}`);
            }

            const data = await response.json();
            const reply = data.content[0]?.text || getFallbackResponse(message, context);

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

// Fallback responses with context
function getFallbackResponse(message: string, context: any): string {
    const goalName = context?.activeGoal?.title || 'your goal';
    const streak = context?.streak || 0;

    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('motivation') || lowerMessage.includes('struggling')) {
        return `I see you're working on "${goalName}" and you're on day ${context?.dayInJourney || 1}. That's real commitment! 💪

When motivation dips, remember why you started. What was the spark that made you want this change?

${streak > 0 ? `You've got a ${streak}-day streak going - that's not nothing! Let's protect it.` : 'Every day is a chance to start fresh.'}

What specific part feels hardest right now?`;
    }

    if (lowerMessage.includes('progress') || lowerMessage.includes('how am i doing')) {
        return `Let me check your stats! 📊

${context?.activeGoal ? `You're on Day ${context.dayInJourney} of your "${goalName}" journey.` : ''}
${context?.completedChallengesCount ? `You've completed ${context.completedChallengesCount} challenges.` : ''}
${streak > 0 ? `Current streak: ${streak} days! 🔥` : ''}
${context?.avgMood ? `Your average mood this week: ${context.avgMood}/10` : ''}

${context?.completedChallengesCount > 5 ? "You're building real momentum!" : "Every completed challenge builds the foundation."}

What would you like to focus on next?`;
    }

    return `I'm here to help with your journey toward "${goalName}". 

${context?.todayChallenge ? `I see today's challenge is "${context.todayChallenge.title}" - how's that going?` : ''}

What's on your mind?`;
}
