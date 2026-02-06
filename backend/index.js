const express = require("express");
const pool = require("./db");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Tous les champs sont obligatoires",
      });
    }

    const result = await pool.query(
      "SELECT password FROM etudiant WHERE email = $1",
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        message: "Email inexistant",
      });
    }

    const user = result.rows[0];

    // const validPassword = await bcrypt.compare(password, user.password);

    if (!(password===user.password)) {
      return res.status(401).json({
        message: "Mot de passe incorrect",
      });
    }

    res.json({
      message: "Connexion réussie ✅",
      user: { email },
    });
  } catch (error) {
    console.error("BACKEND ERROR:", error);
    res.status(500).json({
      message: "Erreur serveur",
    });
  }
});

app.listen(3000, () => {
  console.log("✅ Serveur lancé sur le port 3000");
});
