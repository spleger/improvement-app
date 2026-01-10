import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    displayName: z.string().min(2).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = registerSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: validation.error.format() },
                { status: 400 }
            );
        }

        const { email, password, displayName } = validation.data;

        // Check if user exists
        const existingUser = await db.getUserByEmail(email);
        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const newUser = await db.createUser({
            email,
            passwordHash,
            displayName: displayName || email.split('@')[0],
        });

        // Initialize default preferences
        await db.saveUserPreferences(newUser.id, {
            displayName: newUser.displayName || undefined
        });

        // Auto-login: Generate session token
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            process.env.JWT_SECRET || 'fallback-secret-key',
            { expiresIn: '7d' }
        );

        // Set cookie
        const response = NextResponse.json({
            success: true,
            user: {
                id: newUser.id,
                email: newUser.email,
                displayName: newUser.displayName
            }
        });

        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
