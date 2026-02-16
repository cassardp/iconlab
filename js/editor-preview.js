/* ============================================
   Editor Preview — Preview live, sync DOM, utilitaires couleur, export PNG
   ============================================ */

var App = window.App || {};

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
