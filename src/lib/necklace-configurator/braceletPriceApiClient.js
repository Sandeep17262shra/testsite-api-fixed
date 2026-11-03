/**
 * Bracelet store catalogue loader — mirrors necklace priceApiClient behaviour.
 * Falls back to public/data/bracelet-demostore-api-data.json when the API is
 * empty or unreachable.
 */

import {
  clearJewelryPricingRemoteCache,
  extractBraceletPricingPayload,
  fetchRemoteJewelryPricing,
  hasBraceletPricingCatalogue,
  normalizeJewelryPriceConfig,
  resolveJewelryPricingApiStore,
} from "./jewelryPriceApiShared";

const USE_REMOTE_API = true;
const LOCAL_BRACELET_DEMOSTORE_JSON_URL = "/data/bracelet-demostore-api-data.json";

let configCache = null;
let inFlightRequest = null;
let inFlightStoreSlug = "";
let lastError = null;
let lastLoadedStoreSlug = "";

const loadLocalFallback = () =>
  fetch(LOCAL_BRACELET_DEMOSTORE_JSON_URL).then((res) => {
    if (!res.ok) {
      throw new Error(`Local bracelet price fallback failed: ${res.status}`);
    }
    return res.json();
  });

const toBraceletConfig = (response) => {
  const slice = extractBraceletPricingPayload(response);
  if (!slice?.products?.length) {
    throw new Error("Bracelet price config response did not contain a pricing catalogue.");
  }
  return normalizeJewelryPriceConfig(slice, response?.store ? { store: response.store } : response);
};

export async function initBraceletPriceConfig({
  force = false,
  parentUrl,
  shop,
  canonicalShop,
} = {}) {
  const hasExplicitStore = [parentUrl, shop, canonicalShop].some(
    (value) => typeof value === "string" && value.trim()
  );
  if (!hasExplicitStore) {
    configCache = {};
    lastLoadedStoreSlug = "";
    lastError = null;
    return configCache;
  }

  const pricingApiStore = USE_REMOTE_API
    ? resolveJewelryPricingApiStore({ parentUrl, shop, canonicalShop })
    : "";
  const storeSlug = USE_REMOTE_API ? pricingApiStore || "none" : "";

  if (configCache !== null && !force && lastLoadedStoreSlug === storeSlug) {
    return configCache;
  }
  if (inFlightRequest && !force && inFlightStoreSlug === storeSlug) {
    return inFlightRequest;
  }

  if (USE_REMOTE_API && !pricingApiStore) {
    configCache = {};
    lastLoadedStoreSlug = "";
    lastError = null;
    return configCache;
  }

  if (force) {
    clearJewelryPricingRemoteCache();
  }

  const request = (USE_REMOTE_API
    ? fetchRemoteJewelryPricing(pricingApiStore, { force }).then((data) => {
        if (hasBraceletPricingCatalogue(data)) return data;
        throw new Error("Bracelet price config response did not contain a pricing catalogue.");
      })
    : loadLocalFallback()
  )
    .catch((err) => {
      console.warn(
        "[braceletPriceApiClient] Remote bracelet pricing unavailable, using demostore fallback:",
        err
      );
      return loadLocalFallback();
    })
    .then((data) => {
      configCache = toBraceletConfig(data);
      lastLoadedStoreSlug = storeSlug;
      lastError = null;
      return configCache;
    })
    .catch((err) => {
      console.error("[braceletPriceApiClient] Failed to load bracelet price config:", err);
      lastError = err;
      throw err;
    })
    .finally(() => {
      if (inFlightRequest === request) {
        inFlightRequest = null;
        inFlightStoreSlug = "";
      }
    });

  inFlightRequest = request;
  inFlightStoreSlug = storeSlug;
  return request;
}

export function getBraceletConfigCache() {
  return configCache;
}

export function isBraceletPriceConfigReady() {
  return configCache !== null;
}

export function getBraceletPriceConfigError() {
  return lastError;
}

export async function refreshBraceletPriceConfig({ parentUrl, shop, canonicalShop } = {}) {
  configCache = null;
  lastLoadedStoreSlug = "";
  clearJewelryPricingRemoteCache();
  return initBraceletPriceConfig({ force: true, parentUrl, shop, canonicalShop });
}
