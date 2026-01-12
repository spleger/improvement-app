
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Server configuration error: Missing OpenAI Key' }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey });

        // Convert the File/Blob to the format OpenAI expects
        // OpenAI expects a File-like object with name and type
        const buffer = Buffer.from(await file.arrayBuffer());
        // @ts-ignore - OpenAI TS definition is strict about "File", but generic object with name/buffer works often,
        // or we use the 'file-type' workaround. simpler is to just pass the file directly if environment supports it,
        // but in Node environment Next.js File object might need casting.

        // Actually, OpenAI SDK v4 supports "File" from web standard if we are in edge, 
        // but in Node runtime we might need to be careful. 
        // Let's try passing the file directly first as Next.js polyfills it.

        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
        });

        return NextResponse.json({
            text: transcription.text
        });

    } catch (error: any) {
        console.error('Transcription error:', error);
        return NextResponse.json(
            { error: error.message || 'Transcription failed' },
            { status: 500 }
        );
    }
}
