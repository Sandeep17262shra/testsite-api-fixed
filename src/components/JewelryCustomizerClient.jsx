"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  JEWELRY_SHELL_MESSAGE,
  JEWELRY_TYPE_SWITCH_MESSAGE,
  buildJewelryFrameSrc,
  jewelryAppForCategory,
  normalizeJewelryCategory,
  readStoredJewelryCategory,
  storeJewelryCategory,
} from "@/lib/jewelry-shell/jewelryCategoryBus";

const SHELL_STYLE = {
  position: "fixed",
  inset: 0,
  width: "100%",
  height: "100%",
  overflow: "hidden",
  background: "#fff",
};

const frameStyle = (visible) => ({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  border: 0,
  // display:none stops the nested iframe document from being "rendered" at
  // all, so its position:fixed / 100dvh root gets its viewport torn down;
  // flipping back to display:block forces a full style/layout/paint of the
  // whole document, which is the CSS "reload" flash. visibility keeps the
  // frame's browsing context laid out (so nothing gets invalidated) while
  // still hiding it from view and from pointer/keyboard interaction.
  visibility: visible ? "visible" : "hidden",
});

/**
 * One url, three configurators. Each app runs in its own frame (their global
 * stylesheets collide — see lib/jewelry-shell/jewelryCategoryBus.js), a frame is
 * created the first time its app is opened and then kept, so switching back is
 * instant and the url never changes.
 */
export default function JewelryCustomizerClient() {
  const [category, setCategory] = useState(null);
  const [necklaceType, setNecklaceType] = useState(null);
  const [opened, setOpened] = useState({ necklace: false, beads: false });

  const initialAppRef = useRef(null);
  const frameRefs = useRef({ necklace: null, beads: null });
  // The necklace/bracelet frame is created once with this type baked into its
  // `src` and then never given a new `src` again — changing an already-loaded
  // iframe's src forces a real navigation (grey flash while it reloads).
  // Later necklace <-> bracelet switches go through the postMessage effect
  // below instead. Frozen the first time the necklace app is opened.
  const necklaceSrcTypeRef = useRef(null);

  const openCategory = useCallback((next, { persist = true } = {}) => {
    const wanted = normalizeJewelryCategory(next);
    if (persist) storeJewelryCategory(wanted);

    const app = jewelryAppForCategory(wanted);
    if (app === "necklace") {
      if (necklaceSrcTypeRef.current === null) {
        necklaceSrcTypeRef.current = wanted === "bracelet" ? "bracelet" : "necklace";
      }
      setNecklaceType(wanted);
    }
    setOpened((prev) => (prev[app] ? prev : { ...prev, [app]: true }));
    setCategory(wanted);
  }, []);

  // Tell an already-open necklace frame to switch type in place (see the ref
  // comment above) instead of us ever touching its `src` again.
  useEffect(() => {
    const frame = frameRefs.current.necklace;
    if (!opened.necklace || !frame?.contentWindow) return;
    frame.contentWindow.postMessage(
      { type: JEWELRY_TYPE_SWITCH_MESSAGE, jewelryType: necklaceType },
      "*"
    );
  }, [necklaceType, opened.necklace]);

  useEffect(() => {
    const initial = readStoredJewelryCategory();
    initialAppRef.current = jewelryAppForCategory(initial);
    openCategory(initial, { persist: false });
  }, [openCategory]);

  // The frames think they are embedded straight into the store, so relay their
  // messages (add to cart, scroll) up and the store's messages (parentUrl) down.
  useEffect(() => {
    const isEmbedded = window.self !== window.top;

    const onMessage = (event) => {
      const frames = Object.values(frameRefs.current);
      const fromFrame = frames.some((node) => node && node.contentWindow === event.source);

      if (fromFrame) {
        if (event.data?.type === JEWELRY_SHELL_MESSAGE) {
          const category = normalizeJewelryCategory(event.data.category);
          if (event.data.switch) {
            openCategory(category);
          } else {
            // In-app necklace <-> bracelet switch (no frame swap): the frame
            // already updated itself, but the shell's own necklaceType must
            // track it too, or a later cross-app return to "the same" type
            // (per this now-stale state) is treated as a no-op and the frame
            // never gets told to switch back — it stays on whatever it was
            // last shown internally.
            storeJewelryCategory(category);
            if (jewelryAppForCategory(category) === "necklace") setNecklaceType(category);
          }
          return;
        }
        if (isEmbedded) {
          try { window.parent.postMessage(event.data, "*"); } catch (error) { /* ignore */ }
        }
        return;
      }

      if (isEmbedded && event.source === window.parent) {
        frames.forEach((node) => {
          try { node?.contentWindow?.postMessage(event.data, "*"); } catch (error) { /* ignore */ }
        });
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [openCategory]);

  if (!category) return null;

  const activeApp = jewelryAppForCategory(category);

  return (
    <div style={SHELL_STYLE}>
      {opened.necklace && (
        <iframe
          key="necklace"
          ref={(node) => { frameRefs.current.necklace = node; }}
          title="Necklace and bracelet configurator"
          src={buildJewelryFrameSrc("necklace", {
            type: necklaceSrcTypeRef.current ?? (necklaceType === "bracelet" ? "bracelet" : "necklace"),
            includeConfig: initialAppRef.current === "necklace",
          })}
          style={frameStyle(activeApp === "necklace")}
          allow="xr-spatial-tracking; fullscreen; clipboard-write"
        />
      )}
      {opened.beads && (
        <iframe
          key="beads"
          ref={(node) => { frameRefs.current.beads = node; }}
          title="Bead bracelet configurator"
          src={buildJewelryFrameSrc("beads", {
            includeConfig: initialAppRef.current === "beads",
          })}
          style={frameStyle(activeApp === "beads")}
          allow="xr-spatial-tracking; fullscreen; clipboard-write"
        />
      )}
    </div>
  );
}
