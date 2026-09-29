import { pointerToSvgPoint, svgPointToClient } from "./beadRingDrag";

export const RING_SPIN_FRICTION = 0.94;
export const RING_SPIN_MIN_VELOCITY = 0.003;
// Beads 2D preview only — much slower than 3D configurators (autoRotateSpeed={4}).
export const RING_AUTO_ROTATE_SPEED = 0.1;

/** Degrees to rotate per millisecond for beads 360 view. */
export function getAutoRotateDeltaDeg(deltaMs) {
  return (360 / 60 / 60) * RING_AUTO_ROTATE_SPEED * deltaMs;
}

export function rotateSvgPointAroundCenter(x, y, centerX, centerY, rotationDeg) {
  if (!rotationDeg) {
    return { x, y };
  }

  const rad = (rotationDeg * Math.PI) / 180;
  const dx = x - centerX;
  const dy = y - centerY;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return {
    x: centerX + dx * cos - dy * sin,
    y: centerY + dx * sin + dy * cos,
  };
}

export function ringLocalPointToClient(
  svgElement,
  centerX,
  centerY,
  ringRotationDeg,
  localX,
  localY
) {
  const rotated = rotateSvgPointAroundCenter(localX, localY, centerX, centerY, ringRotationDeg);
  return svgPointToClient(svgElement, rotated.x, rotated.y);
}

export function unrotateSvgPointAroundCenter(x, y, centerX, centerY, rotationDeg) {
  if (!rotationDeg) {
    return { x, y };
  }

  const rad = (-rotationDeg * Math.PI) / 180;
  const dx = x - centerX;
  const dy = y - centerY;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return {
    x: centerX + dx * cos - dy * sin,
    y: centerY + dx * sin + dy * cos,
  };
}

export function pointerToRingLocalPoint(
  svgElement,
  centerX,
  centerY,
  ringRotationDeg,
  clientX,
  clientY
) {
  const point = pointerToSvgPoint(svgElement, clientX, clientY);
  return unrotateSvgPointAroundCenter(point.x, point.y, centerX, centerY, ringRotationDeg);
}

export function getPointerAngleDeg(svgElement, centerX, centerY, clientX, clientY) {
  const point = pointerToSvgPoint(svgElement, clientX, clientY);
  return (Math.atan2(point.y - centerY, point.x - centerX) * 180) / Math.PI;
}

export function normalizeAngleDelta(delta) {
  let normalized = delta;
  while (normalized > 180) normalized -= 360;
  while (normalized < -180) normalized += 360;
  return normalized;
}
