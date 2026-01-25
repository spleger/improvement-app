/**
 * Browser-accessible test runner API endpoint
 * 
 * GET /api/test-runner - Runs database health checks and exercises DB connection
 * 
 * This endpoint exists to:
 * 1. Keep the database active (prevent Supabase pausing)
 * 2. Provide browser-accessible test results
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as db from '@/lib/db';

export const dynamic = 'force-dynamic';

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    duration: number;
}

async function runTest(name: string, testFn: () => Promise<void>): Promise<TestResult> {
    const start = Date.now();
    try {
        await testFn();
        return { name, passed: true, duration: Date.now() - start };
    } catch (error) {
        return {
            name,
            passed: false,
            error: error instanceof Error ? error.message : String(error),
            duration: Date.now() - start
        };
    }
}

export async function GET(request: NextRequest) {
    const results: TestResult[] = [];
    const totalStart = Date.now();

    // Test 1: Database Connection
    results.push(await runTest('Database Connection', async () => {
        await prisma.$queryRaw`SELECT 1 as connected`;
    }));

    // Test 2: User Table Access
    results.push(await runTest('User Table Access', async () => {
        const count = await prisma.user.count();
        if (typeof count !== 'number') throw new Error('Failed to count users');
    }));

    // Test 3: Goal Domains
    results.push(await runTest('Goal Domains', async () => {
        const domains = await db.getAllGoalDomains();
        if (!Array.isArray(domains)) throw new Error('Failed to get goal domains');
    }));

    // Test 4: Generate ID
    results.push(await runTest('generateId Function', async () => {
        const id = db.generateId();
        if (!id || id.length !== 36) throw new Error('Invalid ID generated');
    }));

    // Test 5: Goal Table Access
    results.push(await runTest('Goal Table Access', async () => {
        const count = await prisma.goal.count();
        if (typeof count !== 'number') throw new Error('Failed to count goals');
    }));

    // Test 6: Challenge Table Access
    results.push(await runTest('Challenge Table Access', async () => {
        const count = await prisma.challenge.count();
        if (typeof count !== 'number') throw new Error('Failed to count challenges');
    }));

    // Test 7: Habit Table Access
    results.push(await runTest('Habit Table Access', async () => {
        const count = await prisma.habit.count();
        if (typeof count !== 'number') throw new Error('Failed to count habits');
    }));

    // Test 8: HabitLog Table Access
    results.push(await runTest('HabitLog Table Access', async () => {
        const count = await prisma.habitLog.count();
        if (typeof count !== 'number') throw new Error('Failed to count habit logs');
    }));

    // Test 9: DiaryEntry Table Access
    results.push(await runTest('DiaryEntry Table Access', async () => {
        const count = await prisma.diaryEntry.count();
        if (typeof count !== 'number') throw new Error('Failed to count diary entries');
    }));

    // Test 10: DailySurvey Table Access
    results.push(await runTest('DailySurvey Table Access', async () => {
        const count = await prisma.dailySurvey.count();
        if (typeof count !== 'number') throw new Error('Failed to count surveys');
    }));

    // Test 11: Conversation Table Access
    results.push(await runTest('Conversation Table Access', async () => {
        const count = await prisma.conversation.count();
        if (typeof count !== 'number') throw new Error('Failed to count conversations');
    }));

    // Test 12: ChallengeTemplate Table Access
    results.push(await runTest('ChallengeTemplate Table Access', async () => {
        const count = await prisma.challengeTemplate.count();
        if (typeof count !== 'number') throw new Error('Failed to count templates');
    }));

    // Test 13: UserPreferences Table Access
    results.push(await runTest('UserPreferences Table Access', async () => {
        const count = await prisma.userPreferences.count();
        if (typeof count !== 'number') throw new Error('Failed to count preferences');
    }));

    // Test 14: CustomCoach Table Access
    results.push(await runTest('CustomCoach Table Access', async () => {
        const count = await prisma.customCoach.count();
        if (typeof count !== 'number') throw new Error('Failed to count coaches');
    }));

    // Test 15: ProgressSnapshot Table Access
    results.push(await runTest('ProgressSnapshot Table Access', async () => {
        const count = await prisma.progressSnapshot.count();
        if (typeof count !== 'number') throw new Error('Failed to count snapshots');
    }));

    const totalDuration = Date.now() - totalStart;
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    return NextResponse.json({
        success: failed === 0,
        summary: {
            total: results.length,
            passed,
            failed,
            duration: `${totalDuration}ms`
        },
        timestamp: new Date().toISOString(),
        results
    });
}
