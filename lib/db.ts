// Database client using node-postgres (pg) for Windows ARM64 compatibility
// Replaces Prisma which doesn't have ARM64 binaries

import { Pool } from 'pg';

// Parse connection string from environment
const connectionString = process.env.DATABASE_URL;

// Create connection pool
const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

// Helper to generate UUIDs
function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ==================== USER OPERATIONS ====================

export async function getUserById(id: string) {
    const result = await pool.query('SELECT * FROM "User" WHERE id = $1', [id]);
    return result.rows[0] || null;
}

export async function getUserByEmail(email: string) {
    const result = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
    return result.rows[0] || null;
}

export async function createUser(data: {
    email: string;
    passwordHash: string;
    displayName?: string;
}) {
    const id = generateId();
    const result = await pool.query(
        `INSERT INTO "User" (id, email, "passwordHash", "displayName", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
        [id, data.email, data.passwordHash, data.displayName]
    );
    return result.rows[0];
}

// ==================== GOAL DOMAIN OPERATIONS ====================

export async function getAllGoalDomains() {
    const result = await pool.query('SELECT * FROM "GoalDomain" ORDER BY id');
    return result.rows.map(row => ({
        ...row,
        examples: row.examples ? JSON.parse(row.examples) : []
    }));
}

export async function getGoalDomainById(id: number) {
    const result = await pool.query('SELECT * FROM "GoalDomain" WHERE id = $1', [id]);
    return result.rows[0] || null;
}

// ==================== GOAL OPERATIONS ====================

export async function getGoalsByUserId(userId: string) {
    const result = await pool.query(
        `SELECT g.*, d.name as "domainName", d.icon as "domainIcon", d.color as "domainColor"
     FROM "Goal" g
     LEFT JOIN "GoalDomain" d ON g."domainId" = d.id
     WHERE g."userId" = $1
     ORDER BY g."createdAt" DESC`,
        [userId]
    );
    return result.rows.map(row => ({
        ...row,
        domain: row.domainName ? {
            id: row.domainId,
            name: row.domainName,
            icon: row.domainIcon,
            color: row.domainColor
        } : null
    }));
}

export async function getActiveGoalByUserId(userId: string) {
    const result = await pool.query(
        `SELECT g.*, d.name as "domainName", d.icon as "domainIcon", d.color as "domainColor"
     FROM "Goal" g
     LEFT JOIN "GoalDomain" d ON g."domainId" = d.id
     WHERE g."userId" = $1 AND g.status = 'active'
     ORDER BY g."createdAt" DESC
     LIMIT 1`,
        [userId]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
        ...row,
        domain: row.domainName ? {
            id: row.domainId,
            name: row.domainName,
            icon: row.domainIcon,
            color: row.domainColor
        } : null
    };
}

export async function createGoal(data: {
    userId: string;
    domainId: number;
    title: string;
    description?: string;
    currentState?: string;
    desiredState?: string;
    difficultyLevel?: number;
    realityShiftEnabled?: boolean;
}) {
    const id = generateId();
    const result = await pool.query(
        `INSERT INTO "Goal" (id, "userId", "domainId", title, description, "currentState", "desiredState", 
     "difficultyLevel", "realityShiftEnabled", status, "startedAt", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', NOW(), NOW(), NOW()) RETURNING *`,
        [id, data.userId, data.domainId, data.title, data.description, data.currentState,
            data.desiredState, data.difficultyLevel || 5, data.realityShiftEnabled || false]
    );
    return result.rows[0];
}

export async function getGoalById(id: string) {
    const result = await pool.query(
        `SELECT g.*, d.name as "domainName", d.icon as "domainIcon", d.color as "domainColor"
     FROM "Goal" g
     LEFT JOIN "GoalDomain" d ON g."domainId" = d.id
     WHERE g.id = $1`,
        [id]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
        ...row,
        domain: row.domainName ? {
            id: row.domainId,
            name: row.domainName,
            icon: row.domainIcon,
            color: row.domainColor
        } : null
    };
}

export async function updateGoalStatus(id: string, status: string) {
    const result = await pool.query(
        `UPDATE "Goal" SET status = $2, "updatedAt" = NOW() WHERE id = $1 RETURNING *`,
        [id, status]
    );
    return result.rows[0];
}

// ==================== CHALLENGE TEMPLATE OPERATIONS ====================

export async function getChallengeTemplatesByDomain(domainId: number, options?: {
    minDifficulty?: number;
    maxDifficulty?: number;
    excludeIds?: string[];
    isRealityShift?: boolean;
}) {
    let query = `SELECT * FROM "ChallengeTemplate" WHERE "domainId" = $1`;
    const params: any[] = [domainId];
    let paramIndex = 2;

    if (options?.minDifficulty !== undefined) {
        query += ` AND difficulty >= $${paramIndex++}`;
        params.push(options.minDifficulty);
    }
    if (options?.maxDifficulty !== undefined) {
        query += ` AND difficulty <= $${paramIndex++}`;
        params.push(options.maxDifficulty);
    }
    if (options?.excludeIds && options.excludeIds.length > 0) {
        query += ` AND id NOT IN (${options.excludeIds.map((_, i) => `$${paramIndex + i}`).join(', ')})`;
        params.push(...options.excludeIds);
        paramIndex += options.excludeIds.length;
    }
    if (options?.isRealityShift !== undefined) {
        query += ` AND "isRealityShift" = $${paramIndex++}`;
        params.push(options.isRealityShift);
    }

    query += ' ORDER BY difficulty ASC LIMIT 1';

    const result = await pool.query(query, params);
    return result.rows[0] || null;
}

// ==================== CHALLENGE OPERATIONS ====================

export async function getChallengesByUserId(userId: string, options?: { limit?: number }) {
    const result = await pool.query(
        `SELECT c.*, g.title as "goalTitle"
     FROM "Challenge" c
     LEFT JOIN "Goal" g ON c."goalId" = g.id
     WHERE c."userId" = $1
     ORDER BY c."scheduledDate" DESC
     LIMIT $2`,
        [userId, options?.limit || 30]
    );
    return result.rows;
}

export async function getTodayChallenge(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await pool.query(
        `SELECT c.*, t."instructions", t."successCriteria", t."scientificReferences"
     FROM "Challenge" c
     LEFT JOIN "ChallengeTemplate" t ON c."templateId" = t.id
     WHERE c."userId" = $1 
     AND c."scheduledDate" >= $2 
     AND c."scheduledDate" < $3
     ORDER BY c."createdAt" DESC
     LIMIT 1`,
        [userId, today.toISOString(), tomorrow.toISOString()]
    );
    return result.rows[0] || null;
}

// Get ALL challenges for today (multiple challenges support)
export async function getTodayChallenges(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await pool.query(
        `SELECT c.*, t."instructions", t."successCriteria", t."scientificReferences",
                g.title as "goalTitle"
     FROM "Challenge" c
     LEFT JOIN "ChallengeTemplate" t ON c."templateId" = t.id
     LEFT JOIN "Goal" g ON c."goalId" = g.id
     WHERE c."userId" = $1 
     AND c."scheduledDate" >= $2 
     AND c."scheduledDate" < $3
     ORDER BY c.status ASC, c."createdAt" DESC`,
        [userId, today.toISOString(), tomorrow.toISOString()]
    );
    return result.rows;
}

export async function getChallengeById(id: string) {
    const result = await pool.query(
        `SELECT c.*, t."instructions", t."successCriteria", t."scientificReferences",
            g.title as "goalTitle", g."domainId"
     FROM "Challenge" c
     LEFT JOIN "ChallengeTemplate" t ON c."templateId" = t.id
     LEFT JOIN "Goal" g ON c."goalId" = g.id
     WHERE c.id = $1`,
        [id]
    );
    return result.rows[0] || null;
}

export async function createChallenge(data: {
    userId: string;
    goalId?: string;
    templateId?: string;
    title: string;
    description: string;
    difficulty: number;
    isRealityShift?: boolean;
    scheduledDate: Date;
    personalizationNotes?: string;
}) {
    const id = generateId();
    const result = await pool.query(
        `INSERT INTO "Challenge" (id, "userId", "goalId", "templateId", title, description, 
     difficulty, "isRealityShift", "scheduledDate", "personalizationNotes", status, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW()) RETURNING *`,
        [id, data.userId, data.goalId, data.templateId, data.title, data.description,
            data.difficulty, data.isRealityShift || false, data.scheduledDate, data.personalizationNotes]
    );
    return result.rows[0];
}

export async function completeChallenge(id: string) {
    const result = await pool.query(
        `UPDATE "Challenge" SET status = 'completed', "completedAt" = NOW() WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
}

export async function skipChallenge(id: string, reason?: string) {
    const result = await pool.query(
        `UPDATE "Challenge" SET status = 'skipped', "skippedReason" = $2 WHERE id = $1 RETURNING *`,
        [id, reason]
    );
    return result.rows[0];
}

export async function getCompletedChallengesCount(userId: string) {
    const result = await pool.query(
        `SELECT COUNT(*) as count FROM "Challenge" WHERE "userId" = $1 AND status = 'completed'`,
        [userId]
    );
    return parseInt(result.rows[0].count);
}

export async function getRecentCompletedChallenges(userId: string, limit: number = 30) {
    const result = await pool.query(
        `SELECT * FROM "Challenge" WHERE "userId" = $1 AND status = 'completed' 
     ORDER BY "completedAt" DESC LIMIT $2`,
        [userId, limit]
    );
    return result.rows;
}

// ==================== CHALLENGE LOG OPERATIONS ====================

export async function createChallengeLog(data: {
    challengeId: string;
    userId: string;
    difficultyFelt?: number;
    satisfaction?: number;
    notes?: string;
}) {
    const id = generateId();
    const result = await pool.query(
        `INSERT INTO "ChallengeLog" (id, "challengeId", "userId", "difficultyFelt", satisfaction, notes, "completedAt")
     VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
        [id, data.challengeId, data.userId, data.difficultyFelt, data.satisfaction, data.notes]
    );
    return result.rows[0];
}

export async function getChallengeLogsByUserId(userId: string, limit: number = 10) {
    const result = await pool.query(
        `SELECT * FROM "ChallengeLog" WHERE "userId" = $1 ORDER BY "completedAt" DESC LIMIT $2`,
        [userId, limit]
    );
    return result.rows;
}

// ==================== DAILY SURVEY OPERATIONS ====================

export async function createOrUpdateDailySurvey(data: {
    userId: string;
    surveyDate: Date;
    energyLevel: number;
    motivationLevel: number;
    overallMood: number;
    sleepQuality?: number;
    stressLevel?: number;
    biggestWin?: string;
    biggestBlocker?: string;
    gratitudeNote?: string;
    tomorrowIntention?: string;
    completionLevel?: string;
}) {
    const id = generateId();
    const result = await pool.query(
        `INSERT INTO "DailySurvey" (id, "userId", "surveyDate", "energyLevel", "motivationLevel", 
     "overallMood", "sleepQuality", "stressLevel", "biggestWin", "biggestBlocker", 
     "gratitudeNote", "tomorrowIntention", "completionLevel", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
     ON CONFLICT ("userId", "surveyDate") 
     DO UPDATE SET "energyLevel" = $4, "motivationLevel" = $5, "overallMood" = $6,
                   "sleepQuality" = $7, "stressLevel" = $8, "biggestWin" = $9,
                   "biggestBlocker" = $10, "gratitudeNote" = $11, "tomorrowIntention" = $12,
                   "completionLevel" = $13
     RETURNING *`,
        [id, data.userId, data.surveyDate, data.energyLevel, data.motivationLevel,
            data.overallMood, data.sleepQuality, data.stressLevel, data.biggestWin,
            data.biggestBlocker, data.gratitudeNote, data.tomorrowIntention, data.completionLevel || 'minimum']
    );
    return result.rows[0];
}

export async function getSurveysByUserId(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await pool.query(
        `SELECT * FROM "DailySurvey" WHERE "userId" = $1 AND "surveyDate" >= $2 ORDER BY "surveyDate" DESC`,
        [userId, startDate.toISOString()]
    );
    return result.rows;
}

// ==================== DIARY ENTRY OPERATIONS ====================

export async function createDiaryEntry(data: {
    userId: string;
    goalId?: string;
    challengeId?: string;
    entryType?: string;
    audioUrl?: string; // For now we might just store text or a placeholder URL
    audioDurationSeconds?: number;
    transcript?: string;
    moodScore?: number;
    aiSummary?: string;
    aiInsights?: string;
}) {
    const id = generateId();
    const result = await pool.query(
        `INSERT INTO "DiaryEntry" (id, "userId", "goalId", "challengeId", "entryType", 
     "audioUrl", "audioDurationSeconds", transcript, "moodScore", "aiSummary", "aiInsights", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING *`,
        [id, data.userId, data.goalId, data.challengeId, data.entryType || 'voice',
            data.audioUrl, data.audioDurationSeconds, data.transcript, data.moodScore,
            data.aiSummary, data.aiInsights]
    );
    return result.rows[0];
}

export async function getDiaryEntriesByUserId(userId: string, limit: number = 20) {
    const result = await pool.query(
        `SELECT * FROM "DiaryEntry" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT $2`,
        [userId, limit]
    );
    return result.rows;
}

export async function getDiaryEntriesCount(userId: string) {
    const result = await pool.query(
        `SELECT COUNT(*) as count FROM "DiaryEntry" WHERE "userId" = $1`,
        [userId]
    );
    return parseInt(result.rows[0].count);
}

// ==================== UTILITY FUNCTIONS ====================

export async function calculateStreak(userId: string): Promise<number> {
    const recentChallenges = await getRecentCompletedChallenges(userId, 30);

    let streak = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const hasCompletion = recentChallenges.some(c =>
            c.completedAt && new Date(c.completedAt).toISOString().split('T')[0] === dateStr
        );

        if (hasCompletion) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else if (i > 0) {
            break;
        } else {
            checkDate.setDate(checkDate.getDate() - 1);
        }
    }

    return streak;
}

// ==================== USER PREFERENCES OPERATIONS ====================

export async function getUserPreferences(userId: string) {
    const result = await pool.query(
        `SELECT * FROM "UserPreferences" WHERE "userId" = $1`,
        [userId]
    );

    if (result.rows.length === 0) {
        // Create default preferences if none exist
        const id = generateId();
        const newResult = await pool.query(
            `INSERT INTO "UserPreferences" (id, "userId", "createdAt", "updatedAt")
             VALUES ($1, $2, NOW(), NOW())
             ON CONFLICT ("userId") DO UPDATE SET "updatedAt" = NOW()
             RETURNING *`,
            [id, userId]
        );
        return parsePreferences(newResult.rows[0]);
    }

    return parsePreferences(result.rows[0]);
}

function parsePreferences(row: any) {
    if (!row) return null;
    return {
        ...row,
        focusAreas: row.focusAreas ? JSON.parse(row.focusAreas) : [],
        avoidAreas: row.avoidAreas ? JSON.parse(row.avoidAreas) : []
    };
}

export async function saveUserPreferences(userId: string, prefs: {
    displayName?: string;
    preferredDifficulty?: number;
    challengesPerDay?: number;
    realityShiftEnabled?: boolean;
    preferredChallengeTime?: string;
    focusAreas?: string[];
    avoidAreas?: string[];
    aiPersonality?: string;
    includeScientificBasis?: boolean;
    challengeLengthPreference?: string;
    notificationsEnabled?: boolean;
    dailyReminderTime?: string;
    streakReminders?: boolean;
    theme?: string;
}) {
    const id = generateId();
    const result = await pool.query(
        `INSERT INTO "UserPreferences" (
            id, "userId", "displayName", "preferredDifficulty", "challengesPerDay",
            "realityShiftEnabled", "preferredChallengeTime", "focusAreas", "avoidAreas",
            "aiPersonality", "includeScientificBasis", "challengeLengthPreference",
            "notificationsEnabled", "dailyReminderTime", "streakReminders", "theme",
            "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
        ON CONFLICT ("userId") DO UPDATE SET
            "displayName" = COALESCE($3, "UserPreferences"."displayName"),
            "preferredDifficulty" = COALESCE($4, "UserPreferences"."preferredDifficulty"),
            "challengesPerDay" = COALESCE($5, "UserPreferences"."challengesPerDay"),
            "realityShiftEnabled" = COALESCE($6, "UserPreferences"."realityShiftEnabled"),
            "preferredChallengeTime" = COALESCE($7, "UserPreferences"."preferredChallengeTime"),
            "focusAreas" = COALESCE($8, "UserPreferences"."focusAreas"),
            "avoidAreas" = COALESCE($9, "UserPreferences"."avoidAreas"),
            "aiPersonality" = COALESCE($10, "UserPreferences"."aiPersonality"),
            "includeScientificBasis" = COALESCE($11, "UserPreferences"."includeScientificBasis"),
            "challengeLengthPreference" = COALESCE($12, "UserPreferences"."challengeLengthPreference"),
            "notificationsEnabled" = COALESCE($13, "UserPreferences"."notificationsEnabled"),
            "dailyReminderTime" = COALESCE($14, "UserPreferences"."dailyReminderTime"),
            "streakReminders" = COALESCE($15, "UserPreferences"."streakReminders"),
            "theme" = COALESCE($16, "UserPreferences"."theme"),
            "updatedAt" = NOW()
        RETURNING *`,
        [
            id, userId,
            prefs.displayName,
            prefs.preferredDifficulty,
            prefs.challengesPerDay,
            prefs.realityShiftEnabled,
            prefs.preferredChallengeTime,
            prefs.focusAreas ? JSON.stringify(prefs.focusAreas) : null,
            prefs.avoidAreas ? JSON.stringify(prefs.avoidAreas) : null,
            prefs.aiPersonality,
            prefs.includeScientificBasis,
            prefs.challengeLengthPreference,
            prefs.notificationsEnabled,
            prefs.dailyReminderTime,
            prefs.streakReminders,
            prefs.theme
        ]
    );

    return parsePreferences(result.rows[0]);
}

// ==================== CONVERSATION OPERATIONS ====================

export async function createConversation(data: {
    userId: string;
    conversationType: string;
    title?: string;
    goalId?: string;
    initialMessages?: any[];
    context?: any;
}) {
    const id = generateId();
    const messagesJson = JSON.stringify(data.initialMessages || []);
    const contextJson = JSON.stringify(data.context || {});

    const result = await pool.query(
        `INSERT INTO "Conversation" (id, "userId", "conversationType", title, "goalId", messages, context, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *`,
        [id, data.userId, data.conversationType, data.title, data.goalId, messagesJson, contextJson]
    );
    return result.rows[0];
}

export async function getConversationsByUserId(userId: string, limit: number = 10) {
    const result = await pool.query(
        `SELECT * FROM "Conversation" WHERE "userId" = $1 ORDER BY "updatedAt" DESC LIMIT $2`,
        [userId, limit]
    );
    return result.rows.map(row => ({
        ...row,
        messages: row.messages ? JSON.parse(row.messages) : [],
        context: row.context ? JSON.parse(row.context) : null
    }));
}

export async function getLatestConversation(userId: string) {
    const result = await pool.query(
        `SELECT * FROM "Conversation" WHERE "userId" = $1 ORDER BY "updatedAt" DESC LIMIT 1`,
        [userId]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
        ...row,
        messages: row.messages ? JSON.parse(row.messages) : [],
        context: row.context ? JSON.parse(row.context) : null
    };
}

export async function getExpertConversation(userId: string, coachId: string) {
    // If coachId is 'general', we might check for 'general' OR null/legacy conversations
    // But for strict separation, we'll enforce context->>'coachId'

    // Postgres JSONB query for performance if we used JSONB, but text is fine for small scale
    // Note: Assuming 'context' column is TEXT (based on other functions), using string parsing or simple exact match pattern?
    // Postgres has JSON operators even on TEXT with casting.

    // Safer approach compatible with potential SQLite/limitations: Fetch recent expert chats and filter in code
    // OR use specific query if we know it's Postgres (which we do: pg pool).

    const result = await pool.query(
        `SELECT * FROM "Conversation" 
         WHERE "userId" = $1 
         AND "conversationType" = 'expert_chat'
         AND (context::jsonb->>'coachId' = $2 OR ($2 = 'general' AND (context::jsonb->>'coachId' IS NULL OR context::jsonb->>'coachId' = 'general')))
         ORDER BY "updatedAt" DESC 
         LIMIT 1`,
        [userId, coachId]
    );

    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
        ...row,
        messages: row.messages ? JSON.parse(row.messages) : [],
        context: row.context ? JSON.parse(row.context) : null
    };
}

export async function updateConversationMessages(id: string, messages: any[]) {
    const messagesJson = JSON.stringify(messages);
    const result = await pool.query(
        `UPDATE "Conversation" SET messages = $2, "updatedAt" = NOW() WHERE id = $1 RETURNING *`,
        [id, messagesJson]
    );
    return result.rows[0];
}

// Export pool for direct queries if needed
export { pool, generateId };

