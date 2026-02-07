//Ce fichier qui recevra les requêtes de l'application mobile
const express = require('express');
const pool = require('./db'); // Importe ta connexion Supabase
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Route de test pour vérifier que l'API répond
app.get('/', (req, res) => {
    res.send("🚀 Serveur Node.js opérationnel et connecté à Supabase !");
});

// Route pour récupérer les utilisateurs (exemple)
app.get('/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM utilisateurs');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
});

app.listen(PORT, () => {
    console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});