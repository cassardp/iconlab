/* ============================================
   Editor — Mode edition d'icone avec fond
   Multi-layer : fond (couleur/gradient) + 1 ou 2 layers d'icones
   Chaque layer a ses propres transforms et shadow
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

    // Fallback : couleur de fond depuis previewBg si pas de reglages sauvegardes
    if (!saved && generation.previewBg && generation.previewBg !== 'checkerboard') {
        App.state.editor.bgColor = generation.previewBg;
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

    // Cacher la galerie
    var galleryToolbar = document.getElementById('galleryToolbar');
    var galleryWrapper = document.querySelector('.gallery-wrapper');
    if (galleryToolbar) galleryToolbar.classList.add('hidden');
    if (galleryWrapper) galleryWrapper.classList.add('hidden');

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

/* ---- Render les images des layers dans le container ---- */

App._renderLayerImages = function(onAllLoaded) {
    var container = document.getElementById('editorIconContainer');
    if (!container) return;

    // Vider le container
    container.innerHTML = '';

    var layers = App.state.editor.layers || [];
    var remaining = layers.length;

    if (remaining === 0 && onAllLoaded) {
        onAllLoaded();
        return;
    }

    for (var i = 0; i < layers.length; i++) {
        (function(index) {
            var layer = layers[index];

            var wrap = document.createElement('div');
            wrap.className = 'editor-layer-wrap';
            wrap.setAttribute('data-layer-index', index);

            var img = document.createElement('img');
            img.className = 'editor-layer-image';
            img.alt = 'Layer ' + (index + 1);
            img.onload = function() {
                remaining--;
                if (remaining <= 0 && onAllLoaded) {
                    onAllLoaded();
                }
                img.onload = null;
            };
            img.src = 'data:image/png;base64,' + layer.imageBase64;

            var tintOverlay = document.createElement('div');
            tintOverlay.className = 'editor-layer-tint';
            var maskUrl = 'url(data:image/png;base64,' + layer.imageBase64 + ')';
            tintOverlay.style.setProperty('-webkit-mask-image', maskUrl);
            tintOverlay.style.setProperty('mask-image', maskUrl);

            wrap.appendChild(img);
            wrap.appendChild(tintOverlay);
            container.appendChild(wrap);
        })(i);
    }
};

/* ---- Render la liste des layers dans la sidebar ---- */

App._renderLayerList = function() {
    var listEl = document.getElementById('editorLayerList');
    if (!listEl) return;

    listEl.innerHTML = '';
    var layers = App.state.editor.layers || [];
    var active = App.state.editor.activeLayerIndex;

    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        var item = document.createElement('div');
        item.className = 'editor-layer-item' + (i === active ? ' active' : '');
        item.setAttribute('data-layer-index', i);

        var thumb = document.createElement('img');
        thumb.className = 'editor-layer-thumb';
        thumb.src = 'data:image/png;base64,' + layer.imageBase64;
        thumb.alt = '';

        var name = document.createElement('span');
        name.className = 'editor-layer-name';
        name.textContent = 'Icon ' + (i + 1);

        var actions = document.createElement('div');
        actions.className = 'editor-layer-actions';

        // Bouton monter
        if (layers.length > 1) {
            var upBtn = document.createElement('button');
            upBtn.className = 'btn-icon btn-xs';
            upBtn.title = 'Move up';
            upBtn.setAttribute('data-action', 'move-up');
            upBtn.innerHTML = '<i data-lucide="chevron-up"></i>';
            if (i === 0) upBtn.style.visibility = 'hidden';
            actions.appendChild(upBtn);

            var downBtn = document.createElement('button');
            downBtn.className = 'btn-icon btn-xs';
            downBtn.title = 'Move down';
            downBtn.setAttribute('data-action', 'move-down');
            downBtn.innerHTML = '<i data-lucide="chevron-down"></i>';
            if (i === layers.length - 1) downBtn.style.visibility = 'hidden';
            actions.appendChild(downBtn);
        }

        // Bouton supprimer (cache si un seul layer)
        if (layers.length > 1) {
            var delBtn = document.createElement('button');
            delBtn.className = 'btn-icon btn-xs';
            delBtn.title = 'Remove layer';
            delBtn.setAttribute('data-action', 'delete');
            delBtn.innerHTML = '<i data-lucide="x"></i>';
            actions.appendChild(delBtn);
        }

        item.appendChild(thumb);
        item.appendChild(name);
        item.appendChild(actions);
        listEl.appendChild(item);
    }

    // Init lucide dans la layer list
    lucide.createIcons({ nodes: [listEl] });
};

/* ---- Selectionner un layer ---- */

App.selectEditorLayer = function(index) {
    var layers = App.state.editor.layers || [];
    if (index < 0 || index >= layers.length) return;

    App.state.editor.activeLayerIndex = index;

    // Update highlight dans la liste
    var items = document.querySelectorAll('.editor-layer-item');
    for (var i = 0; i < items.length; i++) {
        items[i].classList.toggle('active', i === index);
    }

    // Sync les controles avec le layer selectionne
    App._editorSyncControls();
};

/* ---- Ajouter un layer depuis la galerie ---- */

App.addEditorLayer = function(generation) {
    var layers = App.state.editor.layers || [];
    if (layers.length >= 2) return; // Max 2 layers

    var layerDefaults = App.LAYER_DEFAULTS;
    var newLayer = {};
    for (var k in layerDefaults) {
        if (layerDefaults.hasOwnProperty(k)) {
            newLayer[k] = layerDefaults[k];
        }
    }
    newLayer.imageBase64 = generation.imageBase64;

    layers.push(newLayer);
    App.state.editor.activeLayerIndex = layers.length - 1;

    // Fermer le picker
    App._closeLayerPicker();

    // Re-render
    App._renderLayerImages(function() {
        App.updateEditorPreview();
    });
    App._renderLayerList();
    App._editorSyncControls();
    App._editorUpdateAddBtn();
};

/* ---- Supprimer un layer ---- */

App.removeEditorLayer = function(index) {
    var layers = App.state.editor.layers || [];
    if (layers.length <= 1) return; // Ne pas supprimer le dernier

    layers.splice(index, 1);

    // Ajuster l'index actif
    if (App.state.editor.activeLayerIndex >= layers.length) {
        App.state.editor.activeLayerIndex = layers.length - 1;
    }

    // Re-render
    App._renderLayerImages(function() {
        App.updateEditorPreview();
    });
    App._renderLayerList();
    App._editorSyncControls();
    App._editorUpdateAddBtn();
};

/* ---- Reordonner un layer ---- */

App.reorderEditorLayer = function(fromIndex, direction) {
    var layers = App.state.editor.layers || [];
    var toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= layers.length) return;

    // Swap
    var temp = layers[fromIndex];
    layers[fromIndex] = layers[toIndex];
    layers[toIndex] = temp;

    // Suivre le layer actif
    if (App.state.editor.activeLayerIndex === fromIndex) {
        App.state.editor.activeLayerIndex = toIndex;
    } else if (App.state.editor.activeLayerIndex === toIndex) {
        App.state.editor.activeLayerIndex = fromIndex;
    }

    // Re-render
    App._renderLayerImages(function() {
        App.updateEditorPreview();
    });
    App._renderLayerList();
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

    // Reset fond
    var defaults = App.EDITOR_DEFAULTS;
    s.bgType = defaults.bgType;
    s.bgColor = defaults.bgColor;
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

/* ---- Mettre a jour le bouton ajouter ---- */

App._editorUpdateAddBtn = function() {
    var btn = document.getElementById('editorAddLayerBtn');
    if (!btn) return;
    var layers = App.state.editor.layers || [];
    btn.disabled = layers.length >= 2;
    btn.style.opacity = layers.length >= 2 ? '0.3' : '1';
};

/* ---- Layer picker ---- */

App._openLayerPicker = function() {
    var picker = document.getElementById('editorLayerPicker');
    var grid = document.getElementById('editorLayerPickerGrid');
    if (!picker || !grid) return;

    grid.innerHTML = '';

    var generations = App.state.generations || [];
    var currentLayers = App.state.editor.layers || [];

    // Collecter les base64 deja utilises
    var usedBase64 = {};
    for (var i = 0; i < currentLayers.length; i++) {
        usedBase64[currentLayers[i].imageBase64] = true;
    }

    var count = 0;
    for (var j = 0; j < generations.length; j++) {
        var gen = generations[j];
        if (usedBase64[gen.imageBase64]) continue;

        count++;
        (function(generation) {
            var item = document.createElement('div');
            item.className = 'editor-layer-picker-item';
            var img = document.createElement('img');
            img.src = 'data:image/png;base64,' + generation.imageBase64;
            img.alt = 'Icon';
            item.appendChild(img);
            item.addEventListener('click', function() {
                App.addEditorLayer(generation);
            });
            grid.appendChild(item);
        })(gen);
    }

    if (count === 0) {
        var empty = document.createElement('div');
        empty.className = 'editor-layer-picker-empty';
        empty.textContent = 'No other icons available. Generate more icons first.';
        grid.appendChild(empty);
    }

    picker.classList.remove('hidden');
};

App._closeLayerPicker = function() {
    var picker = document.getElementById('editorLayerPicker');
    if (picker) picker.classList.add('hidden');
};

/* ---- Sauvegarder les reglages sur la generation ---- */

App._editorSave = function() {
    var idx = App.state.editor.generationIndex;
    var gen = App.state.generations[idx];
    if (!gen) return;

    var s = App.state.editor;
    var settings = {
        bgType: s.bgType,
        bgColor: s.bgColor,
        gradientCenter: s.gradientCenter,
        gradientEdge: s.gradientEdge,
        exportSize: s.exportSize,
        activeLayerIndex: s.activeLayerIndex
    };

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
    var editedIndex = App.state.editor.generationIndex;
    App.state.editor.active = false;

    // Reafficher la galerie
    var galleryToolbar = document.getElementById('galleryToolbar');
    var galleryWrapper = document.querySelector('.gallery-wrapper');
    if (galleryToolbar) galleryToolbar.classList.remove('hidden');
    if (galleryWrapper) galleryWrapper.classList.remove('hidden');

    // Rafraichir la card editee dans la galerie
    App.refreshGalleryCard(editedIndex);

    // Cacher l'editeur
    var editorView = document.getElementById('editorView');
    editorView.classList.add('hidden');

    // Fermer le picker si ouvert
    App._closeLayerPicker();

    // Liberer la memoire
    var container = document.getElementById('editorIconContainer');
    if (container) container.innerHTML = '';
};

/* ---- Mise a jour preview live ---- */

App.updateEditorPreview = function() {
    var s = App.state.editor;
    var canvasWrap = document.querySelector('.editor-canvas-wrap');
    if (!canvasWrap) return;

    // Calque fond
    if (s.bgType === 'solid') {
        canvasWrap.style.background = s.bgColor;
    } else {
        canvasWrap.style.background =
            'radial-gradient(circle, ' + s.gradientCenter + ', ' + s.gradientEdge + ')';
    }

    // Appliquer transforms et shadow a chaque layer
    var layers = s.layers || [];
    var wraps = document.querySelectorAll('.editor-layer-wrap');

    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        var wrap = wraps[i];
        if (!wrap) continue;
        var img = wrap.querySelector('.editor-layer-image');
        var tint = wrap.querySelector('.editor-layer-tint');

        // Transform : scale, rotation, offset (sur le wrapper)
        var transforms = [];
        if (layer.offsetX !== 0 || layer.offsetY !== 0) {
            transforms.push('translate(' + layer.offsetX + '%, ' + layer.offsetY + '%)');
        }
        if (layer.scale !== 100) {
            transforms.push('scale(' + (layer.scale / 100) + ')');
        }
        if (layer.rotation !== 0) {
            transforms.push('rotate(' + layer.rotation + 'deg)');
        }
        wrap.style.transform = transforms.length ? transforms.join(' ') : 'none';

        // Opacity
        wrap.style.opacity = (layer.opacity != null ? layer.opacity : 100) / 100;

        // Drop-shadow
        if (layer.shadowEnabled) {
            var rgba = App._hexToRgba(layer.shadowColor, layer.shadowOpacity / 100);
            wrap.style.filter =
                'drop-shadow(0 ' + layer.shadowOffsetY + 'px ' + layer.shadowBlur + 'px ' + rgba + ')';
        } else {
            wrap.style.filter = 'none';
        }

        // Tint overlay
        if (tint) {
            if (layer.tintEnabled) {
                tint.style.backgroundColor = layer.tintColor || '#FF0000';
                tint.style.display = 'block';
            } else {
                tint.style.display = 'none';
            }
        }
    }
};

/* ---- Sync state -> controles DOM ---- */

App._editorSyncControls = function() {
    var s = App.state.editor;
    var layer = App._editorActiveLayer();

    // Background type
    var bgType = document.getElementById('editorBgType');
    if (bgType) bgType.value = s.bgType;

    // Couleurs fond
    var bgColor = document.getElementById('editorBgColor');
    var bgColorLabel = document.getElementById('editorBgColorLabel');
    if (bgColor) bgColor.value = s.bgColor;
    if (bgColorLabel) bgColorLabel.textContent = s.bgColor;

    var gradCenter = document.getElementById('editorGradientCenter');
    var gradCenterLabel = document.getElementById('editorGradientCenterLabel');
    if (gradCenter) gradCenter.value = s.gradientCenter;
    if (gradCenterLabel) gradCenterLabel.textContent = s.gradientCenter;

    var gradEdge = document.getElementById('editorGradientEdge');
    var gradEdgeLabel = document.getElementById('editorGradientEdgeLabel');
    if (gradEdge) gradEdge.value = s.gradientEdge;
    if (gradEdgeLabel) gradEdgeLabel.textContent = s.gradientEdge;

    // Layer controls (depuis le layer actif)
    if (layer) {
        var scale = document.getElementById('editorScale');
        var scaleVal = document.getElementById('editorScaleValue');
        if (scale) scale.value = layer.scale;
        if (scaleVal) scaleVal.textContent = layer.scale + '%';

        var rotation = document.getElementById('editorRotation');
        var rotationVal = document.getElementById('editorRotationValue');
        if (rotation) rotation.value = layer.rotation;
        if (rotationVal) rotationVal.textContent = layer.rotation + '\u00B0';

        var offsetX = document.getElementById('editorOffsetX');
        var offsetXVal = document.getElementById('editorOffsetXValue');
        if (offsetX) offsetX.value = layer.offsetX;
        if (offsetXVal) offsetXVal.textContent = layer.offsetX + '%';

        var offsetY = document.getElementById('editorOffsetY');
        var offsetYVal = document.getElementById('editorOffsetYValue');
        if (offsetY) offsetY.value = layer.offsetY;
        if (offsetYVal) offsetYVal.textContent = layer.offsetY + '%';

        var opacity = document.getElementById('editorOpacity');
        var opacityVal = document.getElementById('editorOpacityValue');
        var opVal = layer.opacity != null ? layer.opacity : 100;
        if (opacity) opacity.value = opVal;
        if (opacityVal) opacityVal.textContent = opVal + '%';

        // Tint toggle
        var tintEnabled = document.getElementById('editorTintEnabled');
        if (tintEnabled) tintEnabled.checked = !!layer.tintEnabled;

        var tintColor = document.getElementById('editorTintColor');
        var tintColorLabel = document.getElementById('editorTintColorLabel');
        if (tintColor) tintColor.value = layer.tintColor || '#FF0000';
        if (tintColorLabel) tintColorLabel.textContent = layer.tintColor || '#FF0000';

        // Shadow toggle
        var shadowEnabled = document.getElementById('editorShadowEnabled');
        if (shadowEnabled) shadowEnabled.checked = layer.shadowEnabled;

        // Shadow controls
        var shadowBlur = document.getElementById('editorShadowBlur');
        var shadowBlurVal = document.getElementById('editorShadowBlurValue');
        if (shadowBlur) shadowBlur.value = layer.shadowBlur;
        if (shadowBlurVal) shadowBlurVal.textContent = layer.shadowBlur + 'px';

        var shadowOffsetY = document.getElementById('editorShadowOffsetY');
        var shadowOffsetYVal = document.getElementById('editorShadowOffsetYValue');
        if (shadowOffsetY) shadowOffsetY.value = layer.shadowOffsetY;
        if (shadowOffsetYVal) shadowOffsetYVal.textContent = layer.shadowOffsetY + 'px';

        var shadowOpacity = document.getElementById('editorShadowOpacity');
        var shadowOpacityVal = document.getElementById('editorShadowOpacityValue');
        if (shadowOpacity) shadowOpacity.value = layer.shadowOpacity;
        if (shadowOpacityVal) shadowOpacityVal.textContent = layer.shadowOpacity + '%';

        var shadowColor = document.getElementById('editorShadowColor');
        var shadowColorLabel = document.getElementById('editorShadowColorLabel');
        if (shadowColor) shadowColor.value = layer.shadowColor;
        if (shadowColorLabel) shadowColorLabel.textContent = layer.shadowColor;
    }

    // Export size
    var exportSize = document.getElementById('editorExportSize');
    if (exportSize) exportSize.value = s.exportSize;

    // Visibilite conditionnelle
    App._editorToggleBgType();
    App._editorToggleTint();
    App._editorToggleShadow();
};

/* ---- Toggle bg type rows ---- */

App._editorToggleBgType = function() {
    var s = App.state.editor;
    var solidRow = document.getElementById('editorBgSolidRow');
    var gradientRows = document.getElementById('editorBgGradientRows');

    if (s.bgType === 'solid') {
        if (solidRow) solidRow.classList.remove('hidden');
        if (gradientRows) gradientRows.classList.add('hidden');
    } else {
        if (solidRow) solidRow.classList.add('hidden');
        if (gradientRows) gradientRows.classList.remove('hidden');
    }
};

/* ---- Toggle shadow controls ---- */

App._editorToggleTint = function() {
    var controls = document.getElementById('editorTintControls');
    var layer = App._editorActiveLayer();
    if (controls && layer) {
        if (layer.tintEnabled) {
            controls.classList.remove('hidden');
        } else {
            controls.classList.add('hidden');
        }
    }
};

App._editorToggleShadow = function() {
    var controls = document.getElementById('editorShadowControls');
    var layer = App._editorActiveLayer();
    if (controls && layer) {
        if (layer.shadowEnabled) {
            controls.classList.remove('hidden');
        } else {
            controls.classList.add('hidden');
        }
    }
};

/* ---- Utilitaire couleur ---- */

App._hexToRgba = function(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
};

/**
 * Assombrit ou eclaircit une couleur hex.
 * factor < 1 = plus fonce, factor > 1 = plus clair.
 */
App._adjustColor = function(hex, factor) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, Math.max(0, Math.round(r * factor)));
    g = Math.min(255, Math.max(0, Math.round(g * factor)));
    b = Math.min(255, Math.max(0, Math.round(b * factor)));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

/* ---- Export Canvas PNG (multi-layer) ---- */

App.editorExportPNG = function() {
    var s = App.state.editor;
    var size = s.exportSize;
    var layers = s.layers || [];
    if (!layers.length) return;

    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');

    // 1. Calque fond
    if (s.bgType === 'solid') {
        ctx.fillStyle = s.bgColor;
        ctx.fillRect(0, 0, size, size);
    } else {
        var cx = size / 2;
        var cy = size / 2;
        var radius = size * 0.7;
        var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, s.gradientCenter);
        grad.addColorStop(1, s.gradientEdge);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
    }

    // 2. Dessiner chaque layer
    var imgs = document.querySelectorAll('.editor-layer-image');

    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        var img = imgs[i];
        if (!img || !img.complete) continue;

        ctx.save();

        // Opacity
        ctx.globalAlpha = (layer.opacity != null ? layer.opacity : 100) / 100;

        // Shadow
        if (layer.shadowEnabled) {
            var scaleFactor = size / 512;
            var shadowAlpha = layer.shadowOpacity / 100;
            ctx.shadowColor = App._hexToRgba(layer.shadowColor, shadowAlpha);
            ctx.shadowBlur = layer.shadowBlur * scaleFactor;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = layer.shadowOffsetY * scaleFactor;
        }

        // Transforms
        var half = size / 2;
        var ox = size * layer.offsetX / 100;
        var oy = size * layer.offsetY / 100;
        ctx.translate(half + ox, half + oy);
        if (layer.scale !== 100) {
            ctx.scale(layer.scale / 100, layer.scale / 100);
        }
        if (layer.rotation !== 0) {
            ctx.rotate(layer.rotation * Math.PI / 180);
        }
        // Tint : dessiner sur un canvas temporaire avec blend mode color
        if (layer.tintEnabled && layer.tintColor) {
            var tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = size;
            tmpCanvas.height = size;
            var tmpCtx = tmpCanvas.getContext('2d');
            tmpCtx.drawImage(img, 0, 0, size, size);
            tmpCtx.globalCompositeOperation = 'color';
            tmpCtx.fillStyle = layer.tintColor;
            tmpCtx.fillRect(0, 0, size, size);
            tmpCtx.globalCompositeOperation = 'destination-in';
            tmpCtx.drawImage(img, 0, 0, size, size);
            ctx.drawImage(tmpCanvas, -half, -half, size, size);
        } else {
            ctx.drawImage(img, -half, -half, size, size);
        }

        ctx.restore();
    }

    // 3. Telecharger
    var link = document.createElement('a');
    link.download = 'icon-edited-' + size + '-' + Date.now() + '.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    App.showToast('Exported ' + size + 'x' + size + ' PNG', 'success');
};

/* ---- Init event listeners ---- */

App.initEditorEvents = function() {
    // Bouton retour
    var backBtn = document.getElementById('editorBackBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            App.closeEditor();
        });
    }

    // Bouton export
    var exportBtn = document.getElementById('editorExportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            App.editorExportPNG();
        });
    }

    // Bouton reset
    var resetBtn = document.getElementById('editorResetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            App.resetEditor();
        });
    }

    // Bouton ajouter layer
    var addLayerBtn = document.getElementById('editorAddLayerBtn');
    if (addLayerBtn) {
        addLayerBtn.addEventListener('click', function() {
            App._openLayerPicker();
        });
    }

    // Fermer le picker
    var pickerClose = document.getElementById('editorLayerPickerClose');
    if (pickerClose) {
        pickerClose.addEventListener('click', function() {
            App._closeLayerPicker();
        });
    }

    // Event delegation sur la layer list
    var layerList = document.getElementById('editorLayerList');
    if (layerList) {
        layerList.addEventListener('click', function(e) {
            var actionBtn = e.target.closest('[data-action]');
            var item = e.target.closest('.editor-layer-item');
            if (!item) return;

            var index = parseInt(item.getAttribute('data-layer-index'), 10);

            if (actionBtn) {
                var action = actionBtn.getAttribute('data-action');
                if (action === 'delete') {
                    App.removeEditorLayer(index);
                } else if (action === 'move-up') {
                    App.reorderEditorLayer(index, 'up');
                } else if (action === 'move-down') {
                    App.reorderEditorLayer(index, 'down');
                }
            } else {
                // Click sur l'item = selectionner le layer
                App.selectEditorLayer(index);
            }
        });
    }

    // Type de fond
    var bgTypeSelect = document.getElementById('editorBgType');
    if (bgTypeSelect) {
        bgTypeSelect.addEventListener('change', function() {
            var newType = this.value;
            var s = App.state.editor;

            // Quand on passe en gradient, initialiser les couleurs depuis bgColor
            if (newType === 'gradient' && s.bgType === 'solid') {
                s.gradientCenter = s.bgColor;
                s.gradientEdge = App._adjustColor(s.bgColor, 0.4);
            }
            // Quand on repasse en solid, utiliser le centre du gradient
            if (newType === 'solid' && s.bgType === 'gradient') {
                s.bgColor = s.gradientCenter;
            }

            s.bgType = newType;
            App._editorSyncControls();
            App.updateEditorPreview();
        });
    }

    // Color pickers — fond (ecrivent sur App.state.editor)
    var bgColorInputs = [
        { id: 'editorBgColor',       key: 'bgColor',       label: 'editorBgColorLabel' },
        { id: 'editorGradientCenter', key: 'gradientCenter', label: 'editorGradientCenterLabel' },
        { id: 'editorGradientEdge',   key: 'gradientEdge',   label: 'editorGradientEdgeLabel' }
    ];

    for (var i = 0; i < bgColorInputs.length; i++) {
        (function(cfg) {
            var el = document.getElementById(cfg.id);
            var labelEl = document.getElementById(cfg.label);
            if (el) {
                el.addEventListener('input', function() {
                    App.state.editor[cfg.key] = this.value;
                    if (labelEl) labelEl.textContent = this.value;
                    App.updateEditorPreview();
                });
            }
        })(bgColorInputs[i]);
    }

    // Color picker — shadow (ecrit sur le layer actif)
    var shadowColorEl = document.getElementById('editorShadowColor');
    var shadowColorLabelEl = document.getElementById('editorShadowColorLabel');
    if (shadowColorEl) {
        shadowColorEl.addEventListener('input', function() {
            var layer = App._editorActiveLayer();
            if (layer) {
                layer.shadowColor = this.value;
                if (shadowColorLabelEl) shadowColorLabelEl.textContent = this.value;
                App.updateEditorPreview();
            }
        });
    }

    // Range sliders (ecrivent sur le layer actif)
    var rangeInputs = [
        { id: 'editorScale',        key: 'scale',        label: 'editorScaleValue',        suffix: '%' },
        { id: 'editorRotation',     key: 'rotation',     label: 'editorRotationValue',     suffix: '\u00B0' },
        { id: 'editorOffsetX',      key: 'offsetX',      label: 'editorOffsetXValue',      suffix: '%' },
        { id: 'editorOffsetY',      key: 'offsetY',      label: 'editorOffsetYValue',      suffix: '%' },
        { id: 'editorOpacity',      key: 'opacity',      label: 'editorOpacityValue',      suffix: '%' },
        { id: 'editorShadowBlur',    key: 'shadowBlur',    label: 'editorShadowBlurValue',    suffix: 'px' },
        { id: 'editorShadowOffsetY', key: 'shadowOffsetY', label: 'editorShadowOffsetYValue', suffix: 'px' },
        { id: 'editorShadowOpacity', key: 'shadowOpacity', label: 'editorShadowOpacityValue', suffix: '%' }
    ];

    for (var j = 0; j < rangeInputs.length; j++) {
        (function(cfg) {
            var el = document.getElementById(cfg.id);
            var labelEl = document.getElementById(cfg.label);
            if (el) {
                el.addEventListener('input', function() {
                    var val = parseInt(this.value, 10);
                    var layer = App._editorActiveLayer();
                    if (layer) {
                        layer[cfg.key] = val;
                        if (labelEl) labelEl.textContent = val + cfg.suffix;
                        App.updateEditorPreview();
                    }
                });
            }
        })(rangeInputs[j]);
    }

    // Toggle tint (ecrit sur le layer actif)
    var tintToggle = document.getElementById('editorTintEnabled');
    if (tintToggle) {
        tintToggle.addEventListener('change', function() {
            var layer = App._editorActiveLayer();
            if (layer) {
                layer.tintEnabled = this.checked;
                App._editorToggleTint();
                App.updateEditorPreview();
            }
        });
    }

    // Color picker — tint (ecrit sur le layer actif)
    var tintColorEl = document.getElementById('editorTintColor');
    var tintColorLabelEl = document.getElementById('editorTintColorLabel');
    if (tintColorEl) {
        tintColorEl.addEventListener('input', function() {
            var layer = App._editorActiveLayer();
            if (layer) {
                layer.tintColor = this.value;
                if (tintColorLabelEl) tintColorLabelEl.textContent = this.value;
                App.updateEditorPreview();
            }
        });
    }

    // Toggle shadow (ecrit sur le layer actif)
    var shadowToggle = document.getElementById('editorShadowEnabled');
    if (shadowToggle) {
        shadowToggle.addEventListener('change', function() {
            var layer = App._editorActiveLayer();
            if (layer) {
                layer.shadowEnabled = this.checked;
                App._editorToggleShadow();
                App.updateEditorPreview();
            }
        });
    }

    // Taille export
    var exportSize = document.getElementById('editorExportSize');
    if (exportSize) {
        exportSize.addEventListener('change', function() {
            App.state.editor.exportSize = parseInt(this.value, 10);
        });
    }

    // Escape pour fermer
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && App.state.editor.active) {
            // Fermer le picker en priorite, sinon l'editeur
            var picker = document.getElementById('editorLayerPicker');
            if (picker && !picker.classList.contains('hidden')) {
                App._closeLayerPicker();
            } else {
                App.closeEditor();
            }
        }
    });

    // Drag to move layer on canvas
    var canvasWrap = document.querySelector('.editor-canvas-wrap');
    if (canvasWrap) {
        var dragging = false;
        var startX = 0;
        var startY = 0;
        var startOffsetX = 0;
        var startOffsetY = 0;

        canvasWrap.addEventListener('mousedown', function(e) {
            var layer = App._editorActiveLayer();
            if (!layer) return;
            e.preventDefault();
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startOffsetX = layer.offsetX;
            startOffsetY = layer.offsetY;
            canvasWrap.classList.add('dragging');
        });

        document.addEventListener('mousemove', function(e) {
            if (!dragging) return;
            var layer = App._editorActiveLayer();
            if (!layer) return;

            var rect = canvasWrap.getBoundingClientRect();
            var dx = ((e.clientX - startX) / rect.width) * 100;
            var dy = ((e.clientY - startY) / rect.height) * 100;

            layer.offsetX = Math.max(-50, Math.min(50, Math.round(startOffsetX + dx)));
            layer.offsetY = Math.max(-50, Math.min(50, Math.round(startOffsetY + dy)));

            App.updateEditorPreview();
            App._editorSyncControls();
        });

        document.addEventListener('mouseup', function() {
            if (!dragging) return;
            dragging = false;
            canvasWrap.classList.remove('dragging');
        });
    }
};
