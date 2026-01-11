import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/habits/log?date=YYYY-MM-DD - Get log status for all habits for a given date
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const dateParam = request.nextUrl.searchParams.get('date');
        const date = dateParam ? new Date(dateParam) : new Date();

        // Get all user habits
        const habits = await db.getHabitsByUserId(user.userId);

        // Get logs for the date
        const logs = await db.getHabitLogsForDate(user.userId, date);

        // Merge habits with their log status
        const habitsWithLogs = habits.map(habit => {
            const log = logs.find(l => l.habitId === habit.id);
            return {
                habitId: habit.id,
                habitName: habit.name,
                habitIcon: habit.icon,
                completed: log?.completed || false,
                notes: log?.notes || null,
                source: log?.source || null
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                date: date.toISOString().split('T')[0],
                logs: habitsWithLogs
            }
        });
    } catch (error) {
        console.error('Error fetching habit logs:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/habits/log - Log one or more habits
// Body: { logs: [{ habitId, completed, notes, source }] } OR { habitId, completed, notes, source }
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { logs, habitId, completed, notes, source, date } = body;

        const logDate = date ? new Date(date) : new Date();

        // Handle batch logs
        if (logs && Array.isArray(logs)) {
            const results = await Promise.all(logs.map(async (log: any) => {
                // Verify ownership
                const habit = await db.getHabitById(log.habitId);
                if (!habit || habit.userId !== user.userId) {
                    return { habitId: log.habitId, error: 'Habit not found' };
                }

                const result = await db.upsertHabitLog({
                    habitId: log.habitId,
                    logDate,
                    completed: log.completed ?? false,
                    notes: log.notes,
                    source: log.source || 'manual'
                });

                return { habitId: log.habitId, success: true, log: result };
            }));

            return NextResponse.json({
                success: true,
                data: { results }
            });
        }

        // Handle single log
        if (habitId) {
            // Verify ownership
            const habit = await db.getHabitById(habitId);
            if (!habit || habit.userId !== user.userId) {
                return NextResponse.json({ success: false, error: 'Habit not found' }, { status: 404 });
            }

            const result = await db.upsertHabitLog({
                habitId,
                logDate,
                completed: completed ?? false,
                notes,
                source: source || 'manual'
            });

            return NextResponse.json({
                success: true,
                data: { log: result }
            });
        }

        return NextResponse.json({ success: false, error: 'habitId or logs array required' }, { status: 400 });
    } catch (error) {
        console.error('Error logging habit:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
