/**
 * priceApiClient.js
 *
 * Single point of truth for WHERE the store price/availability config comes from.
 */

const USE_REMOTE_API = true;
// Local JSON remains an offline fallback only. Live catalogues must come from
// the pricing service so changes in the admin are reflected in the picker.
const USE_LOCAL_STORE_FIXTURES = false;

const REMOTE_API_URL =
  "https://ring-customizer-app.vercel.app/api/common-admin/settings/ring-pricing";

// Kept only as an emergency dev fallback — flip USE_REMOTE_API to false to use it.
const LOCAL_JSON_URL = "/data/price-config-data.json";
const LOCAL_DIAMONDWISE_JSON_URL = "/data/diamondwise-api-data.json";
const LOCAL_DEMOSTORE_JSON_URL = "/data/demostore-api-data.json";
const LOCAL_ELITE_JEWELERS_JSON_URL = "/data/elitejewelers-api-data.json";
const LOCAL_LAB_GROWN_LOVE_JSON_URL = "/data/labgrownlove-api-data.json";
const LOCAL_BONGIOIELLI_JSON_URL = "/data/bongioielli-api-data.json";
const LOCAL_DIMENDSCAASI_JSON_URL = "/data/dimendscaasi-api-data.json";

const REMOTE_API_HEADERS = {
  // "Authorization": `Bearer ${process.env.REACT_APP_PRICE_API_KEY}`,
};

// Only used when the configurator is opened standalone without a parent page.
const DEFAULT_PARENT_URL = process.env.NEXT_PUBLIC_PARENT_URL || "";

const getPricingApiStore = ({ parentUrl, shop } = {}) => {
  const explicitShop = typeof shop === "string" ? shop.trim().toLowerCase() : "";
  if (explicitShop) return explicitShop;

  let candidate = parentUrl;
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      const queryShop = params.get("shop");
      if (queryShop) return queryShop.trim().toLowerCase();

      candidate = candidate || params.get("parentUrl") || params.get("parent") || params.get("store");
    } catch {}
  }
  if (!candidate && typeof window !== "undefined") {
    const configShop = window.__parentConfig?.shop;
    if (configShop) return String(configShop).trim().toLowerCase();

    candidate = window.__parentConfig?.parentUrl;
  }
  if (!candidate && typeof window !== "undefined" && window.self !== window.top) {
    candidate = document.referrer;
  }
  if (!candidate) candidate = DEFAULT_PARENT_URL;

  if (!candidate) return "";

  const value = String(candidate).trim();

  try {
    const hostname = new URL(value).hostname.replace(/^www\./i, "");
    return STORE_SLUG_BY_HOST[hostname] ?? hostname;
  } catch {
    // `shop` / `store` may already be a Shopify hostname rather than a URL.
    // Preserve the full hostname (including `.myshopify.com`) because that is
    // the identifier accepted by the live pricing API.
    return value.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/.*$/, "");
  }
};

// API store IDs are not always identical to the storefront hostname. These
// mappings match the store names used by the configurator simulator.
const STORE_SLUG_BY_HOST = {
  "anelladiamonds.com": "anelladiamond",
  "bongioielli.com": "bongioielli",
  "bongioielli": "bongioielli",
  "bonguilli": "bongioielli",
  "dimendscaasi.com": "dimendscaasi",
  "dimendscaasi": "dimendscaasi",
  "dimensacci": "dimendscaasi",
  "elitejewelers.com": "elitejewelers",
  "elitejewelers": "elitejewelers",
  "elite": "elitejewelers",
  "labgrownlove.de": "labgrownlove",
  "labgrownlove": "labgrownlove",
  "diamondwise.net": "diamondwise",
  "diamondwise": "diamondwise",
  "jdemo364.wpenginepowered.com": "diamondwise",
  "jdemo364.wpenginepowered": "diamondwise",
  "shopify-jewelry-apps.keyideasinfotech.com": "keyideas",
  // Keep this test Shopify shop separate from JDemo and the generic Jewelith
  // storefront when caching and requesting its live catalogue.
  "jewelith-pricing-test.myshopify.com": "jewelith-pricing-test.myshopify.com",
  "demostore": "demostore",
};

let configCache = null;
let inFlightRequest = null;
let lastError = null;
let lastLoadedStoreSlug = "";

const getStoreSlug = (parentUrl) => {
  let candidate = parentUrl;
  if (!candidate && typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      candidate = params.get("parentUrl") || params.get("parent") || params.get("store") || params.get("shop");
    } catch {}
  }
  if (!candidate && typeof window !== "undefined") {
    candidate = window.__parentConfig?.parentUrl;
  }
  if (!candidate && typeof window !== "undefined" && window.self !== window.top) {
    candidate = document.referrer;
  }
  if (!candidate) candidate = DEFAULT_PARENT_URL;

  // A standalone configurator (for example, localhost:3000) has no store to
  // query. The caller will use priceConfig.js's built-in default prices.
  if (!candidate) return "";

  const value = String(candidate).trim();

  // Convert storefront URLs to the API's store key:
  // https://labgrownlove.de/ -> labgrownlove
  // https://www.bongioielli.com/ -> bongioielli
  try {
    const hostname = new URL(value).hostname.replace(/^www\./i, "");
    return STORE_SLUG_BY_HOST[hostname] ?? hostname;
  } catch {
    // Also allow callers to explicitly pass a hostname such as
    // `jewelith-pricing-test.myshopify.com`.
    return value.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/.*$/, "");
  }
};

const normalizePriceConfig = (response) => {
  // The remote API wraps the price object in `pricing` (and also supplies
  // `data`). The local fallback is already a store-keyed config map.
  const pricing = response?.pricing ?? response?.data;
  if (!pricing) return response;

  if (typeof pricing !== "object") {
    throw new Error("Price config response did not contain a pricing object.");
  }

  // priceConfig.js expects a map of store keys to pricing objects. Keeping a
  // default entry lets all existing parentUrl-based price lookups use the API.
  const storeKey = typeof response?.store === "string"
    ? response.store.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "").split(".")[0]
    : "";

  return {
    default: pricing,
    ...(storeKey ? { [storeKey]: pricing } : {}),
  };
};

export async function initPriceConfig({ force = false, parentUrl, shop } = {}) {
  const storeSlug = USE_REMOTE_API ? getStoreSlug(parentUrl || shop) : "";
  const pricingApiStore = USE_REMOTE_API ? getPricingApiStore({ parentUrl, shop }) : "";
  const usesLocalFixture = USE_LOCAL_STORE_FIXTURES;
  const localFixtureUrl = {
    diamondwise: LOCAL_DIAMONDWISE_JSON_URL,
    elitejewelers: LOCAL_ELITE_JEWELERS_JSON_URL,
    elite: LOCAL_ELITE_JEWELERS_JSON_URL,
    labgrownlove: LOCAL_LAB_GROWN_LOVE_JSON_URL,
    bongioielli: LOCAL_BONGIOIELLI_JSON_URL,
    bonguilli: LOCAL_BONGIOIELLI_JSON_URL,
    dimendscaasi: LOCAL_DIMENDSCAASI_JSON_URL,
    dimensacci: LOCAL_DIMENDSCAASI_JSON_URL,
    demostore: LOCAL_DEMOSTORE_JSON_URL,
    default: LOCAL_DEMOSTORE_JSON_URL,
  }[storeSlug] ?? LOCAL_DEMOSTORE_JSON_URL;
  const canReuseCache =
    configCache !== null &&
    !force &&
    (usesLocalFixture
      ? lastLoadedStoreSlug === storeSlug
      : (!USE_REMOTE_API || !storeSlug || lastLoadedStoreSlug === storeSlug || Object.keys(configCache).length > 0));

  if (canReuseCache) return configCache;
  if (inFlightRequest && !force) return inFlightRequest;

  if (USE_REMOTE_API && !usesLocalFixture && !storeSlug) {
    // Keep the configurator usable outside an embedded storefront. An empty
    // map signals that no store-specific API config is available; priceConfig.js
    // will fall back to staticPriceData (the bundled JSON with real prices).
    configCache = {};
    lastLoadedStoreSlug = "";
    lastError = null;
    return configCache;
  }

  const url = usesLocalFixture
    ? localFixtureUrl
    : USE_REMOTE_API
    ? (() => {
        const remoteUrl = new URL(REMOTE_API_URL);
        remoteUrl.searchParams.set("store", pricingApiStore || storeSlug);
        return remoteUrl.toString();
      })()
    : LOCAL_JSON_URL;
  const options = USE_REMOTE_API && !usesLocalFixture ? { headers: REMOTE_API_HEADERS } : {};

  inFlightRequest = fetch(url, options)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Price config request failed: ${res.status} ${res.statusText}`);
      }
      return res.json();
    })
    .then((data) => {
      configCache = normalizePriceConfig(data);
      lastLoadedStoreSlug = storeSlug;
      lastError = null;
      return configCache;
    })
    .catch((err) => {
      console.warn("[priceApiClient] Remote price config request failed, attempting local fallback:", err);
      return fetch(LOCAL_JSON_URL)
        .then((res) => {
          if (!res.ok) throw new Error(`Local price config fallback failed: ${res.status}`);
          return res.json();
        })
        .then((localData) => {
          configCache = localData;
          lastLoadedStoreSlug = storeSlug;
          lastError = null;
          return configCache;
        })
        .catch((localErr) => {
          console.error("[priceApiClient] Failed to load price config:", localErr);
          lastError = localErr;
          throw localErr;
        });
    })
    .finally(() => {
      inFlightRequest = null;
    });

  return inFlightRequest;
}

export function getConfigCache() {
  return configCache;
}

export function isPriceConfigReady() {
  return configCache !== null;
}

export function getPriceConfigError() {
  return lastError;
}

export async function refreshPriceConfig({ parentUrl } = {}) {
  return initPriceConfig({ force: true, parentUrl });
}
