// Insight Page Specific Logic

// Generate Weekly Insight
async function generateWeeklyInsight() {
    const el = document.getElementById("weeklyInsight");
    if (!el) return;
    
    el.innerHTML = `<div class="insight-loading">Menganalisa pola minggu ini…<div class="dot-pulse"><span></span><span></span><span></span></div></div>`;
    
    const last7 = entries.filter(e => {
        const d = new Date(e.date + "T12:00:00");
        const now = new Date();
        return (now - d) <= 7 * 86400000;
    });
    
    if (last7.length < 2) {
        el.innerHTML = `<div class="insight-placeholder">Butuh minimal 2 entri dalam 7 hari untuk analisa. Kamu baru punya ${last7.length}.</div>
        <button class="btn-save" id="weeklyInsightBtn" style="margin-top:14px;">🔍 Analisa Minggu Ini</button>`;
        document.getElementById("weeklyInsightBtn")?.addEventListener("click", generateWeeklyInsight);
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'weekly',
                entries: last7
            })
        });
        const data = await response.json();
        const insight = data.success ? data.data.insight : "Tidak bisa membuat analisa saat ini.";
        el.innerHTML = `<div class="insight-text" style="line-height:1.7;">${insight}</div>
        <button class="btn-save" id="weeklyInsightBtn" style="margin-top:16px;">🔄 Buat Ulang</button>`;
        document.getElementById("weeklyInsightBtn")?.addEventListener("click", generateWeeklyInsight);
    } catch (error) {
        el.innerHTML = `<div class="insight-placeholder">Gagal menghubungi AI. Coba lagi nanti.</div>
        <button class="btn-save" id="weeklyInsightBtn" style="margin-top:14px;">🔍 Coba Lagi</button>`;
        document.getElementById("weeklyInsightBtn")?.addEventListener("click", generateWeeklyInsight);
    }
}

// Load Quote
async function loadQuote() {
    const el = document.getElementById("quoteContent");
    if (!el) return;
    
    const mood = entries.find(e => e.date === todayStr());
    const moodCtx = mood ? mood.moodName : "";
    
    try {
        const response = await fetch(`${API_BASE}/ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'quote',
                moodContext: moodCtx
            })
        });
        const data = await response.json();
        if (data.success) {
            el.innerHTML = `<div class="quote-box">${data.data.quote}<div class="quote-author">— ${data.data.author}</div></div>`;
        } else {
            el.innerHTML = `<div class="quote-box">Setiap hari adalah kesempatan baru untuk menjadi versi terbaik dirimu.<div class="quote-author">— HiddenFeel</div></div>`;
        }
    } catch (error) {
        el.innerHTML = `<div class="quote-box">Setiap hari adalah kesempatan baru untuk menjadi versi terbaik dirimu.<div class="quote-author">— HiddenFeel</div></div>`;
    }
}

// Load Daily Tip
async function loadTip() {
    const el = document.getElementById("tipContent");
    if (!el) return;
    
    const avgMood = getAvgMood(entries);
    const topTrigger = getTopTrigger(entries);
    
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
        const tip = data.success ? data.data.tip : "Coba luangkan 5 menit besok pagi untuk menarik napas dalam dan mensyukuri tiga hal kecil.";
        el.innerHTML = `<div class="insight-box"><div class="insight-icon">💡</div><div class="insight-text">${tip}</div></div>`;
    } catch (error) {
        el.innerHTML = `<div class="insight-box"><div class="insight-icon">💡</div><div class="insight-text">Coba luangkan 5 menit besok pagi untuk menarik napas dalam dan mensyukuri tiga hal kecil.</div></div>`;
    }
}

// Load All Insight Data
async function loadInsightData() {
    entries = await fetchEntries();
    updateStreakDisplay();
    setActiveNav();
    initTheme();
    await loadQuote();
    await loadTip();
    
    // Setup weekly insight button
    const weeklyBtn = document.getElementById("weeklyInsightBtn");
    if (weeklyBtn) {
        weeklyBtn.addEventListener("click", generateWeeklyInsight);
    }
}

// Start
loadInsightData();