// Today Page Specific Logic

let selMood = null;
let selTriggers = [];
let selEnergy = null;
let intensityVal = 3;

// Render Mood Grid
function renderMoodGrid() {
    const g = document.getElementById("moodGrid");
    if (!g) return;
    g.innerHTML = "";
    MOODS.forEach(m => {
        const d = document.createElement("div");
        d.className = "mood-btn" + (selMood?.emoji === m.emoji ? " selected" : "");
        d.innerHTML = `<div class="mood-emoji">${m.emoji}</div><div class="mood-label">${m.name}</div>`;
        d.onclick = () => {
            selMood = m;
            document.getElementById("intensityRow").style.display = "flex";
            renderMoodGrid();
        };
        g.appendChild(d);
    });
}

// Render Energy
function renderEnergy() {
    const r = document.getElementById("energyRow");
    if (!r) return;
    r.innerHTML = "";
    ENERGIES.forEach(e => {
        const d = document.createElement("div");
        d.className = "energy-btn" + (selEnergy === e ? " on" : "");
        d.textContent = e;
        d.onclick = () => { selEnergy = e; renderEnergy(); };
        r.appendChild(d);
    });
}

// Render Triggers
function renderTriggers() {
    const g = document.getElementById("triggersGrid");
    if (!g) return;
    g.innerHTML = "";
    TRIGGERS.forEach(t => {
        const c = document.createElement("div");
        c.className = "chip" + (selTriggers.includes(t) ? " on" : "");
        c.textContent = t;
        c.onclick = () => {
            if (selTriggers.includes(t)) {
                selTriggers = selTriggers.filter(tr => tr !== t);
            } else {
                selTriggers.push(t);
            }
            renderTriggers();
        };
        g.appendChild(c);
    });
}

// Render Greeting
function renderGreeting() {
    const hour = new Date().getHours();
    let greet = hour < 11 ? "Selamat pagi!" : hour < 15 ? "Selamat siang!" : hour < 18 ? "Selamat sore!" : "Selamat malam!";
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const now = new Date();
    const dateEl = document.getElementById("greetingDate");
    const textEl = document.getElementById("greetingText");
    const checkedEl = document.getElementById("greetingChecked");
    
    if (dateEl) dateEl.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    if (textEl) textEl.textContent = greet;
    
    const todayEntry = entries.find(e => e.date === todayStr());
    if (checkedEl) {
        checkedEl.textContent = todayEntry
            ? `✓ Sudah dicatat: ${todayEntry.moodEmoji} ${todayEntry.moodName}`
            : "Belum ada catatan hari ini.";
    }
}

// Load Today's Data
function loadToday() {
    const e = entries.find(e => e.date === todayStr());
    if (e) {
        selMood = MOODS.find(m => m.emoji === e.moodEmoji) || null;
        selTriggers = e.triggers || [];
        selEnergy = e.energy || null;
        intensityVal = e.intensity || 3;
        const noteInput = document.getElementById("noteInput");
        if (noteInput) noteInput.value = e.note || "";
        const slider = document.getElementById("intensitySlider");
        if (slider) slider.value = intensityVal;
        const valSpan = document.getElementById("intensityVal");
        if (valSpan) valSpan.textContent = intensityVal;
        if (selMood) {
            const row = document.getElementById("intensityRow");
            if (row) row.style.display = "flex";
        }
    } else {
        selMood = null;
        selTriggers = [];
        selEnergy = null;
        intensityVal = 3;
        const noteInput = document.getElementById("noteInput");
        if (noteInput) noteInput.value = "";
        const row = document.getElementById("intensityRow");
        if (row) row.style.display = "none";
    }
    renderMoodGrid();
    renderTriggers();
    renderEnergy();
}

// Generate Daily Insight
async function generateDailyInsight(entry) {
    const box = document.getElementById("insightBox");
    const content = document.getElementById("insightContent");
    if (!box || !content) return;
    
    box.style.display = "block";
    content.innerHTML = `<div class="insight-loading">Membuat refleksi AI…<div class="dot-pulse"><span></span><span></span><span></span></div></div>`;
    
    const recentEntries = entries.slice(-7).map(e => `${e.moodEmoji} ${e.moodName}`);
    
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
        const insight = data.success ? data.data.insight : "Terima kasih sudah mencatat hari ini! 💚";
        content.innerHTML = `<div class="insight-text">✨ ${insight}</div>`;
    } catch (error) {
        content.innerHTML = `<div class="insight-text">✨ Terima kasih sudah meluangkan waktu untuk mencatat hari ini. Ini langkah kecil yang berarti! 💚</div>`;
    }
}

// Save Today
async function saveToday() {
    if (!selMood) {
        showToast("Pilih mood dulu ya 😊");
        return;
    }
    
    const entry = {
        date: todayStr(),
        moodEmoji: selMood.emoji,
        moodName: selMood.name,
        moodVal: selMood.val,
        intensity: intensityVal,
        triggers: [...selTriggers],
        energy: selEnergy,
        note: document.getElementById("noteInput")?.value.trim() || "",
        ts: Date.now()
    };
    
    const success = await saveEntry(entry);
    if (success) {
        entries = await fetchEntries();
        loadToday();
        renderGreeting();
        updateStreakDisplay();
        showToast("✅ Tersimpan!");
        generateDailyInsight(entry);
    } else {
        showToast("❌ Gagal menyimpan");
    }
}

// Event Listeners
function initTodayPage() {
    // Intensity slider
    const slider = document.getElementById("intensitySlider");
    const valSpan = document.getElementById("intensityVal");
    if (slider && valSpan) {
        slider.addEventListener("input", function() {
            intensityVal = parseInt(this.value);
            valSpan.textContent = intensityVal;
        });
    }
    
    // Save button
    const saveBtn = document.getElementById("saveBtn");
    if (saveBtn) {
        saveBtn.addEventListener("click", saveToday);
    }
    
    // Theme
    initTheme();
}

// Load Data and Render
async function loadData() {
    entries = await fetchEntries();
    renderGreeting();
    loadToday();
    updateStreakDisplay();
    setActiveNav();
    initTodayPage();
}

// Start
loadData();