
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/improvement-app';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Creating CustomCoach table...');

        await client.query(`
      CREATE TABLE IF NOT EXISTS "CustomCoach" (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        name TEXT NOT NULL,
        icon TEXT DEFAULT '🤖',
        color TEXT DEFAULT '#8b5cf6',
        "systemPrompt" TEXT NOT NULL,
        "isGoalCoach" BOOLEAN DEFAULT false,
        "goalId" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
      );
    `);

        console.log('CustomCoach table created successfully.');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
