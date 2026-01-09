import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const ANTHROPIC_API_KEY_RAW = process.env.ANTHROPIC_API_KEY;
// Sanitize: strip quotes and whitespace
const ANTHROPIC_API_KEY = ANTHROPIC_API_KEY_RAW?.replace(/^["']|["']$/g, '').trim();

if (ANTHROPIC_API_KEY) {
    const masked = `${ANTHROPIC_API_KEY.slice(0, 7)}...${ANTHROPIC_API_KEY.slice(-4)}`;
    console.log(`[API] Anthropic Key Loaded: ${masked} (Length: ${ANTHROPIC_API_KEY.length})`);
} else {
    console.warn('[API] ANTHROPIC_API_KEY is missing');
}

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
  "estimatedMinutes": number
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
`;

async function getFullUserContext(userId: string, goalId?: string) {
    try {
        // Get specific goal or active goal
        let goal;
        if (goalId) {
            goal = await db.getGoalById(goalId);
        } else {
            goal = await db.getActiveGoalByUserId(userId);
        }

        if (!goal) return null;

        // Get all challenges for this goal
        const allChallenges = await pool.query(
            `SELECT c.*, cl."difficultyFelt", cl.satisfaction, cl.notes as "completionNotes"
       FROM "Challenge" c
       LEFT JOIN "ChallengeLog" cl ON c.id = cl."challengeId"
       WHERE c."goalId" = $1
       ORDER BY c."scheduledDate" DESC`,
            [goal.id]
        );

        const completedChallenges = allChallenges.rows.filter(c => c.status === 'completed');
        const skippedChallenges = allChallenges.rows.filter(c => c.status === 'skipped');

        // Calculate day in journey
        const dayInJourney = Math.ceil(
            (Date.now() - new Date(goal.startedAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Get recent surveys for mood/energy patterns
        const surveys = await db.getSurveysByUserId(userId, 7);

        // Calculate average difficulty felt (to adapt)
        const avgDifficultyFelt = completedChallenges.length > 0
            ? completedChallenges
                .filter(c => c.difficultyFelt !== null)
                .reduce((sum, c) => sum + (c.difficultyFelt || 5), 0) /
            Math.max(completedChallenges.filter(c => c.difficultyFelt !== null).length, 1)
            : 5;

        // Calculate satisfaction trend
        const avgSatisfaction = completedChallenges.length > 0
            ? completedChallenges
                .filter(c => c.satisfaction !== null)
                .reduce((sum, c) => sum + (c.satisfaction || 5), 0) /
            Math.max(completedChallenges.filter(c => c.satisfaction !== null).length, 1)
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

        return {
            goal,
            dayInJourney,
            totalDays: 30,
            completedCount: completedChallenges.length,
            skippedCount: skippedChallenges.length,
            streak,
            avgDifficultyFelt: Math.round(avgDifficultyFelt * 10) / 10,
            avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
            avgMood,
            avgEnergy,
            recentChallenges: allChallenges.rows.slice(0, 5),
            completionNotes: completedChallenges
                .filter(c => c.completionNotes)
                .slice(0, 3)
                .map(c => c.completionNotes)
        };
    } catch (error) {
        console.error('Error getting user context:', error);
        return null;
    }
}

function buildUserContextMessage(context: any, preferences?: { count?: number; focusArea?: string }) {
    const count = preferences?.count || 1;

    return `
=== USER'S GOAL ===
Title: "${context.goal.title}"
Domain: ${context.goal.domain?.name || 'General'}
Current State: "${context.goal.currentState || 'Not specified'}"
Desired State: "${context.goal.desiredState || 'Not specified'}"
Preferred Difficulty: ${context.goal.difficultyLevel}/10
Reality Shift Mode: ${context.goal.realityShiftEnabled ? 'ON (user wants extreme, life-changing challenges)' : 'OFF'}

=== JOURNEY PROGRESS ===
Day ${context.dayInJourney} of ${context.totalDays}
Challenges completed: ${context.completedCount}
Challenges skipped: ${context.skippedCount}
Current streak: ${context.streak} days

=== ADAPTATION DATA ===
Average difficulty felt by user: ${context.avgDifficultyFelt}/10
Average satisfaction after challenges: ${context.avgSatisfaction}/10
${context.avgMood ? `Average mood: ${context.avgMood}/10` : ''}
${context.avgEnergy ? `Average energy: ${context.avgEnergy}/10` : ''}

=== RECENT CHALLENGES (Do NOT repeat these) ===
${context.recentChallenges.slice(0, 5).map((c: any) =>
        `- "${c.title}" (${c.status}, difficulty ${c.difficulty}/10)`
    ).join('\n') || 'No recent challenges'}

${context.completionNotes.length > 0 ? `
=== USER NOTES (What they liked/struggled with) ===
${context.completionNotes.map((n: string) => `- "${n}"`).join('\n')}
` : ''}

=== REQUEST ===
Generate ${count} unique, personalized challenge${count > 1 ? 's' : ''} for today (Day ${context.dayInJourney}).
${preferences?.focusArea ? `User specifically wants to focus on: ${preferences.focusArea}` : ''}
${context.goal.realityShiftEnabled ? 'INCLUDE AT LEAST ONE "REALITY SHIFT" CHALLENGE (Something scary/uncomfortable that drives massive growth).' : ''}
`;
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // --- ROBUST ENV LOADING ---
        let apiKey = process.env.ANTHROPIC_API_KEY?.replace(/^["']|["']$/g, '').trim();

        if (!apiKey) {
            try {
                const fs = require('fs');
                const path = require('path');
                const envPath = path.join(process.cwd(), '.env');
                if (fs.existsSync(envPath)) {
                    const envContent = fs.readFileSync(envPath, 'utf-8');
                    const match = envContent.match(/ANTHROPIC_API_KEY=["']?([^"'\n]+)["']?/);
                    if (match && match[1]) {
                        apiKey = match[1].trim();
                        console.log('[API] Recovered API key from .env file directly');
                    }
                }
            } catch (e) {
                console.error('[API] Failed to read .env file fallback:', e);
            }
        }
        // --------------------------

        const body = await request.json();
        const { goalId, count = 1, focusArea } = body;

        // Get full user context
        const context = await getFullUserContext(user.userId, goalId);

        if (!context) {
            return NextResponse.json(
                { success: false, error: 'No active goal found. Please create a goal first.' },
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
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 2500,
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
                    goalId: context.goal.id,
                    title: challenge.title,
                    description: challenge.description,
                    difficulty: challenge.difficulty,
                    isRealityShift: challenge.isRealityShift || false,
                    scheduledDate: today,
                    personalizationNotes: `${challenge.instructions}\n\n📚 Why this works: ${challenge.scientificBasis}\n\n✓ Success: ${challenge.successCriteria}`
                });
                savedChallenges.push(saved);
            }

            return NextResponse.json({
                success: true,
                data: {
                    challenges: savedChallenges,
                    context: {
                        day: context.dayInJourney,
                        adaptedDifficulty: context.avgDifficultyFelt
                    }
                }
            });

        } catch (aiError) {
            console.error('AI generation failed:', aiError);

            // DEBUG: Write error to file
            try {
                const fs = require('fs');
                const logMessage = `[${new Date().toISOString()}] FAILED. 
                API Key Present: ${!!ANTHROPIC_API_KEY}
                Error: ${aiError instanceof Error ? aiError.message : String(aiError)}
                Stack: ${aiError instanceof Error ? aiError.stack : 'No stack'}
                \n`;
                fs.appendFileSync('debug_challenges.log', logMessage);
            } catch (e) { console.error('Failed to write log', e); }

            // Fallback: Create a simple challenge based on context
            const errorMsg = aiError instanceof Error ? aiError.message : String(aiError);
            const keyInfo = ANTHROPIC_API_KEY ? `Key exists (len: ${ANTHROPIC_API_KEY.length})` : 'Key is MISSING';

            const fallbackChallenge = await db.createChallenge({
                userId: user.userId,
                goalId: context.goal.id,
                title: `Day ${context.dayInJourney} Focus`,
                description: `Spend 15-20 minutes focused on your goal: ${context.goal.title}. (Debug: ${errorMsg} | ${keyInfo})`,
                difficulty: 3,
                isRealityShift: false,
                scheduledDate: new Date(),
                personalizationNotes: `⚠️ NOTE: This is a fallback challenge because our AI coach is temporarily offline.\nError: ${errorMsg}\nDiagnostic: ${keyInfo}`
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
