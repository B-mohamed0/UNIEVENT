const { Pool } = require("pg");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: "/Users/macbook/react/UNIEVENT/backend/.env" });

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
});

async function updatePass() {
    try {
        const hashedPass = await bcrypt.hash("123", 10);
        const result = await pool.query(
            "UPDATE organisateur SET password = $1 WHERE email = 'hamza'",
            [hashedPass]
        );
        console.log("Password for hamza hashed successfully!");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

updatePass();
