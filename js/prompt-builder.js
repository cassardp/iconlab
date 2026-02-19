/* ============================================
   Prompt Builder — Construction du prompt enrichi
   ============================================ */

var App = window.App || {};

/**
 * Construit le prompt enrichi a partir du prompt utilisateur
 * et du style selectionne. Le resultat est editable par l'utilisateur
 * dans le textarea avant envoi.
 */
App.buildEnrichedPrompt = function(userPrompt, transparentBg) {
    if (!userPrompt || !userPrompt.trim()) {
        return '';
    }

    var sections = [];
    var subject = userPrompt.trim();

    // 1. Subject (adapte selon le style)
    if (App.state.stylePreset === 'typography') {
        sections.push('Subject: the letter "' + subject + '", a single typographic letter or character.');
    } else if (App.state.stylePreset === 'logo') {
        sections.push('Subject: logo, modern, Paul Rand style, ' + subject + '.');
    } else {
        sections.push('Subject: app icon of ' + subject + '.');
    }

    // 2. Style (style preset — logo utilise illustration comme base)
    var styleKey = App.state.stylePreset === 'logo' ? 'illustration' : App.state.stylePreset;
    var preset = App.STYLE_PRESETS[styleKey] || App.STYLE_PRESETS['illustration'];
    if (preset.keywords) {
        sections.push('Style: ' + preset.keywords);
    }

    // 3. Color (color mode from toggles)
    var colorKey = (App.state.colorGradient ? 'gradient' : 'flat') + (App.state.colorMulti ? '-multi' : '');
    var colorModeObj = App.COLOR_MODES[colorKey];
    if (colorModeObj) {
        sections.push('Color: ' + colorModeObj.keywords);
    }

    // 4. Material (material select)
    var material = App.MATERIALS[App.state.material];
    if (material && material.keywords) {
        sections.push('Material: ' + material.keywords);
    }

    // 5. Dominant color (color picker) — ajoute monochrome si couleur choisie
    if (App.state.color) {
        sections.push('Monochrome palette. Dominant color: ' + App.state.color);
    }

    // 6. Constraints
    var constraints = [];
    constraints.push('No text or lettering.');
    constraints.push('No frame. No shadows, no glows, no holes or cutouts.');
    sections.push(constraints.join('\n'));

    return sections.join('\n\n');
};

/**
 * Flag : l'utilisateur a edite manuellement le textarea enrichi.
 * Reset quand le prompt input, le style ou la ref image changent.
 */
App._enrichedManuallyEdited = false;

/**
 * Regenere le prompt enrichi et le met dans le textarea editable.
 * Ne remplace PAS si l'utilisateur a deja edite manuellement.
 */
App.updateEnrichedPrompt = function() {
    var textarea = document.getElementById('enrichedPrompt');
    if (!textarea) return;

    if (App._enrichedManuallyEdited) return;

    var enriched = App.buildEnrichedPrompt(
        App.state.prompt,
        App.state.transparentBg
    );

    App._lastGeneratedEnriched = enriched;
    textarea.value = enriched;
};

/**
 * Force la regeneration du prompt enrichi (reset le flag manual edit).
 */
App.resetEnrichedPrompt = function() {
    App._enrichedManuallyEdited = false;
    App.updateEnrichedPrompt();
};

/**
 * Retourne le prompt final (celui du textarea, potentiellement edite).
 */
App.getFinalPrompt = function() {
    var textarea = document.getElementById('enrichedPrompt');
    return textarea ? textarea.value : '';
};
