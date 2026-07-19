// AI Functions

async function generateDailyInsight(entry) {
    const box = document.getElementById("insightBox");
    const content = document.getElementById("insightContent");
    if (!box || !content) return;
    
    box.style.display = "block";
    content.innerHTML = `<div class="insight-loading">Membuat refleksi AI…<div class="dot-pulse"><span></span><span></span><span></span></div></div>`;
    
    const recentEntries = currentEntries.slice(-7).map(e => `${e.moodEmoji} ${e.moodName}`);
    const insight = await getDailyInsight(entry, recentEntries);
    content.innerHTML = `<div class="insight-text">✨ ${insight}</div>`;
}

async function generateWeeklyInsight() {
    const el = document.getElementById("weeklyInsight");
    if (!el) return;
    
    el.innerHTML = `<div class="insight-loading">Menganalisa pola minggu ini…<div class="dot-pulse"><span></span><span></span><span></span></div></div>`;
    
    const last7 = getLast7DaysEntries(currentEntries);
    
    if (last7.length < 2) {
        el.innerHTML = `<div class="insight-placeholder">Butuh minimal 2 entri dalam 7 hari untuk analisa. Kamu baru punya ${last7.length}.</div>
        <button class="btn-save" id="weeklyInsightBtn">🔍 Analisa Minggu Ini</button>`;
        document.getElementById("weeklyInsightBtn")?.addEventListener("click", generateWeeklyInsight);
        return;
    }
    
    const insight = await getWeeklyInsight(last7);
    el.innerHTML = `<div class="insight-text">${insight}</div>
    <button class="btn-save" id="weeklyInsightBtn">🔄 Buat Ulang</button>`;
    document.getElementById("weeklyInsightBtn")?.addEventListener("click", generateWeeklyInsight);
}

async function loadQuote() {
    const el = document.getElementById("quoteContent");
    if (!el) return;
    
    const mood = currentEntries.find(e => e.date === todayStr());
    const moodCtx = mood ? mood.moodName : "";
    
    el.innerHTML = `<div class="insight-loading"><span>Memuat kutipan…</span><div class="dot-pulse"><span></span><span></span><span></span></div></div>`;
    
    const result = await getQuote(moodCtx);
    el.innerHTML = `<div class="quote-box">${result.quote}<div class="quote-author">— ${result.author}</div></div>`;
}

async function loadTip() {
    const el = document.getElementById("tipContent");
    if (!el) return;
    
    const avgMood = getAvgMood(currentEntries);
    const topTrigger = getTopTrigger(currentEntries);
    
    el.innerHTML = `<div class="insight-loading"><span>Memuat saran…</span><div class="dot-pulse"><span></span><span></span><span></span></div></div>`;
    
    const tip = await getDailyTip(avgMood, topTrigger);
    el.innerHTML = `<div class="insight-box"><div class="insight-icon">💡</div><div class="insight-text">${tip}</div></div>`;
}