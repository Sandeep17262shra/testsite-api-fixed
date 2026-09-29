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

const MORPH_DURATION_MS = 620;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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
  const progressRef = useRef(view360 ? 1 : 0);
  const [progress, setProgress] = useState(view360 ? 1 : 0);
  const [show2d, setShow2d] = useState(!view360);
  const [show3d, setShow3d] = useState(view360);
  const rafRef = useRef(null);

  useEffect(() => {
    const target = view360 ? 1 : 0;
    const from = progressRef.current;

    if (Math.abs(target - from) < 0.001) {
      setShow2d(target < 1);
      setShow3d(target > 0);
      return undefined;
    }

    if (target === 1) {
      setShow3d(true);
      setShow2d(true);
    } else {
      setShow2d(true);
      setShow3d(true);
    }

    const duration = prefersReducedMotion() ? 0 : MORPH_DURATION_MS;
    const start = performance.now();

    const finish = (value) => {
      progressRef.current = value;
      setProgress(value);
      setShow2d(value < 1);
      setShow3d(value > 0);
    };

    if (duration <= 0) {
      finish(target);
      return undefined;
    }

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const value = from + (target - from) * easeInOutCubic(t);
      progressRef.current = value;
      setProgress(value);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        finish(target);
      }
    };

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [view360]);

  const morphing = progress > 0.02 && progress < 0.98;
  const p2d = 1 - progress;
  const p3d = progress;

  return (
    <div
      className={`beads-preview-morph${morphing ? " is-morphing" : ""}${view360 ? " is-3d-active" : " is-2d-active"}`}
      style={{ "--morph-p": progress }}
      aria-busy={morphing}
    >
      <BeadsPreviewDescriptionOverlay
        visible={view360 && progress > 0.55}
        previewLabel={previewLabel}
      />
      {show2d ? (
        <div
          className="beads-preview-morph__layer beads-preview-morph__layer--2d"
          style={{
            opacity: p2d,
            transform: `translate3d(0, ${progress * -14}px, 0) scale(${1 - progress * 0.045}) rotateX(${progress * -16}deg)`,
            pointerEvents: !view360 && progress < 0.45 ? "auto" : "none",
          }}
          aria-hidden={progress > 0.92}
        >
          <BeadsPreview2D />
        </div>
      ) : null}
      {show3d ? (
        <div
          className="beads-preview-morph__layer beads-preview-morph__layer--3d"
          style={{
            opacity: p3d,
            transform: `translate3d(0, ${(1 - progress) * 18}px, 0) scale(${0.93 + progress * 0.07}) rotateX(${(1 - progress) * 20}deg)`,
            pointerEvents: view360 && progress > 0.55 ? "auto" : "none",
          }}
          aria-hidden={progress < 0.08}
        >
          <BeadsPreview3D />
        </div>
      ) : null}
    </div>
  );
}
