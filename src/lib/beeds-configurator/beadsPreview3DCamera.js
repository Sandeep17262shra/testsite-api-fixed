import * as THREE from "three";

/** Match `BeadsPreview3D` layout scale. */
export const BEADS_3D_WORLD_PER_PX = 0.0105;
/** Match `RING_3D_POSITION_SNUG` in `BeadsPreview3D.jsx`. */
const RING_3D_POSITION_SNUG = 0.952;
/**
 * Bead glass shell + layout vs snug string (10mm bead outer edge beyond string radius).
 * ~26px layout × WORLD_PER_PX × BEAD_DIAMETER_SCALE / 2, plus shell slack.
 */
const OUTWARD_MARGIN_WORLD = 0.48;
/**
 * 2D preview uses `padding: 52px 20px 96px` — 3D canvas is full-bleed; pull camera back
 * so the ring matches the smaller 2D “safe” area.
 */
const PREVIEW_SAFE_AREA_SCALE = 1.42;

/** Flat-lay view direction (near top-down; tiny XZ offset avoids OrbitControls gimbal lock). */
const FLAT_LAY_DIRECTION_DESKTOP = new THREE.Vector3(0.01, 2.9, 0.15).normalize();
const FLAT_LAY_DIRECTION_MOBILE = new THREE.Vector3(0.01, 4.4, 0.2).normalize();

export const BEADS_3D_RING_TILT_X = 0;
export const BEADS_3D_CAMERA_FOV = 36;
export const BEADS_3D_ORBIT_ZOOM_SPEED = 0.9;

export const BEADS_3D_CAMERA_FLAT_LAY = {
  desktop: [0.01, 2.9, 0.15],
  mobile: [0.01, 4.4, 0.2],
};

function getFlatLayDirection(isMobile) {
  return isMobile ? FLAT_LAY_DIRECTION_MOBILE : FLAT_LAY_DIRECTION_DESKTOP;
}

/**
 * Orbit distance so the full bracelet fits with ~2D-style margin (height + width).
 */
export function getBeads3DOrbitDistance(
  stringRadiusPx,
  { isMobile = false, fovDeg = BEADS_3D_CAMERA_FOV, aspect = 1.2 } = {}
) {
  const ringRadiusWorld = Math.max(stringRadiusPx, 80) * BEADS_3D_WORLD_PER_PX * RING_3D_POSITION_SNUG;
  const extentRadius = ringRadiusWorld + OUTWARD_MARGIN_WORLD;
  const viewportPadding = (isMobile ? 1.12 : 1.06) * PREVIEW_SAFE_AREA_SCALE;
  const fovRad = THREE.MathUtils.degToRad(fovDeg);
  const halfFovTan = Math.tan(fovRad / 2);
  const safeAspect = Math.max(aspect, 0.75);

  const distForHeight = (extentRadius * viewportPadding) / halfFovTan;
  const distForWidth = (extentRadius * viewportPadding) / (halfFovTan * safeAspect);
  const distance = Math.max(distForHeight, distForWidth);

  return Math.max(distance, 3.2);
}

export function getBeads3DOrbitLimits(stringRadiusPx, isMobile = false, aspect = 1.2) {
  const distance = getBeads3DOrbitDistance(stringRadiusPx, { isMobile, aspect });
  return {
    distance,
    min: distance * 0.72,
    max: distance * 1.38,
  };
}

export function getBeads3DCameraPosition(stringRadiusPx, isMobile = false, aspect = 1.2) {
  const distance = getBeads3DOrbitDistance(stringRadiusPx, { isMobile, aspect });
  return getFlatLayDirection(isMobile).clone().multiplyScalar(distance);
}

export function getBeads3DSpacerFocusDistance(stringRadiusPx, isMobile = false, aspect = 1.2) {
  return getBeads3DOrbitDistance(stringRadiusPx, { isMobile, aspect }) * 0.64;
}

export function getBeads3DSpacerFocusMinDistance(stringRadiusPx, isMobile = false, aspect = 1.2) {
  return getBeads3DOrbitDistance(stringRadiusPx, { isMobile, aspect }) * 0.54;
}
