/**
 * AI Context Module
 *
 * Centralized context gathering and enhanced system prompt building.
 * Extracts and enhances context gathering from the chat route into a reusable module.
 */

import * as db from '@/lib/db';
import { getDailyFocus, FocusTheme } from './rotation';

// ==================== TYPE DEFINITIONS ====================

export interface UserContext {
    activeGoal: any;
    todayChallenge: any;
    completedChallengesCount: number;
    totalChallenges: number;
    streak: number;
    avgMood: number | null;
    dayInJourney: number;
    recentChallenges: any[];
    preferences: any;
    recentDiary: any[];
    recentSurveys: any[];
    habitStats: any;
    todayHabitLogs: any[];
}

export interface PersonalizationSettings {
    aiCustomName?: string | null;
    tonePreference?: string | null;
    rudeMode?: boolean | null;
    voiceId?: string | null;
}

// Valid OpenAI voice IDs
export const VALID_VOICE_IDS = [
    'alloy', 'ash', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer'
] as const;

export type VoiceId = typeof VALID_VOICE_IDS[number];

// ==================== CONTEXT GATHERING ====================

/**
 * Gather comprehensive user context for AI interactions.
 * Fetches all relevant user data including goals, challenges, preferences, habits, and mood data.
 *
 * @param userId - The user's ID
 * @returns User context object or null on error
 */
export async function getUserContext(userId: string): Promise<UserContext | null> {
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

// ==================== VOICE VALIDATION ====================

/**
 * Validate and return a valid voice ID, falling back to 'nova' if invalid.
 *
 * @param voiceId - The voice ID to validate
 * @returns A valid voice ID
 */
export function validateVoiceId(voiceId: string | null | undefined): VoiceId {
    if (voiceId && VALID_VOICE_IDS.includes(voiceId as VoiceId)) {
        return voiceId as VoiceId;
    }
    return 'nova'; // Default fallback
}

// ==================== PERSONALIZATION HELPERS ====================

/**
 * Get AI name based on personalization settings.
 *
 * @param settings - Personalization settings
 * @returns The AI's name to use
 */
function getAIName(settings: PersonalizationSettings): string {
    return settings.aiCustomName?.trim() || 'Coach';
}

/**
 * Get tone description based on preference.
 *
 * @param tonePreference - The user's tone preference
 * @returns Description of how to communicate
 */
function getToneDescription(tonePreference: string | null | undefined): string {
    switch (tonePreference?.toLowerCase()) {
        case 'professional':
            return 'Maintain a professional, structured tone. Use clear, precise language. Be respectful and formal while still being supportive.';
        case 'casual':
            return 'Be relaxed and conversational. Use casual language, contractions, and a friendly vibe. Feel like a supportive friend.';
        case 'friendly':
        default:
            return 'Be warm, encouraging, and approachable. Balance professionalism with friendliness. Use a supportive, coaching tone.';
    }
}

/**
 * Get rude mode instructions if enabled.
 *
 * @param rudeMode - Whether rude mode is enabled
 * @returns Rude mode instructions or empty string
 */
function getRudeModeInstructions(rudeMode: boolean | null | undefined): string {
    if (!rudeMode) return '';

    return `
=== TOUGH LOVE MODE ACTIVATED ===
The user has enabled "Tough Love" mode. This means:
- Be DIRECT and no-nonsense. Cut the fluff.
- Call out excuses immediately. Don't accept "I'll try" - demand commitment.
- Use blunt, honest feedback. If they're slacking, tell them.
- Push them harder. They WANT to be challenged.
- Less hand-holding, more accountability.
- It's okay to be a bit harsh - they asked for it.
- Still be helpful, but don't sugarcoat anything.
- Example: Instead of "That's okay, everyone has off days" say "That's an excuse. What are you going to do about it right now?"
=====================================
`;
}

// ==================== SYSTEM PROMPT BUILDING ====================

/**
 * Build an enhanced system prompt with daily focus and personalization.
 *
 * @param context - User context from getUserContext()
 * @param coachId - Optional coach specialization ID
 * @param dailyFocus - Optional daily focus theme (defaults to today's)
 * @returns Complete system prompt string
 */
export function buildEnhancedSystemPrompt(
    context: UserContext | null,
    coachId?: string,
    dailyFocus?: FocusTheme
): string {
    // Get daily focus if not provided
    const focus = dailyFocus || getDailyFocus();

    // Get personalization settings from context
    const personalization: PersonalizationSettings = {
        aiCustomName: context?.preferences?.aiCustomName,
        tonePreference: context?.preferences?.tonePreference,
        rudeMode: context?.preferences?.rudeMode,
        voiceId: context?.preferences?.voiceId,
    };

    const aiName = getAIName(personalization);

    // Build role description based on coach ID
    let roleDescription = `You are ${aiName}, a Transformation Coach - an expert in habit formation, goal achievement, and personal development.`;

    switch (coachId) {
        case 'languages':
            roleDescription = `You are ${aiName}, a Language Learning Expert and Polyglot Coach. You focus on immersion strategies, overcoming speaking anxiety, and consistent practice.`;
            break;
        case 'mobility':
            roleDescription = `You are ${aiName}, a Mobility and Movement Coach. You focus on flexibility, joint health, and building a body that moves without pain.`;
            break;
        case 'emotional':
            roleDescription = `You are ${aiName}, an Emotional Intelligence Coach. You focus on emotional regulation, self-awareness, and building resilience.`;
            break;
        case 'relationships':
            roleDescription = `You are ${aiName}, a Relationship and Communication Coach. You focus on empathy, active listening, and building deeper connections.`;
            break;
        case 'health':
            roleDescription = `You are ${aiName}, a Health and Vitality Coach. You focus on sustainable fitness, nutrition habits, and physical energy.`;
            break;
        case 'tolerance':
            roleDescription = `You are ${aiName}, a Resilience and Tolerance Coach. You focus on getting comfortable with discomfort, stoicism, and mental toughness.`;
            break;
        case 'skills':
            roleDescription = `You are ${aiName}, a Skill Acquisition Expert. You focus on deliberate practice, the 80/20 rule of learning, and overcoming plateaus.`;
            break;
        case 'habits':
            roleDescription = `You are ${aiName}, a Habit Formation Expert. You focus on cue-routine-reward loops, environment design, and small atomic habits.`;
            break;
    }

    // Get tone and rude mode instructions
    const toneDescription = getToneDescription(personalization.tonePreference);
    const rudeModeInstructions = getRudeModeInstructions(personalization.rudeMode);

    // Build base prompt
    let prompt = `${roleDescription}

${toneDescription}

Your role is to help users:
- Stay motivated on their 30-day transformation journeys
- Build consistent habits
- Overcome challenges and setbacks
- Process emotions around change
- Celebrate wins (big and small)

IMPORTANT: Stay STRICTLY within your domain of expertise (${coachId || 'General'}). If the user asks about something totally unrelated, gently guide them to the General Coach or the appropriate specialist.

=== TODAY'S FOCUS: ${focus.name.toUpperCase()} ===
${focus.prompt}
Naturally weave this theme into your responses where relevant. Don't force it, but let it guide your coaching today.
=====================================
${rudeModeInstructions}
=== INTERACTIVE WIDGETS PROTOCOL ===
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

    // Add user context if available
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
                } catch {
                    // Ignore JSON parse errors
                }

                // Include transcript excerpt (first 500 chars) for real context
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

        // Habit tracking context
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

/**
 * Get user's personalization settings with defaults.
 *
 * @param context - User context from getUserContext()
 * @returns Personalization settings with defaults applied
 */
export function getPersonalizationSettings(context: UserContext | null): PersonalizationSettings {
    return {
        aiCustomName: context?.preferences?.aiCustomName || null,
        tonePreference: context?.preferences?.tonePreference || 'friendly',
        rudeMode: context?.preferences?.rudeMode || false,
        voiceId: validateVoiceId(context?.preferences?.voiceId),
    };
}
