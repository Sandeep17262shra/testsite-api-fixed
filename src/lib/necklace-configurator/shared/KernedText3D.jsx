/* eslint-disable react/no-unknown-property */
// ─── KernedText3D ───────────────────────────────────────────────────────────
// Drop-in for drei's <Text3D> (same props, same extruded geometry) with one
// addition: CAPITAL-LETTER KERNING for script names.
//
// Script fonts are drawn so lowercase letters join on their own, but a
// capital's advance width includes its swash, so the letter after it (or
// before one, or between two capitals) often starts with a visible gap -
// "P  ayal". For every pair where at least one letter is a capital, the next
// letter is pulled left until the two actually touch: the gap is measured
// ink-to-ink, band by band across the height they share, and closed to
// CAPITAL_PAIR_GAP_EM (a hair of overlap so the strokes read as joined).
// Pairs that already touch are left alone; the pull is capped so an unusual
// glyph can never be dragged into its neighbour. Lowercase pairs keep the
// font's own spacing.
import React, { forwardRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFont } from '@react-three/drei';

const CAPITAL_PAIR_GAP_EM = -0.03;      // target ink gap, as a fraction of text size (a slight overlap)
const CAPITAL_PAIR_MAX_PULL_EM = 0.45;  // most a pair may be tightened
const INK_BANDS = 48;                   // horizontal slices used to measure the gap
const POINTS_PER_CURVE = 12;

const isCapital = (c) => /[A-Z]/.test(c);
const isInk = (c) => Boolean(c) && c.trim().length > 0;

function glyphPoints(shapes) {
  const pts = [];
  shapes.forEach((shape) => {
    shape.getPoints(POINTS_PER_CURVE).forEach((p) => pts.push(p));
    (shape.holes || []).forEach((hole) => hole.getPoints(POINTS_PER_CURVE).forEach((p) => pts.push(p)));
  });
  return pts;
}

// Smallest horizontal ink gap between two placed glyphs over the height they
// share (negative = already overlapping). Null when they share no height.
function inkGap(prevPts, prevX, nextPts, nextX) {
  if (!prevPts.length || !nextPts.length) return null;
  let minY = Infinity;
  let maxY = -Infinity;
  [...prevPts, ...nextPts].forEach((p) => { if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y; });
  const bandH = (maxY - minY) / INK_BANDS || 1;
  const band = (y) => Math.min(INK_BANDS - 1, Math.max(0, Math.floor((y - minY) / bandH)));
  const prevRight = new Array(INK_BANDS).fill(-Infinity);
  const nextLeft = new Array(INK_BANDS).fill(Infinity);
  prevPts.forEach((p) => { const b = band(p.y); prevRight[b] = Math.max(prevRight[b], p.x + prevX); });
  nextPts.forEach((p) => { const b = band(p.y); nextLeft[b] = Math.min(nextLeft[b], p.x + nextX); });
  let gap = Infinity;
  for (let b = 0; b < INK_BANDS; b += 1) {
    if (prevRight[b] > -Infinity && nextLeft[b] < Infinity) gap = Math.min(gap, nextLeft[b] - prevRight[b]);
  }
  return gap === Infinity ? null : gap;
}

function translateShape(shape, dx) {
  const move = (path) => path.curves.forEach((curve) => {
    ['v0', 'v1', 'v2', 'v3'].forEach((k) => { if (curve[k]) curve[k].x += dx; });
  });
  move(shape);
  (shape.holes || []).forEach(move);
}

// Same layout as three's font.generateShapes (advance + letterSpacing per
// character), plus the capital-pair tightening described above.
export function layoutKernedShapes(font, text, size, letterSpacing = 0, tightenCapitals = true) {
  const chars = Array.from(text || '');
  const scale = size / font.data.resolution;
  const advance = (c) => {
    const glyph = font.data.glyphs[c] || font.data.glyphs['?'];
    return glyph ? glyph.ha * scale : 0;
  };
  const shapesPerChar = chars.map((c) => font.generateShapes(c, size));
  const pointsPerChar = shapesPerChar.map((shapes) => (tightenCapitals ? glyphPoints(shapes) : []));

  const offsets = [];
  let x = 0;
  chars.forEach((c, i) => {
    if (i > 0) {
      const prev = chars[i - 1];
      x += advance(prev) + letterSpacing;
      if (tightenCapitals && isInk(prev) && isInk(c) && (isCapital(prev) || isCapital(c))) {
        const gap = inkGap(pointsPerChar[i - 1], offsets[i - 1], pointsPerChar[i], x);
        if (gap != null) {
          const pull = Math.min(Math.max(gap - CAPITAL_PAIR_GAP_EM * size, 0), CAPITAL_PAIR_MAX_PULL_EM * size);
          x -= pull;
        }
      }
    }
    offsets.push(x);
  });

  const shapes = [];
  shapesPerChar.forEach((charShapes, i) => {
    charShapes.forEach((shape) => {
      translateShape(shape, offsets[i]);
      shapes.push(shape);
    });
  });
  return shapes;
}

const splitChildren = (children) => {
  let label = '';
  const rest = [];
  React.Children.forEach(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') label += String(child);
    else rest.push(child);
  });
  return [label, rest];
};

const KernedText3D = forwardRef(({
  font: fontSource,
  size = 1,
  height = 0.2,
  curveSegments = 8,
  bevelEnabled = false,
  bevelThickness = 0.1,
  bevelSize = 0.01,
  bevelOffset = 0,
  bevelSegments = 4,
  letterSpacing = 0,
  tightenCapitals = true,
  children,
  ...props
}, ref) => {
  const font = useFont(fontSource);
  const [label, rest] = useMemo(() => splitChildren(children), [children]);

  const geometry = useMemo(() => {
    const shapes = layoutKernedShapes(font, label, size, letterSpacing, tightenCapitals);
    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: height, curveSegments, bevelEnabled, bevelThickness, bevelSize, bevelOffset, bevelSegments,
    });
    geo.type = 'TextGeometry';
    return geo;
  }, [font, label, size, letterSpacing, tightenCapitals, height, curveSegments,
      bevelEnabled, bevelThickness, bevelSize, bevelOffset, bevelSegments]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh ref={ref} geometry={geometry} {...props}>
      {rest}
    </mesh>
  );
});

KernedText3D.displayName = 'KernedText3D';

export default KernedText3D;
