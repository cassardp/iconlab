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
    var bgKeys = ['bgType', 'bgColor', 'gradientCenter', 'gradientEdge', 'exportSize'];
    for (var i = 0; i < bgKeys.length; i++) {
        var key = bgKeys[i];
        App.state.editor[key] = (saved && saved.hasOwnProperty(key)) ? saved[key] : defaults[key];
    }

    // Si le fond est en mode checkerboard, passer en mode 'none'
    if (App.state.editor.bgColor === 'checkerboard') {
        App.state.editor.bgType = 'none';
        App.state.editor.bgColor = defaults.bgColor;
    }

    // Fallback : couleur de fond depuis previewBg si pas de reglages sauvegardes
    if (!saved && generation.previewBg && generation.previewBg !== 'checkerboard') {
        App.state.editor.bgColor = generation.previewBg;
    }
    if (!saved && generation.previewBg === 'checkerboard') {
        App.state.editor.bgType = 'none';
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

    // Cacher la galerie et la communaute
    var galleryToolbar = document.getElementById('galleryToolbar');
    var galleryWrapper = document.querySelector('.gallery-wrapper');
    var communityWrapper = document.getElementById('communityWrapper');
    if (galleryToolbar) galleryToolbar.classList.add('hidden');
    if (galleryWrapper) galleryWrapper.classList.add('hidden');
    if (communityWrapper) communityWrapper.classList.add('hidden');

    // Afficher l'editeur avec loader
    var editorView = document.getElementById('editorView');
    var previewArea = editorView.querySelector('.editor-preview-area');
    editorView.classList.remove('hidden');
    previewArea.classList.add('loading');

    // Init Lucide icons dans l'editeur
    lucide.createIcons({ nodes: [editorView] });

    // Render les images et la layer list
    App._renderLayerImages(function() {
        previewArea.classList.remove('loading');
        App.updateEditorPreview();
    });
    App._renderLayerList();
    App._editorSyncControls();
    App._editorUpdateAddBtn();
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
    App.saveGallery();
};

/* ---- Fermer l'editeur ---- */

App.closeEditor = function() {
    App._editorSave();
    var gen = App.state.generations[App.state.editor.generationIndex];
    App.state.editor.active = false;

    // Reafficher le bon wrapper
    var galleryToolbar = document.getElementById('galleryToolbar');
    var galleryWrapper = document.querySelector('.gallery-wrapper');
    var communityWrapper = document.getElementById('communityWrapper');

    if (App._activeTab === 'community') {
        if (galleryToolbar) galleryToolbar.classList.add('hidden');
        if (galleryWrapper) galleryWrapper.classList.add('hidden');
        if (communityWrapper) communityWrapper.classList.remove('hidden');
    } else {
        if (galleryToolbar) galleryToolbar.classList.remove('hidden');
        if (galleryWrapper) galleryWrapper.classList.remove('hidden');
        if (communityWrapper) communityWrapper.classList.add('hidden');
    }

    // Rafraichir la card editee
    App.refreshGalleryCard(gen);

    // Cacher l'editeur
    var editorView = document.getElementById('editorView');
    editorView.classList.add('hidden');

    // Fermer le picker si ouvert
    App._closeLayerPicker();

    // Liberer la memoire
    var container = document.getElementById('editorIconContainer');
    if (container) container.innerHTML = '';
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

    // Reset fond (preserver le mode transparent si la generation est en checkerboard)
    var defaults = App.EDITOR_DEFAULTS;
    if (gen && gen.previewBg === 'checkerboard') {
        s.bgType = 'none';
        s.bgColor = defaults.bgColor;
    } else {
        s.bgType = defaults.bgType;
        s.bgColor = (gen && gen.previewBg && gen.previewBg !== 'checkerboard') ? gen.previewBg : defaults.bgColor;
    }
    s.gradientCenter = defaults.gradientCenter;
    s.gradientEdge = defaults.gradientEdge;

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
