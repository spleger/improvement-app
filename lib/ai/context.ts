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
    allActiveGoals: any[];
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
    onboardingAnswers: { motivation?: string; currentSituation?: string; biggestChallenge?: string } | null;
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

// ==================== CONTEXT CACHE ====================

const contextCache = new Map<string, { data: UserContext; expires: number }>();
const CACHE_TTL_MS = 30_000; // 30 seconds

function getCachedContext(userId: string): UserContext | null {
    const entry = contextCache.get(userId);
    if (entry && Date.now() < entry.expires) return entry.data;
    if (entry) contextCache.delete(userId);
    return null;
}

function setCachedContext(userId: string, data: UserContext): void {
    contextCache.set(userId, { data, expires: Date.now() + CACHE_TTL_MS });
    // Evict stale entries if cache grows large
    if (contextCache.size > 50) {
        const now = Date.now();
        contextCache.forEach((val, key) => {
            if (now >= val.expires) contextCache.delete(key);
        });
    }
}

// ==================== CONTEXT GATHERING ====================

/**
 * Gather comprehensive user context for AI interactions.
 * Fetches all relevant user data including goals, challenges, preferences, habits, and mood data.
 * Results are cached for 30s to avoid redundant DB queries across rapid AI interactions.
 *
 * @param userId - The user's ID
 * @returns User context object or null on error
 */
export async function getUserContext(userId: string): Promise<UserContext | null> {
    try {
        const cached = getCachedContext(userId);
        if (cached) return cached;
        // Fetch all independent data in parallel
        const [
            allGoals,
            challenges,
            todayChallenge,
            streak,
            preferences,
            surveys,
            habitStats,
            todayHabitLogs,
            userData,
            recentDiary
        ] = await Promise.all([
            db.getGoalsByUserId(userId),
            db.getChallengesByUserId(userId, { limit: 10 }),
            db.getTodayChallenge(userId),
            db.calculateStreak(userId),
            db.getUserPreferences(userId),
            db.getSurveysByUserId(userId, 7),
            db.getHabitStats(userId, 7),
            db.getHabitLogsForDate(userId, new Date()),
            db.getUserById(userId),
            db.getDiaryEntriesByUserId(userId, 3)
        ]);

        const allActiveGoals = allGoals.filter((g: any) => g.status === 'active');
        const activeGoal = allActiveGoals[0] || null;
        const completedChallenges = challenges.filter(c => c.status === 'completed');

        const avgMood = surveys.length > 0
            ? Math.round(surveys.reduce((sum, s) => sum + s.overallMood, 0) / surveys.length * 10) / 10
            : null;

        let onboardingAnswers = null;
        if (userData?.onboardingData) {
            try {
                const parsed = JSON.parse(userData.onboardingData);
                onboardingAnswers = parsed?.answers || null;
            } catch { /* ignore malformed JSON */ }
        }

        const dayInJourney = activeGoal
            ? Math.ceil((Date.now() - new Date(activeGoal.startedAt).getTime()) / (1000 * 60 * 60 * 24))
            : 0;

        const result: UserContext = {
            activeGoal,
            allActiveGoals,
            todayChallenge,
            completedChallengesCount: completedChallenges.length,
            totalChallenges: challenges.length,
            streak,
            avgMood,
            dayInJourney,
            recentChallenges: challenges.slice(0, 5),
            preferences,
            recentDiary,
            recentSurveys: surveys.slice(0, 3),
            habitStats,
            todayHabitLogs,
            onboardingAnswers
        };
        setCachedContext(userId, result);
        return result;
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
 * Build an enhanced system prompt with coaching methodology, memory, and personalization.
 *
 * @param context - User context from getUserContext()
 * @param coachId - Optional coach specialization ID
 * @param dailyFocus - Optional daily focus theme (defaults to today's)
 * @param coachMemories - Optional array of coach memory entries
 * @returns Complete system prompt string
 */
export function buildEnhancedSystemPrompt(
    context: UserContext | null,
    coachId?: string,
    dailyFocus?: FocusTheme,
    coachMemories?: any[]
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
    const userName = context?.preferences?.displayName || 'there';

    // Role description -- goal-specific coaches get a richer prompt via buildGoalCoachPrompt()
    const roleDescription = `You are ${aiName}, a personal development coach specializing in habit formation, goal achievement, and holistic transformation.`;

    // Get tone and rude mode instructions
    const toneDescription = getToneDescription(personalization.tonePreference);
    const rudeModeInstructions = getRudeModeInstructions(personalization.rudeMode);

    // Build the prompt
    let prompt = `${roleDescription}

== COACHING METHODOLOGY ==
You practice motivational interviewing and Socratic coaching:
- Ask questions before giving answers. Help the user discover their own solutions.
- Reflect the user's own words back to them to show you're listening.
- Celebrate SPECIFIC progress ("You completed 3 challenges this week" not "Great job!").
- Match the user's energy level. Brief questions get brief answers. Deep sharing gets thoughtful responses.
- One clear question or suggestion per message. Don't overwhelm with multiple asks.
- If the user seems frustrated or stuck, acknowledge the emotion before problem-solving.

== THINGS TO NEVER DO ==
- Do not lecture or give unsolicited multi-paragraph advice
- Do not say "That's great!" or "Well done!" without naming what specifically is great
- Do not list generic tips the user could find on a search engine
- Do not assume you know how the user feels -- ask instead
- Do not repeat the same advice if the user hasn't acted on it previously
- Do not ignore what the user said to push your own agenda or today's focus theme
- Do not use excessive formatting (keep markdown minimal, prefer natural prose)

== CONVERSATIONAL STYLE ==
${toneDescription}
- Use ${userName}'s name occasionally, not every message
- Keep responses to 2-4 paragraphs max unless depth is genuinely needed
- End with a single focused question or actionable next step when appropriate
${rudeModeInstructions}
== TODAY'S FOCUS: ${focus.name.toUpperCase()} ==
${focus.prompt}
Weave this theme in naturally when relevant. Never force it.

== INTERACTIVE WIDGETS ==
Trigger widgets for actionable items. Output on a separate line:
<<<{"type": "WIDGET_TYPE", "payload": { ... }}>>>

Available:
1. suggest_challenge -- when suggesting a challenge: <<<{"type": "suggest_challenge", "payload": {"title": "...", "description": "Brief description", "difficulty": 5, "isRealityShift": false}}>>>
2. check_in -- when asking about mood/energy/motivation: <<<{"type": "check_in", "payload": {}}>>>
3. create_goal -- when user expresses a goal intention: <<<{"type": "create_goal", "payload": {"title": "...", "domainId": 1}}>>>
   domainId: 1=Languages, 2=Mobility, 3=Emotional Growth, 4=Relationships, 5=Physical Health, 6=Tolerance, 7=Skills, 8=Habits
4. create_habit -- when user wants to build a routine: <<<{"type": "create_habit", "payload": {"name": "...", "frequency": "daily"}}>>>
5. progress_snapshot -- when discussing progress or highlighting stats: <<<{"type": "progress_snapshot", "payload": {"streak": N, "challengesCompleted": N, "totalChallenges": N, "avgMood": N, "habitCompletionRate": N}}>>>
   Fill values from the USER PROFILE section above.
6. web_research -- when the user asks a factual question you should look up: <<<{"type": "web_research", "payload": {"query": "concise search query"}}>>>
   Use when user asks about science, techniques, best practices, or anything that benefits from current sources. Write a focused search query.
Only use widgets when contextually relevant, not proactively.
`;

    // Add coach memory if available
    if (coachMemories && coachMemories.length > 0) {
        prompt += `\n== COACH MEMORY (from previous conversations) ==\n`;
        prompt += `You remember these insights from past sessions with ${userName}:\n`;
        coachMemories.slice(-10).forEach((m: any) => {
            prompt += `- [${m.type}] ${m.content}\n`;
        });
        prompt += `Use these naturally. Reference past insights when relevant. Don't list them back to the user.\n`;
    }

    // Add user context if available
    if (context) {
        prompt += `\n== USER PROFILE ==\n`;
        prompt += `Name: ${userName}\n`;
        prompt += `Day on platform: ${context.dayInJourney}\n`;
        prompt += `Current streak: ${context.streak} days\n`;
        prompt += `Challenges completed: ${context.completedChallengesCount} of ${context.totalChallenges}\n`;
        if (context.avgMood) prompt += `Average mood (7 days): ${context.avgMood}/10\n`;
        if (context.preferences?.preferredDifficulty) {
            prompt += `Preferred difficulty: ${context.preferences.preferredDifficulty}/10\n`;
        }
        if (context.preferences?.focusAreas?.length > 0) {
            prompt += `Focus areas: ${context.preferences.focusAreas.join(', ')}\n`;
        }
        if (context.preferences?.avoidAreas?.length > 0) {
            prompt += `Topics to AVOID: ${context.preferences.avoidAreas.join(', ')}\n`;
        }
        if (context.preferences?.preferredChallengeTime && context.preferences.preferredChallengeTime !== 'anytime') {
            prompt += `Preferred challenge time: ${context.preferences.preferredChallengeTime}\n`;
        }
        if (context.preferences?.realityShiftEnabled) {
            prompt += `Reality Shift mode: ON (user welcomes extreme challenges)\n`;
        }
        if (context.preferences?.includeScientificBasis) {
            prompt += `Prefers scientific explanations and evidence-based reasoning\n`;
        }

        if (context.onboardingAnswers) {
            prompt += `\n== USER BACKGROUND ==\n`;
            if (context.onboardingAnswers.motivation) {
                prompt += `Motivation: "${context.onboardingAnswers.motivation}"\n`;
            }
            if (context.onboardingAnswers.currentSituation) {
                prompt += `Starting point: "${context.onboardingAnswers.currentSituation}"\n`;
            }
            if (context.onboardingAnswers.biggestChallenge) {
                prompt += `Biggest challenge: "${context.onboardingAnswers.biggestChallenge}"\n`;
            }
        }

        if (context.allActiveGoals && context.allActiveGoals.length > 0) {
            prompt += `\n== ACTIVE GOALS (${context.allActiveGoals.length}) ==\n`;
            context.allActiveGoals.forEach((goal: any, index: number) => {
                const dayInJourney = Math.ceil((Date.now() - new Date(goal.startedAt).getTime()) / (1000 * 60 * 60 * 24));
                prompt += `${index + 1}. "${goal.title}" (${goal.domain?.name || 'General'}, Day ${dayInJourney}/30)\n`;
                prompt += `   From: "${goal.currentState || 'Not specified'}" -> To: "${goal.desiredState || 'Not specified'}"\n`;
            });
            prompt += `Primary: "${context.activeGoal?.title || context.allActiveGoals[0].title}"\n`;
        } else {
            prompt += `\nNo active goals. Encourage setting one using the create_goal widget.\n`;
        }

        // Recent 3 days of context (not all-time)
        prompt += `\n== RECENT CONTEXT (last 3 days) ==\n`;

        if (context.todayChallenge) {
            prompt += `Today's challenge: "${context.todayChallenge.title}" (${context.todayChallenge.status}, difficulty ${context.todayChallenge.difficulty}/10)\n`;
        }

        if (context.recentChallenges && context.recentChallenges.length > 0) {
            prompt += `Recent challenges:\n`;
            context.recentChallenges.slice(0, 3).forEach((c: any) => {
                prompt += `- "${c.title}" (${c.status}, difficulty ${c.difficulty}/10)\n`;
            });
        }

        if (context.recentSurveys && context.recentSurveys.length > 0) {
            prompt += `Recent check-ins:\n`;
            context.recentSurveys.slice(0, 3).forEach((s: any) => {
                const date = new Date(s.surveyDate).toLocaleDateString();
                prompt += `- [${date}] Energy: ${s.energyLevel}/10, Motivation: ${s.motivationLevel}/10, Mood: ${s.overallMood}/10\n`;
                if (s.biggestWin) prompt += `  Win: "${s.biggestWin}"\n`;
                if (s.biggestBlocker) prompt += `  Blocker: "${s.biggestBlocker}"\n`;
            });
        }

        if (context.recentDiary && context.recentDiary.length > 0) {
            prompt += `Recent diary entries:\n`;
            context.recentDiary.slice(0, 2).forEach((e: any) => {
                const date = new Date(e.createdAt).toLocaleDateString();
                let title = 'Untitled';
                try {
                    const parsed = JSON.parse(e.aiInsights || '{}');
                    if (parsed.title) title = parsed.title;
                } catch { /* ignore */ }
                const excerpt = e.transcript
                    ? (e.transcript.length > 300 ? e.transcript.substring(0, 300) + '...' : e.transcript)
                    : '';
                prompt += `- [${date}] "${title}": ${e.aiSummary || excerpt}\n`;
            });
        }

        if (context.habitStats && context.habitStats.totalHabits > 0) {
            prompt += `Habits (${context.habitStats.completedToday}/${context.habitStats.totalHabits} today, ${context.habitStats.weeklyCompletionRate}% weekly):\n`;
            context.habitStats.habits.forEach((h: any) => {
                const todayLog = context.todayHabitLogs?.find((l: any) => l.habitId === h.id);
                const status = todayLog?.completed ? 'done' : 'pending';
                const streakText = h.streak > 0 ? ` (${h.streak}-day streak)` : '';
                prompt += `- "${h.name}" [${status}]${streakText}\n`;
            });
        }
    }

    return prompt;
}

/**
 * Build challenge feedback context from recent challenge logs.
 * Used to make challenge generation smarter by learning from past performance.
 *
 * @param logs - Recent challenge logs with challenge data
 * @returns Formatted feedback string for the generation prompt, or empty string
 */
export function buildChallengeFeedbackContext(logs: any[]): string {
    if (!logs || logs.length === 0) return '';

    const withDifficulty = logs.filter((l: any) => l.difficultyFelt != null);
    const withSatisfaction = logs.filter((l: any) => l.satisfaction != null);

    if (withDifficulty.length === 0 && withSatisfaction.length === 0) return '';

    let feedback = '\n== USER CHALLENGE FEEDBACK ==\n';

    if (withDifficulty.length > 0) {
        const avgFelt = withDifficulty.reduce((sum: number, l: any) => sum + l.difficultyFelt, 0) / withDifficulty.length;
        const avgAssigned = withDifficulty
            .filter((l: any) => l.challenge?.difficulty != null)
            .reduce((sum: number, l: any, _: number, arr: any[]) => sum + l.challenge.difficulty / arr.length, 0);

        feedback += `Perceived difficulty: ${avgFelt.toFixed(1)}/10 (assigned avg: ${avgAssigned.toFixed(1)}/10)\n`;

        if (avgFelt > avgAssigned + 1.5) {
            feedback += `-> Challenges feel HARDER than rated. Consider slightly lower difficulty.\n`;
        } else if (avgFelt < avgAssigned - 1.5) {
            feedback += `-> Challenges feel EASIER than rated. Can increase difficulty.\n`;
        }
    }

    if (withSatisfaction.length > 0) {
        const avgSat = withSatisfaction.reduce((sum: number, l: any) => sum + l.satisfaction, 0) / withSatisfaction.length;
        feedback += `Average enjoyment: ${avgSat.toFixed(1)}/10\n`;

        // Find high and low satisfaction challenge types
        const typeScores: Record<string, { total: number; count: number }> = {};
        withSatisfaction.forEach((l: any) => {
            const type = l.challenge?.personalizationNotes || 'unknown';
            if (!typeScores[type]) typeScores[type] = { total: 0, count: 0 };
            typeScores[type].total += l.satisfaction;
            typeScores[type].count += 1;
        });

        const typeAvgs = Object.entries(typeScores)
            .map(([type, data]) => ({ type, avg: data.total / data.count }))
            .filter(t => t.type !== 'unknown')
            .sort((a, b) => b.avg - a.avg);

        if (typeAvgs.length > 0) {
            const best = typeAvgs[0];
            feedback += `Highest enjoyment type: ${best.type} (${best.avg.toFixed(1)}/10)\n`;
            if (typeAvgs.length > 1) {
                const worst = typeAvgs[typeAvgs.length - 1];
                feedback += `Lowest enjoyment type: ${worst.type} (${worst.avg.toFixed(1)}/10)\n`;
            }
        }
    }

    // Include recent notes for qualitative feedback
    const recentNotes = logs
        .filter((l: any) => l.notes && l.notes.trim().length > 0)
        .slice(0, 3)
        .map((l: any) => `"${l.notes.trim().substring(0, 100)}"`);

    if (recentNotes.length > 0) {
        feedback += `Recent user notes: ${recentNotes.join(', ')}\n`;
    }

    return feedback;
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
