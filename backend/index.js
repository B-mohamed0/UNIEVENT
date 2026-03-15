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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// --- STOCKAGE TEMPORAIRE DES CODES OTP ---
const otpStore = new Map();

// --- HELPER : FORMATTER LE STATUT DE L'ÉVÉNEMENT ---
const formatEventStatus = (dbStatus, date, startTime, endTime) => {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().split(" ")[0].substring(0, 5);

  // Nettoyage de la date (YYYY-MM-DD)
  const eventDate = new Date(date).toISOString().split("T")[0];

  if (dbStatus === "EXPIRE" || (eventDate < today) || (eventDate === today && endTime && currentTime > endTime)) {
    return "Terminé";
  }

  if (dbStatus === "MAINTENANT" || (eventDate === today && startTime && currentTime >= startTime && (!endTime || currentTime <= endTime))) {
    return "En cours";
  }

  return "À venir";
};

/**
 * 🆕 HELPER : DÉTERMINER LE STATUT POUR LA BASE DE DONNÉES
 */
const getDbStatus = (date, startTime, endTime) => {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().split(" ")[0].substring(0, 5);
  const eventDate = new Date(date).toISOString().split("T")[0];

  if (eventDate < today || (eventDate === today && endTime && currentTime > endTime)) {
    return 'EXPIRE';
  }
  if (eventDate === today && startTime && currentTime >= startTime && (!endTime || currentTime <= endTime)) {
    return 'MAINTENANT';
  }
  return 'BIENTOT';
};

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
    // Ne pas supprimer ici pour le flux "reset-password" qui revérifiera après coup
    // otpStore.delete(email);
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
    // Si l'OTP était stocké pour l'inscription, on le nettoie
    otpStore.delete(email);

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

    res.json({
      message: "Connexion réussie ✅",
      user: { nom: user.nom, id: user.id, role: user.role, photo: user.photo },
    });
  } catch (error) {
    console.error("BACKEND ERROR:", error);
    res.status(500).json({
      message: "Erreur serveur",
    });
  }
});

// ==========================================
// 5. ROUTE : MOT DE PASSE OUBLIÉ (ENVOI OTP)
// ==========================================
app.post("/api/auth/forgot-password-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "L'email est requis" });
  }

  try {
    // Vérifier si l'email existe dans la table etudiant
    let result = await pool.query("SELECT email FROM etudiant WHERE email = $1", [email]);
    let table = "etudiant";

    // Fallback pour organisateur (optionnel mais robuste)
    if (result.rowCount === 0) {
      result = await pool.query("SELECT email FROM organisateur WHERE email = $1", [email]);
      table = "organisateur";
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Cet email n'existe pas" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore.set(email, {
      code,
      expires: Date.now() + 300000, // 5 minutes
      table // on garde la table pour la réinitialisation plus tard
    });

    await transporter.sendMail({
      from: '"Service EST" <aminezakhir8@gmail.com>',
      to: email,
      subject: "Réinitialisation de mot de passe",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center;">
          <h2>Code de réinitialisation</h2>
          <p>Utilisez le code suivant pour réinitialiser votre mot de passe :</p>
          <h1 style="color: #143287;">${code}</h1>
          <p>Ce code expirera dans 5 minutes.</p>
        </div>
      `,
    });

    console.log(`Code OTP de réinitialisation envoyé à ${email}`);
    res.json({ message: "Code envoyé par mail" });
  } catch (error) {
    console.error("Erreur Nodemailer/DB:", error);
    res.status(500).json({ message: "Erreur lors de l'envoi du mail" });
  }
});

// ==========================================
// 6. ROUTE : RÉINITIALISER LE MOT DE PASSE
// ==========================================
app.post("/api/auth/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: "Tous les champs sont obligatoires" });
  }

  const data = otpStore.get(email);

  if (!data || data.code !== otp || Date.now() > data.expires) {
    return res.status(400).json({ message: "Code invalide ou expiré" });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordhasher = await bcrypt.hash(newPassword, salt);

    // Mettre à jour dans la bonne table stockée lors de la demande d'OTP
    const table = data.table || "etudiant";
    const query = `UPDATE ${table} SET password = $1 WHERE email = $2`;

    const result = await pool.query(query, [passwordhasher, email]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    // Supprimer l'OTP après succès
    otpStore.delete(email);

    res.json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (error) {
    console.error("Erreur de réinitialisation:", error);
    res.status(500).json({ message: "Erreur lors de la réinitialisation" });
  }
});

// ==========================================
// 7. ROUTE : CHANGER LE MOT DE PASSE DEPUIS LE PROFIL
// ==========================================
app.post("/api/auth/change-password", async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  if (!email || !oldPassword || !newPassword) {
    return res.status(400).json({ message: "Tous les champs sont obligatoires" });
  }

  try {
    // Vérifier si l'utilisateur est un étudiant ou organisateur
    let result = await pool.query("SELECT * FROM etudiant WHERE email = $1", [email]);
    let table = "etudiant";

    if (result.rowCount === 0) {
      result = await pool.query("SELECT * FROM organisateur WHERE email = $1", [email]);
      table = "organisateur";
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    const user = result.rows[0];

    // Vérifier l'ancien mot de passe
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "L'ancien mot de passe est incorrect" });
    }

    // Hasher et enregistrer le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const passwordhasher = await bcrypt.hash(newPassword, salt);

    await pool.query(`UPDATE ${table} SET password = $1 WHERE email = $2`, [passwordhasher, email]);

    res.json({ message: "Mot de passe modifié avec succès" });
  } catch (error) {
    console.error("Erreur change-password:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ==========================================
// 8. ROUTE : ENVOYER UNE RÉCLAMATION (HELP)
// ==========================================
app.post("/api/support/send", async (req, res) => {
  const { email, nom, subject, message } = req.body;

  if (!email || !nom || !subject || !message) {
    return res.status(400).json({ message: "Tous les champs sont obligatoires." });
  }

  try {
    await transporter.sendMail({
      from: '"Demande de Support App" <aminezakhir8@gmail.com>',
      to: "aminezakhir8@gmail.com", // Send to admin email
      subject: `[SUPPORT APP] ${subject} - par ${nom}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #143287;">Nouvelle réclamation / Demande d'aide</h2>
          <p><strong>De:</strong> ${nom} (${email})</p>
          <p><strong>Sujet:</strong> ${subject}</p>
          <hr />
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `,
    });

    res.json({ message: "Réclamation envoyée avec succès." });
  } catch (error) {
    console.error("Erreur d'envoi de réclamation:", error);
    res.status(500).json({ message: "Échec de l'envoi du message." });
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
app.get("/api/organizer/stats/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`📊 Récupération des stats consolidées pour l'organisateur ID: ${id}`);

    // 1️⃣ Total des événements
    const totalEventsQuery = await pool.query(
      'SELECT COUNT(*) FROM evenement WHERE idorganisateur = $1',
      [id]
    );

    // 2️⃣ Événements actifs (non expirés)
    const activeEventsQuery = await pool.query(
      "SELECT COUNT(*) FROM evenement WHERE idorganisateur = $1 AND status != 'EXPIRE' AND status != 'EXPIRER'",
      [id]
    );

    // 3️⃣ Total des inscriptions (participations totales)
    const totalRegistrationsQuery = await pool.query(
      `SELECT COUNT(*) 
       FROM participation p
       INNER JOIN evenement e ON e.id = p.idevenement
       WHERE e.idorganisateur = $1`,
      [id]
    );

    // 4️⃣ Présences validées (PRESENT)
    const validatedAttendancesQuery = await pool.query(
      `SELECT COUNT(*) 
       FROM participation p
       INNER JOIN evenement e ON e.id = p.idevenement
       WHERE e.idorganisateur = $1 AND p.status = 'PRESENT'`,
      [id]
    );

    // 5️⃣ Taux de présence Moyen (Global)
    const avgAttendanceQuery = await pool.query(
      `SELECT 
         CASE 
           WHEN SUM(e.capacite_max) > 0 THEN 
             (COUNT(CASE WHEN p.status = 'PRESENT' OR p.status = 'EN_COURS' THEN 1 END)::float / SUM(e.capacite_max)) * 100
           ELSE 0 
         END as avg_rate
       FROM evenement e
       LEFT JOIN participation p ON e.id = p.idevenement
       WHERE e.idorganisateur = $1`,
      [id]
    );

    // 6️⃣ Meilleur taux de présence sur un seul événement
    const bestRateQuery = await pool.query(
      `SELECT MAX(rate) AS best_rate
       FROM (
           SELECT 
             CASE 
               WHEN e.capacite_max > 0 THEN
                 (COUNT(CASE WHEN p.status = 'PRESENT' OR p.status = 'EN_COURS' THEN 1 END)::float 
                  / e.capacite_max) * 100
               ELSE 0
             END AS rate
           FROM evenement e
           LEFT JOIN participation p ON e.id = p.idevenement
           WHERE e.idorganisateur = $1
           GROUP BY e.id, e.capacite_max
       ) sub`,
      [id]
    );

    const data = {
      // Pour le Dashboard
      activeEvents: parseInt(activeEventsQuery.rows[0].count),
      totalRegistrations: parseInt(totalRegistrationsQuery.rows[0].count),
      totalAttendances: parseInt(validatedAttendancesQuery.rows[0].count),
      avgAttendance: parseFloat(avgAttendanceQuery.rows[0].avg_rate || 0).toFixed(1),

      // Pour la page Stats détaillée
      totalEvenement: parseInt(totalEventsQuery.rows[0].count),
      totalParticipants: parseInt(totalRegistrationsQuery.rows[0].count), // Alias pour cohérence
      bestTauxPresence: parseFloat(bestRateQuery.rows[0].best_rate || 0).toFixed(2) + "%"
    };

    res.json(data);
  } catch (error) {
    console.error("❌ Erreur stats organisateur:", error);
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
    const now = new Date();
    const startOfWeek = now.toISOString().split("T")[0];

    const end = new Date();
    end.setDate(now.getDate() + 7);
    const endOfWeek = end.toISOString().split("T")[0];

    console.log(`📅 Fetching weekly events for ${id} between ${startOfWeek} and ${endOfWeek}`);

    const result = await pool.query(
      `SELECT * FROM evenement 
       WHERE idorganisateur = $1 
       AND date >= $2 AND date <= $3 
       ORDER BY date ASC`,
      [id, startOfWeek, endOfWeek]
    );

    res.json(result.rows);
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
      `SELECT p.id, p.status, p.idetudiant, et.nom, et.email
       FROM participation p
       JOIN etudiant et ON p.idetudiant = et.id
       WHERE p.idevenement = $1`,
      [eventId]
    );

    res.json({
      event: eventResult.rows[0],
      participants: participantsResult.rows
    });
  } catch (error) {
    console.error("Error managing event:", error);
    res.status(500).json({ error: "Erreur serveur" });
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
        e.theme_color,
        p.status as participation_status
      FROM evenement e
      LEFT JOIN participation p ON e.id = p.idevenement AND p.idetudiant = $1
      WHERE e.status != 'EXPIRE'
        AND (
          e.date > $2
          OR 
          (e.date = $2 AND e.heure_fin >= $3)
        )
      ORDER BY e.date ASC, e.heure_debut ASC`,
      [studentId, today, currentTime]
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
        e.theme_color,
        p.status as participation_status
      FROM evenement e
      LEFT JOIN participation p ON e.id = p.idevenement AND p.idetudiant = $1
      WHERE e.status != 'EXPIRE'
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

    const eventData = {
      ...event,
      color: categoryColors[event.categorie] || categoryColors.default,
      event_status: formatEventStatus(event.status, event.date, event.heure_debut, event.heure_fin),
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
        e.theme_color,
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

    const event = result.rows[0];
    event.event_status = formatEventStatus(event.status, event.date, event.heure_debut, event.heure_fin);

    console.log(`✅ Détails événement ${eventId} récupérés`);
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
    console.error("❌ Erreur API /student/stats/:id:", error);
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

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Erreur serveur" });
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
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});














app.listen(3000, () => {
  console.log("✅ Serveur lancé sur le port 3000");
});


///////////////////scan qr cde 
app.post("/api/scan", async (req, res) => {
  const { cne, eventId } = req.body;

  try {
    const result = await pool.query(
      `SELECT * FROM participation 
       WHERE idetudiant = $1 AND idevenement = $2`,
      [cne, eventId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Étudiant non inscrit ❌",
      });
    }

    const participant = result.rows[0];

    if (participant.status === "PRESENT") {
      return res.status(400).json({
        message: "Déjà marqué présent ⚠️",
      });
    }

    await pool.query(
      `UPDATE participation
       SET status = 'PRESENT'
       WHERE idetudiant = $1 AND idevenement = $2`,
      [cne, eventId]
    );

    res.json({ message: "Présence validée ✅" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});