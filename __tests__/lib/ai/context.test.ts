/**
 * Unit tests for lib/ai/context.ts
 *
 * Tests:
 * - getUserContext handles missing data gracefully
 * - validateVoiceId returns valid voices and falls back to 'nova' for invalid ones
 * - getPersonalizationSettings returns proper defaults
 * - buildEnhancedSystemPrompt handles various context scenarios
 */

// Mock dependencies before imports
jest.mock('@/lib/db', () => ({
    getActiveGoalByUserId: jest.fn(),
    getGoalsByUserId: jest.fn(),
    getUserById: jest.fn(),
    getChallengesByUserId: jest.fn(),
    getTodayChallenge: jest.fn(),
    calculateStreak: jest.fn(),
    getUserPreferences: jest.fn(),
    getSurveysByUserId: jest.fn(),
    getHabitStats: jest.fn(),
    getHabitLogsForDate: jest.fn(),
    getDiaryEntriesByUserId: jest.fn(),
}));

jest.mock('../../../lib/ai/rotation', () => ({
    getDailyFocus: jest.fn(() => ({
        id: 'discipline',
        name: 'Discipline',
        prompt: 'Today focus on building discipline and consistency.',
    })),
}));

import * as db from '@/lib/db';
import {
    getUserContext,
    validateVoiceId,
    getPersonalizationSettings,
    buildEnhancedSystemPrompt,
    VALID_VOICE_IDS,
    UserContext,
} from '../../../lib/ai/context';
import { getDailyFocus } from '../../../lib/ai/rotation';

describe('AI Context Module', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('validateVoiceId', () => {
        it('returns valid voice ID when provided', () => {
            expect(validateVoiceId('alloy')).toBe('alloy');
            expect(validateVoiceId('ash')).toBe('ash');
            expect(validateVoiceId('coral')).toBe('coral');
            expect(validateVoiceId('echo')).toBe('echo');
            expect(validateVoiceId('fable')).toBe('fable');
            expect(validateVoiceId('onyx')).toBe('onyx');
            expect(validateVoiceId('nova')).toBe('nova');
            expect(validateVoiceId('sage')).toBe('sage');
            expect(validateVoiceId('shimmer')).toBe('shimmer');
        });

        it('falls back to nova for invalid voice ID', () => {
            expect(validateVoiceId('invalid-voice')).toBe('nova');
            expect(validateVoiceId('notavoice')).toBe('nova');
            expect(validateVoiceId('ALLOY')).toBe('nova'); // Case sensitive
        });

        it('falls back to nova for null', () => {
            expect(validateVoiceId(null)).toBe('nova');
        });

        it('falls back to nova for undefined', () => {
            expect(validateVoiceId(undefined)).toBe('nova');
        });

        it('falls back to nova for empty string', () => {
            expect(validateVoiceId('')).toBe('nova');
        });
    });

    describe('VALID_VOICE_IDS constant', () => {
        it('contains all 9 OpenAI voices', () => {
            expect(VALID_VOICE_IDS).toHaveLength(9);
            expect(VALID_VOICE_IDS).toContain('alloy');
            expect(VALID_VOICE_IDS).toContain('ash');
            expect(VALID_VOICE_IDS).toContain('coral');
            expect(VALID_VOICE_IDS).toContain('echo');
            expect(VALID_VOICE_IDS).toContain('fable');
            expect(VALID_VOICE_IDS).toContain('onyx');
            expect(VALID_VOICE_IDS).toContain('nova');
            expect(VALID_VOICE_IDS).toContain('sage');
            expect(VALID_VOICE_IDS).toContain('shimmer');
        });
    });

    describe('getUserContext', () => {
        const mockGoal = {
            id: 'goal-1',
            userId: 'user-123',
            title: 'Learn Spanish',
            currentState: 'Beginner',
            desiredState: 'Fluent',
            difficultyLevel: 5,
            startedAt: new Date('2024-01-01'),
            status: 'active',
        };

        const mockChallenges = [
            { id: 'c1', title: 'Challenge 1', status: 'completed', difficulty: 5 },
            { id: 'c2', title: 'Challenge 2', status: 'active', difficulty: 3 },
            { id: 'c3', title: 'Challenge 3', status: 'completed', difficulty: 4 },
        ];

        const mockPreferences = {
            preferredDifficulty: 7,
            displayName: 'Test User',
            aiCustomName: 'Coach Max',
            tonePreference: 'friendly',
            rudeMode: false,
            voiceId: 'onyx',
        };

        const mockSurveys = [
            { overallMood: 8, surveyDate: new Date() },
            { overallMood: 6, surveyDate: new Date() },
        ];

        beforeEach(() => {
            (db.getGoalsByUserId as jest.Mock).mockResolvedValue([mockGoal]);
            (db.getActiveGoalByUserId as jest.Mock).mockResolvedValue(mockGoal);
            (db.getUserById as jest.Mock).mockResolvedValue({ onboardingData: null });
            (db.getChallengesByUserId as jest.Mock).mockResolvedValue(mockChallenges);
            (db.getTodayChallenge as jest.Mock).mockResolvedValue(mockChallenges[1]);
            (db.calculateStreak as jest.Mock).mockResolvedValue(5);
            (db.getUserPreferences as jest.Mock).mockResolvedValue(mockPreferences);
            (db.getSurveysByUserId as jest.Mock).mockResolvedValue(mockSurveys);
            (db.getHabitStats as jest.Mock).mockResolvedValue({ totalHabits: 0, habits: [] });
            (db.getHabitLogsForDate as jest.Mock).mockResolvedValue([]);
            (db.getDiaryEntriesByUserId as jest.Mock).mockResolvedValue([]);
        });

        it('returns complete context when all data is available', async () => {
            const context = await getUserContext('user-123');

            expect(context).not.toBeNull();
            expect(context!.activeGoal).toEqual(mockGoal);
            expect(context!.allActiveGoals).toEqual([mockGoal]);
            expect(context!.todayChallenge).toEqual(mockChallenges[1]);
            expect(context!.completedChallengesCount).toBe(2);
            expect(context!.totalChallenges).toBe(3);
            expect(context!.streak).toBe(5);
            expect(context!.avgMood).toBe(7); // (8+6)/2 = 7
            expect(context!.preferences).toEqual(mockPreferences);
        });

        it('handles missing goal gracefully', async () => {
            (db.getGoalsByUserId as jest.Mock).mockResolvedValue([]);

            const context = await getUserContext('user-123');

            expect(context).not.toBeNull();
            expect(context!.activeGoal).toBeNull();
            expect(context!.dayInJourney).toBe(0);
        });

        it('handles missing challenges gracefully', async () => {
            (db.getChallengesByUserId as jest.Mock).mockResolvedValue([]);

            const context = await getUserContext('user-123');

            expect(context).not.toBeNull();
            expect(context!.completedChallengesCount).toBe(0);
            expect(context!.totalChallenges).toBe(0);
            expect(context!.recentChallenges).toEqual([]);
        });

        it('handles missing today challenge gracefully', async () => {
            (db.getTodayChallenge as jest.Mock).mockResolvedValue(null);

            const context = await getUserContext('user-123');

            expect(context).not.toBeNull();
            expect(context!.todayChallenge).toBeNull();
        });

        it('handles missing surveys gracefully (avgMood null)', async () => {
            (db.getSurveysByUserId as jest.Mock).mockResolvedValue([]);

            const context = await getUserContext('user-123');

            expect(context).not.toBeNull();
            expect(context!.avgMood).toBeNull();
            expect(context!.recentSurveys).toEqual([]);
        });

        it('handles missing preferences gracefully', async () => {
            (db.getUserPreferences as jest.Mock).mockResolvedValue(null);

            const context = await getUserContext('user-123');

            expect(context).not.toBeNull();
            expect(context!.preferences).toBeNull();
        });

        it('returns null on database error', async () => {
            (db.getGoalsByUserId as jest.Mock).mockRejectedValue(new Error('DB Error'));

            const context = await getUserContext('user-123');

            expect(context).toBeNull();
        });

        it('calculates dayInJourney correctly', async () => {
            // Set startedAt to 10 days ago
            const tenDaysAgo = new Date();
            tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
            const goalWithDate = { ...mockGoal, startedAt: tenDaysAgo };
            (db.getGoalsByUserId as jest.Mock).mockResolvedValue([goalWithDate]);

            const context = await getUserContext('user-123');

            expect(context).not.toBeNull();
            expect(context!.dayInJourney).toBeGreaterThanOrEqual(10);
            expect(context!.dayInJourney).toBeLessThanOrEqual(11); // Account for time zone edge cases
        });

        it('rounds avgMood to one decimal place', async () => {
            (db.getSurveysByUserId as jest.Mock).mockResolvedValue([
                { overallMood: 7 },
                { overallMood: 8 },
                { overallMood: 9 },
            ]);

            const context = await getUserContext('user-123');

            expect(context).not.toBeNull();
            expect(context!.avgMood).toBe(8); // (7+8+9)/3 = 8
        });

        it('limits recent challenges to 5', async () => {
            const manyChallenges = Array.from({ length: 10 }, (_, i) => ({
                id: `c${i}`,
                title: `Challenge ${i}`,
                status: 'completed',
                difficulty: 5,
            }));
            (db.getChallengesByUserId as jest.Mock).mockResolvedValue(manyChallenges);

            const context = await getUserContext('user-123');

            expect(context).not.toBeNull();
            expect(context!.recentChallenges).toHaveLength(5);
        });
    });

    describe('getPersonalizationSettings', () => {
        it('returns settings from context when available', () => {
            const context: UserContext = {
                activeGoal: null,
                allActiveGoals: [],
                todayChallenge: null,
                completedChallengesCount: 0,
                totalChallenges: 0,
                streak: 0,
                avgMood: null,
                dayInJourney: 0,
                recentChallenges: [],
                preferences: {
                    aiCustomName: 'Coach Max',
                    tonePreference: 'professional',
                    rudeMode: true,
                    voiceId: 'onyx',
                },
                recentDiary: [],
                recentSurveys: [],
                habitStats: null,
                todayHabitLogs: [],
                onboardingAnswers: null,
            };

            const settings = getPersonalizationSettings(context);

            expect(settings.aiCustomName).toBe('Coach Max');
            expect(settings.tonePreference).toBe('professional');
            expect(settings.rudeMode).toBe(true);
            expect(settings.voiceId).toBe('onyx');
        });

        it('returns defaults when context is null', () => {
            const settings = getPersonalizationSettings(null);

            expect(settings.aiCustomName).toBeNull();
            expect(settings.tonePreference).toBe('friendly');
            expect(settings.rudeMode).toBe(false);
            expect(settings.voiceId).toBe('nova');
        });

        it('returns defaults when preferences are null', () => {
            const context: UserContext = {
                activeGoal: null,
                allActiveGoals: [],
                todayChallenge: null,
                completedChallengesCount: 0,
                totalChallenges: 0,
                streak: 0,
                avgMood: null,
                dayInJourney: 0,
                recentChallenges: [],
                preferences: null,
                recentDiary: [],
                recentSurveys: [],
                habitStats: null,
                todayHabitLogs: [],
                onboardingAnswers: null,
            };

            const settings = getPersonalizationSettings(context);

            expect(settings.aiCustomName).toBeNull();
            expect(settings.tonePreference).toBe('friendly');
            expect(settings.rudeMode).toBe(false);
            expect(settings.voiceId).toBe('nova');
        });

        it('validates and corrects invalid voiceId', () => {
            const context: UserContext = {
                activeGoal: null,
                allActiveGoals: [],
                todayChallenge: null,
                completedChallengesCount: 0,
                totalChallenges: 0,
                streak: 0,
                avgMood: null,
                dayInJourney: 0,
                recentChallenges: [],
                preferences: {
                    voiceId: 'invalid-voice',
                },
                recentDiary: [],
                recentSurveys: [],
                habitStats: null,
                todayHabitLogs: [],
                onboardingAnswers: null,
            };

            const settings = getPersonalizationSettings(context);

            expect(settings.voiceId).toBe('nova');
        });
    });

    describe('buildEnhancedSystemPrompt', () => {
        it('builds prompt with null context', () => {
            const prompt = buildEnhancedSystemPrompt(null);

            expect(prompt).toContain('Coach');
            expect(prompt).toContain('Transformation Coach');
            expect(prompt).toContain('TODAY\'S FOCUS');
            expect(prompt).toContain('DISCIPLINE'); // Name is uppercased in the prompt
            expect(prompt).not.toContain('USER\'S CURRENT CONTEXT');
        });

        it('includes daily focus in prompt', () => {
            const prompt = buildEnhancedSystemPrompt(null);

            expect(prompt).toContain('TODAY\'S FOCUS: DISCIPLINE');
            expect(prompt).toContain('Today focus on building discipline and consistency.');
        });

        it('uses custom AI name when available', () => {
            const context: UserContext = {
                activeGoal: null,
                allActiveGoals: [],
                todayChallenge: null,
                completedChallengesCount: 0,
                totalChallenges: 0,
                streak: 0,
                avgMood: null,
                dayInJourney: 0,
                recentChallenges: [],
                preferences: {
                    aiCustomName: 'Coach Max',
                },
                recentDiary: [],
                recentSurveys: [],
                habitStats: null,
                todayHabitLogs: [],
                onboardingAnswers: null,
            };

            const prompt = buildEnhancedSystemPrompt(context);

            expect(prompt).toContain('Coach Max');
        });

        it('uses default Coach name when aiCustomName is empty', () => {
            const context: UserContext = {
                activeGoal: null,
                allActiveGoals: [],
                todayChallenge: null,
                completedChallengesCount: 0,
                totalChallenges: 0,
                streak: 0,
                avgMood: null,
                dayInJourney: 0,
                recentChallenges: [],
                preferences: {
                    aiCustomName: '   ',
                },
                recentDiary: [],
                recentSurveys: [],
                habitStats: null,
                todayHabitLogs: [],
                onboardingAnswers: null,
            };

            const prompt = buildEnhancedSystemPrompt(context);

            expect(prompt).toContain('You are Coach,');
        });

        it('includes rude mode instructions when enabled', () => {
            const context: UserContext = {
                activeGoal: null,
                allActiveGoals: [],
                todayChallenge: null,
                completedChallengesCount: 0,
                totalChallenges: 0,
                streak: 0,
                avgMood: null,
                dayInJourney: 0,
                recentChallenges: [],
                preferences: {
                    rudeMode: true,
                },
                recentDiary: [],
                recentSurveys: [],
                habitStats: null,
                todayHabitLogs: [],
                onboardingAnswers: null,
            };

            const prompt = buildEnhancedSystemPrompt(context);

            expect(prompt).toContain('TOUGH LOVE MODE ACTIVATED');
            expect(prompt).toContain('Be DIRECT and no-nonsense');
            expect(prompt).toContain('Call out excuses immediately');
        });

        it('excludes rude mode instructions when disabled', () => {
            const context: UserContext = {
                activeGoal: null,
                allActiveGoals: [],
                todayChallenge: null,
                completedChallengesCount: 0,
                totalChallenges: 0,
                streak: 0,
                avgMood: null,
                dayInJourney: 0,
                recentChallenges: [],
                preferences: {
                    rudeMode: false,
                },
                recentDiary: [],
                recentSurveys: [],
                habitStats: null,
                todayHabitLogs: [],
                onboardingAnswers: null,
            };

            const prompt = buildEnhancedSystemPrompt(context);

            expect(prompt).not.toContain('TOUGH LOVE MODE ACTIVATED');
        });

        it('includes user context when available', () => {
            const context: UserContext = {
                activeGoal: {
                    id: 'goal-1',
                    title: 'Learn Spanish',
                    currentState: 'Beginner',
                    desiredState: 'Fluent',
                    difficultyLevel: 5,
                    realityShiftEnabled: false,
                    startedAt: new Date('2024-01-01'),
                    domain: { name: 'Languages' },
                },
                allActiveGoals: [{
                    id: 'goal-1',
                    title: 'Learn Spanish',
                    currentState: 'Beginner',
                    desiredState: 'Fluent',
                    difficultyLevel: 5,
                    realityShiftEnabled: false,
                    startedAt: new Date('2024-01-01'),
                    domain: { name: 'Languages' },
                }],
                todayChallenge: {
                    title: 'Practice verbs',
                    difficulty: 4,
                    status: 'active',
                    description: 'Conjugate 20 verbs',
                },
                completedChallengesCount: 10,
                totalChallenges: 15,
                streak: 7,
                avgMood: 8.5,
                dayInJourney: 14,
                recentChallenges: [],
                preferences: {
                    displayName: 'Test User',
                    preferredDifficulty: 6,
                },
                recentDiary: [],
                recentSurveys: [],
                habitStats: { totalHabits: 0, habits: [] },
                todayHabitLogs: [],
                onboardingAnswers: null,
            };

            const prompt = buildEnhancedSystemPrompt(context);

            expect(prompt).toContain('USER\'S CURRENT CONTEXT');
            expect(prompt).toContain('Learn Spanish');
            expect(prompt).toContain('ALL ACTIVE GOALS');
            expect(prompt).toContain('Current streak: 7 days');
            expect(prompt).toContain('Challenges completed: 10');
            expect(prompt).toContain('Practice verbs');
            expect(prompt).toContain('Test User');
        });

        it('encourages goal creation when no active goal', () => {
            const context: UserContext = {
                activeGoal: null,
                allActiveGoals: [],
                todayChallenge: null,
                completedChallengesCount: 0,
                totalChallenges: 0,
                streak: 0,
                avgMood: null,
                dayInJourney: 0,
                recentChallenges: [],
                preferences: {},
                recentDiary: [],
                recentSurveys: [],
                habitStats: null,
                todayHabitLogs: [],
                onboardingAnswers: null,
            };

            const prompt = buildEnhancedSystemPrompt(context);

            expect(prompt).toContain('User has no active goal set yet');
            expect(prompt).toContain('create_goal widget');
        });

        it('applies different coach specializations', () => {
            const context: UserContext = {
                activeGoal: null,
                allActiveGoals: [],
                todayChallenge: null,
                completedChallengesCount: 0,
                totalChallenges: 0,
                streak: 0,
                avgMood: null,
                dayInJourney: 0,
                recentChallenges: [],
                preferences: {},
                recentDiary: [],
                recentSurveys: [],
                habitStats: null,
                todayHabitLogs: [],
                onboardingAnswers: null,
            };

            const languagesPrompt = buildEnhancedSystemPrompt(context, 'languages');
            expect(languagesPrompt).toContain('Language Learning Expert');
            expect(languagesPrompt).toContain('immersion strategies');

            const healthPrompt = buildEnhancedSystemPrompt(context, 'health');
            expect(healthPrompt).toContain('Health and Vitality Coach');
            expect(healthPrompt).toContain('sustainable fitness');

            const emotionalPrompt = buildEnhancedSystemPrompt(context, 'emotional');
            expect(emotionalPrompt).toContain('Emotional Intelligence Coach');
        });

        it('applies tone preference', () => {
            const createContextWithTone = (tone: string): UserContext => ({
                activeGoal: null,
                allActiveGoals: [],
                todayChallenge: null,
                completedChallengesCount: 0,
                totalChallenges: 0,
                streak: 0,
                avgMood: null,
                dayInJourney: 0,
                recentChallenges: [],
                preferences: { tonePreference: tone },
                recentDiary: [],
                recentSurveys: [],
                habitStats: null,
                todayHabitLogs: [],
                onboardingAnswers: null,
            });

            const professionalPrompt = buildEnhancedSystemPrompt(createContextWithTone('professional'));
            expect(professionalPrompt).toContain('professional, structured tone');

            const casualPrompt = buildEnhancedSystemPrompt(createContextWithTone('casual'));
            expect(casualPrompt).toContain('relaxed and conversational');

            const friendlyPrompt = buildEnhancedSystemPrompt(createContextWithTone('friendly'));
            expect(friendlyPrompt).toContain('warm, encouraging, and approachable');
        });

        it('uses custom daily focus when provided', () => {
            const customFocus = {
                id: 'gratitude',
                name: 'Gratitude',
                prompt: 'Today reflect on what you are grateful for.',
            };

            const prompt = buildEnhancedSystemPrompt(null, undefined, customFocus);

            expect(prompt).toContain('TODAY\'S FOCUS: GRATITUDE');
            expect(prompt).toContain('Today reflect on what you are grateful for.');
        });
    });
});
