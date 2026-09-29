/**
 * productIds.js
 *
 * Central registry of product IDs for the ring configurator.
 * Every selectable option (head style, shank/band style, matching band
 * style, diamond shape) gets a stable, human-readable ID here so the
 * rest of the app can reference products by ID instead of by raw label.
 *
 * Keys are camelCase; `rawLabel` on each entry holds the exact string
 * used elsewhere in the codebase (headStyles / shankStyles /
 * matchingBandStyles / diamondShapes arrays), so IDs can still be
 * looked up against the app's real option values.
 *
 * ID prefixes:
 *   H  = Head             (H001, H002, ...)
 *   S  = Shank/Band       (S001, S002, ...)
 *   B  = Matching Band    (B001, B002, ...)
 *   SH = Shape            (SH01, SH02, ...)
 *   CD = Colored Diamond  (CD01, CD02, ...)
 *   GS = Gemstone         (GS01, GS02, ...)
 *
 * Source of truth for the option names: data/api-data.json (ring.head,
 * ring.shank, diamond.shape), priceConfig.js (headStyles, shankStyles,
 * matchingBandStyles) and utility/storeCustomization.js (diamondShapes).
 */

// ---- Heads -----------------------------------------------------------
export const HEAD_IDS = {
  noHead: { id: "H000", rawLabel: "NO-HEAD" },
  "4Prong": { id: "H001", rawLabel: "4-PRONG" },
  "6Prong": { id: "H002", rawLabel: "6-PRONG" },
  hiddenHalo: { id: "H003", rawLabel: "HIDDEN-HALO" },
  singleHalo: { id: "H004", rawLabel: "HALO" },
  doubleHalo: { id: "H005", rawLabel: "DOUBLE-HALO" },
  bezel: { id: "H006", rawLabel: "BEZEL" },
  // The API may call this product "Single Halo" (H004) or "Halo" (H007).
  // Both normalize to this one canonical head and its H007 compatibility rule.
  halo: { id: "H007", rawLabel: "HALO" },
  // The API label is "Oval", but this is the Three Stone head (H008), not
  // the oval diamond shape.
  threeStone: { id: "H008", rawLabel: "OVAL" },
  tulip: { id: "H009", rawLabel: "TULIP" },
  twoStone: { id: "H010", rawLabel: "TWO-STONE" },
  // DiamondWise designs are fixed head+shank sets (5 total, complete rings,
  // not mixable — see data/diamondwiseDesigns.js). Each one gets a single
  // product ID here, on its head; there is no separate ID for its shank.
  amelie: { id: "H011", rawLabel: "dw-jul-ma-02-head" },
  elan: { id: "H012", rawLabel: "dw-ju-m-0031-head" },
  elanora: { id: "H013", rawLabel: "dw-mar-ma-019-head" },
  aurelie: { id: "H014", rawLabel: "dw-LR1046-head" },
  isadora: { id: "H015", rawLabel: "dw-JAN027-head" },
  trapezoid: { id: "H016", rawLabel: "TRAPEZOID" },
  halfMoon: { id: "H017", rawLabel: "HALF-MOON" },
  pearHead: { id: "H018", rawLabel: "PEAR" },
  baguette: { id: "H019", rawLabel: "BAGUETTE" },
};

// ---- Shanks / Bands ----------------------------------------------------
export const SHANK_IDS = {
  plain: { id: "S001", rawLabel: "PLAIN" },
  plateProng: { id: "S002", rawLabel: "PLATE-PRONG" },
  knifeEdge: { id: "S003", rawLabel: "KNIFE-EDGE" },
  channel: { id: "S004", rawLabel: "CHANNEL" },
  cathedral: { id: "S005", rawLabel: "CATHEDRAL" },
  split: { id: "S006", rawLabel: "SPLIT" },
  twisted: { id: "S007", rawLabel: "TWISTED" },
  widePlain: { id: "S008", rawLabel: "WIDE-PLAIN" },
  frenchPave: { id: "S009", rawLabel: "FRENCH-PAVE" },
  paveStones: { id: "S010", rawLabel: "PAVE-STONES" },
  "8Stones": { id: "S011", rawLabel: "8-STONES" },
  multiRow: { id: "S012", rawLabel: "MULTI-ROW" },
  cathedralSideStone: { id: "S013", rawLabel: "CATHEDRAL-SIDE-STONE" },
  sideBezelStones: { id: "S014", rawLabel: "SIDE-BEZEL-STONES" },
  twisted2: { id: "S015", rawLabel: "TWISTED-2" },
  fluted: { id: "S016", rawLabel: "FLUTED" },
  braided: { id: "S017", rawLabel: "BRAIDED" },
  // DiamondWise shanks — same 5 fixed designs as HEAD_IDS above, named the
  // same way (their shank always comes paired with their own head).
  amelie: { id: "S018", rawLabel: "dw-jul-ma-02-shank" },
  elan: { id: "S019", rawLabel: "dw-ju-m-0031-shank" },
  elanora: { id: "S020", rawLabel: "dw-mar-ma-019-shank" },
  aurelie: { id: "S021", rawLabel: "dw-LR1046-shank" },
  isadora: { id: "S022", rawLabel: "dw-JAN027-shank" },
};

// ---- Matching Bands ----------------------------------------------------
export const MATCHING_BAND_IDS = {
  plain: { id: "B001", rawLabel: "PLAIN" },
  cathedral: { id: "B002", rawLabel: "CATHEDRAL" },
  knifeEdge: { id: "B003", rawLabel: "KNIFE-EDGE" },
  split: { id: "B004", rawLabel: "SPLIT" },
  channel: { id: "B005", rawLabel: "CHANNEL" },
  plateProng: { id: "B006", rawLabel: "PLATE-PRONG" },
};

// ---- Diamond Shapes ----------------------------------------------------
export const SHAPE_IDS = {
  round: { id: "SH01", rawLabel: "round" },
  princess: { id: "SH02", rawLabel: "princess" },
  cushion: { id: "SH03", rawLabel: "cushion" },
  oval: { id: "SH04", rawLabel: "oval" },
  radiant: { id: "SH05", rawLabel: "radiant" },
  pear: { id: "SH06", rawLabel: "pear" },
  emerald: { id: "SH07", rawLabel: "emerald" },
  marquise: { id: "SH08", rawLabel: "marquise" },
  heart: { id: "SH09", rawLabel: "heart" },
  asscher: { id: "SH10", rawLabel: "asscher" },
  moval: { id: "SH11", rawLabel: "moval" },
};

// ---- Colored Diamonds --------------------------------------------------
export const COLORED_DIAMOND_IDS = {
  yellow: { id: "CD01", rawLabel: "Yellow" },
  blue: { id: "CD02", rawLabel: "Blue" },
  red: { id: "CD03", rawLabel: "Red" },
  green: { id: "CD04", rawLabel: "Green" },
  orange: { id: "CD05", rawLabel: "Orange" },
  pink: { id: "CD06", rawLabel: "Pink" },
  brown: { id: "CD07", rawLabel: "Brown" },
  purple: { id: "CD08", rawLabel: "Purple" },
  black: { id: "CD09", rawLabel: "Black" },
  peach: { id: "CD10", rawLabel: "Peach" },
};

// ---- Gemstones ---------------------------------------------------------
export const GEMSTONE_IDS = {
  blueSapphire: { id: "GS01", rawLabel: "blue-sapphire" },
  greenEmerald: { id: "GS02", rawLabel: "green-emerald" },
  greenSapphire: { id: "GS03", rawLabel: "green-sapphire" },
  moissanite: { id: "GS04", rawLabel: "moissanite" },
  pinkSapphire: { id: "GS05", rawLabel: "pink-sapphire" },
  redRuby: { id: "GS06", rawLabel: "red-ruby" },
  yellowSapphire: { id: "GS07", rawLabel: "yellow-sapphire" },
};

// ---- Grouped export ------------------------------------------------------
export const PRODUCT_IDS = {
  head: HEAD_IDS,
  shank: SHANK_IDS,
  matchingBand: MATCHING_BAND_IDS,
  shape: SHAPE_IDS,
  coloredDiamond: COLORED_DIAMOND_IDS,
  colored_diamond: COLORED_DIAMOND_IDS,
  gemstone: GEMSTONE_IDS,
};

// ---- Reverse lookups (id -> entry) ----------------------------------------
const invertById = (map) =>
  Object.fromEntries(Object.entries(map).map(([key, entry]) => [entry.id, { key, ...entry }]));

export const HEAD_BY_ID = invertById(HEAD_IDS);
export const SHANK_BY_ID = invertById(SHANK_IDS);
export const MATCHING_BAND_BY_ID = invertById(MATCHING_BAND_IDS);
export const SHAPE_BY_ID = invertById(SHAPE_IDS);
export const COLORED_DIAMOND_BY_ID = invertById(COLORED_DIAMOND_IDS);
export const GEMSTONE_BY_ID = invertById(GEMSTONE_IDS);

// ---- Reverse lookups (rawLabel -> camelCase key) ---------------------------
const invertByRawLabel = (map) =>
  Object.fromEntries(Object.entries(map).map(([key, entry]) => [entry.rawLabel, key]));

export const HEAD_KEY_BY_RAW_LABEL = invertByRawLabel(HEAD_IDS);
export const SHANK_KEY_BY_RAW_LABEL = invertByRawLabel(SHANK_IDS);
export const MATCHING_BAND_KEY_BY_RAW_LABEL = invertByRawLabel(MATCHING_BAND_IDS);
export const SHAPE_KEY_BY_RAW_LABEL = invertByRawLabel(SHAPE_IDS);
export const COLORED_DIAMOND_KEY_BY_RAW_LABEL = invertByRawLabel(COLORED_DIAMOND_IDS);
export const GEMSTONE_KEY_BY_RAW_LABEL = invertByRawLabel(GEMSTONE_IDS);

// ---- Helpers --------------------------------------------------------------
/**
 * Get a product ID by category + camelCase key.
 * @param {"head"|"shank"|"matchingBand"|"shape"|"coloredDiamond"|"gemstone"} category
 * @param {string} key - camelCase key, e.g. "hiddenHalo"
 * @returns {string|undefined}
 */
export function getProductId(category, key) {
  return PRODUCT_IDS[category]?.[key]?.id;
}

const HEAD_RAW_LABEL_ALIASES = {
  "HALF-MOON": "H008",
  "TRAPEZOID": "H008",
  "PEAR": "H008",
  "BAGUETTE": "H008",
  "three-stone": "H008",
  "THREE-STONE": "H008",
  "Three Stone": "H008",
  "THREE STONE": "H008",
  "OVAL": "H008",
  "SINGLE-HALO": "H007",
  "Single Halo": "H007",
  "SINGLE HALO": "H007",
  "single-halo": "H007",
  "HALO": "H007",
  "Halo": "H007",
  "halo": "H007",
  "H004": "H007",
  "H007": "H007",
};

const SHANK_RAW_LABEL_ALIASES = {
  PAVE: "S002",
  "PLATE PRONG": "S002",
};

const MATCHING_BAND_RAW_LABEL_ALIASES = {
  PAVE: "B006",
  "PLATE PRONG": "B006",
};

/**
 * Get a product ID by category + the raw label used elsewhere in the app
 * (e.g. "HIDDEN-HALO" instead of "hiddenHalo").
 * @param {"head"|"shank"|"matchingBand"|"shape"|"coloredDiamond"|"gemstone"} category
 * @param {string} rawLabel
 * @returns {string|undefined}
 */
export function getProductIdByRawLabel(category, rawLabel) {
  if (!rawLabel) return undefined;
  if (category === "head") {
    if (HEAD_RAW_LABEL_ALIASES[rawLabel]) return HEAD_RAW_LABEL_ALIASES[rawLabel];
    const upper = String(rawLabel).toUpperCase();
    if (HEAD_RAW_LABEL_ALIASES[upper]) return HEAD_RAW_LABEL_ALIASES[upper];
    if (HEAD_BY_ID[rawLabel]) return rawLabel;
  }
  if (category === "shank") {
    if (SHANK_RAW_LABEL_ALIASES[rawLabel]) return SHANK_RAW_LABEL_ALIASES[rawLabel];
    const upper = String(rawLabel).toUpperCase();
    if (SHANK_RAW_LABEL_ALIASES[upper]) return SHANK_RAW_LABEL_ALIASES[upper];
    if (SHANK_BY_ID[rawLabel]) return rawLabel;
  }
  if (category === "matchingBand") {
    if (MATCHING_BAND_RAW_LABEL_ALIASES[rawLabel]) return MATCHING_BAND_RAW_LABEL_ALIASES[rawLabel];
    const upper = String(rawLabel).toUpperCase();
    if (MATCHING_BAND_RAW_LABEL_ALIASES[upper]) return MATCHING_BAND_RAW_LABEL_ALIASES[upper];
    if (MATCHING_BAND_BY_ID[rawLabel]) return rawLabel;
  }
  if (category === "coloredDiamond" || category === "colored_diamond") {
    if (COLORED_DIAMOND_BY_ID[rawLabel]) return rawLabel;
    const match = Object.values(COLORED_DIAMOND_IDS).find(
      (entry) => entry.rawLabel.toLowerCase() === String(rawLabel).toLowerCase()
    );
    if (match) return match.id;
  }
  if (category === "gemstone") {
    if (GEMSTONE_BY_ID[rawLabel]) return rawLabel;
    const match = Object.values(GEMSTONE_IDS).find(
      (entry) => entry.rawLabel.toLowerCase() === String(rawLabel).toLowerCase()
    );
    if (match) return match.id;
  }
  const map = PRODUCT_IDS[category];
  if (!map) return undefined;
  for (const key in map) {
    if (map[key].rawLabel === rawLabel) return map[key].id;
  }
  return undefined;
}

/**
 * Get the full entry ({ key, id, rawLabel }) back from a product ID
 * (e.g. "H003" -> { key: "hiddenHalo", id: "H003", rawLabel: "HIDDEN-HALO" }).
 * @param {string} id
 * @returns {{key: string, id: string, rawLabel: string}|undefined}
 */
export function getProductById(id) {
  if (!id) return undefined;
  if (id.startsWith("CD")) return COLORED_DIAMOND_BY_ID[id];
  if (id.startsWith("GS")) return GEMSTONE_BY_ID[id];
  if (id.startsWith("SH")) return SHAPE_BY_ID[id];
  const prefix = id[0];
  if (prefix === "H") return HEAD_BY_ID[id];
  if (prefix === "S") return SHANK_BY_ID[id];
  if (prefix === "B") return MATCHING_BAND_BY_ID[id];
  return undefined;
}

export default PRODUCT_IDS;
