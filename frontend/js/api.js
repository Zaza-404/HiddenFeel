// API Service - Connect to Backend
const API_BASE = 'http://localhost/hiddenfeel/backend';

async function fetchEntries() {
    try {
        const response = await fetch(`${API_BASE}/entries`);
        const data = await response.json();
        return data.success ? data.data : [];
    } catch (error) {
        console.error('Fetch entries error:', error);
        return [];
    }
}

async function saveEntry(entry) {
    try {
        const response = await fetch(`${API_BASE}/entries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        });
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Save entry error:', error);
        return false;
    }
}

async function deleteEntryFromAPI(date) {
    try {
        const response = await fetch(`${API_BASE}/entries/${date}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Delete entry error:', error);
        return false;
    }
}

async function getDailyInsight(entry, recentEntries) {
    try {
        const response = await fetch(`${API_BASE}/ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'daily',
                entry: entry,
                recentEntries: recentEntries
            })
        });
        const data = await response.json();
        return data.success ? data.data.insight : "Terima kasih sudah mencatat hari ini! 💚";
    } catch (error) {
        console.error('Daily insight error:', error);
        return "Terima kasih sudah meluangkan waktu untuk mencatat hari ini. Ini langkah kecil yang berarti! 💚";
    }
}

async function getWeeklyInsight(entries) {
    try {
        const response = await fetch(`${API_BASE}/ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'weekly',
                entries: entries
            })
        });
        const data = await response.json();
        return data.success ? data.data.insight : "Tidak bisa membuat analisa saat ini.";
    } catch (error) {
        console.error('Weekly insight error:', error);
        return "Gagal menghubungi AI. Coba lagi nanti.";
    }
}

async function getQuote(moodContext) {
    try {
        const response = await fetch(`${API_BASE}/ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'quote',
                moodContext: moodContext
            })
        });
        const data = await response.json();
        return data.success ? data.data : { quote: "Setiap hari adalah kesempatan baru untuk menjadi versi terbaik dirimu.", author: "HiddenFeel" };
    } catch (error) {
        console.error('Quote error:', error);
        return { quote: "Setiap hari adalah kesempatan baru untuk menjadi versi terbaik dirimu.", author: "HiddenFeel" };
    }
}

async function getDailyTip(avgMood, topTrigger) {
    try {
        const response = await fetch(`${API_BASE}/ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'tip',
                avgMood: avgMood,
                topTrigger: topTrigger
            })
        });
        const data = await response.json();
        return data.success ? data.data.tip : "Coba luangkan 5 menit besok pagi untuk menarik napas dalam dan mensyukuri tiga hal kecil.";
    } catch (error) {
        console.error('Tip error:', error);
        return "Coba luangkan 5 menit besok pagi untuk menarik napas dalam dan mensyukuri tiga hal kecil.";
    }
}