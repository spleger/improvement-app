import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// GET /api/challenges/templates - Get templates by domain and difficulty
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const domainId = searchParams.get('domainId');
        const difficulty = searchParams.get('difficulty') || 'all';

        let query = `
      SELECT * FROM "ChallengeTemplate" 
      WHERE 1=1
    `;
        const params: any[] = [];
        let paramIndex = 1;

        if (domainId) {
            query += ` AND "domainId" = $${paramIndex++}`;
            params.push(parseInt(domainId));
        }

        if (difficulty === 'easy') {
            query += ` AND difficulty <= 3`;
        } else if (difficulty === 'medium') {
            query += ` AND difficulty >= 4 AND difficulty <= 6`;
        } else if (difficulty === 'hard') {
            query += ` AND difficulty >= 7`;
        }

        query += ` ORDER BY difficulty ASC, title ASC`;

        const result = await pool.query(query, params);

        // Parse JSON fields
        const templates = result.rows.map(row => ({
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
