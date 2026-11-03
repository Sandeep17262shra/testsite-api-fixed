/**
 * priceApiClient.js
 *
 * Single point of truth for WHERE the store price/availability config comes from.
 */

const USE_REMOTE_API = true;
// The live catalogue is now the source of truth. Local JSON files remain only
// as an offline fallback when the API cannot be reached.
const USE_LOCAL_STORE_FIXTURES = false;

const REMOTE_API_URL =
  "/api/ring-pricing";

// Demo-store catalogue is the fallback whenever a live store catalogue is not
// available. It uses the same products/stones API shape as the live endpoint.
const LOCAL_JSON_URL = "/data/demostore-api-data.json";
const LOCAL_DIAMONDWISE_JSON_URL = "/data/diamondwise-api-data.json";
const LOCAL_DEMOSTORE_JSON_URL = "/data/demostore-api-data.json";
const LOCAL_ELITE_JEWELERS_JSON_URL = "/data/elitejewelers-api-data.json";
const LOCAL_LAB_GROWN_LOVE_JSON_URL = "/data/labgrownlove-api-data.json";
const LOCAL_BONGIOIELLI_JSON_URL = "/data/bongioielli-api-data.json";
const LOCAL_DIMENDSCAASI_JSON_URL = "/data/dimendscaasi-api-data.json";

const remotePricingUrl = (store) => {
  return `${REMOTE_API_URL}?${new URLSearchParams({ store }).toString()}`;
};

const fetchRemotePricing = (store) =>
  fetch(remotePricingUrl(store))
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Price config request failed: ${res.status} ${res.statusText}`);
      }
      return res.json();
    });

const hasPricingCatalogue = (response) => {
  const catalogue =
    response?.pricing ??
    response?.data?.pricing ??
    response?.data ??
    response;
  return ["products", "components", "stones", "pricingRules", "pricing_rules"].some(
    (key) => Array.isArray(catalogue?.[key]) && catalogue[key].length > 0,
  );
};

// Only used when the configurator is opened standalone without a parent page.
const DEFAULT_PARENT_URL = process.env.NEXT_PUBLIC_PARENT_URL || "";

export const getPricingApiStore = ({ parentUrl, shop } = {}) => {
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
    if (hostname === "localhost" || hostname === "127.0.0.1") return "";
    // The v2 endpoint expects the storefront/Shopify domain itself. Keep the
    // full hostname rather than converting it to a legacy simulator slug.
    return hostname;
  } catch {
    const clean = value.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/.*$/, "");
    if (clean === "localhost" || clean === "127.0.0.1") return "";
    return clean;
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
  "demostore": "demostore",
};

let configCache = null;
let inFlightRequest = null;
let inFlightStoreSlug = "";
let lastError = null;
let lastLoadedStoreSlug = "";
let pricingAccessState = { planStatus: "active", removeLogo: false, appearance: null };

const normalizePlanStatus = (value) => {
  if (value === false || String(value ?? "").trim().toLowerCase() === "false") return "inactive";
  if (value === true) return "active";
  return String(value ?? "active").trim().toLowerCase();
};

const normalizeRemoveLogo = (value) => {
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === "true" || trimmed === "yes" || trimmed === "1") return true;
    if (trimmed === "false" || trimmed === "no" || trimmed === "0") return false;
  }
  return null;
};

// Check for removeLogo across all possible API envelope locations and naming conventions.
const getApiRemoveLogo = (response) => {
  if (!response) return null;

  if (typeof response === "string") {
    try {
      response = JSON.parse(response);
    } catch {
      return null;
    }
  }

  const checkValue = (val) => {
    const normalized = normalizeRemoveLogo(val);
    return normalized !== null ? normalized : null;
  };

  const candidates = [
    response?.removeLogo,
    response?.remove_logo,
    response?.removelogo,
    response?.isRemoveLogo,
    response?.is_remove_logo,
    response?.settings?.removeLogo,
    response?.settings?.remove_logo,
    response?.settings?.removelogo,
    response?.data?.removeLogo,
    response?.data?.remove_logo,
    response?.data?.removelogo,
    response?.data?.settings?.removeLogo,
    response?.data?.settings?.remove_logo,
    response?.pricing?.removeLogo,
    response?.pricing?.remove_logo,
    response?.pricing?.settings?.removeLogo,
    response?.pricing?.settings?.remove_logo,
    response?.data?.pricing?.removeLogo,
    response?.data?.pricing?.remove_logo,
    response?.data?.pricing?.settings?.removeLogo,
    response?.data?.pricing?.settings?.remove_logo,
    response?.store?.removeLogo,
    response?.store?.remove_logo,
    response?.data?.store?.removeLogo,
    response?.data?.store?.remove_logo,
    response?.config?.removeLogo,
    response?.config?.remove_logo,
    response?.configurator?.removeLogo,
    response?.configurator?.remove_logo,
    response?.appearance?.removeLogo,
    response?.appearance?.remove_logo,
    response?.data?.appearance?.removeLogo,
    response?.data?.appearance?.remove_logo,
    response?.result?.removeLogo,
    response?.result?.data?.removeLogo,
    response?.plan?.removeLogo,
    response?.features?.removeLogo,
  ];

  for (const candidate of candidates) {
    const res = checkValue(candidate);
    if (res !== null) return res;
  }

  for (const raw of [response?.settings, response?.appearance, response?.data?.settings, response?.data?.appearance]) {
    if (typeof raw === "string" && (raw.includes("removeLogo") || raw.includes("remove_logo") || raw.includes("removelogo"))) {
      try {
        const parsed = JSON.parse(raw);
        const res = checkValue(parsed?.removeLogo ?? parsed?.remove_logo ?? parsed?.removelogo);
        if (res !== null) return res;
      } catch {}
    }
  }

  return null;
};

// The catalogue endpoint has used a few response envelopes over time. Keep
// appearance lookup independent of the pricing shape so its CSS variables are
// applied whether the server returns it at the root, in `data`, or in settings.
const getApiAppearance = (response) => {
  if (!response) return null;

  // Direct appearance object check
  if (
    typeof response === "object" &&
    (response.primaryColor || response.primary_color || response.secondaryColor || response.secondary_color)
  ) {
    return response;
  }

  const raw =
    response?.appearance ??
    response?.settings?.appearance ??
    response?.data?.appearance ??
    response?.data?.settings?.appearance ??
    response?.pricing?.appearance ??
    response?.pricing?.settings?.appearance ??
    response?.data?.pricing?.appearance ??
    response?.data?.pricing?.settings?.appearance ??
    response?.store?.appearance ??
    response?.data?.store?.appearance ??
    response?.config?.appearance ??
    response?.configurator?.appearance ??
    response?.result?.appearance ??
    response?.result?.data?.appearance ??
    null;

  if (!raw) return null;

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  return typeof raw === "object" ? raw : null;
};

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
    return STORE_SLUG_BY_HOST[hostname] ?? hostname.split(".")[0];
  } catch {
    // Also allow callers to explicitly pass a key such as "bongioielli".
    return value.replace(/^https?:\/\/(www\.)?/i, "").split(/[./]/)[0];
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

export async function initPriceConfig({ force = false, parentUrl, shop, canonicalShop } = {}) {
  // A standalone configurator has no store identity. Do not let a deployment
  // default (NEXT_PUBLIC_PARENT_URL), a stale API response, or plan status
  // turn that local/default experience into a store lookup. The static
  // default configuration exposes the full product catalogue in this mode.
  const hasExplicitStore = [parentUrl, shop, canonicalShop].some(
    (value) => typeof value === "string" && value.trim(),
  );
  if (!hasExplicitStore) {
    configCache = {};
    lastLoadedStoreSlug = "";
    lastError = null;
    pricingAccessState = {
      planStatus: "active",
      removeLogo: pricingAccessState.removeLogo ?? false,
      appearance: null,
    };
    return configCache;
  }

  const parentPricingApiStore = USE_REMOTE_API
    ? getPricingApiStore({ parentUrl: parentUrl || shop })
    : "";
  const canonicalPricingApiStore = USE_REMOTE_API
    ? getPricingApiStore({ shop: canonicalShop })
    : "";
  // Canonical store identity takes precedence for both loading and cache
  // isolation. The parent-page host is only a fallback when it has no data.
  const storeSlug = USE_REMOTE_API
    ? `${canonicalPricingApiStore || "none"}|${parentPricingApiStore || "none"}`
    : "";
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
      : (!USE_REMOTE_API || lastLoadedStoreSlug === storeSlug));

  if (canReuseCache) return configCache;
  // Do not let a request for an old embedded parent store satisfy a new
  // parent/store selection while the iframe is initializing.
  if (inFlightRequest && !force && inFlightStoreSlug === storeSlug) return inFlightRequest;

  // Standalone configurator outside an embedded storefront (e.g. localhost:3000 / default).
  // An empty cache map signals that no store-specific API config is being used;
  // priceConfig.js uses staticPriceData and FALLBACK_OPTIONS to show all existing settings.
  if (USE_REMOTE_API && !usesLocalFixture && !parentPricingApiStore && !canonicalPricingApiStore) {
    configCache = {};
    lastLoadedStoreSlug = "";
    lastError = null;
    return Promise.resolve(configCache);
  }

  const url = usesLocalFixture
    ? localFixtureUrl
    : LOCAL_JSON_URL;
  const primaryPricingApiStore = canonicalPricingApiStore || parentPricingApiStore;
  const fallbackPricingApiStore =
    canonicalPricingApiStore && canonicalPricingApiStore !== parentPricingApiStore
      ? parentPricingApiStore
      : "";
  let triedParentStore = false;
  let remoteRemoveLogo = null;
  const loadPricing = USE_REMOTE_API && !usesLocalFixture
    ? fetchRemotePricing(primaryPricingApiStore)
      .then((data) => {
        remoteRemoveLogo = getApiRemoveLogo(data);
        if (hasPricingCatalogue(data)) return data;
        if (fallbackPricingApiStore) {
          triedParentStore = true;
          return fetchRemotePricing(fallbackPricingApiStore).then((parentData) => {
            remoteRemoveLogo = remoteRemoveLogo !== null ? remoteRemoveLogo : getApiRemoveLogo(parentData);
            if (!hasPricingCatalogue(parentData)) {
              throw new Error("Parent URL price config did not contain a pricing catalogue.");
            }
            return parentData;
          });
        }

        // A newly added store can be identified before its pricing catalogue
        // has been populated. An empty successful response is not usable
        // pricing data, so handle it exactly like a failed request and load
        // the local Jewelith demo catalogue in the catch below.
        throw new Error("Price config response did not contain a pricing catalogue.");
      })
      .catch((error) => {
        if (!fallbackPricingApiStore || triedParentStore) throw error;
        triedParentStore = true;
        return fetchRemotePricing(fallbackPricingApiStore).then((parentData) => {
          remoteRemoveLogo = remoteRemoveLogo !== null ? remoteRemoveLogo : getApiRemoveLogo(parentData);
          if (!hasPricingCatalogue(parentData)) {
            throw new Error("Parent URL price config did not contain a pricing catalogue.");
          }
          return parentData;
        });
      })
    : fetch(url).then((res) => {
      if (!res.ok) {
        throw new Error(`Price config request failed: ${res.status} ${res.statusText}`);
      }
      return res.json();
    });

  const request = loadPricing
    .then((data) => {
      const apiRemoveLogo = getApiRemoveLogo(data);
      const effectiveRemoveLogo =
        apiRemoveLogo !== null
          ? apiRemoveLogo
          : remoteRemoveLogo !== null
            ? remoteRemoveLogo
            : (pricingAccessState.removeLogo ?? false);

      pricingAccessState = {
        planStatus: normalizePlanStatus(data?.planStatus ?? data?.data?.planStatus),
        removeLogo: effectiveRemoveLogo,
        appearance: null,
      };
      configCache = normalizePriceConfig(data);
      lastLoadedStoreSlug = storeSlug;
      lastError = null;
      return configCache;
    })
    .catch((err) => {
      // If a parentUrl was provided and remote API fails:
      // check if a compatibility / fixture file exists for this store.
      // If no compatibility file exists, use the demo store setting.
      const requestedSlug = getStoreSlug(parentUrl || shop || canonicalShop);
      const fixtureUrl = {
        diamondwise: LOCAL_DIAMONDWISE_JSON_URL,
        elitejewelers: LOCAL_ELITE_JEWELERS_JSON_URL,
        elite: LOCAL_ELITE_JEWELERS_JSON_URL,
        labgrownlove: LOCAL_LAB_GROWN_LOVE_JSON_URL,
        bongioielli: LOCAL_BONGIOIELLI_JSON_URL,
        bonguilli: LOCAL_BONGIOIELLI_JSON_URL,
        dimendscaasi: LOCAL_DIMENDSCAASI_JSON_URL,
        dimensacci: LOCAL_DIMENDSCAASI_JSON_URL,
      }[requestedSlug];

      const fallbackUrl = fixtureUrl || LOCAL_DEMOSTORE_JSON_URL;
      console.warn(`[priceApiClient] Remote price config request failed, using ${fixtureUrl ? "store fixture" : "demo-store"} fallback:`, err);
      return fetch(fallbackUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`Local price config fallback failed: ${res.status}`);
          return res.json();
        })
        .then((localData) => {
          const localRemoveLogo = getApiRemoveLogo(localData);
          pricingAccessState = {
            planStatus: "active",
            removeLogo: remoteRemoveLogo !== null ? remoteRemoveLogo : (localRemoveLogo !== null ? localRemoveLogo : (pricingAccessState.removeLogo ?? false)),
            appearance: null,
          };
          configCache = normalizePriceConfig(localData);
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
      if (inFlightRequest === request) {
        inFlightRequest = null;
        inFlightStoreSlug = "";
      }
    });

  inFlightRequest = request;
  inFlightStoreSlug = storeSlug;
  return request;
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

export function getPricingAccessState() {
  return pricingAccessState;
}

export function setPricingRemoveLogo(value) {
  const normalized = normalizeRemoveLogo(value);
  if (normalized !== null) {
    pricingAccessState.removeLogo = normalized;
  }
}

export async function refreshPriceConfig({ parentUrl } = {}) {
  return initPriceConfig({ force: true, parentUrl });
}
