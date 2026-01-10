import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { surveyData } = body;

        // Update user's onboarding status
        await pool.query(
            `UPDATE "User" 
             SET "onboardingCompleted" = true, 
                 "onboardingData" = $1,
                 "updatedAt" = NOW()
             WHERE id = $2`,
            [JSON.stringify(surveyData || {}), user.userId]
        );

        return NextResponse.json({
            success: true,
            message: 'Onboarding completed successfully'
        });

    } catch (error) {
        console.error('Error completing onboarding:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to complete onboarding' },
            { status: 500 }
        );
    }
}
