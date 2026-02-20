/* ============================================
   State — Etat global de l'application
   ============================================ */

var App = window.App || {};

/* ---- Etat ---- */

App.state = {
    model: 'gpt-image-1.5',
    prompt: '',
    stylePreset: 'illustration',
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

/* ---- Persistence ---- */

App.saveState = function() {
    localStorage.setItem(App.STORAGE_KEYS.model, App.state.model);
    localStorage.setItem(App.STORAGE_KEYS.quality, App.state.quality);
    localStorage.setItem(App.STORAGE_KEYS.axes, JSON.stringify(App.state.axes));
    localStorage.setItem(App.STORAGE_KEYS.stylePreset, App.state.stylePreset);
};

App.loadSavedState = function() {
    App.state.model = 'gpt-image-1.5';
    App.state.quality = 'medium';

    var savedPreset = localStorage.getItem(App.STORAGE_KEYS.stylePreset);
    if (savedPreset && App.STYLE_PRESETS[savedPreset]) {
        App.state.stylePreset = savedPreset;
    }

    var savedAxes = localStorage.getItem(App.STORAGE_KEYS.axes);
    if (savedAxes) {
        try {
            var parsed = JSON.parse(savedAxes);
            for (var k in App.AXIS_DEFAULTS) {
                App.state.axes[k] = (parsed[k] !== undefined) ? parsed[k] : App.AXIS_DEFAULTS[k];
            }
        } catch (e) {
            App.state.axes = JSON.parse(JSON.stringify(App.AXIS_DEFAULTS));
        }
    }
};
