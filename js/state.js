/* ============================================
   State — Etat global de l'application
   ============================================ */

var App = window.App || {};

/* ---- Etat ---- */

App.state = {
    model: 'gpt-image-1.5',
    prompt: '',
    stylePreset: '',
    axes: { volume: 0, color: 100, shape: 100, detail: 0, text: 0 },
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
        bgColor: '#4A90D9',
        gradientCenter: '#5BC0EB',
        gradientEdge: '#2E6EA6',
        linearAngle: 180,
        linearStart: '#5BC0EB',
        linearEnd: '#2E6EA6',
        meshColors: ['#5BC0EB', '#3A86C8', '#48B8D0', '#2E6EA6'],
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

/* ---- Persistence ---- */

App.saveState = function() {
    localStorage.setItem(App.STORAGE_KEYS.model, App.state.model);
    localStorage.setItem(App.STORAGE_KEYS.quality, App.state.quality);
};

App.loadSavedState = function() {
    App.state.model = 'gpt-image-1.5';
    App.state.quality = 'medium';
};
