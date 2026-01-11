import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/challenges/templates - Get templates by domain and difficulty
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const domainId = searchParams.get('domainId');
        const difficulty = searchParams.get('difficulty') || 'all';

        const where: Prisma.ChallengeTemplateWhereInput = {};

        if (domainId) {
            where.domainId = parseInt(domainId);
        }

        if (difficulty === 'easy') {
            where.difficulty = { lte: 3 };
        } else if (difficulty === 'medium') {
            where.difficulty = { gte: 4, lte: 6 };
        } else if (difficulty === 'hard') {
            where.difficulty = { gte: 7 };
        }

        const templatesRaw = await prisma.challengeTemplate.findMany({
            where,
            orderBy: [
                { difficulty: 'asc' },
                { title: 'asc' }
            ]
        });

        // Parse JSON fields
        const templates = templatesRaw.map(row => ({
            ...row,
            scientificReferences: row.scientificReferences ? JSON.parse(row.scientificReferences) : [],
            tags: row.tags ? JSON.parse(row.tags) : []
        }));

        return NextResponse.json({
            success: true,
            data: { templates }
        });

    } catch (error) {
        console.error('Error fetching templates:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
