import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

const ANTHROPIC_API_KEY_RAW = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_KEY = ANTHROPIC_API_KEY_RAW?.replace(/^["']|["']$/g, '').trim();

const GOAL_SUGGESTION_PROMPT = `You are an expert life coach analyzing a new user's responses to suggest personalized transformation goals.

IMPORTANT: Return ONLY valid JSON. No markdown, no explanations, no extra text.

Generate exactly 5 personalized goal suggestions as a JSON array. Each goal should:
1. Match one of these domains: Languages, Mobility, Emotional Growth, Relationships, Physical Health, Tolerance, Skills, Habits
2. Have a clear current state and desired state
3. Be achievable in 30 days with the time the user has available
4. Address their biggest challenge
5. Include a brief "why" explanation tailored to their motivation

FORMAT (return this exact structure):
[
  {
    "domain": "Physical Health",
    "title": "30-Day Walking Habit",
    "currentState": "Sedentary desk job, no regular exercise",
    "desiredState": "Walking 10,000 steps daily with consistent energy",
    "why": "Walking is the perfect low-barrier entry point that builds consistency without overwhelming you. It addresses your 'starting' challenge by being simple and immediate.",
    "difficulty": 4
  }
]`;

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { answers } = body;

        if (!answers) {
            return NextResponse.json(
                { error: 'Survey answers are required' },
                { status: 400 }
            );
        }

        // Build the user context message
        const userMessage = `
USER RESPONSES:
- Motivation: "${answers.motivation || 'Not specified'}"
- Current Situation: "${answers.currentSituation || 'Not specified'}"
- Time Available Daily: "${answers.timeAvailable || '30-60 minutes'}"
- Biggest Challenge: "${answers.biggestChallenge || 'Consistency'}"

Based on these responses, generate 5 personalized goal suggestions.
`;

        try {
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
                    max_tokens: 2000,
                    system: GOAL_SUGGESTION_PROMPT,
                    messages: [{ role: 'user', content: userMessage }]
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Claud API error: ${response.status} - ${errorData}`);
            }

            const data = await response.json();
            const responseText = data.content[0]?.text || '';

            // Parse the JSON response
            let suggestions;
            try {
                // Try to extract JSON array from response
                const startIndex = responseText.indexOf('[');
                const endIndex = responseText.lastIndexOf(']');

                if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                    const jsonString = responseText.substring(startIndex, endIndex + 1);
                    suggestions = JSON.parse(jsonString);
                } else {
                    throw new Error('No JSON array found in response');
                }

                if (!Array.isArray(suggestions) || suggestions.length === 0) {
                    throw new Error('Invalid suggestions format');
                }

            } catch (parseError) {
                console.error('Failed to parse AI response:', responseText);
                throw new Error('Failed to parse AI response');
            }

            return NextResponse.json({
                success: true,
                data: { suggestions: suggestions.slice(0, 5) } // Ensure max 5
            });

        } catch (aiError) {
            console.error('AI generation failed:', aiError);

            // Fallback: Return default goal suggestions (5 total)
            const fallbackSuggestions = [
                {
                    domain: 'Physical Health',
                    title: '30-Day Walking Habit',
                    currentState: 'Limited physical activity',
                    desiredState: 'Walking 10,000 steps daily',
                    why: 'Walking is a low-barrier way to build consistency and improve overall health.',
                    difficulty: 4
                },
                {
                    domain: 'Habits',
                    title: 'Morning Routine Mastery',
                    currentState: 'Inconsistent morning habits',
                    desiredState: 'Structured 30-minute morning routine',
                    why: 'A solid morning routine sets the tone for your entire day and builds discipline.',
                    difficulty: 5
                },
                {
                    domain: 'Emotional Growth',
                    title: 'Daily Gratitude Practice',
                    currentState: 'Focus on negatives',
                    desiredState: 'Writing 3 gratitudes daily',
                    why: 'Gratitude rewires your brain for positivity and resilience.',
                    difficulty: 3
                },
                {
                    domain: 'Skills',
                    title: 'Learn Something New Daily',
                    currentState: 'Stagnant learning',
                    desiredState: '30 minutes of skill-building daily',
                    why: 'Consistent learning keeps your mind sharp and opens new opportunities.',
                    difficulty: 5
                },
                {
                    domain: 'Relationships',
                    title: 'Deepen One Connection',
                    currentState: 'Surface-level relationships',
                    desiredState: 'Meaningful conversations weekly',
                    why: 'Strong relationships are the foundation of happiness and well-being.',
                    difficulty: 6
                }
            ];

            return NextResponse.json({
                success: true,
                data: {
                    suggestions: fallbackSuggestions,
                    fallback: true
                }
            });
        }

    } catch (error) {
        console.error('Error analyzing survey:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
