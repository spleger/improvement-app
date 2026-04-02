import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ANTHROPIC_MODEL } from '@/lib/anthropic';

const ANTHROPIC_API_KEY_RAW = process.env.ANTHROPIC_API_KEY;
// Sanitize: strip quotes and whitespace
const ANTHROPIC_API_KEY = ANTHROPIC_API_KEY_RAW?.replace(/^["']|["']$/g, '').trim();

const SYSTEM_PROMPT = `You are an expert personal transformation coach and challenge designer. 
Your goal is to create highly personalized, actionable daily challenges that push the user toward their specific goals.

### RESPONSE FORMAT
You must response with valid JSON only. Do not include any introductory text, markdown formatting, or explanations outside the JSON.
The response must be a JSON Array of challenge objects.

### CHALLENGE STRUCTURE
Each challenge object in the array must have:
{
  "title": "Short, action-oriented title (max 50 chars)",
  "description": "2-3 sentence description of what to do",
  "instructions": "Step-by-step how to complete this challenge",
  "difficulty": number (1-10),
  "isRealityShift": boolean,
  "successCriteria": "Clear, measurable success criteria",
  "scientificBasis": "Brief explanation of why this works (1 sentence)",
  "estimatedMinutes": number,
  "tips": ["3 personalized tips that reference the user's specific history, patterns, or recent activity. Do NOT give generic advice like 'stay hydrated' or 'be consistent'. Instead reference what you know: their diary entries, past challenge feedback, habit patterns, or coach conversations."]
}

### DESIGN PRINCIPLES
1. **Specific & Actionable**: Avoid vague advice ("practice more"). Give concrete tasks ("Write 300 words", "Do 5 sets").
2. **Freshness**: Do not repeat recent challenges.
3. **Adaptive Difficulty**:
   - If user finds things easy (>7/10 completion or <4/10 difficulty felt), increase intensity.
   - If user finds things hard (>7/10 difficulty felt), focus on smaller, manageable wins.
4. **Phase Alignment**:
   - Days 1-5: Foundation (Habit building)
   - Days 6-15: Growth (Pushing boundaries)
   - Days 16-25: Acceleration (High intensity)
   - Days 26+: Mastery (Peak performance)
5. **Personalized Tips**: Each tip must reference something specific from the user's data:
   - What they said in diary entries or to their coach
   - Patterns in their challenge feedback (what they find hard/easy/satisfying)
   - Their habit completion patterns and streaks
   - Their recent mood/energy/stress trends
   - Their stated motivation and biggest challenges from onboarding
   Never generate tips that could apply to any user. Every tip should feel like it was written for THIS person.
`;

async function getFullUserContext(userId: string, goalId?: string) {
    try {
        // Get specific goal or active goal
        let goal;
        if (goalId) {
            goal = await db.getGoalById(goalId);
        } else {
            // If no goalId provided, try to find an active goal
            // If none exists, we'll generate general (non-goal) challenges
            goal = await db.getActiveGoalByUserId(userId);
        }

        // Get all challenges for this goal (or general challenges if no goal)
        const allChallengesData = await prisma.challenge.findMany({
            where: goal ? { goalId: goal.id } : { userId, goalId: null },
            include: { logs: true },
            orderBy: { scheduledDate: 'desc' },
        });

        // Flatten logic to match previous structure (attaching log data to challenge)
        const allChallenges = allChallengesData.map(c => {
            const log = c.logs[0]; // Assuming most recent log if multiple
            return {
                ...c,
                difficultyFelt: log?.difficultyFelt,
                satisfaction: log?.satisfaction,
                completionNotes: log?.notes
            };
        });

        const completedChallenges = allChallenges.filter(c => c.status === 'completed');
        const skippedChallenges = allChallenges.filter(c => c.status === 'skipped');

        // Calculate day in journey
        const dayInJourney = goal
            ? Math.ceil((Date.now() - new Date(goal.startedAt).getTime()) / (1000 * 60 * 60 * 24))
            : 1;

        // Get recent surveys for mood/energy patterns
        const surveys = await db.getSurveysByUserId(userId, 7);

        // Calculate average difficulty felt (to adapt)
        const avgDifficultyFelt = completedChallenges.length > 0
            ? completedChallenges
                .filter(c => c.difficultyFelt !== null && c.difficultyFelt !== undefined)
                .reduce((sum, c) => sum + (c.difficultyFelt || 5), 0) /
            Math.max(completedChallenges.filter(c => c.difficultyFelt !== null && c.difficultyFelt !== undefined).length, 1)
            : 5;

        // Calculate satisfaction trend
        const avgSatisfaction = completedChallenges.length > 0
            ? completedChallenges
                .filter(c => c.satisfaction !== null && c.satisfaction !== undefined)
                .reduce((sum, c) => sum + (c.satisfaction || 5), 0) /
            Math.max(completedChallenges.filter(c => c.satisfaction !== null && c.satisfaction !== undefined).length, 1)
            : 5;

        // Get user's streak
        const streak = await db.calculateStreak(userId);

        // Get mood patterns
        const avgMood = surveys.length > 0
            ? Math.round(surveys.reduce((sum, s) => sum + s.overallMood, 0) / surveys.length * 10) / 10
            : null;

        const avgEnergy = surveys.length > 0
            ? Math.round(surveys.reduce((sum, s) => sum + s.energyLevel, 0) / surveys.length * 10) / 10
            : null;

        // Fetch enrichment data in parallel
        const [
            preferences,
            diaryEntries,
            habitStats,
            recentChatMessages,
            userData,
        ] = await Promise.all([
            db.getUserPreferences(userId),
            db.getDiaryEntriesByUserId(userId, 10),
            db.getHabitStats(userId, 7),
            db.getRecentChatMessagesByUser(userId, 3),
            prisma.user.findUnique({ where: { id: userId }, select: { onboardingData: true } }),
        ]);

        // Parse onboarding answers
        let onboardingAnswers: Record<string, string> | null = null;
        if (userData?.onboardingData) {
            try {
                const parsed = JSON.parse(userData.onboardingData);
                onboardingAnswers = parsed?.answers || null;
            } catch { /* ignore malformed JSON */ }
        }

        // Filter diary entries to last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentDiary = diaryEntries.filter(d => new Date(d.createdAt) >= sevenDaysAgo);

        return {
            goal: goal || null,
            dayInJourney,
            totalDays: goal ? 30 : 0,
            completedCount: completedChallenges.length,
            skippedCount: skippedChallenges.length,
            streak,
            avgDifficultyFelt: Math.round(avgDifficultyFelt * 10) / 10,
            avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
            avgMood,
            avgEnergy,
            recentChallenges: allChallenges.slice(0, 5),
            allChallenges,
            completionNotes: completedChallenges
                .filter(c => c.completionNotes)
                .slice(0, 3)
                .map(c => c.completionNotes),
            preferences,
            surveys,
            recentDiary,
            habitStats,
            recentChatMessages,
            onboardingAnswers,
        };
    } catch (error) {
        console.error('Error getting user context:', error);
        return null;
    }
}

function buildUserContextMessage(context: any, preferences?: { count?: number; focusArea?: string }) {
    const count = preferences?.count || 1;

    // Build onboarding section
    let onboardingSection = '';
    if (context.onboardingAnswers) {
        const a = context.onboardingAnswers;
        const lines: string[] = [];
        if (a.motivation) lines.push(`Motivation: "${a.motivation}"`);
        if (a.currentSituation || a.startingPoint) lines.push(`Starting point: "${a.currentSituation || a.startingPoint}"`);
        if (a.biggestChallenge) lines.push(`Biggest challenge: "${a.biggestChallenge}"`);
        if (a.priorExperience) lines.push(`Prior experience: "${a.priorExperience}"`);
        if (lines.length > 0) {
            onboardingSection = `\n=== USER BACKGROUND (from onboarding) ===\n${lines.join('\n')}\n`;
        }
    }

    // Build all-time challenge history
    const allChallengesSection = context.allChallenges?.length > 0
        ? `\n=== ALL PAST CHALLENGES (complete history) ===\n${context.allChallenges.map((c: any) => {
            const parts = [`"${c.title}"`, c.status];
            if (c.difficulty) parts.push(`assigned:${c.difficulty}`);
            if (c.difficultyFelt != null) parts.push(`felt:${c.difficultyFelt}`);
            if (c.satisfaction != null) parts.push(`satisfaction:${c.satisfaction}`);
            if (c.completionNotes) parts.push(`notes: "${c.completionNotes}"`);
            if (c.status === 'skipped' && c.skippedReason) parts.push(`reason: "${c.skippedReason}"`);
            return `- ${parts.join(' | ')}`;
        }).join('\n')}\n`
        : '';

    // Build recent surveys section (full detail)
    const surveysSection = context.surveys?.length > 0
        ? `\n=== RECENT CHECK-INS (last 7 days) ===\n${context.surveys.map((s: any) => {
            const date = new Date(s.surveyDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const parts = [`Mood:${s.overallMood}`, `Energy:${s.energyLevel}`];
            if (s.stressLevel != null) parts.push(`Stress:${s.stressLevel}`);
            if (s.sleepQuality != null) parts.push(`Sleep:${s.sleepQuality}`);
            let line = `- [${date}] ${parts.join(' ')}`;
            if (s.biggestWin) line += ` | Win: "${s.biggestWin}"`;
            if (s.biggestBlocker) line += ` | Blocker: "${s.biggestBlocker}"`;
            return line;
        }).join('\n')}\n`
        : '';

    // Build diary section (AI summaries only)
    const diarySection = context.recentDiary?.length > 0
        ? `\n=== RECENT DIARY (last 7 days, AI summaries) ===\n${context.recentDiary
            .filter((d: any) => d.aiSummary)
            .map((d: any) => {
                const date = new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return `- [${date}] "${d.aiSummary}"`;
            }).join('\n')}\n`
        : '';

    // Build habit patterns section
    let habitSection = '';
    if (context.habitStats?.habits?.length > 0) {
        const hs = context.habitStats;
        const habitLines = hs.habits.map((h: any) => {
            const completedDays = hs.habits.length > 0 ? Math.round((hs.weeklyCompletionRate / 100) * 7) : 0;
            const streakStr = h.streak > 0 ? `${h.streak}-day streak` : 'no streak';
            return `- "${h.name}" [${streakStr}]`;
        }).join('\n');
        habitSection = `\n=== HABIT PATTERNS (last 7 days) ===\nCompletion rate: ${hs.weeklyCompletionRate}%\n${habitLines}\n`;
    }

    // Build coach conversations section
    const chatSection = context.recentChatMessages?.length > 0
        ? `\n=== WHAT USER IS DISCUSSING WITH COACHES ===\n${context.recentChatMessages.map((c: any) =>
            `- ${c.coachName}: ${c.messages.map((m: string) => `"${m}"`).join(', ')}`
        ).join('\n')}\n`
        : '';

    // Goal section: either specific goal or general daily growth
    const goalSection = context.goal
        ? `=== USER'S GOAL ===
Title: "${context.goal.title}"
Domain: ${context.goal.domain?.name || 'General'}
Current State: "${context.goal.currentState || 'Not specified'}"
Desired State: "${context.goal.desiredState || 'Not specified'}"
Goal Difficulty Setting: ${context.goal.difficultyLevel}/10
User Default Difficulty: ${context.preferences?.preferredDifficulty || 5}/10
${context.goal.difficultyLevel === 5 && context.preferences?.preferredDifficulty && context.preferences.preferredDifficulty !== 5 ? '(Goal uses default -- use user preference instead)\n' : ''}Reality Shift Mode: ${(context.goal.realityShiftEnabled || context.preferences?.realityShiftEnabled) ? 'ON (user wants extreme, life-changing challenges)' : 'OFF'}`
        : `=== GENERAL DAILY GROWTH ===
This is a general growth challenge NOT tied to a specific goal.
Generate a well-rounded personal development challenge.
Difficulty: ${context.preferences?.preferredDifficulty || 5}/10
Reality Shift Mode: ${context.preferences?.realityShiftEnabled ? 'ON (user wants extreme, life-changing challenges)' : 'OFF'}`;

    const realityShift = context.goal
        ? (context.goal.realityShiftEnabled || context.preferences?.realityShiftEnabled)
        : context.preferences?.realityShiftEnabled;

    return `
${goalSection}
${onboardingSection}
${context.goal ? `=== JOURNEY PROGRESS ===
Day ${context.dayInJourney} of ${context.totalDays}
Challenges completed: ${context.completedCount}
Challenges skipped: ${context.skippedCount}
Current streak: ${context.streak} days` : `=== PROGRESS ===
General challenges completed: ${context.completedCount}
Current streak: ${context.streak} days`}

=== ADAPTATION DATA ===
Average difficulty felt by user: ${context.avgDifficultyFelt}/10
Average satisfaction after challenges: ${context.avgSatisfaction}/10
${context.avgMood ? `Average mood: ${context.avgMood}/10` : ''}
${context.avgEnergy ? `Average energy: ${context.avgEnergy}/10` : ''}
${allChallengesSection}${surveysSection}${diarySection}${habitSection}${chatSection}
${context.preferences?.focusAreas && context.preferences.focusAreas.length > 0 ? `
=== USER FOCUS AREAS ===
The user wants challenges that focus on: ${context.preferences.focusAreas.join(', ')}. Prioritize these topics.
` : ''}
${context.preferences?.avoidAreas && context.preferences.avoidAreas.length > 0 ? `
=== AREAS TO AVOID ===
Do NOT generate challenges involving: ${context.preferences.avoidAreas.join(', ')}. Never include these topics.
` : ''}
${context.preferences?.aiPersonality ? `
=== COMMUNICATION STYLE ===
Adapt challenge descriptions to a ${context.preferences.aiPersonality} tone.
` : ''}
${context.preferences?.includeScientificBasis ? `
=== SCIENTIFIC BASIS ===
The user wants scientific explanations. Include thorough scientificBasis fields referencing real research or evidence-based principles.
` : ''}
${context.preferences?.challengeLengthPreference ? `
=== CHALLENGE LENGTH ===
User prefers ${context.preferences.challengeLengthPreference} challenges (${context.preferences.challengeLengthPreference === 'short' ? '5-15 min' : context.preferences.challengeLengthPreference === 'medium' ? '15-30 min' : '30+ min'}). Set estimatedMinutes accordingly.
` : ''}
${context.preferences?.preferredChallengeTime && context.preferences.preferredChallengeTime !== 'anytime' ? `
=== PREFERRED TIME ===
User prefers ${context.preferences.preferredChallengeTime} challenges. Design challenges suitable for ${context.preferences.preferredChallengeTime} time (${context.preferences.preferredChallengeTime === 'morning' ? 'energizing, can be done before work' : context.preferences.preferredChallengeTime === 'afternoon' ? 'can be done during breaks or midday' : 'reflective, wind-down friendly'}).
` : ''}
=== REQUEST ===
Generate ${count} unique, personalized challenge${count > 1 ? 's' : ''} for today${context.goal ? ` (Day ${context.dayInJourney})` : ''}.
${preferences?.focusArea ? `User specifically wants to focus on: ${preferences.focusArea}` : ''}
${realityShift ? 'INCLUDE AT LEAST ONE "REALITY SHIFT" CHALLENGE (Something scary/uncomfortable that drives massive growth).' : ''}
`;
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use the sanitized key from the top level
        const apiKey = ANTHROPIC_API_KEY;

        const body = await request.json();
        const { goalId, count = 1, focusArea } = body;

        // Get full user context
        const context = await getFullUserContext(user.userId, goalId);

        if (!context) {
            return NextResponse.json(
                { success: false, error: 'Failed to build challenge context.' },
                { status: 400 }
            );
        }

        // Build the prompt
        const userMessage = buildUserContextMessage(context, { count, focusArea });

        try {
            // Call Claude to generate challenges
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey || '',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: ANTHROPIC_MODEL,
                    max_tokens: 1500,
                    system: SYSTEM_PROMPT,
                    messages: [{ role: 'user', content: userMessage }]
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Claude API error: ${response.status} - ${errorData}`);
            }

            const data = await response.json();
            const responseText = data.content[0]?.text || '';

            // Parse the JSON response
            let challenges;
            try {
                // Robust extraction: locate the first '[' and last ']'
                const startIndex = responseText.indexOf('[');
                const endIndex = responseText.lastIndexOf(']');

                if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                    const jsonString = responseText.substring(startIndex, endIndex + 1);
                    challenges = JSON.parse(jsonString);
                } else {
                    // Try to parse the whole thing if no array brackets found (maybe it returned a single object wrapped?)
                    // Or just throw
                    throw new Error('No JSON array found in response');
                }

                if (!Array.isArray(challenges)) {
                    throw new Error('Response is not an array');
                }

            } catch (parseError) {
                console.error('Failed to parse Claude response:', responseText);
                throw new Error('Failed to parse AI response');
            }

            // Save challenges to database
            const savedChallenges = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (const challenge of challenges) {
                const saved = await db.createChallenge({
                    userId: user.userId,
                    goalId: context.goal?.id,
                    title: challenge.title,
                    description: challenge.description,
                    difficulty: challenge.difficulty,
                    isRealityShift: challenge.isRealityShift || false,
                    scheduledDate: today,
                    tips: Array.isArray(challenge.tips) ? challenge.tips : [],
                    instructions: challenge.instructions,
                    successCriteria: challenge.successCriteria,
                    personalizationNotes: `${challenge.instructions}\n\nWhy this works: ${challenge.scientificBasis}\n\nSuccess: ${challenge.successCriteria}`
                });
                savedChallenges.push(saved);
            }

            return NextResponse.json({
                success: true,
                data: {
                    challenges: savedChallenges,
                    context: {
                        day: context.dayInJourney,
                        adaptedDifficulty: context.avgDifficultyFelt,
                        isGeneral: !context.goal,
                    }
                }
            });

        } catch (aiError) {
            console.error('AI generation failed:', aiError);

            // Fallback: Create a simple challenge based on context
            const errorMsg = aiError instanceof Error ? aiError.message : String(aiError);
            console.error('Challenge generation fallback triggered:', errorMsg);

            const fallbackChallenge = await db.createChallenge({
                userId: user.userId,
                goalId: context.goal?.id,
                title: context.goal ? `Day ${context.dayInJourney} Focus` : 'Daily Growth Focus',
                description: context.goal
                    ? `Spend 15-20 minutes working toward your goal: ${context.goal.title}. Reflect on what progress you can make today.`
                    : 'Spend 15-20 minutes on personal growth. Try something new or reflect on an area you want to improve.',
                difficulty: 3,
                isRealityShift: false,
                scheduledDate: new Date(),
                personalizationNotes: `Fallback challenge (AI temporarily unavailable).`
            });

            return NextResponse.json({
                success: true,
                data: {
                    challenges: [fallbackChallenge],
                    fallback: true
                }
            });
        }

    } catch (error) {
        console.error('Error generating challenge:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
