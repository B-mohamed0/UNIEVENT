const { Pool } = require("pg");
require("dotenv").config({ path: "/Users/macbook/react/UNIEVENT/backend/.env" });

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'evenement'
      ORDER BY ordinal_position;
    `);
        console.log("evenement Schema:");
        console.table(res.rows);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

checkSchema();
