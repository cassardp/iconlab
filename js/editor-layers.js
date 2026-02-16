/* ============================================
   Editor Layers — Gestion des layers d'icones
   Render, selection, ajout, suppression, reordonnement, picker
   ============================================ */

var App = window.App || {};

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
    if (layers.length >= 5) return; // Max 5 layers

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

/* ---- Mettre a jour le bouton ajouter ---- */

App._editorUpdateAddBtn = function() {
    var btn = document.getElementById('editorAddLayerBtn');
    if (!btn) return;
    var layers = App.state.editor.layers || [];
    btn.disabled = layers.length >= 5;
    btn.style.opacity = layers.length >= 5 ? '0.3' : '1';
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
