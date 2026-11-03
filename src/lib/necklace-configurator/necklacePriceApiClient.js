/**
 * Necklace store catalogue loader — mirrors ring priceApiClient behaviour.
 * Falls back to public/data/necklace-demostore-api-data.json when the API is
 * empty or unreachable (e.g. new store with no pricing yet).
 */

import {
  clearJewelryPricingRemoteCache,
  extractNecklacePricingPayload,
  fetchRemoteJewelryPricing,
  hasNecklacePricingCatalogue,
  normalizeJewelryPriceConfig,
  resolveJewelryPricingApiStore,
} from "./jewelryPriceApiShared";

const USE_REMOTE_API = true;
const LOCAL_NECKLACE_DEMOSTORE_JSON_URL = "/data/necklace-demostore-api-data.json";

let configCache = null;
let inFlightRequest = null;
let inFlightStoreSlug = "";
let lastError = null;
let lastLoadedStoreSlug = "";

const loadLocalFallback = () =>
  fetch(LOCAL_NECKLACE_DEMOSTORE_JSON_URL).then((res) => {
    if (!res.ok) {
      throw new Error(`Local necklace price fallback failed: ${res.status}`);
    }
    return res.json();
  });

const toNecklaceConfig = (response) => {
  const slice = extractNecklacePricingPayload(response);
  if (!slice?.products?.length) {
    throw new Error("Necklace price config response did not contain a pricing catalogue.");
  }
  return normalizeJewelryPriceConfig(slice, response?.store ? { store: response.store } : response);
};

export async function initNecklacePriceConfig({
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
        if (hasNecklacePricingCatalogue(data)) return data;
        throw new Error("Necklace price config response did not contain a pricing catalogue.");
      })
    : loadLocalFallback()
  )
    .catch((err) => {
      console.warn(
        "[necklacePriceApiClient] Remote necklace pricing unavailable, using demostore fallback:",
        err
      );
      return loadLocalFallback();
    })
    .then((data) => {
      configCache = toNecklaceConfig(data);
      lastLoadedStoreSlug = storeSlug;
      lastError = null;
      return configCache;
    })
    .catch((err) => {
      console.error("[necklacePriceApiClient] Failed to load necklace price config:", err);
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

export function getNecklaceConfigCache() {
  return configCache;
}

export function isNecklacePriceConfigReady() {
  return configCache !== null;
}

export function getNecklacePriceConfigError() {
  return lastError;
}

export async function refreshNecklacePriceConfig({ parentUrl, shop, canonicalShop } = {}) {
  configCache = null;
  lastLoadedStoreSlug = "";
  clearJewelryPricingRemoteCache();
  return initNecklacePriceConfig({ force: true, parentUrl, shop, canonicalShop });
}
