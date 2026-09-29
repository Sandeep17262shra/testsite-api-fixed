import { FREE_SIZE_LENGTH_ID, isFreeSizeLength } from "./assets";
import {
  FREE_SIZE_START_INCHES,
  getInchesForRingRadius,
  getMaxLayoutRadius,
  getPatternClosedLoopCircumference,
  getPatternNeededLayoutRadius,
  getRingRadiusForInches,
  MAX_LAYOUT_RADIUS_RATIO,
  patternFitsOnRing,
} from "./beadRingLayout";

/** Fixed bracelet tiers — same ids as the length picker (4"–5.5"). */
export const FREE_SIZE_FIXED_TIERS_INCHES = [4, 4.5, 5, 5.5];

/** Max free-size display aligns with the fixed length picker (4"–5.5"). */
export const MAX_FREE_DISPLAY_INCHES = 5.5;

export { FREE_SIZE_START_INCHES };

const FIXED_TIER_CAPACITY_OPTIONS = {
  closedLoop: true,
  maxRadiusRatio: MAX_LAYOUT_RADIUS_RATIO,
};

export function formatLengthInchesLabel(inches) {
  const value = Math.round(inches * 10) / 10;
  return Number.isInteger(value) ? `${value}"` : `${value.toFixed(1)}"`;
}

function getRingBeadPattern(pattern) {
  return pattern.filter((item) => item.type === "bead" || item.type === "spacer");
}

export function getFreeSizeMinRingRadius() {
  return getRingRadiusForInches(FREE_SIZE_START_INCHES);
}

function getFreeSizeMaxRingRadius() {
  return getMaxLayoutRadius(getRingRadiusForInches(MAX_FREE_DISPLAY_INCHES));
}

/** True when the pattern still fits on the minimum starter string. */
export function isFreeSizeOnMinString(pattern, defaultSizeId) {
  const ringPattern = getRingBeadPattern(pattern);
  if (!ringPattern.length) {
    return true;
  }

  const minRadius = getFreeSizeMinRingRadius();
  const needed = getPatternNeededLayoutRadius(ringPattern, defaultSizeId, {
    ringRadius: minRadius,
    closedLoop: true,
  });

  return needed <= minRadius;
}

/**
 * Free-size ring radius — small starter string, then grows smoothly with bead material.
 * Does not snap to 4" / 4.5" nominal radii; each bead only expands as much as needed.
 */
export function getFreeSizeRingRadius(pattern, defaultSizeId) {
  const minRadius = getFreeSizeMinRingRadius();
  const maxRadius = getFreeSizeMaxRingRadius();
  const ringPattern = getRingBeadPattern(pattern);

  if (!ringPattern.length) {
    return minRadius;
  }

  if (isFreeSizeOnMinString(pattern, defaultSizeId)) {
    return minRadius;
  }

  const closedCircumference = getPatternClosedLoopCircumference(ringPattern, defaultSizeId);
  let layoutRadius = Math.max(minRadius, closedCircumference / (2 * Math.PI));

  const needed = getPatternNeededLayoutRadius(ringPattern, defaultSizeId, {
    ringRadius: layoutRadius,
    closedLoop: true,
  });

  if (needed > layoutRadius) {
    layoutRadius = needed;
  }

  return Math.min(maxRadius, layoutRadius);
}

/** Length label from the same ring radius scale as fixed 4"–5.5" presets. */
export function getDynamicLengthInches(pattern, defaultSizeId) {
  const ringPattern = getRingBeadPattern(pattern);

  if (!ringPattern.length || isFreeSizeOnMinString(pattern, defaultSizeId)) {
    return FREE_SIZE_START_INCHES;
  }

  const radius = getFreeSizeRingRadius(pattern, defaultSizeId);
  return Math.min(MAX_FREE_DISPLAY_INCHES, getInchesForRingRadius(radius));
}

/** Same bead count rules as fixed 4" / 4.5" / 5" / 5.5" strings for a given size. */
export function canAddFreeSizeItem(pattern, candidate, defaultSizeId) {
  const testPattern = [
    ...pattern,
    {
      type: candidate.type,
      ...(candidate.type === "bead" ? { sizeId: candidate.sizeId || defaultSizeId } : {}),
    },
  ];

  if (isFreeSizeOnMinString(testPattern, defaultSizeId)) {
    return true;
  }

  const ringPattern = getRingBeadPattern(testPattern);

  for (const inches of FREE_SIZE_FIXED_TIERS_INCHES) {
    const ringRadius = getRingRadiusForInches(inches);
    if (patternFitsOnRing(ringPattern, ringRadius, defaultSizeId, FIXED_TIER_CAPACITY_OPTIONS)) {
      return true;
    }
  }

  return false;
}

export function getDisplayLengthLabel({
  lengthId,
  isManualMode,
  pattern,
  itemCount,
  defaultSizeId,
  fixedLengthLabel,
}) {
  if (isManualMode && isFreeSizeLength(lengthId)) {
    if (!itemCount) {
      return fixedLengthLabel;
    }
    return formatLengthInchesLabel(getDynamicLengthInches(pattern, defaultSizeId));
  }

  return fixedLengthLabel;
}

export function getManualCapacityRingRadius(lengthId, fixedRingRadius) {
  return fixedRingRadius;
}

export { FREE_SIZE_LENGTH_ID, isFreeSizeLength };
