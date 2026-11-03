import {
  BEADS,
  BEAD_CHARMS,
  DEFAULT_BEAD_KEY,
  DEFAULT_CHARM_KEY,
  DEFAULT_SEPARATOR_KEY,
  SEPARATORS,
} from "./assets";

const warmedUrls = new Set();
const decodedUrls = new Set();
const decodePromises = new Map();

function scheduleIdle(task) {
  if (typeof window === "undefined") {
    return;
  }
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => task(), { timeout: 2500 });
    return;
  }
  window.setTimeout(task, 0);
}

function finishImageDecode(img, url, resolve) {
  if (typeof img.decode === "function") {
    img
      .decode()
      .catch(() => {})
      .finally(() => {
        decodedUrls.add(url);
        resolve();
      });
    return;
  }
  decodedUrls.add(url);
  resolve();
}

/** True once the URL has been fetched and decoded for at least one consumer. */
export function isBeadImageDecoded(url) {
  return Boolean(url && decodedUrls.has(url));
}

/**
 * Fetch + decode a catalog image. Shared across the ring preview and picker so cold
 * live loads do not paint drop shadows before WebP art is ready.
 */
export function ensureBeadImageReady(url) {
  if (!url) {
    return Promise.resolve();
  }
  if (decodedUrls.has(url)) {
    return Promise.resolve();
  }
  const pending = decodePromises.get(url);
  if (pending) {
    return pending;
  }

  warmedUrls.add(url);

  const promise = new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";

    const done = () => finishImageDecode(img, url, resolve);

    img.onload = done;
    img.onerror = () => {
      decodedUrls.add(url);
      resolve();
    };

    img.src = url;
    if (img.complete && img.naturalWidth > 0) {
      done();
    }
  });

  decodePromises.set(url, promise);
  promise.finally(() => {
    decodePromises.delete(url);
  });

  return promise;
}

export function ensureBeadImagesReady(urls) {
  const unique = [...new Set(urls.filter(Boolean))];
  if (!unique.length) {
    return Promise.resolve();
  }
  return Promise.all(unique.map((url) => ensureBeadImageReady(url)));
}

/** Best-effort HTTP cache warm — failures must not affect the configurator. */
export function preloadBeadImageUrl(url) {
  if (!url || warmedUrls.has(url)) {
    return;
  }
  ensureBeadImageReady(url).catch(() => {});
}

/** Start loading default full-bead art as early as possible (live / embed first paint). */
export function preloadCriticalBeadsConfiguratorImages() {
  if (typeof window === "undefined") {
    return;
  }

  const bead =
    BEADS.find((entry) => entry.key === DEFAULT_BEAD_KEY) || BEADS[0];
  const separator =
    SEPARATORS.find((entry) => entry.key === DEFAULT_SEPARATOR_KEY) || SEPARATORS[0];
  const charm =
    BEAD_CHARMS.find((entry) => entry.key === DEFAULT_CHARM_KEY) || BEAD_CHARMS[0];

  [bead?.image, separator?.image, charm?.image]
    .filter(Boolean)
    .forEach((url) => {
      preloadBeadImageUrl(url);
    });
}

/**
 * Warm bead, spacer, and charm thumbnails after first paint so the ring and picker
 * reuse cached responses instead of dozens of cold requests on live.
 */
export function preloadBeadsConfiguratorAssets({
  beadUrls = [],
  spacerUrls = [],
  charmUrls = [],
} = {}) {
  if (typeof window === "undefined") {
    return;
  }

  preloadCriticalBeadsConfiguratorImages();

  const unique = [...new Set([...beadUrls, ...spacerUrls, ...charmUrls].filter(Boolean))];
  if (!unique.length) {
    return;
  }

  scheduleIdle(() => {
    unique.forEach((url) => {
      try {
        preloadBeadImageUrl(url);
      } catch {
        // ignore
      }
    });
  });
}
