/* ============================================
   Configuration & Constantes
   ============================================ */

var App = window.App || {};

/* ---- Modeles OpenAI ---- */

App.MODELS = {
    'gpt-image-1.5': {
        name: 'GPT Image 1.5',
        description: 'Latest model, faster, 20% cheaper than 1.0',
        pricing: { low: 0.009, medium: 0.034, high: 0.133 },
        capabilities: { transparentBg: true, edits: true, referenceImages: 10 },
        defaultQuality: 'medium',
        recommendedBackground: 'transparent'
    },
    'gpt-image-1': {
        name: 'GPT Image 1',
        description: 'Stable, native transparent background',
        pricing: { low: 0.011, medium: 0.042, high: 0.167 },
        capabilities: { transparentBg: true, edits: true, referenceImages: 10 },
        defaultQuality: 'medium',
        recommendedBackground: 'transparent'
    },
    'gpt-image-1-mini': {
        name: 'GPT Image 1 Mini',
        description: 'Budget-friendly, 55-78% cheaper',
        pricing: { low: 0.005, medium: 0.011, high: 0.036 },
        capabilities: { transparentBg: true, edits: true, referenceImages: 10 },
        defaultQuality: 'low',
        recommendedBackground: 'transparent'
    }
};

/* ---- Color Modes ---- */

App.COLOR_MODES = {
    'gradient': {
        name: 'Classic',
        keywords: 'smooth rich gradients across the surface, no multicolor gradients'
    },
    'multicolor-gradient': {
        name: 'Multicolor',
        keywords: 'smooth rich color gradients from warm to cool tones across the surface'
    },
    'monochrome': {
        name: 'Monochrome',
        keywords: 'monochrome palette, smooth rich gradients across the surface using a single hue only, no other colors'
    }
};

/* ---- Subject Types ---- */

App.SUBJECT_TYPES = {
    'object': {
        name: 'Object',
        keywords: ''
    },
    'animal': {
        name: 'Animal',
        keywords: ''
    },
    'human': {
        name: 'Human',
        keywords: ''
    },
    'letter': {
        name: 'Letter',
        keywords: ''
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
    tintColor: '#FF0000',
    shadowEnabled: false,
    shadowBlur: 20,
    shadowOffsetY: 8,
    shadowOpacity: 40,
    shadowColor: '#000000'
};

/* ---- Editor defaults ---- */

App.EDITOR_DEFAULTS = {
    bgType: 'solid',
    bgColor: '#1a1a1a',
    gradientCenter: '#2a2a4a',
    gradientEdge: '#0a0a1a',
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
    shadowColor: '#000000'
};

/* ---- Supabase ---- */

App.SUPABASE_URL = 'https://bisxrchfzahyiiwtxiof.supabase.co';
App.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpc3hyY2hmemFoeWlpd3R4aW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMTQzMzcsImV4cCI6MjA4Njg5MDMzN30.286OcvMVCJ8QcNgvZgWl7dOxKeS64LtJT97JHLfigJQ';
App.COMMUNITY_PAGE_SIZE = 20;

/* ---- Storage keys ---- */

App.STORAGE_KEYS = {
    apiKey: 'icon-openai-api-key',
    model: 'icon-model',
    colorMode: 'icon-color-mode',
    subjectType: 'icon-subject-type',
    material: 'icon-material',
    color: 'icon-color',
    quality: 'icon-quality',
    transparentBg: 'icon-transparent-bg',
    theme: 'icon-theme',
    gallery: 'icon-gallery',
    deviceId: 'icon-device-id'
};
