/* ============================================
   Editor Events — Tous les event listeners de l'editeur
   Boutons, sliders, color pickers, drag-to-move, clavier
   ============================================ */

var App = window.App || {};

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
