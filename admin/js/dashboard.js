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
    document.getElementById('global-search').addEventListener('input', handleSearch);

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
    const toggleAutoApprove = document.getElementById('toggle-auto-approve');
    const toggleNotifications = document.getElementById('toggle-notifications');

    // Load saved states
    toggleAutoApprove.checked = localStorage.getItem('autoApprove') === 'true';
    toggleNotifications.checked = localStorage.getItem('notifications') !== 'false';

    toggleAutoApprove.addEventListener('change', (e) => {
        localStorage.setItem('autoApprove', e.target.checked);
    });
    toggleNotifications.addEventListener('change', (e) => {
        localStorage.setItem('notifications', e.target.checked);
    });
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

    // Sidebar shortcut navigation
    const shortcuts = document.querySelectorAll('.shortcut-card, .shortcut-card-wide');
    shortcuts.forEach(card => {
        card.addEventListener('click', () => {
            const target = card.dataset.target;
            if (target) {
                switchSection(target, tabItems, sections);
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
let monthlyChartInstance = null;

async function loadData() {
    try {
        // Load Students
        const { data: students, error: sErr } = await supabaseClient.from('etudiant').select('*');
        if (sErr) {
            console.error("Erreur Étudiants :", sErr);
        } else {
            mockStudents = students || [];
        }

        // Load Professors
        const { data: professors, error: pErr } = await supabaseClient.from('professeur').select('*');
        if (pErr) {
            console.error("Erreur Professeurs :", pErr);
        } else {
            mockProfessors = professors || [];
        }

        // Load Organizers
        const { data: organizers, error: oErr } = await supabaseClient.from('organisateur').select('*');
        if (oErr) {
            console.error("Erreur Organisateurs :", oErr);
        } else {
            mockOrganizers = organizers || [];
        }

        // Load Events
        const { data: events, error: eErr } = await supabaseClient.from('evenement').select('*');
        if (eErr) {
            console.error("Erreur Événements :", eErr);
        } else {
            mockEvents = events || [];
        }

    } catch (e) {
        console.error("Erreur de chargement :", e);
    }

    // Render everything
    renderStudents();
    renderProfessors();
    renderOrganizers();
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

    // User statistics
    animateCounter('stats-students', totalStudents);
    animateCounter('stats-professors', totalProfessors);
    animateCounter('stats-organizers', totalOrganizers);
    animateCounter('stats-events', totalEvents);

    // User stat bars
    setTimeout(() => {
        const maxStat = Math.max(totalStudents, totalProfessors, totalOrganizers, totalEvents, 1);
        document.getElementById('stat-bar-students').style.width = (totalStudents / maxStat * 100) + '%';
        document.getElementById('stat-bar-professors').style.width = (totalProfessors / maxStat * 100) + '%';
        document.getElementById('stat-bar-organizers').style.width = (totalOrganizers / maxStat * 100) + '%';
        document.getElementById('stat-bar-events').style.width = (totalEvents / maxStat * 100) + '%';
    }, 400);

    // Render chart
    renderMonthlyChart();

    // Render recent events
    renderRecentEvents();

    // Update shortcut timestamps
    const now2 = new Date();
    const timeStr = `${now2.getHours().toString().padStart(2, '0')}:${now2.getMinutes().toString().padStart(2, '0')}`;
    document.getElementById('shortcut-alerts').textContent = `UPD ${timeStr}`;
    document.getElementById('shortcut-events').textContent = `${totalEvents} total`;
    document.getElementById('shortcut-users').textContent = `${totalUsers} total`;
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

async function deleteStudent(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet étudiant ?')) {
        const { error } = await supabaseClient.from('etudiant').delete().eq('id', id);
        if (error) {
            console.error("Erreur de suppression :", error);
            alert("Erreur lors de la suppression : " + error.message);
            return;
        }
        await loadData();
    }
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

async function deleteProfessor(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce professeur ?')) {
        const { error } = await supabaseClient.from('professeur').delete().eq('id', id);
        if (error) {
            console.error("Erreur de suppression :", error);
            alert("Erreur lors de la suppression : " + error.message);
            return;
        }
        await loadData();
    }
}

// ==========================================
// ORGANIZERS CRUD
// ==========================================
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
                    <i class="ph ph-trash"></i> Supprimer
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
    if (confirm('Êtes-vous sûr de vouloir supprimer cet organisateur ?')) {
        const { error } = await supabaseClient.from('organisateur').delete().eq('id', id);
        if (error) {
            console.error("Erreur de suppression :", error);
            alert("Erreur lors de la suppression : " + error.message);
            return;
        }
        await loadData();
    }
}
