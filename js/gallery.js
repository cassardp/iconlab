/* ============================================
   Gallery — Gestion de la galerie de resultats
   ============================================ */

var App = window.App || {};

App._galleryPickerMode = false;

/**
 * Ajoute une generation a la galerie (en prepend).
 */
App.addToGallery = function(generation) {
    App.state.generations.unshift(generation);
    App.renderGalleryCard(generation, true);
    App.updateGalleryCount();
    App.saveGallery();
};

/**
 * Cree le HTML d'une card de galerie.
 */
App.createCardHTML = function(gen) {
    var es = gen.editorSettings;
    var hasSavedBg = gen.previewBg && gen.previewBg !== 'checkerboard';
    var bgClass = '';
    var bgStyle = '';
    var imgHtml = '';

    if (es) {
        // Utiliser les reglages editeur pour le fond
        if (es.bgType === 'none' || es.bgColor === 'checkerboard') {
            bgClass = ' checkerboard';
        } else if (es.bgType === 'gradient') {
            bgStyle = ' style="background:radial-gradient(circle, ' + es.gradientCenter + ', ' + es.gradientEdge + ')"';
        } else if (es.bgType === 'linear') {
            bgStyle = ' style="background:linear-gradient(' + (es.linearAngle != null ? es.linearAngle : 180) + 'deg, ' + es.linearStart + ', ' + es.linearEnd + ')"';
        } else if (es.bgType === 'mesh') {
            bgStyle = ' style="background:' + App._buildMeshCSS(es.meshColors) + '"';
        } else {
            bgStyle = ' style="background-color:' + es.bgColor + '"';
        }

        // Multi-layer ou single-layer
        if (es.layers && es.layers.length) {
            for (var li = 0; li < es.layers.length; li++) {
                var layer = es.layers[li];
                var layerStyles = ['position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain'];

                if (layer.opacity != null && layer.opacity !== 100) {
                    layerStyles.push('opacity:' + (layer.opacity / 100));
                }

                if (layer.shadowEnabled) {
                    var rgba = App._hexToRgba(layer.shadowColor, layer.shadowOpacity / 100);
                    layerStyles.push('filter:drop-shadow(0 ' + layer.shadowOffsetY + 'px ' + layer.shadowBlur + 'px ' + rgba + ')');
                }
                var transforms = [];
                if (layer.offsetX || layer.offsetY) {
                    transforms.push('translate(' + (layer.offsetX || 0) + '%, ' + (layer.offsetY || 0) + '%)');
                }
                if (layer.scale && layer.scale !== 100) {
                    transforms.push('scale(' + (layer.scale / 100) + ')');
                }
                if (layer.rotation) {
                    transforms.push('rotate(' + layer.rotation + 'deg)');
                }
                if (transforms.length) {
                    layerStyles.push('transform:' + transforms.join(' '));
                }

                var layerSrc = layer.imageBase64
                    ? 'data:image/png;base64,' + layer.imageBase64
                    : 'data:image/png;base64,' + gen.imageBase64;

                imgHtml += '<img src="' + layerSrc + '" alt="Layer ' + (li + 1) + '" style="' + layerStyles.join(';') + '">';

                // Tint overlay
                if (layer.tintEnabled && layer.tintColor) {
                    var tintStyles = [
                        'position:absolute;top:0;left:0;width:100%;height:100%',
                        'background-color:' + layer.tintColor,
                        'mix-blend-mode:color',
                        'pointer-events:none',
                        '-webkit-mask-image:url(' + layerSrc + ')',
                        'mask-image:url(' + layerSrc + ')',
                        '-webkit-mask-size:contain',
                        'mask-size:contain',
                        '-webkit-mask-repeat:no-repeat',
                        'mask-repeat:no-repeat',
                        '-webkit-mask-position:center',
                        'mask-position:center'
                    ];
                    if (transforms.length) {
                        tintStyles.push('transform:' + transforms.join(' '));
                    }
                    imgHtml += '<div style="' + tintStyles.join(';') + '"></div>';
                }
            }
        } else {
            // Legacy single-layer format
            var imgStyles = [];
            if (es.shadowEnabled) {
                var rgbaLegacy = App._hexToRgba(es.shadowColor, es.shadowOpacity / 100);
                imgStyles.push('filter:drop-shadow(0 ' + es.shadowOffsetY + 'px ' + es.shadowBlur + 'px ' + rgbaLegacy + ')');
            }
            var transformsLegacy = [];
            if (es.offsetX || es.offsetY) {
                transformsLegacy.push('translate(' + (es.offsetX || 0) + '%, ' + (es.offsetY || 0) + '%)');
            }
            if (es.scale && es.scale !== 100) {
                transformsLegacy.push('scale(' + (es.scale / 100) + ')');
            }
            if (es.rotation) {
                transformsLegacy.push('rotate(' + es.rotation + 'deg)');
            }
            if (transformsLegacy.length) {
                imgStyles.push('transform:' + transformsLegacy.join(' '));
            }
            var imgStyle = imgStyles.length ? ' style="' + imgStyles.join(';') + '"' : '';
            imgHtml = '<img src="data:image/png;base64,' + gen.imageBase64 + '" alt="Generated icon"' + imgStyle + '>';
        }
    } else {
        if (gen.previewBg === 'checkerboard' || (!gen.previewBg && gen.transparent)) {
            bgClass = ' checkerboard';
        }
        bgStyle = hasSavedBg ? ' style="background-color:' + gen.previewBg + '"' : '';
        imgHtml = '<img src="data:image/png;base64,' + gen.imageBase64 + '" alt="Generated icon">';
    }

    var card = document.createElement('div');
    card.className = 'gallery-card';
    card.setAttribute('data-ts', gen.timestamp);

    card.innerHTML = ''
        + '<div class="gallery-card-image' + bgClass + '"' + bgStyle + '>'
        +   imgHtml
        +   '<div class="gallery-card-overlay">'
        +     '<button class="gallery-card-overlay-btn btn-copy-prompt" title="Copy enriched prompt">'
        +       '<i data-lucide="copy"></i> Prompt'
        +     '</button>'
        +     '<div class="gallery-card-overlay-right">'
        +       '<button class="gallery-card-overlay-btn btn-duplicate" title="Duplicate">'
        +         '<i data-lucide="copy-plus"></i>'
        +       '</button>'
        +       '<button class="gallery-card-overlay-btn btn-delete" title="Delete">'
        +         '<i data-lucide="trash-2"></i>'
        +       '</button>'
        +     '</div>'
        +   '</div>'
        + '</div>';

    return card;
};

/**
 * Rafraichit une card existante apres edition.
 */
App.refreshGalleryCard = function(generation) {
    if (!generation) return;

    var gallery = document.getElementById('gallery');
    var oldCard = gallery.querySelector('.gallery-card[data-ts="' + generation.timestamp + '"]');
    if (!oldCard) return;

    var newCard = App.createCardHTML(generation);
    App.attachCardEvents(newCard, generation);
    gallery.replaceChild(newCard, oldCard);
    lucide.createIcons({ nodes: [newCard] });
};

/**
 * Rend une card dans la galerie DOM.
 */
App.renderGalleryCard = function(generation, prepend) {
    var gallery = document.getElementById('gallery');
    var emptyState = document.getElementById('galleryEmpty');

    // Cacher l'etat vide
    if (emptyState) {
        emptyState.style.display = 'none';
    }

    var card = App.createCardHTML(generation);

    // Event listeners sur la card
    App.attachCardEvents(card, generation);

    if (prepend) {
        gallery.insertBefore(card, gallery.firstChild);
    } else {
        gallery.appendChild(card);
    }

    // Init lucide icons dans la nouvelle card
    lucide.createIcons({ nodes: [card] });
};

/**
 * Attache les events sur une card.
 */
App.attachCardEvents = function(card, generation) {
    // Copier le prompt enrichi
    var copyBtn = card.querySelector('.btn-copy-prompt');
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            App.copyToClipboard(generation.enrichedPrompt);
        });
    }

    // Dupliquer la generation
    var duplicateBtn = card.querySelector('.btn-duplicate');
    if (duplicateBtn) {
        duplicateBtn.addEventListener('click', function() {
            App.duplicateGeneration(generation);
        });
    }

    // Supprimer la card
    var deleteBtn = card.querySelector('.btn-delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            App.deleteGeneration(generation, card);
        });
    }

    // Empecher les clics sur l'overlay de propager vers l'editeur
    var overlay = card.querySelector('.gallery-card-overlay');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // Clic sur l'image : ouvrir editeur OU ajouter comme layer (picker mode)
    var imageWrap = card.querySelector('.gallery-card-image');
    if (imageWrap) {
        imageWrap.addEventListener('click', function() {
            if (App._galleryPickerMode) {
                App.addEditorLayer(generation);
                App._closeLayerPicker();
                return;
            }
            var galleryOverlay = document.getElementById('galleryOverlay');
            var galleryToggle = document.getElementById('galleryToggle');
            if (galleryOverlay) galleryOverlay.classList.remove('open');
            if (galleryToggle) galleryToggle.classList.remove('active');
            App.openEditor(generation);
        });
    }
};

/**
 * Ajoute une card de loading (pendant la generation).
 * Retourne l'element pour pouvoir le remplacer apres.
 */
App.addLoadingCard = function() {
    var gallery = document.getElementById('gallery');
    var emptyState = document.getElementById('galleryEmpty');

    if (emptyState) {
        emptyState.style.display = 'none';
    }

    var card = document.createElement('div');
    card.className = 'gallery-card loading';
    card.id = 'loadingCard';

    card.innerHTML = ''
        + '<div class="gallery-card-image">'
        +   '<div class="gallery-card-loading-content">'
        +     '<div class="spinner"></div>'
        +     '<span>Generating...</span>'
        +   '</div>'
        + '</div>';

    gallery.insertBefore(card, gallery.firstChild);
    return card;
};

/**
 * Supprime la card de loading.
 */
App.removeLoadingCard = function() {
    var card = document.getElementById('loadingCard');
    if (card) {
        card.parentNode.removeChild(card);
    }
};

/**
 * Met a jour le compteur de generations.
 */
App.updateGalleryCount = function() {
    var countEl = document.getElementById('galleryCount');
    if (countEl) {
        var count = App.state.generations.length;
        countEl.textContent = count + ' icon' + (count !== 1 ? 's' : '');
    }
};

/**
 * Nombre de cards chargees par page.
 */
App._GALLERY_PAGE_SIZE = 24;
App._galleryRenderedCount = 0;

/**
 * Rend toute la galerie depuis l'etat (premier batch).
 */
App.renderFullGallery = function() {
    var gallery = document.getElementById('gallery');
    var emptyState = document.getElementById('galleryEmpty');

    // Vider la galerie (sauf l'etat vide et le sentinel)
    var cards = gallery.querySelectorAll('.gallery-card');
    for (var i = 0; i < cards.length; i++) {
        gallery.removeChild(cards[i]);
    }

    // Retirer l'ancien sentinel s'il existe
    var oldSentinel = document.getElementById('gallerySentinel');
    if (oldSentinel) oldSentinel.parentNode.removeChild(oldSentinel);

    App._galleryRenderedCount = 0;

    if (App.state.generations.length === 0) {
        if (emptyState) emptyState.style.display = '';
        App.updateGalleryCount();
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Rendre le premier batch
    App._renderGalleryBatch();
    App.updateGalleryCount();

    // Observer pour infinite scroll
    App._initGalleryObserver();
};

/**
 * Rend le prochain batch de cards.
 */
App._renderGalleryBatch = function() {
    var gallery = document.getElementById('gallery');
    var gens = App.state.generations;
    var end = Math.min(App._galleryRenderedCount + App._GALLERY_PAGE_SIZE, gens.length);

    for (var j = App._galleryRenderedCount; j < end; j++) {
        App.renderGalleryCard(gens[j], false);
    }

    App._galleryRenderedCount = end;

    // Ajouter/deplacer le sentinel pour l'infinite scroll
    var sentinel = document.getElementById('gallerySentinel');
    if (App._galleryRenderedCount < gens.length) {
        if (!sentinel) {
            sentinel = document.createElement('div');
            sentinel.id = 'gallerySentinel';
            sentinel.style.height = '1px';
            sentinel.style.gridColumn = '1 / -1';
        }
        gallery.appendChild(sentinel);
    } else if (sentinel && sentinel.parentNode) {
        sentinel.parentNode.removeChild(sentinel);
    }
};

/**
 * IntersectionObserver pour charger les batches suivants.
 */
App._galleryObserver = null;

App._initGalleryObserver = function() {
    if (App._galleryObserver) {
        App._galleryObserver.disconnect();
    }

    var galleryEl = document.getElementById('gallery');

    App._galleryObserver = new IntersectionObserver(function(entries) {
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting && App._galleryRenderedCount < App.state.generations.length) {
                App._renderGalleryBatch();
                // Re-observe le nouveau sentinel
                var newSentinel = document.getElementById('gallerySentinel');
                if (newSentinel) App._galleryObserver.observe(newSentinel);
            }
        }
    }, { root: galleryEl, rootMargin: '200px' });

    var sentinel = document.getElementById('gallerySentinel');
    if (sentinel) {
        App._galleryObserver.observe(sentinel);
    }
};

/**
 * Vide la galerie.
 */
App.clearGallery = function() {
    App.state.generations = [];
    App.renderFullGallery();
    App.saveGallery();
};

App.duplicateGeneration = function(generation) {
    var clone = JSON.parse(JSON.stringify(generation));
    clone.timestamp = Date.now();
    App.state.generations.unshift(clone);
    App.renderGalleryCard(clone, true);
    App.saveGallery();
};

/* ---- IndexedDB persistence ---- */

App._db = null;
App._DB_NAME = 'icon-lab';
App._DB_STORE = 'generations';

/**
 * Ouvre la base IndexedDB.
 */
App.initDB = function() {
    return new Promise(function(resolve, reject) {
        var request = indexedDB.open(App._DB_NAME, 1);
        request.onupgradeneeded = function(e) {
            var db = e.target.result;
            if (!db.objectStoreNames.contains(App._DB_STORE)) {
                db.createObjectStore(App._DB_STORE, { keyPath: 'timestamp' });
            }
        };
        request.onsuccess = function(e) {
            App._db = e.target.result;
            resolve();
        };
        request.onerror = function() {
            console.warn('IndexedDB init failed');
            resolve();
        };
    });
};

/**
 * Sauvegarde la galerie dans IndexedDB.
 */
App.saveGallery = function() {
    if (!App._db) return;

    var tx = App._db.transaction(App._DB_STORE, 'readwrite');
    var store = tx.objectStore(App._DB_STORE);
    store.clear();

    for (var i = 0; i < App.state.generations.length; i++) {
        store.put(App.state.generations[i]);
    }
};

/**
 * Charge la galerie depuis IndexedDB.
 */
App.loadGallery = function() {
    if (!App._db) {
        App.renderFullGallery();
        return Promise.resolve();
    }

    return new Promise(function(resolve) {
        var tx = App._db.transaction(App._DB_STORE, 'readonly');
        var store = tx.objectStore(App._DB_STORE);
        var request = store.getAll();

        request.onsuccess = function() {
            var items = request.result || [];
            // Trier par timestamp decroissant (plus recents en premier)
            items.sort(function(a, b) { return b.timestamp - a.timestamp; });
            App.state.generations = items;
            App.renderFullGallery();
            resolve();
        };
        request.onerror = function() {
            App.state.generations = [];
            App.renderFullGallery();
            resolve();
        };
    });
};

/**
 * Supprime une generation individuelle.
 */
App.deleteGeneration = function(generation, cardEl) {
    var idx = App.state.generations.indexOf(generation);
    if (idx === -1) return;

    App.state.generations.splice(idx, 1);

    // Retirer la card du DOM avec une petite animation
    if (cardEl) {
        cardEl.style.transition = 'opacity 150ms, transform 150ms';
        cardEl.style.opacity = '0';
        cardEl.style.transform = 'scale(0.95)';
        setTimeout(function() {
            if (cardEl.parentNode) cardEl.parentNode.removeChild(cardEl);

            // Remettre l'etat vide si plus rien
            if (App.state.generations.length === 0) {
                var emptyState = document.getElementById('galleryEmpty');
                if (emptyState) emptyState.style.display = '';
            }
        }, 150);
    }

    App.updateGalleryCount();
    App.saveGallery();
};

/* ---- Utilitaires ---- */

App.copyToClipboard = function(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
            App.showToast('Copied to clipboard', 'success');
        }).catch(function() {
            App.fallbackCopy(text);
        });
    } else {
        App.fallbackCopy(text);
    }
};

App.fallbackCopy = function(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        App.showToast('Copied to clipboard', 'success');
    } catch (e) {
        App.showToast('Failed to copy', 'error');
    }
    document.body.removeChild(textarea);
};

/* ---- Time formatting ---- */

App._timeAgo = function(ts) {
    var now = Date.now();
    var diff = now - ts;
    var mins = Math.floor(diff / 60000);
    var hours = Math.floor(diff / 3600000);
    var days = Math.floor(diff / 86400000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    if (hours < 24) return hours + 'h ago';
    if (days < 30) return days + 'd ago';
    return new Date(ts).toLocaleDateString();
};

/* ---- Render composition sur canvas (layers + transforms + tint) ---- */

App._renderComposition = function(generation, size, withBg, bgColor, callback) {
    var es = generation.editorSettings;

    // Pas d'editorSettings ou pas de layers : fallback image source
    if (!es || !es.layers || !es.layers.length) {
        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            canvas.width = size || img.width;
            canvas.height = size || img.height;
            var ctx = canvas.getContext('2d');
            if (withBg && bgColor) {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            callback(canvas);
        };
        img.src = 'data:image/png;base64,' + generation.imageBase64;
        return;
    }

    var layers = es.layers;
    var exportSize = size || es.exportSize || 1024;

    // Charger toutes les images des layers en parallele
    var loaded = 0;
    var images = [];
    for (var i = 0; i < layers.length; i++) {
        (function(idx) {
            var imgEl = new Image();
            images[idx] = imgEl;
            imgEl.onload = function() {
                loaded++;
                if (loaded === layers.length) drawAll();
            };
            var src = layers[idx].imageBase64 || generation.imageBase64;
            imgEl.src = 'data:image/png;base64,' + src;
        })(i);
    }

    function drawAll() {
        var canvas = document.createElement('canvas');
        canvas.width = exportSize;
        canvas.height = exportSize;
        var ctx = canvas.getContext('2d');

        // Fond
        if (withBg && es.bgType !== 'none') {
            if (es.bgType === 'gradient') {
                var cx = exportSize / 2;
                var cy = exportSize / 2;
                var radius = exportSize * 0.7;
                var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
                grad.addColorStop(0, es.gradientCenter);
                grad.addColorStop(1, es.gradientEdge);
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, exportSize, exportSize);
            } else if (es.bgType === 'linear') {
                App._drawLinearGradient(ctx, exportSize, es.linearAngle != null ? es.linearAngle : 180, es.linearStart, es.linearEnd);
            } else if (es.bgType === 'mesh') {
                App._drawMeshGradient(ctx, exportSize, es.meshColors);
            } else {
                ctx.fillStyle = bgColor || es.bgColor || '#1a1a1a';
                ctx.fillRect(0, 0, exportSize, exportSize);
            }
        }

        // Layers
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            var img = images[i];
            if (!img) continue;

            ctx.save();

            // Opacity
            ctx.globalAlpha = (layer.opacity != null ? layer.opacity : 100) / 100;

            // Shadow
            if (layer.shadowEnabled) {
                var scaleFactor = exportSize / 512;
                var shadowAlpha = layer.shadowOpacity / 100;
                ctx.shadowColor = App._hexToRgba(layer.shadowColor, shadowAlpha);
                ctx.shadowBlur = layer.shadowBlur * scaleFactor;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = layer.shadowOffsetY * scaleFactor;
            }

            // Transforms
            var half = exportSize / 2;
            var ox = exportSize * (layer.offsetX || 0) / 100;
            var oy = exportSize * (layer.offsetY || 0) / 100;
            ctx.translate(half + ox, half + oy);
            if (layer.scale && layer.scale !== 100) {
                ctx.scale(layer.scale / 100, layer.scale / 100);
            }
            if (layer.rotation) {
                ctx.rotate(layer.rotation * Math.PI / 180);
            }

            // Tint
            if (layer.tintEnabled && layer.tintColor) {
                var tmpCanvas = document.createElement('canvas');
                tmpCanvas.width = exportSize;
                tmpCanvas.height = exportSize;
                var tmpCtx = tmpCanvas.getContext('2d');
                // Dessiner l'image avec opacity
                tmpCtx.globalAlpha = ctx.globalAlpha;
                tmpCtx.drawImage(img, 0, 0, exportSize, exportSize);
                // Tint a pleine opacite (blend color sur l'image)
                tmpCtx.globalAlpha = 1;
                tmpCtx.globalCompositeOperation = 'color';
                tmpCtx.fillStyle = layer.tintColor;
                tmpCtx.fillRect(0, 0, exportSize, exportSize);
                // Masquer avec la silhouette originale
                tmpCtx.globalCompositeOperation = 'destination-in';
                tmpCtx.drawImage(img, 0, 0, exportSize, exportSize);
                // Dessiner le resultat sur le canvas principal a pleine opacite
                ctx.globalAlpha = 1;
                ctx.drawImage(tmpCanvas, -half, -half, exportSize, exportSize);
            } else {
                ctx.drawImage(img, -half, -half, exportSize, exportSize);
            }

            ctx.restore();
        }

        callback(canvas);
    }
};

/* ---- Canvas gradient helpers ---- */

/**
 * Dessine un gradient lineaire sur un canvas.
 * Convention CSS : 0deg = bas->haut, 90deg = gauche->droite.
 */
App._drawLinearGradient = function(ctx, size, angleDeg, startColor, endColor) {
    // Convertir angle CSS en radians math (CSS 0deg = to top = -90deg math)
    var rad = (angleDeg - 90) * Math.PI / 180;
    var half = size / 2;
    var dx = Math.cos(rad) * half;
    var dy = Math.sin(rad) * half;
    var grad = ctx.createLinearGradient(half - dx, half - dy, half + dx, half + dy);
    grad.addColorStop(0, startColor);
    grad.addColorStop(1, endColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
};

/**
 * Dessine un gradient mesh sur un canvas.
 * Derniere couleur = base, les autres = radial blobs aux positions d'ancre.
 */
App._drawMeshGradient = function(ctx, size, colors) {
    if (!colors || !colors.length) return;
    var anchors = App.MESH_ANCHORS;

    // Base = derniere couleur
    ctx.fillStyle = colors[colors.length - 1];
    ctx.fillRect(0, 0, size, size);

    // Overlay radial gradients
    for (var i = 0; i < colors.length - 1; i++) {
        var a = anchors[i % anchors.length];
        var cx = size * a.x / 100;
        var cy = size * a.y / 100;
        var radius = size * 0.7;
        var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, colors[i]);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
    }
};

/**
 * Export ZIP avec toutes les tailles d'icones (avec fond + transparent).
 * Fonctionne depuis la galerie, sans necessite d'ouvrir l'editeur.
 */
App.downloadZip = function(generation) {
    // Rendre en 1024 avec fond
    App._renderComposition(generation, 1024, true, null, function(masterWithBg) {
        // Rendre en 1024 sans fond (transparent)
        App._renderComposition(generation, 1024, false, null, function(masterNoBg) {
            var zip = new JSZip();
            var sizes = App.APP_ICON_SIZES;

            for (var i = 0; i < sizes.length; i++) {
                var entry = sizes[i];
                // Version avec fond
                var canvasBg = (entry.size === 1024)
                    ? masterWithBg
                    : App._downscaleCanvas(masterWithBg, entry.size);
                var dataBg = canvasBg.toDataURL('image/png').split(',')[1];
                zip.file('AppIcon-' + entry.size + 'x' + entry.size + '-' + entry.name + '.png', dataBg, { base64: true });

                // Version transparente
                var canvasNoBg = (entry.size === 1024)
                    ? masterNoBg
                    : App._downscaleCanvas(masterNoBg, entry.size);
                var dataNoBg = canvasNoBg.toDataURL('image/png').split(',')[1];
                zip.file('Transparent/AppIcon-' + entry.size + 'x' + entry.size + '-' + entry.name + '.png', dataNoBg, { base64: true });
            }

            zip.generateAsync({ type: 'blob' }).then(function(blob) {
                var link = document.createElement('a');
                link.download = 'AppIcons-' + Date.now() + '.zip';
                link.href = URL.createObjectURL(blob);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                App.showToast('Exported ' + sizes.length + ' icon sizes as ZIP', 'success');
            });
        });
    });
};

App.showToast = function(message, type) {
    var toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = 'toast' + (type ? ' ' + type : '');

    // Force reflow
    toast.offsetHeight;
    toast.classList.add('show');

    clearTimeout(App._toastTimeout);
    App._toastTimeout = setTimeout(function() {
        toast.classList.remove('show');
    }, 2500);
};

