// Main Application

document.addEventListener('DOMContentLoaded', async () => {
    // Load data from server
    currentEntries = await fetchEntries();
    
    // Setup event listeners
    setupEventListeners();
    
    // Apply saved theme
    applyTheme();
    
    // Render everything
    renderAll();
    
    // Load AI content for insight panel
    loadQuote();
    loadTip();
});

function setupEventListeners() {
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
        saveBtn.addEventListener("click", async () => {
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
                await refreshData();
                showToast("✅ Tersimpan!");
                generateDailyInsight(entry);
            } else {
                showToast("❌ Gagal menyimpan");
            }
        });
    }
    
    // Theme toggle
    const themeBtn = document.getElementById("themeToggle");
    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            const dark = document.documentElement.getAttribute("data-theme") === "dark";
            localStorage.setItem("mm_dark", dark ? "0" : "1");
            applyTheme();
        });
    }
    
    // Navigation
    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", () => {
            document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            const target = item.dataset.panel;
            document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
            const targetPanel = document.getElementById(target);
            if (targetPanel) targetPanel.classList.add("active");
            
            if (target === "panel-insight") {
                loadQuote();
                loadTip();
            }
        });
    });
    
    // Weekly insight button (initial)
    const weeklyBtn = document.getElementById("weeklyInsightBtn");
    if (weeklyBtn) {
        weeklyBtn.addEventListener("click", generateWeeklyInsight);
    }
}

function applyTheme() {
    const dark = localStorage.getItem("mm_dark") === "1";
    if (dark) {
        document.documentElement.setAttribute("data-theme", "dark");
        const themeBtn = document.getElementById("themeToggle");
        if (themeBtn) themeBtn.textContent = "☀️";
    } else {
        document.documentElement.removeAttribute("data-theme");
        const themeBtn = document.getElementById("themeToggle");
        if (themeBtn) themeBtn.textContent = "🌙";
    }
}