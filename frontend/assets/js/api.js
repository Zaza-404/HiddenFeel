import { getToken } from './common.js';

const API_BASE = 'http://localhost:3000/api';

export const api = {
    async getEntries() {
        const token = getToken();
        const response = await fetch(`${API_BASE}/entries`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch entries');
        }
        return response.json();
    },
    
    async postEntry(data) {
        const token = getToken();
        const response = await fetch(`${API_BASE}/entries`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save entry');
        }
        return response.json();
    },
    
    async updateEntry(id, data) {
        const token = getToken();
        const response = await fetch(`${API_BASE}/entries/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update entry');
        }
        return response.json();
    },
    
    async deleteEntry(id) {
        const token = getToken();
        const response = await fetch(`${API_BASE}/entries/${id}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete entry');
        }
        return response.json();
    },
    
    async getStats() {
        const token = getToken();
        const response = await fetch(`${API_BASE}/stats`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch stats');
        }
        return response.json();
    },
    
    async analyzeFeeling(text) {
        const token = getToken();
        const response = await fetch(`${API_BASE}/ai/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'AI analysis failed');
        }
        return response.json();
    }
};