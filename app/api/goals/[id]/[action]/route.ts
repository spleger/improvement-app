import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
    request: NextRequest,
    params: { params: Promise<{ id: string; action: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, action } = await params.params;

        // Verify goal belongs to user
        const goals = await db.getGoalsByUserId(user.userId);
        const goal = goals.find(g => g.id === id);

        if (!goal) {
            return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        }

        let updatedGoal;

        if (action === 'extend') {
            // For now, extending just keeps it active or acknowledges it.
            updatedGoal = await db.updateGoalStatus(id, 'active');
        } else if (action === 'archive') {
            updatedGoal = await db.updateGoalStatus(id, 'archived');
        } else if (action === 'levelup') {
            // Archive old one
            await db.updateGoalStatus(id, 'completed');

            // Create new "Level 2" goal
            const newGoal = await db.createGoal({
                userId: user.userId,
                title: `${goal.title} (Level 2)`,
                domainId: goal.domainId || 1,
                description: goal.description || undefined,
                difficultyLevel: Math.min(10, (goal.difficultyLevel || 5) + 2),
                realityShiftEnabled: true
            });
            updatedGoal = newGoal;
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            data: updatedGoal
        });

    } catch (error) {
        console.error('Goal action error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
