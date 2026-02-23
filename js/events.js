/* ============================================
   Events — Event listeners
   ============================================ */

var App = window.App || {};

App.initEventListeners = function() {

    /* ---- API Key (bar below topbar) ---- */

    var apiKeyInput = document.getElementById('tokenInput');
    var apiKeyBar = document.getElementById('apiKeyBar');
    var apiKeyBtn = document.getElementById('apiKeyBtn');
    var apiKeyToggle = document.getElementById('apiKeyToggle');

    App._toggleApiKeyBar = function() {
        if (!apiKeyBar) return;
        var isHidden = apiKeyBar.classList.contains('hidden');
        apiKeyBar.classList.toggle('hidden', !isHidden);
        if (apiKeyBtn) apiKeyBtn.classList.toggle('active', isHidden);
        if (isHidden && apiKeyInput) {
            lucide.createIcons({ nodes: [apiKeyBar] });
            apiKeyInput.focus();
        }
    };

    if (apiKeyBtn) {
        apiKeyBtn.addEventListener('click', function() {
            App._toggleApiKeyBar();
        });
    }

    if (apiKeyInput) {
        apiKeyInput.addEventListener('input', function() {
            App.saveApiKey(this.value.trim());
            App.updateGenerateButton();
        });
    }

    if (apiKeyToggle && apiKeyInput) {
        apiKeyToggle.addEventListener('click', function() {
            var isVisible = apiKeyInput.classList.toggle('visible');
            apiKeyToggle.innerHTML = '<i data-lucide="' + (isVisible ? 'eye-off' : 'eye') + '"></i>';
            lucide.createIcons({ nodes: [apiKeyToggle] });
        });
    }

    // Click outside closes
    document.addEventListener('mousedown', function(e) {
        if (apiKeyBar && !apiKeyBar.classList.contains('hidden')) {
            if (!apiKeyBar.contains(e.target) && !apiKeyBtn.contains(e.target)) {
                App._toggleApiKeyBar();
            }
        }
    });

    // Auto-open if no key saved
    if (!App.hasApiKey()) {
        App._toggleApiKeyBar();
    }

    /* ---- Prompt Input ---- */

    var promptInput = document.getElementById('promptInput');
    if (promptInput) {
        promptInput.addEventListener('input', function() {
            App.state.prompt = this.value;
            App.resetEnrichedPrompt();
            App.updateGenerateButton();
        });
        promptInput.addEventListener('mousedown', function() {
            App._closeAllSections();
        });
    }

    /* ---- Style Cards (click delegation) ---- */

    var styleCards = document.getElementById('styleCards');
    if (styleCards) {
        styleCards.addEventListener('click', function(e) {
            var card = e.target.closest('.style-chip');
            if (!card) return;
            var presetId = card.getAttribute('data-preset');
            if (!presetId || !App.STYLE_PRESETS[presetId]) return;

            var wasActive = App.state.stylePreset === presetId;

            var promptInput = document.getElementById('promptInput');

            if (wasActive) {
                // Deselect style + close options
                App.state.stylePreset = null;
                App._closeAllSections();
                if (promptInput) promptInput.placeholder = 'Choose a style to start...';
            } else {
                // Select style + open options
                App.state.stylePreset = presetId;
                var preset = App.STYLE_PRESETS[presetId];

                var promptInput = document.getElementById('promptInput');
                if (promptInput && preset.placeholder) {
                    promptInput.placeholder = preset.placeholder;
                }

                if (preset.defaultAxes) {
                    for (var axKey in preset.defaultAxes) {
                        App.state.axes[axKey] = preset.defaultAxes[axKey];
                        var axSeg = document.getElementById('axis-' + axKey);
                        if (axSeg) {
                            var axBtns = axSeg.querySelectorAll('.seg-btn');
                            for (var ab = 0; ab < axBtns.length; ab++) {
                                axBtns[ab].classList.toggle('active', parseInt(axBtns[ab].getAttribute('data-value'), 10) === preset.defaultAxes[axKey]);
                            }
                        }
                    }
                }

                // Open axes ribbon
                App._closeAllSections();
                var ribbon = document.getElementById('axesSliders');
                if (ribbon) ribbon.classList.add('open');
                var toolbar = document.getElementById('bottomToolbar');
                if (toolbar) toolbar.classList.add('backdrop-active');
            }

            App.resetEnrichedPrompt();
            App.saveState();
            App.updateGenerateButton();

            // Update active state on cards
            var allCards = styleCards.querySelectorAll('.style-chip');
            for (var i = 0; i < allCards.length; i++) {
                allCards[i].classList.toggle('active', allCards[i].getAttribute('data-preset') === App.state.stylePreset);
            }
        });
    }

    /* ---- Axes Segmented Controls ---- */

    var axesContainer = document.getElementById('axesSliders');
    if (axesContainer) {
        axesContainer.addEventListener('click', function(e) {
            var btn = e.target.closest('.seg-btn');
            if (!btn) return;
            var seg = btn.closest('.segmented');
            if (!seg) return;
            var axisKey = seg.id.replace('axis-', '');
            var value = parseInt(btn.getAttribute('data-value'), 10);

            App.state.axes[axisKey] = value;

            var btns = seg.querySelectorAll('.seg-btn');
            for (var i = 0; i < btns.length; i++) {
                btns[i].classList.toggle('active', btns[i] === btn);
            }

            App.resetEnrichedPrompt();
        });
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
                colorPickerLabel.textContent = 'Color';
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

    /* ---- Options Toggle (axes ribbon) ---- */

    var enrichedPromptToggle = document.getElementById('enrichedPromptToggle');
    if (enrichedPromptToggle) {
        enrichedPromptToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            var ribbon = document.getElementById('axesSliders');
            if (!ribbon) return;
            var wasOpen = ribbon.classList.contains('open');
            App._closeAllSections();
            if (!wasOpen) {
                ribbon.classList.add('open');
                this.classList.add('active');
                var toolbar = document.getElementById('bottomToolbar');
                if (toolbar) toolbar.classList.add('backdrop-active');
            }
        });
    }

    /* ---- Full Prompt Toggle ---- */

    var fullPromptToggle = document.getElementById('fullPromptToggle');
    if (fullPromptToggle) {
        fullPromptToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            App._toggleSection('enrichedSection', this);
        });
    }

    /* ---- Close sections on outside click ---- */

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.prompt-container') && !e.target.closest('.prompt-bar-btn') && !e.target.closest('.axes-ribbon') && !e.target.closest('.style-ribbon')) {
            App._closeAllSections();
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

/* ---- Toggle prompt section ---- */

App._toggleSection = function(sectionId, btn) {
    var section = document.getElementById(sectionId);
    if (!section) return;
    var wasOpen = section.classList.contains('open');
    App._closeAllSections();
    if (!wasOpen) {
        section.classList.add('open');
        if (btn) btn.classList.add('active');
        lucide.createIcons({ nodes: [section] });
        var toolbar = document.getElementById('bottomToolbar');
        if (toolbar) toolbar.classList.add('backdrop-active');
    }
};

/* ---- Close all sections ---- */

App._closeAllSections = function() {
    var sections = document.querySelectorAll('.prompt-section, .axes-ribbon');
    for (var i = 0; i < sections.length; i++) {
        sections[i].classList.remove('open');
    }
    var btns = document.querySelectorAll('.prompt-bar-btn');
    for (var j = 0; j < btns.length; j++) {
        btns[j].classList.remove('active');
    }
    var toolbar = document.getElementById('bottomToolbar');
    if (toolbar) toolbar.classList.remove('backdrop-active');
};

/* ---- UI Helpers ---- */

App.canGenerate = function() {
    return App.hasApiKey() && App.state.stylePreset && App.getFinalPrompt().trim().length > 0;
};

App.updateGenerateButton = function() {
    var btn = document.getElementById('generateBtn');
    if (!btn) return;
    btn.disabled = !App.canGenerate() || App.state.isGenerating;
};

App.handleGenerate = function() {
    if (App.state.isGenerating || !App.canGenerate()) return;

    App._closeAllSections();
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
    var apiKeyInput = document.getElementById('tokenInput');
    if (apiKeyInput) apiKeyInput.value = App.getApiKey();

    // Style cards active state
    var styleCards = document.getElementById('styleCards');
    if (styleCards) {
        var cards = styleCards.querySelectorAll('.style-chip');
        for (var ci = 0; ci < cards.length; ci++) {
            cards[ci].classList.toggle('active', cards[ci].getAttribute('data-preset') === App.state.stylePreset);
        }
    }

    // Axes segmented controls
    for (var ai = 0; ai < App.AXES.length; ai++) {
        var axSeg = document.getElementById('axis-' + App.AXES[ai].key);
        if (axSeg) {
            var axVal = App.state.axes[App.AXES[ai].key];
            var axBtns = axSeg.querySelectorAll('.seg-btn');
            for (var ab = 0; ab < axBtns.length; ab++) {
                axBtns[ab].classList.toggle('active', parseInt(axBtns[ab].getAttribute('data-value'), 10) === axVal);
            }
        }
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
            colorPickerLabel.textContent = 'Color';
            colorPickerLabel.classList.remove('active');
            if (colorPickerReset) colorPickerReset.classList.add('hidden');
        }
    }

    // Prompt input
    var promptInput = document.getElementById('promptInput');
    if (promptInput) {
        if (App.state.prompt) promptInput.value = App.state.prompt;
        var activePreset = App.STYLE_PRESETS[App.state.stylePreset];
        promptInput.placeholder = activePreset && activePreset.placeholder
            ? activePreset.placeholder
            : 'Choose a style to start...';
    }

    // Generate button
    App.updateGenerateButton();
};
