import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  BEADS,
  BEAD_LENGTHS,
  BEAD_CHARMS,
  BEAD_STYLES,
  DEFAULT_BEAD_KEY,
  DEFAULT_SEPARATOR_KEY,
  DEFAULT_CHARM_KEY,
  DEFAULT_BEAD_SIZE_ID,
  DEFAULT_STYLE_ID,
  DEFAULT_LENGTH_ID,
  RESET_STYLE_ID,
  RESET_LENGTH_ID,
  isManualStringStyle,
  FREE_SIZE_LENGTH_ID,
  SEPARATORS,
  isFreeSizeLength,
  isCharmCustomizationEnabled,
  resolveLengthOption,
  resolvePatternAsset,
} from "../assets";
import {
  canAddFreeSizeItem,
  getDisplayLengthLabel,
  getDynamicLengthInches,
  getFreeSizeRingRadius,
  getManualCapacityRingRadius,
} from "../dynamicLength";
import {
  getCharmOccupiedGaps,
  getCharmPlacementSegmentCount,
  getNextCharmOnlyRingGap,
  getRingSegmentCount,
  getRingSegmentEntries,
  getValidCharmGaps,
  assignCharmRingGapsForSlotItems,
  applyCharmGapsToSlotItems,
  remapCharmRingGapsAfterSlotItemsChange,
  isValidCharmGap,
  MAX_CHARMS_ON_EMPTY_RING,
  normalizeCharmGapIndex,
  pickDefaultCharmGap,
} from "../beadRingDrag";
import {
  buildTightFilledPattern,
  canAddItemToPattern,
  getAvailableStringLength,
  getPatternOccupiedLength,
  getRingRadiusForLength,
  MAX_LAYOUT_RADIUS_RATIO,
  patternFitsOnRing,
  patternFitsFixedStringLength,
  patternFitsManualFixedLength,
  toCapacityPattern,
  trimPatternToFit,
} from "../beadRingLayout";
import {
  getJewelryPriceForLength,
  getPatternCustomizePrice,
} from "../pricing";
import { getSuitableWristCm } from "../wristSizing";
import { playBeadAddSound, playBeadMoveSound, playBeadRemoveSound } from "../beadsSounds";
import {
  MANUAL_RANDOMIZE_MIN_BEADS,
  MANUAL_RANDOMIZE_POP_MS,
  MANUAL_RANDOMIZE_STEP_MS,
  buildManualRandomizePlan,
  canManualRandomizeBracelet,
  countManualBeads,
} from "../manualRandomize";

export const BeedsContext = createContext({});

const getDefaultBead = () => BEADS.find((bead) => bead.key === DEFAULT_BEAD_KEY) || BEADS[0];
const getDefaultSeparator = () => SEPARATORS.find((item) => item.key === DEFAULT_SEPARATOR_KEY) || SEPARATORS[0];
const getDefaultCharm = () => BEAD_CHARMS.find((item) => item.key === DEFAULT_CHARM_KEY) || BEAD_CHARMS[0];
const getDefaultLength = () => BEAD_LENGTHS.find((item) => item.id === "5") || BEAD_LENGTHS[0];
const MANUAL_CAPACITY_OPTIONS = {
  closedLoop: true,
  maxRadiusRatio: MAX_LAYOUT_RADIUS_RATIO,
};

/** Fixed-length preset bracelets — no extra radius slack; beads must fit the string. */
const PRESET_CAPACITY_OPTIONS = {
  closedLoop: true,
  maxRadiusRatio: 1,
};

/** Build the slot list after a customize replace, or null when the swap is not allowed. */
function buildCustomizeSlotReplacement(items, index, { type, assetKey, beadSizeId, defaultSizeId }) {
  if (index < 0 || index >= items.length) {
    return null;
  }

  const current = items[index];
  let nextItem;

  if (current.type === type) {
    nextItem = {
      ...current,
      assetKey,
      ...(type === "bead" ? { sizeId: beadSizeId } : {}),
    };
  } else if (current.type === "bead" && type === "spacer") {
    nextItem = { id: current.id, type: "spacer", assetKey };
  } else if (current.type === "spacer" && type === "bead") {
    nextItem = { id: current.id, type: "bead", assetKey, sizeId: beadSizeId };
  } else if (current.type === "charm" && (type === "bead" || type === "spacer")) {
    nextItem = {
      id: current.id,
      type,
      assetKey,
      ...(type === "bead" ? { sizeId: beadSizeId } : {}),
    };
  } else {
    return null;
  }

  const candidate = items.map((item, itemIndex) => (itemIndex === index ? nextItem : item));
  const touchesCharm = current.type === "charm" || type === "charm";

  return { candidate, touchesCharm };
}

function slotItemsFromPattern(pattern, defaultSizeId, createId) {
  const items = pattern
    .filter((item) => item.type === "bead" || item.type === "spacer" || item.type === "charm")
    .map((item) => {
      const assetKey = item.asset?.key;
      return {
        id: createId(),
        type: item.type,
        assetKey:
          assetKey ||
          (item.type === "bead"
            ? DEFAULT_BEAD_KEY
            : item.type === "spacer"
              ? DEFAULT_SEPARATOR_KEY
              : DEFAULT_CHARM_KEY),
        ...(item.type === "bead" ? { sizeId: item.sizeId || defaultSizeId } : {}),
        ...(item.type === "charm" && Number.isFinite(item.ringGap)
          ? { ringGap: item.ringGap }
          : {}),
      };
    });

  const charmGapsById = assignCharmRingGapsForSlotItems(items);
  return items.map((item) =>
    item.type === "charm"
      ? { ...item, ringGap: charmGapsById.get(item.id) ?? item.ringGap ?? 0 }
      : item
  );
}

/**
 * Rebuild the strung run for a new style or bead size while keeping the charms the shopper
 * picked. Charms hang in the gaps instead of taking up thread, so a different bead layout is
 * no reason to drop them — but a plain re-seed replaces the whole slot list, which is how they
 * were being lost. Any charms the fresh pattern carries are ignored while the shopper has
 * their own, so switching back and forth cannot duplicate them.
 */
function reseedPresetSlotItems(currentItems, pattern, defaultSizeId, createId) {
  const seeded = slotItemsFromPattern(pattern, defaultSizeId, createId);
  const keptCharms = currentItems.filter((item) => item.type === "charm");
  if (!keptCharms.length) {
    return seeded;
  }

  const previousRingCount = currentItems.filter((item) => item.type !== "charm").length;
  const nextRingItems = seeded.filter((item) => item.type !== "charm");
  const nextRingCount = nextRingItems.length;

  // A gap index only means something relative to the run it was measured on, so a run that
  // changed length needs them scaled — kept as-is, every charm slides round the bracelet.
  const rehomedCharms = keptCharms.map((charm) => {
    if (
      !Number.isFinite(charm.ringGap) ||
      previousRingCount < 1 ||
      nextRingCount < 1 ||
      previousRingCount === nextRingCount
    ) {
      return { ...charm };
    }
    const scaled = Math.round((charm.ringGap / previousRingCount) * nextRingCount);
    return { ...charm, ringGap: ((scaled % nextRingCount) + nextRingCount) % nextRingCount };
  });

  // Settles collisions and anything that scaled onto an invalid gap.
  return applyCharmGapsToSlotItems([...nextRingItems, ...rehomedCharms]);
}

function computeCharmRingGapForInsert(items, nextItem, insertIndex) {
  const at = Number.isFinite(insertIndex)
    ? Math.max(0, Math.min(insertIndex, items.length))
    : items.length;
  const candidate = [...items];
  candidate.splice(at, 0, nextItem);
  return assignCharmRingGapsForSlotItems(candidate).get(nextItem.id) ?? null;
}

/** Layout-only seed — per-slot stone/spacer choices must not reset the whole bracelet. */
function patternSeedFromPreset(pattern) {
  return JSON.stringify(
    pattern.map((item) => ({
      type: item.type,
      ...(item.type === "bead" ? { sizeId: item.sizeId } : {}),
    }))
  );
}

function cloneSlotItems(items) {
  return items.map((item) => ({ ...item }));
}

function buildStyleDesignSnapshot({
  styleId,
  lengthId,
  sizeId,
  selectedBeadKey,
  selectedSeparatorKey,
  selectedCharmKey,
  manualItems,
  presetSlotItems,
  presetPatternSeed,
}) {
  const manual = isManualStringStyle(styleId);
  return {
    styleId,
    lengthId,
    sizeId,
    selectedBeadKey,
    selectedSeparatorKey,
    selectedCharmKey,
    manualItems: manual ? cloneSlotItems(manualItems) : undefined,
    presetSlotItems: manual ? undefined : cloneSlotItems(presetSlotItems),
    presetPatternSeed: manual ? undefined : presetPatternSeed,
  };
}

/** Swap a slot list's charms for another set, re-dealing their gaps onto the kept bead run. */
function withCharms(items, charms) {
  const ringItems = items.filter((item) => item.type !== "charm");
  return applyCharmGapsToSlotItems([...cloneSlotItems(ringItems), ...cloneSlotItems(charms)]);
}

/**
 * `charms` replaces whatever charms the snapshot holds — style switching passes the charms the
 * shopper currently has so they survive the hop, while undo leaves it off to restore verbatim.
 */
function applyStyleDesignSnapshot(snapshot, {
  setLengthId,
  setSizeId,
  setSelectedBeadKey,
  setSelectedSeparatorKey,
  setSelectedCharmKey,
  setManualItems,
  setPresetSlotItems,
  presetSlotSeedRef,
}, { charms = null } = {}) {
  setLengthId(snapshot.lengthId);
  setSizeId(snapshot.sizeId);
  setSelectedBeadKey(snapshot.selectedBeadKey);
  setSelectedSeparatorKey(snapshot.selectedSeparatorKey);
  setSelectedCharmKey(snapshot.selectedCharmKey);

  if (snapshot.manualItems) {
    setManualItems(
      charms ? withCharms(snapshot.manualItems, charms) : cloneSlotItems(snapshot.manualItems)
    );
    presetSlotSeedRef.current = "";
    return;
  }

  if (snapshot.presetSlotItems) {
    setPresetSlotItems(
      charms
        ? withCharms(snapshot.presetSlotItems, charms)
        : cloneSlotItems(snapshot.presetSlotItems)
    );
    if (snapshot.presetPatternSeed) {
      presetSlotSeedRef.current = snapshot.presetPatternSeed;
    }
  }
}

export const BeedsProvider = ({ children }) => {
  const [jewelryCategory, setJewelryCategory] = useState("bead-bracelet");
  const [styleId, setStyleId] = useState(DEFAULT_STYLE_ID);
  const [lengthId, setLengthId] = useState(DEFAULT_LENGTH_ID);
  const [customizeTab, setCustomizeTab] = useState("beads");
  const [collectionId, setCollectionId] = useState("all");
  const [sizeId, setSizeId] = useState(DEFAULT_BEAD_SIZE_ID);
  const [selectedBeadKey, setSelectedBeadKey] = useState(DEFAULT_BEAD_KEY);
  const [selectedSeparatorKey, setSelectedSeparatorKey] = useState(DEFAULT_SEPARATOR_KEY);
  const [selectedCharmKey, setSelectedCharmKey] = useState(DEFAULT_CHARM_KEY);
  const [manualItems, setManualItems] = useState([]);
  const [presetSlotItems, setPresetSlotItems] = useState([]);
  const presetSlotSeedRef = useRef("");
  /** Per bracelet style — restore customize state when switching styles (necklace chain-ref pattern). */
  const styleDesignCacheRef = useRef(new Map());
  const [flyInAnimation, setFlyInAnimation] = useState(null);
  const [flyInGeneration, setFlyInGeneration] = useState(0);
  const flyInGenerationRef = useRef(0);
  const flyInSourceRectRef = useRef(null);
  const manualRandomizeSessionRef = useRef(null);
  const [isManualRandomizing, setIsManualRandomizing] = useState(false);
  /**
   * Beads already swapped in the running shuffle. Ids accumulate (rather than tracking
   * only the current bead) so each pop animation finishes instead of being cut off when
   * the next bead swaps; the set is emptied when a new shuffle starts.
   */
  const [randomizeSwappedIds, setRandomizeSwappedIds] = useState(() => new Set());
  const [randomizeTick, setRandomizeTick] = useState(0);
  const randomizeTimerRef = useRef(null);
  const [showResetPopup, setShowResetPopup] = useState(false);
  const selectedBead = useMemo(
    () => BEADS.find((bead) => bead.key === selectedBeadKey) || getDefaultBead(),
    [selectedBeadKey]
  );

  const selectedSeparator = useMemo(
    () => SEPARATORS.find((item) => item.key === selectedSeparatorKey) || getDefaultSeparator(),
    [selectedSeparatorKey]
  );

  const selectedCharm = useMemo(
    () => BEAD_CHARMS.find((item) => item.key === selectedCharmKey) || getDefaultCharm(),
    [selectedCharmKey]
  );

  const activeLength = useMemo(() => resolveLengthOption(lengthId), [lengthId]);
  const isManualMode = isManualStringStyle(styleId);
  const isCustomizeEnabled = true;
  const customizeSlotItems = isManualMode ? manualItems : presetSlotItems;
  const braceletCharms = useMemo(
    () => customizeSlotItems.filter((item) => item.type === "charm"),
    [customizeSlotItems]
  );
  const charmCount = braceletCharms.length;

  const capacityPattern = useMemo(
    () => toCapacityPattern(manualItems, sizeId),
    [manualItems, sizeId]
  );

  const suitableWristCm = useMemo(() => {
    if (!isManualMode || !capacityPattern.length) {
      return 0;
    }
    return getSuitableWristCm(capacityPattern, sizeId);
  }, [isManualMode, capacityPattern, sizeId]);

  const dynamicLengthInches = useMemo(
    () => getDynamicLengthInches(capacityPattern, sizeId),
    [capacityPattern, sizeId]
  );

  const isFreeSizeLayout = isManualMode && isFreeSizeLength(lengthId);

  const displayLengthLabel = useMemo(
    () =>
      getDisplayLengthLabel({
        lengthId,
        isManualMode,
        pattern: capacityPattern,
        itemCount: capacityPattern.length,
        defaultSizeId: sizeId,
        fixedLengthLabel: activeLength.label,
      }),
    [lengthId, isManualMode, capacityPattern, capacityPattern.length, sizeId, activeLength.label]
  );

  const ringRadius = useMemo(() => {
    if (isFreeSizeLayout) {
      return getFreeSizeRingRadius(capacityPattern, sizeId);
    }

    if (isFreeSizeLength(lengthId)) {
      return getFreeSizeRingRadius([], sizeId);
    }

    return getRingRadiusForLength(activeLength);
  }, [isFreeSizeLayout, lengthId, capacityPattern, sizeId, activeLength]);

  const capacityRingRadius = useMemo(
    () => getManualCapacityRingRadius(lengthId, ringRadius),
    [lengthId, ringRadius]
  );

  const availableStringLength = useMemo(
    () => getAvailableStringLength(ringRadius),
    [ringRadius]
  );

  const occupiedStringLength = useMemo(
    () =>
      getPatternOccupiedLength(capacityPattern, sizeId, {
        ringRadius,
        closedLoop: !isManualMode,
      }),
    [capacityPattern, ringRadius, isManualMode, sizeId]
  );

  const remainingStringLength = availableStringLength - occupiedStringLength;
  const usedCapacity = capacityPattern.length;

  const canAddManualItem = useCallback(
    (candidate) => {
      if (isFreeSizeLength(lengthId)) {
        return canAddFreeSizeItem(capacityPattern, candidate, sizeId);
      }

      return canAddItemToPattern(
        capacityPattern,
        candidate,
        capacityRingRadius,
        sizeId,
        { ...MANUAL_CAPACITY_OPTIONS, requireFixedStringLength: true }
      );
    },
    [capacityPattern, sizeId, capacityRingRadius, lengthId]
  );

  useEffect(() => {
    if (isManualStringStyle(styleId)) {
      return;
    }

    if (!BEAD_STYLES.some((style) => style.id === styleId)) {
      setStyleId(DEFAULT_STYLE_ID);
    }
  }, [styleId]);

  useEffect(() => {
    if (!isCharmCustomizationEnabled(styleId) && customizeTab === "charms") {
      setCustomizeTab("beads");
    }
  }, [styleId, customizeTab]);

  useEffect(() => {
    if (!isManualMode && isFreeSizeLength(lengthId)) {
      setLengthId("5");
    }
  }, [isManualMode, lengthId]);

  useEffect(() => {
    setManualItems((items) => {
      const ringPattern = toCapacityPattern(items, sizeId);
      let keepCount = ringPattern.length;
      while (
        keepCount > 0 &&
        !patternFitsManualFixedLength(
          ringPattern.slice(0, keepCount),
          capacityRingRadius,
          sizeId
        )
      ) {
        keepCount -= 1;
      }

      if (keepCount >= ringPattern.length) {
        return items;
      }

      // keepCount counts beads and spacers only — charms take no thread, so they are
      // never what has to go, and they must not shift the cut either.
      let ringKept = 0;
      const next = items.filter((item) => {
        if (item.type === "charm") {
          return true;
        }
        ringKept += 1;
        return ringKept <= keepCount;
      });
      return applyCharmGapsToSlotItems(next);
    });
  }, [lengthId, capacityRingRadius, sizeId]);

  const presetFill = useMemo(() => {
    if (isManualMode) {
      return { pattern: [], layoutRingRadius: ringRadius };
    }

    return buildTightFilledPattern({
      styleId,
      ringRadius,
      bead: selectedBead,
      separator: selectedSeparator,
      charm: selectedCharm,
      defaultSizeId: sizeId,
    });
  }, [isManualMode, styleId, ringRadius, selectedBead, selectedSeparator, selectedCharm, sizeId]);

  const presetPatternSeed = useMemo(
    () => (isManualMode ? "" : patternSeedFromPreset(presetFill.pattern)),
    [isManualMode, presetFill.pattern]
  );

  const styleUndoStacksRef = useRef(new Map());
  const suppressUndoRecordRef = useRef(false);
  const [undoStackRevision, setUndoStackRevision] = useState(0);
  const undoDesignStateRef = useRef({});
  undoDesignStateRef.current = {
    styleId,
    lengthId,
    sizeId,
    selectedBeadKey,
    selectedSeparatorKey,
    selectedCharmKey,
    manualItems,
    presetSlotItems,
    presetPatternSeed,
  };

  const bumpUndoRevision = useCallback(() => {
    setUndoStackRevision((revision) => revision + 1);
  }, []);

  const recordDesignUndoPoint = useCallback(() => {
    if (suppressUndoRecordRef.current) {
      return;
    }

    const snapshot = buildStyleDesignSnapshot(undoDesignStateRef.current);
    const stack = styleUndoStacksRef.current.get(snapshot.styleId) || [];
    stack.push(snapshot);
    const maxUndoSteps = 40;
    if (stack.length > maxUndoSteps) {
      stack.splice(0, stack.length - maxUndoSteps);
    }
    styleUndoStacksRef.current.set(snapshot.styleId, stack);
    bumpUndoRevision();
  }, [bumpUndoRevision]);

  const canUndoDesign = useMemo(() => {
    const stack = styleUndoStacksRef.current.get(styleId);
    return Boolean(stack?.length);
  }, [styleId, undoStackRevision]);

  const undoApplySetters = useMemo(
    () => ({
      setLengthId,
      setSizeId,
      setSelectedBeadKey,
      setSelectedSeparatorKey,
      setSelectedCharmKey,
      setManualItems,
      setPresetSlotItems,
      presetSlotSeedRef,
    }),
    []
  );

  const undoDesignStep = useCallback(() => {
    const stack = styleUndoStacksRef.current.get(styleId);
    if (!stack?.length) {
      return false;
    }

    const snapshot = stack.pop();
    styleUndoStacksRef.current.set(styleId, stack);
    suppressUndoRecordRef.current = true;
    applyStyleDesignSnapshot(snapshot, undoApplySetters);
    setFlyInAnimation(null);
    suppressUndoRecordRef.current = false;
    bumpUndoRevision();
    return true;
  }, [styleId, undoApplySetters, bumpUndoRevision]);

  const selectLengthId = useCallback(
    (nextLengthId) => {
      if (nextLengthId === lengthId) {
        return;
      }
      recordDesignUndoPoint();
      setLengthId(nextLengthId);
    },
    [lengthId, recordDesignUndoPoint]
  );

  const layoutRingRadius = isManualMode ? ringRadius : presetFill.layoutRingRadius;

  const mapSlotItemsToPatternEntries = useCallback(
    (items) =>
      items.map((item) => ({
        id: item.id,
        type: item.type,
        asset: resolvePatternAsset(item.type, item.assetKey),
        ...(item.type === "bead" ? { sizeId: item.sizeId || sizeId } : {}),
      })),
    [sizeId]
  );

  const buildPatternFromSlotItems = useCallback(
    (items) => {
      const charmGapsById = assignCharmRingGapsForSlotItems(items);
      const ringEntries = [];
      const charmEntries = [];

      items.forEach((item) => {
        const entry = {
          id: item.id,
          type: item.type,
          asset: resolvePatternAsset(item.type, item.assetKey),
          ...(item.type === "bead" ? { sizeId: item.sizeId || sizeId } : {}),
        };
        if (item.type === "charm") {
          charmEntries.push({
            ...entry,
            ringGap: Number.isFinite(item.ringGap)
              ? item.ringGap
              : (charmGapsById.get(item.id) ?? 0),
          });
        } else {
          ringEntries.push(entry);
        }
      });

      return [...ringEntries, ...charmEntries];
    },
    [sizeId]
  );

  const pattern = useMemo(() => {
    if (isManualMode) {
      return buildPatternFromSlotItems(manualItems);
    }
    return buildPatternFromSlotItems(presetSlotItems);
  }, [isManualMode, manualItems, presetSlotItems, buildPatternFromSlotItems]);

  useEffect(() => {
    const items = isManualMode ? manualItems : presetSlotItems;
    if (!items.some((item) => item.type === "charm" && !Number.isFinite(item.ringGap))) {
      return;
    }

    const syncItems = (current) => {
      if (!current.some((item) => item.type === "charm" && !Number.isFinite(item.ringGap))) {
        return current;
      }
      const gaps = assignCharmRingGapsForSlotItems(current);
      return current.map((item) =>
        item.type === "charm"
          ? {
              ...item,
              ringGap: Number.isFinite(item.ringGap)
                ? item.ringGap
                : (gaps.get(item.id) ?? 0),
            }
          : item
      );
    };

    if (isManualMode) {
      setManualItems(syncItems);
    } else {
      setPresetSlotItems(syncItems);
    }
  }, [isManualMode, manualItems, presetSlotItems]);

  const canAddCharm = useCallback(() => {
    const items = isManualMode ? manualItems : presetSlotItems;
    const charmCount = items.filter((item) => item.type === "charm").length;

    const segmentEntries = getRingSegmentEntries(pattern);
    if (!segmentEntries.length) {
      return charmCount < MAX_CHARMS_ON_EMPTY_RING;
    }
    const segmentCount = segmentEntries.length;
    const occupied = getCharmOccupiedGaps(pattern);
    return getValidCharmGaps(segmentCount, occupied, segmentEntries).length > 0;
  }, [isManualMode, manualItems, presetSlotItems, pattern]);

  const presetCapacityPattern = useMemo(
    () => toCapacityPattern(presetSlotItems, sizeId),
    [presetSlotItems, sizeId]
  );

  const presetCapacityPatternFits = useCallback(
    (capacityPattern) =>
      patternFitsOnRing(capacityPattern, layoutRingRadius, sizeId, PRESET_CAPACITY_OPTIONS) &&
      patternFitsFixedStringLength(capacityPattern, layoutRingRadius, sizeId),
    [layoutRingRadius, sizeId]
  );

  const canAddPresetItem = useCallback(
    (candidate) => {
      if (candidate.type === "charm") {
        return canAddCharm();
      }
      const normalized = {
        type: candidate.type,
        ...(candidate.type === "bead" ? { sizeId: candidate.sizeId || sizeId } : {}),
      };
      return presetCapacityPatternFits([...presetCapacityPattern, normalized]);
    },
    [presetCapacityPattern, presetCapacityPatternFits, sizeId, canAddCharm]
  );

  const presetPatternFits = useCallback(
    (items) => presetCapacityPatternFits(toCapacityPattern(items, sizeId)),
    [presetCapacityPatternFits, sizeId]
  );

  const slotItemsFitCapacity = useCallback(
    (items, { skipCharmCapacity = false } = {}) => {
      if (skipCharmCapacity) {
        return true;
      }

      const candidatePattern = toCapacityPattern(items, sizeId);
      if (isManualMode) {
        return patternFitsOnRing(
          candidatePattern,
          capacityRingRadius,
          sizeId,
          MANUAL_CAPACITY_OPTIONS
        );
      }

      return presetPatternFits(items);
    },
    [isManualMode, capacityRingRadius, sizeId, presetPatternFits]
  );

  const canReplaceCustomizeSlotAt = useCallback(
    (index, { type, assetKey, beadSizeId = sizeId } = {}) => {
      const items = isManualMode ? manualItems : presetSlotItems;
      const replacement = buildCustomizeSlotReplacement(items, index, {
        type,
        assetKey,
        beadSizeId,
        defaultSizeId: sizeId,
      });
      if (!replacement) {
        return false;
      }

      return slotItemsFitCapacity(replacement.candidate, {
        skipCharmCapacity: replacement.touchesCharm,
      });
    },
    [isManualMode, manualItems, presetSlotItems, sizeId, slotItemsFitCapacity]
  );

  const canApplyBeadSizeToAllPresetSlots = useCallback(
    (beadSizeId) => {
      if (isManualMode) {
        return false;
      }

      if (!presetSlotItems.some((item) => item.type === "bead")) {
        return false;
      }

      const candidate = presetSlotItems.map((item) =>
        item.type === "bead" ? { ...item, sizeId: beadSizeId } : item
      );
      return presetPatternFits(candidate);
    },
    [isManualMode, presetSlotItems, presetPatternFits]
  );

  const canAddBead = useCallback(
    (beadSizeId = sizeId) => {
      const candidate = { type: "bead", sizeId: beadSizeId };
      if (isManualMode) {
        return canAddManualItem(candidate);
      }
      return canAddPresetItem(candidate);
    },
    [isManualMode, canAddManualItem, canAddPresetItem, sizeId]
  );

  const canAddSpacer = useCallback(() => {
    const candidate = { type: "spacer" };
    if (isManualMode) {
      return canAddManualItem(candidate);
    }
    return canAddPresetItem(candidate);
  }, [isManualMode, canAddManualItem, canAddPresetItem]);

  const canAddMore = canAddBead() || canAddSpacer() || canAddCharm();
  const isStringFull = isManualMode && !canAddMore;

  const jewelryPrice = useMemo(
    () => getJewelryPriceForLength(lengthId, dynamicLengthInches),
    [lengthId, dynamicLengthInches]
  );
  const customizePrice = useMemo(() => getPatternCustomizePrice(pattern), [pattern]);
  const totalPrice = customizePrice;

  const clearFlyInAnimation = useCallback(() => {
    setFlyInAnimation(null);
  }, []);

  const createManualItemId = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const normalizeFlyInSourceRect = (sourceRect) =>
    sourceRect
      ? {
          left: sourceRect.left,
          top: sourceRect.top,
          width: sourceRect.width,
          height: sourceRect.height,
          right: sourceRect.right,
          bottom: sourceRect.bottom,
        }
      : null;

  const queueFlyInAnimation = useCallback(
    ({
      itemId,
      type,
      assetKey,
      beadSizeId = sizeId,
      sourceRect,
      slotIndex = null,
      ringGap = null,
    }) => {
      const normalizedSource = normalizeFlyInSourceRect(sourceRect);
      if (normalizedSource) {
        flyInSourceRectRef.current = normalizedSource;
      }
      const nextGeneration = flyInGenerationRef.current + 1;
      flyInGenerationRef.current = nextGeneration;
      const sessionKey = `${nextGeneration}:${itemId ?? `slot-${slotIndex ?? "x"}`}`;
      setFlyInGeneration(nextGeneration);
      setFlyInAnimation({
        itemId,
        type,
        assetKey,
        sizeId: beadSizeId,
        sourceRect: normalizedSource,
        sessionKey,
        ...(slotIndex != null ? { slotIndex } : {}),
        ...(type === "charm" && Number.isFinite(ringGap) ? { ringGap } : {}),
      });
    },
    [sizeId]
  );

  useEffect(() => {
    if (isManualMode) {
      presetSlotSeedRef.current = "";
      return;
    }
    if (presetPatternSeed === presetSlotSeedRef.current) {
      return;
    }
    presetSlotSeedRef.current = presetPatternSeed;
    setPresetSlotItems((current) =>
      reseedPresetSlotItems(current, presetFill.pattern, sizeId, createManualItemId)
    );
  }, [isManualMode, presetPatternSeed, presetFill.pattern, sizeId]);

  const insertSlotItem = useCallback((items, nextItem, insertIndex) => {
    const at = Number.isFinite(insertIndex)
      ? Math.max(0, Math.min(insertIndex, items.length))
      : items.length;
    const next = [...items];
    next.splice(at, 0, nextItem);
    return next;
  }, []);

  const addManualItem = useCallback(
    (type, assetKey, beadSizeId = sizeId, options = {}) => {
      if (!isManualMode) {
        return false;
      }

      if (type === "charm") {
        if (!canAddCharm()) {
          return false;
        }
      } else {
        const candidate =
          type === "bead" ? { type: "bead", sizeId: beadSizeId } : { type: "spacer" };
        if (!canAddManualItem(candidate)) {
          return false;
        }
      }

      const nextId = createManualItemId();
      let nextItem = {
        id: nextId,
        type,
        assetKey,
        ...(type === "bead" ? { sizeId: beadSizeId } : {}),
      };
      if (type === "charm") {
        const ringGap = computeCharmRingGapForInsert(
          manualItems,
          nextItem,
          options.insertIndex
        );
        if (ringGap != null) {
          nextItem = { ...nextItem, ringGap };
        }
      }
      const slotIndex = Number.isFinite(options.insertIndex)
        ? Math.max(0, options.insertIndex)
        : manualItems.length;

      recordDesignUndoPoint();
      setManualItems((items) => {
        const next = insertSlotItem(items, nextItem, options.insertIndex);
        if (type === "bead" || type === "spacer") {
          return remapCharmRingGapsAfterSlotItemsChange(items, next);
        }
        return applyCharmGapsToSlotItems(next);
      });

      queueFlyInAnimation({
        itemId: nextId,
        type,
        assetKey,
        beadSizeId,
        sourceRect: options.sourceRect,
        slotIndex: type === "charm" ? null : slotIndex,
        ringGap: type === "charm" ? nextItem.ringGap : null,
      });

      playBeadAddSound();

      return true;
    },
    [
      isManualMode,
      canAddManualItem,
      canAddCharm,
      insertSlotItem,
      queueFlyInAnimation,
      sizeId,
      manualItems,
      recordDesignUndoPoint,
    ]
  );

  const addPresetSlotItem = useCallback(
    (type, assetKey, beadSizeId = sizeId, options = {}) => {
      if (isManualMode) {
        return false;
      }

      if (type === "charm") {
        if (!canAddCharm()) {
          return false;
        }
      } else {
        const candidate =
          type === "bead" ? { type: "bead", sizeId: beadSizeId } : { type: "spacer" };
        if (!canAddPresetItem(candidate)) {
          return false;
        }
      }

      const nextId = createManualItemId();
      let nextItem = {
        id: nextId,
        type,
        assetKey,
        ...(type === "bead" ? { sizeId: beadSizeId } : {}),
      };
      if (type === "charm") {
        const ringGap = computeCharmRingGapForInsert(
          presetSlotItems,
          nextItem,
          options.insertIndex
        );
        if (ringGap != null) {
          nextItem = { ...nextItem, ringGap };
        }
      }
      const slotIndex = Number.isFinite(options.insertIndex)
        ? Math.max(0, options.insertIndex)
        : presetSlotItems.length;

      recordDesignUndoPoint();
      setPresetSlotItems((items) => {
        const next = insertSlotItem(items, nextItem, options.insertIndex);
        if (type === "bead" || type === "spacer") {
          return remapCharmRingGapsAfterSlotItemsChange(items, next);
        }
        return applyCharmGapsToSlotItems(next);
      });

      queueFlyInAnimation({
        itemId: nextId,
        type,
        assetKey,
        beadSizeId,
        sourceRect: options.sourceRect,
        slotIndex: type === "charm" ? null : slotIndex,
        ringGap: type === "charm" ? nextItem.ringGap : null,
      });

      playBeadAddSound();
      return true;
    },
    [
      isManualMode,
      canAddPresetItem,
      canAddCharm,
      insertSlotItem,
      sizeId,
      queueFlyInAnimation,
      presetSlotItems,
      recordDesignUndoPoint,
    ]
  );

  const addBraceletCharm = useCallback(
    (assetKey, options = {}) => {
      if (isManualMode) {
        return addManualItem("charm", assetKey, sizeId, options);
      }
      return addPresetSlotItem("charm", assetKey, sizeId, options);
    },
    [isManualMode, addManualItem, addPresetSlotItem, sizeId]
  );

  const removeBraceletCharmById = useCallback(
    (charmId, { playSound = true } = {}) => {
      const removeFrom = (items) => {
        const index = items.findIndex((item) => item.id === charmId && item.type === "charm");
        if (index < 0) {
          return { items, didRemove: false };
        }
        return {
          items: items.filter((_, itemIndex) => itemIndex !== index),
          didRemove: true,
        };
      };

      const hasCharm = (isManualMode ? manualItems : presetSlotItems).some(
        (item) => item.id === charmId && item.type === "charm"
      );
      if (!hasCharm) {
        return;
      }
      recordDesignUndoPoint();

      const currentItems = isManualMode ? manualItems : presetSlotItems;
      const { items: nextItems, didRemove } = removeFrom(currentItems);
      if (!didRemove) {
        return;
      }

      if (isManualMode) {
        setManualItems(nextItems);
      } else {
        setPresetSlotItems(nextItems);
      }

      if (playSound) {
        playBeadRemoveSound();
      }
    },
    [isManualMode, manualItems, presetSlotItems, recordDesignUndoPoint]
  );

  const updateBraceletCharmGap = useCallback(
    (charmId, ringGap, { playSound = true } = {}) => {
      const segmentEntries = getRingSegmentEntries(pattern);
      const segmentCount = getCharmPlacementSegmentCount(pattern);
      const occupied = getCharmOccupiedGaps(pattern, charmId);
      const normalizedGap = normalizeCharmGapIndex(ringGap, segmentCount);
      if (!isValidCharmGap(normalizedGap, segmentCount, occupied, segmentEntries)) {
        return;
      }

      const charmItem = (isManualMode ? manualItems : presetSlotItems).find(
        (item) => item.id === charmId && item.type === "charm"
      );
      if (!charmItem || charmItem.ringGap === normalizedGap) {
        return;
      }
      recordDesignUndoPoint();

      const currentItems = isManualMode ? manualItems : presetSlotItems;
      let didUpdate = false;
      const nextItems = currentItems.map((item) => {
        if (item.id !== charmId || item.type !== "charm") {
          return item;
        }
        if (item.ringGap === normalizedGap) {
          return item;
        }
        didUpdate = true;
        return { ...item, ringGap: normalizedGap };
      });

      if (!didUpdate) {
        return;
      }

      if (isManualMode) {
        setManualItems(nextItems);
      } else {
        setPresetSlotItems(nextItems);
      }

      if (playSound) {
        playBeadMoveSound();
      }
    },
    [isManualMode, pattern, manualItems, presetSlotItems, recordDesignUndoPoint]
  );

  const removeManualItemAt = useCallback((index, { playSound = true } = {}) => {
    if (index < 0 || index >= manualItems.length) {
      return;
    }
    recordDesignUndoPoint();
    let didRemove = false;

    setManualItems((items) => {
      if (index < 0 || index >= items.length) {
        return items;
      }

      didRemove = true;
      const removed = items[index];
      const next = items.filter((_, itemIndex) => itemIndex !== index);
      if (removed?.type === "bead" || removed?.type === "spacer") {
        return remapCharmRingGapsAfterSlotItemsChange(items, next);
      }
      return next;
    });

    if (didRemove && playSound) {
      playBeadRemoveSound();
    }
  }, [manualItems.length, recordDesignUndoPoint]);

  const reorderManualItems = useCallback((fromIndex, toIndex, { playSound = true } = {}) => {
    if (fromIndex === toIndex) return;
    recordDesignUndoPoint();

    let didReorder = false;

    setManualItems((items) => {
      const updated = [...items];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      const candidatePattern = toCapacityPattern(updated, sizeId);
      if (!patternFitsOnRing(candidatePattern, capacityRingRadius, sizeId, MANUAL_CAPACITY_OPTIONS)) {
        return items;
      }

      didReorder = true;
      // A reorder changes who sits either side of each gap, so charms have to follow their
      // neighbours rather than keep a gap number that now points somewhere else.
      return remapCharmRingGapsAfterSlotItemsChange(items, updated);
    });

    if (didReorder && playSound) {
      playBeadMoveSound();
    }
    return didReorder;
  }, [capacityRingRadius, sizeId, recordDesignUndoPoint]);

  const reorderPresetSlotItems = useCallback((fromIndex, toIndex, { playSound = true } = {}) => {
    if (fromIndex === toIndex) {
      return false;
    }
    recordDesignUndoPoint();

    let didReorder = false;

    setPresetSlotItems((items) => {
      if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex > items.length) {
        return items;
      }
      const updated = [...items];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      didReorder = true;
      return remapCharmRingGapsAfterSlotItemsChange(items, updated);
    });

    if (didReorder && playSound) {
      playBeadMoveSound();
    }
    return didReorder;
  }, [recordDesignUndoPoint]);

  const removePresetSlotAt = useCallback((index, { playSound = true } = {}) => {
    if (index < 0 || index >= presetSlotItems.length) {
      return;
    }
    recordDesignUndoPoint();
    let didRemove = false;

    setPresetSlotItems((items) => {
      if (index < 0 || index >= items.length) {
        return items;
      }
      didRemove = true;
      const removed = items[index];
      const next = items.filter((_, itemIndex) => itemIndex !== index);
      if (removed?.type === "bead" || removed?.type === "spacer") {
        return remapCharmRingGapsAfterSlotItemsChange(items, next);
      }
      return next;
    });

    if (didRemove && playSound) {
      playBeadRemoveSound();
    }
  }, [presetSlotItems.length, recordDesignUndoPoint]);

  const applyBeadToAllPresetBeadSlots = useCallback(
    (assetKey, beadSizeId = sizeId) => {
      if (isManualMode) {
        return false;
      }

      if (!presetSlotItems.some((item) => item.type === "bead")) {
        return false;
      }

      const candidate = presetSlotItems.map((item) =>
        item.type === "bead" ? { ...item, assetKey, sizeId: beadSizeId } : item
      );
      if (!presetPatternFits(candidate)) {
        return false;
      }

      recordDesignUndoPoint();
      let didUpdate = false;

      setPresetSlotItems((items) => {
        if (!items.some((item) => item.type === "bead")) {
          return items;
        }

        const next = items.map((item) =>
          item.type === "bead" ? { ...item, assetKey, sizeId: beadSizeId } : item
        );

        if (!presetPatternFits(next)) {
          return items;
        }

        didUpdate = true;
        return next;
      });

      if (didUpdate) {
        playBeadMoveSound();
      }

      return didUpdate;
    },
    [isManualMode, presetPatternFits, sizeId, presetSlotItems, recordDesignUndoPoint]
  );

  const applySpacerToAllPresetSpacerSlots = useCallback(
    (assetKey, options = {}) => {
      const items = isManualMode ? manualItems : presetSlotItems;
      if (!items.some((item) => item.type === "spacer")) {
        return false;
      }

      const slotIndex = options.slotIndex;
      const applyToAllSpacers = options.applyToAll === true;

      let candidate;

      if (
        !applyToAllSpacers &&
        slotIndex != null &&
        slotIndex >= 0 &&
        slotIndex < items.length &&
        items[slotIndex]?.type === "spacer"
      ) {
        candidate = items.map((item, index) =>
          index === slotIndex ? { ...item, assetKey } : item
        );
      } else if (applyToAllSpacers) {
        candidate = items.map((item) =>
          item.type === "spacer" ? { ...item, assetKey } : item
        );
      } else {
        return false;
      }

      if (!isManualMode) {
        if (!presetPatternFits(candidate)) {
          return false;
        }
        recordDesignUndoPoint();
        setPresetSlotItems(candidate);
      } else {
        if (!slotItemsFitCapacity(candidate, { skipCharmCapacity: false })) {
          return false;
        }
        recordDesignUndoPoint();
        setManualItems(remapCharmRingGapsAfterSlotItemsChange(items, candidate));
      }

      playBeadMoveSound();

      return true;
    },
    [
      isManualMode,
      manualItems,
      presetSlotItems,
      presetPatternFits,
      slotItemsFitCapacity,
      recordDesignUndoPoint,
    ]
  );

  const applySizeToAllPresetBeads = useCallback(
    (beadSizeId) => {
      if (isManualMode) {
        return false;
      }

      if (!presetSlotItems.some((item) => item.type === "bead")) {
        return false;
      }

      const candidate = presetSlotItems.map((item) =>
        item.type === "bead" ? { ...item, sizeId: beadSizeId } : item
      );
      if (!presetPatternFits(candidate)) {
        return false;
      }

      recordDesignUndoPoint();
      let didUpdate = false;

      setPresetSlotItems((items) => {
        if (!items.some((item) => item.type === "bead")) {
          return items;
        }

        const next = items.map((item) =>
          item.type === "bead" ? { ...item, sizeId: beadSizeId } : item
        );

        if (!presetPatternFits(next)) {
          return items;
        }

        didUpdate = true;
        return next;
      });

      if (didUpdate) {
        playBeadMoveSound();
      }

      return didUpdate;
    },
    [isManualMode, presetPatternFits, presetSlotItems, recordDesignUndoPoint]
  );

  const updateManualItemSizeAt = useCallback(
    (index, nextSizeId) => {
      if (
        index < 0 ||
        index >= manualItems.length ||
        manualItems[index]?.type !== "bead" ||
        manualItems[index]?.sizeId === nextSizeId
      ) {
        return;
      }
      recordDesignUndoPoint();
      setManualItems((items) => {
        const candidate = items.map((item, itemIndex) =>
          itemIndex === index && item.type === "bead"
            ? { ...item, sizeId: nextSizeId }
            : item
        );
        const candidatePattern = toCapacityPattern(candidate, sizeId);
        if (!patternFitsOnRing(candidatePattern, capacityRingRadius, sizeId, MANUAL_CAPACITY_OPTIONS)) {
          return items;
        }
        return candidate;
      });
    },
    [capacityRingRadius, sizeId, manualItems, recordDesignUndoPoint]
  );

  const replaceCustomizeSlotAt = useCallback(
    (
      index,
      {
        type,
        assetKey,
        beadSizeId = sizeId,
        sourceRect,
        recordUndo = true,
        playSound = true,
        flyIn = true,
      } = {}
    ) => {
      const items = isManualMode ? manualItems : presetSlotItems;
      const replacement = buildCustomizeSlotReplacement(items, index, {
        type,
        assetKey,
        beadSizeId,
        defaultSizeId: sizeId,
      });
      if (!replacement) {
        return false;
      }

      if (
        !slotItemsFitCapacity(replacement.candidate, {
          skipCharmCapacity: replacement.touchesCharm,
        })
      ) {
        return false;
      }

      const nextItems =
        type === "charm"
          ? applyCharmGapsToSlotItems(replacement.candidate)
          : remapCharmRingGapsAfterSlotItemsChange(items, replacement.candidate);

      if (recordUndo) {
        recordDesignUndoPoint();
      }
      if (isManualMode) {
        setManualItems(nextItems);
      } else {
        setPresetSlotItems(nextItems);
      }

      if (flyIn) {
        queueFlyInAnimation({
          itemId: items[index].id,
          type,
          assetKey,
          beadSizeId: type === "bead" ? beadSizeId : sizeId,
          slotIndex: index,
          sourceRect: sourceRect ?? flyInSourceRectRef.current ?? undefined,
        });
      }
      if (playSound) {
        playBeadAddSound();
      }

      return true;
    },
    [
      isManualMode,
      manualItems,
      presetSlotItems,
      sizeId,
      slotItemsFitCapacity,
      queueFlyInAnimation,
      recordDesignUndoPoint,
    ]
  );

  const replaceCustomizeSlotRef = useRef(replaceCustomizeSlotAt);
  replaceCustomizeSlotRef.current = replaceCustomizeSlotAt;
  const manualItemsRef = useRef(manualItems);
  manualItemsRef.current = manualItems;

  const removeBraceletCharmAt = useCallback(
    (index) => {
      if (isManualMode) {
        removeManualItemAt(index);
        return;
      }
      removePresetSlotAt(index);
    },
    [isManualMode, removeManualItemAt, removePresetSlotAt]
  );

  const replaceBraceletCharmAt = useCallback(
    (index, assetKey, options = {}) =>
      replaceCustomizeSlotAt(index, { type: "charm", assetKey, sourceRect: options.sourceRect }),
    [replaceCustomizeSlotAt]
  );

  const removeLastManualItem = useCallback(() => {
    setManualItems((items) => items.slice(0, -1));
  }, []);

  /**
   * The whole charm set moves in one write: gaps hold a single charm each, so applying a
   * re-deal charm by charm would hit a gap its neighbour has not vacated yet.
   */
  const applyRandomizeCharmGaps = useCallback((gaps) => {
    const gapByCharmId = new Map(gaps.map(({ charmId, ringGap }) => [charmId, ringGap]));
    setManualItems((items) =>
      items.map((item) => {
        const ringGap = gapByCharmId.get(item.id);
        if (item.type !== "charm" || ringGap == null || item.ringGap === ringGap) {
          return item;
        }
        return { ...item, ringGap };
      })
    );
  }, []);

  const applyRandomizeCharmGapsRef = useRef(applyRandomizeCharmGaps);
  applyRandomizeCharmGapsRef.current = applyRandomizeCharmGaps;

  const cancelManualRandomize = useCallback(() => {
    clearTimeout(randomizeTimerRef.current);
    manualRandomizeSessionRef.current = null;
    setIsManualRandomizing(false);
    setRandomizeSwappedIds(new Set());
  }, []);

  const clearManualItems = useCallback(() => {
    cancelManualRandomize();
    setManualItems([]);
    setFlyInAnimation(null);
  }, [cancelManualRandomize]);

  const randomizeManualBracelet = useCallback(() => {
    if (!isManualMode || flyInAnimation || isManualRandomizing) {
      return false;
    }

    const beadCount = countManualBeads(manualItems);
    if (beadCount < MANUAL_RANDOMIZE_MIN_BEADS) {
      return false;
    }

    const plan = buildManualRandomizePlan(manualItems);
    if (!plan.length) {
      return false;
    }

    recordDesignUndoPoint();
    suppressUndoRecordRef.current = true;
    manualRandomizeSessionRef.current = { plan, cursor: 0, playedSound: false };
    setRandomizeSwappedIds(new Set());
    setIsManualRandomizing(true);
    setRandomizeTick((tick) => tick + 1);
    return true;
  }, [
    isManualMode,
    flyInAnimation,
    isManualRandomizing,
    manualItems,
    recordDesignUndoPoint,
  ]);

  const canRandomizeManualBracelet = useMemo(() => {
    if (!isManualMode || isManualRandomizing || Boolean(flyInAnimation)) {
      return false;
    }
    return canManualRandomizeBracelet(manualItems);
  }, [isManualMode, isManualRandomizing, flyInAnimation, manualItems]);

  const showManualRandomizeButton = useMemo(() => {
    if (!isManualMode) {
      return false;
    }
    return (
      isManualRandomizing || countManualBeads(manualItems) >= MANUAL_RANDOMIZE_MIN_BEADS
    );
  }, [isManualMode, isManualRandomizing, manualItems]);

  /**
   * Randomize plays on the ring itself: charms re-deal across the gaps, then every bead,
   * spacer and charm swaps its asset in place, staggered, instead of flying in from the
   * picker. Refs keep the latest slot writer without re-running this effect when
   * manualItems changes mid-sequence.
   */
  useEffect(() => {
    const session = manualRandomizeSessionRef.current;
    if (!isManualRandomizing || !session) {
      return undefined;
    }

    const stopSequence = () => {
      manualRandomizeSessionRef.current = null;
      setIsManualRandomizing(false);
      suppressUndoRecordRef.current = false;
      // Drop the swap marks once the last pop has played, otherwise shuffled charms keep
      // their glide suppressed for every later edit.
      clearTimeout(randomizeTimerRef.current);
      randomizeTimerRef.current = setTimeout(() => {
        setRandomizeSwappedIds(new Set());
      }, MANUAL_RANDOMIZE_POP_MS);
    };

    if (session.cursor >= session.plan.length) {
      stopSequence();
      return undefined;
    }

    const step = session.plan[session.cursor];
    session.cursor += 1;

    if (step.kind === "charmGaps") {
      applyRandomizeCharmGapsRef.current(step.gaps);
      setRandomizeSwappedIds((ids) => {
        const next = new Set(ids);
        step.gaps.forEach(({ charmId }) => next.add(charmId));
        return next;
      });
    } else {
      // The charm re-deal can take slot 0, so the click sound waits for the first swap.
      const playSound = !session.playedSound;
      session.playedSound = true;
      const targetItem = manualItemsRef.current[step.index];
      const ok = replaceCustomizeSlotRef.current(step.index, {
        type: step.type,
        assetKey: step.assetKey,
        beadSizeId: step.beadSizeId,
        recordUndo: false,
        playSound,
        flyIn: false,
      });

      if (!ok) {
        stopSequence();
        return undefined;
      }

      if (targetItem?.id != null) {
        setRandomizeSwappedIds((ids) => new Set(ids).add(targetItem.id));
      }
    }
    randomizeTimerRef.current = setTimeout(() => {
      setRandomizeTick((tick) => tick + 1);
    }, MANUAL_RANDOMIZE_STEP_MS);

    return () => {
      clearTimeout(randomizeTimerRef.current);
    };
  }, [isManualRandomizing, randomizeTick]);

  const selectStyleId = useCallback(
    (nextStyleId) => {
      if (nextStyleId === styleId) {
        return;
      }

      styleDesignCacheRef.current.set(
        styleId,
        buildStyleDesignSnapshot({
          styleId,
          lengthId,
          sizeId,
          selectedBeadKey,
          selectedSeparatorKey,
          selectedCharmKey,
          manualItems,
          presetSlotItems,
          presetPatternSeed,
        })
      );

      cancelManualRandomize();
      setFlyInAnimation(null);
      setStyleId(nextStyleId);

      // Charms follow the shopper rather than the style: only the strung beads and spacers
      // belong to the style being left behind.
      const keepCharms = isCharmCustomizationEnabled(nextStyleId);
      const outgoingItems = (isManualMode ? manualItems : presetSlotItems).filter(
        (item) => keepCharms || item.type !== "charm"
      );
      const outgoingCharms = outgoingItems.filter((item) => item.type === "charm");

      const cached = styleDesignCacheRef.current.get(nextStyleId);
      const applySetters = {
        setLengthId,
        setSizeId,
        setSelectedBeadKey,
        setSelectedSeparatorKey,
        setSelectedCharmKey,
        setManualItems,
        setPresetSlotItems,
        presetSlotSeedRef,
      };

      if (cached) {
        suppressUndoRecordRef.current = true;
        applyStyleDesignSnapshot(cached, applySetters, { charms: outgoingCharms });
        suppressUndoRecordRef.current = false;
        return;
      }

      if (isManualStringStyle(nextStyleId)) {
        setLengthId(RESET_LENGTH_ID);
        setManualItems(applyCharmGapsToSlotItems(cloneSlotItems(outgoingCharms)));
        presetSlotSeedRef.current = "";
        return;
      }

      if (isFreeSizeLength(lengthId)) {
        setLengthId(DEFAULT_LENGTH_ID);
      }
      // Handed to the re-seed effect, which keeps the charms and swaps in the new style's run.
      setPresetSlotItems(cloneSlotItems(outgoingItems));
      presetSlotSeedRef.current = "";
    },
    [
      styleId,
      lengthId,
      sizeId,
      selectedBeadKey,
      selectedSeparatorKey,
      selectedCharmKey,
      isManualMode,
      manualItems,
      presetSlotItems,
      presetPatternSeed,
      cancelManualRandomize,
    ]
  );

  const resetConfiguration = () => {
    styleDesignCacheRef.current.clear();
    styleUndoStacksRef.current.clear();
    bumpUndoRevision();
    presetSlotSeedRef.current = "";
    setJewelryCategory("bead-bracelet");
    setStyleId(RESET_STYLE_ID);
    setLengthId(RESET_LENGTH_ID);
    setCustomizeTab("beads");
    setCollectionId("all");
    setSizeId(DEFAULT_BEAD_SIZE_ID);
    setSelectedBeadKey(DEFAULT_BEAD_KEY);
    setSelectedSeparatorKey(DEFAULT_SEPARATOR_KEY);
    setSelectedCharmKey(DEFAULT_CHARM_KEY);
    cancelManualRandomize();
    setManualItems([]);
    setPresetSlotItems([]);
    setFlyInAnimation(null);
  };

  const value = {
    jewelryCategory,
    setJewelryCategory,
    styleId,
    setStyleId,
    selectStyleId,
    lengthId,
    setLengthId,
    selectLengthId,
    canUndoDesign,
    undoDesignStep,
    displayLengthLabel,
    dynamicLengthInches,
    isFreeSizeLayout,
    customizeTab,
    setCustomizeTab,
    collectionId,
    setCollectionId,
    sizeId,
    setSizeId,
    selectedBeadKey,
    setSelectedBeadKey,
    selectedSeparatorKey,
    setSelectedSeparatorKey,
    selectedCharmKey,
    setSelectedCharmKey,
    selectedBead,
    selectedSeparator,
    selectedCharm,
    activeLength,
    pattern,
    jewelryPrice,
    customizePrice,
    totalPrice,
    manualItems,
    presetSlotItems,
    customizeSlotItems,
    braceletCharms,
    isManualMode,
    isCustomizeEnabled,
    ringRadius,
    layoutRingRadius,
    availableStringLength,
    occupiedStringLength,
    remainingStringLength,
    usedCapacity,
    canAddMore,
    canAddBead,
    canReplaceCustomizeSlotAt,
    canApplyBeadSizeToAllPresetSlots,
    canAddSpacer,
    canAddCharm,
    charmCount,
    isStringFull,
    addManualItem,
    addPresetSlotItem,
    addBraceletCharm,
    removeBraceletCharmAt,
    replaceBraceletCharmAt,
    removeBraceletCharmById,
    updateBraceletCharmGap,
    flyInAnimation,
    flyInGeneration,
    flyInSourceRectRef,
    clearFlyInAnimation,
    removeLastManualItem,
    removeManualItemAt,
    removePresetSlotAt,
    applyBeadToAllPresetBeadSlots,
    applySpacerToAllPresetSpacerSlots,
    applySizeToAllPresetBeads,
    reorderManualItems,
    reorderPresetSlotItems,
    updateManualItemSizeAt,
    replaceCustomizeSlotAt,
    clearManualItems,
    randomizeManualBracelet,
    canRandomizeManualBracelet,
    showManualRandomizeButton,
    isManualRandomizing,
    randomizeSwappedIds,
    manualRandomizeMinBeads: MANUAL_RANDOMIZE_MIN_BEADS,
    showResetPopup,
    setShowResetPopup,
    resetConfiguration,
    styles: BEAD_STYLES,
  };

  return <BeedsContext.Provider value={value}>{children}</BeedsContext.Provider>;
};

export const useBeedsContext = () => {
  const context = useContext(BeedsContext);
  if (!context) {
    throw new Error("useBeedsContext must be used within BeedsProvider");
  }
  return context;
};
