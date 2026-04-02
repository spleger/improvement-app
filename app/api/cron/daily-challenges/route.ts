import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Allow up to 2 minutes for multiple users/goals

/**
 * Cron job: Generate daily challenges for all users at midnight their local time.
 *
 * Runs every hour via Vercel Cron. For each user whose local time is between
 * 00:00-00:59, it cleans up old pending challenges and generates new ones
 * for each active goal based on their challengesPerDay preference.
 *
 * Protected by CRON_SECRET (Vercel sets Authorization header automatically).
 */
export async function GET(request: NextRequest) {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.error('CRON_SECRET not configured');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const results = await generateDailyChallenges();
        return NextResponse.json({ success: true, ...results });
    } catch (error) {
        console.error('Cron daily-challenges error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

async function generateDailyChallenges() {
    const now = new Date();
    const processed: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    // Find all users with active goals
    const usersWithActiveGoals = await prisma.user.findMany({
        where: {
            goals: {
                some: { status: 'active' },
            },
        },
        select: {
            id: true,
            email: true,
            timezone: true,
            goals: {
                where: { status: 'active' },
                select: { id: true, title: true },
            },
        },
    });

    for (const user of usersWithActiveGoals) {
        const tz = user.timezone || 'Europe/Berlin';

        // Check if it's midnight (00:xx) in the user's timezone
        if (!isMidnightHour(now, tz)) {
            skipped.push(`${user.email}: not midnight in ${tz}`);
            continue;
        }

        // Check if challenges already exist for today (idempotency guard)
        const todayInUserTz = getTodayInTimezone(tz);
        const tomorrowInUserTz = new Date(todayInUserTz);
        tomorrowInUserTz.setDate(tomorrowInUserTz.getDate() + 1);

        const existingToday = await prisma.challenge.count({
            where: {
                userId: user.id,
                scheduledDate: {
                    gte: todayInUserTz,
                    lt: tomorrowInUserTz,
                },
            },
        });

        if (existingToday > 0) {
            skipped.push(`${user.email}: ${existingToday} challenges already exist for today`);
            continue;
        }

        // Clean up old pending challenges (from previous days)
        const cleanedUp = await prisma.challenge.deleteMany({
            where: {
                userId: user.id,
                status: 'pending',
                scheduledDate: { lt: todayInUserTz },
            },
        });

        // Get user preferences for challengesPerDay
        const preferences = await db.getUserPreferences(user.id);
        const challengesPerDay = preferences?.challengesPerDay || 1;
        const generalChallengesPerDay = preferences?.generalChallengesPerDay || 0;

        // Generate challenges for each active goal
        let totalGenerated = 0;
        for (const goal of user.goals) {
            try {
                const generated = await callChallengeGeneration(
                    user.id,
                    goal.id,
                    challengesPerDay
                );
                totalGenerated += generated;
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                errors.push(`${user.email}/${goal.title}: ${msg}`);
            }
        }

        // Generate general (non-goal) Daily Growth challenges
        if (generalChallengesPerDay > 0) {
            try {
                const generated = await callChallengeGeneration(
                    user.id,
                    null,
                    generalChallengesPerDay
                );
                totalGenerated += generated;
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                errors.push(`${user.email}/Daily Growth: ${msg}`);
            }
        }

        processed.push(
            `${user.email}: generated ${totalGenerated} challenges for ${user.goals.length} goal(s)${generalChallengesPerDay > 0 ? ` + ${generalChallengesPerDay} general` : ''}, cleaned ${cleanedUp.count} old pending`
        );
    }

    console.log('Cron daily-challenges complete:', {
        processed: processed.length,
        skipped: skipped.length,
        errors: errors.length,
    });

    return { processed, skipped, errors };
}

/**
 * Check if the current hour is 00:xx in the given timezone.
 */
function isMidnightHour(now: Date, timezone: string): boolean {
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: 'numeric',
            hour12: false,
        });
        const hourStr = formatter.format(now);
        return parseInt(hourStr, 10) === 0;
    } catch {
        // Invalid timezone, fall back to assuming it's time (so we don't skip forever)
        return false;
    }
}

/**
 * Get the start of today (00:00:00) in the user's timezone, returned as a UTC Date.
 */
function getTodayInTimezone(timezone: string): Date {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    // en-CA gives YYYY-MM-DD format
    const dateStr = formatter.format(now);

    // Get the UTC offset for this timezone at this moment
    const localMidnight = new Date(`${dateStr}T00:00:00`);
    const offsetFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'shortOffset',
    });
    const parts = offsetFormatter.formatToParts(now);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    const offsetStr = tzPart?.value || '+00:00';

    // Parse offset like "GMT+2" or "GMT-5" into hours
    const match = offsetStr.match(/GMT([+-]?\d+)?/);
    const offsetHours = match?.[1] ? parseInt(match[1], 10) : 0;

    // Create UTC date representing midnight in the user's timezone
    const utcDate = new Date(localMidnight.getTime() - offsetHours * 60 * 60 * 1000);
    return utcDate;
}

/**
 * Call the challenge generation API internally.
 * Uses the same base URL as the current request.
 */
async function callChallengeGeneration(
    userId: string,
    goalId: string | null,
    count: number
): Promise<number> {
    // Import and call the generation logic directly to avoid HTTP overhead
    // We create a minimal auth context by setting cookies/headers manually
    const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Generate a short-lived internal token for this request
    const { signInternalToken } = await import('@/lib/auth');
    const token = signInternalToken(userId);

    const response = await fetch(`${baseUrl}/api/challenges/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Cookie: `auth_token=${token}`,
        },
        body: JSON.stringify({ ...(goalId ? { goalId } : {}), count }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Generation failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    return data.data?.challenges?.length || 0;
}
