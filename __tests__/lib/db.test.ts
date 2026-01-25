/**
 * Unit Tests for lib/db.ts
 * Tests database operations with real database to keep it active
 * 
 * Test data is prefixed with "test_" for easy identification and cleanup
 */

import * as db from '@/lib/db';
import { prisma } from '@/lib/prisma';

// Test data prefix for cleanup
const TEST_PREFIX = `test_${Date.now()}`;

// Cleanup function to remove test data
async function cleanupTestUser(userId: string) {
    try {
        // Delete in order to respect foreign keys
        await prisma.habitLog.deleteMany({ where: { habit: { userId } } });
        await prisma.habit.deleteMany({ where: { userId } });
        await prisma.challengeLog.deleteMany({ where: { userId } });
        await prisma.challenge.deleteMany({ where: { userId } });
        await prisma.diaryEntry.deleteMany({ where: { userId } });
        await prisma.dailySurvey.deleteMany({ where: { userId } });
        await prisma.conversation.deleteMany({ where: { userId } });
        await prisma.progressSnapshot.deleteMany({ where: { userId } });
        await prisma.customCoach.deleteMany({ where: { userId } });
        await prisma.goal.deleteMany({ where: { userId } });
        await prisma.userPreferences.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } }).catch(() => { });
    } catch (e) {
        // Ignore cleanup errors
    }
}

describe('lib/db.ts', () => {
    let testUserId: string | null = null;
    let testGoalId: string | null = null;
    let testHabitId: string | null = null;
    let testChallengeId: string | null = null;

    // Cleanup after all tests
    afterAll(async () => {
        if (testUserId) {
            await cleanupTestUser(testUserId);
        }
        await prisma.$disconnect();
    });

    describe('Utility Functions', () => {
        it('generateId should return a valid UUID-like string', () => {
            const id = db.generateId();

            expect(id).toBeDefined();
            expect(typeof id).toBe('string');
            expect(id.length).toBe(36);
            expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
        });

        it('generateId should produce unique values', () => {
            const ids = new Set<string>();
            for (let i = 0; i < 100; i++) {
                ids.add(db.generateId());
            }
            expect(ids.size).toBe(100);
        });
    });

    describe('User Operations', () => {
        it('should create a new user', async () => {
            const userData = {
                email: `${TEST_PREFIX}@test.local`,
                passwordHash: 'hashed_password_here',
                displayName: 'Test User'
            };

            const user = await db.createUser(userData);
            testUserId = user.id;

            expect(user).toBeDefined();
            expect(user.id).toBeDefined();
            expect(user.email).toBe(userData.email);
            expect(user.displayName).toBe(userData.displayName);
            expect(user.onboardingCompleted).toBe(false);
        });

        it('should get user by ID', async () => {
            expect(testUserId).not.toBeNull();

            const user = await db.getUserById(testUserId!);

            expect(user).toBeDefined();
            expect(user?.id).toBe(testUserId);
            expect(user?.email).toContain(TEST_PREFIX);
        });

        it('should get user by email', async () => {
            const email = `${TEST_PREFIX}@test.local`;

            const user = await db.getUserByEmail(email);

            expect(user).toBeDefined();
            expect(user?.email).toBe(email);
            expect(user?.id).toBe(testUserId);
        });

        it('should return null for non-existent user ID', async () => {
            const user = await db.getUserById('non-existent-id');
            expect(user).toBeNull();
        });

        it('should return null for non-existent email', async () => {
            const user = await db.getUserByEmail('nonexistent@test.local');
            expect(user).toBeNull();
        });
    });

    describe('Goal Domain Operations', () => {
        it('should get all goal domains', async () => {
            const domains = await db.getAllGoalDomains();

            expect(domains).toBeDefined();
            expect(Array.isArray(domains)).toBe(true);
            // Database should have some seed data
            if (domains.length > 0) {
                expect(domains[0]).toHaveProperty('id');
                expect(domains[0]).toHaveProperty('name');
            }
        });
    });

    describe('Goal Operations', () => {
        it('should create a goal', async () => {
            expect(testUserId).not.toBeNull();

            const goalData = {
                userId: testUserId!,
                domainId: 1,
                title: `${TEST_PREFIX}_Test Goal`,
                description: 'A test goal for unit testing',
                currentState: 'Current state',
                desiredState: 'Desired state',
                difficultyLevel: 5,
                realityShiftEnabled: false
            };

            const goal = await db.createGoal(goalData);
            testGoalId = goal.id;

            expect(goal).toBeDefined();
            expect(goal.id).toBeDefined();
            expect(goal.title).toBe(goalData.title);
            expect(goal.userId).toBe(testUserId);
            expect(goal.status).toBe('active');
        });

        it('should get goals by user ID', async () => {
            expect(testUserId).not.toBeNull();

            const goals = await db.getGoalsByUserId(testUserId!);

            expect(goals).toBeDefined();
            expect(Array.isArray(goals)).toBe(true);
            expect(goals.length).toBeGreaterThan(0);
            expect(goals.some(g => g.id === testGoalId)).toBe(true);
        });

        it('should get active goal by user ID', async () => {
            expect(testUserId).not.toBeNull();

            const goal = await db.getActiveGoalByUserId(testUserId!);

            expect(goal).toBeDefined();
            expect(goal?.status).toBe('active');
        });

        it('should get goal by ID', async () => {
            expect(testGoalId).not.toBeNull();

            const goal = await db.getGoalById(testGoalId!);

            expect(goal).toBeDefined();
            expect(goal?.id).toBe(testGoalId);
        });

        it('should update goal status', async () => {
            expect(testGoalId).not.toBeNull();

            const updated = await db.updateGoalStatus(testGoalId!, 'paused');

            expect(updated.status).toBe('paused');

            // Reset to active for other tests
            await db.updateGoalStatus(testGoalId!, 'active');
        });
    });

    describe('Challenge Operations', () => {
        it('should create a challenge', async () => {
            expect(testUserId).not.toBeNull();
            expect(testGoalId).not.toBeNull();

            const challengeData = {
                userId: testUserId!,
                goalId: testGoalId!,
                title: `${TEST_PREFIX}_Test Challenge`,
                description: 'A test challenge',
                difficulty: 3,
                isRealityShift: false,
                scheduledDate: new Date()
            };

            const challenge = await db.createChallenge(challengeData);
            testChallengeId = challenge.id;

            expect(challenge).toBeDefined();
            expect(challenge.id).toBeDefined();
            expect(challenge.title).toBe(challengeData.title);
            expect(challenge.status).toBe('pending');
        });

        it('should get challenges by user ID', async () => {
            expect(testUserId).not.toBeNull();

            const challenges = await db.getChallengesByUserId(testUserId!);

            expect(challenges).toBeDefined();
            expect(Array.isArray(challenges)).toBe(true);
            expect(challenges.length).toBeGreaterThan(0);
        });

        it('should get challenge by ID', async () => {
            expect(testChallengeId).not.toBeNull();

            const challenge = await db.getChallengeById(testChallengeId!);

            expect(challenge).toBeDefined();
            expect(challenge?.id).toBe(testChallengeId);
        });

        it('should complete a challenge', async () => {
            expect(testChallengeId).not.toBeNull();

            const completed = await db.completeChallenge(testChallengeId!);

            expect(completed.status).toBe('completed');
            expect(completed.completedAt).toBeDefined();
        });

        it('should get completed challenges count', async () => {
            expect(testUserId).not.toBeNull();

            const count = await db.getCompletedChallengesCount(testUserId!);

            expect(typeof count).toBe('number');
            expect(count).toBeGreaterThanOrEqual(1);
        });

        it('should create a challenge log', async () => {
            expect(testChallengeId).not.toBeNull();
            expect(testUserId).not.toBeNull();

            const logData = {
                challengeId: testChallengeId!,
                userId: testUserId!,
                difficultyFelt: 4,
                satisfaction: 5,
                notes: 'Test completion notes'
            };

            const log = await db.createChallengeLog(logData);

            expect(log).toBeDefined();
            expect(log.challengeId).toBe(testChallengeId);
            expect(log.difficultyFelt).toBe(4);
        });
    });

    describe('Habit Operations', () => {
        it('should create a habit', async () => {
            expect(testUserId).not.toBeNull();

            const habitData = {
                userId: testUserId!,
                name: `${TEST_PREFIX}_Test Habit`,
                description: 'A test habit',
                icon: '✅',
                frequency: 'daily'
            };

            const habit = await db.createHabit(habitData);
            testHabitId = habit.id;

            expect(habit).toBeDefined();
            expect(habit.id).toBeDefined();
            expect(habit.name).toBe(habitData.name);
            expect(habit.isActive).toBe(true);
        });

        it('should get habits by user ID', async () => {
            expect(testUserId).not.toBeNull();

            const habits = await db.getHabitsByUserId(testUserId!);

            expect(habits).toBeDefined();
            expect(Array.isArray(habits)).toBe(true);
            expect(habits.length).toBeGreaterThan(0);
            expect(habits.some(h => h.id === testHabitId)).toBe(true);
        });

        it('should get habit by ID', async () => {
            expect(testHabitId).not.toBeNull();

            const habit = await db.getHabitById(testHabitId!);

            expect(habit).toBeDefined();
            expect(habit?.id).toBe(testHabitId);
        });

        it('should update a habit', async () => {
            expect(testHabitId).not.toBeNull();

            const updated = await db.updateHabit(testHabitId!, {
                name: `${TEST_PREFIX}_Updated Habit`,
                description: 'Updated description'
            });

            expect(updated.name).toBe(`${TEST_PREFIX}_Updated Habit`);
        });

        it('should upsert habit log', async () => {
            expect(testHabitId).not.toBeNull();

            const logData = {
                habitId: testHabitId!,
                logDate: new Date(),
                completed: true,
                notes: 'Test habit log'
            };

            const log = await db.upsertHabitLog(logData);

            expect(log).toBeDefined();
            expect(log.completed).toBe(true);
        });

        it('should calculate habit streak', async () => {
            expect(testHabitId).not.toBeNull();

            const streak = await db.calculateHabitStreak(testHabitId!);

            expect(typeof streak).toBe('number');
            expect(streak).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Daily Survey Operations', () => {
        it('should create or update daily survey', async () => {
            expect(testUserId).not.toBeNull();

            const surveyData = {
                userId: testUserId!,
                surveyDate: new Date(),
                energyLevel: 7,
                motivationLevel: 8,
                overallMood: 7,
                sleepQuality: 6,
                stressLevel: 4,
                biggestWin: 'Completed tests',
                completionLevel: 'extended'
            };

            const survey = await db.createOrUpdateDailySurvey(surveyData);

            expect(survey).toBeDefined();
            expect(survey.energyLevel).toBe(7);
            expect(survey.userId).toBe(testUserId);
        });

        it('should get surveys by user ID', async () => {
            expect(testUserId).not.toBeNull();

            const surveys = await db.getSurveysByUserId(testUserId!);

            expect(surveys).toBeDefined();
            expect(Array.isArray(surveys)).toBe(true);
        });
    });

    describe('Diary Entry Operations', () => {
        it('should create a diary entry', async () => {
            expect(testUserId).not.toBeNull();

            const entryData = {
                userId: testUserId!,
                entryType: 'text',
                transcript: 'Test diary entry content',
                moodScore: 7
            };

            const entry = await db.createDiaryEntry(entryData);

            expect(entry).toBeDefined();
            expect(entry.userId).toBe(testUserId);
            expect(entry.transcript).toBe(entryData.transcript);
        });

        it('should get diary entries by user ID', async () => {
            expect(testUserId).not.toBeNull();

            const entries = await db.getDiaryEntriesByUserId(testUserId!);

            expect(entries).toBeDefined();
            expect(Array.isArray(entries)).toBe(true);
            expect(entries.length).toBeGreaterThan(0);
        });

        it('should get diary entries count', async () => {
            expect(testUserId).not.toBeNull();

            const count = await db.getDiaryEntriesCount(testUserId!);

            expect(typeof count).toBe('number');
            expect(count).toBeGreaterThan(0);
        });
    });

    describe('User Preferences Operations', () => {
        it('should get user preferences (creates default if not exists)', async () => {
            expect(testUserId).not.toBeNull();

            const prefs = await db.getUserPreferences(testUserId!);

            expect(prefs).toBeDefined();
            expect(prefs?.userId).toBe(testUserId);
        });

        it('should save user preferences', async () => {
            expect(testUserId).not.toBeNull();

            const newPrefs = {
                displayName: 'Updated Display Name',
                preferredDifficulty: 7,
                challengesPerDay: 3,
                theme: 'dark'
            };

            const saved = await db.saveUserPreferences(testUserId!, newPrefs);

            expect(saved).toBeDefined();
            expect(saved?.displayName).toBe(newPrefs.displayName);
            expect(saved?.preferredDifficulty).toBe(7);
        });
    });

    describe('Custom Coach Operations', () => {
        let testCoachId: string | null = null;

        it('should create a custom coach', async () => {
            expect(testUserId).not.toBeNull();

            const coachData = {
                userId: testUserId!,
                name: `${TEST_PREFIX}_Test Coach`,
                icon: '🤖',
                color: '#8b5cf6',
                systemPrompt: 'You are a test coach for unit testing.'
            };

            const coach = await db.createCustomCoach(coachData);
            testCoachId = coach.id;

            expect(coach).toBeDefined();
            expect(coach.name).toBe(coachData.name);
        });

        it('should get custom coaches by user ID', async () => {
            expect(testUserId).not.toBeNull();

            const coaches = await db.getCustomCoachesByUserId(testUserId!);

            expect(coaches).toBeDefined();
            expect(Array.isArray(coaches)).toBe(true);
            expect(coaches.length).toBeGreaterThan(0);
        });

        it('should delete custom coach', async () => {
            expect(testCoachId).not.toBeNull();
            expect(testUserId).not.toBeNull();

            const deleted = await db.deleteCustomCoach(testCoachId!, testUserId!);

            expect(deleted).toBeDefined();
        });
    });

    describe('Conversation Operations', () => {
        let testConversationId: string | null = null;

        it('should create a conversation', async () => {
            expect(testUserId).not.toBeNull();

            const convData = {
                userId: testUserId!,
                conversationType: 'test_chat',
                title: `${TEST_PREFIX}_Test Conversation`,
                initialMessages: [{ role: 'user', content: 'Hello' }]
            };

            const conv = await db.createConversation(convData);
            testConversationId = conv.id;

            expect(conv).toBeDefined();
            expect(conv.conversationType).toBe('test_chat');
        });

        it('should get conversations by user ID', async () => {
            expect(testUserId).not.toBeNull();

            const convs = await db.getConversationsByUserId(testUserId!);

            expect(convs).toBeDefined();
            expect(Array.isArray(convs)).toBe(true);
            expect(convs.length).toBeGreaterThan(0);
        });

        it('should update conversation messages', async () => {
            expect(testConversationId).not.toBeNull();

            const newMessages = [
                { role: 'user', content: 'Hello' },
                { role: 'assistant', content: 'Hi there!' }
            ];

            const updated = await db.updateConversationMessages(testConversationId!, newMessages);

            expect(updated).toBeDefined();
        });
    });

    describe('Streak Calculation', () => {
        it('should calculate user streak', async () => {
            expect(testUserId).not.toBeNull();

            const streak = await db.calculateStreak(testUserId!);

            expect(typeof streak).toBe('number');
            expect(streak).toBeGreaterThanOrEqual(0);
        });
    });
});
