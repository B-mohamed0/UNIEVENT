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

async function checkOrganizer() {
    try {
        const result = await pool.query("SELECT id, nom, email FROM organisateur");
        console.log("Organizers found:", result.rows);

        if (result.rowCount === 0) {
            console.log("No organizers found. Creating a test one...");
            const bcrypt = require("bcrypt");
            const hashedPass = await bcrypt.hash("123456", 10);
            await pool.query(
                "INSERT INTO organisateur (nom, email, password) VALUES ($1, $2, $3)",
                ["Test Orga", "orga@test.com", hashedPass]
            );
            console.log("Test organizer created: orga@test.com / 123456");
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

checkOrganizer();
