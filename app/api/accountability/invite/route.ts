import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/accountability/invite - Generate an invite code
export async function POST() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const inviteCode = randomUUID().slice(0, 8);
        const invite = await db.createPartnerInvite(user.userId, inviteCode);

        return NextResponse.json({
            success: true,
            data: {
                inviteCode: invite.inviteCode,
                shareUrl: `/accountability/join?code=${invite.inviteCode}`,
            },
        });
    } catch (error) {
        console.error('Error creating partner invite:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
