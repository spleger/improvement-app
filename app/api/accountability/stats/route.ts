import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/accountability/stats?userId=xxx - Get public stats for a partner
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const targetUserId = request.nextUrl.searchParams.get('userId');
        if (!targetUserId) {
            return NextResponse.json({ success: false, error: 'userId parameter is required' }, { status: 400 });
        }

        // Verify the requester is an active partner of the target user
        const isPartner = await db.isActivePartner(user.userId, targetUserId);
        if (!isPartner) {
            return NextResponse.json({ success: false, error: 'Not authorized to view this user\'s stats' }, { status: 403 });
        }

        const stats = await db.getPartnerStats(targetUserId);

        return NextResponse.json({
            success: true,
            data: { stats },
        });
    } catch (error) {
        console.error('Error fetching partner stats:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
