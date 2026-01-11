import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import * as db from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const coaches = await db.getCustomCoachesByUserId(user.userId);
        return NextResponse.json({ success: true, data: { coaches } });
    } catch (error) {
        console.error('Error fetching coaches:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch coaches' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, icon, color, systemPrompt, isGoalCoach, goalId } = body;

        if (!name || !systemPrompt) {
            return NextResponse.json({ success: false, error: 'Name and instructions are required' }, { status: 400 });
        }

        const coach = await db.createCustomCoach({
            userId: user.userId,
            name,
            icon,
            color,
            systemPrompt,
            isGoalCoach,
            goalId
        });

        return NextResponse.json({ success: true, data: { coach } });
    } catch (error) {
        console.error('Error creating coach:', error);
        return NextResponse.json({ success: false, error: 'Failed to create coach' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Coach ID is required' }, { status: 400 });
        }

        await db.deleteCustomCoach(id, user.userId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting coach:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete coach' }, { status: 500 });
    }
}
