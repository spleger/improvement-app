import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// POST /api/diary - Create diary entry
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { transcript, audioDurationSeconds, moodScore } = body;

        let aiSummary = '';
        let aiInsights = '{}';

        // 1. Analyze with Anthropic (if transcript exists)
        if (transcript && transcript.length > 10 && process.env.ANTHROPIC_API_KEY) {
            try {
                const apiKey = process.env.ANTHROPIC_API_KEY?.replace(/^["']|["']$/g, '').trim();

                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey!,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: 'claude-3-haiku-20240307',
                        max_tokens: 400,
                        system: `You are an expert psychological analyst. Analyze the user's diary entry.
                        Return a JSON object with:
                        - title: A short, catchy 3-6 word title summarizing the entry (like a journal headline).
                        - summary: A 1-sentence summary of the entry.
                        - sentiment: One of [Positive, Negative, Neutral, Mixed, Anxious, Hopeful].
                        - cognitive_distortions: An array of strings (e.g. "Catastrophizing", "All-or-nothing thinking") if present, else empty.
                        - key_themes: An array of 1-3 keywords.
                        
                        Keep it concise. Output ONLY valid JSON.`,
                        messages: [{ role: 'user', content: transcript }]
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const content = data.content[0].text;
                    // Simple JSON extraction in case of preamble
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        aiSummary = parsed.summary || '';
                        aiInsights = JSON.stringify({
                            title: parsed.title,
                            sentiment: parsed.sentiment,
                            distortions: parsed.cognitive_distortions,
                            themes: parsed.key_themes
                        });
                    }
                } else {
                    console.error('Anthropic API error:', response.status, await response.text());
                }
            } catch (aiError) {
                console.error('AI Analysis failed:', aiError);
                // Fail silently, save entry without AI
            }
        }

        const entry = await db.createDiaryEntry({
            userId: user.userId,
            transcript,
            audioDurationSeconds,
            moodScore,
            entryType: 'voice',
            audioUrl: undefined,
            aiSummary,
            aiInsights
        });

        return NextResponse.json({
            success: true,
            data: { entry }
        });
    } catch (error) {
        console.error('Error creating diary entry:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET /api/diary - Get diary entries
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const entries = await db.getDiaryEntriesByUserId(user.userId);

        return NextResponse.json({
            success: true,
            data: { entries }
        });
    } catch (error) {
        console.error('Error fetching diary entries:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
