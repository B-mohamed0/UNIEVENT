const express = require("express");
const os = require("os");
const pool = require("./db");
const bcrypt = require("bcrypt");
const cors = require("cors");
const helmet = require("helmet");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const cron = require("node-cron");
const { Expo } = require("expo-server-sdk");
require("dotenv").config();

// --- GESTION DES ERREURS GLOBALES (Empêche le serveur de s'éteindre sans log) ---
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('🌪️ UNHANDLED REJECTION:', reason);
});


// --- EXPO PUSH CLIENT ---
const expo = new Expo();

// --- CONFIGURATION NODEMAILER (Pour l'envoi de mails/OTP) ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

const app = express();

// --- CONFIGURATION SÉCURITÉ ET MIDDLEWARES ---
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// --- STOCKAGE TEMPORAIRE DES CODES OTP ---
const otpStore = new Map();

// --- INITIALISATION DES TABLES NOTIFICATIONS ---
const initNotificationTables = async () => {
  try {
    // 1. Table des push tokens (Expo)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS push_tokens (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(50),
        prof_id INTEGER,
        token TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(student_id, token),
        UNIQUE(prof_id, token)
      )
    `);

    // 2. Table des notifications (in-app)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(50),
        prof_id INTEGER,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        event_id INTEGER REFERENCES evenement(id) ON DELETE CASCADE,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 3. Table des lectures (pour gérer le "lu" par utilisateur pour les notifs globales)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_reads (
        id SERIAL PRIMARY KEY,
        notification_id INTEGER REFERENCES notifications(id) ON DELETE CASCADE,
        student_id VARCHAR(50),
        prof_id INTEGER,
        read_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(notification_id, student_id),
        UNIQUE(notification_id, prof_id)
      )
    `);

    // 4. Table des feedbacks
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        idevenement INTEGER REFERENCES evenement(id) ON DELETE CASCADE,
        idetudiant VARCHAR(50) REFERENCES etudiant(id),
        idprof INTEGER REFERENCES professeur(id),
        status VARCHAR(20) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    // 5. Mise à jour des tables existantes (pour les colonnes manquantes)
    await pool.query("ALTER TABLE push_tokens ADD COLUMN IF NOT EXISTS prof_id INTEGER");
    await pool.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS prof_id INTEGER");
    await pool.query("ALTER TABLE notification_reads ADD COLUMN IF NOT EXISTS prof_id INTEGER");
    await pool.query("ALTER TABLE feedback ADD COLUMN IF NOT EXISTS idprof INTEGER");
    
    console.log("✅ Tables et colonnes de notification initialisées");
  } catch (err) {
    console.error("❌ Erreur initialisation tables notifications:", err.message);
  }
};
initNotificationTables();

// --- HELPER : FORMATTER LE STATUT DE L'ÉVÉNEMENT ---
// Utilise la date/heure LOCALE du serveur (et pas UTC) pour éviter
// qu'un événement du jour soit marqué "Terminé" à cause du décalage horaire.
const formatEventStatus = (dbStatus, date, startTime, endTime) => {
  const now = new Date();

  const formatLocalDate = (d) => {
    const nd = new Date(d);
    const y = nd.getFullYear();
    const m = String(nd.getMonth() + 1).padStart(2, "0");
    const day = String(nd.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const today = formatLocalDate(now);
  const eventDate = formatLocalDate(date);
  const currentTime = now.toTimeString().split(" ")[0].substring(0, 5); // HH:MM

  if (
    dbStatus === "EXPIRE" ||
    eventDate < today ||
    (eventDate === today && endTime && currentTime > endTime)
  ) {
    return "Terminé";
  }

  if (
    dbStatus === "MAINTENANT" ||
    (eventDate === today &&
      startTime &&
      currentTime >= startTime &&
      (!endTime || currentTime <= endTime))
  ) {
    return "En cours";
  }

  return "À venir";
};

/**
 * 🆕 HELPER : DÉTERMINER LE STATUT POUR LA BASE DE DONNÉES
 * Même logique que ci-dessus, en se basant sur la date locale.
 */
const getDbStatus = (date, startTime, endTime) => {
  const now = new Date();

  const formatLocalDate = (d) => {
    const nd = new Date(d);
    const y = nd.getFullYear();
    const m = String(nd.getMonth() + 1).padStart(2, "0");
    const day = String(nd.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const today = formatLocalDate(now);
  const eventDate = formatLocalDate(date);
  const currentTime = now.toTimeString().split(" ")[0].substring(0, 5); // HH:MM

  if (eventDate < today || (eventDate === today && endTime && currentTime > endTime)) {
    return "EXPIRE";
  }
  if (eventDate === today && startTime && currentTime >= startTime && (!endTime || currentTime <= endTime)) {
    return "MAINTENANT";
  }
  return "BIENTOT";
};

// ============================
// ROUTES PROF : DÉTAIL + INSCRIPTION
// (Utilise la table `participation` via `idprof`, déjà présente en base)
// ============================

// Détails événement pour un professeur
app.get("/api/prof/events/detail/:eventId/:profId", async (req, res) => {
  try {
    const { eventId, profId } = req.params;

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
        e.theme_color,
        o.nom as organisateur_nom,
        p.status as participation_status,
        p.id as participation_id
      FROM evenement e
      LEFT JOIN organisateur o ON e.idorganisateur = o.id
      LEFT JOIN participation p ON e.id = p.idevenement AND p.idprof = $2
      WHERE e.id = $1`,
      [eventId, profId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Événement non trouvé" });
    }

    const event = result.rows[0];
    event.event_status = formatEventStatus(event.status, event.date, event.heure_debut, event.heure_fin);
    res.json(event);
  } catch (error) {
    console.error("❌ Erreur API /prof/events/detail:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Inscription professeur à un événement
app.post("/api/prof/events/:eventId/inscription", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { profId, nom, filiere, annee } = req.body;

    if (!profId || !eventId) {
      return res.status(400).json({ message: "profId et eventId sont requis" });
    }

    const profExists = await pool.query("SELECT id FROM professeur WHERE id = $1", [profId]);
    if (profExists.rowCount === 0) {
      return res.status(400).json({ message: "Professeur introuvable" });
    }

    const eventExists = await pool.query("SELECT id FROM evenement WHERE id = $1", [eventId]);
    if (eventExists.rowCount === 0) {
      return res.status(404).json({ message: "Événement introuvable" });
    }

    const existing = await pool.query(
      "SELECT id FROM participation WHERE idprof = $1 AND idevenement = $2",
      [profId, eventId]
    );
    if (existing.rowCount > 0) {
      return res.status(400).json({ message: "Vous êtes déjà inscrit à cet événement" });
    }

    const insert = await pool.query(
      `INSERT INTO participation (idprof, idevenement, nom, filiere, annee, status)
       VALUES ($1, $2, $3, $4, $5, 'INSCRIT')
       RETURNING id, idevenement, status`,
      [profId, eventId, nom || null, filiere || null, annee || null]
    );

    res.status(201).json({ message: "Inscription réussie", participation: insert.rows[0] });
  } catch (err) {
    console.error("❌ ERROR DURING PROF INSCRIPTION:", err);
    if (err && err.code === "23505") {
      return res.status(400).json({ message: "Vous êtes déjà inscrit à cet événement" });
    }
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Désinscription professeur
app.delete("/api/prof/events/unregister/:participationId", async (req, res) => {
  try {
    const { participationId } = req.params;
    const result = await pool.query(
      "DELETE FROM participation WHERE id = $1 RETURNING id",
      [participationId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Inscription non trouvée" });
    }
    res.json({ message: "Désinscription réussie ✅" });
  } catch (err) {
    console.error("❌ Erreur unregister prof:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// --- HELPER : ENVOYER DES NOTIFICATIONS PUSH ---
const sendPushNotifications = async (tokens, title, body, data = {}) => {
  const messages = [];
  for (let pushToken of tokens) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }
    messages.push({
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
    });
  }

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];
  for (let chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error("Error sending push notifications:", error);
    }
  }
};

/**
 * 🆕 POST /api/students/push-token
 * Enregistre le push token d'un étudiant
 */
app.post("/api/students/push-token", async (req, res) => {
  const { studentId, token } = req.body;
  if (!studentId || !token) {
    return res.status(400).json({ error: "studentId et token sont requis" });
  }

  try {
    await pool.query(
      "UPDATE etudiant SET push_token = $1 WHERE id = $2",
      [token, studentId]
    );
    res.json({ message: "Push token enregistré avec succès ✅" });
  } catch (error) {
    console.error("Error saving push token:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
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

    const token = jwt.sign(
      { id: cne, role: "STUDENT", nom },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({ message: "Inscription réussie ✅", user: { nom, id: cne, role: "STUDENT" }, token });
  } catch (error) {
    console.error("ERREUR SQL DÉTAILLÉE :", error.message);
    res.status(500).json({ message: "Erreur lors de l'enregistrement", dev_detail: error.message });
  }
});

// --- ROUTES PROFESSEUR ---
app.get("/api/prof/ping", (req, res) => {
  res.json({ message: "Pong! L'API Professeur est active ✅" });
});

/**
 * GET /api/prof/profile/:id
 * Récupère le profil du professeur
 */
app.get("/api/prof/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT id, nom, email, photo FROM professeur WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Professeur non trouvé" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching prof profile:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * PUT /api/prof/profile/:id
 * Met à jour le profil du professeur
 */
app.put("/api/prof/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, photo } = req.body;

    const result = await pool.query(
      "UPDATE professeur SET nom = $1, photo = $2 WHERE id = $3 RETURNING id, nom, email, photo",
      [nom, photo, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Professeur non trouvé" });
    }

    res.json({
      message: "Profil mis à jour avec succès ✅",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating prof profile:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ==========================================
// ROUTE : CONNEXION PROFESSEUR (LOGIN)
// ==========================================
app.post("/api/prof/login", async (req, res) => {
  console.log("PROF LOGIN ATTEMPT:", req.body);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Tous les champs sont obligatoires",
      });
    }

    // Recherche dans la table professeur (au lieu de etudiant)
    const result = await pool.query(
      "SELECT * FROM professeur WHERE email = $1",
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        message: "Email inexistant ou compte non professeur",
      });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        message: "Mot de passe incorrect",
      });
    }

    // On force le rôle "PROFESSOR" manuellement pour l'application
    const token = jwt.sign(
      { id: user.id, role: "PROFESSOR", nom: user.nom },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      message: "Connexion réussie ✅",
      user: { nom: user.nom, id: user.id, role: "PROFESSOR", photo: user.photo },
      token
    });
  } catch (error) {
    console.error("BACKEND PROF ERROR:", error);
    res.status(500).json({
      message: "Erreur serveur",
    });
  }
});

// ==========================================
// 4. ROUTE : CONNEXION (LOGIN) ETUDIANT / ORGANISATEUR
// ==========================================
app.post("/api/auth/login", async (req, res) => {
  console.log("LOGIN ATTEMPT:", req.body);
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Tous les champs sont obligatoires",
      });
    }

    // Tenter de trouver dans etudiant
    let result = await pool.query(
      "SELECT nom, email, id, password, 'STUDENT' as role, photo FROM etudiant WHERE email = $1",
      [email]
    );

    // Si non trouvé et on n'a pas spécifié de rôle ou on a spécifié ORGANIZER, on cherche dans organisateur
    if (result.rowCount === 0) {
      result = await pool.query(
        "SELECT nom, email, id, password, 'ORGANIZER' as role, photo FROM organisateur WHERE email = $1",
        [email]
      );
    }

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

    const token = jwt.sign(
      { id: user.id, role: user.role, nom: user.nom },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      message: "Connexion réussie ✅",
      user: { nom: user.nom, id: user.id, role: user.role, photo: user.photo },
      token
    });
  } catch (error) {
    console.error("BACKEND ERROR:", error);
    res.status(500).json({
      message: "Erreur serveur",
    });
  }
});

/**
 * 🆕 ROUTE : ENVOYER OTP POUR RÉINITIALISATION (FORGOT PASSWORD)
 */
app.post("/api/auth/forgot-password-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "L'email est requis" });
  }

  try {
    // Vérifier si l'utilisateur existe (étudiant ou organisateur)
    let userResult = await pool.query("SELECT id FROM etudiant WHERE email = $1", [email]);
    if (userResult.rowCount === 0) {
      userResult = await pool.query("SELECT id FROM organisateur WHERE email = $1", [email]);
    }

    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: "Cet email n'est pas enregistré" });
    }

    // Générer OTP (6 chiffres)
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Stocker dans otpStore
    otpStore.set(email, {
      code,
      expires: Date.now() + 300000, // 5 minutes
    });

    // Envoyer le mail
    await transporter.sendMail({
      from: '"Service EST" <aminezakhir8@gmail.com>',
      to: email,
      subject: "Réinitialisation de votre mot de passe",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center;">
          <h2>Réinitialisation de mot de passe</h2>
          <p>Utilisez le code suivant pour réinitialiser votre mot de passe :</p>
          <h1 style="color: #143287;">${code}</h1>
          <p>Ce code expirera dans 5 minutes.</p>
        </div>
      `,
    });

    console.log(`Code OTP de récupération envoyé à ${email}`);
    res.json({ message: "Code de récupération envoyé par mail" });
  } catch (error) {
    console.error("Erreur Forgot Password OTP:", error);
    res.status(500).json({ message: "Erreur lors de l'envoi du mail" });
  }
});

/**
 * 🆕 ROUTE : RÉINITIALISER LE MOT DE PASSE (RESET PASSWORD)
 */
app.post("/api/auth/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: "Tous les champs sont requis" });
  }

  // Vérifier OTP
  const data = otpStore.get(email);
  if (!data || data.code !== otp || Date.now() > data.expires) {
    return res.status(400).json({ message: "Code invalide ou expiré" });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordhasher = await bcrypt.hash(newPassword, salt);

    // Tenter de mettre à jour dans etudiant d'abord
    let result = await pool.query(
      "UPDATE etudiant SET password = $1 WHERE email = $2 RETURNING id",
      [passwordhasher, email]
    );

    // Si pas trouvé dans etudiant, tenter dans organisateur
    if (result.rowCount === 0) {
      result = await pool.query(
        "UPDATE organisateur SET password = $1 WHERE email = $2 RETURNING id",
        [passwordhasher, email]
      );
    }

    // Si pas trouvé non plus, tenter dans professeur
    if (result.rowCount === 0) {
      result = await pool.query(
        "UPDATE professeur SET password = $1 WHERE email = $2 RETURNING id",
        [passwordhasher, email]
      );
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Effacer l'OTP
    otpStore.delete(email);

    res.json({ message: "Mot de passe mis à jour avec succès ✅" });
  } catch (error) {
    console.error("Erreur Reset Password:", error);
    res.status(500).json({ message: "Erreur lors de la réinitialisation" });
  }
});

// Route pour changer le mot de passe (si connecté)
app.post("/api/auth/change-password", async (req, res) => {
  const { userId, role, currentPassword, newPassword } = req.body;

  if (!userId || !role || !currentPassword || !newPassword) {
    return res.status(400).json({ message: "Tous les champs sont requis" });
  }

  try {
    let table;
    if (role === "ORGANIZER") {
      table = "organisateur";
    } else if (role === "PROFESSOR") {
      table = "professeur";
    } else {
      table = "etudiant";
    }

    // 1. Récupérer l'utilisateur
    const userRes = await pool.query(`SELECT password FROM ${table} WHERE id = $1`, [userId]);

    if (userRes.rowCount === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // 2. Vérifier l'ancien mot de passe
    const isMatch = await bcrypt.compare(currentPassword, userRes.rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ message: "Ancien mot de passe incorrect" });
    }

    // 3. Hasher le nouveau mot de passe
    const hashedPass = await bcrypt.hash(newPassword, 10);

    // 4. Mettre à jour
    await pool.query(`UPDATE ${table} SET password = $1 WHERE id = $2`, [hashedPass, userId]);

    res.json({ message: "Mot de passe changé avec succès ✅" });
  } catch (error) {
    console.error(" Erreur change-password:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ==========================================
// 🆕 ROUTES ORGANISATEUR
// ==========================================

/**
 * GET /api/organizer/stats/:id
 * Retourne les stats du dashboard organisateur
 */
// Route consolidée pour les statistiques d'un organisateur
// Route consolidée pour les statistiques d'un organisateur avec filtres
app.get("/api/organizer/stats/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { month, category } = req.query;

    console.log(`📊 Récupération des stats filtrées pour l'organisateur ID: ${id} (Mois: ${month}, Cat: ${category})`);

    // --- CONSTRUCTION DES FILTRES ---
    let eventFilters = "WHERE idorganisateur = $1";
    let filterParams = [id];
    let pIdx = 2;

    if (month && month !== "all" && month !== "undefined") {
      eventFilters += ` AND EXTRACT(MONTH FROM date) = $${pIdx}`;
      filterParams.push(month);
      pIdx++;
    }
    if (category && category !== "all" && category !== "undefined" && category !== "Toutes Catégories") {
      eventFilters += ` AND categorie = $${pIdx}`;
      filterParams.push(category);
      pIdx++;
    }

    // 1️⃣ Total des événements (filtré)
    const totalEventsQuery = await pool.query(`SELECT COUNT(*) FROM evenement ${eventFilters}`, filterParams);

    // 2️⃣ Événements actifs (filtré)
    let activeFilters = eventFilters + " AND status != 'EXPIRE' AND status != 'EXPIRER'";
    const activeEventsQuery = await pool.query(`SELECT COUNT(*) FROM evenement ${activeFilters}`, filterParams);

    // 3️⃣ Total des inscriptions (filtré)
    const totalRegistrationsQuery = await pool.query(
      `SELECT COUNT(*) FROM participation p INNER JOIN evenement e ON e.id = p.idevenement ${eventFilters.replace("WHERE", "WHERE e.")}`,
      filterParams
    );

    // 4️⃣ Présences validées (filtré)
    const validatedAttendancesQuery = await pool.query(
      `SELECT COUNT(*) FROM participation p INNER JOIN evenement e ON e.id = p.idevenement ${eventFilters.replace("WHERE", "WHERE e.")} AND p.status = 'PRESENT'`,
      filterParams
    );

    // 5️⃣ Taux de présence Moyen (filtré)
    const avgAttendanceQuery = await pool.query(
      `SELECT 
         CASE 
           WHEN SUM(e.capacite_max) > 0 THEN 
             (COUNT(CASE WHEN p.status = 'PRESENT' OR p.status = 'EN_COURS' THEN 1 END)::float / SUM(e.capacite_max)) * 100
           ELSE 0 
         END as avg_rate
       FROM evenement e
       LEFT JOIN participation p ON e.id = p.idevenement
       ${eventFilters.replace("WHERE", "WHERE e.")}`,
      filterParams
    );

    // 6️⃣ Meilleur taux de présence sur un seul événement (filtré)
    const bestRateQuery = await pool.query(
      `SELECT MAX(rate) AS best_rate
       FROM (
           SELECT 
             CASE 
               WHEN e.capacite_max > 0 THEN
                 (COUNT(CASE WHEN p.status = 'PRESENT' OR p.status = 'EN_COURS' THEN 1 END)::float / e.capacite_max) * 100
               ELSE 0
             END AS rate
           FROM evenement e
           LEFT JOIN participation p ON e.id = p.idevenement
           ${eventFilters.replace("WHERE", "WHERE e.")}
           GROUP BY e.id, e.capacite_max
       ) sub`,
      filterParams
    );

    // 7️⃣ Participants par mois (Trend Graph) - Non filtré par mois pour voir l'année
    // Mais filtré par catégorie si spécifié
    let trendFilters = "WHERE e.idorganisateur = $1 AND EXTRACT(YEAR FROM e.date) = EXTRACT(YEAR FROM CURRENT_DATE)";
    let trendParams = [id];
    if (category && category !== "all" && category !== "undefined" && category !== "Toutes Catégories") {
      trendFilters += " AND e.categorie = $2";
      trendParams.push(category);
    }

    const trendQuery = await pool.query(
      `SELECT EXTRACT(MONTH FROM e.date) as m, COUNT(p.id) as c
       FROM evenement e
       LEFT JOIN participation p ON e.id = p.idevenement
       ${trendFilters}
       GROUP BY m ORDER BY m`,
      trendParams
    );

    // Formatter en tableau de 12 mois
    const participantsPerMonth = new Array(12).fill(0);
    trendQuery.rows.forEach(row => {
      const monthIdx = parseInt(row.m) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        participantsPerMonth[monthIdx] = parseInt(row.c);
      }
    });

    // 8️⃣ Catégories disponibles pour cet organisateur
    const categoriesQuery = await pool.query(
      "SELECT DISTINCT categorie FROM evenement WHERE idorganisateur = $1 AND categorie IS NOT NULL",
      [id]
    );
    const availableCategories = categoriesQuery.rows.map(r => r.categorie);

    res.json({
      activeEvents: parseInt(activeEventsQuery.rows[0].count),
      totalRegistrations: parseInt(totalRegistrationsQuery.rows[0].count),
      totalAttendances: parseInt(validatedAttendancesQuery.rows[0].count),
      avgAttendance: parseFloat(avgAttendanceQuery.rows[0].avg_rate || 0).toFixed(1),
      totalEvenement: parseInt(totalEventsQuery.rows[0].count),
      totalParticipants: parseInt(totalRegistrationsQuery.rows[0].count),
      bestTauxPresence: parseFloat(bestRateQuery.rows[0].best_rate || 0).toFixed(2) + "%",
      participantsPerMonth,
      availableCategories
    });
  } catch (error) {
    console.error("❌ Erreur stats organisateur avec filtres:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * GET /api/organizer/events-week/:id
 * Retourne les événements de la semaine pour l'organisateur
 */
app.get("/api/organizer/events-week/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Obtenir la date actuelle
    const now = new Date();

    // Ajuster pour avoir le Lundi de la semaine courante
    const dayOfWeek = now.getDay();
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);

    const startOfWeekDate = new Date(now.setDate(diffToMonday));
    const startOfWeek = startOfWeekDate.toISOString().split("T")[0];

    // Ajuster pour avoir le Dimanche de la semaine courante
    const endOfWeekDate = new Date(startOfWeekDate);
    endOfWeekDate.setDate(endOfWeekDate.getDate() + 6);
    const endOfWeek = endOfWeekDate.toISOString().split("T")[0];

    console.log(`📅 Fetching weekly events for ${id} between ${startOfWeek} and ${endOfWeek}`);

    const result = await pool.query(
      `SELECT * FROM evenement 
       WHERE idorganisateur = $1 
       AND date >= $2 AND date <= $3 
       ORDER BY date ASC`,
      [id, startOfWeek, endOfWeek]
    );

    const events = result.rows.map(event => ({
      ...event,
      event_status: formatEventStatus(event.status, event.date, event.heure_debut, event.heure_fin)
    }));

    res.json(events);
  } catch (error) {
    console.error("Error fetching events of the week:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * GET /api/organizer/events/:id
 * Retourne la liste des événements créés par l'organisateur
 */
app.get("/api/organizer/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT e.*, 
        (SELECT COUNT(*) FROM participation p WHERE p.idevenement = e.id) as inscrits,
        (SELECT COUNT(*) FROM participation p WHERE p.idevenement = e.id AND p.status = 'PRESENT') as presents
      FROM evenement e 
      WHERE e.idorganisateur = $1 
      ORDER BY e.date DESC`,
      [id]
    );

    const events = result.rows.map(event => ({
      ...event,
      event_status: formatEventStatus(event.status, event.date, event.heure_debut, event.heure_fin)
    }));

    res.json(events);
  } catch (error) {
    console.error("Error fetching organizer events:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * GET /api/organizer/manage/:eventId
 * Détails complets et liste des participants pour un événement
 */
app.get("/api/organizer/manage/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;

    const eventResult = await pool.query("SELECT * FROM evenement WHERE id = $1", [eventId]);
    if (eventResult.rowCount === 0) return res.status(404).json({ error: "Événement non trouvé" });

    const participantsResult = await pool.query(
      `SELECT p.id, p.status, 
              COALESCE(p.idetudiant, CAST(p.idprof AS VARCHAR)) as user_id,
              COALESCE(et.nom, pr.nom) as nom, 
              COALESCE(et.email, pr.email) as email, 
              COALESCE(et.photo, pr.photo) as photo,
              CASE WHEN p.idetudiant IS NOT NULL THEN 'STUDENT' ELSE 'PROFESSOR' END as role
       FROM participation p
       LEFT JOIN etudiant et ON p.idetudiant = et.id
       LEFT JOIN professeur pr ON p.idprof = pr.id
       WHERE p.idevenement = $1`,
      [eventId]
    );

    const event = eventResult.rows[0];
    const eventWithStatus = {
      ...event,
      event_status: formatEventStatus(event.status, event.date, event.heure_debut, event.heure_fin)
    };

    res.json({
      event: eventWithStatus,
      participants: participantsResult.rows
    });
  } catch (error) {
    console.error("Error managing event:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * GET /api/organizer/manage/:eventId/export-csv
 * Exporte la liste des participants d'un événement en CSV (Excel-compatible)
 */
app.get("/api/organizer/manage/:eventId/export-csv", async (req, res) => {
  try {
    const { eventId } = req.params;

    // Récupérer l'événement
    const eventResult = await pool.query("SELECT nom_evenement, date, lieu FROM evenement WHERE id = $1", [eventId]);
    if (eventResult.rowCount === 0) return res.status(404).json({ error: "Événement non trouvé" });
    const event = eventResult.rows[0];

    // Récupérer les participants
    const participantsResult = await pool.query(
      `SELECT COALESCE(et.nom, pr.nom) as nom, 
              COALESCE(et.email, pr.email) as email, 
              COALESCE(p.idetudiant, CAST(p.idprof AS VARCHAR)) as user_id, 
              p.status,
              CASE WHEN p.idetudiant IS NOT NULL THEN 'Étudiant' ELSE 'Professeur' END as role
       FROM participation p
       LEFT JOIN etudiant et ON p.idetudiant = et.id
       LEFT JOIN professeur pr ON p.idprof = pr.id
       WHERE p.idevenement = $1
       ORDER BY nom ASC`,
      [eventId]
    );

    const eventDate = new Date(event.date).toLocaleDateString("fr-FR");
    const participants = participantsResult.rows;

    // Construire le contenu CSV avec BOM pour Excel (UTF-8)
    const BOM = "\uFEFF";
    let csv = BOM;
    csv += `Événement;${event.nom_evenement}\n`;
    csv += `Date;${eventDate}\n`;
    csv += `Lieu;${event.lieu || ""}\n`;
    csv += `Total participants;${participants.length}\n`;
    csv += `Présents;${participants.filter(p => p.status === "PRESENT").length}\n`;
    csv += `Absents;${participants.filter(p => p.status === "ABSENT").length}\n`;
    csv += `Inscrits;${participants.filter(p => p.status === "INSCRIT").length}\n`;
    csv += "\n";
    csv += "Nom;Email;ID;Rôle;Statut\n";

    participants.forEach((p) => {
      const statusLabel = p.status === "PRESENT" ? "Présent" : p.status === "ABSENT" ? "Absent" : "Inscrit";
      csv += `${p.nom};${p.email};${p.user_id};${p.role};${statusLabel}\n`;
    });

    const safeName = event.nom_evenement.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `Participants_${safeName}_${eventDate.replace(/\//g, "-")}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(csv);

  } catch (error) {
    console.error("Erreur export CSV:", error);
    res.status(500).json({ error: "Erreur lors de la génération du CSV" });
  }
});

/**
 * GET /api/organizer/profile/:id
 * Récupère le profil de l'organisateur
 */
app.get("/api/organizer/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT id, nom, email, photo FROM organisateur WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Organisateur non trouvé" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * PUT /api/organizer/profile/:id
 * Met à jour le profil de l'organisateur
 */
app.put("/api/organizer/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, photo } = req.body;

    const result = await pool.query(
      "UPDATE organisateur SET nom = $1, photo = $2 WHERE id = $3 RETURNING id, nom, email, photo",
      [nom, photo, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Organisateur non trouvé" });
    }

    res.json({
      message: "Profil mis à jour avec succès ✅",
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/events/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.query; // ?role=STUDENT ou ?role=PROFESSOR
    const status = 'BIENTOT';
    const today = new Date().toISOString().split("T")[0];

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

    // 3️⃣ Événements complétés par cet utilisateur
    const userField = role === "PROFESSOR" ? "idprof" : "idetudiant";
    const resultCompleted = await pool.query(
      `SELECT COUNT(*) AS count FROM participation WHERE status = 'PRESENT' AND ${userField} = $1`,
      [userId]
    );

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
app.get("/api/events/upcoming/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.query; // S'attendre à ?role=STUDENT ou ?role=PROFESSOR
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().split(" ")[0].substring(0, 5);

    console.log(`🔍 Recherche tous les événements non expirés pour ${role || 'utilisateur'} ${userId}`);

    // Déterminer la jointure de participation selon le rôle
    let participationJoin = "LEFT JOIN participation p ON e.id = p.idevenement AND p.idetudiant = $1";
    if (role === "PROFESSOR") {
      participationJoin = "LEFT JOIN participation p ON e.id = p.idevenement AND p.idprof = $1";
    }

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
        e.theme_color,
        p.status as participation_status
      FROM evenement e
      ${participationJoin}
      WHERE e.status != 'EXPIRE'
        AND (
          e.date > $2
          OR 
          (e.date = $2 AND e.heure_fin >= $3)
        )
      ORDER BY e.date ASC, e.heure_debut ASC`,
      [userId, today, currentTime]
    );

    console.log(`📊 Résultat de la requête : ${result.rowCount} événements trouvés`);
    if (result.rowCount > 0) {
      console.log(`📝 Premier événement : ${result.rows[0].nom_evenement} (Statut: ${result.rows[0].status}, Date: ${result.rows[0].date})`);
    }

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
      const eventStatus = formatEventStatus(event.status, event.date, event.heure_debut, event.heure_fin);

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
app.get("/api/events/active/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.query; // ?role=STUDENT ou ?role=PROFESSOR
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().split(" ")[0].substring(0, 5);

    console.log(`🔍 Recherche prochain événement pour ${role || 'utilisateur'} ${userId}`);

    const userField = role === "PROFESSOR" ? "idprof" : "idetudiant";

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
        e.theme_color,
        p.status as participation_status
      FROM evenement e
      LEFT JOIN participation p ON e.id = p.idevenement AND p.${userField} = $1
      WHERE e.status != 'EXPIRE'
        AND (
          e.date > $2
          OR 
          (e.date = $2 AND e.heure_fin >= $3)
        )
      ORDER BY e.date ASC, e.heure_debut ASC
      LIMIT 1`,
      [userId, today, currentTime]
    );

    if (result.rowCount === 0) {
      return res.json({ event: null, message: "Aucun événement à venir" });
    }

    const event = result.rows[0];
    const eventStatus = formatEventStatus(event.status, event.date, event.heure_debut, event.heure_fin);

    res.json({
      event: { ...event, event_status: eventStatus },
      message: `Événement ${eventStatus.toLowerCase()} trouvé`,
    });
  } catch (error) {
    console.error("❌ Erreur API /events/active/:userId:", error);
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
        idorganisateur,
        theme_color
      FROM evenement
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
        event_status: formatEventStatus(event.status, event.date, event.heure_debut, event.heure_fin),
      };
    });

    console.log(`✅ ${events.length} événements récupérés`);
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
app.get("/api/events/detail/:eventId/:userId", async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const { role } = req.query; // ?role=STUDENT ou ?role=PROFESSOR

    const userField = role === "PROFESSOR" ? "idprof" : "idetudiant";

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
        e.theme_color,
        o.nom as organisateur_nom,
        p.status as participation_status,
        p.id as participation_id
      FROM evenement e
      LEFT JOIN organisateur o ON e.idorganisateur = o.id
      LEFT JOIN participation p ON e.id = p.idevenement AND p.${userField} = $2
      WHERE e.id = $1`,
      [eventId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Événement non trouvé" });
    }

    const event = result.rows[0];
    event.event_status = formatEventStatus(event.status, event.date, event.heure_debut, event.heure_fin);

    res.json(event);
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
      "INSERT INTO participation (idevenement, idetudiant, status) VALUES ($1, $2, 'INSCRIT')",
      [eventId, studentId]
    );

    console.log(`✅ Étudiant ${studentId} inscrit à l'événement ${eventId}`);

    res.json({
      message: "Inscription réussie ✅",
      status: "INSCRIT",
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

/**
 * 🆕 POST /api/events/:eventId/feedback
 * 
 * Permet à un étudiant de laisser un feedback sur un événement terminé
 */
app.post("/api/events/:eventId/feedback", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { studentId, profId, status, description } = req.body;

    if ((!studentId && !profId) || !status) {
      return res.status(400).json({ message: "ID utilisateur et status sont requis" });
    }

    const userField = studentId ? "idetudiant" : "idprof";
    const userId = studentId || profId;

    // Vérifier si l'utilisateur a déjà laissé un feedback
    const existingFeedback = await pool.query(
      `SELECT id FROM feedback WHERE idevenement = $1 AND ${userField} = $2`,
      [eventId, userId]
    );

    if (existingFeedback.rowCount > 0) {
      return res.status(400).json({ message: "Vous avez déjà laissé un feedback pour cet événement" });
    }

    // Insérer le feedback
    await pool.query(
      `INSERT INTO feedback (idevenement, ${userField}, status, description) VALUES ($1, $2, $3, $4)`,
      [eventId, userId, status, description || ""]
    );

    res.json({ message: "Merci pour votre feedback ! ✅" });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi du feedback:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * 🆕 GET /api/events/:eventId/feedbacks
 * 
 * Récupère tous les feedbacks pour un événement (pour l'organisateur)
 */
app.get("/api/events/:eventId/feedbacks", async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await pool.query(
      `SELECT f.*, 
              COALESCE(e.nom, pr.nom) as user_nom, 
              COALESCE(e.photo, pr.photo) as user_photo,
              CASE WHEN f.idetudiant IS NOT NULL THEN 'STUDENT' ELSE 'PROFESSOR' END as user_role
       FROM feedback f 
       LEFT JOIN etudiant e ON f.idetudiant = e.id 
       LEFT JOIN professeur pr ON f.idprof = pr.id
       WHERE f.idevenement = $1 
       ORDER BY f.created_at DESC`,
      [eventId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Erreur fetch feedbacks:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * 🆕 GET /api/events/:eventId/feedback/check/:studentId
 * 
 * Vérifie si l'étudiant a déjà laissé un feedback
 */
app.get("/api/events/:eventId/feedback/check/:userId", async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const { role } = req.query; // ?role=STUDENT ou ?role=PROFESSOR
    const userField = role === "PROFESSOR" ? "idprof" : "idetudiant";

    const result = await pool.query(
      `SELECT status, description FROM feedback WHERE idevenement = $1 AND ${userField} = $2`,
      [eventId, userId]
    );
    res.json({ exists: result.rowCount > 0, feedback: result.rows[0] });
  } catch (error) {
    console.error("❌ Erreur check feedback:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * 🆕 GET /api/student/stats/:id
 * 
 * Récupère les statistiques de participation pour un étudiant
 */
app.get("/api/student/stats/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Total des événements auxquels l'étudiant est inscrit
    const enrolledQuery = await pool.query(
      "SELECT COUNT(*) FROM participation WHERE idetudiant = $1",
      [id]
    );
    const totalEnrolled = parseInt(enrolledQuery.rows[0].count);

    // 2️⃣ Total des événements où l'étudiant a été marqué PRESENT
    const attendedQuery = await pool.query(
      "SELECT COUNT(*) FROM participation WHERE idetudiant = $1 AND status = 'PRESENT'",
      [id]
    );
    const totalAttended = parseInt(attendedQuery.rows[0].count);

    // 3️⃣ Calcul du pourcentage
    const attendancePercentage = totalEnrolled > 0
      ? Math.round((totalAttended / totalEnrolled) * 100)
      : 0;

    // 4️⃣ Liste détaillée des événements avec statut de participation
    const eventsQuery = await pool.query(
      `SELECT e.id, e.nom_evenement as title, e.nom_animateur as animator, 
              e.date, e.heure_debut, e.theme_color, e.categorie,
              p.status as participation_status
       FROM evenement e
       JOIN participation p ON e.id = p.idevenement
       WHERE p.idetudiant = $1
       ORDER BY e.date DESC`,
      [id]
    );

    res.json({
      totalEnrolled,
      totalAttended,
      attendancePercentage,
      enrolledEvents: eventsQuery.rows
    });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * 🆕 GET /api/prof/stats/:id
 * 
 * Récupère les statistiques de participation pour un professeur
 */
app.get("/api/prof/stats/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Total des événements auxquels le professeur est inscrit
    const enrolledQuery = await pool.query(
      "SELECT COUNT(*) FROM participation WHERE idprof = $1",
      [id]
    );
    const totalEnrolled = parseInt(enrolledQuery.rows[0].count);

    // 2️⃣ Total des événements où le professeur a été marqué PRESENT
    const attendedQuery = await pool.query(
      "SELECT COUNT(*) FROM participation WHERE idprof = $1 AND status = 'PRESENT'",
      [id]
    );
    const totalAttended = parseInt(attendedQuery.rows[0].count);

    // 3️⃣ Calcul du pourcentage
    const attendancePercentage = totalEnrolled > 0
      ? Math.round((totalAttended / totalEnrolled) * 100)
      : 0;

    // 4️⃣ Liste détaillée des événements avec statut de participation
    const eventsQuery = await pool.query(
      `SELECT e.id, e.nom_evenement as title, e.nom_animateur as animator, 
              e.date, e.heure_debut, e.theme_color, e.categorie,
              p.status as participation_status
       FROM evenement e
       JOIN participation p ON e.id = p.idevenement
       WHERE p.idprof = $1
       ORDER BY e.date DESC`,
      [id]
    );

    res.json({
      totalEnrolled,
      totalAttended,
      attendancePercentage,
      enrolledEvents: eventsQuery.rows
    });
  } catch (error) {
    console.error("❌ Erreur API /prof/stats/:id:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * 🆕 GET /api/student/profile/:id
 * Récupère le profil de l'étudiant
 */
app.get("/api/student/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT id, nom, email, photo FROM etudiant WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Étudiant non trouvé" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Erreur API /student/profile/:id:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * 🆕 PUT /api/student/profile/:id
 * Met à jour le profil de l'étudiant
 */
app.put("/api/student/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, photo } = req.body;

    const result = await pool.query(
      "UPDATE etudiant SET nom = $1, photo = $2 WHERE id = $3 RETURNING id, nom, email, photo",
      [nom, photo, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Étudiant non trouvé" });
    }

    res.json({
      message: "Profil mis à jour avec succès ✅",
      user: result.rows[0]
    });
  } catch (error) {
    console.error("❌ Erreur API /student/profile/:id (PUT):", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ==========================================
// 🆕 ROUTE : CRÉER UN ÉVÉNEMENT
// ==========================================
app.post("/api/events", async (req, res) => {
  try {
    const {
      nom_evenement, nom_animateur, description, lieu,
      date, date_fin, heure_debut, heure_fin,
      categorie, capacite_max, idorganisateur, theme_color
    } = req.body;

    const status = getDbStatus(date, heure_debut, heure_fin);

    const result = await pool.query(
      `INSERT INTO evenement 
       (nom_evenement, nom_animateur, description, lieu, date, date_fin, heure_debut, heure_fin, categorie, capacite_max, idorganisateur, status, theme_color)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [nom_evenement, nom_animateur, description, lieu, date, date_fin, heure_debut, heure_fin, categorie, capacite_max, idorganisateur, status, theme_color || 'Dusk']
    );

    const newEvent = result.rows[0];
    res.status(201).json(newEvent);

    // --- ENVOI NOTIFICATIONS EN ARRIÈRE-PLAN ---
    setImmediate(async () => {
      try {
        const notifTitle = `🎉 Nouvel Événement`;
        const notifBody = `${nom_evenement} - ${lieu} le ${date}`;

        // 1. Créer une notification in-app globale (student_id=NULL = pour tous)
        await pool.query(
          `INSERT INTO notifications (student_id, title, body, event_id) VALUES (NULL, $1, $2, $3)`,
          [notifTitle, notifBody, newEvent.id]
        );
        console.log(`✅ Notification in-app créée pour l'événement ${newEvent.id}`);

        // 2. Envoyer push notifications à tous les utilisateurs avec token
        const tokensResult = await pool.query(`SELECT DISTINCT token FROM push_tokens`);
        if (tokensResult.rowCount === 0) {
          console.log("ℹ️ Aucun push token enregistré");
          return;
        }

        const messages = [];
        for (const row of tokensResult.rows) {
          if (!Expo.isExpoPushToken(row.token)) continue;
          messages.push({
            to: row.token,
            sound: "default",
            title: notifTitle,
            body: notifBody,
            data: { eventId: newEvent.id },
          });
        }

        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
          try {
            await expo.sendPushNotificationsAsync(chunk);
          } catch (err) {
            console.error("Erreur envoi push chunk:", err);
          }
        }
        console.log(`✅ Push notifications envoyées à ${messages.length} étudiant(s)`);
      } catch (notifErr) {
        console.error("❌ Erreur lors de l'envoi des notifications:", notifErr.message);
      }
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ==========================================
// 🔔 ROUTES NOTIFICATIONS
// ==========================================

/**
 * POST /api/notifications/save-token
 * Enregistrer le push token Expo d'un étudiant
 */
app.post("/api/notifications/save-token", async (req, res) => {
  const { studentId, profId, token } = req.body;
  if ((!studentId && !profId) || !token) {
    return res.status(400).json({ message: "ID utilisateur et token requis" });
  }
  try {
    await pool.query(
      `INSERT INTO push_tokens (student_id, prof_id, token)
       VALUES ($1, $2, $3)
       ON CONFLICT (student_id, token) DO NOTHING
       ON CONFLICT (prof_id, token) DO NOTHING`,
      [studentId || null, profId || null, token]
    );
    console.log(`✅ Token enregistré pour ${studentId ? 'étudiant ' + studentId : 'professeur ' + profId}`);
    res.json({ message: "Token enregistré" });
  } catch (err) {
    console.error("Erreur save-token:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/**
 * GET /api/notifications/:studentId
 * Récupérer les notifications d'un étudiant (globales + personnelles), non lues en premier
 */
app.get("/api/notifications/:userId", async (req, res) => {
  const { userId } = req.params;
  const { role } = req.query; // ?role=STUDENT ou ?role=PROFESSOR
  try {
    const userField = role === "PROFESSOR" ? "prof_id" : "student_id";
    
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE ${userField} = $1 OR (student_id IS NULL AND prof_id IS NULL)
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    // Compter les non lues
    const unreadResult = await pool.query(
      `SELECT COUNT(*) FROM notifications
       WHERE (${userField} = $1 OR (student_id IS NULL AND prof_id IS NULL))
         AND id NOT IN (
           SELECT notification_id FROM notification_reads WHERE ${userField} = $1
         )`,
      [userId]
    );
    res.json({
      notifications: result.rows,
      unreadCount: parseInt(unreadResult.rows[0].count)
    });
  } catch (err) {
    console.error("Erreur GET notifications:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/**
 * POST /api/notifications/:id/read
 * Marquer une notification comme lue pour un étudiant spécifique
 */
app.post("/api/notifications/:id/read", async (req, res) => {
  const { id } = req.params;
  const { studentId, profId } = req.body;
  if (!studentId && !profId) {
    return res.status(400).json({ message: "ID utilisateur requis" });
  }
  try {
    await pool.query(
      `INSERT INTO notification_reads (notification_id, student_id, prof_id)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [id, studentId || null, profId || null]
    );
    res.json({ message: "Notification marquée comme lue" });
  } catch (err) {
    console.error("Erreur mark-read:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/**
 * POST /api/notifications/mark-all-read
 * Marquer toutes les notifications comme lues pour un étudiant
 */
app.post("/api/notifications/mark-all-read", async (req, res) => {
  const { studentId, profId } = req.body;
  if (!studentId && !profId) {
    return res.status(400).json({ message: "ID utilisateur requis" });
  }
  try {
    const userField = studentId ? "student_id" : "prof_id";
    const userId = studentId || profId;

    // Insérer une lecture pour toutes les notifs non lues
    await pool.query(
      `INSERT INTO notification_reads (notification_id, ${userField})
       SELECT id, $1 FROM notifications
       WHERE (${userField} = $1 OR (student_id IS NULL AND prof_id IS NULL))
         AND id NOT IN (
           SELECT notification_id FROM notification_reads WHERE ${userField} = $1
         )
       ON CONFLICT DO NOTHING`,
      [userId]
    );
    res.json({ message: "Toutes les notifications marquées comme lues" });
  } catch (err) {
    console.error("Erreur mark-all-read:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/**
 * 🆕 PUT /api/events/:id
 * Met à jour un événement
 */
app.put("/api/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nom_evenement, nom_animateur, description, lieu,
      date, date_fin, heure_debut, heure_fin,
      categorie, capacite_max, theme_color
    } = req.body;

    const status = getDbStatus(date, heure_debut, heure_fin);

    const result = await pool.query(
      `UPDATE evenement 
       SET nom_evenement=$1, nom_animateur=$2, description=$3, lieu=$4, 
           date=$5, date_fin=$6, heure_debut=$7, heure_fin=$8, 
           categorie=$9, capacite_max=$10, theme_color=$11, status=$12
       WHERE id=$13
       RETURNING *`,
      [nom_evenement, nom_animateur, description, lieu, date, date_fin, heure_debut, heure_fin, categorie, capacite_max, theme_color, status, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: "Événement non trouvé" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * 🆕 DELETE /api/events/:id
 * Supprime un événement
 */
app.delete("/api/events/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // On pourrait vouloir supprimer d'abord les participations liées
    await pool.query("DELETE FROM participation WHERE idevenement = $1", [id]);

    const result = await pool.query("DELETE FROM evenement WHERE id = $1 RETURNING id", [id]);

    if (result.rowCount === 0) return res.status(404).json({ error: "Événement non trouvé" });
    res.json({ message: "Événement supprimé avec succès", id: result.rows[0].id });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


// Route supprimée car consolidée plus haut


app.get('/api/events/stats/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    // 1️⃣ Total inscrits
    const totalInscrit = await pool.query(
      'SELECT COUNT(*) FROM participation WHERE idevenement = $1',
      [eventId]
    );

    // 2️⃣ Total présents
    const totalPresent = await pool.query(
      `SELECT COUNT(*) 
       FROM participation 
       WHERE idevenement = $1 
       AND status = 'PRESENT'`,
      [eventId]
    );

    const nbInscrit = parseInt(totalInscrit.rows[0].count);
    const nbPresent = parseInt(totalPresent.rows[0].count);

    // 3️⃣ Taux de présence par rapport aux inscrits
    const tauxPresence = nbInscrit > 0
      ? ((nbPresent / nbInscrit) * 100).toFixed(2)
      : 0;

    res.json({
      totalInscrit: nbInscrit,
      totalPresent: nbPresent,
      tauxPresence: tauxPresence + "%"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});









app.post("/api/events/:eventId/inscription", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { studentId, nom, filiere, annee } = req.body;

    // Validation
    const filieres = ["GI", "GM", "GP", "GE", "MDO"];
    const annees = ["1ere", "2eme", "3eme"];

    if (!nom || !filiere || !annee || !studentId || !eventId)
      return res.status(400).json({ message: "Champs manquants" });
    if (!filieres.includes(filiere)) return res.status(400).json({ message: "Filière invalide" });
    if (!annees.includes(annee)) return res.status(400).json({ message: "Année invalide" });

    // Vérifier que l'étudiant existe (évite l'erreur FK et retourne un message clair)
    const studentExists = await pool.query(
      "SELECT id FROM etudiant WHERE id = $1",
      [studentId]
    );
    if (studentExists.rowCount === 0) {
      return res.status(400).json({
        message: "Étudiant introuvable. Vérifiez que vous êtes connecté avec un compte étudiant valide.",
      });
    }

    // Vérifier si déjà inscrit
    const existing = await pool.query(
      "SELECT id FROM participation WHERE idetudiant = $1 AND idevenement = $2",
      [studentId, eventId]
    );

    if (existing.rowCount > 0) {
      return res.status(400).json({ message: "Vous êtes déjà inscrit à cet événement" });
    }

    // Création de la participation
    const result = await pool.query(
      `INSERT INTO participation (idetudiant, nom, filiere, annee, idevenement, status)
       VALUES ($1, $2, $3, $4, $5, 'INSCRIT')
       RETURNING id, idevenement, status`,
      [studentId, nom, filiere, annee, eventId]
    );

    res.status(201).json({
      message: "Inscription réussie",
      participation: result.rows[0],
    });
  } catch (err) {
    console.error("❌ ERROR DURING INSCRIPTION:", err);
    // Message plus explicite si contrainte FK (étudiant/événement inexistant)
    if (err && err.code === "23503") {
      return res.status(400).json({
        message: "Inscription impossible (référence invalide). Vérifiez votre compte et l'événement.",
      });
    }
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});


















///////////////////scan qr cde 
app.post("/api/scan", async (req, res) => {
  const { cne, eventId } = req.body;

  try {
    // Le QR peut contenir soit l'ID étudiant (CNE, varchar) soit l'ID professeur (integer).
    // On essaie d'abord côté étudiant, puis côté professeur.
    const studentRes = await pool.query(
      `SELECT p.*, e.nom, e.email, e.photo
       FROM participation p
       JOIN etudiant e ON p.idetudiant = e.id
       WHERE p.idetudiant = $1 AND p.idevenement = $2`,
      [cne, eventId]
    );

    let participant = studentRes.rows[0];
    let participantType = "STUDENT";
    let whereClause = "idetudiant = $1 AND idevenement = $2";
    let whereParams = [cne, eventId];

    if (!participant) {
      // Si le QR est numérique, tenter côté professeur
      const profId = Number.parseInt(String(cne), 10);
      if (Number.isFinite(profId)) {
        const profRes = await pool.query(
          `SELECT p.*, pr.nom, pr.email, pr.photo
           FROM participation p
           JOIN professeur pr ON p.idprof = pr.id
           WHERE p.idprof = $1 AND p.idevenement = $2`,
          [profId, eventId]
        );
        if (profRes.rows[0]) {
          participant = profRes.rows[0];
          participantType = "PROFESSOR";
          whereClause = "idprof = $1 AND idevenement = $2";
          whereParams = [profId, eventId];
        }
      }
    }

    if (!participant) {
      return res.status(400).json({
        message: "Participant non inscrit ❌",
      });
    }

    // On renvoie 200 même si déjà présent pour afficher les infos
    if (participant.status === "PRESENT") {
      return res.status(200).json({
        message: "Déjà marqué présent ⚠️",
        student: {
          nom: participant.nom,
          email: participant.email,
          photo: participant.photo,
          type: participantType,
        },
      });
    }

    await pool.query(
      `UPDATE participation
       SET status = 'PRESENT'
       WHERE ${whereClause}`,
      whereParams
    );

    res.json({ 
      message: "Présence validée ✅",
      student: {
        nom: participant.nom,
        email: participant.email,
        photo: participant.photo,
        type: participantType,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ==========================================
// DÉMARRAGE DU SERVEUR
// ==========================================
const PORT = process.env.PORT || 3000;

// Fonction pour obtenir l'IP locale (Priorité Wi-Fi/Ethernet)
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  const results = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        results.push({ name, address: iface.address });
      }
    }
  }

  // 1. Chercher Wi-Fi ou WLAN
  const wifi = results.find(r => 
    r.name.toLowerCase().includes("wi-fi") || 
    r.name.toLowerCase().includes("wlan")
  );
  if (wifi) return wifi.address;

  // 2. Chercher Ethernet physique (non virtuel)
  const ethernet = results.find(r => 
    r.name.toLowerCase().includes("ethernet") && 
    !r.name.toLowerCase().includes("virtual") && 
    !r.name.toLowerCase().includes("vbox") && 
    !r.name.toLowerCase().includes("vmware")
  );
  if (ethernet) return ethernet.address;

  // 3. Premier choix par défaut
  return results.length > 0 ? results[0].address : "localhost";
}

const localIp = getLocalIp();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🌐 Accessible sur le réseau à : http://${localIp}:${PORT}`);
});
