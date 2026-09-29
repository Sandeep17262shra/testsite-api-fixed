export const PREVIEW_ZOOM_MIN = 1;
export const PREVIEW_ZOOM_MAX = 2.75;
export const PREVIEW_WHEEL_ZOOM_SENSITIVITY = 0.0012;

export function clampPreviewZoom(scale) {
  return Math.min(PREVIEW_ZOOM_MAX, Math.max(PREVIEW_ZOOM_MIN, scale));
}

/** @param {Map<number, { x: number, y: number }>} pointers */
export function getTwoPointerMetrics(pointers) {
  if (pointers.size < 2) {
    return null;
  }

  const pts = [...pointers.values()];
  const dx = pts[1].x - pts[0].x;
  const dy = pts[1].y - pts[0].y;

  return {
    distance: Math.hypot(dx, dy),
    centerX: (pts[0].x + pts[1].x) / 2,
    centerY: (pts[0].y + pts[1].y) / 2,
  };
}

export function normalizePreviewPan(scale, x, y) {
  if (scale <= PREVIEW_ZOOM_MIN + 0.001) {
    return { scale: PREVIEW_ZOOM_MIN, x: 0, y: 0 };
  }
  return { scale, x, y };
}
