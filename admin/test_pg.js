const { Pool } = require("pg");

const pool = new Pool({
  host: "aws-1-eu-west-1.pooler.supabase.com",
  user: "postgres.ouweuekklopizmnkrvob",
  password: "Postgresql123",
  database: "postgres",
  port: 6543,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const res = await pool.query(`SELECT count(*) FROM evenement`);
    console.log("Total événements :", res.rows[0].count);
    
    const resPart = await pool.query(`SELECT count(*) FROM participation`);
    console.log("Total participations :", resPart.rows[0].count);

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
