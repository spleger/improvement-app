import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';

const DEMO_USER_ID = 'demo-user-001'; // In production, get from auth

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string; action: string } }
) {
    try {
        const { id, action } = params;

        // Verify goal belongs to user
        const goals = await db.getGoalsByUserId(DEMO_USER_ID);
        const goal = goals.find(g => g.id === id);

        if (!goal) {
            return NextResponse.json(
                { success: false, error: 'Goal not found' },
                { status: 404 }
            );
        }

        let updatedGoal;

        if (action === 'extend') {
            // Add another 30 days
            // We need a db function for this, but for now let's just update the target date if stored,
            // or maybe just log it. Since current schema implies fixed 30 days, 
            // we might need to update the 'createdAt' or have an 'extendedAt' field?
            // Simplified: Just set status back to active if it was completed, or keep it active.
            // For this app, let's assume extending means resetting the "start date" to now effective for another 30 days?
            // No, that loses history.
            // Let's assume we just acknowledge it. 
            // Ideally: Update `totalDays` to 60?
            // Schema doesn't have `totalDays`. It calculates from `createdAt`.
            // Let's leave it as is for now, just a placeholder acknowledgement.
            updatedGoal = goal;
        } else if (action === 'archive') {
            updatedGoal = await db.updateGoalStatus(id, 'archived');
        } else if (action === 'levelup') {
            // Archive old one
            await db.updateGoalStatus(id, 'completed');

            // Create new "Level 2" goal
            const newGoal = await db.createGoal({
                userId: DEMO_USER_ID,
                title: `${goal.title} (Level 2)`,
                domainId: goal.domainId || 1, // Defaulting to 1 if null since types require number
                description: goal.description || undefined,
            });
            updatedGoal = newGoal;
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid action' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: updatedGoal
        });
    } catch (error) {
        console.error('Error updating goal:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
