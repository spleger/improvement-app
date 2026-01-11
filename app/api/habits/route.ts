import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/habits - List all habits for the current user
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const includeInactive = request.nextUrl.searchParams.get('includeInactive') === 'true';
        const habits = await db.getHabitsByUserId(user.userId, includeInactive);

        // Get today's logs
        const today = new Date();
        const todayLogs = await db.getHabitLogsForDate(user.userId, today);

        // Get streaks for each habit
        const habitsWithStatus = await Promise.all(habits.map(async (habit) => {
            const todayLog = todayLogs.find(l => l.habitId === habit.id);
            const streak = await db.calculateHabitStreak(habit.id);
            return {
                ...habit,
                completedToday: todayLog?.completed || false,
                todayNotes: todayLog?.notes || null,
                streak
            };
        }));

        return NextResponse.json({
            success: true,
            data: { habits: habitsWithStatus }
        });
    } catch (error) {
        console.error('Error fetching habits:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/habits - Create a new habit
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, icon, frequency, targetDays, goalId } = body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
        }

        const habit = await db.createHabit({
            userId: user.userId,
            name: name.trim(),
            description,
            icon,
            frequency,
            targetDays,
            goalId
        });

        return NextResponse.json({
            success: true,
            data: { habit }
        });
    } catch (error) {
        console.error('Error creating habit:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/habits - Update an existing habit
export async function PUT(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, name, description, icon, frequency, targetDays, goalId, isActive } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'Habit ID is required' }, { status: 400 });
        }

        // Verify ownership
        const existingHabit = await db.getHabitById(id);
        if (!existingHabit || existingHabit.userId !== user.userId) {
            return NextResponse.json({ success: false, error: 'Habit not found' }, { status: 404 });
        }

        const habit = await db.updateHabit(id, {
            name,
            description,
            icon,
            frequency,
            targetDays,
            goalId,
            isActive
        });

        return NextResponse.json({
            success: true,
            data: { habit }
        });
    } catch (error) {
        console.error('Error updating habit:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/habits?id=xxx - Delete a habit
export async function DELETE(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const id = request.nextUrl.searchParams.get('id');
        if (!id) {
            return NextResponse.json({ success: false, error: 'Habit ID is required' }, { status: 400 });
        }

        // Verify ownership
        const existingHabit = await db.getHabitById(id);
        if (!existingHabit || existingHabit.userId !== user.userId) {
            return NextResponse.json({ success: false, error: 'Habit not found' }, { status: 404 });
        }

        await db.deleteHabit(id);

        return NextResponse.json({
            success: true,
            data: { deleted: true }
        });
    } catch (error) {
        console.error('Error deleting habit:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
