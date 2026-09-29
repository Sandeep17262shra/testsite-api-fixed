"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { PREVIEW_FOCUS_HOLD_MS } from "../previewFocus";

export const PreviewFocusContext = createContext(null);

export function PreviewFocusProvider({ children }) {
  const [focusKey, setFocusKey] = useState(0);
  const [focusItemId, setFocusItemId] = useState(null);
  const [focusPatternIndex, setFocusPatternIndex] = useState(null);
  const [focusUntil, setFocusUntil] = useState(0);

  const lastFocusTargetRef = useRef({ itemId: null, patternIndex: null });

  const requestPreviewFocus = useCallback(({ itemId = null, patternIndex = null } = {}) => {
    if (!itemId && patternIndex == null) {
      return;
    }
    const prev = lastFocusTargetRef.current;
    const targetChanged = prev.patternIndex !== patternIndex;
    lastFocusTargetRef.current = { itemId, patternIndex };
    setFocusItemId(itemId);
    setFocusPatternIndex(patternIndex);
    setFocusUntil(Date.now() + PREVIEW_FOCUS_HOLD_MS);
    if (targetChanged) {
      setFocusKey((value) => value + 1);
    }
  }, []);

  const clearPreviewFocus = useCallback(() => {
    setFocusUntil(0);
  }, []);

  const value = useMemo(
    () => ({
      focusKey,
      focusItemId,
      focusPatternIndex,
      focusUntil,
      requestPreviewFocus,
      clearPreviewFocus,
    }),
    [focusKey, focusItemId, focusPatternIndex, focusUntil, requestPreviewFocus, clearPreviewFocus]
  );

  return <PreviewFocusContext.Provider value={value}>{children}</PreviewFocusContext.Provider>;
}

export function usePreviewFocus() {
  const context = useContext(PreviewFocusContext);
  if (!context) {
    throw new Error("usePreviewFocus must be used within PreviewFocusProvider");
  }
  return context;
}
