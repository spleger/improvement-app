import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!PERPLEXITY_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'Research service not configured' },
                { status: 503 }
            );
        }

        const body = await request.json();
        const query = body.query?.trim();
        if (!query || typeof query !== 'string' || query.length > 500) {
            return NextResponse.json(
                { success: false, error: 'Invalid query' },
                { status: 400 }
            );
        }

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a research assistant. Provide concise, evidence-based answers with key takeaways. Focus on actionable insights for personal development and self-improvement. Keep responses under 300 words.'
                    },
                    {
                        role: 'user',
                        content: query
                    }
                ],
                max_tokens: 600,
            }),
        });

        if (!response.ok) {
            console.error('Perplexity API error:', response.status);
            return NextResponse.json(
                { success: false, error: 'Research service unavailable' },
                { status: 502 }
            );
        }

        const data = await response.json();
        const answer = data.choices?.[0]?.message?.content || 'No results found.';
        const citations = data.citations || [];

        return NextResponse.json({
            success: true,
            data: { answer, citations, query }
        });
    } catch (error) {
        console.error('Research error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
