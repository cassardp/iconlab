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

### File Structure

- `index.html` — Structure DOM complete (panneau settings + galerie)
- `app.js` — Point d'entree, initialise tous les modules
- `js/config.js` — Constantes : modeles OpenAI, styles d'icones, storage keys
- `js/state.js` — Etat global (`App.state`), helpers
- `js/api-openai.js` — Appels API OpenAI GPT Image (generations + edits avec image ref)
- `js/prompt-builder.js` — Construction du prompt enrichi (systeme + user + style)
- `js/gallery.js` — Gestion de la galerie de resultats
- `js/events.js` — Tous les event handlers UI
- `css/` — CSS modulaire avec custom properties pour theme dark/light

### Key Patterns

- **State** : Centralise dans `App.state` (model, prompt, style, quality, etc.)
- **API Calls** : Appels directs navigateur-vers-OpenAI (pas de proxy). Cle API stockee dans LocalStorage.
- **Prompt Builder** : Enrichit le prompt utilisateur avec instructions pour icone d'app. Le prompt enrichi est editable avant envoi.
- **Image de reference** : Upload optionnel, utilise l'endpoint `/images/edits` au lieu de `/images/generations`.
- **Galerie** : Affiche les images generees avec metadonnees (modele, prompt, duree, cout).

### External Dependencies (CDN)

- **Lucide Icons** — Iconographie UI
- **Google Fonts (Inter)** — Typographie

## Conventions

- Vanilla JS avec declarations `var` et pattern namespace `App.`
- CSS custom properties pour le theming (`variables.css`)
- Communiquer avec le developpeur en francais
- Fichier de reference : `IMAGE_GENERATION_REFERENCE.md`
