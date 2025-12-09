import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';

// POST /api/surveys - Create daily survey
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            energyLevel,
            motivationLevel,
            overallMood,
            sleepQuality,
            stressLevel,
            biggestWin,
            biggestBlocker,
            gratitudeNote,
            tomorrowIntention,
            completionLevel = 'minimum'
        } = body;

        const userId = 'demo-user-001';

        if (energyLevel === undefined || motivationLevel === undefined || overallMood === undefined) {
            return NextResponse.json(
                { success: false, error: 'Energy, motivation, and mood are required' },
                { status: 400 }
            );
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const survey = await db.createOrUpdateDailySurvey({
            userId,
            surveyDate: today,
            energyLevel,
            motivationLevel,
            overallMood,
            sleepQuality,
            stressLevel,
            biggestWin,
            biggestBlocker,
            gratitudeNote,
            tomorrowIntention,
            completionLevel
        });

        return NextResponse.json({
            success: true,
            data: { survey }
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
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '30');
        const userId = 'demo-user-001';

        const surveys = await db.getSurveysByUserId(userId, days);

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
