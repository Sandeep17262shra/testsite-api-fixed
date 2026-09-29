import { getPreviewCenter } from "./beadRingLayout";
import { normalizeAngleDelta } from "./beadRingSpin";

const { x: CENTER_X, y: CENTER_Y } = getPreviewCenter();

export const PREVIEW_FOCUS_HOLD_MS = 4800;
export const PREVIEW_FOCUS_ANIM_MS = 560;

/** Layout angle in SVG space (0° = east, 90° = south / preview front). */
export function getLayoutAngleDegFromItem(item) {
  if (!item || item.x == null || item.y == null) {
    return null;
  }
  return (Math.atan2(item.y - CENTER_Y, item.x - CENTER_X) * 180) / Math.PI;
}

/** 2D SVG: front of preview is 6 o'clock (south). */
export const PREVIEW_FOCUS_FRONT_ANGLE_DEG_2D = 90;

/**
 * 3D flat-lay: camera on +Y; layout +Y → world −Z. Screen “front” (6 o’clock) is +Z,
 * so focus rotation uses 270° in layout space (180° offset from the 2D south = 90° front).
 */
export const PREVIEW_FOCUS_FRONT_ANGLE_DEG_3D = 270;

/** `ringViewRotation` / ring yaw that places the item at the front of the preview. */
export function getRingRotationToFocusItem(item, frontAngleDeg = PREVIEW_FOCUS_FRONT_ANGLE_DEG_2D) {
  const layoutAngle = getLayoutAngleDegFromItem(item);
  if (layoutAngle == null) {
    return null;
  }
  let target = frontAngleDeg - layoutAngle;
  while (target > 180) {
    target -= 360;
  }
  while (target < -180) {
    target += 360;
  }
  return target;
}

export function getRingRotationToFocusItem3D(item) {
  return getRingRotationToFocusItem(item, PREVIEW_FOCUS_FRONT_ANGLE_DEG_3D);
}

export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function getShortestRotationDelta(fromDeg, toDeg) {
  return normalizeAngleDelta(toDeg - fromDeg);
}
