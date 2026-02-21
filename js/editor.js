/* ============================================
   Editor — Orchestration & lifecycle
   Ouverture, fermeture, sauvegarde, reset
   Les autres responsabilites sont dans :
   - editor-layers.js  (gestion des layers)
   - editor-preview.js (preview, sync DOM, export)
   - editor-events.js  (event listeners)
   ============================================ */

var App = window.App || {};

/* ---- Helper : layer actif ---- */

App._editorActiveLayer = function() {
    var s = App.state.editor;
    if (!s.layers || !s.layers.length) return null;
    return s.layers[s.activeLayerIndex] || s.layers[0];
};

/* ---- Ouvrir l'editeur ---- */

App.openEditor = function(generation) {
    var idx = App.state.generations.indexOf(generation);
    App.state.editor.active = true;
    App.state.editor.generationIndex = idx;

    // Restaurer les reglages sauvegardes ou utiliser les defaults
    var saved = generation.editorSettings;
    var defaults = App.EDITOR_DEFAULTS;

    // Restaurer les props de fond et export
    var bgKeys = ['bgType', 'bgColor', 'gradientCenter', 'gradientEdge', 'linearAngle', 'linearStart', 'linearEnd', 'exportSize'];
    for (var i = 0; i < bgKeys.length; i++) {
        var key = bgKeys[i];
        App.state.editor[key] = (saved && saved.hasOwnProperty(key)) ? saved[key] : defaults[key];
    }

    // Restaurer meshColors (array, copie)
    if (saved && saved.meshColors && saved.meshColors.length) {
        App.state.editor.meshColors = saved.meshColors.slice();
    } else {
        App.state.editor.meshColors = defaults.meshColors.slice();
    }

    // Si le fond est en mode checkerboard, passer en mode 'none'
    if (App.state.editor.bgColor === 'checkerboard') {
        App.state.editor.bgType = 'none';
        App.state.editor.bgColor = defaults.bgColor;
    }

    // Fallback : fond depuis previewBg ou transparent si pas de reglages sauvegardes
    if (!saved) {
        if (generation.previewBg === 'checkerboard' || (!generation.previewBg && generation.transparent)) {
            App.state.editor.bgType = 'none';
        } else if (generation.previewBg) {
            App.state.editor.bgColor = generation.previewBg;
        }
    }

    // Restaurer les layers
    if (saved && saved.layers && saved.layers.length) {
        // Deep copy des layers sauvegardes
        App.state.editor.layers = [];
        for (var li = 0; li < saved.layers.length; li++) {
            var layerCopy = {};
            var srcLayer = saved.layers[li];
            for (var lk in App.LAYER_DEFAULTS) {
                if (App.LAYER_DEFAULTS.hasOwnProperty(lk)) {
                    layerCopy[lk] = srcLayer.hasOwnProperty(lk) ? srcLayer[lk] : App.LAYER_DEFAULTS[lk];
                }
            }
            App.state.editor.layers.push(layerCopy);
        }
        App.state.editor.activeLayerIndex = saved.activeLayerIndex || 0;
    } else {
        // Migration depuis ancien format ou nouveau : creer un layer unique
        var layerDefaults = App.LAYER_DEFAULTS;
        var layer0 = {};
        for (var dk in layerDefaults) {
            if (layerDefaults.hasOwnProperty(dk)) {
                layer0[dk] = (saved && saved.hasOwnProperty(dk)) ? saved[dk] : layerDefaults[dk];
            }
        }
        layer0.imageBase64 = generation.imageBase64;
        App.state.editor.layers = [layer0];
        App.state.editor.activeLayerIndex = 0;
    }

    // Show the canvas wrap, hide placeholder
    var placeholder = document.getElementById('previewPlaceholder');
    var canvasWrap = document.getElementById('editorCanvasWrap');
    if (placeholder) placeholder.classList.add('hidden');
    if (canvasWrap) canvasWrap.classList.remove('hidden');

    // Enable toolbar right (no panel open by default)
    var toolbarRight = document.getElementById('toolbarRight');
    if (toolbarRight) {
        toolbarRight.classList.remove('disabled');
    }
    var exportBtn = document.getElementById('editorExportBtn');
    if (exportBtn) exportBtn.classList.remove('hidden');

    // Render les images et la layer list
    App._renderLayerImages(function() {
        App.updateEditorPreview();
    });
    App._renderLayerList();
    App._editorSyncControls();
    App._editorUpdateAddBtn();
};

/* ---- Debounced save (evite IndexedDB writes a chaque frame) ---- */

App._editorSaveTimer = null;

App._editorScheduleSave = function() {
    if (App._editorSaveTimer) return;
    App._editorSaveTimer = setTimeout(function() {
        App._editorSaveTimer = null;
        App._editorSave();
    }, 300);
};

/* ---- Sauvegarder les reglages sur la generation ---- */

App._editorSave = function() {
    var idx = App.state.editor.generationIndex;
    var gen = App.state.generations[idx];
    if (!gen) return;

    var s = App.state.editor;
    var settings = {
        bgType: s.bgType,
        bgColor: s.bgType === 'none' ? 'checkerboard' : s.bgColor,
        gradientCenter: s.gradientCenter,
        gradientEdge: s.gradientEdge,
        linearAngle: s.linearAngle,
        linearStart: s.linearStart,
        linearEnd: s.linearEnd,
        meshColors: s.meshColors ? s.meshColors.slice() : App.EDITOR_DEFAULTS.meshColors.slice(),
        exportSize: s.exportSize,
        activeLayerIndex: s.activeLayerIndex
    };

    // Synchroniser previewBg avec le type de fond
    gen.previewBg = (s.bgType === 'none') ? 'checkerboard' : s.bgColor;

    // Deep copy layers
    if (s.layers && s.layers.length) {
        settings.layers = [];
        for (var i = 0; i < s.layers.length; i++) {
            var layerCopy = {};
            var src = s.layers[i];
            for (var k in App.LAYER_DEFAULTS) {
                if (App.LAYER_DEFAULTS.hasOwnProperty(k)) {
                    layerCopy[k] = src[k];
                }
            }
            settings.layers.push(layerCopy);
        }
    }

    gen.editorSettings = settings;
    App._editorSaveGeneration(gen);
};

/* ---- Save ciblé : un seul record IndexedDB ---- */

App._editorSaveGeneration = function(gen) {
    if (!App._db || !gen) return;
    var tx = App._db.transaction(App._DB_STORE, 'readwrite');
    tx.objectStore(App._DB_STORE).put(gen);
};

/* ---- Fermer l'editeur ---- */

App.closeEditor = function() {
    if (App._editorSaveTimer) {
        clearTimeout(App._editorSaveTimer);
        App._editorSaveTimer = null;
    }
    App._editorSave();
    var gen = App.state.generations[App.state.editor.generationIndex];
    App.state.editor.active = false;

    // Disable toolbar right and reset active panel
    var toolbarRight = document.getElementById('toolbarRight');
    if (toolbarRight) toolbarRight.classList.add('disabled');
    var exportBtn2 = document.getElementById('editorExportBtn');
    if (exportBtn2) exportBtn2.classList.add('hidden');
    App._activeRightPanel = null;
    var panel = document.getElementById('toolbarRightPanel');
    if (panel) panel.classList.add('hidden');
    var allBtns = document.querySelectorAll('.toolbar-right-btn');
    for (var i = 0; i < allBtns.length; i++) allBtns[i].classList.remove('active');
    var allPanels = document.querySelectorAll('.toolbar-right-panel .panel-float');
    for (var j = 0; j < allPanels.length; j++) allPanels[j].classList.add('hidden');

    // Rafraichir la card editee dans la galerie
    if (gen) App.refreshGalleryCard(gen);

    // Fermer le picker si ouvert
    App._closeLayerPicker();

    // Keep the preview showing the last image (don't go back to placeholder)
};

/* ---- Reset : revenir a un seul layer avec params par defaut ---- */

App.resetEditor = function() {
    var s = App.state.editor;
    var layers = s.layers || [];
    if (!layers.length) return;

    // Garder l'image du premier layer original (celui de la generation)
    var idx = s.generationIndex;
    var gen = App.state.generations[idx];
    var baseImage = gen ? gen.imageBase64 : layers[0].imageBase64;

    // Reset fond (preserver le mode transparent)
    var defaults = App.EDITOR_DEFAULTS;
    if (gen && (gen.previewBg === 'checkerboard' || (!gen.previewBg && gen.transparent))) {
        s.bgType = 'none';
        s.bgColor = defaults.bgColor;
    } else {
        s.bgType = defaults.bgType;
        s.bgColor = (gen && gen.previewBg && gen.previewBg !== 'checkerboard') ? gen.previewBg : defaults.bgColor;
    }
    s.gradientCenter = defaults.gradientCenter;
    s.gradientEdge = defaults.gradientEdge;
    s.linearAngle = defaults.linearAngle;
    s.linearStart = defaults.linearStart;
    s.linearEnd = defaults.linearEnd;
    s.meshColors = defaults.meshColors.slice();

    // Reset layers : un seul layer avec valeurs par defaut
    var layerDefaults = App.LAYER_DEFAULTS;
    var freshLayer = {};
    for (var k in layerDefaults) {
        if (layerDefaults.hasOwnProperty(k)) {
            freshLayer[k] = layerDefaults[k];
        }
    }
    freshLayer.imageBase64 = baseImage;

    s.layers = [freshLayer];
    s.activeLayerIndex = 0;

    // Re-render tout
    App._renderLayerImages(function() {
        App.updateEditorPreview();
    });
    App._renderLayerList();
    App._editorSyncControls();
    App._editorUpdateAddBtn();
};
