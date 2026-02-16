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

    /* ---- Color Mode Select ---- */

    var colorModeSelect = document.getElementById('colorModeSelect');
    if (colorModeSelect) {
        colorModeSelect.addEventListener('change', function() {
            App.state.colorMode = this.value;
            App.toggleColorRow();
            App.resetEnrichedPrompt();
            App.saveState();
        });
    }

    /* ---- Subject Type Select ---- */

    var subjectTypeSelect = document.getElementById('subjectTypeSelect');
    if (subjectTypeSelect) {
        subjectTypeSelect.addEventListener('change', function() {
            App.state.subjectType = this.value;
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
        var cost = App.estimateCost(model, App.state.quality);

        App.removeLoadingCard();

        App.addToGallery({
            imageBase64: result.imageBase64,
            model: model,
            userPrompt: userPrompt,
            enrichedPrompt: finalPrompt,
            colorMode: App.state.colorMode,
            subjectType: App.state.subjectType,
            quality: App.state.quality,
            transparent: App.state.transparentBg,
            duration: duration,
            cost: cost,
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

/* ---- Toggle Color Row ---- */

App.toggleColorRow = function() {
    // Color row always visible regardless of color mode
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

    // Color Mode
    var colorModeSelect = document.getElementById('colorModeSelect');
    if (colorModeSelect) {
        colorModeSelect.innerHTML = '';
        for (var cmid in App.COLOR_MODES) {
            var cmopt = document.createElement('option');
            cmopt.value = cmid;
            cmopt.textContent = App.COLOR_MODES[cmid].name;
            colorModeSelect.appendChild(cmopt);
        }
        if (App.COLOR_MODES[App.state.colorMode]) {
            colorModeSelect.value = App.state.colorMode;
        }
    }

    // Show/hide color row
    App.toggleColorRow();

    // Subject Type
    var subjectTypeSelect = document.getElementById('subjectTypeSelect');
    if (subjectTypeSelect) {
        subjectTypeSelect.innerHTML = '';
        for (var stid in App.SUBJECT_TYPES) {
            var stopt = document.createElement('option');
            stopt.value = stid;
            stopt.textContent = App.SUBJECT_TYPES[stid].name;
            subjectTypeSelect.appendChild(stopt);
        }
        if (App.SUBJECT_TYPES[App.state.subjectType]) {
            subjectTypeSelect.value = App.state.subjectType;
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
            colorPickerLabel.textContent = 'None';
            colorPickerLabel.classList.remove('active');
            if (colorPickerReset) colorPickerReset.classList.add('hidden');
        }
    }

    // Generate button
    App.updateGenerateButton();
};
