import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { pool } from '@/lib/db';

// POST /api/challenges/accept - Accept a challenge from a template
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { templateId, scheduledDate } = body;
        const userId = 'demo-user-001';

        // Get the template
        const templateResult = await pool.query(
            `SELECT * FROM "ChallengeTemplate" WHERE id = $1`,
            [templateId]
        );

        if (templateResult.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Template not found' },
                { status: 404 }
            );
        }

        const template = templateResult.rows[0];

        // Get user's active goal for this domain (if any)
        const goalResult = await pool.query(
            `SELECT * FROM "Goal" WHERE "userId" = $1 AND "domainId" = $2 AND status = 'active' LIMIT 1`,
            [userId, template.domainId]
        );
        const goal = goalResult.rows[0];

        // Create the challenge
        const challenge = await db.createChallenge({
            userId,
            goalId: goal?.id,
            templateId: template.id,
            title: template.title,
            description: template.description,
            difficulty: template.difficulty,
            isRealityShift: template.isRealityShift,
            scheduledDate: new Date(scheduledDate || new Date()),
            personalizationNotes: template.successCriteria || 'You chose this challenge - now make it happen!'
        });

        return NextResponse.json({
            success: true,
            data: { challenge }
        });

    } catch (error) {
        console.error('Error accepting challenge:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
