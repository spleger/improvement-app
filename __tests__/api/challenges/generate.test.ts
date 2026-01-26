
import { POST } from '@/app/api/challenges/generate/route';
import { NextRequest } from 'next/server';
import { dbMock, startDb, stopDb, createMockRequest } from '@/test-utils';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
    getCurrentUser: jest.fn(),
}));

jest.mock('@/lib/ai', () => ({
    generateMultipleChallenges: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
    getGoalsByUserId: jest.fn(),
    createChallenge: jest.fn(),
    getUserPreferences: jest.fn(), // If used
    getRecentCompletedChallenges: jest.fn(),
}));

import { getCurrentUser } from '@/lib/auth';
import { generateMultipleChallenges } from '@/lib/ai';
import * as db from '@/lib/db';

describe('POST /api/challenges/generate', () => {
    const mockUser = { userId: 'user-123' };
    const mockGoal = { id: 'goal-1', userId: 'user-123', title: 'Lose Weight', startedAt: new Date() };

    beforeEach(() => {
        jest.clearAllMocks();
        (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
        (db.getGoalsByUserId as jest.Mock).mockResolvedValue([mockGoal]);
        (db.createChallenge as jest.Mock).mockImplementation((data) => Promise.resolve({ ...data, id: `challenge-${Date.now()}` }));
        (db.getRecentCompletedChallenges as jest.Mock).mockResolvedValue([]);
        (generateMultipleChallenges as jest.Mock).mockResolvedValue([{
            title: 'Walk 5k',
            description: 'Go for a walk',
            personalizationNotes: '1. Put on shoes\n2. Walk outside',
            difficulty: 3,
            isRealityShift: false
        }]);
    });

    it('returns 401 if not authenticated', async () => {
        (getCurrentUser as jest.Mock).mockResolvedValue(null);
        const req = createMockRequest({ goalId: 'goal-1' });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
    });

    it('returns 400 if goalId is missing', async () => {
        const req = createMockRequest({}); // Missing goalId

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toBe('Goal ID is required');
    });

    it('returns 404 if goal is not found or does not belong to user', async () => {
        (db.getGoalsByUserId as jest.Mock).mockResolvedValue([]); // User has no goals

        const req = createMockRequest({ goalId: 'goal-1' });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(404);
        expect(data.error).toBe('Goal not found');
    });

    it('successfully creates a challenge with history', async () => {
        const mockHistory = [{ id: 'old-1', title: 'Old Challenge', difficulty: 2 }];
        (db.getRecentCompletedChallenges as jest.Mock).mockResolvedValue(mockHistory);

        const req = createMockRequest({ goalId: 'goal-1' });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(db.getRecentCompletedChallenges).toHaveBeenCalledWith('user-123', 5);
        expect(generateMultipleChallenges).toHaveBeenCalledWith(1, expect.anything(), expect.anything(), mockHistory, undefined);
    });

    it('successfully creates a challenge', async () => {
        const req = createMockRequest({ goalId: 'goal-1' });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(generateMultipleChallenges).toHaveBeenCalledWith(1, expect.anything(), mockGoal, [], undefined);
        expect(db.createChallenge).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'user-123',
            goalId: 'goal-1',
            title: 'Walk 5k'
        }));
    });

    it('generates multiple challenges when count is specified', async () => {
        (generateMultipleChallenges as jest.Mock).mockResolvedValue([
            { title: 'Challenge 1', description: 'First', difficulty: 3, isRealityShift: false },
            { title: 'Challenge 2', description: 'Second', difficulty: 4, isRealityShift: false },
            { title: 'Challenge 3', description: 'Third', difficulty: 5, isRealityShift: true }
        ]);

        const req = createMockRequest({ goalId: 'goal-1', count: 3, focusArea: 'morning routine' });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.challenges).toHaveLength(3);
        expect(data.data.context.totalGenerated).toBe(3);
        expect(generateMultipleChallenges).toHaveBeenCalledWith(3, expect.anything(), mockGoal, [], 'morning routine');
        expect(db.createChallenge).toHaveBeenCalledTimes(3);
    });

    it('handles AI generation failure', async () => {
        (generateMultipleChallenges as jest.Mock).mockRejectedValue(new Error('AI overloaded'));

        const req = createMockRequest({ goalId: 'goal-1' });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(500);
        expect(data.error).toBe('AI overloaded');
    });
});

