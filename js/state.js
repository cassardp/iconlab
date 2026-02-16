/* ============================================
   State — Etat global de l'application
   ============================================ */

var App = window.App || {};

/* ---- Etat ---- */

App.state = {
    model: 'gpt-image-1.5',
    prompt: '',
    colorMode: 'gradient',
    subjectType: 'object',
    material: 'none',
    color: '',
    transparentBg: true,
    quality: 'medium',
    isGenerating: false,
    generations: [],
    editor: {
        active: false,
        generationIndex: -1,
        bgType: 'solid',
        bgColor: '#1a1a1a',
        gradientCenter: '#2a2a4a',
        gradientEdge: '#0a0a1a',
        scale: 100,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        shadowEnabled: false,
        shadowBlur: 20,
        shadowOffsetY: 8,
        shadowOpacity: 40,
        shadowColor: '#000000',
        exportSize: 1024
    }
};

/* ---- Helpers ---- */

App.getApiKey = function() {
    return localStorage.getItem(App.STORAGE_KEYS.apiKey) || '';
};

App.saveApiKey = function(value) {
    if (value && value.trim()) {
        localStorage.setItem(App.STORAGE_KEYS.apiKey, value.trim());
    } else {
        localStorage.removeItem(App.STORAGE_KEYS.apiKey);
    }
};

App.hasApiKey = function() {
    return App.getApiKey().length > 0;
};

App.getActiveModel = function() {
    return App.MODELS[App.state.model] || null;
};

App.estimateCost = function(modelId, quality) {
    var model = App.MODELS[modelId];
    if (!model) return 0;
    return model.pricing[quality || 'medium'] || 0;
};

/* ---- Persistence ---- */

App.saveState = function() {
    localStorage.setItem(App.STORAGE_KEYS.model, App.state.model);
    localStorage.setItem(App.STORAGE_KEYS.colorMode, App.state.colorMode);
    localStorage.setItem(App.STORAGE_KEYS.subjectType, App.state.subjectType);
    localStorage.setItem(App.STORAGE_KEYS.material, App.state.material);
    localStorage.setItem(App.STORAGE_KEYS.color, App.state.color);
    localStorage.setItem(App.STORAGE_KEYS.quality, App.state.quality);
};

App.loadSavedState = function() {
    // Model and quality are locked to gpt-image-1.5 / medium
    App.state.model = 'gpt-image-1.5';
    App.state.quality = 'medium';

    var colorMode = localStorage.getItem(App.STORAGE_KEYS.colorMode);
    if (colorMode && App.COLOR_MODES[colorMode]) {
        App.state.colorMode = colorMode;
    }

    var subjectType = localStorage.getItem(App.STORAGE_KEYS.subjectType);
    if (subjectType && App.SUBJECT_TYPES[subjectType]) {
        App.state.subjectType = subjectType;
    }

    var material = localStorage.getItem(App.STORAGE_KEYS.material);
    if (material && App.MATERIALS[material]) {
        App.state.material = material;
    }

    var color = localStorage.getItem(App.STORAGE_KEYS.color);
    if (color) {
        App.state.color = color;
    }


};
