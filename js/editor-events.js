/* ============================================
   Editor Events — Tous les event listeners de l'editeur
   Boutons, sliders, color pickers, drag-to-move, clavier
   ============================================ */

var App = window.App || {};

/* ---- Active right panel tracker ---- */

App._activeRightPanel = null;

/* ---- Toggle right panel ---- */

App._toggleRightPanel = function(panelId) {
    var container = document.getElementById('toolbarRightPanel');
    var allPanels = document.querySelectorAll('.toolbar-right-panel .panel-float');
    var allBtns = document.querySelectorAll('.toolbar-right-btn');

    if (App._activeRightPanel === panelId) {
        // Close current panel
        container.classList.add('hidden');
        for (var i = 0; i < allPanels.length; i++) allPanels[i].classList.add('hidden');
        for (var j = 0; j < allBtns.length; j++) allBtns[j].classList.remove('active');
        App._activeRightPanel = null;
        return;
    }

    // Show container, hide all panels, show target
    container.classList.remove('hidden');
    for (var k = 0; k < allPanels.length; k++) allPanels[k].classList.add('hidden');
    var target = document.getElementById(panelId);
    if (target) target.classList.remove('hidden');

    // Update button active state
    var activeBtn = null;
    for (var m = 0; m < allBtns.length; m++) {
        var isActive = allBtns[m].getAttribute('data-panel') === panelId;
        allBtns[m].classList.toggle('active', isActive);
        if (isActive) activeBtn = allBtns[m];
    }

    // Init lucide icons in the panel
    if (target) lucide.createIcons({ nodes: [target] });

    // Position panel vertically centered on active button
    App._positionRightPanel(activeBtn, container);

    App._activeRightPanel = panelId;
};

App._positionRightPanel = function(btn, panel) {
    if (!btn || !panel) return;
    // Reset to measure natural height
    panel.style.top = '0px';
    var btnsContainer = btn.closest('.toolbar-right-btns');
    var btnRect = btn.getBoundingClientRect();
    var btnsRect = btnsContainer.getBoundingClientRect();
    var panelHeight = panel.offsetHeight;

    // Button center relative to btns container
    var btnCenterY = (btnRect.top + btnRect.height / 2) - btnsRect.top;
    // Panel top so it's centered on button
    var panelTop = btnCenterY - panelHeight / 2;

    // Clamp so panel stays within viewport
    var mainEl = document.querySelector('.main');
    var mainRect = mainEl.getBoundingClientRect();
    var maxTop = mainRect.height - btnsRect.top + mainRect.top - panelHeight - 12;
    var minTop = mainRect.top - btnsRect.top + 12;
    panelTop = Math.max(minTop, Math.min(panelTop, maxTop));

    panel.style.top = panelTop + 'px';
};

/* ---- Init event listeners ---- */

App.initEditorEvents = function() {

    // Toolbar right buttons
    var toolbarBtns = document.querySelectorAll('.toolbar-right-btn');
    for (var tb = 0; tb < toolbarBtns.length; tb++) {
        toolbarBtns[tb].addEventListener('click', function() {
            var panelId = this.getAttribute('data-panel');
            if (panelId) App._toggleRightPanel(panelId);
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
            var oldType = s.bgType;

            // Conversion intelligente entre types
            if (newType === 'solid') {
                if (oldType === 'gradient') s.bgColor = s.gradientCenter;
                else if (oldType === 'linear') s.bgColor = s.linearStart;
                else if (oldType === 'mesh') s.bgColor = s.meshColors[0];
            } else if (newType === 'gradient') {
                if (oldType === 'solid') {
                    s.gradientCenter = s.bgColor;
                    s.gradientEdge = App._adjustColor(s.bgColor, 0.4);
                } else if (oldType === 'linear') {
                    s.gradientCenter = s.linearStart;
                    s.gradientEdge = s.linearEnd;
                } else if (oldType === 'mesh') {
                    s.gradientCenter = s.meshColors[0];
                    s.gradientEdge = s.meshColors[1] || App._adjustColor(s.meshColors[0], 0.4);
                }
            } else if (newType === 'linear') {
                if (oldType === 'solid') {
                    s.linearStart = s.bgColor;
                    s.linearEnd = App._adjustColor(s.bgColor, 0.4);
                } else if (oldType === 'gradient') {
                    s.linearStart = s.gradientCenter;
                    s.linearEnd = s.gradientEdge;
                } else if (oldType === 'mesh') {
                    s.linearStart = s.meshColors[0];
                    s.linearEnd = s.meshColors[1] || App._adjustColor(s.meshColors[0], 0.4);
                }
            } else if (newType === 'mesh') {
                if (oldType === 'solid') {
                    s.meshColors = [
                        s.bgColor,
                        App._adjustColor(s.bgColor, 0.5),
                        App._adjustColor(s.bgColor, 1.3),
                        App._adjustColor(s.bgColor, 0.8)
                    ];
                } else if (oldType === 'gradient') {
                    s.meshColors = [
                        s.gradientCenter,
                        s.gradientEdge,
                        App._adjustColor(s.gradientCenter, 1.3),
                        App._adjustColor(s.gradientEdge, 1.5)
                    ];
                } else if (oldType === 'linear') {
                    s.meshColors = [
                        s.linearStart,
                        s.linearEnd,
                        App._adjustColor(s.linearStart, 1.3),
                        App._adjustColor(s.linearEnd, 1.5)
                    ];
                }
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
        { id: 'editorGradientEdge',   key: 'gradientEdge',   label: 'editorGradientEdgeLabel' },
        { id: 'editorLinearStart',    key: 'linearStart',    label: 'editorLinearStartLabel' },
        { id: 'editorLinearEnd',      key: 'linearEnd',      label: 'editorLinearEndLabel' }
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
            var rafId = 0;
            if (el) {
                el.addEventListener('input', function() {
                    var val = parseInt(this.value, 10);
                    var layer = App._editorActiveLayer();
                    if (layer) {
                        layer[cfg.key] = val;
                        if (labelEl) labelEl.textContent = val + cfg.suffix;
                        if (!rafId) {
                            rafId = requestAnimationFrame(function() {
                                rafId = 0;
                                App.updateEditorPreview();
                            });
                        }
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

    // Direction picker (linear gradient)
    var dirPicker = document.getElementById('editorLinearDirection');
    if (dirPicker) {
        dirPicker.addEventListener('click', function(e) {
            var btn = e.target.closest('.dir-btn');
            if (!btn) return;
            var angle = parseInt(btn.getAttribute('data-angle'), 10);
            App.state.editor.linearAngle = angle;
            // Update active state
            var all = dirPicker.querySelectorAll('.dir-btn');
            for (var i = 0; i < all.length; i++) {
                all[i].classList.toggle('active', parseInt(all[i].getAttribute('data-angle'), 10) === angle);
            }
            App.updateEditorPreview();
        });
    }

    // Mesh add color
    var meshAddBtn = document.getElementById('editorMeshAddColor');
    if (meshAddBtn) {
        meshAddBtn.addEventListener('click', function() {
            var colors = App.state.editor.meshColors;
            if (colors.length >= 4) return;
            // Derive une nouvelle couleur depuis la derniere
            var last = colors[colors.length - 1] || '#3D3D5C';
            colors.push(App._adjustColor(last, 1.3));
            App._renderMeshColorList();
            App._editorUpdateMeshAddBtn();
            App.updateEditorPreview();
        });
    }

    // Escape pour fermer
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close popovers first
            var openPopover = document.querySelector('.popover:not(.hidden)');
            if (openPopover) {
                App._closeAllPopovers();
                return;
            }
            // Close gallery overlay (normal or picker mode)
            var galleryOverlay = document.getElementById('galleryOverlay');
            if (galleryOverlay && galleryOverlay.classList.contains('open')) {
                if (App._galleryPickerMode) {
                    App._closeLayerPicker();
                } else {
                    galleryOverlay.classList.remove('open');
                    var galleryToggle = document.getElementById('galleryToggle');
                    if (galleryToggle) galleryToggle.classList.remove('active');
                }
                return;
            }
            // Close editor panels
            if (App.state.editor.active) {
                if (App._activeRightPanel) {
                    App._toggleRightPanel(App._activeRightPanel);
                } else {
                    App.closeEditor();
                }
            }
        }
    });

    // Click outside to close right panel
    document.addEventListener('mousedown', function(e) {
        if (!App._activeRightPanel) return;
        var toolbar = document.getElementById('toolbarRight');
        if (toolbar && !toolbar.contains(e.target)) {
            App._toggleRightPanel(App._activeRightPanel);
        }
    });

    // Drag to move layer on canvas
    var canvasWrap = document.getElementById('editorCanvasWrap');
    if (canvasWrap) {
        var dragging = false;
        var startX = 0;
        var startY = 0;
        var startOffsetX = 0;
        var startOffsetY = 0;
        var dragRafId = 0;

        canvasWrap.addEventListener('mousedown', function(e) {
            // Detecter le layer sous le curseur et le selectionner
            var layerWrap = e.target.closest('.editor-layer-wrap');
            if (layerWrap) {
                var clickedIndex = parseInt(layerWrap.getAttribute('data-layer-index'), 10);
                if (!isNaN(clickedIndex) && clickedIndex !== App.state.editor.activeLayerIndex) {
                    App.selectEditorLayer(clickedIndex);
                }
            }

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
            if (dragRafId) return;

            dragRafId = requestAnimationFrame(function() {
                dragRafId = 0;
                var layer = App._editorActiveLayer();
                if (!layer) return;

                var rect = canvasWrap.getBoundingClientRect();
                var dx = ((e.clientX - startX) / rect.width) * 100;
                var dy = ((e.clientY - startY) / rect.height) * 100;

                layer.offsetX = Math.max(-50, Math.min(50, Math.round(startOffsetX + dx)));
                layer.offsetY = Math.max(-50, Math.min(50, Math.round(startOffsetY + dy)));

                App.updateEditorPreview();
                // Update only offset labels, not full sync
                var oxVal = document.getElementById('editorOffsetXValue');
                var oyVal = document.getElementById('editorOffsetYValue');
                var oxInput = document.getElementById('editorOffsetX');
                var oyInput = document.getElementById('editorOffsetY');
                if (oxVal) oxVal.textContent = layer.offsetX + '%';
                if (oyVal) oyVal.textContent = layer.offsetY + '%';
                if (oxInput) oxInput.value = layer.offsetX;
                if (oyInput) oyInput.value = layer.offsetY;
            });
        });

        document.addEventListener('mouseup', function() {
            if (!dragging) return;
            dragging = false;
            canvasWrap.classList.remove('dragging');
        });
    }
};
