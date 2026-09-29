// ─── Plain chains (NO name pendant) ──────────────────────────────────────────
// Everything that only the non-name-pendant necklaces use: BRACELET15-18.
// These have no GLB chain model at all - the chain is generated link by link
// from CHAIN_DRAPE_CONFIG, drapes between two fixed anchors, supports a chain
// length choice and carries up to six charms threaded along it.
//
// The name-pendant chains (BRACELET13/14) live in NamePendantChain.jsx.
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ringMetalProps } from '../shared/metalMaterial';
import { BRACELETS } from '../shared/assets';
import { loadGLBCached, CHARM_WOBBLE_DURATION } from '../shared/necklaceShared';

// ─── Elliptical necklace loop config (BRACELET15 ONLY) ───────────────────────
// BRACELET15's new model is a full, symmetric oval loop — unlike BRACELET13/14
// which are open chains with a name pendant hanging in the middle. Because
// it's a true ellipse, charms can sit directly on it via the same
// radiusX/radiusZ-style orbit math the bracelet view already uses
// (`CHARM_ORBIT_CONFIG` / `getCharmTransform` in Bracelet.jsx) — just mapped
// into the necklace's vertical X/Y plane instead of the bracelet's flat X/Z
// plane, since here the loop hangs facing the camera rather than lying flat.
//
// TUNE THESE per charm kind against the actual rendered model (same workflow
// as Bracelet.jsx's CHARM_ORBIT_CONFIG). Each charm kind can have its own
// radius, centre, and angular spacing on the same closed necklace.
//   radiusX — half-width of the oval, in the same world units the charm
//             positions below already live in
//   radiusY — half-height of the oval, same units
//   centerY — vertical world-space center of the oval (moves the whole
//             ring up/down until it lines up with the rendered chain)
//   slotAngleStep — angular gap (radians) between adjacent charm slots;
//             smaller = charms bunch closer to the bottom of the oval,
//             larger = they spread further up the sides
//   verticalClearance — small vertical nudge applied to every charm so it
//             hangs from the loop the same way NECKLACE_CHARM_VERTICAL_CLEARANCE
//             does for the legacy layouts below
const BRACELET_ELLIPSE_CONFIG = {
  '/pc-assets/pendant_models//BRACELET15.glb': {
    // Standard image / birthstone charms.
    image: {
      radiusX: 2.75,
      radiusY: 3.55,
      centerX: 0,
      centerY: 3.65,
      slotAngleStep: 0.42,
      verticalClearance: 0.45,
    },
    // Plain initial charms are narrower and use a slightly tighter orbit.
    initial: {
      radiusX: 3,
      radiusY: 3.35,
      centerX: 0,
      centerY: 3.65,
      slotAngleStep: 0.38,
      verticalClearance: 0.40,
    },
    // Available for any future charm records that set `orbitType`.
    gemstone: {
      radiusX: 2.70,
      radiusY: 3.50,
      centerX: 0,
      centerY: 3.65,
      slotAngleStep: 0.42,
      verticalClearance: 0.45,
    },
    glb: {
      radiusX: 2.65,
      radiusY: 3.45,
      centerX: 0,
      centerY: 3.65,
      slotAngleStep: 0.40,
      verticalClearance: 0.42,
    },
  },
};

// Angle (standard cos/sin convention, 0 = +X/"3 o'clock") of the ellipse's
// lowest point — this is where offset 0 (the "center" slot) sits.
const ELLIPSE_BOTTOM_ANGLE = -Math.PI / 2;

// Position + tangent rotation for a charm at `offset` slots away from the
// bottom-center of the ellipse. `offset` can be negative/positive/fractional
// — same convention as Bracelet.jsx's getSlotOffsets/getCharmTransform.
function getEllipseCharmTransform(offset, ellipseCfg) {
  const {
    radiusX, radiusY,
    centerX = 0, centerY = 0,
    slotAngleStep,
    verticalClearance = 0,
  } = ellipseCfg;

  const angle = ELLIPSE_BOTTOM_ANGLE + offset * slotAngleStep;

  const x = centerX + radiusX * Math.cos(angle);
  const y = centerY + radiusY * Math.sin(angle) + verticalClearance;

  // Direction from the charm's position back toward the ellipse center —
  // this is the "up" direction the charm's bail should point along, so it
  // reads as hanging from the chain immediately above it, rather than the
  // charm's own edge-of-loop tangent (which pointed the bail sideways/away
  // from the chain and caused the 90°-off tilt at the bottom-center charm).
  const dx = radiusX * Math.cos(angle);
  const dy = radiusY * Math.sin(angle);
  const tilt = Math.atan2(dx, -dy);

  return {
    position: [x, y, 0.24],
    rotation: [0, 0, tilt],
  };
}

// Same odd/even center + side-rank slot ordering the bracelet view uses
// (getSlotOffsets in Bracelet.jsx), reused here so charm ordering stays
// consistent: index 0 = center-most slot, growing outward alternating sides.
function getEllipseSlotOffsets(total, hasCenterCharm) {
  const offsets = [];
  if (hasCenterCharm) {
    offsets.push(0);
    for (let i = 1; i <= (total - 1) / 2; i++) offsets.push(-i, i);
  } else {
    for (let i = 1; i <= total / 2; i++) offsets.push(-(i - 0.5), i - 0.5);
  }
  return offsets.sort((a, b) => a - b);
}

// ─── CHAIN-DRAPE CONFIG (open, two-anchor necklace with a real link chain) ──
// Use this INSTEAD of BRACELET_ELLIPSE_CONFIG for a necklace that is not a
// closed loop, but two fixed top anchor points with an open drape between
// them (like the reference "Petite Multi Charm Necklace" screenshot): a
// chain of real link geometry runs left-anchor → charm 1 → charm 2 → ... →
// right-anchor, and the whole drape re-flows automatically as charms are
// added/removed (up to 6).
//
//   left / right      — [x, y, z] world position of the two fixed anchor
//                        points the visible chain hangs from. Tune these
//                        against the rendered model, same workflow as the
//                        ellipse config above.
//   sag                — how far the chain dips below the straight line
//                        between the two anchors, in world units. Larger =
//                        deeper/looser drape.
//   linkSpacing         — approximate distance (world units) between the
//                        centre of one link and the next along the curve.
//                        Smaller = denser, more realistic chain; heavier
//                        on draw calls.
//   linkOuterRadius/linkTube — size of each individual chain link (torus).
const CHAIN_DRAPE_CONFIG = {
  '/pc-assets/pendant_models//BRACELET15.glb': {
    left:  [-5.75, 8.55, 0.24],
    right: [ 5.75, 8.55, 0.24],
    sag: -5.76,
    linkSpacing: -0.5,
    linkOuterRadius: 0.12,
    linkTube: 0.021,
    charmSpan: 0.46,
    bulgeSag: 0,
    bulgeSamples: 20,
    linkShape: 'round',
    totalLinks: 100,   // ← explicit now, round chain
  },

  '/pc-assets/pendant_models//BRACELET16.glb': {
    left:  [-5.75, 8.55, 0.24],
    right: [ 5.75, 8.55, 0.24],
    sag: -5.76,
    charmSpan: 0.46,
    bulgeSag: 0,
    bulgeSamples: 20,
    linkShape: 'oval',
    linkLength: 0.34,
    linkWidth: 0.15,
    linkTubeRadius: 0.021,
    totalLinks: 70,   // ← explicit now, oval chain
  },
  '/pc-assets/pendant_models//BRACELET17.glb': {
    left:  [-5.75, 8.55, 0.24],
    right: [ 5.75, 8.55, 0.24],
    sag: -5.76,
    linkSpacing: -0.5,
    linkOuterRadius: 0.1,
    linkTube: 0.021,
    charmSpan: 0.46,
    bulgeSag: 0,
    bulgeSamples: 20,
    linkShape: 'round',
    totalLinks: 110,   // ← explicit now, round chain
  },
 '/pc-assets/pendant_models//BRACELET18.glb': {
    left:  [-5.75, 8.55, 0.24],
    right: [ 5.75, 8.55, 0.24],
    sag: -5.76,
    linkSpacing: -0.5,
    linkOuterRadius: 0.07,
    linkTube: 0.017,
    charmSpan: 0.46,
    bulgeSag: 0,
    bulgeSamples: 20,
    linkShape: 'round',
    totalLinks: 180,   // ← explicit now, round chain
  },
};
// Only prewarm bracelets that actually load a GLB model. Drape-config
// bracelets (BRACELET15–18) are fully procedural — they have no model
// file, so prewarming them would 404.
if (typeof window !== 'undefined') {
  const firstRealModel = BRACELETS.find((b) => !CHAIN_DRAPE_CONFIG[b.path]);
  if (firstRealModel?.path) {
    loadGLBCached(firstRealModel.path).catch(() => {});
  }
}
// ─── CHAIN LENGTH SIZING ─────────────────────────────────────────────────────
// Applies a "chain length" selection (16" / 18") on top of a
// CHAIN_DRAPE_CONFIG entry. 16" == the values already tuned above
// (multiplier 1.0, no-op). A longer chain is fastened at the SAME two clasp
// points - only the extra length makes it hang lower. So the anchors and the
// sag stay as tuned, the drape is stretched downward (`depthScale`, see
// getDrapePoint) until the chain is exactly `m` times as long, and the link
// count grows by the same `m` so the links keep their spacing.
const CHAIN_LENGTH_MULTIPLIERS = {
  '16': 1.0,
  '18': 1.14,
};

// Returns a CHAIN_DRAPE_CONFIG-shaped object scaled for the chosen length.
// Every consumer (ChainDrape's rendering AND getNecklaceCharmPlacement's
// charm-threading math) must be given this SAME sized object, or the visible
// chain and the charms hanging on it will fall out of sync.
// Length of the free drape (clasp to clasp) at a given downward stretch.
function getDrapeLength(cfg, depthScale) {
  const { left, right, sag } = cfg;
  const N = 200;
  let len = 0;
  let prev = getDrapePoint(0, left, right, sag, depthScale);
  for (let i = 1; i <= N; i += 1) {
    const p = getDrapePoint(i / N, left, right, sag, depthScale);
    len += Math.hypot(p[0] - prev[0], p[1] - prev[1], p[2] - prev[2]);
    prev = p;
  }
  return len;
}

// The downward stretch that makes the drape `m` times as long, found by
// bisection (length grows steadily with the stretch).
const _depthScaleCache = new Map();
function solveDrapeDepthScale(cfg, m) {
  const key = `${cfg.left.join(',')}|${cfg.right.join(',')}|${cfg.sag}|${m}`;
  if (_depthScaleCache.has(key)) return _depthScaleCache.get(key);
  const target = getDrapeLength(cfg, 1) * m;
  let lo = 1;
  let hi = 4;
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2;
    if (getDrapeLength(cfg, mid) < target) lo = mid; else hi = mid;
  }
  const k = (lo + hi) / 2;
  _depthScaleCache.set(key, k);
  return k;
}

function getSizedDrapeConfig(baseCfg, lengthId) {
  if (!baseCfg) return baseCfg;
  const m = CHAIN_LENGTH_MULTIPLIERS[lengthId] ?? 1;
  if (m === 1) return baseCfg;
  return {
    ...baseCfg,
    // Same clasp points and sag as the 16" chain; it just hangs deeper.
    depthScale: solveDrapeDepthScale(baseCfg, m),
    totalLinks: baseCfg.totalLinks != null ? Math.round(baseCfg.totalLinks * m) : baseCfg.totalLinks,
  };
}

// Quadratic bezier point between the two drape anchors, dipping by `sag`.
// ─── Circular-arc drape (replaces the quadratic-bezier drape) ──────────────
// Fits a true circle through left-anchor, the bottom dip point, and
// right-anchor. A circle gets *steeper near its ends* the rounder/deeper it
// is — which is what makes it hang like a real necklace instead of a shallow
// bezier dip: bigger `sag` doesn't just deepen the middle, it also swings the
// anchor-end tangent toward vertical, so it meets the fixed vertical chain
// above it smoothly instead of cutting across it.
function computeDrapeArc(left, right, sag) {
  const midX = (left[0] + right[0]) / 2;
  const midY = (left[1] + right[1]) / 2 - sag;

  // 2D circle through (left.x,left.y), (midX,midY), (right.x,right.y).
  const [ax, ay] = [left[0], left[1]];
  const [bx, by] = [midX, midY];
  const [cx, cy] = [right[0], right[1]];
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));

  if (Math.abs(d) < 1e-6) {
    // Degenerate (near-collinear / near-zero sag) — fall back to a straight
    // line so it never blows up; visually indistinguishable at tiny sag.
    return null;
  }

  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  const r  = Math.hypot(ax - ux, ay - uy);

  const wrapNear = (base, ang) => {
    let diff = ang - base;
    while (diff > Math.PI)  diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return base + diff;
  };

  const a1 = Math.atan2(ay - uy, ax - ux);
  const a3raw = Math.atan2(cy - uy, cx - ux);
  const a3 = wrapNear(a1, a3raw); // keep the sweep continuous, no wraparound jump

  return { ux, uy, r, a1, a3 };
}

// `depthScale` (default 1) stretches the drape straight DOWN from the clasp
// line - how a longer chain on the same clasps hangs (see getSizedDrapeConfig).
// The ends stay exactly on the anchors and still leave them vertically.
function getDrapePoint(t, left, right, sag, depthScale = 1) {
  const arc = computeDrapeArc(left, right, sag);
  const z = left[2] + t * (right[2] - left[2]); // z still just interpolates

  if (!arc) {
    // straight-line fallback
    return [left[0] + t * (right[0] - left[0]), left[1] + t * (right[1] - left[1]), z];
  }
  const { ux, uy, r, a1, a3 } = arc;
  const angle = a1 + t * (a3 - a1);
  const y = uy + r * Math.sin(angle);
  const baseY = (left[1] + right[1]) / 2;
  return [ux + r * Math.cos(angle), baseY + (y - baseY) * depthScale, z];
}

function getDrapeTangent(t, left, right, sag, depthScale = 1) {
  const arc = computeDrapeArc(left, right, sag);
  if (!arc) return [right[0] - left[0], right[1] - left[1], right[2] - left[2]];

  const { ux, uy, r, a1, a3 } = arc;
  const angle = a1 + t * (a3 - a1);
  const dAngle = a3 - a1;
  // d/dt of (ux + r cos(angle), uy + r sin(angle)) with angle = a1 + t*dAngle
  return [-r * Math.sin(angle) * dAngle, r * Math.cos(angle) * dAngle * depthScale, right[2] - left[2]];
}
// ─── Segmented "bulge" chain path ───────────────────────────────────────────
// One continuous curve made of small circular-arc dips between every pair of
// consecutive attachment points (left-anchor → charm1 → ... → charmN →
// right-anchor). Reuses getDrapePoint/getDrapeTangent per-segment with a
// small sag, so the chain scallops between charms instead of following one
// smooth arc for the whole necklace.
function buildBulgeSegments(points, bulgeSag, samplesPerSegment) {
  const segments = [];
  let totalLen = 0;
  for (let s = 0; s < points.length - 1; s++) {
    const A = points[s];
    const B = points[s + 1];
    const pts = [];
    for (let i = 0; i <= samplesPerSegment; i++) {
      pts.push(getDrapePoint(i / samplesPerSegment, A, B, bulgeSag));
    }
    const cumLen = [0];
    for (let i = 1; i <= samplesPerSegment; i++) {
      const [ax, ay, az] = pts[i - 1];
      const [bx, by, bz] = pts[i];
      cumLen.push(cumLen[i - 1] + Math.hypot(bx - ax, by - ay, bz - az));
    }
    const segLen = cumLen[samplesPerSegment];
    segments.push({ A, B, cumLen, segLen, startLen: totalLen });
    totalLen += segLen;
  }
  return { segments, totalLen };
}

function sampleBulgePath(dist, segments, bulgeSag, samplesPerSegment) {
  let seg = segments[segments.length - 1];
  for (const s of segments) {
    if (dist <= s.startLen + s.segLen) { seg = s; break; }
  }
  const localDist = Math.max(0, dist - seg.startLen);
  let i = 1;
  while (i < samplesPerSegment && seg.cumLen[i] < localDist) i++;
  const segStart = seg.cumLen[i - 1];
  const segEnd   = seg.cumLen[i];
  const localT   = segEnd > segStart ? (localDist - segStart) / (segEnd - segStart) : 0;
  const t = ((i - 1) + localT) / samplesPerSegment;
  return {
    point:   getDrapePoint(t, seg.A, seg.B, bulgeSag),
    tangent: getDrapeTangent(t, seg.A, seg.B, bulgeSag),
  };
}

// ─── Shared link-transform builder (used by ChainDrape AND charm placement) ─
// Computes the exact same discrete link array ChainDrape renders, so charms
// can snap to a real link instead of an independent point on the curve.
// One arc-length sampler over a list of path points. With dense points this
// follows a curve; with sparse ones (the charm anchors) it is the scalloped
// polyline the chain has always drawn between charms.
function buildPathSampler(points, bulgeSag, bulgeSamples) {
  const built = buildBulgeSegments(points, bulgeSag, bulgeSamples);
  return {
    totalLen: built.totalLen,
    sampleAt: (dist) => sampleBulgePath(dist, built.segments, bulgeSag, bulgeSamples),
  };
}

// ─── Relaxed charm pull ─────────────────────────────────────────────────────
// A charm pulls the chain from its free drape into straight runs between the
// attachment points (clasp -> charms -> clasp / washer). Dead-straight runs
// read as a chain under tension, so each run keeps a little of the slack the
// free drape had over the same stretch: the straight run PLUS
// (1 - CHARM_CHAIN_TENSION) of the drape arc's own bow over that span. The bow
// is measured from the arc's chord, so every run still starts and ends exactly
// on its attachment points - charms and washers stay threaded - only the
// middle of each run eases outward/down like a real chain.
//   1   = taut, straight runs (the old look)
//   0.9 = 90% of the charm's pull - a slightly relaxed chain
const CHARM_CHAIN_TENSION = 0.8;
const RELAXED_RUN_SAMPLES = 32;

// Where a point sits along the free drape arc, as its 0..1 param.
function getDrapeParamForPoint(point, cfg) {
  const { left, right, sag } = cfg;
  const arc = computeDrapeArc(left, right, sag);
  if (!arc) {
    const span = right[0] - left[0];
    return Math.abs(span) > 1e-6 ? Math.min(Math.max((point[0] - left[0]) / span, 0), 1) : 0.5;
  }
  const { ux, uy, a1, a3 } = arc;
  // Undo the downward stretch before reading the point's angle on the circle.
  const k = cfg.depthScale ?? 1;
  const baseY = (left[1] + right[1]) / 2;
  const y = baseY + (point[1] - baseY) / k;
  let angle = Math.atan2(y - uy, point[0] - ux);
  while (angle - a1 > Math.PI) angle -= 2 * Math.PI;
  while (angle - a1 < -Math.PI) angle += 2 * Math.PI;
  const range = a3 - a1;
  return Math.abs(range) > 1e-6 ? Math.min(Math.max((angle - a1) / range, 0), 1) : 0.5;
}

// Dense points for a chain that runs through `points` in order, relaxed as
// described above. Fed to buildPathSampler exactly like the free drape.
function buildRelaxedRunPoints(points, cfg, tension = CHARM_CHAIN_TENSION) {
  const { left, right, sag } = cfg;
  const slack = 1 - Math.min(Math.max(tension, 0), 1);
  const out = [];
  for (let s = 0; s < points.length - 1; s += 1) {
    const A = points[s];
    const B = points[s + 1];
    const tA = getDrapeParamForPoint(A, cfg);
    const tB = getDrapeParamForPoint(B, cfg);
    const arcA = getDrapePoint(tA, left, right, sag, cfg.depthScale);
    const arcB = getDrapePoint(tB, left, right, sag, cfg.depthScale);
    for (let i = s === 0 ? 0 : 1; i <= RELAXED_RUN_SAMPLES; i += 1) {
      const f = i / RELAXED_RUN_SAMPLES;
      const arc = getDrapePoint(tA + (tB - tA) * f, left, right, sag, cfg.depthScale);
      // The arc's bow over this span = arc minus its own chord (zero at both ends).
      const bowX = arc[0] - (arcA[0] + (arcB[0] - arcA[0]) * f);
      const bowY = arc[1] - (arcA[1] + (arcB[1] - arcA[1]) * f);
      out.push([
        A[0] + (B[0] - A[0]) * f + bowX * slack,
        A[1] + (B[1] - A[1]) * f + bowY * slack,
        (A[2] ?? 0) + ((B[2] ?? 0) - (A[2] ?? 0)) * f,
      ]);
    }
  }
  return out;
}

// Dense samples of the full drape arc between two 0..1 params.
function sampleArcRange(cfg, tStart, tEnd, count) {
  const { left, right, sag } = cfg;
  return Array.from({ length: count + 1 }, (_, i) =>
    getDrapePoint(tStart + ((tEnd - tStart) * i) / count, left, right, sag, cfg.depthScale));
}

// Building the link array walks the whole chain and allocates a transform per
// link, and it is asked for many times over in a single frame — once by the
// chain itself, twice per charm for the layout, and again to hang the name
// pendant. They all ask about the SAME chain, so the answer is memoized on the
// values that define it. A handful of entries is plenty: a frame only ever
// deals with one or two distinct chains, and anything older is stale anyway.
const CHAIN_CACHE_LIMIT = 6;
const _chainCache = new Map();

const anchorKey = (point) => (point
  ? `${point[0].toFixed(3)},${point[1].toFixed(3)},${(point[2] ?? 0).toFixed(3)}`
  : '');

function chainCacheKey(cfg, charmAnchors, shrinkAnchors) {
  return [
    anchorKey(cfg.left), anchorKey(cfg.right), (cfg.sag ?? 0).toFixed(4), (cfg.depthScale ?? 1).toFixed(4),
    cfg.totalLinks ?? '', cfg.linkShape ?? '', cfg.linkLength ?? '', cfg.linkWidth ?? '',
    cfg.bulgeSag ?? '', cfg.bulgeSamples ?? '', cfg.charmSpan ?? '',
    cfg.pendantAnchors
      ? `${anchorKey(cfg.pendantAnchors.left)}>${anchorKey(cfg.pendantAnchors.right)}`
        + `@${cfg.pendantAnchors.washer
          ? Object.values(cfg.pendantAnchors.washer).map((v) => v.toFixed(3)).join(',')
          : ''}`
      : '',
    charmAnchors.map(anchorKey).join(';'),
    shrinkAnchors === charmAnchors ? '=' : shrinkAnchors.map(anchorKey).join(';'),
  ].join('#');
}

function buildChainLinkTransforms(cfg, charmAnchors = [], shrinkAnchors = charmAnchors) {
  const key = chainCacheKey(cfg, charmAnchors, shrinkAnchors);
  const cached = _chainCache.get(key);
  if (cached) return cached;

  const built = computeChainLinkTransforms(cfg, charmAnchors, shrinkAnchors);
  _chainCache.set(key, built);
  if (_chainCache.size > CHAIN_CACHE_LIMIT) {
    _chainCache.delete(_chainCache.keys().next().value);
  }
  return built;
}

// ─── Ending the chain ON the pendant's washer ───────────────────────────────
// A washer is an upright ring: it lies in the XY plane, its hole facing the
// viewer, and it is extruded backwards from the point that is published as the
// anchor. Two things follow, and they are what make the chain actually LINK
// into it rather than stop next to it:
//
//   1. The end link has to be the EDGE-ON one. A front-facing link lies in the
//      same plane as the washer, so it can only ever pass beside it; the
//      edge-on link stands in a plane containing Z, square to the washer, which
//      is the only way two rings can thread.
//   2. It has to stop SHORT of the washer's centre. Sitting on the centre makes
//      the two rings concentric - they read as one flat blob - and the washer's
//      band never passes through the link's opening. Backing off by
//      `getWasherHook` puts that band in the middle of the opening instead, so
//      the link hangs off the washer the way a soldered jump ring does.
//
// Both halves of the chain are therefore generated FROM their washer inward,
// and the leftover rounding is spent up at the clasp end where nothing has to
// line up.

// The opening of one link - how much room the washer's band has to sit in.
// A round link is a torus, an oval link a stadium: long axis along the chain,
// short axis across it (which, once the link is stood edge-on, is depth).
function getLinkOpening(cfg) {
  if (cfg.linkShape === 'oval') {
    const tube = cfg.linkTubeRadius ?? cfg.linkTube ?? 0.021;
    return {
      long: Math.max((cfg.linkLength ?? 0.34) / 2 - tube, 1e-4),
      short: Math.max((cfg.linkWidth ?? 0.15) / 2 - tube, 1e-4),
    };
  }
  const radius = Math.max((cfg.linkOuterRadius ?? 0.12) - (cfg.linkTube ?? 0.021), 1e-4);
  return { long: radius, short: radius };
}

// How far back along the chain from the washer's centre the last link sits.
function getWasherHook(cfg, washer) {
  if (!washer) return 0;
  const band = (washer.outer + washer.inner) / 2;
  // The band is not a line - it has width, and every part of it has to stay
  // inside the opening.
  const bandHalfWidth = (washer.outer - washer.inner) / 2;
  const { long } = getLinkOpening(cfg);
  const reach = Math.min(long * 0.45, Math.max(long - bandHalfWidth, 0) * 0.85);
  return band + reach;
}

// The washer is extruded backwards from its anchor, so its mid-plane - the
// depth the chain should meet it at - sits half a thickness behind it.
function washerMidPlane(anchor, washer) {
  if (!anchor || !washer) return anchor;
  return [anchor[0], anchor[1], (anchor[2] ?? 0) - washer.depth / 2];
}

function computeChainLinkTransforms(cfg, charmAnchors = [], shrinkAnchors = charmAnchors) {
  const { left, right, sag } = cfg;
  const hasCharms = charmAnchors.length > 0;

  // A name pendant hanging in the middle splits the chain in two: the left
  // half runs from the left clasp down to the pendant's LEFT washer, the right
  // half from its RIGHT washer back up to the right clasp. Both halves follow
  // the same drape arc the whole chain would have followed, then finish on the
  // washer itself — so the chain physically ends at the ring it hangs from,
  // however high or low that ring sits on the first/last letter.
  const pendant = cfg.pendantAnchors;

  const sortedAnchors = [...charmAnchors].sort((a, b) => a[0] - b[0]);

  let paths;
  if (pendant) {
    // The name pendant is an attachment point like any charm: the chain runs
    // clasp → charms on that side → washer, taking the same bend at every one
    // of them. So the chain visibly angles where the name hangs, instead of
    // sweeping past it as if nothing were attached.
    const leftAnchors  = sortedAnchors.filter((anchor) => anchor[0] < pendant.left[0]);
    const rightAnchors = sortedAnchors.filter((anchor) => anchor[0] > pendant.right[0]);

    // Aimed at the washer's mid-plane, not its front face, so the link that
    // threads it is centred in the ring rather than clipping its rim.
    const leftWasher  = washerMidPlane(pendant.left, pendant.washer);
    const rightWasher = washerMidPlane(pendant.right, pendant.washer);

    paths = [
      buildPathSampler(buildRelaxedRunPoints([left, ...leftAnchors, leftWasher], cfg), 0, 2),
      buildPathSampler(buildRelaxedRunPoints([rightWasher, ...rightAnchors, right], cfg), 0, 2),
    ];
  } else if (hasCharms) {
    // Relaxed runs between the attachment points - see CHARM_CHAIN_TENSION.
    paths = [buildPathSampler(buildRelaxedRunPoints([left, ...sortedAnchors, right], cfg), 0, 2)];
  } else {
    paths = [buildPathSampler(sampleArcRange(cfg, 0, 1, 70), 0, 2)];
  }

  const totalLen = paths.reduce((sum, path) => sum + path.totalLen, 0);

  // Each half stops a `hook` short of its washer; that gap is where the last
  // link hangs THROUGH the ring instead of sitting on top of its centre.
  const hook = pendant ? getWasherHook(cfg, pendant.washer) : 0;
  const runs = paths.map((path, pathIndex) => {
    // Path 0 ends on the left washer, path 1 starts on the right one.
    const atStart = Boolean(pendant) && pathIndex === 1;
    const atEnd   = Boolean(pendant) && pathIndex === 0;
    // Never eat more than a fifth of a half - a very short run (a name almost
    // as wide as the necklace) would otherwise lose its chain altogether.
    const trim = Math.min(hook, path.totalLen * 0.2);
    const startDist = atStart ? trim : 0;
    const endDist   = atEnd ? path.totalLen - trim : path.totalLen;
    return { path, startDist, runLen: Math.max(endDist - startDist, 0), atStart, atEnd };
  });
  const totalRun = runs.reduce((sum, run) => sum + run.runLen, 0);

  const isOval = cfg.linkShape === 'oval';
  let linkBudget = cfg.totalLinks ?? (
    isOval ? Math.max(4, Math.round(totalLen / ((cfg.linkLength ?? 0.34) * 0.5))) : 140
  );

  // The pendant replaces a stretch of chain, so the same link count would be
  // crammed into a shorter run. Scale it down by however much chain is left,
  // which keeps the links at exactly the spacing they have without a pendant.
  if (pendant) {
    const fullLen = buildPathSampler(sampleArcRange(cfg, 0, 1, 70), 0, 2).totalLen;
    if (fullLen > 0) linkBudget = Math.max(4, Math.round(linkBudget * (totalRun / fullLen)));
  }

  // Links right next to a charm's bail visually collide with the charm's
  // gem/body. Shrink links the closer they sit to any charm anchor —
  // full size at `radius` distance away, down to `minScale` at the anchor
  // itself, smoothly interpolated so it doesn't look like a sudden pop.
  const shrinkCfg = cfg.charmLinkShrink ?? { radius: 0.55, minScale: 0.55 };

  const getLinkScale = (point) => {
    if (!shrinkAnchors.length) return 1;
    let minDist = Infinity;
    for (const anchor of shrinkAnchors) {
      const dx = point[0] - anchor[0];
      const dy = point[1] - anchor[1];
      const dz = (point[2] ?? 0) - (anchor[2] ?? 0);
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < minDist) minDist = dist;
    }
    if (minDist >= shrinkCfg.radius) return 1;
    const t = minDist / shrinkCfg.radius; // 0 at anchor → 1 at radius edge
    const smooth = t * t * (3 - 2 * t);   // smoothstep, no hard edge
    return shrinkCfg.minScale + (1 - shrinkCfg.minScale) * smooth;
  };

  const zAxis = new THREE.Vector3(0, 0, 1);
  const links = [];
  let seamIndex = null;

  // Links are spread across the halves by length, and their interlock parity
  // keeps running across the seam, so a split chain has the same density and
  // the same alternating pattern as an unsplit one.
  runs.forEach((run, pathIndex) => {
    const share = totalRun > 0 ? run.runLen / totalRun : 1;
    // A single, unsplit chain gets a link count that is a multiple of 4.
    // Links alternate front-facing / edge-on from the left clasp, so only
    // then is the pattern a mirror image: both clasp links are the same kind
    // and the centre link is front-facing. With any other count the centre
    // link is edge-on, so a single charm (which hangs from the nearest
    // front-facing link) snapped one link off centre - the V leaned to one
    // side and one clasp end sat visibly higher than the other - and an odd
    // count also ended the two sides on different link kinds.
    const rawCount = Math.max(1, Math.round(linkBudget * share));
    const count = runs.length === 1 ? Math.max(4, Math.round(rawCount / 4) * 4) : rawCount;
    for (let i = 0; i <= count; i += 1) {
      const { point, tangent } = run.path.sampleAt(run.startDist + (i / count) * run.runLen);
      const T = new THREE.Vector3(tangent[0], tangent[1], 0).normalize();
      const flatAngle = Math.atan2(T.y, T.x);
      const quat = new THREE.Quaternion().setFromAxisAngle(zAxis, flatAngle);
      // even index = flat/front-facing "full circle" link. Counted FROM the
      // washer where there is one, so the link that meets it is always the
      // edge-on kind - the only one that can thread an upright ring.
      const fromWasher = run.atEnd ? count - i : (run.atStart ? i : null);
      const isFrontFacing = fromWasher != null
        ? fromWasher % 2 === 1
        : links.length % 2 === 0;
      if (!isFrontFacing) {
        const tilt = new THREE.Quaternion().setFromAxisAngle(T, Math.PI / 2);
        quat.premultiply(tilt);
      }
      links.push({ position: point, quaternion: quat, tangent: T, isFrontFacing, scale: getLinkScale(point) });
    }
    if (pathIndex === 0 && runs.length > 1) seamIndex = links.length - 1;
  });

  const totalLinks = links.length - 1;
  // Where the pendant sits, as 0..1 params — this is the stretch of chain that
  // is not there, which is what charm placement lays itself out around.
  const seam = seamIndex != null
    ? { tLeft: seamIndex / totalLinks, tRight: (seamIndex + 1) / totalLinks }
    : null;

  return { links, totalLinks, totalLen, seam };
}

// Given a target 0..1 param along the chain, find the nearest FRONT-FACING
// (even-index) link — this is the "full circle from front view" link type,
// which is the only one a charm/bail should visually hang from.
function snapToFrontFacingLinkIndex(targetT, links, totalLinks) {
  let idx = Math.round(targetT * totalLinks);
  if (!links[idx]?.isFrontFacing) {
    const up = idx + 1 <= totalLinks ? idx + 1 : idx - 1;
    const down = idx - 1 >= 0 ? idx - 1 : idx + 1;
    idx = links[up]?.isFrontFacing ? up : down;
  }
  return idx;
}

// Snapping is done on the LEFT half and mirrored onto the right, so charms at
// mirror-image params (t and 1 - t) land on mirror-image links. Snapping each
// side on its own rounds .5 the same way and always prefers the next link up,
// which pushed right-hand charms a link or two further out than their
// left-hand twins and made the whole row - and the chain's V - lean right.
function snapToFrontFacingLink(targetT, links, totalLinks) {
  if (targetT > 0.5) {
    const mirrored = totalLinks - snapToFrontFacingLinkIndex(1 - targetT, links, totalLinks);
    // Only valid when the link pattern itself is symmetric (an unsplit chain,
    // see the multiple-of-4 link count); otherwise snap directly.
    if (links[mirrored]?.isFrontFacing) return links[mirrored];
  }
  return links[snapToFrontFacingLinkIndex(targetT, links, totalLinks)];
}

// The chain runs left to right, so a world X maps to a single spot along it.
// Walks the discrete links and interpolates between the two that straddle `x`,
// which keeps this in step with what is actually rendered (bulges included)
// instead of re-deriving a separate curve.
function findChainTAtX(links, totalLinks, x) {
  for (let i = 1; i < links.length; i += 1) {
    const x0 = links[i - 1].position[0];
    const x1 = links[i].position[0];
    if ((x0 - x) * (x1 - x) <= 0 && x0 !== x1) {
      const localT = (x - x0) / (x1 - x0);
      return (i - 1 + localT) / totalLinks;
    }
  }
  // Off the end of the chain — clamp to whichever anchor is nearer.
  return x < links[0].position[0] ? 0 : 1;
}

// World position of the chain at a given world X. Used to hang the name
// pendant ON the chain: its washers sit exactly where the links would have.
function getChainPointAtX(cfg, x) {
  if (!cfg) return null;
  const { links, totalLinks } = buildChainLinkTransforms(cfg);
  const t = findChainTAtX(links, totalLinks, x);
  const idx = Math.min(Math.max(Math.round(t * totalLinks), 0), totalLinks);
  const a = links[Math.max(idx - 1, 0)].position;
  const b = links[Math.min(idx + 1, totalLinks)].position;
  const span = b[0] - a[0];
  const localT = Math.abs(span) > 1e-6 ? Math.min(Math.max((x - a[0]) / span, 0), 1) : 0;
  return [x, a[1] + (b[1] - a[1]) * localT, a[2] + (b[2] - a[2]) * localT];
}

// Chain drapes deeper as more charms hang from it — scales the *magnitude*
// of the base sag (keeping its sign) so the shape deepens with charm count
// instead of staying fixed while charms crowd the same fixed arc.
function getEffectiveSag(cfg, charmCount) {
  const growth = cfg.sagGrowthPerCharm ?? 0;
  const cap = cfg.maxSagMultiplier ?? 2;
  const multiplier = Math.min(1 + growth * charmCount, cap);
  return cfg.sag * multiplier;
}
// Even distribution of `total` charms strictly between the two anchors —
// t=0 and t=1 stay reserved for the anchors themselves, so charm 1 is never
// placed exactly on top of the left anchor even when total === 1.
// The charm count that CHAIN_DRAPE_CONFIG's `charmSpan` value was tuned for.
// Since 5-charm spacing looks right, that's the reference.
const CHARM_SPACING_REFERENCE_COUNT = 5;

// How far a charm on a name-pendant chain is pulled back out toward the free
// drape (0 = on the straight clasp-to-washer run: no bend; 1 = fully on the
// drape, the same bend as a chain without a name). Raise for a sharper bend.
const PENDANT_CHARM_BEND = 0.8;

// ─── Which side of the name pendant each charm hangs on ────────────────────
// `sides` is one entry per charm, in row order: 'left' / 'right' when the side
// was chosen by tapping the chain (charm.chainSide), anything else when it
// was not. Chosen sides are kept as-is; the rest fill in to balance the two
// halves (with no chosen sides at all this is exactly the old split: the
// first ceil(n/2) charms left, the rest right). Rank 1 is the charm nearest
// the pendant on its side; within a side, row order runs left to right.
function getSeamCharmSlots(sides = []) {
  const total = sides.length;
  const isSet = (s) => s === 'left' || s === 'right';
  const explicitLeft = sides.filter((s) => s === 'left').length;
  const unassigned = sides.filter((s) => !isSet(s)).length;
  let needLeft = Math.min(Math.max(Math.ceil(total / 2) - explicitLeft, 0), unassigned);
  const resolved = sides.map((s) => {
    if (isSet(s)) return s;
    if (needLeft > 0) { needLeft -= 1; return 'left'; }
    return 'right';
  });
  const leftCount = resolved.filter((s) => s === 'left').length;
  let leftSeen = 0;
  let rightSeen = 0;
  return resolved.map((side) => (side === 'left'
    ? { side, rank: leftCount - (leftSeen++) }
    : { side, rank: ++rightSeen }));
}

// World X of the name pendant's gap in the chain (null when there is none):
// a chain tap left of this belongs on the pendant's left side.
function getChainSeamX(cfg) {
  if (!cfg) return null;
  const { links, totalLinks, seam } = buildChainLinkTransforms(cfg);
  if (!seam) return null;
  const a = links[Math.round(seam.tLeft * totalLinks)];
  const b = links[Math.round(seam.tRight * totalLinks)];
  if (!a || !b) return null;
  return (a.position[0] + b.position[0]) / 2;
}

// `seamSlot` ({ side, rank } from getSeamCharmSlots) places a charm on a
// specific side of the name pendant. Without it the old index-based split is
// used (first half left, second half right).
function getChainCharmTransform(index, total, cfg, seamSlot = null) {
  const effectiveSag = getEffectiveSag(cfg, total);
  const maxCharmSpan = Math.min(Math.max(cfg.charmSpan ?? 1, 0), 1);

  // Distance (in t-units) between adjacent charms, calibrated so that at
  // CHARM_SPACING_REFERENCE_COUNT charms, spacing == maxCharmSpan / (ref-1)
  // — i.e. exactly today's 5-charm look.
  const spacingUnit = maxCharmSpan / (CHARM_SPACING_REFERENCE_COUNT - 1);

  // For fewer charms, use that same per-gap spacing instead of stretching
  // to fill the full span. Cap at maxCharmSpan so charm counts above the
  // reference never overflow past the original edges.
  const charmSpan = total > 1
    ? Math.min(spacingUnit * (total - 1), maxCharmSpan)
    : 0;

  const { links, totalLinks, seam } = buildChainLinkTransforms(cfg);

  // With a name pendant in the middle, the centre of the chain is taken. The
  // charms split evenly onto the two remaining halves and step outward from
  // the pendant at the same spacing they would have had, so the row still
  // reads as one evenly spaced set with the name sitting in the middle of it.
  let t;
  if (seam) {
    const tGapLeft  = seam.tLeft;
    const tGapRight = seam.tRight;
    const leftCount = Math.ceil(total / 2);
    const onLeft    = seamSlot ? seamSlot.side === 'left' : index < leftCount;
    // rank 1 == the charm closest to the pendant on that side.
    const rank = seamSlot
      ? seamSlot.rank
      : (onLeft ? leftCount - index : index - leftCount + 1);
    const raw  = onLeft
      ? tGapLeft  - rank * spacingUnit
      : tGapRight + rank * spacingUnit;
    t = Math.min(Math.max(raw, 0.04), 0.96);
  } else {
    t = total <= 1
      ? 0.5
      : 0.5 - charmSpan / 2 + (index * charmSpan) / (total - 1);
  }

  const link = snapToFrontFacingLink(t, links, totalLinks);

  let linkPos = [link.position[0], link.position[1], link.position[2]];
  let tangent = [link.tangent.x, link.tangent.y, 0];

  // With a name pendant the chain already runs almost straight from the clasp
  // to the washer, so a charm sitting ON that run pulls nothing - no visible
  // bend. Move it part of the way back out to the free drape (keeping its
  // depth), so the chain has to kink through it like it does without a name.
  if (seam && PENDANT_CHARM_BEND > 0) {
    const tArc = getDrapeParamForPoint(linkPos, cfg);
    const arcPoint = getDrapePoint(tArc, cfg.left, cfg.right, cfg.sag, cfg.depthScale);
    const arcTan = getDrapeTangent(tArc, cfg.left, cfg.right, cfg.sag, cfg.depthScale);
    const k = PENDANT_CHARM_BEND;
    linkPos = [
      linkPos[0] + (arcPoint[0] - linkPos[0]) * k,
      linkPos[1] + (arcPoint[1] - linkPos[1]) * k,
      linkPos[2],
    ];
    const runLen = Math.hypot(tangent[0], tangent[1]) || 1;
    let ax = arcTan[0];
    let ay = arcTan[1];
    const arcLen = Math.hypot(ax, ay) || 1;
    if (ax * tangent[0] + ay * tangent[1] < 0) { ax = -ax; ay = -ay; }
    tangent = [
      (tangent[0] / runLen) * (1 - k) + (ax / arcLen) * k,
      (tangent[1] / runLen) * (1 - k) + (ay / arcLen) * k,
      0,
    ];
  }

  const chainAngle = Math.atan2(tangent[1], tangent[0]);
  const tilt = chainAngle * (cfg.charmTiltFactor ?? 0.75);

  // Drop the charm slightly below the link along its local "down" normal,
  // so it visually hangs from that link rather than centering on it.
  const dropDist = cfg.charmBailDrop ?? 0.06;
  const normal = [tangent[1], -tangent[0]]; // perpendicular to tangent
  const position = [
    linkPos[0] - normal[0] * dropDist,
    linkPos[1] - normal[1] * dropDist,
    linkPos[2],
  ];

  // The link itself, and how far below its centre its bottom wire runs (the
  // spot a jump ring hanging THROUGH it rests on) - lets a charm hook its bail
  // into the link rather than just hang near it. For an oval link the reach
  // toward gravity depends on how steeply it lies along the chain.
  const isOvalLink = cfg.linkShape === 'oval';
  const linkTube = isOvalLink ? (cfg.linkTubeRadius ?? cfg.linkTube ?? 0.021) : (cfg.linkTube ?? 0.021);
  const tanLen = Math.hypot(tangent[0], tangent[1]) || 1;
  const linkBottomReach = isOvalLink
    ? Math.max((cfg.linkLength ?? 0.34) - (cfg.linkWidth ?? 0.15), 0) / 2 * Math.abs(tangent[1] / tanLen) + (cfg.linkWidth ?? 0.15) / 2
    : (cfg.linkOuterRadius ?? 0.12);

  return {
    position,
    rotation: [0, 0, tilt],
    t,
    linkPosition: linkPos,
    linkBottomReach,
    linkTube,
  };
}

class StadiumCurve extends THREE.Curve {
  constructor(length, width) {
    super();
    this.halfStraight = Math.max(length - width, 0.0001) / 2;
    this.halfWidth = width / 2;
    this.straightLen = this.halfStraight * 2;
    this.arcLen = Math.PI * this.halfWidth;
    this.totalLen = 2 * this.straightLen + 2 * this.arcLen;
  }

  getPoint(t, target = new THREE.Vector3()) {
    const { halfStraight, halfWidth, straightLen, arcLen, totalLen } = this;
    const s = t * totalLen;
    let x, y;

    if (s <= straightLen) {
      x = -halfStraight + s;
      y = halfWidth;
    } else if (s <= straightLen + arcLen) {
      const a = (s - straightLen) / arcLen;
      const angle = Math.PI / 2 - a * Math.PI;
      x = halfStraight + halfWidth * Math.cos(angle);
      y = halfWidth * Math.sin(angle);
    } else if (s <= 2 * straightLen + arcLen) {
      const local = s - (straightLen + arcLen);
      x = halfStraight - local;
      y = -halfWidth;
    } else {
      const local = s - (2 * straightLen + arcLen);
      const a = local / arcLen;
      const angle = -Math.PI / 2 - a * Math.PI;
      x = -halfStraight + halfWidth * Math.cos(angle);
      y = halfWidth * Math.sin(angle);
    }
    return target.set(x, y, 0);
  }
}

function createOvalLinkGeometry(length, width, tubeRadius, tubularSegments = 40, radialSegments = 8) {
  const curve = new StadiumCurve(length, width);
  return new THREE.TubeGeometry(curve, tubularSegments, tubeRadius, radialSegments, true);
}

// ─── ChainDrape ───────────────────────────────────────────────────────────────
// Renders the actual link-by-link chain for a CHAIN_DRAPE_CONFIG bracelet:
// walks the whole left-anchor → right-anchor bezier curve by arc length,
// dropping a link every `linkSpacing`, alternating each link 90° around the
// curve's tangent so consecutive links visually interlock like a real chain.
// `cfg` is passed in already sized for the selected chain length — this
// component must never re-derive it from the un-sized CHAIN_DRAPE_CONFIG
// lookup, or the rendered chain and the charms threaded onto it (via
// getChainCharmTransform, using the same sized cfg) would fall out of sync.
const LINK_DROP_DURATION = 1;   // seconds each individual link takes to fall & settle
const LINK_DROP_STAGGER  = 0.9;   // seconds spread across the whole chain (0 = no cascade, all links drop together)
const LINK_DROP_HEIGHT   = 0.5;   // world units each link starts above its resting spot

function easeOutSettle(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const p = 0.5;
  return Math.pow(2, -8 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
}

// ─── Bounce-back after landing ──────────────────────────────────────────────
// easeOutSettle finishes the moment a link reaches its resting spot, which is
// what made the chain look like it stuck to the bottom. This adds the part
// that was missing: the link arrives carrying momentum, swings PAST its
// resting spot, springs back up, and keeps swinging in ever-smaller arcs
// until it finally stills.
//
// Kept as a SEPARATE term added on top of the drop rather than folded into
// the easing curve, so the fall and its ends-to-centre cascade are untouched
// — each link simply starts bouncing the instant its own fall finishes, and
// the bounce inherits the same cascade.
//
// Two things decay the swing, and they do different jobs: BOUNCE_TAU is the
// natural ring-down that makes each arc smaller than the last, and the
// (1 - tb/DURATION) term guarantees it reaches EXACTLY zero at the end
// instead of being cut off mid-swing, which would show as a snap.
const BOUNCE_AMPLITUDE = 0.34;  // world units the belly swings below rest on the first bounce
const BOUNCE_PERIOD    = 0.62;  // seconds for one full down-and-up swing
const BOUNCE_TAU       = 0.85;  // seconds — how fast the swings shrink (higher = bouncier for longer)
const BOUNCE_DURATION  = 2.6;   // seconds from landing until completely at rest
// The fall reaches its resting spot at t=0.125 of its window and its own
// small residual wobble is dead by t=0.6 — so waiting for the full window to
// close before bouncing left an obvious ~0.4s of nothing in between. Starting
// the bounce this many seconds BEFORE the fall window ends closes that gap:
// it picks up while the last of the fall's wobble is still fading, so the two
// blend into one continuous motion instead of reading as two animations.
const BOUNCE_LEAD      = 0.55;  // seconds earlier than the end of the fall window

// The instant a link's fall is over and its bounce takes over. bounceClock
// is measured from exactly here, so this is the seam between the two.
const LINK_FALL_END = LINK_DROP_DURATION - BOUNCE_LEAD;

// ─── Deferring the near-charm link shrink ───────────────────────────────────
// Links sitting right where a charm hangs are scaled down so they don't poke
// through the charm's body (see getLinkScale). That shrink used to apply the
// instant the charm appeared, so two links visibly popped smaller in the
// middle of the charm's own wobble — two things moving at once, right next to
// each other, reading as a glitch rather than as one action.
//
// The size change is now held to the seam between the two motions: a link
// resizes once its OWN fall has landed, just as its bounce is starting. Per
// link rather than chain-wide, so the resize follows the same ends-to-centre
// cascade the fall does instead of firing everywhere at once.
//
// A charm added later has no fall to wait on, so that case is gated on the
// charm's own wobble finishing instead — otherwise links would pop smaller
// in the middle of the charm's punch.
const LINK_SHRINK_DELAY = CHARM_WOBBLE_DURATION;  // wait out the charm's punch first
const LINK_SHRINK_TAU   = 0.12;                   // seconds — how softly the size eases in

// Bounce clock for a link, from `elapsed` seconds since its own fall began.
const bounceClock = (elapsed) => elapsed - (LINK_DROP_DURATION - BOUNCE_LEAD);

// `secondsSinceLanding` is measured from BOUNCE_LEAD before this link's fall
// window closes, so it overlaps the tail of the fall rather than following it.
// `u` is where it sits along the chain (0 = left anchor .. 1 = right anchor):
// sin(pi * u) is zero at both clasps and largest at the belly, so the ends
// stay put where the necklace is actually attached while the middle swings.
// Returns a NEGATIVE offset first, i.e. below the resting line.
function landingBounce(secondsSinceLanding, u) {
  if (secondsSinceLanding <= 0 || secondsSinceLanding >= BOUNCE_DURATION) return 0;
  const shape = Math.sin(Math.PI * Math.min(Math.max(u ?? 0.5, 0), 1));
  const envelope = Math.exp(-secondsSinceLanding / BOUNCE_TAU) * (1 - secondsSinceLanding / BOUNCE_DURATION);
  return -BOUNCE_AMPLITUDE * shape * envelope * Math.sin((2 * Math.PI * secondsSinceLanding) / BOUNCE_PERIOD);
}

// One shared fall-start time per dropKey, outside React state. Every link
// AND every charm reads from this same clock instead of each starting its
// own timer on mount — so a charm added later (same dropKey, chain already
// settled) computes an elapsed time far past the animation window and
// simply renders at rest (only the existing add-wobble plays), instead of
// replaying the fall from above. Only resets when dropKey itself changes
// (new bracelet / new chain length).
let _chainFallDropKey = null;
let _chainFallStartTime = null;
function resetChainFallAnimation() {
  _chainFallDropKey = null;
  _chainFallStartTime = null;
}
function getChainFallStartTime(dropKey, elapsedTime) {
  if (dropKey !== _chainFallDropKey) {
    _chainFallDropKey = dropKey;
    _chainFallStartTime = elapsedTime;
  }
  return _chainFallStartTime;
}

// Shared per-charm fall offset — mirrors ChainDrape's per-link drop timing
// above, but keyed on the charm's own position along the chain (`t`,
// 0 = left anchor .. 1 = right anchor) instead of a link index, so a
// charm's fall delay lines up with the link it's actually hanging from
// and it lands in lockstep with the chain instead of lagging behind it.
// The fall + landing bounce for anything riding the chain at position `t`
// (0 = left clasp .. 1 = right clasp), measured off the one shared chain
// clock — links, charms and the name pendant all read this, so they drop and
// swing as one piece instead of each running its own animation.
function chainDropOffsetAt(t, dropKey, elapsedTime, animate = true) {
  if (!animate) return 0;
  const startTime = getChainFallStartTime(dropKey, elapsedTime);
  const centerFrac = Math.abs((t ?? 0.5) - 0.5) * 2; // 0 at center, 1 at ends
  const staggerFrac = 1 - centerFrac;
  const delay = staggerFrac * LINK_DROP_STAGGER;
  const elapsed = elapsedTime - startTime - delay;
  const tt = Math.min(Math.max(elapsed / LINK_DROP_DURATION, 0), 1);
  const eased = tt <= 0 ? 0 : (tt >= 1 ? 1 : easeOutSettle(tt));
  return (1 - eased) * LINK_DROP_HEIGHT + landingBounce(bounceClock(elapsed), t ?? 0.5);
}

function useChainCharmDropOffset(t, dropKey, active, animate = true) {
  const { clock } = useThree();
  const [offset, setOffset] = useState(0);

  useFrame(() => {
    if (!active) return;
    if (!animate) { setOffset((prev) => (prev !== 0 ? 0 : prev)); return; }
    const next = chainDropOffsetAt(t, dropKey, clock.elapsedTime);
    setOffset((prev) => (Math.abs(prev - next) > 0.001 ? next : prev));
  });

  return active ? offset : 0;
}

// ─── Chain tap targets ──────────────────────────────────────────────────────
// The links themselves are thin tori — a torus only raycasts against the ring
// itself, so a tap has to land almost exactly on the metal, and the hole in
// the middle of every link is a miss. These invisible spheres are strung along
// the chain purely to catch taps, giving the whole drape a forgiving band you
// can hit anywhere near.
const CHAIN_HIT_RADIUS  = 0.45;  // world units — how far off the chain a tap still counts
const CHAIN_HIT_SPACING = 0.55;  // gap between tap targets (smaller than the radius, so they overlap into one band)
// Keep clear of charms already on the chain, so their own tap-to-delete still
// wins there instead of being swallowed by an add.
const CHAIN_HIT_CHARM_CLEARANCE = 0.55;

const ChainDrape = ({ braceletPath, materialProps, charmAnchors = [], shrinkAnchors = [], cfg, dropKey, animateFall = true, onAddCharm }) => {
  const isOval = cfg?.linkShape === 'oval';

  const ovalLinkGeometry = useMemo(() => {
    if (!cfg || !isOval) return null;
    const length = cfg.linkLength ?? 0.34;
    const width  = cfg.linkWidth  ?? 0.15;
    const tube   = cfg.linkTubeRadius ?? cfg.linkTube ?? 0.021;
    return createOvalLinkGeometry(length, width, tube);
  }, [cfg, isOval]);

  useEffect(() => () => ovalLinkGeometry?.dispose(), [ovalLinkGeometry]);

  const linkTransforms = useMemo(() => {
    if (!cfg) return [];
    return buildChainLinkTransforms(cfg, charmAnchors, shrinkAnchors).links;
  }, [cfg, charmAnchors, shrinkAnchors]);

  // Tap targets, walked along the chain at a fixed spacing rather than one per
  // link, so the count stays constant whether the chain has 70 links or 180.
  const hitPoints = useMemo(() => {
    if (!onAddCharm || !linkTransforms.length) return [];
    const pts = [];
    let last = null;
    for (const link of linkTransforms) {
      const p = link.position;
      if (last) {
        const d = Math.hypot(p[0] - last[0], p[1] - last[1], (p[2] ?? 0) - (last[2] ?? 0));
        if (d < CHAIN_HIT_SPACING) continue;
      }
      let nearCharm = false;
      for (const a of charmAnchors) {
        if (Math.hypot(p[0] - a[0], p[1] - a[1]) < CHAIN_HIT_CHARM_CLEARANCE) { nearCharm = true; break; }
      }
      if (nearCharm) continue;
      pts.push(p);
      last = p;
    }
    return pts;
  }, [linkTransforms, charmAnchors, onAddCharm]);

  // ── Per-link "falling into place" overlay ────────────────────────────
  // linkTransforms already reflects the live, smoothly-animated sag
  // (driven by ChainSagAnimator in Necklace) — the belly eases into its
  // resting curve on its own. On top of that, each link also starts
  // LINK_DROP_HEIGHT above its own current target and drops straight
  // down onto it. Keyed off `dropKey` (bracelet + chain length identity)
  // rather than `cfg` — `cfg` changes every frame while the sag
  // animation runs, which would keep resetting this timer.
  const linkRefs = useRef([]);
  const { clock } = useThree();

  // Live scale per link, eased toward its target rather than snapping. Held
  // at 1 (full size) until the chain and the charm have both come to rest.
  const linkScales = useRef([]);
  const shrinkCount = useRef(-1);
  const shrinkChangedAt = useRef(0);

  useFrame((_, delta) => {
    if (!cfg) return;
    const startTime = animateFall ? getChainFallStartTime(dropKey, clock.elapsedTime) : 0;
    const total = linkTransforms.length;

    // A charm being added or removed restarts the wait. Keyed on how many
    // anchors there are rather than on their coordinates, which drift every
    // frame while the drape is still animating.
    if (shrinkAnchors.length !== shrinkCount.current) {
      shrinkCount.current = shrinkAnchors.length;
      shrinkChangedAt.current = clock.elapsedTime;
    }
    const charmAtRest = clock.elapsedTime >= shrinkChangedAt.current + LINK_SHRINK_DELAY;
    // Frame-rate independent easing toward the target size.
    const blend = 1 - Math.exp(-Math.max(delta, 0) / LINK_SHRINK_TAU);

    for (let i = 0; i < total; i += 1) {
      const node = linkRefs.current[i];
      const link = linkTransforms[i];
      if (!node || !link) continue;
      // With the entrance animation off the chain simply IS where it belongs,
      // at the size it belongs, from the first frame.
      if (!animateFall) {
        node.position.set(link.position[0], link.position[1], link.position[2]);
        const resting = link.scale ?? 1;
        linkScales.current[i] = resting;
        node.scale.setScalar(resting);
        continue;
      }

      const centerFrac = total > 1 ? Math.abs(i / (total - 1) - 0.5) * 2 : 0; // 0 at center, 1 at both ends
      const staggerFrac = 1 - centerFrac; // both ends start first, wave converges at center
      const delay = staggerFrac * LINK_DROP_STAGGER;
      const elapsed = clock.elapsedTime - startTime - delay;
      const t = Math.min(Math.max(elapsed / LINK_DROP_DURATION, 0), 1);
      const eased = t <= 0 ? 0 : (t >= 1 ? 1 : easeOutSettle(t));
      const remaining = 1 - eased;
      const u = total > 1 ? i / (total - 1) : 0.5;
      const dy = remaining * LINK_DROP_HEIGHT + landingBounce(bounceClock(elapsed), u);
      node.position.set(link.position[0], link.position[1] + dy, link.position[2]);

      // Fall landed (bounce about to begin) and the charm has stopped punching.
      const shrinkAllowed = charmAtRest && elapsed >= LINK_FALL_END;
      const target = shrinkAllowed ? (link.scale ?? 1) : 1;
      const current = linkScales.current[i] ?? 1;
      const next = current + (target - current) * blend;
      linkScales.current[i] = next;
      node.scale.setScalar(next);
    }
  });

  if (!cfg) return null;
  if (isOval && !ovalLinkGeometry) return null;

  const material = ringMetalProps(materialProps.color || '#ECC875', { side: THREE.DoubleSide });

  // Clicking any link adds a charm. stopPropagation keeps the click from also
  // reaching whatever sits behind the chain, and the guard means the links
  // stay inert (no pointer cursor, no handler) when there is nothing to add.
  // The link's own local X is handed up rather than the raycast hit point,
  // because that is the same coordinate space the charm anchors live in —
  // comparing the two is what decides which side of the row the charm joins.
  const handleLinkClick = onAddCharm
    ? (link) => (e) => { e.stopPropagation(); onAddCharm(link.position[0]); }
    : undefined;

  return (
    <group>
     {hitPoints.map((p, i) => (
       <mesh
         key={`${braceletPath}-hit-${i}`}
         position={p}
         onClick={(e) => { e.stopPropagation(); onAddCharm(p[0]); }}
       >
         <sphereGeometry args={[CHAIN_HIT_RADIUS, 8, 6]} />
         {/* Invisible but still raycast-able. `visible={false}` would drop it
             out of raycasting entirely, so it is drawn with no colour and no
             depth write instead. */}
         <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
       </mesh>
     ))}
     {linkTransforms.map((link, i) => (
  isOval ? (
    <mesh
      key={`${braceletPath}-oval-${i}`}
      ref={(el) => { linkRefs.current[i] = el; }}
      geometry={ovalLinkGeometry}
      position={link.position}
      quaternion={link.quaternion}
      scale={1}
      castShadow
      onClick={handleLinkClick && handleLinkClick(link)}
    >
      <meshPhysicalMaterial {...material} />
    </mesh>
  ) : (
    <mesh
      key={`${braceletPath}-round-${i}`}
      ref={(el) => { linkRefs.current[i] = el; }}
      position={link.position}
      quaternion={link.quaternion}
      scale={1}
      castShadow
      onClick={handleLinkClick && handleLinkClick(link)}
    >
      <torusGeometry args={[cfg.linkOuterRadius, cfg.linkTube, 8, 20]} />
      <meshPhysicalMaterial {...material} />
    </mesh>
  )
))}
    </group>
  );
};

// ─── "Chain settling into shape" entrance animation ─────────────────────
// Instead of translating the whole chain as a rigid block, this animates
// the actual `sag` value the chain curve is built from. The two anchor
// points are fixed (that's where the chain is physically attached), so as
// `sag` eases from a deep, tightly-bunched value down to its normal
// resting value, only the belly of the chain moves — reads as it falling
// into shape from the center. Charm positions are ALSO derived from
// `sag` (via getChainCharmTransform), so as long as every consumer reads
// the same live animated value (wired up in Necklace below), the charms
// swing into place together with the chain instead of popping to their
// final spot.
const CHAIN_SAG_ANIM_DURATION = 1;  // seconds
const CHAIN_SAG_START_MULT    = 2.2;  // start sag = target sag × this (e.g. -5.76 → ~-12.7, matches your reference)



// Lives INSIDE <Canvas> (useFrame needs the R3F context) and reports the
// current animated sag up to Necklace via onSag every frame, so ChainDrape,
// the charm-anchor math, and every charm component all read one shared,
// in-sync value.
const ChainSagAnimator = ({ cfg, resetKey, onSag }) => {
  const { clock } = useThree();
  const startRef = useRef(null);

  // Re-armed only by a real chain change — a different necklace or a different
  // length. NOT by `cfg` identity: the config object is also swapped when a
  // name pendant comes and goes, and replaying the settle there would drop an
  // already-hanging chain a second time. With the clock left running, a chain
  // that has already settled simply reports its resting sag and stays put.
  useEffect(() => {
    startRef.current = null;
  }, [resetKey]);

  useFrame(() => {
    if (!cfg) return;
    if (startRef.current == null) startRef.current = clock.elapsedTime;
    const t = Math.min((clock.elapsedTime - startRef.current) / CHAIN_SAG_ANIM_DURATION, 1);
    if (t >= 1) { onSag(cfg.sag); return; }
    const eased = t * t * (3 - 2 * t);
    const mult = CHAIN_SAG_START_MULT + (1 - CHAIN_SAG_START_MULT) * eased;
    onSag(cfg.sag * mult);
  });

  return null;
};

export {
  BRACELET_ELLIPSE_CONFIG,
  getEllipseCharmTransform,
  getEllipseSlotOffsets,
  CHAIN_DRAPE_CONFIG,
  CHAIN_LENGTH_MULTIPLIERS,
  getSizedDrapeConfig,
  getDrapePoint,
  getDrapeTangent,
  buildChainLinkTransforms,
  snapToFrontFacingLink,
  getEffectiveSag,
  getChainCharmTransform,
  getSeamCharmSlots,
  getChainSeamX,
  getChainPointAtX,
  useChainCharmDropOffset,
  chainDropOffsetAt,
  getChainFallStartTime,
  resetChainFallAnimation,
  ChainDrape,
  ChainSagAnimator,
};
