const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Path data file
const DATA_DIR = path.join(__dirname, 'database');
const ENTRIES_FILE = path.join(DATA_DIR, 'entries.json');

// Pastikan folder database ada
fs.ensureDirSync(DATA_DIR);

// Load data
function loadEntries() {
    try {
        if (fs.existsSync(ENTRIES_FILE)) {
            return fs.readJsonSync(ENTRIES_FILE);
        }
        return [];
    } catch (error) {
        console.error('Error loading entries:', error);
        return [];
    }
}

// Save data
function saveEntries(entries) {
    try {
        fs.writeJsonSync(ENTRIES_FILE, entries, { spaces: 2 });
        return true;
    } catch (error) {
        console.error('Error saving entries:', error);
        return false;
    }
}

// ============ API ROUTES ============

// Get all entries
app.get('/api/entries', (req, res) => {
    const entries = loadEntries();
    res.json({ success: true, data: entries });
});

// Get single entry by date
app.get('/api/entries/:date', (req, res) => {
    const entries = loadEntries();
    const entry = entries.find(e => e.date === req.params.date);
    res.json({ success: true, data: entry || null });
});

// Save/update entry
app.post('/api/entries', (req, res) => {
    const entries = loadEntries();
    const newEntry = req.body;
    const index = entries.findIndex(e => e.date === newEntry.date);
    
    if (index !== -1) {
        entries[index] = { ...newEntry, updatedAt: new Date().toISOString() };
    } else {
        entries.push({ ...newEntry, createdAt: new Date().toISOString() });
    }
    
    if (saveEntries(entries)) {
        res.json({ success: true, message: 'Entry saved', data: entries });
    } else {
        res.status(500).json({ success: false, message: 'Failed to save' });
    }
});

// Delete entry
app.delete('/api/entries/:date', (req, res) => {
    let entries = loadEntries();
    const filtered = entries.filter(e => e.date !== req.params.date);
    
    if (saveEntries(filtered)) {
        res.json({ success: true, message: 'Entry deleted' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to delete' });
    }
});

// AI Insight - Daily
app.post('/api/ai/daily', async (req, res) => {
    const { entry, recentEntries } = req.body;
    
    const prompt = `Kamu adalah teman emosional yang hangat dan penuh empati. Seorang pengguna baru saja mencatat mood mereka.

Mood hari ini: ${entry.moodEmoji} ${entry.moodName} (intensitas: ${entry.intensity || 3}/5)
Energi: ${entry.energy || "tidak dicatat"}
Trigger: ${entry.triggers?.join(", ") || "tidak ada"}
Catatan: "${entry.note || "tidak ada"}"
Mood 7 hari terakhir: ${recentEntries?.map(e => `${e.moodEmoji} ${e.moodName}`).join(", ") || "tidak ada"}

Berikan respons hangat singkat (2-3 kalimat) dalam bahasa Indonesia yang:
1. Mengakui perasaan mereka dengan empati
2. Satu insight kecil tentang pola yang kamu lihat (jika ada)
3. Satu kata semangat atau tips kecil

Jangan gunakan bullet point. Tulis seperti teman bicara langsung.`;

    try {
        const response = await callClaudeAPI(prompt, 200);
        res.json({ success: true, insight: response });
    } catch (error) {
        console.error('AI Error:', error);
        res.json({ 
            success: false, 
            insight: "Terima kasih sudah meluangkan waktu untuk mencatat hari ini. Ini langkah kecil yang berarti! 💚" 
        });
    }
});

// AI Insight - Weekly
app.post('/api/ai/weekly', async (req, res) => {
    const { entries } = req.body;
    
    const summary = entries.map(e => 
        `${e.date}: ${e.moodEmoji} ${e.moodName} (${e.moodVal}/5), trigger: ${e.triggers?.join(", ") || "—"}, catatan: "${e.note || "—"}"`
    ).join("\n");

    const prompt = `Kamu adalah psikolog virtual yang penuh empati. Analisa pola emosi pengguna selama 7 hari ini:

${summary}

Berikan analisa dalam bahasa Indonesia yang:
1. Pola emosi yang kamu lihat
2. Trigger yang paling berpengaruh  
3. Satu rekomendasi konkret untuk minggu depan

Format: 3 paragraf pendek, tulis seperti profesional tapi hangat. Tidak perlu heading.`;

    try {
        const response = await callClaudeAPI(prompt, 400);
        res.json({ success: true, insight: response });
    } catch (error) {
        console.error('AI Error:', error);
        res.json({ success: false, insight: "Tidak bisa membuat analisa saat ini. Coba lagi nanti." });
    }
});

// AI - Quote
app.post('/api/ai/quote', async (req, res) => {
    const { moodContext } = req.body;
    const moodCtx = moodContext ? `tentang ${moodContext.toLowerCase()} atau cara menghadapinya` : "tentang kesehatan mental atau ketenangan";

    const prompt = `Berikan SATU kutipan inspiratif dalam bahasa Indonesia ${moodCtx}. 
Format:
KUTIPAN: [teks kutipan]
PENULIS: [nama penulis]

Hanya berikan kutipan dan nama penulis, tidak ada teks lain.`;

    try {
        const response = await callClaudeAPI(prompt, 150);
        const lines = response.split("\n");
        const quoteLine = lines.find(l => l.startsWith("KUTIPAN:"))?.replace("KUTIPAN:", "").trim() || response;
        const authorLine = lines.find(l => l.startsWith("PENULIS:"))?.replace("PENULIS:", "").trim() || "";
        
        res.json({ 
            success: true, 
            quote: quoteLine,
            author: authorLine || "HiddenFeel"
        });
    } catch (error) {
        res.json({ 
            success: false, 
            quote: "Setiap hari adalah kesempatan baru untuk menjadi versi terbaik dirimu.",
            author: "HiddenFeel"
        });
    }
});

// AI - Daily Tip
app.post('/api/ai/tip', async (req, res) => {
    const { avgMood, topTrigger } = req.body;
    
    const prompt = `Pengguna memiliki rata-rata mood ${avgMood}/5 dan trigger terbanyak adalah "${topTrigger}".
Berikan 1 saran praktis singkat (1-2 kalimat) untuk meningkatkan wellbeing mereka besok. Bahasa Indonesia, hangat dan konkret.`;

    try {
        const response = await callClaudeAPI(prompt, 120);
        res.json({ success: true, tip: response });
    } catch (error) {
        res.json({ 
            success: false, 
            tip: "Coba luangkan 5 menit besok pagi untuk menarik napas dalam dan mensyukuri tiga hal kecil." 
        });
    }
});

// Function to call Claude API
async function callClaudeAPI(prompt, maxTokens) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
        console.warn('No valid API key, returning fallback response');
        return getFallbackResponse(prompt);
    }
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: maxTokens,
            messages: [{ role: 'user', content: prompt }]
        })
    });
    
    const data = await response.json();
    return data.content?.[0]?.text || getFallbackResponse(prompt);
}

function getFallbackResponse(prompt) {
    if (prompt.includes('kutipan')) {
        return "KUTIPAN: Kebahagiaan bukanlah sesuatu yang sudah jadi. Itu datang dari tindakanmu sendiri.\nPENULIS: Dalai Lama";
    }
    if (prompt.includes('saran praktis')) {
        return "Luangkan waktu 5 menit untuk bernapas dalam-dalam dan tuliskan 3 hal yang kamu syukuri hari ini.";
    }
    if (prompt.includes('psikolog virtual')) {
        return "Dari data yang ada, terlihat ada fluktuasi emosi yang wajar. Trigger yang paling sering muncul adalah pekerjaan. Cobalah untuk menyisihkan waktu istirahat singkat di sela-sela aktivitas. Minggu depan, coba praktikkan teknik Pomodoro: 25 menit fokus, 5 menit istirahat. Ini bisa membantu mengurangi stres.";
    }
    return "Terima kasih sudah mencatat emosi hari ini. Kamu hebat! 💚";
}

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 HiddenFeel server running on http://localhost:${PORT}`);
});