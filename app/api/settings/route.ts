import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';

const DEMO_USER_ID = 'demo-user-001';

// GET /api/settings - Get user preferences
export async function GET() {
    try {
        const prefs = await db.getUserPreferences(DEMO_USER_ID);

        return NextResponse.json({
            success: true,
            data: { preferences: prefs }
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/settings - Save user preferences
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const prefs = await db.saveUserPreferences(DEMO_USER_ID, body);

        return NextResponse.json({
            success: true,
            data: { preferences: prefs }
        });
    } catch (error) {
        console.error('Error saving settings:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
