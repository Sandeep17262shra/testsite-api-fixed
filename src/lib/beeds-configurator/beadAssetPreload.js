const warmedUrls = new Set();

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

/** Best-effort HTTP cache warm — failures must not affect the configurator. */
export function preloadBeadImageUrl(url) {
  if (!url || warmedUrls.has(url)) {
    return;
  }
  warmedUrls.add(url);

  const img = new Image();
  img.decoding = "async";
  img.src = url;
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
