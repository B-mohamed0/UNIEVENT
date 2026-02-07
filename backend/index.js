require('dotenv').config();
const express = require("express");
const pool = require("./db");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// --- ROUTE D'INSCRIPTION ---
app.post("/api/auth/inscription", async (req, res) => {
  try {
    const { nom, email, cne, password, role } = req.body;

    if (!nom || !email || !password || !role) {
      return res.status(400).json({ message: "Champs manquants" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordhasher = await bcrypt.hash(password, salt);

    // Tentative d'insertion
    await pool.query(
        `INSERT INTO utilisateurs (nom, email, cne, password, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [nom, email, cne || null, passwordhasher, role]
    );

    res.status(201).json({
      message: `Inscription réussie en tant que ${role} ✅`,
      user: { email, role },
    });

  } catch (error) {
    // ON RENVOIE L'ERREUR BRUTE ICI
    res.status(500).json({
      error_brute: error.message,
      detail_sql: error.detail || "Pas de détails"
    });
  }
});

// --- ROUTE DE CONNEXION ---
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query(
        "SELECT id, nom, password, role FROM utilisateurs WHERE email = $1",
        [email]
    );

    if (result.rowCount === 0) return res.status(401).json({ message: "Inexistant" });

    const validPassword = await bcrypt.compare(password, result.rows[0].password);
    if (!validPassword) return res.status(401).json({ message: "Faux" });

    res.json({ role: result.rows[0].role });
  } catch (error) {
    res.status(500).json({ error_brute: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur sur ${PORT}`));