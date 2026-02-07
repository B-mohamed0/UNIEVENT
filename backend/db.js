require('dotenv').config(); // N'oublie pas d'installer : npm install dotenv
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false // Obligatoire pour se connecter à Supabase depuis l'extérieur
  }
});

pool.connect((err) => {
  if (err) {
    console.error("Erreur de connexion à Supabase :", err.stack);
  } else {
    console.log("Succès ! Toute l'équipe est connectée à la même base de données.");
  }
});

module.exports = pool;