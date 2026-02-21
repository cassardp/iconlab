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

/* ---- Style card emojis (placeholder) ---- */


/* ---- DOMContentLoaded ---- */

document.addEventListener('DOMContentLoaded', function() {
    // 1. Init icons
    lucide.createIcons();

    // 2. Theme toggle
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

    // 2c. Settings modal
    var settingsModal = document.getElementById('settingsModal');
    var settingsBtn = document.getElementById('settingsBtn');
    var settingsClose = document.getElementById('settingsModalClose');

    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            settingsModal.classList.add('show');
            lucide.createIcons({ nodes: [settingsModal] });
        });
    }
    if (settingsClose) {
        settingsClose.addEventListener('click', function() {
            settingsModal.classList.remove('show');
        });
    }
    if (settingsModal) {
        settingsModal.addEventListener('click', function(e) {
            if (e.target === settingsModal) settingsModal.classList.remove('show');
        });
    }

    // 2d. Gallery overlay
    var galleryToggle = document.getElementById('galleryToggle');
    var galleryOverlay = document.getElementById('galleryOverlay');
    var galleryClose = document.getElementById('galleryOverlayClose');

    if (galleryToggle) {
        galleryToggle.addEventListener('click', function() {
            if (App._galleryPickerMode) {
                App._closeLayerPicker();
                return;
            }
            var isOpen = galleryOverlay.classList.contains('open');
            if (!isOpen && App.state.editor.active) {
                App._editorSave();
                var gen = App.state.generations[App.state.editor.generationIndex];
                if (gen) App.refreshGalleryCard(gen);
            }
            galleryOverlay.classList.toggle('open', !isOpen);
            galleryToggle.classList.toggle('active', !isOpen);
        });
    }
    if (galleryClose) {
        galleryClose.addEventListener('click', function() {
            if (App._galleryPickerMode) {
                App._closeLayerPicker();
                return;
            }
            galleryOverlay.classList.remove('open');
            if (galleryToggle) galleryToggle.classList.remove('active');
        });
    }

    // 3. Generate style cards
    App._buildStyleCards();

    // 4. Build axes sliders in options popover
    App._buildAxesSliders();

    // 5. Load saved state
    App.loadSavedState();

    // 6. Init event listeners
    App.initEventListeners();

    // 6a. Init color picker wraps (clic wrapper ouvre le picker)
    App._initColorPickerWraps();

    // 6b. Init editor event listeners
    App.initEditorEvents();

    // 7. Sync UI from state
    App.syncUIFromState();

    // 8. Init IndexedDB puis charger la galerie
    App.initDB().then(function() {
        App.loadGallery();
    });

    // 9. Verifier nouveaux modeles image OpenAI
    App.checkNewModels();

    // 10. Size dropdown
    var sizeBtn = document.getElementById('sizeDropdownBtn');
    var sizeMenu = document.getElementById('sizeDropdownMenu');
    var sizeLabel = document.getElementById('sizeDropdownLabel');
    var previewFrame = document.getElementById('previewFrame');
    var SIZE_MAP = { 64: 64, 128: 128, 256: 256, 512: 512 };

    if (sizeBtn && sizeMenu) {
        sizeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            sizeMenu.classList.toggle('hidden');
        });
        sizeMenu.addEventListener('click', function(e) {
            var opt = e.target.closest('.topbar-size-option');
            if (!opt) return;
            var size = parseInt(opt.getAttribute('data-size'), 10);
            sizeLabel.textContent = size + 'px';
            previewFrame.style.maxWidth = SIZE_MAP[size] + 'px';
            var all = sizeMenu.querySelectorAll('.topbar-size-option');
            for (var i = 0; i < all.length; i++) all[i].classList.remove('active');
            opt.classList.add('active');
            sizeMenu.classList.add('hidden');
        });
        document.addEventListener('mousedown', function(e) {
            if (!sizeBtn.contains(e.target) && !sizeMenu.contains(e.target)) {
                sizeMenu.classList.add('hidden');
            }
        });
    }
});

/* ---- Build style cards ---- */

App._buildStyleCards = function() {
    var container = document.getElementById('styleCards');
    if (!container) return;

    for (var id in App.STYLE_PRESETS) {
        var preset = App.STYLE_PRESETS[id];
        var card = document.createElement('div');
        card.className = 'style-card';
        card.setAttribute('data-preset', id);

        var preview = document.createElement('div');
        preview.className = 'style-card-preview';
        var img = document.createElement('img');
        img.src = 'assets/styles/' + id + '.png';
        img.alt = preset.name;
        preview.appendChild(img);

        var label = document.createElement('div');
        label.className = 'style-card-label';
        label.textContent = preset.name;

        card.appendChild(preview);
        card.appendChild(label);
        container.appendChild(card);
    }
};

/* ---- Build axes sliders in options popover ---- */

App._buildAxesSliders = function() {
    var container = document.getElementById('axesSliders');
    if (!container) return;

    for (var i = 0; i < App.AXES.length; i++) {
        var axis = App.AXES[i];
        var row = document.createElement('div');
        row.className = 'setting-row';
        row.setAttribute('data-axis', axis.key);

        var label = document.createElement('span');
        label.className = 'setting-label';
        label.textContent = axis.key.charAt(0).toUpperCase() + axis.key.slice(1);

        var sliderRow = document.createElement('div');
        sliderRow.className = 'slider-row';

        var minLabel = document.createElement('span');
        minLabel.className = 'axis-bound-label';
        minLabel.textContent = axis.labelMin;

        var trackWrap = document.createElement('div');
        trackWrap.className = 'slider-track-wrap';

        var input = document.createElement('input');
        input.type = 'range';
        input.className = 'range-slider';
        input.min = '0';
        input.max = '100';
        input.step = '50';
        input.value = App.state.axes[axis.key];
        input.id = 'axis-' + axis.key;

        var maxLabel = document.createElement('span');
        maxLabel.className = 'axis-bound-label';
        maxLabel.textContent = axis.labelMax;

        trackWrap.appendChild(input);
        sliderRow.appendChild(minLabel);
        sliderRow.appendChild(trackWrap);
        sliderRow.appendChild(maxLabel);
        row.appendChild(label);
        row.appendChild(sliderRow);
        container.appendChild(row);
    }
};
