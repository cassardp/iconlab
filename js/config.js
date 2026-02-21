/* ============================================
   Configuration & Constantes
   ============================================ */

var App = window.App || {};

/* ---- Modeles OpenAI ---- */

App.MODELS = {
    'gpt-image-1.5': {
        name: 'GPT Image 1.5',
        description: 'Latest model, faster, 20% cheaper than 1.0',
        capabilities: { transparentBg: true, edits: true, referenceImages: 10 },
        defaultQuality: 'medium',
        recommendedBackground: 'transparent'
    },
    'gpt-image-1': {
        name: 'GPT Image 1',
        description: 'Stable, native transparent background',
        capabilities: { transparentBg: true, edits: true, referenceImages: 10 },
        defaultQuality: 'medium',
        recommendedBackground: 'transparent'
    },
    'gpt-image-1-mini': {
        name: 'GPT Image 1 Mini',
        description: 'Budget-friendly, 55-78% cheaper',
        capabilities: { transparentBg: true, edits: true, referenceImages: 10 },
        defaultQuality: 'low',
        recommendedBackground: 'transparent'
    }
};

/* ---- Axes semantiques ---- */

App.AXES = [
    { key: 'volume', labelMin: 'Flat',    labelMax: '3D' },
    { key: 'color',  labelMin: 'Mono',    labelMax: 'Colorful' },
    { key: 'shape',  labelMin: 'Sharp',   labelMax: 'Rounded' },
    { key: 'detail', labelMin: 'Minimal', labelMax: 'Detailed' },
    { key: 'text',   labelMin: 'No Text', labelMax: 'Text' }
];

App.AXIS_DEFAULTS = { volume: 0, color: 100, shape: 100, detail: 0, text: 0 };

/* ---- Style Presets ---- */

App.STYLE_PRESETS = {
    'illustration': {
        name: 'Illustration',
        placeholder: 'a fox',
        defaultAxes: { volume: 50, color: 50, shape: 100, detail: 50, text: 0 },
        subject: 'app icon of {subject}.',
        base: 'simplified illustration, no outlines, no textures, extremely clean and modern, vector-illustration feel, Apple-design-language aesthetic',
        constraints: ['Single centered subject only, no duplicates, no extra elements. No frame. No shadows, no glows, no holes or cutouts.'],
        axes: {
            volume: ['completely flat, no volume, no shading', 'subtle volume without any 3D rendering, soft shading', 'soft 3D look, visible depth and lighting'],
            color:  ['monochrome palette, single hue', 'limited palette of 2-3 colors', 'rich vibrant multiple colors, smooth gradients'],
            shape:  ['sharp geometric edges, angular silhouette', 'balanced mix of straight and curved edges', 'bold rounded silhouette, no hard edges, shapes blend softly'],
            detail: ['almost abstract simplicity, very few details', 'moderate detail, recognizable forms', 'many details, complex shapes and patterns'],
            text:   ['no text or lettering', 'minimal subtle text element', 'prominent text or lettering']
        }
    },
    'blender': {
        name: 'Blender',
        placeholder: 'a mushroom',
        defaultAxes: { volume: 100, color: 50, shape: 100, detail: 50, text: 0 },
        subject: 'app icon of {subject}.',
        base: 'Blender-quality render, warm diffused studio lighting, no harsh specular highlights, smooth subsurface scattering, soft ambient occlusion',
        constraints: ['Single centered subject only, no duplicates, no extra elements. No frame. No shadows, no glows, no holes or cutouts.'],
        axes: {
            volume: ['flat stylized render, minimal depth', 'soft 3D render with gentle bevels', 'full 3D render with smooth rounded geometry, deep bevels and strong depth'],
            color:  ['monochrome palette, single hue', 'limited palette of 2-3 colors, natural tones', 'rich vibrant colors, smooth color gradients from warm to cool tones'],
            shape:  ['sharp angular geometry, hard edges', 'balanced geometry, some rounded elements', 'smooth rounded geometry, no hard edges, gentle bevels everywhere'],
            detail: ['simple clean shapes, minimal detail', 'moderate detail, natural material textures', 'many details, fine surface details and textures'],
            text:   ['no text or lettering', 'minimal subtle text element', 'prominent text or lettering']
        }
    },
    'logo': {
        name: 'Logo',
        placeholder: 'a bird',
        defaultAxes: { volume: 0, color: 0, shape: 50, detail: 0, text: 0 },
        subject: '{subject}, logo, modern, Paul Rand style.',
        base: 'simplified flat illustration, no outlines, no textures, extremely clean and modern, Apple-design-language aesthetic',
        constraints: ['Single centered subject only, no duplicates, no extra elements. No frame. No shadows, no glows, no holes or cutouts.'],
        axes: {
            volume: ['completely flat, no volume, no shading', 'subtle volume, soft shading', 'soft 3D look, visible depth and lighting'],
            color:  ['monochrome black and white', 'limited palette of 2-3 colors', 'rich vibrant multiple colors'],
            shape:  ['sharp geometric edges, angular', 'balanced mix of straight and curved', 'bold rounded silhouette, no hard edges'],
            detail: ['almost abstract, extreme simplicity', 'moderate detail, recognizable forms', 'many details, complex shapes and patterns'],
            text:   ['no text or lettering', 'minimal subtle text element', 'prominent text or lettering']
        }
    },
    'typography': {
        name: 'Typography',
        placeholder: 'A',
        defaultAxes: { volume: 50, color: 50, shape: 50, detail: 0, text: 0 },
        subject: 'the letter "{subject}", a single typographic letter or character.',
        base: 'extremely clean and modern, beautiful shading, Apple-design-language aesthetic',
        constraints: ['Single centered subject only, no duplicates, no extra elements. No frame. No shadows, no glows, no holes or cutouts.'],
        axes: {
            volume: ['completely flat letterform, no volume', 'subtle volume without any 3D rendering', 'strong 3D extruded letterform with depth'],
            color:  ['monochrome, single color', 'two-tone color scheme', 'rich colorful gradient letterform'],
            shape:  ['sharp angular letterform, geometric type', 'semi-bold letterform, balanced edges', 'semi-bold rounded letterform, no hard edges'],
            detail: ['minimal clean letterform, no textures', 'moderate detail, subtle textures', 'highly detailed letterform, complex surface work'],
            text:   ['no extra text, just the letter', 'minimal subtle text element', 'prominent text or lettering around the letter']
        }
    },
    'sticker': {
        name: 'Sticker',
        placeholder: 'a rocket',
        defaultAxes: { volume: 0, color: 50, shape: 100, detail: 0, text: 0 },
        subject: 'app icon of {subject}.',
        base: 'flat die-cut sticker, solid opaque color fills, cartoon-simple, thick off-white (#FAF9F7) outline border around the entire sticker shape',
        constraints: [
            'Single centered subject only, no duplicates, no extra elements. No frame. No shadows, no glows, no holes or cutouts.',
            'The sticker border must be off-white (#FAF9F7), never pure white. Every part of the sticker must be fully opaque — only the area outside the sticker should be transparent.'
        ],
        axes: {
            volume: ['completely flat, no shading, no 3D', 'subtle shading for slight depth', 'visible volume and shading on the sticker'],
            color:  ['monochrome, single color fill', 'limited palette of 2-3 bold flat colors', 'very limited palette of 3-4 bold flat colors, vibrant contrasting hues'],
            shape:  ['sharp geometric sticker shape', 'balanced mix of straight and curved edges', 'bold rounded simple clean shapes'],
            detail: ['extreme simplicity, minimal detail, no textures', 'moderate detail, simple recognizable shapes', 'more detailed illustration, still clean'],
            text:   ['no text or lettering', 'minimal subtle text element', 'prominent text or lettering']
        }
    }
};

/* ---- Matieres (optionnel) ---- */

App.MATERIALS = {
    'none':         { name: 'None',              keywords: '' },
    'matte':        { name: 'Matte',             keywords: 'matte finish material, no gloss, no reflections, soft diffused surface' },
    'glossy':       { name: 'Glossy',            keywords: 'glossy shiny material, polished reflective surface, specular highlights' },
    'glass':        { name: 'Glass',             keywords: 'transparent glass material, refractive, subtle reflections, see-through' },
    'metal':        { name: 'Metal',             keywords: 'metallic material, brushed metal finish, subtle reflections, industrial feel' },
    'gold':         { name: 'Gold',              keywords: 'polished gold material, luxurious warm metallic golden surface, rich reflections' },
    'silver':       { name: 'Silver',            keywords: 'polished silver material, cool metallic surface, chrome-like reflections' },
    'copper':       { name: 'Copper',            keywords: 'copper material, warm reddish metallic surface, oxidized patina accents' },
    'bronze':       { name: 'Bronze',            keywords: 'bronze material, warm dark metallic surface, antique patina feel' },
    'wood':         { name: 'Wood',              keywords: 'natural wood material, visible wood grain texture, warm organic feel' },
    'clay':         { name: 'Clay',              keywords: 'soft matte clay material, handmade feel, smooth sculpted surface' },
    'plastic':      { name: 'Plastic',           keywords: 'smooth plastic material, slightly glossy, clean manufactured feel' },
    'rubber':       { name: 'Rubber',            keywords: 'soft rubber material, matte elastic surface, slightly textured grip feel' },
    'marble':       { name: 'Marble',            keywords: 'polished marble material, subtle veins and patterns, elegant stone surface' },
    'concrete':     { name: 'Concrete',          keywords: 'raw concrete material, rough mineral surface, brutalist industrial texture' },
    'stone':        { name: 'Stone',             keywords: 'natural carved stone material, rough hewn mineral surface, sculptural feel' },
    'ceramic':      { name: 'Ceramic',           keywords: 'glazed ceramic material, smooth porcelain-like surface, delicate crafted feel' },
    'fabric':       { name: 'Fabric',            keywords: 'soft fabric textile material, woven texture, cloth-like surface' },
    'leather':      { name: 'Leather',           keywords: 'rich leather material, fine grain texture, visible saddle stitch seams (point sellier), premium handcrafted luxury leather goods feel' },
    'felt':         { name: 'Felt',              keywords: 'soft felt material, fuzzy textile surface, handcrafted warm feel' },
    'wool':         { name: 'Wool',              keywords: 'knitted wool material, chunky yarn texture, cozy handmade feel' },
    'embroidery':   { name: 'Embroidery',        keywords: 'embroidered textile material, visible thread stitches, cross-stitch or satin stitch texture, handcrafted needlework on fabric' },
    'mercury':      { name: 'Mercury',           keywords: 'liquid mercury material, highly reflective chrome-like liquid surface, fluid metallic blob, T-1000 style molten metal' },
    'ice':          { name: 'Ice',               keywords: 'frozen ice material, translucent crystalline surface, cold blue refractions, frost details' },
    'wax':          { name: 'Wax',               keywords: 'warm wax material, slightly translucent, soft melting edges, candle-like surface' },
    'candy':        { name: 'Candy',             keywords: 'hard candy material, glossy sugary surface, translucent colorful sweet, lollipop-like shine' },
    'chocolate':    { name: 'Chocolate',         keywords: 'smooth chocolate material, rich brown glossy surface, molded confectionery feel' },
    'leaf':         { name: 'Leaf',              keywords: 'natural leaf material, organic green leaf texture with visible veins, shaped from a real tree leaf, botanical natural feel' },
    'coral':        { name: 'Coral',             keywords: 'organic coral material, porous natural marine texture, underwater reef aesthetic' },
    'popcorn':      { name: 'Popcorn',           keywords: 'popcorn material, the entire shape is made of clustered popcorn kernels, puffy irregular white and yellow pieces, movie snack texture' },
    'balloon':      { name: 'Balloon',           keywords: 'inflated latex balloon material, smooth stretched rubber surface, shiny highlights, balloon sculpture twist aesthetic' },
    'crystal':      { name: 'Crystal',           keywords: 'transparent crystal gemstone material, faceted cuts, prismatic light refractions, precious stone clarity' },
    'rust':         { name: 'Rust',              keywords: 'oxidized rusted metal material, orange-brown corroded iron surface, rough flaking patina, aged industrial decay' },
    'velvet':       { name: 'Velvet',            keywords: 'soft velvet material, rich plush textile with light-catching nap, luxurious deep fabric texture' },
    'denim':        { name: 'Denim',             keywords: 'denim fabric material, visible twill weave pattern, indigo blue cotton textile, jeans texture' },
    'fur':          { name: 'Fur',               keywords: 'soft animal fur material, dense fluffy hair covering the surface, plush furry texture' },
    'feather':      { name: 'Feather',           keywords: 'feather material, the shape is covered in layered bird feathers, soft downy texture with fine barbs' },
    'bubblegum':    { name: 'Bubblegum',         keywords: 'stretched bubblegum material, soft pink glossy elastic surface, slightly translucent, chewy candy feel' },
    'cookie':       { name: 'Cookie',            keywords: 'baked cookie material, golden brown crumbly dough texture, shortbread or sugar cookie feel with subtle cracks' },
    'cheese':       { name: 'Cheese',            keywords: 'cheese material, smooth yellow-orange surface with characteristic round holes, Swiss cheese aesthetic' },
    'cotton':       { name: 'Cotton',            keywords: 'fluffy cotton material, soft white cloud-like cotton balls or cotton candy texture, airy and light' },
    'holographic':  { name: 'Holographic',       keywords: 'holographic iridescent material, rainbow shifting reflections, prismatic surface, futuristic feel' },
    'cardboard':    { name: 'Cardboard',         keywords: 'corrugated cardboard material, raw brown recycled texture, handmade craft feel' },
    'terracotta':   { name: 'Terracotta',        keywords: 'terracotta clay material, warm reddish-orange unglazed ceramic, Mediterranean pottery feel' },
    'obsidian':     { name: 'Obsidian',          keywords: 'volcanic obsidian glass material, deep black mirror-like surface, sharp beveled edges, subtle iridescent reflections, premium gemstone feel' },
    'cloud':        { name: 'Cloud',             keywords: 'soft puffy cloud material, billowy rounded cumulus shapes, white airy volumetric surface, dreamy sky-like softness' },
};

/* ---- Layer defaults (par layer d'icone) ---- */

App.LAYER_DEFAULTS = {
    imageBase64: '',
    scale: 100,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    opacity: 100,
    tintEnabled: false,
    tintColor: '#5A9FD4',
    shadowEnabled: false,
    shadowBlur: 20,
    shadowOffsetY: 8,
    shadowOpacity: 40,
    shadowColor: '#1A1A2E'
};

/* ---- Editor defaults ---- */

App.EDITOR_DEFAULTS = {
    bgType: 'solid',
    bgColor: '#4A90D9',
    gradientCenter: '#5BC0EB',
    gradientEdge: '#2E6EA6',
    linearAngle: 180,
    linearStart: '#5BC0EB',
    linearEnd: '#2E6EA6',
    meshColors: ['#5BC0EB', '#3A86C8', '#48B8D0', '#2E6EA6'],
    layers: null,
    activeLayerIndex: 0,
    exportSize: 1024,
    // Legacy props (migration only)
    scale: 100,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    shadowEnabled: false,
    shadowBlur: 20,
    shadowOffsetY: 8,
    shadowOpacity: 40,
    shadowColor: '#1A1A2E'
};

/* ---- Mesh gradient anchor positions (% x, % y) ---- */

App.MESH_ANCHORS = [
    { x: 20, y: 20 },   // top-left
    { x: 80, y: 80 },   // bottom-right
    { x: 80, y: 20 },   // top-right
    { x: 20, y: 80 }    // bottom-left
];

/* ---- Storage keys ---- */

App.STORAGE_KEYS = {
    apiKey: 'icon-openai-api-key',
    model: 'icon-model',
    quality: 'icon-quality',
    theme: 'icon-theme'
};

/* ---- Color picker wrap : clic sur le wrapper ouvre le picker natif ---- */

App._initColorPickerWraps = function(root) {
    var wraps = (root || document).querySelectorAll('.color-picker-wrap');
    for (var i = 0; i < wraps.length; i++) {
        (function(wrap) {
            wrap.addEventListener('click', function(e) {
                if (e.target.closest('.color-picker-reset')) return;
                var input = wrap.querySelector('input[type="color"]');
                if (input) input.click();
            });
        })(wraps[i]);
    }
};
