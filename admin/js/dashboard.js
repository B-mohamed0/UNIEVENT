// ==========================================
// DASHBOARD - Dynamic Functionality
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Setup Navigation (tabs + sidebar shortcuts)
    setupNavigation();

    // Theme Toggle
    initTheme();

    // Load all data from Supabase
    loadData();

    // Toggle switches persist state
    initToggles();

    // Form Submissions
    document.getElementById('student-form').addEventListener('submit', handleStudentSubmit);
    document.getElementById('professor-form').addEventListener('submit', handleProfessorSubmit);
    document.getElementById('organizer-form').addEventListener('submit', handleOrganizerSubmit);

    // Global Search
    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
        globalSearch.addEventListener('input', handleSearch);
    }

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('open');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
                if (!sidebar.contains(e.target) && e.target !== mobileMenuBtn && !mobileMenuBtn.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }

    // Update current date in hero card
    updateHeroDate();
});

// ==========================================
// THEME
// ==========================================
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
        // Re-render chart with updated colors
        if (monthlyChartInstance) {
            renderMonthlyChart();
        }
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#theme-toggle-btn i');
    icon.className = theme === 'dark' ? 'ph ph-sun' : 'ph ph-moon';
}

// ==========================================
// HERO DATE
// ==========================================
function updateHeroDate() {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const now = new Date();
    document.getElementById('hero-date').textContent = `${months[now.getMonth()]} ${now.getFullYear()}`;
}

// ==========================================
// TOGGLE SWITCHES
// ==========================================
function initToggles() {
    const toggleNotifications = document.getElementById('toggle-notifications');

    // Load saved states
    if (toggleNotifications) {
        toggleNotifications.checked = localStorage.getItem('notifications') !== 'false';
        toggleNotifications.addEventListener('change', (e) => {
            localStorage.setItem('notifications', e.target.checked);
        });
    }
}

// ==========================================
// NAVIGATION
// ==========================================
function setupNavigation() {
    // Tab navigation
    const tabItems = document.querySelectorAll('.tab-item');
    const sections = document.querySelectorAll('.content-section');

    tabItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.dataset.target;
            switchSection(target, tabItems, sections);
        });
    });

    const searchProfInput = document.getElementById('search-professor');
    if (searchProfInput) {
        searchProfInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = mockProfessors.filter(p => 
                (p.nom && p.nom.toLowerCase().includes(term))
            );
            renderProfessors(filtered);
        });
    }

    const searchOrgInput = document.getElementById('search-organizer');
    if (searchOrgInput) {
        searchOrgInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = mockOrganizers.filter(o => 
                (o.nom && o.nom.toLowerCase().includes(term)) ||
                (o.email && o.email.toLowerCase().includes(term))
            );
            renderOrganizersTable(filtered);
        });
    }
    // Sidebar shortcut navigation
    const shortcuts = document.querySelectorAll('.shortcut-card, .shortcut-card-wide');
    shortcuts.forEach(card => {
        card.addEventListener('click', () => {
            const target = card.dataset.target;
            if (target) {
                switchSection(target, tabItems, sections);
                
                // Auto close sidebar on mobile when a link is clicked
                const sidebar = document.querySelector('.sidebar');
                if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
            }
        });
    });
}

function switchSection(target, tabItems, sections) {
    // Update tabs
    tabItems.forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`.tab-item[data-target="${target}"]`);
    if (activeTab) activeTab.classList.add('active');

    // Update sections
    sections.forEach(sec => {
        sec.style.display = 'none';
        sec.classList.remove('active');
    });

    const targetSection = document.getElementById(`section-${target}`);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active');
    }
}

// ==========================================
// SEARCH
// ==========================================
function handleSearch(e) {
    const term = e.target.value.toLowerCase();
    const activeSection = document.querySelector('.content-section[style*="block"]') ||
        document.querySelector('#section-overview.active');

    if (!activeSection || activeSection.id === 'section-overview') return;

    const rows = activeSection.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
}

// ==========================================
// MODALS
// ==========================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);

    if (modalId === 'studentModal') document.getElementById('student-form').reset();
    if (modalId === 'professorModal') document.getElementById('professor-form').reset();
    if (modalId === 'organizerModal') document.getElementById('organizer-form').reset();
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; }, 250);
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
    }
}

// ==========================================
// DATA HANDLING
// ==========================================
let mockStudents = [];
let mockProfessors = [];
let mockOrganizers = [];
let mockEvents = [];
let mockParticipations = [];
let monthlyChartInstance = null;

async function loadData() {
    try {
        console.log("🔄 Chargement des données depuis Supabase...");
        
        // Vérifier si Supabase est disponible
        if (!supabaseClient) {
            console.error("❌ Supabase client non initialisé, utilisation des données de test");
            loadTestData();
            return;
        }
        
        // Load Students
        const { data: students, error: sErr } = await supabaseClient.from('etudiant').select('*');
        if (sErr) {
            console.error("Erreur Étudiants :", sErr);
            loadTestData();
            return;
        } else {
            mockStudents = students || [];
            console.log(`✅ ${mockStudents.length} étudiants chargés`);
        }

        // Load Professors
        const { data: professors, error: pErr } = await supabaseClient.from('professeur').select('*');
        if (pErr) {
            console.error("Erreur Professeurs :", pErr);
            loadTestData();
            return;
        } else {
            mockProfessors = professors || [];
            console.log(`✅ ${mockProfessors.length} professeurs chargés`);
        }

        // Load Organizers
        const { data: organizers, error: oErr } = await supabaseClient.from('organisateur').select('*');
        if (oErr) {
            console.error("Erreur Organisateurs :", oErr);
            loadTestData();
            return;
        } else {
            mockOrganizers = organizers || [];
            console.log(`✅ ${mockOrganizers.length} organisateurs chargés`);
        }

        // Load Participations (we need status to compute presences/absences)
        const { data: participations, error: partErr } = await supabaseClient
            .from('participation')
            .select('idevenement,status');
        if (partErr) {
            console.error("Erreur Participations :", partErr);
            loadTestData();
            return;
        } else {
            mockParticipations = participations || [];
            console.log(`✅ ${mockParticipations.length} participations chargées`);
        }

        // Load Events
        const { data: events, error: eErr } = await supabaseClient.from('evenement').select('*');
        if (eErr) {
            console.error("Erreur Événements :", eErr);
            loadTestData();
            return;
        } else {
            mockEvents = events || [];
            console.log(`✅ ${mockEvents.length} événements chargés`);
        }

    } catch (e) {
        console.error("Erreur de chargement :", e);
        loadTestData();
        return;
    }

    // Render everything
    console.log("🎨 Rendu des composants...");
    renderStudents();
    renderProfessors();
    renderOrganizersTable();
    applyEventsFilter();
    updateOverviewDynamic();
}

// Fonction de test avec des données factices
function loadTestData() {
    console.log("🧪 Chargement des données de test...");
    
    mockOrganizers = [
        { id: '1', nom: 'Mohammed Ali', email: 'mohammed@estc.edu', telephone: '0612345678' },
        { id: '2', nom: 'Fatima Zahra', email: 'fatima@estc.edu', telephone: '0623456789' },
        { id: '3', nom: 'Youssef Amrani', email: 'youssef@estc.edu', telephone: '0634567890' }
    ];
    
    mockEvents = [
        { id: '1', nom_evenement: 'Conférence IA', idorganisateur: '1', date: '2024-03-15', lieu: 'Amphi A' },
        { id: '2', nom_evenement: 'Workshop React', idorganisateur: '1', date: '2024-03-20', lieu: 'Salle B12' },
        { id: '3', nom_evenement: 'Hackathon 2024', idorganisateur: '2', date: '2024-03-25', lieu: 'Lab Tech' },
        { id: '4', nom_evenement: 'Séminaire Cloud', idorganisateur: '3', date: '2024-03-30', lieu: 'Amphi C' }
    ];
    
    mockParticipations = [
        { idevenement: '1', status: 'present' },
        { idevenement: '1', status: 'present' },
        { idevenement: '1', status: 'absent' },
        { idevenement: '2', status: 'present' },
        { idevenement: '2', status: 'present' },
        { idevenement: '2', status: 'present' },
        { idevenement: '3', status: 'present' },
        { idevenement: '3', status: 'absent' },
        { idevenement: '4', status: 'present' }
    ];
    
    mockStudents = [
        { id: '1', nom: 'Etudiant 1', email: 'etudiant1@estc.edu' },
        { id: '2', nom: 'Etudiant 2', email: 'etudiant2@estc.edu' }
    ];
    
    mockProfessors = [
        { id: '1', nom: 'Professeur 1', email: 'prof1@estc.edu', codeaffilier: 'PROF001' }
    ];
    
    console.log("✅ Données de test chargées");
    
    // Render everything
    console.log("🎨 Rendu des composants avec données de test...");
    renderStudents();
    renderProfessors();
    renderOrganizersTable();
    applyEventsFilter();
    updateOverviewDynamic();
}

// ==========================================
// ANIMATED COUNTER
// ==========================================
function animateCounter(elementId, targetValue, duration = 1200) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const startValue = parseInt(el.textContent) || 0;
    const diff = targetValue - startValue;
    const startTime = performance.now();

    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentVal = Math.round(startValue + diff * eased);
        el.textContent = currentVal;

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            el.textContent = targetValue;
            el.classList.add('count-animated');
            setTimeout(() => el.classList.remove('count-animated'), 300);
        }
    }

    requestAnimationFrame(step);
}

// ==========================================
// OVERVIEW DYNAMIC UPDATE
// ==========================================
function updateOverviewDynamic() {
    const totalStudents = mockStudents.length;
    const totalProfessors = mockProfessors.length;
    const totalOrganizers = mockOrganizers.length;
    const totalEvents = mockEvents.length;

    const now = new Date();
    const activeEvents = mockEvents.filter(e => {
        if (e.status === 'ACTIF' || e.status === 'actif') return true;
        if (e.date) {
            const eventDate = new Date(e.date);
            return eventDate >= now;
        }
        return false;
    }).length;

    const totalUsers = totalStudents + totalProfessors + totalOrganizers;
    const maxUsers = Math.max(totalUsers, 100);
    const maxEvents = Math.max(totalEvents, 50);

    // Animate hero stats
    animateCounter('hero-total-events', totalEvents);
    animateCounter('hero-active-events', activeEvents);
    animateCounter('hero-total-participants', totalUsers);

    // Hero progress bar (events capacity utilization)
    const fillPct = totalEvents > 0 ? Math.min((activeEvents / totalEvents) * 100, 100) : 0;
    setTimeout(() => {
        document.getElementById('hero-fill').style.width = fillPct + '%';
    }, 300);

    // Hero badge
    const badge = document.getElementById('hero-badge');
    if (totalEvents > 0) {
        badge.textContent = `+${activeEvents} actifs`;
    }

    // Participation bars (simulated from events data)
    const totalParticipations = totalStudents; // Use student count as proxy
    const presentsRate = totalParticipations > 0 ? Math.round((activeEvents / Math.max(totalEvents, 1)) * 100) : 0;
    const inscritsRate = totalParticipations > 0 ? Math.min(Math.round((totalStudents / maxUsers) * 100), 100) : 0;
    const absentsRate = Math.max(0, 100 - presentsRate - Math.round(inscritsRate * 0.3));

    setTimeout(() => {
        updateBar('bar-presents', 'bar-presents-pct', presentsRate);
        updateBar('bar-inscrits', 'bar-inscrits-pct', inscritsRate);
        updateBar('bar-absents', 'bar-absents-pct', Math.min(absentsRate, 100));
    }, 500);

    // Circular gauges
    setTimeout(() => {
        updateGauge('gauge-attendance', 'gauge-attendance-val', presentsRate);
        updateGauge('gauge-active', 'gauge-active-val', activeEvents, false);
        updateGauge('gauge-satisfaction', 'gauge-satisfaction-val', Math.min(inscritsRate + 15, 100));
    }, 700);

    // Organizer List stats
    renderOrganizerStats();

    // Render chart
    renderMonthlyChart();

    // Render recent events
    renderRecentEvents();

    // Update shortcut timestamps
    const now2 = new Date();
    const timeStr = `${now2.getHours().toString().padStart(2, '0')}:${now2.getMinutes().toString().padStart(2, '0')}`;
    const tagAlerts = document.getElementById('shortcut-alerts');
    if (tagAlerts) tagAlerts.textContent = `UPD ${timeStr}`;
    const tagOrgs = document.getElementById('shortcut-orgs');
    if (tagOrgs) tagOrgs.textContent = `${totalOrganizers} total`;
}

function updateBar(fillId, labelId, pct) {
    const fill = document.getElementById(fillId);
    const label = document.getElementById(labelId);
    if (fill) fill.style.width = pct + '%';
    if (label) label.textContent = pct + '%';
}

function updateGauge(ringId, valueId, value, isPercent = true) {
    const ring = document.getElementById(ringId);
    const valueEl = document.getElementById(valueId);
    if (!ring || !valueEl) return;

    const fillCircle = ring.querySelector('.gauge-fill');
    const circumference = 2 * Math.PI * 40; // r=40

    let pct = isPercent ? value : Math.min((value / Math.max(mockEvents.length, 10)) * 100, 100);
    const offset = circumference - (pct / 100) * circumference;

    fillCircle.style.strokeDashoffset = offset;

    // Animate the value
    animateCounter(valueId, Math.round(value), 1500);
}

// ==========================================
// CHART.JS MONTHLY CHART
// ==========================================
function renderMonthlyChart() {
    const canvas = document.getElementById('monthlyChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const isDark = document.body.getAttribute('data-theme') === 'dark';

    // Group events by month
    const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthlyEvents = new Array(12).fill(0);
    const monthlyActive = new Array(12).fill(0);

    mockEvents.forEach(event => {
        if (event.date) {
            const date = new Date(event.date);
            const month = date.getMonth();
            monthlyEvents[month]++;
            if (event.status === 'ACTIF' || event.status === 'actif') {
                monthlyActive[month]++;
            }
        }
    });

    // Destroy previous chart
    if (monthlyChartInstance) {
        monthlyChartInstance.destroy();
    }

    monthlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [
                {
                    label: 'Inscrits',
                    data: monthlyEvents,
                    backgroundColor: isDark ? 'rgba(46, 196, 182, 0.6)' : 'rgba(46, 196, 182, 0.7)',
                    borderColor: '#2ec4b6',
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false,
                },
                {
                    label: 'Présents',
                    data: monthlyActive,
                    backgroundColor: isDark ? 'rgba(231, 76, 94, 0.6)' : 'rgba(231, 76, 94, 0.7)',
                    borderColor: '#e74c5e',
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? '#1e2028' : '#fff',
                    titleColor: isDark ? '#f5f5f7' : '#2c2c2e',
                    bodyColor: isDark ? '#8e8e93' : '#8e8e93',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    borderWidth: 1,
                    cornerRadius: 10,
                    padding: 10,
                    displayColors: true,
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                    },
                    ticks: {
                        color: isDark ? '#8e8e93' : '#8e8e93',
                        font: { size: 11, family: "'Inter', sans-serif" }
                    },
                    border: { display: false }
                },
                y: {
                    grid: {
                        color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                    },
                    ticks: {
                        color: isDark ? '#8e8e93' : '#8e8e93',
                        font: { size: 11, family: "'Inter', sans-serif" },
                        stepSize: 1
                    },
                    border: { display: false },
                    beginAtZero: true
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });
}

// ==========================================
// RECENT EVENTS
// ==========================================
function renderRecentEvents() {
    const container = document.getElementById('recent-events-list');
    if (!container) return;

    // Sort by date descending, take 6 most recent
    const recentEvents = [...mockEvents]
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 6);

    if (recentEvents.length === 0) {
        container.innerHTML = `
            <div class="event-card" style="justify-content: center; color: var(--text-muted);">
                <i class="ph ph-calendar-x" style="font-size: 1.5rem; margin-right: 0.5rem;"></i>
                Aucun événement trouvé
            </div>`;
        return;
    }

    const iconColors = [
        { bg: 'rgba(231, 76, 94, 0.12)', color: '#e74c5e' },
        { bg: 'rgba(46, 196, 182, 0.12)', color: '#2ec4b6' },
        { bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' },
        { bg: 'rgba(244, 162, 97, 0.12)', color: '#f4a261' },
        { bg: 'rgba(23, 195, 230, 0.12)', color: '#17c3e6' },
        { bg: 'rgba(52, 199, 89, 0.12)', color: '#34c759' },
    ];

    container.innerHTML = recentEvents.map((event, i) => {
        const color = iconColors[i % iconColors.length];
        const date = event.date ? new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'N/A';

        let statusClass = 'badge-upcoming';
        let statusText = 'À venir';

        if (event.status === 'ACTIF' || event.status === 'actif') {
            statusClass = 'badge-active';
            statusText = 'Actif';
        } else if (event.status === 'TERMINE' || event.status === 'termine') {
            statusClass = 'badge-completed';
            statusText = 'Terminé';
        } else {
            const eventDate = new Date(event.date);
            if (eventDate < new Date()) {
                statusClass = 'badge-completed';
                statusText = 'Passé';
            }
        }

        return `
            <div class="event-card">
                <div class="event-card-icon" style="background: ${color.bg}; color: ${color.color};">
                    <i class="ph-fill ph-calendar-star"></i>
                </div>
                <div class="event-card-info">
                    <span class="event-card-title">${event.nom_evenement || event.nom || 'Sans titre'}</span>
                    <span class="event-card-meta">${date} • ${event.lieu || 'Lieu non défini'}</span>
                </div>
                <span class="event-card-badge ${statusClass}">${statusText}</span>
            </div>
        `;
    }).join('');
}

// ==========================================
// STUDENTS CRUD
// ==========================================
function renderStudents() {
    const tbody = document.querySelector('#students-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    mockStudents.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.nom}</td>
            <td>${item.email}</td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-danger" onclick="deleteStudent('${item.id}')">
                    <i class="ph ph-trash"></i> Supprimer
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

    const newStudent = { id, nom, email, password };

    const { error } = await supabaseClient.from('etudiant').insert([newStudent]);

    if (error) {
        console.error("Erreur d'insertion :", error);
        alert("Erreur lors de l'ajout de l'étudiant : " + error.message);
        return;
    }

    await loadData();
    closeModal('studentModal');
}

function deleteStudent(id) {
    confirmDeletion(id, 'etudiant');
}

// ==========================================
// PROFESSORS CRUD
// ==========================================
function renderProfessors() {
    const tbody = document.querySelector('#professors-table tbody');
    if (!tbody) return;
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
                    <i class="ph ph-trash"></i> Supprimer
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

    const { error } = await supabaseClient.from('professeur').insert([newProf]);

    if (error) {
        console.error("Erreur d'insertion :", error);
        alert("Erreur lors de l'ajout du professeur : " + error.message);
        return;
    }

    await loadData();
    closeModal('professorModal');
}

function deleteProfessor(id) {
    confirmDeletion(id, 'professeur');
}

// ==========================================
// ORGANIZERS LISTING & PREVIEW
// ==========================================
function renderOrganizersTable(data = mockOrganizers) {
    console.log("📋 Rendu du tableau des organisateurs...", data.length, "organisateurs");
    
    const tbody = document.querySelector('#organizers-table tbody');
    if (!tbody) {
        console.error("❌ Tableau des organisateurs non trouvé");
        return;
    }
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Aucun organisateur trouvé</td></tr>';
        console.log("⚠️ Aucun organisateur à afficher");
        return;
    }

    data.forEach(item => {
        const eventsCount = mockEvents.filter(e => e.idorganisateur === item.id).length;
        console.log(`👤 Organisateur: ${item.nom}, ${eventsCount} événements`);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(item.nom || 'O')}&background=f4a261&color=fff" style="width: 32px; height: 32px; border-radius: 50%;">
                    <strong>${item.nom || 'Inconnu'}</strong>
                </div>
            </td>
            <td>${item.telephone || '-'}</td>
            <td>${item.email || '-'}</td>
            <td><span style="padding: 0.2rem 0.6rem; border-radius: 12px; background: rgba(59,130,246,0.1); color: var(--accent-blue); font-weight: 600;">${eventsCount} Événements</span></td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-danger" onclick="deleteOrganizer('${item.id}')" style="cursor: pointer; background: #ff3b30; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px;">
                    <i class="ph ph-trash"></i> Supprimer
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    console.log("✅ Tableau des organisateurs rendu avec succès");
}

// ==========================================
// EVENTS LISTING & FILTERING
// ==========================================
function applyEventsFilter() {
    const timeFilter = document.getElementById('filter-events-time') ? document.getElementById('filter-events-time').value : 'all';
    const statusFilter = document.getElementById('filter-events-status') ? document.getElementById('filter-events-status').value : 'all';

    const now = new Date();
    now.setHours(0,0,0,0);
    
    // Week boundaries
    const dayOfWeek = now.getDay() || 7; 
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek + 1);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23,59,59,999);

    // Month boundaries
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const filtered = mockEvents.filter(item => {
        if (!item.date) return false;
        const eventDate = new Date(item.date);
        
        // Time Filter (excluding precise hours for full day matching)
        const checkDate = new Date(eventDate);
        checkDate.setHours(12,0,0,0); // Midday to avoid timezone shifting

        let timeMatch = true;
        if (timeFilter === 'week') {
            timeMatch = checkDate >= weekStart && checkDate <= weekEnd;
        } else if (timeFilter === 'month') {
            timeMatch = checkDate >= monthStart && checkDate <= monthEnd;
        }
        
        // Status Filter
        let statusMatch = true;
        let internalStatus = 'upcoming'; 
        if (item.status === 'ACTIF' || item.status === 'actif' || item.status === 'MAINTENANT') {
            internalStatus = 'active';
        } else if (item.status === 'TERMINE' || item.status === 'termine' || item.status === 'EXPIRE' || checkDate < now) {
            internalStatus = 'completed';
        }

        if (statusFilter !== 'all') {
            statusMatch = (internalStatus === statusFilter);
        }

        return timeMatch && statusMatch;
    });

    renderEventsTable(filtered);
}

function renderEventsTable(eventsToRender = mockEvents) {
    const tbody = document.querySelector('#events-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (eventsToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Aucun événement trouvé</td></tr>';
        return;
    }

    const now = new Date();
    now.setHours(0,0,0,0);

    eventsToRender.forEach(item => {
        const org = mockOrganizers.find(o => o.id === item.idorganisateur);
        const orgName = org ? org.nom : 'Inconnu';
        
        const eventDate = new Date(item.date);
        const dateStr = item.date ? eventDate.toLocaleDateString('fr-FR') : 'N/A';
        
        // Formater les heures sans secondes
        let timeStr = 'N/A';
        if (item.heure_debut && item.heure_fin) {
            const debut = item.heure_debut.substring(0, 5); // HH:MM
            const fin = item.heure_fin.substring(0, 5);     // HH:MM
            timeStr = `${debut} - ${fin}`;
        } else if (item.heure_debut) {
            const debut = item.heure_debut.substring(0, 5);
            timeStr = debut;
        } else if (item.heure_fin) {
            const fin = item.heure_fin.substring(0, 5);
            timeStr = fin;
        }
        
        const checkDate = new Date(eventDate);
        checkDate.setHours(12,0,0,0);

        let statusText = "À venir";
        let statusColor = "#f59e0b"; // Orange

        if (item.status === 'ACTIF' || item.status === 'actif' || item.status === 'MAINTENANT') {
            statusText = "En cours";
            statusColor = "#10b981"; // Vert
        } else if (item.status === 'TERMINE' || item.status === 'termine' || item.status === 'EXPIRE' || checkDate < now) {
            statusText = "Terminé";
            statusColor = "#ef4444"; // Rouge
        }

        let statusBadge = `<span style="color: ${statusColor}; font-weight: 600; padding: 0.25rem 0.5rem; background-color: ${statusColor}15; border-radius: 6px;">${statusText}</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.nom_evenement || item.nom || 'Sans nom'}</strong></td>
            <td>${orgName}</td>
            <td>${item.lieu || 'N/A'}</td>
            <td>${dateStr}</td>
            <td>${timeStr}</td>
            <td>${statusBadge}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderOrganizerStats() {
    const container = document.getElementById('organizer-stats-list');
    if (!container) return;
    
    if (mockOrganizers.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">Aucun organisateur trouvé</div>';
        return;
    }

    const orgStats = mockOrganizers.map(org => {
        const orgEvents = mockEvents.filter(e => e.idorganisateur === org.id);
        const eventIds = orgEvents.map(e => e.id);
        
        const participants = mockParticipations.filter(p => eventIds.includes(p.idevenement));
        const totalParticipants = participants.length;
        
        return {
            ...org,
            eventsCount: orgEvents.length,
            participantsCount: totalParticipants
        };
    });

    orgStats.sort((a, b) => b.participantsCount - a.participantsCount);
    const maxParticipants = Math.max(...orgStats.map(o => o.participantsCount), 1);
    const colors = ['bg-blue', 'bg-teal', 'bg-coral', 'bg-amber'];

    container.innerHTML = orgStats.map((org, index) => {
        const barColor = colors[index % colors.length];
        const fillPct = (org.participantsCount / maxParticipants) * 100;

        return `
            <div class="user-stat-item">
                <div class="user-stat-icon icon-teal" style="opacity: ${Math.max(1 - (index * 0.15), 0.4)}"><i class="ph-fill ph-briefcase"></i></div>
                <div class="user-stat-info">
                    <span class="user-stat-name">${org.nom}</span>
                    <span class="user-stat-range">${org.eventsCount} événement(s) créé(s)</span>
                </div>
                <div class="user-stat-bar">
                    <div class="mini-bar-track">
                        <div class="mini-bar-fill ${barColor}" style="width: ${fillPct}%"></div>
                    </div>
                </div>
                <span class="user-stat-value">${org.participantsCount} <i class="ph-fill ph-users" style="font-size: 0.8rem; color: var(--text-muted);"></i></span>
            </div>
        `;
    }).join('');
}

async function handleOrganizerSubmit(e) {
    e.preventDefault();

    const nom = document.getElementById('organizer-nom').value;
    const email = document.getElementById('organizer-email').value;
    const passwordRaw = document.getElementById('organizer-pass').value;
    const password = CryptoJS.SHA256(passwordRaw).toString();

    const newOrg = { nom, email, password };

    const { error } = await supabaseClient.from('organisateur').insert([newOrg]);

    if (error) {
        console.error("Erreur d'insertion :", error);
        alert("Erreur lors de l'ajout de l'organisateur : " + error.message);
        return;
    }

    await loadData();
    closeModal('organizerModal');
}

function deleteOrganizer(id) {
    console.log("🗑️ Suppression de l'organisateur:", id);
    
    // Trouver l'organisateur pour afficher son nom dans la confirmation
    const org = mockOrganizers.find(o => o.id === id);
    const orgName = org ? org.nom : 'Cet organisateur';
    
    // Personnaliser le message de confirmation
    const modal = document.getElementById('deleteConfirmModal');
    const messageElement = modal.querySelector('p');
    if (messageElement) {
        messageElement.innerHTML = `Êtes-vous sûr de vouloir supprimer <strong>${orgName}</strong> ? Cette action est irréversible et supprimera également tous les événements associés.`;
    }
    
    confirmDeletion(id, 'organisateur');
}

// ==========================================
// CUSTOM DELETE CONFIRMATION
// ==========================================
function confirmDeletion(id, table) {
    console.log("🤔 Confirmation de suppression pour:", table, "ID:", id);
    openModal('deleteConfirmModal');
    
    // Get the confirm button and recreate it to remove old event listeners safely
    const oldConfirmBtn = document.getElementById('confirm-delete-btn');
    if (!oldConfirmBtn) return;
    const confirmBtn = oldConfirmBtn.cloneNode(true);
    oldConfirmBtn.parentNode.replaceChild(confirmBtn, oldConfirmBtn);
    
    confirmBtn.addEventListener('click', async () => {
        confirmBtn.innerText = 'Patientez...';
        confirmBtn.disabled = true;

        try {
            let error = null;
            
            // Vérifier si on utilise les données de test ou Supabase
            if (supabaseClient && mockOrganizers.length > 0 && mockOrganizers[0].id !== '1') {
                // Utiliser Supabase
                console.log("🗄️ Suppression via Supabase...");
                const { error: deleteError } = await supabaseClient.from(table).delete().eq('id', id);
                error = deleteError;
            } else {
                // Utiliser les données de test
                console.log("🧪 Suppression dans les données de test...");
                
                if (table === 'organisateur') {
                    // Supprimer l'organisateur
                    const orgIndex = mockOrganizers.findIndex(o => o.id === id);
                    if (orgIndex !== -1) {
                        const deletedOrg = mockOrganizers.splice(orgIndex, 1)[0];
                        console.log("✅ Organisateur supprimé:", deletedOrg.nom);
                        
                        // Supprimer également les événements associés
                        const eventsToDelete = mockEvents.filter(e => e.idorganisateur === id);
                        mockEvents = mockEvents.filter(e => e.idorganisateur !== id);
                        console.log(`✅ ${eventsToDelete.length} événements associés supprimés`);
                        
                        // Supprimer les participations associées
                        const deletedEventIds = eventsToDelete.map(e => e.id);
                        const participationsToDelete = mockParticipations.filter(p => deletedEventIds.includes(p.idevenement));
                        mockParticipations = mockParticipations.filter(p => !deletedEventIds.includes(p.idevenement));
                        console.log(`✅ ${participationsToDelete.length} participations associées supprimées`);
                    }
                } else {
                    // Pour les autres tables, simuler la suppression
                    const arrayName = table === 'etudiant' ? 'mockStudents' : 
                                    table === 'professeur' ? 'mockProfessors' : 'mockOrganizers';
                    const array = window[arrayName];
                    const index = array.findIndex(item => item.id === id);
                    if (index !== -1) {
                        array.splice(index, 1);
                    }
                }
            }
            
            if (error) {
                console.error("Erreur de suppression :", error);
                alert("Erreur lors de la suppression : " + error.message);
            } else {
                console.log("✅ Suppression réussie");
                // Recharger les données pour mettre à jour l'interface
                await loadData();
            }
            
        } catch (err) {
            console.error("Erreur inattendue lors de la suppression :", err);
            alert("Erreur inattendue lors de la suppression");
        }
        
        closeModal('deleteConfirmModal');
        confirmBtn.innerText = 'Supprimer';
        confirmBtn.disabled = false;
    });
}
