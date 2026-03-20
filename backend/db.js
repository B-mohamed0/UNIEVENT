require('dotenv').config(); // N'oublie pas d'installer : npm install dotenv
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Obligatoire pour Supabase en ligne
});

pool.connect((err) => {
  if (err) {
    console.error("Erreur de connexion à Supabase :", err.stack);
  } else {
    console.log("Succès ! Toute l'équipe est connectée à la même base de données.");
  }
});

pool.on('error', (err, client) => {
  console.error('Erreur inattendue sur un client PostgreSQL (idle) :', err);
});

module.exports = pool;