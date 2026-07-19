// ============ DATA CONSTANTS ============
const MOODS = [
    { emoji: "😊", name: "Bahagia", val: 5, color: "#a8c96a" },
    { emoji: "😌", name: "Tenang", val: 4, color: "#a8c5a0" },
    { emoji: "🥰", name: "Bersyukur", val: 5, color: "#f0b090" },
    { emoji: "😐", name: "Biasa", val: 3, color: "#c0b898" },
    { emoji: "🤔", name: "Melamun", val: 3, color: "#a0b8c8" },
    { emoji: "😰", name: "Cemas", val: 2, color: "#d0a070" },
    { emoji: "😢", name: "Sedih", val: 2, color: "#90a8c0" },
    { emoji: "😤", name: "Marah", val: 1, color: "#c08080" },
    { emoji: "😴", name: "Lelah", val: 2, color: "#b0a8c0" },
    { emoji: "🤩", name: "Semangat", val: 5, color: "#f0c848" },
    { emoji: "😓", name: "Stres", val: 1, color: "#c09878" },
    { emoji: "🫠", name: "Meleleh", val: 2, color: "#b0c098" }
];

const TRIGGERS = ["☀️ Cuaca", "💤 Kurang Tidur", "🍔 Makanan", "👥 Sosial", "💼 Kerja", "❤️ Kesehatan", "📱 Gadget", "🧘 Olahraga", "💸 Keuangan", "💞 Hubungan", "🎵 Musik", "🌿 Alam"];
const ENERGIES = ["🔋 Sangat Berenergi", "⚡ Cukup Berenergi", "😐 Biasa Saja", "🥱 Sedikit Lelah", "😪 Sangat Lelah"];
const DONUT_COLORS = ["#d4825a", "#a8c5a0", "#7ba7bc", "#f0c848", "#c08080", "#b0a8c0", "#d0a070", "#a0b8c8", "#90a8c0", "#f0b090", "#a8c96a", "#c09878"];

let entries = [];
let currentUser = null;

// ============ API BASE ============
const API_BASE = '/hiddenfeel/backend';

// Fetch dengan credentials untuk session
async function apiFetch(url, options = {}) {
    const defaultOptions = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        }
    };
    const response = await fetch(url, { ...defaultOptions, ...options });
    return response.json();
}

// ============ HELPER FUNCTIONS ============
function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

function dateLabel(str) {
    const d = new Date(str + "T12:00:00");
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function showToast(msg) {
    let toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.className = "toast";
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2200);
}

function calcStreak(entriesData) {
    if (!entriesData.length) return 0;
    const dates = new Set(entriesData.map(e => e.date));
    let streak = 0;
    const d = new Date();
    while (dates.has(d.toISOString().slice(0, 10))) {
        streak++;
        d.setDate(d.getDate() - 1);
    }
    return streak;
}

function getTopTrigger(entriesData) {
    const freq = {};
    entriesData.forEach(e => e.triggers?.forEach(t => { freq[t] = (freq[t] || 0) + 1; }));
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || "pekerjaan";
}

function getAvgMood(entriesData) {
    if (!entriesData.length) return "3";
    return (entriesData.reduce((a, e) => a + e.moodVal, 0) / entriesData.length).toFixed(1);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ============ API CALLS ============
async function fetchEntries() {
    try {
        const data = await apiFetch(`${API_BASE}/entries`);
        return data.success ? data.data : [];
    } catch (error) {
        console.error('Fetch entries error:', error);
        return [];
    }
}

async function saveEntry(entry) {
    try {
        const data = await apiFetch(`${API_BASE}/entries`, {
            method: 'POST',
            body: JSON.stringify(entry)
        });
        return data.success;
    } catch (error) {
        console.error('Save entry error:', error);
        return false;
    }
}

async function deleteEntryFromAPI(date) {
    try {
        const data = await apiFetch(`${API_BASE}/entries/${date}`, {
            method: 'DELETE'
        });
        return data.success;
    } catch (error) {
        console.error('Delete entry error:', error);
        return false;
    }
}

// ============ AUTH FUNCTIONS ============
async function checkAuth() {
    try {
        const data = await apiFetch(`${API_BASE}/auth`, {
            method: 'POST',
            body: JSON.stringify({ action: 'check' })
        });
        
        if (data.success) {
            currentUser = data.user;
            return currentUser;
        } else {
            window.location.href = 'login.html';
            return false;
        }
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = 'login.html';
        return false;
    }
}

async function logout() {
    try {
        await apiFetch(`${API_BASE}/auth`, {
            method: 'POST',
            body: JSON.stringify({ action: 'logout' })
        });
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'login.html';
    }
}

function addLogoutButton() {
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.getElementById('logoutBtn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        logoutBtn.className = 'theme-btn';
        logoutBtn.title = 'Logout';
        logoutBtn.textContent = '🚪';
        logoutBtn.onclick = logout;
        headerActions.appendChild(logoutBtn);
        
        // Add profile button
        const profileBtn = document.createElement('button');
        profileBtn.id = 'profileBtn';
        profileBtn.className = 'theme-btn';
        profileBtn.title = 'Akun Saya';
        profileBtn.textContent = '👤';
        profileBtn.onclick = () => {
            window.location.href = 'account.html';
        };
        headerActions.appendChild(profileBtn);
    }
}

// ============ THEME ============
function applyTheme() {
    const dark = localStorage.getItem("mm_dark") === "1";
    if (dark) {
        document.documentElement.setAttribute("data-theme", "dark");
        const themeBtn = document.getElementById("themeToggle");
        if (themeBtn) themeBtn.textContent = "☀️";
    } else {
        document.documentElement.removeAttribute("data-theme");
        const themeBtn = document.getElementById("themeToggle");
        if (themeBtn) themeBtn.textContent = "🌙";
    }
}

function initTheme() {
    applyTheme();
    const themeBtn = document.getElementById("themeToggle");
    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            const dark = document.documentElement.getAttribute("data-theme") === "dark";
            localStorage.setItem("mm_dark", dark ? "0" : "1");
            applyTheme();
        });
    }
}

async function updateStreakDisplay() {
    const entriesData = await fetchEntries();
    const streak = calcStreak(entriesData);
    const streakEl = document.getElementById("streakVal");
    if (streakEl) streakEl.textContent = streak;
}

function setActiveNav() {
    const currentPage = window.location.pathname.split('/').pop();
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}