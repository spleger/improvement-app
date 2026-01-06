import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/goals - Get all goals for user
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const goals = await db.getGoalsByUserId(user.userId);

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
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const {
            title,
            domainId,
            description,
            difficultyLevel = 5, // Default to moderate
            realityShiftEnabled = false
        } = body;

        if (!title || !domainId) {
            return NextResponse.json(
                { success: false, error: 'Title and domain are required' },
                { status: 400 }
            );
        }

        // Create the goal
        const goal = await db.createGoal({
            userId: user.userId,
            domainId,
            title,
            description,
            difficultyLevel,
            realityShiftEnabled
        });

        return NextResponse.json({
            success: true,
            data: goal
        });
    } catch (error) {
        console.error('Error creating goal:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
