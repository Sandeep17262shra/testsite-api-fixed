/**
 * Shared loader for store jewellery pricing API.
 * Uses the same proxy as ring (`/api/ring-pricing` → ring-pricing-v2 upstream).
 * Unified shape includes ring `pricing` plus optional `necklace` / `bracelet` / `beaded` slices.
 */

const REMOTE_API_URL = "/api/ring-pricing";

const DEFAULT_PARENT_URL = process.env.NEXT_PUBLIC_PARENT_URL || "";

let remoteResponseCache = null;
let remoteResponseStoreSlug = "";
let remoteInFlight = null;
let remoteInFlightStoreSlug = "";

export const getPricingApiStore = ({ parentUrl, shop } = {}) => {
  const explicitShop = typeof shop === "string" ? shop.trim() : "";
  if (explicitShop) {
    const value = explicitShop.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/.*$/, "");
    return value.toLowerCase();
  }

  let candidate = parentUrl;
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      const queryShop = params.get("shop");
      if (queryShop) return queryShop.trim().toLowerCase();

      const configShop = window.__parentConfig?.shop;
      if (configShop) return String(configShop).trim().toLowerCase();

      candidate =
        candidate || params.get("parentUrl") || params.get("parent") || params.get("store");
    } catch {}
  }
  if (!candidate && typeof window !== "undefined") {
    candidate = window.__parentConfig?.parentUrl;
  }
  if (!candidate && typeof window !== "undefined" && window.self !== window.top) {
    candidate = document.referrer;
  }
  if (!candidate) candidate = DEFAULT_PARENT_URL;
  if (!candidate) return "";

  const value = String(candidate).trim();
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const hostname = new URL(withProtocol).hostname.replace(/^www\./i, "");
    if (hostname === "localhost" || hostname === "127.0.0.1") return "";
    return hostname;
  } catch {
    const clean = value.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/.*$/, "");
    if (clean === "localhost" || clean === "127.0.0.1") return "";
    return clean;
  }
};

/** Prefer Shopify `shop` / canonicalShop over a shell or configurator parentUrl host. */
export const resolveJewelryPricingApiStore = ({ parentUrl, shop, canonicalShop } = {}) => {
  const fromCanonical = getPricingApiStore({ shop: canonicalShop });
  if (fromCanonical) return fromCanonical;
  return getPricingApiStore({ parentUrl, shop });
};

const productList = (payload) =>
  Array.isArray(payload?.products) ? payload.products : null;

/** Read a jewellery slice from ring-pricing-v2 (top-level or under pricing/data). */
const catalogFromJewelryKey = (response, key) => {
  if (!response || typeof response !== "object") return null;

  const nodes = [
    response[key],
    response?.pricing?.[key],
    response?.data?.[key],
    response?.data?.pricing?.[key],
  ];

  for (const node of nodes) {
    const products = productList(node);
    if (products?.length) return { products };
  }

  return null;
};

const isBraceletProductId = (productId) => {
  const id = String(productId || "").toUpperCase();
  return (
    id.startsWith("BC") ||
    id.startsWith("BBS") ||
    id.startsWith("BDC") ||
    id.startsWith("BIC") ||
    id.startsWith("B2D") ||
    id.startsWith("B3D") ||
    id.startsWith("BSR") ||
    id.startsWith("BNF")
  );
};

const isNecklaceProductId = (productId) => /^(NC|NBS|NDC|NIC|NPF|NCL|NPC)/i.test(String(productId || ""));
const includesProductFamily = (products, matcher) =>
  Array.isArray(products) && products.some((product) => matcher(product?.product_id));

/** @param {unknown} response Full API body or local fallback JSON */
export function extractNecklacePricingPayload(response) {
  const fromUnified = catalogFromJewelryKey(response, "necklace");
  if (fromUnified) return fromUnified;

  const direct = productList(response);
  if (includesProductFamily(direct, isNecklaceProductId)) {
    return { products: direct };
  }

  const legacy = productList(response?.pricing ?? response?.data);
  if (includesProductFamily(legacy, isNecklaceProductId)) {
    return { products: legacy };
  }

  return null;
}

/** @param {unknown} response Full API body or local fallback JSON */
export function extractBraceletPricingPayload(response) {
  const fromUnified = catalogFromJewelryKey(response, "bracelet");
  if (fromUnified) return fromUnified;

  const direct = productList(response);
  if (includesProductFamily(direct, isBraceletProductId)) {
    return { products: direct };
  }

  const legacy = productList(response?.pricing ?? response?.data);
  if (includesProductFamily(legacy, isBraceletProductId)) {
    return { products: legacy };
  }

  return null;
}

export function hasNecklacePricingCatalogue(response) {
  const payload = extractNecklacePricingPayload(response);
  return Boolean(payload?.products?.length);
}

export function hasBraceletPricingCatalogue(response) {
  const payload = extractBraceletPricingPayload(response);
  return Boolean(payload?.products?.length);
}

export function normalizeJewelryPriceConfig(catalogueSlice, fullResponse) {
  if (!catalogueSlice || typeof catalogueSlice !== "object") return catalogueSlice;

  const storeKey =
    typeof fullResponse?.store === "string"
      ? fullResponse.store.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "").split(".")[0]
      : "";

  return {
    default: catalogueSlice,
    ...(storeKey ? { [storeKey]: catalogueSlice } : {}),
  };
}

export function clearJewelryPricingRemoteCache() {
  remoteResponseCache = null;
  remoteResponseStoreSlug = "";
  remoteInFlight = null;
  remoteInFlightStoreSlug = "";
}

export function fetchRemoteJewelryPricing(store, { force = false } = {}) {
  if (!store) {
    return Promise.reject(new Error("A store is required for jewelry pricing."));
  }

  if (!force && remoteResponseCache && remoteResponseStoreSlug === store) {
    return Promise.resolve(remoteResponseCache);
  }
  if (!force && remoteInFlight && remoteInFlightStoreSlug === store) {
    return remoteInFlight;
  }

  const request = fetch(`${REMOTE_API_URL}?${new URLSearchParams({ store }).toString()}`, { cache: "no-store" })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Store price config request failed: ${res.status} ${res.statusText}`);
      }
      return res.json();
    })
    .then((data) => {
      remoteResponseCache = data;
      remoteResponseStoreSlug = store;
      return data;
    })
    .finally(() => {
      if (remoteInFlight === request) {
        remoteInFlight = null;
        remoteInFlightStoreSlug = "";
      }
    });

  remoteInFlight = request;
  remoteInFlightStoreSlug = store;
  return request;
}
