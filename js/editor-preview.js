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
    if (s.bgType === 'none') {
        canvasWrap.style.background = '';
        canvasWrap.style.backgroundColor = '#a0a0a0';
        canvasWrap.classList.add('checkerboard');
    } else {
        canvasWrap.classList.remove('checkerboard');
        if (s.bgType === 'solid') {
            canvasWrap.style.background = s.bgColor;
        } else {
            canvasWrap.style.background =
                'radial-gradient(circle, ' + s.gradientCenter + ', ' + s.gradientEdge + ')';
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

    if (s.bgType === 'none') {
        if (solidRow) solidRow.classList.add('hidden');
        if (gradientRows) gradientRows.classList.add('hidden');
    } else if (s.bgType === 'solid') {
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

    App._editorSave();

    var idx = s.generationIndex;
    var gen = App.state.generations[idx];
    if (!gen) return;

    var btn = document.getElementById('editorExportBtn');
    if (btn) btn.classList.add('loading');

    // Rendre une seule fois en 1024, puis downscale progressif
    App._renderComposition(gen, 1024, true, null, function(masterCanvas) {
        var zip = new JSZip();
        var sizes = App.APP_ICON_SIZES;

        for (var i = 0; i < sizes.length; i++) {
            var entry = sizes[i];
            var canvas = (entry.size === 1024)
                ? masterCanvas
                : App._downscaleCanvas(masterCanvas, entry.size);
            var dataUrl = canvas.toDataURL('image/png');
            var base64 = dataUrl.split(',')[1];
            zip.file('AppIcon-' + entry.size + 'x' + entry.size + '-' + entry.name + '.png', base64, { base64: true });
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
};
