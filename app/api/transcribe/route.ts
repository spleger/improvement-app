import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { APIConnectionTimeoutError } from 'openai';
import { getCurrentUser } from '@/lib/auth';
import { logWhisperUsage } from '@/lib/ai/costs';

export const dynamic = 'force-dynamic';

// Default timeout for transcription API calls (30 seconds as per spec)
const TRANSCRIPTION_TIMEOUT_MS = 30000;

// POST /api/transcribe - Transcribe audio file using OpenAI Whisper
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'Server configuration error: Missing OpenAI Key' }, { status: 500 });
        }

        // Create OpenAI client with timeout configuration (30s default)
        const openai = new OpenAI({
            apiKey,
            timeout: TRANSCRIPTION_TIMEOUT_MS,
        });

        // OpenAI SDK v4 supports "File" from web standard
        // Next.js polyfills File objects in Node runtime
        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
        });

        // Log Whisper usage (estimate ~10 seconds if no duration info available)
        const fileSizeMB = file.size / (1024 * 1024);
        const estimatedDurationSec = Math.max(fileSizeMB * 60, 5); // rough estimate from file size
        logWhisperUsage(user.userId, estimatedDurationSec);

        // Handle empty transcription
        if (!transcription.text || transcription.text.trim().length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    text: '',
                    message: 'No speech detected. Please try again.'
                }
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                text: transcription.text
            }
        });

    } catch (error: unknown) {
        console.error('Transcription error:', error);

        // Handle timeout errors specifically
        if (error instanceof APIConnectionTimeoutError) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Transcription timed out. Please try again.',
                    errorType: 'timeout'
                },
                { status: 504 }
            );
        }

        // Handle other OpenAI API errors
        if (error instanceof Error) {
            // Check for timeout-like errors from AbortController
            if (error.name === 'AbortError') {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Transcription timed out. Please try again.',
                        errorType: 'timeout'
                    },
                    { status: 504 }
                );
            }

            return NextResponse.json(
                { success: false, error: error.message || 'Transcription failed' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Transcription failed' },
            { status: 500 }
        );
    }
}
