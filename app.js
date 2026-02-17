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
}

// Init theme avant le DOM pour eviter le flash
initTheme();

/* ---- DOMContentLoaded ---- */

document.addEventListener('DOMContentLoaded', function() {
    // 1. Init icons
    lucide.createIcons();

    // 2. Toggle panels
    document.getElementById('togglePanels').addEventListener('click', function() {
        document.body.classList.toggle('panels-hidden');
        var isHidden = document.body.classList.contains('panels-hidden');
        var newIcon = isHidden ? 'square' : 'columns-3';
        var svg = this.querySelector('svg');
        if (svg) {
            var newI = document.createElement('i');
            newI.setAttribute('data-lucide', newIcon);
            svg.replaceWith(newI);
            lucide.createIcons({ nodes: [newI] });
        }
    });

    // 2a. Theme toggle
    var themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // 2b. About modal
    var aboutModal = document.getElementById('aboutModal');
    document.getElementById('aboutBtn').addEventListener('click', function() {
        aboutModal.classList.add('show');
        lucide.createIcons({ nodes: [aboutModal] });
    });
    document.getElementById('aboutClose').addEventListener('click', function() {
        aboutModal.classList.remove('show');
    });
    aboutModal.addEventListener('click', function(e) {
        if (e.target === aboutModal) aboutModal.classList.remove('show');
    });

    // 3. Load saved state
    App.loadSavedState();

    // 4. Init event listeners
    App.initEventListeners();

    // 4b. Init editor event listeners
    App.initEditorEvents();

    // 4c. Init community
    App.initCommunity();
    App.initCommunityEvents();

    // 4d. Init auth
    App.initAuth();
    App.initAuthEvents();

    // 5. Sync UI from state
    App.syncUIFromState();

    // 6. Init IndexedDB puis charger la galerie
    App.initDB().then(function() {
        App.loadGallery().then(function() {
            // Nettoyer les flags de partage orphelins (pas de _sharedId)
            var dirty = false;
            for (var i = 0; i < App.state.generations.length; i++) {
                var g = App.state.generations[i];
                if (g._sharedToCommunity && !g._sharedId) {
                    g._sharedToCommunity = false;
                    dirty = true;
                }
            }
            if (dirty) {
                App.saveGallery();
                App.renderFullGallery();
            }

            var wrapper = document.getElementById('galleryWrapper');
            var loader = document.getElementById('galleryLoader');
            if (wrapper) wrapper.classList.remove('loading');
            if (loader) loader.remove();
        });
    });

    // 7. Verifier nouveaux modeles image OpenAI
    App.checkNewModels();
});
