import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';

// GET /api/goals - Get all goals for user
export async function GET(request: NextRequest) {
    try {
        const userId = 'demo-user-001';
        const goals = await db.getGoalsByUserId(userId);

        return NextResponse.json({
            success: true,
            data: { goals }
        });
    } catch (error) {
        console.error('Error fetching goals:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/goals - Create a new goal
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            title,
            description,
            domainId,
            currentState,
            desiredState,
            difficultyLevel = 5,
            realityShiftEnabled = false
        } = body;

        const userId = 'demo-user-001';

        if (!title || !domainId) {
            return NextResponse.json(
                { success: false, error: 'Title and domain are required' },
                { status: 400 }
            );
        }

        // Create the goal
        const goal = await db.createGoal({
            userId,
            domainId,
            title,
            description,
            currentState,
            desiredState,
            difficultyLevel,
            realityShiftEnabled
        });

        // Generate the first challenge
        const template = await db.getChallengeTemplatesByDomain(domainId, {
            maxDifficulty: 4,
            isRealityShift: false
        });

        if (template) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            await db.createChallenge({
                userId,
                goalId: goal.id,
                templateId: template.id,
                title: template.title,
                description: template.description,
                difficulty: template.difficulty,
                isRealityShift: false,
                scheduledDate: today,
                personalizationNotes: `Day 1 of your ${goal.title} journey! Start strong with this foundation-building challenge.`
            });
        }

        return NextResponse.json({
            success: true,
            data: { goal }
        });
    } catch (error) {
        console.error('Error creating goal:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
