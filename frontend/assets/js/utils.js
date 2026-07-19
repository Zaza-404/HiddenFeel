// Helper Functions

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

function dateLabel(str) {
    const d = new Date(str + "T12:00:00");
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function showToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2200);
}

function calcStreak(entries) {
    if (!entries.length) return 0;
    const dates = new Set(entries.map(e => e.date));
    let streak = 0;
    const d = new Date();
    while (dates.has(d.toISOString().slice(0, 10))) {
        streak++;
        d.setDate(d.getDate() - 1);
    }
    return streak;
}

function getTopTrigger(entries) {
    const freq = {};
    entries.forEach(e => e.triggers?.forEach(t => { freq[t] = (freq[t] || 0) + 1; }));
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || "pekerjaan";
}

function getAvgMood(entries) {
    if (!entries.length) return "3";
    return (entries.reduce((a, e) => a + e.moodVal, 0) / entries.length).toFixed(1);
}

function getLast7DaysEntries(entries) {
    return entries.filter(e => {
        const d = new Date(e.date + "T12:00:00");
        const now = new Date();
        return (now - d) <= 7 * 86400000;
    });
}