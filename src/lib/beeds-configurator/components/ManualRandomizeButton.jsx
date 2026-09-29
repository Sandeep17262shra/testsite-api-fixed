import React from "react";

import { useBeedsContext } from "../contexts/BeedsContext";

export function ManualRandomizeButton({ className = "gb-preview-control gb-preview-control--randomize" }) {
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

  const busy = isManualRandomizing || !canRandomizeManualBracelet;

  return (
    <button
      type="button"
      className={`${className}${busy ? " is-busy active" : ""}`}
      onClick={() => randomizeManualBracelet()}
      disabled={busy}
      aria-busy={isManualRandomizing || undefined}
      aria-label={`Shuffle the beads, spacers and charms on the string (${manualRandomizeMinBeads}+ beads on empty string)`}
      title={isManualRandomizing ? "Randomizing…" : "Shuffle your design"}
    >
      <img
        src={
          busy ? "/images/beads-shuffle-button-active.svg" : "/images/beads-shuffle-btn.svg"
        }
        alt=""
        width={40}
        height={40}
        aria-hidden="true"
      />
    </button>
  );
}
