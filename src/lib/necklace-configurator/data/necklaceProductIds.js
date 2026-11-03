/**
 * necklaceProductIds.js
 *
 * Central registry of product IDs for the Necklace configurator.
 * Contains product IDs for:
 *   - 4 chain styles (NC01 - NC04)
 *   - 14 metal + purity options (M001 - M014)
 *   - Name pendant option with 3 connected script fonts (NPF1 - NPF3)
 *   - Charms:
 *       • 10 birthstones (NBS01 - NBS10)
 *       • 5 diamond charms (NDC1 - NDC5)
 *       • Initial charm (NIC1)
 *
 * ID prefixes:
 *   NC  = Necklace Chain          (NC01, NC02, ...)
 *   M   = Metal + Purity          (M001, M002, ... M014)
 *   NPF = Name Pendant Font       (NPF1, NPF2, ...)
 *   NBS = Necklace Birthstone     (NBS01, NBS02, ...)
 *   NDC = Necklace Diamond Charm  (NDC1, NDC2, ...)
 *   NIC = Necklace Initial Charm  (NIC1)
 */

// ── Chain Styles (4 chains) ──────────────────────────────────────────────────
export const NECKLACE_CHAIN_IDS = {
  clip:     { id: "NC01", rawLabel: "Clip",     path: "/pc-assets/pendant_models//BRACELET15.glb" },
  plain:    { id: "NC02", rawLabel: "Plain",    path: "/pc-assets/pendant_models//BRACELET16.glb" },
  milgrain: { id: "NC03", rawLabel: "Milgrain", path: "/pc-assets/pendant_models//BRACELET17.glb" },
  link:     { id: "NC04", rawLabel: "Link",     path: "/pc-assets/pendant_models//BRACELET18.glb" },
};

// ── Metals (M001 - M014) ─────────────────────────────────────────────────────
export const NECKLACE_METAL_IDS = {
  whiteGold9K:   { id: "M001", rawLabel: "White Gold 9K",   metal: "White Gold",  purity: "9K",  hex: "#C8C8C8" },
  yellowGold9K:  { id: "M002", rawLabel: "Yellow Gold 9K",  metal: "Yellow Gold", purity: "9K",  hex: "#ECC875" },
  roseGold9K:    { id: "M003", rawLabel: "Rose Gold 9K",    metal: "Rose Gold",   purity: "9K",  hex: "#FFBAA3" },
  whiteGold10K:  { id: "M004", rawLabel: "White Gold 10K",  metal: "White Gold",  purity: "10K", hex: "#C8C8C8" },
  yellowGold10K: { id: "M005", rawLabel: "Yellow Gold 10K", metal: "Yellow Gold", purity: "10K", hex: "#ECC875" },
  roseGold10K:   { id: "M006", rawLabel: "Rose Gold 10K",   metal: "Rose Gold",   purity: "10K", hex: "#FFBAA3" },
  whiteGold14K:  { id: "M007", rawLabel: "White Gold 14K",  metal: "White Gold",  purity: "14K", hex: "#C8C8C8" },
  yellowGold14K: { id: "M008", rawLabel: "Yellow Gold 14K", metal: "Yellow Gold", purity: "14K", hex: "#ECC875" },
  roseGold14K:   { id: "M009", rawLabel: "Rose Gold 14K",   metal: "Rose Gold",   purity: "14K", hex: "#FFBAA3" },
  whiteGold18K:  { id: "M010", rawLabel: "White Gold 18K",  metal: "White Gold",  purity: "18K", hex: "#C8C8C8" },
  yellowGold18K: { id: "M011", rawLabel: "Yellow Gold 18K", metal: "Yellow Gold", purity: "18K", hex: "#ECC875" },
  roseGold18K:   { id: "M012", rawLabel: "Rose Gold 18K",   metal: "Rose Gold",   purity: "18K", hex: "#FFBAA3" },
  platinum:      { id: "M013", rawLabel: "Platinum",        metal: "Platinum",    purity: null,  hex: "#A8A8A6" },
  silver925:     { id: "M014", rawLabel: "Silver 925",      metal: "Silver 925",  purity: null,  hex: "#C0C0C0" },
};

// ── Name Pendant Fonts (3 fonts) ─────────────────────────────────────────────
export const NAME_PENDANT_FONT_IDS = {
  dancing:    { id: "NPF1", rawLabel: "Dancing",    sample: "ℛ", connected: true },
  kingsman:   { id: "NPF2", rawLabel: "Kingsman",   sample: "𝒦", connected: true },
  yellowtail: { id: "NPF3", rawLabel: "Yellowtail", sample: "𝒴", connected: true },
};

// ── Birthstones (10 birthstones) ─────────────────────────────────────────────
export const NECKLACE_BIRTHSTONE_IDS = {
  garnet:      { id: "NBS01", rawLabel: "Garnet (Jan)",      hex: "#C8102E", month: 1  },
  amethyst:    { id: "NBS02", rawLabel: "Amethyst (Feb)",    hex: "#6D3BB5", month: 2  },
  aquamarine:  { id: "NBS03", rawLabel: "Aquamarine (Mar)",  hex: "#8EC7DF", month: 3  },
  emerald:     { id: "NBS04", rawLabel: "Emerald (May)",     hex: "#009B77", month: 5  },
  ruby:        { id: "NBS05", rawLabel: "Ruby (Jul)",        hex: "#9B111E", month: 7  },
  peridot:     { id: "NBS06", rawLabel: "Peridot (Aug)",     hex: "#AFCB2B", month: 8  },
  sapphire:    { id: "NBS07", rawLabel: "Sapphire (Sep)",    hex: "#0F52BA", month: 9  },
  tourmaline:  { id: "NBS08", rawLabel: "Tourmaline (Oct)",  hex: "#F0839C", month: 10 },
  topaz:       { id: "NBS09", rawLabel: "Topaz (Nov)",       hex: "#D9B83D", month: 11 },
  turquoise:   { id: "NBS10", rawLabel: "Turquoise (Dec)",   hex: "#4AA7BA", month: 12 },
  // Compatibility fallbacks for April / June if selected
  diamond:     { id: "NBS11", rawLabel: "Diamond (Apr)",     hex: "#F4F8FF", month: 4  },
  alexandrite: { id: "NBS12", rawLabel: "Alexandrite (Jun)", hex: "#C978A9", month: 6  },
};

export const NECKLACE_BIRTHSTONE_DISPLAY_ORDER = [
  "garnet", "amethyst", "aquamarine", "emerald",
  "ruby", "peridot", "sapphire", "tourmaline", "topaz", "turquoise",
];

// ── Diamond Charms (5 diamond cuts) ──────────────────────────────────────────
export const NECKLACE_DIAMOND_CHARM_IDS = {
  round:    { id: "NDC1", rawLabel: "Round Diamond",    path: "/bc-assets/gemstone/D1.glb",        preview: "/bc-assets/images/diamonds/round.webp?v2"    },
  pear:     { id: "NDC2", rawLabel: "Pear Diamond",     path: "/bc-assets/gemstone/D2.glb",        preview: "/bc-assets/images/diamonds/pear.webp?v2"     },
  oval:     { id: "NDC3", rawLabel: "Oval Diamond",     path: "/bc-assets/gemstone/D3.glb",        preview: "/bc-assets/images/diamonds/oval.webp?v2"     },
  princess: { id: "NDC4", rawLabel: "Princess Diamond", path: "/bc-assets/gemstone/princess.glb", preview: "/bc-assets/images/diamonds/princess.webp?v2" },
  cushion:  { id: "NDC5", rawLabel: "Cushion Diamond",  path: "/bc-assets/gemstone/cushion.glb",  preview: "/bc-assets/images/diamonds/cushion.webp?v2"  },
};

// ── Initial Charm ────────────────────────────────────────────────────────────
export const NECKLACE_INITIAL_CHARM_ID = {
  initial: { id: "NIC1", rawLabel: "Initial Charm" },
};

// ── Grouped export ────────────────────────────────────────────────────────────
export const NECKLACE_PRODUCT_IDS = {
  chain:           NECKLACE_CHAIN_IDS,
  metal:           NECKLACE_METAL_IDS,
  namePendantFont: NAME_PENDANT_FONT_IDS,
  birthstone:      NECKLACE_BIRTHSTONE_IDS,
  diamondCharm:    NECKLACE_DIAMOND_CHARM_IDS,
  initialCharm:    NECKLACE_INITIAL_CHARM_ID,
};

// ── Reverse lookups (id → entry) ──────────────────────────────────────────────
const invertById = (map) =>
  Object.fromEntries(Object.entries(map).map(([key, entry]) => [entry.id, { key, ...entry }]));

export const NECKLACE_CHAIN_BY_ID         = invertById(NECKLACE_CHAIN_IDS);
export const NECKLACE_METAL_BY_ID         = invertById(NECKLACE_METAL_IDS);
export const NAME_PENDANT_FONT_BY_ID      = invertById(NAME_PENDANT_FONT_IDS);
export const NECKLACE_BIRTHSTONE_BY_ID    = invertById(NECKLACE_BIRTHSTONE_IDS);
export const NECKLACE_DIAMOND_CHARM_BY_ID = invertById(NECKLACE_DIAMOND_CHARM_IDS);
export const NECKLACE_INITIAL_CHARM_BY_ID = invertById(NECKLACE_INITIAL_CHARM_ID);

// ── Reverse lookups (rawLabel → camelCase key) ────────────────────────────────
const invertByRawLabel = (map) =>
  Object.fromEntries(Object.entries(map).map(([key, entry]) => [entry.rawLabel, key]));

export const NECKLACE_CHAIN_KEY_BY_RAW_LABEL         = invertByRawLabel(NECKLACE_CHAIN_IDS);
export const NECKLACE_METAL_KEY_BY_RAW_LABEL         = invertByRawLabel(NECKLACE_METAL_IDS);
export const NAME_PENDANT_FONT_KEY_BY_RAW_LABEL      = invertByRawLabel(NAME_PENDANT_FONT_IDS);
export const NECKLACE_BIRTHSTONE_KEY_BY_RAW_LABEL    = invertByRawLabel(NECKLACE_BIRTHSTONE_IDS);
export const NECKLACE_DIAMOND_CHARM_KEY_BY_RAW_LABEL = invertByRawLabel(NECKLACE_DIAMOND_CHARM_IDS);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Look up a necklace product ID by category + camelCase key.
 *
 * @param {"chain"|"metal"|"namePendantFont"|"birthstone"|"diamondCharm"|"initialCharm"} category
 * @param {string} key  camelCase key, e.g. "yellowGold14K" or "round"
 * @returns {string|undefined}
 */
export function getNecklaceProductId(category, key) {
  return NECKLACE_PRODUCT_IDS[category]?.[key]?.id;
}

/**
 * Look up a necklace product ID by category + rawLabel.
 *
 * @param {"chain"|"metal"|"namePendantFont"|"birthstone"|"diamondCharm"|"initialCharm"} category
 * @param {string} rawLabel
 * @returns {string|undefined}
 */
export function getNecklaceProductIdByRawLabel(category, rawLabel) {
  if (!rawLabel) return undefined;
  const map = NECKLACE_PRODUCT_IDS[category];
  if (!map) return undefined;
  for (const key in map) {
    if (map[key].rawLabel === rawLabel) return map[key].id;
  }
  return undefined;
}

/**
 * Resolve a metal product ID (M001 - M014) from metal type/hex and purity.
 *
 * @param {string} metalOrHex  e.g. "Yellow Gold", "#ECC875", "YG"
 * @param {string} [purity]    e.g. "9K", "10K", "14K", "18K" (defaults to "9K" for gold)
 * @returns {string|undefined}  Product ID, e.g. "M008"
 */
export function getNecklaceMetalId(metalOrHex, purity = "9K") {
  if (!metalOrHex) return undefined;
  const str = String(metalOrHex).toLowerCase();

  // Direct ID check
  if (NECKLACE_METAL_BY_ID[metalOrHex.toUpperCase()]) {
    return metalOrHex.toUpperCase();
  }

  // Platinum (M013)
  if (str === "#a8a8a6" || str === "#e5e4e2" || str.includes("plat") || str === "pl") {
    return "M013";
  }

  // Silver 925 (M014)
  if (str === "#c0c0c0" || str === "#b8b8b8" || str.includes("silv") || str === "sl") {
    return "M014";
  }

  // Determine gold family
  let goldFamily = "Yellow Gold";
  if (str === "#c8c8c8" || str === "#dbdbdb" || str.includes("white") || str === "wg") {
    goldFamily = "White Gold";
  } else if (str === "#ffbaa3" || str.includes("rose") || str === "rg") {
    goldFamily = "Rose Gold";
  } else if (str === "#ecc875" || str === "#ffd280" || str.includes("yellow") || str === "yg") {
    goldFamily = "Yellow Gold";
  }

  const normalizedPurity = String(purity || "9K").toUpperCase();
  const entry = Object.values(NECKLACE_METAL_IDS).find(
    (m) => m.metal === goldFamily && m.purity === normalizedPurity
  );

  return entry?.id || (goldFamily === "White Gold" ? "M001" : goldFamily === "Yellow Gold" ? "M002" : "M003");
}

/**
 * Resolve a chain's camelCase key from its GLB path.
 *
 * @param {string} path  e.g. "/pc-assets/pendant_models//BRACELET15.glb"
 * @returns {string|undefined}
 */
export function getNecklaceChainKeyByPath(path) {
  if (!path) return undefined;
  const entry = Object.entries(NECKLACE_CHAIN_IDS).find(([, v]) => v.path === path);
  return entry?.[0];
}

/**
 * Resolve a birthstone's product ID from its gemstone colour hex.
 *
 * @param {string} hex  e.g. "#C8102E"
 * @returns {string|undefined}
 */
export function getNecklaceBirthstoneIdByHex(hex) {
  if (!hex) return undefined;
  const lower = hex.toLowerCase();
  const entry = Object.values(NECKLACE_BIRTHSTONE_IDS).find(
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
export function getNecklaceDiamondCharmIdByPath(path) {
  if (!path) return undefined;
  const entry = Object.values(NECKLACE_DIAMOND_CHARM_IDS).find((v) => v.path === path);
  return entry?.id;
}

export default NECKLACE_PRODUCT_IDS;
