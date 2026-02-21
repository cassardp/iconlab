/* ============================================
   Events — Event listeners
   ============================================ */

var App = window.App || {};

App.initEventListeners = function() {

    /* ---- API Key ---- */

    var apiKeyInput = document.getElementById('apiKeyInput');
    if (apiKeyInput) {
        apiKeyInput.addEventListener('input', function() {
            App.saveApiKey(this.value.trim());
            App.updateGenerateButton();
        });
    }

    var apiKeyToggle = document.getElementById('apiKeyToggle');
    if (apiKeyToggle && apiKeyInput) {
        apiKeyToggle.addEventListener('click', function() {
            apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
        });
    }

    /* ---- Prompt Input ---- */

    var promptInput = document.getElementById('promptInput');
    if (promptInput) {
        promptInput.addEventListener('input', function() {
            App.state.prompt = this.value;
            App.resetEnrichedPrompt();
            App.updateGenerateButton();
        });
    }

    /* ---- Style Cards (click delegation) ---- */

    var styleCards = document.getElementById('styleCards');
    if (styleCards) {
        styleCards.addEventListener('click', function(e) {
            var card = e.target.closest('.style-card');
            if (!card) return;
            var presetId = card.getAttribute('data-preset');
            if (!presetId || !App.STYLE_PRESETS[presetId]) return;

            App.state.stylePreset = presetId;
            var preset = App.STYLE_PRESETS[presetId];

            // Appliquer le placeholder du preset
            var promptInput = document.getElementById('promptInput');
            if (promptInput && preset.placeholder) {
                promptInput.placeholder = preset.placeholder;
            }

            // Appliquer les axes par defaut du preset
            if (preset.defaultAxes) {
                for (var axKey in preset.defaultAxes) {
                    App.state.axes[axKey] = preset.defaultAxes[axKey];
                    var slider = document.getElementById('axis-' + axKey);
                    if (slider) slider.value = preset.defaultAxes[axKey];
                }
            }

            App.resetEnrichedPrompt();
            App.saveState();

            // Reset preview to placeholder
            if (App.state.editor.active) App.closeEditor();
            var ph = document.getElementById('previewPlaceholder');
            var cw = document.getElementById('editorCanvasWrap');
            if (ph) ph.classList.remove('hidden');
            if (cw) cw.classList.add('hidden');

            // Update active state on cards
            var allCards = styleCards.querySelectorAll('.style-card');
            for (var i = 0; i < allCards.length; i++) {
                allCards[i].classList.toggle('active', allCards[i].getAttribute('data-preset') === presetId);
            }
        });
    }

    /* ---- Axes Sliders ---- */

    var axesContainer = document.getElementById('axesSliders');
    if (axesContainer) {
        for (var ai = 0; ai < App.AXES.length; ai++) {
            (function(axis) {
                var slider = document.getElementById('axis-' + axis.key);
                if (slider) {
                    slider.addEventListener('input', function() {
                        App.state.axes[axis.key] = parseInt(this.value, 10);
                        App.resetEnrichedPrompt();
                    });
                }
            })(App.AXES[ai]);
        }
    }

    /* ---- Material Select ---- */

    var materialSelect = document.getElementById('materialSelect');
    if (materialSelect) {
        materialSelect.addEventListener('change', function() {
            App.state.material = this.value;
            App.resetEnrichedPrompt();
            App.saveState();
        });
    }

    /* ---- Color Picker ---- */

    var colorPicker = document.getElementById('colorPicker');
    var colorPickerLabel = document.getElementById('colorPickerLabel');
    var colorPickerReset = document.getElementById('colorPickerReset');

    if (colorPicker) {
        colorPicker.addEventListener('input', function() {
            App.state.color = this.value;
            this.classList.remove('inactive');
            if (colorPickerLabel) {
                colorPickerLabel.textContent = this.value;
                colorPickerLabel.classList.add('active');
            }
            if (colorPickerReset) colorPickerReset.classList.remove('hidden');
            App.resetEnrichedPrompt();
            App.saveState();
        });
    }

    if (colorPickerReset) {
        colorPickerReset.addEventListener('click', function(e) {
            e.stopPropagation();
            App.state.color = '';
            if (colorPicker) colorPicker.classList.add('inactive');
            if (colorPickerLabel) {
                colorPickerLabel.textContent = 'None';
                colorPickerLabel.classList.remove('active');
            }
            this.classList.add('hidden');
            App.resetEnrichedPrompt();
            App.saveState();
        });
    }

    /* ---- Enriched Prompt Manual Edit ---- */

    var enrichedPrompt = document.getElementById('enrichedPrompt');
    if (enrichedPrompt) {
        enrichedPrompt.addEventListener('input', function() {
            App._enrichedManuallyEdited = true;
            App.updateGenerateButton();
        });
    }

    /* ---- Copy Enriched Prompt ---- */

    var copyPromptBtn = document.getElementById('copyPromptBtn');
    if (copyPromptBtn) {
        copyPromptBtn.addEventListener('click', function() {
            var prompt = App.getFinalPrompt();
            if (prompt) {
                App.copyToClipboard(prompt);
            }
        });
    }

    /* ---- Generate ---- */

    var generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            App.handleGenerate();
        });
    }

    /* ---- Clear Gallery ---- */

    var clearGalleryBtn = document.getElementById('clearGalleryBtn');
    if (clearGalleryBtn) {
        clearGalleryBtn.addEventListener('click', function() {
            if (App.state.generations.length === 0) return;
            if (!confirm('Clear all generations? This cannot be undone.')) return;
            App.clearGallery();
            App.showToast('Gallery cleared', 'success');
        });
    }

    /* ---- More Options Popover ---- */

    var moreOptionsBtn = document.getElementById('moreOptionsBtn');
    var moreOptionsPopover = document.getElementById('moreOptionsPopover');
    if (moreOptionsBtn && moreOptionsPopover) {
        moreOptionsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var isOpen = !moreOptionsPopover.classList.contains('hidden');
            // Close all popovers first
            App._closeAllPopovers();
            if (!isOpen) {
                moreOptionsPopover.classList.remove('hidden');
                moreOptionsBtn.classList.add('active');
                lucide.createIcons({ nodes: [moreOptionsPopover] });
            }
        });
    }

    /* ---- Enriched Prompt Popover ---- */

    var enrichedPromptToggle = document.getElementById('enrichedPromptToggle');
    var enrichedPromptPopover = document.getElementById('enrichedPromptPopover');
    if (enrichedPromptToggle && enrichedPromptPopover) {
        enrichedPromptToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            var isOpen = !enrichedPromptPopover.classList.contains('hidden');
            App._closeAllPopovers();
            if (!isOpen) {
                enrichedPromptPopover.classList.remove('hidden');
                enrichedPromptToggle.classList.add('active');
                lucide.createIcons({ nodes: [enrichedPromptPopover] });
            }
        });
    }

    /* ---- Close popovers on outside click ---- */

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.popover') && !e.target.closest('.prompt-bar-btn')) {
            App._closeAllPopovers();
        }
    });

    /* ---- Keyboard Shortcut: Cmd+Enter ---- */

    document.addEventListener('keydown', function(e) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            if (!App.state.isGenerating && App.canGenerate()) {
                App.handleGenerate();
            }
        }
    });
};

/* ---- Close all popovers ---- */

App._closeAllPopovers = function() {
    var popovers = document.querySelectorAll('.popover');
    for (var i = 0; i < popovers.length; i++) {
        popovers[i].classList.add('hidden');
    }
    var btns = document.querySelectorAll('.prompt-bar-btn');
    for (var j = 0; j < btns.length; j++) {
        btns[j].classList.remove('active');
    }
};

/* ---- UI Helpers ---- */

App.canGenerate = function() {
    return App.hasApiKey() && App.getFinalPrompt().trim().length > 0;
};

App.updateGenerateButton = function() {
    var btn = document.getElementById('generateBtn');
    if (!btn) return;
    btn.disabled = !App.canGenerate() || App.state.isGenerating;
};

App.handleGenerate = function() {
    if (App.state.isGenerating || !App.canGenerate()) return;

    App.state.isGenerating = true;
    App.updateGenerateButton();

    var generateBtn = document.getElementById('generateBtn');
    if (generateBtn) generateBtn.classList.add('loading');

    // Close editor if active, show loading placeholder
    if (App.state.editor.active) App.closeEditor();
    var placeholder = document.getElementById('previewPlaceholder');
    var canvasWrap = document.getElementById('editorCanvasWrap');
    if (placeholder) {
        placeholder.classList.remove('hidden');
        placeholder.classList.add('loading');
    }
    if (canvasWrap) canvasWrap.classList.add('hidden');

    var finalPrompt = App.getFinalPrompt();
    var model = App.state.model;
    var userPrompt = App.state.prompt;
    var startTime = Date.now();

    App.addLoadingCard();

    App.generateOpenAI(finalPrompt, {
        model: model,
        quality: App.state.quality,
        transparentBg: App.state.transparentBg
    })
    .then(function(result) {
        var duration = Date.now() - startTime;

        App.removeLoadingCard();
        var ph = document.getElementById('previewPlaceholder');
        if (ph) ph.classList.remove('loading');

        var generation = {
            imageBase64: result.imageBase64,
            model: model,
            userPrompt: userPrompt,
            enrichedPrompt: finalPrompt,
            axes: JSON.parse(JSON.stringify(App.state.axes)),
            stylePreset: App.state.stylePreset,
            quality: App.state.quality,
            transparent: App.state.transparentBg,
            duration: duration,
            timestamp: Date.now()
        };

        App.addToGallery(generation);

        // Load the generated image into the preview frame
        App.openEditor(generation);
    })
    .catch(function(error) {
        App.removeLoadingCard();
        var ph = document.getElementById('previewPlaceholder');
        if (ph) ph.classList.remove('loading');
        App.showToast(error.message || 'Generation failed', 'error');
        console.error('Generation error:', error);

        if (App.state.generations.length === 0) {
            var emptyState = document.getElementById('galleryEmpty');
            if (emptyState) emptyState.style.display = '';
        }
    })
    .finally(function() {
        App.state.isGenerating = false;
        App.updateGenerateButton();
        if (generateBtn) generateBtn.classList.remove('loading');
    });
};

/* ---- Sync UI from State ---- */

App.syncUIFromState = function() {
    // API key
    var apiKeyInput = document.getElementById('apiKeyInput');
    if (apiKeyInput) apiKeyInput.value = App.getApiKey();

    // Style cards active state
    var styleCards = document.getElementById('styleCards');
    if (styleCards) {
        var cards = styleCards.querySelectorAll('.style-card');
        for (var ci = 0; ci < cards.length; ci++) {
            cards[ci].classList.toggle('active', cards[ci].getAttribute('data-preset') === App.state.stylePreset);
        }
    }

    // Axes sliders
    for (var ai = 0; ai < App.AXES.length; ai++) {
        var axSlider = document.getElementById('axis-' + App.AXES[ai].key);
        if (axSlider) axSlider.value = App.state.axes[App.AXES[ai].key];
    }

    // Material
    var materialSelect = document.getElementById('materialSelect');
    if (materialSelect) {
        materialSelect.innerHTML = '';
        for (var mid in App.MATERIALS) {
            var mopt = document.createElement('option');
            mopt.value = mid;
            mopt.textContent = App.MATERIALS[mid].name;
            materialSelect.appendChild(mopt);
        }
        if (App.MATERIALS[App.state.material]) {
            materialSelect.value = App.state.material;
        }
    }

    // Color picker
    var colorPicker = document.getElementById('colorPicker');
    var colorPickerLabel = document.getElementById('colorPickerLabel');
    var colorPickerReset = document.getElementById('colorPickerReset');
    if (colorPicker && colorPickerLabel) {
        if (App.state.color) {
            colorPicker.value = App.state.color;
            colorPicker.classList.remove('inactive');
            colorPickerLabel.textContent = App.state.color;
            colorPickerLabel.classList.add('active');
            if (colorPickerReset) colorPickerReset.classList.remove('hidden');
        } else {
            colorPicker.classList.add('inactive');
            colorPickerLabel.textContent = 'None';
            colorPickerLabel.classList.remove('active');
            if (colorPickerReset) colorPickerReset.classList.add('hidden');
        }
    }

    // Prompt input
    var promptInput = document.getElementById('promptInput');
    if (promptInput) {
        if (App.state.prompt) promptInput.value = App.state.prompt;
        var activePreset = App.STYLE_PRESETS[App.state.stylePreset];
        if (activePreset && activePreset.placeholder) {
            promptInput.placeholder = activePreset.placeholder;
        }
    }

    // Generate button
    App.updateGenerateButton();
};
