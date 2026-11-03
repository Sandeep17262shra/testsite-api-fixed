/**
 * braceletProductIds.js
 *
 * Central registry of product IDs for the Bracelet configurator.
 * Contains product IDs for:
 *   - 4 generated name chain styles (BC01 - BC04)
 *   - 14 metal + purity options (M001 - M014)
 *   - Name bracelet option with 3 connected script fonts (BNF1 - BNF3)
 *   - Charms:
 *       • 10 birthstones (BBS01 - BBS10)
 *       • 5 diamond charms (BDC1 - BDC5)
 *       • Unified Initial & Charms Unit (Initial BIC1, 2D B2D*, 3D B3D*)
 *
 * ID prefixes:
 *   BC  = Bracelet Chain          (BC01, BC02, ...)
 *   M   = Metal + Purity          (M001, M002, ... M014)
 *   BNF = Name Bracelet Font      (BNF1, BNF2, ...)
 *   BBS = Bracelet Birthstone     (BBS01, BBS02, ...)
 *   BDC = Bracelet Diamond Charm  (BDC1, BDC2, ...)
 *   BIC = Bracelet Initial Charm  (BIC1)
 *   B2D = Bracelet 2D Charm       (B2D01, B2D02, ...)
 *   B3D = Bracelet 3D Charm       (B3D01, B3D02, ...)
 */

// ── Chain Styles (4 generated name chains) ────────────────────────────────────
export const BRACELET_CHAIN_IDS = {
  round:  { id: "BC01", rawLabel: "Round",  path: "generated://name-chain-round"  },
  cable:  { id: "BC02", rawLabel: "Cable",  path: "generated://name-chain"        },
  oval:   { id: "BC03", rawLabel: "Oval",   path: "generated://name-chain-oval"   },
  square: { id: "BC04", rawLabel: "Square", path: "generated://name-chain-square" },
};

// ── Metals (M001 - M014) ─────────────────────────────────────────────────────
export const BRACELET_METAL_IDS = {
  whiteGold9K:   { id: "M001", rawLabel: "White Gold 9K",   metal: "White Gold",  purity: "9K",  hex: "#DBDBDB" },
  yellowGold9K:  { id: "M002", rawLabel: "Yellow Gold 9K",  metal: "Yellow Gold", purity: "9K",  hex: "#FFD280" },
  roseGold9K:    { id: "M003", rawLabel: "Rose Gold 9K",    metal: "Rose Gold",   purity: "9K",  hex: "#FFBAA3" },
  whiteGold10K:  { id: "M004", rawLabel: "White Gold 10K",  metal: "White Gold",  purity: "10K", hex: "#DBDBDB" },
  yellowGold10K: { id: "M005", rawLabel: "Yellow Gold 10K", metal: "Yellow Gold", purity: "10K", hex: "#FFD280" },
  roseGold10K:   { id: "M006", rawLabel: "Rose Gold 10K",   metal: "Rose Gold",   purity: "10K", hex: "#FFBAA3" },
  whiteGold14K:  { id: "M007", rawLabel: "White Gold 14K",  metal: "White Gold",  purity: "14K", hex: "#DBDBDB" },
  yellowGold14K: { id: "M008", rawLabel: "Yellow Gold 14K", metal: "Yellow Gold", purity: "14K", hex: "#FFD280" },
  roseGold14K:   { id: "M009", rawLabel: "Rose Gold 14K",   metal: "Rose Gold",   purity: "14K", hex: "#FFBAA3" },
  whiteGold18K:  { id: "M010", rawLabel: "White Gold 18K",  metal: "White Gold",  purity: "18K", hex: "#DBDBDB" },
  yellowGold18K: { id: "M011", rawLabel: "Yellow Gold 18K", metal: "Yellow Gold", purity: "18K", hex: "#FFD280" },
  roseGold18K:   { id: "M012", rawLabel: "Rose Gold 18K",   metal: "Rose Gold",   purity: "18K", hex: "#FFBAA3" },
  platinum:      { id: "M013", rawLabel: "Platinum",        metal: "Platinum",    purity: null,  hex: "#e5e4e2" },
  silver925:     { id: "M014", rawLabel: "Silver 925",      metal: "Silver 925",  purity: null,  hex: "#B8B8B8" },
};

// ── Name Bracelet Fonts (3 fonts) ─────────────────────────────────────────────
export const NAME_BRACELET_FONT_IDS = {
  dancing:    { id: "BNF1", rawLabel: "Dancing",    sample: "R", connected: true,
                url: "/fonts/Dancing Script_Bold.json",     letterSpacingEm: -0.14 },
  kingsman:   { id: "BNF2", rawLabel: "Kingsman",   sample: "K", connected: true,
                url: "/fonts/Kingsman Demo_Regular.json",   letterSpacingEm: -0.091 },
  yellowtail: { id: "BNF3", rawLabel: "Yellowtail", sample: "Y", connected: true,
                url: "/fonts/Yellowtail_Regular.json",      letterSpacingEm: -0.091 },
};

// ── Birthstones (10 birthstones) ─────────────────────────────────────────────
export const BRACELET_BIRTHSTONE_IDS = {
  garnet:      { id: "BBS01", rawLabel: "Garnet (Jan)",      hex: "#C8102E", month: 1  },
  amethyst:    { id: "BBS02", rawLabel: "Amethyst (Feb)",    hex: "#6D3BB5", month: 2  },
  aquamarine:  { id: "BBS03", rawLabel: "Aquamarine (Mar)",  hex: "#8EC7DF", month: 3  },
  emerald:     { id: "BBS04", rawLabel: "Emerald (May)",     hex: "#009B77", month: 5  },
  ruby:        { id: "BBS05", rawLabel: "Ruby (Jul)",        hex: "#9B111E", month: 7  },
  peridot:     { id: "BBS06", rawLabel: "Peridot (Aug)",     hex: "#AFCB2B", month: 8  },
  sapphire:    { id: "BBS07", rawLabel: "Sapphire (Sep)",    hex: "#0F52BA", month: 9  },
  tourmaline:  { id: "BBS10", rawLabel: "Tourmaline (Oct)",  hex: "#F0839C", month: 10 },
  topaz:       { id: "BBS11", rawLabel: "Topaz (Nov)",       hex: "#D9B83D", month: 11 },
  turquoise:   { id: "BBS12", rawLabel: "Turquoise (Dec)",   hex: "#4AA7BA", month: 12 },
  // Compatibility fallbacks for April / June if selected
  diamond:     { id: "BBS08", rawLabel: "Diamond (Apr)",     hex: "#F4F8FF", month: 4  },
  alexandrite: { id: "BBS09", rawLabel: "Alexandrite (Jun)", hex: "#C978A9", month: 6  },
};

export const BRACELET_BIRTHSTONE_DISPLAY_ORDER = [
  "garnet", "amethyst", "aquamarine", "emerald",
  "ruby", "peridot", "sapphire", "tourmaline", "topaz", "turquoise",
];

// ── Diamond Charms (5 diamond cuts) ──────────────────────────────────────────
export const BRACELET_DIAMOND_CHARM_IDS = {
  round:    { id: "BDC1", rawLabel: "Round Diamond",    path: "/bc-assets/gemstone/D1.glb",        preview: "/bc-assets/images/diamonds/round.webp"    },
  pear:     { id: "BDC2", rawLabel: "Pear Diamond",     path: "/bc-assets/gemstone/D2.glb",        preview: "/bc-assets/images/diamonds/pear.webp"     },
  oval:     { id: "BDC3", rawLabel: "Oval Diamond",     path: "/bc-assets/gemstone/D3.glb",        preview: "/bc-assets/images/diamonds/oval.webp"     },
  princess: { id: "BDC4", rawLabel: "Princess Diamond", path: "/bc-assets/gemstone/princess.glb", preview: "/bc-assets/images/diamonds/princess.webp" },
  cushion:  { id: "BDC5", rawLabel: "Cushion Diamond",  path: "/bc-assets/gemstone/cushion.glb",  preview: "/bc-assets/images/diamonds/cushion.webp"  },
};

// ── Initial & Charms unit (Unified unit for Bracelets) ─────────────────────────
export const BRACELET_INITIAL_CHARM_ID = {
  initial: { id: "BIC1", rawLabel: "Initial Charm" },
};

export const BRACELET_2D_CHARM_IDS = {
  butterfly: { id: "B2D01", rawLabel: "Butterfly", imageCharmNumber: 9  },
  cat:       { id: "B2D02", rawLabel: "Cat",        imageCharmNumber: 10 },
  dog:       { id: "B2D03", rawLabel: "Dog",        imageCharmNumber: 11 },
  paw:       { id: "B2D04", rawLabel: "Paw",        imageCharmNumber: 12 },
  cherry:    { id: "B2D05", rawLabel: "Cherry",     imageCharmNumber: 13 },
  cluster:   { id: "B2D06", rawLabel: "Cluster",    imageCharmNumber: 14 },
  flower:    { id: "B2D07", rawLabel: "Flower",     imageCharmNumber: 15 },
  leaf:      { id: "B2D08", rawLabel: "Leaf",       imageCharmNumber: 16 },
  letterA:   { id: "B2D09", rawLabel: "A",          imageCharmNumber: 17 },
  letterB:   { id: "B2D10", rawLabel: "B",          imageCharmNumber: 18 },
  letterC:   { id: "B2D11", rawLabel: "C",          imageCharmNumber: 19 },
  letterD:   { id: "B2D12", rawLabel: "D",          imageCharmNumber: 20 },
  gemini:    { id: "B2D13", rawLabel: "Gemini",     imageCharmNumber: 21 },
  leo:       { id: "B2D14", rawLabel: "Leo",        imageCharmNumber: 22 },
  taurus:    { id: "B2D15", rawLabel: "Taurus",     imageCharmNumber: 23 },
};

export const BRACELET_3D_CHARM_IDS = {
  classicButterfly: { id: "B3D01", rawLabel: "Classic Butterfly", path: "/bc-assets/bracelet_models/CHARMS1.glb" },
  elegantFloral:    { id: "B3D02", rawLabel: "Elegant Floral",    path: "/bc-assets/bracelet_models/CHARMS2.glb" },
  starfish:         { id: "B3D03", rawLabel: "Starfish",          path: "/bc-assets/bracelet_models/CHARMS3.glb" },
  modernStar:       { id: "B3D04", rawLabel: "Modern Star",       path: "/bc-assets/bracelet_models/CHARMS4.glb" },
  sphereLocket:     { id: "B3D05", rawLabel: "Evil Eye",     path: "/bc-assets/bracelet_models/CHARMS5.glb" },
  silkenTassel:     { id: "B3D06", rawLabel: "Silken Tassel",     path: "/bc-assets/bracelet_models/CHARMS6.glb" },
  classicHeart:     { id: "B3D07", rawLabel: "Classic Heart",     path: "/bc-assets/bracelet_models/CHARMS7.glb" },
  gladiatorHelmet:  { id: "B3D08", rawLabel: "Gladiator Helmet",  path: "/bc-assets/bracelet_models/CHARMS8.glb" },
};

export const BRACELET_CHARMS_UNIT = {
  initial: BRACELET_INITIAL_CHARM_ID,
  charm2d: BRACELET_2D_CHARM_IDS,
  charm3d: BRACELET_3D_CHARM_IDS,
};

// ── Grouped export ────────────────────────────────────────────────────────────
export const BRACELET_PRODUCT_IDS = {
  chain:           BRACELET_CHAIN_IDS,
  metal:           BRACELET_METAL_IDS,
  nameBraceletFont: NAME_BRACELET_FONT_IDS,
  birthstone:      BRACELET_BIRTHSTONE_IDS,
  diamondCharm:    BRACELET_DIAMOND_CHARM_IDS,
  charmsUnit:      BRACELET_CHARMS_UNIT,
  initialCharm:    BRACELET_INITIAL_CHARM_ID,
  charm2d:         BRACELET_2D_CHARM_IDS,
  charm3d:         BRACELET_3D_CHARM_IDS,
};

// ── Reverse lookups (id → entry) ──────────────────────────────────────────────
const invertById = (map) =>
  Object.fromEntries(Object.entries(map).map(([key, entry]) => [entry.id, { key, ...entry }]));

export const BRACELET_CHAIN_BY_ID          = invertById(BRACELET_CHAIN_IDS);
export const BRACELET_METAL_BY_ID          = invertById(BRACELET_METAL_IDS);
export const NAME_BRACELET_FONT_BY_ID      = invertById(NAME_BRACELET_FONT_IDS);
export const BRACELET_BIRTHSTONE_BY_ID     = invertById(BRACELET_BIRTHSTONE_IDS);
export const BRACELET_DIAMOND_CHARM_BY_ID  = invertById(BRACELET_DIAMOND_CHARM_IDS);
export const BRACELET_INITIAL_CHARM_BY_ID  = invertById(BRACELET_INITIAL_CHARM_ID);
export const BRACELET_2D_CHARM_BY_ID       = invertById(BRACELET_2D_CHARM_IDS);
export const BRACELET_3D_CHARM_BY_ID       = invertById(BRACELET_3D_CHARM_IDS);

// ── Reverse lookups (rawLabel → camelCase key) ────────────────────────────────
const invertByRawLabel = (map) =>
  Object.fromEntries(Object.entries(map).map(([key, entry]) => [entry.rawLabel, key]));

export const BRACELET_CHAIN_KEY_BY_RAW_LABEL          = invertByRawLabel(BRACELET_CHAIN_IDS);
export const BRACELET_METAL_KEY_BY_RAW_LABEL          = invertByRawLabel(BRACELET_METAL_IDS);
export const NAME_BRACELET_FONT_KEY_BY_RAW_LABEL      = invertByRawLabel(NAME_BRACELET_FONT_IDS);
export const BRACELET_BIRTHSTONE_KEY_BY_RAW_LABEL     = invertByRawLabel(BRACELET_BIRTHSTONE_IDS);
export const BRACELET_DIAMOND_CHARM_KEY_BY_RAW_LABEL  = invertByRawLabel(BRACELET_DIAMOND_CHARM_IDS);
export const BRACELET_2D_CHARM_KEY_BY_RAW_LABEL       = invertByRawLabel(BRACELET_2D_CHARM_IDS);
export const BRACELET_3D_CHARM_KEY_BY_RAW_LABEL       = invertByRawLabel(BRACELET_3D_CHARM_IDS);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Look up a bracelet product ID by category + camelCase key.
 *
 * @param {"chain"|"metal"|"nameBraceletFont"|"birthstone"|"diamondCharm"|"initialCharm"|"charm2d"|"charm3d"} category
 * @param {string} key  camelCase key, e.g. "yellowGold14K" or "round"
 * @returns {string|undefined}
 */
export function getBraceletProductId(category, key) {
  return BRACELET_PRODUCT_IDS[category]?.[key]?.id;
}

/**
 * Look up a bracelet product ID by category + rawLabel.
 *
 * @param {"chain"|"metal"|"nameBraceletFont"|"birthstone"|"diamondCharm"|"initialCharm"|"charm2d"|"charm3d"} category
 * @param {string} rawLabel
 * @returns {string|undefined}
 */
export function getBraceletProductIdByRawLabel(category, rawLabel) {
  if (!rawLabel) return undefined;
  const map = BRACELET_PRODUCT_IDS[category];
  if (!map) return undefined;
  for (const key in map) {
    if (map[key].rawLabel === rawLabel) return map[key].id;
  }
  return undefined;
}

/**
 * Resolve a metal product ID (M001 - M014) from metal type/hex and purity.
 *
 * @param {string} metalOrHex  e.g. "Yellow Gold", "#FFD280", "YG"
 * @param {string} [purity]    e.g. "9K", "10K", "14K", "18K" (defaults to "9K" for gold)
 * @returns {string|undefined}  Product ID, e.g. "M008"
 */
export function getBraceletMetalId(metalOrHex, purity = "9K") {
  if (!metalOrHex) return undefined;
  const str = String(metalOrHex).toLowerCase();

  // Direct ID check
  if (BRACELET_METAL_BY_ID[metalOrHex.toUpperCase()]) {
    return metalOrHex.toUpperCase();
  }

  // Platinum (M013)
  if (str === "#e5e4e2" || str === "#a8a8a6" || str.includes("plat") || str === "pl") {
    return "M013";
  }

  // Silver 925 (M014)
  if (str === "#b8b8b8" || str === "#c0c0c0" || str.includes("silv") || str === "sl") {
    return "M014";
  }

  // Determine gold family
  let goldFamily = "Yellow Gold";
  if (str === "#dbdbdb" || str === "#c8c8c8" || str.includes("white") || str === "wg") {
    goldFamily = "White Gold";
  } else if (str === "#ffbaa3" || str.includes("rose") || str === "rg") {
    goldFamily = "Rose Gold";
  } else if (str === "#ffd280" || str === "#ecc875" || str.includes("yellow") || str === "yg") {
    goldFamily = "Yellow Gold";
  }

  const normalizedPurity = String(purity || "9K").toUpperCase();
  const entry = Object.values(BRACELET_METAL_IDS).find(
    (m) => m.metal === goldFamily && m.purity === normalizedPurity
  );

  return entry?.id || (goldFamily === "White Gold" ? "M001" : goldFamily === "Yellow Gold" ? "M002" : "M003");
}

/**
 * Resolve a chain's camelCase key from its generated path identifier.
 *
 * @param {string} path  e.g. "generated://name-chain-round"
 * @returns {string|undefined}
 */
export function getBraceletChainKeyByPath(path) {
  if (!path) return undefined;
  const entry = Object.entries(BRACELET_CHAIN_IDS).find(([, v]) => v.path === path);
  return entry?.[0];
}

/**
 * Resolve a birthstone's product ID from its gemstone colour hex.
 *
 * @param {string} hex  e.g. "#9B111E"
 * @returns {string|undefined}
 */
export function getBraceletBirthstoneIdByHex(hex) {
  if (!hex) return undefined;
  const lower = hex.toLowerCase();
  const entry = Object.values(BRACELET_BIRTHSTONE_IDS).find(
    (v) => v.hex.toLowerCase() === lower
  );
  return entry?.id;
}

/**
 * Resolve a diamond charm's product ID from its GLB path.
 *
 * @param {string} path  e.g. "/bc-assets/gemstone/D1.glb"
 * @returns {string|undefined}
 */
export function getBraceletDiamondCharmIdByPath(path) {
  if (!path) return undefined;
  const entry = Object.values(BRACELET_DIAMOND_CHARM_IDS).find((v) => v.path === path);
  return entry?.id;
}

/**
 * Resolve a 3-D charm's product ID from its GLB path.
 *
 * @param {string} path  e.g. "/bc-assets/bracelet_models/CHARMS1.glb"
 * @returns {string|undefined}
 */
export function getBracelet3DCharmIdByPath(path) {
  if (!path) return undefined;
  const entry = Object.values(BRACELET_3D_CHARM_IDS).find((v) => v.path === path);
  return entry?.id;
}

/**
 * Resolve a 2-D charm's product ID from its image charm number.
 *
 * @param {number} number  e.g. 9 for CHARMS9.png
 * @returns {string|undefined}
 */
export function getBracelet2DCharmIdByNumber(number) {
  if (number == null) return undefined;
  const entry = Object.values(BRACELET_2D_CHARM_IDS).find(
    (v) => v.imageCharmNumber === number
  );
  return entry?.id;
}

export default BRACELET_PRODUCT_IDS;
