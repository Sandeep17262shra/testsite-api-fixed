import { useCallback, useEffect, useRef, useState } from "react";

/** Matches bracelet / necklace / ring preview controls (reset, view). */
export const PREVIEW_CONTROL_ACTIVE_MS = 1500;

export function useMomentaryPreviewControlActive(durationMs = PREVIEW_CONTROL_ACTIVE_MS) {
  const [isActive, setIsActive] = useState(false);
  const timeoutRef = useRef(null);

  const pulse = useCallback(() => {
    setIsActive(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsActive(false);
    }, durationMs);
  }, [durationMs]);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  return [isActive, pulse];
}
