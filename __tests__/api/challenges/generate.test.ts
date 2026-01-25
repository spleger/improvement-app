
import { POST } from '@/app/api/challenges/generate/route';
import { NextRequest } from 'next/server';
import { dbMock, startDb, stopDb, createMockRequest } from '@/test-utils';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
    getCurrentUser: jest.fn(),
}));

jest.mock('@/lib/ai', () => ({
    generateChallenge: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
    getGoalsByUserId: jest.fn(),
    createChallenge: jest.fn(),
    getUserPreferences: jest.fn(), // If used
    getRecentCompletedChallenges: jest.fn(),
}));

import { getCurrentUser } from '@/lib/auth';
import { generateChallenge } from '@/lib/ai';
import * as db from '@/lib/db';

describe('POST /api/challenges/generate', () => {
    const mockUser = { userId: 'user-123' };
    const mockGoal = { id: 'goal-1', userId: 'user-123', title: 'Lose Weight' };

    beforeEach(() => {
        jest.clearAllMocks();
        (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
        (db.getGoalsByUserId as jest.Mock).mockResolvedValue([mockGoal]);
        (db.createChallenge as jest.Mock).mockImplementation((data) => Promise.resolve({ ...data, id: 'challenge-1' }));
        (db.getRecentCompletedChallenges as jest.Mock).mockResolvedValue([]);
        (generateChallenge as jest.Mock).mockResolvedValue({
            title: 'Walk 5k',
            description: 'Go for a walk',
            difficulty: 3,
            isRealityShift: false
        });
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
        expect(generateChallenge).toHaveBeenCalledWith(expect.anything(), expect.anything(), mockHistory);
    });

    it('successfully creates a challenge', async () => {
        const req = createMockRequest({ goalId: 'goal-1' });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(generateChallenge).toHaveBeenCalledWith(expect.anything(), mockGoal, []);
        expect(db.createChallenge).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'user-123',
            goalId: 'goal-1',
            title: 'Walk 5k'
        }));
    });

    it('handles AI generation failure', async () => {
        (generateChallenge as jest.Mock).mockRejectedValue(new Error('AI overloaded'));

        const req = createMockRequest({ goalId: 'goal-1' });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(500);
        expect(data.error).toBe('AI overloaded');
    });
});
