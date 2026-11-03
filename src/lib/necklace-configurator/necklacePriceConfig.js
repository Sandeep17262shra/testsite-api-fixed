/**
 * Necklace catalogue adapter — product rows from API / fallback JSON by product_id.
 */
import {
  getNecklaceBirthstoneIdByHex,
  getNecklaceChainKeyByPath,
  getNecklaceDiamondCharmIdByPath,
  getNecklaceMetalId,
  getNecklaceProductId,
  NECKLACE_CHAIN_IDS,
  NECKLACE_INITIAL_CHARM_ID,
} from "./data/necklaceProductIds";
import {
  getNecklaceConfigCache,
  initNecklacePriceConfig,
  isNecklacePriceConfigReady,
  getNecklacePriceConfigError,
} from "./necklacePriceApiClient";

const active = (item) => String(item?.status ?? "active").toLowerCase() === "active";

const getCatalogue = () => {
  const cache = getNecklaceConfigCache();
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

export function getNecklaceCatalogProduct(productId) {
  if (!productId) return null;
  const index = productIndex();
  return index?.get(String(productId).toUpperCase()) ?? null;
}

export function getNecklaceCatalogPrice(productId, fallback = 0) {
  const row = getNecklaceCatalogProduct(productId);
  if (!row) return fallback;
  const price = Number(row.price);
  return Number.isFinite(price) ? price : fallback;
}

export function getNecklaceCatalogLabel(productId, fallback = "") {
  const name = String(getNecklaceCatalogProduct(productId)?.name ?? "").trim();
  return name || fallback;
}

/** Split an API metal-row name (for example "White Gold 14K") for the two UI controls. */
export function getNecklaceMetalCatalogLabels(productId, fallbackMetal = "", fallbackPurity = "") {
  const name = getNecklaceCatalogLabel(productId, "");
  const purityMatch = name.match(/\b(9K|10K|14K|18K)\b/i);
  if (!purityMatch) return { metal: name || fallbackMetal, purity: fallbackPurity };
  const purity = purityMatch[1].toUpperCase();
  const metal = name.replace(purityMatch[0], "").replace(/[-–—,]+\s*$/, "").trim();
  return { metal: metal || fallbackMetal, purity };
}

export function isNecklaceCatalogProductActive(productId) {
  const cache = getNecklaceConfigCache();
  const raw = cache?.default ?? cache;
  const row = raw?.products?.find(
    (item) => String(item?.product_id).toUpperCase() === String(productId).toUpperCase()
  );
  if (!row) return true;
  return active(row);
}

export function getNecklaceChainCatalogPrice(chainPath, fallbackPrice = 0) {
  const key = getNecklaceChainKeyByPath(chainPath);
  const id = key ? NECKLACE_CHAIN_IDS[key]?.id : undefined;
  return id ? getNecklaceCatalogPrice(id, fallbackPrice) : fallbackPrice;
}

export function getNecklaceMetalCatalogPrice(metalHex, purity, fallbackPrice = 0) {
  const id = getNecklaceMetalId(metalHex, purity);
  return id ? getNecklaceCatalogPrice(id, fallbackPrice) : fallbackPrice;
}

export function getNecklaceCharmCatalogPrice(charm, fallbackPrice = 0) {
  if (!charm) return fallbackPrice;
  if (charm.type === "birthstone") {
    const hex = charm.gemstoneColor || charm.color;
    if (hex) {
      const id = getNecklaceBirthstoneIdByHex(hex);
      if (id) return getNecklaceCatalogPrice(id, fallbackPrice);
    }
  }
  if (charm.type === "diamond" && charm.path) {
    const id = getNecklaceDiamondCharmIdByPath(charm.path);
    if (id) return getNecklaceCatalogPrice(id, fallbackPrice);
  }
  if (charm.type === "initial") {
    return getNecklaceCatalogPrice(NECKLACE_INITIAL_CHARM_ID.initial.id, fallbackPrice);
  }
  return fallbackPrice;
}

export function getNecklaceNamePendantFontCatalogPrice(fontId, fallbackPrice = 0) {
  const id = getNecklaceProductId("namePendantFont", fontId);
  return id ? getNecklaceCatalogPrice(id, fallbackPrice) : fallbackPrice;
}

export function getNecklaceChainLengthCatalogPrice(lengthId, fallbackPrice = 0) {
  const map = { 16: "NCL16", 18: "NCL18" };
  const productId = map[String(lengthId)];
  return productId ? getNecklaceCatalogPrice(productId, fallbackPrice) : fallbackPrice;
}

/** 16″ base (NCL16) + optional 18″ add-on (NCL18) when 18″ is selected. */
export function getNecklaceChainLengthTotalPrice(lengthId) {
  const resolved = String(lengthId ?? "16");
  const base16 = getNecklaceChainLengthCatalogPrice("16", 0);
  const addon18 = getNecklaceChainLengthCatalogPrice("18", 50);
  if (resolved === "18") return base16 + addon18;
  return base16;
}

const NAME_FONT_FALLBACK_PER_CHAR = {
  dancing: 20,
  kingsman: 22,
  yellowtail: 18,
};

/** Font catalogue price is per character (e.g. $20 × 3 letters = $60). */
export function getNecklaceNamePendantTextPrice(fontId, text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return 0;
  const key = String(fontId || "dancing").toLowerCase();
  const fallbackPerChar = NAME_FONT_FALLBACK_PER_CHAR[key] ?? 20;
  const perChar = getNecklaceNamePendantFontCatalogPrice(fontId, fallbackPerChar);
  return perChar * trimmed.length;
}

const PENDANT_CHARM_PRODUCT_IDS = {
  cushion: "NPC1",
};

export function getNecklacePendantCharmCatalogPrice(charmId, fallbackPrice = 350) {
  const productId = PENDANT_CHARM_PRODUCT_IDS[String(charmId || "").toLowerCase()];
  return productId ? getNecklaceCatalogPrice(productId, fallbackPrice) : fallbackPrice;
}

export {
  initNecklacePriceConfig,
  isNecklacePriceConfigReady,
  getNecklacePriceConfigError,
};
