/**
 * jewelryProductIds.js
 *
 * Unified entry point for both the Necklace and Bracelet product-ID registries.
 *
 * Import from here when you need to work with either jewelry type without
 * knowing which one in advance (e.g. in shared cart / share-link helpers).
 * Import directly from necklaceProductIds.js or braceletProductIds.js when
 * you need type-specific constants.
 *
 * Usage:
 *   import { resolveCharmProductId, resolveChainProductId, resolveMetalProductId } from
 *     "@/lib/necklace-configurator/data/jewelryProductIds";
 */

export * from "./necklaceProductIds.js";
export * from "./braceletProductIds.js";

// ── Per-charm and metal resolution (works for both jewelry types) ─────────────

import {
  getNecklaceChainKeyByPath,
  NECKLACE_CHAIN_IDS,
  NECKLACE_METAL_IDS,
  NAME_PENDANT_FONT_IDS,
  getNecklaceBirthstoneIdByHex,
  getNecklaceDiamondCharmIdByPath,
  NECKLACE_INITIAL_CHARM_ID,
  getNecklaceMetalId,
} from "./necklaceProductIds.js";

import {
  getBraceletChainKeyByPath,
  BRACELET_CHAIN_IDS,
  BRACELET_METAL_IDS,
  NAME_BRACELET_FONT_IDS,
  getBraceletBirthstoneIdByHex,
  getBraceletDiamondCharmIdByPath,
  getBracelet3DCharmIdByPath,
  getBracelet2DCharmIdByNumber,
  BRACELET_INITIAL_CHARM_ID,
  BRACELET_CHARMS_UNIT,
  getBraceletMetalId,
} from "./braceletProductIds.js";

/**
 * Resolve a metal product ID (M001 - M014) based on metal, purity, and jewelry type.
 *
 * @param {string} metalOrHex  e.g. "Yellow Gold", "#ECC875", "SL", etc.
 * @param {string} [purity]    e.g. "9K", "10K", "14K", "18K" (defaults to "9K" for gold)
 * @param {"necklace"|"bracelet"} jewelryType
 * @returns {string|undefined}  Product ID, e.g. "M001" - "M014"
 */
export function resolveMetalProductId(metalOrHex, purity = "9K", jewelryType = "necklace") {
  if (jewelryType === "bracelet") {
    return getBraceletMetalId(metalOrHex, purity);
  }
  return getNecklaceMetalId(metalOrHex, purity);
}

/**
 * Resolve a product ID for any placed charm object, for either jewelry type.
 *
 * For bracelets: initial charm, 2D charm, and 3D charm are treated as a single unit ("charms").
 * For necklaces: only initial charm, birthstones, and diamond charms exist (no 2D or 3D charms).
 *
 * Returns:
 *   { productId, category, unit, subType }
 *
 * Returns null when the charm cannot be matched (unknown type / missing data).
 *
 * @param {object} charm           The charm object from the charms array.
 * @param {"necklace"|"bracelet"} jewelryType  Which configurator is active.
 * @returns {{ productId: string, category: string, unit: string, subType?: string }|null}
 */
export function resolveCharmProductId(charm, jewelryType = "necklace") {
  if (!charm) return null;

  const isNecklace = jewelryType !== "bracelet";

  // ── Birthstone ──
  if (charm.type === "birthstone") {
    const productId = isNecklace
      ? getNecklaceBirthstoneIdByHex(charm.gemstoneColor)
      : getBraceletBirthstoneIdByHex(charm.gemstoneColor);
    return productId ? { productId, category: "birthstone", unit: "birthstone" } : null;
  }

  // ── Diamond charm ──
  if (charm.type === "diamond") {
    const productId = isNecklace
      ? getNecklaceDiamondCharmIdByPath(charm.path)
      : getBraceletDiamondCharmIdByPath(charm.path);
    return productId ? { productId, category: "diamondCharm", unit: "diamond" } : null;
  }

  // ── Initial charm ──
  if (charm.type === "initial") {
    if (isNecklace) {
      return {
        productId: NECKLACE_INITIAL_CHARM_ID.initial.id,
        category: "initialCharm",
        unit: "initial",
        letter: charm.letter || "A",
      };
    }
    // Bracelet treats initial as part of the unified Initial & Charms unit
    return {
      productId: BRACELET_INITIAL_CHARM_ID.initial.id,
      category: "initialCharm",
      unit: "charms",
      subType: "initial",
      letter: charm.letter || "A",
    };
  }

  // ── 2-D image charm (Bracelets only) ──
  if (!isNecklace && charm.imageCharmNumber != null) {
    const productId = getBracelet2DCharmIdByNumber(charm.imageCharmNumber);
    return productId
      ? {
          productId,
          category: "charm2d",
          unit: "charms",
          subType: "2d",
          imageCharmNumber: charm.imageCharmNumber,
        }
      : null;
  }

  // ── 3-D GLB charm (Bracelets only) ──
  if (!isNecklace && charm.path && charm.path.endsWith(".glb")) {
    const productId = getBracelet3DCharmIdByPath(charm.path);
    return productId
      ? {
          productId,
          category: "charm3d",
          unit: "charms",
          subType: "3d",
          path: charm.path,
        }
      : null;
  }

  return null;
}

/**
 * Resolve a chain's product ID from its GLB/generated path, for either type.
 *
 * @param {string} path            The braceletPath from context.
 * @param {"necklace"|"bracelet"} jewelryType
 * @returns {string|undefined}     Product ID, e.g. "NC01" or "BC01"
 */
export function resolveChainProductId(path, jewelryType = "necklace") {
  if (!path) return undefined;

  if (jewelryType === "bracelet") {
    const key = getBraceletChainKeyByPath(path);
    return key ? BRACELET_CHAIN_IDS[key]?.id : undefined;
  }

  const key = getNecklaceChainKeyByPath(path);
  return key ? NECKLACE_CHAIN_IDS[key]?.id : undefined;
}

/**
 * Build the full product-ID payload for a necklace or bracelet configuration.
 *
 * @param {object} cfg  The configurator state (from context + Controls).
 * @returns {object}
 */
export function buildJewelryProductIdPayload(cfg = {}) {
  const {
    jewelryType = "necklace",
    braceletPath,
    braceletMetal,
    braceletPurity,
    purity,
    namePendant,
    charms = [],
    chainLength,
  } = cfg;

  const isNecklace = jewelryType !== "bracelet";
  const payload = { jewelryType };

  // Chain
  const chainId = resolveChainProductId(braceletPath, jewelryType);
  if (chainId) payload.chainProductId = chainId;

  // Metal + Purity (M001 - M014)
  if (braceletMetal) {
    const effectivePurity = braceletPurity || purity || "9K";
    const metalId = resolveMetalProductId(braceletMetal, effectivePurity, jewelryType);
    if (metalId) payload.metalProductId = metalId;
  }

  // Chain Length (Necklace)
  if (isNecklace && chainLength) {
    payload.chainLength = String(chainLength);
    payload.chainLengthProductId = String(chainLength) === "18" ? "NCL18" : "NCL16";
  }

  // Name pendant / name bracelet
  if (namePendant?.enabled && namePendant?.text?.trim()) {
    const fontMap = isNecklace ? NAME_PENDANT_FONT_IDS : NAME_BRACELET_FONT_IDS;
    const fontEntry = Object.values(fontMap).find(
      (f) =>
        f.rawLabel.toLowerCase() === (namePendant.fontStyle || "").toLowerCase() ||
        f.id.toLowerCase() === (namePendant.fontStyle || "").toLowerCase()
    );
    payload.nameText = namePendant.text.trim();
    if (fontEntry) payload.nameFontProductId = fontEntry.id;
  }

  // Charms
  const charmProductIds = charms
    .filter(Boolean)
    .map((charm) => resolveCharmProductId(charm, jewelryType))
    .filter(Boolean);
  if (charmProductIds.length > 0) payload.charmProductIds = charmProductIds;

  return payload;
}
