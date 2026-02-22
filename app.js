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

    // 2c. Gallery overlay
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
        App.loadGallery().then(function() {
            if (App.state.generations.length === 0) {
                App._seedDefaultGallery();
            } else {
                App.openEditor(App.state.generations[0]);
            }
        });
    });

    // 9. Verifier nouveaux modeles image OpenAI
    App.checkNewModels();

    // 10. Size dropdown
    var sizeBtn = document.getElementById('sizeDropdownBtn');
    var sizeMenu = document.getElementById('sizeDropdownMenu');
    var sizeLabel = document.getElementById('sizeDropdownLabel');
    var canvasStack = document.querySelector('.canvas-stack');
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
            canvasStack.style.maxWidth = SIZE_MAP[size] + 'px';
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
        var chip = document.createElement('button');
        chip.className = 'style-chip';
        chip.setAttribute('data-preset', id);
        chip.textContent = preset.name;
        container.appendChild(chip);
    }
};

/* ---- Build axes segmented controls in options section ---- */

App._buildAxesSliders = function() {
    var ribbon = document.getElementById('axesSliders');
    if (!ribbon) return;

    var container = document.createElement('div');
    container.className = 'axes-ribbon-inner';

    var stops = [0, 50, 100];

    for (var i = 0; i < App.AXES.length; i++) {
        var axis = App.AXES[i];
        var col = document.createElement('div');
        col.className = 'axis-col';
        col.setAttribute('data-axis', axis.key);

        var label = document.createElement('span');
        label.className = 'axis-label';
        label.textContent = axis.key.charAt(0).toUpperCase() + axis.key.slice(1);
        col.appendChild(label);

        var seg = document.createElement('div');
        seg.className = 'segmented segmented-vertical';
        seg.id = 'axis-' + axis.key;

        var labels = [axis.labelMin, axis.labelMid, axis.labelMax];
        var currentVal = App.state.axes[axis.key];

        for (var s = 0; s < stops.length; s++) {
            var btn = document.createElement('button');
            btn.className = 'seg-btn';
            btn.setAttribute('data-value', stops[s]);
            btn.textContent = labels[s];
            if (stops[s] === currentVal) btn.classList.add('active');
            seg.appendChild(btn);
        }

        col.appendChild(seg);
        container.appendChild(col);
    }

    // Material + Color column
    var matCol = document.createElement('div');
    matCol.className = 'axis-col';
    var matLabel = document.createElement('span');
    matLabel.className = 'axis-label';
    matLabel.textContent = 'Material';
    matCol.appendChild(matLabel);
    var matControls = document.createElement('div');
    matControls.className = 'axis-col-controls';
    var matSelect = document.createElement('select');
    matSelect.id = 'materialSelect';
    matControls.appendChild(matSelect);
    var colorWrap = document.createElement('div');
    colorWrap.className = 'color-picker-wrap';
    colorWrap.innerHTML =
        '<input type="color" id="colorPicker" value="#4A90D9" class="inactive">' +
        '<span class="color-picker-label" id="colorPickerLabel">Color</span>' +
        '<button class="btn-icon btn-sm color-picker-reset hidden" id="colorPickerReset" title="Reset">' +
        '<i data-lucide="x"></i></button>';
    matControls.appendChild(colorWrap);
    matCol.appendChild(matControls);
    container.appendChild(matCol);

    ribbon.appendChild(container);
};

/* ---- Seed default gallery on first launch ---- */

App._fetchAsBase64 = function(url) {
    return fetch(url)
        .then(function(r) { return r.blob(); })
        .then(function(blob) {
            return new Promise(function(resolve) {
                var reader = new FileReader();
                reader.onloadend = function() { resolve(reader.result.split(',')[1]); };
                reader.readAsDataURL(blob);
            });
        });
};

App._seedDefaultGallery = function() {
    var base = {
        model: '', userPrompt: '', enrichedPrompt: '', stylePreset: '',
        quality: 'medium', transparent: true, duration: 0,
        axes: { volume: 50, color: 50, shape: 50, detail: 50, text: 0 }
    };

    return Promise.all([
        App._fetchAsBase64('assets/default/1.png'),
        App._fetchAsBase64('assets/default/2.png')
    ]).then(function(images) {
        // 1. Image 1 seule
        var entry1 = Object.assign({}, base, {
            timestamp: 1,
            imageBase64: images[0],
            previewBg: 'checkerboard'
        });
        App.addToGallery(entry1);

        // 2. Image 2 seule
        var entry2 = Object.assign({}, base, {
            timestamp: 2,
            imageBase64: images[1],
            previewBg: 'checkerboard'
        });
        App.addToGallery(entry2);

        // 3. Composition multi-layer
        var composition = Object.assign({}, base, {
            timestamp: 3,
            imageBase64: images[0],
            previewBg: '#FFE2D6',
            editorSettings: {
                bgType: 'solid',
                bgColor: '#FFE2D6',
                gradientCenter: '#5BC0EB',
                gradientEdge: '#2E6EA6',
                linearAngle: 180,
                linearStart: '#5BC0EB',
                linearEnd: '#2E6EA6',
                meshColors: ['#5BC0EB', '#3A86C8', '#48B8D0', '#2E6EA6'],
                exportSize: 1024,
                activeLayerIndex: 0,
                layers: [
                    {
                        imageBase64: images[1],
                        scale: 100, rotation: 0, offsetX: 0, offsetY: 0, opacity: 100,
                        tintEnabled: false, tintColor: '#5A9FD4',
                        shadowEnabled: false, shadowBlur: 20, shadowOffsetY: 8, shadowOpacity: 40, shadowColor: '#1A1A2E'
                    },
                    {
                        imageBase64: images[0],
                        scale: 50, rotation: 3, offsetX: 0, offsetY: 8, opacity: 90,
                        tintEnabled: false, tintColor: '#5A9FD4',
                        shadowEnabled: false, shadowBlur: 20, shadowOffsetY: 8, shadowOpacity: 40, shadowColor: '#1A1A2E'
                    }
                ]
            }
        });
        App.addToGallery(composition);
        App.openEditor(composition);
    });
};
