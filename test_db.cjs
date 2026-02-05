const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const users = await pool.query('SELECT id, email, full_name FROM users ORDER BY created_at DESC LIMIT 5');
        console.log('USERS_START');
        console.log(JSON.stringify(users.rows));
        console.log('USERS_END');

        const plans = await pool.query('SELECT id, name FROM plans LIMIT 10');
        console.log('PLANS_START');
        console.log(JSON.stringify(plans.rows));
        console.log('PLANS_END');
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
