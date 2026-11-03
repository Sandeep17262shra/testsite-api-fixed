/**
 * Bracelet catalogue adapter — product rows from API / fallback JSON by product_id.
 */
import {
  BRACELET_INITIAL_CHARM_ID,
  getBracelet2DCharmIdByNumber,
  getBracelet3DCharmIdByPath,
  getBraceletBirthstoneIdByHex,
  getBraceletChainKeyByPath,
  getBraceletDiamondCharmIdByPath,
  getBraceletMetalId,
  BRACELET_CHAIN_IDS,
} from "./data/braceletProductIds";
import { getCharmNumberFromPath } from "./shared/assets";
import {
  getBraceletConfigCache,
  initBraceletPriceConfig,
  isBraceletPriceConfigReady,
  getBraceletPriceConfigError,
} from "./braceletPriceApiClient";

const active = (item) => String(item?.status ?? "active").toLowerCase() === "active";

const getCatalogue = () => {
  const cache = getBraceletConfigCache();
  const raw = cache?.default ?? cache;
  if (Array.isArray(raw?.products)) return raw;
  return null;
};

const productIndex = () => {
  const catalogue = getCatalogue();
  if (!catalogue?.products?.length) return null;
  const byId = new Map();
  catalogue.products.filter(active).forEach((row) => {
    if (row?.product_id) byId.set(String(row.product_id).toUpperCase(), row);
  });
  return byId;
};

export function getBraceletCatalogProduct(productId) {
  if (!productId) return null;
  const index = productIndex();
  return index?.get(String(productId).toUpperCase()) ?? null;
}

export function getBraceletCatalogPrice(productId, fallback = 0) {
  const row = getBraceletCatalogProduct(productId);
  if (!row) return fallback;
  const price = Number(row.price);
  return Number.isFinite(price) ? price : fallback;
}

export function getBraceletCatalogLabel(productId, fallback = "") {
  const name = String(getBraceletCatalogProduct(productId)?.name ?? "").trim();
  return name || fallback;
}

/** Split an API metal-row name (for example "White Gold 14K") for the two UI controls. */
export function getBraceletMetalCatalogLabels(productId, fallbackMetal = "", fallbackPurity = "") {
  const name = getBraceletCatalogLabel(productId, "");
  const purityMatch = name.match(/\b(9K|10K|14K|18K)\b/i);
  if (!purityMatch) return { metal: name || fallbackMetal, purity: fallbackPurity };
  const purity = purityMatch[1].toUpperCase();
  const metal = name.replace(purityMatch[0], "").replace(/[-–—,]+\s*$/, "").trim();
  return { metal: metal || fallbackMetal, purity };
}

export function isBraceletCatalogProductActive(productId) {
  const cache = getBraceletConfigCache();
  const raw = cache?.default ?? cache;
  const row = raw?.products?.find(
    (item) => String(item?.product_id).toUpperCase() === String(productId).toUpperCase()
  );
  if (!row) return true;
  return active(row);
}

export function getBraceletChainCatalogPrice(chainPath, fallbackPrice = 0) {
  const key = getBraceletChainKeyByPath(chainPath);
  const id = key ? BRACELET_CHAIN_IDS[key]?.id : undefined;
  return id ? getBraceletCatalogPrice(id, fallbackPrice) : fallbackPrice;
}

export function getBraceletMetalCatalogPrice(metalHex, purity, fallbackPrice = 0) {
  const id = getBraceletMetalId(metalHex, purity);
  return id ? getBraceletCatalogPrice(id, fallbackPrice) : fallbackPrice;
}

/**
 * Size add-on from BSR1 (default inches), BSR2 (step), BSR3 ($/step above default).
 * Falls back to UI tier table when the catalogue is not loaded.
 */
export function getBraceletSizeCatalogPrice(sizeStr, fallbackPrice = 0) {
  const settings = getBraceletSizeCatalogSettings();
  if (!settings) {
    return fallbackPrice;
  }

  const size = parseFloat(sizeStr);
  if (!Number.isFinite(size)) return fallbackPrice;

  const steps = Math.round((size - settings.baseInches) / settings.stepGap);
  return Math.max(0, steps) * settings.stepPrice;
}

/** Active BSR1/2/3 rows define the first/default size, size increment, and increment price. */
export function getBraceletSizeCatalogSettings() {
  const baseInches = Number(getBraceletCatalogProduct("BSR1")?.price);
  const stepGap = Number(getBraceletCatalogProduct("BSR2")?.price);
  const stepPrice = Number(getBraceletCatalogProduct("BSR3")?.price);
  if (![baseInches, stepGap, stepPrice].every(Number.isFinite) || baseInches <= 0 || stepGap <= 0) {
    return null;
  }
  return { baseInches, stepGap, stepPrice };
}

export function getBraceletCharmCatalogPrice(charm, fallbackPrice = 0) {
  if (!charm) return fallbackPrice;

  if (charm.type === "birthstone") {
    const hex = charm.gemstoneColor || charm.color;
    if (hex) {
      const id = getBraceletBirthstoneIdByHex(hex);
      if (id) return getBraceletCatalogPrice(id, fallbackPrice);
    }
  }

  if (charm.type === "diamond" && charm.path) {
    const id = getBraceletDiamondCharmIdByPath(charm.path);
    if (id) return getBraceletCatalogPrice(id, fallbackPrice);
  }

  if (charm.type === "initial") {
    return getBraceletCatalogPrice(BRACELET_INITIAL_CHARM_ID.initial.id, fallbackPrice);
  }

  const imageNumber =
    charm.imageCharmNumber ?? (charm.path ? getCharmNumberFromPath(charm.path) : undefined);
  if (imageNumber != null) {
    const id2d = getBracelet2DCharmIdByNumber(imageNumber);
    if (id2d) return getBraceletCatalogPrice(id2d, fallbackPrice);
  }

  if (charm.path) {
    const id3d = getBracelet3DCharmIdByPath(charm.path);
    if (id3d) return getBraceletCatalogPrice(id3d, fallbackPrice);
  }

  return fallbackPrice;
}

export function getBraceletNamePendantFontCatalogPrice(fontId, fallbackPrice = 0) {
  const map = { dancing: "BNF1", kingsman: "BNF2", yellowtail: "BNF3" };
  const productId = map[String(fontId || "").toLowerCase()];
  return productId ? getBraceletCatalogPrice(productId, fallbackPrice) : fallbackPrice;
}

const BRACELET_NAME_FONT_FALLBACK_PER_CHAR = {
  dancing: 20,
  kingsman: 22,
  yellowtail: 18,
};

export function getBraceletNamePendantTextPrice(fontId, text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return 0;
  const key = String(fontId || "dancing").toLowerCase();
  const fallbackPerChar = BRACELET_NAME_FONT_FALLBACK_PER_CHAR[key] ?? 20;
  const perChar = getBraceletNamePendantFontCatalogPrice(fontId, fallbackPerChar);
  return perChar * trimmed.length;
}

export {
  initBraceletPriceConfig,
  isBraceletPriceConfigReady,
  getBraceletPriceConfigError,
};
