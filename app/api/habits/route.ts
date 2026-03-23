import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/habits - List all habits for the current user
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const includeInactive = request.nextUrl.searchParams.get('includeInactive') === 'true';

        // Fetch habits, today's logs, AND all streak logs in parallel (3 queries, not N+2)
        const streakStart = new Date();
        streakStart.setDate(streakStart.getDate() - 60);
        streakStart.setUTCHours(0, 0, 0, 0);

        const [habits, todayLogs, allStreakLogs] = await Promise.all([
            db.getHabitsByUserId(user.userId, includeInactive),
            db.getHabitLogsForDate(user.userId, new Date()),
            prisma.habitLog.findMany({
                where: { habit: { userId: user.userId }, logDate: { gte: streakStart } },
                orderBy: { logDate: 'desc' },
            }),
        ]);

        // Calculate streaks in memory from bulk-fetched logs (0 extra queries)
        const habitsWithStatus = habits.map((habit) => {
            const todayLog = todayLogs.find(l => l.habitId === habit.id);
            const habitLogs = allStreakLogs.filter(l => l.habitId === habit.id);

            let streak = 0;
            const checkDate = new Date();
            checkDate.setUTCHours(0, 0, 0, 0);
            for (let i = 0; i < 60; i++) {
                const dateStr = checkDate.toISOString().split('T')[0];
                const log = habitLogs.find(l => new Date(l.logDate).toISOString().split('T')[0] === dateStr);
                if (log && log.completed) {
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else if (i > 0) {
                    break;
                } else {
                    checkDate.setDate(checkDate.getDate() - 1);
                }
            }

            return {
                ...habit,
                completedToday: todayLog?.completed || false,
                todayNotes: todayLog?.notes || null,
                streak,
            };
        });

        const response = NextResponse.json({
            success: true,
            data: { habits: habitsWithStatus }
        });
        response.headers.set('Cache-Control', 'private, max-age=15, stale-while-revalidate=30');
        return response;
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

        // Normalize description: treat null, undefined, and empty string as undefined
        const normalizedDescription = (typeof description === 'string' && description.trim().length > 0)
            ? description.trim()
            : undefined;

        const habit = await db.createHabit({
            userId: user.userId,
            name: name.trim(),
            description: normalizedDescription,
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
