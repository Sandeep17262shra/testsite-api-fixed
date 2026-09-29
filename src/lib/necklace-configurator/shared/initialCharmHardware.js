// ─── Initial charm hardware (letter + washer + bail ring) ───────────────────
// Shared by the bracelet and necklace initial charms.
//
// The washer sits centred over the letter, just above its highest point. For
// letters with ink at the top centre (A, E, O, T...) it then overlaps the
// stroke and reads as attached. Letters whose top centre is EMPTY - H, K, M,
// N, U, V, W, X, Y - have their peaks out at the sides, so the washer hangs in
// the air above the notch between them. For those, getInitialWasherDrop
// measures how far the washer would have to sink before its ring meets the ink
// (by `overlap`), capped at `maxDrop`; callers apply only a share of it
// (INITIAL_WASHER_DROP_FACTOR) as a gentle nudge.
export const TWIN_PEAK_INITIALS = new Set(['H', 'K', 'M', 'N', 'U', 'V', 'W', 'X', 'Y']);
export const INITIAL_WASHER_DROP_FACTOR = 0.1;

export const isTwinPeakInitial = (letter) => TWIN_PEAK_INITIALS.has(String(letter || 'A').toUpperCase());

export function getInitialWasherDrop(geometry, centerX, startY, { washerOuterR, overlap, maxDrop }) {
  const pos = geometry?.attributes?.position;
  if (!pos) return 0;
  const reach = washerOuterR - overlap;
  const reach2 = reach * reach;
  // Distance to the glyph's triangle EDGES (not just its vertices - a flat
  // top bar like E's has vertices only at its ends).
  const segDist2 = (px, py, ax, ay, bx, by) => {
    const vx = bx - ax; const vy = by - ay;
    const len2 = vx * vx + vy * vy;
    const t = len2 > 0 ? Math.min(Math.max(((px - ax) * vx + (py - ay) * vy) / len2, 0), 1) : 0;
    const dx = ax + vx * t - px; const dy = ay + vy * t - py;
    return dx * dx + dy * dy;
  };
  const index = geometry.index;
  const triCount = index ? index.count / 3 : pos.count / 3;
  const vtx = (k) => (index ? index.getX(k) : k);
  const touches = (cy) => {
    for (let t = 0; t < triCount; t += 1) {
      const a = vtx(3 * t); const b = vtx(3 * t + 1); const c = vtx(3 * t + 2);
      const ax = pos.getX(a); const ay = pos.getY(a);
      const bx = pos.getX(b); const by = pos.getY(b);
      const cx = pos.getX(c); const cyy = pos.getY(c);
      if (segDist2(centerX, cy, ax, ay, bx, by) <= reach2
        || segDist2(centerX, cy, bx, by, cx, cyy) <= reach2
        || segDist2(centerX, cy, cx, cyy, ax, ay) <= reach2) return true;
    }
    return false;
  };
  if (touches(startY)) return 0;
  const step = maxDrop / 35;
  for (let drop = step; drop <= maxDrop; drop += step) {
    if (touches(startY - drop)) return drop;
  }
  return maxDrop;
}
