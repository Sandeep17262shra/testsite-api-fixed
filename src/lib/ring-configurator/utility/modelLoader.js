const SECRET_KEY = 'r!ng$3cur3K3y#2024XoR';
const preloadCache = new Map();
// Retain an in-flight request as well as completed buffers. This lets a shopper
// reuse a speculative download instead of starting a second request for the
// same model when they make a selection.
const pendingPreloads = new Map();
const plainPending = new Map();
const rawPreloadCache = new Set();
const backgroundQueue = [];
const queuedPaths = new Set();
// Paths a shopper selection is actively waiting on. A background download for
// one of these has been adopted by the foreground, so aborting it would throw
// away a partially finished transfer and restart the same file from zero —
// exactly what turned a large head model into a minute-long load.
const foregroundPaths = new Set();
const MAX_BUFFER_CACHE_ENTRIES = 12;
let backgroundController = null;
let backgroundRequest = null;
let backgroundScheduleId = null;
let backgroundPaused = false;

function xorDecrypt(arrayBuffer) {
  const keyBytes = new TextEncoder().encode(SECRET_KEY);
  const view = new Uint8Array(arrayBuffer);
  const result = new Uint8Array(view.length);
  for (let i = 0; i < view.length; i++) {
    result[i] = view[i] ^ keyBytes[i % keyBytes.length];
  }
  return result.buffer;
}

function cacheBuffer(path, buffer) {
  preloadCache.set(path, buffer);
  while (preloadCache.size > MAX_BUFFER_CACHE_ENTRIES) {
    const oldestPath = preloadCache.keys().next().value;
    if (oldestPath === path) break;
    preloadCache.delete(oldestPath);
  }
}

export function toEncPath(path) {
  return path.replace(/\.(glb|obj)$/, '.enc');
}

// Cache-busting version for every model URL.
//
// next.config.mjs serves /3d-models/* with `Cache-Control: public,
// max-age=31536000, immutable`. Compressing the models replaced their CONTENTS
// but kept their FILENAMES, and `immutable` tells the browser never to
// revalidate — so a returning shopper keeps rendering the old, multi-megabyte
// copy already in their cache and never sees the compressed one. Appending a
// version changes the cache key so the smaller file is actually fetched.
//
// BUMP THIS whenever a model file is re-exported or re-compressed in place.
const ASSET_VERSION = '14';

function versioned(url) {
  return `${url}${url.includes('?') ? '&' : '?'}v=${ASSET_VERSION}`;
}

function queueKeyFor(path, encrypted) {
  return `${encrypted ? 'encrypted' : 'raw'}:${path}`;
}

// Stop whatever the background queue is doing right now. The interrupted asset
// goes back to the front of the queue so a paused preload resumes where it left
// off instead of silently losing that model.
function stopBackgroundRequest({ requeue = true } = {}) {
  if (backgroundScheduleId !== null) {
    window.clearTimeout(backgroundScheduleId);
    backgroundScheduleId = null;
  }
  if (!backgroundController) return;

  if (backgroundRequest && foregroundPaths.has(backgroundRequest.path)) {
    // Adopted by the foreground — let it finish, it is now the shopper's own
    // download rather than speculative work.
    return;
  }

  const interrupted = backgroundRequest;
  const controller = backgroundController;
  backgroundController = null;
  backgroundRequest = null;
  controller.abort();

  if (requeue && interrupted) {
    const key = queueKeyFor(interrupted.path, interrupted.encrypted);
    if (!queuedPaths.has(key)) {
      backgroundQueue.unshift(interrupted);
      queuedPaths.add(key);
    }
  }
}

/** Hold all speculative downloading — used while a shopper selection loads. */
export function pauseBackgroundPreload() {
  if (backgroundPaused) return;
  backgroundPaused = true;
  stopBackgroundRequest();
}

/** Resume speculative downloading once the selected ring is on screen. */
export function resumeBackgroundPreload() {
  if (!backgroundPaused) return;
  backgroundPaused = false;
  scheduleBackgroundPreload();
}

export async function fetchDecrypted(path, signal) {
  // 1. Check JS map cache
  if (preloadCache.has(path)) return preloadCache.get(path);

  // 2. Check window cache from index.html early preload
  if (window.__modelCache?.[path]) return window.__modelCache[path];

  foregroundPaths.add(path);
  try {
    // Reuse an active background preload for this exact asset. If that shared
    // request was aborted meanwhile, fall through and fetch it properly.
    if (pendingPreloads.has(path)) {
      try {
        return await pendingPreloads.get(path);
      } catch {
        /* fall through to a fresh request */
      }
    }

    // A shopper's selection always takes precedence over speculative loading.
    if (backgroundRequest && backgroundRequest.path !== path) stopBackgroundRequest();

    // 3. Fetch and decrypt encrypted model
    return await preloadModel(path, signal);
  } finally {
    foregroundPaths.delete(path);
  }
}

export async function preloadModel(path, signal) {
  if (preloadCache.has(path)) return preloadCache.get(path);
  if (window.__modelCache?.[path]) return window.__modelCache[path];
  if (pendingPreloads.has(path)) {
    try {
      return await pendingPreloads.get(path);
    } catch {
      /* fall through to a fresh request */
    }
  }

  const request = (async () => {
    const encPath = toEncPath(path);
    const response = await fetch(versioned(encPath), { signal });
    if (!response.ok) throw new Error(`Failed to fetch: ${encPath} (${response.status})`);
    const encrypted = await response.arrayBuffer();
    const decrypted = xorDecrypt(encrypted);
    cacheBuffer(path, decrypted);
    return decrypted;
  })();

  pendingPreloads.set(path, request);
  // Drop a failed request from the dedupe map immediately so the next caller
  // starts a clean fetch rather than inheriting the rejection.
  request.catch(() => {
    if (pendingPreloads.get(path) === request) pendingPreloads.delete(path);
  });

  try {
    return await request;
  } finally {
    if (pendingPreloads.get(path) === request) pendingPreloads.delete(path);
  }
}

/**
 * Fetch an unencrypted asset (DiamondWise GLBs, .obj diamonds). Requests for the
 * same path are shared, and the browser cache does the rest on repeat visits.
 */
export async function fetchPlainBuffer(path, signal) {
  foregroundPaths.add(path);
  try {
    return await fetchPlainBufferInner(path, signal);
  } finally {
    foregroundPaths.delete(path);
  }
}

async function fetchPlainBufferInner(path, signal) {
  if (plainPending.has(path)) {
    try {
      return await plainPending.get(path);
    } catch {
      /* fall through to a fresh request */
    }
  }

  if (backgroundRequest && backgroundRequest.path !== path) stopBackgroundRequest();

  const request = (async () => {
    const response = await fetch(versioned(path), { signal, cache: 'force-cache' });
    if (!response.ok) throw new Error(`Failed to fetch: ${path} (${response.status})`);
    const buffer = await response.arrayBuffer();
    rawPreloadCache.add(path);
    return buffer;
  })();

  plainPending.set(path, request);
  request.catch(() => {
    if (plainPending.get(path) === request) plainPending.delete(path);
  });

  try {
    return await request;
  } finally {
    if (plainPending.get(path) === request) plainPending.delete(path);
  }
}

async function preloadRawModel(path, signal) {
  if (rawPreloadCache.has(path)) return;

  const response = await fetch(versioned(path), { signal, cache: "force-cache" });
  if (!response.ok) throw new Error(`Failed to preload: ${path} (${response.status})`);
  await response.arrayBuffer();
  rawPreloadCache.add(path);
}

function scheduleBackgroundPreload() {
  if (backgroundPaused) return;
  if (backgroundController || backgroundScheduleId !== null || backgroundQueue.length === 0) return;

  const run = () => {
    backgroundScheduleId = null;
    if (backgroundPaused) return;
    const request = backgroundQueue.shift();
    if (!request) return;
    const { path, encrypted } = request;
    queuedPaths.delete(queueKeyFor(path, encrypted));

    if (
      (encrypted && (preloadCache.has(path) || window.__modelCache?.[path])) ||
      (!encrypted && rawPreloadCache.has(path))
    ) {
      scheduleBackgroundPreload();
      return;
    }

    const controller = new AbortController();
    backgroundController = controller;
    backgroundRequest = request;
    (encrypted ? preloadModel(path, controller.signal) : preloadRawModel(path, controller.signal))
      .catch((error) => {
        if (error?.name !== "AbortError") console.warn(`Unable to preload model: ${path}`, error);
      })
      .finally(() => {
        if (backgroundController === controller) {
          backgroundController = null;
          backgroundRequest = null;
        }
        scheduleBackgroundPreload();
      });
  };

  // The continuously rendering 3D canvas can starve requestIdleCallback.
  // A short timer keeps this low-volume queue progressing reliably.
  backgroundScheduleId = window.setTimeout(run, 250);
}

/**
 * Speculative preloading is a bandwidth bet. On a metered or slow connection it
 * loses: every speculative byte competes with the model the shopper is actually
 * waiting for. Callers use this to decide how much (if anything) to warm up.
 */
export function getPreloadBudget() {
  if (typeof navigator === "undefined") return "full";
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) return "full";
  if (connection.saveData) return "none";
  const effectiveType = connection.effectiveType || "";
  if (effectiveType === "slow-2g" || effectiveType === "2g") return "none";
  if (effectiveType === "3g") return "essential";
  return "full";
}

export function queueModelPreload(paths) {
  for (const path of paths) {
    const key = queueKeyFor(path, true);
    if (!path || preloadCache.has(path) || window.__modelCache?.[path] || queuedPaths.has(key)) continue;
    backgroundQueue.push({ path, encrypted: true });
    queuedPaths.add(key);
  }
  scheduleBackgroundPreload();
}

export function cancelQueuedModelPreloads() {
  stopBackgroundRequest({ requeue: false });
  backgroundQueue.length = 0;
  queuedPaths.clear();
}

/** Queue public GLB files for browser-cache warming, one file at a time. */
export function queueRawModelPreload(paths) {
  for (const path of paths) {
    const key = queueKeyFor(path, false);
    if (!path || rawPreloadCache.has(path) || queuedPaths.has(key)) continue;
    backgroundQueue.push({ path, encrypted: false });
    queuedPaths.add(key);
  }
  scheduleBackgroundPreload();
}
