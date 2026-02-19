const express = require("express");
const pool = require("./db");
const bcrypt = require("bcrypt");
const cors = require("cors");
const helmet = require("helmet");
const nodemailer = require("nodemailer");

const app = express();

// --- CONFIGURATION SÉCURITÉ ET MIDDLEWARES ---
app.use(helmet());
app.use(cors());
app.use(express.json());

// --- STOCKAGE TEMPORAIRE DES CODES OTP ---
const otpStore = new Map();

// --- CONFIGURATION DE NODEMAILER ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "aminezakhir8@gmail.com",
    pass: "kudv hsmq mtfw tfpt",
  },
});

// ==========================================
// 1. ROUTE : ENVOYER LE CODE (OTP)
// ==========================================
app.post("/api/auth/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "L'email est requis" });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore.set(email, {
    code,
    expires: Date.now() + 300000,
  });

  try {
    await transporter.sendMail({
      from: '"Service EST" <aminezakhir8@gmail.com>',
      to: email,
      subject: "Votre code de vérification",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center;">
          <h2>Code de vérification</h2>
          <p>Utilisez le code suivant pour votre inscription :</p>
          <h1 style="color: #143287;">${code}</h1>
          <p>Ce code expirera dans 5 minutes.</p>
        </div>
      `,
    });

    console.log(`Code OTP envoyé à ${email}`);
    res.json({ message: "Code envoyé par mail" });
  } catch (error) {
    console.error("Erreur Nodemailer:", error);
    res.status(500).json({ message: "Erreur lors de l'envoi du mail" });
  }
});

// ==========================================
// 2. ROUTE : VÉRIFIER LE CODE (OTP)
// ==========================================
app.post("/api/auth/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!otp || otp.length !== 6) {
    return res.status(400).json({ message: "Code invalide" });
  }
  const data = otpStore.get(email);

  if (data && data.code === otp && Date.now() < data.expires) {
    otpStore.delete(email);
    return res.json({ message: "Vérification réussie" });
  }

  res.status(400).json({ message: "Code invalide ou expiré" });
});

// ==========================================
// 3. ROUTE : INSCRIPTION FINALE
// ==========================================
app.post("/api/auth/inscription", async (req, res) => {
  const { nom, email, cne, password } = req.body;

  if (!nom || !email || !password || !cne) {
    return res.status(400).json({ message: "Tous les champs sont obligatoires" });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordhasher = await bcrypt.hash(password, salt);

    await pool.query(
      `INSERT INTO etudiant (nom, email, id, password) VALUES ($1, $2, $3, $4)`,
      [nom, email, cne, passwordhasher]
    );

    res.json({ message: "Inscription réussie ✅", user: { nom, cne } });
  } catch (error) {
    console.error("ERREUR SQL DÉTAILLÉE :", error.message);
    res.status(500).json({ message: "Erreur lors de l'enregistrement", dev_detail: error.message });
  }
});

// ==========================================
// 4. ROUTE : CONNEXION (LOGIN)
// ==========================================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Tous les champs sont obligatoires",
      });
    }

    const result = await pool.query(
      "SELECT nom, id, password FROM etudiant WHERE email = $1",
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
      user: { nom: user.nom, id: user.id },
    });
  } catch (error) {
    console.error("BACKEND ERROR:", error);
    res.status(500).json({
      message: "Erreur serveur",
    });
  }
});
app.get("/api/events/:id", async (req, res) => {
  try {
    const studentId = req.params.id;
    const status = 'BIENTOT';
    const today = new Date().toISOString().split("T")[0]; // format YYYY-MM-DD

    // 1️⃣ Événements à venir (tous)
    const resultUpcoming = await pool.query(
      "SELECT COUNT(*) AS count FROM evenement WHERE status = $1",
      [status]
    );

    // 2️⃣ Événements d'aujourd'hui (tous)
    const resultToday = await pool.query(
      "SELECT COUNT(*) AS count FROM evenement WHERE date = $1",
      [today]
    );

    // 3️⃣ Événements complétés par cet étudiant
    const resultCompleted = await pool.query(
      "SELECT COUNT(*) AS count FROM participation WHERE status = 'PRESENT' AND idetudiant = $1",
      [studentId]
    );

    // Renvoi JSON pour le front
    res.json({
      upcomingEvents: parseInt(resultUpcoming.rows[0].count, 10),
      todayEvents: parseInt(resultToday.rows[0].count, 10),
      completedEvents: parseInt(resultCompleted.rows[0].count, 10),
    });

  } catch (error) {
    console.error("Erreur API /events/:id:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


// ============================================
// 🆕 NOUVELLES ROUTES - SURVEILLANCE D'ÉVÉNEMENTS
// ============================================

/**
 * 🆕 GET /api/events/upcoming/:studentId
 * 
 * Retourne TOUS les événements non expirés avec leurs statuts individuels
 * Utilisé pour le carrousel d'événements
 */
app.get("/api/events/upcoming/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().split(" ")[0].substring(0, 5);

    console.log(`🔍 Recherche tous les événements non expirés pour étudiant ${studentId}`);

    // Récupérer TOUS les événements non expirés
    const result = await pool.query(
      `SELECT 
        e.id,
        e.nom_evenement,
        e.nom_animateur,
        e.status,
        e.description,
        e.lieu,
        e.date,
        e.heure_debut,
        e.heure_fin,
        e.categorie,
        e.idorganisateur,
        p.status as participation_status
      FROM evenement e
      LEFT JOIN participation p ON e.id = p.idevenement AND p.idetudiant = $1
      WHERE e.status != 'EXPIRER'
        AND (
          e.date > $2
          OR 
          (e.date = $2 AND e.heure_fin >= $3)
        )
      ORDER BY e.date ASC, e.heure_debut ASC`,
      [studentId, today, currentTime]
    );

    if (result.rowCount === 0) {
      console.log("❌ Aucun événement non expiré");
      return res.json({
        events: [],
        message: "Aucun événement à venir",
      });
    }

    // Couleurs par catégorie
    const categoryColors = {
      "Conférence": "#4A6FA5",
      "Atelier": "#6B8E23",
      "Séminaire": "#8B4789",
      "Formation": "#C17817",
      "Réunion": "#2E8B57",
      "default": "#5B7FBD"
    };

    // Formater chaque événement avec son statut
    const events = result.rows.map(event => {
      // Déterminer le statut pour l'affichage
      let eventStatus = "À VENIR";
      if (event.status === "MAINTENANT" ||
        (event.date === today && event.heure_debut <= currentTime && event.heure_fin >= currentTime)) {
        eventStatus = "EN COURS";
      }

      return {
        ...event,
        color: categoryColors[event.categorie] || categoryColors.default,
        event_status: eventStatus,
      };
    });

    console.log(`✅ ${events.length} événements non expirés trouvés`);

    res.json({
      events: events,
      count: events.length,
      message: `${events.length} événement(s) trouvé(s)`,
    });
  } catch (error) {
    console.error("❌ Erreur API /events/upcoming/:studentId:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * 🆕 GET /api/events/active/:studentId
 * 
 * Retourne l'événement actuellement en cours pour un étudiant
 * 
 * Critères de sélection :
 * - Status = 'EN_COURS'
 * - Date = aujourd'hui
 * - Heure actuelle entre heure_debut et heure_fin
 * 
 * Retourne aussi le statut de participation de l'étudiant
 */
app.get("/api/events/active/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const now = new Date();
    const today = now.toISOString().split("T")[0]; // Format YYYY-MM-DD
    const currentTime = now.toTimeString().split(" ")[0].substring(0, 5); // Format HH:MM

    console.log(`🔍 Recherche prochain événement pour étudiant ${studentId}`);
    console.log(`📅 Date: ${today}, ⏰ Heure: ${currentTime}`);

    // Requête pour trouver le prochain événement qui n'est pas expiré
    const result = await pool.query(
      `SELECT 
        e.id,
        e.nom_evenement,
        e.nom_animateur,
        e.status,
        e.description,
        e.lieu,
        e.date,
        e.heure_debut,
        e.heure_fin,
        e.categorie,
        e.idorganisateur,
        p.status as participation_status
      FROM evenement e
      LEFT JOIN participation p ON e.id = p.idevenement AND p.idetudiant = $1
      WHERE e.status != 'EXPIRER'
        AND (
          -- Événements futurs (date future)
          e.date > $2
          OR 
          -- Événements d'aujourd'hui qui ne sont pas encore terminés
          (e.date = $2 AND e.heure_fin >= $3)
        )
      ORDER BY e.date ASC, e.heure_debut ASC
      LIMIT 1`,
      [studentId, today, currentTime]
    );

    if (result.rowCount === 0) {
      console.log("❌ Aucun événement à venir");
      return res.json({
        event: null,
        message: "Aucun événement à venir",
      });
    }

    const event = result.rows[0];

    // Déterminer la couleur selon la catégorie
    const categoryColors = {
      "Conférence": "#4A6FA5",
      "Atelier": "#6B8E23",
      "Séminaire": "#8B4789",
      "Formation": "#C17817",
      "Réunion": "#2E8B57",
      "default": "#5B7FBD"
    };

    // Déterminer le statut pour l'affichage (EN COURS ou À VENIR)
    let eventStatus = "À VENIR";
    if (event.status === "MAINTENANT" ||
      (event.date === today && event.heure_debut <= currentTime && event.heure_fin >= currentTime)) {
      eventStatus = "EN COURS";
    }

    const eventData = {
      ...event,
      color: categoryColors[event.categorie] || categoryColors.default,
      event_status: eventStatus, // Statut pour l'affichage
    };

    console.log(`✅ Événement trouvé: ${event.nom_evenement} (${eventStatus})`);
    console.log(`📝 Statut événement: ${event.status}`);
    console.log(`👤 Statut participation: ${event.participation_status || 'Non inscrit'}`);

    res.json({
      event: eventData,
      message: `Événement ${eventStatus.toLowerCase()} trouvé`,
    });
  } catch (error) {
    console.error("❌ Erreur API /events/active/:studentId:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * 🆕 GET /api/events
 * 
 * Retourne la liste complète de tous les événements NON EXPIRÉS
 * Utilisé pour afficher tous les événements dans la liste
 */
app.get("/api/events", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        id,
        nom_evenement as title,
        nom_animateur as animator,
        status,
        description,
        lieu,
        date,
        heure_debut as time,
        heure_fin,
        categorie,
        idorganisateur
      FROM evenement
      WHERE status != 'EXPIRER'
      ORDER BY date DESC, heure_debut DESC`
    );

    // Ajout des couleurs selon la catégorie
    const categoryColors = {
      "Conférence": "#4A6FA5",
      "Atelier": "#6B8E23",
      "Séminaire": "#8B4789",
      "Formation": "#C17817",
      "Réunion": "#2E8B57",
    };

    const events = result.rows.map(event => {
      // Formatter la date
      const dateObj = new Date(event.date);
      const day = dateObj.getDate().toString().padStart(2, "0");
      const month = dateObj.toLocaleDateString("fr-FR", { month: "short" });
      const year = dateObj.getFullYear();

      return {
        ...event,
        color: categoryColors[event.categorie] || "#000000ff",
        date: { day, month, year },
      };
    });

    console.log(`✅ ${events.length} événements non expirés récupérés`);
    res.json(events);
  } catch (error) {
    console.error("❌ Erreur API /events:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * 🆕 GET /api/events/detail/:eventId/:studentId
 * 
 * Retourne les détails complets d'un événement spécifique
 * avec le statut de participation de l'étudiant
 */
app.get("/api/events/detail/:eventId/:studentId", async (req, res) => {
  try {
    const { eventId, studentId } = req.params;

    const result = await pool.query(
      `SELECT 
        e.id,
        e.nom_evenement,
        e.nom_animateur,
        e.status,
        e.description,
        e.lieu,
        e.date,
        e.heure_debut,
        e.heure_fin,
        e.categorie,
        e.idorganisateur,
        o.nom as organisateur_nom,
        p.status as participation_status,
        p.id as participation_id
      FROM evenement e
      LEFT JOIN organisateur o ON e.idorganisateur = o.id
      LEFT JOIN participation p ON e.id = p.idevenement AND p.idetudiant = $2
      WHERE e.id = $1`,
      [eventId, studentId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Événement non trouvé" });
    }

    console.log(`✅ Détails événement ${eventId} récupérés`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Erreur API /events/detail:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * 🆕 POST /api/events/register
 * Body: { eventId, studentId }
 * 
 * Permet à un étudiant de s'inscrire à un événement
 */
app.post("/api/events/register", async (req, res) => {
  try {
    const { eventId, studentId } = req.body;

    if (!eventId || !studentId) {
      return res.status(400).json({
        message: "eventId et studentId sont requis",
      });
    }

    // Vérifier si l'étudiant est déjà inscrit
    const existingParticipation = await pool.query(
      "SELECT id FROM participation WHERE idevenement = $1 AND idetudiant = $2",
      [eventId, studentId]
    );

    if (existingParticipation.rowCount > 0) {
      return res.status(400).json({
        message: "Vous êtes déjà inscrit à cet événement",
      });
    }

    // Inscription
    await pool.query(
      "INSERT INTO participation (idevenement, idetudiant, status) VALUES ($1, $2, 'EN_COURS')",
      [eventId, studentId]
    );

    console.log(`✅ Étudiant ${studentId} inscrit à l'événement ${eventId}`);

    res.json({
      message: "Inscription réussie ✅",
      status: "EN_COURS",
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'inscription:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * 🆕 DELETE /api/events/unregister/:participationId
 * 
 * Permet à un étudiant de se désinscrire d'un événement
 */
app.delete("/api/events/unregister/:participationId", async (req, res) => {
  try {
    const { participationId } = req.params;

    const result = await pool.query(
      "DELETE FROM participation WHERE id = $1 RETURNING id",
      [participationId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Participation non trouvée",
      });
    }

    console.log(`✅ Participation ${participationId} supprimée`);

    res.json({
      message: "Désinscription réussie ✅",
    });
  } catch (error) {
    console.error("❌ Erreur lors de la désinscription:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// 🚀 LANCEMENT DU SERVEUR
// ============================================

app.listen(3000, () => {
  console.log("✅ Serveur lancé sur le port 3000");
});

