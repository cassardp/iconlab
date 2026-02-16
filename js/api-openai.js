/* ============================================
   API OpenAI — GPT Image generation
   ============================================ */

var App = window.App || {};

/**
 * Genere une image via l'API OpenAI (endpoint generations).
 *
 * @param {string} prompt - Prompt final
 * @param {object} options - { model, quality, transparentBg }
 * @returns {Promise<{imageBase64: string, model: string}>}
 */
App.generateOpenAI = function(prompt, options) {
    var apiKey = App.getApiKey();
    if (!apiKey) {
        return Promise.reject(new Error('No OpenAI API key configured'));
    }

    var model = options.model || 'gpt-image-1';
    var quality = options.quality || 'medium';
    var background = options.transparentBg ? 'transparent' : 'auto';

    return App._generateDirect(prompt, apiKey, model, quality, background);
};

/**
 * Generation directe (sans image de reference).
 */
App._generateDirect = function(prompt, apiKey, model, quality, background) {
    var body = {
        model: model,
        prompt: prompt,
        size: '1024x1024',
        quality: quality,
        output_format: 'png',
        background: background,
        n: 1
    };

    return App._fetchWithRetry('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify(body)
    }).then(function(data) {
        return App._extractImageFromResponse(data, model);
    });
};

/**
 * Fetch avec retry sur rate limit.
 */
App._fetchWithRetry = function(url, options, attempt) {
    attempt = attempt || 0;

    return fetch(url, options).then(function(response) {
        if ((response.status === 429 || response.status === 529) && attempt < 3) {
            var delay = Math.pow(2, attempt) * 1000;
            return new Promise(function(resolve) {
                setTimeout(resolve, delay);
            }).then(function() {
                return App._fetchWithRetry(url, options, attempt + 1);
            });
        }

        if (!response.ok) {
            return response.json().then(function(err) {
                var message = 'OpenAI API error';
                if (err && err.error && err.error.message) {
                    message = err.error.message;
                } else if (response.status === 401) {
                    message = 'Invalid API key.';
                } else if (response.status === 403) {
                    message = 'Access denied.';
                } else if (response.status === 429) {
                    message = 'Rate limit exceeded. Wait a moment.';
                }
                throw new Error(message);
            }).catch(function(parseErr) {
                if (parseErr.message && parseErr.message !== 'OpenAI API error') {
                    throw parseErr;
                }
                throw new Error('OpenAI API error (HTTP ' + response.status + ')');
            });
        }

        return response.json();
    });
};

/**
 * Extrait l'image base64 de la reponse API.
 */
App._extractImageFromResponse = function(data, model) {
    if (!data.data || !data.data[0]) {
        throw new Error('No image data in response');
    }
    var base64 = data.data[0].b64_json;
    if (!base64) {
        throw new Error('No b64_json in response');
    }
    return { imageBase64: base64, model: model };
};

/**
 * Verifie les modeles image disponibles via l'API OpenAI.
 * Affiche une notification si un nouveau modele est detecte.
 */
App.checkNewModels = function() {
    var apiKey = App.getApiKey();
    if (!apiKey) return;

    fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': 'Bearer ' + apiKey }
    })
    .then(function(response) {
        if (!response.ok) return;
        return response.json();
    })
    .then(function(data) {
        if (!data || !data.data) return;

        var knownIds = Object.keys(App.MODELS);
        var newModels = [];

        data.data.forEach(function(model) {
            if (model.id && model.id.indexOf('gpt-image') === 0) {
                var isKnown = knownIds.indexOf(model.id) !== -1;
                if (!isKnown) {
                    newModels.push(model.id);
                }
            }
        });

        if (newModels.length > 0) {
            App._showNewModelsNotice(newModels);
        }
    })
    .catch(function() {
        // Silencieux — pas grave si ca echoue
    });
};

/**
 * Affiche un bandeau de notification pour les nouveaux modeles.
 */
App._showNewModelsNotice = function(modelIds) {
    var existing = document.getElementById('newModelsNotice');
    if (existing) existing.remove();

    var notice = document.createElement('div');
    notice.id = 'newModelsNotice';
    notice.className = 'new-models-notice';
    notice.innerHTML = '<span>New image model(s) available: <strong>' +
        modelIds.join(', ') +
        '</strong></span>' +
        '<button onclick="this.parentElement.remove()" title="Close">&times;</button>';

    document.body.prepend(notice);
};

