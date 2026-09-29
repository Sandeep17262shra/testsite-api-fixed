const BACKEND_CONTRACT_PENDING =
  "Backend contract is pending senior/backend confirmation. Local/static fallback remains the current source of truth.";

const ENDPOINTS = {
  config: process.env.NEXT_PUBLIC_RING_CONFIG_API_URL || "",
  pricing: process.env.NEXT_PUBLIC_RING_PRICING_API_URL || "",
  saveConfig: process.env.NEXT_PUBLIC_RING_SAVE_CONFIG_API_URL || "",
  continue: process.env.NEXT_PUBLIC_RING_CONTINUE_API_URL || "",
  cart: process.env.NEXT_PUBLIC_RING_CART_API_URL || "",
};

const SKIPPED_REASON = "missing_endpoint";

function skippedResult(envName, purpose) {
  return {
    ok: false,
    skipped: true,
    reason: SKIPPED_REASON,
    envName,
    purpose,
    fallback: "local-static",
    message: `${envName} is not configured. ${BACKEND_CONTRACT_PENDING}`,
  };
}

function appendQueryParams(url, params = {}) {
  const nextUrl = new URL(url);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    nextUrl.searchParams.set(key, String(value));
  });

  return nextUrl.toString();
}

async function requestJson(url, { method = "POST", body, headers, signal } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();

  return {
    ok: response.ok,
    skipped: false,
    status: response.status,
    statusText: response.statusText,
    data,
  };
}

/**
 * Optional backend config fetch scaffolding.
 *
 * This does not run unless explicitly called. If
 * NEXT_PUBLIC_RING_CONFIG_API_URL is missing, it returns a skipped result so
 * the app can keep using local/static config.
 *
 * TODO: confirm auth, storeId/tenant identifier, CORS/origin rules, and final
 * option/config response schema with senior/backend team.
 */
export async function fetchBackendConfig(params = {}, options = {}) {
  const endpoint = ENDPOINTS.config;
  if (!endpoint) return skippedResult("NEXT_PUBLIC_RING_CONFIG_API_URL", "config");

  return requestJson(appendQueryParams(endpoint, params), {
    method: "GET",
    headers: options.headers,
    signal: options.signal,
  });
}

/**
 * Optional backend pricing quote scaffolding.
 *
 * This does not replace local pricing and does not make remote pricing active.
 * Totals from the current configurator remain local/demo totals until a quote
 * API contract is approved.
 *
 * TODO: confirm quoteId behavior, tax/markup/currency rules, storeId, auth,
 * CORS/origin rules, and failure fallback behavior.
 */
export async function calculateBackendPrice(payload = {}, options = {}) {
  const endpoint = ENDPOINTS.pricing;
  if (!endpoint) return skippedResult("NEXT_PUBLIC_RING_PRICING_API_URL", "pricing");

  return requestJson(endpoint, {
    method: "POST",
    body: payload,
    headers: options.headers,
    signal: options.signal,
  });
}

/**
 * Optional save/share configuration scaffolding.
 *
 * This does not change current Share behavior. Existing Base64 config URLs
 * remain the current behavior until a backend save/share API is approved.
 *
 * TODO: confirm configurationId, persistence/expiry, auth, storeId, CORS/origin
 * rules, and backward compatibility for current shared URLs.
 */
export async function saveBackendConfiguration(payload = {}, options = {}) {
  const endpoint = ENDPOINTS.saveConfig;
  if (!endpoint) return skippedResult("NEXT_PUBLIC_RING_SAVE_CONFIG_API_URL", "save-configuration");

  return requestJson(endpoint, {
    method: "POST",
    body: payload,
    headers: options.headers,
    signal: options.signal,
  });
}

/**
 * Optional Ring Builder continuation scaffolding.
 *
 * This does not change the current Choose Diamond postMessage behavior.
 *
 * TODO: confirm whether continuation should use postMessage, redirect,
 * backend session/configurationId, quoteId, or a combination.
 */
export async function continueToRingBuilder(payload = {}, options = {}) {
  const endpoint = ENDPOINTS.continue;
  if (!endpoint) return skippedResult("NEXT_PUBLIC_RING_CONTINUE_API_URL", "continue");

  return requestJson(endpoint, {
    method: "POST",
    body: payload,
    headers: options.headers,
    signal: options.signal,
  });
}

/**
 * Optional Add to Cart scaffolding.
 *
 * This does not change Add to Cart behavior. The configured ring/cart contract
 * is pending confirmation and should not be called from UI until product SKUs,
 * variant IDs, final diamond IDs, configurationId, quoteId, cartId, auth, and
 * CORS/origin rules are approved.
 */
export async function addConfiguredRingToCart(payload = {}, options = {}) {
  const endpoint = ENDPOINTS.cart;
  if (!endpoint) return skippedResult("NEXT_PUBLIC_RING_CART_API_URL", "cart");

  return requestJson(endpoint, {
    method: "POST",
    body: payload,
    headers: options.headers,
    signal: options.signal,
  });
}

