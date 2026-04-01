import * as db from '@/lib/db';
import { getUserContext, buildEnhancedSystemPrompt } from '@/lib/ai/context';

const STANDARD_COACH_IDS = ['general'];

/**
 * Build the system prompt for an expert chat session, resolving custom coaches,
 * goal coaches, and injecting coach memory + cross-conversation context.
 */
export async function buildExpertSystemPrompt(
    userId: string,
    coachId?: string
): Promise<{ systemPrompt: string; context: any }> {
    const context = await getUserContext(userId);
    const targetCoachId = coachId || 'general';
    const coachMemory = await db.getCoachMemory(userId, targetCoachId);
    const memories = coachMemory?.memories || [];

    // Fetch recent conversations from OTHER coaches for cross-context
    const otherConversations = await db.getOtherCoachConversations(userId, targetCoachId);

    let systemPrompt = '';

    if (coachId && !STANDARD_COACH_IDS.includes(coachId)) {
        // Check if it's a custom coach first
        const coaches = await db.getCustomCoachesByUserId(userId);
        const customCoach = coaches.find((c: any) => c.id === coachId);

        if (customCoach) {
            const basePrompt = buildEnhancedSystemPrompt(context, 'general', undefined, memories);
            const promptPrefix = `You are ${customCoach.name}. ${customCoach.systemPrompt}\n\n`;
            systemPrompt = promptPrefix + basePrompt.replace(/^You are [^,]+,[\s\S]*?\n\n/, '');
        } else {
            // It's a goal ID -- fetch the goal and build a goal-focused prompt
            const goal = await db.getGoalById(coachId);

            if (goal) {
                systemPrompt = buildGoalCoachPrompt(context, goal, memories);
            } else {
                // Fallback to general
                systemPrompt = buildEnhancedSystemPrompt(context, 'general', undefined, memories);
            }
        }
    } else {
        systemPrompt = buildEnhancedSystemPrompt(context, coachId, undefined, memories);
    }

    // Append cross-conversation context
    if (otherConversations.length > 0) {
        systemPrompt += buildCrossConversationContext(otherConversations, context);
    }

    return { systemPrompt, context };
}

/**
 * Build a rich, goal-anchored system prompt for goal-specific coaches.
 * These coaches are deeply focused on a single goal and its domain.
 */
function buildGoalCoachPrompt(
    context: any,
    goal: any,
    memories: any[]
): string {
    const userName = context?.preferences?.displayName || 'there';
    const aiName = context?.preferences?.aiCustomName?.trim() || 'Coach';
    const domainName = goal.domain?.name || 'General';
    const dayInJourney = Math.ceil(
        (Date.now() - new Date(goal.startedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const progress = Math.min(Math.round((dayInJourney / 30) * 100), 100);

    // Phase-specific coaching approach
    let phase = 'Foundation';
    let phaseGuidance = 'Focus on building basic habits and routines. Keep challenges small and achievable. Build confidence through consistency.';
    if (dayInJourney > 25) {
        phase = 'Mastery';
        phaseGuidance = 'Push for peak performance. Challenge them to consolidate gains and plan for sustainability beyond the 30 days. Discuss identity-level change.';
    } else if (dayInJourney > 15) {
        phase = 'Acceleration';
        phaseGuidance = 'Increase intensity. The user has built a foundation -- push them toward stretch goals. Address any plateaus head-on.';
    } else if (dayInJourney > 5) {
        phase = 'Growth';
        phaseGuidance = 'Start pushing boundaries. Introduce harder challenges. Help them through the motivation dip that typically hits around days 7-14.';
    }

    // Domain-specific expertise
    const domainExpertise = getDomainExpertise(domainName);

    let prompt = `You are ${aiName}, a specialized coach dedicated entirely to helping ${userName} achieve their goal: "${goal.title}".

== YOUR EXPERTISE ==
${domainExpertise}

== THE GOAL ==
Title: "${goal.title}"
Domain: ${domainName}
Where they started: "${goal.currentState || 'Not specified'}"
Where they want to be: "${goal.desiredState || 'Not specified'}"
Preferred difficulty: ${goal.difficultyLevel}/10
Reality Shift mode: ${goal.realityShiftEnabled ? 'ON -- they want extreme, uncomfortable challenges that drive massive growth' : 'OFF'}

== JOURNEY STATUS ==
Day ${dayInJourney} of 30 (${progress}% through)
Phase: ${phase}
${phaseGuidance}

== COACHING APPROACH ==
You are laser-focused on THIS goal. Every response should connect back to "${goal.title}".
- Ask about specific actions they've taken toward this goal
- Reference their starting point ("${goal.currentState || 'where you started'}") and destination ("${goal.desiredState || 'where you want to be'}") to track progress
- Suggest concrete next steps within the ${domainName} domain
- If they bring up unrelated topics, briefly acknowledge then redirect to the goal
- Celebrate progress relative to where they started, not just abstract praise

== CONVERSATIONAL STYLE ==
${context?.preferences?.tonePreference === 'professional' ? 'Maintain a professional, structured tone.' :
        context?.preferences?.tonePreference === 'casual' ? 'Be relaxed and conversational.' :
            'Be warm, encouraging, and approachable.'}
Keep responses to 2-4 paragraphs max. End with a focused question or actionable step.
${context?.preferences?.rudeMode ? '\nTOUGH LOVE MODE: Be direct, no-nonsense. Call out excuses. Push hard.' : ''}

== INTERACTIVE WIDGETS ==
Trigger widgets for actionable items. Output on a separate line:
<<<{"type": "WIDGET_TYPE", "payload": { ... }}>>>
Available:
1. suggest_challenge -- suggest a goal-specific challenge: <<<{"type": "suggest_challenge", "payload": {"title": "...", "description": "Brief description", "difficulty": 5, "isRealityShift": false}}>>>
2. check_in -- ask about mood/energy/motivation: <<<{"type": "check_in", "payload": {}}>>>
3. create_habit -- suggest building a routine: <<<{"type": "create_habit", "payload": {"name": "...", "frequency": "daily"}}>>>
4. progress_snapshot -- show user's stats: <<<{"type": "progress_snapshot", "payload": {"streak": N, "challengesCompleted": N, "totalChallenges": N, "avgMood": N, "habitCompletionRate": N}}>>>
   Fill values from USER STATS below.
Only use widgets when contextually relevant.
`;

    // Add coach memory
    if (memories && memories.length > 0) {
        prompt += `\n== MEMORY FROM PREVIOUS SESSIONS ==\n`;
        memories.slice(-10).forEach((m: any) => {
            prompt += `- [${m.type}] ${m.content}\n`;
        });
        prompt += `Reference these naturally when relevant.\n`;
    }

    // Add user stats context
    if (context) {
        prompt += `\n== USER STATS ==\n`;
        prompt += `Streak: ${context.streak} days\n`;
        prompt += `Challenges completed: ${context.completedChallengesCount} of ${context.totalChallenges}\n`;
        if (context.avgMood) prompt += `Average mood (7 days): ${context.avgMood}/10\n`;

        // Recent challenges for this goal specifically
        if (context.recentChallenges && context.recentChallenges.length > 0) {
            const goalChallenges = context.recentChallenges.filter((c: any) => c.goalId === goal.id);
            if (goalChallenges.length > 0) {
                prompt += `\nRecent challenges for this goal:\n`;
                goalChallenges.forEach((c: any) => {
                    prompt += `- "${c.title}" (${c.status}, difficulty ${c.difficulty}/10)\n`;
                });
            }
        }

        // Recent diary entries
        if (context.recentDiary && context.recentDiary.length > 0) {
            prompt += `\nRecent diary entries:\n`;
            context.recentDiary.slice(0, 2).forEach((e: any) => {
                const date = new Date(e.createdAt).toLocaleDateString();
                prompt += `- [${date}] ${e.aiSummary || 'No summary'}\n`;
            });
        }

        // Habits
        if (context.habitStats && context.habitStats.totalHabits > 0) {
            prompt += `\nHabits (${context.habitStats.completedToday}/${context.habitStats.totalHabits} today, ${context.habitStats.weeklyCompletionRate}% weekly)\n`;
        }
    }

    return prompt;
}

/**
 * Get domain-specific expertise text for the goal coach prompt.
 */
function getDomainExpertise(domainName: string): string {
    switch (domainName) {
        case 'Languages':
            return 'You are an expert in language acquisition, immersion strategies, spaced repetition, comprehensible input theory, and overcoming speaking anxiety. You understand the stages from beginner to fluency and how to maintain motivation through plateaus.';
        case 'Mobility':
            return 'You are an expert in flexibility training, joint mobility, progressive stretching protocols, PNF techniques, and movement science. You understand anatomy, injury prevention, and how to safely progress toward advanced positions like splits and backbends.';
        case 'Emotional Growth':
            return 'You are an expert in emotional intelligence, cognitive behavioral techniques, mindfulness, stress management, and building psychological resilience. You understand attachment theory, emotional regulation strategies, and how to process difficult emotions constructively.';
        case 'Relationships':
            return 'You are an expert in interpersonal communication, active listening, conflict resolution, boundary setting, and empathy development. You understand relationship dynamics, attachment styles, and how to build deeper, more authentic connections.';
        case 'Physical Health':
            return 'You are an expert in exercise science, nutrition, sleep optimization, and sustainable fitness habits. You understand progressive overload, recovery, metabolic health, and how to build lasting physical vitality without burnout.';
        case 'Tolerance':
            return 'You are an expert in resilience training, stoic philosophy, exposure therapy principles, cold/heat tolerance, and mental toughness. You understand the science of stress inoculation and how controlled discomfort builds capacity.';
        case 'Skills':
            return 'You are an expert in deliberate practice, skill acquisition science, the 80/20 principle, flow states, and plateau-breaking strategies. You understand the learning curve, chunking, and how to design effective practice sessions.';
        case 'Habits':
            return 'You are an expert in habit formation science, cue-routine-reward loops, environment design, identity-based change, and behavioral psychology. You understand atomic habits, implementation intentions, and how to stack and sustain new behaviors.';
        default:
            return 'You are a well-rounded personal development expert with deep knowledge of goal-setting, motivation science, habit formation, and behavioral change. You adapt your approach to whatever domain the user is working in.';
    }
}

/**
 * Build a cross-conversation context section so coaches know what was discussed elsewhere.
 */
function buildCrossConversationContext(
    otherConversations: { coachId: string; recentMessages: { role: string; content: string }[] }[],
    context: any
): string {
    if (otherConversations.length === 0) return '';

    // Find goal names for goal coach IDs
    const goalMap: Record<string, string> = {};
    if (context?.allActiveGoals) {
        context.allActiveGoals.forEach((g: any) => {
            goalMap[g.id] = g.title;
        });
    }

    let section = `\n== RECENT CONVERSATIONS WITH OTHER COACHES ==\n`;
    section += `The user has been talking to other coaches recently. Use this context to avoid repeating advice and to build on what was already discussed.\n\n`;

    for (const conv of otherConversations) {
        const coachLabel = conv.coachId === 'general' ? 'General Coach'
            : goalMap[conv.coachId] ? `"${goalMap[conv.coachId]}" Goal Coach`
            : `Coach (${conv.coachId})`;

        section += `--- ${coachLabel} ---\n`;
        for (const msg of conv.recentMessages) {
            const prefix = msg.role === 'user' ? 'User' : 'Coach';
            section += `${prefix}: ${msg.content}\n`;
        }
        section += `\n`;
    }

    section += `Use these insights naturally. Don't repeat advice already given. If the user discussed something relevant with another coach, reference it to show continuity.\n`;

    return section;
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
