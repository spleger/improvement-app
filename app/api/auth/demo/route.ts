import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { signToken, hashPassword } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        const demoEmail = 'demo@example.com';

        // Check if demo user exists
        let user = await db.getUserByEmail(demoEmail);

        if (!user) {
            // Create demo user
            const hashedPassword = await hashPassword('demo123'); // Fallback password
            user = await db.createUser({
                email: demoEmail,
                passwordHash: hashedPassword,
                displayName: 'Demo User'
            });
        }

        // SEED DATA CHECK
        // If user has no active goals, let's seed some data so the demo feels "alive"
        try {
            const goals = await db.getGoalsByUserId(user.id);
            if (goals.length === 0) {
                console.log('Seeding demo data...');

                // 1. Create a Goal
                const goal = await db.createGoal({
                    userId: user.id,
                    title: "Morning Meditation 🧘",
                    domainId: 3, // Emotional/Mental
                    description: "Start every day with 10 mins of mindfulness.",
                    difficultyLevel: 5,
                    desiredState: "Calm and focused mornings",
                    currentState: "Reactive and stressed"
                });

                // 2. Create some "completed" challenges for history/streak
                const today = new Date();
                for (let i = 1; i <= 5; i++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);

                    // Create challenge
                    await db.createChallenge({
                        userId: user.id,
                        goalId: goal.id,
                        title: `Meditation Session ${i}`,
                        description: "10 minutes breathing focus.",
                        difficulty: 4,
                        scheduledDate: date
                    });
                    // Note: To make them actually 'completed' for streak calculation, we would need to 
                    // update them in the DB. For now, we leave them as pending in the past or assume
                    // the user will complete them. 
                    // Ideally we would run: await db.completeChallenge(ch.id) but that sets date to NOW.
                }

                // 3. Create a challenge for TODAY
                await db.createChallenge({
                    userId: user.id,
                    goalId: goal.id,
                    title: "Mindful Walking",
                    description: "Take a 10 minute walk without your phone. Notice 5 things you see, 4 you hear...",
                    difficulty: 5,
                    scheduledDate: new Date()
                });

                // 4. Create some survey data for mood
                await db.createOrUpdateDailySurvey({
                    userId: user.id,
                    surveyDate: new Date(),
                    energyLevel: 7,
                    motivationLevel: 8,
                    overallMood: 8,
                    gratitudeNote: "Grateful for this demo mode working!"
                });
            }
        } catch (seedError) {
            console.error('Error seeding demo data:', seedError);
            // Continue to login even if seeding fails
        }

        // Create session token
        const { signToken } = require('@/lib/auth');
        const token = signToken({ userId: user.id, email: user.email, isDemo: true });
        // Set cookie
        cookies().set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName
            }
        });

    } catch (error) {
        console.error('Demo login error:', error);
        return NextResponse.json(
            { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}
