// Authentication Logic (Custom Admin Table Version)

    document.addEventListener('DOMContentLoaded', () => {
        checkSession();

        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
    });

// Check if user is logged in (using localStorage for custom auth)
async function checkSession() {
    const session = localStorage.getItem('adminSession');
    const currentPage = window.location.pathname;

    if (currentPage.includes('index.html') || currentPage === '/') {
        if (session) {
            window.location.href = 'dashboard.html';
        }
    }
    else if (currentPage.includes('dashboard.html')) {
        if (!session) {
            window.location.href = 'index.html';
        } else {
            document.body.style.display = 'block';
            document.getElementById('user-email').textContent = session;
        }
    }
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const passwordRaw = document.getElementById('password').value;
    const password = CryptoJS.SHA256(passwordRaw).toString();
    const errorDiv = document.getElementById('login-error');
    const submitBtn = document.querySelector('button[type="submit"]');

    submitBtn.textContent = 'Signing in...';
    submitBtn.disabled = true;
    errorDiv.style.display = 'none';

    try {
        console.log("Tentative de connexion vers :", SUPABASE_URL);
        console.log("E-mail utilisé :", email);
        // Appel de la fonction SQL sécurisée
        const { data: isValid, error } = await supabaseClient.rpc('check_admin_login', {
            p_email: email,
            p_password: password
        });

        if (error) {
            console.error("Erreur RPC Supabase :", error);
            if (error.code === '42883') {
                throw new Error("Erreur technique (42883) : La fonction de connexion n'est pas accessible. Assurez-vous d'avoir exécuté le script SQL.");
            }
            throw new Error("Erreur de connexion : " + error.message);
        }

        if (!isValid) {
            throw new Error("E-mail ou mot de passe incorrect.");
        }

        localStorage.setItem('adminSession', email);
        window.location.href = 'dashboard.html';

    } catch (error) {
        let userMessage = error.message;

        if (error.message.includes("JSON object") || error.code === "PGRST116") {
            userMessage = "Identifiants invalides ou table 'admin' vide.";
        }

        errorDiv.innerHTML = `<b>Erreur :</b> ${userMessage}<br><small>Assurez-vous que la table 'admin' existe avec les colonnes 'email' et 'password'.</small>`;
        errorDiv.style.display = 'block';
        submitBtn.textContent = 'Sign In';
        submitBtn.disabled = false;
    }
}

// Handle Logout
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('adminSession');
        window.location.href = 'index.html';
    });
}
