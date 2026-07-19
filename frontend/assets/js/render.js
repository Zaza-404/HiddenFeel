// UI Rendering Functions

let currentEntries = [];
let selMood = null;
let selTriggers = [];
let selEnergy = null;
let intensityVal = 3;

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
    
    const todayEntry = currentEntries.find(e => e.date === todayStr());
    if (checkedEl) {
        checkedEl.textContent = todayEntry
            ? `✓ Sudah dicatat: ${todayEntry.moodEmoji} ${todayEntry.moodName}`
            : "Belum ada catatan hari ini.";
    }
}

function loadToday() {
    const e = currentEntries.find(e => e.date === todayStr());
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

function renderStats() {
    const streak = calcStreak(currentEntries);
    const streakVal = document.getElementById("streakVal");
    const statTotal = document.getElementById("statTotal");
    const statStreak2 = document.getElementById("statStreak2");
    const statAvg = document.getElementById("statAvg");
    const weeklyBadge = document.getElementById("weeklyBadge");
    
    if (streakVal) streakVal.textContent = streak;
    if (statTotal) statTotal.textContent = currentEntries.length;
    if (statStreak2) statStreak2.textContent = streak;
    
    if (currentEntries.length) {
        const avg = (currentEntries.reduce((a, e) => a + e.moodVal, 0) / currentEntries.length).toFixed(1);
        if (statAvg) statAvg.textContent = avg;
    } else {
        if (statAvg) statAvg.textContent = "—";
    }
    
    if (weeklyBadge) weeklyBadge.style.display = streak >= 7 ? "flex" : "none";
    
    renderBarChart();
    renderDonut();
    renderTriggerRank();
}

function renderBarChart() {
    const container = document.getElementById("barChart");
    if (!container) return;
    container.innerHTML = "";
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const str = d.toISOString().slice(0, 10);
        const entry = currentEntries.find(e => e.date === str);
        days.push({ str, entry, label: (d.getDate() + "").padStart(2, "0") + "/" + (d.getMonth() + 1) });
    }
    days.forEach(({ str, entry, label }) => {
        const col = document.createElement("div");
        col.className = "bar-col";
        const h = entry ? Math.max(14, (entry.moodVal / 5) * 90) : 6;
        const color = entry ? `hsl(${20 + (entry.moodVal - 1) * 18}, 60%, 58%)` : "var(--border)";
        const tip = entry ? `${entry.moodEmoji} ${entry.moodName}` : "—";
        col.innerHTML = `
            <div class="bar" style="height:${h}px;background:${color};" data-tip="${tip}"></div>
            <div class="bar-date">${label}</div>
        `;
        container.appendChild(col);
    });
}

function renderDonut() {
    const donutArea = document.getElementById("donutArea");
    const donutEmpty = document.getElementById("donutEmpty");
    const donutSvg = document.getElementById("donutSvg");
    const donutLegend = document.getElementById("donutLegend");
    
    if (!currentEntries.length) {
        if (donutArea) donutArea.style.display = "none";
        if (donutEmpty) donutEmpty.style.display = "block";
        return;
    }
    if (donutArea) donutArea.style.display = "flex";
    if (donutEmpty) donutEmpty.style.display = "none";
    
    const freq = {};
    currentEntries.forEach(e => { freq[e.moodName] = (freq[e.moodName] || 0) + 1; });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const total = sorted.reduce((a, b) => a + b[1], 0);
    
    const cx = 45, cy = 45, r = 30;
    let angle = -Math.PI / 2;
    let paths = "";
    sorted.forEach(([name, count], i) => {
        const slice = (count / total) * 2 * Math.PI;
        const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
        angle += slice;
        const x2 = cx + r * Math.cos(angle), y2 = cy + r * Math.sin(angle);
        const large = slice > Math.PI ? 1 : 0;
        paths += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z" fill="${DONUT_COLORS[i]}" opacity="0.85"/>`;
    });
    paths += `<circle cx="${cx}" cy="${cy}" r="${r * 0.55}" fill="var(--bg2)"/>`;
    if (donutSvg) donutSvg.innerHTML = paths;
    
    if (donutLegend) {
        donutLegend.innerHTML = "";
        sorted.slice(0, 5).forEach(([name, count], i) => {
            const pct = Math.round(count / currentEntries.length * 100);
            donutLegend.innerHTML += `<div class="legend-item"><div class="legend-dot" style="background:${DONUT_COLORS[i]}"></div><span>${name}</span><span style="margin-left:auto;font-weight:600;color:var(--text2)">${pct}%</span></div>`;
        });
    }
}

function renderTriggerRank() {
    const el = document.getElementById("triggerRank");
    if (!el) return;
    const freq = {};
    currentEntries.forEach(e => e.triggers?.forEach(t => { freq[t] = (freq[t] || 0) + 1; }));
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (!sorted.length) {
        el.innerHTML = `<div class="empty-text">Belum ada data trigger</div>`;
        return;
    }
    const max = sorted[0][1];
    el.innerHTML = sorted.map(([t, c]) =>
        `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <div style="font-size:0.78rem;width:130px;flex-shrink:0;">${t}</div>
            <div style="flex:1;background:var(--bg3);border-radius:8px;height:8px;overflow:hidden;">
                <div style="width:${(c / max) * 100}%;height:100%;background:var(--accent);border-radius:8px;"></div>
            </div>
            <div style="font-size:0.72rem;color:var(--text2);min-width:20px;text-align:right;">${c}x</div>
        </div>`
    ).join("");
}

function renderHistory() {
    const el = document.getElementById("historyList");
    const countEl = document.getElementById("historyCount");
    
    if (!el) return;
    if (countEl) countEl.textContent = currentEntries.length ? `${currentEntries.length} catatan` : "";
    
    if (!currentEntries.length) {
        el.innerHTML = `<div class="empty-state"><div class="empty-icon">🌱</div><div class="empty-text">Belum ada catatan.<br>Mulai hari ini!</div></div>`;
        return;
    }
    
    const sorted = [...currentEntries].sort((a, b) => b.date.localeCompare(a.date));
    el.innerHTML = "";
    sorted.forEach(entry => {
        const d = document.createElement("div");
        d.className = "history-item";
        d.innerHTML = `
            <div class="history-emoji">${entry.moodEmoji}</div>
            <div class="history-body">
                <div class="history-top">
                    <div class="history-mood">${entry.moodName} ${entry.intensity ? `(${entry.intensity}/5)` : ""}</div>
                    <div class="history-date">${dateLabel(entry.date)}</div>
                </div>
                ${entry.energy ? `<div style="font-size:0.72rem;color:var(--text2);margin-top:2px;">${entry.energy}</div>` : ""}
                <div class="history-chips">${entry.triggers?.map(t => `<span class="tiny-chip">${t}</span>`).join("") || ""}</div>
                ${entry.note ? `<div class="history-note">${escapeHtml(entry.note)}</div>` : ""}
            </div>
            <button class="delete-btn" data-date="${entry.date}" title="Hapus">🗑</button>
        `;
        const deleteBtn = d.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleDeleteEntry(entry.date);
        });
        el.appendChild(d);
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

async function handleDeleteEntry(date) {
    if (!confirm("Hapus catatan ini?")) return;
    const success = await deleteEntryFromAPI(date);
    if (success) {
        await refreshData();
        showToast("🗑 Dihapus");
    } else {
        showToast("Gagal menghapus");
    }
}

async function refreshData() {
    currentEntries = await fetchEntries();
    renderAll();
}

function renderAll() {
    renderGreeting();
    loadToday();
    renderStats();
    renderHistory();
}