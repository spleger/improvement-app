import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateWeeklyDigest } from '@/lib/ai/digest';

export const dynamic = 'force-dynamic';

/**
 * Calculate Monday-based week boundaries.
 * Returns Monday 00:00:00 as start and next Monday 00:00:00 as end.
 */
function getWeekBoundaries(dateInWeek?: string): { weekStart: Date; weekEnd: Date } {
    const date = dateInWeek ? new Date(dateInWeek) : new Date();
    // Normalize to start of day UTC
    date.setUTCHours(0, 0, 0, 0);

    // getUTCDay: 0=Sun, 1=Mon, ..., 6=Sat
    const dayOfWeek = date.getUTCDay();
    // Monday offset: if Sunday (0) -> go back 6 days, otherwise go back (day - 1)
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const weekStart = new Date(date);
    weekStart.setUTCDate(date.getUTCDate() - mondayOffset);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

    return { weekStart, weekEnd };
}

// GET /api/digest/weekly?weekStart=2026-03-16
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const weekStartParam = searchParams.get('weekStart') || undefined;

        const { weekStart, weekEnd } = getWeekBoundaries(weekStartParam);

        // Check for cached digest
        const existing = await db.getWeeklyDigest(user.userId, weekStart);
        if (existing) {
            return NextResponse.json({
                success: true,
                data: {
                    id: existing.id,
                    weekStartDate: existing.weekStartDate,
                    weekEndDate: existing.weekEndDate,
                    aiSummary: existing.aiSummary,
                    topAchievement: existing.topAchievement,
                    focusArea: existing.focusArea,
                    suggestion: existing.suggestion,
                    rawData: JSON.parse(existing.rawData),
                    createdAt: existing.createdAt,
                    cached: true,
                },
            });
        }

        // Aggregate weekly data
        const digestData = await db.getWeeklyDigestData(user.userId, weekStart, weekEnd);

        // Generate AI summary
        const aiResult = await generateWeeklyDigest(user.userId, digestData);

        // Save to DB
        const saved = await db.createWeeklyDigest({
            userId: user.userId,
            weekStartDate: weekStart,
            weekEndDate: weekEnd,
            rawData: JSON.stringify(digestData),
            aiSummary: aiResult.aiSummary,
            topAchievement: aiResult.topAchievement || undefined,
            focusArea: aiResult.focusArea || undefined,
            suggestion: aiResult.suggestion || undefined,
        });

        return NextResponse.json({
            success: true,
            data: {
                id: saved.id,
                weekStartDate: saved.weekStartDate,
                weekEndDate: saved.weekEndDate,
                aiSummary: saved.aiSummary,
                topAchievement: saved.topAchievement,
                focusArea: saved.focusArea,
                suggestion: saved.suggestion,
                rawData: digestData,
                createdAt: saved.createdAt,
                cached: false,
            },
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Weekly digest error:', errorMessage);
        return NextResponse.json(
            { success: false, error: `Internal server error: ${errorMessage}` },
            { status: 500 },
        );
    }
}
