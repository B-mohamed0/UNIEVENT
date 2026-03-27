const pool = require('./db');
const bcrypt = require('bcrypt');

async function fixPassword() {
    const email = 'hamza';
    const newPass = '123';
    
    try {
        console.log("Tentative de connexion à la base...");
        const res = await pool.query("SELECT * FROM organisateur WHERE email = $1", [email]);
        if (res.rowCount === 0) {
            console.log(`Utilisateur ${email} non trouvé dans 'organisateur'`);
            return;
        }
        
        const user = res.rows[0];
        console.log(`Utilisateur trouvé: ID=${user.id}, Nom=${user.nom}`);
        
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPass, salt);
        
        await pool.query("UPDATE organisateur SET password = $1 WHERE email = $2", [hashed, email]);
        console.log(`✅ Mot de passe pour ${email} mis à jour avec le hash de '${newPass}'`);
        
    } catch (err) {
        console.error("❌ Erreur:", err.message);
    } finally {
        await pool.end();
    }
}

fixPassword();
