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

async function updateSchema() {
    try {
        console.log("Adding columns to evenement...");
        await pool.query("ALTER TABLE evenement ADD COLUMN IF NOT EXISTS capacite_max INTEGER DEFAULT 100");
        await pool.query("ALTER TABLE evenement ADD COLUMN IF NOT EXISTS date_fin DATE");
        console.log("Columns added successfully!");
    } catch (err) {
        console.error("Error updating schema:", err);
    } finally {
        await pool.end();
    }
}

updateSchema();
