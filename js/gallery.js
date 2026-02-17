/* ============================================
   Gallery — Gestion de la galerie de resultats
   ============================================ */

var App = window.App || {};

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

    var pickerValue = hasSavedBg ? gen.previewBg : '#1a1a1a';

    var durationStr = '';
    if (gen.duration) {
        durationStr = (gen.duration / 1000).toFixed(1) + 's';
    }
    var costStr = '';
    if (gen.cost) {
        costStr = '~\u2009$' + gen.cost.toFixed(3);
    }
    var statsHtml = '';
    if (durationStr || costStr) {
        var parts = [];
        if (durationStr) parts.push(durationStr);
        if (costStr) parts.push(costStr);
        statsHtml = '<span class="gallery-card-stats"><i data-lucide="clock"></i> ' + parts.join(' ') + '</span>';
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
        +       '<button class="gallery-card-overlay-btn btn-download" title="Download image">'
        +         '<i data-lucide="download"></i>'
        +       '</button>'
        +       '<button class="gallery-card-overlay-btn btn-delete" title="Delete">'
        +         '<i data-lucide="trash-2"></i>'
        +       '</button>'
        +     '</div>'
        +   '</div>'
        + '</div>'
        + '<div class="gallery-card-actions">'
        +   statsHtml
        +   '<div class="card-actions-right">'
        +     '<button class="btn-share" title="' + (gen._sharedToCommunity ? 'Remove from community' : 'Share to community') + '">'
        +       '<i data-lucide="' + (gen._sharedToCommunity ? 'globe-off' : 'globe') + '"></i>'
        +     '</button>'
        +     '<input type="color" class="card-bg-color" value="' + pickerValue + '" title="Preview background color">'
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

    // Telecharger le ZIP avec toutes les tailles
    var downloadBtn = card.querySelector('.btn-download');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            App.downloadZip(generation);
        });
    }

    // Couleur de fond par card
    var cardBgColor = card.querySelector('.card-bg-color');
    var cardImageWrap = card.querySelector('.gallery-card-image');

    if (cardBgColor && cardImageWrap) {
        cardBgColor.addEventListener('input', function() {
            cardImageWrap.classList.remove('checkerboard');
            cardImageWrap.style.backgroundColor = this.value;
            generation.previewBg = this.value;
            if (generation.editorSettings) {
                generation.editorSettings.bgType = 'solid';
                generation.editorSettings.bgColor = this.value;
            }
            App.saveGallery();
        });
    }

    // Partager / retirer de la communaute (toggle)
    var shareBtn = card.querySelector('.btn-share');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            shareBtn.disabled = true;
            var action = generation._sharedToCommunity
                ? App.unshareToCommunity(generation)
                : App.shareToCommunity(generation);
            action.finally(function() {
                shareBtn.disabled = false;
            });
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

    // Clic sur l'image pour ouvrir l'editeur
    var imageWrap = card.querySelector('.gallery-card-image');
    if (imageWrap) {
        imageWrap.addEventListener('click', function() {
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
 * Rend toute la galerie depuis l'etat.
 */
App.renderFullGallery = function() {
    var gallery = document.getElementById('gallery');
    var emptyState = document.getElementById('galleryEmpty');

    // Vider la galerie (sauf l'etat vide)
    var cards = gallery.querySelectorAll('.gallery-card');
    for (var i = 0; i < cards.length; i++) {
        gallery.removeChild(cards[i]);
    }

    if (App.state.generations.length === 0) {
        if (emptyState) emptyState.style.display = '';
        App.updateGalleryCount();
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    for (var j = 0; j < App.state.generations.length; j++) {
        App.renderGalleryCard(App.state.generations[j], false);
    }

    App.updateGalleryCount();
};

/**
 * Vide la galerie.
 */
App.clearGallery = function() {
    App.state.generations = [];
    App.renderFullGallery();
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

    // Unshare from community if shared
    if (generation._sharedToCommunity && generation._sharedId) {
        App.unshareToCommunity(generation).catch(function() {
            // Best effort — delete locally even if unshare fails
        });
    }

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

App.escapeHtml = function(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};

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
                tmpCtx.drawImage(img, 0, 0, exportSize, exportSize);
                tmpCtx.globalCompositeOperation = 'color';
                tmpCtx.fillStyle = layer.tintColor;
                tmpCtx.fillRect(0, 0, exportSize, exportSize);
                tmpCtx.globalCompositeOperation = 'destination-in';
                tmpCtx.drawImage(img, 0, 0, exportSize, exportSize);
                ctx.drawImage(tmpCanvas, -half, -half, exportSize, exportSize);
            } else {
                ctx.drawImage(img, -half, -half, exportSize, exportSize);
            }

            ctx.restore();
        }

        callback(canvas);
    }
};

/* ---- Download helpers ---- */

App.downloadImage = function(generation) {
    var es = generation.editorSettings;
    var size = (es && es.exportSize) ? es.exportSize : null;

    App._renderComposition(generation, size, false, null, function(canvas) {
        var link = document.createElement('a');
        link.download = 'icon-' + generation.model + '-' + Date.now() + '.png';
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
};

App.downloadImageWithBg = function(generation, bgColor) {
    var es = generation.editorSettings;
    var size = (es && es.exportSize) ? es.exportSize : null;

    App._renderComposition(generation, size, true, bgColor, function(canvas) {
        var link = document.createElement('a');
        link.download = 'icon-bg-' + generation.model + '-' + Date.now() + '.png';
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
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
