// History Page Specific Logic

// Render History List
function renderHistoryList() {
    const el = document.getElementById("historyList");
    const countEl = document.getElementById("historyCount");
    
    if (!el) return;
    if (countEl) countEl.textContent = entries.length ? `${entries.length} catatan` : "";
    
    if (!entries.length) {
        el.innerHTML = `<div class="empty-state"><div class="empty-icon">🌱</div><div class="empty-text">Belum ada catatan.<br>Mulai hari ini!</div></div>`;
        return;
    }
    
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
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
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!confirm("Hapus catatan ini?")) return;
            const success = await deleteEntryFromAPI(entry.date);
            if (success) {
                entries = await fetchEntries();
                renderHistoryList();
                updateStreakDisplay();
                showToast("🗑 Dihapus");
            } else {
                showToast("Gagal menghapus");
            }
        });
        el.appendChild(d);
    });
}

// Load Data and Render
async function loadHistoryData() {
    entries = await fetchEntries();
    renderHistoryList();
    updateStreakDisplay();
    setActiveNav();
    initTheme();
}

// Start
loadHistoryData();