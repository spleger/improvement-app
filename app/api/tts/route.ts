import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { text, voice = 'nova' } = body;

        if (!text || typeof text !== 'string') {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        if (text.length > 4096) {
            return NextResponse.json({ error: 'Text too long. Maximum 4096 characters.' }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Server configuration error: Missing OpenAI Key' }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey });

        // Use tts-1 model for low latency, wav format for fastest response times
        const audioResponse = await openai.audio.speech.create({
            model: 'tts-1',
            voice: voice as 'alloy' | 'ash' | 'coral' | 'echo' | 'fable' | 'onyx' | 'nova' | 'sage' | 'shimmer',
            input: text,
            response_format: 'wav',
        });

        const buffer = Buffer.from(await audioResponse.arrayBuffer());

        return new Response(buffer, {
            headers: {
                'Content-Type': 'audio/wav',
                'Content-Length': buffer.length.toString(),
            },
        });

    } catch (error: any) {
        console.error('TTS error:', error);
        return NextResponse.json(
            { error: error.message || 'Text-to-speech conversion failed' },
            { status: 500 }
        );
    }
}
