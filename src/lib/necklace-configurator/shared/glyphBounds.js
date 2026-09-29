// ─── glyphBounds.js ────────────────────────────────────────────────────────
// Measures the TRUE silhouette of an isolated character using font shape data.
//
// v4 — adds a dedicated single-character path for crossing-prone letters
// (H, K, M, N, U, V, W, X, Y). When the pendant text is exactly ONE of
// these letters, both chains are driven by the SAME glyph (first === last).
// The normal logic picks the highest point in the glyph's own right half
// for the right chain and the highest point in its own left half for the
// left chain — two distinct points. For most letters that's fine. But for
// these specific letters, whose strokes are diagonal/symmetric/crossing
// through the center (especially in cursive/script fonts), the "highest
// point in the right half" can end up sitting further LEFT than the
// "highest point in the left half" — inverting the two attach points and
// making the chains cross.
//
// Fix: for a single character from this set, skip the left/right split
// and attach BOTH chains to the ONE true highest point of the glyph (its
// visual apex). Two chains meeting at the same point can never cross.
// As soon as a second character is added, first/last are different glyphs
// at different physical positions in the word, so the original left/right
// split logic is used as before — untouched.

import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';

const fontCache    = new Map(); // url -> Promise<Font>
const glyphCache   = new Map(); // key -> GlyphData

const loadFont = (fontUrl) => {
  if (!fontCache.has(fontUrl)) {
    const loader = new FontLoader();
    fontCache.set(
      fontUrl,
      new Promise((resolve, reject) =>
        loader.load(fontUrl, resolve, undefined, reject)
      )
    );
  }
  return fontCache.get(fontUrl);
};

// Sample ALL outline points (curves + holes) at high resolution.
const sampleShapePoints = (shapes, subdivisions = 96) => {
  const pts = [];
  shapes.forEach((shape) => {
    shape.getPoints(subdivisions).forEach((p) => pts.push({ x: p.x, y: p.y }));
    (shape.holes || []).forEach((hole) =>
      hole.getPoints(subdivisions).forEach((p) => pts.push({ x: p.x, y: p.y }))
    );
  });
  return pts;
};

// ─── Single-character "crossing-prone" letters ─────────────────────────────
// Case-insensitive on purpose — "X" and "x" have the same crossing-stroke
// shape problem.
const SINGLE_PEAK_CHARS = new Set(['h', 'k', 'm', 'n', 'u', 'v', 'w', 'x', 'y' , 'r']);

const isSinglePeakChar = (char) => !!char && SINGLE_PEAK_CHARS.has(char.toLowerCase());

// ─── measureShapesData ─────────────────────────────────────────────────────
// Returns:
//   left, right, bottom, top        — overall bounding box
//   centerX                         — horizontal midpoint of glyph
//
//   rightPeak.x, rightPeak.y        — highest point in the right half
//   leftPeak.x,  leftPeak.y         — highest point in the left half
//
//   topPeak.x, topPeak.y            — the SINGLE highest point of the whole
//                                      glyph (ties broken by closeness to
//                                      centerX). Only consumed by the
//                                      single-character special case below —
//                                      normal multi-character flow ignores it.
//
//   rightEdgeAtPeak                 — distance from glyph left to rightPeak.x
//   leftEdgeAtPeak                  — distance from glyph left to leftPeak.x
//
// "Right half" = x >= centerX  →  used for the FIRST character (right chain).
// "Left half"  = x <= centerX  →  used for the LAST  character (left chain).
const measureShapesData = (shapes) => {
  if (!shapes || shapes.length === 0) return null;
  const pts = sampleShapePoints(shapes);
  if (pts.length === 0) return null;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  pts.forEach(({ x, y }) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  });
  if (!Number.isFinite(minX)) return null;

  const centerX = (minX + maxX) / 2;

  // Find the single highest point in each half.
  // Ties broken by preferring the point closest to centerX (so for a
  // perfectly symmetric "A" both halves point to the apex, not a random
  // sample on the same-height flat top).
  let rPeak = { x: centerX, y: -Infinity };
  let lPeak = { x: centerX, y: -Infinity };

  pts.forEach(({ x, y }) => {
    if (x >= centerX) {
      if (
        y > rPeak.y ||
        (y === rPeak.y && Math.abs(x - centerX) < Math.abs(rPeak.x - centerX))
      ) {
        rPeak = { x, y };
      }
    }
    if (x <= centerX) {
      if (
        y > lPeak.y ||
        (y === lPeak.y && Math.abs(x - centerX) < Math.abs(lPeak.x - centerX))
      ) {
        lPeak = { x, y };
      }
    }
  });

  if (!Number.isFinite(rPeak.y)) rPeak = { x: maxX, y: maxY };
  if (!Number.isFinite(lPeak.y)) lPeak = { x: minX, y: maxY };

  // Single global apex — highest point of the WHOLE glyph, tie-broken
  // toward centerX. Used exclusively by the single-character special case.
  const TOP_EPS = 1e-4;
  let topPeak = null;
  pts.forEach((p) => {
    if (Math.abs(p.y - maxY) > TOP_EPS) return;
    if (!topPeak || Math.abs(p.x - centerX) < Math.abs(topPeak.x - centerX)) {
      topPeak = p;
    }
  });
  if (!topPeak) topPeak = { x: centerX, y: maxY };

  return {
    // Overall box
    left: minX, right: maxX, bottom: minY, top: maxY,
    centerX,
    // Per-side peaks — ABSOLUTE x/y in glyph-local space
    rightPeak: rPeak,
    leftPeak:  lPeak,
    // Single apex — see above
    topPeak,
    // Convenience: distance from glyph's own left edge to the peak x.
    // Used by the caller to convert from "glyph space" to "pendant space".
    rightEdgeAtPeak: rPeak.x - minX,
    leftEdgeAtPeak:  lPeak.x - minX,
  };
};

export const measureGlyph = async (fontUrl, char, size) => {
  if (!char || char === ' ') return null;
  const key = `${fontUrl}__${char}__${size}`;
  if (glyphCache.has(key)) return glyphCache.get(key);
  const font   = await loadFont(fontUrl);
  const shapes = font.generateShapes(char, size);
  const data   = measureShapesData(shapes);
  glyphCache.set(key, data);
  return data;
};

// ─── buildSinglePeakBox ─────────────────────────────────────────────────────
// Dedicated builder for the single-character, crossing-prone-letter case.
// Takes a normal glyph box and returns a copy where BOTH rightPeak and
// leftPeak point at the same apex (topPeak) — so whichever field the
// downstream consumer reads (rightPeak for the right chain, leftPeak for
// the left chain), it lands on the identical coordinate. Two chains
// attaching to the same point can't cross.
const buildSinglePeakBox = (box) => {
  if (!box) return null;
  return {
    ...box,
    rightPeak: box.topPeak,
    leftPeak:  box.topPeak,
  };
};

export const measureEdgeGlyphs = async (fontUrl, text, size) => {
  if (!text || text.length === 0) return { first: null, last: null };

  // ── Single-character special case ───────────────────────────────────────
  // Exactly one character AND it's one of the crossing-prone letters →
  // both chains attach to the same apex point (see buildSinglePeakBox).
  // The moment a second character is typed, text.length !== 1 and we fall
  // straight through to the normal logic below — no special casing leaks
  // into multi-character names.
  if (text.length === 1 && isSinglePeakChar(text)) {
    const box = await measureGlyph(fontUrl, text, size);
    const merged = buildSinglePeakBox(box);
    return { first: merged, last: merged };
  }

  // ── Normal case (unchanged) ──────────────────────────────────────────────
  const firstChar = text[0];
  const lastChar  = text[text.length - 1];
  if (firstChar === lastChar) {
    const box = await measureGlyph(fontUrl, firstChar, size);
    return { first: box, last: box };
  }
  const [first, last] = await Promise.all([
    measureGlyph(fontUrl, firstChar, size),
    measureGlyph(fontUrl, lastChar,  size),
  ]);
  return { first, last };
};