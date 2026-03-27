require('dotenv').config();
const { Pool } = require("pg");
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function syncSchema() {
  try {
    console.log("🔍 Récupération des schémas...");
    
    // Colonnes de etudiant
    const etudiantCols = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'etudiant'
    `);

    // Colonnes de professeur
    const profCols = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'professeur'
    `);

    const existingProfCols = new Set(profCols.rows.map(c => c.column_name));

    console.log("📝 Colonnes dans etudiant :", etudiantCols.rows.map(c => c.column_name).join(", "));
    console.log("📝 Colonnes dans professeur :", profCols.rows.map(c => c.column_name).join(", "));

    for (const col of etudiantCols.rows) {
      if (!existingProfCols.has(col.column_name)) {
        console.log(`➕ Ajout de la colonne [${col.column_name}] (${col.data_type}) à la table professeur...`);
        
        let typeStr = col.data_type;
        if (col.character_maximum_length) {
          typeStr += `(${col.character_maximum_length})`;
        }

        // Construction de la requête ALTER TABLE
        // Note: On évite NOT NULL pour ne pas bloquer si la table a déjà des données
        const query = `ALTER TABLE professeur ADD COLUMN "${col.column_name}" ${typeStr}`;
        
        try {
          await pool.query(query);
          console.log(`✅ Colonne [${col.column_name}] ajoutée.`);
        } catch (err) {
          console.error(`❌ Erreur lors de l'ajout de [${col.column_name}] :`, err.message);
        }
      }
    }

    console.log("✨ Synchronisation terminée !");
  } catch (err) {
    console.error("💥 Erreur globale :", err.message);
  } finally {
    await pool.end();
  }
}

syncSchema();
