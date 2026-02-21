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

async function checkPass() {
    try {
        const result = await pool.query("SELECT email, password FROM organisateur WHERE email = 'hamza'");
        if (result.rowCount > 0) {
            const pass = result.rows[0].password;
            console.log("Password for hamza:", pass);
            const isHashed = pass.startsWith("$2b$") || pass.startsWith("$2a$");
            console.log("Is hashed:", isHashed);
        } else {
            console.log("hamza not found");
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

checkPass();
