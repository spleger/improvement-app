import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { pool } from '@/lib/db';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const DEMO_USER_ID = 'demo-user-001';

async function getFullUserContext(goalId?: string) {
    try {
        // Get specific goal or active goal
        let goal;
        if (goalId) {
            goal = await db.getGoalById(goalId);
        } else {
            goal = await db.getActiveGoalByUserId(DEMO_USER_ID);
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
        const surveys = await db.getSurveysByUserId(DEMO_USER_ID, 7);

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
        const streak = await db.calculateStreak(DEMO_USER_ID);

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

function buildChallengePrompt(context: any, preferences?: { count?: number; focusArea?: string }) {
    const count = preferences?.count || 1;

    return `You are an expert personal transformation coach and challenge designer. Your job is to create highly personalized, actionable daily challenges that push someone toward their goals.

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
Average difficulty felt by user: ${context.avgDifficultyFelt}/10 ${context.avgDifficultyFelt < 4 ? '(TOO EASY - increase difficulty!)' : context.avgDifficultyFelt > 7 ? '(TOO HARD - reduce difficulty!)' : '(Good level)'}
Average satisfaction after challenges: ${context.avgSatisfaction}/10
${context.avgMood ? `Average mood: ${context.avgMood}/10` : ''}
${context.avgEnergy ? `Average energy: ${context.avgEnergy}/10` : ''}

=== RECENT CHALLENGES (avoid repetition) ===
${context.recentChallenges.slice(0, 5).map((c: any) =>
        `- "${c.title}" (${c.status}, difficulty ${c.difficulty}/10)`
    ).join('\n') || 'No recent challenges'}

${context.completionNotes.length > 0 ? `
=== USER'S OWN NOTES FROM COMPLETED CHALLENGES ===
${context.completionNotes.map((n: string) => `- "${n}"`).join('\n')}
` : ''}

=== YOUR TASK ===
Generate ${count} unique, personalized challenge${count > 1 ? 's' : ''} for today.

${preferences?.focusArea ? `User specifically wants to focus on: ${preferences.focusArea}` : ''}

IMPORTANT GUIDELINES:
1. Challenges should be SPECIFIC and ACTIONABLE (not vague like "practice more")
2. Include clear success criteria
3. Consider the user's energy/mood patterns if available
4. AVOID repeating recent challenges - come up with fresh ideas
5. Scale difficulty based on:
   - Day in journey (early = easier, later = harder)
   - User's difficulty felt (if they say things are too easy, ramp up!)
   - Their completion rate

6. For day ${context.dayInJourney}/30:
   ${context.dayInJourney <= 5 ? '- Foundation building phase: Focus on small wins and building momentum' : ''}
   ${context.dayInJourney > 5 && context.dayInJourney <= 15 ? '- Growth phase: Push boundaries while maintaining consistency' : ''}
   ${context.dayInJourney > 15 && context.dayInJourney <= 25 ? '- Acceleration phase: Challenge comfort zone significantly' : ''}
   ${context.dayInJourney > 25 ? '- Mastery phase: Test their limits with peak challenges' : ''}

${context.goal.realityShiftEnabled ? `
7. REALITY SHIFT MODE IS ON: Include at least one challenge that feels uncomfortable or scary. These are life-changing moments!
` : ''}

Respond with a JSON array of challenge objects. Each challenge must have:
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

Respond ONLY with the JSON array, no other text.`;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { goalId, count = 1, focusArea } = body;

        // Get full user context
        const context = await getFullUserContext(goalId);

        if (!context) {
            return NextResponse.json(
                { success: false, error: 'No active goal found. Please create a goal first.' },
                { status: 400 }
            );
        }

        // Build the prompt
        const prompt = buildChallengePrompt(context, { count, focusArea });

        try {
            // Call Claude to generate challenges
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': ANTHROPIC_API_KEY || '',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 2000,
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            if (!response.ok) {
                throw new Error(`Claude API error: ${response.status}`);
            }

            const data = await response.json();
            const responseText = data.content[0]?.text || '';

            // Parse the JSON response
            let challenges;
            try {
                // Extract JSON from response (handle potential markdown code blocks)
                const jsonMatch = responseText.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    challenges = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON array found in response');
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
                    userId: DEMO_USER_ID,
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

            // Fallback: Create a simple challenge based on context
            const fallbackChallenge = await db.createChallenge({
                userId: DEMO_USER_ID,
                goalId: context.goal.id,
                title: `Day ${context.dayInJourney} Practice Session`,
                description: `Spend 15-20 minutes focused on your goal: ${context.goal.title}. Choose one specific aspect to work on.`,
                difficulty: Math.min(10, Math.max(1, Math.round(context.dayInJourney / 3) + 2)),
                isRealityShift: false,
                scheduledDate: new Date(),
                personalizationNotes: 'AI generation failed - this is a fallback challenge. Consistent daily practice builds lasting habits.'
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
