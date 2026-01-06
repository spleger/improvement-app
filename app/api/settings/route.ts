import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const prefs = await db.getUserPreferences(user.userId);
        return NextResponse.json(prefs);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();

        const prefs = await db.saveUserPreferences(user.userId, body);

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
