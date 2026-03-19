import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { RemovePartnerSchema, validateBody } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// GET /api/accountability - List all active partners with their stats
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const partners = await db.getPartnersByUserId(user.userId);

        // Fetch stats for each partner in parallel
        const partnersWithStats = await Promise.all(
            partners.map(async (partner) => {
                const stats = await db.getPartnerStats(partner.partnerUserId);
                return {
                    ...partner,
                    stats,
                };
            })
        );

        return NextResponse.json({
            success: true,
            data: { partners: partnersWithStats },
        });
    } catch (error) {
        console.error('Error fetching accountability partners:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/accountability - Remove a partnership
export async function DELETE(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const parsed = validateBody(RemovePartnerSchema, body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
        }

        const result = await db.removePartnership(parsed.data.partnershipId, user.userId);
        if (!result) {
            return NextResponse.json({ success: false, error: 'Partnership not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: { deleted: true },
        });
    } catch (error) {
        console.error('Error removing partnership:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
