import { auth } from './auth.js';

export async function requireAuth() {
    const token = auth.getToken();
    if (!token) {
        window.location.href = 'login.html';
        return null;
    }
    return token;
}

export function logout() {
    auth.logout();
}

export function getUser() {
    return auth.getCurrentUser();
}

export function getToken() {
    return auth.getToken();
}

export function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

export function setupNav() {
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-menu a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
    });
}

export async function fetchWithAuth(url, options = {}) {
    const token = getToken();
    if (!token) {
        logout();
        throw new Error('Unauthorized');
    }
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };
    
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    
    if (response.status === 401) {
        logout();
        throw new Error('Sesi habis, silakan login ulang');
    }
    
    if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan');
    }
    
    return data;
}