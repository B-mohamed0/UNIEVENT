const pool = require("./db");

async function migrate() {
    try {
        console.log("🚀 Starting migration: Adding 'photo' column to 'etudiant' table...");
        await pool.query("ALTER TABLE etudiant ADD COLUMN IF NOT EXISTS photo TEXT");
        console.log("✅ Column 'photo' added successfully (or already existed).");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
}

migrate();
