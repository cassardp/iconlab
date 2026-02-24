/* ============================================
   Editor Preview — Preview live, sync DOM, utilitaires couleur, export PNG
   ============================================ */

var App = window.App || {};

/* ---- Mise a jour preview live ---- */

App.updateEditorPreview = function() {
    var s = App.state.editor;
    var canvasWrap = document.getElementById('editorCanvasWrap');
    if (!canvasWrap) return;

    App._editorScheduleSave();
    App._updateResetBtn();

    // Calque fond
    if (s.bgType === 'none') {
        canvasWrap.style.background = '';
        canvasWrap.style.backgroundColor = '#a0a0a0';
        canvasWrap.classList.add('checkerboard');
    } else {
        canvasWrap.classList.remove('checkerboard');
        if (s.bgType === 'solid') {
            canvasWrap.style.background = s.bgColor;
        } else if (s.bgType === 'gradient') {
            canvasWrap.style.background =
                'radial-gradient(circle, ' + s.gradientCenter + ', ' + s.gradientEdge + ')';
        } else if (s.bgType === 'linear') {
            canvasWrap.style.background =
                'linear-gradient(' + s.linearAngle + 'deg, ' + s.linearStart + ', ' + s.linearEnd + ')';
        } else if (s.bgType === 'mesh') {
            canvasWrap.style.background = App._buildMeshCSS(s.meshColors);
        }
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

        // Transform : scale, rotation, offset
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
        var transformStr = transforms.length ? transforms.join(' ') : 'none';

        // Opacity
        var opacityVal = (layer.opacity != null ? layer.opacity : 100) / 100;

        // Filter (invert + drop-shadow)
        var filterParts = [];
        if (layer.invertEnabled) filterParts.push('invert(1)');
        if (layer.shadowEnabled) {
            var rgba = App._hexToRgba(layer.shadowColor, layer.shadowOpacity / 100);
            filterParts.push('drop-shadow(0 ' + layer.shadowOffsetY + 'px ' + layer.shadowBlur + 'px ' + rgba + ')');
        }
        var filterStr = filterParts.length ? filterParts.join(' ') : 'none';

        // Appliquer sur le wrapper (pas de transform/filter pour eviter stacking context)
        wrap.style.transform = 'none';
        wrap.style.filter = 'none';
        wrap.style.opacity = '';

        // Appliquer transforms, opacity et filter sur l'image directement
        if (img) {
            img.style.transform = transformStr;
            img.style.opacity = opacityVal;
            img.style.filter = filterStr;
        }

        // Tint overlay : memes transforms, pas d'opacity ni filter
        if (tint) {
            if (layer.tintEnabled) {
                tint.style.backgroundColor = layer.tintColor || '#FF0000';
                tint.style.display = 'block';
                tint.style.transform = transformStr;
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
    if (bgColorLabel) bgColorLabel.value = s.bgColor;

    var gradCenter = document.getElementById('editorGradientCenter');
    var gradCenterLabel = document.getElementById('editorGradientCenterLabel');
    if (gradCenter) gradCenter.value = s.gradientCenter;
    if (gradCenterLabel) gradCenterLabel.value = s.gradientCenter;

    var gradEdge = document.getElementById('editorGradientEdge');
    var gradEdgeLabel = document.getElementById('editorGradientEdgeLabel');
    if (gradEdge) gradEdge.value = s.gradientEdge;
    if (gradEdgeLabel) gradEdgeLabel.value = s.gradientEdge;

    // Linear gradient controls
    var linStart = document.getElementById('editorLinearStart');
    var linStartLabel = document.getElementById('editorLinearStartLabel');
    if (linStart) linStart.value = s.linearStart;
    if (linStartLabel) linStartLabel.value = s.linearStart;

    var linEnd = document.getElementById('editorLinearEnd');
    var linEndLabel = document.getElementById('editorLinearEndLabel');
    if (linEnd) linEnd.value = s.linearEnd;
    if (linEndLabel) linEndLabel.value = s.linearEnd;

    // Linear angle slider sync
    var angleSlider = document.getElementById('editorLinearAngle');
    var angleValue = document.getElementById('editorLinearAngleValue');
    if (angleSlider) angleSlider.value = s.linearAngle;
    if (angleValue) angleValue.value = s.linearAngle;

    // Mesh color list
    App._renderMeshColorList();

    // Layer controls (depuis le layer actif)
    if (layer) {
        var scale = document.getElementById('editorScale');
        var scaleVal = document.getElementById('editorScaleValue');
        if (scale) scale.value = layer.scale;
        if (scaleVal) scaleVal.value = layer.scale;

        var rotation = document.getElementById('editorRotation');
        var rotationVal = document.getElementById('editorRotationValue');
        if (rotation) rotation.value = layer.rotation;
        if (rotationVal) rotationVal.value = layer.rotation;

        var offsetX = document.getElementById('editorOffsetX');
        var offsetXVal = document.getElementById('editorOffsetXValue');
        if (offsetX) offsetX.value = layer.offsetX;
        if (offsetXVal) offsetXVal.value = layer.offsetX;

        var offsetY = document.getElementById('editorOffsetY');
        var offsetYVal = document.getElementById('editorOffsetYValue');
        if (offsetY) offsetY.value = layer.offsetY;
        if (offsetYVal) offsetYVal.value = layer.offsetY;

        var opacity = document.getElementById('editorOpacity');
        var opacityVal = document.getElementById('editorOpacityValue');
        var opVal = layer.opacity != null ? layer.opacity : 100;
        if (opacity) opacity.value = opVal;
        if (opacityVal) opacityVal.value = opVal;

        // Invert segmented
        var invertSeg = document.getElementById('editorInvertEnabled');
        if (invertSeg) App._syncSegmented(invertSeg, !!layer.invertEnabled);

        // Tint segmented
        var tintSeg = document.getElementById('editorTintEnabled');
        if (tintSeg) App._syncSegmented(tintSeg, !!layer.tintEnabled);

        var tintColor = document.getElementById('editorTintColor');
        var tintColorLabel = document.getElementById('editorTintColorLabel');
        if (tintColor) tintColor.value = layer.tintColor || '#FF0000';
        if (tintColorLabel) tintColorLabel.value = layer.tintColor || '#FF0000';

        // Shadow segmented
        var shadowSeg = document.getElementById('editorShadowEnabled');
        if (shadowSeg) App._syncSegmented(shadowSeg, !!layer.shadowEnabled);

        // Shadow controls
        var shadowBlur = document.getElementById('editorShadowBlur');
        var shadowBlurVal = document.getElementById('editorShadowBlurValue');
        if (shadowBlur) shadowBlur.value = layer.shadowBlur;
        if (shadowBlurVal) shadowBlurVal.value = layer.shadowBlur;

        var shadowOffsetY = document.getElementById('editorShadowOffsetY');
        var shadowOffsetYVal = document.getElementById('editorShadowOffsetYValue');
        if (shadowOffsetY) shadowOffsetY.value = layer.shadowOffsetY;
        if (shadowOffsetYVal) shadowOffsetYVal.value = layer.shadowOffsetY;

        var shadowOpacity = document.getElementById('editorShadowOpacity');
        var shadowOpacityVal = document.getElementById('editorShadowOpacityValue');
        if (shadowOpacity) shadowOpacity.value = layer.shadowOpacity;
        if (shadowOpacityVal) shadowOpacityVal.value = layer.shadowOpacity;

        var shadowColor = document.getElementById('editorShadowColor');
        var shadowColorLabel = document.getElementById('editorShadowColorLabel');
        if (shadowColor) shadowColor.value = layer.shadowColor;
        if (shadowColorLabel) shadowColorLabel.value = layer.shadowColor;
    }

    // Visibilite conditionnelle
    App._editorToggleBgType();
    App._editorToggleTint();
    App._editorToggleShadow();
};

/* ---- Build mesh gradient CSS ---- */

App._buildMeshCSS = function(colors) {
    if (!colors || !colors.length) return '#1a1a1a';
    var anchors = App.MESH_ANCHORS;
    var layers = [];
    for (var i = 0; i < colors.length - 1; i++) {
        var a = anchors[i % anchors.length];
        layers.push('radial-gradient(circle at ' + a.x + '% ' + a.y + '%, ' + colors[i] + ', transparent 70%)');
    }
    // Derniere couleur comme fond de base
    var base = colors[colors.length - 1];
    return layers.join(', ') + ', ' + base;
};

/* ---- Toggle bg type rows ---- */

App._editorToggleBgType = function() {
    var s = App.state.editor;
    var solidRow = document.getElementById('editorBgSolidRow');
    var gradientRows = document.getElementById('editorBgGradientRows');
    var linearRows = document.getElementById('editorBgLinearRows');
    var meshRows = document.getElementById('editorBgMeshRows');
    var divider = document.getElementById('editorBgDivider');

    var containers = [solidRow, gradientRows, linearRows, meshRows];
    for (var i = 0; i < containers.length; i++) {
        if (containers[i]) containers[i].classList.add('hidden');
    }

    var hasContent = s.bgType !== 'none';
    if (divider) divider.classList.toggle('hidden', !hasContent);

    if (s.bgType === 'solid') {
        if (solidRow) solidRow.classList.remove('hidden');
    } else if (s.bgType === 'gradient') {
        if (gradientRows) gradientRows.classList.remove('hidden');
    } else if (s.bgType === 'linear') {
        if (linearRows) linearRows.classList.remove('hidden');
    } else if (s.bgType === 'mesh') {
        if (meshRows) meshRows.classList.remove('hidden');
    }
};

/* ---- Toggle tint controls ---- */

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

/* ---- Toggle shadow controls ---- */

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

/* ---- Render mesh color list ---- */

App._renderMeshColorList = function() {
    var container = document.getElementById('editorMeshColorList');
    if (!container) return;
    var colors = App.state.editor.meshColors || [];
    container.innerHTML = '';

    for (var i = 0; i < colors.length; i++) {
        (function(idx) {
            var row = document.createElement('div');
            row.className = 'mesh-color-row';

            var wrap = document.createElement('div');
            wrap.className = 'color-picker-wrap';

            var input = document.createElement('input');
            input.type = 'color';
            input.value = colors[idx];
            input.className = 'mesh-color-input';
            input.setAttribute('data-mesh-index', idx);

            var label = document.createElement('input');
            label.type = 'text';
            label.className = 'slider-value color-hex-input';
            label.value = colors[idx];
            label.maxLength = 7;
            label.spellcheck = false;

            wrap.appendChild(input);
            wrap.appendChild(label);
            row.appendChild(wrap);

            // Bouton remove (sauf si 2 couleurs min)
            if (colors.length > 2) {
                var removeBtn = document.createElement('button');
                removeBtn.className = 'btn-icon btn-sm';
                removeBtn.title = 'Remove';
                removeBtn.innerHTML = '<i data-lucide="x"></i>';
                removeBtn.addEventListener('click', function() {
                    App.state.editor.meshColors.splice(idx, 1);
                    App._renderMeshColorList();
                    App._editorUpdateMeshAddBtn();
                    App.updateEditorPreview();
                });
                row.appendChild(removeBtn);
            }

            // Color input event
            input.addEventListener('input', function() {
                App.state.editor.meshColors[idx] = this.value;
                label.value = this.value;
                App.updateEditorPreview();
            });

            // Hex input event
            label.addEventListener('change', function() {
                var v = this.value.trim();
                if (/^#?[0-9a-f]{6}$/i.test(v)) {
                    if (v[0] !== '#') v = '#' + v;
                    v = v.toUpperCase();
                    this.value = v;
                    input.value = v;
                    App.state.editor.meshColors[idx] = v;
                    App.updateEditorPreview();
                } else {
                    this.value = App.state.editor.meshColors[idx];
                }
            });

            container.appendChild(row);
        })(i);
    }

    App._initColorPickerWraps(container);
    lucide.createIcons({ nodes: [container] });
    App._editorUpdateMeshAddBtn();
};

/* ---- Update mesh add button visibility ---- */

App._editorUpdateMeshAddBtn = function() {
    var btn = document.getElementById('editorMeshAddColor');
    if (!btn) return;
    var colors = App.state.editor.meshColors || [];
    btn.style.display = colors.length >= 4 ? 'none' : '';
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

/* ---- App icon sizes (iOS, iPadOS, macOS) ---- */

App.APP_ICON_SIZES = [
    // App Store
    { size: 1024, name: 'AppStore-1024' },
    // macOS
    { size: 512,  name: 'macOS-512' },
    { size: 256,  name: 'macOS-256' },
    // iOS
    { size: 180,  name: 'iOS-iPhone@3x-60pt' },
    { size: 167,  name: 'iOS-iPadPro@2x-83.5pt' },
    { size: 152,  name: 'iOS-iPad@2x-76pt' },
    { size: 128,  name: 'macOS-128' },
    { size: 120,  name: 'iOS-iPhone@2x-60pt' },
    { size: 87,   name: 'iOS-Settings@3x-29pt' },
    { size: 80,   name: 'iOS-Spotlight@2x-40pt' },
    { size: 76,   name: 'iOS-iPad@1x-76pt' },
    { size: 60,   name: 'iOS-Notification@3x-20pt' },
    { size: 58,   name: 'iOS-Settings@2x-29pt' },
    { size: 40,   name: 'iOS-Notification@2x-20pt' },
    { size: 32,   name: 'macOS-32' },
    { size: 29,   name: 'iOS-Settings@1x-29pt' },
    { size: 20,   name: 'iOS-Notification@1x-20pt' },
    { size: 16,   name: 'macOS-16' }
];

/* ---- Progressive downscale (halving steps for quality) ---- */

App._downscaleCanvas = function(source, targetSize) {
    var current = source;
    var w = current.width;

    // Reduire par moitie jusqu'a ce qu'on soit proche de la taille cible
    while (w / 2 >= targetSize) {
        var half = document.createElement('canvas');
        var hw = Math.round(w / 2);
        half.width = hw;
        half.height = hw;
        var ctx = half.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(current, 0, 0, hw, hw);
        current = half;
        w = hw;
    }

    // Derniere etape vers la taille exacte
    if (w !== targetSize) {
        var final = document.createElement('canvas');
        final.width = targetSize;
        final.height = targetSize;
        var fctx = final.getContext('2d');
        fctx.imageSmoothingEnabled = true;
        fctx.imageSmoothingQuality = 'high';
        fctx.drawImage(current, 0, 0, targetSize, targetSize);
        return final;
    }

    return current;
};

/* ---- Export ZIP with all app icon sizes ---- */

App.editorExportPNG = function() {
    var s = App.state.editor;
    if (!s.layers || !s.layers.length) return;

    if (App._editorSaveTimer) {
        clearTimeout(App._editorSaveTimer);
        App._editorSaveTimer = null;
    }
    App._editorSave();

    var idx = s.generationIndex;
    var gen = App.state.generations[idx];
    if (!gen) return;

    var btn = document.getElementById('editorExportBtn');
    if (btn) btn.classList.add('loading');

    // Rendre en 1024 avec fond, puis sans fond (transparent)
    App._renderComposition(gen, 1024, true, null, function(masterWithBg) {
        App._renderComposition(gen, 1024, false, null, function(masterNoBg) {
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
                if (btn) btn.classList.remove('loading');
                App.showToast('Exported ' + sizes.length + ' icon sizes as ZIP', 'success');
            });
        });
    });
};
