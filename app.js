/* ============================================
   App.js — Point d'entree & initialisation
   ============================================ */

/* ---- Theme ---- */

function initTheme() {
    var saved = localStorage.getItem(App.STORAGE_KEYS.theme);
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'light' || (!saved && !prefersDark)) {
        document.documentElement.classList.add('light');
    }
}

function toggleTheme() {
    var isLight = document.documentElement.classList.toggle('light');
    localStorage.setItem(App.STORAGE_KEYS.theme, isLight ? 'light' : 'dark');

    // Update icon
    var themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        var icon = themeToggle.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', isLight ? 'sun' : 'moon');
            lucide.createIcons({ nodes: [themeToggle] });
        }
    }
}

// Init theme avant le DOM pour eviter le flash
initTheme();

/* ---- DOMContentLoaded ---- */

document.addEventListener('DOMContentLoaded', function() {
    // 1. Init icons
    lucide.createIcons();

    // 2. Theme toggle
    var themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);

        // Set correct icon on load
        var isLight = document.documentElement.classList.contains('light');
        var icon = themeToggle.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', isLight ? 'sun' : 'moon');
            lucide.createIcons({ nodes: [themeToggle] });
        }
    }

    // 3. Load saved state
    App.loadSavedState();

    // 4. Init event listeners
    App.initEventListeners();

    // 4b. Init editor event listeners
    App.initEditorEvents();

    // 5. Sync UI from state
    App.syncUIFromState();

    // 6. Init IndexedDB puis charger la galerie
    App.initDB().then(function() {
        App.loadGallery().then(function() {
            var wrapper = document.getElementById('galleryWrapper');
            var loader = document.getElementById('galleryLoader');
            if (wrapper) wrapper.classList.remove('loading');
            if (loader) loader.remove();
        });
    });

    // 7. Verifier nouveaux modeles image OpenAI
    App.checkNewModels();
});
