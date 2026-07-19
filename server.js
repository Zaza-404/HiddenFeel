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

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// ============ DATABASE FUNCTIONS ============
const DATA_DIR = path.join(__dirname, 'backend', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ENTRIES_FILE = path.join(DATA_DIR, 'entries.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data files
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(ENTRIES_FILE)) {
    fs.writeFileSync(ENTRIES_FILE, JSON.stringify([]));
}

function readJSON(file) {
    try {
        const data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data) || [];
    } catch (error) {
        console.error('Error reading file:', file, error);
        return [];
    }
}

function writeJSON(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing file:', file, error);
        return false;
    }
}

function getNextId(data) {
    if (!data || data.length === 0) return 1;
    const ids = data.map(item => item.id).filter(id => typeof id === 'number');
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
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
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

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

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
        if (getUserByEmail(email)) {
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
        writeJSON(USERS_FILE, users);

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
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
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
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current user
app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        created_at: req.user.created_at
    });
});

// Update user
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
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============ ENTRIES ROUTES ============

// Get all entries
app.get('/api/entries', authMiddleware, (req, res) => {
    try {
        const entries = getEntriesByUser(req.userId);
        // Sort by newest first
        entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        res.json(entries);
    } catch (error) {
        console.error('Get entries error:', error);
        res.status(500).json({ error: 'Internal server error' });
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

        // Simple sentiment analysis
        const sentimentScore = analyzeSentiment(feeling_text);

        const entries = readJSON(ENTRIES_FILE);
        const newEntry = {
            id: getNextId(entries),
            user_id: req.userId,
            mood: mood || '😊',
            feeling_text: feeling_text.trim(),
            note: note || '',
            sentiment_score: sentimentScore,
            created_at: new Date().toISOString()
        };

        entries.push(newEntry);
        writeJSON(ENTRIES_FILE, entries);

        res.json({
            success: true,
            entry: newEntry
        });
    } catch (error) {
        console.error('Create entry error:', error);
        res.status(500).json({ error: 'Internal server error' });
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
            entries[entryIndex].sentiment_score = analyzeSentiment(feeling_text);
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
        console.error('Update entry error:', error);
        res.status(500).json({ error: 'Internal server error' });
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
        console.error('Delete entry error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============ STATS ROUTES ============

app.get('/api/stats', authMiddleware, (req, res) => {
    try {
        const entries = getEntriesByUser(req.userId);
        const total = entries.length;

        // Average sentiment
        let avgSentiment = 0;
        if (total > 0) {
            const sum = entries.reduce((acc, e) => acc + e.sentiment_score, 0);
            avgSentiment = sum / total;
        }

        // Mood distribution
        const moodCount = {};
        entries.forEach(e => {
            moodCount[e.mood] = (moodCount[e.mood] || 0) + 1;
        });

        // Most common mood
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
            const dateStr = e.created_at.split('T')[0];
            if (dailyStats[dateStr] !== undefined) {
                dailyStats[dateStr]++;
            }
        });

        const dailyData = Object.entries(dailyStats).map(([date, count]) => ({
            date,
            count
        }));

        // Week stats
        const weekStats = [0, 0, 0, 0, 0, 0, 0];
        entries.forEach(e => {
            const day = new Date(e.created_at).getDay();
            weekStats[day]++;
        });

        // Streak
        let streak = 0;
        if (total > 0) {
            const sortedEntries = [...entries].sort((a, b) => 
                new Date(b.created_at) - new Date(a.created_at)
            );
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const lastEntryDate = new Date(sortedEntries[0].created_at);
            lastEntryDate.setHours(0, 0, 0, 0);
            
            const diffDays = Math.floor((today - lastEntryDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                streak = 1;
                let checkDate = new Date(today);
                checkDate.setDate(checkDate.getDate() - 1);
                
                const entryDates = new Set();
                entries.forEach(e => {
                    const date = new Date(e.created_at);
                    date.setHours(0, 0, 0, 0);
                    entryDates.add(date.getTime());
                });
                
                while (entryDates.has(checkDate.getTime())) {
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                }
            }
        }

        res.json({
            total,
            avg_sentiment: parseFloat(avgSentiment.toFixed(2)),
            mood_count: moodCount,
            most_common_mood: mostCommonMood,
            daily_stats: dailyData,
            week_stats: weekStats,
            streak
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============ AI ROUTES ============

app.post('/api/ai/analyze', authMiddleware, (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim().length < 3) {
            return res.status(400).json({ error: 'Text terlalu pendek' });
        }

        const score = analyzeSentiment(text);
        const label = getSentimentLabel(score);
        const keywords = extractKeywords(text);

        res.json({
            sentiment_score: score,
            label: label.label,
            emoji: label.emoji,
            keywords: keywords,
            word_count: text.split(/\s+/).length,
            confidence: 0.7 + (Math.random() * 0.25)
        });
    } catch (error) {
        console.error('AI analyze error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============ HELPER FUNCTIONS ============

function analyzeSentiment(text) {
    const positiveWords = [
        'senang', 'bahagia', 'cinta', 'suka', 'tenang', 'syukur', 'bersyukur', 
        'gembira', 'ceria', 'semangat', 'bangga', 'puas', 'baik', 'indah',
        'happy', 'love', 'good', 'great', 'amazing', 'wonderful', 'fantastic'
    ];
    
    const negativeWords = [
        'sedih', 'marah', 'kecewa', 'benci', 'takut', 'stress', 'kesal',
        'minder', 'cemas', 'khawatir', 'gagal', 'buruk', 'kesepian',
        'sad', 'angry', 'hate', 'fear', 'anxious', 'worried', 'depressed'
    ];

    const textLower = text.toLowerCase();
    let score = 0.5;
    let totalWeight = 0;

    positiveWords.forEach(word => {
        if (textLower.includes(word)) {
            score += 0.12;
            totalWeight++;
        }
    });

    negativeWords.forEach(word => {
        if (textLower.includes(word)) {
            score -= 0.12;
            totalWeight++;
        }
    });

    // Intensifiers
    if (textLower.includes('sangat') || textLower.includes('sekali') || textLower.includes('very')) {
        score += (score - 0.5) * 0.3;
    }

    return Math.max(0, Math.min(1, score));
}

function getSentimentLabel(score) {
    if (score > 0.7) return { label: 'Sangat Positif', emoji: '🌟' };
    if (score > 0.5) return { label: 'Positif', emoji: '😊' };
    if (score > 0.3) return { label: 'Netral', emoji: '😐' };
    if (score > 0.1) return { label: 'Negatif', emoji: '😢' };
    return { label: 'Sangat Negatif', emoji: '💔' };
}

function extractKeywords(text) {
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3);
    
    const wordCount = {};
    words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });

    const sorted = Object.entries(wordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);

    return sorted;
}

// ============ ERROR HANDLING ============

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ============ START SERVER ============

app.listen(PORT, () => {
    console.log('╔═══════════════════════════════════════╗');
    console.log('║   🚀 HiddenFeel Server Started       ║');
    console.log('╠═══════════════════════════════════════╣');
    console.log(`║   📡 Port: ${PORT}                         ║`);
    console.log(`║   🌐 URL: http://localhost:${PORT}         ║`);
    console.log('║   📝 Login: /login.html              ║');
    console.log('║   📊 Stats: /stats.html              ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log('\n✨ Server is ready!');
});

module.exports = app;