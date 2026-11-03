import { useLayoutEffect, useMemo, useState } from "react";

import { ensureBeadImagesReady, isBeadImageDecoded } from "./beadAssetPreload";

function collectRingPreviewImageUrls(ringItems, charmPendants) {
  const urls = new Set();
  ringItems.forEach((item) => {
    if (item.asset?.image) {
      urls.add(item.asset.image);
    }
  });
  charmPendants.forEach(({ item }) => {
    if (item.asset?.image) {
      urls.add(item.asset.image);
    }
  });
  return [...urls];
}

/**
 * Keeps bead faces and their drop shadows hidden until every visible catalog image
 * in the ring has decoded — avoids “shadow ring then beads pop in” on cold loads.
 */
export function useRingPreviewArtReady(ringItems, charmPendants) {
  const imageUrls = useMemo(
    () => collectRingPreviewImageUrls(ringItems, charmPendants),
    [ringItems, charmPendants]
  );
  const imageUrlsKey = imageUrls.join("\0");

  const [artReady, setArtReady] = useState(() =>
    imageUrls.length > 0 && imageUrls.every((url) => isBeadImageDecoded(url))
  );

  useLayoutEffect(() => {
    if (!imageUrls.length) {
      setArtReady(true);
      return undefined;
    }

    if (imageUrls.every((url) => isBeadImageDecoded(url))) {
      setArtReady(true);
      return undefined;
    }

    let cancelled = false;
    setArtReady(false);

    ensureBeadImagesReady(imageUrls).then(() => {
      if (!cancelled) {
        setArtReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [imageUrlsKey]);

  return artReady;
}
