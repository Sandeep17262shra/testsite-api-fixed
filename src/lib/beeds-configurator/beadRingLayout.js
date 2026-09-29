/**
 * Ring placement helpers for variable-diameter bead bracelets.
 */

import {
  DEFAULT_BEAD_SIZE_ID,
  getBeadSizeScale,
  isScene81MetalSpacerSku,
  LAYOUT_BEAD_SIZE_ID,
} from "./assets";

export const CENTER_ANGLE = Math.PI / 2;

const BASE_LENGTH_INCHES = 5;
const BASE_RING_RADIUS = 148;
/** Preview SVG coordinate space — 5.5" ring fills this area above stat cards. */
export const PREVIEW_VIEW_SIZE = 520;
/** Space above the ring before charm pendants (see getCharmPreviewReachPx). */
const PREVIEW_TOP_RESERVE = 28;
/** Bottom gap in viewBox — stat cards are absolutely positioned over the pane. */
const PREVIEW_BOTTOM_RESERVE = 12;
const PREVIEW_SIDE_RESERVE = 14;
const PREVIEW_CENTER_OFFSET_Y = 0;
const MIN_BRACELET_LENGTH_INCHES = 4;
const MAX_BRACELET_LENGTH_INCHES = 5.5;
/** Visual pack factor for bead PNG art (render size). */
const BEAD_IMAGE_PACK_FACTOR = 1.06;
const BEAD_RING_SCALE = 1.14;
/** Visible marble occupies ~this fraction of the image box width. */
const BEAD_ART_FILL_RATIO = 0.76;
const SPACER_WIDTH_SCALE = 0.4;
const SPACER_HEIGHT_SCALE = 0.6;
/** Pendant width relative to bead visual diameter — slightly narrower than a bead. */
const CHARM_VISUAL_WIDTH_SCALE = 0.76;
/** Pendant height relative to bead visual diameter — matches the charm art aspect so the
 * width-fitted image fills its box instead of being letterboxed away from the jump ring. */
const CHARM_VISUAL_HEIGHT_SCALE = 0.88;
/** Extra scale on top of bead-size proportion (keeps 6–8mm subtle, helps 10–12mm). */
const CHARM_VISUAL_SIZE_BOOST = 1.05;
/** Built-in bail loop center as a fraction of charm height from the top of the artwork. */
const CHARM_BAIL_ANCHOR_RATIO = 0.085;
/** Jump ring outer radius relative to reference bead visual diameter. */
const CHARM_JUMP_RING_RADIUS_SCALE = 0.048;
/** Tiny link from jump ring to the charm's integrated bail loop. */
const CHARM_CONNECTOR_LENGTH_SCALE = 0.006;
/** Half-gap on the string for layout — bail reads edge-on, so this stays small. */
const CHARM_BAIL_RING_LAYOUT_SCALE = 0.03;
/** Enamel charms: render box height relative to reference bead diameter. */
const CHARM_ASPECT_HEIGHT_SCALE = 1.2;
/** Cap enamel charm width so neighbours in adjacent gaps do not overlap. */
const CHARM_MAX_WIDTH_SCALE = 1.05;
/** Angular nudge when multiple charms share one gap. */
const CHARM_GAP_STACK_ANGLE_RAD = 0.055;
/** Gold hardware stroke relative to bead visual diameter. */
const CHARM_HARDWARE_STROKE_SCALE = 0.022;
/** Overlap charm bail loop onto jump ring so the joint reads as one piece. */
const CHARM_LOOP_OVERLAP_SCALE = 0.35;
/** Edge-on enamel bail ring — vertical radius vs charm loop. */
const BAIL_RING_SIZE_TO_LOOP = 1.2;
/** Edge-on squash (0 = full side view, straight vertical line). */
const BAIL_RING_ASPECT = 0;
/** Fallback hole radius as a fraction of charm height (enamel). */
const DEFAULT_CHARM_HOLE_RATIO = 0.032;
/** Gold string through the jump ring — each side spans ~into the bead gap (fraction of bead radius). */
const CHARM_GAP_THREAD_HALF_BEAD_RADIUS = 0.96;
/** Slight outward nudge off the string so the ring clears bead art (not over bead centers). */
const CHARM_CREVICE_RADIUS_SCALE = 0.12;
const CHARM_CREVICE_RADIUS_MIN_PAD_PX = 2;
const CHARM_CREVICE_RADIUS_MAX_PAD_PX = 5;
/** Bottom slot in the manual even-angle layout (first index on the ring). */
export const STYLE3_CHARM_SLOT_INDEX = 0;
/** Reference bead thread diameter at 6mm before visual scaling. */
const BASE_BEAD_DIAMETER_PX = 26;
/** Visible thread gap only where a spacer sits between beads. */
const SPACER_THREAD_GAP_PX = 3;
/** Tighter than bead–spacer — two wheels side-by-side read too loose at 3px. */
const SPACER_TO_SPACER_THREAD_GAP_PX = 1.5;
/** S7–S9: tiny extra thread (metal band is slightly wider than flat spacer art). */
const SCENE81_SPACER_EXTRA_THREAD_GAP_PX = 1;
/** Layout half-span along string — small bump only; large values read as loose string. */
const SCENE81_SPACER_LAYOUT_HALF_SCALE = 1.16;

function resolveSpacerAssetKeyFromItem(item) {
  return item?.assetKey ?? item?.asset?.key ?? null;
}

function isScene81SpacerItem(item) {
  return item?.type === "spacer" && isScene81MetalSpacerSku(resolveSpacerAssetKeyFromItem(item));
}

function getScene81SpacerLayoutHalfSpan(baseHalf) {
  return baseHalf * SCENE81_SPACER_LAYOUT_HALF_SCALE;
}
/** Bead PNG art: drill hole runs along +Y at 0° rotation. */
const BEAD_HOLE_AXIS_OFFSET_DEG = -90;
/** Spacer PNG art: drill hole runs along +X at 0° rotation. */
const SPACER_HOLE_AXIS_OFFSET_DEG = 0;
/**
 * Charm hangs along local +Y (bail at top of art). String tangent uses the same axis as spacers (+X).
 */
const CHARM_HANG_AXIS_OFFSET_DEG = 0;
/** Crevice depth at a gap — less than full bead radius so hardware sits in the valley between beads. */
const CHARM_GAP_EDGE_RATIO = 0.58;
/** Clearance off the bare string when there are no beads or spacers on the ring. */
const CHARM_STRING_EDGE_PX = 2;
/** @deprecated Bail sits on the string (no standoff). Kept at 0 for layout compat. */
const CHARM_BAIL_STRING_STANDOFF_PX = 0;
/** Edge-on bail half-height as a fraction of reference bead visual diameter. */
const CHARM_EDGE_BAIL_RY_SCALE = 0.092;
const CHARM_EDGE_BAIL_RY_MIN_PX = 3.4;
const CHARM_EDGE_BAIL_RY_MAX_PX = 6;
/** Tube thickness (edge-on) — thin vertical gold line. */
const CHARM_EDGE_BAIL_RX_SCALE = 0.011;
const CHARM_EDGE_BAIL_RX_MIN_PX = 0.9;
/** How far the charm's own loop hangs past the bottom of our bail (fraction of bail ry). */
export const CHARM_BAIL_HOOK_DROP_RATIO = 0.3;

function getThreadGapBetween(prevItem, nextItem) {
  if (!prevItem || !nextItem) return 0;
  if (prevItem.type === "charm" || nextItem.type === "charm") {
    let gap = SPACER_THREAD_GAP_PX;
    if (isScene81SpacerItem(prevItem) || isScene81SpacerItem(nextItem)) {
      gap += SCENE81_SPACER_EXTRA_THREAD_GAP_PX;
    }
    return gap;
  }
  if (prevItem.type === "spacer" && nextItem.type === "spacer") {
    let gap = SPACER_TO_SPACER_THREAD_GAP_PX;
    if (isScene81SpacerItem(prevItem) || isScene81SpacerItem(nextItem)) {
      gap += SCENE81_SPACER_EXTRA_THREAD_GAP_PX * 0.5;
    }
    return gap;
  }
  if (prevItem.type === "spacer" || nextItem.type === "spacer") {
    let gap = SPACER_THREAD_GAP_PX;
    if (isScene81SpacerItem(prevItem) || isScene81SpacerItem(nextItem)) {
      gap += SCENE81_SPACER_EXTRA_THREAD_GAP_PX;
    }
    return gap;
  }
  return 0;
}

function getStepArcLength(prevItem, nextItem, prevRadius, nextRadius) {
  return prevRadius + getThreadGapBetween(prevItem, nextItem) + nextRadius;
}

/** Angular step on a ring so visual widths do not overlap along the curve. */
function getStepAngleRadians(prevItem, nextItem, prevRadius, nextRadius, ringRadius) {
  const contactSpan = getStepArcLength(prevItem, nextItem, prevRadius, nextRadius);
  const ratio = Math.min(1, contactSpan / ringRadius);
  return 2 * Math.asin(ratio / 2);
}

/** Usable thread length for a bracelet at the given ring radius. */
export function getAvailableStringLength(ringRadius) {
  return 2 * Math.PI * ringRadius;
}

function getPatternLayoutRadii(pattern, defaultSizeId) {
  return pattern.map((item, index) => getItemLayoutRadius(item, pattern, index, defaultSizeId));
}

/**
 * Sum of arc consumed by pattern items on the string (uses visual widths for spacing).
 * Closed loop includes the arc from the last item back to the first.
 */
export function getPatternOccupiedLength(
  pattern,
  defaultSizeId = LAYOUT_BEAD_SIZE_ID,
  { closedLoop = true, ringRadius = BASE_RING_RADIUS } = {}
) {
  const count = pattern.length;
  if (!count) return 0;

  const layoutRadii = getPatternLayoutRadii(pattern, defaultSizeId);

  if (!closedLoop) {
    if (count === 1) {
      return 2 * layoutRadii[0];
    }

    let totalAngle = 0;
    for (let index = 0; index < count - 1; index += 1) {
      totalAngle += getStepAngleRadians(
        pattern[index],
        pattern[index + 1],
        layoutRadii[index],
        layoutRadii[index + 1],
        ringRadius
      );
    }

    return totalAngle * ringRadius + layoutRadii[0] + layoutRadii[count - 1];
  }

  let totalAngle = 0;

  for (let index = 0; index < count; index += 1) {
    if (!closedLoop && index === count - 1) {
      break;
    }

    const nextIndex = closedLoop ? (index + 1) % count : index + 1;
    totalAngle += getStepAngleRadians(
      pattern[index],
      pattern[nextIndex],
      layoutRadii[index],
      layoutRadii[nextIndex],
      ringRadius
    );
  }

  return totalAngle * ringRadius;
}

/**
 * Minimum closed-loop string length for a pattern — sum of contact spans around the ring.
 * Used for wrist-fit (independent of preview ring radius).
 */
export function getPatternClosedLoopCircumference(
  pattern,
  defaultSizeId = LAYOUT_BEAD_SIZE_ID
) {
  const count = pattern.length;
  if (!count) return 0;

  const layoutRadii = getPatternLayoutRadii(pattern, defaultSizeId);
  let total = 0;

  for (let index = 0; index < count; index += 1) {
    const nextIndex = (index + 1) % count;
    total += getStepArcLength(
      pattern[index],
      pattern[nextIndex],
      layoutRadii[index],
      layoutRadii[nextIndex]
    );
  }

  return total;
}

export function getRemainingStringLength(pattern, ringRadius, defaultSizeId = DEFAULT_BEAD_SIZE_ID) {
  return (
    getAvailableStringLength(ringRadius) -
    getPatternOccupiedLength(pattern, defaultSizeId, { ringRadius })
  );
}

/** Preset and manual full strings may expand layout radius up to this factor of nominal length. */
export const MAX_LAYOUT_RADIUS_RATIO = 1.08;

export function getMaxLayoutRadius(ringRadius) {
  return ringRadius * MAX_LAYOUT_RADIUS_RATIO;
}

/** Max identical beads that fit on a length (same loop as Full Bead preset). */
export function buildFullBeadCapacityItems(
  ringRadius,
  defaultSizeId = LAYOUT_BEAD_SIZE_ID
) {
  const maxLayoutRadius = getMaxLayoutRadius(ringRadius);
  let capacityItems = [];

  while (true) {
    const next = { type: "bead", sizeId: defaultSizeId };
    const candidate = [...capacityItems, next];
    const neededRadius = getPatternNeededLayoutRadius(candidate, defaultSizeId, { ringRadius });
    if (neededRadius <= maxLayoutRadius) {
      capacityItems = candidate;
      continue;
    }
    break;
  }

  while (capacityItems.length > 0) {
    const neededRadius = getPatternNeededLayoutRadius(capacityItems, defaultSizeId, {
      ringRadius,
    });
    if (neededRadius <= maxLayoutRadius) {
      break;
    }
    capacityItems = capacityItems.slice(0, -1);
  }

  return capacityItems;
}

/**
 * Final layout ring radius for a full all-bead string — matches Full Bead preset
 * so manual strings use that fixed size from the first bead.
 */
export function resolveAllBeadFullLayoutRadius(
  ringRadius,
  defaultSizeId = LAYOUT_BEAD_SIZE_ID
) {
  const capacityItems = buildFullBeadCapacityItems(ringRadius, defaultSizeId);
  if (!capacityItems.length) {
    return ringRadius;
  }

  return Math.min(
    resolveLayoutRingRadius(capacityItems, defaultSizeId, ringRadius),
    getMaxLayoutRadius(ringRadius)
  );
}

export function getPatternNeededLayoutRadius(
  pattern,
  defaultSizeId = LAYOUT_BEAD_SIZE_ID,
  { ringRadius = BASE_RING_RADIUS, closedLoop = true } = {}
) {
  if (!pattern.length) {
    return ringRadius;
  }

  return (
    getPatternOccupiedLength(pattern, defaultSizeId, { ringRadius, closedLoop }) / (2 * Math.PI)
  );
}

export function patternFitsOnRing(
  pattern,
  ringRadius,
  defaultSizeId = LAYOUT_BEAD_SIZE_ID,
  { closedLoop = true, maxRadiusRatio = MAX_LAYOUT_RADIUS_RATIO } = {}
) {
  return (
    getPatternNeededLayoutRadius(pattern, defaultSizeId, { ringRadius, closedLoop }) <=
    ringRadius * maxRadiusRatio
  );
}

/** Contact-span check for a fixed closed string (beads touch, no overlap). */
export function patternFitsFixedStringLength(
  pattern,
  ringRadius,
  defaultSizeId = DEFAULT_BEAD_SIZE_ID
) {
  if (!pattern.length) {
    return true;
  }

  return (
    getPatternClosedLoopCircumference(pattern, defaultSizeId) <= getAvailableStringLength(ringRadius)
  );
}

export function canAddItemToPattern(
  pattern,
  newItem,
  ringRadius,
  defaultSizeId = DEFAULT_BEAD_SIZE_ID,
  { closedLoop = true, maxRadiusRatio = 1, requireFixedStringLength = false } = {}
) {
  if (newItem.type === "charm") {
    return true;
  }

  const candidate = {
    type: newItem.type,
    ...(newItem.type === "bead" ? { sizeId: newItem.sizeId || defaultSizeId } : {}),
  };

  const testPattern = [...pattern, candidate];
  if (
    requireFixedStringLength &&
    !patternFitsFixedStringLength(testPattern, ringRadius, defaultSizeId)
  ) {
    return false;
  }

  return patternFitsOnRing(testPattern, ringRadius, defaultSizeId, {
    closedLoop,
    maxRadiusRatio,
  });
}

/** Fixed-length manual strings — contact span and angular layout must both fit. */
export function patternFitsManualFixedLength(
  pattern,
  ringRadius,
  defaultSizeId = DEFAULT_BEAD_SIZE_ID
) {
  if (!pattern.length) {
    return true;
  }

  return (
    patternFitsFixedStringLength(pattern, ringRadius, defaultSizeId) &&
    patternFitsOnRing(pattern, ringRadius, defaultSizeId, {
      closedLoop: true,
      maxRadiusRatio: MAX_LAYOUT_RADIUS_RATIO,
    })
  );
}

export function trimPatternToFit(
  pattern,
  ringRadius,
  defaultSizeId = DEFAULT_BEAD_SIZE_ID,
  { closedLoop = true, maxRadiusRatio = 1 } = {}
) {
  const trimmed = [...pattern];
  while (
    trimmed.length > 0 &&
    !patternFitsOnRing(trimmed, ringRadius, defaultSizeId, { closedLoop, maxRadiusRatio })
  ) {
    trimmed.pop();
  }
  return trimmed;
}

export function toCapacityPattern(manualItems, defaultSizeId = DEFAULT_BEAD_SIZE_ID) {
  return manualItems
    .filter((item) => item.type !== "charm")
    .map((item) => ({
      type: item.type,
      ...(item.type === "bead" ? { sizeId: item.sizeId || defaultSizeId } : {}),
    }));
}

/**
 * Build a preset pattern that fills the bracelet circumference at fixed component sizes.
 */
export function buildCapacityFilledPattern({
  styleId,
  ringRadius,
  bead,
  separator,
  defaultSizeId = LAYOUT_BEAD_SIZE_ID,
}) {
  const available = getAvailableStringLength(ringRadius);
  const capacityItems = [];

  if (styleId === "full-bead") {
    const count = getMaxIdenticalBeadCount(ringRadius, defaultSizeId);
    for (let index = 0; index < count; index += 1) {
      capacityItems.push({ type: "bead", sizeId: defaultSizeId });
    }
  } else if (styleId === "style-1") {
    let nextIsBead = true;
    while (true) {
      const next = nextIsBead
        ? { type: "bead", sizeId: defaultSizeId }
        : { type: "spacer" };
      const test = [...capacityItems, next];
      if (getPatternOccupiedLength(test, defaultSizeId, { ringRadius }) > available) {
        break;
      }
      capacityItems.push(next);
      nextIsBead = !nextIsBead;
    }
  } else if (styleId === "style-2") {
    while (true) {
      const next = getStyle2CapacityItem(capacityItems.length, defaultSizeId);
      const test = [...capacityItems, next];
      if (getPatternOccupiedLength(test, defaultSizeId, { ringRadius }) > available) {
        break;
      }
      capacityItems.push(next);
    }
  }

  return capacityItems.map((item) => ({
    type: item.type,
    asset: item.type === "spacer" ? separator : bead,
    ...(item.type === "bead" ? { sizeId: item.sizeId || defaultSizeId } : {}),
  }));
}

function getStyle2CapacityItem(index, defaultSizeId) {
  return index % 3 === 2
    ? { type: "spacer" }
    : { type: "bead", sizeId: defaultSizeId };
}

function buildStyle3CapacityItems(ringRadius, defaultSizeId, maxLayoutRadius) {
  let items = buildFullBeadCapacityItems(ringRadius, defaultSizeId);
  if (!items.length) {
    return [{ type: "charm" }];
  }

  const withCharmAt = (beadItems, charmIndex) =>
    beadItems.map((item, index) => (index === charmIndex ? { type: "charm" } : item));

  while (items.length > 0) {
    const candidate = withCharmAt(items, STYLE3_CHARM_SLOT_INDEX);
    const neededRadius = getPatternNeededLayoutRadius(candidate, defaultSizeId, { ringRadius });
    if (neededRadius <= maxLayoutRadius) {
      return candidate;
    }
    items = items.slice(0, -1);
  }

  return [{ type: "charm" }];
}

function finalizeStyle3CapacityItems(capacityItems, defaultSizeId, ringRadius, maxLayoutRadius) {
  let items = capacityItems.filter((item) => item.type !== "charm");

  while (items.length > 0) {
    const candidate = items.map((item, index) =>
      index === STYLE3_CHARM_SLOT_INDEX ? { type: "charm" } : item
    );
    const layoutRingRadius = resolveLayoutRingRadius(candidate, defaultSizeId, ringRadius);
    if (layoutRingRadius <= maxLayoutRadius) {
      return {
        capacityItems: candidate,
        layoutRingRadius: Math.min(layoutRingRadius, maxLayoutRadius),
      };
    }
    items = items.slice(0, -1);
  }

  return {
    capacityItems: [{ type: "charm" }],
    layoutRingRadius: Math.min(
      resolveLayoutRingRadius([{ type: "charm" }], defaultSizeId, ringRadius),
      maxLayoutRadius
    ),
  };
}

function getNextStyleCapacityItem(styleId, capacityItems, defaultSizeId) {
  if (styleId === "full-bead") {
    return { type: "bead", sizeId: defaultSizeId };
  }
  if (styleId === "style-1") {
    return capacityItems.length % 2 === 0
      ? { type: "bead", sizeId: defaultSizeId }
      : { type: "spacer" };
  }
  if (styleId === "style-2") {
    return getStyle2CapacityItem(capacityItems.length, defaultSizeId);
  }
  if (styleId === "style-3") {
    const charmCount = capacityItems.filter((item) => item.type === "charm").length;
    if (charmCount === 0) {
      return { type: "charm" };
    }
    return { type: "bead", sizeId: defaultSizeId };
  }
  return null;
}

function mapCapacityItemsToPattern(capacityItems, bead, separator, charm, defaultSizeId) {
  return capacityItems.map((item) => ({
    type: item.type,
    asset:
      item.type === "spacer" ? separator : item.type === "charm" ? charm : bead,
    ...(item.type === "bead" ? { sizeId: item.sizeId || defaultSizeId } : {}),
  }));
}

function getStyle1PairItems(defaultSizeId) {
  return [
    { type: "bead", sizeId: defaultSizeId },
    { type: "spacer" },
  ];
}

function getStyle2UnitItems(defaultSizeId) {
  return [
    { type: "bead", sizeId: defaultSizeId },
    { type: "bead", sizeId: defaultSizeId },
    { type: "spacer" },
  ];
}

/**
 * Style 1 alternates bead → spacer. A closed loop must have even length so the
 * seam is spacer → bead, not bead → bead. Also nudges radius / count to fit.
 */
function finalizeStyle1CapacityItems(capacityItems, defaultSizeId, ringRadius, maxLayoutRadius) {
  let items = [...capacityItems];

  if (items.length % 2 === 1) {
    items = items.slice(0, -1);
  }

  const withPair = [...items, ...getStyle1PairItems(defaultSizeId)];
  const pairRadius = resolveLayoutRingRadius(withPair, defaultSizeId, ringRadius);
  if (pairRadius <= maxLayoutRadius) {
    items = withPair;
  }

  let layoutRingRadius = resolveLayoutRingRadius(items, defaultSizeId, ringRadius);
  while (layoutRingRadius > maxLayoutRadius && items.length > 2) {
    items = items.slice(0, -2);
    if (items.length % 2 === 1) {
      items = items.slice(0, -1);
    }
    layoutRingRadius = resolveLayoutRingRadius(items, defaultSizeId, ringRadius);
  }

  if (items.length % 2 === 1) {
    items = items.slice(0, -1);
    layoutRingRadius = resolveLayoutRingRadius(items, defaultSizeId, ringRadius);
  }

  return {
    capacityItems: items,
    layoutRingRadius: Math.min(layoutRingRadius, maxLayoutRadius),
  };
}

/**
 * Style 2 repeats bead → bead → spacer. A closed loop must be a multiple of 3.
 */
function finalizeStyle2CapacityItems(capacityItems, defaultSizeId, ringRadius, maxLayoutRadius) {
  let items = [...capacityItems];

  while (items.length > 0 && items.length % 3 !== 0) {
    items = items.slice(0, -1);
  }

  const withUnit = [...items, ...getStyle2UnitItems(defaultSizeId)];
  const unitRadius = resolveLayoutRingRadius(withUnit, defaultSizeId, ringRadius);
  if (unitRadius <= maxLayoutRadius) {
    items = withUnit;
  }

  let layoutRingRadius = resolveLayoutRingRadius(items, defaultSizeId, ringRadius);
  while (layoutRingRadius > maxLayoutRadius && items.length > 3) {
    items = items.slice(0, -3);
    while (items.length > 0 && items.length % 3 !== 0) {
      items = items.slice(0, -1);
    }
    layoutRingRadius = resolveLayoutRingRadius(items, defaultSizeId, ringRadius);
  }

  while (items.length > 0 && items.length % 3 !== 0) {
    items = items.slice(0, -1);
  }
  if (items.length > 0) {
    layoutRingRadius = resolveLayoutRingRadius(items, defaultSizeId, ringRadius);
  }

  return {
    capacityItems: items,
    layoutRingRadius: Math.min(layoutRingRadius, maxLayoutRadius),
  };
}

function finalizePresetStyleCapacityItems(
  styleId,
  capacityItems,
  defaultSizeId,
  ringRadius,
  maxLayoutRadius
) {
  if (styleId === "style-1") {
    return finalizeStyle1CapacityItems(
      capacityItems,
      defaultSizeId,
      ringRadius,
      maxLayoutRadius
    );
  }
  if (styleId === "style-2") {
    return finalizeStyle2CapacityItems(
      capacityItems,
      defaultSizeId,
      ringRadius,
      maxLayoutRadius
    );
  }
  if (styleId === "style-3") {
    return finalizeStyle3CapacityItems(
      capacityItems,
      defaultSizeId,
      ringRadius,
      maxLayoutRadius
    );
  }
  return null;
}

/**
 * Fill the string as tightly as possible for the selected style.
 * Slightly expands or contracts the layout circumference (not the label) so
 * one more or fewer components can fit when close to capacity.
 */
export function buildTightFilledPattern({
  styleId,
  ringRadius,
  bead,
  separator,
  charm,
  defaultSizeId = LAYOUT_BEAD_SIZE_ID,
}) {
  const maxLayoutRadius = getMaxLayoutRadius(ringRadius);

  let capacityItems =
    styleId === "full-bead"
      ? buildFullBeadCapacityItems(ringRadius, defaultSizeId)
      : styleId === "style-3"
        ? buildStyle3CapacityItems(ringRadius, defaultSizeId, maxLayoutRadius)
        : [];

  if (styleId !== "full-bead" && styleId !== "style-3") {
    while (true) {
      const next = getNextStyleCapacityItem(styleId, capacityItems, defaultSizeId);
      if (!next) break;

      const candidate = [...capacityItems, next];
      const neededRadius = getPatternNeededLayoutRadius(candidate, defaultSizeId, { ringRadius });
      if (neededRadius <= maxLayoutRadius) {
        capacityItems = candidate;
        continue;
      }
      break;
    }

    while (capacityItems.length > 0) {
      const neededRadius = getPatternNeededLayoutRadius(capacityItems, defaultSizeId, { ringRadius });
      if (neededRadius <= maxLayoutRadius) {
        break;
      }
      capacityItems = capacityItems.slice(0, -1);
    }
  }

  const finalized = finalizePresetStyleCapacityItems(
    styleId,
    capacityItems,
    defaultSizeId,
    ringRadius,
    maxLayoutRadius
  );

  if (finalized) {
    return {
      pattern: mapCapacityItemsToPattern(
        finalized.capacityItems,
        bead,
        separator,
        charm,
        defaultSizeId
      ),
      layoutRingRadius: finalized.layoutRingRadius,
    };
  }

  const layoutRingRadius = Math.min(
    resolveLayoutRingRadius(capacityItems, defaultSizeId, ringRadius),
    maxLayoutRadius
  );

  return {
    pattern: mapCapacityItemsToPattern(capacityItems, bead, separator, charm, defaultSizeId),
    layoutRingRadius,
  };
}

export function getSlotOffsets(count) {
  const offsets = [];
  if (count % 2 === 1) {
    offsets.push(0);
    for (let index = 1; index <= (count - 1) / 2; index += 1) {
      offsets.push(-index, index);
    }
  } else {
    for (let index = 1; index <= count / 2; index += 1) {
      offsets.push(-(index - 0.5), index - 0.5);
    }
  }
  return offsets.sort((a, b) => a - b);
}

export function getBeadRingAngles(count, slotCount) {
  if (!count || !slotCount) return [];

  const step = (2 * Math.PI) / slotCount;

  if (count === slotCount) {
    return Array.from({ length: count }, (_, index) => CENTER_ANGLE - index * step);
  }

  const offsets = getSlotOffsets(count);
  return offsets.map((offset) => CENTER_ANGLE - offset * step);
}

/** Uniform chord size for preset styles — same ring + slot count = same bead size. */
export function getPackedBeadSize(slotCount, sizeScale, ringRadius) {
  const step = (2 * Math.PI) / slotCount;
  const chordSize = 2 * ringRadius * Math.sin(step / 2) * sizeScale * BEAD_IMAGE_PACK_FACTOR;
  return Math.max(chordSize, 18);
}

export function getRingPoint(angle, centerX, centerY, radius) {
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
}

export function getBeadDiameterPx(sizeId = DEFAULT_BEAD_SIZE_ID) {
  const scale = getBeadSizeScale(sizeId);
  return BASE_BEAD_DIAMETER_PX * scale * BEAD_RING_SCALE * BEAD_IMAGE_PACK_FACTOR;
}

/**
 * Bead size the charm art is drawn against. Charms are their own physical product, so they
 * render at one constant size whatever they hang between — the same rule spacers follow. This
 * is the single place every charm dimension (pendant box, bail, hardware, fan spacing) is
 * pegged to, so it is also where that stays true.
 */
export function resolveCharmReferenceSizeId() {
  return LAYOUT_BEAD_SIZE_ID;
}

/** Physical thread diameter used for string capacity and center spacing. */
export function getBeadThreadDiameterPx(sizeId = DEFAULT_BEAD_SIZE_ID) {
  const scale = getBeadSizeScale(sizeId);
  return BASE_BEAD_DIAMETER_PX * scale;
}

export function getMaxIdenticalBeadCount(ringRadius, sizeId = LAYOUT_BEAD_SIZE_ID) {
  const contactDiameter = resolveBeadLayoutContactDiameter(sizeId);
  if (!contactDiameter) return 0;
  return Math.max(1, Math.floor(getAvailableStringLength(ringRadius) / contactDiameter));
}

function resolveBeadVisualDiameter(sizeId = LAYOUT_BEAD_SIZE_ID) {
  return getBeadDiameterPx(sizeId);
}

/** Center spacing along the string — matches visible bead size, not image padding. */
function resolveBeadLayoutContactDiameter(sizeId = LAYOUT_BEAD_SIZE_ID) {
  return resolveBeadVisualDiameter(sizeId) * BEAD_ART_FILL_RATIO;
}

/** Fixed spacer render size — does not change with the size chart. */
function getSpacerVisualDimensions() {
  const referenceVisual = getBeadDiameterPx(LAYOUT_BEAD_SIZE_ID);
  return {
    width: referenceVisual * SPACER_WIDTH_SCALE,
    height: referenceVisual * SPACER_HEIGHT_SCALE,
  };
}

/** Charm pendant render size — scales with bracelet bead mm; optional `asset.aspect` for enamel. */
function getCharmVisualDimensions(asset = null, beadSizeId = LAYOUT_BEAD_SIZE_ID) {
  const beadVisual = getBeadDiameterPx(beadSizeId) * CHARM_VISUAL_SIZE_BOOST;
  const aspect = asset?.aspect;
  if (aspect > 0) {
    let height = beadVisual * CHARM_ASPECT_HEIGHT_SCALE;
    let width = height * aspect;
    const maxWidth = beadVisual * CHARM_MAX_WIDTH_SCALE;
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspect;
    }
    return { width, height };
  }
  return {
    width: beadVisual * CHARM_VISUAL_WIDTH_SCALE,
    height: beadVisual * CHARM_VISUAL_HEIGHT_SCALE,
  };
}

function getCharmBailLayoutRadius(beadSizeId = LAYOUT_BEAD_SIZE_ID) {
  return getBeadDiameterPx(beadSizeId) * CHARM_BAIL_RING_LAYOUT_SCALE;
}

function getCharmHardwareDimensions(beadSizeId = LAYOUT_BEAD_SIZE_ID) {
  const beadVisual = getBeadDiameterPx(beadSizeId) * CHARM_VISUAL_SIZE_BOOST;
  return {
    jumpRingRadius: beadVisual * CHARM_JUMP_RING_RADIUS_SCALE,
    connectorLength: beadVisual * CHARM_CONNECTOR_LENGTH_SCALE,
    strokeWidth: Math.max(1.4, beadVisual * CHARM_HARDWARE_STROKE_SCALE),
  };
}

/** Bottom-center (6 o'clock) attachment point on the bracelet string. */
export function getCharmStringAttachmentPoint(centerX, centerY, ringRadius) {
  return getRingPoint(CENTER_ANGLE, centerX, centerY, ringRadius);
}

function getItemDimensions(item, pattern, index, defaultSizeId) {
  if (item.type === "spacer") {
    return getSpacerVisualDimensions();
  }

  if (item.type === "charm") {
    const charmRefSizeId = resolveCharmReferenceSizeId();
    return getCharmVisualDimensions(item.asset, charmRefSizeId);
  }

  const beadSizeId = item.sizeId || defaultSizeId;
  const diameter = resolveBeadVisualDiameter(beadSizeId);
  return {
    width: diameter,
    height: diameter,
  };
}

/** Half-width along the string used for layout spacing (visible bead, not image box). */
function getItemLayoutRadius(item, pattern, index, defaultSizeId) {
  if (item.type === "spacer") {
    const dimensions = getSpacerVisualDimensions();
    const half = dimensions.width / 2;
    return isScene81SpacerItem(item) ? getScene81SpacerLayoutHalfSpan(half) : half;
  }

  if (item.type === "charm") {
    const charmRefSizeId = resolveCharmReferenceSizeId();
    return getCharmBailLayoutRadius(charmRefSizeId);
  }

  const beadSizeId = item.sizeId || defaultSizeId;
  return resolveBeadLayoutContactDiameter(beadSizeId) / 2;
}

/**
 * Thread tangent rotation from neighboring item centers on the ring.
 * `holeAxisOffsetDeg` maps artwork where the hole is vertical (+Y) or horizontal (+X) at 0°.
 */
export function getThreadTangentRotationDegrees(prev, next, holeAxisOffsetDeg = 0) {
  const dx = next.x - prev.x;
  const dy = next.y - prev.y;
  if (dx === 0 && dy === 0) {
    return holeAxisOffsetDeg;
  }
  const tangentDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  return tangentDeg + holeAxisOffsetDeg;
}

/** @deprecated Use getThreadTangentRotationDegrees with SPACER_HOLE_AXIS_OFFSET_DEG. */
export function getSpacerRotationDegreesFromNeighbors(prev, next) {
  return getThreadTangentRotationDegrees(prev, next, SPACER_HOLE_AXIS_OFFSET_DEG);
}

function getAdjacentNeighbors(items, index, closedLoop) {
  const count = items.length;
  if (!count) {
    return { prev: null, next: null };
  }

  const prevIndex = index - 1;
  const nextIndex = index + 1;

  if (closedLoop) {
    return {
      prev: items[(prevIndex + count) % count],
      next: items[nextIndex % count],
    };
  }

  return {
    prev: prevIndex >= 0 ? items[prevIndex] : null,
    next: nextIndex < count ? items[nextIndex] : null,
  };
}

function findNeighborByType(items, startIndex, direction, type, closedLoop) {
  const count = items.length;
  if (!count) {
    return null;
  }

  for (let step = 1; step < count; step += 1) {
    const index = closedLoop
      ? (startIndex + direction * step + count) % count
      : startIndex + direction * step;

    if (!closedLoop && (index < 0 || index >= count)) {
      return null;
    }

    const candidate = items[index];
    if (candidate.type === type) {
      if (index === startIndex) {
        return null;
      }
      return candidate;
    }
  }

  return null;
}

function getBeadTangentNeighbors(items, index, closedLoop) {
  const beadCount = items.filter((item) => item.type === "bead").length;
  if (beadCount < 2) {
    return { prev: null, next: null };
  }

  return {
    prev: findNeighborByType(items, index, -1, "bead", closedLoop),
    next: findNeighborByType(items, index, 1, "bead", closedLoop),
  };
}

/**
 * Hole axis for a strung item sitting anywhere on the ring — the string's tangent there.
 * Taking it from the item's own position keeps orientation continuous as it slides, whereas a
 * chord between the nearest neighbours re-picks those neighbours the instant anything is
 * inserted, moved or removed, snapping every bead around the change to a different angle.
 * Items sit at decreasing angles, so the tangent trails the radius by 90°.
 */
export function getStrungItemRotationDegrees(type, x, y, centerX, centerY) {
  const holeAxisOffsetDeg =
    type === "spacer" ? SPACER_HOLE_AXIS_OFFSET_DEG : BEAD_HOLE_AXIS_OFFSET_DEG;
  const radiusDeg = (Math.atan2(y - centerY, x - centerX) * 180) / Math.PI;
  return radiusDeg - 90 + holeAxisOffsetDeg;
}

function applyThreadTangentRotations(
  items,
  { closedLoop = true, centerX = null, centerY = null } = {}
) {
  const hasCenter = Number.isFinite(centerX) && Number.isFinite(centerY);

  return items.map((item, index) => {
    if (item.type !== "bead" && item.type !== "spacer") {
      return item;
    }

    const holeAxisOffsetDeg =
      item.type === "bead" ? BEAD_HOLE_AXIS_OFFSET_DEG : SPACER_HOLE_AXIS_OFFSET_DEG;

    if (hasCenter && item.x != null && item.y != null) {
      return {
        ...item,
        rotation: getStrungItemRotationDegrees(item.type, item.x, item.y, centerX, centerY),
      };
    }

    const { prev, next } =
      item.type === "bead"
        ? getBeadTangentNeighbors(items, index, closedLoop)
        : getAdjacentNeighbors(items, index, closedLoop);
    if (!prev || !next) {
      return item;
    }

    return {
      ...item,
      rotation: getThreadTangentRotationDegrees(prev, next, holeAxisOffsetDeg),
    };
  });
}

function getUniformItemDimensions(type, slotCount, sizeScale, ringRadius) {
  const beadSize = getPackedBeadSize(slotCount, sizeScale, ringRadius);
  if (type === "spacer") {
    return {
      width: beadSize * SPACER_WIDTH_SCALE,
      height: beadSize * SPACER_HEIGHT_SCALE,
    };
  }
  return {
    width: beadSize,
    height: beadSize,
  };
}

function computeUniformSlotLayout({
  pattern,
  slotCount,
  defaultSizeId,
  centerX,
  centerY,
  ringRadius,
}) {
  const sizeScale = getBeadSizeScale(defaultSizeId);
  const angles = getBeadRingAngles(pattern.length, slotCount);

  const items = pattern.map((item, index) => {
    const point = getRingPoint(angles[index], centerX, centerY, ringRadius);
    const dimensions = getUniformItemDimensions(item.type, slotCount, sizeScale, ringRadius);

    return {
      ...item,
      x: point.x,
      y: point.y,
      width: dimensions.width,
      height: dimensions.height,
      rotation: 0,
    };
  });

  return {
    ringRadius,
    items: applyThreadTangentRotations(items, { closedLoop: true, centerX, centerY }),
  };
}

function getRingItemAngle(item, centerX, centerY, fallbackIndex = 0) {
  if (item?.x != null && item?.y != null) {
    return Math.atan2(item.y - centerY, item.x - centerX);
  }
  return CENTER_ANGLE - fallbackIndex * 0.02;
}

function midpointAngle(a0, a1) {
  const x = Math.cos(a0) + Math.cos(a1);
  const y = Math.sin(a0) + Math.sin(a1);
  if (x === 0 && y === 0) {
    return a0;
  }
  return Math.atan2(y, x);
}

/** Half-span along the string for layout (bead contact radius or spacer width). */
function getRingItemThreadHalfSpan(item, defaultSizeId = LAYOUT_BEAD_SIZE_ID) {
  if (!item) {
    return 0;
  }
  if (item.type === "spacer") {
    const half = (item.width ?? 0) / 2;
    return isScene81SpacerItem(item) ? getScene81SpacerLayoutHalfSpan(half) : half;
  }
  const visualWidth =
    item.width ?? resolveBeadVisualDiameter(item.sizeId || defaultSizeId);
  return (visualWidth * BEAD_ART_FILL_RATIO) / 2;
}

/**
 * Angle on the string at the crevice between two ring items. Bead–bead stays at the angular
 * midpoint; bead–spacer and spacer–bead use arc length so the charm sits between both parts.
 */
export function getGapAngleBetweenRingItems(
  layoutItems,
  gapIndex,
  centerX,
  centerY,
  defaultSizeId = LAYOUT_BEAD_SIZE_ID
) {
  const count = layoutItems.length;
  if (count < 2) {
    const only = layoutItems[0];
    // A single ring item leaves one gap — the whole loop back to itself — so its middle
    // is the far side, not the item's own angle.
    return only ? getRingItemAngle(only, centerX, centerY, 0) + Math.PI : CENTER_ANGLE;
  }

  const normalizedGap = ((gapIndex % count) + count) % count;
  const prev = layoutItems[normalizedGap];
  const next = layoutItems[(normalizedGap + 1) % count];
  const angles = layoutItems.map((item, index) =>
    getRingItemAngle(item, centerX, centerY, index)
  );
  const a0 = angles[normalizedGap];
  const a1 = angles[(normalizedGap + 1) % count];

  const prevR = getRingItemThreadHalfSpan(prev, defaultSizeId);
  const nextR = getRingItemThreadHalfSpan(next, defaultSizeId);
  const threadGap = getThreadGapBetween(prev, next);
  const totalSpan = prevR + threadGap + nextR;

  if (totalSpan <= 0) {
    return midpointAngle(a0, a1);
  }

  // Ring items are always laid out at decreasing angles, so every gap steps backwards.
  // Taking the shortest path instead would collapse both gaps of a two-item ring onto the
  // same angle, and would send an oversized wrap gap the wrong way round.
  const delta = backwardAngleDelta(a0, a1);

  const towardNext = (prevR + threadGap / 2) / totalSpan;
  return a0 + delta * towardNext;
}

/** String attachment point between two consecutive ring items (beads/spacers). */
export function getGapRingPoint(
  gapIndex,
  layoutItems,
  ringRadius,
  centerX,
  centerY,
  { stackIndex = 0, defaultSizeId = LAYOUT_BEAD_SIZE_ID } = {}
) {
  const count = layoutItems.length;
  if (!count) {
    return getRingPoint(CENTER_ANGLE, centerX, centerY, ringRadius);
  }

  if (count === 1) {
    const onlyAngle = getRingItemAngle(layoutItems[0], centerX, centerY, 0) + Math.PI;
    const angle = onlyAngle + stackIndex * CHARM_GAP_STACK_ANGLE_RAD;
    return getRingPoint(angle, centerX, centerY, ringRadius);
  }

  const gapAngle =
    getGapAngleBetweenRingItems(layoutItems, gapIndex, centerX, centerY, defaultSizeId) +
    stackIndex * CHARM_GAP_STACK_ANGLE_RAD;
  return getRingPoint(gapAngle, centerX, centerY, ringRadius);
}

function getCharmAttachmentAtAngle(gapAngle, ringRadius, centerX, centerY) {
  return {
    x: centerX + Math.cos(gapAngle) * ringRadius,
    y: centerY + Math.sin(gapAngle) * ringRadius,
    outwardPad: 0,
    edgeOffset: CHARM_STRING_EDGE_PX,
  };
}

function getCharmGapNeighbors(ringLayoutItems, gapIndex) {
  const count = ringLayoutItems.length;
  if (count < 2) {
    return { prev: null, next: null };
  }

  const normalizedGap = ((gapIndex % count) + count) % count;
  return {
    prev: ringLayoutItems[normalizedGap],
    next: ringLayoutItems[(normalizedGap + 1) % count],
  };
}

/** Outward reach of a strung component from the string — same rule for beads and spacers. */
function getRingItemOutwardExtentPx(item) {
  if (!item) {
    return 0;
  }
  if (item.type === "spacer") {
    return (item.height ?? 0) / 2;
  }
  return ((item.width ?? 0) * BEAD_ART_FILL_RATIO) / 2;
}

/** How far the bracelet surface reaches past the string at a segment. */
function getCharmGapEdgeOffsetPx(ringLayoutItems, gapIndex) {
  const { prev, next } = getCharmGapNeighbors(ringLayoutItems, gapIndex);
  const extent = Math.max(
    getRingItemOutwardExtentPx(prev),
    getRingItemOutwardExtentPx(next)
  );
  if (extent <= 0) {
    return CHARM_STRING_EDGE_PX;
  }
  return Math.max(CHARM_STRING_EDGE_PX, extent * CHARM_GAP_EDGE_RATIO);
}

/**
 * Frame of the segment between two adjacent components (bead or spacer):
 * anchor on the string at their midpoint, local +X along the tangent, local +Y outward.
 */
export function getCharmSegmentFrame(
  ringLayoutItems,
  gapIndex,
  ringRadius,
  centerX,
  centerY,
  defaultSizeId = LAYOUT_BEAD_SIZE_ID,
  { angleOffset = 0 } = {}
) {
  const { prev, next } = getCharmGapNeighbors(ringLayoutItems, gapIndex);
  const gapAngle =
    getGapAngleBetweenRingItems(
      ringLayoutItems,
      gapIndex,
      centerX,
      centerY,
      defaultSizeId
    ) + angleOffset;
  const outwardX = Math.cos(gapAngle);
  const outwardY = Math.sin(gapAngle);

  let tangentDeg = CHARM_HANG_AXIS_OFFSET_DEG;
  if (prev && next && !angleOffset) {
    tangentDeg += getThreadTangentRotationDegrees(prev, next, SPACER_HOLE_AXIS_OFFSET_DEG);
  } else {
    // Fanned off the crevice, so the charm hangs along the string where it actually sits
    // rather than along the line between its two neighbours.
    tangentDeg += (gapAngle * 180) / Math.PI - 90;
  }

  const radians = (tangentDeg * Math.PI) / 180;
  if (-Math.sin(radians) * outwardX + Math.cos(radians) * outwardY < 0) {
    tangentDeg += 180;
  }

  return {
    anchor: getRingPoint(gapAngle, centerX, centerY, ringRadius),
    tangentDeg,
    edgeOffset: getCharmGapEdgeOffsetPx(ringLayoutItems, gapIndex),
  };
}

/** Segment midpoint on the string — connector and charm are offset in pendant-local space. */
export function getCharmGapAttachmentPoint(
  gapIndex,
  layoutItems,
  ringRadius,
  centerX,
  centerY,
  defaultSizeId = LAYOUT_BEAD_SIZE_ID,
  { angleOffset = 0 } = {}
) {
  const frame = getCharmSegmentFrame(
    layoutItems,
    gapIndex,
    ringRadius,
    centerX,
    centerY,
    defaultSizeId,
    { angleOffset }
  );
  return {
    x: frame.anchor.x,
    y: frame.anchor.y,
    outwardPad: 0,
    edgeOffset: frame.edgeOffset,
  };
}

/**
 * Charm frame: local +X is the segment tangent; local +Y points outward from the bracelet.
 * Connector, jump ring and charm all rotate together by this angle around the anchor.
 */
export function getCharmGapHardwareRotationDegrees(
  ringLayoutItems,
  gapIndex,
  centerX,
  centerY,
  ringRadius,
  { angleOffset = 0 } = {}
) {
  return getCharmSegmentFrame(
    ringLayoutItems,
    gapIndex,
    ringRadius,
    centerX,
    centerY,
    LAYOUT_BEAD_SIZE_ID,
    { angleOffset }
  ).tangentDeg;
}

/** @deprecated Charm body no longer rotates with tangent — use hardware rotation only. */
export function getCharmGapTangentRotationDegrees(
  ringLayoutItems,
  gapIndex,
  centerX,
  centerY,
  attachment
) {
  const ringRadius =
    attachment && centerX != null && centerY != null
      ? Math.hypot(attachment.x - centerX, attachment.y - centerY)
      : 0;
  return getCharmGapHardwareRotationDegrees(
    ringLayoutItems,
    gapIndex,
    centerX,
    centerY,
    ringRadius
  );
}

function buildCharmPositionedAtPoint(
  item,
  attachment,
  dimensions,
  defaultSizeId,
  centerX,
  centerY,
  { rotation = 0, hardwareRotation = 0, charmRefSizeId = null } = {}
) {
  const refSizeId = charmRefSizeId || resolveCharmReferenceSizeId();
  const hardware = getCharmHardwareDimensions(refSizeId);

  return {
    ...item,
    x: attachment.x,
    y: attachment.y,
    outwardPad: attachment.outwardPad ?? 0,
    edgeOffset: attachment.edgeOffset ?? CHARM_STRING_EDGE_PX,
    width: dimensions.width,
    height: dimensions.height,
    charmRefSizeId: refSizeId,
    hardware,
    rotation,
    hardwareRotation,
    layoutCenterX: centerX,
    layoutCenterY: centerY,
  };
}

function buildCharmPositionedItem(item, centerX, centerY, ringRadius, dimensions, defaultSizeId) {
  const point = getCharmStringAttachmentPoint(centerX, centerY, ringRadius);
  return buildCharmPositionedAtPoint(item, point, dimensions, defaultSizeId, centerX, centerY);
}

function sortCharmPatternForEmptyRing(charmPattern) {
  return [...charmPattern].sort((a, b) => {
    const gapA = Number.isFinite(a.ringGap) ? a.ringGap : 0;
    const gapB = Number.isFinite(b.ringGap) ? b.ringGap : 0;
    if (gapA !== gapB) {
      return gapA - gapB;
    }
    return String(a.id ?? "").localeCompare(String(b.id ?? ""));
  });
}

function resolveCharmsOnlyRingRadius(charmPattern, ringRadiusHint, defaultSizeId = LAYOUT_BEAD_SIZE_ID) {
  const count = charmPattern.length;
  const hint = ringRadiusHint || BASE_RING_RADIUS;
  if (count <= 1) {
    return hint;
  }

  const refSizeId = resolveCharmReferenceSizeId();
  let maxHalfWidth = 0;
  charmPattern.forEach((charm) => {
    const dim = getCharmVisualDimensions(charm.asset, refSizeId);
    maxHalfWidth = Math.max(maxHalfWidth, dim.width * 0.52);
  });

  const step = (2 * Math.PI) / count;
  const minRadius = maxHalfWidth / Math.sin(step / 2);
  return Math.max(hint, minRadius);
}

function getCharmOnlySlotHardwareRotation(slotAngle) {
  let rotationDeg = CHARM_HANG_AXIS_OFFSET_DEG;
  rotationDeg += (slotAngle * 180) / Math.PI - 90;
  const outwardX = Math.cos(slotAngle);
  const outwardY = Math.sin(slotAngle);
  const radians = (rotationDeg * Math.PI) / 180;
  const hangX = -Math.sin(radians);
  const hangY = Math.cos(radians);
  if (hangX * outwardX + hangY * outwardY < 0) {
    rotationDeg += 180;
  }
  return rotationDeg;
}

/**
 * Hang rotation for a charm sitting anywhere on the string, by angle alone. The gap-based
 * layout weights a crevice by its two neighbours, but a charm being dragged is between gaps,
 * so it follows the tangent at the angle it currently rides — the same rule a fanned charm
 * already uses, which keeps it upright on the top and sides and not just at the bottom.
 */
export function getCharmHangRotationDegreesAtAngle(angle) {
  return getCharmOnlySlotHardwareRotation(angle);
}

/** Evenly space charms on the string when there are no beads or spacers. */
export function getCharmOnlySlotRingPoint(
  slotIndex,
  slotCount,
  ringRadius,
  centerX,
  centerY
) {
  if (!slotCount) {
    return getRingPoint(CENTER_ANGLE, centerX, centerY, ringRadius);
  }
  const normalized = ((slotIndex % slotCount) + slotCount) % slotCount;
  const step = (2 * Math.PI) / slotCount;
  const angle = CENTER_ANGLE - normalized * step;
  return getRingPoint(angle, centerX, centerY, ringRadius);
}

function buildCharmsOnlyRingLayout({
  charmPattern,
  centerX,
  centerY,
  ringRadiusHint,
  defaultSizeId,
}) {
  const sorted = sortCharmPatternForEmptyRing(charmPattern);
  const count = sorted.length;
  if (!count) {
    return { ringRadius: ringRadiusHint || BASE_RING_RADIUS, items: [] };
  }

  const charmRefSizeId = resolveCharmReferenceSizeId();
  const layoutRadius = resolveCharmsOnlyRingRadius(sorted, ringRadiusHint, defaultSizeId);
  const step = (2 * Math.PI) / count;

  const items = sorted.map((item, index) => {
    const angle = CENTER_ANGLE - index * step;
    const attachment = getCharmAttachmentAtAngle(angle, layoutRadius, centerX, centerY);
    const dimensions = getCharmVisualDimensions(item.asset, charmRefSizeId);
    const hardwareRotation = getCharmOnlySlotHardwareRotation(angle);

    return buildCharmPositionedAtPoint(
      { ...item, ringGap: index },
      attachment,
      dimensions,
      defaultSizeId,
      centerX,
      centerY,
      { rotation: hardwareRotation, hardwareRotation, charmRefSizeId }
    );
  });

  return { ringRadius: layoutRadius, items };
}

/** Backwards step from one ring angle to the next — the ring always winds that way. */
function backwardAngleDelta(from, to) {
  let delta = to - from;
  while (delta > 0) {
    delta -= 2 * Math.PI;
  }
  while (delta <= -2 * Math.PI) {
    delta += 2 * Math.PI;
  }
  return delta;
}

/**
 * Free room either side of a gap's crevice, as angle offsets. The crevice is weighted by
 * the neighbours' half-spans rather than centred, so the two sides are not equal.
 */
function getCharmGapFanRoom(
  ringLayoutItems,
  gapIndex,
  ringRadius,
  centerX,
  centerY,
  defaultSizeId
) {
  const count = ringLayoutItems.length;
  if (!count || !(ringRadius > 0)) {
    return { lo: -Math.PI, hi: Math.PI };
  }

  const halfSpanAngle = (item) =>
    getRingItemThreadHalfSpan(item, defaultSizeId) / ringRadius;

  if (count === 1) {
    const room = Math.max(0, Math.PI - halfSpanAngle(ringLayoutItems[0]));
    return { lo: -room, hi: room };
  }

  const normalizedGap = ((gapIndex % count) + count) % count;
  const prev = ringLayoutItems[normalizedGap];
  const next = ringLayoutItems[(normalizedGap + 1) % count];
  const a0 = getRingItemAngle(prev, centerX, centerY, normalizedGap);
  const a1 = getRingItemAngle(next, centerX, centerY, (normalizedGap + 1) % count);
  const gapAngle = getGapAngleBetweenRingItems(
    ringLayoutItems,
    normalizedGap,
    centerX,
    centerY,
    defaultSizeId
  );

  const toNext = backwardAngleDelta(a0, a1);
  const toGap = backwardAngleDelta(a0, gapAngle);

  return {
    lo: -Math.max(0, toGap - toNext - halfSpanAngle(next)),
    hi: Math.max(0, -toGap - halfSpanAngle(prev)),
  };
}

/**
 * Which gap each charm hangs in, and where it sits in that gap's stack. Charms normally
 * hold a gap each, but a string built charms-first ends up with more charms than gaps once
 * beads arrive. Those spill into whichever gap has the most room left per charm, so they
 * gather in the open arc rather than wedging between beads that already touch.
 */
function resolveCharmGapAssignments(charmPattern, ringCount, gapSpans) {
  const gapCount = Math.max(1, ringCount);
  const counts = new Array(gapCount).fill(0);
  const assignments = new Array(charmPattern.length).fill(null);
  const overflow = [];

  charmPattern.forEach((item, index) => {
    const raw = Number.isFinite(item.ringGap) ? Math.floor(item.ringGap) : index;
    const ringGap = ((raw % gapCount) + gapCount) % gapCount;
    if (counts[ringGap] > 0) {
      overflow.push(index);
      return;
    }
    counts[ringGap] = 1;
    assignments[index] = { ringGap, stackIndex: 0, stackCount: 1 };
  });

  const roomPerCharm = (gap) => (gapSpans[gap] ?? 0) / (counts[gap] + 1);
  overflow.forEach((index) => {
    let best = 0;
    for (let gap = 1; gap < gapCount; gap += 1) {
      if (roomPerCharm(gap) > roomPerCharm(best)) {
        best = gap;
      }
    }
    assignments[index] = { ringGap: best, stackIndex: counts[best], stackCount: 1 };
    counts[best] += 1;
  });

  // Stack order follows slot order within each gap, so the fan reads left to right.
  const seen = new Array(gapCount).fill(0);
  assignments.forEach((assignment) => {
    assignment.stackIndex = seen[assignment.ringGap];
    seen[assignment.ringGap] += 1;
    assignment.stackCount = counts[assignment.ringGap];
  });

  return assignments;
}

/**
 * Spread charms that share a gap across the room it has, inset by half a charm so the outer
 * two stop short of the neighbouring beads. A gap holding one charm leaves it exactly on the
 * crevice, so a normally built bracelet is untouched.
 */
function getCharmStackAngleOffset(stackIndex, stackCount, room, charmHalfAngle) {
  if (stackCount < 2) {
    return 0;
  }

  const span = room.hi - room.lo;
  const inset = Math.min(charmHalfAngle, span / (2 * stackCount));
  const start = room.lo + inset;
  const step = (span - 2 * inset) / (stackCount - 1);
  return start + stackIndex * step;
}

function buildCharmsOnRing({
  charmPattern,
  ringLayoutItems,
  ringRadius,
  centerX,
  centerY,
  defaultSizeId,
}) {
  const ringCount = ringLayoutItems.length;
  if (!ringCount && charmPattern.length) {
    return buildCharmsOnlyRingLayout({
      charmPattern,
      centerX,
      centerY,
      ringRadiusHint: ringRadius,
      defaultSizeId,
    }).items;
  }

  const charmRefSizeId = resolveCharmReferenceSizeId();
  const dimensionsByIndex = charmPattern.map((item) =>
    getCharmVisualDimensions(item.asset, charmRefSizeId)
  );
  const charmHalfAngle =
    ringRadius > 0
      ? dimensionsByIndex.reduce((widest, dim) => Math.max(widest, dim.width), 0) /
        2 /
        ringRadius
      : 0;
  const gapRooms = Array.from({ length: Math.max(1, ringCount) }, (_, gap) =>
    getCharmGapFanRoom(ringLayoutItems, gap, ringRadius, centerX, centerY, defaultSizeId)
  );
  const gapAssignments = resolveCharmGapAssignments(
    charmPattern,
    ringCount,
    gapRooms.map((room) => room.hi - room.lo)
  );

  return charmPattern.map((item, index) => {
    const dimensions = dimensionsByIndex[index];
    const { ringGap, stackIndex, stackCount } = gapAssignments[index];
    const angleOffset = getCharmStackAngleOffset(
      stackIndex,
      stackCount,
      gapRooms[ringGap],
      charmHalfAngle
    );
    const attachment = getCharmGapAttachmentPoint(
      ringGap,
      ringLayoutItems,
      ringRadius,
      centerX,
      centerY,
      defaultSizeId,
      { angleOffset }
    );
    const hardwareRotation = getCharmGapHardwareRotationDegrees(
      ringLayoutItems,
      ringGap,
      centerX,
      centerY,
      ringRadius,
      { angleOffset }
    );
    return buildCharmPositionedAtPoint(item, attachment, dimensions, defaultSizeId, centerX, centerY, {
      rotation: hardwareRotation,
      hardwareRotation,
      charmRefSizeId,
    });
  });
}

function usesEnamelBailLayout(asset) {
  return (
    asset &&
    Number(asset.aspect) > 0 &&
    asset.bailX != null &&
    asset.bailY != null
  );
}

/**
 * Top-view edge-on bail: thin vertical gold oval on the string (hole runs local +X).
 * Centered on the attachment so the string appears to pass through the ring.
 */
function buildEdgeOnStringBail(hardware, beadSizeId = LAYOUT_BEAD_SIZE_ID) {
  const beadVisual = getBeadDiameterPx(beadSizeId) * CHARM_VISUAL_SIZE_BOOST;
  const { strokeWidth } = hardware;
  const ry = Math.min(
    CHARM_EDGE_BAIL_RY_MAX_PX,
    Math.max(CHARM_EDGE_BAIL_RY_MIN_PX, beadVisual * CHARM_EDGE_BAIL_RY_SCALE)
  );
  const rx = Math.max(
    CHARM_EDGE_BAIL_RX_MIN_PX,
    beadVisual * CHARM_EDGE_BAIL_RX_SCALE,
    strokeWidth * 0.32
  );

  return {
    cx: 0,
    cy: 0,
    rx,
    ry,
    strokeWidth: Math.max(1.15, strokeWidth * 0.82),
    edgeOn: true,
    vertical: true,
  };
}

/** Lower half of the bail — drawn over the charm art so it threads the charm's own loop. */
function buildEdgeOnBailFrontArc(bail) {
  if (!bail) {
    return null;
  }
  const { cx, cy, rx, ry, strokeWidth } = bail;
  return {
    x1: cx - rx,
    y1: cy,
    x2: cx + rx,
    y2: cy,
    rx,
    ry,
    strokeWidth,
  };
}

/**
 * Enamel-sized charms: same hardware stack as standard (charm-side ring + short link + art).
 */
function getEnamelCharmPendantLayoutLocal(item, hardware) {
  return getStandardCharmPendantLayoutLocal(item, hardware, { layoutMode: "enamel" });
}

/**
 * Charm's painted loop rides on the bottom of our bail so the two rings interlock —
 * the bail's lower arc is drawn over the charm art (see `stringBailFrontArc`).
 */
function getStandardCharmPendantLayoutLocal(item, hardware, { layoutMode = "standard" } = {}) {
  const asset = item.asset;
  const bailX = asset?.bailX ?? 0.5;
  const bailY = asset?.bailY ?? CHARM_BAIL_ANCHOR_RATIO;
  const beadSizeId = item.charmRefSizeId || LAYOUT_BEAD_SIZE_ID;
  const stringBail = buildEdgeOnStringBail(hardware, beadSizeId);
  const hookCenterY =
    stringBail.cy + stringBail.ry * (1 + CHARM_BAIL_HOOK_DROP_RATIO);

  return {
    layoutMode,
    jumpRing: null,
    connector: null,
    stringBail,
    stringBailFrontArc: buildEdgeOnBailFrontArc(stringBail),
    charmImage: {
      x: -item.width * bailX,
      y: hookCenterY - item.height * bailY,
      width: item.width,
      height: item.height,
    },
  };
}

/**
 * Charm hardware in attachment-local space: the origin sits on the string at the segment
 * midpoint, local +X follows the segment tangent and local +Y points outward from the bracelet.
 * The whole assembly is rotated by `hardwareRotationDeg` around the anchor at (item.x, item.y).
 */
export function getCharmPendantLayout(item) {
  const charmRefSizeId = item.charmRefSizeId || LAYOUT_BEAD_SIZE_ID;
  const hardware = item.hardware || getCharmHardwareDimensions(charmRefSizeId);
  const hardwareRotationDeg = item.hardwareRotation ?? item.rotation ?? 0;
  const edgeOffset = Number.isFinite(item.edgeOffset) ? item.edgeOffset : CHARM_STRING_EDGE_PX;
  const core = usesEnamelBailLayout(item.asset)
    ? getEnamelCharmPendantLayoutLocal(item, hardware)
    : getStandardCharmPendantLayoutLocal(item, hardware);
  const stringJumpRing = core.stringBail;

  return {
    hardwareRotationDeg,
    attachment: { x: item.x, y: item.y },
    edgeOffset,
    stringStandoff: 0,
    stringJumpRing,
    stringLink: null,
    ...core,
    connectorLine: null,
    bailBar: null,
    ringCenter: stringJumpRing
      ? { x: stringJumpRing.cx, y: stringJumpRing.cy }
      : { x: 0, y: 0 },
  };
}

/** Charm image center in attachment-local space. */
export function getCharmImageLocalCenter(pendant) {
  const img = pendant?.charmImage;
  if (!img) {
    return { x: 0, y: 0 };
  }
  return {
    x: img.x + img.width / 2,
    y: img.y + img.height / 2,
  };
}

/** Map attachment-local pendant coordinates to world/SVG space. */
export function charmPendantLocalToWorld(localX, localY, attachmentX, attachmentY, rotationDeg) {
  const radians = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: attachmentX + localX * cos - localY * sin,
    y: attachmentY + localX * sin + localY * cos,
  };
}

/** @deprecated Use getCharmPendantLayout instead. */
export function getCharmImagePosition(item) {
  return getCharmPendantLayout(item).charmImage;
}

function buildItemsFromAngles({
  pattern,
  angles,
  ringRadius,
  centerX,
  centerY,
  defaultSizeId,
  closedLoop = true,
}) {
  const items = pattern.map((item, index) => {
    const point = getRingPoint(angles[index], centerX, centerY, ringRadius);
    const dimensions = getItemDimensions(item, pattern, index, defaultSizeId);

    if (item.type === "charm") {
      const charmRefSizeId = resolveCharmReferenceSizeId();
      return buildCharmPositionedAtPoint(item, point, dimensions, defaultSizeId, centerX, centerY, {
        charmRefSizeId,
      });
    }

    return {
      ...item,
      x: point.x,
      y: point.y,
      width: dimensions.width,
      height: dimensions.height,
      rotation: 0,
    };
  });

  return applyThreadTangentRotations(items, { closedLoop, centerX, centerY });
}

function patternHasSpacers(pattern) {
  return pattern.some((item) => item.type === "spacer");
}

function resolveLayoutRingRadius(pattern, defaultSizeId, ringRadiusHint) {
  if (!pattern.length) {
    return ringRadiusHint;
  }

  let radius = ringRadiusHint;
  for (let iteration = 0; iteration < 4; iteration += 1) {
    const occupied = getPatternOccupiedLength(pattern, defaultSizeId, { ringRadius: radius });
    if (!occupied) {
      return ringRadiusHint;
    }
    const nextRadius = occupied / (2 * Math.PI);
    if (Math.abs(nextRadius - radius) < 0.01) {
      return nextRadius;
    }
    radius = nextRadius;
  }

  return radius;
}

function getRingBeadPattern(pattern) {
  return pattern.filter((item) => item.type === "bead" || item.type === "spacer");
}

/**
 * Free size — small starter string; beads touch and pack anti-clockwise from 6 o'clock.
 * On the minimum string, beads sit on a partial arc (not a 1-bead micro-circle).
 * Once full, the string radius grows and beads redistribute on the closed loop.
 */
function buildFreeSizeTightRingLayout({
  pattern,
  defaultSizeId,
  centerX,
  centerY,
  ringRadiusHint,
}) {
  const ringPattern = getRingBeadPattern(pattern);
  const charmPattern = pattern.filter((item) => item.type === "charm");
  const minRadius = getRingRadiusForInches(FREE_SIZE_START_INCHES);
  const layoutRadius = ringRadiusHint || minRadius;
  const onMinString = layoutRadius <= minRadius + 0.01;

  if (!ringPattern.length) {
    return buildCharmsOnlyRingLayout({
      charmPattern,
      centerX,
      centerY,
      ringRadiusHint: layoutRadius,
      defaultSizeId,
    });
  }

  const layoutRadii = ringPattern.map((item, index) =>
    getItemLayoutRadius(item, ringPattern, index, defaultSizeId)
  );
  const count = ringPattern.length;

  const stepAngles = [];
  for (let index = 0; index < count; index += 1) {
    const nextIndex = (index + 1) % count;
    stepAngles.push(
      getStepAngleRadians(
        ringPattern[index],
        ringPattern[nextIndex],
        layoutRadii[index],
        layoutRadii[nextIndex],
        layoutRadius
      )
    );
  }

  const closedTotalAngle = stepAngles.reduce((sum, angle) => sum + angle, 0);
  const usePartialArc = onMinString && closedTotalAngle < 2 * Math.PI - 1e-6;

  let anglePosition = 0;
  const angles = [];

  if (usePartialArc) {
    for (let index = 0; index < count; index += 1) {
      angles.push(CENTER_ANGLE - anglePosition);
      if (index < count - 1) {
        anglePosition += stepAngles[index];
      }
    }
  } else {
    const circumference = getPatternClosedLoopCircumference(ringPattern, defaultSizeId);
    const stepArcLengths = stepAngles.map((_, index) => {
      const nextIndex = (index + 1) % count;
      return getStepArcLength(
        ringPattern[index],
        ringPattern[nextIndex],
        layoutRadii[index],
        layoutRadii[nextIndex]
      );
    });

    for (let index = 0; index < count; index += 1) {
      angles.push(CENTER_ANGLE - anglePosition);
      anglePosition += (stepArcLengths[index] / circumference) * (2 * Math.PI);
    }
  }

  const ringItems = buildItemsFromAngles({
    pattern: ringPattern,
    angles,
    ringRadius: layoutRadius,
    centerX,
    centerY,
    defaultSizeId,
    closedLoop: !usePartialArc,
  });

  const charmItems = buildCharmsOnRing({
    charmPattern,
    ringLayoutItems: ringItems,
    ringRadius: layoutRadius,
    centerX,
    centerY,
    defaultSizeId,
  });

  return {
    ringRadius: layoutRadius,
    items: [...ringItems, ...charmItems],
  };
}

/**
 * Manual string layout: same arc-length spacing as the Full Bead preset
 * (getStepAngleRadians, BEAD_ART_FILL_RATIO, SPACER_THREAD_GAP_PX, layout radius).
 * Item 0 stays anchored at 6 o'clock; each add/remove rebalances anti-clockwise on
 * the Full Bead reference ring, scaling gaps to fill the circle when not at capacity.
 */
function buildManualEvenRingLayout({
  pattern,
  defaultSizeId,
  centerX,
  centerY,
  ringRadiusHint,
  useFreeSizeGrowingRing = false,
  usePresetFixedRing = false,
}) {
  if (useFreeSizeGrowingRing) {
    return buildFreeSizeTightRingLayout({
      pattern,
      defaultSizeId,
      centerX,
      centerY,
      ringRadiusHint,
    });
  }

  const ringPattern = getRingBeadPattern(pattern);
  const charmPattern = pattern.filter((item) => item.type === "charm");

  const resolveManualLayoutRadius = () =>
    usePresetFixedRing
      ? ringRadiusHint
      : resolveAllBeadFullLayoutRadius(ringRadiusHint, defaultSizeId);

  if (!ringPattern.length) {
    return buildCharmsOnlyRingLayout({
      charmPattern,
      centerX,
      centerY,
      ringRadiusHint: resolveManualLayoutRadius(),
      defaultSizeId,
    });
  }

  const baseLayoutRadius = resolveManualLayoutRadius();
  const neededRadius = getPatternNeededLayoutRadius(ringPattern, defaultSizeId, {
    ringRadius: baseLayoutRadius,
    closedLoop: true,
  });
  const layoutRadius = Math.min(
    Math.max(baseLayoutRadius, neededRadius),
    getMaxLayoutRadius(ringRadiusHint)
  );
  const ringLayout = computeVariableLayoutOnFixedRing({
    pattern: ringPattern,
    defaultSizeId,
    centerX,
    centerY,
    ringRadius: layoutRadius,
    fullCircle: true,
    anchorAtStart: true,
    fillRemainingArc: ringPattern.length > 1,
    maxLayoutRadius: getMaxLayoutRadius(ringRadiusHint),
  });

  const charmItems = buildCharmsOnRing({
    charmPattern,
    ringLayoutItems: ringLayout.items,
    ringRadius: ringLayout.ringRadius,
    centerX,
    centerY,
    defaultSizeId,
  });

  return {
    ringRadius: ringLayout.ringRadius,
    items: [...ringLayout.items, ...charmItems],
  };
}

function computeRingStepAngles(pattern, layoutRadii, count, fullCircle, ringRadius) {
  const stepAngles = [];
  for (let index = 0; index < count; index += 1) {
    if (!fullCircle && index === count - 1) {
      break;
    }

    const nextIndex = fullCircle ? (index + 1) % count : index + 1;
    stepAngles.push(
      getStepAngleRadians(
        pattern[index],
        pattern[nextIndex],
        layoutRadii[index],
        layoutRadii[nextIndex],
        ringRadius
      )
    );
  }
  return stepAngles;
}

function computeVariableLayoutOnFixedRing({
  pattern,
  defaultSizeId,
  centerX,
  centerY,
  ringRadius,
  fullCircle,
  tightLoop = false,
  anchorAtStart = false,
  fillRemainingArc = false,
  maxLayoutRadius = Infinity,
}) {
  const count = pattern.length;
  const layoutRadii = pattern.map((item, index) =>
    getItemLayoutRadius(item, pattern, index, defaultSizeId)
  );

  let layoutRadius = ringRadius;
  let stepAngles = computeRingStepAngles(
    pattern,
    layoutRadii,
    count,
    fullCircle,
    layoutRadius
  );

  if (fillRemainingArc && fullCircle && anchorAtStart && count > 1) {
    const targetAngle = 2 * Math.PI;

    let totalAngle = stepAngles.reduce((sum, angle) => sum + angle, 0);
    if (totalAngle > targetAngle && totalAngle > 0) {
      for (let attempt = 0; attempt < 24 && totalAngle > targetAngle; attempt += 1) {
        layoutRadius *= totalAngle / targetAngle;
        if (layoutRadius > maxLayoutRadius) {
          layoutRadius = maxLayoutRadius;
        }
        stepAngles = computeRingStepAngles(
          pattern,
          layoutRadii,
          count,
          fullCircle,
          layoutRadius
        );
        totalAngle = stepAngles.reduce((sum, angle) => sum + angle, 0);
        if (layoutRadius >= maxLayoutRadius) {
          break;
        }
      }
    }

    totalAngle = stepAngles.reduce((sum, angle) => sum + angle, 0);
    if (totalAngle > 0 && totalAngle < targetAngle) {
      const scale = targetAngle / totalAngle;
      for (let index = 0; index < stepAngles.length; index += 1) {
        stepAngles[index] *= scale;
      }
    }
  }

  const closedTotalAngle = stepAngles.reduce((sum, angle) => sum + angle, 0);
  if (fullCircle && tightLoop) {
    layoutRadius = closedTotalAngle * layoutRadius / (2 * Math.PI);
  }

  // Partial arcs center on the top by default; manual strings anchor at bead 0 so
  // completing the loop does not rotate the whole bracelet.
  let anglePosition = fullCircle || anchorAtStart ? 0 : -closedTotalAngle / 2;
  const angles = [];

  for (let index = 0; index < count; index += 1) {
    angles.push(CENTER_ANGLE - anglePosition);
    if (index < stepAngles.length) {
      anglePosition += stepAngles[index];
    }
  }

  return {
    ringRadius: layoutRadius,
    items: buildItemsFromAngles({
      pattern,
      angles,
      ringRadius: layoutRadius,
      centerX,
      centerY,
      defaultSizeId,
      closedLoop: fullCircle,
    }),
  };
}

/**
 * Shared ring layout for SVG preview and exported output.
 * - Preset styles: uniform slots on a fixed ring (style only changes bead/spacer pattern).
 * - Manual (Empty): variable per-bead diameters on the thread.
 */
export function buildPositionedRingItems({
  pattern,
  slotCount,
  defaultSizeId = LAYOUT_BEAD_SIZE_ID,
  centerX,
  centerY,
  ringRadiusHint,
  isPartialCluster = false,
  useVariableDiameters = false,
  useManualEvenRingLayout = false,
  useFreeSizeGrowingRing = false,
  manualStringFull = false,
  usePresetFixedRing = false,
}) {
  if (!pattern.length) {
    return { items: [], ringRadius: ringRadiusHint || BASE_RING_RADIUS };
  }

  const ringRadius = ringRadiusHint || BASE_RING_RADIUS;
  const ringBeadPattern = getRingBeadPattern(pattern);
  const charmOnlyPattern = pattern.filter((item) => item.type === "charm");
  if (!ringBeadPattern.length && charmOnlyPattern.length) {
    return buildCharmsOnlyRingLayout({
      charmPattern: charmOnlyPattern,
      centerX,
      centerY,
      ringRadiusHint: ringRadius,
      defaultSizeId,
    });
  }

  if (!useVariableDiameters) {
    const effectiveRadius = resolveLayoutRingRadius(pattern, defaultSizeId, ringRadius);
    return computeVariableLayoutOnFixedRing({
      pattern,
      defaultSizeId,
      centerX,
      centerY,
      ringRadius: effectiveRadius,
      fullCircle: true,
      tightLoop: false,
    });
  }

  if (useManualEvenRingLayout) {
    return buildManualEvenRingLayout({
      pattern,
      defaultSizeId,
      centerX,
      centerY,
      ringRadiusHint: ringRadius,
      useFreeSizeGrowingRing,
      usePresetFixedRing,
    });
  }

  const manualFullCircle = manualStringFull && pattern.length > 1;
  const usePartialArc =
    !manualFullCircle && (isPartialCluster || pattern.length < slotCount);

  return computeVariableLayoutOnFixedRing({
    pattern,
    defaultSizeId,
    centerX,
    centerY,
    ringRadius,
    fullCircle: !usePartialArc,
    tightLoop: false,
    anchorAtStart: true,
    fillRemainingArc: false,
  });
}

/** PebblePal-style free-size starter — small circle before the string fills in. */
export const FREE_SIZE_START_INCHES = 2.5;

export function getRingRadiusForInches(lengthInches) {
  const maxRadius = getMaxPreviewRingRadius();
  const radiusAt4 = maxRadius * (MIN_BRACELET_LENGTH_INCHES / MAX_BRACELET_LENGTH_INCHES);
  const radiusAtFreeStart = radiusAt4 * (FREE_SIZE_START_INCHES / MIN_BRACELET_LENGTH_INCHES);

  const clampedLength = Math.min(
    Math.max(lengthInches, FREE_SIZE_START_INCHES),
    MAX_BRACELET_LENGTH_INCHES
  );

  if (clampedLength <= MIN_BRACELET_LENGTH_INCHES) {
    const startSpan = MIN_BRACELET_LENGTH_INCHES - FREE_SIZE_START_INCHES;
    const t = startSpan > 0 ? (clampedLength - FREE_SIZE_START_INCHES) / startSpan : 0;
    return radiusAtFreeStart + t * (radiusAt4 - radiusAtFreeStart);
  }

  const lengthSpan = MAX_BRACELET_LENGTH_INCHES - MIN_BRACELET_LENGTH_INCHES;
  const t = lengthSpan > 0 ? (clampedLength - MIN_BRACELET_LENGTH_INCHES) / lengthSpan : 1;
  return radiusAt4 + t * (maxRadius - radiusAt4);
}

/** Inverse of getRingRadiusForInches — maps layout radius to bracelet length (inches). */
export function getInchesForRingRadius(ringRadius) {
  if (!Number.isFinite(ringRadius)) {
    return FREE_SIZE_START_INCHES;
  }

  const maxRadius = getMaxPreviewRingRadius();
  const radiusAt4 = maxRadius * (MIN_BRACELET_LENGTH_INCHES / MAX_BRACELET_LENGTH_INCHES);
  const radiusAtFreeStart = radiusAt4 * (FREE_SIZE_START_INCHES / MIN_BRACELET_LENGTH_INCHES);

  if (ringRadius <= radiusAtFreeStart) {
    return FREE_SIZE_START_INCHES;
  }

  if (ringRadius <= radiusAt4) {
    const startSpan = MIN_BRACELET_LENGTH_INCHES - FREE_SIZE_START_INCHES;
    const radiusSpan = radiusAt4 - radiusAtFreeStart;
    const t = radiusSpan > 0 ? (ringRadius - radiusAtFreeStart) / radiusSpan : 0;
    return FREE_SIZE_START_INCHES + t * startSpan;
  }

  if (ringRadius >= maxRadius) {
    return MAX_BRACELET_LENGTH_INCHES;
  }

  const lengthSpan = MAX_BRACELET_LENGTH_INCHES - MIN_BRACELET_LENGTH_INCHES;
  const radiusSpan = maxRadius - radiusAt4;
  const t = radiusSpan > 0 ? (ringRadius - radiusAt4) / radiusSpan : 1;
  return MIN_BRACELET_LENGTH_INCHES + t * lengthSpan;
}

export function getRingRadiusForLength(activeLength) {
  const lengthInches =
    Number.parseFloat(activeLength?.id) || MAX_BRACELET_LENGTH_INCHES;
  return getRingRadiusForInches(lengthInches);
}

export function getPreviewCenter() {
  const top = PREVIEW_TOP_RESERVE;
  const bottom = PREVIEW_VIEW_SIZE - PREVIEW_BOTTOM_RESERVE;
  return {
    x: PREVIEW_VIEW_SIZE / 2,
    y: (top + bottom) / 2 + PREVIEW_CENTER_OFFSET_Y,
  };
}

/** Pendant reach past the string at a gap — used so 5.5" rings leave room for charms. */
function getCharmPreviewReachPx(beadSizeId = LAYOUT_BEAD_SIZE_ID) {
  const beadVisual = getBeadDiameterPx(beadSizeId) * CHARM_VISUAL_SIZE_BOOST;
  const bailRy = Math.min(
    CHARM_EDGE_BAIL_RY_MAX_PX,
    Math.max(CHARM_EDGE_BAIL_RY_MIN_PX, beadVisual * CHARM_EDGE_BAIL_RY_SCALE)
  );
  const charmHeight = beadVisual * CHARM_VISUAL_HEIGHT_SCALE;
  const hookCenterY = bailRy * (1 + CHARM_BAIL_HOOK_DROP_RATIO);
  const imageTopY = hookCenterY - charmHeight * CHARM_BAIL_ANCHOR_RATIO;
  const outwardReach = Math.max(bailRy + CHARM_STRING_EDGE_PX, charmHeight - imageTopY);
  return outwardReach + 6;
}

/**
 * Largest nominal ring radius that still draws inside the viewBox. Bead art and the
 * tight-fill expansion (MAX_LAYOUT_RADIUS_RATIO) both extend past this radius, so both
 * are subtracted here — otherwise the ring is clipped at the top and bottom edges.
 */
function getMaxPreviewRingRadius() {
  const beadVisualRadius = getBeadDiameterPx(LAYOUT_BEAD_SIZE_ID) / 2;
  const charmReach = getCharmPreviewReachPx(LAYOUT_BEAD_SIZE_ID);
  const center = getPreviewCenter();
  const maxFromTop = center.y - PREVIEW_TOP_RESERVE - beadVisualRadius - charmReach;
  const maxFromBottom =
    PREVIEW_VIEW_SIZE - PREVIEW_BOTTOM_RESERVE - center.y - beadVisualRadius - charmReach;
  const maxFromSide =
    PREVIEW_VIEW_SIZE / 2 - PREVIEW_SIDE_RESERVE - beadVisualRadius - charmReach;
  const fitRadius = Math.max(96, Math.min(maxFromTop, maxFromBottom, maxFromSide));
  return fitRadius / MAX_LAYOUT_RADIUS_RATIO;
}

export function getFilledDisplayLength(activeLength, quantity, maxCapacity) {
  if (!maxCapacity) return activeLength.displayLength;
  const minLength = Math.max(activeLength.displayLength * 0.55, activeLength.displayLength - 2.2);
  const fillRatio = Math.min(1, quantity / maxCapacity);
  return Number((minLength + (activeLength.displayLength - minLength) * fillRatio).toFixed(1));
}

export function getDisplayLengthFromOccupancy(activeLength, occupiedLength, availableLength) {
  if (!availableLength) return activeLength.displayLength;
  const minLength = Math.max(activeLength.displayLength * 0.55, activeLength.displayLength - 2.2);
  const fillRatio = Math.min(1, occupiedLength / availableLength);
  return Number((minLength + (activeLength.displayLength - minLength) * fillRatio).toFixed(1));
}
