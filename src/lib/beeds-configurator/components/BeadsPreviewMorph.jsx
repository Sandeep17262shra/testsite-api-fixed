"use client";

import dynamic from "next/dynamic";
import React, { useContext, useEffect, useRef, useState } from "react";
import BeadsPreview2D from "./BeadsPreview2D";
import { View360Context } from "../contexts/View360Context";
const BeadsPreview3D = dynamic(() => import("./BeadsPreview3D"), {
  ssr: false,
  loading: () => (
    <div className="beads-3d-preview beads-3d-preview--loading" aria-hidden="true" />
  ),
});

const MORPH_DURATION_MS = 420;

function prefetchBeadsPreview3D() {
  import("./BeadsPreview3D").catch(() => {});
}

function prefersReducedMotion() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Crossfades 2D ↔ 3D with a shared perspective tilt so the 360 toggle feels like one view morphing.
 */
function BeadsPreviewDescriptionOverlay({ visible, previewLabel }) {
  if (!visible || !previewLabel) {
    return null;
  }

  return (
    <div className="theme3-preview-caption beads-preview-desc-overlay" aria-live="polite">
      <strong>{previewLabel}</strong>
    </div>
  );
}

export default function BeadsPreviewMorph({ previewLabel = "" }) {
  const { view360 } = useContext(View360Context);
  const [show2d, setShow2d] = useState(true);
  const [morphing, setMorphing] = useState(false);
  /** Visual end state. Flips one frame after both layers are mounted so CSS can transition. */
  const [settled3d, setSettled3d] = useState(view360);
  const skipMountEffectRef = useRef(true);

  useEffect(() => {
    prefetchBeadsPreview3D();
  }, []);

  useEffect(() => {
    if (skipMountEffectRef.current) {
      skipMountEffectRef.current = false;
      return undefined;
    }

    let rafId = 0;
    let timerId = 0;

    if (prefersReducedMotion()) {
      setMorphing(false);
      setSettled3d(view360);
      setShow2d(!view360);
      return undefined;
    }

    setShow2d(true);
    setMorphing(true);
    rafId = requestAnimationFrame(() => {
      setSettled3d(view360);
    });
    timerId = window.setTimeout(() => {
      setMorphing(false);
      setShow2d(!view360);
    }, MORPH_DURATION_MS + 40);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
    };
  }, [view360]);

  return (
    <div
      className={`beads-preview-morph${morphing ? " is-morphing" : ""}${settled3d ? " is-3d-active" : " is-2d-active"}`}
      aria-busy={morphing}
    >
      <BeadsPreviewDescriptionOverlay
        visible={settled3d}
        previewLabel={previewLabel}
      />
      {show2d ? (
        <div
          className="beads-preview-morph__layer beads-preview-morph__layer--2d"
          aria-hidden={settled3d}
        >
          <BeadsPreview2D />
        </div>
      ) : null}
      <div
        className="beads-preview-morph__layer beads-preview-morph__layer--3d"
        aria-hidden={!settled3d}
      >
        <BeadsPreview3D active={settled3d || morphing} />
      </div>
    </div>
  );
}
