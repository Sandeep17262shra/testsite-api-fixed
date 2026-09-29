import React, { useCallback, useSyncExternalStore } from "react";

import {
  isBeadsSoundEnabled,
  setBeadsSoundEnabled,
  subscribeToBeadsSound,
} from "../beadsSounds";

export function BeadsSoundToggleButton({
  className = "gb-preview-control gb-preview-control--sound",
}) {
  // The preference lives in the sound module so non-React callers read the same value;
  // the server snapshot is the unmuted default, since localStorage is client-only.
  const soundEnabled = useSyncExternalStore(
    subscribeToBeadsSound,
    isBeadsSoundEnabled,
    () => true
  );

  const toggleSound = useCallback(() => {
    setBeadsSoundEnabled(!isBeadsSoundEnabled());
  }, []);

  return (
    <button
      type="button"
      className={`${className}${soundEnabled ? " active" : " is-muted"}`}
      onClick={toggleSound}
      aria-pressed={soundEnabled}
      aria-label={soundEnabled ? "Turn bead sounds off" : "Turn bead sounds on"}
      title={soundEnabled ? "Sound on" : "Sound off"}
    >
      <img
        src={
          soundEnabled ? "/images/beads-sound-button-active.svg" : "/images/beads-sound-btn.svg"
        }
        alt=""
        width={40}
        height={40}
        aria-hidden="true"
      />
    </button>
  );
}
