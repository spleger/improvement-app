import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// POST /api/surveys - Create a new survey entry
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();

        const survey = await db.createOrUpdateDailySurvey({
            userId: user.userId,
            surveyDate: new Date(),
            overallMood: body.overallMood,
            energyLevel: body.energyLevel,
            motivationLevel: body.motivationLevel,
            gratitudeNote: body.notes // Mapping notes to a valid field
        });

        return NextResponse.json({
            success: true,
            data: survey
        });
    } catch (error) {
        console.error('Error creating survey:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET /api/surveys - Get surveys for user
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '30');

        const surveys = await db.getSurveysByUserId(user.userId, days);

        return NextResponse.json({
            success: true,
            data: { surveys }
        });
    } catch (error) {
        console.error('Error fetching surveys:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
