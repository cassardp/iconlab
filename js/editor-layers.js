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

    for (var i = layers.length - 1; i >= 0; i--) {
        var layer = layers[i];
        var item = document.createElement('div');
        item.className = 'editor-layer-item' + (i === active ? ' active' : '');
        item.setAttribute('data-layer-index', i);
        // Handle de drag
        var handle = document.createElement('span');
        handle.className = 'editor-layer-handle';
        handle.innerHTML = '<i data-lucide="grip-vertical" style="width:14px;height:14px"></i>';

        var thumb = document.createElement('img');
        thumb.className = 'editor-layer-thumb';
        thumb.src = 'data:image/png;base64,' + layer.imageBase64;
        thumb.alt = '';

        var name = document.createElement('span');
        name.className = 'editor-layer-name';
        name.textContent = 'Icon ' + (i + 1);

        var actions = document.createElement('div');
        actions.className = 'editor-layer-actions';

        // Bouton supprimer (cache si un seul layer)
        if (layers.length > 1) {
            var delBtn = document.createElement('button');
            delBtn.className = 'btn-icon btn-xs';
            delBtn.title = 'Remove layer';
            delBtn.setAttribute('data-action', 'delete');
            delBtn.innerHTML = '<i data-lucide="trash-2"></i>';
            actions.appendChild(delBtn);
        }

        item.appendChild(handle);
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
        var itemIndex = parseInt(items[i].getAttribute('data-layer-index'), 10);
        items[i].classList.toggle('active', itemIndex === index);
    }

    // Sync les controles avec le layer selectionne
    App._editorSyncControls();
};

/* ---- Ajouter un layer depuis la galerie ---- */

App.addEditorLayer = function(generation) {
    var layers = App.state.editor.layers || [];
    if (layers.length >= 5) return; // Max 5 layers

    // Si on passe de 1 a 2 layers, dupliquer pour preserver l'original
    if (layers.length === 1) {
        var idx = App.state.editor.generationIndex;
        var currentGen = App.state.generations[idx];
        if (currentGen) {
            App._editorSave();
            var clone = JSON.parse(JSON.stringify(currentGen));
            clone.timestamp = Date.now();
            App.state.generations.unshift(clone);
            App.renderGalleryCard(clone, true);
            App.saveGallery();
            // Pointer l'editeur sur le clone
            App.state.editor.generationIndex = 0;
            // Mettre a jour les index des autres generations
            App.refreshGalleryCard(currentGen);
            layers = App.state.editor.layers;
        }
    }

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

/* ---- Reordonner un layer (swap adjacent) ---- */

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

/* ---- Deplacer un layer (drag & drop) ---- */

App._moveEditorLayer = function(fromIndex, toIndex) {
    var layers = App.state.editor.layers || [];
    if (fromIndex < 0 || fromIndex >= layers.length) return;
    if (toIndex < 0 || toIndex >= layers.length) return;

    var moving = layers.splice(fromIndex, 1)[0];
    layers.splice(toIndex, 0, moving);

    // Suivre le layer actif
    var active = App.state.editor.activeLayerIndex;
    if (active === fromIndex) {
        App.state.editor.activeLayerIndex = toIndex;
    } else if (fromIndex < active && toIndex >= active) {
        App.state.editor.activeLayerIndex = active - 1;
    } else if (fromIndex > active && toIndex <= active) {
        App.state.editor.activeLayerIndex = active + 1;
    }

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

/* ---- Layer picker (reuses gallery overlay) ---- */

App._openLayerPicker = function() {
    var galleryOverlay = document.getElementById('galleryOverlay');
    var galleryToggle = document.getElementById('galleryToggle');
    if (!galleryOverlay) return;

    // Masquer la card de l'image en cours d'edition
    var currentGen = App.state.generations[App.state.editor.generationIndex];
    if (currentGen) {
        var gallery = document.getElementById('gallery');
        var currentCard = gallery && gallery.querySelector('.gallery-card[data-ts="' + currentGen.timestamp + '"]');
        if (currentCard) currentCard.style.display = 'none';
        App._pickerHiddenCard = currentCard;
    }

    App._galleryPickerMode = true;
    galleryOverlay.classList.add('picker-mode');
    galleryOverlay.classList.add('open');
    if (galleryToggle) galleryToggle.classList.add('active');
};

App._closeLayerPicker = function() {
    var galleryOverlay = document.getElementById('galleryOverlay');
    var galleryToggle = document.getElementById('galleryToggle');
    if (!galleryOverlay) return;

    // Restaurer la card masquee
    if (App._pickerHiddenCard) {
        App._pickerHiddenCard.style.display = '';
        App._pickerHiddenCard = null;
    }

    App._galleryPickerMode = false;
    galleryOverlay.classList.remove('picker-mode');
    galleryOverlay.classList.remove('open');
    if (galleryToggle) galleryToggle.classList.remove('active');
};
