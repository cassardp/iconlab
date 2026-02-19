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

    /* ---- Model ---- */

    var modelSelect = document.getElementById('modelSelect');
    if (modelSelect) {
        modelSelect.addEventListener('change', function() {
            App.state.model = this.value;
            App.saveState();
        });
    }

    /* ---- Quality ---- */

    var qualitySelect = document.getElementById('qualitySelect');
    if (qualitySelect) {
        qualitySelect.addEventListener('change', function() {
            App.state.quality = this.value;
            App.saveState();
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

    /* ---- Style Preset Select ---- */

    var stylePresetSelect = document.getElementById('stylePresetSelect');
    if (stylePresetSelect) {
        stylePresetSelect.addEventListener('change', function() {
            App.state.stylePreset = this.value;
            if (this.value === 'logo') {
                App.state.colorMulti = false;
                var multiToggle = document.getElementById('colorMultiToggle');
                if (multiToggle) multiToggle.checked = false;
                App.toggleColorRow();
                App._setColorPicker('#000000');
            }
            App.resetEnrichedPrompt();
            App.saveState();
        });
    }

    /* ---- Rounded Toggle ---- */

    var roundedToggle = document.getElementById('roundedToggle');
    if (roundedToggle) {
        roundedToggle.addEventListener('change', function() {
            App.state.rounded = this.checked;
            App.resetEnrichedPrompt();
            App.saveState();
        });
    }

    /* ---- Color Toggles ---- */

    var colorGradientToggle = document.getElementById('colorGradientToggle');
    if (colorGradientToggle) {
        colorGradientToggle.addEventListener('change', function() {
            App.state.colorGradient = this.checked;
            App._updateColorLabels();
            App.resetEnrichedPrompt();
            App.saveState();
        });
    }

    var colorMultiToggle = document.getElementById('colorMultiToggle');
    if (colorMultiToggle) {
        colorMultiToggle.addEventListener('change', function() {
            App.state.colorMulti = this.checked;
            App._updateColorLabels();
            App.toggleColorRow();
            App.resetEnrichedPrompt();
            App.saveState();
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

        App.addToGallery({
            imageBase64: result.imageBase64,
            model: model,
            userPrompt: userPrompt,
            enrichedPrompt: finalPrompt,
            colorGradient: App.state.colorGradient,
            colorMulti: App.state.colorMulti,
            quality: App.state.quality,
            transparent: App.state.transparentBg,
            duration: duration,
            timestamp: Date.now()
        });
    })
    .catch(function(error) {
        App.removeLoadingCard();
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

/* ---- Set Color Picker programmatically ---- */

App._setColorPicker = function(hex) {
    App.state.color = hex;
    var picker = document.getElementById('colorPicker');
    var label = document.getElementById('colorPickerLabel');
    var reset = document.getElementById('colorPickerReset');
    if (picker) {
        picker.value = hex;
        picker.classList.remove('inactive');
    }
    if (label) {
        label.textContent = hex;
        label.classList.add('active');
    }
    if (reset) reset.classList.remove('hidden');
};

/* ---- Update Color Toggle Labels ---- */

App._updateColorLabels = function() {
    // Labels fixes, pas de changement dynamique
};

/* ---- Toggle Color Row ---- */

App.toggleColorRow = function() {
    var row = document.getElementById('colorRow');
    if (!row) return;
    if (!App.state.colorMulti) {
        row.classList.remove('hidden');
    } else {
        row.classList.add('hidden');
        App.state.color = '';
    }
};

/* ---- Sync UI from State ---- */

App.syncUIFromState = function() {
    // API key
    var apiKeyInput = document.getElementById('apiKeyInput');
    if (apiKeyInput) apiKeyInput.value = App.getApiKey();

    // Model
    var modelSelect = document.getElementById('modelSelect');
    if (modelSelect) {
        modelSelect.innerHTML = '';
        for (var id in App.MODELS) {
            var option = document.createElement('option');
            option.value = id;
            option.textContent = App.MODELS[id].name;
            modelSelect.appendChild(option);
        }
        if (App.MODELS[App.state.model]) {
            modelSelect.value = App.state.model;
        }
    }

    // Quality
    var qualitySelect = document.getElementById('qualitySelect');
    if (qualitySelect) qualitySelect.value = App.state.quality;

    // Style Preset
    var stylePresetSelect = document.getElementById('stylePresetSelect');
    if (stylePresetSelect) {
        stylePresetSelect.innerHTML = '';
        for (var spid in App.STYLE_PRESETS) {
            var spopt = document.createElement('option');
            spopt.value = spid;
            spopt.textContent = App.STYLE_PRESETS[spid].name;
            stylePresetSelect.appendChild(spopt);
        }
        if (App.STYLE_PRESETS[App.state.stylePreset]) {
            stylePresetSelect.value = App.state.stylePreset;
        }
    }

    // Rounded Toggle
    var roundedToggle = document.getElementById('roundedToggle');
    if (roundedToggle) roundedToggle.checked = App.state.rounded;

    // Color Toggles
    var colorGradientToggle = document.getElementById('colorGradientToggle');
    if (colorGradientToggle) colorGradientToggle.checked = App.state.colorGradient;
    var colorMultiToggle = document.getElementById('colorMultiToggle');
    if (colorMultiToggle) colorMultiToggle.checked = App.state.colorMulti;

    // Sync color toggle labels and show/hide color row
    App._updateColorLabels();
    App.toggleColorRow();

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

    // Generate button
    App.updateGenerateButton();
};
