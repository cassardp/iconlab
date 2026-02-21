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
    var preset = App.STYLE_PRESETS[App.state.stylePreset] || App.STYLE_PRESETS['illustration'];

    // 1. Subject
    sections.push('Subject: ' + preset.subject.replace('{subject}', subject));

    // 2. Style = base + axis keywords
    var styleWords = [preset.base];
    for (var i = 0; i < App.AXES.length; i++) {
        var axis = App.AXES[i];
        var val = App.state.axes[axis.key];
        var stops = preset.axes[axis.key];
        if (!stops) continue;
        var stopIndex = val <= 0 ? 0 : (val <= 50 ? 1 : 2);
        var kw = stops[stopIndex];
        if (kw) styleWords.push(kw);
    }
    sections.push('Style: ' + styleWords.join(', '));

    // 3. Material
    var material = App.MATERIALS[App.state.material];
    if (material && material.keywords) {
        sections.push('Material: ' + material.keywords);
    }

    // 4. Dominant color
    if (App.state.color) {
        sections.push('Monochrome palette. Dominant color: ' + App.state.color);
    }

    // 5. Constraints
    sections.push(preset.constraints.join('\n'));

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
