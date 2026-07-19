// Stats Page Specific Logic

// Render Bar Chart
function renderBarChart() {
    const container = document.getElementById("barChart");
    if (!container) return;
    container.innerHTML = "";
    
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const str = d.toISOString().slice(0, 10);
        const entry = entries.find(e => e.date === str);
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

// Render Donut Chart
function renderDonut() {
    const donutArea = document.getElementById("donutArea");
    const donutEmpty = document.getElementById("donutEmpty");
    const donutSvg = document.getElementById("donutSvg");
    const donutLegend = document.getElementById("donutLegend");
    
    if (!entries.length) {
        if (donutArea) donutArea.style.display = "none";
        if (donutEmpty) donutEmpty.style.display = "block";
        return;
    }
    if (donutArea) donutArea.style.display = "flex";
    if (donutEmpty) donutEmpty.style.display = "none";
    
    const freq = {};
    entries.forEach(e => { freq[e.moodName] = (freq[e.moodName] || 0) + 1; });
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
            const pct = Math.round(count / entries.length * 100);
            donutLegend.innerHTML += `<div class="legend-item"><div class="legend-dot" style="background:${DONUT_COLORS[i]}"></div><span>${name}</span><span style="margin-left:auto;font-weight:600;color:var(--text2)">${pct}%</span></div>`;
        });
    }
}

// Render Trigger Rank
function renderTriggerRank() {
    const el = document.getElementById("triggerRank");
    if (!el) return;
    const freq = {};
    entries.forEach(e => e.triggers?.forEach(t => { freq[t] = (freq[t] || 0) + 1; }));
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

// Render Stats Summary
function renderStatsSummary() {
    const streak = calcStreak(entries);
    const statTotal = document.getElementById("statTotal");
    const statStreak2 = document.getElementById("statStreak2");
    const statAvg = document.getElementById("statAvg");
    const weeklyBadge = document.getElementById("weeklyBadge");
    
    if (statTotal) statTotal.textContent = entries.length;
    if (statStreak2) statStreak2.textContent = streak;
    
    if (entries.length) {
        const avg = (entries.reduce((a, e) => a + e.moodVal, 0) / entries.length).toFixed(1);
        if (statAvg) statAvg.textContent = avg;
    } else {
        if (statAvg) statAvg.textContent = "—";
    }
    
    if (weeklyBadge) weeklyBadge.style.display = streak >= 7 ? "flex" : "none";
}

// Render All Stats
function renderAllStats() {
    renderStatsSummary();
    renderBarChart();
    renderDonut();
    renderTriggerRank();
}

// Load Data and Render
async function loadStatsData() {
    entries = await fetchEntries();
    renderAllStats();
    updateStreakDisplay();
    setActiveNav();
    initTheme();
}

// Start
loadStatsData();