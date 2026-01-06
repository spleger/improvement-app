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
                const Anthropic = require('@anthropic-ai/sdk');
                const anthropic = new Anthropic({
                    apiKey: process.env.ANTHROPIC_API_KEY,
                });

                const systemPrompt = `You are an expert psychological analyst. Analyze the user's diary entry.
                Return a JSON object with:
                - summary: A 1-sentence summary of the entry.
                - sentiment: One of [Positive, Negative, Neutral, Mixed, Anxious, Hopeful].
                - cognitive_distortions: An array of strings (e.g. "Catastrophizing", "All-or-nothing thinking") if present, else empty.
                - key_themes: An array of 1-3 keywords.
                
                Keep it concise. Output ONLY valid JSON.`;

                const msg = await anthropic.messages.create({
                    model: "claude-3-5-sonnet-20241022",
                    max_tokens: 400,
                    system: systemPrompt,
                    messages: [{ role: "user", content: transcript }],
                });

                // Parse the response
                const content = msg.content[0].text;
                // Simple JSON extraction in case of preamble
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const data = JSON.parse(jsonMatch[0]);
                    aiSummary = data.summary;
                    aiInsights = JSON.stringify({
                        sentiment: data.sentiment,
                        distortions: data.cognitive_distortions,
                        themes: data.key_themes
                    });
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
