// ============ THEME MANAGER (Centralized) ============

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Jika ada saved theme, pakai itu. Jika tidak, ikuti preferensi sistem
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else if (savedTheme === 'light') {
        document.documentElement.removeAttribute('data-theme');
    } else if (prefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    }
    
    updateThemeButton();
}

function toggleTheme() {
    const isDark = document.documentElement.hasAttribute('data-theme');
    
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
    
    updateThemeButton();
}

function updateThemeButton() {
    const buttons = document.querySelectorAll('.theme-btn');
    const isDark = document.documentElement.hasAttribute('data-theme');
    
    buttons.forEach(btn => {
        btn.textContent = isDark ? '☀️' : '🌙';
        btn.setAttribute('title', isDark ? 'Mode Terang' : 'Mode Gelap');
    });
}

// Setup theme toggle untuk semua halaman
function setupThemeToggle() {
    const buttons = document.querySelectorAll('.theme-btn');
    buttons.forEach(btn => {
        // Remove any existing listeners first (clone & replace to avoid duplicates)
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', toggleTheme);
    });
}

// Inisialisasi tema saat halaman dimuat (juga untuk halaman yang scriptnya di-load setelah DOM ready)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initTheme();
        setupThemeToggle();
    });
} else {
    initTheme();
    setupThemeToggle();
}
