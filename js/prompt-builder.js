/* ============================================
   Prompt Builder — Construction du prompt enrichi
   ============================================ */

var App = window.App || {};

/**
 * Construit le prompt enrichi a partir du prompt utilisateur
 * et du style selectionne. Le resultat est editable par l'utilisateur
 * dans le textarea avant envoi.
 */
App.buildEnrichedPrompt = function(userPrompt, colorMode, subjectType, transparentBg) {
    if (!userPrompt || !userPrompt.trim()) {
        return '';
    }

    var parts = [];
    var isLetter = subjectType === 'letter';

    // 1. Intention + cadrage
    if (isLetter) {
        parts.push('Create a single stylized letter render suitable for use as a mobile app icon.');
    } else {
        parts.push('Create a single illustration suitable for use as a mobile app icon.');
    }
    parts.push('The subject should be centered in the frame, filling approximately 70-80% of the canvas.');
    parts.push('Clean, minimal design with a single focal point.');

    // 2. Sujet (integre le subject type)
    if (isLetter) {
        parts.push('Subject: the letter "' + userPrompt.trim() + '", a single typographic letter or character');
    } else {
        parts.push('Subject: ' + userPrompt.trim());
    }

    // 3. Style de base (flat tonal) + color mode variable
    var colorModeObj = App.COLOR_MODES[colorMode];
    var colorModeKeywords = colorModeObj ? colorModeObj.keywords : App.COLOR_MODES['gradient'].keywords;

    var subjectWord = 'illustration';
    if (subjectType === 'animal') subjectWord = 'character mascot with minimal facial traits';
    else if (subjectType === 'human') subjectWord = 'human character with minimal facial traits';

    var preset = App.STYLE_PRESETS[App.state.stylePreset] || App.STYLE_PRESETS['illustration'];
    parts.push(preset.buildStyle(subjectWord, colorModeKeywords, isLetter));

    // 5. Material + couleur
    var material = App.MATERIALS[App.state.material];
    if (material && material.keywords) {
        parts.push('Material: ' + material.keywords);
    }

    if (App.state.color) {
        parts.push('Dominant color: ' + App.state.color);
    }

    // 6. Fond
    if (transparentBg) {
        parts.push('The subject should be rendered on a fully transparent background. No shadows, halos, or glows.');
    } else {
        parts.push('The subject should be rendered on a clean, uncluttered background.');
    }

    // 8. Contraintes
    parts.push('Important constraints:');
    if (!isLetter) {
        parts.push('- Do NOT include any text, words, letters, numbers, or typography');
    }
    parts.push('- Do NOT include any UI elements, borders, or rounded corners');
    parts.push('- Do NOT include any device frames or mockups');
    parts.push('- No cast shadows under or around the subject');
    parts.push('- The illustration must be self-contained and work at small sizes');
    parts.push('- Use professional quality rendering with crisp edges');

    return parts.join('\n');
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
        App.state.colorMode,
        App.state.subjectType,
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
