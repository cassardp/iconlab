# Reference : Modeles de Generation d'Images pour App Icon Generator

> Document de référence pour l'optimisation des prompts et l'utilisation de l'API OpenAI GPT Image.
> Dernière mise à jour : Février 2026

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [OpenAI — GPT Image](#2-openai--gpt-image)
3. [Guide de Prompting pour App Icons](#3-guide-de-prompting-pour-app-icons)
4. [Recommandations pour le projet](#4-recommandations-pour-le-projet)

---

## 1. Vue d'ensemble

### Modèles OpenAI retenus

| Modèle | ID API | Meilleur pour | Notes |
|--------|--------|---------------|-------|
| **GPT Image 1.5** | `gpt-image-1.5` | Qualité maximale, vitesse | Supporte `background: "transparent"`, meilleure compréhension du brief |
| **GPT Image 1** | `gpt-image-1` | Production stable | Fond transparent natif, support des edits avec masques |
| **GPT Image 1 Mini** | `gpt-image-1-mini` | Test rapide / budget | Même API, coût réduit, légèrement moins détaillé |

Tous les flux de l'app reposent exclusivement sur ces modèles.

---

## 2. OpenAI — GPT Image

### 2.1 Modèles disponibles

#### GPT Image 1.5 — `gpt-image-1.5`
- Résolutions : 1024x1024, 1024x1536, 1536x1024, auto
- Vitesse : ~4× GPT Image 1
- Compréhension accrue des instructions complexes

#### GPT Image 1 — `gpt-image-1`
- Résolutions identiques à 1.5
- Fond transparent natif (`background: "transparent"`)
- Mode edits : jusqu'à 10 images en entrée + masques

#### GPT Image 1 Mini — `gpt-image-1-mini`
- Même interface API
- 55‑78 % moins cher
- Léger downgrade qualitatif (bruit et simplification des détails)

### 2.2 API — Endpoint et authentification

```
POST https://api.openai.com/v1/images/generations
Header: Authorization: Bearer YOUR_API_KEY
```

### 2.3 Code d'appel — Python

```python
import base64
from openai import OpenAI

client = OpenAI(api_key="YOUR_API_KEY")

result = client.images.generate(
    model="gpt-image-1.5",
    prompt="A minimalist 3D fox mascot, centered, app icon style",
    size="1024x1024",
    quality="high",
    output_format="png",
    background="transparent"
)

image_bytes = base64.b64decode(result.data[0].b64_json)
with open("icon.png", "wb") as f:
    f.write(image_bytes)
```

### 2.4 Code d'appel — JavaScript/TypeScript

```typescript
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const result = await openai.images.generate({
  model: "gpt-image-1.5",
  prompt: "A minimalist 3D fox mascot, centered, on a solid gradient background",
  size: "1024x1024",
  quality: "high",
  output_format: "png",
  background: "transparent"
});

const imageBase64 = result.data[0].b64_json;
```

### 2.5 Code d'appel — Swift (URLSession)

```swift
import Foundation

struct OpenAIImageGenerator {
    let apiKey: String
    let endpoint = URL(string: "https://api.openai.com/v1/images/generations")!

    func generateImage(
        prompt: String,
        model: String = "gpt-image-1.5",
        size: String = "1024x1024",
        quality: String = "high",
        background: String = "transparent"
    ) async throws -> Data {
        let body: [String: Any] = [
            "model": model,
            "prompt": prompt,
            "size": size,
            "quality": quality,
            "output_format": "png",
            "background": background,
            "n": 1
        ]

        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, _) = try await URLSession.shared.data(for: request)
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        let dataArray = json["data"] as! [[String: Any]]
        let base64String = dataArray[0]["b64_json"] as! String
        return Data(base64Encoded: base64String)!
    }
}
```

### 2.6 Paramètres clés

| Paramètre | Valeurs | Notes |
|-----------|---------|-------|
| `size` | `"1024x1024"` | Taille obligatoire pour la pipeline icône |
| `quality` | `"low"`, `"medium"`, `"high"`, `"auto"` | `high` pour les exports finaux |
| `output_format` | `"png"`, `"jpeg"`, `"webp"` | PNG conseillé (transparence) |
| `background` | `"transparent"`, `"auto"` | Préférer `transparent` sauf rendu spécifique |
| `n` | 1‑10 | Nombre d'images demandées |
| `moderation` | `"auto"`, `"low"` | Laisser `auto` sauf cas bloquants |

### 2.7 Pricing (1024×1024)

| Modèle | Low | Medium | High |
|--------|-----|--------|------|
| GPT Image 1.5 | ~$0.010 | ~$0.040 | ~$0.170 |
| GPT Image 1 | $0.011 | $0.042 | $0.167 |
| GPT Image 1 Mini | $0.005 | $0.011 | $0.036 |

### 2.8 Limites connues

- Résolutions fixes uniquement
- Sortie en base64 (pas d'URL d'image direct)
- Pas de seed/reproductibilité exacte
- Nécessite une clé API utilisateur côté navigateur (attention au stockage)

---

## 3. Guide de Prompting pour App Icons

### 3.1 Structure de prompt recommandée

```
Goal / Output constraints
Style macros (global directives)
Design attributes (subject, material, color palette)
Background directive
Constraints / QA checklist
```

### 3.2 Template de base (OpenAI)

```
Goal: Create a single square 1024x1024 illustration for an iOS/Android app icon, subject centered and readable at 64px.
Style macros: [mots-clés issus de la sélection]
Design attributes:
- Subject: [description précise]
- Material (optional): [matière]
- Color palette (optional): [couleurs souhaitées; préciser si du texte est requis]
Background directive: ["transparent" ou description du fond]
Constraints:
1. Single focal element, balanced negative space.
2. Crispy edges, clean lighting, no device frames or OS chrome.
3. OK to include text or lettering ONLY if specified above (sinon ne pas en ajouter).
Follow all instructions exactly.
```

### 3.3 Styles populaires & mots-clés

- **3D cartoon / Pixar** : `3D rendered, soft lighting, smooth rounded shapes, vibrant colors, clay-like material, subtle shadows`
- **Glassmorphism** : `frosted glass effect, translucent layers, soft gradient, blurred background, light refraction`
- **Flat minimal** : `flat design, bold geometric shapes, limited palette, no outlines, vector aesthetic`
- **Skeuomorphique** : `photorealistic textures, realistic materials, natural lighting, tactile details`
- **Glyph / monochrome** : `single color symbol, simple silhouette, bold outline, high contrast`
- **Gradient mesh / aurora** : `vibrant flowing gradients, smooth blending, modern abstract feel`

### 3.4 Conseils couleur / matière

- Rappeler que la palette donnée concerne le sujet principal; préciser si le fond doit rester neutre ou reprendre une nuance.
- Quand un matériau impose une texture (métal, cuir, velours), ajouter "respect the minimalist silhouette" pour éviter d'accumuler des détails parasites.

### 3.5 Exemples de prompts

#### Exemple : App météo
```
Goal: Icon-ready illustration 1024x1024, transparent background.
Style macros: 3D render, soft studio lighting, smooth rounded shapes.
Design attributes:
- Subject: A cheerful sun peeking through two puffy clouds with gentle rays.
- Color palette: Warm yellows and whites with a hint of sky blue accents.
Background directive: Fully transparent RGBA, no glow outside the subject.
Constraints: single focal object, clean edges, readable at 64px.
```

#### Exemple : App de notes avec lettrage
```
Goal: Icon-ready illustration 1024x1024, solid backdrop.
Style macros: Flat gradient vector style, subtle grain for depth.
Design attributes:
- Subject: Stylized notebook page folded at the corner with the word "Notes" embossed on it.
- Material: Smooth recycled paper.
- Color palette: Cream base with muted orange accent.
Background directive: Solid desaturated teal (#0F8C9C) filling the canvas.
Constraints: keep a single focal point, lettering must remain legible at 64px.
```

### 3.6 Techniques avancées

- **Prompt enrichi** : Préfixer chaque demande utilisateur par un bloc système constant (cf. `App.buildEnrichedPrompt`).
- **Itérations** : Re-générer en ajustant uniquement les sections Style ou Design attributes pour garder un historique propre.
- **Références visuelles** : Quand une image est fournie, préciser "match lighting/palette/detail level" mais rappeler de ne pas copier la composition exacte.

---

## 4. Recommandations pour le projet

1. **Pipeline unique OpenAI** : Toutes les générations passent par `gpt-image-1.5` par défaut, avec fallback `gpt-image-1-mini` pour les explorations low-cost.
2. **Qualité** : `quality="medium"` pendant les explorations, `"high"` pour les livrables.
3. **Fond transparent** : Toujours demander `background="transparent"` puis composer le fond (gradient, blur) dans l'éditeur si l'utilisateur le souhaite.
4. **Export** : Générer en 1024×1024 puis décliner via scripts (cf. section tailles dans la doc historique) pour les variantes iOS/Android.
5. **Tracking** : Stocker le prompt enrichi et les paramètres (model, quality, background) avec chaque entrée de galerie pour faciliter les itérations.
