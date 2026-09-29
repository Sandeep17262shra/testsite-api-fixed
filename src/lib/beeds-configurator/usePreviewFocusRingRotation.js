"use client";

import { useEffect, useRef, useState } from "react";
import {
  PREVIEW_FOCUS_ANIM_MS,
  easeInOutCubic,
  getRingRotationToFocusItem,
  getShortestRotationDelta,
} from "./previewFocus";

const PREVIEW_FOCUS_MIN_ROTATE_DEG = 2.5;
import { usePreviewFocus } from "./contexts/PreviewFocusContext";

function resolveFocusItem(settledItems, pattern, focusItemId, focusPatternIndex) {
  if (focusItemId) {
    const byId = settledItems.find((item) => item.id === focusItemId);
    if (byId) {
      return byId;
    }
  }
  if (focusPatternIndex != null && pattern[focusPatternIndex]) {
    const entry = pattern[focusPatternIndex];
    if (entry?.id) {
      return settledItems.find((item) => item.id === entry.id) ?? null;
    }
  }
  return null;
}

/**
 * Animates ring rotation toward a customization focus target (shared by 2D + 3D previews).
 */
export function usePreviewFocusRingRotation({
  settledItems,
  pattern,
  rotationDeg,
  setRotationDeg,
  rotationRef,
  suppressFocus = false,
  frontAngleDeg,
}) {
  const { focusItemId, focusPatternIndex, focusUntil } = usePreviewFocus();
  const [focusLockActive, setFocusLockActive] = useState(false);
  const animRef = useRef(null);
  const holdTimerRef = useRef(null);
  const focusUntilRef = useRef(focusUntil);
  const lastAnimatedPatternIndexRef = useRef(null);
  const settledItemsRef = useRef(settledItems);
  const patternRef = useRef(pattern);
  settledItemsRef.current = settledItems;
  patternRef.current = pattern;
  focusUntilRef.current = focusUntil;

  const cancelFocusAnimation = () => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setFocusLockActive(false);
  };

  useEffect(() => {
    if (suppressFocus) {
      cancelFocusAnimation();
      return undefined;
    }

    if (!focusItemId && focusPatternIndex == null) {
      lastAnimatedPatternIndexRef.current = null;
      return undefined;
    }

    if (focusPatternIndex === lastAnimatedPatternIndexRef.current) {
      return undefined;
    }

    const item = resolveFocusItem(
      settledItemsRef.current,
      patternRef.current,
      focusItemId,
      focusPatternIndex
    );
    const target = item ? getRingRotationToFocusItem(item, frontAngleDeg) : null;
    if (target == null) {
      return undefined;
    }

    const from = rotationRef.current;
    const delta = getShortestRotationDelta(from, target);
    if (Math.abs(delta) < PREVIEW_FOCUS_MIN_ROTATE_DEG) {
      lastAnimatedPatternIndexRef.current = focusPatternIndex;
      return undefined;
    }

    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
    }
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }

    const start = performance.now();
    lastAnimatedPatternIndexRef.current = focusPatternIndex;
    setFocusLockActive(true);

    const tick = (now) => {
      const t = Math.min(1, (now - start) / PREVIEW_FOCUS_ANIM_MS);
      const next = from + delta * easeInOutCubic(t);
      rotationRef.current = next;
      setRotationDeg(next);
      if (t < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        rotationRef.current = target;
        setRotationDeg(target);
        const remaining = focusUntilRef.current - Date.now();
        holdTimerRef.current = setTimeout(
          () => {
            setFocusLockActive(false);
          },
          Math.max(0, remaining)
        );
      }
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    };
  }, [
    focusItemId,
    focusPatternIndex,
    suppressFocus,
    rotationRef,
    setRotationDeg,
    frontAngleDeg,
  ]);

  return { focusLockActive };
}
