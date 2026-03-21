const { Pool } = require("pg");

const pool = new Pool({
  host: "aws-1-eu-west-1.pooler.supabase.com",
  user: "postgres.ouweuekklopizmnkrvob",
  password: "Postgresql123",
  database: "postgres",
  port: 6543,
  ssl: { rejectUnauthorized: false }
});

async function fixRLS() {
  try {
    // Enable RLS just in case (though it's usually on by default if policies exist)
    await pool.query(`ALTER TABLE evenement ENABLE ROW LEVEL SECURITY;`);
    await pool.query(`ALTER TABLE participation ENABLE ROW LEVEL SECURITY;`);

    // Create policies to allow 'anon' to read. Using IF NOT EXISTS or dropping first to avoid errors.
    console.log("Dropping existing anon policies if any...");
    await pool.query(`DROP POLICY IF EXISTS "anon_select_evenement" ON evenement;`);
    await pool.query(`DROP POLICY IF EXISTS "anon_select_participation" ON participation;`);

    console.log("Creating new anon policies...");
    await pool.query(`CREATE POLICY "anon_select_evenement" ON evenement FOR SELECT TO public USING (true);`);
    await pool.query(`CREATE POLICY "anon_select_participation" ON participation FOR SELECT TO public USING (true);`);

    console.log("RLS Policies updated successfully!");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    pool.end();
  }
}
fixRLS();
