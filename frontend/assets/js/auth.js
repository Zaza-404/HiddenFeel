// API Base URL - adjust if needed
const API_BASE = 'http://localhost:3000/api';

export const auth = {
    async register(name, email, password) {
        try {
            console.log('📤 Register attempt:', { name, email });
            
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            console.log('📥 Register response:', data);
            
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                return { success: true };
            }
            
            return { success: false, error: data.error || 'Register gagal' };
        } catch (error) {
            console.error('❌ Register error:', error);
            return { 
                success: false, 
                error: 'Gagal terhubung ke server. Pastikan server berjalan di port 3000' 
            };
        }
    },
    
    async login(email, password) {
        try {
            console.log('📤 Login attempt:', { email });
            
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            console.log('📥 Login response:', data);
            
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                return { success: true };
            }
            
            return { success: false, error: data.error || 'Login gagal' };
        } catch (error) {
            console.error('❌ Login error:', error);
            return { 
                success: false, 
                error: 'Gagal terhubung ke server. Pastikan server berjalan di port 3000' 
            };
        }
    },
    
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    },
    
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },
    
    getToken() {
        return localStorage.getItem('token');
    }
};