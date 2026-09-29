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
  SPACER_GLB_URLS,
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
/** S1–S3 base tint — avoid pure white (reads flat on small pavé). */
const SPACER_DIAMOND_COLOR = "#e8eef6";
const SPACER_FALLBACK_METAL = RING_METAL_COLORS.yellow;
const SPACER_3D_SIZE_BOOST = 1.45;
const SPACER_3D_VISUAL_SCALE = 1;
/** Brighter studio reflections on spacer metal (GLB wheels + textured bands). */
const SPACER_METAL_ENV_INTENSITY = 1.34;
const SPACER_METAL_TEX_ENV_INTENSITY = 1.52;
/** Slightly lift pavé / crystal stones on spacers. */
const SPACER_GEM_ENV_BOOST = 1.12;
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
/** S10–S14 crystal — soften env/specular vs other spacer gems. */
const GLASS_WHEEL_LIGHT_SCALE = 0.78;

function resolveSpacerAssetKey(item) {
  return item?.assetKey ?? item?.asset?.key ?? null;
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
/** Match 2D `BEAD_ART_FILL_RATIO` for string endpoints. */
const BEAD_LAYOUT_CONTACT_RATIO = 0.76;
/** Extend spacer bore tubes slightly so cord meets the wheel mesh in bead–spacer gaps. */
const STRING_MESH_OVERLAP = 1.32;
/**
 * Beads: trim each arc endpoint to the glass shell (no overlap into the sphere).
 * Cord still runs bead-to-bead in the gaps only; the segment through the bore is not meshed.
 */
const BEAD_STRING_SHELL_TRIM = 1;
/** Extra angular padding so gap cord stays out of the bead silhouette. */
const BEAD_CORD_ARC_ANGLE_PAD = 0.1;
/** Pull gap arcs slightly inward (toward ring center) so transmission glass picks up less cord. */
const BEAD_CORD_RADIUS_INSET_RATIO = 0.24;
/** Bead–bead cord is inside the bore only — no gap mesh (avoids the “line across” the stone). */
const SKIP_BEAD_TO_BEAD_GAP_CORD = true;
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
/** glass-bead.glb bore (+Y) → string along parent +X after `getItemOnStringQuaternion`. */
const GLASS_BEAD_BORE_ROTATION = [Math.PI / 2, 0, 0];
/** Storefront gem disc inside the glass (faces camera for a 3D read through the shell). */
const BEAD_GEM_FACE_RADIUS_RATIO = 0.63;
const GLASS_BEAD_SHELL_SCALE = 0.98;
/** Cord vs bead jewelry — separate layers; WebP/glass materials stay independent. */
const RENDER_ORDER_BRACELET_CORD = 1;
/** Back-to-front painter order for ring + charms (updated from camera depth each frame). */
const RENDER_ORDER_RING_BASE = 10;
const RENDER_ORDER_RING_STRIDE = 8;
const RENDER_ORDER_BEAD_GLASS_SHELL = 5;
const RENDER_ORDER_BEAD_GEM_FACE = 7;
const _depthEuler = new THREE.Euler();
const _depthScratch = new THREE.Vector3();
const BRACELET_CORD_MAT = new THREE.MeshBasicMaterial({
  color: "#141414",
  toneMapped: false,
  depthWrite: true,
  depthTest: true,
});

const CHARM_BAIL_GOLD = "#d4af37";

const CHARM_BAIL_GOLD_MAT = new THREE.MeshStandardMaterial({
  color: CHARM_BAIL_GOLD,
  metalness: 0.93,
  roughness: 0.16,
});
/** 3D-only: slightly larger bail; hook Y uses same drop ratio as 2D layout. */
const CHARM_BAIL_3D_SIZE_BOOST = 1.36;
const CHARM_BAIL_ANCHOR_RATIO = 0.085;

/** Avoid near-plane slicing when charms / glass rotate edge-on to the camera. */
function PreviewRenderSettings() {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);

  useLayoutEffect(() => {
    camera.near = 0.01;
    camera.far = 300;
    camera.updateProjectionMatrix();
    gl.sortObjects = true;
    loadGemEnvTexture().catch(() => {});
  }, [camera, gl]);

  return null;
}

useGLTF.preload(GLASS_BEAD_GLB);
SPACER_GLB_URLS.forEach((url) => useGLTF.preload(url));

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

function getCordArcInsetRadius(entry) {
  if (entry.item.type === "bead") {
    return entry.tr.diameter * 0.5 * GLASS_BEAD_SHELL_SCALE * BEAD_CORD_RADIUS_INSET_RATIO;
  }
  const profile = spacerUsesScene81Band(entry.item) ? SCENE81_PROFILE_SCALE : 1;
  return (
    entry.tr.width *
    0.5 *
    SPACER_3D_SIZE_BOOST *
    GLASS_BEAD_SHELL_SCALE *
    BEAD_CORD_RADIUS_INSET_RATIO *
    0.65 *
    profile
  );
}

function getCordArcRadius(current, next) {
  const avg = (current.ringDist + next.ringDist) * 0.5;
  const inset = Math.max(getCordArcInsetRadius(current), getCordArcInsetRadius(next));
  return Math.max(avg - inset, avg * 0.9);
}

function getRingMeshWorldXZ(item, ringIndex, ringItems) {
  const { x, z } = ringItemToTransform(item);
  let [posX, posZ] = snugRingPosition(x, z);
  return applyBeadSpacerMeshNudge(posX, posZ, item, ringIndex, ringItems);
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

function applyBeadSpacerMeshNudge(posX, posZ, item, ringIndex, ringItems) {
  const count = ringItems.length;
  if (count < 2) {
    return [posX, posZ];
  }
  const prev = ringItems[(ringIndex - 1 + count) % count];
  const next = ringItems[(ringIndex + 1) % count];
  const isBeadSpacerPair = (a, b) =>
    (a?.type === "bead" && b?.type === "spacer") || (a?.type === "spacer" && b?.type === "bead");
  const isSpacerSpacerPair = (a, b) => a?.type === "spacer" && b?.type === "spacer";
  const scene81Spacer = item.type === "spacer" && spacerUsesScene81Band(item);
  const scene81Neighbor =
    item.type === "bead" &&
    (spacerUsesScene81Band(prev) || spacerUsesScene81Band(next));
  /** S7–S9: light snug like other spacers — avoid push-apart (shows bare cord). */
  const pull = scene81Spacer
    ? 0.14
    : scene81Neighbor
      ? 0.115
      : item.type === "spacer"
        ? 0.16
        : 0.12;
  const spacerSpacerPull = scene81Spacer ? 0.09 : 0.1;
  let px = posX;
  let pz = posZ;
  const step = (item.width ?? 26) * WORLD_PER_PX * pull;
  const spacerStep = (item.width ?? 26) * WORLD_PER_PX * spacerSpacerPull;
  if (isBeadSpacerPair(item, prev)) {
    [px, pz] = nudgeTowardRingNeighbor(px, pz, prev, step);
  }
  if (isBeadSpacerPair(item, next)) {
    [px, pz] = nudgeTowardRingNeighbor(px, pz, next, step);
  }
  if (isSpacerSpacerPair(item, prev)) {
    [px, pz] = nudgeTowardRingNeighbor(px, pz, prev, spacerStep);
  }
  if (isSpacerSpacerPair(item, next)) {
    [px, pz] = nudgeTowardRingNeighbor(px, pz, next, spacerStep);
  }
  return [px, pz];
}

/** Same anchor as 2D `translate(item.x, item.y)` on the snugged string ring. */
function getCharmAttachWorldXZ(charmItem) {
  const attachX = (charmItem.x - CENTER_X) * WORLD_PER_PX;
  const attachZ = -(charmItem.y - CENTER_Y) * WORLD_PER_PX;
  return snugRingPosition(attachX, attachZ);
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
  return texture;
}

function createGlassShellMaterial(hasGemTexture) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(hasGemTexture ? "#f3e8ff" : "#ffffff"),
    transmission: hasGemTexture ? 0.62 : 0.5,
    thickness: 0.22,
    roughness: 0.04,
    ior: 1.5,
    transparent: true,
    depthWrite: false,
    envMapIntensity: hasGemTexture ? 0.38 : 0.7,
    clearcoat: 0.75,
    clearcoatRoughness: 0.08,
    attenuationColor: new THREE.Color(hasGemTexture ? "#9333ea" : "#ffffff"),
    attenuationDistance: hasGemTexture ? 1.35 : 2.4,
  });
}

function beadGemFaceRadius(diameter) {
  return diameter * BEAD_GEM_FACE_RADIUS_RATIO * GLASS_BEAD_SHELL_SCALE;
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

function computeBraceletDepthBases(ringItems, charmItems, ringTiltX, ringYawRad, camera) {
  const entries = [];

  ringItems.forEach((item, ringIndex) => {
    const [posX, posZ] = getRingMeshWorldXZ(item, ringIndex, ringItems);
    entries.push({
      kind: "ring",
      index: ringIndex,
      viewZ: getRingLocalViewSpaceZ(posX, 0, posZ, ringTiltX, ringYawRad, camera),
    });
  });

  charmItems.forEach((item, charmIndex) => {
    const [posX, posZ] = getCharmAttachWorldXZ(item);
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

/** Applies per-frame painter order from shared depth bases (camera + ring yaw). */
function DepthSortApplicator({ basesRef, index, children }) {
  const rootRef = useRef(null);
  useFrame(() => {
    const bases = basesRef.current;
    if (!bases || index < 0 || index >= bases.length) {
      return;
    }
    const base = bases[index] ?? RENDER_ORDER_RING_BASE;
    const root = rootRef.current;
    if (!root) {
      return;
    }
    root.traverse((obj) => {
      const layer = obj.userData?.depthLayerOffset;
      if (layer != null) {
        obj.renderOrder = base + layer;
      }
    });
  });
  return <group ref={rootRef}>{children}</group>;
}

function GlassBeadMesh({ prototype, diameter, imageUrl }) {
  const hasGemTexture = Boolean(imageUrl);
  const scale = (diameter / prototype.maxDim) * GLASS_BEAD_SHELL_SCALE;
  const material = useMemo(
    () => createGlassShellMaterial(hasGemTexture),
    [hasGemTexture]
  );

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

function BeadGemFaceTextured({ diameter, imageUrl }) {
  const radius = beadGemFaceRadius(diameter);
  const texture = useBeadArtTexture(imageUrl);

  return (
    <Billboard follow renderOrder={RENDER_ORDER_RING_BASE + RENDER_ORDER_BEAD_GEM_FACE}>
      <mesh
        renderOrder={RENDER_ORDER_RING_BASE + RENDER_ORDER_BEAD_GEM_FACE}
        userData={{ depthLayerOffset: RENDER_ORDER_BEAD_GEM_FACE }}
      >
        <circleGeometry args={[radius, 56]} />
        <meshBasicMaterial
          map={texture}
          toneMapped={false}
          transparent
          opacity={1}
          alphaTest={0.04}
          depthWrite
          depthTest
        />
      </mesh>
    </Billboard>
  );
}

function BeadGemFaceTint({ diameter, tint }) {
  const radius = beadGemFaceRadius(diameter);

  return (
    <Billboard follow renderOrder={RENDER_ORDER_RING_BASE + RENDER_ORDER_BEAD_GEM_FACE}>
      <mesh
        renderOrder={RENDER_ORDER_RING_BASE + RENDER_ORDER_BEAD_GEM_FACE}
        userData={{ depthLayerOffset: RENDER_ORDER_BEAD_GEM_FACE }}
      >
        <circleGeometry args={[radius, 56]} />
        <meshBasicMaterial color={tint} toneMapped={false} />
      </mesh>
    </Billboard>
  );
}

function BeadGemFace({ diameter, imageUrl, tint = "#a855f7" }) {
  if (imageUrl) {
    return <BeadGemFaceTextured diameter={diameter} imageUrl={imageUrl} />;
  }
  return <BeadGemFaceTint diameter={diameter} tint={tint} />;
}

function GlassBeadVisual({ diameter, imageUrl, tint, beadPrototype }) {
  if (!beadPrototype.geometry) {
    return null;
  }

  return (
    <>
      <GlassBeadMesh prototype={beadPrototype} diameter={diameter} imageUrl={imageUrl} />
      <Suspense fallback={<BeadGemFaceTint diameter={diameter} tint={tint} />}>
        <BeadGemFace diameter={diameter} imageUrl={imageUrl} tint={tint} />
      </Suspense>
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

function buildRingStringEntry(item, ringIndex, ringItems, maxDim, manualPartial) {
  const tr = ringItemToTransform(item);
  const [posX, posZ] = getRingMeshWorldXZ(item, ringIndex, ringItems);
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

function computeGapArcAngles(current, next, manualPartial) {
  if (manualPartial) {
    const low = current.angle <= next.angle ? current : next;
    const high = current.angle <= next.angle ? next : current;
    const centerSpan = high.angle - low.angle;
    if (centerSpan <= 1e-5) {
      return null;
    }
    const maxTrim = centerSpan * 0.42;
    let startAngle = low.angle + Math.min(low.halfAngle, maxTrim);
    let endAngle = high.angle - Math.min(high.halfAngle, maxTrim);
    if (endAngle - startAngle < 0.012) {
      const mid = (low.angle + high.angle) * 0.5;
      const half = Math.max(centerSpan * 0.14, 0.006);
      startAngle = mid - half;
      endAngle = mid + half;
    }
    return { startAngle, endAngle };
  }

  let centerSpan = next.angle - current.angle;
  if (centerSpan <= 0) {
    centerSpan += Math.PI * 2;
  }
  if (centerSpan <= 1e-5) {
    return null;
  }
  const maxTrim = centerSpan * 0.42;
  let startAngle = current.angle + Math.min(current.halfAngle, maxTrim);
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
  { isManualMode = false, isStringFull = true, stringRadiusPx = 0 } = {}
) {
  if (!ringItems.length) {
    return { tube: 0.004, arcs: [] };
  }

  const maxDim = beadPrototype?.maxDim > 0 ? beadPrototype.maxDim : 1;
  const manualPartial = isManualMode && !isStringFull;
  const skipBeadToBeadGap = SKIP_BEAD_TO_BEAD_GAP_CORD && !manualPartial;

  let ringDistSum = 0;
  ringItems.forEach((item) => {
    ringDistSum += ringItemToTransform(item).radius;
  });
  const avgRingDist = ringDistSum / ringItems.length;
  const tube = getBraceletCordTubeRadius(avgRingDist);

  const entriesInPatternOrder = ringItems.map((item, ringIndex) =>
    buildRingStringEntry(item, ringIndex, ringItems, maxDim, manualPartial)
  );
  const sortedEntries = [...entriesInPatternOrder].sort((a, b) => a.angle - b.angle);

  const arcPairs = manualPartial
    ? entriesInPatternOrder
        .slice(0, -1)
        .map((current, index) => [current, entriesInPatternOrder[index + 1]])
    : sortedEntries.map((current, index) => [
        current,
        sortedEntries[(index + 1) % sortedEntries.length],
      ]);

  const arcs = [];
  for (const [current, next] of arcPairs) {
    if (current.item.type === "spacer" && next.item.type === "spacer") {
      continue;
    }
    if (skipBeadToBeadGap && current.item.type === "bead" && next.item.type === "bead") {
      continue;
    }
    const arcAngles = computeGapArcAngles(current, next, manualPartial);
    if (!arcAngles) {
      continue;
    }
    arcs.push({
      startAngle: arcAngles.startAngle,
      endAngle: arcAngles.endAngle,
      radius: getCordArcRadius(current, next),
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
function RingStringBaseline({ stringRadiusPx, tube }) {
  const worldRadius = stringRadiusPx * WORLD_PER_PX * RING_3D_POSITION_SNUG;
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
 * Cord mesh only (beads unchanged).
 * - Full circle: empty ring, presets, and completed manual bracelets (like 2D string).
 * - Manual in progress: gap arcs only (never stack open-span + gap arcs — that draws two parallel cords).
 */
function getBraceletCordMeshVisibility(ringItems, isManualMode, isStringFull, arcCount) {
  if (ringItems.length === 0) {
    return { showFullBaseline: true, showGapArcs: false, showPartialOpenArc: false };
  }
  const manualPartial = isManualMode && !isStringFull;
  if (manualPartial) {
    const hasGapArcs = arcCount > 0;
    return {
      showFullBaseline: false,
      showGapArcs: hasGapArcs,
      showPartialOpenArc: !hasGapArcs,
    };
  }
  return { showFullBaseline: true, showGapArcs: false, showPartialOpenArc: false };
}

function BraceletCordLayer({
  ringItems,
  stringRadiusPx,
  isStringFull,
  isManualMode,
  beadPrototype,
}) {
  const layout = useMemo(
    () =>
      buildRingStringLayout(ringItems, beadPrototype, {
        isManualMode,
        isStringFull,
        stringRadiusPx,
      }),
    [ringItems, beadPrototype, isManualMode, isStringFull, stringRadiusPx]
  );
  const tube =
    ringItems.length > 0
      ? layout.tube
      : getBraceletCordTubeRadius(stringRadiusPx * WORLD_PER_PX);
  const { showFullBaseline, showGapArcs, showPartialOpenArc } =
    getBraceletCordMeshVisibility(ringItems, isManualMode, isStringFull, layout.arcs.length);

  return (
    <group name="bracelet-cord-layer">
      {showFullBaseline ? (
        <RingStringBaseline stringRadiusPx={stringRadiusPx} tube={tube} />
      ) : null}
      {showPartialOpenArc && layout.partialOpenArc ? (
        <RingStringArc
          key="ring-partial-open"
          startAngle={layout.partialOpenArc.startAngle}
          endAngle={layout.partialOpenArc.endAngle}
          radius={layout.partialOpenArc.radius}
          tube={tube}
        />
      ) : null}
      {showGapArcs
        ? layout.arcs.map((arc, index) => (
            <RingStringArc
              key={`ring-arc-${index}`}
              startAngle={arc.startAngle}
              endAngle={arc.endAngle}
              radius={arc.radius}
              tube={tube}
            />
          ))
        : null}
    </group>
  );
}

function SpacerGlbLoadFallback({ width }) {
  const radius = getSpacer3DTargetSize(width) * 0.5;
  return (
    <mesh renderOrder={5}>
      <circleGeometry args={[radius, 24]} />
      <meshStandardMaterial
        color={SPACER_FALLBACK_METAL}
        metalness={0.92}
        roughness={0.16}
        envMapIntensity={1.2}
      />
    </mesh>
  );
}

function isSpacerDiamondPart(mesh, material) {
  const label = `${mesh.name} ${material?.name || ""}`.toLowerCase();
  if (
    /diamond|diamonds|crystal|hex-stone|hex_gem|pave|material_1|all-diamond|(^|[^a-z])gem([^a-z]|$)/i.test(
      label
    )
  ) {
    return true;
  }
  if (/gold|metal|band|body|rose|silver|halo/i.test(label)) {
    return false;
  }
  if (/torus/i.test(label)) {
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

/** S1–S6 only: mirror-polished 18K-style gold / white / rose on metal3.hdr. */
const STONE_WHEEL_LUXURY_METAL_COLOR = {
  yellowGold: "#FFD280",
  silver: RING_METAL_COLORS.white,
  roseGold: RING_METAL_COLORS.rose,
};

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
  const envIntensity = metalEnv ? JEWELRY_ENV_INTENSITY * 1.12 : SPACER_METAL_ENV_INTENSITY;

  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(ringColor),
    metalness: 1,
    roughness: 0.02,
    reflectivity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.012,
    envMap: metalEnv ?? null,
    envMapIntensity: envIntensity,
    specularIntensity: 1.28,
    specularColor: new THREE.Color(ringColor),
  });
}

/** S1–S3: clear glass diamond — high transmission, muted env (HDR gem map blows out if too hot). */
function createSpacerWhiteGlassDiamondMaterial(envMap) {
  const envIntensity = envMap ? 2.85 : 1.2;
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(SPACER_DIAMOND_COLOR),
    metalness: 0,
    roughness: 0.032,
    transmission: 0.97,
    thickness: 0.36,
    ior: GEM_REFRACTION_PARAMS.ior,
    envMap: envMap ?? null,
    envMapIntensity: envIntensity,
    clearcoat: 0.78,
    clearcoatRoughness: 0.07,
    specularIntensity: 0.95,
    specularColor: new THREE.Color("#b8c8de"),
    attenuationColor: new THREE.Color("#8fa4be"),
    attenuationDistance: 0.55,
    iridescence: 0.07,
    iridescenceIOR: 1.28,
    iridescenceThicknessRange: [120, 320],
    reflectivity: 0.82,
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
  return createSpacerWhiteGlassDiamondMaterial(envMap);
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
    envMapIntensity: (envMap ? 2.05 : 1.35) * SPACER_GEM_ENV_BOOST,
    clearcoat: 0.92,
    clearcoatRoughness: 0.055,
    specularIntensity: 0.82,
    specularColor: new THREE.Color("#6a7080"),
    attenuationColor: new THREE.Color("#000000"),
    attenuationDistance: 0.045,
    transparent: true,
    side: THREE.DoubleSide,
    toneMapped: false,
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
    emissiveIntensity: preset.bodyEmissiveIntensity ?? 0.05,
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

function createSpacerMetalMaterial({ metalMap = null, metalFinish = "yellowGold" } = {}) {
  const ringColor =
    toRingMetalColor(SPACER_METAL_FINISH_COLOR[metalFinish] ?? RING_METAL_COLORS.yellow);

  if (metalMap) {
    return new THREE.MeshPhysicalMaterial({
      map: metalMap,
      color: new THREE.Color("#ffffff"),
      metalness: 1,
      roughness: 0.11,
      clearcoat: RING_METAL.clearcoat,
      clearcoatRoughness: RING_METAL.clearcoatRoughness,
      envMapIntensity: SPACER_METAL_TEX_ENV_INTENSITY,
      specularIntensity: 1.08,
      specularColor: new THREE.Color(ringColor),
      reflectivity: 1,
    });
  }

  return new THREE.MeshPhysicalMaterial({
    ...RING_METAL,
    color: new THREE.Color(ringColor),
    envMapIntensity: SPACER_METAL_ENV_INTENSITY,
    clearcoatRoughness: 0.04,
    specularIntensity: 1.08,
    specularColor: new THREE.Color(ringColor),
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
    envMapIntensity: (envMap ? 1.85 : 1.25) * SPACER_GEM_ENV_BOOST,
    clearcoat: 0.9,
    clearcoatRoughness: 0.07,
    specularIntensity: 0.78,
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

/** S10–S14 glass-wheel-spacer.glb — high-transmission faceted crystal (not milky plain-wheel). */
function createGlassWheelFacetedCrystalMaterial(envMap, presetKey) {
  const preset = SPACER_CRYSTAL_GEM_PRESETS[presetKey] ?? SPACER_CRYSTAL_GEM_PRESETS.crystalSilver;
  const envBoost = preset.glassEnvBoost ?? 1.15;
  const light = GLASS_WHEEL_LIGHT_SCALE;
  const bodyColor = preset.glassColor ?? preset.color;
  const bodyAttenuation = preset.glassAttenuation ?? preset.attenuation;
  const bodySpecular = preset.glassSpecular ?? preset.specular;
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(bodyColor),
    metalness: 0,
    roughness: 0.012,
    transmission: preset.glassTransmission ?? 0.74,
    thickness: preset.glassThickness ?? 0.52,
    ior: 2.52,
    envMap: envMap ?? null,
    envMapIntensity:
      (envMap ? preset.envIntensity + envBoost : 4.4) * SPACER_GEM_ENV_BOOST * light,
    clearcoat: 0.92,
    clearcoatRoughness: 0.035,
    specularIntensity: 1.22 * light,
    specularColor: new THREE.Color(bodySpecular),
    attenuationColor: new THREE.Color(bodyAttenuation),
    attenuationDistance: preset.glassAttenuationDistance ?? 0.06,
    transparent: true,
    opacity: 1,
    reflectivity: 0.88,
    side: THREE.DoubleSide,
    toneMapped: false,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
}

/**
 * S10–S14 hex-wheel GLB: faceted crystal body (no WebP billboard) — matches S1–S6 pavé fire.
 */
function createHexWheelFacetedCrystalMaterial(envMap, presetKey) {
  const preset = SPACER_CRYSTAL_GEM_PRESETS[presetKey] ?? SPACER_CRYSTAL_GEM_PRESETS.crystalSilver;
  const envBoost = preset.hexEnvBoost ?? 0.85;
  const emissiveHex = preset.hexEmissive;
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(preset.color),
    metalness: 0,
    roughness: 0.014,
    transmission: preset.hexTransmission ?? 0.9,
    thickness: preset.hexThickness ?? 0.62,
    ior: 2.42,
    envMap: envMap ?? null,
    envMapIntensity: (envMap ? preset.envIntensity + envBoost : 3.6) * SPACER_GEM_ENV_BOOST,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    specularIntensity: 1.32,
    specularColor: new THREE.Color(preset.specular),
    attenuationColor: new THREE.Color(preset.attenuation),
    attenuationDistance: preset.hexAttenuationDistance ?? 0.11,
    emissive: emissiveHex ? new THREE.Color(emissiveHex) : new THREE.Color("#000000"),
    emissiveIntensity: preset.hexEmissiveIntensity ?? 0,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide,
    toneMapped: false,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
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
          child.geometry.computeVertexNormals();
        }
        child.material = createStoneWheelBrilliantDiamond(gemEnv, "white");
        child.renderOrder = RENDER_ORDER_RING_BASE + 6;
        child.userData.depthLayerOffset = 6;
        return;
      }
      child.material = metalEnv
        ? createStoneWheelLuxuryMetalMaterial(metalFinish, metalEnv)
        : createSpacerMetalMaterial({ metalMap: null, metalFinish });
      child.renderOrder = RENDER_ORDER_RING_BASE + 5;
      child.userData.depthLayerOffset = 5;
      return;
    }

    if (glassWheelFacetedCrystal) {
      const crystalMat = createGlassWheelFacetedCrystalMaterial(gemEnv, diamondVariant);
      if (child.geometry) {
        child.geometry.computeVertexNormals();
      }
      child.material = crystalMat;
      child.renderOrder = RENDER_ORDER_RING_BASE + 6;
      child.userData.depthLayerOffset = 6;
      return;
    }

    if (plainWheelColoredCrystal) {
      const crystalMat = createStoneWheelBrilliantColoredCrystal(gemEnv, diamondVariant);
      if (child.geometry) {
        child.geometry.computeVertexNormals();
      }
      child.material = crystalMat;
      child.renderOrder = RENDER_ORDER_RING_BASE + 6;
      child.userData.depthLayerOffset = 6;
      return;
    }

    if (isHexWheel || isSpacerDiamondPart(child, sourceMat)) {
      let gemMat;
      if (stoneWheelLuxury && !isHexWheel) {
        gemMat = createStoneWheelBrilliantDiamond(gemEnv, diamondVariant);
      } else if (isHexWheel && !hexGemMap) {
        gemMat = createHexWheelFacetedCrystalMaterial(gemEnv, diamondVariant);
      } else {
        gemMat = createSpacerDiamondMaterial(gemEnv, diamondVariant, isHexWheel ? hexGemMap : null);
      }
      if (child.geometry) {
        child.geometry.computeVertexNormals();
      }
      child.material = gemMat;
      child.renderOrder = RENDER_ORDER_RING_BASE + 6;
      child.userData.depthLayerOffset = 6;
      return;
    }

    child.material =
      stoneWheelLuxury && !metalMap
        ? createStoneWheelLuxuryMetalMaterial(metalFinish, metalEnv)
        : createSpacerMetalMaterial({ metalMap, metalFinish });
    child.renderOrder = RENDER_ORDER_RING_BASE + 5;
    child.userData.depthLayerOffset = 5;
  });

  return model;
}

function useSpacerPrototype(modelUrl) {
  const { scene } = useGLTF(modelUrl);
  return useMemo(() => {
    const model = scene.clone(true);
    model.traverse((child) => {
      if (!child.isMesh) {
        return;
      }
      child.castShadow = true;
      child.receiveShadow = true;
    });
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.position.sub(center);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 1e-4);
    return { model, maxDim };
  }, [scene]);
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
  const model = useMemo(
    () =>
      buildSpacerModelWithMaterials(source, gemEnv, {
        metalMap,
        metalFinish,
        diamondVariant,
        isHexWheel,
        hexGemMap,
        stoneWheelLuxury,
        metalEnv: stoneWheelLuxury || scene81MetalBand ? metalEnv : null,
        plainWheelColoredCrystal,
        glassWheelFacetedCrystal,
        scene81MetalBand,
      }),
    [
      source,
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
    ]
  );

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
function CharmStringBail3D({ jumpRing }) {
  const ringR = (jumpRing.ry ?? 4) * WORLD_PER_PX * CHARM_BAIL_3D_SIZE_BOOST;
  const ringTube = Math.max(
    (jumpRing.rx ?? 1) * WORLD_PER_PX * 0.92 * CHARM_BAIL_3D_SIZE_BOOST,
    0.007
  );

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

function CharmThickPendantBody({ imageUrl, charmHeight, charmDepth, position }) {
  const assets = useThickCharmAssets(imageUrl, charmHeight, charmDepth, "#b5b5b5");
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
function CharmFlatVisual({ item, charmIndex, charmBasesRef }) {
  const imageUrl = item.asset?.image;
  if (!imageUrl) {
    return null;
  }
  const pendant = getCharmPendantLayout(item);
  const img = pendant.charmImage;
  const h = img.height * WORLD_PER_PX;
  const charmDepth = resolveBeadsCharmExtrudeDepth(h);
  const hardwareDeg = pendant.hardwareRotationDeg ?? item.hardwareRotation ?? item.rotation ?? 0;
  const [attachX, attachZ] = getCharmAttachWorldXZ(item);
  const charmOrientQuat = useMemo(
    () => getCharmHardwareQuaternion(hardwareDeg),
    [hardwareDeg]
  );
  const stringJumpRing = pendant.stringJumpRing;
  const bailCx = (stringJumpRing?.cx ?? 0) * WORLD_PER_PX;
  const bailCy = (stringJumpRing?.cy ?? 0) * WORLD_PER_PX;
  const bailXPx = item.asset?.bailX ?? 0.5;
  const bailYPx = item.asset?.bailY ?? CHARM_BAIL_ANCHOR_RATIO;
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

  return (
    <group position={[attachX, STRING_Y_OFFSET, attachZ]} quaternion={charmOrientQuat}>
      <DepthSortApplicator basesRef={charmBasesRef} index={charmIndex}>
        {stringJumpRing ? (
          <group position={[bailCx, -bailCy, 0]}>
            <CharmStringBail3D jumpRing={stringJumpRing} />
          </group>
        ) : null}
        {stringJumpRing ? (
          <group position={[hookPivotX, hookThreeY, 0]}>
            <group position={[centerOffsetX, centerOffsetY, 0]}>
              <CharmThickPendantBody
                imageUrl={imageUrl}
                charmHeight={h}
                charmDepth={charmDepth}
                position={[0, 0, 0]}
              />
            </group>
          </group>
        ) : (
          <group position={[pendantCenterX, pendantPosY, 0]}>
            <CharmThickPendantBody
              imageUrl={imageUrl}
              charmHeight={h}
              charmDepth={charmDepth}
              position={[0, 0, 0]}
            />
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
  selectedBead,
  selectedSeparator,
  beadPrototype,
  ringBasesRef,
}) {
  const { diameter, width, height } = ringItemToTransform(item);
  const [posX, posZ] = getRingMeshWorldXZ(item, ringIndex, ringItems);
  const imageUrl = resolveRingItemImageUrl(item, selectedBead, selectedSeparator);
  const isSpacer = item.type === "spacer";
  const stringQuat = useMemo(() => getItemOnStringQuaternion(posX, posZ), [posX, posZ]);
  const spacerKey =
    item.assetKey ?? item.asset?.key ?? selectedSeparator?.key ?? "s2";
  const spacerModelUrl = resolveSpacer3DModelUrl(spacerKey);

  return (
    <group position={[posX, 0, posZ]}>
      <DepthSortApplicator basesRef={ringBasesRef} index={ringIndex}>
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
              tint="#a855f7"
              beadPrototype={beadPrototype}
            />
          </group>
        )}
      </DepthSortApplicator>
    </group>
  );
}

function BeadsRingScene() {
  const { selectedBead, selectedSeparator, pattern, isManualMode } = useBeedsContext();
  const beadPrototype = useGlassBeadPrototype();
  const { items: displayItems, stringRadiusPx, isStringFull } = useBeadsSettledLayout();
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
  const ringItems = useMemo(
    () => displayItems.filter((item) => item.type === "bead" || item.type === "spacer"),
    [displayItems]
  );
  const charmItems = useMemo(
    () => displayItems.filter((item) => item.type === "charm"),
    [displayItems]
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
  const ringBasesRef = useRef([]);
  const charmBasesRef = useRef([]);
  useFrame(() => {
    const { ringBases, charmBases } = computeBraceletDepthBases(
      ringItems,
      charmItems,
      ringTiltX,
      ringYawRad,
      camera
    );
    ringBasesRef.current = ringBases;
    charmBasesRef.current = charmBases;
  }, -1);
  return (
    <>
      <group rotation={[ringTiltX, ringYawRad, 0]}>
        <BraceletCordLayer
          ringItems={ringItems}
          stringRadiusPx={stringRadiusPx}
          isStringFull={isStringFull}
          isManualMode={isManualMode}
          beadPrototype={beadPrototype}
        />
        {ringItems.map((item, index) => (
          <BeadOnRing
            key={item.id ?? `ring-${index}`}
            item={item}
            ringIndex={index}
            ringItems={ringItems}
            beadPrototype={beadPrototype}
            selectedBead={selectedBead}
            selectedSeparator={selectedSeparator}
            ringBasesRef={ringBasesRef}
          />
        ))}
        {charmItems.map((item, index) => (
          <Suspense key={item.id ?? `charm-${index}`} fallback={null}>
            <CharmFlatVisual
              item={item}
              charmIndex={index}
              charmBasesRef={charmBasesRef}
            />
          </Suspense>
        ))}
      </group>
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom
        enableDamping
        dampingFactor={0.08}
        minDistance={orbitLimits.min}
        maxDistance={orbitLimits.max}
        zoomSpeed={BEADS_3D_ORBIT_ZOOM_SPEED}
        makeDefault
      />
    </>
  );
}

export default function BeadsPreview3D() {
  return (
    <div
      className="beads-3d-preview beads-3d-preview--view-only"
      aria-label="Bead bracelet 3D preview"
    >
      <Canvas
        shadows
        camera={{ position: [0.01, 7.2, 0.37], fov: BEADS_3D_CAMERA_FOV, near: 0.01, far: 300 }}
        gl={{ antialias: true, alpha: true, logarithmicDepthBuffer: true }}
      >
        <PreviewRenderSettings />
        <color attach="background" args={["#f0f0ee"]} />
        <ambientLight intensity={0.48} />
        <directionalLight position={[5, 9, 5]} intensity={0.78} color="#fff6e8" castShadow />
        <directionalLight position={[-6, 4, -4]} intensity={0.32} color="#e8ecf4" />
        <directionalLight position={[0, 2, 8]} intensity={0.18} color="#ffffff" />
        <Suspense fallback={null}>
          <Environment preset="studio" environmentIntensity={0.52} />
        </Suspense>
        <BeadsRingScene />
      </Canvas>
    </div>
  );
}
