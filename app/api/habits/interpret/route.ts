import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const ANTHROPIC_API_KEY_RAW = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_KEY = ANTHROPIC_API_KEY_RAW?.replace(/^["']|["']$/g, '').trim();

export const dynamic = 'force-dynamic';

// Default timeout for AI interpretation API calls (30 seconds as per spec)
const INTERPRETATION_TIMEOUT_MS = 30000;

// POST /api/habits/interpret - AI interprets voice transcript and maps to habits
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { transcript } = body;

        if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
            return NextResponse.json({ success: false, error: 'Transcript is required' }, { status: 400 });
        }

        // Get user's habits
        const habits = await db.getHabitsByUserId(user.userId);

        if (habits.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    interpretedLogs: [],
                    message: 'No habits configured. Please create some habits first.'
                }
            });
        }

        // Build the prompt for Claude
        const habitsList = habits.map(h => `- "${h.name}" (ID: ${h.id})`).join('\n');

        const systemPrompt = `You are a habit tracking assistant. Your job is to analyze a user's voice transcript and determine which habits they completed or didn't complete.

The user has the following habits:
${habitsList}

Based on the transcript, output a JSON array of interpreted habit logs. For each habit mentioned (explicitly or implicitly), include:
- habitId: the ID from the list above
- habitName: the name of the habit
- completed: true if they did it, false if they skipped/missed it
- notes: any relevant context extracted from the transcript (e.g., "felt great", "was too tired", "did 20 minutes instead of 30")

ONLY include habits that are actually mentioned or clearly implied in the transcript. Do NOT include habits that weren't discussed.

If no habits are mentioned, return an empty array.

Output ONLY valid JSON, no markdown, no explanation. Format:
[{"habitId": "...", "habitName": "...", "completed": true/false, "notes": "..."}]`;

        const userMessage = `Here's what the user said about their habits today:\n\n"${transcript.trim()}"`;

        // Create AbortController for timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), INTERPRETATION_TIMEOUT_MS);

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': ANTHROPIC_API_KEY || '',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 1000,
                    system: systemPrompt,
                    messages: [{ role: 'user', content: userMessage }]
                }),
                signal: controller.signal
            });

            // Clear timeout on successful response
            clearTimeout(timeoutId);

            if (!response.ok) {
                console.error('Claude API error:', response.status);
                throw new Error(`Claude API error: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.content[0]?.text || '[]';

            // Parse the AI response
            let interpretedLogs = [];
            try {
                // Clean up the response (remove potential markdown code blocks)
                const cleaned = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
                interpretedLogs = JSON.parse(cleaned);
            } catch (parseError) {
                console.error('Failed to parse AI response:', aiResponse);
                // Fallback: return empty with error info
                return NextResponse.json({
                    success: true,
                    data: {
                        interpretedLogs: [],
                        rawResponse: aiResponse,
                        parseError: 'Failed to parse AI response, please log manually'
                    }
                });
            }

            // Validate that the habit IDs exist
            const validLogs = interpretedLogs.filter((log: any) =>
                habits.some(h => h.id === log.habitId)
            );

            return NextResponse.json({
                success: true,
                data: { interpretedLogs: validLogs }
            });

        } catch (aiError: unknown) {
            // Clear timeout on error
            clearTimeout(timeoutId);

            console.error('AI interpretation failed:', aiError);

            // Handle timeout errors specifically
            if (aiError instanceof Error && aiError.name === 'AbortError') {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'AI interpretation timed out. Please try again.',
                        errorType: 'timeout'
                    },
                    { status: 504 }
                );
            }

            // Fallback: Try simple keyword matching
            const fallbackLogs = habits.map(habit => {
                const nameLower = habit.name.toLowerCase();
                const transcriptLower = transcript.toLowerCase();

                // Check for mentions
                if (transcriptLower.includes(nameLower)) {
                    // Check for negative indicators
                    const negatives = ['skip', 'missed', 'didn\'t', 'did not', 'forgot', 'no '];
                    const isNegative = negatives.some(neg =>
                        transcriptLower.includes(`${neg}${nameLower}`) ||
                        transcriptLower.includes(`${nameLower}${neg.endsWith(' ') ? '' : ' '}skip`)
                    );

                    return {
                        habitId: habit.id,
                        habitName: habit.name,
                        completed: !isNegative,
                        notes: '(AI unavailable - matched by keyword)'
                    };
                }
                return null;
            }).filter(Boolean);

            return NextResponse.json({
                success: true,
                data: {
                    interpretedLogs: fallbackLogs,
                    fallbackMode: true,
                    message: 'AI unavailable, used simple keyword matching'
                }
            });
        }

    } catch (error) {
        console.error('Error interpreting habits:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
