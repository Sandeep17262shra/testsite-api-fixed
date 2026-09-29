import { LAYOUT_BEAD_SIZE_ID } from "./assets";
import {
  getGapAngleBetweenRingItems,
  getGapRingPoint,
  getRingPoint,
} from "./beadRingLayout";

/** Distance beyond the string radius before a drag counts as remove. */
export const RING_DRAG_REMOVE_THRESHOLD_PX = 42;

/** Pulling back inside this distance leaves the remove state again. */
export const RING_DRAG_REMOVE_EXIT_THRESHOLD_PX = 26;

export const RING_DRAG_PREVIEW_MS = 240;
export const RING_DRAG_SETTLE_MS = 300;
/** Every added item flies in with the same timing, beads, spacers and charms alike. */
export const BEAD_FLY_IN_MS = 540;
/** Soft pull toward the snap slot when the ghost is near the target gap. */
export const CHARM_DRAG_SNAP_LERP = 0.34;
/** Angular separation between neighbours while a charm is dragged (preview only). */
export const CHARM_GAP_SPREAD_RAD = 0.105;
/** How far around the ring the ghost pushes neighbours (radians). */
export const CHARM_GHOST_SPREAD_FALLOFF_RAD = 0.48;
/** Ease ring open/closed while dragging. */
export const CHARM_SPREAD_OPEN_LERP = 0.22;
/** Lift dragged charm slightly outward so it clears bead art (SVG px). */
export const CHARM_DRAG_GHOST_OUTWARD_LIFT_PX = 10;
/** Ghost snaps toward the slot when within this distance (SVG px). */
export const CHARM_DRAG_MAGNET_RADIUS_PX = 52;

export function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

export function easeOutQuint(t) {
  return 1 - (1 - t) ** 5;
}

/** User-space SVG units → screen pixels (handles responsive preview scaling). */
export function getSvgScreenScale(svgElement) {
  if (!svgElement) {
    return 1;
  }

  const matrix = svgElement.getScreenCTM();
  if (!matrix) {
    return 1;
  }

  return Math.hypot(matrix.a, matrix.b) || 1;
}

export function svgLengthToScreen(svgElement, length) {
  return length * getSvgScreenScale(svgElement);
}

export function svgPointToClient(svgElement, x, y) {
  if (!svgElement) {
    return { x: 0, y: 0 };
  }

  const point = svgElement.createSVGPoint();
  point.x = x;
  point.y = y;
  const matrix = svgElement.getScreenCTM();
  if (!matrix) {
    return { x: 0, y: 0 };
  }

  const transformed = point.matrixTransform(matrix);
  return { x: transformed.x, y: transformed.y };
}

export function rectCenterClient(rect) {
  if (!rect) {
    return { x: 0, y: 0 };
  }

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

export function pointerToSvgPoint(svgElement, clientX, clientY) {
  if (!svgElement) {
    return { x: 0, y: 0 };
  }

  const point = svgElement.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const matrix = svgElement.getScreenCTM()?.inverse();
  if (!matrix) {
    return { x: 0, y: 0 };
  }

  const transformed = point.matrixTransform(matrix);
  return { x: transformed.x, y: transformed.y };
}

export function getPointerAngle(centerX, centerY, x, y) {
  return Math.atan2(y - centerY, x - centerX);
}

export function getPointerDistance(centerX, centerY, x, y) {
  return Math.hypot(x - centerX, y - centerY);
}

export function isPointerOutsideRing(distance, ringRadius, threshold = RING_DRAG_REMOVE_THRESHOLD_PX) {
  return distance > ringRadius + threshold;
}

/**
 * Remove state with a hysteresis band: entering needs the full threshold, leaving needs
 * a shorter one, so hovering the boundary cannot flip the state every frame.
 */
export function resolveRemoveZone(distance, ringRadius, wasRemoveZone = false) {
  const limit =
    ringRadius +
    (wasRemoveZone ? RING_DRAG_REMOVE_EXIT_THRESHOLD_PX : RING_DRAG_REMOVE_THRESHOLD_PX);
  return distance > limit;
}

export function normalizeAngle(angle) {
  const twoPi = Math.PI * 2;
  let normalized = angle % twoPi;
  if (normalized < 0) {
    normalized += twoPi;
  }
  return normalized;
}

export function angularDistance(a, b) {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return Math.min(diff, Math.PI * 2 - diff);
}

export function midpointAngle(a0, a1) {
  const x = Math.cos(a0) + Math.cos(a1);
  const y = Math.sin(a0) + Math.sin(a1);
  if (x === 0 && y === 0) {
    return normalizeAngle(a0);
  }
  return Math.atan2(y, x);
}

export function getLayoutItemAngle(item, centerX, centerY, fallbackIndex = 0) {
  if (item?.x != null && item?.y != null) {
    return getPointerAngle(centerX, centerY, item.x, item.y);
  }

  return Math.PI / 2 - fallbackIndex * 0.02;
}

function angleStep(fromAngle, toAngle) {
  return Math.atan2(Math.sin(toAngle - fromAngle), Math.cos(toAngle - fromAngle));
}

export function findNearestGapIndex(
  layoutItems,
  centerX,
  centerY,
  pointerAngle,
  { closedLoop = true } = {}
) {
  const count = layoutItems.length;
  if (count <= 1) {
    return 0;
  }

  const angles = layoutItems.map((item, index) =>
    getLayoutItemAngle(item, centerX, centerY, index)
  );

  let bestGap = 0;
  let bestDistance = Infinity;

  const considerGap = (gapIndex, gapAngle) => {
    const distance = angularDistance(pointerAngle, gapAngle);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestGap = gapIndex;
    }
  };

  if (closedLoop) {
    for (let gap = 0; gap < count; gap += 1) {
      considerGap(gap, midpointAngle(angles[gap], angles[(gap + 1) % count]));
    }
    return bestGap;
  }

  if (count >= 2) {
    const firstAngle = angles[0];
    const nextAngle = angles[1];
    const beforeFirstAngle = firstAngle - angleStep(firstAngle, nextAngle) * 0.55;
    considerGap(0, beforeFirstAngle);

    for (let gap = 1; gap < count; gap += 1) {
      considerGap(gap, midpointAngle(angles[gap - 1], angles[gap]));
    }

    const lastAngle = angles[count - 1];
    const prevAngle = angles[count - 2];
    const afterLastAngle = lastAngle + angleStep(prevAngle, lastAngle) * 0.55;
    considerGap(count, afterLastAngle);
  }

  return bestGap;
}

/**
 * Where a charm dropped in `gap` will actually hang. This defers to the layout so the gap
 * the pointer snaps to is the gap the marker and the charm land in — a plain angular
 * midpoint disagrees with the layout wherever an arc runs the long way round (a two-item
 * ring, or the wrap gap of a partly filled free-size string), and it ignores the crevice
 * weighting that shifts a bead–spacer gap off centre.
 */
function getRingSegmentGapAngle(
  layoutItems,
  gap,
  centerX,
  centerY,
  closedLoop,
  defaultSizeId = LAYOUT_BEAD_SIZE_ID
) {
  const count = layoutItems.length;
  if (!closedLoop && (gap < 0 || gap >= count - 1)) {
    return null;
  }
  return getGapAngleBetweenRingItems(layoutItems, gap, centerX, centerY, defaultSizeId);
}

export function getRingSegmentEntries(pattern) {
  if (!pattern?.length) {
    return [];
  }
  return pattern.filter((entry) => entry.type === "bead" || entry.type === "spacer");
}

export function getRingSegmentCount(pattern) {
  return getRingSegmentEntries(pattern).length;
}

/** Gap/slot count for charm placement — bead gaps, or evenly spaced charm slots when the ring is empty. */
export function getCharmPlacementSegmentCount(pattern) {
  const ringCount = getRingSegmentEntries(pattern).length;
  if (ringCount > 0) {
    return ringCount;
  }
  const charmCount = pattern?.filter((entry) => entry.type === "charm").length ?? 0;
  return Math.max(1, charmCount);
}

/** Next slot index when adding a charm to an otherwise empty ring. */
export function getNextCharmOnlyRingGap(pattern) {
  const charmCount = pattern?.filter((entry) => entry.type === "charm").length ?? 0;
  return charmCount;
}

export const MAX_CHARMS_ON_EMPTY_RING = 20;

export function findNearestCharmOnlyGapIndex(pointerAngle, segmentCount) {
  if (segmentCount < 1) {
    return 0;
  }

  const step = (2 * Math.PI) / segmentCount;
  let bestGap = 0;
  let bestDistance = Infinity;

  for (let gap = 0; gap < segmentCount; gap += 1) {
    const gapAngle = Math.PI / 2 - (gap + 0.5) * step;
    const distance = angularDistance(pointerAngle, gapAngle);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestGap = gap;
    }
  }

  return bestGap;
}

/** Any gap along the on-string sequence (bead, spacer, bead, …). */
export function isBeadBeadCharmGap(gap, segmentEntries) {
  const count = segmentEntries?.length ?? 0;
  return count >= 2;
}

/** Map a charm’s index in the customize slot list to a ring gap. */
export function inferCharmRingGapFromSlotItems(items, charmSlotIndex) {
  if (!items?.length || charmSlotIndex < 0 || charmSlotIndex >= items.length) {
    return 0;
  }
  if (items[charmSlotIndex]?.type !== "charm") {
    return 0;
  }

  const ringCount = items.filter((item) => item.type !== "charm").length;
  if (ringCount < 2) {
    return items.slice(0, charmSlotIndex).filter((item) => item.type === "charm").length;
  }

  const ringBefore = items
    .slice(0, charmSlotIndex)
    .filter((item) => item.type !== "charm").length;
  if (ringBefore <= 0) {
    return 0;
  }
  return Math.min(ringBefore - 1, ringCount - 1);
}

/** Next free gap, preferring `preferredGap` when it is still available. */
export function pickNearestValidCharmGap(
  preferredGap,
  segmentCount,
  occupiedGaps,
  segmentEntries = null
) {
  if (segmentCount < 1) {
    return 0;
  }

  const preferred = normalizeCharmGapIndex(preferredGap, segmentCount);
  if (isValidCharmGap(preferred, segmentCount, occupiedGaps, segmentEntries)) {
    return preferred;
  }

  const valid = getValidCharmGaps(segmentCount, occupiedGaps, segmentEntries);
  if (!valid.length) {
    return null;
  }

  let best = valid[0];
  let bestDistance = Infinity;
  for (const gap of valid) {
    const direct = Math.abs(gap - preferred);
    const wrapped = segmentCount - direct;
    const distance = Math.min(direct, wrapped);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = gap;
    }
  }

  return best;
}

/**
 * Emptiest gap, nearest to `preferredGap` on a tie. Only used once every gap already holds
 * a charm, which happens when a string is built charms-first and beads arrive afterwards.
 */
export function pickLeastCrowdedCharmGap(preferredGap, segmentCount, chargesByGap) {
  if (segmentCount < 1) {
    return 0;
  }

  const preferred = normalizeCharmGapIndex(preferredGap, segmentCount);
  let best = preferred;
  let bestCharges = Infinity;
  let bestDistance = Infinity;

  for (let gap = 0; gap < segmentCount; gap += 1) {
    const charges = chargesByGap.get(gap) ?? 0;
    const direct = Math.abs(gap - preferred);
    const distance = Math.min(direct, segmentCount - direct);
    if (charges < bestCharges || (charges === bestCharges && distance < bestDistance)) {
      best = gap;
      bestCharges = charges;
      bestDistance = distance;
    }
  }

  return best;
}

/** Assign ring gaps to charms in customize-slot order, one per gap while gaps last. */
export function assignCharmRingGapsForSlotItems(items) {
  const segmentEntries = items
    .filter((item) => item.type === "bead" || item.type === "spacer")
    .map((item) => ({ type: item.type }));
  const segmentCount = segmentEntries.length;
  const occupied = new Set();
  const chargesByGap = new Map();
  const gapsByCharmId = new Map();

  const takeGap = (gap) => {
    const normalized = normalizeCharmGapIndex(gap, segmentCount);
    occupied.add(normalized);
    chargesByGap.set(normalized, (chargesByGap.get(normalized) ?? 0) + 1);
    return normalized;
  };

  items.forEach((item, index) => {
    if (item.type !== "charm") {
      return;
    }

    if (segmentCount < 2) {
      const slotGap = items.slice(0, index).filter((entry) => entry.type === "charm").length;
      gapsByCharmId.set(item.id, slotGap);
      return;
    }

    if (Number.isFinite(item.ringGap)) {
      const persisted = normalizeCharmGapIndex(item.ringGap, segmentCount);
      if (isValidCharmGap(persisted, segmentCount, occupied, segmentEntries)) {
        gapsByCharmId.set(item.id, takeGap(persisted));
        return;
      }
    }

    const inferred = inferCharmRingGapFromSlotItems(items, index);
    const preferred = normalizeCharmGapIndex(inferred, segmentCount);
    const ringGap = pickNearestValidCharmGap(preferred, segmentCount, occupied, segmentEntries);
    if (ringGap != null) {
      gapsByCharmId.set(item.id, takeGap(ringGap));
      return;
    }

    // Every gap is taken, so this charm has to double up — share the emptiest one rather
    // than dropping it on the inferred gap where it would sit on another charm.
    gapsByCharmId.set(
      item.id,
      takeGap(pickLeastCrowdedCharmGap(preferred, segmentCount, chargesByGap))
    );
  });

  return gapsByCharmId;
}

export function applyCharmGapsToSlotItems(items) {
  const gapsByCharmId = assignCharmRingGapsForSlotItems(items);
  return items.map((item) =>
    item.type === "charm"
      ? { ...item, ringGap: gapsByCharmId.get(item.id) ?? item.ringGap ?? 0 }
      : item
  );
}

function getRingItemIdsFromSlotItems(items) {
  return items
    .filter((item) => item.type === "bead" || item.type === "spacer")
    .map((item) => item.id);
}

function findRingGapForNeighborPair(ringIds, prevId, nextId) {
  const count = ringIds.length;
  if (!count || prevId == null || nextId == null) {
    return null;
  }
  for (let gap = 0; gap < count; gap += 1) {
    if (ringIds[gap] === prevId && ringIds[(gap + 1) % count] === nextId) {
      return gap;
    }
  }
  return null;
}

/** Keep charms on the same bead/spacer neighbors when ring items are inserted or removed. */
export function remapCharmRingGapsAfterSlotItemsChange(prevItems, nextItems) {
  const oldRing = getRingItemIdsFromSlotItems(prevItems);
  const newRing = getRingItemIdsFromSlotItems(nextItems);
  const oldRingIdSet = new Set(oldRing);

  if (newRing.length < 2) {
    return applyCharmGapsToSlotItems(nextItems);
  }

  const remapped = nextItems.map((item) => {
    if (item.type !== "charm" || !Number.isFinite(item.ringGap) || oldRing.length < 2) {
      return item;
    }

    const oldCount = oldRing.length;
    const oldGap = normalizeCharmGapIndex(item.ringGap, oldCount);
    const prevId = oldRing[oldGap];
    const nextId = oldRing[(oldGap + 1) % oldCount];

    let newGap = findRingGapForNeighborPair(newRing, prevId, nextId);
    if (newGap == null) {
      const newCount = newRing.length;
      for (let gap = 0; gap < newCount; gap += 1) {
        if (newRing[gap] !== prevId) {
          continue;
        }
        const midId = newRing[(gap + 1) % newCount];
        if (midId !== nextId && !oldRingIdSet.has(midId)) {
          newGap = gap;
          break;
        }
      }
    }
    if (newGap == null) {
      for (let gap = 0; gap < newRing.length; gap += 1) {
        const nextIndex = (gap + 1) % newRing.length;
        if (newRing[nextIndex] !== nextId) {
          continue;
        }
        const midId = newRing[gap];
        if (midId !== prevId && !oldRingIdSet.has(midId)) {
          newGap = gap;
          break;
        }
      }
    }

    if (newGap != null) {
      return { ...item, ringGap: newGap };
    }

    return item;
  });

  return applyCharmGapsToSlotItems(remapped);
}

export function getCharmOccupiedGaps(pattern, excludeCharmId = null) {
  const gaps = new Set();
  if (!pattern?.length) {
    return gaps;
  }

  pattern.forEach((entry) => {
    if (entry.type !== "charm") {
      return;
    }
    if (excludeCharmId && entry.id === excludeCharmId) {
      return;
    }
    if (Number.isFinite(entry.ringGap)) {
      gaps.add(entry.ringGap);
    }
  });

  return gaps;
}

export function normalizeCharmGapIndex(gap, segmentCount) {
  if (segmentCount < 1 || !Number.isFinite(gap)) {
    return 0;
  }
  return ((Math.floor(gap) % segmentCount) + segmentCount) % segmentCount;
}

/** A gap is valid when it is bead–bead, in range, and not already occupied by another charm. */
export function isValidCharmGap(gap, segmentCount, occupiedGaps, segmentEntries = null) {
  if (segmentCount < 1 || !Number.isFinite(gap)) {
    return false;
  }

  const normalized = normalizeCharmGapIndex(gap, segmentCount);
  const entries = segmentEntries ?? [];
  if (entries.length >= 2 && !isBeadBeadCharmGap(normalized, entries)) {
    return false;
  }

  for (const occupied of occupiedGaps) {
    const other = ((occupied % segmentCount) + segmentCount) % segmentCount;
    if (other === normalized) {
      return false;
    }
  }
  return true;
}

export function getValidCharmGaps(segmentCount, occupiedGaps, segmentEntries = null) {
  const valid = [];
  for (let gap = 0; gap < segmentCount; gap += 1) {
    if (isValidCharmGap(gap, segmentCount, occupiedGaps, segmentEntries)) {
      valid.push(gap);
    }
  }
  return valid;
}

export function findNearestValidCharmGapIndex(
  layoutItems,
  centerX,
  centerY,
  pointerAngle,
  segmentCount,
  occupiedGaps,
  segmentEntries = null,
  { closedLoop = true, defaultSizeId = LAYOUT_BEAD_SIZE_ID } = {}
) {
  const entries =
    segmentEntries ??
    layoutItems?.filter((item) => item.type === "bead" || item.type === "spacer") ??
    [];
  const valid = getValidCharmGaps(segmentCount, occupiedGaps, entries);
  if (!valid.length) {
    return null;
  }
  if (valid.length === 1) {
    return valid[0];
  }

  let bestGap = valid[0];
  let bestDistance = Infinity;

  for (const gap of valid) {
    const gapAngle = getRingSegmentGapAngle(
      layoutItems,
      gap,
      centerX,
      centerY,
      closedLoop,
      defaultSizeId
    );
    if (gapAngle == null) {
      continue;
    }
    const distance = angularDistance(pointerAngle, gapAngle);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestGap = gap;
    }
  }

  return bestGap;
}

/** Prefer gaps on the lower arc (reference-style charm band). */
export function pickDefaultCharmGap(
  segmentCount,
  occupiedGaps,
  layoutItems,
  centerX,
  centerY,
  segmentEntries = null
) {
  const entries =
    segmentEntries ??
    layoutItems?.filter((item) => item.type === "bead" || item.type === "spacer") ??
    [];
  const valid = getValidCharmGaps(segmentCount, occupiedGaps, entries);
  if (!valid.length) {
    return null;
  }

  const targetAngle = Math.PI / 2;
  let bestGap = valid[0];
  let bestDistance = Infinity;

  if (layoutItems?.length) {
    for (const gap of valid) {
      const gapAngle = getGapAngleBetweenRingItems(layoutItems, gap, centerX, centerY);
      const distance = angularDistance(gapAngle, targetAngle);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestGap = gap;
      }
    }
    return bestGap;
  }

  for (const gap of valid) {
    const gapAngle = (Math.PI * 2 * (gap + 0.5)) / segmentCount;
    const distance = angularDistance(gapAngle, targetAngle);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestGap = gap;
    }
  }

  return bestGap;
}

export function resolveCharmDragSnapGap({
  gapItems,
  centerX,
  centerY,
  pointerAngle,
  segmentCount,
  pattern,
  excludeCharmId,
  closedLoop = true,
  defaultSizeId = LAYOUT_BEAD_SIZE_ID,
}) {
  const occupied = getCharmOccupiedGaps(pattern, excludeCharmId);
  const segmentEntries = getRingSegmentEntries(pattern);
  const effectiveSegmentCount = segmentCount || getCharmPlacementSegmentCount(pattern);
  const rawCandidate = gapItems.length
    ? findNearestValidCharmGapIndex(
        gapItems,
        centerX,
        centerY,
        pointerAngle,
        effectiveSegmentCount,
        occupied,
        segmentEntries,
        { closedLoop, defaultSizeId }
      )
    : findNearestCharmOnlyGapIndex(pointerAngle, effectiveSegmentCount);
  const rawGap = normalizeCharmGapIndex(rawCandidate ?? 0, effectiveSegmentCount);

  if (isValidCharmGap(rawGap, effectiveSegmentCount, occupied, segmentEntries)) {
    return {
      snapGap: rawGap,
      rawGap,
      charmGapAdjusted: false,
    };
  }

  const snapGap = gapItems.length
    ? findNearestValidCharmGapIndex(
        gapItems,
        centerX,
        centerY,
        pointerAngle,
        effectiveSegmentCount,
        occupied,
        segmentEntries,
        { closedLoop, defaultSizeId }
      )
    : findNearestCharmOnlyGapIndex(pointerAngle, effectiveSegmentCount);

  const resolvedGap =
    snapGap == null
      ? rawGap
      : normalizeCharmGapIndex(snapGap, effectiveSegmentCount);

  return {
    snapGap: resolvedGap,
    rawGap,
    charmGapAdjusted: rawGap !== resolvedGap,
  };
}

/** Map a ring gap to a `manualItems` insert index after removing `fromIndex`. */
/**
 * Ring position a dragged item should be spliced into. `gapIndex` is measured on the ring
 * with the dragged item already lifted out, so it is a post-removal position and needs no
 * correction for where the item used to sit. `remainingCount` is that same reduced ring's
 * length, which is also a valid target — appending past the last item.
 */
export function gapToInsertIndex(gapIndex, remainingCount, { closedLoop = true } = {}) {
  const target = closedLoop ? gapIndex + 1 : gapIndex;
  return Math.max(0, Math.min(target, remainingCount));
}

export { getGapRingPoint } from "./beadRingLayout";

/**
 * Briefly opens the ring at `gapIndex` so the user can see where a charm will land.
 * Only mutates bead/spacer items; charms are unchanged.
 */
export function spreadRingLayoutItemsAtGap(
  items,
  gapIndex,
  { spreadRad = CHARM_GAP_SPREAD_RAD, centerX, centerY, ringRadius } = {}
) {
  if (!items?.length || spreadRad <= 0 || gapIndex == null || centerX == null || centerY == null) {
    return items;
  }

  const ringItems = items.filter((item) => item.type === "bead" || item.type === "spacer");
  const count = ringItems.length;
  if (count < 2) {
    return items;
  }

  const normalizedGap = ((gapIndex % count) + count) % count;
  const spreadById = new Map();

  ringItems.forEach((item, index) => {
    let angleAdjust = 0;
    if (index <= normalizedGap) {
      angleAdjust = -spreadRad / 2;
    } else {
      angleAdjust = spreadRad / 2;
    }

    if (angleAdjust === 0) {
      spreadById.set(item.id, item);
      return;
    }

    const angle = Math.atan2(item.y - centerY, item.x - centerX) + angleAdjust;
    const point = getRingPoint(angle, centerX, centerY, ringRadius);
    const rotationAdjustDeg = (angleAdjust * 180) / Math.PI;
    spreadById.set(item.id, {
      ...item,
      x: point.x,
      y: point.y,
      rotation: (item.rotation ?? 0) + rotationAdjustDeg,
    });
  });

  return items.map((item) => spreadById.get(item.id) ?? item);
}

function smoothstep01(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

/**
 * Opens space along the ring from the active gap, ghost proximity, and adjacent gaps so
 * neighbours ease aside smoothly instead of stacking under the dragged charm.
 */
export function spreadRingLayoutItemsForCharmDrag(
  items,
  {
    centerX,
    centerY,
    ringRadius,
    ghostX,
    ghostY,
    activeGap = 0,
    spreadRad = CHARM_GAP_SPREAD_RAD,
    spreadT = 1,
    falloffRad = CHARM_GHOST_SPREAD_FALLOFF_RAD,
    defaultSizeId = LAYOUT_BEAD_SIZE_ID,
  } = {}
) {
  if (
    !items?.length ||
    spreadT <= 0.001 ||
    centerX == null ||
    centerY == null ||
    ghostX == null ||
    ghostY == null
  ) {
    return items;
  }

  const ringItems = items.filter((item) => item.type === "bead" || item.type === "spacer");
  const count = ringItems.length;
  if (count < 2) {
    return items;
  }

  const normalizedActive = ((activeGap % count) + count) % count;
  const ghostAngle = Math.atan2(ghostY - centerY, ghostX - centerX);
  const gapWeight = new Array(count).fill(0);
  gapWeight[normalizedActive] = 1;

  for (let gap = 0; gap < count; gap += 1) {
    const point = getGapRingPoint(gap, ringItems, ringRadius, centerX, centerY, { defaultSizeId });
    const gapAngle = Math.atan2(point.y - centerY, point.x - centerX);
    const dist = Math.abs(angularDistance(ghostAngle, gapAngle));
    const proximity = 1 - Math.min(1, dist / falloffRad);
    gapWeight[gap] = Math.max(gapWeight[gap], smoothstep01(proximity) * 0.82);
  }

  const prevGap = (normalizedActive - 1 + count) % count;
  const nextGap = (normalizedActive + 1) % count;
  gapWeight[prevGap] = Math.max(gapWeight[prevGap], 0.42);
  gapWeight[nextGap] = Math.max(gapWeight[nextGap], 0.42);

  const effectiveSpread = spreadRad * spreadT;
  const spreadById = new Map();

  ringItems.forEach((item, index) => {
    let angleAdjust = 0;
    for (let gap = 0; gap < count; gap += 1) {
      const weight = gapWeight[gap];
      if (weight <= 0) {
        continue;
      }
      const half = (effectiveSpread * weight) / 2;
      if (index <= gap) {
        angleAdjust -= half;
      } else {
        angleAdjust += half;
      }
    }

    angleAdjust = Math.max(-effectiveSpread * 1.15, Math.min(effectiveSpread * 1.15, angleAdjust));

    if (Math.abs(angleAdjust) < 1e-5) {
      spreadById.set(item.id, item);
      return;
    }

    const angle = Math.atan2(item.y - centerY, item.x - centerX) + angleAdjust;
    const point = getRingPoint(angle, centerX, centerY, ringRadius);
    spreadById.set(item.id, {
      ...item,
      x: point.x,
      y: point.y,
      rotation: (item.rotation ?? 0) + (angleAdjust * 180) / Math.PI,
    });
  });

  return items.map((item) => spreadById.get(item.id) ?? item);
}

/** Drag preview for charms — updates ring gap without moving beads or spacers. */
export function buildCharmGapPreviewPattern(pattern, charmId, ringGap, { omitDragged = false } = {}) {
  return pattern
    .map((entry) => {
      if (entry.type !== "charm" || entry.id !== charmId) {
        return entry;
      }
      if (omitDragged) {
        return null;
      }
      return { ...entry, ringGap };
    })
    .filter(Boolean);
}

/** Virtual reorder for drag preview — does not mutate source. */
export function buildPreviewPattern(pattern, fromIndex, insertIndex, { omitDragged = false } = {}) {
  if (!pattern.length) {
    return [];
  }

  const items = [...pattern];
  const [moved] = items.splice(fromIndex, 1);

  if (omitDragged) {
    return items;
  }

  const safeInsert = Math.max(0, Math.min(insertIndex, items.length));
  items.splice(safeInsert, 0, moved);
  return items;
}

export function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

/** Signed a→b turn taken the short way round, so easing never laps the long side. */
export function shortestAngleDelta(a, b) {
  let delta = (b - a) % (Math.PI * 2);
  if (delta > Math.PI) {
    delta -= Math.PI * 2;
  } else if (delta < -Math.PI) {
    delta += Math.PI * 2;
  }
  return delta;
}

/** Per-frame ease toward a target angle along the short arc. */
export function approachAngle(current, target, amount) {
  return current + shortestAngleDelta(current, target) * amount;
}

/**
 * Frame-rate independent easing amount. A raw per-frame lerp eases faster on a 120Hz screen
 * than a 60Hz one; converting the 60Hz-tuned factor to a time constant keeps the feel equal.
 */
export function frameLerpAmount(amountAt60Hz, deltaMs) {
  const clampedDelta = Math.max(1, Math.min(64, deltaMs));
  return 1 - (1 - amountAt60Hz) ** (clampedDelta / (1000 / 60));
}

/**
 * Where a charm rides while dragged. The pointer's angle carries it continuously around the
 * string rather than between gap slots, and `freeT` (the remove blend) releases it from the
 * string radius so pulling away reads as lifting off rather than sliding along.
 */
export function getCharmDragArcPoint({
  centerX,
  centerY,
  ringRadius,
  pointerX,
  pointerY,
  outwardLift = CHARM_DRAG_GHOST_OUTWARD_LIFT_PX,
  freeT = 0,
}) {
  const angle = getPointerAngle(centerX, centerY, pointerX, pointerY);
  const pointerRadius = getPointerDistance(centerX, centerY, pointerX, pointerY);
  const arcRadius = ringRadius + outwardLift;
  const radius = lerp(arcRadius, Math.max(pointerRadius, arcRadius), Math.max(0, Math.min(1, freeT)));
  return {
    angle,
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
}

/**
 * How far each charm already on the ring should swing aside to open room for the dragged one.
 * Charms within `falloffRad` of the ghost are pushed away from it, easing off with distance so
 * the ring breathes open instead of neighbours jumping once a threshold is crossed.
 */
export function getCharmNeighbourSpreadOffsets(
  charms,
  ghostAngle,
  {
    centerX,
    centerY,
    spreadRad = CHARM_GAP_SPREAD_RAD * 2,
    falloffRad = CHARM_GHOST_SPREAD_FALLOFF_RAD,
    spreadT = 1,
  } = {}
) {
  const offsets = new Map();
  if (!charms?.length || spreadT <= 0.001 || !Number.isFinite(ghostAngle)) {
    return offsets;
  }

  charms.forEach((charm) => {
    if (charm.x == null || charm.y == null) {
      return;
    }
    const charmAngle = getPointerAngle(centerX, centerY, charm.x, charm.y);
    const delta = shortestAngleDelta(ghostAngle, charmAngle);
    const distance = Math.abs(delta);
    if (distance >= falloffRad) {
      return;
    }
    // Sitting exactly under the ghost has no side to fall to, so break the tie forwards.
    const direction = delta === 0 ? 1 : Math.sign(delta);
    const proximity = smoothstep01(1 - distance / falloffRad);
    offsets.set(charm.id, direction * spreadRad * proximity * spreadT);
  });

  return offsets;
}

export function lerpPoint(from, to, amount) {
  return {
    x: lerp(from.x, to.x, amount),
    y: lerp(from.y, to.y, amount),
  };
}

/** Minimum finger-friendly hit radius in SVG px (44px diameter). */
export function getRingDragHitRadius(item, { isCharm = false } = {}) {
  const visual = Math.max(item?.width ?? 0, item?.height ?? 0, isCharm ? 40 : 28);
  return Math.max(visual * 0.55, 22);
}

export function captureSvgPointer(svgElement, pointerId) {
  if (!svgElement?.setPointerCapture) {
    return false;
  }

  try {
    svgElement.setPointerCapture(pointerId);
    return true;
  } catch {
    return false;
  }
}

export function releaseSvgPointer(svgElement, pointerId) {
  if (!svgElement?.releasePointerCapture) {
    return;
  }

  try {
    if (svgElement.hasPointerCapture?.(pointerId)) {
      svgElement.releasePointerCapture(pointerId);
    }
  } catch {
    // Ignore release errors on teardown.
  }
}
