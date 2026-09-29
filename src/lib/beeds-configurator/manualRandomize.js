import { getValidCharmGaps, pickNearestValidCharmGap } from "./beadRingDrag";

/** Empty-string manual build: show randomize after this many beads on the string. */
export const MANUAL_RANDOMIZE_MIN_BEADS = 10;

/** Delay between bead swaps so the shuffle reads as a wave around the ring. */
export const MANUAL_RANDOMIZE_STEP_MS = 90;

/** Matches the swap pop in beads-randomize.css, plus a frame of slack. */
export const MANUAL_RANDOMIZE_POP_MS = 320;

/** Every slot type the shuffle re-skins, using only keys already on the string. */
const SHUFFLED_TYPES = ["bead", "spacer", "charm"];

export function countManualBeads(manualItems) {
  return manualItems.filter((item) => item.type === "bead").length;
}

function getKeysOfType(manualItems, type) {
  return manualItems.filter((item) => item.type === type).map((item) => item.assetKey);
}

function shuffleArray(values) {
  const next = [...values];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/** Bead/spacer sequence the charm gap indices are measured against. */
function getRingSegmentEntries(manualItems) {
  return manualItems
    .filter((item) => item.type === "bead" || item.type === "spacer")
    .map((item) => ({ type: item.type }));
}

/**
 * One gap per even slice of the ring, each picked at random inside its slice and the
 * whole set rotated — charms land somewhere new without ever clumping on one arc.
 */
function pickSpreadCharmGaps(segmentCount, charmCount) {
  const slice = segmentCount / charmCount;
  const rotation = Math.floor(Math.random() * segmentCount);
  const gaps = [];

  for (let i = 0; i < charmCount; i += 1) {
    const start = Math.ceil(i * slice);
    const end = Math.max(start, Math.ceil((i + 1) * slice) - 1);
    const pick = start + Math.floor(Math.random() * (end - start + 1));
    gaps.push((pick + rotation) % segmentCount);
  }

  return gaps;
}

/**
 * Charms only ever sit in a gap between two ring items, one charm per gap, so the whole
 * set is re-dealt at once — moving them one at a time would collide mid-sequence.
 */
function buildCharmGapStep(manualItems) {
  const charms = manualItems.filter((item) => item.type === "charm");
  const segmentEntries = getRingSegmentEntries(manualItems);
  const segmentCount = segmentEntries.length;

  // Under two ring items there are no gaps: charms stack in slot order and cannot move.
  if (!charms.length || segmentCount < 2 || charms.length > segmentCount) {
    return null;
  }
  if (getValidCharmGaps(segmentCount, new Set(), segmentEntries).length < 2) {
    return null;
  }

  const wanted = pickSpreadCharmGaps(segmentCount, charms.length);
  const occupied = new Set();
  const gaps = [];

  shuffleArray(charms).forEach((charm, i) => {
    const ringGap = pickNearestValidCharmGap(
      wanted[i],
      segmentCount,
      occupied,
      segmentEntries
    );
    if (ringGap == null) {
      return;
    }
    occupied.add(ringGap);
    gaps.push({ charmId: charm.id, ringGap });
  });

  const moved = gaps.some(
    ({ charmId, ringGap }) =>
      charms.find((charm) => charm.id === charmId)?.ringGap !== ringGap
  );

  return moved ? { kind: "charmGaps", gaps } : null;
}

/** Reshuffled keys for one type, nudged so a no-op shuffle still changes something. */
function shuffleKeysOfType(manualItems, type) {
  const keys = getKeysOfType(manualItems, type);
  if (new Set(keys).size < 2) {
    return null;
  }

  let shuffled = shuffleArray(keys);
  if (shuffled.every((key, i) => key === keys[i])) {
    shuffled = [...keys];
    const swapAt = shuffled.findIndex((key, i) => i > 0 && key !== shuffled[0]);
    if (swapAt < 0) {
      return null;
    }
    [shuffled[0], shuffled[swapAt]] = [shuffled[swapAt], shuffled[0]];
  }

  return shuffled;
}

/** True when shuffle can change at least one slot using only what is already on the string. */
export function canManualRandomizeBracelet(manualItems) {
  if (countManualBeads(manualItems) < MANUAL_RANDOMIZE_MIN_BEADS) {
    return false;
  }
  if (SHUFFLED_TYPES.some((type) => new Set(getKeysOfType(manualItems, type)).size > 1)) {
    return true;
  }
  return Boolean(buildCharmGapStep(manualItems));
}

/**
 * Shuffle plan for the whole string: charms are re-dealt across the gaps first, then each
 * bead, spacer and charm slot takes a key borrowed from another slot of its own type.
 * Nothing new is pulled from the catalogue and no slot changes type, so the bracelet keeps
 * its length and its charm-per-gap layout.
 */
export function buildManualRandomizePlan(manualItems) {
  if (countManualBeads(manualItems) < MANUAL_RANDOMIZE_MIN_BEADS) {
    return [];
  }

  const shuffledByType = new Map();
  SHUFFLED_TYPES.forEach((type) => {
    const shuffled = shuffleKeysOfType(manualItems, type);
    if (shuffled) {
      shuffledByType.set(type, { keys: shuffled, cursor: 0 });
    }
  });

  const assetSteps = [];
  manualItems.forEach((item, index) => {
    const shuffle = shuffledByType.get(item.type);
    if (!shuffle) {
      return;
    }
    const assetKey = shuffle.keys[shuffle.cursor];
    shuffle.cursor += 1;
    if (!assetKey || assetKey === item.assetKey) {
      return;
    }
    assetSteps.push({
      kind: "asset",
      index,
      type: item.type,
      assetKey,
      beadSizeId: item.sizeId,
    });
  });

  const charmGapStep = buildCharmGapStep(manualItems);
  const plan = charmGapStep ? [charmGapStep, ...assetSteps] : assetSteps;
  return plan;
}
