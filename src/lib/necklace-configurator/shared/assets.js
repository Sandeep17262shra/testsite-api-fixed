/**
 * @file This file contains the constant data for bracelets and charms,
 * including their model paths and positioning information.
 */

// Array of paths to the bracelet GLB models.
export const BRACELETS = [
     { path: "/pc-assets/pendant_models//BRACELET15.glb", name: "Clip", price: 3600 },
     { path: "/pc-assets/pendant_models//BRACELET16.glb", name: "Plain", price: 3200 },
     { path: "/pc-assets/pendant_models//BRACELET17.glb", name: "Milgrain", price: 3600 },
     { path: "/pc-assets/pendant_models//BRACELET18.glb", name: "Link", price: 3600 },
     // Removed: GLB chain models (BRACELET13/14) are no longer used.
     // { path: "/pc-assets/pendant_models//BRACELET13.glb", name: "Knot Link", price: 3200 },
     // { path: "/pc-assets/pendant_models//BRACELET14.glb", name: "Box Link", price: 3600 },
];

// Every necklace can carry a name pendant. Keep this capability alongside the
// model data so UI and scene behavior agree.
export const NAME_PENDANT_SUPPORTED_PATHS = [
  // "/pc-assets/pendant_models//BRACELET13.glb",
  // "/pc-assets/pendant_models//BRACELET14.glb",
  "/pc-assets/pendant_models//BRACELET15.glb",
  "/pc-assets/pendant_models//BRACELET16.glb",
  "/pc-assets/pendant_models//BRACELET17.glb",
  "/pc-assets/pendant_models//BRACELET18.glb",
];

// ...but the two families carry it differently, and a few rules key off WHICH.
//
// These two are the "name chains": a real GLB chain built around the name,
// whose left/right chain groups slide outward as the name widens. The name is
// the whole point of the model, so they offer no separate initial charm and
// only one charm slot, under the name (see MAX_CHARMS_BY_NECKLACE).
//
// Everything else is a drape chain (BRACELET15-18): a generated link chain
// that hangs the name from its own washers when a name is typed, and carries
// its full set of charms either way.
export const NAME_CHAIN_PATHS = [
  // Removed: GLB name chains are no longer used.
  // "/pc-assets/pendant_models//BRACELET13.glb",
  // "/pc-assets/pendant_models//BRACELET14.glb",
];
// Cache-busting version for the chain (Style) icons. Bump this whenever a
// chain icon image is replaced so browsers fetch the new file.
export const CHAIN_ICON_VERSION = "20260911";
export const withChainIconVersion = (src) => (src ? `${src}?v=${CHAIN_ICON_VERSION}` : src);

// Card thumbnail image is tied to the bracelet's identity (path), not its
// position in the BRACELETS array — this keeps the art correct no matter
// what order BRACELETS is displayed in.
export const BRACELET_CARD_IMAGE_BY_PATH = {
  // "/pc-assets/pendant_models//BRACELET13.glb": "/pc-assets/images/pendant_1.webp",
  // "/pc-assets/pendant_models//BRACELET14.glb": "/pc-assets/images/pendant_2.webp",
  "/pc-assets/pendant_models//BRACELET15.glb": "/pc-assets/images/pendant_3.webp",
  "/pc-assets/pendant_models//BRACELET16.glb": "/pc-assets/images/pendant_4.webp",
  "/pc-assets/pendant_models//BRACELET17.glb": "/pc-assets/images/pendant_5.webp",
  "/pc-assets/pendant_models//BRACELET18.glb": "/pc-assets/images/pendant_6.webp",
};
// Name-pendant chains reserve the centre drop for one charm. The standalone
// oval chain can distribute up to six charms around its hand-built links.
export const MAX_CHARMS_BY_NECKLACE = {
  // "/pc-assets/pendant_models//BRACELET13.glb": 1,
  // "/pc-assets/pendant_models//BRACELET14.glb": 1,
  "/pc-assets/pendant_models//BRACELET15.glb": 6,
  "/pc-assets/pendant_models//BRACELET16.glb": 6,
  "/pc-assets/pendant_models//BRACELET17.glb": 6,
  "/pc-assets/pendant_models//BRACELET18.glb": 6,
};

// Standalone-chain charm positions for models that do not accept a name
// pendant. Values are in the necklace scene's local coordinate space.
export const NON_NAME_CHAIN_CHARM_LAYOUTS = {
  "/pc-assets/pendant_models//BRACELET15.glb": {
    // Manual centre slot for odd totals: a slightly longer, centered drop.
    center: [0, 1.35, 0.24],
    // Even totals use a tighter pair at the lowest two chain links.
    evenInnerX: 1.2,
    sideSlots: [
      // Each point is just below an existing link on the oval chain.
      { x: 1.7, y: 2.15 },
      { x: 2.2, y: 3.6 },
      { x: 2.35, y: 4.9 },
    ],
  },
};

// Array of paths to the charm GLB models.
export const STONE_COLOR_SWATCHES = [
  { key: "GAR", label: "Garnet (Jan)",     hex: "#C8102E", image: "/bc-assets/images/birthstones/garnet-jan.webp" },
  { key: "AME", label: "Amethyst (Feb)",  hex: "#6D3BB5", image: "/bc-assets/images/birthstones/amethyst-feb.webp" },
  { key: "AQU", label: "Aquamarine (Mar)",   hex: "#8EC7DF", image: "/bc-assets/images/birthstones/aquamarine-march.webp" },
  { key: "DIA", label: "Diamond (Apr)",      hex: "#F4F8FF", image: "/bc-assets/images/birthstones/diamond-april.webp" },
  { key: "EMR", label: "Emerald (May)",        hex: "#009B77", image: "/bc-assets/images/birthstones/emerald-may.webp" },
  { key: "ALX", label: "Alexandrite (Jun)",   hex: "#C978A9", image: "/bc-assets/images/birthstones/alexandrite-june.webp" },
  { key: "RBY", label: "Ruby (Jul)",          hex: "#9B111E", image: "/bc-assets/images/birthstones/ruby-july.webp" },
  { key: "PRD", label: "Peridot (Aug)",     hex: "#AFCB2B", image: "/bc-assets/images/birthstones/peridot-august.webp" },
  { key: "SAP", label: "Sapphire (Sep)", hex: "#0F52BA", image: "/bc-assets/images/birthstones/sapphire-september.webp" },
  { key: "TRM", label: "Tourmaline (Oct)", hex: "#F0839C", image: "/bc-assets/images/birthstones/tourmaline-october.webp" },
  { key: "TOP", label: "Topaz (Nov)",     hex: "#D9B83D", image: "/bc-assets/images/birthstones/topaz-november.webp" },
  { key: "TRQ", label: "Turquoise (Dec)", hex: "#4AA7BA", image: "/bc-assets/images/birthstones/turquoise-december.webp" },
];

// Append to CHARMS[]:
export const CHARMS = [
  { path: "/bc-assets/gemstone/BIRTHSTONE.glb", name: "Birthstone", price: 50, type: "birthstone" },
  { path: "/bc-assets/gemstone/D1.glb", name: "Round Diamond", price: 50, type: "diamond", preview: "/bc-assets/images/diamonds/round.webp" },
  { path: "/bc-assets/gemstone/D2.glb", name: "Pear Diamond",  price: 50, type: "diamond", preview: "/bc-assets/images/diamonds/pear.webp" },
  { path: "/bc-assets/gemstone/D3.glb", name: "Oval Diamond",  price: 50, type: "diamond", preview: "/bc-assets/images/diamonds/oval.webp" },
  { path: "/bc-assets/gemstone/princess.glb", name: "Princess Diamond", price: 50, type: "diamond", preview: "/bc-assets/images/diamonds/princess.webp" },
  { path: "/bc-assets/gemstone/cushion.glb", name: "Cushion Diamond", price: 50, type: "diamond", preview: "/bc-assets/images/diamonds/cushion.webp" },
];

// Rendered birthstone/diamond faces live in metal-specific folders. Platinum
// deliberately reuses the white-gold artwork.
// Order matches the chain Metal row; `color` (swatch) matches the ring's GOLD_COLORS.
// Gemstone charm GLBs are served with a 1-year immutable cache. Bump this when
// a file in /bc-assets/gemstone/ is replaced so browsers fetch the new one.
// (Only the fetch URL gets ?v= — charm.path stays the same for share links.)
export const GEMSTONE_MODEL_VERSION = "20260914";
export const withModelVersion = (path) =>
    typeof path === "string" && path.startsWith("/bc-assets/gemstone/") && !path.includes("?")
        ? `${path}?v=${GEMSTONE_MODEL_VERSION}`
        : path;

export const CHARM_METAL_SWATCHES = [
  { key: 'SL', label: 'Silver 925', hex: '#C0C0C0', color: '#DADADA', image: 'white.png' },
  { key: 'YG', label: 'Yellow Gold', hex: '#ECC875', color: '#FFD280', image: 'yellow.png' },
  { key: 'RG', label: 'Rose Gold', hex: '#FFBAA3', color: '#E6B08F', image: 'rose.png' },
  { key: 'PL', label: 'Platinum', hex: '#A8A8A6', color: '#E5E4E2', image: 'platinum.png' },
  { key: 'WG', label: 'White Gold', hex: '#C8C8C8', color: '#F1F1EF', image: 'white.png' },
];
export const getImageCharmPath = (number, metalKey = 'WG') =>
  `/bc-assets/image_charm/${metalKey === 'YG' ? 'YG' : metalKey === 'RG' ? 'RG' : 'WG'}/CHARMS${number}.png`;

export const PENDANT_CHARMS = [
    { id: "cushion", path: "/pc-assets/cushion.glb", name: "Cushion", price: 350 },
];

export const DEFAULT_PENDANT_CHARM = {
    enabled: false,
    charmId: PENDANT_CHARMS[0].id,
    path: PENDANT_CHARMS[0].path,
    bodyColor: "#ECC875",
    gemstoneColor: "#0047AB",  // ← change #FFFFFF to #0047AB
};

// Object defining the initial position and scale for each bracelet model.
export const BRACELET_POSITIONS = {
    "/pc-assets/pendant_models//BRACELET13.glb": { position: [0, 1.6, 0], scale: [0.2, 0.2, 0.2], rotation: [1.6, 0, -3.14]},
    "/pc-assets/pendant_models//BRACELET14.glb": { position: [0, 1.75, 0.19], scale: [0.2, 0.2, 0.2], rotation: [1.6, 0, -3.14]},
    "/pc-assets/pendant_models//BRACELET15.glb": { position: [0, 3.5, 0.3], scale: [0.2, 0.2, 0.2], rotation: [1.6, 0, -3.14]},
};
export const CHAIN_LENGTH_SUPPORTED_PATHS = [
  '/pc-assets/pendant_models//BRACELET15.glb',
  '/pc-assets/pendant_models//BRACELET16.glb',
  '/pc-assets/pendant_models//BRACELET17.glb',
  '/pc-assets/pendant_models//BRACELET18.glb',
];
export const CHAIN_LENGTH_OPTIONS = [
  { id: '16', label: '16"' },
  { id: '18', label: '18"' },
];
export const DEFAULT_CHAIN_LENGTH = '16';
// Object defining the positions and rotations for charms on each specific bracelet.
// This nested structure allows for precise placement of different charms on different bracelets.
export const CHARM_POSITIONS = {

};
export const PENDANT_CHARM_CONFIG = {
  dancing: {
    specialChars: [],
    placements: {
      1: { position: [-0.1,  0.75,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //odd Ana (normal)
      2: { position: [-0.05, 0.4, 0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //odd Agy (special)
      3: { position: [0,     0.75, 0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even Anna (normal)
      4: { position: [0.05,  0.75,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even Agma/Amga (one special)
      5: { position: [0,  0.45,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even oggy (both special)
    },
  },
  yellowtail: {
    specialChars: [],
    placements: {
      1: { position: [0.1,  0.75,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //odd Ana (normal)
      2: { position: [-0.05, 0.4, 0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //odd Agy (special)
      3: { position: [0,     0.75, 0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even Anna (normal)
      4: { position: [0.08,  0.75,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even Agma/Amga (one special)
      5: { position: [0,  0.43,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even oggy (both special)
    },
  },
  lobster: {
    specialChars: [],
    placements: {
      1: { position: [0,  0.75,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //odd Ana (normal)
      2: { position: [-0.1, 0.5, 0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //odd Agy (special)
      3: { position: [0,     0.75, 0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even Anna (normal)
      4: { position: [0,  0.75,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even Agma/Amga (one special)
      5: { position: [0,  0.43,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even oggy (both special)
    },
  },
  darklarch: {
    specialChars: [],
    placements: {
      1: { position: [-0.05,  0.75,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //odd Ana (normal)
      2: { position: [-0.1, 0.55, 0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //odd Agy (special)
      3: { position: [0,     0.75, 0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even Anna (normal)
      4: { position: [0.1,  0.75,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even Agma/Amga (one special)
      5: { position: [0,  0.53,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even oggy (both special)
    },
  },
  marmellata: {
    specialChars: [],
    placements: {
      1: { position: [-0.05,  0.85,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //odd Ana (normal)
      2: { position: [0, 0.45, 0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //odd Agy (special)
      3: { position: [0,     0.75, 0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even Anna (normal)
      4: { position: [-0.2,  0.75,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even Agma/Amga (one special)
      5: { position: [-0.2,  0.45,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even oggy (both special)
    },
  },
  elevate: {
    specialChars: [],
    placements: {
      1: { position: [-0.05,  0.75,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //odd Ana (normal)
      2: { position: [-0.25, 0.45, 0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //odd Agy (special)
      3: { position: [0,     0.75, 0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even Anna (normal)
      4: { position: [-0.1,  0.75,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even Agma/Amga (one special)
      5: { position: [-0.2,  0.45,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even oggy (both special)
    },
  },
  kingsman: {
    specialChars: [],
    placements: {
      1: { position: [-0.05,  0.95,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //odd Ana (normal)
      2: { position: [0, 0.45, 0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //odd Agy (special)
      3: { position: [0,     0.75, 0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even Anna (normal)
      4: { position: [-0.2,  0.75,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even Agma/Amga (one special)
      5: { position: [-0.2,  0.45,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even oggy (both special)
    },
  },
  querinoscript: {
    specialChars: ['g', 'j', 'p', 'q', 'y', 'f'],
    placements: {
       1: { position: [-0.05,  0.95,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //odd Ana (normal)
      2: { position: [0, 0.5, 0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //odd Agy (special)
      3: { position: [0,     0.75, 0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even Anna (normal)
      4: { position: [0.2,  0.75,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even Agma/Amga (one special)
      5: { position: [0.1,  0.55,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] }, //even oggy (both special)
    },
  },
  theodora: {
    specialChars: ['g', 'j', 'p', 'q', 'y', 'z', 'f'],
    placements: {
      1: { position: [0.12,  0.8,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] },
      2: { position: [-0.05, 0.64, 0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] },
      3: { position: [0,     0.55, 0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] },
      4: { position: [0.12,  0.8,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] },
      5: { position: [0.12,  0.5,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] },
    },
  },
  blackrose: {
    specialChars: ['g', 'j', 'p', 'q', 'y', 'z', 'f'],
    placements: {
       1: { position: [0.2,  0.9,  0.2], rotation: [Math.PI / 2, 0, 0], scale:  [0.20, 0.20, 0.20] }, //odd Ana (normal)
      2: { position: [0.2, 0.43, 0.2], rotation: [Math.PI / 2, 0, 0], scale:   [0.20, 0.20, 0.20] }, //odd Agy (special)
      3: { position: [0.1,     0.85, 0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.20, 0.20, 0.20] }, //even Anna (normal)
      4: { position: [0.2,  0.55,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.20, 0.20, 0.20] }, //even Agma/Amga (one special)
      5: { position: [0.1,  0.43,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.20, 0.20, 0.20] }, //even oggy (both special)
    },
  },
  tallcasatmed: {
    specialChars: ['g', 'j', 'p', 'q', 'y', 'z', 'f'],
    placements: {
      1: { position: [0.12,  0.8,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] },
      2: { position: [-0.05, 0.54, 0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] },
      3: { position: [0,     0.55, 0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] },
      4: { position: [0.12,  0.8,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] },
      5: { position: [0.12,  0.5,  0.2], rotation: [Math.PI / 2, 0, 0], scale: [0.25, 0.25, 0.25] },
    },
  },
};


// ─── Per-character position adjustments ──────────────────────────────────────
// Structure: NAME_CHAR_CONFIG[fontStyle][char] = { leftOffset, rightOffset, loopYMultiplier, loopZOffset, charmX, charmY }
// All values are ADDITIVE on top of NAME_SIZE_CONFIG values.
// Only override what you need — missing keys fall back to 0.
export const NAME_CHAR_CONFIG = {
  dancing: {
'a': { leftWasherX: 0.1, leftWasherY: 0.2, leftChainX: -0.8, leftChainY: -1.5, rightWasherX: 0, rightWasherY: 0.15, rightChainX: -0.3, rightChainY: -1.3, charmX: 0, charmY: 0 },
'b': { leftWasherX: 0.2, leftWasherY: 0.7, leftChainX: -1.2, leftChainY: -4, rightWasherX: 0, rightWasherY: 0.7, rightChainX: -0.3, rightChainY: -4, charmX: 0, charmY: -0.1 },
'c': { leftWasherX: 0.1, leftWasherY: 0.3, leftChainX: -0.8, leftChainY: -1.8, rightWasherX: 0, rightWasherY: 0.3, rightChainX: -0.3, rightChainY: -1.8, charmX: 0, charmY: -0.1 },
'd': { leftWasherX: 0.6, leftWasherY: 0.7, leftChainX: -3.3, leftChainY: -4, rightWasherX: 0.2, rightWasherY: 0.7, rightChainX: 0.8, rightChainY: -4, charmX: 0, charmY: 0 },
'e': { leftWasherX: 0.1, leftWasherY: 0.3, leftChainX: -0.7, leftChainY: -2, rightWasherX: 0, rightWasherY: 0.3, rightChainX: -0.3, rightChainY: -2, charmX: 0, charmY: -0.05  },
'f': { leftWasherX: 0.3, leftWasherY: 0.7, leftChainX: -1.8, leftChainY: -4, rightWasherX: 0.2, rightWasherY: 0.7, rightChainX: 0.7, rightChainY: -4, charmX: 0, charmY: -0.3},
'g': { leftWasherX: 0.1, leftWasherY: 0.2, leftChainX: -0.8, leftChainY: -1.5, rightWasherX: 0, rightWasherY: 0.15, rightChainX: -0.3, rightChainY: -1, charmX: 0, charmY: -0.4},
'h': {leftWasherX: 0.2, leftWasherY: 0.7, leftChainX: -1.3, leftChainY: -4, rightWasherX: -0.1, rightWasherY: 0.7, rightChainX: -0.8, rightChainY: -4, charmX: 0.1, charmY: -0.1 },
'i': { leftWasherX: -0.1, leftWasherY: 0, leftChainX: 0.3, leftChainY: -0.5, rightWasherX: 0.15, rightWasherY: 0, rightChainX: 0.3, rightChainY: -0.5, charmX: 0, charmY: 0 },
'j': { leftWasherX: 0.2, leftWasherY: 0, leftChainX: -1, leftChainY: -0.5, rightWasherX: 0, rightWasherY: 0, rightChainX: -0.3, rightChainY: -0.5, charmX: 0, charmY: -0.3 },
'k': {leftWasherX: 0.2, leftWasherY: 0.7, leftChainX: -1.2, leftChainY: -4, rightWasherX: -0.05, rightWasherY: 0.7, rightChainX: -0.5, rightChainY: -4, charmX: 0, charmY: 0 },
'l': { leftWasherX: 0.2, leftWasherY: 0.7, leftChainX: -1.3, leftChainY: -4, rightWasherX: 0.2, rightWasherY: 0.7, rightChainX: 0.8, rightChainY: -4, charmX: 0, charmY: 0  },
'm': { leftWasherX: 0.4, leftWasherY: 0.25, leftChainX: -2.3, leftChainY: -1.8, rightWasherX: 0, rightWasherY: 0.1, rightChainX: -0.4, rightChainY: -1, charmX: 0, charmY: 0 },
'n': { leftWasherX: 0.4, leftWasherY: 0.25, leftChainX: -2.3, leftChainY: -1.8,  rightWasherX: 0, rightWasherY: 0.1, rightChainX: -0.4, rightChainY: -1,  charmX: 0, charmY: 0.15 },
'o': {  leftWasherX: 0.1, leftWasherY: 0.2, leftChainX: -0.7, leftChainY: -1.5, rightWasherX: 0, rightWasherY: 0.2, rightChainX: -0.3, rightChainY: -1.5, charmX: 0, charmY: -0.05},
'p': {  leftWasherX: 0.1, leftWasherY: 0.2, leftChainX: -0.7, leftChainY: -1.3, rightWasherX: 0, rightWasherY: 0.25, rightChainX: -0.2, rightChainY: -1.7, charmX: 0, charmY: -0.3},
'q': {  leftWasherX: 0.1, leftWasherY: 0.2, leftChainX: -0.8, leftChainY: -1.5, rightWasherX: 0, rightWasherY: 0.2, rightChainX: -0.3, rightChainY: -1.5, charmX: 0, charmY: -0.3},
'r': { leftWasherX: 0, leftWasherY: 0.35, leftChainX: -0.3, leftChainY: -2.3, rightWasherX: -0.12, rightWasherY: 0.18, rightChainX: -1, rightChainY: -1.4, charmX: 0, charmY: 0 },
's': { leftWasherX: 0.1, leftWasherY: 0.2, leftChainX: -0.8, leftChainY: -1.5, rightWasherX: -0.08, rightWasherY: 0.18, rightChainX: -0.6, rightChainY: -1.4, charmX: 0, charmY: -0.1  },
't': { leftWasherX: 0.15, leftWasherY: 0.6, leftChainX: -1, leftChainY: -3.5, rightWasherX: 0.1, rightWasherY: 0.6, rightChainX: 0.3, rightChainY: -3.5, charmX: 0, charmY: 0 },
'u': { leftWasherX: 0.1, leftWasherY: 0.2, leftChainX: -0.7, leftChainY: -1.5, rightWasherX: -0.1, rightWasherY: 0.15, rightChainX: -0.7, rightChainY: -1.3, charmX: 0, charmY: 0},
'v': { leftWasherX: 0, leftWasherY: 0.2, leftChainX: -0.3, leftChainY: -1.5, rightWasherX: -0.1, rightWasherY: 0.3, rightChainX: -0.7, rightChainY: -2, charmX: 0, charmY: 0 },
'w': { leftWasherX: 0.1, leftWasherY: 0.28, leftChainX: -0.8, leftChainY: -2, rightWasherX: -0.1, rightWasherY: 0.3, rightChainX: -0.8, rightChainY: -2, charmX: 0, charmY: 0},
'x': { leftWasherX: 0.1, leftWasherY: 0.3, leftChainX: -0.7, leftChainY: -2, rightWasherX: 0, rightWasherY: 0.3, rightChainX: -0.3, rightChainY: -2, charmX: 0, charmY: 0},
'y': { leftWasherX: 0.1, leftWasherY: 0.2, leftChainX: -0.6, leftChainY: -1.5, rightWasherX: 0, rightWasherY: 0.15, rightChainX: -0.2, rightChainY: -1.3, charmX: 0, charmY: -0.4 },
'z': { leftWasherX: 0.1, leftWasherY: 0.2, leftChainX: -0.7, leftChainY: -1.5, rightWasherX: 0, rightWasherY: 0.25, rightChainX: -0.3, rightChainY: -1.7, charmX: 0, charmY: -0.4 },

'A': { leftWasherX: 0.5, leftWasherY: 0.7, leftChainX: -2.8, leftChainY: -4, rightWasherX: 0.1, rightWasherY: 0.6, rightChainX: 0.3, rightChainY: -3.5, charmX: 0.1, charmY: 0.1 },
'B': { leftWasherX: 0.2, leftWasherY: 0.9, leftChainX: -1.3, leftChainY: -4.8, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: 0.1, charmY: -0.1},
'C': { leftWasherX: 0.2, leftWasherY: 0.7, leftChainX: -1.2, leftChainY: -4, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: 0.1, charmY: -0.1},
'D': { leftWasherX: 0.2, leftWasherY: 0.8, leftChainX: -1.2, leftChainY: -4.5, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: 0.1, charmY: -0.1},
'E': { leftWasherX: 0.2, leftWasherY: 0.7, leftChainX: -1.3, leftChainY: -4, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: 0.1, charmY: -0.1},
'F': { leftWasherX: 0.2, leftWasherY: 0.9, leftChainX: -1.3, leftChainY: -4.8, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: 0.1, charmY: -0.1 },
'G': { leftWasherX: 0.2, leftWasherY: 0.7, leftChainX: -1.3, leftChainY: -4, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: 0.1, charmY: -0.1},
'H': { leftWasherX: 0.2, leftWasherY: 0.9, leftChainX: -1.3, leftChainY: -4.8, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: 0.1, charmY: -0.1},
'I': {leftWasherX: 0.2, leftWasherY: 0.9, leftChainX: -1.3, leftChainY: -4.8, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: 0.1, charmY: -0.1 },
'J': { leftWasherX: 0.2, leftWasherY: 0.9, leftChainX: -1.3, leftChainY: -4.8, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: 0.1, charmY: -0.1},
'K': { leftWasherX: 0.2, leftWasherY: 0.9, leftChainX: -1.3, leftChainY: -4.8, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: 0.1, charmY: 0.1},
'L': { leftWasherX: 0.2, leftWasherY: 0.6, leftChainX: -1.3, leftChainY: -3.5, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: 0.1, charmY: -0.05},
'M': { leftWasherX: 0.4, leftWasherY: 0.9, leftChainX: -2.3, leftChainY: -5, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: 0.1, charmY: 0.05},
'N': { leftWasherX: 0.2, leftWasherY: 0.9, leftChainX: -1.3, leftChainY: -4.8, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: 0.1, charmY: -0.1},
'O': {  leftWasherX: 0.2, leftWasherY: 0.7, leftChainX: -1.3, leftChainY: -4, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: 0.1, charmY: -0.1},
'P': { leftWasherX: 0.2, leftWasherY: 0.9, leftChainX: -1.3, leftChainY: -4.8, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: -0.1, charmY: 0.1},
'Q': {  leftWasherX: 0.2, leftWasherY: 0.8, leftChainX: -1.3, leftChainY: -4.3, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: 0.1, charmY: -0.1},
'R': {  leftWasherX: 0.2, leftWasherY: 0.9, leftChainX: -1.3, leftChainY: -4.8, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: 0.1, charmY: 0.1 },
'S': { leftWasherX: 0.2, leftWasherY: 0.8, leftChainX: -1.3, leftChainY: -4.3, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: 0.1, charmY: -0.1 },
'T': { leftWasherX: 0.15, leftWasherY: 0.9, leftChainX: -0.7, leftChainY: -4.8, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: -0.05, charmY: 0.1 },
'U': {leftWasherX: 0.15, leftWasherY: 0.9, leftChainX: -0.7, leftChainY: -4.8, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: -0.05, charmY: -0.1 },
'V': {leftWasherX: 0.15, leftWasherY: 0.9, leftChainX: -0.7, leftChainY: -4.8, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: -0.05, charmY: -0.1},
'W': { leftWasherX: 0.15, leftWasherY: 0.9, leftChainX: -0.7, leftChainY: -4.8, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: -0.05, charmY: -0.1},
'X': {  leftWasherX: 0.15, leftWasherY: 0.9, leftChainX: -0.7, leftChainY: -4.8, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: -0.05, charmY: 0},
'Y': {leftWasherX: 0.15, leftWasherY: 0.9, leftChainX: -0.7, leftChainY: -4.8, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: -0.05, charmY: -0.3},
'Z': { leftWasherX: 0.15, leftWasherY: 0.8, leftChainX: -1, leftChainY: -4.5, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: -0.05, charmY: -0.1 },
  },
  yellowtail: {
'a': { leftWasherX: 0.1, leftWasherY: 0.2, leftChainX: -0.8, leftChainY: -1.5, rightWasherX: 0, rightWasherY: 0.3, rightChainX: -0.3, rightChainY: -2, charmX: 0, charmY: -0.1 },
'b': { leftWasherX: 0.25, leftWasherY: 0.7, leftChainX: -1.6, leftChainY: -4, rightWasherX: 0.15, rightWasherY: 0.85, rightChainX: 0.2, rightChainY: -4.8, charmX: -0.3, charmY: -0.1 },
'c': { leftWasherX: 0.1, leftWasherY: 0.25, leftChainX: -0.8, leftChainY: -1.8, rightWasherX: 0, rightWasherY: 0.35, rightChainX: -0.3, rightChainY: -2.3, charmX: 0, charmY: -0.1 },
'd': { leftWasherX: 0.65, leftWasherY: 0.7, leftChainX: -3.5, leftChainY: -4, rightWasherX: 0.2, rightWasherY: 0.8, rightChainX: 0.7, rightChainY: -4.5, charmX: 0, charmY: 0 },
'e': { leftWasherX: 0.1, leftWasherY: 0.3, leftChainX: -0.8, leftChainY: -2, rightWasherX: 0.1, rightWasherY: 0.4, rightChainX: 0.2, rightChainY: -2.5, charmX: 0, charmY: -0.05  },
'f': { leftWasherX: 0.6, leftWasherY: 0.7, leftChainX: -3.1, leftChainY: -4, rightWasherX: 0.1, rightWasherY: 0.9, rightChainX: 0.2, rightChainY: -5, charmX: -0.2, charmY: -0.3},
'g': { leftWasherX: 0.1, leftWasherY: 0.2, leftChainX: -0.8, leftChainY: -1.5, rightWasherX: 0, rightWasherY: 0.4, rightChainX: -0.3, rightChainY: -2.5, charmX: -0.2, charmY: -0.3},
'h': {leftWasherX: 0.32, leftWasherY: 0.7, leftChainX: -1.8, leftChainY: -4, rightWasherX: 0.15, rightWasherY: 0.75, rightChainX: 0.5, rightChainY: -4.2, charmX: 0, charmY: -0.1 },
'i': { leftWasherX: -0.1, leftWasherY: 0, leftChainX: 0.2, leftChainY: -0.5, rightWasherX: 0, rightWasherY: 0, rightChainX: -0.3, rightChainY: -0.5, charmX: -0.2, charmY: -0.1 },
'j': { leftWasherX: 0.35, leftWasherY: 0, leftChainX: -1.8, leftChainY: -0.5, rightWasherX: 0, rightWasherY: -0.05, rightChainX: -0.3, rightChainY: 0, charmX: -0.3, charmY: -0.4 },
'k': {leftWasherX: 0.35, leftWasherY: 0.7, leftChainX: -2.0, leftChainY: -4, rightWasherX: 0.15, rightWasherY: 0.85, rightChainX: 0.5, rightChainY: -4.8, charmX: 0, charmY: -0.1},
'l': { leftWasherX: 0.2, leftWasherY: 0.7, leftChainX: -1.3, leftChainY: -4, rightWasherX: 0.15, rightWasherY: 0.8, rightChainX: 0.5, rightChainY: -4.5, charmX: 0, charmY: 0  },
'm': { leftWasherX: 0.4, leftWasherY: 0.35, leftChainX: -2.3, leftChainY: -2.5, rightWasherX: 0, rightWasherY: 0.4, rightChainX: -0.3, rightChainY: -2.5, charmX: 0, charmY: 0 },
'n': { leftWasherX: 0.2, leftWasherY: 0.35, leftChainX: -1.3, leftChainY: -2.3, rightWasherX: 0, rightWasherY: 0.4, rightChainX: -0.3, rightChainY: -2.5, charmX: 0, charmY: -0.1  },
'o': { leftWasherX: 0.1, leftWasherY: 0.25, leftChainX: -0.5, leftChainY: -1.8, rightWasherX: 0, rightWasherY: 0.35, rightChainX: -0.2, rightChainY: -2.2, charmX: -0.1, charmY: -0.05},
'p': {  leftWasherX: 0.37, leftWasherY: 0.2, leftChainX: -2.1, leftChainY: -1.5, rightWasherX: 0, rightWasherY: 0.4, rightChainX: -0.3, rightChainY: -2.5, charmX: -0.3, charmY: -0.3},
'q': {  leftWasherX: 0.1, leftWasherY: 0.2, leftChainX: -0.8, leftChainY: -1.5, rightWasherX: 0, rightWasherY: 0.35, rightChainX: -0.3, rightChainY: -2.4, charmX: 0, charmY: -0.3},
'r': { leftWasherX: 0.2, leftWasherY: 0.35, leftChainX: -1.3, leftChainY: -2.3, rightWasherX: 0.2, rightWasherY: 0.22, rightChainX: 0.7, rightChainY: -1.7, charmX: -0.2, charmY: 0.1 },
's': { leftWasherX: 0.1, leftWasherY: 0.3, leftChainX: -0.6, leftChainY: -2, rightWasherX: 0, rightWasherY: 0.4, rightChainX: -0.3, rightChainY: -2.5, charmX: -0.1, charmY: -0.1  },
't': { leftWasherX: 0.15, leftWasherY: 0.6, leftChainX: -0.8, leftChainY: -3.5, rightWasherX: 0.1, rightWasherY: 0.6, rightChainX: 0.2, rightChainY: -3.5, charmX: -0.1, charmY: -0.1 },
'u': { leftWasherX: 0.2, leftWasherY: 0.4, leftChainX: -1.3, leftChainY: -2.5, rightWasherX: 0.1, rightWasherY: 0.4, rightChainX: 0.2, rightChainY: -2.5, charmX: 0, charmY: 0},
'v': { leftWasherX: 0.2, leftWasherY: 0.4, leftChainX: -1.3, leftChainY: -2.5, rightWasherX: 0.1, rightWasherY: 0.4, rightChainX: 0.2, rightChainY: -2.5, charmX: -0.1, charmY: 0},
'w': {  leftWasherX: 0.2, leftWasherY: 0.4, leftChainX: -1.3, leftChainY: -2.5, rightWasherX: 0.1, rightWasherY: 0.4, rightChainX: 0.2, rightChainY: -2.5, charmX: 0, charmY: 0},
'x': {  leftWasherX: 0.2, leftWasherY: 0.4, leftChainX: -1.3, leftChainY: -2.5, rightWasherX: 0.1, rightWasherY: 0.4, rightChainX: 0.2, rightChainY: -2.5, charmX: 0, charmY: -0.1},
'y': {  leftWasherX: 0.2, leftWasherY: 0.4, leftChainX: -1.3, leftChainY: -2.5, rightWasherX: 0.1, rightWasherY: 0.4, rightChainX: 0.2, rightChainY: -2.5, charmX: -0.2, charmY: -0.35 },
'z': {  leftWasherX: 0.2, leftWasherY: 0.4, leftChainX: -1.3, leftChainY: -2.5, rightWasherX: 0.1, rightWasherY: 0.4, rightChainX: 0.2, rightChainY: -2.5, charmX: 0, charmY: -0.05},
'A': { leftWasherX: 0.6, leftWasherY: 0.7, leftChainX: -3.3, leftChainY: -4, rightWasherX: 0.17, rightWasherY: 0.8, rightChainX: 0.7, rightChainY: -4.5, charmX: 0.1, charmY: 0.1 },
'B': { leftWasherX: 0.2, leftWasherY: 0.8, leftChainX: -1.3, leftChainY: -4.5, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: 0.1, charmY: 0},
'C': { leftWasherX: 0.3, leftWasherY: 0.7, leftChainX: -1.8, leftChainY: -4, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: 0.1, charmY: 0.15},
'D': { leftWasherX: 0.2, leftWasherY: 0.8, leftChainX: -1.3, leftChainY: -4.5, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: -0.15, charmY: -0.05},
'E': { leftWasherX: 0.2, leftWasherY: 0.7, leftChainX: -1.3, leftChainY: -4, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: 0.1, charmY: 0.1},
'F': { leftWasherX: 0.2, leftWasherY: 0.8, leftChainX: -1.3, leftChainY: -4.5, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: -0.3, charmY: 0.1 },
'G': { leftWasherX: 0.4, leftWasherY: 0.7, leftChainX: -2.3, leftChainY: -4, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: -0.3, charmY: -0.2},
'H': { leftWasherX: 0.2, leftWasherY: 0.8, leftChainX: -1.3, leftChainY: -4.5, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: -0.1, charmY: -0.05},
'I': {leftWasherX: 0.3, leftWasherY: 0.5, leftChainX: -1.8, leftChainY: -3, rightWasherX: 0.2, rightWasherY: 0.8, rightChainX: 0.7, rightChainY: -4.5, charmX: -0.3, charmY: 0 },
'J': { leftWasherX: 0.6, leftWasherY: 0.7, leftChainX: -3.0, leftChainY: -4.2, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -5, charmX: -0.3, charmY: -0.3 },
'K': { leftWasherX: 0.2, leftWasherY: 0.7, leftChainX: -1.3, leftChainY: -4, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: 0.1, charmY: -0.05},
'L': { leftWasherX: 0.9, leftWasherY: 0.7, leftChainX: -4.8, leftChainY: -4, rightWasherX: 0.1, rightWasherY: 0.8, rightChainX: 0.2, rightChainY: -4.5, charmX: -0.3, charmY: 0},
'M': { leftWasherX: 0.8, leftWasherY: 0.9, leftChainX: -4.3, leftChainY: -5, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -5, charmX: -0.3, charmY: 0},
'N': { leftWasherX: 0.6, leftWasherY: 0.9, leftChainX: -3.3, leftChainY: -5, rightWasherX: 0.1, rightWasherY: 0.9, rightChainX: 0.2, rightChainY: -5, charmX: -0.3, charmY: 0.05},
'O': {  leftWasherX: 0.3, leftWasherY: 0.7, leftChainX: -1.8, leftChainY: -4, rightWasherX: -0.1, rightWasherY: 0.9, rightChainX: -0.8, rightChainY: -5, charmX: -0.3, charmY: -0.05},
'P': { leftWasherX: 0.2, leftWasherY: 0.8, leftChainX: -1.3, leftChainY: -4.5, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: -0.5, charmY: -0.05},
'Q': { leftWasherX: 0.4, leftWasherY: 0.7, leftChainX: -2.3, leftChainY: -4, rightWasherX: -0.1, rightWasherY: 0.9, rightChainX: -0.8, rightChainY: -5, charmX: -0.3, charmY: -0.1},
'R': {  leftWasherX: 0.2, leftWasherY: 0.8, leftChainX: -1.3, leftChainY: -4.5, rightWasherX: -0.1, rightWasherY: 0.8, rightChainX: -0.8, rightChainY: -4.5, charmX: 0.1, charmY: -0.1 },
'S': { leftWasherX: 0.4, leftWasherY: 0.8, leftChainX: -2.3, leftChainY: -4.5, rightWasherX: 0.15, rightWasherY: 0.8, rightChainX: 0.5, rightChainY: -4.5, charmX: -0.3, charmY: -0.1 },
'T': { leftWasherX: 0, leftWasherY: 0.8, leftChainX: -0.3, leftChainY: -4.5, rightWasherX: 0.1, rightWasherY: 0.8, rightChainX: 0.2, rightChainY: -4.5, charmX: -0.4, charmY: 0 },
'U': {leftWasherX: 0.2, leftWasherY: 0.7, leftChainX: -1.3, leftChainY: -4, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: -0.05, charmY: -0.1},
'V': { leftWasherX: 0.2, leftWasherY: 0.7, leftChainX: -1.3, leftChainY: -4, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -5, charmX: -0.3, charmY: 0},
'W': { leftWasherX: 0.2, leftWasherY: 0.7, leftChainX: -1.3, leftChainY: -4, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -5, charmX: -0.3, charmY: 0},
'X': {  leftWasherX: 0.43, leftWasherY: 0.8, leftChainX: -2.3, leftChainY: -4.5, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: -0.1, charmY: -0.1},
'Y': { leftWasherX: 0.2, leftWasherY: 0.7, leftChainX: -1.3, leftChainY: -4, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: -0.3, charmY: -0.5},
'Z': { leftWasherX: 0.2, leftWasherY: 0.8, leftChainX: -1.0, leftChainY: -4.5, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -5, charmX: -0.05, charmY: -0.05 },
  },
  kingsman: {
'a': { leftWasherX: 0.1, leftWasherY: 0.4, leftChainX: -0.8, leftChainY: -2.5, rightWasherX: 0, rightWasherY: 0.35, rightChainX: -0.3, rightChainY: -2, charmX: 0, charmY: 0.1 },
'b': { leftWasherX: 0, leftWasherY: 0.8, leftChainX: -0.5, leftChainY: -4.5, rightWasherX: -0.1, rightWasherY: 0.8, rightChainX: -1.0, rightChainY: -4.5, charmX: 0, charmY: 0 },
'c': { leftWasherX: 0.1, leftWasherY: 0.5, leftChainX: -0.8, leftChainY: -3, rightWasherX: 0, rightWasherY: 0.45, rightChainX: -0.2, rightChainY: -2.8, charmX: 0, charmY: -0.05 },
'd': { leftWasherX: 0.4, leftWasherY: 0.8, leftChainX: -2.3, leftChainY: -4.5, rightWasherX: 0.05, rightWasherY: 0.85, rightChainX: 0, rightChainY: -4.5, charmX: 0, charmY: 0.1 },
'e': { leftWasherX: 0.1, leftWasherY: 0.4, leftChainX: -0.8, leftChainY: -2.7, rightWasherX: 0, rightWasherY: 0.4, rightChainX: -0.3, rightChainY: -2.5, charmX: 0, charmY: 0  },
'f': { leftWasherX: 0.3, leftWasherY: 0.7, leftChainX: -1.8, leftChainY: -4, rightWasherX: 0.2, rightWasherY: 0.6, rightChainX: 0.7, rightChainY: -3.5, charmX: 0, charmY: -0.5},
'g': { leftWasherX: 0.1, leftWasherY: 0.4, leftChainX: -0.8, leftChainY: -2.5, rightWasherX: 0, rightWasherY: 0.35, rightChainX: -0.3, rightChainY: -2.3, charmX: 0, charmY: -0.5},
'h': {leftWasherX: 0, leftWasherY: 0.7, leftChainX: -0.3, leftChainY: -4, rightWasherX: -0.1, rightWasherY: 0.4, rightChainX: -0.8, rightChainY: -2.5, charmX: 0, charmY: 0 },
'i': { leftWasherX: -0.1, leftWasherY: 0.2, leftChainX: 0.2, leftChainY: -1.5, rightWasherX: 0.15, rightWasherY: 0.1, rightChainX: 0.4, rightChainY: -1, charmX: 0, charmY: 0 },
'j': { leftWasherX: 0.3, leftWasherY: 0.2, leftChainX: -1.8, leftChainY: -1.5, rightWasherX: 0, rightWasherY: 0.2, rightChainX: -0.2, rightChainY: -1.5, charmX: 0, charmY: -0.3 },
'k': {leftWasherX: 0, leftWasherY: 0.7, leftChainX: -0.3, leftChainY: -4, rightWasherX: -0.2, rightWasherY: 0.7, rightChainX: -1.1, rightChainY: -4, charmX: 0, charmY: 0.05 },
'l': { leftWasherX: 0.2, leftWasherY: 0.7, leftChainX: -1.3, leftChainY: -4, rightWasherX: 0.2, rightWasherY: 0.7, rightChainX: 0.7, rightChainY: -4, charmX: 0, charmY: -0.05 },
'm': { leftWasherX: 0.2, leftWasherY: 0.45, leftChainX: -1.3, leftChainY: -2.8, rightWasherX: 0, rightWasherY: 0.4, rightChainX: -0.3, rightChainY: -2.5, charmX: 0, charmY: -0.05 },
'n': { leftWasherX: 0.2, leftWasherY: 0.45, leftChainX: -1.3, leftChainY: -2.8, rightWasherX: 0, rightWasherY: 0.4, rightChainX: -0.3, rightChainY: -2.5, charmX: 0, charmY: 0.05 },
'o': { leftWasherX: 0.1, leftWasherY: 0.4, leftChainX: -0.8, leftChainY: -2.5, rightWasherX: 0, rightWasherY: 0.4, rightChainX: -0.3, rightChainY: -2.5, charmX: 0, charmY: -0.05 },
'p': { leftWasherX: 0.1, leftWasherY: 0.5, leftChainX: -0.8, leftChainY: -3, rightWasherX: 0, rightWasherY: 0.45, rightChainX: -0.3, rightChainY: -2.8, charmX: -0.1, charmY: -0.3 },
'q': { leftWasherX: 0.1, leftWasherY: 0.4, leftChainX: -0.8, leftChainY: -2.5, rightWasherX: 0, rightWasherY: 0.4, rightChainX: -0.3, rightChainY: -2.5, charmX: 0, charmY: -0.3 },
'r': { leftWasherX: 0, leftWasherY: 0.45, leftChainX: -0.3, leftChainY: -2.8, rightWasherX: -0.12, rightWasherY: 0.4, rightChainX: -1.0, rightChainY: -2.8, charmX: 0, charmY: 0.1 },
's': { leftWasherX: 0.1, leftWasherY: 0.6, leftChainX: -0.6, leftChainY: -3.5, rightWasherX: 0.1, rightWasherY: 0.6, rightChainX: 0.1, rightChainY: -3.4, charmX: 0, charmY: -0.05 },
't': { leftWasherX: 0.05, leftWasherY: 0.6, leftChainX: -0.3, leftChainY: -3.5, rightWasherX: 0.1, rightWasherY: 0.5, rightChainX: 0.2, rightChainY: -3, charmX: 0, charmY: -0.05 },
'u': { leftWasherX: 0.1, leftWasherY: 0.5, leftChainX: -1, leftChainY: -2.8, rightWasherX: 0, rightWasherY: 0.5, rightChainX: -0.2, rightChainY: -2.8, charmX: 0, charmY: 0 },
'v': { leftWasherX: 0.1, leftWasherY: 0.5, leftChainX: -1, leftChainY: -2.8, rightWasherX: 0, rightWasherY: 0.5, rightChainX: -0.2, rightChainY: -2.8, charmX: 0, charmY: -0.05},
'w': { leftWasherX: 0.1, leftWasherY: 0.5, leftChainX: -1, leftChainY: -2.8, rightWasherX: 0, rightWasherY: 0.5, rightChainX: -0.2, rightChainY: -2.8, charmX: 0, charmY: -0.05 },
'x': { leftWasherX: 0.1, leftWasherY: 0.5, leftChainX: -0.8, leftChainY: -2.9, rightWasherX: 0, rightWasherY: 0.45, rightChainX: -0.1, rightChainY: -2.8, charmX: 0, charmY: 0 },
'y': { leftWasherX: 0.1, leftWasherY: 0.5, leftChainX: -0.8, leftChainY: -3, rightWasherX: 0, rightWasherY: 0.45, rightChainX: -0.3, rightChainY: -2.8, charmX: 0, charmY: -0.4 },
'z': { leftWasherX: 0.2, leftWasherY: 0.4, leftChainX: -1, leftChainY: -2.2, rightWasherX: 0, rightWasherY: 0.45, rightChainX: -0.3, rightChainY: -2.8, charmX: 0, charmY: -0.4 },
'A': { leftWasherX: 0.5, leftWasherY: 0.8, leftChainX: -2.8, leftChainY: -4.5, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.2, rightChainY: -4.5, charmX: 0.1, charmY: -0.2 },
'B': { leftWasherX: 0.2, leftWasherY: 0.7, leftChainX: -1.3, leftChainY: -4, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: 0.1, charmY: -0.3 },
'C': { leftWasherX: 0.2, leftWasherY: 0.7, leftChainX: -1.3, leftChainY: -4, rightWasherX: 0, rightWasherY: 0.7, rightChainX: -0.3, rightChainY: -4, charmX: 0.1, charmY: -0.2 },
'D': { leftWasherX: 0.2, leftWasherY: 0.7, leftChainX: -1.3, leftChainY: -4, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: 0.1, charmY: -0.2 },
'E': { leftWasherX: 0.2, leftWasherY: 0.7, leftChainX: -1.3, leftChainY: -4, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -5, charmX: 0.1, charmY: -0.2 },
'F': { leftWasherX: 0.2, leftWasherY: 0.9, leftChainX: -1.3, leftChainY: -4.8, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: -0.1, charmY: -0.2 },
'G': { leftWasherX: 0.2, leftWasherY: 0.7, leftChainX: -1.3, leftChainY: -4, rightWasherX: 0, rightWasherY: 0.7, rightChainX: -0.3, rightChainY: -4, charmX: 0.1, charmY: -0.6 },
'H': { leftWasherX: 0.2, leftWasherY: 0.9, leftChainX: -1.3, leftChainY: -4.8, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: 0.1, charmY: -0.3 },
'I': { leftWasherX: 0.1, leftWasherY: 0.8, leftChainX: -0.8, leftChainY: -4.5, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: 0.1, charmY: -0.3 },
'J': { leftWasherX: 0.2, leftWasherY: 0.8, leftChainX: -1.3, leftChainY: -4.5, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: 0.1, charmY: -0.25 },
'K': { leftWasherX: 0.2, leftWasherY: 0.9, leftChainX: -1.3, leftChainY: -4.8, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: 0.1, charmY: -0.2 },
'L': { leftWasherX: 0.3, leftWasherY: 0.7, leftChainX: -1.8, leftChainY: -4, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: 0.1, charmY: -0.25 },
'M': { leftWasherX: 0.4, leftWasherY: 0.8, leftChainX: -2.3, leftChainY: -4.5, rightWasherX: 0, rightWasherY: 0.8, rightChainX: -0.3, rightChainY: -4.5, charmX: 0.1, charmY: 0.05 },
'N': { leftWasherX: 0.2, leftWasherY: 0.8, leftChainX: -1.3, leftChainY: -4.5, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: 0.1, charmY: -0.1 },
'O': { leftWasherX: 0.2, leftWasherY: 0.7, leftChainX: -1.3, leftChainY: -4, rightWasherX: -0.1, rightWasherY: 0.7, rightChainX: -0.8, rightChainY: -4, charmX: 0.1, charmY: -0.15 },
'P': { leftWasherX: 0.2, leftWasherY: 1, leftChainX: -1.3, leftChainY: -5.3, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: -0.1, charmY: -0.1 },
'Q': { leftWasherX: 0.2, leftWasherY: 0.8, leftChainX: -1.3, leftChainY: -4.5, rightWasherX: -0.1, rightWasherY: 0.8, rightChainX: -0.8, rightChainY: -4.3, charmX: 0.1, charmY: -0.3 },
'R': { leftWasherX: 0.2, leftWasherY: 0.9, leftChainX: -1.3, leftChainY: -4.8, rightWasherX: -0.1, rightWasherY: 0.8, rightChainX: -0.8, rightChainY: -4.5, charmX: 0.1, charmY: -0.2 },
'S': { leftWasherX: 0.2, leftWasherY: 0.9, leftChainX: -1.3, leftChainY: -4.8, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: 0.1, charmY: -0.25 },
'T': { leftWasherX: 0, leftWasherY: 0.9, leftChainX: -0.3, leftChainY: -4.8, rightWasherX: 0.1, rightWasherY: 0.9, rightChainX: 0.2, rightChainY: -4.8, charmX: -0.05, charmY: -0.2 },
'U': { leftWasherX: 0.15, leftWasherY: 0.9, leftChainX: -0.8, leftChainY: -4.8, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: -0.05, charmY: -0.25 },
'V': { leftWasherX: 0.15, leftWasherY: 0.9, leftChainX: -0.8, leftChainY: -4.8, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -5, charmX: -0.05, charmY: -0.25 },
'W': { leftWasherX: 0.15, leftWasherY: 0.8, leftChainX: -0.8, leftChainY: -4.5, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -5, charmX: -0.05, charmY: -0.1 },
'X': { leftWasherX: 0.25, leftWasherY: 0.8, leftChainX: -1.3, leftChainY: -4.5, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: 0.1, charmY: -0.05 },
'Y': { leftWasherX: 0.15, leftWasherY: 0.9, leftChainX: -0.8, leftChainY: -4.8, rightWasherX: 0, rightWasherY: 0.9, rightChainX: -0.3, rightChainY: -4.8, charmX: -0.05, charmY: -0.45 },
'Z': { leftWasherX: 0.15, leftWasherY: 0.7, leftChainX: -0.8, leftChainY: -4, rightWasherX: 0, rightWasherY: 0.7, rightChainX: -0.3, rightChainY: -4, charmX: -0.05, charmY: -0.45 },
  },
};


// ─────────────────────────────────────────────────────────────────────────
// Bracelet-specific data (merged from the former bracelet-configurator/assets.js)
// Renamed to avoid colliding with the necklace exports above:
//   BRACELETS -> BRACELET_STYLES
//   CHARMS -> BRACELET_CHARMS
//   STONE_COLOR_SWATCHES -> BRACELET_STONE_COLOR_SWATCHES
//   CHARM_METAL_SWATCHES -> BRACELET_CHARM_METAL_SWATCHES
//   BRACELET_POSITIONS -> BRACELET_CHAIN_POSITIONS
//   CHARM_POSITIONS -> BRACELET_CHARM_POSITIONS
//   BRACELET_CARD_IMAGE_BY_PATH -> BRACELET_CHAIN_CARD_IMAGE_BY_PATH
//   NAME_PENDANT_SUPPORTED_PATHS (bracelet's meaning: which generated chains
//   ARE name chains) -> BRACELET_NAME_CHAIN_PATHS
// getImageCharmPath is identical in both original files, so only the necklace
// copy above is kept; the bracelet code below imports it unchanged.
// ─────────────────────────────────────────────────────────────────────────
// The procedurally generated chains have no GLB - their links, name plate and
// washers are all built in code at runtime (see NameChain.jsx). Anything that
// loads a model from a path must skip these.
// They differ only in link geometry; NAME_CHAIN_VARIANTS in NameChain.jsx holds
// the per-style dimensions.
// NB: the first one keeps its original id so shared/cart URLs made before the
// other two existed still resolve.
export const GENERATED_NAME_CHAIN_PATH = "generated://name-chain";              // long narrow links
export const GENERATED_NAME_CHAIN_ROUND_PATH = "generated://name-chain-round";  // circular links
export const GENERATED_NAME_CHAIN_OVAL_PATH = "generated://name-chain-oval";    // rounded oval links
export const GENERATED_NAME_CHAIN_SQUARE_PATH = "generated://name-chain-square"; // square links

// Placeholders for bracelets
export const PLACEHOLDERS_FOR_BRACELET = [
    "/bc-assets/bracelet_models/BRACELET1.glb",
    "/bc-assets/bracelet_models/BRACELET3.glb",
    "/bc-assets/bracelet_models/BRACELET4.glb",
    "/bc-assets/bracelet_models/BRACELET5.glb",
    "/bc-assets/bracelet_models/BRACELET6.glb"
];

// Array of paths to the bracelet GLB models.
export const BRACELET_STYLES = [
    //{ path: "/bc-assets/bracelet_models/BRACELET1.glb", name: "Bold Link Chain", price: 1000 },
    //{ path: "/bc-assets/bracelet_models/BRACELET2.glb", name: "Classic Chain", price: 1200 },
    //{ path: "/bc-assets/bracelet_models/BRACELET3.glb", name: "Light Chain", price: 1400 },
    //{ path: "/bc-assets/bracelet_models/BRACELET4.glb", name: "Swirl Diamond", price: 1600 },
    //{ path: "/bc-assets/bracelet_models/BRACELET5.glb", name: "Eternal Heart", price: 1800 },
    // { path: "/bc-assets/bracelet_models/BRACELET6.glb", name: "Bolt Closure", price: 2000 },
    // { path: "/bc-assets/bracelet_models/BRACELET7.glb", name: "Diamond Tennis", price: 2200 },
    // { path: "/bc-assets/bracelet_models/BRACELET8.glb", name: "Disc Braid", price: 2400 },
    // { path: "/bc-assets/bracelet_models/BRACELET9.glb", name: "Textured Loop", price: 2600 },
    // { path: "/bc-assets/bracelet_models/BRACELET10.glb", name: "Cut-Out Band", price: 2800 },
    // { path: "/bc-assets/bracelet_models/BRACELET11.glb", name: "Wave Band", price: 3000 },
     // Same order as the necklace chains: round first, then the elongated (cable) links.
     { path: GENERATED_NAME_CHAIN_ROUND_PATH, name: "Round", price: 3400 },
     { path: GENERATED_NAME_CHAIN_PATH, name: "Cable", price: 3400 },
     { path: GENERATED_NAME_CHAIN_OVAL_PATH, name: "Oval", price: 3450 },
     { path: GENERATED_NAME_CHAIN_SQUARE_PATH, name: "Square", price: 3450 },
     // Removed: GLB chain models (BRACELET13/14) are no longer used.
     // { path: "/bc-assets/bracelet_models/BRACELET13.glb", name: "Knot Link", price: 3200 },
     // { path: "/bc-assets/bracelet_models/BRACELET14.glb", name: "clip chain", price: 3200 },
];

// Default bracelet chain = the first card (Round).
export const DEFAULT_BRACELET_CHAIN_PATH = BRACELET_STYLES[0].path;

// Card thumbnail is tied to the bracelet's identity (path), not its index in
// BRACELETS, so re-ordering the array can never mismatch the artwork.
// Bracelet chains use the same icons as the necklace chains, in the same order.
export const BRACELET_CHAIN_CARD_IMAGE_BY_PATH = {
    // "/bc-assets/bracelet_models/BRACELET13.glb": "/bc-assets/images/bracelets/bracelet13.png",
    // "/bc-assets/bracelet_models/BRACELET14.glb": "/bc-assets/images/bracelets/bracelet14.png",
    [GENERATED_NAME_CHAIN_ROUND_PATH]: "/pc-assets/images/pendant_3.webp",  // was name-chain-round.webp
    [GENERATED_NAME_CHAIN_PATH]: "/pc-assets/images/pendant_4.webp",        // was name-chain-cable.webp
    [GENERATED_NAME_CHAIN_OVAL_PATH]: "/pc-assets/images/pendant_5.webp",   // was name-chain-oval.webp
    [GENERATED_NAME_CHAIN_SQUARE_PATH]: "/pc-assets/images/pendant_6.webp", // had no icon
};

// ── Name pendant ──────────────────────────────────────────────────────────
// Only the procedurally generated chains accept a name pendant: their links are
// built at runtime around whatever the name measures, so the chain can open up
// to exactly the right width. The two GLB chains are closed loops and cannot.
export const BRACELET_NAME_CHAIN_PATHS = [
    GENERATED_NAME_CHAIN_PATH,
    GENERATED_NAME_CHAIN_ROUND_PATH,
    GENERATED_NAME_CHAIN_OVAL_PATH,
    GENERATED_NAME_CHAIN_SQUARE_PATH,
];

export const isGeneratedNameChain = (path) => BRACELET_NAME_CHAIN_PATHS.includes(path);

export const NAME_PENDANT_MAX_LENGTH = 12;

// `letterSpacingEm` is a FRACTION OF THE TEXT SIZE, not a world-unit value.
// TextGeometry's own letterSpacing is absolute, so a value tuned at one size
// crushes the glyphs together at a smaller one - which is why this is stored
// as a ratio and multiplied by NAME_CHAIN_CONFIG.textSize at render time.
// The numbers below are the necklace's tuning (-0.10 at size 1.1) expressed
// as a ratio, so both configurators letter-space identically.
// Negative is correct here: these are connected script faces whose glyphs are
// drawn to overlap slightly and join up.
export const NAME_PENDANT_FONTS = [
    { id: "dancing",    label: "Dancing",    sample: "R", url: "/fonts/Dancing Script_Bold.json",  letterSpacingEm: -0.091 },
    { id: "kingsman",   label: "Kingsman",   sample: "K", url: "/fonts/Kingsman Demo_Regular.json", letterSpacingEm: -0.091 },
    { id: "yellowtail", label: "Yellowtail", sample: "Y", url: "/fonts/Yellowtail_Regular.json",    letterSpacingEm: -0.091 },
];

export const DEFAULT_NAME_PENDANT = {
    enabled: true,
    text: "Name",
    fontStyle: "dancing",
};

// Same character allow-list the necklace uses, capped for a wrist-sized plate.
export const sanitizePendantText = (value = "") =>
    value.replace(/[^a-zA-Z0-9 '&.-]/g, "").slice(0, NAME_PENDANT_MAX_LENGTH);

// Array of paths to the charm GLB models.
export const BRACELET_CHARMS = [
    { path: "/bc-assets/bracelet_models/CHARMS1.glb", name: "Classic Butterfly", price: 50 },
    { path: "/bc-assets/bracelet_models/CHARMS2.glb", name: "Elegant Floral", price: 60 },
    { path: "/bc-assets/bracelet_models/CHARMS3.glb", name: "Starfish", price: 70 },
    { path: "/bc-assets/bracelet_models/CHARMS4.glb", name: "Modern Star", price: 80 },
    { path: "/bc-assets/bracelet_models/CHARMS5.glb", name: "Sphere Locket", price: 90 },
    { path: "/bc-assets/bracelet_models/CHARMS6.glb", name: "Silken Tassel", price: 100 },
    { path: "/bc-assets/bracelet_models/CHARMS7.glb", name: "Classic Heart", price: 110 },
    { path: "/bc-assets/bracelet_models/CHARMS8.glb", name: "Gladiator Helmet", price: 120 },
    { path: "/bc-assets/bracelet_models/CHARMS9.png", name: "Butterfly", price: 60 },
    { path: "/bc-assets/bracelet_models/CHARMS10.png", name: "Cat", price: 60 },
    { path: "/bc-assets/bracelet_models/CHARMS11.png", name: "Dog", price: 60 },
    { path: "/bc-assets/bracelet_models/CHARMS12.png", name: "Paw", price: 60 },
    { path: "/bc-assets/bracelet_models/CHARMS13.png", name: "Cherry", price: 50 },
    { path: "/bc-assets/bracelet_models/CHARMS14.png", name: "Cluster", price: 50 },
    { path: "/bc-assets/bracelet_models/CHARMS15.png", name: "Flower", price: 50 },
    { path: "/bc-assets/bracelet_models/CHARMS16.png", name: "Leaf", price: 50 },
    { path: "/bc-assets/bracelet_models/CHARMS17.png", name: "A", price: 40 },
    { path: "/bc-assets/bracelet_models/CHARMS18.png", name: "B", price: 40 },
    { path: "/bc-assets/bracelet_models/CHARMS19.png", name: "C", price: 40 },
    { path: "/bc-assets/bracelet_models/CHARMS20.png", name: "D", price: 40 },
    { path: "/bc-assets/bracelet_models/CHARMS21.png", name: "Gemini", price: 50 },
    { path: "/bc-assets/bracelet_models/CHARMS22.png", name: "Leo", price: 50 },
    { path: "/bc-assets/bracelet_models/CHARMS23.png", name: "Taurus", price: 50 },
    { path: "/bc-assets/gemstone/BIRTHSTONE.glb", name: "Birthstone", price: 50, type: "birthstone" },
    { path: "/bc-assets/gemstone/D1.glb", name: "Round Diamond", price: 50, type: "diamond", preview: "/bc-assets/images/diamonds/round.webp" },
    { path: "/bc-assets/gemstone/D2.glb", name: "Pear Diamond", price: 50, type: "diamond", preview: "/bc-assets/images/diamonds/pear.webp" },
    { path: "/bc-assets/gemstone/D3.glb", name: "Oval Diamond", price: 50, type: "diamond", preview: "/bc-assets/images/diamonds/oval.webp" },
    { path: "/bc-assets/gemstone/princess.glb", name: "Princess Diamond", price: 50, type: "diamond", preview: "/bc-assets/images/diamonds/princess.webp" },
    { path: "/bc-assets/gemstone/cushion.glb", name: "Cushion Diamond", price: 50, type: "diamond", preview: "/bc-assets/images/diamonds/cushion.webp" },
];
export const BRACELET_STONE_COLOR_SWATCHES = [
    { key: "GAR", label: "Garnet (Jan)",      hex: "#C8102E", image: "/bc-assets/images/birthstones/garnet-jan.webp" },
    { key: "AME", label: "Amethyst (Feb)",   hex: "#6D3BB5", image: "/bc-assets/images/birthstones/amethyst-feb.webp" },
    { key: "AQU", label: "Aquamarine (Mar)",    hex: "#8EC7DF", image: "/bc-assets/images/birthstones/aquamarine-march.webp" },
    { key: "DIA", label: "Diamond (Apr)",       hex: "#F4F8FF", image: "/bc-assets/images/birthstones/diamond-april.webp" },
    { key: "EMR", label: "Emerald (May)",         hex: "#009B77", image: "/bc-assets/images/birthstones/emerald-may.webp" },
    { key: "ALX", label: "Alexandrite (Jun)",    hex: "#C978A9", image: "/bc-assets/images/birthstones/alexandrite-june.webp" },
    { key: "RBY", label: "Ruby (Jul)",           hex: "#9B111E", image: "/bc-assets/images/birthstones/ruby-july.webp" },
    { key: "PRD", label: "Peridot (Aug)",      hex: "#AFCB2B", image: "/bc-assets/images/birthstones/peridot-august.webp" },
    { key: "SAP", label: "Sapphire (Sep)",  hex: "#0F52BA", image: "/bc-assets/images/birthstones/sapphire-september.webp" },
    { key: "TRM", label: "Tourmaline (Oct)",  hex: "#F0839C", image: "/bc-assets/images/birthstones/tourmaline-october.webp" },
    { key: "TOP", label: "Topaz (Nov)",      hex: "#D9B83D", image: "/bc-assets/images/birthstones/topaz-november.webp" },
    { key: "TRQ", label: "Turquoise (Dec)",  hex: "#4AA7BA", image: "/bc-assets/images/birthstones/turquoise-december.webp" },
];
// Birthstone and diamond charms use pre-rendered images. Platinum intentionally
// shares the white-gold image set, as supplied by the product catalogue.
// Order matches the chain Metal row; `color` (swatch) matches the ring's GOLD_COLORS.
export const BRACELET_CHARM_METAL_SWATCHES = [
    { key: "SL", label: "Silver 925", hex: "#B8B8B8", color: "#CFCFCF", image: "white.png" },
    { key: "YG", label: "Yellow Gold", hex: "#FFD280", color: "#FFD280", image: "yellow.png" },
    { key: "RG", label: "Rose Gold", hex: "#FFBAA3", color: "#E6B08F", image: "rose.png" },
    { key: "PL", label: "Platinum", hex: "#e5e4e2", color: "#E5E4E2", image: "platinum.png" },
    { key: "WG", label: "White Gold", hex: "#DBDBDB", color: "#F1F1EF", image: "white.png" },
];

export const getCharmNumberFromPath = (path = "") => {
    const match = path.match(/CHARMS(\d+)\.png$/i);
    return match ? Number(match[1]) : null;
};

export const isImageCharmNumber = (number) => number >= 9 && number <= 36;

// Control thumbnails are intentionally shared across metals.  The rendered
// charm still uses getImageCharmPath(), which points at the selected metal's
// full-size artwork.
export const getImageCharmIconPath = (number) =>
    `/bc-assets/images/charms/charm${number}.png`;
// Manual per-point fine-tuning for birthstone charm placement.
// Keyed by bracelet path, then by point name ("point-1".."point-9").
//
// `offset` is [x, y, z] added directly to that point's final scene position
// (i.e. AFTER the bracelet's own wrapper transform — same units/scale you
// see the charm rendered at, so small nudges like 0.01–0.05 are typical).
//
// `rotationOffset` is in radians, added on top of the auto-computed radial
// rotation — positive spins the charm counter-clockwise around the bail axis.
//
// Everything defaults to 0/no change; only fill in a point once you've
// checked it in-scene and it needs a nudge.
export const BIRTHSTONE_POINT_ADJUSTMENTS = {
    "/bc-assets/bracelet_models/BRACELET13.glb": {
        "point-1": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-2": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-3": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-4": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-5": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-6": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-7": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-8": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-9": { offset: [0, 0, 0], rotationOffset: 0 },
    },
    "/bc-assets/bracelet_models/BRACELET14.glb": {
        "point-1": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-2": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-3": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-4": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-5": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-6": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-7": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-8": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-9": { offset: [0, 0, 0], rotationOffset: 0 },
    },
};
// Object defining the initial position and scale for each bracelet model.
export const BRACELET_CHAIN_POSITIONS = {
    "/bc-assets/bracelet_models/BRACELET1.glb": { position: [-3.6, 0, 0], },
    "/bc-assets/bracelet_models/BRACELET2.glb": { position: [-3.65, 0.2, -3], },
    "/bc-assets/bracelet_models/BRACELET3.glb": { position: [-0.3, -1.45, -1.4], rotation: [2, 0, 0] },
    "/bc-assets/bracelet_models/BRACELET4.glb": { position: [0, 0.3, 0], scale: [0.2, 0.2, 0.2], rotation: [1.6, 0, 0] },
    "/bc-assets/bracelet_models/BRACELET5.glb": { position: [0, 0.4, 0], scale: [3, 3, 3] },
    "/bc-assets/bracelet_models/BRACELET6.glb": { position: [0, 0.2, 0], scale: [2.3, 2.3, 2.3] },
    "/bc-assets/bracelet_models/BRACELET7.glb": { position: [0, 0.2, 0], scale: [0.07, 0.07, 0.07] },
    "/bc-assets/bracelet_models/BRACELET8.glb": { position: [0, 0.2, 0], scale: [0.07, 0.07, 0.07] },
    "/bc-assets/bracelet_models/BRACELET9.glb": { position: [0, 0.2, 0], scale: [0.07, 0.07, 0.07] },
    "/bc-assets/bracelet_models/BRACELET10.glb": { position: [0, 0.2, 0], scale: [0.07, 0.07, 0.07], rotation: [1.6, 0, 0] },
    "/bc-assets/bracelet_models/BRACELET11.glb": { position: [0, 0.2, 0], scale: [0.07, 0.07, 0.07], rotation: [1.6, 0, 0] },
    // 13/14 removed - GLB chain models no longer used.
    // "/bc-assets/bracelet_models/BRACELET13.glb": { position: [0, 0.6, 0], scale: [0.7, 0.7, 0.7] },
    // "/bc-assets/bracelet_models/BRACELET14.glb": { position: [0, 0.6, -0.03], scale: [0.686, 0.686, 0.686], rotation: [0, 0, 0]  },

};

// Object defining the positions and rotations for charms on each specific bracelet.
// This nested structure allows for precise placement of different charms on different bracelets.
export const BRACELET_CHARM_POSITIONS = {
    "/bc-assets/bracelet_models/BRACELET1.glb": {
        "/bc-assets/bracelet_models/CHARMS1.glb": [
            { position2: [-0.9, 0.2, 0], position: [-1.6, 0.2, -1], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.6, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -2], rotation: [Math.PI / 2, Math.PI, 1.3] },
            { position2: [-0.4, 0.2, -1], position: [-0.3, 0.2, -2.3], rotation: [Math.PI / 2, Math.PI, 0.9] },
            { position2: [0, 0.2, -1.1], position: [0.5, 0.2, -2.2], rotation: [Math.PI / 2, Math.PI, 0.5] },
            { position2: [0.4, 0.2, -1], position: [1.3, 0.2, -1.9], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.74, 0.2, -0.75], position: [1.9, 0.2, -1.2], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.92, 0.2, -0.45], position: [2.2, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.9, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.45, 0.2, 1.5], rotation: [Math.PI / 2, Math.PI, -1.7] },
            { position2: [0.6, 0.2, 0.6], position: [0.7, 0.2, 1.9], rotation: [Math.PI / 2, Math.PI, -2.1] },
            { position2: [0.24, 0.2, 0.8], position: [-0.1, 0.2, 2.05], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS2.glb": [
            { position2: [-0.95, 0.2, 0], position: [-2.1, 0.2, 0], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.9, 0.2, -0.4], position: [-2.0, 0.2, -0.5], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.75, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.9, 0.2, -2], rotation: [Math.PI / 2, Math.PI, 0.5] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -2.2], rotation: [Math.PI / 2, Math.PI, 0.1] },
            { position2: [0.4, 0.2, -1], position: [0.7, 0.2, -2.1], rotation: [Math.PI / 2, Math.PI, -0.2] },
            { position2: [0.74, 0.2, -0.75], position: [1.4, 0.2, -1.7], rotation: [Math.PI / 2, Math.PI, -0.5] },
            { position2: [0.93, 0.2, -0.45], position: [1.9, 0.2, -1.05], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [2.1, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.9, 0.2, 0.7], rotation: [Math.PI / 2, Math.PI, -1.8] },
            { position2: [0.6, 0.2, 0.6], position: [1.5, 0.2, 1.2], rotation: [Math.PI / 2, Math.PI, -2] },
            { position2: [0.24, 0.2, 0.8], position: [0.6, 0.2, 1.9], rotation: [Math.PI / 2, Math.PI, -2.8] }
        ],
        "/bc-assets/bracelet_models/CHARMS3.glb": [
            { position2: [-0.95, 0.2, 0], position: [-1.3, 0.2, 0], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.1, 0.1, 0.1] },
            { position2: [-0.9, 0.2, -0.4], position: [-1.3, 0.2, -0.5], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.1, 0.1, 0.1] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.05, 0.2, -1], rotation: [Math.PI / 2, Math.PI, 1.1], scale: [0.1, 0.1, 0.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.6, 0.2, -1.35], rotation: [Math.PI / 2, Math.PI, 0.5], scale: [0.1, 0.1, 0.1] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.1], scale: [0.1, 0.1, 0.1] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, -0.2], scale: [0.1, 0.1, 0.1] },
            { position2: [0.74, 0.2, -0.75], position: [0.9, 0.2, -1.1], rotation: [Math.PI / 2, Math.PI, -0.5], scale: [0.1, 0.1, 0.1] },
            { position2: [0.93, 0.2, -0.45], position: [1.3, 0.2, -0.6], rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.1, 0.1, 0.1] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0], rotation: [Math.PI / 2, Math.PI, -1.4], scale: [0.1, 0.1, 0.1] },
            { position2: [0.85, 0.2, 0.35], position: [1.2, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.8], scale: [0.1, 0.1, 0.1] },
            { position2: [0.6, 0.2, 0.6], position: [0.8, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.1, 0.1, 0.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.4, 0.2, 1.2], rotation: [Math.PI / 2, Math.PI, -2.8], scale: [0.1, 0.1, 0.1] }
        ],
        "/bc-assets/bracelet_models/CHARMS4.glb": [
            { position2: [-0.95, 0.2, 0], position: [-1.5, 0.2, 0], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.1, 0.1, 0.1] },
            { position2: [-0.9, 0.2, -0.4], position: [-1.4, 0.2, -0.5], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.1, 0.1, 0.1] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.2, 0.2, -1], rotation: [Math.PI / 2, Math.PI, 1.1], scale: [0.1, 0.1, 0.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.65, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.5], scale: [0.1, 0.1, 0.1] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.6], rotation: [Math.PI / 2, Math.PI, 0.1], scale: [0.1, 0.1, 0.1] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, -0.2], scale: [0.1, 0.1, 0.1] },
            { position2: [0.74, 0.2, -0.75], position: [1.0, 0.2, -1.2], rotation: [Math.PI / 2, Math.PI, -0.5], scale: [0.1, 0.1, 0.1] },
            { position2: [0.93, 0.2, -0.45], position: [1.4, 0.2, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.1, 0.1, 0.1] },
            { position2: [0.97, 0.2, -0.05], position: [1.5, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4], scale: [0.1, 0.1, 0.1] },
            { position2: [0.85, 0.2, 0.35], position: [1.3, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.8], scale: [0.1, 0.1, 0.1] },
            { position2: [0.6, 0.2, 0.6], position: [1.0, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.1, 0.1, 0.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.4, 0.2, 1.3], rotation: [Math.PI / 2, Math.PI, -2.8], scale: [0.1, 0.1, 0.1] }
        ],
        "/bc-assets/bracelet_models/CHARMS5.glb": [
            { position2: [-0.95, 0.2, 0], position: [-1.3, 0.15, 0], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.1, 0.1, 0.1] },
            { position2: [-0.9, 0.2, -0.4], position: [-1.25, 0.15, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.1, 0.1, 0.1] },
            { position2: [-0.7, 0.2, -0.74], position: [-0.95, 0.15, -0.98], rotation: [Math.PI / 2, Math.PI, 1.1], scale: [0.1, 0.1, 0.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.6, 0.15, -1.3], rotation: [Math.PI / 2, Math.PI, 0.5], scale: [0.1, 0.1, 0.1] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.15, -1.45], rotation: [Math.PI / 2, Math.PI, 0.1], scale: [0.1, 0.1, 0.1] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.15, -1.35], rotation: [Math.PI / 2, Math.PI, -0.2], scale: [0.1, 0.1, 0.1] },
            { position2: [0.74, 0.2, -0.75], position: [0.9, 0.15, -1.1], rotation: [Math.PI / 2, Math.PI, -0.5], scale: [0.1, 0.1, 0.1] },
            { position2: [0.93, 0.2, -0.45], position: [1.2, 0.15, -0.6], rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.1, 0.1, 0.1] },
            { position2: [0.97, 0.2, -0.05], position: [1.3, 0.15, -0], rotation: [Math.PI / 2, Math.PI, -1.4], scale: [0.1, 0.1, 0.1] },
            { position2: [0.85, 0.2, 0.35], position: [1.2, 0.15, 0.5], rotation: [Math.PI / 2, Math.PI, -1.8], scale: [0.1, 0.1, 0.1] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.15, 0.8], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.1, 0.1, 0.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.3, 0.1, 1.15], rotation: [Math.PI / 2, Math.PI, -2.8], scale: [0.1, 0.1, 0.1] }
        ],
        "/bc-assets/bracelet_models/CHARMS6.glb": [
            { position2: [-0.95, 0.2, 0], position: [-1.3, 0.15, 0], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.2, 0.2, 0.2] },
            { position2: [-0.9, 0.2, -0.4], position: [-1.25, 0.15, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.2, 0.2, 0.2] },
            { position2: [-0.7, 0.2, -0.74], position: [-0.95, 0.15, -0.9], rotation: [Math.PI / 2, Math.PI, 1.1], scale: [0.2, 0.2, 0.2] },
            { position2: [-0.4, 0.2, -1], position: [-0.5, 0.15, -1.3], rotation: [Math.PI / 2, Math.PI, 0.5], scale: [0.2, 0.2, 0.2] },
            { position2: [0, 0.2, -1.1], position: [0, 0.15, -1.4], rotation: [Math.PI / 2, Math.PI, 0.1], scale: [0.2, 0.2, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.15, -1.3], rotation: [Math.PI / 2, Math.PI, -0.2], scale: [0.2, 0.2, 0.2] },
            { position2: [0.74, 0.2, -0.75], position: [0.9, 0.15, -1.05], rotation: [Math.PI / 2, Math.PI, -0.5], scale: [0.2, 0.2, 0.2] },
            { position2: [0.93, 0.2, -0.45], position: [1.2, 0.15, -0.6], rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.2, 0.2, 0.2] },
            { position2: [0.97, 0.2, -0.05], position: [1.3, 0.15, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4], scale: [0.2, 0.2, 0.2] },
            { position2: [0.85, 0.2, 0.35], position: [1.1, 0.15, 0.5], rotation: [Math.PI / 2, Math.PI, -1.8], scale: [0.2, 0.2, 0.2] },
            { position2: [0.6, 0.2, 0.6], position: [0.85, 0.15, 0.8], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.2, 0.2, 0.2] },
            { position2: [0.24, 0.2, 0.8], position: [0.3, 0.1, 1.1], rotation: [Math.PI / 2, Math.PI, -2.8], scale: [0.2, 0.2, 0.2] }
        ],
        "/bc-assets/bracelet_models/CHARMS7.glb": [
            { position2: [-0.95, 0.2, 0], position: [-1.1, 0.15, 0], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.2, 0.2, 0.2] },
            { position2: [-0.9, 0.2, -0.4], position: [-1.15, 0.15, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.2, 0.2, 0.2] },
            { position2: [-0.7, 0.2, -0.74], position: [-0.9, 0.15, -0.9], rotation: [Math.PI / 2, Math.PI, 1.1], scale: [0.2, 0.2, 0.2] },
            { position2: [-0.4, 0.2, -1], position: [-0.5, 0.15, -1.2], rotation: [Math.PI / 2, Math.PI, 0.5], scale: [0.2, 0.2, 0.2] },
            { position2: [0, 0.2, -1.1], position: [0, 0.15, -1.3], rotation: [Math.PI / 2, Math.PI, 0.1], scale: [0.2, 0.2, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.15, -1.2], rotation: [Math.PI / 2, Math.PI, -0.2], scale: [0.2, 0.2, 0.2] },
            { position2: [0.74, 0.2, -0.75], position: [0.9, 0.15, -1], rotation: [Math.PI / 2, Math.PI, -0.5], scale: [0.2, 0.2, 0.2] },
            { position2: [0.93, 0.2, -0.45], position: [1.1, 0.15, -0.5], rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.2, 0.2, 0.2] },
            { position2: [0.97, 0.2, -0.05], position: [1.2, 0.15, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4], scale: [0.2, 0.2, 0.2] },
            { position2: [0.85, 0.2, 0.35], position: [1.0, 0.15, 0.4], rotation: [Math.PI / 2, Math.PI, -1.8], scale: [0.2, 0.2, 0.2] },
            { position2: [0.6, 0.2, 0.6], position: [0.7, 0.15, 0.8], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.2, 0.2, 0.2] },
            { position2: [0.24, 0.2, 0.8], position: [0.3, 0.15, 1], rotation: [Math.PI / 2, Math.PI, -2.8], scale: [0.2, 0.2, 0.2] }
        ],
        "/bc-assets/bracelet_models/CHARMS8.glb": [
            { position2: [-0.95, 0.2, 0], position: [-1.4, -0.7, 0], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.04, 0.04, 0.04] },
            { position2: [-0.9, 0.2, -0.4], position: [-1.45, -0.7, -0.5], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.04, 0.04, 0.04] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.15, -0.7, -1.05], rotation: [Math.PI / 2, Math.PI, 1.1], scale: [0.04, 0.04, 0.04] },
            { position2: [-0.4, 0.2, -1], position: [-0.6, -0.7, -1.45], rotation: [Math.PI / 2, Math.PI, 0.5], scale: [0.04, 0.04, 0.04] },
            { position2: [0, 0.2, -1.1], position: [0, -0.7, -1.6], rotation: [Math.PI / 2, Math.PI, 0.1], scale: [0.04, 0.04, 0.04] },
            { position2: [0.4, 0.2, -1], position: [0.5, -0.7, -1.55], rotation: [Math.PI / 2, Math.PI, -0.2], scale: [0.04, 0.04, 0.04] },
            { position2: [0.74, 0.2, -0.75], position: [1.0, -0.7, -1.2], rotation: [Math.PI / 2, Math.PI, -0.5], scale: [0.04, 0.04, 0.04] },
            { position2: [0.93, 0.2, -0.45], position: [1.4, -0.7, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.04, 0.04, 0.04] },
            { position2: [0.97, 0.2, -0.05], position: [1.5, -0.7, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4], scale: [0.04, 0.04, 0.04] },
            { position2: [0.85, 0.2, 0.35], position: [1.4, -0.7, 0.5], rotation: [Math.PI / 2, Math.PI, -1.8], scale: [0.04, 0.04, 0.04] },
            { position2: [0.6, 0.2, 0.6], position: [1.1, -0.7, 0.9], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.04, 0.04, 0.04] },
            { position2: [0.24, 0.2, 0.8], position: [0.4, -0.7, 1.3], rotation: [Math.PI / 2, Math.PI, -2.8], scale: [0.04, 0.04, 0.04] }
        ],
        "/bc-assets/bracelet_models/CHARMS9.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.35, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.33, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.2, -1.4], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.5] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.45, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS10.png": [
           { position2: [-0.9, 0.2, 0], position: [-1.42, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.41, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.18, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.8, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.18, 0.2, -1.55], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.58, 0.2, -1.45], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [1, 0.2, -1.18], rotation: [Math.PI / 2, Math.PI, -0.7] },
            { position2: [0.92, 0.2, -0.45], position: [1.3, 0.2, -0.75], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.45, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.3, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 1], rotation: [Math.PI / 2, Math.PI, -2.5] },
            { position2: [0.24, 0.2, 0.8], position: [0.5, 0.15, 1.2], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS11.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.35, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.33, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.2, -1.4], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.5] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.45, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS12.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.35, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.33, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.2, -1.4], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.5] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.45, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS13.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.35, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.33, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.2, -1.4], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.5] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.45, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS14.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.35, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.33, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.2, -1.4], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.5] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.45, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS15.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.35, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.33, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.2, -1.4], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.5] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.45, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS16.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.35, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.33, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.2, -1.4], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.5] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.45, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS17.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.42, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.41, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.18, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.8, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.18, 0.2, -1.55], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.58, 0.2, -1.45], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [1, 0.2, -1.18], rotation: [Math.PI / 2, Math.PI, -0.7] },
            { position2: [0.92, 0.2, -0.45], position: [1.3, 0.2, -0.75], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.45, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.3, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 1], rotation: [Math.PI / 2, Math.PI, -2.5] },
            { position2: [0.24, 0.2, 0.8], position: [0.5, 0.15, 1.2], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS18.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.38, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.37, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.18, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.55, 0.2, -1.45], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.7] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.75], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.95], rotation: [Math.PI / 2, Math.PI, -2.5] },
            { position2: [0.24, 0.2, 0.8], position: [0.5, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS19.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.38, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.37, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.18, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.55, 0.2, -1.45], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.7] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.75], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.95], rotation: [Math.PI / 2, Math.PI, -2.5] },
            { position2: [0.24, 0.2, 0.8], position: [0.5, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS20.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.38, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.37, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.18, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.55, 0.2, -1.45], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.7] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.75], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.95], rotation: [Math.PI / 2, Math.PI, -2.5] },
            { position2: [0.24, 0.2, 0.8], position: [0.5, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS21.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.35, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.33, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.2, -1.4], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.5] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.45, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS22.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.39, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.36, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.13, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.35], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.55], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.55, 0.2, -1.45], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.15], rotation: [Math.PI / 2, Math.PI, -0.7] },
            { position2: [0.92, 0.2, -0.45], position: [1.3, 0.2, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.45, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.3, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 1], rotation: [Math.PI / 2, Math.PI, -2.5] },
            { position2: [0.24, 0.2, 0.8], position: [0.5, 0.15, 1.2], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS23.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.35, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.33, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.2, -1.4], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.5] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.45, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],

    },
    "/bc-assets/bracelet_models/BRACELET2.glb": {
        "/bc-assets/bracelet_models/CHARMS1.glb": [
            { position2: [0.3, 0.2, -1.1], position: [-0.5, 0.2, 1.75], rotation: [Math.PI / 2, Math.PI, -2.5] },
            { position2: [1.3, 0.2, -0.9], position: [-0.95, 0.22, 1.4], rotation: [Math.PI / 2, Math.PI, -3] },
            { position2: [1.55, 0.2, 0], position: [-1.35, 0.24, 0.9], rotation: [Math.PI / 2, Math.PI, -3.5] },
        ],
        "/bc-assets/bracelet_models/CHARMS2.glb": [
            { position2: [0.3, 0.2, -1.1], position: [0.85, 0.2, 1.05], rotation: [Math.PI / 2, Math.PI, -2] },
            { position2: [1.3, 0.2, -0.9], position: [0.05, 0.6, 1.6], rotation: [1.2, Math.PI, -3] },
            { position2: [1.55, 0.2, 0], position: [-0.95, 0.5, 1.2], rotation: [1.2, Math.PI, -4] },
        ],
        "/bc-assets/bracelet_models/CHARMS3.glb": [
            { position2: [0.3, 0.2, -1.1], position: [0.15, 0.2, 0.8], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.1, 0.1, 0.1] },
            { position2: [1.3, 0.2, -0.9], position: [-0.11, 0.3, 0.9], rotation: [1.2, Math.PI, -3], scale: [0.1, 0.1, 0.1] },
            { position2: [1.55, 0.2, 0], position: [-0.28, 0.3, 0.8], rotation: [1.2, Math.PI, -3.7], scale: [0.1, 0.1, 0.1] },
        ],
        "/bc-assets/bracelet_models/CHARMS4.glb": [
            { position2: [0.3, 0.2, -1.1], position: [0.25, 0.2, 0.8], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.1, 0.1, 0.1] },
            { position2: [1.3, 0.2, -0.9], position: [-0.08, 0.3, 1], rotation: [1.2, Math.PI, -3], scale: [0.1, 0.1, 0.1] },
            { position2: [1.55, 0.2, 0], position: [-0.35, 0.3, 0.9], rotation: [1.2, Math.PI, -3.7], scale: [0.1, 0.1, 0.1] },
        ],
        "/bc-assets/bracelet_models/CHARMS5.glb": [
            { position2: [0.3, 0.2, -1.1], position: [0.15, 0.2, 0.75], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.1, 0.1, 0.1] },
            { position2: [1.3, 0.2, -0.9], position: [-0.11, 0.3, 0.85], rotation: [1.2, Math.PI, -3], scale: [0.1, 0.1, 0.1] },
            { position2: [1.55, 0.2, 0], position: [-0.28, 0.3, 0.75], rotation: [1.2, Math.PI, -3.7], scale: [0.1, 0.1, 0.1] },
        ],
        "/bc-assets/bracelet_models/CHARMS6.glb": [
            { position2: [0.3, 0.2, -1.1], position: [-0.05, 0.2, 0.74], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.1, 0.1, 0.1] },
            { position2: [1.3, 0.2, -0.9], position: [-0.11, 0.2, 0.75], rotation: [1.2, Math.PI, -3], scale: [0.1, 0.1, 0.1] },
            { position2: [1.55, 0.2, 0], position: [-0.20, 0.2, 0.75], rotation: [1.2, Math.PI, -3.7], scale: [0.1, 0.1, 0.1] },
        ],
        "/bc-assets/bracelet_models/CHARMS7.glb": [
            { position2: [0.3, 0.2, -1.1], position: [-0.05, 0.2, 0.7], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.1, 0.1, 0.1] },
            { position2: [1.3, 0.2, -0.9], position: [-0.11, 0.2, 0.7], rotation: [1.2, Math.PI, -3], scale: [0.1, 0.1, 0.1] },
            { position2: [1.55, 0.2, 0], position: [-0.20, 0.2, 0.69], rotation: [1.2, Math.PI, -3.7], scale: [0.1, 0.1, 0.1] },
        ],
        "/bc-assets/bracelet_models/CHARMS8.glb": [
            { position2: [0.3, 0.2, -1.1], position: [0.15, -0.4, 0.89], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, -0.3, 1.2], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.25, -0.25, 1.1], rotation: [1.2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS9.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS10.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.1, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.95], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.3, 0.1, 0.9], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS11.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS12.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS13.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS14.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS15.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS16.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS17.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.1, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.97], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.3, 0.1, 0.9], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS18.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS19.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS20.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS21.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS22.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.1, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.94], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.3, 0.1, 0.88], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS23.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ]
    },
    "/bc-assets/bracelet_models/BRACELET13.glb": {
        "/bc-assets/bracelet_models/CHARMS1.glb": [
            { position2: [0.2, 0.12, -1.0], scales: [0.02, 16, 16], position: [0.75, 0.1, -1.35], rotation: [Math.PI / 2, Math.PI, 0],scale: [20, 20, 20] },
            { position2: [0.46, 0.12, -0.85], scales: [0.02, 16, 16], position: [1.03, 0.13, -1.22], rotation: [Math.PI / 2, Math.PI, 0],scale: [20, 20, 20] },
            { position2: [0.65, 0.15, -0.67], scales: [0.02, 16, 16], position: [1.3, 0.15, -0.85], rotation: [Math.PI / 2, Math.PI, -0.3],scale: [20, 20, 20] },
            { position2: [0.82, 0.18, -0.43], scales: [0.02, 16, 16], position: [1.45, 0.16, -0.6], rotation: [Math.PI / 2, Math.PI, -0.3],scale: [20, 20, 20] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1.5, 0.23, 0.0], rotation: [Math.PI / 2, Math.PI, -0.8],scale: [20, 20, 20] },
            { position2: [0.85, 0.275, 0.11], scales: [0.02, 16, 16], position: [1.45, 0.29, 0.4], rotation: [Math.PI / 2, Math.PI, -1],scale: [20, 20, 20] },
            { position2: [0.78, 0.35, 0.37], scales: [0.02, 16, 16], position: [1.27, 0.35, 0.8], rotation: [Math.PI / 2, Math.PI, -1.3],scale: [20, 20, 20] },
            { position2: [0.65, 0.39, 0.61], scales: [0.02, 16, 16], position: [0.9, 0.37, 1.2], rotation: [Math.PI / 2, Math.PI, -1.8],scale: [20, 20, 20] },
            { position2: [0.46, 0.4, 0.82], scales: [0.02, 16, 16], position: [0.5, 0.4, 1.45], rotation: [Math.PI / 2, Math.PI, -2.1],scale: [20, 20, 20] },
            { position2: [0.2, 0.41, 0.94], scales: [0.02, 16, 16], position: [0.2, 0.4, 1.6], rotation: [Math.PI / 2, Math.PI, -2.1],scale: [20, 20, 20] },
            { position2: [-0.08, 0.42, 0.97], scales: [0.02, 16, 16], position: [-0.45, 0.43, 1.53], rotation: [Math.PI / 2, Math.PI, -2.7],scale: [20, 20, 20] },
            { position2: [-0.37, 0.41, 0.94], scales: [0.02, 16, 16], position: [-0.95, 0.43, 1.25], rotation: [Math.PI / 2, Math.PI, -3.2],scale: [20, 20, 20] },
            { position2: [-0.62, 0.41, 0.8], scales: [0.02, 16, 16], position: [-1.2, 0.43, 1.1], rotation: [Math.PI / 2, Math.PI, -3.2],scale: [20, 20, 20] },
            { position2: [-0.8, 0.38, 0.58], scales: [0.02, 16, 16], position: [-1.45, 0.41, 0.6], rotation: [Math.PI / 2, Math.PI, -3.7],scale: [20, 20, 20] },
            { position2: [-0.9, 0.32, 0.34], scales: [0.02, 16, 16], position: [-1.4, 0.35, -0.1], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [20, 20, 20] },
            { position2: [-0.92, 0.25, 0.05], scales: [0.02, 16, 16], position: [-1.4, 0.28, -0.35], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [20, 20, 20] },
            { position2: [-0.92, 0.2, -0.22], scales: [0.02, 16, 16], position: [-1.2, 0.23, -0.8], rotation: [Math.PI / 2, Math.PI, -4.8],scale: [20, 20, 20] },
            { position2: [-0.9, 0.15, -0.5], scales: [0.02, 16, 16], position: [-1.15, 0.2, -1.1], rotation: [Math.PI / 2, Math.PI, -4.8],scale: [20, 20, 20] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.8, 0.18, -1.4], rotation: [Math.PI / 2, Math.PI, -5.2],scale: [20, 20, 20] },
            { position2: [-0.53, 0.1, -0.96], scales: [0.02, 16, 16], position: [-0.31, 0.15, -1.6], rotation: [Math.PI / 2, Math.PI, -5.6],scale: [20, 20, 20] },
            { position2: [-0.26, 0.1, -1.04], scales: [0.02, 16, 16], position: [-0.05, 0.12, -1.68], rotation: [Math.PI / 2, Math.PI, -5.6],scale: [20, 20, 20] },
        ],
        "/bc-assets/bracelet_models/CHARMS2.glb": [
            { position2: [0.2, 0.12, -1.0], scales: [0.02, 16, 16], position: [0.2, 0.1, -1.57], rotation: [Math.PI / 2, Math.PI, 0],scale: [20, 20, 20] },
            { position2: [0.46, 0.12, -0.85], scales: [0.02, 16, 16], position: [0.47, 0.13, -1.45], rotation: [Math.PI / 2, Math.PI, 0],scale: [20, 20, 20] },
            { position2: [0.65, 0.15, -0.67], scales: [0.02, 16, 16], position: [0.84, 0.13, -1.2], rotation: [Math.PI / 2, Math.PI, -0.3],scale: [20, 20, 20] },
            { position2: [0.82, 0.18, -0.43], scales: [0.02, 16, 16], position: [1.25, 0.15, -0.8], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [20, 20, 20] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1.3, 0.2, -0.5], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [20, 20, 20] },
            { position2: [0.85, 0.275, 0.11], scales: [0.02, 16, 16], position: [1.31, 0.3, -0.22], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [20, 20, 20] },
            { position2: [0.78, 0.35, 0.37], scales: [0.02, 16, 16], position: [1.35, 0.35, 0.35], rotation: [Math.PI / 2, Math.PI, -1.5],scale: [20, 20, 20] },
            { position2: [0.65, 0.39, 0.61], scales: [0.02, 16, 16], position: [1.15, 0.38, 0.85], rotation: [Math.PI / 2, Math.PI, -2],scale: [20, 20, 20] },
            { position2: [0.46, 0.4, 0.82], scales: [0.02, 16, 16], position: [0.75, 0.39, 1.28], rotation: [Math.PI / 2, Math.PI, -2.5],scale: [20, 20, 20] },
            { position2: [0.2, 0.41, 0.94], scales: [0.02, 16, 16], position: [0.5, 0.39, 1.4], rotation: [Math.PI / 2, Math.PI, -2.5],scale: [20, 20, 20] },
            { position2: [-0.08, 0.42, 0.97], scales: [0.02, 16, 16], position: [0.0, 0.39, 1.53], rotation: [Math.PI / 2, Math.PI, -3],scale: [20, 20, 20] },
            { position2: [-0.37, 0.41, 0.94], scales: [0.02, 16, 16], position: [-0.56, 0.44, 1.45], rotation: [Math.PI / 2, Math.PI, -3.5],scale: [20, 20, 20] },
            { position2: [-0.62, 0.41, 0.8], scales: [0.02, 16, 16], position: [-1.0, 0.44, 1.2], rotation: [Math.PI / 2, Math.PI, -3.9],scale: [20, 20, 20] },
            { position2: [-0.8, 0.38, 0.58], scales: [0.02, 16, 16], position: [-1.3, 0.42, 0.78], rotation: [Math.PI / 2, Math.PI, -4.3],scale: [20, 20, 20] },
            { position2: [-0.9, 0.32, 0.34], scales: [0.02, 16, 16], position: [-1.46, 0.36, 0.25], rotation: [Math.PI / 2, Math.PI, -4.8],scale: [20, 20, 20] },
            { position2: [-0.92, 0.25, 0.05], scales: [0.02, 16, 16], position: [-1.46, 0.3, -0.02], rotation: [Math.PI / 2, Math.PI, -4.8],scale: [20, 20, 20] },
            { position2: [-0.92, 0.2, -0.22], scales: [0.02, 16, 16], position: [-1.46, 0.26, -0.3], rotation: [Math.PI / 2, Math.PI, -4.8],scale: [20, 20, 20] },
            { position2: [-0.9, 0.15, -0.5], scales: [0.02, 16, 16], position: [-1.42, 0.2, -0.55], rotation: [Math.PI / 2, Math.PI, -4.8],scale: [20, 20, 20] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-1.32, 0.15, -0.8], rotation: [Math.PI / 2, Math.PI, -4.8],scale: [20, 20, 20] },
            { position2: [-0.53, 0.1, -0.96], scales: [0.02, 16, 16], position: [-1.0, 0.13, -1.31], rotation: [Math.PI / 2, Math.PI, -5.4],scale: [20, 20, 20] },
            { position2: [-0.26, 0.1, -1.04], scales: [0.02, 16, 16], position: [-0.55, 0.1, -1.55], rotation: [Math.PI / 2, Math.PI, -5.8],scale: [20, 20, 20] },
        ],
        "/bc-assets/bracelet_models/CHARMS3.glb": [
            { position2: [0.2, 0.12, -1.0], scales: [0.02, 16, 16], position: [0.23, 0.1, -1.14], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.05, 0.05, 0.05] },
            { position2: [0.46, 0.12, -0.85], scales: [0.02, 16, 16], position: [0.5, 0.1, -1.01], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.05, 0.05, 0.05] },
            { position2: [0.65, 0.15, -0.67], scales: [0.02, 16, 16], position: [0.77, 0.15, -0.75], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.82, 0.18, -0.43], scales: [0.02, 16, 16], position: [0.96, 0.15, -0.5], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1.0, 0.22, -0.22], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.85, 0.275, 0.11], scales: [0.02, 16, 16], position: [1.0, 0.28, 0.05], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.78, 0.35, 0.37], scales: [0.02, 16, 16], position: [0.95, 0.34, 0.4], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.05, 0.05, 0.05] },
            { position2: [0.65, 0.39, 0.61], scales: [0.02, 16, 16], position: [0.78, 0.38, 0.63], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.05, 0.05, 0.05] },
            { position2: [0.46, 0.4, 0.82], scales: [0.02, 16, 16], position: [0.56, 0.4, 0.9], rotation: [Math.PI / 2, Math.PI, -2.1],scale: [0.05, 0.05, 0.05] },
            { position2: [0.2, 0.41, 0.94], scales: [0.02, 16, 16], position: [0.25, 0.43, 1.05], rotation: [Math.PI / 2, Math.PI, -2.5],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.08, 0.42, 0.97], scales: [0.02, 16, 16], position: [-0.06, 0.43, 1.13], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.37, 0.41, 0.94], scales: [0.02, 16, 16], position: [-0.36, 0.43, 1.08], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.62, 0.41, 0.8], scales: [0.02, 16, 16], position: [-0.67, 0.43, 0.9], rotation: [Math.PI / 2, Math.PI, -3.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.8, 0.38, 0.58], scales: [0.02, 16, 16], position: [-0.9, 0.43, 0.68], rotation: [Math.PI / 2, Math.PI, -3.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.9, 0.32, 0.34], scales: [0.02, 16, 16], position: [-1.0, 0.36, 0.35], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.92, 0.25, 0.05], scales: [0.02, 16, 16], position: [-1.04, 0.29, 0.07], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.92, 0.2, -0.22], scales: [0.02, 16, 16], position: [-1.04, 0.24, -0.2], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.9, 0.15, -0.5], scales: [0.02, 16, 16], position: [-1.02, 0.2, -0.5], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.88, 0.17, -0.83], rotation: [Math.PI / 2, Math.PI, -5],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.53, 0.1, -0.96], scales: [0.02, 16, 16], position: [-0.58, 0.1, -1.1], rotation: [Math.PI / 2, Math.PI, -5.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.26, 0.1, -1.04], scales: [0.02, 16, 16], position: [-0.3, 0.1, -1.2], rotation: [Math.PI / 2, Math.PI, -5.9],scale: [0.05, 0.05, 0.05] },
        ],
        "/bc-assets/bracelet_models/CHARMS4.glb": [
            { position2: [0.2, 0.12, -1.0], scales: [0.02, 16, 16], position: [0.23, 0.1, -1.21], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.05, 0.05, 0.05] },
            { position2: [0.46, 0.12, -0.85], scales: [0.02, 16, 16], position: [0.5, 0.1, -1.04], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.05, 0.05, 0.05] },
            { position2: [0.65, 0.15, -0.67], scales: [0.02, 16, 16], position: [0.84, 0.15, -0.8], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.82, 0.18, -0.43], scales: [0.02, 16, 16], position: [0.96, 0.15, -0.55], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1.05, 0.22, -0.28], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.85, 0.275, 0.11], scales: [0.02, 16, 16], position: [1.04, 0.3, 0.0], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.78, 0.35, 0.37], scales: [0.02, 16, 16], position: [1.0, 0.34, 0.4], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.05, 0.05, 0.05] },
            { position2: [0.65, 0.39, 0.61], scales: [0.02, 16, 16], position: [0.84, 0.38, 0.63], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.05, 0.05, 0.05] },
            { position2: [0.46, 0.4, 0.82], scales: [0.02, 16, 16], position: [0.62, 0.42, 0.9], rotation: [Math.PI / 2, Math.PI, -2.1],scale: [0.05, 0.05, 0.05] },
            { position2: [0.2, 0.41, 0.94], scales: [0.02, 16, 16], position: [0.3, 0.43, 1.1], rotation: [Math.PI / 2, Math.PI, -2.5],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.08, 0.42, 0.97], scales: [0.02, 16, 16], position: [-0.04, 0.43, 1.2], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.37, 0.41, 0.94], scales: [0.02, 16, 16], position: [-0.33, 0.43, 1.13], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.62, 0.41, 0.8], scales: [0.02, 16, 16], position: [-0.67, 0.43, 1.0], rotation: [Math.PI / 2, Math.PI, -3.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.8, 0.38, 0.58], scales: [0.02, 16, 16], position: [-0.95, 0.41, 0.74], rotation: [Math.PI / 2, Math.PI, -3.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.9, 0.32, 0.34], scales: [0.02, 16, 16], position: [-1.1, 0.36, 0.38], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.92, 0.25, 0.05], scales: [0.02, 16, 16], position: [-1.1, 0.29, 0.09], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.92, 0.2, -0.22], scales: [0.02, 16, 16], position: [-1.1, 0.24, -0.18], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.9, 0.15, -0.5], scales: [0.02, 16, 16], position: [-1.04, 0.2, -0.47], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.93, 0.17, -0.82], rotation: [Math.PI / 2, Math.PI, -5],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.53, 0.1, -0.96], scales: [0.02, 16, 16], position: [-0.68, 0.12, -1.1], rotation: [Math.PI / 2, Math.PI, -5.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.26, 0.1, -1.04], scales: [0.02, 16, 16], position: [-0.3, 0.1, -1.23], rotation: [Math.PI / 2, Math.PI, -5.9],scale: [0.05, 0.05, 0.05] },
        ],
        "/bc-assets/bracelet_models/CHARMS5.glb": [
            { position2: [0.2, 0.12, -1.0], scales: [0.02, 16, 16], position: [0.23, 0.1, -1.14], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.05, 0.05, 0.05] },
            { position2: [0.46, 0.12, -0.85], scales: [0.02, 16, 16], position: [0.48, 0.1, -1.01], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.05, 0.05, 0.05] },
            { position2: [0.65, 0.15, -0.67], scales: [0.02, 16, 16], position: [0.77, 0.15, -0.75], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.82, 0.18, -0.43], scales: [0.02, 16, 16], position: [0.94, 0.15, -0.52], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [0.98, 0.22, -0.24], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.85, 0.275, 0.11], scales: [0.02, 16, 16], position: [0.98, 0.28, 0.03], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.78, 0.35, 0.37], scales: [0.02, 16, 16], position: [0.93, 0.34, 0.38], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.05, 0.05, 0.05] },
            { position2: [0.65, 0.39, 0.61], scales: [0.02, 16, 16], position: [0.78, 0.38, 0.63], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.05, 0.05, 0.05] },
            { position2: [0.46, 0.4, 0.82], scales: [0.02, 16, 16], position: [0.56, 0.4, 0.88], rotation: [Math.PI / 2, Math.PI, -2.1],scale: [0.05, 0.05, 0.05] },
            { position2: [0.2, 0.41, 0.94], scales: [0.02, 16, 16], position: [0.28, 0.43, 1.05], rotation: [Math.PI / 2, Math.PI, -2.5],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.08, 0.42, 0.97], scales: [0.02, 16, 16], position: [-0.06, 0.43, 1.1], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.37, 0.41, 0.94], scales: [0.02, 16, 16], position: [-0.34, 0.43, 1.06], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.62, 0.41, 0.8], scales: [0.02, 16, 16], position: [-0.66, 0.43, 0.9], rotation: [Math.PI / 2, Math.PI, -3.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.8, 0.38, 0.58], scales: [0.02, 16, 16], position: [-0.9, 0.4, 0.68], rotation: [Math.PI / 2, Math.PI, -3.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.9, 0.32, 0.34], scales: [0.02, 16, 16], position: [-1.0, 0.33, 0.35], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.92, 0.25, 0.05], scales: [0.02, 16, 16], position: [-1.04, 0.26, 0.07], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.92, 0.2, -0.22], scales: [0.02, 16, 16], position: [-1.04, 0.22, -0.2], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.9, 0.15, -0.5], scales: [0.02, 16, 16], position: [-1.0, 0.18, -0.48], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.87, 0.14, -0.82], rotation: [Math.PI / 2, Math.PI, -5],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.53, 0.1, -0.96], scales: [0.02, 16, 16], position: [-0.63, 0.1, -1.03], rotation: [Math.PI / 2, Math.PI, -5.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.26, 0.1, -1.04], scales: [0.02, 16, 16], position: [-0.32, 0.1, -1.17], rotation: [Math.PI / 2, Math.PI, -5.9],scale: [0.05, 0.05, 0.05] },
        ],
        "/bc-assets/bracelet_models/CHARMS6.glb": [
            { position2: [0.2, 0.12, -1.0], scales: [0.02, 16, 16], position: [0.21, 0.1, -1.11], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.08, 0.08, 0.08] },
            { position2: [0.46, 0.12, -0.85], scales: [0.02, 16, 16], position: [0.48, 0.1, -0.98], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.08, 0.08, 0.08] },
            { position2: [0.65, 0.15, -0.67], scales: [0.02, 16, 16], position: [0.73, 0.15, -0.74], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.08, 0.08, 0.08] },
            { position2: [0.82, 0.18, -0.43], scales: [0.02, 16, 16], position: [0.91, 0.15, -0.49], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.08, 0.08, 0.08] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [0.96, 0.22, -0.22], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.08, 0.08, 0.08] },
            { position2: [0.85, 0.275, 0.11], scales: [0.02, 16, 16], position: [0.95, 0.28, 0.06], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.08, 0.08, 0.08] },
            { position2: [0.78, 0.35, 0.37], scales: [0.02, 16, 16], position: [0.9, 0.34, 0.38], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.08, 0.08, 0.08] },
            { position2: [0.65, 0.39, 0.61], scales: [0.02, 16, 16], position: [0.75, 0.38, 0.63], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.08, 0.08, 0.08] },
            { position2: [0.46, 0.4, 0.82], scales: [0.02, 16, 16], position: [0.54, 0.4, 0.87], rotation: [Math.PI / 2, Math.PI, -2.1],scale: [0.08, 0.08, 0.08] },
            { position2: [0.2, 0.41, 0.94], scales: [0.02, 16, 16], position: [0.26, 0.43, 1.01], rotation: [Math.PI / 2, Math.PI, -2.5],scale: [0.08, 0.08, 0.08] },
            { position2: [-0.08, 0.42, 0.97], scales: [0.02, 16, 16], position: [-0.06, 0.43, 1.07], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.08, 0.08, 0.08] },
            { position2: [-0.37, 0.41, 0.94], scales: [0.02, 16, 16], position: [-0.34, 0.43, 1.03], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.08, 0.08, 0.08] },
            { position2: [-0.62, 0.41, 0.8], scales: [0.02, 16, 16], position: [-0.64, 0.43, 0.89], rotation: [Math.PI / 2, Math.PI, -3.4],scale: [0.08, 0.08, 0.08] },
            { position2: [-0.8, 0.38, 0.58], scales: [0.02, 16, 16], position: [-0.85, 0.4, 0.62], rotation: [Math.PI / 2, Math.PI, -3.9],scale: [0.08, 0.08, 0.08] },
            { position2: [-0.9, 0.32, 0.34], scales: [0.02, 16, 16], position: [-0.98, 0.33, 0.35], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.08, 0.08, 0.08] },
            { position2: [-0.92, 0.25, 0.05], scales: [0.02, 16, 16], position: [-1.02, 0.26, 0.07], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.08, 0.08, 0.08] },
            { position2: [-0.92, 0.2, -0.22], scales: [0.02, 16, 16], position: [-1.01, 0.22, -0.2], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.08, 0.08, 0.08] },
            { position2: [-0.9, 0.15, -0.5], scales: [0.02, 16, 16], position: [-0.98, 0.18, -0.48], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.08, 0.08, 0.08] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.14, -0.81], rotation: [Math.PI / 2, Math.PI, -5],scale: [0.08, 0.08, 0.08] },
            { position2: [-0.53, 0.1, -0.96], scales: [0.02, 16, 16], position: [-0.61, 0.13, -1.03], rotation: [Math.PI / 2, Math.PI, -5.4],scale: [0.08, 0.08, 0.08] },
            { position2: [-0.26, 0.1, -1.04], scales: [0.02, 16, 16], position: [-0.32, 0.1, -1.13], rotation: [Math.PI / 2, Math.PI, -5.9],scale: [0.08, 0.08, 0.08] },
        ],
        "/bc-assets/bracelet_models/CHARMS7.glb": [
            { position2: [0.2, 0.12, -1.0], scales: [0.02, 16, 16], position: [0.21, 0.1, -1.06], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.05, 0.05, 0.05] },
            { position2: [0.46, 0.12, -0.85], scales: [0.02, 16, 16], position: [0.48, 0.13, -0.93], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.05, 0.05, 0.05] },
            { position2: [0.65, 0.15, -0.67], scales: [0.02, 16, 16], position: [0.71, 0.15, -0.69], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.82, 0.18, -0.43], scales: [0.02, 16, 16], position: [0.85, 0.18, -0.45], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [0.92, 0.22, -0.17], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.85, 0.275, 0.11], scales: [0.02, 16, 16], position: [0.9, 0.28, 0.09], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.78, 0.35, 0.37], scales: [0.02, 16, 16], position: [0.83, 0.36, 0.38], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.05, 0.05, 0.05] },
            { position2: [0.65, 0.39, 0.61], scales: [0.02, 16, 16], position: [0.69, 0.38, 0.62], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.05, 0.05, 0.05] },
            { position2: [0.46, 0.4, 0.82], scales: [0.02, 16, 16], position: [0.5, 0.4, 0.84], rotation: [Math.PI / 2, Math.PI, -2.1],scale: [0.05, 0.05, 0.05] },
            { position2: [0.2, 0.41, 0.94], scales: [0.02, 16, 16], position: [0.22, 0.43, 0.98], rotation: [Math.PI / 2, Math.PI, -2.5],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.08, 0.42, 0.97], scales: [0.02, 16, 16], position: [-0.06, 0.43, 1.03], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.37, 0.41, 0.94], scales: [0.02, 16, 16], position: [-0.36, 0.43, 0.97], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.62, 0.41, 0.8], scales: [0.02, 16, 16], position: [-0.64, 0.43, 0.82], rotation: [Math.PI / 2, Math.PI, -3.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.8, 0.38, 0.58], scales: [0.02, 16, 16], position: [-0.8, 0.4, 0.6], rotation: [Math.PI / 2, Math.PI, -3.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.9, 0.32, 0.34], scales: [0.02, 16, 16], position: [-0.94, 0.33, 0.35], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.92, 0.25, 0.05], scales: [0.02, 16, 16], position: [-0.97, 0.26, 0.06], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.92, 0.2, -0.22], scales: [0.02, 16, 16], position: [-0.97, 0.22, -0.22], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.9, 0.15, -0.5], scales: [0.02, 16, 16], position: [-0.92, 0.18, -0.51], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.78, 0.14, -0.79], rotation: [Math.PI / 2, Math.PI, -5],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.53, 0.1, -0.96], scales: [0.02, 16, 16], position: [-0.56, 0.13, -0.99], rotation: [Math.PI / 2, Math.PI, -5.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.26, 0.1, -1.04], scales: [0.02, 16, 16], position: [-0.28, 0.1, -1.08], rotation: [Math.PI / 2, Math.PI, -5.9],scale: [0.05, 0.05, 0.05] },
        ],
        "/bc-assets/bracelet_models/CHARMS8.glb": [
            { position2: [0.2, 0.12, -1.0], scales: [0.02, 16, 16], position: [0.21, -0.1, -1.11], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85], scales: [0.02, 16, 16], position: [0.48, -0.1, -0.99], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67], scales: [0.02, 16, 16], position: [0.75, -0.06, -0.75], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43], scales: [0.02, 16, 16], position: [0.91, -0.04, -0.51], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [0.98, 0.01, -0.22], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11], scales: [0.02, 16, 16], position: [0.95, 0.07, 0.06], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37], scales: [0.02, 16, 16], position: [0.9, 0.14, 0.4], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61], scales: [0.02, 16, 16], position: [0.76, 0.17, 0.64], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82], scales: [0.02, 16, 16], position: [0.55, 0.21, 0.85], rotation: [Math.PI / 2, Math.PI, -2.1],scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94], scales: [0.02, 16, 16], position: [0.26, 0.21, 1.04], rotation: [Math.PI / 2, Math.PI, -2.5],scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97], scales: [0.02, 16, 16], position: [-0.06, 0.21, 1.1], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94], scales: [0.02, 16, 16], position: [-0.34, 0.22, 1.04], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8], scales: [0.02, 16, 16], position: [-0.64, 0.22, 0.9], rotation: [Math.PI / 2, Math.PI, -3.4],scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58], scales: [0.02, 16, 16], position: [-0.88, 0.18, 0.66], rotation: [Math.PI / 2, Math.PI, -3.9],scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34], scales: [0.02, 16, 16], position: [-1.0, 0.13, 0.35], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05], scales: [0.02, 16, 16], position: [-1.03, 0.06, 0.07], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22], scales: [0.02, 16, 16], position: [-1.02, 0.01, -0.21], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5], scales: [0.02, 16, 16], position: [-0.98, -0.03, -0.48], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.85, -0.06, -0.8], rotation: [Math.PI / 2, Math.PI, -5],scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96], scales: [0.02, 16, 16], position: [-0.62, -0.09, -1.02], rotation: [Math.PI / 2, Math.PI, -5.4],scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04], scales: [0.02, 16, 16], position: [-0.3, -0.09, -1.15], rotation: [Math.PI / 2, Math.PI, -5.9],scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS9.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS10.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.96],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.09],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.12],  rotation: [Math.PI / 2,   Math.PI, -3.3], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.08],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.92],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS11.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS12.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ]
        ,
        "/bc-assets/bracelet_models/CHARMS13.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS14.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS15.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS16.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS17.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.16],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.005, 0.005, 0.005] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.52, 0.12,  -0.99],  rotation: [Math.PI / 1.7, Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.73, 0.15,  -0.78],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 1.7, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [0.98, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.95, 0.275,  0.12],  rotation: [Math.PI / 1.7, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.87, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.73, 0.39,   0.68],  rotation: [Math.PI / 1.7, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.09],  rotation: [Math.PI / 1.7, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.12],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.41,  1.08],  rotation: [Math.PI / 1.7, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 1.7, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-1.01, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.03, 0.25,  0.06],  rotation: [Math.PI / 1.7, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.03, 0.2,  -0.25],  rotation: [Math.PI / 1.7, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-1.01, 0.15, -0.56],  rotation: [Math.PI / 1.7, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.87],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.11],  rotation: [Math.PI / 1.7, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.1,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },

        ],
        "/bc-assets/bracelet_models/CHARMS18.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS19.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS20.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS21.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS22.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS23.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ]
    },
    "/bc-assets/bracelet_models/BRACELET4.glb": {
        "/bc-assets/bracelet_models/CHARMS1.glb": [
            { position2: [-1.2, 0.3, -0.7], position: [-3, 0.5, -3], rotation: [Math.PI / 2, Math.PI, 1.7], scale: [90, 90, 90] },
            { position2: [-0, 0.3, -1.45], position: [2, 0.5, -3.5], rotation: [Math.PI / 2, Math.PI, 6.5], scale: [90, 90, 90] },
            { position2: [1.3, 0.3, -0.65], position: [3.95, 0.5, 0.7], rotation: [Math.PI / 2, Math.PI, -1], scale: [90, 90, 90] },
            { position2: [1.25, 0.25, 0.75], position: [0.4, 0.5, 3.65], rotation: [Math.PI / 2, Math.PI, -2.4], scale: [90, 90, 90] },
            { position2: [0., 0.25, 1.43], position: [-3, 0.5, 2], rotation: [Math.PI / 2, Math.PI, -3.5], scale: [90, 90, 90] },
            { position2: [-1.2, 0.27, 0.7], position: [-4.1, 0.5, -0.25], rotation: [Math.PI / 2, Math.PI, -4], scale: [90, 90, 90] },
        ],
        "/bc-assets/bracelet_models/CHARMS2.glb": [
            { position2: [-1.2, 0.3, -0.7], position: [-3.55, 0.5, -0.5], rotation: [Math.PI / 2, Math.PI, 1.7], scale: [90, 90, 90] },
            { position2: [-0, 0.3, -1.45], position: [-0.3, 0.6, -3.74], rotation: [Math.PI / 2, Math.PI, 6.5], scale: [90, 90, 90] },
            { position2: [1.3, 0.3, -0.65], position: [3.3, 0.5, -1.9], rotation: [Math.PI / 2, Math.PI, -1], scale: [90, 90, 90] },
            { position2: [1.25, 0.25, 0.75], position: [2.8, 0.45, 2.5], rotation: [Math.PI / 2, Math.PI, -2.4], scale: [90, 90, 90] },
            { position2: [0., 0.25, 1.43], position: [-1, 0.45, 3.7], rotation: [Math.PI / 2, Math.PI, -3.5], scale: [90, 90, 90] },
            { position2: [-1.2, 0.27, 0.7], position: [-3, 0.45, 2.3], rotation: [Math.PI / 2, Math.PI, -4], scale: [90, 90, 90] },
        ],
        "/bc-assets/bracelet_models/CHARMS3.glb": [
            { position2: [-1.2, 0.3, -0.7], position: [-1.8, 0.5, -0.8], rotation: [Math.PI / 2, Math.PI, 1.7], scale: [0.3, 0.3, 0.3] },
            { position2: [-0, 0.3, -1.45], position: [0.1, 0.6, -2], rotation: [Math.PI / 2, Math.PI, 6.5], scale: [0.3, 0.3, 0.3] },
            { position2: [1.3, 0.3, -0.65], position: [1.8, 0.5, -1], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.3, 0.3, 0.3] },
            { position2: [1.25, 0.25, 0.75], position: [1.5, 0.45, 1.5], rotation: [Math.PI / 2, Math.PI, -2.4], scale: [0.3, 0.3, 0.3] },
            { position2: [0., 0.25, 1.43], position: [-0.5, 0.45, 2], rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.3, 0.3, 0.3] },
            { position2: [-1.2, 0.27, 0.7], position: [-1.8, 0.45, 1], rotation: [Math.PI / 2, Math.PI, -4], scale: [0.3, 0.3, 0.3] },
        ],
        "/bc-assets/bracelet_models/CHARMS4.glb": [
            { position2: [-1.2, 0.3, -0.7], position: [-2.3, 0.5, -0.5], rotation: [Math.PI / 2, Math.PI, 1.7], scale: [0.3, 0.3, 0.3] },
            { position2: [-0, 0.3, -1.45], position: [0, 0.6, -2.5], rotation: [Math.PI / 2, Math.PI, 6.5], scale: [0.3, 0.3, 0.3] },
            { position2: [1.3, 0.3, -0.65], position: [2.1, 0.5, -1.3], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.3, 0.3, 0.3] },
            { position2: [1.25, 0.25, 0.75], position: [2, 0.45, 1.5], rotation: [Math.PI / 2, Math.PI, -2.4], scale: [0.3, 0.3, 0.3] },
            { position2: [0., 0.25, 1.43], position: [-0.5, 0.45, 2.4], rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.3, 0.3, 0.3] },
            { position2: [-1.2, 0.27, 0.7], position: [-2.1, 0.45, 1.3], rotation: [Math.PI / 2, Math.PI, -4], scale: [0.3, 0.3, 0.3] },
        ],
        "/bc-assets/bracelet_models/CHARMS5.glb": [
            { position2: [-1.2, 0.3, -0.7], position: [-1.8, 0.45, -0.7], rotation: [Math.PI / 2, Math.PI, 1.7], scale: [0.3, 0.3, 0.3] },
            { position2: [-0, 0.3, -1.45], position: [0, 0.45, -2], rotation: [Math.PI / 2, Math.PI, 6.5], scale: [0.3, 0.3, 0.3] },
            { position2: [1.3, 0.3, -0.65], position: [1.8, 0.4, -1], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.3, 0.3, 0.3] },
            { position2: [1.25, 0.25, 0.75], position: [1.65, 0.3, 1.2], rotation: [Math.PI / 2, Math.PI, -2.4], scale: [0.3, 0.3, 0.3] },
            { position2: [0., 0.25, 1.43], position: [-0.3, 0.3, 2], rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.3, 0.3, 0.3] },
            { position2: [-1.2, 0.27, 0.7], position: [-1.6, 0.3, 1.1], rotation: [Math.PI / 2, Math.PI, -4], scale: [0.3, 0.3, 0.3] },
        ],
        "/bc-assets/bracelet_models/CHARMS6.glb": [
            { position2: [-1.2, 0.3, -0.7], position: [-1.5, 0.45, -0.7], rotation: [Math.PI / 2, Math.PI, 1.7], scale: [0.3, 0.3, 0.3] },
            { position2: [-0, 0.3, -1.45], position: [0, 0.45, -1.7], rotation: [Math.PI / 2, Math.PI, 6.5], scale: [0.3, 0.3, 0.3] },
            { position2: [1.3, 0.3, -0.65], position: [1.5, 0.4, -0.8], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.3, 0.3, 0.3] },
            { position2: [1.25, 0.25, 0.75], position: [1.4, 0.4, 1], rotation: [Math.PI / 2, Math.PI, -2.4], scale: [0.3, 0.3, 0.3] },
            { position2: [0., 0.25, 1.43], position: [-0.3, 0.4, 1.7], rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.3, 0.3, 0.3] },
            { position2: [-1.2, 0.27, 0.7], position: [-1.5, 0.4, 0.9], rotation: [Math.PI / 2, Math.PI, -4], scale: [0.3, 0.3, 0.3] },
        ],
        "/bc-assets/bracelet_models/CHARMS7.glb": [
            { position2: [-1.2, 0.3, -0.7], position: [-1.3, 0.45, -0.7], rotation: [Math.PI / 2, Math.PI, 1.7], scale: [0.3, 0.3, 0.3] },
            { position2: [-0, 0.3, -1.45], position: [0, 0.45, -1.5], rotation: [Math.PI / 2, Math.PI, 6.5], scale: [0.3, 0.3, 0.3] },
            { position2: [1.3, 0.3, -0.65], position: [1.2, 0.4, -0.8], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.3, 0.3, 0.3] },
            { position2: [1.25, 0.25, 0.75], position: [1.2, 0.4, 0.8], rotation: [Math.PI / 2, Math.PI, -2.4], scale: [0.3, 0.3, 0.3] },
            { position2: [0., 0.25, 1.43], position: [-0.2, 0.4, 1.45], rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.3, 0.3, 0.3] },
            { position2: [-1.2, 0.27, 0.7], position: [-1.3, 0.4, 0.8], rotation: [Math.PI / 2, Math.PI, -4], scale: [0.3, 0.3, 0.3] },
        ],
        "/bc-assets/bracelet_models/CHARMS8.glb": [
            { position2: [-1.2, 0.3, -0.7], position: [-1.8, -1, -0.7], rotation: [Math.PI / 2, Math.PI, 1.7], scale: [0.07, 0.07, 0.07] },
            { position2: [-0, 0.3, -1.45], position: [0, -1, -2.05], rotation: [Math.PI / 2, Math.PI, 6.5], scale: [0.07, 0.07, 0.07] },
            { position2: [1.3, 0.3, -0.65], position: [1.9, -1, -0.9], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.07, 0.07, 0.07] },
            { position2: [1.25, 0.25, 0.75], position: [1.65, -1.1, 1.2], rotation: [Math.PI / 2, Math.PI, -2.4], scale: [0.07, 0.07, 0.07] },
            { position2: [0., 0.25, 1.43], position: [-0.2, -1.1, 2], rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.07, 0.07, 0.07] },
            { position2: [-1.2, 0.27, 0.7], position: [-1.65, -1.1, 1.2], rotation: [Math.PI / 2, Math.PI, -4], scale: [0.07, 0.07, 0.07] },
        ],
    },
      "/bc-assets/bracelet_models/BRACELET14.glb": {
        "/bc-assets/bracelet_models/CHARMS1.glb": [{ scale: [20, 20, 20] }],
        "/bc-assets/bracelet_models/CHARMS2.glb": [{ scale: [20, 20, 20] }],
        "/bc-assets/bracelet_models/CHARMS3.glb": [{ scale: [0.08, 0.08, 0.08] }],
        "/bc-assets/bracelet_models/CHARMS4.glb": [{ scale: [0.07, 0.07, 0.07] }],
        "/bc-assets/bracelet_models/CHARMS5.glb": [{ scale: [0.08, 0.08, 0.08] }],
        "/bc-assets/bracelet_models/CHARMS6.glb": [{ scale: [0.1, 0.1, 0.1] }],
        "/bc-assets/bracelet_models/CHARMS7.glb": [{ scale: [0.08, 0.08, 0.08] }],
        "/bc-assets/bracelet_models/CHARMS8.glb": [{ scale: [0.02, 0.02, 0.02] }],
    },
    "/bc-assets/bracelet_models/BRACELET5.glb": {
        "/bc-assets/bracelet_models/CHARMS1.glb": [
            { position2: [-1.3, 0.4, 1.1], scales: [0.05, 16, 16], position: [-2.55, 0.4, 1.03], rotation: [Math.PI / 2, Math.PI, 2.5], scale: [40, 40, 40] },
            { position2: [-1.6, 0.4, 0.6], scales: [0.05, 16, 16], position: [-2.86, 0.4, 0.52], rotation: [Math.PI / 2, Math.PI, 2.5], scale: [40, 40, 40] },
            { position2: [-1.7, 0.4, 0], scales: [0.05, 16, 16], position: [-2.78, 0.4, -0.7], rotation: [Math.PI / 2, Math.PI, 2], scale: [40, 40, 40] },
            { position2: [-1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [-2.66, 0.4, -1.3], rotation: [Math.PI / 2, Math.PI, 2], scale: [40, 40, 40] },
            { position2: [-1.3, 0.4, -1.14], scales: [0.05, 16, 16], position: [-1.25, 0.4, -2.42], rotation: [Math.PI / 2, Math.PI, 1], scale: [40, 40, 40] },
            { position2: [-0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [-0.78, 0.4, -2.78], rotation: [Math.PI / 2, Math.PI, 1], scale: [40, 40, 40] },
            { position2: [0, 0.4, -1.7], scales: [0.05, 16, 16], position: [0.93, 0.4, -2.59], rotation: [Math.PI / 2, Math.PI, 0.2], scale: [40, 40, 40] },
            { position2: [0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [1.87, 0.4, -2.2], rotation: [Math.PI / 2, Math.PI, 0], scale: [40, 40, 40] },
            { position2: [1.3, 0.4, -1.1], scales: [0.05, 16, 16], position: [2.51, 0.4, -0.84], rotation: [Math.PI / 2, Math.PI, -0.8], scale: [40, 40, 40] },
            { position2: [1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [2.83, 0.4, -0.32], rotation: [Math.PI / 2, Math.PI, -0.8], scale: [40, 40, 40] },
            { position2: [1.7, 0.4, 0], scales: [0.05, 16, 16], position: [2.46, 0.4, 1.04], rotation: [Math.PI / 2, Math.PI, -1.5], scale: [40, 40, 40] },
            { position2: [1.6, 0.4, 0.62], scales: [0.05, 16, 16], position: [1.48, 0.4, 1.91], rotation: [Math.PI / 2, Math.PI, -2.2], scale: [40, 40, 40] },
            { position2: [1.25, 0.4, 1.13], scales: [0.05, 16, 16], position: [0.68, 0.4, 2.28], rotation: [Math.PI / 2, Math.PI, -2.6], scale: [40, 40, 40] },
        ],
        "/bc-assets/bracelet_models/CHARMS2.glb": [
            { position2: [-1.3, 0.4, 1.1], scales: [0.05, 16, 16], position: [-1.65, 0.4, 1.55], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [20, 20, 20] },
            { position2: [-1.6, 0.4, 0.6], scales: [0.05, 16, 16], position: [-1.95, 0.4, 1.05], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [20, 20, 20] },
            { position2: [-1.7, 0.4, 0], scales: [0.05, 16, 16], position: [-2.25, 0.4, 0.13], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [20, 20, 20] },
            { position2: [-1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [-2.14, 0.4, -0.46], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [20, 20, 20] },
            { position2: [-1.3, 0.4, -1.14], scales: [0.05, 16, 16], position: [-1.8, 0.4, -1.33], rotation: [Math.PI / 2, Math.PI, 1.2], scale: [20, 20, 20] },
            { position2: [-0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [-1.2, 0.4, -1.9], rotation: [Math.PI / 2, Math.PI, 0.8], scale: [20, 20, 20] },
            { position2: [0, 0.4, -1.7], scales: [0.05, 16, 16], position: [-0.11, 0.4, -2.24], rotation: [Math.PI / 2, Math.PI, 0.2], scale: [20, 20, 20] },
            { position2: [0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [1.01, 0.4, -2.03], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [20, 20, 20] },
            { position2: [1.3, 0.4, -1.1], scales: [0.05, 16, 16], position: [1.48, 0.4, -1.65], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [20, 20, 20] },
            { position2: [1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [2.06, 0.4, -0.92], rotation: [Math.PI / 2, Math.PI, -1], scale: [20, 20, 20] },
            { position2: [1.7, 0.4, 0], scales: [0.05, 16, 16], position: [2.17, 0.4, -0.305], rotation: [Math.PI / 2, Math.PI, -1], scale: [20, 20, 20] },
            { position2: [1.6, 0.4, 0.62], scales: [0.05, 16, 16], position: [2.13, 0.4, 0.63], rotation: [Math.PI / 2, Math.PI, -1.6], scale: [20, 20, 20] },
            { position2: [1.25, 0.4, 1.13], scales: [0.05, 16, 16], position: [1.78, 0.4, 1.35], rotation: [Math.PI / 2, Math.PI, -2], scale: [20, 20, 20] },
        ],
         "/bc-assets/bracelet_models/CHARMS3.glb": [
            { position2: [-1.3, 0.4, 1.1], scales: [0.05, 16, 16], position: [-1.36, 0.4, 1.22], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.6, 0.4, 0.6], scales: [0.05, 16, 16], position: [-1.68, 0.4, 0.7], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.7, 0.4, 0], scales: [0.05, 16, 16], position: [-1.83, 0.4, 0], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [-1.72, 0.4, -0.6], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.3, 0.4, -1.14], scales: [0.05, 16, 16], position: [-1.37, 0.4, -1.2], rotation: [Math.PI / 2, Math.PI, 1.2], scale: [0.05, 0.05, 0.05] },
            { position2: [-0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [-0.88, 0.4, -1.61], rotation: [Math.PI / 2, Math.PI, 0.8], scale: [0.05, 0.05, 0.05] },
            { position2: [0, 0.4, -1.7], scales: [0.05, 16, 16], position: [-0.0, 0.4, -1.83], rotation: [Math.PI / 2, Math.PI, 0.2], scale: [0.05, 0.05, 0.05] },
            { position2: [0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [0.85, 0.4, -1.62], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.05, 0.05, 0.05] },
            { position2: [1.3, 0.4, -1.1], scales: [0.05, 16, 16], position: [1.33, 0.4, -1.25], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.05, 0.05, 0.05] },
            { position2: [1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [1.7, 0.4, -0.67], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.05, 0.05, 0.05] },
            { position2: [1.7, 0.4, 0], scales: [0.05, 16, 16], position: [1.81, 0.4, -0.07], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.05, 0.05, 0.05] },
            { position2: [1.6, 0.4, 0.62], scales: [0.05, 16, 16], position: [1.71, 0.4, 0.63], rotation: [Math.PI / 2, Math.PI, -1.6], scale: [0.05, 0.05, 0.05] },
            { position2: [1.25, 0.4, 1.13], scales: [0.05, 16, 16], position: [1.38, 0.4, 1.2], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.05, 0.05, 0.05] },
        ],
        "/bc-assets/bracelet_models/CHARMS4.glb": [
            { position2: [-1.3, 0.4, 1.1], scales: [0.05, 16, 16], position: [-1.4, 0.4, 1.26], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.6, 0.4, 0.6], scales: [0.05, 16, 16], position: [-1.72, 0.4, 0.76], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.7, 0.4, 0], scales: [0.05, 16, 16], position: [-1.9, 0.4, 0.05], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [-1.77, 0.4, -0.57], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.3, 0.4, -1.14], scales: [0.05, 16, 16], position: [-1.45, 0.4, -1.2], rotation: [Math.PI / 2, Math.PI, 1.2], scale: [0.05, 0.05, 0.05] },
            { position2: [-0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [-0.93, 0.4, -1.65], rotation: [Math.PI / 2, Math.PI, 0.8], scale: [0.05, 0.05, 0.05] },
            { position2: [0, 0.4, -1.7], scales: [0.05, 16, 16], position: [-0.04, 0.4, -1.89], rotation: [Math.PI / 2, Math.PI, 0.2], scale: [0.05, 0.05, 0.05] },
            { position2: [0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [0.86, 0.4, -1.69], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.05, 0.05, 0.05] },
            { position2: [1.3, 0.4, -1.1], scales: [0.05, 16, 16], position: [1.33, 0.4, -1.32], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.05, 0.05, 0.05] },
            { position2: [1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [1.76, 0.4, -0.72], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.05, 0.05, 0.05] },
            { position2: [1.7, 0.4, 0], scales: [0.05, 16, 16], position: [1.87, 0.4, -0.11], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.05, 0.05, 0.05] },
            { position2: [1.6, 0.4, 0.62], scales: [0.05, 16, 16], position: [1.77, 0.4, 0.63], rotation: [Math.PI / 2, Math.PI, -1.6], scale: [0.05, 0.05, 0.05] },
            { position2: [1.25, 0.4, 1.13], scales: [0.05, 16, 16], position: [1.45, 0.4, 1.21], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.05, 0.05, 0.05] },
        ],
        "/bc-assets/bracelet_models/CHARMS5.glb": [
            { position2: [-1.3, 0.4, 1.1], scales: [0.05, 16, 16], position: [-1.35, 0.37, 1.2], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.6, 0.4, 0.6], scales: [0.05, 16, 16], position: [-1.66, 0.37, 0.72], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.7, 0.4, 0], scales: [0.05, 16, 16], position: [-1.81, 0.37, 0.02], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [-1.7, 0.37, -0.57], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.3, 0.4, -1.14], scales: [0.05, 16, 16], position: [-1.39, 0.37, -1.16], rotation: [Math.PI / 2, Math.PI, 1.2], scale: [0.05, 0.05, 0.05] },
            { position2: [-0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [-0.9, 0.37, -1.57], rotation: [Math.PI / 2, Math.PI, 0.8], scale: [0.05, 0.05, 0.05] },
            { position2: [0, 0.4, -1.7], scales: [0.05, 16, 16], position: [-0.04, 0.37, -1.81], rotation: [Math.PI / 2, Math.PI, 0.2], scale: [0.05, 0.05, 0.05] },
            { position2: [0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [0.82, 0.37, -1.62], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.05, 0.05, 0.05] },
            { position2: [1.3, 0.4, -1.1], scales: [0.05, 16, 16], position: [1.31, 0.37, -1.25], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.05, 0.05, 0.05] },
            { position2: [1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [1.68, 0.37, -0.69], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.05, 0.05, 0.05] },
            { position2: [1.7, 0.4, 0], scales: [0.05, 16, 16], position: [1.8, 0.37, -0.07], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.05, 0.05, 0.05] },
            { position2: [1.6, 0.4, 0.62], scales: [0.05, 16, 16], position: [1.69, 0.37, 0.62], rotation: [Math.PI / 2, Math.PI, -1.6], scale: [0.05, 0.05, 0.05] },
            { position2: [1.25, 0.4, 1.13], scales: [0.05, 16, 16], position: [1.37, 0.37, 1.18], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.05, 0.05, 0.05] },
        ],
        "/bc-assets/bracelet_models/CHARMS6.glb": [
            { position2: [-1.3, 0.4, 1.1], scales: [0.05, 16, 16], position: [-1.34, 0.37, 1.2], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.1, 0.1, 0.1] },
            { position2: [-1.6, 0.4, 0.6], scales: [0.05, 16, 16], position: [-1.64, 0.37, 0.7], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.1, 0.1, 0.1] },
            { position2: [-1.7, 0.4, 0], scales: [0.05, 16, 16], position: [-1.79, 0.37, 0.02], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.1, 0.1, 0.1] },
            { position2: [-1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [-1.69, 0.37, -0.58], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.1, 0.1, 0.1] },
            { position2: [-1.3, 0.4, -1.14], scales: [0.05, 16, 16], position: [-1.36, 0.37, -1.17], rotation: [Math.PI / 2, Math.PI, 1.2], scale: [0.1, 0.1, 0.1] },
            { position2: [-0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [-0.88, 0.37, -1.55], rotation: [Math.PI / 2, Math.PI, 0.8], scale: [0.1, 0.1, 0.1] },
            { position2: [0, 0.4, -1.7], scales: [0.05, 16, 16], position: [-0.04, 0.37, -1.79], rotation: [Math.PI / 2, Math.PI, 0.2], scale: [0.1, 0.1, 0.1] },
            { position2: [0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [0.82, 0.37, -1.6], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.1, 0.1, 0.1] },
            { position2: [1.3, 0.4, -1.1], scales: [0.05, 16, 16], position: [1.3, 0.37, -1.23], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.1, 0.1, 0.1] },
            { position2: [1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [1.65, 0.37, -0.68], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.1, 0.1, 0.1] },
            { position2: [1.7, 0.4, 0], scales: [0.05, 16, 16], position: [1.78, 0.37, -0.07], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.1, 0.1, 0.1] },
            { position2: [1.6, 0.4, 0.62], scales: [0.05, 16, 16], position: [1.68, 0.37, 0.62], rotation: [Math.PI / 2, Math.PI, -1.6], scale: [0.1, 0.1, 0.1] },
            { position2: [1.25, 0.4, 1.13], scales: [0.05, 16, 16], position: [1.36, 0.37, 1.17], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.1, 0.1, 0.1] },
        ],
        "/bc-assets/bracelet_models/CHARMS7.glb": [
            { position2: [-1.3, 0.4, 1.1], scales: [0.05, 16, 16], position: [-1.28, 0.4, 1.16], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.6, 0.4, 0.6], scales: [0.05, 16, 16], position: [-1.6, 0.4, 0.64], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.7, 0.4, 0], scales: [0.05, 16, 16], position: [-1.72, 0.4, 0.0], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [-1.61, 0.4, -0.61], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.3, 0.4, -1.14], scales: [0.05, 16, 16], position: [-1.29, 0.4, -1.14], rotation: [Math.PI / 2, Math.PI, 1.2], scale: [0.05, 0.05, 0.05] },
            { position2: [-0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [-0.82, 0.4, -1.52], rotation: [Math.PI / 2, Math.PI, 0.8], scale: [0.05, 0.05, 0.05] },
            { position2: [0, 0.4, -1.7], scales: [0.05, 16, 16], position: [-0.02, 0.4, -1.72], rotation: [Math.PI / 2, Math.PI, 0.2], scale: [0.05, 0.05, 0.05] },
            { position2: [0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [0.8, 0.4, -1.53], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.05, 0.05, 0.05] },
            { position2: [1.3, 0.4, -1.1], scales: [0.05, 16, 16], position: [1.26, 0.4, -1.16], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.05, 0.05, 0.05] },
            { position2: [1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [1.6, 0.4, -0.63], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.05, 0.05, 0.05] },
            { position2: [1.7, 0.4, 0], scales: [0.05, 16, 16], position: [1.72, 0.4, -0.03], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.05, 0.05, 0.05] },
            { position2: [1.6, 0.4, 0.62], scales: [0.05, 16, 16], position: [1.61, 0.4, 0.62], rotation: [Math.PI / 2, Math.PI, -1.6], scale: [0.05, 0.05, 0.05] },
            { position2: [1.25, 0.4, 1.13], scales: [0.05, 16, 16], position: [1.29, 0.4, 1.13], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.05, 0.05, 0.05] },
        ],
        "/bc-assets/bracelet_models/CHARMS8.glb": [
            { position2: [-1.3, 0.4, 1.1], scales: [0.05, 16, 16], position: [-1.37, 0.06, 1.25], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.015, 0.015, 0.015] },
            { position2: [-1.6, 0.4, 0.6], scales: [0.05, 16, 16], position: [-1.68, 0.06, 0.74], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.015, 0.015, 0.015] },
            { position2: [-1.7, 0.4, 0], scales: [0.05, 16, 16], position: [-1.85, 0.06, 0.03], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.015, 0.015, 0.015] },
            { position2: [-1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [-1.73, 0.06, -0.57], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.015, 0.015, 0.015] },
            { position2: [-1.3, 0.4, -1.14], scales: [0.05, 16, 16], position: [-1.41, 0.06, -1.19], rotation: [Math.PI / 2, Math.PI, 1.2], scale: [0.015, 0.015, 0.015] },
            { position2: [-0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [-0.92, 0.06, -1.61], rotation: [Math.PI / 2, Math.PI, 0.8], scale: [0.015, 0.015, 0.015] },
            { position2: [0, 0.4, -1.7], scales: [0.05, 16, 16], position: [-0.04, 0.06, -1.85], rotation: [Math.PI / 2, Math.PI, 0.2], scale: [0.015, 0.015, 0.015] },
            { position2: [0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [0.84, 0.06, -1.65], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.015, 0.015, 0.015] },
            { position2: [1.3, 0.4, -1.1], scales: [0.05, 16, 16], position: [1.32, 0.06, -1.29], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.015, 0.015, 0.015] },
            { position2: [1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [1.71, 0.06, -0.7], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.015, 0.015, 0.015] },
            { position2: [1.7, 0.4, 0], scales: [0.05, 16, 16], position: [1.83, 0.06, -0.1], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.015, 0.015, 0.015] },
            { position2: [1.6, 0.4, 0.62], scales: [0.05, 16, 16], position: [1.73, 0.06, 0.62], rotation: [Math.PI / 2, Math.PI, -1.6], scale: [0.015, 0.015, 0.015] },
            { position2: [1.25, 0.4, 1.13], scales: [0.05, 16, 16], position: [1.4, 0.06, 1.2], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.015, 0.015, 0.015] },
        ],
    },
    "/bc-assets/bracelet_models/BRACELET6.glb": {
        "/bc-assets/bracelet_models/CHARMS1.glb": [
            { position2: [-1.2, 0.2, -0.48], scales: [0.05, 16, 16], position: [-1.52, 0.2, -1.04], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [20, 20, 20] },
            { position2: [-0.6, 0.2, -1.15], scales: [0.05, 16, 16], position: [-0.6, 0.2, -1.77], rotation: [Math.PI / 2, Math.PI, 1], scale: [20, 20, 20] },
            { position2: [-0, 0.2, -1.29], scales: [0.05, 16, 16], position: [0, 0.2, -1.93], rotation: [Math.PI / 2, Math.PI, 1], scale: [20, 20, 20] },
            { position2: [0.6, 0.2, -1.15], scales: [0.05, 16, 16], position: [1.14, 0.2, -1.49], rotation: [Math.PI / 2, Math.PI, 0], scale: [20, 20, 20] },
            { position2: [1.2, 0.2, -0.47], scales: [0.05, 16, 16], position: [1.85, 0.2, -0.38], rotation: [Math.PI / 2, Math.PI, -0.7], scale: [20, 20, 20] },
            { position2: [1.2, 0.2, 0.48], scales: [0.05, 16, 16], position: [1.58, 0.2, 1], rotation: [Math.PI / 2, Math.PI, -1.5], scale: [20, 20, 20] },
            { position2: [0.7, 0.2, 1.09], scales: [0.05, 16, 16], position: [0.795, 0.2, 1.7], rotation: [Math.PI / 2, Math.PI, -2], scale: [20, 20, 20] },
            { position2: [0, 0.2, 1.28], scales: [0.05, 16, 16], position: [-0.35, 0.2, 1.82], rotation: [Math.PI / 2, Math.PI, -2.7], scale: [20, 20, 20] },
            { position2: [-0.75, 0.2, 1.05], scales: [0.05, 16, 16], position: [-1.23, 0.2, 1.49], rotation: [Math.PI / 2, Math.PI, -3], scale: [20, 20, 20] },
            { position2: [-1.2, 0.2, 0.49], scales: [0.05, 16, 16], position: [-1.85, 0.2, 0.42], rotation: [Math.PI / 2, Math.PI, -3.8], scale: [20, 20, 20] },
        ],
         "/bc-assets/bracelet_models/CHARMS2.glb": [
            { position2: [-1.2, 0.2, -0.48], scales: [0.05, 16, 16], position: [-1.78, 0.2, -0.5], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [20, 20, 20] },
            { position2: [-0.6, 0.2, -1.15], scales: [0.05, 16, 16], position: [-0.88, 0.2, -1.63], rotation: [Math.PI / 2, Math.PI, 0.5], scale: [20, 20, 20] },
            { position2: [-0, 0.2, -1.29], scales: [0.05, 16, 16], position: [-0, 0.2, -1.85], rotation: [Math.PI / 2, Math.PI, 0], scale: [20, 20, 20] },
            { position2: [0.6, 0.2, -1.15], scales: [0.05, 16, 16], position: [0.88, 0.2, -1.64], rotation: [Math.PI / 2, Math.PI, -0.5], scale: [20, 20, 20] },
            { position2: [1.2, 0.2, -0.47], scales: [0.05, 16, 16], position: [1.69, 0.2, -0.77], rotation: [Math.PI / 2, Math.PI, -1], scale: [20, 20, 20] },
            { position2: [1.2, 0.2, 0.48], scales: [0.05, 16, 16], position: [1.77, 0.2, 0.44], rotation: [Math.PI / 2, Math.PI, -1.5], scale: [20, 20, 20] },
            { position2: [0.7, 0.2, 1.09], scales: [0.05, 16, 16], position: [1.23, 0.2, 1.31], rotation: [Math.PI / 2, Math.PI, -2], scale: [20, 20, 20] },
            { position2: [0, 0.2, 1.28], scales: [0.05, 16, 16], position: [0.35, 0.2, 1.74], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [20, 20, 20] },
            { position2: [-0.75, 0.2, 1.05], scales: [0.05, 16, 16], position: [-0.66, 0.2, 1.62], rotation: [Math.PI / 2, Math.PI, -3], scale: [20, 20, 20] },
            { position2: [-1.2, 0.2, 0.49], scales: [0.05, 16, 16], position:  [-1.64, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -4], scale: [20, 20, 20] },
        ],
    },
};

export const NECKLACE_METALS = {
  WG: { code: "WG", alt: "White Gold",  hex: "#C8C8C8", color: "#F1F1EF", roughness: 0.06, metalness: 0.95 },
  YG: { code: "YG", alt: "Yellow Gold", hex: "#ECC875", color: "#FFD280", roughness: 0.14, metalness: 0.92 },
  RG: { code: "RG", alt: "Rose Gold",   hex: "#FFBAA3", color: "#E6B08F", roughness: 0.14, metalness: 0.92 },
  PL: { code: "PL", alt: "Platinum",    hex: "#A8A8A6", color: "#E5E4E2", roughness: 0.22, metalness: 0.88 },
  SL: { code: "SL", alt: "Silver 925",  hex: "#C0C0C0", color: "#DADADA", roughness: 0.08, metalness: 0.93 },
};

export const BRACELET_METALS = {
  WG: { code: "WG", alt: "White Gold",  hex: "#DBDBDB", color: "#D8D8D8", price: 100 },
  YG: { code: "YG", alt: "Yellow Gold", hex: "#FFD280", color: "#FFDFA5", price: 100 },
  RG: { code: "RG", alt: "Rose Gold",   hex: "#FFBAA3", color: "#FFC9B0", price: 100 },
  PL: { code: "PL", alt: "Platinum",    hex: "#e5e4e2", color: "#D8D8D8", price: 200 },
  SL: { code: "SL", alt: "Silver 925",  hex: "#B8B8B8", color: "#CFCFCF", price: 100 },
};

export const getMetalCode = (hexOrCode) => {
  if (!hexOrCode) return "YG";
  const str = String(hexOrCode).trim().toUpperCase();
  if (NECKLACE_METALS[str] || BRACELET_METALS[str]) return str;
  const h = String(hexOrCode).trim().toLowerCase();
  if (h === "#ecc875" || h === "#ffd280" || h === "#e4c088") return "YG";
  if (h === "#ffbaa3" || h === "#ebb39c" || h === "#e6b08f" || h === "#f0a47b") return "RG";
  if (h === "#a8a8a6" || h === "#e5e4e2" || h === "#e2e4e8") return "PL";
  if (h === "#c0c0c0" || h === "#b8b8b8") return "SL";
  if (h === "#c8c8c8" || h === "#dbdbdb" || h === "#f1f1ef" || h === "#d8d8d8") return "WG";
  return "YG";
};

export const getMappedMetal = (hexOrCode, targetType) => {
  const code = getMetalCode(hexOrCode);
  const type = targetType === "bracelet" ? "bracelet" : "necklace";
  const dict = type === "bracelet" ? BRACELET_METALS : NECKLACE_METALS;
  return dict[code] || dict.YG;
};

export const isCommonCharm = (charm) => {
  if (!charm) return false;
  return charm.type === "birthstone" || charm.type === "diamond" || charm.type === "initial";
};
