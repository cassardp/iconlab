# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Icon Lab est un outil web pour generer et iterer sur des icones d'applications via l'API OpenAI GPT Image. Pure application frontend (pas de backend, pas de build step) qui tourne directement dans le navigateur.

## Running Locally

Pas de build step. Ouvrir `index.html` dans un navigateur, ou servir localement :

```bash
python3 -m http.server 8000
npx serve .
```

## Architecture

**Vanilla JavaScript** attache a un namespace global `App`. Pas de framework, pas de bundler, pas de modules ES.

### Script Loading Order

Scripts charges via `<script>` dans `index.html` dans cet ordre strict :

1. `js/config.js` — Namespace `App`, modeles, axes, presets, materiaux, constantes
2. `js/state.js` — Etat global (`App.state`) + persistence LocalStorage (API key, theme)
3. `js/prompt-builder.js` — Construction du prompt enrichi depuis preset + axes + material + color
4. `js/api-openai.js` — Appels API OpenAI + retry (429/529) + detection de nouveaux modeles
5. `js/gallery.js` — Galerie (render, events, IndexedDB, canvas composition, download ZIP, toast, clipboard)
6. `js/editor.js` — Orchestration editeur (open/close/save/reset)
7. `js/editor-layers.js` — Gestion des layers (ajout, suppression, reorder, picker)
8. `js/editor-preview.js` — Preview live, sync DOM, gradients, export PNG, utilitaires couleur
9. `js/editor-events.js` — Event listeners de l'editeur (sliders, pickers, drag-to-move, panels)
10. `js/events.js` — Event listeners principaux (prompt, styles, axes, generate, popovers)
11. `app.js` — Point d'entree, init theme, DOMContentLoaded, build UI dynamique

### CSS Structure

`css/styles.css` importe dans l'ordre :
`variables.css` → `base.css` → `layout.css` → `forms.css` → `buttons.css` → `editor.css` → `modal.css`

### Key Patterns

- **State** : Centralise dans `App.state`. Preferences simples dans LocalStorage (API key, theme), galerie dans IndexedDB (`icon-lab` / `generations`, keyPath `timestamp`). Model et quality sont fixes (`gpt-image-1.5`, `medium`).
- **API Calls** : Appels directs navigateur-vers-OpenAI (pas de proxy). Cle API dans LocalStorage. Retry automatique sur rate limit (429/529, backoff exponentiel, max 3 tentatives). Detection de nouveaux modeles `gpt-image-*` au chargement via `/v1/models`.
- **Prompt Builder** : Assemble le prompt depuis le preset actif + axes + material + color. Le prompt enrichi est editable dans un textarea avant envoi. Un flag `_enrichedManuallyEdited` empeche l'ecrasement si l'utilisateur a modifie le texte.
- **Axes semantiques** : 5 sliders discrets (3 stops : 0, 50, 100) controlent le style via `App.AXES` : `volume` (Flat↔3D), `color` (Mono↔Colorful), `shape` (Sharp↔Rounded), `detail` (Minimal↔Detailed), `text` (No Text↔Text).
- **Style Presets** : Chaque preset dans `App.STYLE_PRESETS` definit `{ name, subject, base, constraints, axes }`. Le champ `axes` contient 5 cles, chacune un tableau de 3 strings (stops). **Ajouter un nouveau style = ajouter un objet de config, zero code UI/logique.**

  Structure d'un preset :
  ```js
  'mon-style': {
      name: 'Mon Style',
      subject: 'app icon of {subject}.',
      base: 'keywords toujours inclus',
      constraints: ['No frame...'],
      axes: {
          volume: ['stop flat', 'stop mid', 'stop 3D'],
          color:  ['stop mono', 'stop mid', 'stop colorful'],
          shape:  ['stop sharp', 'stop mid', 'stop rounded'],
          detail: ['stop minimal', 'stop mid', 'stop detailed'],
          text:   ['stop no text', 'stop mid', 'stop text']
      }
  }
  ```
- **Materials** : ~45 materiaux optionnels dans `App.MATERIALS`, chacun avec `{ name, keywords }`. Ajouter un materiau = ajouter une entree.
- **Galerie** : Images generees avec metadonnees. Persistence IndexedDB (base64). Cards avec preview background personnalisable, actions (download ZIP, copy prompt, delete, ouvrir editeur). Infinite scroll par batch de 24.
- **Editor** : Compose jusqu'a 5 layers d'icones avec transforms (scale, rotation, offset), opacity, tint (color blend mode), drop-shadow, et fond personnalisable (solid/radial gradient/linear gradient/mesh gradient/transparent). Export ZIP via canvas rendering (`_renderComposition`) avec 17 tailles iOS/macOS. Proprietes par-layer dans `App.LAYER_DEFAULTS`, fond dans `App.EDITOR_DEFAULTS`.

### UI Layout

- **Topbar** (fixe, centree) : logo, size dropdown, settings, theme toggle, about
- **Left toolbar** (flottante) : bouton galerie
- **Canvas area** (centre) : preview frame + layer picker
- **Right toolbar** (flottante) : export, panels (background, layers, effects) en popover
- **Bottom block** (fixe, centree) : style cards + prompt bar + popovers (enriched prompt, options)
- **Modals** : settings (API key), about

### External Dependencies (CDN)

- **Lucide Icons** — Iconographie UI (`lucide.createIcons()` apres ajout d'elements DOM)
- **JSZip** — Export ZIP multi-tailles
- **Google Fonts (Inter)** — Typographie

## Conventions

- Vanilla JS avec declarations `var` et pattern namespace `App.`
- Fonctions privees/internes prefixees par `_` (ex: `App._renderComposition`, `App._editorSave`)
- CSS custom properties pour le theming (`variables.css`)
- Communiquer avec le developpeur en francais
