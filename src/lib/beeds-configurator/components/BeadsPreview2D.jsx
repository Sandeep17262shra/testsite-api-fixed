import React, { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { isSvgBeadAsset, resolvePatternAsset } from "../assets";
import { useBeedsContext } from "../contexts/BeedsContext";
import { View360Context } from "../contexts/View360Context";
import { usePreviewFocusRingRotation } from "../usePreviewFocusRingRotation";
import {
  buildPositionedRingItems,
  charmPendantLocalToWorld,
  getCharmHangRotationDegreesAtAngle,
  getCharmImageLocalCenter,
  getCharmOnlySlotRingPoint,
  getCharmPendantLayout,
  getPreviewCenter,
  getRingRadiusForInches,
  getStrungItemRotationDegrees,
  FREE_SIZE_START_INCHES,
  PREVIEW_VIEW_SIZE,
} from "../beadRingLayout";
import {
  buildPreviewPattern,
  buildCharmGapPreviewPattern,
  captureSvgPointer,
  findNearestGapIndex,
  gapToInsertIndex,
  getCharmPlacementSegmentCount,
  getGapRingPoint,
  normalizeCharmGapIndex,
  resolveCharmDragSnapGap,
  getPointerAngle,
  getPointerDistance,
  getRingDragHitRadius,
  isPointerOutsideRing,
  resolveRemoveZone,
  lerp,
  pointerToSvgPoint,
  releaseSvgPointer,
  BEAD_FLY_IN_MS,
  CHARM_DRAG_GHOST_OUTWARD_LIFT_PX,
  CHARM_SPREAD_OPEN_LERP,
  approachAngle,
  easeOutCubic,
  easeOutQuint,
  frameLerpAmount,
  getCharmDragArcPoint,
  getCharmNeighbourSpreadOffsets,
  rectCenterClient,
  RING_DRAG_SETTLE_MS,
  svgLengthToScreen,
} from "../beadRingDrag";
import {
  playBeadMoveSound,
  playBeadRemoveSound,
  unlockBeadsAudio,
} from "../beadsSounds";
import {
  getAutoRotateDeltaDeg,
  getPointerAngleDeg,
  normalizeAngleDelta,
  pointerToRingLocalPoint,
  ringLocalPointToClient,
  RING_SPIN_FRICTION,
  RING_SPIN_MIN_VELOCITY,
} from "../beadRingSpin";
import {
  clampPreviewZoom,
  getTwoPointerMetrics,
  normalizePreviewPan,
  PREVIEW_WHEEL_ZOOM_SENSITIVITY,
} from "../beadPreviewZoom";
import {
  BeadGemDefs,
  BeadGemDropShadow,
  BeadGemPortableStack,
  BeadGemVisual,
  getBeadDropShadowVisualParams,
  getBeadOutwardDropShadowOffset,
  getBeadOutwardLightingAngleDeg,
  updateBeadPortableRingVisuals,
} from "./BeadGemVisual";
import { BeadsFlyInBeadGhost } from "./BeadsFlyInBeadGhost";
import {
  BeadsFlyInCharmGhost,
  buildCharmFlyInGhostLayout,
} from "./BeadsFlyInCharmGhost";

const CHARM_GOLD_STROKE = "url(#beads-charm-gold-gradient)";

const { x: CENTER_X, y: CENTER_Y } = getPreviewCenter();
const FREE_SIZE_RADIUS_ANIM_MS = 400;
/** Thin cord so it stays inside bead holes and does not cover charm hardware. */
const PREVIEW_STRING_STROKE_WIDTH = 1;

function getItemKey(item, index) {
  return item.id || `${item.type}-${item.asset?.key}-${item.sizeId || "default"}-${index}`;
}

function getCharmDisplayRotation(item) {
  return item?.hardwareRotation ?? item?.rotation ?? 0;
}

/** Match the drag ghost's lifted position so settle does not snap inward onto a bead first. */
function applyCharmGhostOutwardLift(x, y, extraLift = 0) {
  const dx = x - CENTER_X;
  const dy = y - CENTER_Y;
  const radial = Math.hypot(dx, dy);
  if (radial <= 0.001) {
    return { x, y };
  }
  const liftOut = CHARM_DRAG_GHOST_OUTWARD_LIFT_PX + extraLift;
  return {
    x: x + (dx / radial) * liftOut,
    y: y + (dy / radial) * liftOut,
  };
}

function getCharmWorldHitPoint(item, pendant) {
  const center = getCharmImageLocalCenter(pendant);
  return charmPendantLocalToWorld(
    center.x,
    center.y,
    item.x,
    item.y,
    pendant.hardwareRotationDeg ?? getCharmDisplayRotation(item)
  );
}

function layoutPositionedItemsForPattern(previewPattern, layoutConfig) {
  const finalLayout = layoutConfig.isManualMode
    ? computeManualLayout(
        previewPattern,
        layoutConfig.ringRadiusHint,
        layoutConfig.sizeId,
        layoutConfig.isStringFull,
        layoutConfig.isFreeSizeLayout
      )
    : computeManualLayout(
        previewPattern,
        layoutConfig.layoutRingRadius,
        layoutConfig.sizeId,
        true,
        false,
        true
      );
  return layoutItemsByPattern(previewPattern, finalLayout.items);
}

/**
 * Single source for where a charm will hang at `ringGap` — fly-in, drag settle, and preview
 * all use this. Charms already on the pattern keep their slot order (gap preview); charms not
 * on the ring yet are projected the same way fly-in always has.
 */
function resolveCharmLayoutTargetAtGap({
  itemId,
  ringGap,
  pattern,
  layoutConfig,
  assetKey = null,
  omitDragged = false,
}) {
  const onPattern = pattern?.some((entry) => entry.id === itemId);
  let previewPattern;
  if (onPattern) {
    previewPattern = buildCharmGapPreviewPattern(pattern, itemId, ringGap, { omitDragged });
  } else {
    const asset = resolvePatternAsset("charm", assetKey);
    if (!asset) {
      return null;
    }
    previewPattern = [
      ...(pattern ?? []).filter((entry) => entry.id !== itemId),
      { id: itemId, type: "charm", asset, ringGap },
    ];
  }
  const items = layoutPositionedItemsForPattern(previewPattern, layoutConfig);
  return items.find((entry) => entry.id === itemId) ?? null;
}

function resolveCharmLayoutItemsForGapPreview({
  itemId,
  ringGap,
  pattern,
  layoutConfig,
  omitDragged = false,
}) {
  const previewPattern = buildCharmGapPreviewPattern(pattern, itemId, ringGap, { omitDragged });
  return layoutPositionedItemsForPattern(previewPattern, layoutConfig);
}

/** Same hang pose as fly-in / post-drop — crevice between beads, not the pointer arc on a bead. */
function resolveCharmDragSnapLayoutTarget({
  charmId,
  snapGap,
  pattern,
  layoutConfig,
  charmItem,
}) {
  const gap = normalizeCharmGapIndex(
    snapGap,
    getCharmPlacementSegmentCount(pattern)
  );
  return resolveCharmLayoutTargetAtGap({
    itemId: charmId,
    ringGap: gap,
    pattern,
    layoutConfig,
    assetKey: charmItem?.asset?.key ?? charmItem?.assetKey,
  });
}

function getCharmFlyInClientTarget(svg, targetItem, ringRotation) {
  const pendant = getCharmPendantLayout(targetItem);
  const rotation = pendant.hardwareRotationDeg ?? getCharmDisplayRotation(targetItem);
  const client = ringLocalPointToClient(
    svg,
    CENTER_X,
    CENTER_Y,
    ringRotation,
    targetItem.x,
    targetItem.y
  );
  return { x: client.x, y: client.y, rotation: rotation + ringRotation };
}

/**
 * Where an incoming charm will actually hang, by running the real layout with the charm
 * appended. Deriving it from the gap alone is not enough: that layout can re-home the charm to
 * another gap, and charms sharing a gap fan apart rather than stacking on the gap's centre. A
 * gap-centre target therefore lands the ghost beside the spot the charm appears in, which
 * reads as the charm jumping sideways the instant it arrives.
 */
function buildCharmFlyInTargetFromRingGap({
  itemId,
  assetKey,
  ringGap,
  pattern,
  layoutConfig,
}) {
  return resolveCharmLayoutTargetAtGap({
    itemId,
    ringGap,
    pattern,
    layoutConfig,
    assetKey,
  });
}

function getRingIndexForCustomizeSlot(slotItems, slotIndex) {
  if (slotIndex == null || slotIndex < 0 || slotIndex >= slotItems.length) {
    return -1;
  }
  if (slotItems[slotIndex]?.type === "charm") {
    return -1;
  }
  let ringIndex = 0;
  for (let i = 0; i < slotIndex; i += 1) {
    if (slotItems[i]?.type !== "charm") {
      ringIndex += 1;
    }
  }
  return ringIndex;
}

function resolveRingSlotFlyInTargetFallback({
  slotItems,
  slotIndex,
  itemId,
  settledItems,
}) {
  const resolvedId =
    itemId ??
    (slotIndex != null && slotIndex >= 0 && slotIndex < slotItems.length
      ? slotItems[slotIndex]?.id
      : null);
  if (!resolvedId) {
    return null;
  }

  const fromSettled = settledItems.find((entry) => entry.id === resolvedId);
  if (fromSettled?.x != null && fromSettled?.y != null) {
    return fromSettled;
  }

  const ringIndex = getRingIndexForCustomizeSlot(slotItems, slotIndex);
  if (ringIndex < 0) {
    return null;
  }

  const ringItems = settledItems.filter(
    (entry) => entry.type === "bead" || entry.type === "spacer"
  );
  const ringItem = ringItems[ringIndex];
  if (!ringItem || ringItem.x == null || ringItem.y == null) {
    return null;
  }

  return { ...ringItem, id: resolvedId };
}

/**
 * Positions a drag measures its gaps against. Charms hang off the string rather than sitting
 * on it, so they never form a gap — for any dragged item, beads and spacers alone.
 */
function getRingGapItems(items, draggedId) {
  return items.filter(
    (entry) =>
      entry.id !== draggedId && (entry.type === "bead" || entry.type === "spacer")
  );
}

/** Slot index holding the nth bead/spacer, since the slot list also carries charms. */
function ringIndexToSlotIndex(slotItems, ringIndex) {
  let seen = 0;
  for (let index = 0; index < slotItems.length; index += 1) {
    if (slotItems[index].type === "charm") {
      continue;
    }
    if (seen === ringIndex) {
      return index;
    }
    seen += 1;
  }
  return slotItems.length;
}

function layoutItemsByPattern(pattern, positionedItems) {
  const byId = new Map();
  positionedItems.forEach((item) => {
    if (item.id) {
      byId.set(item.id, item);
    }
  });

  return pattern
    .map((entry, index) => {
      const positioned = entry.id ? byId.get(entry.id) : positionedItems[index];
      if (!positioned) {
        return null;
      }
      return { ...positioned, patternIndex: index };
    })
    .filter(Boolean);
}

function computeManualLayout(
  pattern,
  ringRadiusHint,
  sizeId,
  isStringFull,
  useFreeSizeGrowingRing,
  usePresetFixedRing = false
) {
  return buildPositionedRingItems({
    pattern,
    slotCount: pattern.length,
    defaultSizeId: sizeId,
    centerX: CENTER_X,
    centerY: CENTER_Y,
    ringRadiusHint,
    isPartialCluster: !isStringFull,
    useVariableDiameters: true,
    useManualEvenRingLayout: true,
    useFreeSizeGrowingRing,
    manualStringFull: isStringFull,
    usePresetFixedRing,
  });
}

export default function BeadsPreview2D() {
  const {
    pattern,
    manualItems,
    presetSlotItems,
    isManualMode,
    layoutRingRadius,
    isStringFull,
    sizeId,
    displayLengthLabel,
    isFreeSizeLayout,
    reorderManualItems,
    reorderPresetSlotItems,
    removeManualItemAt,
    removePresetSlotAt,
    removeBraceletCharmById,
    updateBraceletCharmGap,
    flyInAnimation,
    flyInGeneration,
    flyInSourceRectRef,
    clearFlyInAnimation,
    randomizeSwappedIds,
  } = useBeedsContext();
  const { view360 } = useContext(View360Context);

  const ringRadiusHint = layoutRingRadius;

  const svgRef = useRef(null);
  const stageWrapRef = useRef(null);
  const previewPointersRef = useRef(new Map());
  const pinchSessionRef = useRef(null);
  const previewZoomRef = useRef({ scale: 1, x: 0, y: 0 });
  const settledItemsRef = useRef([]);
  const flyGhostRef = useRef(null);
  const flyInRafRef = useRef(null);
  const flyInMotionRef = useRef(null);
  const flyInMotionStartedRef = useRef(null);
  const flyInSessionRef = useRef(null);
  const flyInWaitRafRef = useRef(null);
  const flyInSlotItemsRef = useRef({ manualItems, presetSlotItems, isManualMode });
  flyInSlotItemsRef.current = { manualItems, presetSlotItems, isManualMode };
  const finishFlyInRef = useRef(null);
  const cancelFlyInRef = useRef(null);
  const tryStartPendingFlyInMotionRef = useRef(null);
  const dragRef = useRef(null);
  /** Latest pointer position, consumed once per animation frame. */
  const pendingPointerRef = useRef(null);
  const updateDragFromPointerRef = useRef(null);
  const ghostWrapRef = useRef(null);
  const ghostShadowRef = useRef(null);
  const ghostFaceScaleRef = useRef(null);
  const ghostFaceRef = useRef(null);
  const ghostShineRef = useRef(null);
  const flyGhostShadowRef = useRef(null);
  const flyGhostFaceScaleRef = useRef(null);
  const flyGhostFaceRef = useRef(null);
  const flyGhostShineRef = useRef(null);
  const ghostCharmRef = useRef(null);
  /** Live insertion marker — the drag loop writes its transform rather than re-rendering. */
  const dropMarkerRef = useRef(null);
  /** Charm id → its ring group, so neighbours can be eased aside without a React pass. */
  const charmNeighbourElsRef = useRef(new Map());
  /** Charms currently on the ring (minus the dragged one), read by the drag loop. */
  const dragNeighbourCharmsRef = useRef([]);
  const activeStringRadiusRef = useRef(0);
  const rafRef = useRef(null);
  const suppressClickRef = useRef(false);
  const spinRef = useRef(null);
  const spinInertiaRafRef = useRef(null);
  const autoRotateRafRef = useRef(null);
  const ringViewRotationRef = useRef(0);

  const [dragMeta, setDragMeta] = useState(null);
  const [ringViewRotation, setRingViewRotation] = useState(0);
  const [isRingSpinning, setIsRingSpinning] = useState(false);
  const [settling, setSettling] = useState(null);
  const [flyInActiveItemId, setFlyInActiveItemId] = useState(null);
  const [animatedStringRadius, setAnimatedStringRadius] = useState(layoutRingRadius);
  const stringRadiusAnimRef = useRef(null);
  const animatedStringRadiusRef = useRef(layoutRingRadius);
  const [previewZoom, setPreviewZoom] = useState({ scale: 1, x: 0, y: 0 });
  const [isPreviewPinching, setIsPreviewPinching] = useState(false);
  previewZoomRef.current = previewZoom;

  const hasHangingCharms = pattern.some((entry) => entry.type === "charm");
  const hasPresetRingSlots = !isManualMode && presetSlotItems.length > 0;

  const dragEnabled =
    !view360 &&
    !settling &&
    !flyInActiveItemId &&
    !flyInAnimation &&
    ((isManualMode && (manualItems.length > 0 || hasHangingCharms)) ||
      (hasPresetRingSlots || hasHangingCharms));

  const presetHasCharmLayout = useMemo(
    () => !isManualMode && pattern.some((entry) => entry.type === "charm"),
    [isManualMode, pattern]
  );

  const useManualRingRendering =
    isManualMode ||
    hasPresetRingSlots ||
    presetHasCharmLayout ||
    Boolean(flyInActiveItemId) ||
    Boolean(flyInAnimation);

  const presetLayout = useMemo(
    () =>
      buildPositionedRingItems({
        pattern,
        slotCount: pattern.length,
        defaultSizeId: sizeId,
        centerX: CENTER_X,
        centerY: CENTER_Y,
        ringRadiusHint: layoutRingRadius,
        isPartialCluster: false,
        useVariableDiameters: false,
        useManualEvenRingLayout: false,
        manualStringFull: false,
      }),
    [pattern, layoutRingRadius, sizeId]
  );

  const settledLayout = useMemo(() => {
    if (isManualMode) {
      return computeManualLayout(pattern, ringRadiusHint, sizeId, isStringFull, isFreeSizeLayout);
    }
    if (hasPresetRingSlots || presetHasCharmLayout) {
      return computeManualLayout(pattern, layoutRingRadius, sizeId, true, false, true);
    }
    return presetLayout;
  }, [
    isManualMode,
    hasPresetRingSlots,
    presetHasCharmLayout,
        pattern,
    ringRadiusHint,
    layoutRingRadius,
    sizeId,
    isStringFull,
    isFreeSizeLayout,
    presetLayout,
  ]);

  const settledItems = useMemo(() => {
    if (isManualMode || presetHasCharmLayout || hasPresetRingSlots) {
      return layoutItemsByPattern(pattern, settledLayout.items);
    }
    return settledLayout.items;
  }, [isManualMode, presetHasCharmLayout, hasPresetRingSlots, pattern, settledLayout.items]);

  settledItemsRef.current = settledItems;

  const suppressPreviewFocus =
    Boolean(dragMeta) ||
    Boolean(settling) ||
    Boolean(flyInActiveItemId) ||
    Boolean(flyInAnimation);

  const { focusLockActive } = usePreviewFocusRingRotation({
    settledItems,
    pattern,
    rotationDeg: ringViewRotation,
    setRotationDeg: setRingViewRotation,
    rotationRef: ringViewRotationRef,
    suppressFocus: suppressPreviewFocus,
  });

  const patternIndexById = useMemo(() => {
    const map = new Map();
    pattern.forEach((entry, index) => {
      if (entry.id) {
        map.set(entry.id, index);
      }
    });
    return map;
  }, [pattern]);

  const hangingCharmIdSet = useMemo(
    () => new Set(pattern.filter((entry) => entry.type === "charm").map((entry) => entry.id)),
    [pattern]
  );

  const charmDragActive = dragMeta?.item?.type === "charm";
  /** Stable flag so the pointer listeners are not re-bound on every snap change. */
  const isRingDragActive = Boolean(dragMeta);

  const ringBeadDragActive = Boolean(
    dragMeta?.item && dragMeta.item.type !== "charm"
  );

  const ringDragUsesClosedGaps = useMemo(() => {
    if (!isManualMode) {
      return true;
    }
    if (isStringFull) {
      return true;
    }
    if (isFreeSizeLayout) {
      const minRadius = getRingRadiusForInches(FREE_SIZE_START_INCHES);
      const radius = settledLayout.ringRadius ?? layoutRingRadius;
      return radius > minRadius + 0.01;
    }
    return false;
  }, [
    isManualMode,
    isStringFull,
    isFreeSizeLayout,
    settledLayout.ringRadius,
    layoutRingRadius,
  ]);

  const charmLayoutConfig = useMemo(
    () => ({
      isManualMode,
      ringRadiusHint,
      layoutRingRadius,
      sizeId,
      isStringFull,
      isFreeSizeLayout,
    }),
    [isManualMode, ringRadiusHint, layoutRingRadius, sizeId, isStringFull, isFreeSizeLayout]
  );

  const displayItems = useMemo(() => {
    if (settling?.finalItems) {
      return settling.finalItems;
    }

    if (charmDragActive && dragMeta?.id) {
      if (!dragMeta.isRemoveZone && Number.isFinite(dragMeta.snapGap)) {
        const gap = normalizeCharmGapIndex(
          dragMeta.snapGap,
          getCharmPlacementSegmentCount(pattern)
        );
        const previewItems = resolveCharmLayoutItemsForGapPreview({
          itemId: dragMeta.id,
          ringGap: gap,
          pattern,
          layoutConfig: charmLayoutConfig,
          omitDragged: false,
        });
        return previewItems.filter((item) => item.id !== dragMeta.id);
      }
      return settledItems.filter((item) => item.id !== dragMeta.id);
    }

    // PebblePal-style: ring beads/spacers stay put while dragging; reflow on drop (settling).
    if (ringBeadDragActive && dragMeta?.id) {
      return settledItems.filter((item) => item.id !== dragMeta.id);
    }

    return settledItems;
  }, [
    charmDragActive,
    ringBeadDragActive,
    settling,
    dragMeta,
    settledItems,
    pattern,
    charmLayoutConfig,
  ]);

  const targetStringRadius = settledLayout.ringRadius || layoutRingRadius;

  useEffect(() => {
    animatedStringRadiusRef.current = animatedStringRadius;
  }, [animatedStringRadius]);

  useEffect(() => {
    ringViewRotationRef.current = ringViewRotation;
  }, [ringViewRotation]);

  const stopFlyInRaf = useCallback(() => {
    if (flyInRafRef.current) {
      cancelAnimationFrame(flyInRafRef.current);
      flyInRafRef.current = null;
    }
  }, []);

  const resetFlyInSession = useCallback(() => {
    stopFlyInRaf();
    if (flyInWaitRafRef.current) {
      cancelAnimationFrame(flyInWaitRafRef.current);
      flyInWaitRafRef.current = null;
    }
    flyInMotionRef.current = null;
    flyInMotionStartedRef.current = null;
    flyInSessionRef.current = null;
  }, [stopFlyInRaf]);

  const resolveFlyInTargetItem = useCallback(
    (itemId, slotIndex = null, flyInMeta = null) => {
      const slotItems = isManualMode ? manualItems : presetSlotItems;
      let resolvedId = itemId;

      if (
        !resolvedId &&
        slotIndex != null &&
        slotIndex >= 0 &&
        slotIndex < slotItems.length
      ) {
        resolvedId = slotItems[slotIndex]?.id ?? null;
      }

      if (!resolvedId) {
        return null;
      }

      const fromSettled = settledItemsRef.current.find((entry) => entry.id === resolvedId);
      if (fromSettled?.x != null && fromSettled?.y != null) {
        return fromSettled;
      }

      if (!pattern.some((entry) => entry.id === resolvedId)) {
        const slotHasId = slotItems.some((item) => item.id === resolvedId);
        const slotIndexMatches =
          slotIndex != null &&
          slotIndex >= 0 &&
          slotIndex < slotItems.length &&
          slotItems[slotIndex]?.id === resolvedId;
        if (!slotHasId && !slotIndexMatches) {
          return null;
        }
      }

      const layout = isManualMode
        ? computeManualLayout(pattern, ringRadiusHint, sizeId, isStringFull, isFreeSizeLayout)
        : hasPresetRingSlots || presetHasCharmLayout
          ? computeManualLayout(pattern, layoutRingRadius, sizeId, true, false, true)
          : buildPositionedRingItems({
              pattern,
              slotCount: pattern.length,
              defaultSizeId: sizeId,
              centerX: CENTER_X,
        centerY: CENTER_Y,
              ringRadiusHint: layoutRingRadius,
              isPartialCluster: false,
              useVariableDiameters: false,
              useManualEvenRingLayout: false,
              manualStringFull: false,
            });
      const items = isManualMode || presetHasCharmLayout || hasPresetRingSlots
        ? layoutItemsByPattern(pattern, layout.items)
        : layout.items;
      const matched = items.find((entry) => entry.id === resolvedId);
      if (matched) {
        return matched;
      }

      const patternIndex = pattern.findIndex((entry) => entry.id === resolvedId);
      if (patternIndex >= 0 && layout.items[patternIndex]) {
        return { ...layout.items[patternIndex], id: resolvedId };
      }

      const fromLayout = layout.items.find((entry) => entry.id === resolvedId);
      if (fromLayout) {
        return fromLayout;
      }

      if (
        flyInMeta?.type === "charm" &&
        Number.isFinite(flyInMeta.ringGap) &&
        flyInMeta.assetKey
      ) {
        return buildCharmFlyInTargetFromRingGap({
          itemId: resolvedId,
          assetKey: flyInMeta.assetKey,
          ringGap: flyInMeta.ringGap,
          pattern,
          layoutConfig: {
            isManualMode,
        ringRadiusHint,
            layoutRingRadius,
            sizeId,
            isStringFull,
            isFreeSizeLayout,
          },
        });
      }

      if (flyInMeta?.type === "bead" || flyInMeta?.type === "spacer") {
        return resolveRingSlotFlyInTargetFallback({
          slotItems,
          slotIndex,
          itemId: resolvedId,
          settledItems: settledItemsRef.current,
        });
      }

      return null;
    },
    [
      pattern,
      ringRadiusHint,
      layoutRingRadius,
      sizeId,
      isStringFull,
      isFreeSizeLayout,
      isManualMode,
      presetHasCharmLayout,
      hasPresetRingSlots,
      manualItems,
      presetSlotItems,
      settledLayout.ringRadius,
    ]
  );

  const resolveFlyInTargetItemRef = useRef(resolveFlyInTargetItem);
  resolveFlyInTargetItemRef.current = resolveFlyInTargetItem;

  const flyInTargetItem = useMemo(() => {
    if (!flyInAnimation?.itemId && flyInAnimation?.slotIndex == null) {
      return null;
    }

    return resolveFlyInTargetItem(flyInAnimation.itemId, flyInAnimation.slotIndex, {
      type: flyInAnimation.type,
      assetKey: flyInAnimation.assetKey,
      ringGap: flyInAnimation.ringGap,
    });
  }, [
    flyInAnimation?.itemId,
    flyInAnimation?.slotIndex,
    flyInAnimation?.type,
    flyInAnimation?.assetKey,
    flyInAnimation?.ringGap,
    flyInGeneration,
    resolveFlyInTargetItem,
    settledItems,
    pattern,
    manualItems.length,
    presetSlotItems.length,
  ]);

  const flyInCharmTargetItem = useMemo(() => {
    if (flyInAnimation?.type !== "charm") {
      return null;
    }
    if (flyInTargetItem?.type === "charm") {
      return flyInTargetItem;
    }
    if (Number.isFinite(flyInAnimation.ringGap) && flyInAnimation.assetKey) {
      return buildCharmFlyInTargetFromRingGap({
        itemId: flyInAnimation.itemId,
        assetKey: flyInAnimation.assetKey,
        ringGap: flyInAnimation.ringGap,
        pattern,
        layoutConfig: {
          isManualMode,
          ringRadiusHint,
          layoutRingRadius,
          sizeId,
          isStringFull,
          isFreeSizeLayout,
        },
      });
    }
    return null;
  }, [
    flyInAnimation?.type,
    flyInAnimation?.itemId,
    flyInAnimation?.assetKey,
    flyInAnimation?.ringGap,
    flyInTargetItem,
    pattern,
    isManualMode,
    ringRadiusHint,
    layoutRingRadius,
    sizeId,
    isStringFull,
    isFreeSizeLayout,
  ]);

  const activeFlyInGhost = useMemo(() => {
    if (!flyInAnimation) {
      return null;
    }

    const asset = resolvePatternAsset(flyInAnimation.type, flyInAnimation.assetKey);
    if (!asset?.image) {
      return null;
    }

    if (flyInAnimation.type === "charm") {
      const charmLayout = flyInCharmTargetItem
        ? buildCharmFlyInGhostLayout(flyInCharmTargetItem)
        : null;
      const pendant = flyInCharmTargetItem ? getCharmPendantLayout(flyInCharmTargetItem) : null;
      return {
        itemId: flyInAnimation.itemId,
        type: flyInAnimation.type,
        asset,
        width: charmLayout?.layoutWidth ?? pendant?.charmImage.width ?? 28,
        height: charmLayout?.layoutHeight ?? pendant?.charmImage.height ?? 34,
      };
    }

    if (flyInAnimation.type === "spacer") {
      const width = flyInTargetItem?.width > 0 ? flyInTargetItem.width : 12;
      const height = flyInTargetItem?.height > 0 ? flyInTargetItem.height : 8;
      return {
        itemId: flyInAnimation.itemId,
        type: flyInAnimation.type,
        asset,
        width,
        height,
      };
    }

    if (flyInTargetItem?.width > 0 && flyInTargetItem?.height > 0) {
      return {
        itemId: flyInAnimation.itemId,
        type: flyInAnimation.type,
        asset,
        width: flyInTargetItem.width,
        height: flyInTargetItem.height,
      };
    }

    return {
      itemId: flyInAnimation.itemId,
      type: flyInAnimation.type,
      asset,
      width: 26,
      height: 26,
    };
  }, [flyInAnimation, flyInTargetItem, flyInCharmTargetItem]);

  const finishFlyIn = useCallback(() => {
    resetFlyInSession();
    setFlyInActiveItemId(null);
    clearFlyInAnimation();
  }, [clearFlyInAnimation, resetFlyInSession]);

  const cancelFlyIn = useCallback(() => {
    resetFlyInSession();
    setFlyInActiveItemId(null);
    clearFlyInAnimation();
  }, [clearFlyInAnimation, resetFlyInSession]);

  finishFlyInRef.current = finishFlyIn;
  cancelFlyInRef.current = cancelFlyIn;

  const applyFlyGhostTransform = useCallback((x, y, rotation, scale, ringVisual = null) => {
    const node = flyGhostRef.current;
    const flyFaceScale = flyGhostFaceScaleRef.current;
    if (node) {
      // Bead ghosts scale an inner group so their drop shadow stays unscaled; charm and
      // spacer ghosts have no such group, so the element itself carries the scale.
      const elementScale = flyFaceScale ? "" : ` scale(${Math.round(scale * 1000) / 1000})`;
      node.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${rotation}deg)${elementScale}`;
    }
    if (flyFaceScale) {
      flyFaceScale.setAttribute("transform", `scale(${Math.round(scale * 1000) / 1000})`);
    }

    if (ringVisual && Number.isFinite(ringVisual.radius)) {
      updateBeadPortableRingVisuals({
        shadowGroupEl: flyGhostShadowRef.current,
        shineWrapEl: flyGhostShineRef.current,
        faceGroupEl: flyGhostFaceRef.current,
        ringX: ringVisual.ringX,
        ringY: ringVisual.ringY,
        centerX: CENTER_X,
        centerY: CENTER_Y,
        radius: ringVisual.radius,
        rotation: ringVisual.rotation ?? 0,
      });
    }
  }, []);

  const resolveFlyInTargetClient = useCallback(
    (itemId, slotIndex, fallback, flyInMeta = null) => {
      const targetItem = resolveFlyInTargetItemRef.current(itemId, slotIndex, flyInMeta);
      if (!targetItem || !svgRef.current) {
        return fallback;
      }

      const ringRotation = ringViewRotationRef.current;
      if (targetItem.type === "charm") {
        return getCharmFlyInClientTarget(svgRef.current, targetItem, ringRotation);
      }

      const client = ringLocalPointToClient(
        svgRef.current,
        CENTER_X,
        CENTER_Y,
        ringRotation,
        targetItem.x,
        targetItem.y
      );
      return {
        x: client.x,
        y: client.y,
        rotation: (targetItem.rotation ?? 0) + ringRotation,
      };
    },
    []
  );

  /**
   * Landing point for the ghost at the current ring rotation. The slot's ring-local
   * position never changes, so only the 360 rotation since launch is re-applied — that
   * keeps the angle continuous instead of re-normalising (and wrapping) every frame.
   */
  const resolveLiveFlyInTarget = useCallback((motion) => {
    const svg = svgRef.current;
    if (
      !svg ||
      !Number.isFinite(motion.toRingX) ||
      !Number.isFinite(motion.toRingY) ||
      !Number.isFinite(motion.ringRotationAtQueue)
    ) {
      return { x: motion.toX, y: motion.toY, rotation: motion.toRotation };
    }

    const ringRotation = ringViewRotationRef.current;
    const client = ringLocalPointToClient(
      svg,
      CENTER_X,
      CENTER_Y,
      ringRotation,
      motion.toRingX,
      motion.toRingY
    );

    return {
      x: client.x,
      y: client.y,
      rotation: motion.toRotation + (ringRotation - motion.ringRotationAtQueue),
    };
  }, []);

  const startFlyInMotion = useCallback(
    (motion) => {
      stopFlyInRaf();
      const initialRingVisual =
        Number.isFinite(motion.beadRadius) && Number.isFinite(motion.fromRingX)
          ? {
              ringX: motion.fromRingX,
              ringY: motion.fromRingY,
              radius: motion.beadRadius,
              rotation: 0,
            }
          : null;
      applyFlyGhostTransform(motion.fromX, motion.fromY, 0, motion.fromScale, initialRingVisual);

      const startedAt = performance.now();
      const durationMs = motion.durationMs ?? BEAD_FLY_IN_MS;
      const tick = (now) => {
        const progress = Math.min(1, (now - startedAt) / durationMs);
        const eased = easeOutQuint(progress);
        // In 360 view the slot keeps turning while the ghost is in the air, so the
        // landing point is re-read every frame — a target frozen at launch leaves the
        // ghost short of the slot and the item jumps into place when it appears.
        const target = resolveLiveFlyInTarget(motion);
        const x = lerp(motion.fromX, target.x, eased);
        const y = lerp(motion.fromY, target.y, eased);
        const scale = lerp(motion.fromScale, 1, eased);
        const rotation = lerp(0, target.rotation, eased);
        const ringVisual =
          Number.isFinite(motion.beadRadius) && Number.isFinite(motion.fromRingX)
            ? {
                ringX: lerp(motion.fromRingX, motion.toRingX, eased),
                ringY: lerp(motion.fromRingY, motion.toRingY, eased),
                radius: motion.beadRadius,
                rotation: lerp(0, motion.toRingRotation ?? 0, eased),
              }
            : null;

        applyFlyGhostTransform(x, y, rotation, scale, ringVisual);

        if (progress < 1) {
          flyInRafRef.current = requestAnimationFrame(tick);
          return;
        }

        finishFlyInRef.current?.();
      };

      flyInRafRef.current = requestAnimationFrame(tick);
    },
    [applyFlyGhostTransform, resolveLiveFlyInTarget, stopFlyInRaf]
  );

  const tryStartPendingFlyInMotion = useCallback(() => {
    const initialMotion = flyInMotionRef.current;
    const sessionKey = initialMotion?.sessionKey ?? flyInSessionRef.current;
    if (!initialMotion || !sessionKey || flyInMotionStartedRef.current === sessionKey) {
      return undefined;
    }

    let cancelled = false;

    const attemptStart = (tryCount = 0) => {
      if (cancelled || flyInMotionStartedRef.current === sessionKey) {
        return;
      }

      const motion = flyInMotionRef.current;
      if (!motion || motion.sessionKey !== sessionKey) {
        return;
      }

      if (flyGhostRef.current?.isConnected) {
        if (motion.pendingTarget) {
          applyFlyGhostTransform(motion.fromX, motion.fromY, 0, motion.fromScale ?? 0.72);
          if (tryCount < 240) {
            flyInWaitRafRef.current = requestAnimationFrame(() => attemptStart(tryCount + 1));
          }
          return;
        }

        flyInMotionStartedRef.current = sessionKey;
        startFlyInMotion(motion);
        return;
      }

      if (tryCount < 240) {
        flyInWaitRafRef.current = requestAnimationFrame(() => attemptStart(tryCount + 1));
        return;
      }
    };

    attemptStart();

    return () => {
      cancelled = true;
    };
  }, [applyFlyGhostTransform, startFlyInMotion]);

  tryStartPendingFlyInMotionRef.current = tryStartPendingFlyInMotion;

  const handleFlyGhostRef = useCallback(
    (node) => {
      flyGhostRef.current = node;

      if (!node) {
        // Only bead ghosts attach these; drop them so a following charm ghost does not
        // hand its scale to a detached bead group and fly at a fixed size.
        flyGhostFaceScaleRef.current = null;
        flyGhostShadowRef.current = null;
        flyGhostShineRef.current = null;
        flyGhostFaceRef.current = null;
        return;
      }

      if (!node.isConnected) {
        return;
      }

      tryStartPendingFlyInMotion();
    },
    [tryStartPendingFlyInMotion]
  );

  useLayoutEffect(() => {
    if (!flyInAnimation) {
      return undefined;
    }

    const anim = flyInAnimation;
    const flyInMeta = {
      type: anim.type,
      assetKey: anim.assetKey,
      ringGap: anim.ringGap,
    };
    const sessionKey =
      anim.sessionKey ??
      `${flyInGeneration}:${anim.itemId ?? `slot-${anim.slotIndex ?? "x"}`}`;
    let cancelled = false;
    let retryRaf = null;

    const slotItemsFlyInId = (flyAnim) => {
      if (flyAnim.itemId) {
        return flyAnim.itemId;
      }
      const { manualItems: manual, presetSlotItems: preset, isManualMode: manualMode } =
        flyInSlotItemsRef.current;
      const slotItems = manualMode ? manual : preset;
      const idx = flyAnim.slotIndex;
      if (idx == null || idx < 0 || idx >= slotItems.length) {
        return null;
      }
      return slotItems[idx]?.id ?? null;
    };

    const flyInHideItemId = slotItemsFlyInId(anim);

    if (flyInSessionRef.current !== sessionKey) {
      stopFlyInRaf();
      flyInMotionStartedRef.current = null;
      flyInSessionRef.current = sessionKey;
    }

    if (flyInHideItemId) {
      setFlyInActiveItemId(flyInHideItemId);
    }

    const resolveSourcePoint = () => {
      const clickRect = anim.sourceRect;
      const slotRect = flyInSourceRectRef.current;
      const rect = clickRect || slotRect;

      if (rect) {
        return rectCenterClient(rect);
      }

      const previewRect = svgRef.current?.getBoundingClientRect?.();
      if (previewRect) {
        return {
          x: previewRect.right - previewRect.width * 0.12,
          y: previewRect.top + previewRect.height * 0.72,
        };
      }

      return { x: window.innerWidth * 0.72, y: window.innerHeight * 0.42 };
    };

    const source = resolveSourcePoint();
    flyInMotionRef.current = {
      sessionKey,
      itemId: anim.itemId,
      slotIndex: anim.slotIndex ?? null,
      pendingTarget: true,
      fromX: source.x,
      fromY: source.y,
      fromScale: 0.72,
    };
    tryStartPendingFlyInMotionRef.current?.();

    const queueFlyIn = (targetItem) => {
      if (cancelled || !svgRef.current || !targetItem) {
        return;
      }

      const asset = resolvePatternAsset(anim.type, anim.assetKey);
      if (!asset?.image) {
        cancelFlyInRef.current?.();
        return;
      }

      const source = resolveSourcePoint();
      const ringRotation = ringViewRotationRef.current;
      const fromRing = pointerToRingLocalPoint(
        svgRef.current,
        CENTER_X,
        CENTER_Y,
        ringRotation,
        source.x,
        source.y
      );
      const targetClient =
        targetItem.type === "charm"
          ? getCharmFlyInClientTarget(svgRef.current, targetItem, ringRotation)
          : {
              ...ringLocalPointToClient(
                svgRef.current,
                CENTER_X,
                CENTER_Y,
                ringRotation,
                targetItem.x,
                targetItem.y
              ),
              rotation: (targetItem.rotation ?? 0) + ringRotation,
            };
      const sourceRect = anim.sourceRect || flyInSourceRectRef.current;
      // Charm ghosts are sized by their full bail+pendant bounds, not the charm image,
      // so measure the start scale against that same box or the ghost pops on landing.
      const charmGhostWidth =
        anim.type === "charm"
          ? buildCharmFlyInGhostLayout(targetItem)?.layoutWidth
          : null;
      const targetWidth =
        charmGhostWidth > 0
          ? charmGhostWidth
          : targetItem.width > 0
            ? targetItem.width
            : anim.type === "spacer"
              ? 12
              : 26;
      const targetScreenWidth = svgLengthToScreen(svgRef.current, targetWidth);
      const fromScale = sourceRect
        ? Math.min(1, Math.max(0.5, sourceRect.width / Math.max(targetScreenWidth, 1)))
        : 0.72;

      stopFlyInRaf();
      flyInMotionStartedRef.current = null;
      flyInMotionRef.current = {
        sessionKey,
        itemId: anim.itemId,
        slotIndex: anim.slotIndex ?? null,
        flyInMeta,
        type: anim.type,
        durationMs: BEAD_FLY_IN_MS,
        fromX: source.x,
        fromY: source.y,
        fromScale,
        toX: targetClient.x,
        toY: targetClient.y,
        // Take the short way round; a raw +300° target spins the charm almost full circle.
        toRotation: normalizeAngleDelta(targetClient.rotation ?? 0),
        ringRotationAtQueue: ringRotation,
        fromRingX: fromRing.x,
        fromRingY: fromRing.y,
        toRingX: targetItem.x,
        toRingY: targetItem.y,
        toRingRotation: targetItem.rotation ?? 0,
        beadRadius:
          anim.type === "bead"
            ? Math.max(targetItem.width, targetItem.height) / 2
            : undefined,
      };

      if (flyInHideItemId) {
        setFlyInActiveItemId(flyInHideItemId);
      }
      if (flyInWaitRafRef.current) {
        cancelAnimationFrame(flyInWaitRafRef.current);
        flyInWaitRafRef.current = null;
      }
      tryStartPendingFlyInMotionRef.current?.();
    };

    const tryQueueFlyIn = (attempt = 0) => {
      if (cancelled) {
        return;
      }

      let targetItem = resolveFlyInTargetItemRef.current(
        anim.itemId,
        anim.slotIndex,
        flyInMeta
      );
      if (
        !targetItem &&
        (anim.type === "bead" || anim.type === "spacer") &&
        anim.slotIndex != null
      ) {
        const { manualItems: manual, presetSlotItems: preset, isManualMode: manualMode } =
          flyInSlotItemsRef.current;
        targetItem = resolveRingSlotFlyInTargetFallback({
          slotItems: manualMode ? manual : preset,
          slotIndex: anim.slotIndex,
          itemId: anim.itemId,
          settledItems: settledItemsRef.current,
        });
      }
      if (!targetItem) {
        if (attempt >= 180) {
          cancelFlyInRef.current?.();
          return;
        }

        retryRaf = requestAnimationFrame(() => tryQueueFlyIn(attempt + 1));
        return;
      }

      if (!svgRef.current) {
        if (attempt >= 180) {
          cancelFlyInRef.current?.();
          return;
        }

        retryRaf = requestAnimationFrame(() => tryQueueFlyIn(attempt + 1));
        return;
      }

      queueFlyIn(targetItem);
    };

    const immediateTarget = resolveFlyInTargetItemRef.current(
      anim.itemId,
      anim.slotIndex,
      flyInMeta
    );
    if (immediateTarget && svgRef.current) {
      queueFlyIn(immediateTarget);
    } else {
      tryQueueFlyIn();
    }

    return () => {
      cancelled = true;
      if (retryRaf) {
        cancelAnimationFrame(retryRaf);
      }
    };
  }, [flyInAnimation, flyInGeneration, stopFlyInRaf]);

  useEffect(
    () => () => {
      stopFlyInRaf();
      if (flyInWaitRafRef.current) {
        cancelAnimationFrame(flyInWaitRafRef.current);
        flyInWaitRafRef.current = null;
      }
    },
    [stopFlyInRaf]
  );

  useEffect(() => {
    if (!isFreeSizeLayout || dragMeta || settling) {
      setAnimatedStringRadius(targetStringRadius);
      return undefined;
    }

    const from = animatedStringRadiusRef.current;
    const to = targetStringRadius;

    if (Math.abs(from - to) < 0.01) {
      setAnimatedStringRadius(to);
      return undefined;
    }

    const startedAt = performance.now();
    const radiusAnimMs =
      flyInActiveItemId || flyInAnimation ? BEAD_FLY_IN_MS : FREE_SIZE_RADIUS_ANIM_MS;

    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / radiusAnimMs);
      const eased = easeOutCubic(progress);
      setAnimatedStringRadius(lerp(from, to, eased));

      if (progress < 1) {
        stringRadiusAnimRef.current = requestAnimationFrame(tick);
      }
    };

    stringRadiusAnimRef.current = requestAnimationFrame(tick);

    return () => {
      if (stringRadiusAnimRef.current) {
        cancelAnimationFrame(stringRadiusAnimRef.current);
      }
    };
  }, [targetStringRadius, isFreeSizeLayout, dragMeta, settling, flyInActiveItemId, flyInAnimation]);

  const activeStringRadius = targetStringRadius;
  activeStringRadiusRef.current = activeStringRadius;
  const visualStringRadius = isFreeSizeLayout ? animatedStringRadius : targetStringRadius;

  const ringItems = useMemo(
    () => displayItems.filter((item) => item.type !== "charm"),
    [displayItems]
  );

  const charmItems = useMemo(
    () => displayItems.filter((item) => item.type === "charm"),
    [displayItems]
  );

  const charmPendants = useMemo(
    () =>
      charmItems.map((item) => ({
        item,
        layout: getCharmPendantLayout(item),
      })),
    [charmItems]
  );

  const flyingInItemId = useMemo(() => {
    if (flyInActiveItemId) {
      return flyInActiveItemId;
    }
    if (flyInAnimation?.itemId) {
      return flyInAnimation.itemId;
    }
    if (flyInAnimation?.slotIndex != null && !flyInAnimation?.itemId) {
      const slotItems = isManualMode ? manualItems : presetSlotItems;
      const idx = flyInAnimation.slotIndex;
      if (idx >= 0 && idx < slotItems.length) {
        return slotItems[idx]?.id ?? null;
      }
    }
    return null;
  }, [
    flyInActiveItemId,
    flyInAnimation?.itemId,
    flyInAnimation?.slotIndex,
    isManualMode,
    manualItems,
    presetSlotItems,
  ]);
  const draggedId = dragMeta?.id ?? settling?.id ?? flyingInItemId;
  const isRemoveZone = Boolean(dragMeta?.isRemoveZone);
  const charmGapAdjusted = Boolean(dragMeta?.charmGapAdjusted);

  // Read by the drag loop each frame to decide which charms ease aside for the dragged one.
  dragNeighbourCharmsRef.current = useMemo(
    () =>
      charmDragActive
        ? displayItems.filter((entry) => entry.type === "charm" && entry.id !== dragMeta?.id)
        : [],
    [charmDragActive, displayItems, dragMeta?.id]
  );

  const registerCharmNeighbourEl = useCallback((id, element) => {
    if (element) {
      charmNeighbourElsRef.current.set(id, element);
    } else {
      charmNeighbourElsRef.current.delete(id);
    }
  }, []);

  const isItemHiddenForFlyIn = useCallback(
    (itemId) => flyingInItemId != null && itemId === flyingInItemId,
    [flyingInItemId]
  );

  const applyGhostVisuals = useCallback((drag) => {
    const ghostWrap = ghostWrapRef.current;
    const ghostShadow = ghostShadowRef.current;
    const ghostFaceScale = ghostFaceScaleRef.current;
    const ghostFace = ghostFaceRef.current;
    const charmGhost = ghostCharmRef.current;
    if (!drag?.item) {
      return;
    }

    const removeT = drag.removeT ?? 0;
    const scale = lerp(1.08, 0.86, removeT);
    const opacity = lerp(1, 0.42, removeT);
    const lift = lerp(0, -8, removeT);
    let x = drag.ghostX ?? drag.item.x;
    let y = drag.ghostY ?? drag.item.y;
    // Strung items follow the tangent wherever they currently are, so the ghost is already
    // sitting at its landing angle when it is dropped instead of spinning into it afterwards.
    // A charm keeping the rotation it had at its old gap only hangs correctly near where it
    // started, which is why one lifted from the bottom looked wrong on the top and sides.
    const rotation =
      drag.item.type === "charm"
        ? drag.ghostRotationDeg ??
          getCharmHangRotationDegreesAtAngle(
            drag.ghostAngle ?? getPointerAngle(CENTER_X, CENTER_Y, x, y)
          )
        : getStrungItemRotationDegrees(drag.item.type, x, y, CENTER_X, CENTER_Y);

    if (drag.item.type === "charm") {
      const useCrevicePose = Boolean(drag.charmSnapLayout) && removeT < 0.08;
      const radial = Math.hypot(x - CENTER_X, y - CENTER_Y);
      if (!useCrevicePose && radial > 0.001) {
        const liftOut = CHARM_DRAG_GHOST_OUTWARD_LIFT_PX + lift;
        x += ((x - CENTER_X) / radial) * liftOut;
        y += ((y - CENTER_Y) / radial) * liftOut;
      }
      if (ghostWrap) ghostWrap.style.opacity = "0";
      if (charmGhost) {
        charmGhost.style.opacity = String(opacity);
        charmGhost.style.removeProperty("transform");
        const scaleSuffix = scale === 1 ? "" : ` scale(${scale})`;
        charmGhost.setAttribute(
          "transform",
          `translate(${x} ${y}) rotate(${rotation})${scaleSuffix}`
        );
      }
      return;
    }

    const beadCenterY = y + lift;

    if (ghostWrap) {
      ghostWrap.style.opacity = String(opacity);
      ghostWrap.setAttribute(
        "transform",
        `translate(${Math.round(x * 1000) / 1000} ${Math.round(beadCenterY * 1000) / 1000})`
      );
    }
    if (ghostFaceScale) {
      ghostFaceScale.setAttribute("transform", `scale(${Math.round(scale * 1000) / 1000})`);
    }
    if (drag.item.type === "bead") {
      const radius = Math.max(drag.item.width, drag.item.height) / 2;
      updateBeadPortableRingVisuals({
        shadowGroupEl: ghostShadow,
        shineWrapEl: ghostShineRef.current,
        faceGroupEl: ghostFace,
        ringX: x,
        ringY: beadCenterY,
        centerX: CENTER_X,
        centerY: CENTER_Y,
        radius,
        rotation: rotation ?? 0,
        shadowSmoothState: drag.beadShadowSmooth,
      });
    } else if (ghostFace) {
      ghostFace.setAttribute("transform", `rotate(${rotation ?? 0})`);
    }
    if (charmGhost) {
      charmGhost.style.opacity = "0";
    }
  }, []);

  const getCharmGhostParts = useCallback((item, attachX, attachY) => {
    const pendant = getCharmPendantLayout({ ...item, x: attachX, y: attachY });
    return {
      rotationDeg: pendant.hardwareRotationDeg,
      layoutMode: pendant.layoutMode,
      stringJumpRing: pendant.stringJumpRing,
      stringBailFrontArc: pendant.stringBailFrontArc,
      stringLink: pendant.stringLink,
      jumpRing: pendant.jumpRing,
      connectorLine: pendant.connectorLine,
      image: pendant.charmImage,
    };
  }, []);

  /**
   * Per-frame half of the charm drag preview. Both the insertion marker and the neighbouring
   * charms are written straight to the DOM here: routing them through state would re-render
   * the whole ring on every pointer move, which is the stutter this replaces.
   */
  const updateCharmDragPreviewFrame = useCallback((drag, deltaMs) => {
    const openT = drag.isRemoveZone ? 0 : 1;
    drag.spreadT = lerp(
      drag.spreadT ?? 0,
      openT,
      frameLerpAmount(CHARM_SPREAD_OPEN_LERP, deltaMs)
    );

    const marker = dropMarkerRef.current;
    if (marker) {
      // The marker chases the gap the placement logic picked. Easing the angle rather than
      // writing it straight lets it glide round the string as the pick changes, instead of
      // blinking from one gap to the next.
      const targetAngle = drag.snapAngle ?? drag.ghostAngle ?? 0;
      drag.markerAngle =
        drag.markerAngle == null
          ? targetAngle
          : approachAngle(drag.markerAngle, targetAngle, frameLerpAmount(0.3, deltaMs));

      const radius = activeStringRadiusRef.current;
      const markerX = CENTER_X + Math.cos(drag.markerAngle) * radius;
      const markerY = CENTER_Y + Math.sin(drag.markerAngle) * radius;
      marker.setAttribute("transform", `translate(${markerX} ${markerY})`);
      marker.style.opacity = String(drag.spreadT);
    }

    const neighbourEls = charmNeighbourElsRef.current;
    if (!neighbourEls.size) {
      return;
    }

    const offsets = getCharmNeighbourSpreadOffsets(
      dragNeighbourCharmsRef.current,
      drag.ghostAngle,
      { centerX: CENTER_X, centerY: CENTER_Y, spreadT: drag.spreadT }
    );

    neighbourEls.forEach((element, id) => {
      if (!element || id === drag.id) {
        return;
      }
      const offset = offsets.get(id) ?? 0;
      // Swinging about the ring centre keeps each charm on the string as it shifts aside.
      // Written as a CSS transform (not the SVG attribute) so the stylesheet can ease it
      // back to rest once the drag class comes off.
      element.style.transform = offset ? `rotate(${(offset * 180) / Math.PI}deg)` : "";
    });
  }, []);

  const clearCharmDragPreviewFrame = useCallback(() => {
    charmNeighbourElsRef.current.forEach((element) => {
      if (element) {
        element.style.transform = "";
      }
    });
    const marker = dropMarkerRef.current;
    if (marker) {
      marker.style.opacity = "0";
    }
  }, []);

  const tickDragFrame = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }

    const pendingPointer = pendingPointerRef.current;
    if (pendingPointer) {
      pendingPointerRef.current = null;
      updateDragFromPointerRef.current?.(pendingPointer.x, pendingPointer.y);
    }

    const now =
      typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
    const deltaMs = now - (drag.lastFrameMs ?? now - 16.7);
    drag.lastFrameMs = now;

    drag.removeT = lerp(
      drag.removeT ?? 0,
      drag.isRemoveZone ? 1 : 0,
      frameLerpAmount(0.22, deltaMs)
    );

    if (drag.item.type === "charm") {
      const arc = getCharmDragArcPoint({
        centerX: CENTER_X,
        centerY: CENTER_Y,
        ringRadius: activeStringRadiusRef.current,
        pointerX: drag.pointerX,
        pointerY: drag.pointerY,
        freeT: drag.removeT,
      });

      const snapLayout = drag.charmSnapLayout;
      const removeT = drag.removeT ?? 0;
      let ghostX = arc.x;
      let ghostY = arc.y;
      let ghostRotation =
        drag.ghostRotationDeg ??
        getCharmHangRotationDegreesAtAngle(arc.angle);

      if (snapLayout && removeT < 1) {
        const targetX = snapLayout.x;
        const targetY = snapLayout.y;
        const targetRotation =
          snapLayout.hardwareRotation ??
          snapLayout.rotation ??
          getCharmDisplayRotation(snapLayout);
        const follow = frameLerpAmount(0.48, deltaMs);
        const prevX = drag.ghostX ?? targetX;
        const prevY = drag.ghostY ?? targetY;
        const easedX = lerp(prevX, targetX, follow);
        const easedY = lerp(prevY, targetY, follow);
        const easedRotation =
          (drag.ghostRotationDeg ?? targetRotation) +
          normalizeAngleDelta(targetRotation - (drag.ghostRotationDeg ?? targetRotation)) *
            follow;
        ghostX = lerp(easedX, arc.x, removeT);
        ghostY = lerp(easedY, arc.y, removeT);
        ghostRotation =
          easedRotation +
          normalizeAngleDelta(
            getCharmHangRotationDegreesAtAngle(arc.angle) - easedRotation
          ) *
            removeT;
      }

      drag.ghostAngle = getPointerAngle(CENTER_X, CENTER_Y, ghostX, ghostY);
      drag.ghostX = ghostX;
      drag.ghostY = ghostY;
      drag.displayX = ghostX;
      drag.displayY = ghostY;
      drag.ghostRotationDeg = ghostRotation;

      const ghostItemPose = {
        ...drag.item,
        x: ghostX,
        y: ghostY,
        hardwareRotation: ghostRotation,
        rotation: ghostRotation,
      };
      drag.charmGhostParts = getCharmGhostParts(ghostItemPose, ghostX, ghostY);

      updateCharmDragPreviewFrame(drag, deltaMs);
    } else {
      drag.ghostX = drag.pointerX - drag.offsetX;
      drag.ghostY = drag.pointerY - drag.offsetY;
    }

    applyGhostVisuals(drag);
    rafRef.current = requestAnimationFrame(tickDragFrame);
  }, [applyGhostVisuals, getCharmGhostParts, updateCharmDragPreviewFrame]);

  const stopDragFrame = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);


  const beginSettling = useCallback(
    (state) => {
      const { fromIndex, snapGap, isRemoveZone, id, item } = state;
      const isCharmDrag = item.type === "charm";
      const layoutConfig = {
        isManualMode,
        ringRadiusHint,
        layoutRingRadius,
        sizeId,
        isStringFull,
        isFreeSizeLayout,
      };
      const charmSegmentCount = getCharmPlacementSegmentCount(pattern);
      const normalizedSnapGap = isCharmDrag
        ? normalizeCharmGapIndex(snapGap, charmSegmentCount)
        : snapGap;
      // snapGap was measured on the ring with the dragged item already lifted out, so every
      // index derived from it lives in that same "remaining" space.
      const remainingPattern = pattern.filter((entry) => entry.id !== id);
      const remainingRingCount = remainingPattern.filter(
        (entry) => entry.type !== "charm"
      ).length;
      const fromRingIndex = pattern
        .filter((entry) => entry.type !== "charm")
        .findIndex((entry) => entry.id === id);
      const insertRingIndex = isCharmDrag
        ? fromRingIndex
        : gapToInsertIndex(snapGap, remainingRingCount, {
            closedLoop: ringDragUsesClosedGaps,
          });
      // The pattern carries charms between the strung items, so a ring slot has to be mapped
      // across before splicing or the bead lands a position off.
      const insertPatternIndex = isCharmDrag
        ? fromIndex
        : ringIndexToSlotIndex(remainingPattern, insertRingIndex);
      let finalItems;
      let targetItem = null;
      if (isCharmDrag) {
        finalItems = resolveCharmLayoutItemsForGapPreview({
          itemId: id,
          ringGap: normalizedSnapGap,
          pattern,
          layoutConfig,
          omitDragged: isRemoveZone,
        });
        targetItem = isRemoveZone ? null : finalItems.find((entry) => entry.id === id) ?? null;
      } else {
        const finalPattern = isRemoveZone
          ? buildPreviewPattern(pattern, fromIndex, 0, { omitDragged: true })
          : buildPreviewPattern(pattern, fromIndex, insertPatternIndex);
        finalItems = layoutPositionedItemsForPattern(finalPattern, layoutConfig);
        targetItem = isRemoveZone ? null : finalItems.find((entry) => entry.id === id);
      }

      const snapLayout =
        isCharmDrag && !isRemoveZone
          ? state.charmSnapLayout ??
            resolveCharmDragSnapLayoutTarget({
              charmId: id,
              snapGap: normalizedSnapGap,
              pattern,
              layoutConfig,
              charmItem: item,
            })
          : null;
      const rawGhostX = state.ghostX ?? state.displayX ?? item.x;
      const rawGhostY = state.ghostY ?? state.displayY ?? item.y;
      const ghostAnchor =
        snapLayout
          ? { x: snapLayout.x, y: snapLayout.y }
          : isCharmDrag
            ? applyCharmGhostOutwardLift(rawGhostX, rawGhostY)
            : { x: rawGhostX, y: rawGhostY };
      const ghostX = ghostAnchor.x;
      const ghostY = ghostAnchor.y;
      const targetX = targetItem?.x ?? ghostX;
      const targetY = targetItem?.y ?? ghostY;

      // The ghost already turned with the string while it was dragged, so it settles from
      // wherever it currently points. Unwrapping the delta keeps a ghost at 170° settling to
      // -170° as a 20° turn rather than a full lap the other way.
      const ghostRotation = isCharmDrag
        ? snapLayout
          ? snapLayout.hardwareRotation ??
            snapLayout.rotation ??
            getCharmDisplayRotation(snapLayout)
          : state.ghostRotationDeg ??
            getCharmHangRotationDegreesAtAngle(
              state.ghostAngle ?? getPointerAngle(CENTER_X, CENTER_Y, ghostX, ghostY)
            )
        : getStrungItemRotationDegrees(item.type, ghostX, ghostY, CENTER_X, CENTER_Y);
      const landedRotation = isCharmDrag
        ? targetItem?.hardwareRotation ??
          targetItem?.rotation ??
          getCharmDisplayRotation(targetItem ?? item)
        : targetItem?.rotation ?? ghostRotation;

      setSettling({
        id,
        item,
        isRemoveZone,
        fromIndex,
        insertIndex: insertRingIndex,
        ghostX,
        ghostY,
        targetX,
        targetY,
        ghostRotation,
        targetRotation: isCharmDrag
          ? landedRotation
          : ghostRotation + normalizeAngleDelta(landedRotation - ghostRotation),
        finalItems,
        animate: false,
        ...(isCharmDrag
          ? { progress: 0, normalizedSnapGap: isRemoveZone ? null : normalizedSnapGap }
          : {}),
      });

      if (!isCharmDrag) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setSettling((prev) => (prev ? { ...prev, animate: true } : prev));
          });
        });

        window.setTimeout(() => {
          // Ring indices ignore charms; the slot list does not, so translate before writing.
          const slotItems = isManualMode ? manualItems : presetSlotItems;
          const fromSlot = slotItems.findIndex((entry) => entry.id === id);
          if (fromSlot < 0) {
            setSettling(null);
            return;
          }

          if (isRemoveZone) {
            if (isManualMode) {
              removeManualItemAt(fromSlot, { playSound: false });
            } else {
              removePresetSlotAt(fromSlot, { playSound: false });
            }
          } else if (insertRingIndex !== fromRingIndex) {
            const remaining = slotItems.filter((_, index) => index !== fromSlot);
            const toSlot = ringIndexToSlotIndex(remaining, insertRingIndex);
            if (isManualMode) {
              reorderManualItems(fromSlot, toSlot, { playSound: false });
            } else {
              reorderPresetSlotItems(fromSlot, toSlot, { playSound: false });
            }
          }
          setSettling(null);
        }, RING_DRAG_SETTLE_MS);
      }
    },
    [
      isManualMode,
      isStringFull,
      isFreeSizeLayout,
      manualItems,
      presetSlotItems,
      pattern,
      ringRadiusHint,
      layoutRingRadius,
      ringDragUsesClosedGaps,
      sizeId,
      removeManualItemAt,
      removePresetSlotAt,
      removeBraceletCharmById,
      updateBraceletCharmGap,
      reorderManualItems,
      reorderPresetSlotItems,
    ]
  );

  useEffect(() => {
    if (!settling?.id || settling.item?.type !== "charm") {
      return undefined;
    }

    const settlingId = settling.id;
    const isRemoveZone = settling.isRemoveZone;
    const nextGap = settling.normalizedSnapGap;
    const dropDistance = Math.hypot(
      (settling.targetX ?? 0) - (settling.ghostX ?? 0),
      (settling.targetY ?? 0) - (settling.ghostY ?? 0)
    );
    let raf = 0;
    const start =
      typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();

    const finish = () => {
      if (isRemoveZone) {
        removeBraceletCharmById(settlingId, { playSound: false });
      } else if (Number.isFinite(nextGap)) {
        updateBraceletCharmGap(settlingId, nextGap, { playSound: false });
      }
      setSettling(null);
    };

    if (!isRemoveZone && dropDistance < 2) {
      finish();
      return undefined;
    }

    const tick = (now) => {
      const linear = Math.min(1, (now - start) / RING_DRAG_SETTLE_MS);
      setSettling((prev) => {
        if (!prev || prev.id !== settlingId) {
          return prev;
        }
        return { ...prev, progress: linear };
      });
      if (linear < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        finish();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [settling?.id, removeBraceletCharmById, updateBraceletCharmGap]);

  const updateDragFromPointer = useCallback(
    (clientX, clientY) => {
      const drag = dragRef.current;
      const svg = svgRef.current;
      if (!drag || !svg) {
        return;
      }

      const point = pointerToRingLocalPoint(
        svg,
        CENTER_X,
        CENTER_Y,
        ringViewRotation,
        clientX,
        clientY
      );
      const distance = getPointerDistance(CENTER_X, CENTER_Y, point.x, point.y);
      const nextRemoveZone = resolveRemoveZone(
        distance,
        activeStringRadius,
        drag.lastRemoveZone ?? false
      );
      const pointerAngle = getPointerAngle(CENTER_X, CENTER_Y, point.x, point.y);
      const gapItems = getRingGapItems(settledItems, drag.id);
      let nextSnapGap = drag.snapGap;
      let charmGapAdjusted = false;

      if (nextRemoveZone) {
        nextSnapGap = drag.snapGap;
      } else if (drag.item.type === "charm") {
        const segmentCount = gapItems.length || getCharmPlacementSegmentCount(pattern);
        const resolved = resolveCharmDragSnapGap({
          gapItems,
          centerX: CENTER_X,
          centerY: CENTER_Y,
          pointerAngle,
          segmentCount,
          pattern,
          excludeCharmId: drag.id,
          closedLoop: ringDragUsesClosedGaps,
          defaultSizeId: sizeId,
        });
        nextSnapGap = resolved.snapGap;
        charmGapAdjusted = resolved.charmGapAdjusted;
        // Where the placement logic just decided the charm belongs. The drag loop eases the
        // marker toward this, so the preview stays continuous while the pick stays discrete.
        const snapPoint = gapItems.length
          ? getGapRingPoint(nextSnapGap, gapItems, activeStringRadius, CENTER_X, CENTER_Y, {
              defaultSizeId: sizeId,
            })
          : getCharmOnlySlotRingPoint(
              nextSnapGap,
              segmentCount,
              activeStringRadius,
              CENTER_X,
              CENTER_Y
            );
        drag.snapAngle = getPointerAngle(CENTER_X, CENTER_Y, snapPoint.x, snapPoint.y);
      } else {
        nextSnapGap = findNearestGapIndex(gapItems, CENTER_X, CENTER_Y, pointerAngle, {
          closedLoop: ringDragUsesClosedGaps,
        });
      }

      drag.pointerX = point.x;
      drag.pointerY = point.y;
      drag.isRemoveZone = nextRemoveZone;
      const snapChanged = nextSnapGap !== drag.snapGap;
      const removeChanged = nextRemoveZone !== drag.lastRemoveZone;
      const adjustedChanged = charmGapAdjusted !== drag.charmGapAdjusted;

      drag.snapGap = nextSnapGap;
      drag.lastRemoveZone = nextRemoveZone;
      drag.charmGapAdjusted = charmGapAdjusted;

      if (drag.item.type === "charm") {
        drag.charmSnapLayout = nextRemoveZone
          ? null
          : resolveCharmDragSnapLayoutTarget({
              charmId: drag.id,
              snapGap: nextSnapGap,
              pattern,
              layoutConfig: charmLayoutConfig,
              charmItem: drag.item,
            });
        // The marker and the neighbours are moved by the drag loop, so state only has to keep
        // up with what actually changes the rendered tree. `charmGapAdjusted` used to be
        // included by value rather than by change, re-rendering the ring on every frame it
        // stayed true.
        if (snapChanged || removeChanged || adjustedChanged) {
          setDragMeta((prev) =>
            prev
              ? {
                  ...prev,
                  snapGap: nextSnapGap,
                  isRemoveZone: nextRemoveZone,
                  charmGapAdjusted,
                }
              : prev
          );
        }
      } else if (snapChanged || removeChanged || adjustedChanged) {
        setDragMeta((prev) =>
          prev
            ? {
                ...prev,
                snapGap: nextSnapGap,
                isRemoveZone: nextRemoveZone,
                charmGapAdjusted,
              }
            : prev
        );
      }
    },
    [
      activeStringRadius,
      getCharmGhostParts,
      isManualMode,
      isStringFull,
      isFreeSizeLayout,
      layoutRingRadius,
      pattern,
      ringDragUsesClosedGaps,
      ringRadiusHint,
      ringViewRotation,
      settledItems,
      sizeId,
      charmLayoutConfig,
    ]
  );

  updateDragFromPointerRef.current = updateDragFromPointer;

  useLayoutEffect(() => {
    const drag = dragRef.current;
    if (!dragMeta || !drag?.item || drag.item.type !== "charm") {
      return;
    }
    applyGhostVisuals(drag);
  }, [dragMeta, applyGhostVisuals]);

  const handleDragPointerEndRef = useRef(null);

  useEffect(() => {
    if (!isRingDragActive) {
      return undefined;
    }

    const handlePointerMove = (event) => {
      if (event.pointerId !== dragRef.current?.pointerId) {
        return;
      }
      event.preventDefault();
      pendingPointerRef.current = { x: event.clientX, y: event.clientY };
    };

    const handlePointerEnd = (event) => {
      if (event.pointerId !== dragRef.current?.pointerId) {
        return;
      }
      event.preventDefault();
      handleDragPointerEndRef.current?.(event);
    };

    const handleTouchMove = (event) => {
      if (!dragRef.current) {
        return;
      }
      event.preventDefault();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerEnd, { passive: false });
    window.addEventListener("pointercancel", handlePointerEnd, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isRingDragActive]);

  const handleDragPointerEnd = useCallback(
    (event) => {
      const pendingPointer = pendingPointerRef.current;
      if (pendingPointer) {
        pendingPointerRef.current = null;
        updateDragFromPointerRef.current?.(pendingPointer.x, pendingPointer.y);
      }

      const dragState = dragRef.current;
      dragRef.current = null;
      stopDragFrame();
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 450);

      releaseSvgPointer(svgRef.current, event.pointerId);

      if (dragState) {
        setDragMeta(null);
        clearCharmDragPreviewFrame();
        if (ghostCharmRef.current) {
          ghostCharmRef.current.removeAttribute("transform");
        }
        // Play while the pointer-up gesture is still active — tones scheduled after settle
        // often miss autoplay unlock.
        unlockBeadsAudio();
        if (dragState.isRemoveZone) {
          playBeadRemoveSound();
        } else {
          playBeadMoveSound();
        }
        // Charms used to commit here and jump to their gap. They settle like everything else
        // now, easing from wherever the drag left them into the gap that was picked.
        beginSettling({
          ...dragState,
          snapGap: dragState.snapGap,
          isRemoveZone: dragState.isRemoveZone,
          item: dragState.item,
        });
      } else {
        setDragMeta(null);
      }
    },
    [
      beginSettling,
      clearCharmDragPreviewFrame,
      stopDragFrame,
    ]
  );

  handleDragPointerEndRef.current = handleDragPointerEnd;

  useEffect(() => () => stopDragFrame(), [stopDragFrame]);

  const stopSpinInertia = useCallback(() => {
    if (spinInertiaRafRef.current) {
      cancelAnimationFrame(spinInertiaRafRef.current);
      spinInertiaRafRef.current = null;
    }
  }, []);

  useEffect(() => () => stopSpinInertia(), [stopSpinInertia]);

  const stopAutoRotate = useCallback(() => {
    if (autoRotateRafRef.current) {
      cancelAnimationFrame(autoRotateRafRef.current);
      autoRotateRafRef.current = null;
    }
  }, []);

  useEffect(() => () => stopAutoRotate(), [stopAutoRotate]);

  useEffect(() => {
    const autoRotatePaused = !view360 || dragMeta || settling || isRingSpinning;

    if (autoRotatePaused) {
      stopAutoRotate();
      return undefined;
    }

    stopSpinInertia();

    let lastTime = performance.now();
    const tick = (now) => {
      const deltaMs = now - lastTime;
      lastTime = now;
      setRingViewRotation((value) => value + getAutoRotateDeltaDeg(deltaMs));
      autoRotateRafRef.current = requestAnimationFrame(tick);
    };

    autoRotateRafRef.current = requestAnimationFrame(tick);

    return () => {
      stopAutoRotate();
    };
  }, [view360, dragMeta, settling, isRingSpinning, stopAutoRotate, stopSpinInertia]);

  const spinPreviewEnabled =
    !view360 &&
    !dragMeta &&
    !settling &&
    !flyInActiveItemId &&
    !flyInAnimation &&
    !focusLockActive;

  const beginSpinInertia = useCallback(
    (velocity) => {
      stopSpinInertia();

      if (Math.abs(velocity) < RING_SPIN_MIN_VELOCITY) {
        return;
      }

      let spinVelocity = velocity;
      let lastTime = performance.now();

      const tick = (now) => {
        const dt = now - lastTime;
        lastTime = now;

        setRingViewRotation((value) => value + spinVelocity * dt);
        spinVelocity *= RING_SPIN_FRICTION;

        if (Math.abs(spinVelocity) >= RING_SPIN_MIN_VELOCITY) {
          spinInertiaRafRef.current = requestAnimationFrame(tick);
        } else {
          spinInertiaRafRef.current = null;
        }
      };

      spinInertiaRafRef.current = requestAnimationFrame(tick);
    },
    [stopSpinInertia]
  );

  const cancelActiveSpin = useCallback(() => {
    stopSpinInertia();
    spinRef.current = null;
    setIsRingSpinning(false);
  }, [stopSpinInertia]);

  /** 3D preview is view-only — drop any in-progress 2D drag / spin / pinch when entering 360°. */
  useEffect(() => {
    if (!view360) {
      return;
    }
    if (dragRef.current || dragMeta) {
      dragRef.current = null;
      pendingPointerRef.current = null;
      stopDragFrame();
      setDragMeta(null);
      clearCharmDragPreviewFrame();
      if (ghostCharmRef.current) {
        ghostCharmRef.current.removeAttribute("transform");
      }
    }
    cancelActiveSpin();
    previewPointersRef.current.clear();
    pinchSessionRef.current = null;
    setIsPreviewPinching(false);
  }, [
    view360,
    dragMeta,
    stopDragFrame,
    clearCharmDragPreviewFrame,
    cancelActiveSpin,
  ]);

  const beginPinchSession = useCallback(() => {
    const metrics = getTwoPointerMetrics(previewPointersRef.current);
    if (!metrics || metrics.distance < 6) {
      return;
    }

    const current = previewZoomRef.current;
    cancelActiveSpin();
    pinchSessionRef.current = {
      startDistance: metrics.distance,
      startCenterX: metrics.centerX,
      startCenterY: metrics.centerY,
      startScale: current.scale,
      startX: current.x,
      startY: current.y,
    };
    setIsPreviewPinching(true);
  }, [cancelActiveSpin]);

  const applyPinchFromPointers = useCallback(() => {
    const session = pinchSessionRef.current;
    const metrics = getTwoPointerMetrics(previewPointersRef.current);
    if (!session || !metrics) {
      return;
    }

    const ratio = metrics.distance / session.startDistance;
    const scale = clampPreviewZoom(session.startScale * ratio);
    const x = session.startX + (metrics.centerX - session.startCenterX);
    const y = session.startY + (metrics.centerY - session.startCenterY);
    setPreviewZoom(normalizePreviewPan(scale, x, y));
  }, []);

  const handleStagePointerDown = useCallback(
    (event) => {
      if (!svgRef.current) {
        return;
      }

      if (event.target.closest(".beads-2d-drag-hit")) {
        return;
      }

      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      previewPointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      if (previewPointersRef.current.size >= 2) {
        event.preventDefault();
        beginPinchSession();
        return;
      }

      if (!spinPreviewEnabled) {
        return;
      }

      stopSpinInertia();

      spinRef.current = {
        pointerId: event.pointerId,
        lastAngle: getPointerAngleDeg(
          svgRef.current,
          CENTER_X,
          CENTER_Y,
          event.clientX,
          event.clientY
        ),
        lastTime: performance.now(),
        velocity: 0,
      };

      setIsRingSpinning(true);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [beginPinchSession, spinPreviewEnabled, stopSpinInertia]
  );

  const handleStagePointerMove = useCallback(
    (event) => {
      if (previewPointersRef.current.has(event.pointerId)) {
        previewPointersRef.current.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY,
        });
      }

      if (previewPointersRef.current.size >= 2) {
        if (!pinchSessionRef.current) {
          beginPinchSession();
        }
        if (pinchSessionRef.current) {
          event.preventDefault();
          applyPinchFromPointers();
        }
        return;
      }

      const spin = spinRef.current;
      const svg = svgRef.current;

      if (!spin || !svg || event.pointerId !== spin.pointerId) {
        return;
      }

      const now = performance.now();
      const angle = getPointerAngleDeg(svg, CENTER_X, CENTER_Y, event.clientX, event.clientY);
      const delta = normalizeAngleDelta(angle - spin.lastAngle);
      const dt = Math.max(now - spin.lastTime, 1);

      spin.velocity = delta / dt;
      spin.lastAngle = angle;
      spin.lastTime = now;

      setRingViewRotation((value) => value + delta);
    },
    [applyPinchFromPointers, beginPinchSession]
  );

  const handleStagePointerUp = useCallback(
    (event) => {
      previewPointersRef.current.delete(event.pointerId);

      if (previewPointersRef.current.size < 2) {
        pinchSessionRef.current = null;
        setIsPreviewPinching(false);
        setPreviewZoom((value) => normalizePreviewPan(value.scale, value.x, value.y));
      }

      const spin = spinRef.current;

      if (!spin) {
        return;
      }

      if (event.pointerId !== undefined && event.pointerId !== spin.pointerId) {
        return;
      }

      const velocity = spin.velocity;
      spinRef.current = null;
      setIsRingSpinning(false);

      if (event.currentTarget?.releasePointerCapture) {
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          // Pointer may already be released.
        }
      }

      beginSpinInertia(velocity);
    },
    [beginSpinInertia]
  );

  const handleStageWheel = useCallback(
    (event) => {
      if (dragMeta || settling || flyInActiveItemId || flyInAnimation) {
        return;
      }
      if (!svgRef.current) {
        return;
      }

      event.preventDefault();
      const delta = -event.deltaY * PREVIEW_WHEEL_ZOOM_SENSITIVITY;
      setPreviewZoom((prev) => {
        const nextScale = clampPreviewZoom(prev.scale * (1 + delta));
        return normalizePreviewPan(nextScale, prev.x, prev.y);
      });
    },
    [dragMeta, settling, flyInActiveItemId, flyInAnimation]
  );

  useEffect(() => {
    const stage = stageWrapRef.current;
    if (!stage) {
      return undefined;
    }

    stage.addEventListener("wheel", handleStageWheel, { passive: false });
    return () => {
      stage.removeEventListener("wheel", handleStageWheel);
    };
  }, [handleStageWheel]);

  const handleItemPointerDown = useCallback(
    (event, item) => {
      if (!dragEnabled || !item.id) {
        return;
      }

      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      if (event.isPrimary === false) {
        return;
      }

      const isHangingCharm = item.type === "charm" && hangingCharmIdSet.has(item.id);
      if (item.type === "charm" && !isHangingCharm) {
        return;
      }

      // Pattern order is every ring item followed by every charm, so a ring item's pattern
      // index is also its index along the string — the space gaps and drops are measured in.
      const fromIndex = patternIndexById.get(item.id);
      if (fromIndex == null) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      unlockBeadsAudio();
      suppressClickRef.current = true;
      stopSpinInertia();
      spinRef.current = null;
      setIsRingSpinning(false);

      const svg = svgRef.current;
      const point = pointerToRingLocalPoint(
        svg,
        CENTER_X,
        CENTER_Y,
        ringViewRotation,
        event.clientX,
        event.clientY
      );
      const pointerAngle = getPointerAngle(CENTER_X, CENTER_Y, point.x, point.y);
      const gapItems = getRingGapItems(settledItems, item.id);
      let snapGap = 0;
      let charmGapAdjusted = false;
      if (item.type === "charm") {
        const segmentCount = gapItems.length || getCharmPlacementSegmentCount(pattern);
        const resolved = resolveCharmDragSnapGap({
          gapItems,
          centerX: CENTER_X,
          centerY: CENTER_Y,
          pointerAngle,
          segmentCount,
          pattern,
          excludeCharmId: item.id,
          closedLoop: ringDragUsesClosedGaps,
          defaultSizeId: sizeId,
        });
        snapGap = resolved.snapGap;
        charmGapAdjusted = resolved.charmGapAdjusted;
      } else {
        snapGap = findNearestGapIndex(gapItems, CENTER_X, CENTER_Y, pointerAngle, {
          closedLoop: ringDragUsesClosedGaps,
        });
      }

      const distance = getPointerDistance(CENTER_X, CENTER_Y, point.x, point.y);
      const removeZone = isPointerOutsideRing(distance, activeStringRadius);
      const pendant = item.type === "charm" ? getCharmPendantLayout(item) : null;
      const grabWorld =
        item.type === "charm" && pendant ? getCharmWorldHitPoint(item, pendant) : null;
      const charmSnapLayout =
        item.type === "charm" && !removeZone
          ? resolveCharmDragSnapLayoutTarget({
              charmId: item.id,
              snapGap,
              pattern,
              layoutConfig: charmLayoutConfig,
              charmItem: item,
            })
          : null;
      const nextState = {
        pointerId: event.pointerId,
        id: item.id,
        fromIndex,
        item,
        offsetX: grabWorld ? point.x - grabWorld.x : point.x - item.x,
        offsetY: grabWorld ? point.y - grabWorld.y : point.y - item.y,
        grabAttachDx: grabWorld ? grabWorld.x - item.x : 0,
        grabAttachDy: grabWorld ? grabWorld.y - item.y : 0,
        pointerX: point.x,
        pointerY: point.y,
        ghostX: charmSnapLayout?.x ?? item.x,
        ghostY: charmSnapLayout?.y ?? item.y,
        displayX: charmSnapLayout?.x ?? item.x,
        displayY: charmSnapLayout?.y ?? item.y,
        charmSnapLayout,
        charmTargetX: item.type === "charm" ? item.x : null,
        charmTargetY: item.type === "charm" ? item.y : null,
        snapGap,
        charmGapAdjusted,
        isRemoveZone: removeZone,
        lastRemoveZone: removeZone,
        removeT: 0,
        // Start the preview closed and centred on the grab so the ring eases open from where
        // the charm already sits rather than snapping open on the first frame.
        ghostAngle: item.type === "charm" ? getPointerAngle(CENTER_X, CENTER_Y, item.x, item.y) : null,
        ghostRotationDeg:
          item.type === "charm"
            ? charmSnapLayout
              ? charmSnapLayout.hardwareRotation ??
                charmSnapLayout.rotation ??
                getCharmDisplayRotation(charmSnapLayout)
              : getCharmDisplayRotation(item)
            : null,
        snapAngle: null,
        markerAngle: null,
        spreadT: 0,
        lastFrameMs: null,
        beadShadowSmooth: item.type === "bead" ? {} : null,
        charmGhostParts:
          item.type === "charm" ? getCharmGhostParts(item, item.x, item.y) : null,
      };

      dragRef.current = nextState;
      setDragMeta({
        id: item.id,
        fromIndex,
        item,
        snapGap,
        charmGapAdjusted,
        isRemoveZone: removeZone,
        charmGhostParts:
          item.type === "charm" ? getCharmGhostParts(item, item.x, item.y) : null,
      });

      applyGhostVisuals(nextState);
      if (item.type === "charm" && !removeZone) {
        updateDragFromPointer(event.clientX, event.clientY);
      }
      rafRef.current = requestAnimationFrame(tickDragFrame);
      if (event.currentTarget?.setPointerCapture) {
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          captureSvgPointer(svgRef.current, event.pointerId);
        }
      } else {
        captureSvgPointer(svgRef.current, event.pointerId);
      }
    },
    [
      activeStringRadius,
      applyGhostVisuals,
      dragEnabled,
      hangingCharmIdSet,
      pattern,
      patternIndexById,
      ringDragUsesClosedGaps,
      settledItems,
      sizeId,
      getCharmGhostParts,
      ringViewRotation,
      stopSpinInertia,
      tickDragFrame,
      updateDragFromPointer,
      charmLayoutConfig,
    ]
  );

  const getTransitionClass = () => {
    if (settling) return "beads-2d-ring-item--settling";
    if (charmDragActive || ringBeadDragActive) return "";
    if (dragMeta || flyInActiveItemId || flyInAnimation) return "beads-2d-ring-item--preview";
    if (isManualMode) return "beads-2d-ring-item--animated";
    return "";
  };

  /** Shuffled slots pop in place on the ring instead of flying in from the picker. */
  const getSwapClass = (itemId) =>
    `beads-2d-item-swap${randomizeSwappedIds?.has(itemId) ? " is-swapping" : ""}`;

  const isCharmLifted = useCallback(
    (itemId) =>
      isItemHiddenForFlyIn(itemId) ||
      (draggedId === itemId &&
        (Boolean(dragMeta) || Boolean(settling) || Boolean(flyInActiveItemId))),
    [draggedId, dragMeta, settling, flyInActiveItemId, isItemHiddenForFlyIn]
  );

  const renderCharmJumpRing = (jumpRing) => {
    if (!jumpRing) {
      return null;
    }

    const stroke = CHARM_GOLD_STROKE;
    const common = {
      className: "beads-2d-charm-jump-ring",
      fill: "none",
      stroke,
      strokeWidth: jumpRing.strokeWidth,
      strokeLinecap: "round",
      vectorEffect: "non-scaling-stroke",
    };

    if (jumpRing.edgeOn && (jumpRing.rx != null || jumpRing.ry != null)) {
      return (
        <ellipse
          {...common}
          cx={jumpRing.cx}
          cy={jumpRing.cy}
          rx={jumpRing.rx ?? jumpRing.r}
          ry={jumpRing.ry ?? jumpRing.r}
          className="beads-2d-charm-jump-ring beads-2d-charm-jump-ring--edge-on"
        />
      );
    }

    if (jumpRing.rx != null || jumpRing.ry != null) {
      return (
        <ellipse
          cx={jumpRing.cx}
          cy={jumpRing.cy}
          rx={jumpRing.rx ?? jumpRing.r}
          ry={jumpRing.ry ?? jumpRing.r}
          {...common}
        />
      );
    }

    return <circle cx={jumpRing.cx} cy={jumpRing.cy} r={jumpRing.r} {...common} />;
  };

  /** Front half of the bail — drawn over the charm so the two loops read as interlocked. */
  const renderCharmBailFrontArc = (arc) => {
    if (!arc) {
      return null;
    }

    return (
      <path
        className="beads-2d-charm-jump-ring beads-2d-charm-jump-ring--front"
        d={`M ${arc.x1} ${arc.y1} A ${arc.rx} ${arc.ry} 0 0 0 ${arc.x2} ${arc.y2}`}
                  fill="none"
        stroke={CHARM_GOLD_STROKE}
        strokeWidth={arc.strokeWidth}
                    strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  /** Jump ring (behind charm art) + connector — under pendant image. */
  const renderCharmLink = (item, pendant, index, { getTransitionClass: resolveTransitionClass } = {}) => {
    const transitionClass = resolveTransitionClass?.(item.id) ?? "";
    const hardwareRotation =
      pendant.hardwareRotationDeg ?? item.hardwareRotation ?? item.rotation ?? 0;
    const itemKey = getItemKey(item, index);
    const stringJumpRing = pendant.stringJumpRing;

    if (isCharmLifted(item.id) || !stringJumpRing) {
      return null;
    }

    return (
      <g
        key={`charm-link-${itemKey}`}
        className={`beads-2d-charm-chain-wrap beads-2d-ring-item ${transitionClass}`}
        transform={`translate(${item.x} ${item.y})`}
                    pointerEvents="none"
      >
        <g transform={`rotate(${hardwareRotation})`}>
          {renderCharmJumpRing(stringJumpRing)}
        </g>
      </g>
    );
  };

  const renderCharmLinkLayer = (options = {}) =>
    charmPendants.map(({ item, layout: pendant }, index) =>
      renderCharmLink(item, pendant, index, options)
    );

  const renderCharmImageOnChain = (pendant, item) => (
    <image
      href={item.asset.image}
      x={pendant.charmImage.x}
      y={pendant.charmImage.y}
      width={pendant.charmImage.width}
      height={pendant.charmImage.height}
      className="beads-2d-svg-item beads-2d-svg-item--charm"
      preserveAspectRatio="xMidYMin meet"
    />
  );

  const renderCharmDrop = (
    item,
    pendant,
    index,
    { draggable = false, getTransitionClass: resolveTransitionClass } = {}
  ) => {
    const transitionClass = resolveTransitionClass?.(item.id) ?? "";
    const hardwareRotation =
      pendant.hardwareRotationDeg ?? item.hardwareRotation ?? item.rotation ?? 0;
    const itemKey = getItemKey(item, index);

    if (isCharmLifted(item.id)) {
      return null;
    }

    const hitPoint = getCharmWorldHitPoint(item, pendant);
    const hitRadius = getRingDragHitRadius(item, { isCharm: true });

    return (
      <g
        key={`charm-drop-${itemKey}`}
        className="beads-2d-draggable-wrap beads-2d-charm-drop-wrap"
        // The drag loop swings this group about the ring centre to open room for a dragged
        // charm; the hit circle rides along so the target matches what is drawn. The origin
        // has to be set here because the preview centre is computed, not a fixed CSS value.
        style={{ transformBox: "view-box", transformOrigin: `${CENTER_X}px ${CENTER_Y}px` }}
        ref={(element) => registerCharmNeighbourEl(item.id, element)}
      >
        {draggable && (
          <circle
            cx={hitPoint.x}
            cy={hitPoint.y}
            r={hitRadius}
            className="beads-2d-drag-hit"
            onPointerDown={(event) => handleItemPointerDown(event, item)}
          />
        )}
        <g
          className={`beads-2d-charm-pendant beads-2d-ring-item beads-2d-draggable-visual ${transitionClass}`}
          transform={`translate(${item.x} ${item.y})`}
          pointerEvents="none"
        >
          <g transform={`rotate(${hardwareRotation})`}>
            <g className={getSwapClass(item.id)}>
              {renderCharmImageOnChain(pendant, item)}
              {renderCharmBailFrontArc(pendant.stringBailFrontArc)}
            </g>
          </g>
        </g>
      </g>
    );
  };

  const renderCharmDropLayer = (options = {}) =>
    charmPendants.map(({ item, layout: pendant }, index) =>
      renderCharmDrop(item, pendant, index, options)
    );

  const renderManualRingItem = (item, index, options = {}) => {
    const { isCharm = false, pendant = null } = options;
    const rotation = item.rotation ?? 0;
    const itemKey = getItemKey(item, index);
    const isLifted =
      isItemHiddenForFlyIn(item.id) ||
      (draggedId === item.id && (Boolean(dragMeta) || Boolean(settling) || Boolean(flyInActiveItemId)));
    const itemClass =
      item.type === "spacer"
        ? "beads-2d-svg-item beads-2d-svg-item--spacer"
        : isCharm
          ? "beads-2d-svg-item beads-2d-svg-item--charm"
          : "beads-2d-svg-item beads-2d-svg-item--bead";

    if (isLifted) {
      return null;
    }

    const hitRadius = getRingDragHitRadius(item, { isCharm });
    const hitX =
      isCharm && pendant ? pendant.charmImage.x + pendant.charmImage.width / 2 : item.x;
    const hitY =
      isCharm && pendant ? pendant.charmImage.y + pendant.charmImage.height / 2 : item.y;
    const transitionClass = getTransitionClass();

    return (
      <g key={itemKey} className="beads-2d-draggable-wrap">
        <circle
          cx={hitX}
          cy={hitY}
          r={hitRadius}
          className="beads-2d-drag-hit"
          onPointerDown={(event) => handleItemPointerDown(event, item)}
        />
        <g
          className={`beads-2d-ring-item beads-2d-draggable-visual ${transitionClass}`}
          transform={`translate(${item.x} ${item.y}) rotate(${rotation})`}
          pointerEvents="none"
        >
          {isCharm && pendant ? (
              <image
              href={item.asset.image}
              x={pendant.charmImage.x - item.x}
              y={pendant.charmImage.y - item.y}
              width={pendant.charmImage.width}
              height={pendant.charmImage.height}
              className={itemClass}
                preserveAspectRatio="xMidYMid meet"
            />
          ) : item.type === "bead" ? (
            <g className={getSwapClass(item.id)}>
              <BeadGemVisual
                href={item.asset.image}
                width={item.width}
                height={item.height}
                layer="face"
                lightingAngleDeg={getBeadOutwardLightingAngleDeg(
                  item.x,
                  item.y,
                  CENTER_X,
                  CENTER_Y,
                  rotation
                )}
              />
            </g>
          ) : (
            <g className={getSwapClass(item.id)}>
              <image
                href={item.asset.image}
                x={-item.width / 2}
                y={-item.height / 2}
                width={item.width}
                height={item.height}
                className={itemClass}
                preserveAspectRatio="xMidYMid slice"
              />
            </g>
          )}
        </g>
      </g>
    );
  };

  const isRingBeadLifted = (item) =>
    isItemHiddenForFlyIn(item.id) ||
    (draggedId === item.id && (Boolean(dragMeta) || Boolean(settling) || Boolean(flyInActiveItemId)));

  // Beads and spacers both sit on the string, so they cast the same outward blob — only
  // the radius differs, which the spacer's own thinner box already gives us.
  const renderRingItemShadowPass = () =>
    ringItems.map((item, index) => {
      if (isRingBeadLifted(item)) {
        return null;
      }
      const radius = Math.max(item.width, item.height) / 2;
      const shadowVisual = getBeadDropShadowVisualParams(
        item.x,
        item.y,
        CENTER_X,
        CENTER_Y
      );
      const offset = getBeadOutwardDropShadowOffset(
        item.x,
        item.y,
        CENTER_X,
        CENTER_Y,
        radius,
        shadowVisual.distanceScale
      );
      return (
        <g
          key={`ring-shadow-${getItemKey(item, index)}`}
          transform={`translate(${item.x} ${item.y})`}
          pointerEvents="none"
        >
          <BeadGemDropShadow
            radius={radius}
            offsetX={offset.x}
            offsetY={offset.y}
            angleDeg={offset.angleDeg}
            opacity={shadowVisual.opacity}
          />
        </g>
      );
    });

  // A charm hangs off the string rather than sitting on it, so its blob is centred on the
  // pendant art instead of the attachment point.
  const renderCharmShadowPass = () =>
    charmPendants.map(({ item, layout: pendant }, index) => {
      if (isCharmLifted(item.id)) {
        return null;
      }
      const center = getCharmWorldHitPoint(item, pendant);
      const radius =
        Math.max(pendant.charmImage.width, pendant.charmImage.height) / 2;
      const shadowVisual = getBeadDropShadowVisualParams(
        center.x,
        center.y,
        CENTER_X,
        CENTER_Y
      );
      const offset = getBeadOutwardDropShadowOffset(
        center.x,
        center.y,
        CENTER_X,
        CENTER_Y,
        radius,
        shadowVisual.distanceScale
      );
      return (
        <g
          key={`charm-shadow-${getItemKey(item, index)}`}
          transform={`translate(${center.x} ${center.y})`}
          pointerEvents="none"
        >
          <BeadGemDropShadow
            radius={radius}
            offsetX={offset.x}
            offsetY={offset.y}
            angleDeg={offset.angleDeg}
            opacity={shadowVisual.opacity}
          />
        </g>
      );
    });

  const renderPresetRingItems = () =>
    ringItems.map((item, index) => {
      if (isItemHiddenForFlyIn(item.id)) {
        return null;
      }

      if (item.type === "spacer") {
        return (
          <g
            key={getItemKey(item, index)}
            transform={`translate(${item.x} ${item.y}) rotate(${item.rotation ?? 0})`}
          >
            <image
                href={item.asset.image}
              x={-item.width / 2}
              y={-item.height / 2}
              width={item.width}
              height={item.height}
              className="beads-2d-svg-item beads-2d-svg-item--spacer"
              preserveAspectRatio="xMidYMid slice"
            />
          </g>
        );
      }

      return (
        <g
          key={getItemKey(item, index)}
          transform={`translate(${item.x} ${item.y}) rotate(${item.rotation ?? 0})`}
        >
          <BeadGemVisual
            href={item.asset.image}
            width={item.width}
            height={item.height}
            layer="face"
            lightingAngleDeg={getBeadOutwardLightingAngleDeg(
              item.x,
              item.y,
              CENTER_X,
              CENTER_Y,
              item.rotation ?? 0
            )}
          />
        </g>
      );
    });

  const getCharmTransitionClass = useCallback(
    (itemId) => {
      if (charmDragActive) {
        return "";
      }
      if (dragMeta || settling) {
        return draggedId === itemId ? "beads-2d-charm-hardware--preview" : "";
      }
      if (flyInActiveItemId || flyInAnimation) {
        return "";
      }
      // A shuffled charm jumps to a gap anywhere on the ring; gliding there would drag its
      // bail through the beads, so it pops in at the new gap instead.
      if (randomizeSwappedIds?.has(itemId)) {
        return "";
      }
      return getTransitionClass();
    },
    [
      charmDragActive,
      dragMeta,
      settling,
      draggedId,
      flyInActiveItemId,
      flyInAnimation,
      randomizeSwappedIds,
    ]
  );

  const renderPresetCharmDrops = () =>
    renderCharmDropLayer({
      draggable: dragEnabled && charmItems.length > 0,
      getTransitionClass: getCharmTransitionClass,
    });

  const renderManualCharmDrops = () =>
    renderCharmDropLayer({
      draggable: true,
      getTransitionClass: getCharmTransitionClass,
    });

  const draggedItem = dragMeta
    ? dragMeta.item ?? settledItems.find((item) => item.id === dragMeta.id)
    : null;
  const ghostItem = settling?.item ?? draggedItem;
  const ghostIsCharm = ghostItem?.type === "charm";

  const charmSettleProgress =
    settling && ghostIsCharm
      ? settling.progress ?? (settling.animate ? 1 : 0)
      : 0;

  const charmSettlingSvgTransform =
    settling && ghostIsCharm
      ? (() => {
          const t = easeOutCubic(charmSettleProgress);
          const x = lerp(settling.ghostX, settling.targetX, t);
          const y = lerp(settling.ghostY, settling.targetY, t);
          const rotation =
            settling.ghostRotation +
            normalizeAngleDelta(settling.targetRotation - settling.ghostRotation) * t;
          const repositionDist = Math.hypot(
            settling.targetX - settling.ghostX,
            settling.targetY - settling.ghostY
          );
          const scaleStart = repositionDist < 3 ? 1 : 1.04;
          const scale = settling.isRemoveZone
            ? lerp(1.08, 0.82, t)
            : lerp(scaleStart, 1, t);
          return `translate(${x} ${y}) rotate(${rotation}) scale(${scale})`;
        })()
      : null;

  /**
   * A strung ghost carries its rotation on the inner face group, where the drag loop writes it
   * each frame and where the shadow and shine stay outside it and so keep facing the light.
   * The settle has to write to the same place: putting it on the wrapper as well turned the
   * item twice, which is the spin you see as a dropped bead lands.
   */
  const beadGhostFaceRotation =
    settling && !ghostIsCharm
      ? settling.animate
        ? settling.targetRotation
        : settling.ghostRotation
      : ghostItem?.rotation ?? 0;

  const beadSettlingSvgTransform =
    settling && !ghostIsCharm
      ? (() => {
          const x = settling.animate ? settling.targetX : settling.ghostX;
          const y = settling.animate ? settling.targetY : settling.ghostY;
          const scale =
            settling.animate && settling.isRemoveZone ? 0.82 : settling.animate ? 1 : 1.08;
          return `translate(${x} ${y}) scale(${scale})`;
        })()
      : null;

  const dragCharmParts =
    dragMeta?.charmGhostParts && ghostItem && ghostIsCharm ? dragMeta.charmGhostParts : null;

  const settlingCharmParts =
    settling && ghostIsCharm
      ? (() => {
          const t = easeOutCubic(charmSettleProgress);
          const x = lerp(settling.ghostX, settling.targetX, t);
          const y = lerp(settling.ghostY, settling.targetY, t);
          const rotation =
            settling.ghostRotation +
            normalizeAngleDelta(settling.targetRotation - settling.ghostRotation) * t;
          return getCharmGhostParts(
            {
              ...ghostItem,
              x,
              y,
              hardwareRotation: rotation,
              rotation,
            },
            x,
            y
          );
        })()
      : null;

  const charmGhostParts = settlingCharmParts ?? dragCharmParts;

  const quantity = isManualMode ? manualItems.length : pattern.filter((entry) => entry.type !== "charm").length;

  return (
    <div
      className={`beads-2d-preview ${isManualMode ? "is-manual" : ""} ${dragEnabled ? "is-draggable" : ""} ${dragMeta ? "is-ring-dragging" : ""} ${charmDragActive ? "is-charm-dragging" : ""} ${isRemoveZone ? "is-remove-zone" : ""} ${charmGapAdjusted ? "is-charm-gap-adjusted" : ""} ${settling ? "is-settling" : ""} ${flyInActiveItemId || flyInAnimation ? "is-fly-in" : ""} ${isRingSpinning ? "is-ring-spinning" : ""} ${spinPreviewEnabled ? "is-ring-spinnable" : ""} ${isPreviewPinching ? "is-preview-pinching" : ""} ${previewZoom.scale > 1.01 ? "is-preview-zoomed" : ""}`}
      aria-label="Bead bracelet preview"
      onClick={(event) => {
        if (suppressClickRef.current || dragMeta || settling) {
          event.stopPropagation();
        }
      }}
      onPointerDown={(event) => {
        if (event.target.closest(".beads-2d-drag-hit")) {
          event.stopPropagation();
        }
      }}
    >
      <div
        ref={stageWrapRef}
        className={`beads-2d-stage-wrap${isRingSpinning ? " is-spinning" : ""}${isPreviewPinching ? " is-pinching" : ""}${previewZoom.scale > 1.01 ? " is-zoomed" : ""}`}
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
        onPointerCancel={handleStagePointerUp}
      >
        <div
          className="beads-2d-stage-zoom"
          style={{
            transform: `translate3d(${previewZoom.x}px, ${previewZoom.y}px, 0) scale(${previewZoom.scale})`,
          }}
        >
        <svg
          ref={svgRef}
          className="beads-2d-stage"
          viewBox={`0 0 ${PREVIEW_VIEW_SIZE} ${PREVIEW_VIEW_SIZE}`}
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Bead bracelet string preview"
        >
          <defs>
            <linearGradient id="beads-charm-gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F6E27A" />
              <stop offset="45%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#A67C00" />
            </linearGradient>
            <BeadGemDefs />
          </defs>

          <g
            className="beads-2d-ring-layer"
            transform={`rotate(${ringViewRotation} ${CENTER_X} ${CENTER_Y})`}
          >
            <circle
              className={`beads-2d-string${isFreeSizeLayout ? " beads-2d-string--free-size" : ""}`}
              cx={CENTER_X}
              cy={CENTER_Y}
              r={visualStringRadius}
              fill="none"
              stroke="#2a2a2a"
              strokeWidth={PREVIEW_STRING_STROKE_WIDTH}
              strokeLinecap="round"
              pointerEvents="none"
            />

            <g className="beads-2d-bead-shadows-layer" pointerEvents="none">
              {renderRingItemShadowPass()}
              {renderCharmShadowPass()}
            </g>

            {useManualRingRendering
              ? ringItems.map((item, index) => renderManualRingItem(item, index))
              : renderPresetRingItems()}

            {renderCharmLinkLayer({ getTransitionClass: getCharmTransitionClass })}

            {useManualRingRendering ? renderManualCharmDrops() : renderPresetCharmDrops()}

            {/*
              One marker for the whole drag, moved by the drag loop rather than re-rendered
              per gap, so it glides round the string instead of blinking between slots.
            */}
            {charmDragActive && (
              <g
                ref={dropMarkerRef}
                className="beads-2d-charm-drop-marker"
                pointerEvents="none"
                style={{ opacity: 0 }}
              >
                <circle className="beads-2d-charm-drop-slot" cx={0} cy={0} r={10} />
                <circle
                  className={`beads-2d-charm-gap-marker is-active${charmGapAdjusted ? " is-adjusted" : ""}`}
                  cx={0}
                  cy={0}
                  r={5.5}
                />
              </g>
            )}

            {ghostItem && !ghostIsCharm && (dragMeta || settling) && (
            <g
              ref={ghostWrapRef}
              className={`beads-2d-ring-item ${settling ? "beads-2d-ring-item--settling-ghost" : "beads-2d-ring-item--dragging"}`}
              transform={settling ? beadSettlingSvgTransform : undefined}
              style={
                settling && settling.isRemoveZone && settling.animate ? { opacity: 0 } : undefined
              }
              pointerEvents="none"
            >
              {ghostItem.type === "bead" ? (
                <BeadGemPortableStack
                  href={ghostItem.asset.image}
                  width={ghostItem.width}
                  height={ghostItem.height}
                  rotation={beadGhostFaceRotation}
                  shadowGroupRef={ghostShadowRef}
                  faceScaleRef={ghostFaceScaleRef}
                  faceGroupRef={ghostFaceRef}
                  shineWrapRef={ghostShineRef}
                />
              ) : (
                <g
                  ref={ghostFaceRef}
                  className="beads-2d-ghost-bead-face"
                  transform={`rotate(${beadGhostFaceRotation})`}
                >
                  <image
                    href={ghostItem.asset.image}
                    x={-ghostItem.width / 2}
                    y={-ghostItem.height / 2}
                    width={ghostItem.width}
                    height={ghostItem.height}
                    className="beads-2d-svg-item beads-2d-svg-item--spacer"
                    preserveAspectRatio="xMidYMid slice"
                  />
                </g>
              )}
            </g>
            )}

            {ghostItem && ghostIsCharm && (dragMeta || settling) && charmGhostParts && (
            <g
              ref={ghostCharmRef}
              className="beads-2d-ring-item beads-2d-charm-ghost beads-2d-ring-item--dragging"
              {...(settling && charmSettlingSvgTransform
                ? { transform: charmSettlingSvgTransform }
                : {})}
              style={
                settling && ghostIsCharm && settling.isRemoveZone
                  ? { opacity: String(lerp(1, 0, easeOutCubic(charmSettleProgress))) }
                  : undefined
              }
              pointerEvents="none"
            >
              {renderCharmJumpRing(charmGhostParts.stringJumpRing)}
              {charmGhostParts.image && (
                <image
                  href={ghostItem.asset.image}
                  x={charmGhostParts.image.x}
                  y={charmGhostParts.image.y}
                  width={charmGhostParts.image.width}
                  height={charmGhostParts.image.height}
                  className="beads-2d-svg-item beads-2d-svg-item--charm"
                  preserveAspectRatio="xMidYMin meet"
                />
              )}
              {renderCharmBailFrontArc(charmGhostParts.stringBailFrontArc)}
            </g>
            )}
          </g>
        </svg>

        {(isManualMode || hasPresetRingSlots || charmDragActive) && (
          <div
            className={`beads-2d-remove-indicator${isRemoveZone ? " is-visible" : ""}`}
            aria-live="polite"
          >
            <span className="beads-2d-remove-indicator__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </span>
            Remove
          </div>
        )}
        </div>
      </div>

      <div className="beads-2d-stats" aria-live="polite">
        <div className="beads-2d-stat">
          <span>Quantity</span>
          <strong>{String(quantity)}</strong>
        </div>
        <div className="beads-2d-stat beads-2d-stat--length">
          <span>Length</span>
          <strong>{displayLengthLabel}</strong>
        </div>
    </div>

      {activeFlyInGhost &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            key={flyInAnimation?.sessionKey ?? `${flyInGeneration}-${activeFlyInGhost.itemId}`}
            ref={handleFlyGhostRef}
            className={`beads-fly-in-ghost beads-fly-in-ghost--${activeFlyInGhost.type}${
              activeFlyInGhost.type === "bead"
                ? " beads-fly-in-ghost--bead-gem"
                : activeFlyInGhost.type === "charm"
                  ? " beads-fly-in-ghost--charm-gem"
                  : ""
            }`}
            style={{
              width: Math.max(
                8,
                svgLengthToScreen(svgRef.current, activeFlyInGhost.width)
              ),
              height: Math.max(
                8,
                svgLengthToScreen(svgRef.current, activeFlyInGhost.height)
              ),
            }}
            aria-hidden="true"
          >
            {activeFlyInGhost.type === "bead" ? (
              <BeadsFlyInBeadGhost
                ghost={activeFlyInGhost}
                shadowGroupRef={flyGhostShadowRef}
                faceScaleRef={flyGhostFaceScaleRef}
                faceGroupRef={flyGhostFaceRef}
                shineWrapRef={flyGhostShineRef}
              />
            ) : activeFlyInGhost.type === "charm" && flyInCharmTargetItem ? (
              <BeadsFlyInCharmGhost targetItem={flyInCharmTargetItem} />
            ) : (
              <img src={activeFlyInGhost.asset.image} alt="" draggable={false} />
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
