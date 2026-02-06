// db.js
const { Pool } = require("pg");

// Créer un pool de connexions
const pool = new Pool({
  user: "pfe", // ton utilisateur postgres
  host: "192.168.1.16", // ou l'adresse de ton serveur
  database: "pfe", // nom de la base
  password: "123", // mot de passe
  port: 5432, // port PostgreSQL par défaut
});

// Tester la connexion
pool.connect((err, client, release) => {
  if (err) {
    return console.error("Erreur de connexion à PostgreSQL", err.stack);
  }
  console.log("Connecté à PostgreSQL");
  release();
});

module.exports = pool;
