/**
 * Store appearance colours from the common-admin appearance-page endpoint only.
 */

import { getPricingApiStore } from "./priceApiClient.js";
import { normalizeAppearance } from "./contexts/StoreContext.jsx";
import { extractHeadingTypography } from "./headingTypography.js";
import { extractButtonTypography } from "./buttonTypography.js";
import { extractBodyTypography } from "./bodyTypography.js";
import { extractLinkTypography } from "./linkTypography.js";

const APPEARANCE_ROUTE = "/api/ring-appearance";

let themePageCache = null;
let appearanceStoreKey = "";
let appearanceInFlight = null;
let appearanceInFlightStoreKey = "";

const hasAppearanceColorKeys = (value) =>
  value &&
  typeof value === "object" &&
  (value.primaryColor ||
    value.primary_color ||
    value.secondaryColor ||
    value.secondary_color ||
    value.hoverSecondaryColor ||
    value.hover_secondary_color);

/** Pull colour fields from the appearance-page API envelope. */
export function extractAppearancePagePayload(response) {
  if (!response) return null;

  let parsed = response;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }

  if (!parsed || typeof parsed !== "object") return null;

  if (hasAppearanceColorKeys(parsed)) {
    return parsed;
  }

  if (hasAppearanceColorKeys(parsed.appearance)) {
    return parsed.appearance;
  }

  const candidates = [
    parsed.data,
    parsed.settings,
    parsed.appearance,
    parsed.result,
    parsed.data?.settings,
    parsed.data?.appearance,
    parsed.result?.data,
  ];

  for (const candidate of candidates) {
    if (hasAppearanceColorKeys(candidate)) {
      return candidate;
    }
  }

  return null;
}

const fetchRemoteAppearance = (store) =>
  fetch(`${APPEARANCE_ROUTE}?${new URLSearchParams({ store }).toString()}`)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Appearance config request failed: ${res.status} ${res.statusText}`);
      }
      return res.json();
    })
    .then((data) => ({
      appearance: normalizeAppearance(extractAppearancePagePayload(data)),
      heading: extractHeadingTypography(data),
      button: extractButtonTypography(data),
      body: extractBodyTypography(data),
      links: extractLinkTypography(data),
    }));

export async function initAppearanceConfig({
  force = false,
  parentUrl,
  shop,
  canonicalShop,
} = {}) {
  const canonicalStore = getPricingApiStore({ shop: canonicalShop });
  const parentStore = getPricingApiStore({ parentUrl: parentUrl || shop });
  const primaryStore = canonicalStore || parentStore;
  const fallbackStore =
    canonicalStore && parentStore && canonicalStore !== parentStore ? parentStore : "";

  if (!primaryStore) {
    themePageCache = null;
    appearanceStoreKey = "";
    return null;
  }

  const cacheKey = `${canonicalStore || "none"}|${parentStore || "none"}`;
  if (!force && themePageCache !== null && appearanceStoreKey === cacheKey) {
    return themePageCache;
  }
  if (!force && appearanceInFlight && appearanceInFlightStoreKey === cacheKey) {
    return appearanceInFlight;
  }

  const request = fetchRemoteAppearance(primaryStore)
    .then((themePage) => {
      if (
        !themePage?.appearance &&
        !themePage?.heading &&
        !themePage?.button &&
        !themePage?.body &&
        !themePage?.links &&
        fallbackStore
      ) {
        return fetchRemoteAppearance(fallbackStore);
      }
      return themePage;
    })
    .then((themePage) => {
      themePageCache = themePage;
      appearanceStoreKey = cacheKey;
      return themePage;
    })
    .catch((error) => {
      console.warn("[appearanceApiClient] Appearance fetch failed:", error);
      themePageCache = null;
      appearanceStoreKey = cacheKey;
      return null;
    })
    .finally(() => {
      if (appearanceInFlight === request) {
        appearanceInFlight = null;
        appearanceInFlightStoreKey = "";
      }
    });

  appearanceInFlight = request;
  appearanceInFlightStoreKey = cacheKey;
  return request;
}

export function getAppearanceCache() {
  return themePageCache?.appearance ?? null;
}

export function getHeadingTypographyCache() {
  return themePageCache?.heading ?? null;
}

export function getButtonTypographyCache() {
  return themePageCache?.button ?? null;
}
