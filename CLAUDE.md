# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Icon Lab est un outil web de test pour la generation d'illustrations d'icones d'applications via l'API OpenAI GPT Image. Le but est de tester et iterer sur les prompts. C'est une pure application frontend (pas de backend, pas de build step) qui tourne directement dans le navigateur.

## Running Locally

Pas de build step. Ouvrir `index.html` dans un navigateur, ou servir localement :

```bash
python3 -m http.server 8000
npx serve .
```

## Architecture

**Module-based vanilla JavaScript** attache a un namespace global `App`. Pas de framework, pas de bundler.

### Script Loading Order

Tous les scripts sont charges via `<script>` dans `index.html` dans cet ordre strict (pas de modules ES) :

1. `js/config.js` — Namespace `App` + constantes
2. `js/state.js` — Etat global + persistence LocalStorage
3. `js/prompt-builder.js` — Construction du prompt enrichi
4. `js/api-openai.js` — Appels API OpenAI
5. `js/gallery.js` — Galerie + IndexedDB + utilitaires (toast, clipboard, canvas render)
6. `js/editor.js` — Orchestration editeur (open/close/save/reset)
7. `js/editor-layers.js` — Gestion des layers (ajout, suppression, reorder, picker)
8. `js/editor-preview.js` — Preview live, sync DOM, export PNG, utilitaires couleur
9. `js/editor-events.js` — Event listeners de l'editeur
10. `js/events.js` — Event listeners principaux (settings panel, generate)
11. `app.js` — Point d'entree, init theme, DOMContentLoaded

### CSS Structure

`css/styles.css` est le point d'entree, importe dans l'ordre :
`variables.css` → `base.css` → `layout.css` → `forms.css` → `buttons.css` → `editor.css` → `modal.css`

### Key Patterns

- **State** : Centralise dans `App.state` (model, prompt, style, quality, editor). Preferences simples dans LocalStorage, galerie dans IndexedDB (`icon-lab` / `generations`, keyPath `timestamp`).
- **API Calls** : Appels directs navigateur-vers-OpenAI (pas de proxy). Cle API stockee dans LocalStorage. Retry automatique sur rate limit (429/529, backoff exponentiel, max 3 tentatives).
- **Prompt Builder** : Enrichit le prompt utilisateur avec instructions pour icone d'app (style, material, couleur, subject type). Le prompt enrichi est editable dans un textarea avant envoi. Un flag `_enrichedManuallyEdited` empeche l'ecrasement si l'utilisateur a modifie le texte.
- **Galerie** : Affiche les images generees avec metadonnees. Persistence via IndexedDB (images base64 stockees directement). Les cards supportent preview background personnalisable et actions (download, copy prompt, delete, edit).
- **Editor** : Compose jusqu'a 5 layers d'icones avec transforms (scale, rotation, offset), opacity, tint (color blend mode), drop-shadow, et fond personnalisable (solid/gradient/transparent). Export via canvas rendering (`_renderComposition`). Les `editorSettings` sont sauvegardes sur chaque `generation` object.
- **New Model Detection** : Au chargement, l'app interroge `/v1/models` pour detecter de nouveaux modeles `gpt-image-*` non presents dans `App.MODELS`.

### External Dependencies (CDN)

- **Lucide Icons** — Iconographie UI (`lucide.createIcons()` appele apres ajout de nouveaux elements DOM)
- **Google Fonts (Inter)** — Typographie

## Conventions

- Vanilla JS avec declarations `var` et pattern namespace `App.`
- Fonctions privees/internes prefixees par `_` (ex: `App._renderLayerImages`, `App._editorSave`)
- CSS custom properties pour le theming (`variables.css`)
- Communiquer avec le developpeur en francais
- Fichier de reference : `IMAGE_GENERATION_REFERENCE.md`
