import React, { useCallback, useSyncExternalStore } from "react";

import {
  isBeadsSoundEnabled,
  setBeadsSoundEnabled,
  subscribeToBeadsSound,
} from "../beadsSounds";

export function BeadsSoundToggleButton({
  className = "gb-preview-control gb-preview-control--sound",
  ariaLabelOff = "Turn sound off",
  ariaLabelOn = "Turn sound on",
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
      aria-label={soundEnabled ? ariaLabelOff : ariaLabelOn}
      title={soundEnabled ? "Sound on" : "Sound off"}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g
          transform="translate(8 8)"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 9.5h3.1L11.8 6v12L7.1 14.5H4z" fill="currentColor" />
          {soundEnabled ? (
            <g fill="none">
              <path d="M15.4 9.4a3.6 3.6 0 0 1 0 5.2" />
              <path d="M18.2 6.9a7.2 7.2 0 0 1 0 10.2" />
            </g>
          ) : (
            <g fill="none">
              <path d="m15.8 9.8 5 4.4" />
              <path d="m20.8 9.8-5 4.4" />
            </g>
          )}
        </g>
      </svg>
    </button>
  );
}

export const SoundToggleButton = BeadsSoundToggleButton;
export default BeadsSoundToggleButton;
