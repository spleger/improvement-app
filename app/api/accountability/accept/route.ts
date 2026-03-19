import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { AcceptInviteSchema, validateBody } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// POST /api/accountability/accept - Accept a partner invitation
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const parsed = validateBody(AcceptInviteSchema, body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
        }

        // Find the invite
        const invite = await db.getPartnerInviteByCode(parsed.data.inviteCode);
        if (!invite) {
            return NextResponse.json({ success: false, error: 'Invite not found' }, { status: 404 });
        }

        // Must be in 'invited' status
        if (invite.status !== 'invited') {
            return NextResponse.json({ success: false, error: 'This invite has already been used' }, { status: 400 });
        }

        // Cannot accept your own invite
        if (invite.userId === user.userId) {
            return NextResponse.json({ success: false, error: 'You cannot be your own accountability partner' }, { status: 400 });
        }

        // Check if already partners
        const alreadyPartners = await db.isActivePartner(user.userId, invite.userId);
        if (alreadyPartners) {
            return NextResponse.json({ success: false, error: 'You are already partners with this user' }, { status: 400 });
        }

        // Accept the invite
        const partnership = await db.acceptPartnerInvite(invite.id, user.userId);

        return NextResponse.json({
            success: true,
            data: {
                partnership: {
                    id: partnership.id,
                    inviterName: invite.user.displayName || invite.user.email,
                    status: partnership.status,
                    acceptedAt: partnership.acceptedAt,
                },
            },
        });
    } catch (error) {
        console.error('Error accepting partner invite:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
