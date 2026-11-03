"use client";

import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Environment, OrbitControls, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";

import {
  GEM_REFRACTION_PARAMS,
  loadGemEnvTexture,
  useGemEnvTexture,
} from "../../necklace-configurator/shared/gemMaterial";
import {
  JEWELRY_ENV_INTENSITY,
  RING_METAL,
  RING_METAL_COLORS,
  RING_METAL_ENV_URL,
  toRingMetalColor,
} from "../../necklace-configurator/shared/metalMaterial";
import { RGBELoader } from "three-stdlib";
import {
  getSpacerDiamondVariant,
  getSpacerMetalFinish,
  isDiamondSpacerSku,
  isStoneWheelSpacerSku,
  resolvePatternAsset,
  isHexSpacer3DModel,
  isColoredCrystalSpacerSku,
  isHexSpacerSku,
  isPlainWheel3DModel,
  isGlassWheelSpacerModel,
  isScene81MetalSpacerSku,
  resolveSpacer3DModelUrl,
  isSvgBeadAsset,
} from "../assets";
import { resolveBeadsCharmExtrudeDepth, useThickCharmAssets } from "../thickImageCharm";
import { useBeedsContext } from "../contexts/BeedsContext";
import { usePreviewFocusRingRotation } from "../usePreviewFocusRingRotation";
import { usePreviewFocusSpacerZoom } from "../usePreviewFocusSpacerZoom";
import { PREVIEW_FOCUS_FRONT_ANGLE_DEG_3D } from "../previewFocus";
import {
  BEADS_3D_CAMERA_FOV,
  BEADS_3D_ORBIT_ZOOM_SPEED,
  BEADS_3D_RING_TILT_X,
  getBeads3DCameraPosition,
  getBeads3DOrbitLimits,
} from "../beadsPreview3DCamera";
import {
  buildPositionedRingItems,
  CHARM_BAIL_HOOK_DROP_RATIO,
  getCharmPendantLayout,
  getPreviewCenter,
} from "../beadRingLayout";

const { x: CENTER_X, y: CENTER_Y } = getPreviewCenter();
const WORLD_PER_PX = 0.0105;
const BEAD_DIAMETER_SCALE = 0.93;
const SPACER_DIAMETER_SCALE = 0.44;
const GLASS_BEAD_GLB = "/bc-assets/bead_models/glass-bead.glb";
const SPACER_RING_LIFT_Y = 0.0012;
const STRING_Y_OFFSET = -0.0005;
/** S1–S3 / generic white pavé base (avoid pure #fff — reads flat). */
const SPACER_DIAMOND_COLOR = "#e8eef6";
const SPACER_FALLBACK_METAL = RING_METAL_COLORS.yellow;
const SPACER_3D_SIZE_BOOST = 1.45;
const SPACER_3D_VISUAL_SCALE = 1;
/** Fallback until metal3.hdr loads (ring-matched env on spacer bands). */
const SPACER_METAL_ENV_INTENSITY = 1.42;
const SPACER_METAL_TEX_ENV_INTENSITY = 1.58;
/** Same HDR as ring — spacers are small so a touch above necklace JEWELRY_ENV_INTENSITY. */
const SPACER_RING_METAL_ENV_INTENSITY = JEWELRY_ENV_INTENSITY * 1.18;
const SPACER_RING_METAL_TEX_ENV_INTENSITY = JEWELRY_ENV_INTENSITY * 1.22;
/** Global gem env lift (S10+ etc.). S1–S6 use STONE_WHEEL_* — do not stack both. */
const SPACER_GEM_ENV_BOOST = 1.1;
/** Stretch wheel along the string so it meets bead spheres (GLB depth < diameter). */
const SPACER_TANGENT_STRETCH = 1.48;
/** S7–S9 scene.glb — slimmer band; keep cord trim in sync via helpers below. */
const SCENE81_TANGENT_STRETCH = SPACER_TANGENT_STRETCH * 0.9;
const SCENE81_PROFILE_SCALE = 0.82;
/** S7–S9 GLB thickness vs layout slot — slight downscale so band sits in the crevice. */
const SCENE81_3D_TARGET_SCALE = 0.94;
/** S10–S14 glass-wheel-spacer.glb — slimmer along the string so the wheel stays in the gap. */
const GLASS_WHEEL_3D_TARGET_SCALE = 0.9;
const GLASS_WHEEL_TANGENT_STRETCH = 1.12;
const GLASS_WHEEL_PROFILE_SCALE = 0.9;
/** S10–S14 glass wheel — tame HDR/specular so facets stay colored, not milky white. */
const GLASS_WHEEL_LIGHT_SCALE = 0.68;
const GLASS_WHEEL_ENV_INTENSITY = 1.42;
/** Hint of ice-white in the crystal body (kept small so color still reads). */
const GLASS_WHEEL_WHITE_MIX = 0.07;
const _glassWheelTintScratch = new THREE.Color();
const _glassWheelWhiteScratch = new THREE.Color("#eef2f7");

function glassWheelTintedColor(hex, whiteMix = GLASS_WHEEL_WHITE_MIX) {
  return _glassWheelTintScratch.set(hex).lerp(_glassWheelWhiteScratch, whiteMix);
}

function resolveSpacerAssetKey(item) {
  return item?.assetKey ?? item?.asset?.key ?? null;
}

function isGlassWheelSpacerItem(item) {
  return item?.type === "spacer" && isColoredCrystalSpacerSku(resolveSpacerAssetKey(item));
}

/** Style 2 ring: bead → bead → spacer (matches beadRingLayout). */
function isStyle2RingItems(ringItems) {
  const count = ringItems.length;
  if (count < 3 || count % 3 !== 0) {
    return false;
  }
  for (let index = 0; index < count; index += 3) {
    if (
      ringItems[index]?.type !== "bead" ||
      ringItems[index + 1]?.type !== "bead" ||
      ringItems[index + 2]?.type !== "spacer"
    ) {
      return false;
    }
  }
  return true;
}

function spacerUsesScene81Band(itemOrKey) {
  return isScene81MetalSpacerSku(
    typeof itemOrKey === "string" ? itemOrKey : resolveSpacerAssetKey(itemOrKey)
  );
}

function getSpacerTangentStretchForItem(item) {
  return spacerUsesScene81Band(item) ? SCENE81_TANGENT_STRETCH : SPACER_TANGENT_STRETCH;
}

function getSpacerRingScaleForAssetKey(assetKey) {
  if (spacerUsesScene81Band(assetKey)) {
    return [SCENE81_TANGENT_STRETCH, SCENE81_PROFILE_SCALE, SCENE81_PROFILE_SCALE];
  }
  if (isColoredCrystalSpacerSku(assetKey)) {
    return [GLASS_WHEEL_TANGENT_STRETCH, GLASS_WHEEL_PROFILE_SCALE, GLASS_WHEEL_PROFILE_SCALE];
  }
  return [SPACER_TANGENT_STRETCH, 1, 1];
}
/** Pull ring items inward — same arc, shorter chord between neighbors (3D only). */
const RING_3D_POSITION_SNUG = 0.952;
/** Extra arc (rad) opened on each bead–bead edge (split ±½ per bead) — 3D only. */
const BEAD_3D_BEAD_GAP_ANGLE_RAD = 0.05;
/** Style 2 (B–B–S): light bead–spacer separation along the string (3D only). */
const STYLE2_BEAD_SPACER_3D_GAP_PULL = 0.028;
/** Style 2 only: open the two beads inside each B–B–S triplet (not spacer gaps). */
const STYLE2_BEAD_PAIR_GAP_ANGLE_RAD = 0.036;
/** Slightly smaller glass mesh than layout art so shells clear neighbours on the string. */
const BEAD_3D_GLASS_VISUAL_SCALE = 0.88;
/** Match 2D `BEAD_ART_FILL_RATIO` for string endpoints. */
const BEAD_LAYOUT_CONTACT_RATIO = 0.76;
/** Extend spacer bore tubes slightly so cord meets the wheel mesh in bead–spacer gaps. */
const STRING_MESH_OVERLAP = 1.32;
/** Beads: trim gap arcs at the glass shell when using partial gap-only cord layouts. */
const BEAD_STRING_SHELL_TRIM = 1;
/** Extra angular padding so the cord stops outside the glass (a cord inside the bead reads pale). */
const BEAD_CORD_ARC_ANGLE_PAD = 0.04;
/** 2D ring string uses `PREVIEW_STRING_STROKE_WIDTH` = 1 in layout px (`BeadsPreview2D`). */
const PREVIEW_STRING_STROKE_WIDTH_PX = 1;
/** Tube radius in world units from 2D stroke (× boost so 360 reads like the flat preview). */
const CORD_TUBE_2D_MATCH_BOOST = 1.55;

function getBraceletCordTubeRadius(avgRingDist) {
  const from2d = (PREVIEW_STRING_STROKE_WIDTH_PX * 0.5) * WORLD_PER_PX * CORD_TUBE_2D_MATCH_BOOST;
  const proportional = avgRingDist * 0.004;
  return Math.max(from2d, proportional, 0.0038);
}
const _nudgeScratch = new THREE.Vector3();
const _elasticAxisScratch = new THREE.Vector3();
const _elasticQuatScratch = new THREE.Quaternion();
/** stone-wheel-1: bore local +Z → string +X (after ring tangent quat). */
const SPACER_STONE_WHEEL_LOCAL_QUAT = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(0, Math.PI / 2, 0)
);
/** plain-wheel-1 / glass-wheel-spacer: bore local +Y → string +X (thin axis Y). */
const PLAIN_WHEEL_ON_STRING_QUAT = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(0, 0, -Math.PI / 2)
);
const _spacerLocalQuatScratch = new THREE.Quaternion();

function getSpacerModelLocalQuaternion(modelUrl, assetKey = null) {
  if (isPlainWheel3DModel(modelUrl) || isScene81MetalSpacerSku(assetKey)) {
    return _spacerLocalQuatScratch.copy(PLAIN_WHEEL_ON_STRING_QUAT);
  }
  return _spacerLocalQuatScratch.copy(SPACER_STONE_WHEEL_LOCAL_QUAT);
}
const _spacerTangent = new THREE.Vector3();
const _spacerRadial = new THREE.Vector3();
const _spacerUp = new THREE.Vector3(0, 1, 0);
const _spacerBitangent = new THREE.Vector3();
const _spacerBasis = new THREE.Matrix4();

/** Same tangent as `SpacerBoreTube` / ring arcs: atan2(x,z) → (cos θ, 0, −sin θ). */
function getRingStringTangent(worldX, worldZ) {
  const angle = Math.atan2(worldX, worldZ);
  return _spacerTangent.set(Math.cos(angle), 0, -Math.sin(angle)).normalize();
}

/**
 * String tangent at a ring slot: bore along local +X, outward in the XZ plane (+Z).
 * Shared by spacers and glass beads (same rule as 2D `getStrungItemRotationDegrees`).
 */
function getItemOnStringQuaternion(worldX, worldZ) {
  const tangent = getRingStringTangent(worldX, worldZ);
  _spacerRadial.set(worldX, 0, worldZ);
  if (_spacerRadial.lengthSq() < 1e-10) {
    _spacerRadial.set(0, 0, 1);
  } else {
    _spacerRadial.normalize();
  }
  _spacerBitangent.crossVectors(tangent, _spacerUp).normalize();
  _spacerBasis.makeBasis(tangent, _spacerUp, _spacerBitangent);
  return new THREE.Quaternion().setFromRotationMatrix(_spacerBasis);
}

/** 2D charm `hardwareRotation` (tangentDeg): hole along local +X, same as `rotate(hardwareRotation)` in SVG. */
function getCharmHardwareQuaternion(hardwareDeg) {
  const rad = THREE.MathUtils.degToRad(hardwareDeg);
  _spacerTangent.set(Math.cos(rad), 0, -Math.sin(rad)).normalize();
  _spacerBitangent.crossVectors(_spacerTangent, _spacerUp).normalize();
  _spacerBasis.makeBasis(_spacerTangent, _spacerUp, _spacerBitangent);
  return new THREE.Quaternion().setFromRotationMatrix(_spacerBasis);
}
/**
 * glass-bead.glb bore is local +Y (2D bead art). Parent puts string on +X — −90° Z aligns hole with thread.
 */
const GLASS_BEAD_BORE_ROTATION = [0, 0, -Math.PI / 2];
const GLASS_BEAD_SHELL_SCALE = 0.98;
/** WebP hole is vertical in file (+Y). −90° Z maps that hole onto the overlay's local +X. */
const BEAD_ART_OVERLAY_Z_ROTATION = -Math.PI / 2;
const _artWorldPos = new THREE.Vector3();
const _artTangent = new THREE.Vector3();
const _artCamRight = new THREE.Vector3();
const _artCamUp = new THREE.Vector3();
/** Cord vs bead jewelry — separate layers; WebP/glass materials stay independent. */
const RENDER_ORDER_BRACELET_CORD = 1;
/** Back-to-front painter order for ring + charms (updated from camera depth each frame). */
const RENDER_ORDER_RING_BASE = 10;
const RENDER_ORDER_RING_STRIDE = 8;
const RENDER_ORDER_BEAD_GLASS_SHELL = 5;
const RENDER_ORDER_BEAD_ART_OVERLAY = 7;
const _depthEuler = new THREE.Euler();
const _depthScratch = new THREE.Vector3();
/** One loop — matches the string tone seen through the glass shell (avoids black vs pale mismatch). */
const BRACELET_CORD_MAT = new THREE.MeshBasicMaterial({
  color: "#8a8194",
  toneMapped: true,
  depthWrite: false,
  depthTest: true,
});

const CHARM_BAIL_GOLD = "#f6c45e";

const CHARM_BAIL_GOLD_MAT = new THREE.MeshStandardMaterial({
  color: CHARM_BAIL_GOLD,
  metalness: 0.72,
  roughness: 0.28,
  toneMapped: false,
});
/** 3D-only: slightly larger bail; hook Y uses same drop ratio as 2D layout. */
const CHARM_BAIL_3D_SIZE_BOOST = 1.36;
/** Charm swings outward about the cord: 60° to the bracelet plane instead of hanging straight down (90°). */
const CHARM_ANGLE_TO_BRACELET_DEG = 60;
const CHARM_OUTWARD_TILT_RAD = THREE.MathUtils.degToRad(90 - CHARM_ANGLE_TO_BRACELET_DEG);
const _charmTiltAxis = new THREE.Vector3(1, 0, 0);
const _charmOutwardScratch = new THREE.Vector3();
const _charmInverseQuatScratch = new THREE.Quaternion();
const CHARM_BAIL_ANCHOR_RATIO = 0.085;

/** Avoid near-plane slicing when charms / glass rotate edge-on to the camera. */
function PreviewRenderSettings() {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);

  useLayoutEffect(() => {
    camera.near = 0.2;
    camera.far = 80;
    camera.updateProjectionMatrix();
    gl.sortObjects = true;
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    loadGemEnvTexture().catch(() => {});
    loadSpacerMetalEnvTexture().catch(() => {});
  }, [camera, gl]);

  return null;
}

useGLTF.preload(GLASS_BEAD_GLB);

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
      return {
        ...positioned,
        asset: entry.asset ?? positioned.asset,
        assetKey: entry.assetKey ?? positioned.assetKey,
        sizeId: entry.sizeId ?? positioned.sizeId,
        patternIndex: index,
      };
    })
    .filter(Boolean);
}

function resolveRingItemImageUrl(item, selectedBead, selectedSeparator) {
  if (item.asset?.image) {
    return item.asset.image;
  }
  if (item.assetKey) {
    return resolvePatternAsset(item.type, item.assetKey)?.image ?? null;
  }
  if (item.type === "spacer") {
    return selectedSeparator?.image ?? null;
  }
  if (item.type === "bead") {
    return selectedBead?.image ?? null;
  }
  return null;
}

function computeSettledLayout({
  pattern,
  isManualMode,
  layoutRingRadius,
  sizeId,
  isStringFull,
  isFreeSizeLayout,
  hasPresetRingSlots,
  presetHasCharmLayout,
}) {
  const ringRadiusHint = layoutRingRadius;
  if (isManualMode) {
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
      useFreeSizeGrowingRing: isFreeSizeLayout,
      manualStringFull: isStringFull,
      usePresetFixedRing: false,
    });
  }
  if (hasPresetRingSlots || presetHasCharmLayout) {
    return buildPositionedRingItems({
      pattern,
      slotCount: pattern.length,
      defaultSizeId: sizeId,
      centerX: CENTER_X,
      centerY: CENTER_Y,
      ringRadiusHint: layoutRingRadius,
      isPartialCluster: false,
      useVariableDiameters: true,
      useManualEvenRingLayout: true,
      useFreeSizeGrowingRing: false,
      manualStringFull: true,
      usePresetFixedRing: true,
    });
  }
  return buildPositionedRingItems({
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
}

function useBeadsSettledLayout() {
  const { pattern, isManualMode, layoutRingRadius, isStringFull, sizeId, isFreeSizeLayout, presetSlotItems } =
    useBeedsContext();

  const hasPresetRingSlots = !isManualMode && presetSlotItems.length > 0;
  const presetHasCharmLayout = !isManualMode && pattern.some((entry) => entry.type === "charm");

  return useMemo(() => {
    const layout = computeSettledLayout({
      pattern,
      isManualMode,
      layoutRingRadius,
      sizeId,
      isStringFull,
      isFreeSizeLayout,
      hasPresetRingSlots,
      presetHasCharmLayout,
    });
    const usePatternMap = isManualMode || presetHasCharmLayout || hasPresetRingSlots;
    const items = usePatternMap
      ? layoutItemsByPattern(pattern, layout.items)
      : layout.items;
    const stringRadiusPx = layout.ringRadius ?? layoutRingRadius;
    return { items, stringRadiusPx, isStringFull };
  }, [
    pattern,
    isManualMode,
    layoutRingRadius,
    sizeId,
    isStringFull,
    isFreeSizeLayout,
    hasPresetRingSlots,
    presetHasCharmLayout,
  ]);
}

function snugRingPosition(worldX, worldZ) {
  return [worldX * RING_3D_POSITION_SNUG, worldZ * RING_3D_POSITION_SNUG];
}

function getSpacer3DTargetSize(width, assetKey = null) {
  const boost = SPACER_3D_SIZE_BOOST * SPACER_3D_VISUAL_SCALE;
  if (spacerUsesScene81Band(assetKey)) {
    return width * boost * SCENE81_3D_TARGET_SCALE;
  }
  if (isColoredCrystalSpacerSku(assetKey)) {
    return width * boost * GLASS_WHEEL_3D_TARGET_SCALE;
  }
  return width * boost;
}

/** Half-extent along the string for 3D arcs (aligned with mesh scale, not 2D art box). */
function getRingStringLinearHalf(item, tr) {
  if (item.type === "spacer") {
    return (
      tr.width *
      0.5 *
      SPACER_3D_SIZE_BOOST *
      getSpacerTangentStretchForItem(item) *
      GLASS_BEAD_SHELL_SCALE *
      STRING_MESH_OVERLAP
    );
  }
  return tr.diameter * 0.5 * GLASS_BEAD_SHELL_SCALE * BEAD_STRING_SHELL_TRIM;
}

/** World-space glass shell radius — same as `GlassBeadMesh` scale × prototype radius. */
function getGlassBeadEffectiveWorldShellRadius(diameter, maxDim) {
  const safeMaxDim = maxDim > 0 ? maxDim : 1;
  return (diameter / safeMaxDim) * GLASS_BEAD_SHELL_SCALE * (safeMaxDim * 0.5);
}

function getBeadCordArcHalfAngle(diameter, ringDist, maxDim, { anglePad = BEAD_CORD_ARC_ANGLE_PAD } = {}) {
  const effectiveWorldRadius = getGlassBeadEffectiveWorldShellRadius(diameter, maxDim);
  if (ringDist < 1e-5) {
    return effectiveWorldRadius * BEAD_STRING_SHELL_TRIM;
  }
  return Math.asin(Math.min(0.998, effectiveWorldRadius / ringDist)) + anglePad;
}

/** Arc trim at spacers: stay in gaps only — no cord drawn across the wheel face. */
function getRingStringArcTrimHalf(item, tr) {
  return (
    tr.width *
    0.5 *
    SPACER_3D_SIZE_BOOST *
    getSpacerTangentStretchForItem(item) *
    GLASS_BEAD_SHELL_SCALE *
    1.05
  );
}

function getCordArcRadius(current, next, loopRadius) {
  if (loopRadius > 0) {
    return loopRadius;
  }
  return (current.ringDist + next.ringDist) * 0.5;
}

function getCharmOccupiedRingGaps(charmItems, ringCount) {
  if (!ringCount || !charmItems?.length) {
    return null;
  }
  const gaps = new Set();
  charmItems.forEach((charm, index) => {
    const raw = Number.isFinite(charm.ringGap) ? Math.floor(charm.ringGap) : index;
    gaps.add(((raw % ringCount) + ringCount) % ringCount);
  });
  return gaps;
}

function getSnugLayoutWorldXZ(item) {
  const x = (item.x - CENTER_X) * WORLD_PER_PX;
  const z = -(item.y - CENTER_Y) * WORLD_PER_PX;
  return snugRingPosition(x, z);
}

function countBeadBeadRingEdges(ringItems) {
  const count = ringItems.length;
  let edges = 0;
  for (let i = 0; i < count; i += 1) {
    if (ringItems[i].type === "bead" && ringItems[(i + 1) % count].type === "bead") {
      edges += 1;
    }
  }
  return edges;
}

function isStyle2IntraPairBeadEdge(ringIndex, neighborIndex, ringItems) {
  if (!isStyle2RingItems(ringItems)) {
    return false;
  }
  const lo = Math.min(ringIndex, neighborIndex);
  const hi = Math.max(ringIndex, neighborIndex);
  if (hi - lo !== 1) {
    return false;
  }
  return (
    ringItems[lo]?.type === "bead" &&
    ringItems[hi]?.type === "bead" &&
    lo % 3 === 0
  );
}

/** Grow ring radius so extra bead–bead arc fits on the cord (closed loops). */
function getBead3dRingArcBoost(ringItems) {
  if (isStyle2RingItems(ringItems)) {
    const triplets = ringItems.length / 3;
    const extraAngle = triplets * STYLE2_BEAD_PAIR_GAP_ANGLE_RAD;
    if (extraAngle <= 0) {
      return 1;
    }
    return (2 * Math.PI + extraAngle) / (2 * Math.PI);
  }
  const extraAngle = countBeadBeadRingEdges(ringItems) * BEAD_3D_BEAD_GAP_ANGLE_RAD;
  if (extraAngle <= 0) {
    return 1;
  }
  return (2 * Math.PI + extraAngle) / (2 * Math.PI);
}

function scaleRingWorldPositionArcBoost(posX, posZ, ringItems) {
  const boost = getBead3dRingArcBoost(ringItems);
  if (boost === 1) {
    return [posX, posZ];
  }
  return [posX * boost, posZ * boost];
}

/**
 * Opens each bead–bead edge by ±½ gap angle (layout / 2D unchanged). Avoids cumulative
 * offset that bunches one side of a closed bracelet.
 */
function applyBead3dBeadGapSpread(posX, posZ, item, ringIndex, ringItems) {
  if (item.type !== "bead") {
    return [posX, posZ];
  }
  const count = ringItems.length;
  const prev = ringItems[(ringIndex - 1 + count) % count];
  const next = ringItems[(ringIndex + 1) % count];
  const style2 = isStyle2RingItems(ringItems);
  const gapRad = style2 ? STYLE2_BEAD_PAIR_GAP_ANGLE_RAD : BEAD_3D_BEAD_GAP_ANGLE_RAD;
  const half = gapRad * 0.5;
  let angleDelta = 0;
  const nextIndex = (ringIndex + 1) % count;
  const prevIndex = (ringIndex - 1 + count) % count;
  if (next.type === "bead" && (!style2 || isStyle2IntraPairBeadEdge(ringIndex, nextIndex, ringItems))) {
    angleDelta += half;
  }
  if (prev.type === "bead" && (!style2 || isStyle2IntraPairBeadEdge(ringIndex, prevIndex, ringItems))) {
    angleDelta -= half;
  }
  if (angleDelta === 0) {
    return [posX, posZ];
  }
  const dist = Math.hypot(posX, posZ);
  if (dist < 1e-8) {
    return [posX, posZ];
  }
  const angle = Math.atan2(posX, posZ);
  const newAngle = angle + angleDelta;
  return [Math.sin(newAngle) * dist, Math.cos(newAngle) * dist];
}

/** Hairline clearance between touching meshes on the elastic band (world units). */
const ELASTIC_BAND_3D_CONTACT_GAP = 0.0015;
/** Room left on the cord where a charm bail hangs (matches 2D charm gap ≈ 9 px). */
const ELASTIC_BAND_3D_CHARM_GAP = 9 * WORLD_PER_PX;
/** Beads + spacers needed before the 360° cord contracts into an elastic band. */
const ELASTIC_BAND_3D_MIN_RING_ITEMS = 6;

/** Half-extent along the string of a spacer GLB as it is rendered in `SpacerOnRing`. */
function getSpacerAlongStringHalfWorld(item, spacerMetrics, selectedSeparator, selectedBead) {
  const tr = ringItemToTransform(item);
  const assetKey = item.assetKey ?? item.asset?.key ?? selectedSeparator?.key ?? "s2";
  const modelUrl = resolveSpacer3DModelUrl(assetKey);
  const targetSize = getSpacer3DTargetSize(tr.width, assetKey);
  const imageUrl = resolveRingItemImageUrl(item, selectedBead, selectedSeparator);
  const isHexPicker =
    isHexSpacerSku(assetKey) && Boolean(imageUrl) && !isDiamondSpacerSku(assetKey);
  if (isHexPicker) {
    return targetSize * GLASS_BEAD_SHELL_SCALE * 0.5;
  }
  const metric = spacerMetrics?.get(modelUrl);
  if (!metric) {
    return targetSize * GLASS_BEAD_SHELL_SCALE * 0.25;
  }
  const localQuat = getSpacerModelLocalQuaternion(modelUrl, assetKey);
  _elasticAxisScratch.set(1, 0, 0).applyQuaternion(_elasticQuatScratch.copy(localQuat).invert());
  const localHalf =
    (Math.abs(_elasticAxisScratch.x) * metric.size.x +
      Math.abs(_elasticAxisScratch.y) * metric.size.y +
      Math.abs(_elasticAxisScratch.z) * metric.size.z) *
    0.5;
  const ringScaleAlong = getSpacerRingScaleForAssetKey(assetKey)[0];
  return localHalf * (targetSize / metric.maxDim) * GLASS_BEAD_SHELL_SCALE * ringScaleAlong;
}

function getElasticItemHalfWorld(item, spacerMetrics, selectedSeparator, selectedBead) {
  if (item.type === "spacer") {
    return getSpacerAlongStringHalfWorld(item, spacerMetrics, selectedSeparator, selectedBead);
  }
  const { diameter } = ringItemToTransform(item);
  return diameter * GLASS_BEAD_SHELL_SCALE * BEAD_3D_GLASS_VISUAL_SCALE * 0.5;
}

/**
 * 360° elastic band: places every ring item so neighbours touch along the cord, then solves
 * the loop radius where the chord angles close exactly one full turn. Style-agnostic; the 2D
 * layout only supplies item order, the start angle and the winding direction.
 */
function computeElasticBand3dLayout({
  ringItems,
  charmItems,
  spacerMetrics,
  selectedSeparator,
  selectedBead,
}) {
  const count = ringItems.length;
  if (!count) {
    return null;
  }
  const halves = ringItems.map((item) =>
    getElasticItemHalfWorld(item, spacerMetrics, selectedSeparator, selectedBead)
  );
  const charmGaps = getCharmOccupiedRingGaps(charmItems, count);
  const chords = halves.map((half, index) => {
    const nextHalf = halves[(index + 1) % count];
    const charmExtra = charmGaps?.has(index) ? ELASTIC_BAND_3D_CHARM_GAP : 0;
    return half + nextHalf + ELASTIC_BAND_3D_CONTACT_GAP + charmExtra;
  });

  const first = ringItemToTransform(ringItems[0]);
  const startAngle = Math.atan2(first.x, first.z);
  let direction = 1;
  if (count > 1) {
    const second = ringItemToTransform(ringItems[1]);
    const delta = Math.atan2(second.x, second.z) - startAngle;
    direction = Math.atan2(Math.sin(delta), Math.cos(delta)) < 0 ? -1 : 1;
  }

  const stepAngleAt = (chord, radius) => 2 * Math.asin(Math.min(1, chord / (2 * radius)));
  const totalAngleAt = (radius) => chords.reduce((sum, chord) => sum + stepAngleAt(chord, radius), 0);
  const minRadius = Math.max(Math.max(...chords) / 2, 1e-4);
  let radius = minRadius;
  let stepAngles;
  if (totalAngleAt(minRadius) <= 2 * Math.PI) {
    // Too few items to close a loop by contact (1–2 pieces): spread them evenly on the smallest ring.
    const total = totalAngleAt(minRadius);
    stepAngles = chords.map((chord) => (stepAngleAt(chord, minRadius) * 2 * Math.PI) / total);
  } else {
    let lo = minRadius;
    let hi = Math.max(minRadius * 2, chords.reduce((sum, chord) => sum + chord, 0));
    for (let iteration = 0; iteration < 60; iteration += 1) {
      const mid = (lo + hi) * 0.5;
      if (totalAngleAt(mid) > 2 * Math.PI) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    radius = hi;
    stepAngles = chords.map((chord) => stepAngleAt(chord, radius));
  }

  const itemAngles = [];
  let angle = startAngle;
  for (let index = 0; index < count; index += 1) {
    itemAngles.push(angle);
    angle += direction * stepAngles[index];
  }
  const ringPositions = itemAngles.map((a) => [Math.sin(a) * radius, Math.cos(a) * radius]);
  const charmPositions = charmItems.map((charm, charmIndex) => {
    const raw = Number.isFinite(charm.ringGap) ? Math.floor(charm.ringGap) : charmIndex;
    const gap = ((raw % count) + count) % count;
    // Centre of the free cord between the two surfaces — not the midpoint of their centres,
    // which falls inside the larger neighbour when a bead meets a thin spacer.
    const freeCenter = halves[gap] + (chords[gap] - halves[gap] - halves[(gap + 1) % count]) * 0.5;
    const mid = itemAngles[gap] + direction * stepAngles[gap] * (freeCenter / chords[gap]);
    return [Math.sin(mid) * radius, Math.cos(mid) * radius];
  });
  return { radius, ringPositions, charmPositions };
}

/** Measured when a spacer model actually loads. The scene does not wait on unused GLBs. */
const measuredSpacerMetrics = new Map();
const spacerMetricListeners = new Set();

function rememberSpacerMetric(modelUrl, size, maxDim) {
  if (!modelUrl || measuredSpacerMetrics.has(modelUrl)) {
    return;
  }
  measuredSpacerMetrics.set(modelUrl, { size: size.clone(), maxDim });
  spacerMetricListeners.forEach((listener) => listener());
}

function useSpacerModelMetrics() {
  const [, refresh] = useState(0);
  useEffect(() => {
    const listener = () => refresh((value) => value + 1);
    spacerMetricListeners.add(listener);
    return () => {
      spacerMetricListeners.delete(listener);
    };
  }, []);
  return measuredSpacerMetrics;
}

function getRingMeshWorldXZ(item, ringIndex, ringItems, charmGaps = null) {
  if (item.elastic3dPos) {
    return item.elastic3dPos;
  }
  const { x, z } = ringItemToTransform(item);
  let [posX, posZ] = snugRingPosition(x, z);
  [posX, posZ] = applyBeadSpacerMeshNudge(posX, posZ, item, ringIndex, ringItems, charmGaps);
  [posX, posZ] = scaleRingWorldPositionArcBoost(posX, posZ, ringItems);
  return applyBead3dBeadGapSpread(posX, posZ, item, ringIndex, ringItems);
}

function nudgeTowardRingNeighbor(posX, posZ, neighbor, amount) {
  const nx = (neighbor.x - CENTER_X) * WORLD_PER_PX * RING_3D_POSITION_SNUG;
  const nz = -(neighbor.y - CENTER_Y) * WORLD_PER_PX * RING_3D_POSITION_SNUG;
  _nudgeScratch.set(nx - posX, 0, nz - posZ);
  const len = _nudgeScratch.length();
  if (len < 1e-8) {
    return [posX, posZ];
  }
  _nudgeScratch.multiplyScalar(amount / len);
  return [posX + _nudgeScratch.x, posZ + _nudgeScratch.z];
}

function applyBeadSpacerMeshNudge(posX, posZ, item, ringIndex, ringItems, charmGaps = null) {
  const count = ringItems.length;
  if (count < 2) {
    return [posX, posZ];
  }
  const prev = ringItems[(ringIndex - 1 + count) % count];
  const next = ringItems[(ringIndex + 1) % count];
  const gapBefore = (ringIndex - 1 + count) % count;
  const gapAfter = ringIndex;
  const isBeadSpacerPair = (a, b) =>
    (a?.type === "bead" && b?.type === "spacer") || (a?.type === "spacer" && b?.type === "bead");
  const isSpacerSpacerPair = (a, b) => a?.type === "spacer" && b?.type === "spacer";
  const scene81Spacer = item.type === "spacer" && spacerUsesScene81Band(item);
  const scene81Neighbor =
    item.type === "bead" &&
    (spacerUsesScene81Band(prev) || spacerUsesScene81Band(next));
  const style2Ring = isStyle2RingItems(ringItems);
  const style2GlassWheel =
    style2Ring &&
    (isGlassWheelSpacerItem(item) ||
      isGlassWheelSpacerItem(prev) ||
      isGlassWheelSpacerItem(next));
  /** S7–S9: light snug like other spacers — avoid push-apart (shows bare cord). */
  const pull = scene81Spacer
    ? 0.14
    : scene81Neighbor
      ? 0.115
      : style2GlassWheel
        ? item.type === "spacer"
          ? 0.06
          : 0.08
        : item.type === "spacer"
          ? 0.16
          : 0.12;
  const spacerSpacerPull = scene81Spacer ? 0.09 : 0.1;
  let px = posX;
  let pz = posZ;
  const step = (item.width ?? 26) * WORLD_PER_PX * pull;
  const spacerStep = (item.width ?? 26) * WORLD_PER_PX * spacerSpacerPull;
  const style2Apart =
    (item.width ?? 26) * WORLD_PER_PX * STYLE2_BEAD_SPACER_3D_GAP_PULL;
  if (isBeadSpacerPair(item, prev) && !charmGaps?.has(gapBefore)) {
    if (style2Ring) {
      [px, pz] = nudgeTowardRingNeighbor(px, pz, prev, -style2Apart);
    } else {
      [px, pz] = nudgeTowardRingNeighbor(px, pz, prev, step);
    }
  }
  if (isBeadSpacerPair(item, next) && !charmGaps?.has(gapAfter)) {
    if (style2Ring) {
      [px, pz] = nudgeTowardRingNeighbor(px, pz, next, -style2Apart);
    } else {
      [px, pz] = nudgeTowardRingNeighbor(px, pz, next, step);
    }
  }
  if (isSpacerSpacerPair(item, prev) && !charmGaps?.has(gapBefore)) {
    [px, pz] = nudgeTowardRingNeighbor(px, pz, prev, spacerStep);
  }
  if (isSpacerSpacerPair(item, next) && !charmGaps?.has(gapAfter)) {
    [px, pz] = nudgeTowardRingNeighbor(px, pz, next, spacerStep);
  }
  return [px, pz];
}

/** Same anchor as 2D `translate(item.x, item.y)` on the snugged string ring. */
function getCharmAttachWorldXZ(charmItem, ringItems = null) {
  if (charmItem.elastic3dPos) {
    return charmItem.elastic3dPos;
  }
  const attachX = (charmItem.x - CENTER_X) * WORLD_PER_PX;
  const attachZ = -(charmItem.y - CENTER_Y) * WORLD_PER_PX;
  let [posX, posZ] = snugRingPosition(attachX, attachZ);
  if (ringItems?.length) {
    [posX, posZ] = scaleRingWorldPositionArcBoost(posX, posZ, ringItems);
  }
  return [posX, posZ];
}

function ringItemToTransform(item) {
  const x = (item.x - CENTER_X) * WORLD_PER_PX;
  const z = -(item.y - CENTER_Y) * WORLD_PER_PX;
  const basePx = item.width ?? 26;
  const isSpacer = item.type === "spacer";
  const diameter =
    basePx * WORLD_PER_PX * (isSpacer ? SPACER_DIAMETER_SCALE : BEAD_DIAMETER_SCALE);
  const width = (item.width ?? basePx) * WORLD_PER_PX;
  const height = (item.height ?? item.width ?? basePx) * WORLD_PER_PX;
  return { x, z, diameter, width, height, radius: Math.hypot(x, z) };
}

function useBeadArtTexture(imageUrl) {
  const texture = useTexture(imageUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function createGlassBeadMaterial(envMap, { withArtOverlay = false } = {}) {
  // Opacity only — transmission would re-render the whole bracelet every frame.
  if (withArtOverlay) {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#ffffff"),
      roughness: 0.05,
      metalness: 0,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      envMap: envMap ?? null,
      envMapIntensity: envMap ? 0.42 : 0.25,
      clearcoat: 0.65,
      clearcoatRoughness: 0.06,
      toneMapped: false,
    });
  }
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#ffffff"),
    roughness: 0.06,
    metalness: 0,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    envMap: envMap ?? null,
    envMapIntensity: envMap ? 0.68 : 0.45,
    clearcoat: 0.78,
    clearcoatRoughness: 0.07,
    toneMapped: false,
  });
}

function getBeadArtPlaneWorldSize(diameter) {
  const shellDiameter = diameter * GLASS_BEAD_SHELL_SCALE * BEAD_3D_GLASS_VISUAL_SCALE;
  // WebP stone is ~76% of the square (2D BEAD_ART_FILL_RATIO) — scale plane so stone matches the GLB.
  return shellDiameter / BEAD_LAYOUT_CONTACT_RATIO;
}

function useGlassBeadPrototype() {
  const { scene } = useGLTF(GLASS_BEAD_GLB);
  return useMemo(() => {
    let geometry = null;
    scene.traverse((child) => {
      if (child.isMesh && !geometry) {
        geometry = child.geometry.clone();
      }
    });
    if (!geometry) {
      return { geometry: null, maxDim: 1 };
    }
    geometry.center();
    geometry.computeBoundingSphere();
    const maxDim = Math.max((geometry.boundingSphere?.radius ?? 0.5) * 2, 1e-4);
    return { geometry, maxDim };
  }, [scene]);
}

function getRingLocalViewSpaceZ(localX, localY, localZ, ringTiltX, ringYawRad, camera) {
  _depthScratch.set(localX, localY, localZ);
  _depthEuler.set(ringTiltX, ringYawRad, 0);
  _depthScratch.applyEuler(_depthEuler);
  _depthScratch.applyMatrix4(camera.matrixWorldInverse);
  return _depthScratch.z;
}

function computeBraceletDepthBases(
  ringItems,
  charmItems,
  ringTiltX,
  ringYawRad,
  camera,
  charmGaps = null
) {
  const entries = [];

  ringItems.forEach((item, ringIndex) => {
    const [posX, posZ] = getRingMeshWorldXZ(item, ringIndex, ringItems, charmGaps);
    entries.push({
      kind: "ring",
      index: ringIndex,
      viewZ: getRingLocalViewSpaceZ(posX, 0, posZ, ringTiltX, ringYawRad, camera),
    });
  });

  charmItems.forEach((item, charmIndex) => {
    const [posX, posZ] = getCharmAttachWorldXZ(item, ringItems);
    entries.push({
      kind: "charm",
      index: charmIndex,
      viewZ: getRingLocalViewSpaceZ(posX, STRING_Y_OFFSET, posZ, ringTiltX, ringYawRad, camera),
    });
  });

  entries.sort((a, b) => a.viewZ - b.viewZ);

  const ringBases = ringItems.map(() => RENDER_ORDER_RING_BASE);
  const charmBases = charmItems.map(() => RENDER_ORDER_RING_BASE);

  entries.forEach((entry, sortIndex) => {
    const base = RENDER_ORDER_RING_BASE + sortIndex * RENDER_ORDER_RING_STRIDE;
    if (entry.kind === "ring") {
      ringBases[entry.index] = base;
    } else {
      charmBases[entry.index] = base;
    }
  });

  return { ringBases, charmBases };
}

/** Marks a bead or charm so one shared pass can set painter order. */
function DepthSortApplicator({ index, kind = "ring", children }) {
  return (
    <group userData={{ depthSortIndex: index, depthSortKind: kind }}>{children}</group>
  );
}

function BeadMeshShell({ prototype, diameter, material }) {
  const scale =
    (diameter / prototype.maxDim) * GLASS_BEAD_SHELL_SCALE * BEAD_3D_GLASS_VISUAL_SCALE;

  if (!prototype.geometry) {
    return null;
  }

  return (
    <mesh
      geometry={prototype.geometry}
      scale={scale}
      rotation={GLASS_BEAD_BORE_ROTATION}
      renderOrder={RENDER_ORDER_RING_BASE + RENDER_ORDER_BEAD_GLASS_SHELL}
      userData={{ depthLayerOffset: RENDER_ORDER_BEAD_GLASS_SHELL }}
      material={material}
    />
  );
}

const glassBeadMaterialCache = new Map();

function getSharedGlassBeadMaterial(envMap, withArtOverlay) {
  const key = `${withArtOverlay ? "art" : "plain"}:${envMap?.uuid ?? "none"}`;
  let material = glassBeadMaterialCache.get(key);
  if (!material) {
    material = createGlassBeadMaterial(envMap, { withArtOverlay });
    glassBeadMaterialCache.set(key, material);
  }
  return material;
}

function GlassBeadMesh({ prototype, diameter, withArtOverlay = false }) {
  const gemEnv = useGemEnvTexture();
  const material = getSharedGlassBeadMaterial(gemEnv, withArtOverlay);
  return <BeadMeshShell prototype={prototype} diameter={diameter} material={material} />;
}

/**
 * Roll so the catalog hole (overlay local +X) stays on the string tangent.
 * The photo still faces the camera; only its in-plane angle follows the cord.
 */
function BeadArtTangentRoll({ children }) {
  const rollRef = useRef(null);

  useFrame(({ camera }) => {
    const roll = rollRef.current;
    if (!roll) {
      return;
    }
    roll.getWorldPosition(_artWorldPos);
    if (_artWorldPos.x * _artWorldPos.x + _artWorldPos.z * _artWorldPos.z < 1e-8) {
      return;
    }
    const angle = Math.atan2(_artWorldPos.x, _artWorldPos.z);
    _artTangent.set(Math.cos(angle), 0, -Math.sin(angle));
    _artCamRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
    _artCamUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
    const tx = _artTangent.dot(_artCamRight);
    const ty = _artTangent.dot(_artCamUp);
    if (tx * tx + ty * ty < 1e-8) {
      return;
    }
    roll.rotation.z = Math.atan2(ty, tx);
  });

  return <group ref={rollRef}>{children}</group>;
}

/**
 * Full-face catalog WebP (billboard) sized to the glass shell — reads as the whole bead, not a sliver inside glass.
 */
function BeadCatalogArtOverlay({ diameter, imageUrl }) {
  const texture = useBeadArtTexture(imageUrl);
  const size = getBeadArtPlaneWorldSize(diameter);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.06,
        toneMapped: false,
        depthWrite: true,
        depthTest: true,
      }),
    [texture]
  );

  return (
    <Billboard follow>
      <BeadArtTangentRoll>
        <mesh
          rotation={[0, 0, BEAD_ART_OVERLAY_Z_ROTATION]}
          renderOrder={RENDER_ORDER_RING_BASE + RENDER_ORDER_BEAD_ART_OVERLAY}
          userData={{ depthLayerOffset: RENDER_ORDER_BEAD_ART_OVERLAY }}
          material={material}
        >
          <planeGeometry args={[size, size]} />
        </mesh>
      </BeadArtTangentRoll>
    </Billboard>
  );
}

function GlassBeadVisual({ diameter, imageUrl, beadPrototype }) {
  if (!beadPrototype.geometry) {
    return null;
  }

  const artUrl = imageUrl && !isSvgBeadAsset(imageUrl) ? imageUrl : null;

  return (
    <>
      <GlassBeadMesh
        prototype={beadPrototype}
        diameter={diameter}
        withArtOverlay={Boolean(artUrl)}
      />
      {artUrl ? (
        <Suspense fallback={null}>
          <BeadCatalogArtOverlay diameter={diameter} imageUrl={artUrl} />
        </Suspense>
      ) : null}
    </>
  );
}

// ─── Bracelet cord (elastic thread) — own geometry + material, not bead/spacer PBR ───

class RingStringArcCurve extends THREE.Curve {
  constructor(radius, startAngle, endAngle, y) {
    super();
    this.radius = radius;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.y = y;
  }

  getPoint(t) {
    const angle = this.startAngle + (this.endAngle - this.startAngle) * t;
    return new THREE.Vector3(Math.sin(angle) * this.radius, this.y, Math.cos(angle) * this.radius);
  }
}

function buildRingStringEntry(item, ringIndex, ringItems, maxDim, manualPartial, charmGaps) {
  const tr = ringItemToTransform(item);
  const [posX, posZ] = getRingMeshWorldXZ(item, ringIndex, ringItems, charmGaps);
  const ringDist = Math.hypot(posX, posZ);
  const angle = Math.atan2(posX, posZ);
  let halfAngle = 0;
  if (ringDist > 1e-5) {
    if (item.type === "bead") {
      halfAngle = getBeadCordArcHalfAngle(tr.diameter, ringDist, maxDim, {
        anglePad: manualPartial ? 0.02 : BEAD_CORD_ARC_ANGLE_PAD,
      });
    } else {
      halfAngle = getRingStringArcTrimHalf(item, tr) / ringDist;
    }
  }
  return { item, angle, ringDist, halfAngle, tr };
}

function computeGapArcAngles(current, next) {
  let centerSpan = next.angle - current.angle;
  if (centerSpan <= 0) {
    centerSpan += Math.PI * 2;
  }
  if (centerSpan <= 1e-5) {
    return null;
  }
  const maxTrim = centerSpan * 0.46;
  const startAngle = current.angle + Math.min(current.halfAngle, maxTrim);
  let endAngle = next.angle - Math.min(next.halfAngle, maxTrim);
  if (endAngle <= startAngle) {
    endAngle += Math.PI * 2;
  }
  if (endAngle - startAngle < 0.012) {
    return null;
  }
  return { startAngle, endAngle };
}

/** Open string along a partial manual cluster (not a full 360° loop). */
function buildManualPartialOpenStringArc(entriesInPatternOrder, stringRadiusPx) {
  if (entriesInPatternOrder.length < 2) {
    return null;
  }
  let minAngle = Infinity;
  let maxAngle = -Infinity;
  entriesInPatternOrder.forEach((entry) => {
    minAngle = Math.min(minAngle, entry.angle);
    maxAngle = Math.max(maxAngle, entry.angle);
  });
  const span = maxAngle - minAngle;
  if (span < 0.015) {
    return null;
  }
  const pad = Math.min(0.05, span * 0.04);
  return {
    startAngle: minAngle - pad,
    endAngle: maxAngle + pad,
    radius: stringRadiusPx * WORLD_PER_PX * RING_3D_POSITION_SNUG,
  };
}

function buildRingStringLayout(
  ringItems,
  beadPrototype,
  { isManualMode = false, isStringFull = true, stringRadiusPx = 0, charmGaps = null } = {}
) {
  if (!ringItems.length) {
    return { tube: 0.004, arcs: [] };
  }

  const maxDim = beadPrototype?.maxDim > 0 ? beadPrototype.maxDim : 1;
  const manualPartial = isManualMode && !isStringFull;
  const loopRadius =
    stringRadiusPx > 0 ? stringRadiusPx * WORLD_PER_PX * RING_3D_POSITION_SNUG : 0;

  let ringDistSum = 0;
  ringItems.forEach((item) => {
    ringDistSum += ringItemToTransform(item).radius;
  });
  const avgRingDist = ringDistSum / ringItems.length;
  const tube = getBraceletCordTubeRadius(avgRingDist);

  const entriesInPatternOrder = ringItems.map((item, ringIndex) =>
    buildRingStringEntry(item, ringIndex, ringItems, maxDim, manualPartial, charmGaps)
  );
  const sortedEntries = [...entriesInPatternOrder].sort((a, b) => a.angle - b.angle);

  const arcPairs = sortedEntries.map((current, index) => [
    current,
    sortedEntries[(index + 1) % sortedEntries.length],
  ]);

  const arcs = [];
  for (const [current, next] of arcPairs) {
    const arcAngles = computeGapArcAngles(current, next);
    if (!arcAngles) {
      continue;
    }
    arcs.push({
      startAngle: arcAngles.startAngle,
      endAngle: arcAngles.endAngle,
      radius: getCordArcRadius(current, next, loopRadius),
    });
  }

  const partialOpenArc = manualPartial
    ? buildManualPartialOpenStringArc(entriesInPatternOrder, stringRadiusPx)
    : null;

  return { tube, arcs, partialOpenArc };
}

function RingStringArc({ startAngle, endAngle, radius, tube, closed = false }) {
  const geometry = useMemo(() => {
    const curve = new RingStringArcCurve(radius, startAngle, endAngle, STRING_Y_OFFSET);
    const segments = closed
      ? 128
      : Math.max(8, Math.ceil((endAngle - startAngle) * 28));
    return new THREE.TubeGeometry(curve, segments, tube, 7, closed);
  }, [startAngle, endAngle, radius, tube, closed]);

  return (
    <mesh
      geometry={geometry}
      renderOrder={RENDER_ORDER_BRACELET_CORD}
      material={BRACELET_CORD_MAT}
    />
  );
}

/** Full loop at layout radius — matches 2D `beads-2d-string` circle (beads sit on this ring). */
function RingStringBaseline({ stringRadiusPx, tube, ringArcBoost = 1, worldRadiusOverride = null }) {
  const worldRadius =
    worldRadiusOverride ?? stringRadiusPx * WORLD_PER_PX * RING_3D_POSITION_SNUG * ringArcBoost;
  return (
    <RingStringArc
      startAngle={0}
      endAngle={Math.PI * 2}
      radius={worldRadius}
      tube={tube}
      closed
    />
  );
}

/**
 * Closed string through the layout ring (same path as 2D) — passes through each bead/spacer bore.
 * Manual partial clusters use an open arc only.
 */
function BraceletCordLayer({
  ringItems,
  stringRadiusPx,
  beadPrototype,
  isManualMode = false,
  isStringFull = true,
  charmGaps = null,
  elasticRadiusWorld = null,
}) {
  const ringArcBoost = useMemo(() => getBead3dRingArcBoost(ringItems), [ringItems]);

  const { tube } = useMemo(
    () =>
      buildRingStringLayout(ringItems, beadPrototype, {
        isManualMode,
        isStringFull,
        stringRadiusPx,
        charmGaps,
      }),
    [ringItems, beadPrototype, isManualMode, isStringFull, stringRadiusPx, charmGaps]
  );

  if (!ringItems.length) {
    return null;
  }

  // Match 2D `beads-2d-string` — full layout circle (empty / partial manual strings included).
  return (
    <group name="bracelet-cord-layer">
      <RingStringBaseline
        stringRadiusPx={stringRadiusPx}
        tube={tube}
        ringArcBoost={ringArcBoost}
        worldRadiusOverride={elasticRadiusWorld}
      />
    </group>
  );
}

function SpacerGlbLoadFallback({ width }) {
  const radius = getSpacer3DTargetSize(width) * 0.5;
  const metalEnv = useSpacerMetalEnvTexture();
  return (
    <mesh renderOrder={5}>
      <circleGeometry args={[radius, 24]} />
      <meshPhysicalMaterial
        {...RING_METAL}
        color={new THREE.Color(SPACER_FALLBACK_METAL)}
        roughness={0.04}
        envMap={metalEnv ?? null}
        envMapIntensity={metalEnv ? SPACER_RING_METAL_ENV_INTENSITY : SPACER_METAL_ENV_INTENSITY}
        emissive={spacerMetalEmissiveForFinish("yellowGold")}
        emissiveIntensity={0.045}
        toneMapped={false}
      />
    </mesh>
  );
}

function isSpacerDiamondPart(mesh, material, { stoneWheelLuxury = false } = {}) {
  const label = `${mesh.name} ${material?.name || ""}`.toLowerCase();
  if (
    /diamond|diamonds|crystal|hex-stone|hex_gem|pave|material_1|all-diamond|(^|[^a-z])gem([^a-z]|$)/i.test(
      label
    )
  ) {
    return true;
  }
  if (/gold|metal|band|body|rose|silver|halo|wheel/i.test(label)) {
    return false;
  }
  if (/torus/i.test(label)) {
    if (stoneWheelLuxury) {
      return /diamond|diamonds|crystal|pave|(^|[^a-z])gem([^a-z]|$)/i.test(label);
    }
    return true;
  }
  if (!material) {
    return false;
  }
  const metalness =
    material.metalness ??
    material.pbrMetallicRoughness?.metallicFactor ??
    material.metallic ??
    1;
  if (metalness < 0.35) {
    return true;
  }
  const transmission = material.transmission ?? 0;
  return transmission > 0.12 || (material.transparent && (material.opacity ?? 1) < 0.98);
}

/**
 * S7–S9 scene.glb: main band is often a mesh named "Torus" — must not use the generic
 * `isSpacerDiamondPart` torus rule or the whole wheel becomes clear glass (invisible).
 */
function isScene81MetalBandGemPart(mesh, material) {
  const label = `${mesh.name} ${material?.name || ""}`.toLowerCase();
  if (/gold|metal|band|body|rose|silver|wheel|torus|ring|scene/i.test(label)) {
    return false;
  }
  return /diamond|diamonds|crystal|pave|(^|[^a-z])gem([^a-z]|$)|hex-stone|hex_gem/i.test(label);
}

const SPACER_METAL_FINISH_COLOR = {
  yellowGold: RING_METAL_COLORS.yellow,
  silver: RING_METAL_COLORS.white,
  roseGold: RING_METAL_COLORS.rose,
};

/**
 * S1–S6 band tint — slightly richer than flat RING_METAL_COLORS so small meshes
 * do not read washed-out after ACES + studio env (matches 2D picker art).
 */
const STONE_WHEEL_LUXURY_METAL_COLOR = {
  yellowGold: "#ECC875",
  silver: "#E4E4E2",
  roseGold: "#E8A088",
};
/**
 * S1–S6 band: mirror metal + metal3.hdr on tiny torus geometry reads hotter than beads.
 * Keep env below necklace links; ACES tone mapping on (see luxury metal material).
 */
const STONE_WHEEL_METAL_ENV_INTENSITY = JEWELRY_ENV_INTENSITY * 0.68;
/** White/black pavé on stone-wheel — many facets × gem HDR; no extra SPACER_GEM_ENV_BOOST. */
const STONE_WHEEL_WHITE_GEM_ENV = 2.35;
const STONE_WHEEL_BLACK_GEM_ENV = 1.75;

function spacerMetalEmissiveForFinish(metalFinish) {
  if (metalFinish === "roseGold") {
    return new THREE.Color("#6a3828");
  }
  if (metalFinish === "silver") {
    return new THREE.Color("#323238");
  }
  return new THREE.Color("#6a4818");
}

let _spacerMetalEnvTexture = null;
let _spacerMetalEnvPromise = null;

function loadSpacerMetalEnvTexture() {
  if (_spacerMetalEnvTexture) {
    return Promise.resolve(_spacerMetalEnvTexture);
  }
  if (!_spacerMetalEnvPromise) {
    _spacerMetalEnvPromise = new Promise((resolve, reject) => {
      new RGBELoader().load(
        RING_METAL_ENV_URL,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          _spacerMetalEnvTexture = texture;
          resolve(texture);
        },
        undefined,
        (err) => {
          _spacerMetalEnvPromise = null;
          reject(err);
        }
      );
    });
  }
  return _spacerMetalEnvPromise;
}

function useSpacerMetalEnvTexture() {
  const [texture, setTexture] = useState(_spacerMetalEnvTexture);
  useEffect(() => {
    if (texture) {
      return undefined;
    }
    loadSpacerMetalEnvTexture()
      .then((map) => setTexture(map))
      .catch((err) => console.warn("[beads-3d] metal env failed", err));
    return undefined;
  }, [texture]);
  return texture;
}

function createStoneWheelLuxuryMetalMaterial(metalFinish, metalEnv) {
  const ringColor = toRingMetalColor(
    STONE_WHEEL_LUXURY_METAL_COLOR[metalFinish] ?? STONE_WHEEL_LUXURY_METAL_COLOR.yellowGold
  );
  const base = new THREE.Color(ringColor);
  const emissive = spacerMetalEmissiveForFinish(metalFinish);

  return new THREE.MeshPhysicalMaterial({
    ...RING_METAL,
    color: base,
    roughness: 0.038,
    envMap: metalEnv ?? null,
    envMapIntensity: metalEnv ? STONE_WHEEL_METAL_ENV_INTENSITY : SPACER_METAL_ENV_INTENSITY,
    specularIntensity: 1.02,
    specularColor: base.clone(),
    emissive,
    emissiveIntensity: metalEnv ? 0.032 : 0.018,
    toneMapped: true,
  });
}

/** S1–S3 stone-wheel pavé only — conservative env (shared gem HDR + dozens of faces). */
function createStoneWheelWhitePaveMaterial(envMap) {
  const envIntensity = envMap ? STONE_WHEEL_WHITE_GEM_ENV : 1.1;
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(SPACER_DIAMOND_COLOR),
    metalness: 0,
    roughness: 0.034,
    transmission: 0.96,
    thickness: 0.36,
    ior: GEM_REFRACTION_PARAMS.ior,
    envMap: envMap ?? null,
    envMapIntensity: envIntensity,
    clearcoat: 0.76,
    clearcoatRoughness: 0.07,
    specularIntensity: 0.92,
    specularColor: new THREE.Color("#b8c8de"),
    attenuationColor: new THREE.Color("#8fa4be"),
    attenuationDistance: 0.55,
    iridescence: 0.06,
    iridescenceIOR: 1.28,
    iridescenceThicknessRange: [120, 320],
    reflectivity: 0.8,
    transparent: true,
    side: THREE.DoubleSide,
    toneMapped: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
}

/** Other spacers / fallbacks — high transmission glass diamond. */
function createSpacerWhiteGlassDiamondMaterial(envMap) {
  const envIntensity = (envMap ? 2.85 : 1.2) * SPACER_GEM_ENV_BOOST;
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(SPACER_DIAMOND_COLOR),
    metalness: 0,
    roughness: 0.032,
    transmission: 0.95,
    thickness: 0.38,
    ior: GEM_REFRACTION_PARAMS.ior,
    envMap: envMap ?? null,
    envMapIntensity: envIntensity,
    clearcoat: 0.8,
    clearcoatRoughness: 0.06,
    specularIntensity: 0.98,
    specularColor: new THREE.Color("#c0d0e4"),
    attenuationColor: new THREE.Color("#8fa4be"),
    attenuationDistance: 0.52,
    iridescence: 0.08,
    iridescenceIOR: 1.28,
    iridescenceThicknessRange: [120, 320],
    reflectivity: 0.84,
    transparent: true,
    side: THREE.DoubleSide,
    toneMapped: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
}

function createStoneWheelBrilliantWhiteDiamond(envMap) {
  return createStoneWheelWhitePaveMaterial(envMap);
}

/** S4–S6 pavé: black brilliant — low transmission so stones read jet, not gray glass. */
function createStoneWheelBrilliantBlackDiamond(envMap) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#010102"),
    metalness: 0,
    roughness: 0.035,
    transmission: 0.62,
    thickness: 0.72,
    ior: 2.42,
    envMap: envMap ?? null,
    envMapIntensity: envMap ? STONE_WHEEL_BLACK_GEM_ENV : 1.22,
    clearcoat: 0.9,
    clearcoatRoughness: 0.06,
    specularIntensity: 0.8,
    specularColor: new THREE.Color("#5a6068"),
    attenuationColor: new THREE.Color("#000000"),
    attenuationDistance: 0.045,
    transparent: true,
    side: THREE.DoubleSide,
    toneMapped: true,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
}

/** S10–S14 colored crystal: preset hue + gem sheen / refraction (Swarovski-style). */
function createStoneWheelBrilliantColoredCrystal(envMap, presetKey) {
  const preset = SPACER_CRYSTAL_GEM_PRESETS[presetKey] ?? SPACER_CRYSTAL_GEM_PRESETS.crystalPink;
  const transmission = preset.bodyTransmission ?? 0.72;
  const envIntensity =
    (envMap ? (preset.bodyEnvIntensity ?? preset.envIntensity) : 2.1) * SPACER_GEM_ENV_BOOST;
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(preset.color),
    metalness: 0,
    roughness: preset.bodyRoughness ?? 0.02,
    transmission,
    thickness: preset.bodyThickness ?? 0.65,
    ior: 2.45,
    envMap: envMap ?? null,
    envMapIntensity: envIntensity,
    clearcoat: preset.bodyClearcoat ?? 1,
    clearcoatRoughness: preset.bodyClearcoatRoughness ?? 0.03,
    specularIntensity: preset.bodySpecularIntensity ?? 1.15,
    specularColor: new THREE.Color(preset.specular),
    attenuationColor: new THREE.Color(preset.attenuation),
    attenuationDistance: preset.bodyAttenuationDistance ?? 0.05,
    emissive: new THREE.Color(preset.bodyEmissive ?? preset.attenuation),
    emissiveIntensity: (preset.bodyEmissiveIntensity ?? 0.05) * 1.25,
    transparent: transmission > 0.01,
    opacity: 1,
    reflectivity: 0.92,
    side: THREE.DoubleSide,
    toneMapped: false,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  if (preset.bodySheen != null) {
    material.sheen = preset.bodySheen;
    material.sheenColor = new THREE.Color(preset.bodySheenColor ?? preset.color);
    material.sheenRoughness = preset.bodySheenRoughness ?? 0.25;
  }
  if (preset.bodyAnisotropy != null) {
    material.anisotropy = preset.bodyAnisotropy;
    material.anisotropyRotation = preset.bodyAnisotropyRotation ?? 0.35;
  }
  if (preset.bodyIridescence != null && preset.bodyIridescence > 0) {
    material.iridescence = preset.bodyIridescence;
    material.iridescenceIOR = preset.bodyIridescenceIOR ?? 1.28;
    material.iridescenceThicknessRange = preset.bodyIridescenceThicknessRange ?? [120, 360];
  }

  return material;
}

function createStoneWheelBrilliantDiamond(envMap, variant) {
  if (variant === "black") {
    return createStoneWheelBrilliantBlackDiamond(envMap);
  }
  if (variant && SPACER_CRYSTAL_GEM_PRESETS[variant]) {
    return createStoneWheelBrilliantColoredCrystal(envMap, variant);
  }
  return createStoneWheelBrilliantWhiteDiamond(envMap);
}

function createSpacerMetalMaterial({
  metalMap = null,
  metalFinish = "yellowGold",
  metalEnv = null,
} = {}) {
  const ringColor =
    toRingMetalColor(SPACER_METAL_FINISH_COLOR[metalFinish] ?? RING_METAL_COLORS.yellow);

  const emissive = spacerMetalEmissiveForFinish(metalFinish);

  if (metalMap) {
    return new THREE.MeshPhysicalMaterial({
      map: metalMap,
      color: new THREE.Color("#ffffff"),
      metalness: 1,
      roughness: 0.028,
      reflectivity: 1,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMap: metalEnv ?? null,
      envMapIntensity: metalEnv ? SPACER_RING_METAL_TEX_ENV_INTENSITY : SPACER_METAL_TEX_ENV_INTENSITY,
      specularIntensity: 1.22,
      specularColor: new THREE.Color(ringColor),
      emissive,
      emissiveIntensity: 0.05,
      toneMapped: false,
    });
  }

  return new THREE.MeshPhysicalMaterial({
    ...RING_METAL,
    color: new THREE.Color(ringColor),
    roughness: 0.018,
    envMap: metalEnv ?? null,
    envMapIntensity: metalEnv ? SPACER_RING_METAL_ENV_INTENSITY : SPACER_METAL_ENV_INTENSITY,
    specularIntensity: 1.2,
    specularColor: new THREE.Color(ringColor),
    emissive,
    emissiveIntensity: metalEnv ? 0.062 : 0.038,
    toneMapped: false,
  });
}

function createSpacerWhiteDiamondMaterial(envMap) {
  return createSpacerWhiteGlassDiamondMaterial(envMap);
}

function createSpacerBlackDiamondMaterial(envMap) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#030308"),
    metalness: 0,
    roughness: 0.04,
    transmission: 0.64,
    thickness: 0.68,
    ior: 2.42,
    envMap: envMap ?? null,
    envMapIntensity: (envMap ? 2.05 : 1.32) * SPACER_GEM_ENV_BOOST,
    clearcoat: 0.94,
    clearcoatRoughness: 0.055,
    specularIntensity: 0.88,
    specularColor: new THREE.Color("#4a4e58"),
    attenuationColor: new THREE.Color("#000000"),
    attenuationDistance: 0.05,
    transparent: true,
    side: THREE.DoubleSide,
    toneMapped: false,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
}

const SPACER_CRYSTAL_GEM_PRESETS = {
  crystalSilver: {
    color: "#e2e8f0",
    attenuation: "#475569",
    specular: "#ffffff",
    glassColor: "#8b9cb3",
    glassAttenuation: "#2f3d4f",
    glassSpecular: "#dbe4f0",
    glassTransmission: 0.76,
    glassAttenuationDistance: 0.068,
    envIntensity: 3.5,
    bodyTransmission: 0.34,
    bodyThickness: 0.55,
    bodyRoughness: 0.045,
    bodyEnvIntensity: 1.0,
    bodyClearcoat: 0.92,
    bodyClearcoatRoughness: 0.04,
    bodySpecularIntensity: 0.76,
    bodyAttenuationDistance: 0.032,
    bodyEmissive: "#64748b",
    bodyEmissiveIntensity: 0.07,
    bodySheen: 0.36,
    bodySheenColor: "#f1f5f9",
    bodySheenRoughness: 0.22,
    bodyAnisotropy: 0.28,
    bodyIridescence: 0.14,
  },
  crystalPink: {
    color: "#db2777",
    attenuation: "#831843",
    specular: "#ffffff",
    glassColor: "#c2185b",
    glassAttenuation: "#4a0428",
    glassSpecular: "#f9a8d4",
    glassTransmission: 0.76,
    glassAttenuationDistance: 0.062,
    envIntensity: 3.65,
    /** Plain-wheel S10–S14: pink body + internal gem refraction (not milky). */
    bodyTransmission: 0.36,
    bodyThickness: 0.55,
    bodyRoughness: 0.045,
    bodyEnvIntensity: 1.05,
    bodyClearcoat: 0.92,
    bodyClearcoatRoughness: 0.04,
    bodySpecularIntensity: 0.78,
    bodyAttenuationDistance: 0.034,
    bodyEmissive: "#be185d",
    bodyEmissiveIntensity: 0.09,
    bodySheen: 0.38,
    bodySheenColor: "#f9a8d4",
    bodySheenRoughness: 0.22,
    bodyAnisotropy: 0.28,
    bodyIridescence: 0.12,
  },
  crystalBlue: {
    color: "#60a5fa",
    attenuation: "#1d4ed8",
    specular: "#eff6ff",
    glassColor: "#1d4ed8",
    glassAttenuation: "#0c1f4a",
    glassSpecular: "#5b9cf5",
    glassTransmission: 0.72,
    glassAttenuationDistance: 0.052,
    envIntensity: 3.6,
    bodyTransmission: 0.36,
    bodyThickness: 0.55,
    bodyRoughness: 0.045,
    bodyEnvIntensity: 1.05,
    bodyClearcoat: 0.92,
    bodyClearcoatRoughness: 0.04,
    bodySpecularIntensity: 0.78,
    bodyAttenuationDistance: 0.034,
    bodyEmissive: "#1e40af",
    bodyEmissiveIntensity: 0.09,
    bodySheen: 0.38,
    bodySheenColor: "#93c5fd",
    bodySheenRoughness: 0.22,
    bodyAnisotropy: 0.28,
    bodyIridescence: 0.12,
  },
  crystalRoyalBlue: {
    color: "#6366f1",
    attenuation: "#312e81",
    specular: "#eef2ff",
    glassColor: "#4338ca",
    glassAttenuation: "#15123d",
    glassSpecular: "#818cf8",
    glassTransmission: 0.73,
    glassAttenuationDistance: 0.055,
    envIntensity: 3.65,
    bodyTransmission: 0.36,
    bodyThickness: 0.55,
    bodyRoughness: 0.045,
    bodyEnvIntensity: 1.05,
    bodyClearcoat: 0.92,
    bodyClearcoatRoughness: 0.04,
    bodySpecularIntensity: 0.78,
    bodyAttenuationDistance: 0.034,
    bodyEmissive: "#3730a3",
    bodyEmissiveIntensity: 0.09,
    bodySheen: 0.38,
    bodySheenColor: "#a5b4fc",
    bodySheenRoughness: 0.22,
    bodyAnisotropy: 0.28,
    bodyIridescence: 0.13,
  },
  crystalEmerald: {
    color: "#34d399",
    attenuation: "#047857",
    specular: "#ecfdf5",
    glassColor: "#059669",
    glassAttenuation: "#022c22",
    glassSpecular: "#34d399",
    glassTransmission: 0.74,
    glassAttenuationDistance: 0.058,
    envIntensity: 3.55,
    bodyTransmission: 0.36,
    bodyThickness: 0.55,
    bodyRoughness: 0.045,
    bodyEnvIntensity: 1.05,
    bodyClearcoat: 0.92,
    bodyClearcoatRoughness: 0.04,
    bodySpecularIntensity: 0.78,
    bodyAttenuationDistance: 0.034,
    bodyEmissive: "#065f46",
    bodyEmissiveIntensity: 0.09,
    bodySheen: 0.38,
    bodySheenColor: "#6ee7b7",
    bodySheenRoughness: 0.22,
    bodyAnisotropy: 0.28,
    bodyIridescence: 0.11,
  },
};

/** S10–S14 glass-wheel-spacer.glb — saturated crystal body (lower transmission than plain-wheel). */
function createGlassWheelFacetedCrystalMaterial(envMap, presetKey) {
  const preset = SPACER_CRYSTAL_GEM_PRESETS[presetKey] ?? SPACER_CRYSTAL_GEM_PRESETS.crystalSilver;
  const light = GLASS_WHEEL_LIGHT_SCALE;
  const bodyColor = preset.glassColor ?? preset.color;
  const bodyAttenuation = preset.glassAttenuation ?? preset.attenuation;
  const bodySpecular = preset.glassSpecular ?? preset.specular;
  const envIntensity =
    (envMap ? preset.bodyEnvIntensity ?? GLASS_WHEEL_ENV_INTENSITY : 1.15) *
    SPACER_GEM_ENV_BOOST *
    light *
    1.06;
  const transmission = Math.min(preset.glassTransmission ?? 0.76, 0.59);
  const specular = glassWheelTintedColor(bodySpecular, GLASS_WHEEL_WHITE_MIX * 1.4).clone();
  const material = new THREE.MeshPhysicalMaterial({
    color: glassWheelTintedColor(bodyColor).clone(),
    metalness: 0,
    roughness: 0.038,
    transmission,
    thickness: preset.glassThickness ?? 0.48,
    ior: 2.45,
    envMap: envMap ?? null,
    envMapIntensity: envIntensity,
    clearcoat: 0.84,
    clearcoatRoughness: 0.068,
    specularIntensity: 0.74 * light,
    specularColor: specular,
    iridescence: 0.045,
    iridescenceIOR: 1.28,
    iridescenceThicknessRange: [140, 280],
    attenuationColor: new THREE.Color(bodyAttenuation),
    attenuationDistance: Math.min(preset.glassAttenuationDistance ?? 0.06, 0.042),
    emissive: new THREE.Color(preset.bodyEmissive ?? bodyAttenuation),
    emissiveIntensity: (preset.bodyEmissiveIntensity ?? 0.05) * 0.85,
    transparent: transmission > 0.01,
    opacity: 1,
    reflectivity: 0.68,
    side: THREE.DoubleSide,
    flatShading: true,
    toneMapped: true,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  material.sheen = 0.14;
  material.sheenColor = _glassWheelWhiteScratch.clone();
  material.sheenRoughness = 0.32;
  return material;
}

/**
 * S10–S14 hex-wheel GLB: faceted crystal body (no WebP billboard) — matches S1–S6 pavé fire.
 */
function createHexWheelFacetedCrystalMaterial(envMap, presetKey) {
  const preset = SPACER_CRYSTAL_GEM_PRESETS[presetKey] ?? SPACER_CRYSTAL_GEM_PRESETS.crystalSilver;
  const light = GLASS_WHEEL_LIGHT_SCALE;
  const emissiveHex = preset.hexEmissive;
  const transmission = Math.min(preset.hexTransmission ?? 0.9, 0.64);
  const material = new THREE.MeshPhysicalMaterial({
    color: glassWheelTintedColor(preset.color).clone(),
    metalness: 0,
    roughness: 0.036,
    transmission,
    thickness: preset.hexThickness ?? 0.52,
    ior: 2.42,
    envMap: envMap ?? null,
    envMapIntensity:
      (envMap ? preset.bodyEnvIntensity ?? GLASS_WHEEL_ENV_INTENSITY : 1.2) *
      SPACER_GEM_ENV_BOOST *
      light *
      1.06,
    clearcoat: 0.84,
    clearcoatRoughness: 0.062,
    specularIntensity: 0.76 * light,
    specularColor: glassWheelTintedColor(
      preset.glassSpecular ?? preset.specular,
      GLASS_WHEEL_WHITE_MIX * 1.4
    ).clone(),
    iridescence: 0.04,
    iridescenceIOR: 1.28,
    iridescenceThicknessRange: [140, 280],
    attenuationColor: new THREE.Color(preset.attenuation),
    attenuationDistance: Math.min(preset.hexAttenuationDistance ?? 0.11, 0.055),
    emissive: emissiveHex ? new THREE.Color(emissiveHex) : new THREE.Color(preset.bodyEmissive ?? "#000000"),
    emissiveIntensity: (preset.hexEmissiveIntensity ?? preset.bodyEmissiveIntensity ?? 0) * 0.8,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide,
    toneMapped: true,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  material.sheen = 0.12;
  material.sheenColor = _glassWheelWhiteScratch.clone();
  material.sheenRoughness = 0.32;
  return material;
}

/** Colored stones — same diamond refraction as S1–S3 pavé (not glassy plastic). */
function createSpacerCrystalMaterial(envMap, presetKey, gemMap = null) {
  const preset = SPACER_CRYSTAL_GEM_PRESETS[presetKey] ?? SPACER_CRYSTAL_GEM_PRESETS.crystalSilver;
  const textured = Boolean(gemMap);
  return new THREE.MeshPhysicalMaterial({
    map: gemMap,
    color: new THREE.Color(textured ? "#ffffff" : preset.color),
    metalness: 0,
    roughness: textured ? 0.06 : 0,
    transmission: textured ? 0.28 : 0.9,
    thickness: textured ? 0.38 : 0.52,
    ior: 2.415,
    envMap: envMap ?? null,
    envMapIntensity: (envMap ? preset.envIntensity + (textured ? 0.8 : 0) : 3.2) * SPACER_GEM_ENV_BOOST,
    clearcoat: 1,
    clearcoatRoughness: textured ? 0.04 : 0,
    specularIntensity: textured ? 1.15 : 1,
    specularColor: new THREE.Color(preset.specular),
    attenuationColor: new THREE.Color(preset.attenuation),
    attenuationDistance: textured ? 0.22 : 0.1,
    emissive: textured ? new THREE.Color(preset.attenuation) : new THREE.Color("#000000"),
    emissiveIntensity: textured ? 0.12 : 0,
    emissiveMap: gemMap,
    transparent: true,
    side: THREE.DoubleSide,
    toneMapped: false,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
}

function createSpacerDiamondMaterial(envMap, variant = "white", gemMap = null) {
  if (variant === "black") {
    return createSpacerBlackDiamondMaterial(envMap);
  }
  if (variant && SPACER_CRYSTAL_GEM_PRESETS[variant]) {
    return createSpacerCrystalMaterial(envMap, variant, gemMap);
  }
  return createSpacerWhiteDiamondMaterial(envMap);
}

function ensureMeshNormals(geometry) {
  if (!geometry || geometry.getAttribute("normal")) {
    return;
  }
  geometry.computeVertexNormals();
}

/** Zero-area triangles shade as random specks and hide the real facet faces. */
function withoutDegenerateTriangles(geometry) {
  const indexAttr = geometry.getIndex();
  const position = geometry.getAttribute("position");
  if (!indexAttr || !position) {
    return geometry;
  }
  const src = indexAttr.array;
  const kept = [];
  for (let i = 0; i < src.length; i += 3) {
    const ia = src[i];
    const ib = src[i + 1];
    const ic = src[i + 2];
    const ax = position.getX(ia);
    const ay = position.getY(ia);
    const az = position.getZ(ia);
    const bx = position.getX(ib);
    const by = position.getY(ib);
    const bz = position.getZ(ib);
    const cx = position.getX(ic);
    const cy = position.getY(ic);
    const cz = position.getZ(ic);
    const nx = (by - ay) * (cz - az) - (bz - az) * (cy - ay);
    const ny = (bz - az) * (cx - ax) - (bx - ax) * (cz - az);
    const nz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (nx * nx + ny * ny + nz * nz < 1e-12) {
      continue;
    }
    kept.push(ia, ib, ic);
  }
  const next = geometry.clone();
  next.setIndex(kept);
  return next;
}

function buildSpacerModelWithMaterials(
  source,
  gemEnv,
  {
    metalMap = null,
    metalFinish = "yellowGold",
    diamondVariant = "white",
    isHexWheel = false,
    hexGemMap = null,
    stoneWheelLuxury = false,
    metalEnv = null,
    plainWheelColoredCrystal = false,
    glassWheelFacetedCrystal = false,
    scene81MetalBand = false,
  } = {}
) {
  const model = source.clone(true);

  model.traverse((child) => {
    if (!child.isMesh) {
      return;
    }
    child.castShadow = true;
    child.receiveShadow = true;
    const sourceMat = Array.isArray(child.material) ? child.material[0] : child.material;

    if (scene81MetalBand) {
      if (isScene81MetalBandGemPart(child, sourceMat)) {
        if (child.geometry) {
          ensureMeshNormals(child.geometry);
        }
        child.material = createStoneWheelBrilliantDiamond(gemEnv, "white");
        child.renderOrder = RENDER_ORDER_RING_BASE + 6;
        child.userData.depthLayerOffset = 6;
        return;
      }
      child.material = metalEnv
        ? createStoneWheelLuxuryMetalMaterial(metalFinish, metalEnv)
        : createSpacerMetalMaterial({ metalMap: null, metalFinish, metalEnv });
      child.renderOrder = RENDER_ORDER_RING_BASE + 5;
      child.userData.depthLayerOffset = 5;
      return;
    }

    if (glassWheelFacetedCrystal) {
      const crystalMat = createGlassWheelFacetedCrystalMaterial(gemEnv, diamondVariant);
      if (child.geometry) {
        ensureMeshNormals(child.geometry);
      }
      child.material = crystalMat;
      child.renderOrder = RENDER_ORDER_RING_BASE + 6;
      child.userData.depthLayerOffset = 6;
      return;
    }

    if (plainWheelColoredCrystal) {
      const crystalMat = createStoneWheelBrilliantColoredCrystal(gemEnv, diamondVariant);
      if (child.geometry) {
        ensureMeshNormals(child.geometry);
      }
      child.material = crystalMat;
      child.renderOrder = RENDER_ORDER_RING_BASE + 6;
      child.userData.depthLayerOffset = 6;
      return;
    }

    if (isHexWheel || isSpacerDiamondPart(child, sourceMat, { stoneWheelLuxury })) {
      let gemMat;
      if (stoneWheelLuxury && !isHexWheel) {
        gemMat = createStoneWheelBrilliantDiamond(gemEnv, diamondVariant);
      } else if (isHexWheel && !hexGemMap) {
        gemMat = createHexWheelFacetedCrystalMaterial(gemEnv, diamondVariant);
      } else {
        gemMat = createSpacerDiamondMaterial(gemEnv, diamondVariant, isHexWheel ? hexGemMap : null);
      }
      if (child.geometry) {
        ensureMeshNormals(child.geometry);
      }
      child.material = gemMat;
      child.renderOrder = RENDER_ORDER_RING_BASE + 6;
      child.userData.depthLayerOffset = 6;
      return;
    }

    child.material =
      stoneWheelLuxury && !metalMap
        ? createStoneWheelLuxuryMetalMaterial(metalFinish, metalEnv)
        : createSpacerMetalMaterial({ metalMap, metalFinish, metalEnv });
    child.renderOrder = RENDER_ORDER_RING_BASE + 5;
    child.userData.depthLayerOffset = 5;
  });

  return model;
}

const spacerPrototypeCache = new Map();
const preparedSpacerCache = new Map();

function useSpacerPrototype(modelUrl) {
  const { scene } = useGLTF(modelUrl);
  return useMemo(() => {
    const cached = spacerPrototypeCache.get(modelUrl);
    if (cached) {
      return cached;
    }
    const model = scene.clone(true);
    const showGlassTriangles = isGlassWheelSpacerModel(modelUrl);
    model.traverse((child) => {
      if (!child.isMesh) {
        return;
      }
      child.castShadow = true;
      child.receiveShadow = true;
      if (showGlassTriangles && child.geometry) {
        child.geometry = withoutDegenerateTriangles(child.geometry);
      }
    });
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.position.sub(center);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 1e-4);
    rememberSpacerMetric(modelUrl, size, maxDim);
    const prototype = { model, maxDim };
    spacerPrototypeCache.set(modelUrl, prototype);
    return prototype;
  }, [scene, modelUrl]);
}

function SpacerGlbMeshCore({
  modelUrl,
  targetSize,
  diamondVariant,
  metalFinish,
  metalMap,
  hexGemMap = null,
  assetKey = null,
}) {
  const gemEnv = useGemEnvTexture();
  const coloredCrystalSpacer = isColoredCrystalSpacerSku(assetKey);
  const scene81MetalBand = isScene81MetalSpacerSku(assetKey);
  const isPlainWheel = isPlainWheel3DModel(modelUrl);
  const glassWheelFacetedCrystal =
    coloredCrystalSpacer && isGlassWheelSpacerModel(modelUrl);
  const plainWheelColoredCrystal =
    coloredCrystalSpacer && isPlainWheel && !glassWheelFacetedCrystal;
  const stoneWheelLuxury = isStoneWheelSpacerSku(assetKey);
  const metalEnv = useSpacerMetalEnvTexture();
  const isHexWheel = isHexSpacer3DModel(modelUrl);
  const localQuat = useMemo(() => {
    const q = new THREE.Quaternion();
    q.copy(getSpacerModelLocalQuaternion(modelUrl, assetKey));
    return q;
  }, [modelUrl, assetKey]);
  const { model: source, maxDim } = useSpacerPrototype(modelUrl);
  const model = useMemo(() => {
    const cacheKey = [
      modelUrl,
      metalFinish,
      diamondVariant,
      isHexWheel ? "hex" : "",
      stoneWheelLuxury ? "luxury" : "",
      plainWheelColoredCrystal ? "plain-crystal" : "",
      glassWheelFacetedCrystal ? "glass-crystal" : "",
      scene81MetalBand ? "scene81" : "",
      gemEnv?.uuid ?? "",
      metalEnv?.uuid ?? "",
      metalMap?.uuid ?? "",
      hexGemMap?.uuid ?? "",
    ].join("|");
    let prepared = preparedSpacerCache.get(cacheKey);
    if (!prepared) {
      prepared = buildSpacerModelWithMaterials(source, gemEnv, {
        metalMap,
        metalFinish,
        diamondVariant,
        isHexWheel,
        hexGemMap,
        stoneWheelLuxury,
        metalEnv,
        plainWheelColoredCrystal,
        glassWheelFacetedCrystal,
        scene81MetalBand,
      });
      preparedSpacerCache.set(cacheKey, prepared);
    }
    return prepared.clone();
  }, [
    source,
    modelUrl,
    gemEnv,
    metalMap,
    metalFinish,
    diamondVariant,
    isHexWheel,
    hexGemMap,
    stoneWheelLuxury,
    metalEnv,
    plainWheelColoredCrystal,
    glassWheelFacetedCrystal,
    scene81MetalBand,
  ]);

  const scale = (targetSize / maxDim) * GLASS_BEAD_SHELL_SCALE;

  return (
    <group quaternion={localQuat} scale={scale}>
      <primitive object={model} />
    </group>
  );
}

function SpacerGlbMeshTextured({
  modelUrl,
  imageUrl,
  targetSize,
  diamondVariant,
  metalFinish,
  assetKey,
}) {
  const metalMap = useBeadArtTexture(imageUrl);
  return (
    <SpacerGlbMeshCore
      modelUrl={modelUrl}
      targetSize={targetSize}
      diamondVariant={diamondVariant}
      metalFinish={metalFinish}
      metalMap={metalMap}
      assetKey={assetKey}
    />
  );
}

function SpacerHexPickerBillboardTextured({ imageUrl, targetSize, width, height }) {
  const layoutW = Math.max((width ?? 26) * WORLD_PER_PX, 1e-4);
  const layoutH = Math.max((height ?? width ?? 26) * WORLD_PER_PX, 1e-4);
  const fit = (targetSize / layoutW) * GLASS_BEAD_SHELL_SCALE;
  const planeW = layoutW * fit;
  const planeH = layoutH * fit;
  const texture = useBeadArtTexture(imageUrl);

  return (
    <group position={[0, 0, 0.014]}>
      <Billboard follow renderOrder={RENDER_ORDER_RING_BASE + 8}>
        <mesh
          renderOrder={RENDER_ORDER_RING_BASE + 8}
          userData={{ depthLayerOffset: 8 }}
        >
          <planeGeometry args={[planeW, planeH]} />
          <meshBasicMaterial map={texture} toneMapped={false} transparent depthWrite={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

function SpacerHexPickerVisual({ imageUrl, targetSize, width, height }) {
  return (
    <Suspense fallback={null}>
      <SpacerHexPickerBillboardTextured
        imageUrl={imageUrl}
        targetSize={targetSize}
        width={width}
        height={height}
      />
    </Suspense>
  );
}

function SpacerGlbOnRing({
  modelUrl,
  imageUrl,
  targetSize,
  assetKey,
  diamondVariant,
  metalFinish,
}) {
  if (isDiamondSpacerSku(assetKey) || isScene81MetalSpacerSku(assetKey)) {
    return (
      <SpacerGlbMeshCore
        modelUrl={modelUrl}
        targetSize={targetSize}
        diamondVariant={diamondVariant}
        metalFinish={metalFinish}
        metalMap={null}
        assetKey={assetKey}
      />
    );
  }
  if (imageUrl) {
    return (
      <Suspense fallback={null}>
        <SpacerGlbMeshTextured
          modelUrl={modelUrl}
          imageUrl={imageUrl}
          targetSize={targetSize}
          diamondVariant={diamondVariant}
          metalFinish={metalFinish}
          assetKey={assetKey}
        />
      </Suspense>
    );
  }
  return (
    <SpacerGlbMeshCore
      modelUrl={modelUrl}
      targetSize={targetSize}
      diamondVariant={diamondVariant}
      metalFinish={metalFinish}
      metalMap={null}
      assetKey={assetKey}
    />
  );
}

/** S1–S6 + S10–S14 crystal PBR; S7–S9 scene.glb gold / silver / rose PBR. */
function SpacerOnRing({ worldX, worldZ, width, height, modelUrl, imageUrl, assetKey }) {
  const diamondVariant = getSpacerDiamondVariant(assetKey);
  const metalFinish = getSpacerMetalFinish(assetKey);
  const targetSize = getSpacer3DTargetSize(width, assetKey);
  /** S10–S14: glass-wheel-spacer GLB + crystal tint (not flat picker WebP in 3D). */
  const isHexPicker =
    isHexSpacerSku(assetKey) && Boolean(imageUrl) && !isDiamondSpacerSku(assetKey);
  const orientQuat = useMemo(
    () => getItemOnStringQuaternion(worldX, worldZ),
    [worldX, worldZ]
  );
  const ringScale = isHexPicker ? [1, 1, 1] : getSpacerRingScaleForAssetKey(assetKey);

  return (
    <group position={[0, SPACER_RING_LIFT_Y, 0]} quaternion={orientQuat}>
      <group scale={ringScale}>
        {isHexPicker ? (
          <SpacerHexPickerVisual
            imageUrl={imageUrl}
            targetSize={targetSize}
            width={width}
            height={height}
          />
        ) : (
          <Suspense fallback={<SpacerGlbLoadFallback width={width} />}>
            <SpacerGlbOnRing
              modelUrl={modelUrl}
              imageUrl={imageUrl}
              targetSize={targetSize}
              assetKey={assetKey}
              diamondVariant={diamondVariant}
              metalFinish={metalFinish}
            />
          </Suspense>
        )}
      </group>
    </group>
  );
}

/**
 * Edge-on string bail (hole along local +X) — same proportions as `buildEdgeOnStringBail`.
 * A thin gold torus only; no gem spheres or extra arcs (those read as a distorted “flower” in 3D).
 */
function getCharmBailDimensions(jumpRing) {
  return {
    ringR: (jumpRing?.ry ?? 4) * WORLD_PER_PX * CHARM_BAIL_3D_SIZE_BOOST,
    ringTube: Math.max(
      (jumpRing?.rx ?? 1) * WORLD_PER_PX * 0.92 * CHARM_BAIL_3D_SIZE_BOOST,
      0.007
    ),
  };
}

function CharmStringBail3D({ jumpRing }) {
  const { ringR, ringTube } = getCharmBailDimensions(jumpRing);

  return (
    <mesh
      rotation={[Math.PI / 2, Math.PI / 2, 0]}
      material={CHARM_BAIL_GOLD_MAT}
      renderOrder={RENDER_ORDER_RING_BASE + 7}
      userData={{ depthLayerOffset: 7 }}
    >
      <torusGeometry args={[ringR, ringTube, 12, 32]} />
    </mesh>
  );
}

function CharmThickPendantBody({ assets, charmDepth, position }) {
  if (!assets) {
    return null;
  }
  const { bodyGeo, bodyMat, faceMat, backFaceMat, W, H, offX, offY } = assets;
  const faceZ = charmDepth / 2 + 0.0006;

  return (
    <group position={position}>
      <mesh
        geometry={bodyGeo}
        material={bodyMat}
        castShadow
        receiveShadow
        renderOrder={RENDER_ORDER_RING_BASE + 14}
        userData={{ depthLayerOffset: 14 }}
      />
      <mesh
        material={faceMat}
        position={[-offX, -offY, faceZ]}
        renderOrder={RENDER_ORDER_RING_BASE + 16}
        userData={{ depthLayerOffset: 16 }}
      >
        <planeGeometry args={[W, H]} />
      </mesh>
      <mesh
        material={backFaceMat}
        position={[-offX, -offY, -faceZ]}
        rotation={[0, Math.PI, 0]}
        renderOrder={RENDER_ORDER_RING_BASE + 15}
        userData={{ depthLayerOffset: 15 }}
      >
        <planeGeometry args={[W, H]} />
      </mesh>
    </group>
  );
}

/** Extruded charm (bracelet-style thickness) at the gap — same layout as 2D bail + pendant. */
function CharmFlatVisual({ item, charmIndex, ringItems }) {
  const imageUrl = item.asset?.image;
  const pendant = getCharmPendantLayout(item);
  const img = pendant.charmImage;
  const h = img.height * WORLD_PER_PX;
  const charmDepth = resolveBeadsCharmExtrudeDepth(h);
  const assets = useThickCharmAssets(imageUrl, h, charmDepth, "#b5b5b5");
  const hardwareDeg = pendant.hardwareRotationDeg ?? item.hardwareRotation ?? item.rotation ?? 0;
  const [attachX, attachZ] = getCharmAttachWorldXZ(item, ringItems);
  // Elastic band moves the charm along the ring — turn its 2D hardware angle by the same amount.
  const elasticYawDelta = item.elastic3dPos
    ? Math.atan2(attachX, attachZ) -
      Math.atan2((item.x - CENTER_X) * WORLD_PER_PX, -(item.y - CENTER_Y) * WORLD_PER_PX)
    : 0;
  const charmOrientQuat = useMemo(() => {
    const quat = getCharmHardwareQuaternion(hardwareDeg);
    if (elasticYawDelta) {
      quat.premultiply(new THREE.Quaternion().setFromAxisAngle(_spacerUp, elasticYawDelta));
    }
    _charmOutwardScratch.set(attachX, 0, attachZ);
    if (_charmOutwardScratch.lengthSq() > 1e-10) {
      _charmOutwardScratch.applyQuaternion(_charmInverseQuatScratch.copy(quat).invert());
      // Rotating about local +X by φ sends the hanging direction (−Y) to (0, −cos φ, −sin φ).
      const tilt = _charmOutwardScratch.z >= 0 ? -CHARM_OUTWARD_TILT_RAD : CHARM_OUTWARD_TILT_RAD;
      quat.multiply(new THREE.Quaternion().setFromAxisAngle(_charmTiltAxis, tilt));
    }
    return quat;
  }, [hardwareDeg, elasticYawDelta, attachX, attachZ]);
  const stringJumpRing = pendant.stringJumpRing;
  const bailCx = (stringJumpRing?.cx ?? 0) * WORLD_PER_PX;
  const bailCy = (stringJumpRing?.cy ?? 0) * WORLD_PER_PX;
  const bailXPx = item.asset?.bailX ?? 0.5;
  const bailYPx = item.asset?.bailY3d ?? item.asset?.bailY ?? CHARM_BAIL_ANCHOR_RATIO;
  const charmCenterY_px = img.y + img.height / 2;
  const charmHookY_px = img.y + img.height * bailYPx;
  const charmHookX_px = img.x + img.width * bailXPx;
  const charmCenterX_px = img.x + img.width / 2;
  const pendantCenterX = charmCenterX_px * WORLD_PER_PX;
  let pendantPosY = -charmCenterY_px * WORLD_PER_PX;
  let hookThreeY = pendantPosY;
  let hookPivotX = bailCx;
  if (stringJumpRing) {
    const hookCenterY_px =
      (stringJumpRing.cy ?? 0) +
      (stringJumpRing.ry ?? 4) *
        CHARM_BAIL_3D_SIZE_BOOST *
        (1 + CHARM_BAIL_HOOK_DROP_RATIO);
    hookThreeY = -hookCenterY_px * WORLD_PER_PX;
    hookPivotX = charmHookX_px * WORLD_PER_PX;
    pendantPosY = hookThreeY - (charmCenterY_px - charmHookY_px) * WORLD_PER_PX;
  }
  const centerOffsetX = pendantCenterX - hookPivotX;
  const centerOffsetY = pendantPosY - hookThreeY;

  if (!imageUrl) {
    return null;
  }

  return (
    <group position={[attachX, STRING_Y_OFFSET, attachZ]} quaternion={charmOrientQuat}>
      <DepthSortApplicator index={charmIndex} kind="charm">
        {stringJumpRing ? (
          <group position={[bailCx, -bailCy, 0]}>
            <CharmStringBail3D jumpRing={stringJumpRing} />
          </group>
        ) : null}
        {stringJumpRing ? (
          <group position={[hookPivotX, hookThreeY, 0]}>
            <group position={[centerOffsetX, centerOffsetY, 0]}>
              <CharmThickPendantBody assets={assets} charmDepth={charmDepth} position={[0, 0, 0]} />
            </group>
          </group>
        ) : (
          <group position={[pendantCenterX, pendantPosY, 0]}>
            <CharmThickPendantBody assets={assets} charmDepth={charmDepth} position={[0, 0, 0]} />
          </group>
        )}
      </DepthSortApplicator>
    </group>
  );
}

function BeadOnRing({
  item,
  ringIndex,
  ringItems,
  charmGaps,
  selectedBead,
  selectedSeparator,
  beadPrototype,
}) {
  const { diameter, width, height } = ringItemToTransform(item);
  const [posX, posZ] = getRingMeshWorldXZ(item, ringIndex, ringItems, charmGaps);
  const imageUrl = resolveRingItemImageUrl(item, selectedBead, selectedSeparator);
  const isSpacer = item.type === "spacer";
  const stringQuat = useMemo(() => getItemOnStringQuaternion(posX, posZ), [posX, posZ]);
  const spacerKey =
    item.assetKey ?? item.asset?.key ?? selectedSeparator?.key ?? "s2";
  const spacerModelUrl = resolveSpacer3DModelUrl(spacerKey);

  return (
    <group position={[posX, 0, posZ]}>
      <DepthSortApplicator index={ringIndex} kind="ring">
        {isSpacer ? (
          <SpacerOnRing
            worldX={posX}
            worldZ={posZ}
            width={width}
            height={height}
            modelUrl={spacerModelUrl}
            imageUrl={imageUrl}
            assetKey={spacerKey}
          />
        ) : (
          <group quaternion={stringQuat}>
            <GlassBeadVisual
              diameter={diameter}
              imageUrl={imageUrl}
              beadPrototype={beadPrototype}
            />
          </group>
        )}
      </DepthSortApplicator>
    </group>
  );
}

function BeadsRingScene({ active = true }) {
  const { selectedBead, selectedSeparator, pattern, isManualMode, isStringFull } =
    useBeedsContext();
  const beadPrototype = useGlassBeadPrototype();
  const { items: displayItems, stringRadiusPx: layoutStringRadiusPx } = useBeadsSettledLayout();
  const spacerMetrics = useSpacerModelMetrics();
  useEffect(() => {
    const urls = new Set();
    pattern.forEach((item) => {
      if (item?.type !== "spacer") {
        return;
      }
      const key = item.assetKey ?? item.asset?.key ?? selectedSeparator?.key;
      if (key) {
        urls.add(resolveSpacer3DModelUrl(key));
      }
    });
    urls.forEach((url) => useGLTF.preload(url));
  }, [pattern, selectedSeparator]);
  const ringYawRef = useRef(0);
  const [ringYawDeg, setRingYawDeg] = useState(0);
  usePreviewFocusRingRotation({
    settledItems: displayItems,
    pattern,
    rotationDeg: ringYawDeg,
    setRotationDeg: setRingYawDeg,
    rotationRef: ringYawRef,
    frontAngleDeg: PREVIEW_FOCUS_FRONT_ANGLE_DEG_3D,
    suppressFocus: true,
  });
  const layoutRingItems = useMemo(
    () => displayItems.filter((item) => item.type === "bead" || item.type === "spacer"),
    [displayItems]
  );
  const layoutCharmItems = useMemo(
    () => displayItems.filter((item) => item.type === "charm"),
    [displayItems]
  );
  // 2D keeps the slack of the chosen string length; 360° contracts to a tight elastic band once
  // there are enough pieces — a few beads stay on the full-length cord like in 2D.
  const elasticBand = useMemo(
    () =>
      layoutRingItems.length >= ELASTIC_BAND_3D_MIN_RING_ITEMS
        ? computeElasticBand3dLayout({
            ringItems: layoutRingItems,
            charmItems: layoutCharmItems,
            spacerMetrics,
            selectedSeparator,
            selectedBead,
          })
        : null,
    [layoutRingItems, layoutCharmItems, spacerMetrics, selectedSeparator, selectedBead]
  );
  const ringItems = useMemo(
    () =>
      elasticBand
        ? layoutRingItems.map((item, index) => ({
            ...item,
            elastic3dPos: elasticBand.ringPositions[index],
          }))
        : layoutRingItems,
    [layoutRingItems, elasticBand]
  );
  const charmItems = useMemo(
    () =>
      elasticBand
        ? layoutCharmItems.map((item, index) => ({
            ...item,
            elastic3dPos: elasticBand.charmPositions[index],
          }))
        : layoutCharmItems,
    [layoutCharmItems, elasticBand]
  );
  const stringRadiusPx = elasticBand
    ? elasticBand.radius / (WORLD_PER_PX * RING_3D_POSITION_SNUG)
    : layoutStringRadiusPx;
  const charmGaps = useMemo(
    () => getCharmOccupiedRingGaps(charmItems, ringItems.length),
    [charmItems, ringItems.length]
  );
  const ringTiltX = BEADS_3D_RING_TILT_X;
  const ringYawRad = THREE.MathUtils.degToRad(ringYawDeg);
  const { camera } = useThree();
  const controlsRef = useRef(null);

  const [orbitLimits, setOrbitLimits] = useState(() =>
    getBeads3DOrbitLimits(stringRadiusPx, false)
  );
  const orbitBaseLimitsRef = useRef(orbitLimits);

  useLayoutEffect(() => {
    const applyFraming = () => {
      const mobile = typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches;
      const aspect = camera.aspect > 0 ? camera.aspect : 1.2;
      const limits = getBeads3DOrbitLimits(stringRadiusPx, mobile, aspect);
      orbitBaseLimitsRef.current = limits;
      setOrbitLimits(limits);
      camera.position.copy(getBeads3DCameraPosition(stringRadiusPx, mobile, aspect));
      camera.updateProjectionMatrix();
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    };
    applyFraming();
    const mq = typeof window !== "undefined" ? window.matchMedia("(max-width: 900px)") : null;
    mq?.addEventListener("change", applyFraming);
    window.addEventListener("resize", applyFraming);
    return () => {
      mq?.removeEventListener("change", applyFraming);
      window.removeEventListener("resize", applyFraming);
    };
  }, [camera, stringRadiusPx]);

  const setOrbitMinDistance = useCallback((value) => {
    setOrbitLimits((prev) => ({
      ...prev,
      min: value == null ? orbitBaseLimitsRef.current.min : value,
    }));
  }, []);

  usePreviewFocusSpacerZoom({
    controlsRef,
    settledItems: displayItems,
    pattern,
    ringItems,
    stringRadiusPx,
    setOrbitMinDistance,
  });
  const sortRootRef = useRef(null);
  const sortablesRef = useRef([]);
  const sortSignatureRef = useRef("");
  const sortRefreshRef = useRef(0);
  const gl = useThree((state) => state.gl);
  const setDpr = useThree((state) => state.setDpr);
  const restingDprRef = useRef(1);

  useEffect(() => {
    restingDprRef.current = Math.min(window.devicePixelRatio || 1, 1.5);
    setDpr(restingDprRef.current);
  }, [setDpr]);

  const userOrbitRef = useRef(false);

  const onOrbitStart = useCallback(() => {
    userOrbitRef.current = true;
    setDpr(1);
  }, [setDpr]);

  const onOrbitEnd = useCallback(() => {
    userOrbitRef.current = false;
    setDpr(restingDprRef.current);
    gl.shadowMap.needsUpdate = true;
  }, [gl, setDpr]);

  // OrbitControls auto-rotate advances once per frame, so a lighter bracelet
  // (Full Bead) on a high refresh rate spins faster than a heavier style.
  // One revolution every 12s, whatever the frame rate.
  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!active || !controls || userOrbitRef.current) {
      return;
    }
    const step = ((2 * Math.PI) / 60) * 5 * Math.min(delta, 0.05);
    controls.setAzimuthalAngle(controls.getAzimuthalAngle() - step);
  });

  useFrame(() => {
    const root = sortRootRef.current;
    if (!root) {
      return;
    }
    const { ringBases, charmBases } = computeBraceletDepthBases(
      ringItems,
      charmItems,
      ringTiltX,
      ringYawRad,
      camera,
      charmGaps
    );
    sortRefreshRef.current += 1;
    const signature = `${ringItems.length}:${charmItems.length}`;
    if (sortSignatureRef.current !== signature || sortRefreshRef.current < 90) {
      gl.shadowMap.needsUpdate = true;
    }
    if (sortSignatureRef.current !== signature || sortRefreshRef.current % 45 === 0) {
      const sortables = [];
      root.traverse((obj) => {
        const layer = obj.userData?.depthLayerOffset;
        if (layer == null) {
          return;
        }
        let node = obj.parent;
        let sortIndex = null;
        let sortKind = "ring";
        while (node) {
          if (node.userData?.depthSortIndex != null) {
            sortIndex = node.userData.depthSortIndex;
            sortKind = node.userData.depthSortKind || "ring";
            break;
          }
          node = node.parent;
        }
        if (sortIndex == null) {
          return;
        }
        sortables.push({ obj, layer, sortIndex, sortKind });
      });
      sortablesRef.current = sortables;
      sortSignatureRef.current = signature;
    }
    const sortables = sortablesRef.current;
    for (let index = 0; index < sortables.length; index += 1) {
      const entry = sortables[index];
      const bases = entry.sortKind === "charm" ? charmBases : ringBases;
      entry.obj.renderOrder = (bases[entry.sortIndex] ?? RENDER_ORDER_RING_BASE) + entry.layer;
    }
  }, -1);
  return (
    <>
      <group ref={sortRootRef} rotation={[ringTiltX, ringYawRad, 0]}>
        <BraceletCordLayer
          ringItems={ringItems}
          stringRadiusPx={stringRadiusPx}
          beadPrototype={beadPrototype}
          isManualMode={isManualMode}
          isStringFull={elasticBand ? true : isStringFull}
          charmGaps={charmGaps}
          elasticRadiusWorld={elasticBand?.radius ?? null}
        />
        {ringItems.map((item, index) => (
          <BeadOnRing
            key={item.id ?? `ring-${index}`}
            item={item}
            ringIndex={index}
            ringItems={ringItems}
            charmGaps={charmGaps}
            beadPrototype={beadPrototype}
            selectedBead={selectedBead}
            selectedSeparator={selectedSeparator}
          />
        ))}
        {charmItems.map((item, index) => (
          <Suspense key={item.id ?? `charm-${index}`} fallback={null}>
            <CharmFlatVisual
              item={item}
              charmIndex={index}
              ringItems={ringItems}
            />
          </Suspense>
        ))}
      </group>
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom
        enableDamping
        dampingFactor={0.12}
        minDistance={orbitLimits.min}
        maxDistance={orbitLimits.max}
        zoomSpeed={BEADS_3D_ORBIT_ZOOM_SPEED}
        onStart={onOrbitStart}
        onEnd={onOrbitEnd}
        makeDefault
      />
    </>
  );
}

export default function BeadsPreview3D({ active = true }) {
  return (
    <div
      className="beads-3d-preview beads-3d-preview--view-only"
      aria-label="Bead bracelet 3D preview"
      aria-hidden={active ? undefined : true}
    >
      <Canvas
        shadows
        dpr={[1, 1.5]}
        frameloop={active ? "always" : "demand"}
        camera={{ position: [0.01, 7.2, 0.37], fov: BEADS_3D_CAMERA_FOV, near: 0.2, far: 80 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
        }}
      >
        <PreviewRenderSettings />
        <color attach="background" args={["#f0f0ee"]} />
        <ambientLight intensity={0.48} />
        <directionalLight
          position={[5, 9, 5]}
          intensity={0.78}
          color="#fff6e8"
          castShadow
          shadow-mapSize={[256, 256]}
        />
        <directionalLight position={[-6, 4, -4]} intensity={0.32} color="#e8ecf4" />
        <directionalLight position={[0, 2, 8]} intensity={0.18} color="#ffffff" />
        <Suspense fallback={null}>
          <Environment preset="studio" environmentIntensity={0.52} />
        </Suspense>
        <BeadsRingScene active={active} />
      </Canvas>
    </div>
  );
}
