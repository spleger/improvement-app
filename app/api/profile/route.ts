import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const MAX_AVATAR_SIZE = 512 * 1024; // 512KB max for base64 data URL

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { avatarUrl } = body;

        // Validate: must be a data URL or null (for removal)
        if (avatarUrl !== null) {
            if (typeof avatarUrl !== 'string' || !avatarUrl.startsWith('data:image/')) {
                return NextResponse.json(
                    { success: false, error: 'Invalid image format' },
                    { status: 400 }
                );
            }
            if (avatarUrl.length > MAX_AVATAR_SIZE) {
                return NextResponse.json(
                    { success: false, error: 'Image too large (max 512KB)' },
                    { status: 400 }
                );
            }
        }

        await db.updateUserAvatar(user.userId, avatarUrl);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userData = await db.getUserById(user.userId);

        return NextResponse.json({
            success: true,
            data: {
                avatarUrl: userData?.avatarUrl || null,
                displayName: userData?.displayName || null,
                email: userData?.email || null,
            }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
