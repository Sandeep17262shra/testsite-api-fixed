import React from "react";

import { useBeedsContext } from "../contexts/BeedsContext";

export function ManualRandomizeButton({
  className = "gb-preview-control gb-preview-control--randomize",
  disabled = false,
}) {
  const {
    showManualRandomizeButton,
    canRandomizeManualBracelet,
    randomizeManualBracelet,
    isManualRandomizing,
    manualRandomizeMinBeads,
  } = useBeedsContext();

  if (!showManualRandomizeButton) {
    return null;
  }

  const busy = disabled || isManualRandomizing || !canRandomizeManualBracelet;

  return (
    <button
      type="button"
      className={`${className}${busy ? " is-busy" : ""}`}
      onClick={() => randomizeManualBracelet()}
      disabled={busy}
      aria-busy={isManualRandomizing || undefined}
      aria-label={`Shuffle the beads, spacers and charms on the string (${manualRandomizeMinBeads}+ beads on empty string)`}
      title={isManualRandomizing ? "Randomizing…" : "Shuffle your design"}
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g transform="translate(8 8)" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17h2.1c1.4 0 2.7-.7 3.5-1.9l5-7.2c.8-1.2 2.1-1.9 3.5-1.9H20" />
          <path d="M17.5 4.5 20 7l-2.5 2.5" />
          <path d="M3 7h2.1c1.4 0 2.7.7 3.5 1.9l.6.8" />
          <path d="M20 17h-2.9c-1.4 0-2.7-.7-3.5-1.9l-.6-.8" />
          <path d="M17.5 14.5 20 17l-2.5 2.5" />
        </g>
      </svg>
    </button>
  );
}
