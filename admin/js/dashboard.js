// Dashboard Functionality

document.addEventListener('DOMContentLoaded', () => {
    // Sidebar Navigation
    setupNavigation();

    // Theme Toggle Logic
    initTheme();

    // Initial Data Load (Mock data if Supabase isn't connected)
    loadData();

    // Form Submissions
    document.getElementById('student-form').addEventListener('submit', handleStudentSubmit);
    document.getElementById('professor-form').addEventListener('submit', handleProfessorSubmit);
    document.getElementById('organizer-form').addEventListener('submit', handleOrganizerSubmit);

    // Global Search Logic
    document.getElementById('global-search').addEventListener('input', handleSearch);
});

// Theme Logic
function initTheme() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    const currentTheme = localStorage.getItem('theme') || 'light';

    document.body.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    themeBtn.addEventListener('click', () => {
        const newTheme = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#theme-toggle-btn i');
    if (theme === 'dark') {
        icon.className = 'ph ph-sun';
    } else {
        icon.className = 'ph ph-moon';
    }
}

// Global Search
function handleSearch(e) {
    const term = e.target.value.toLowerCase();
    const activeSection = document.querySelector('.content-section[style*="block"]') || document.querySelector('#section-overview.active');

    if (!activeSection) return;

    if (activeSection.id === 'section-overview') {
        // In overview, we could filter stats or just clear the search
        return;
    }

    const rows = activeSection.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
}

// Setup sidebar navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove active class from all
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(sec => sec.style.display = 'none');

            // Add active class to clicked
            item.classList.add('active');

            // Show corresponding section
            const targetId = `section-${item.dataset.target}`;
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
                document.getElementById('page-title').textContent = item.textContent.trim();
            }
        });
    });
}

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'flex';
    // Small delay to allow display flex to apply before opacity transition
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);

    // Clear forms when opening for new entry
    if (modalId === 'studentModal') document.getElementById('student-form').reset();
    if (modalId === 'professorModal') document.getElementById('professor-form').reset();
    if (modalId === 'organizerModal') document.getElementById('organizer-form').reset();
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 200); // match transition time
}

// Close modal when clicking outside content
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
    }
}

// ==========================================
// DATA HANDLING (CRUD)
// ==========================================

let mockStudents = [];
let mockProfessors = [];
let mockOrganizers = [];

async function loadData() {
    try {
        // Chargement des Étudiants depuis la table 'etudiant'
        const { data: students, error: sErr } = await supabaseClient.from('etudiant').select('*');
        if (sErr) {
            console.error("Erreur Étudiants :", sErr);
            alert("Erreur de lecture de la table 'etudiant'. Avez-vous désactivé le RLS ?");
        } else {
            mockStudents = students || [];
        }

        // Chargement des Professeurs depuis la table 'professeur'
        const { data: professors, error: pErr } = await supabaseClient.from('professeur').select('*');
        if (pErr) {
            console.error("Erreur Professeurs :", pErr);
            alert("Erreur de lecture de la table 'professeur'. Avez-vous désactivé le RLS ?");
        } else {
            mockProfessors = professors || [];
        }

        // Chargement des Organisateurs depuis la table 'organisateur'
        const { data: organizers, error: oErr } = await supabaseClient.from('organisateur').select('*');
        if (oErr) {
            console.error("Erreur Organisateurs :", oErr);
            alert("Erreur de lecture de la table 'organisateur'. Avez-vous désactivé le RLS ?");
        } else {
            mockOrganizers = organizers || [];
        }
    } catch (e) {
        console.error("Erreur de chargement :", e);
    }

    renderStudents();
    renderProfessors();
    renderOrganizers();
    updateStats();
}

function updateStats() {
    document.getElementById('stats-students').textContent = mockStudents.length;
    document.getElementById('stats-professors').textContent = mockProfessors.length;
    const statsOrganizers = document.getElementById('stats-organizers');
    if (statsOrganizers) statsOrganizers.textContent = mockOrganizers.length;
}

// --- Students CRUD ---

function renderStudents() {
    const tbody = document.querySelector('#students-table tbody');
    tbody.innerHTML = '';

    mockStudents.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.nom}</td>
            <td>${item.email}</td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-danger" onclick="deleteStudent('${item.id}')">
                    <i class="ph ph-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function handleStudentSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('student-id-input').value;
    const nom = document.getElementById('student-nom').value;
    const email = document.getElementById('student-email').value;
    const passwordRaw = document.getElementById('student-pass').value;
    const password = CryptoJS.SHA256(passwordRaw).toString();

    const newStudent = {
        id, nom, email, password
    };

    // Real connection to 'etudiant'
    const { error } = await supabaseClient.from('etudiant').insert([newStudent]);

    if (error) {
        console.error("Erreur d'insertion :", error);
        alert("Erreur lors de l'ajout de l'étudiant : " + error.message);
        return;
    }

    // Refresh data after insert
    await loadData();
    closeModal('studentModal');
}

async function deleteStudent(id) {
    if (confirm('Are you sure you want to delete this student?')) {
        console.log("Tentative de suppression de l'étudiant ID:", id);
        const { data, error, status } = await supabaseClient
            .from('etudiant')
            .delete()
            .eq('id', id);

        console.log("Statut Supabase :", status);

        if (error) {
            console.error("Erreur de suppression :", error);
            alert("Erreur lors de la suppression : " + error.message);
            return;
        }

        console.log("Suppression réussie !");
        await loadData();
    }
}

// --- Professors CRUD ---

function renderProfessors() {
    const tbody = document.querySelector('#professors-table tbody');
    tbody.innerHTML = '';

    mockProfessors.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.nom}</td>
            <td>${item.codeaffilier}</td>
            <td>${item.email}</td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-danger" onclick="deleteProfessor('${item.id}')">
                    <i class="ph ph-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function handleProfessorSubmit(e) {
    e.preventDefault();

    const nom = document.getElementById('professor-nom').value;
    const codeaffilier = document.getElementById('professor-code').value;
    const email = document.getElementById('professor-email').value;
    const passwordRaw = document.getElementById('professor-pass').value;
    const password = CryptoJS.SHA256(passwordRaw).toString();

    const newProf = { nom, codeaffilier, email, password };

    // Real connection to 'professeur'
    const { error } = await supabaseClient.from('professeur').insert([newProf]);

    if (error) {
        console.error("Erreur d'insertion :", error);
        alert("Erreur lors de l'ajout du professeur : " + error.message);
        return;
    }

    await loadData();
    closeModal('professorModal');
}

async function deleteProfessor(id) {
    if (confirm('Are you sure you want to delete this professor?')) {
        console.log("Tentative de suppression du professeur ID:", id);
        const { data, error, status } = await supabaseClient
            .from('professeur')
            .delete()
            .eq('id', id);

        console.log("Statut Supabase :", status);

        if (error) {
            console.error("Erreur de suppression :", error);
            alert("Erreur lors de la suppression : " + error.message);
            return;
        }

        console.log("Suppression réussie !");
        await loadData();
    }
}

// --- Organizers CRUD ---

function renderOrganizers() {
    const tbody = document.querySelector('#organizers-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    mockOrganizers.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.nom}</td>
            <td>${item.email}</td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-danger" onclick="deleteOrganizer('${item.id}')">
                    <i class="ph ph-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function handleOrganizerSubmit(e) {
    e.preventDefault();

    const nom = document.getElementById('organizer-nom').value;
    const email = document.getElementById('organizer-email').value;
    const passwordRaw = document.getElementById('organizer-pass').value;
    const password = CryptoJS.SHA256(passwordRaw).toString();

    const newOrg = { nom, email, password };

    // Real connection to 'organisateur'
    const { error } = await supabaseClient.from('organisateur').insert([newOrg]);

    if (error) {
        console.error("Erreur d'insertion :", error);
        alert("Erreur lors de l'ajout de l'organisateur : " + error.message);
        return;
    }

    await loadData();
    closeModal('organizerModal');
}

async function deleteOrganizer(id) {
    if (confirm('Are you sure you want to delete this organizer?')) {
        console.log("Tentative de suppression de l'organisateur ID:", id);
        const { data, error, status } = await supabaseClient
            .from('organisateur')
            .delete()
            .eq('id', id);

        console.log("Statut Supabase :", status);

        if (error) {
            console.error("Erreur de suppression :", error);
            alert("Erreur lors de la suppression : " + error.message);
            return;
        }

        console.log("Suppression réussie !");
        await loadData();
    }
}
