import { DEFAULT_BEAD_SIZE_ID } from "./assets";
import { getPatternClosedLoopCircumference } from "./beadRingLayout";

/** PebblePal-style wrist fit range (centimeters). */
export const MIN_WRIST_CM = 13;
export const MAX_WRIST_CM = 25;
export const DEFAULT_WRIST_CM = 16;

/** PebblePal capacity anchor — 28 × 10 mm beads fill a 25 cm wrist. */
export const PEBBLEPAL_MAX_BEADS_AT_MAX_WRIST = 28;
export const PEBBLEPAL_REFERENCE_BEAD_MM = 10;

/** Approximate target wrist for each length preset (cm). */
export const LENGTH_TO_WRIST_CM = {
  4: 14,
  4.5: 15,
  5: 16,
  5.5: 17,
};

const CM_PER_INCH = 2.54;

/** Calibrate layout px ↔ cm using PebblePal's 28 × 10 mm @ 25 cm anchor. */
function getPxPerCm() {
  const anchorPattern = Array.from({ length: PEBBLEPAL_MAX_BEADS_AT_MAX_WRIST }, () => ({
    type: "bead",
    sizeId: DEFAULT_BEAD_SIZE_ID,
  }));
  const anchorCircumferencePx = getPatternClosedLoopCircumference(
    anchorPattern,
    DEFAULT_BEAD_SIZE_ID
  );
  return anchorCircumferencePx / MAX_WRIST_CM;
}

let cachedPxPerCm = null;

export function getLayoutPxPerCm() {
  if (!cachedPxPerCm) {
    cachedPxPerCm = getPxPerCm();
  }
  return cachedPxPerCm;
}

export function wristCmToArcLengthPx(cm) {
  return cm * getLayoutPxPerCm();
}

export function arcLengthPxToWristCm(px) {
  return px / getLayoutPxPerCm();
}

export function wristCmToRingRadius(cm) {
  return wristCmToArcLengthPx(cm) / (2 * Math.PI);
}

export function wristCmToInches(cm) {
  return cm / CM_PER_INCH;
}

export function formatWristCm(cm) {
  return `${cm.toFixed(1)} cm`;
}

export function formatWristInches(cm) {
  return `${wristCmToInches(cm).toFixed(2)}"`;
}

export function hasWristFitReading(itemCount) {
  return itemCount > 0;
}

/** Primary + secondary labels for wrist-fit UI (handles empty build state). */
export function getWristFitDisplay(cm, itemCount, targetCm) {
  if (!hasWristFitReading(itemCount)) {
    return {
      primary: "—",
      secondary: `target ${formatWristCm(targetCm)}`,
    };
  }

  return {
    primary: formatWristCm(cm),
    secondary: formatWristInches(cm),
  };
}

export function getTargetWristCmForLength(lengthId) {
  const parsed = Number.parseFloat(lengthId);
  if (Number.isFinite(parsed) && LENGTH_TO_WRIST_CM[parsed] != null) {
    return LENGTH_TO_WRIST_CM[parsed];
  }
  return LENGTH_TO_WRIST_CM[5] ?? DEFAULT_WRIST_CM;
}

export function getWristCapRingRadius() {
  return wristCmToRingRadius(MAX_WRIST_CM);
}

/**
 * Closed-loop arc length of a pattern mapped to wrist circumference (cm).
 * Uses linear contact spans so fit grows with each bead added.
 */
export function getSuitableWristCm(pattern, defaultSizeId) {
  if (!pattern?.length) {
    return 0;
  }

  const occupied = getPatternClosedLoopCircumference(pattern, defaultSizeId);
  return arcLengthPxToWristCm(occupied);
}

export function getWristFitStatus(suitableCm, itemCount) {
  if (!itemCount) {
    return "empty";
  }
  if (suitableCm < MIN_WRIST_CM) {
    return "too_small";
  }
  if (suitableCm >= MAX_WRIST_CM) {
    return "at_max";
  }
  return "good";
}

export function getWristFitMessage(status, { targetCm } = {}) {
  switch (status) {
    case "too_small":
      return `Wrist fit is below ${MIN_WRIST_CM} cm — add more beads to reach a wearable size.`;
    case "at_max":
      return `Maximum wrist size (${MAX_WRIST_CM} cm) reached — remove a bead to add a different one.`;
    case "good":
      return "Wrist fit is within the recommended range.";
    default:
      return targetCm
        ? `Add beads in Customize — building toward ${formatWristCm(targetCm)} target wrist (${MIN_WRIST_CM}–${MAX_WRIST_CM} cm).`
        : `Build your bracelet to fit wrists between ${MIN_WRIST_CM}–${MAX_WRIST_CM} cm.`;
  }
}

export function getWristFitBadgeLabel(status) {
  switch (status) {
    case "too_small":
      return "Too small";
    case "at_max":
      return "At maximum";
    case "good":
      return "Good fit";
    case "empty":
      return "Empty";
    default:
      return "Target";
  }
}

/** Ring radius hint for preview — target while building, then grows with fit. */
export function getDynamicLayoutRingRadius({ suitableCm, targetCm, itemCount }) {
  const target = Math.min(MAX_WRIST_CM, Math.max(MIN_WRIST_CM, targetCm));

  if (!itemCount || suitableCm < MIN_WRIST_CM) {
    return wristCmToRingRadius(target);
  }

  const fitCm = Math.min(MAX_WRIST_CM, Math.max(MIN_WRIST_CM, suitableCm));
  return wristCmToRingRadius(fitCm);
}

export function wouldExceedMaxWrist(pattern, newItem, defaultSizeId) {
  const candidate = {
    type: newItem.type,
    ...(newItem.type === "bead" ? { sizeId: newItem.sizeId || defaultSizeId } : {}),
  };
  const testPattern = [...pattern, candidate];
  const suitable = getSuitableWristCm(testPattern, defaultSizeId);
  return suitable > MAX_WRIST_CM + 0.05;
}
