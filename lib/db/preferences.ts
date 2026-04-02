import { prisma } from './client';

export async function getUserPreferences(userId: string) {
    let prefs = await prisma.userPreferences.findUnique({
        where: { userId },
    });

    if (!prefs) {
        // Create default preferences
        try {
            prefs = await prisma.userPreferences.create({
                data: { userId },
            });
        } catch (e) {
            // Check if created concurrently
            prefs = await prisma.userPreferences.findUnique({
                where: { userId },
            });
        }
    }

    return parsePreferences(prefs);
}

function parsePreferences(row: any) {
    if (!row) return null;
    return {
        ...row,
        // Prisma on SQLite returns string for JSON?
        // Schema: focusAreas String? // JSON string
        focusAreas: row.focusAreas ? (typeof row.focusAreas === 'string' ? JSON.parse(row.focusAreas) : row.focusAreas) : [],
        avoidAreas: row.avoidAreas ? (typeof row.avoidAreas === 'string' ? JSON.parse(row.avoidAreas) : row.avoidAreas) : [],
    };
}

export async function saveUserPreferences(userId: string, prefs: {
    displayName?: string | null;
    preferredDifficulty?: number | null;
    challengesPerDay?: number | null;
    generalChallengesPerDay?: number | null;
    realityShiftEnabled?: boolean | null;
    preferredChallengeTime?: string | null;
    focusAreas?: string[] | null;
    avoidAreas?: string[] | null;
    aiPersonality?: string | null;
    includeScientificBasis?: boolean | null;
    challengeLengthPreference?: string | null;
    notificationsEnabled?: boolean | null;
    dailyReminderTime?: string | null;
    streakReminders?: boolean | null;
    theme?: string | null;
    voiceId?: string | null;
    aiCustomName?: string | null;
    tonePreference?: string | null;
    rudeMode?: boolean | null;
}) {
    const data: any = { ...prefs };
    // Stringify JSON fields (Schema says String for SQLite compatibility likely, or just design)
    if (prefs.focusAreas) data.focusAreas = JSON.stringify(prefs.focusAreas);
    if (prefs.avoidAreas) data.avoidAreas = JSON.stringify(prefs.avoidAreas);

    const updated = await prisma.userPreferences.upsert({
        where: { userId },
        create: {
            userId,
            ...data
        },
        update: {
            ...data
        }
    });

    return parsePreferences(updated);
}
