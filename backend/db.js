require('dotenv').config(); // N'oublie pas d'installer : npm install dotenv
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // Force l'utilisation d'IPv4 pour éviter l'erreur ENETUNREACH
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Obligatoire pour Supabase en ligne
});

// Logs pour confirmer la connexion lors du premier usage
pool.on('connect', () => {
  console.log("✅ Connecté à Supabase !");
});

pool.on('error', (err, client) => {
  console.error('❌ Erreur inattendue sur un client PostgreSQL (idle) :', err.message);
  // Ne pas faire crash le processus si une connexion est réinitialisée par Supabase
});

module.exports = pool;