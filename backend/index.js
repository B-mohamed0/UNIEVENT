const express = require("express");
const pool = require("./db");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/auth/inscription", async (req, res) => {
  const { nom, email, cne, password } = req.body;

  if (!nom || !email || !password || !cne) {
    return res
      .status(400)
      .json({ message: "Tous les champs sont obligatoires" });
  }
  const salt = await bcrypt.genSalt(10);
  const passwordhasher = await bcrypt.hash(password, salt);
  await pool.query(
    `INSERT INTO etudiant (nom, email, cne, password)
    VALUES ($1, $2, $3, $4)`,
    [nom, email, cne, passwordhasher],
  );

  res.json({
    message: "Inscription réussie ✅",
    user: { nom, cne },
  });
});

//////////////////////////////////////////

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Tous les champs sont obligatoires",
      });
    }

    const result = await pool.query(
      "SELECT nom, cne, password FROM etudiant WHERE email = $1",
      [email],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        message: "Email inexistant",
      });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        message: "Mot de passe incorrect",
      });
    }

    res.json({
      message: "Connexion réussie ✅",
      user: { nom: user.nom, cne: user.cne },
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

