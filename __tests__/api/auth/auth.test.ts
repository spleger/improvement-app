/**
 * Unit Tests for Auth API Routes
 * Tests login, register, logout, and demo authentication flows
 */

import { NextRequest } from 'next/server';
import * as db from '@/lib/db';
import * as auth from '@/lib/auth';

// Mock the database module
jest.mock('@/lib/db', () => ({
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    saveUserPreferences: jest.fn(),
    getGoalsByUserId: jest.fn(),
    createGoal: jest.fn(),
    createChallenge: jest.fn(),
    createOrUpdateDailySurvey: jest.fn(),
}));

// Mock the auth module
jest.mock('@/lib/auth', () => ({
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
    signToken: jest.fn(),
    verifyToken: jest.fn(),
}));

// Mock cookies
const mockCookiesSet = jest.fn();
jest.mock('next/headers', () => ({
    cookies: () => ({
        set: mockCookiesSet,
        get: jest.fn(),
    }),
}));

// Import routes after mocks are set up
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { POST as registerPOST } from '@/app/api/auth/register/route';
import { POST as demoPOST } from '@/app/api/auth/demo/route';

// Helper to create mock requests
function createMockRequest(body: any): NextRequest {
    return new NextRequest('http://localhost:3000/api/auth/test', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

describe('Auth API Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/login', () => {
        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
            passwordHash: 'hashed_password',
            displayName: 'Test User',
        };

        it('should successfully login with valid credentials', async () => {
            (db.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
            (auth.comparePassword as jest.Mock).mockResolvedValue(true);
            (auth.signToken as jest.Mock).mockReturnValue('mock-jwt-token');

            const request = createMockRequest({
                email: 'test@example.com',
                password: 'password123',
            });

            const response = await loginPOST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.user.id).toBe('user-123');
            expect(data.user.email).toBe('test@example.com');
            expect(mockCookiesSet).toHaveBeenCalledWith(
                'auth_token',
                'mock-jwt-token',
                expect.any(Object)
            );
        });

        it('should return 400 for invalid email format', async () => {
            const request = createMockRequest({
                email: 'invalid-email',
                password: 'password123',
            });

            const response = await loginPOST(request);

            expect(response.status).toBe(400);
        });

        it('should return 400 for missing password', async () => {
            const request = createMockRequest({
                email: 'test@example.com',
            });

            const response = await loginPOST(request);

            expect(response.status).toBe(400);
        });

        it('should return 401 for non-existent user', async () => {
            (db.getUserByEmail as jest.Mock).mockResolvedValue(null);

            const request = createMockRequest({
                email: 'nonexistent@example.com',
                password: 'password123',
            });

            const response = await loginPOST(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe('Invalid credentials');
        });

        it('should return 401 for wrong password', async () => {
            (db.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
            (auth.comparePassword as jest.Mock).mockResolvedValue(false);

            const request = createMockRequest({
                email: 'test@example.com',
                password: 'wrong-password',
            });

            const response = await loginPOST(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe('Invalid credentials');
        });
    });

    describe('POST /api/auth/register', () => {
        it('should successfully register a new user', async () => {
            const newUser = {
                id: 'new-user-123',
                email: 'newuser@example.com',
                displayName: 'New User',
            };

            (db.getUserByEmail as jest.Mock).mockResolvedValue(null);
            (auth.hashPassword as jest.Mock).mockResolvedValue('hashed_password');
            (db.createUser as jest.Mock).mockResolvedValue(newUser);
            (db.saveUserPreferences as jest.Mock).mockResolvedValue({});
            (auth.signToken as jest.Mock).mockReturnValue('mock-jwt-token');

            const request = createMockRequest({
                email: 'newuser@example.com',
                password: 'password123',
                displayName: 'New User',
            });

            const response = await registerPOST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.user.email).toBe('newuser@example.com');
            expect(db.createUser).toHaveBeenCalled();
            expect(db.saveUserPreferences).toHaveBeenCalled();
        });

        it('should return 409 for duplicate email', async () => {
            (db.getUserByEmail as jest.Mock).mockResolvedValue({ id: 'existing' });

            const request = createMockRequest({
                email: 'existing@example.com',
                password: 'password123',
            });

            const response = await registerPOST(request);
            const data = await response.json();

            expect(response.status).toBe(409);
            expect(data.error).toContain('already exists');
        });

        it('should return 400 for password too short', async () => {
            const request = createMockRequest({
                email: 'test@example.com',
                password: '12345', // Less than 6 chars
            });

            const response = await registerPOST(request);

            expect(response.status).toBe(400);
        });

        it('should return 400 for invalid email', async () => {
            const request = createMockRequest({
                email: 'not-an-email',
                password: 'password123',
            });

            const response = await registerPOST(request);

            expect(response.status).toBe(400);
        });

        it('should use email prefix as displayName if not provided', async () => {
            const newUser = {
                id: 'user-456',
                email: 'testuser@example.com',
                displayName: 'testuser',
            };

            (db.getUserByEmail as jest.Mock).mockResolvedValue(null);
            (auth.hashPassword as jest.Mock).mockResolvedValue('hashed');
            (db.createUser as jest.Mock).mockResolvedValue(newUser);
            (db.saveUserPreferences as jest.Mock).mockResolvedValue({});
            (auth.signToken as jest.Mock).mockReturnValue('token');

            const request = createMockRequest({
                email: 'testuser@example.com',
                password: 'password123',
            });

            await registerPOST(request);

            expect(db.createUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    displayName: 'testuser',
                })
            );
        });
    });

    describe('POST /api/auth/demo', () => {
        const mockDemoUser = {
            id: 'demo-user-id',
            email: 'demo@example.com',
            displayName: 'Demo User',
        };

        it('should login existing demo user', async () => {
            (db.getUserByEmail as jest.Mock).mockResolvedValue(mockDemoUser);
            (db.getGoalsByUserId as jest.Mock).mockResolvedValue([{ id: 'goal-1' }]);
            (auth.signToken as jest.Mock).mockReturnValue('demo-token');

            const request = createMockRequest({});

            const response = await demoPOST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.user.email).toBe('demo@example.com');
            expect(mockCookiesSet).toHaveBeenCalled();
        });

        it('should create demo user if not exists', async () => {
            (db.getUserByEmail as jest.Mock).mockResolvedValue(null);
            (auth.hashPassword as jest.Mock).mockResolvedValue('hashed');
            (db.createUser as jest.Mock).mockResolvedValue(mockDemoUser);
            (db.getGoalsByUserId as jest.Mock).mockResolvedValue([]);
            (db.createGoal as jest.Mock).mockResolvedValue({ id: 'new-goal' });
            (db.createChallenge as jest.Mock).mockResolvedValue({ id: 'challenge' });
            (db.createOrUpdateDailySurvey as jest.Mock).mockResolvedValue({});
            (auth.signToken as jest.Mock).mockReturnValue('demo-token');

            const request = createMockRequest({});

            const response = await demoPOST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(db.createUser).toHaveBeenCalled();
        });

        it('should seed demo data when user has no goals', async () => {
            (db.getUserByEmail as jest.Mock).mockResolvedValue(mockDemoUser);
            (db.getGoalsByUserId as jest.Mock).mockResolvedValue([]);
            (db.createGoal as jest.Mock).mockResolvedValue({ id: 'seeded-goal' });
            (db.createChallenge as jest.Mock).mockResolvedValue({ id: 'challenge' });
            (db.createOrUpdateDailySurvey as jest.Mock).mockResolvedValue({});
            (auth.signToken as jest.Mock).mockReturnValue('demo-token');

            const request = createMockRequest({});

            await demoPOST(request);

            expect(db.createGoal).toHaveBeenCalled();
            expect(db.createChallenge).toHaveBeenCalled();
            expect(db.createOrUpdateDailySurvey).toHaveBeenCalled();
        });
    });
});
