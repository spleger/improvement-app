import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';

// POST /api/diary - Create diary entry
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { transcript, audioDurationSeconds, moodScore } = body;
        const userId = 'demo-user-001';

        const entry = await db.createDiaryEntry({
            userId,
            transcript,
            audioDurationSeconds,
            moodScore,
            entryType: 'voice',
            // In a real app, we would upload the audio file to S3/Blob storage here
            // and save the URL. For this demo, we'll leave it null or use a placeholder
            audioUrl: undefined
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
        const userId = 'demo-user-001';

        const entries = await db.getDiaryEntriesByUserId(userId);

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
