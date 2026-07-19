const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'hiddenfeel_secret_key';

// ============ MIDDLEWARE ============
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('frontend'));

// Logging untuk debugging
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api', limiter);

// ============ DATABASE FUNCTIONS ============
const DATA_DIR = path.join(__dirname, 'backend', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ENTRIES_FILE = path.join(DATA_DIR, 'entries.json');

// Ensure data directory exists
try {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        console.log('📁 Created data directory:', DATA_DIR);
    }
} catch (error) {
    console.error('❌ Failed to create data directory:', error);
}

// Initialize data files
try {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]));
        console.log('📄 Created users.json');
    }
    if (!fs.existsSync(ENTRIES_FILE)) {
        fs.writeFileSync(ENTRIES_FILE, JSON.stringify([]));
        console.log('📄 Created entries.json');
    }
} catch (error) {
    console.error('❌ Failed to initialize data files:', error);
}

function readJSON(file) {
    try {
        if (!fs.existsSync(file)) {
            return [];
        }
        const data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data) || [];
    } catch (error) {
        console.error('❌ Error reading file:', file, error.message);
        return [];
    }
}

function writeJSON(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('❌ Error writing file:', file, error.message);
        return false;
    }
}

function getNextId(data) {
    if (!data || data.length === 0) return 1;
    const ids = data.map(item => item.id).filter(id => typeof id === 'number' && !isNaN(id));
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
}

// ============ AUTH FUNCTIONS ============
function generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.userId;
    } catch (error) {
        return null;
    }
}

function getUserById(userId) {
    const users = readJSON(USERS_FILE);
    return users.find(u => u.id === userId);
}

function getUserByEmail(email) {
    const users = readJSON(USERS_FILE);
    return users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
}

function getEntriesByUser(userId) {
    const entries = readJSON(ENTRIES_FILE);
    return entries.filter(e => e.user_id === userId);
}

// ============ AUTH MIDDLEWARE ============
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    const userId = verifyToken(token);
    
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    const user = getUserById(userId);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized - User not found' });
    }

    req.userId = userId;
    req.user = user;
    next();
}

// ============ ERROR HANDLER ============
function handleError(res, error, message = 'Internal server error') {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
        error: message,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
}

// ============ API ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// ============ REGISTER ============
app.post('/api/auth/register', async (req, res) => {
    try {
        console.log('📝 Register request received');
        const { name, email, password } = req.body;
        console.log('📝 Data:', { name, email, password: password ? '***' : 'missing' });

        // Validasi
        if (!name || !email || !password) {
            return res.status(400).json({ 
                error: 'Semua field harus diisi',
                fields: { name: !!name, email: !!email, password: !!password }
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Email tidak valid' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password minimal 6 karakter' });
        }

        // Cek email duplikat
        const existingUser = getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ error: 'Email sudah terdaftar' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Simpan user
        const users = readJSON(USERS_FILE);
        const newUser = {
            id: getNextId(users),
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            created_at: new Date().toISOString()
        };

        users.push(newUser);
        const saved = writeJSON(USERS_FILE, users);
        if (!saved) {
            return res.status(500).json({ error: 'Gagal menyimpan data user' });
        }

        // Generate token
        const token = generateToken(newUser.id);

        res.json({
            success: true,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                created_at: newUser.created_at
            },
            token
        });
    } catch (error) {
        handleError(res, error, 'Gagal registrasi');
    }
});

// ============ LOGIN ============
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('🔑 Login request received');
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email dan password harus diisi' });
        }

        const user = getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Email atau password salah' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Email atau password salah' });
        }

        const token = generateToken(user.id);

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                created_at: user.created_at
            },
            token
        });
    } catch (error) {
        handleError(res, error, 'Gagal login');
    }
});

// ============ GET CURRENT USER ============
app.get('/api/auth/me', authMiddleware, (req, res) => {
    try {
        res.json({
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            created_at: req.user.created_at
        });
    } catch (error) {
        handleError(res, error, 'Gagal mengambil data user');
    }
});

// ============ UPDATE USER ============
app.put('/api/auth/me', authMiddleware, async (req, res) => {
    try {
        const { name, password } = req.body;
        const users = readJSON(USERS_FILE);
        const userIndex = users.findIndex(u => u.id === req.userId);

        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (name) {
            users[userIndex].name = name.trim();
        }

        if (password && password.length >= 6) {
            users[userIndex].password = await bcrypt.hash(password, 10);
        }

        writeJSON(USERS_FILE, users);

        res.json({
            success: true,
            user: {
                id: users[userIndex].id,
                name: users[userIndex].name,
                email: users[userIndex].email
            }
        });
    } catch (error) {
        handleError(res, error, 'Gagal update profil');
    }
});

// ============ ENTRIES ROUTES ============

// Get all entries
app.get('/api/entries', authMiddleware, (req, res) => {
    try {
        const entries = getEntriesByUser(req.userId);
        entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        res.json(entries);
    } catch (error) {
        handleError(res, error, 'Gagal mengambil entries');
    }
});

// Create entry
app.post('/api/entries', authMiddleware, (req, res) => {
    try {
        const { mood, feeling_text, note } = req.body;

        if (!feeling_text || feeling_text.trim().length < 3) {
            return res.status(400).json({ error: 'Perasaan terlalu pendek (min 3 karakter)' });
        }

        if (feeling_text.length > 1000) {
            return res.status(400).json({ error: 'Perasaan terlalu panjang (max 1000 karakter)' });
        }

        const entries = readJSON(ENTRIES_FILE);
        const newEntry = {
            id: getNextId(entries),
            user_id: req.userId,
            mood: mood || '😐',
            feeling_text: feeling_text.trim(),
            note: note || '',
            sentiment_score: Math.random() * 0.6 + 0.2,
            created_at: new Date().toISOString()
        };

        entries.push(newEntry);
        writeJSON(ENTRIES_FILE, entries);

        res.json({
            success: true,
            entry: newEntry
        });
    } catch (error) {
        handleError(res, error, 'Gagal menyimpan entry');
    }
});

// Update entry
app.put('/api/entries/:id', authMiddleware, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { mood, feeling_text, note } = req.body;

        const entries = readJSON(ENTRIES_FILE);
        const entryIndex = entries.findIndex(e => e.id === id && e.user_id === req.userId);

        if (entryIndex === -1) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        if (feeling_text && feeling_text.trim().length >= 3) {
            entries[entryIndex].feeling_text = feeling_text.trim();
        }

        if (mood) entries[entryIndex].mood = mood;
        if (note !== undefined) entries[entryIndex].note = note;
        entries[entryIndex].updated_at = new Date().toISOString();

        writeJSON(ENTRIES_FILE, entries);

        res.json({
            success: true,
            entry: entries[entryIndex]
        });
    } catch (error) {
        handleError(res, error, 'Gagal update entry');
    }
});

// Delete entry
app.delete('/api/entries/:id', authMiddleware, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        let entries = readJSON(ENTRIES_FILE);

        const found = entries.find(e => e.id === id && e.user_id === req.userId);
        if (!found) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        entries = entries.filter(e => e.id !== id);
        writeJSON(ENTRIES_FILE, entries);

        res.json({ success: true });
    } catch (error) {
        handleError(res, error, 'Gagal hapus entry');
    }
});

// ============ STATS ROUTES ============

app.get('/api/stats', authMiddleware, (req, res) => {
    try {
        const entries = getEntriesByUser(req.userId);
        const total = entries.length;

        let avgSentiment = 0;
        if (total > 0) {
            const sum = entries.reduce((acc, e) => acc + (e.sentiment_score || 0.5), 0);
            avgSentiment = sum / total;
        }

        const moodCount = {};
        entries.forEach(e => {
            moodCount[e.mood] = (moodCount[e.mood] || 0) + 1;
        });

        let mostCommonMood = null;
        let maxCount = 0;
        for (const [mood, count] of Object.entries(moodCount)) {
            if (count > maxCount) {
                maxCount = count;
                mostCommonMood = mood;
            }
        }

        // Daily stats (last 30 days)
        const dailyStats = {};
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dailyStats[dateStr] = 0;
        }

        entries.forEach(e => {
            const dateStr = e.created_at ? e.created_at.split('T')[0] : '';
            if (dailyStats[dateStr] !== undefined) {
                dailyStats[dateStr]++;
            }
        });

        const dailyData = Object.entries(dailyStats).map(([date, count]) => ({
            date,
            value: count
        }));

        // Streak
        let streak = 0;
        if (total > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const entryDates = new Set();
            entries.forEach(e => {
                if (e.created_at) {
                    const date = new Date(e.created_at);
                    date.setHours(0, 0, 0, 0);
                    entryDates.add(date.getTime());
                }
            });
            
            let checkDate = new Date(today);
            while (entryDates.has(checkDate.getTime())) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            }
        }

        res.json({
            total,
            avg_sentiment: parseFloat(avgSentiment.toFixed(2)),
            mood_count: moodCount,
            most_common_mood: mostCommonMood,
            daily_stats: dailyData,
            week_stats: [0, 0, 0, 0, 0, 0, 0],
            streak
        });
    } catch (error) {
        handleError(res, error, 'Gagal mengambil statistik');
    }
});

// ============ AI ROUTES ============

app.post('/api/ai/analyze', authMiddleware, (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim().length < 3) {
            return res.status(400).json({ error: 'Text terlalu pendek' });
        }

        const positiveWords = ['senang', 'bahagia', 'cinta', 'suka', 'tenang', 'gembira', 'semangat', 'bangga', 'puas'];
        const negativeWords = ['sedih', 'marah', 'kecewa', 'benci', 'takut', 'stress', 'kesal', 'cemas', 'khawatir'];

        const textLower = text.toLowerCase();
        let score = 0.5;

        positiveWords.forEach(word => {
            if (textLower.includes(word)) score += 0.12;
        });
        negativeWords.forEach(word => {
            if (textLower.includes(word)) score -= 0.12;
        });

        score = Math.max(0, Math.min(1, score));

        let label, emoji;
        if (score > 0.7) { label = 'Sangat Positif'; emoji = '🌟'; }
        else if (score > 0.5) { label = 'Positif'; emoji = '😊'; }
        else if (score > 0.3) { label = 'Netral'; emoji = '😐'; }
        else if (score > 0.1) { label = 'Negatif'; emoji = '😢'; }
        else { label = 'Sangat Negatif'; emoji = '💔'; }

        res.json({
            sentiment_score: score,
            label: label,
            emoji: emoji,
            keywords: text.split(' ').filter(w => w.length > 3).slice(0, 5),
            word_count: text.split(/\s+/).length,
            confidence: 0.7 + (Math.random() * 0.25)
        });
    } catch (error) {
        handleError(res, error, 'Gagal analisis AI');
    }
});

// ============ ERROR HANDLING ============

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============ START SERVER ============

app.listen(PORT, () => {
    console.log('╔═══════════════════════════════════════╗');
    console.log('║   🚀 HiddenFeel Server Started       ║');
    console.log('╠═══════════════════════════════════════╣');
    console.log(`║   📡 Port: ${PORT}                         ║`);
    console.log(`║   🌐 URL: http://localhost:${PORT}         ║`);
    console.log('║   📝 Login: /login.html              ║');
    console.log('║   📁 Data: backend/data/             ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log('\n✨ Server is ready!');
});

module.exports = app;