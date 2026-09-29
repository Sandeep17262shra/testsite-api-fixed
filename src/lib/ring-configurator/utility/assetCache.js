// Shared, module-level cache for parsed 3D assets.
//
// Every part of the ring loads through here so that:
//   • the same asset is never downloaded or parsed twice,
//   • two components asking for the same asset share one request,
//   • a completed asset stays available for instant re-selection,
//   • the scene can render straight from the cache for whatever configuration
//     is currently *displayed*, while a different one is still loading.

const caches = new Map();
const inflight = new Map();

export function getCachedAsset(namespace, key) {
  if (!key) return undefined;
  return caches.get(namespace)?.get(key);
}

export function hasCachedAsset(namespace, key) {
  return getCachedAsset(namespace, key) !== undefined;
}

// A single dropped connection must not leave a part permanently missing from
// the ring: nothing re-requests an asset once its component has reported ready,
// so a one-off network failure is retried here instead.
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 700;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadWithRetry(id, load) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const value = await load();
      if (value === undefined || value === null) throw new Error(`Empty asset: ${id}`);
      return value;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) {
        console.warn(`[asset-cache] retrying ${id} (attempt ${attempt + 1}/${MAX_ATTEMPTS})`, error);
        await wait(RETRY_DELAY_MS * attempt);
      }
    }
  }
  throw lastError;
}

export function ensureAsset(namespace, key, load) {
  const cached = getCachedAsset(namespace, key);
  if (cached !== undefined) return Promise.resolve(cached);

  const id = `${namespace}::${key}`;
  const existing = inflight.get(id);
  if (existing) return existing;

  const request = loadWithRetry(id, load)
    .then((value) => {
      if (!caches.has(namespace)) caches.set(namespace, new Map());
      caches.get(namespace).set(key, value);
      inflight.delete(id);
      return value;
    })
    .catch((error) => {
      inflight.delete(id);
      throw error;
    });

  inflight.set(id, request);
  return request;
}
