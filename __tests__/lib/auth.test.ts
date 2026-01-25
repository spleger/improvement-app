/**
 * Unit Tests for lib/auth.ts
 * Tests password hashing and JWT token management
 */

import { hashPassword, comparePassword, signToken, verifyToken } from '@/lib/auth';

describe('lib/auth.ts', () => {
    describe('Password Hashing', () => {
        it('should hash a password', async () => {
            const password = 'TestPassword123!';
            const hash = await hashPassword(password);

            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(0);
            // bcrypt hashes start with $2a$ or $2b$
            expect(hash).toMatch(/^\$2[ab]\$/);
        });

        it('should produce different hashes for same password', async () => {
            const password = 'TestPassword123!';
            const hash1 = await hashPassword(password);
            const hash2 = await hashPassword(password);

            expect(hash1).not.toBe(hash2);
        });

        it('should compare password correctly - valid password', async () => {
            const password = 'TestPassword123!';
            const hash = await hashPassword(password);

            const isValid = await comparePassword(password, hash);
            expect(isValid).toBe(true);
        });

        it('should compare password correctly - invalid password', async () => {
            const password = 'TestPassword123!';
            const wrongPassword = 'WrongPassword456!';
            const hash = await hashPassword(password);

            const isValid = await comparePassword(wrongPassword, hash);
            expect(isValid).toBe(false);
        });

        it('should handle empty password', async () => {
            const password = '';
            const hash = await hashPassword(password);

            const isValid = await comparePassword(password, hash);
            expect(isValid).toBe(true);
        });
    });

    describe('JWT Token Management', () => {
        const testPayload = {
            userId: 'test-user-123',
            email: 'test@example.com',
            displayName: 'Test User'
        };

        it('should sign a token', () => {
            const token = signToken(testPayload);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
        });

        it('should verify a valid token', () => {
            const token = signToken(testPayload);
            const decoded = verifyToken(token);

            expect(decoded).toBeDefined();
            expect(decoded.userId).toBe(testPayload.userId);
            expect(decoded.email).toBe(testPayload.email);
            expect(decoded.displayName).toBe(testPayload.displayName);
        });

        it('should return null for invalid token', () => {
            const invalidToken = 'invalid.token.here';
            const decoded = verifyToken(invalidToken);

            expect(decoded).toBeNull();
        });

        it('should return null for empty token', () => {
            const decoded = verifyToken('');

            expect(decoded).toBeNull();
        });

        it('should include expiration in token', () => {
            const token = signToken(testPayload);
            const decoded = verifyToken(token);

            expect(decoded.exp).toBeDefined();
            expect(decoded.iat).toBeDefined();
            // Token should expire in the future
            expect(decoded.exp).toBeGreaterThan(decoded.iat);
        });
    });
});
