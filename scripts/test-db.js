const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:gHLtVPvDthkzF2T1@db.crfbkjylteczxiocisjc.supabase.co:5432/postgres';

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('✅ Connected successfully to Supabase!');
        const res = await client.query('SELECT NOW()');
        console.log('Time:', res.rows[0]);
        client.release();
    } catch (err) {
        console.error('❌ Connection failed:', err);
    } finally {
        await pool.end();
    }
}

testConnection();
