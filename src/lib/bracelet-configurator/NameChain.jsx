/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */

// ─── NameChain.jsx ──────────────────────────────────────────────────────────
// The "Name Chain" bracelet has no GLB. Everything you see is generated here:
//
//   1. The name is extruded as real 3D text (Text3D) lying flat in the
//      bracelet's plane, so it reads correctly from the default top-down view.
//   2. A washer (flat metal ring) is welded to each end of the plate. Their
//      positions come from the *measured* width of the text, so they always sit
//      exactly on the letters' edges no matter how long the name is.
//   3. A chain of interlocking links is then generated from the right washer,
//      the long way around, back to the left washer - closing the loop into a
//      bracelet. The wider the name, the bigger the gap it opens, and the chain
//      re-flows automatically to fill whatever is left.
//
// With the name switched off (or empty) the gap collapses to zero and the same
// generator produces a plain closed link bracelet.
//
// Everything is tunable from NAME_CHAIN_CONFIG below - all values are in the
// same world units the bracelet scene already uses (the GLB chains sit at
// y ~ 0.6 with a radius of ~1.0, so these defaults line up with them).

import React, { useEffect, useMemo, useRef, useState, useLayoutEffect, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { Text3D } from "@react-three/drei";
import * as THREE from "three";
import {
  NAME_PENDANT_FONTS, sanitizePendantText,
  GENERATED_NAME_CHAIN_PATH, GENERATED_NAME_CHAIN_ROUND_PATH, GENERATED_NAME_CHAIN_OVAL_PATH,
  GENERATED_NAME_CHAIN_SQUARE_PATH,
} from "./assets";

export const NAME_CHAIN_CONFIG = {
  // ── Ring ──────────────────────────────────────────────────────────────────
  centerY: 0.6,      // height of the bracelet's plane (matches the GLB chains)
  radiusX: 0.92,     // half-width of the loop
  radiusZ: 0.92,     // half-depth of the loop (equal to radiusX = a circle)

  // ── Links ─────────────────────────────────────────────────────────────────
  // Proportions match the necklace's procedural chains (BRACELET15-18), scaled
  // down to the bracelet's ring: there a link is ~6% of its own length in wire
  // thickness and ~44% in width. Keeping those ratios is what stops the chain
  // reading as thick rope instead of jewellery.
  linkLength: 0.085, // long axis of one oval link
  linkWidth: 0.038,  // short axis of one oval link
  linkTube: 0.0070,  // wire thickness of a link
  linkOverlap: 0.62, // centre-to-centre spacing as a fraction of linkLength
                     // (< 1 makes consecutive links visibly interlock)
  linkCornerRatio: 1, // corner radius as a fraction of HALF the link's width.
                      // 1 = fully rounded ends (stadium, or a circle when
                      // width == length); ~0.3 reads as a square link.
  linkTubularSegments: 26,
  linkRadialSegments: 6,

  // Rotation of the plate about the X axis, in radians.
  //    0          = STANDS UPRIGHT on the chain, letters facing the viewer
  //                 (front of the ring). This is the product-shot look.
  //   -Math.PI/2  = lies FLAT in the plane of the chain, readable from
  //                 straight above (the old flat-lay look).
  // Anything between the two leans the plate back by that much.
  plateTilt: 0,

  // ── Name plate ────────────────────────────────────────────────────────────
  // Also matched to the necklace: its plate is ~9.5% of the piece's width with
  // an extrusion ~12% of the letter height.
  textSize: 0.28,
  textDepth: 0.024,
  textBevel: 0.003,
  textCurveSegments: 12,

  // ── Washers (the loops that join the plate to the chain) ──────────────────
  washerOuter: 0.044,
  washerInner: 0.033,
  washerDepth: 0.016,
  // How far the washer sits INSIDE the name's outer edge, in world units. On
  // real name jewellery the jump ring is soldered onto the first and last
  // letter, so it has to overlap them, not float beside them. Because the
  // measured bounds include swashes and descenders, a value close to
  // washerOuter is what makes the ring actually land on the letter's stroke.
  // Lower it to pull the washers apart, raise it to bury them deeper.
  washerOverlap: 0.056,
  // Half-height of the horizontal band (as a fraction of textSize) that the
  // first/last letter's real outline is measured in. The washer sits at the
  // vertical middle of the name, so only the ink AT THAT HEIGHT decides where
  // it can touch - a descender or a trailing swash elsewhere must not push it
  // outward.
  washerBandRatio: 0.35,

  // How far round the ring the name plate is allowed to reach, as sin(half the
  // gap angle). The plate is a straight chord, so a wide gap pulls it deep
  // inside the circle and it stops reading as part of the bracelet. Longer
  // names are scaled DOWN to respect this instead - the same thing real name
  // jewellery does.
  maxGapSin: 0.75,
  minTextScale: 0.5,  // never shrink the letters past this, however long the name

  // ── Per-charm-category placement ──────────────────────────────────────────
  // THIS IS THE TABLE TO TUNE when a charm doesn't sit right on the chain.
  // One entry per charm category, matching the Charms panel's categories.
  //
  //   anchor         "top"    - the charm HANGS off the chain: its bail is
  //                             pinned to the chain and the body dangles
  //                             outward. Right for 2D, 3D and initial charms.
  //                  "center" - the charm sits IN the chain: its middle is
  //                             pinned to the chain line so it straddles it,
  //                             the way a bezel-set stone is threaded in.
  //                             Right for birthstones and diamonds.
  //   radiusOffset   + pushes the charm OUTWARD, away from the bracelet's
  //                  centre; - pulls it INWARD, over the chain.
  //   yOffset        + lifts the charm above the chain's plane, - drops it
  //                  below ("a little under").
  //   rotationOffset extra spin, in radians, about the bracelet's up axis.
  //   scale          multiplier on the charm's own size (1 = unchanged).
  //
  // Units are the same as the ring (radius ~0.92), so 0.01 is a small nudge
  // and 0.05 is about half a link. Any style in NAME_CHAIN_LINK_STYLES can
  // override individual categories - heavier links want hanging charms pushed
  // a little further out.
  charmPlacement: {
    birthstone: { anchor: "center", radiusOffset: 0,     yOffset: 0, rotationOffset: 0, scale: 1 },
    diamond:    { anchor: "center", radiusOffset: 0,     yOffset: 0, rotationOffset: 0, scale: 1 },
    gemstone:   { anchor: "center", radiusOffset: 0,     yOffset: 0, rotationOffset: 0, scale: 1 },
    initial:    { anchor: "top",    radiusOffset: 0.2, yOffset: 0, rotationOffset: 0, scale: 1 },
    image:      { anchor: "top",    radiusOffset: 0.17, yOffset: 0, rotationOffset: 0, scale: 1 },
    // 3D charms are authored much larger than the 2D ones and have no
    // per-bracelet scale entry to fall back on, so they need reining in here.
    glb:        { anchor: "top",    radiusOffset: 0.008, yOffset: 0, rotationOffset: 0, scale: 0.8 },
  },
};

// ─── Link styles ────────────────────────────────────────────────────────────
// Each generated chain is the SAME ring, plate and washers - only the shape of
// one link changes. A link is a rounded-rectangle ("stadium") path swept into a
// tube, so linkWidth is what decides the family:
//   linkWidth <  linkLength  -> an elongated cable link
//   linkWidth == linkLength  -> a perfect circle (the straight run vanishes)
// linkOverlap is centre-to-centre spacing as a fraction of linkLength; below 1
// consecutive links visibly thread through each other.
//
// To add another style: add a path in assets.js, list it in
// NAME_PENDANT_SUPPORTED_PATHS and BRACELETS, then add an entry here.
const NAME_CHAIN_LINK_STYLES = {
  [GENERATED_NAME_CHAIN_PATH]: {
    // Cable: long, narrow links - the finest of the three.
    linkLength: 0.095,
    linkWidth: 0.038,
    linkTube: 0.0055,
    linkOverlap: 0.82,
  },
  [GENERATED_NAME_CHAIN_ROUND_PATH]: {
    // Round: perfectly circular links (width == length).
    linkLength: 0.060,
    linkWidth: 0.060,
    linkTube: 0.0062,
    linkOverlap: 0.80,
    linkTubularSegments: 20,
  },
  [GENERATED_NAME_CHAIN_SQUARE_PATH]: {
    // Square: equal-sided links with barely-rounded corners. They need more
    // tube segments than the round shapes - the curvature all sits in four
    // short corners, so evenly spaced samples get few of them each.
    linkLength: 0.052,
    linkWidth: 0.052,
    linkCornerRatio: 0.28,
    linkTube: 0.0062,
    // Squares read denser than circles at the same spacing - they fill their
    // footprint - so they need more room between centres to stay legible.
    linkOverlap: 0.86,
    linkTubularSegments: 48,
  },
  [GENERATED_NAME_CHAIN_OVAL_PATH]: {
    // Oval: shorter and noticeably rounder than the cable link, in slightly
    // heavier wire - reads as a chunkier chain without looking clumsy.
    linkLength: 0.076,
    linkWidth: 0.052,
    linkTube: 0.0058,
    linkOverlap: 0.80,
  },
};

// Charm categories, finer-grained than Bracelet.jsx's getCharmKind (which lumps
// every stone together as "gemstone"), so birthstones and diamonds can be tuned
// apart - different models, different bezels.
export function getNameChainCharmCategory(charm) {
  if (!charm) return "glb";
  if (charm.type === "initial") return "initial";
  if (charm.type === "birthstone") return "birthstone";
  if (charm.type === "diamond") return "diamond";
  if (charm.type === "cushion") return "gemstone";
  return /\.(png|jpe?g|webp|gif|svg)$/i.test(charm.path || "") ? "image" : "glb";
}

export const DEFAULT_CHARM_PLACEMENT = {
  anchor: "top", radiusOffset: 0, yOffset: 0, rotationOffset: 0, scale: 1,
};

export function getCharmPlacementConfig(cfg, category) {
  return { ...DEFAULT_CHARM_PLACEMENT, ...(cfg?.charmPlacement?.[category] || {}) };
}

// Built once at module scope so each path always hands back the SAME object.
// Several useMemo hooks below key off `cfg` by identity; rebuilding it per
// render would rebuild every link geometry on every frame.
const NAME_CHAIN_CONFIGS = Object.fromEntries(
  Object.entries(NAME_CHAIN_LINK_STYLES).map(([path, { charmPlacement, ...link }]) => [
    path,
    {
      ...NAME_CHAIN_CONFIG,
      ...link,
      // Merged per category, so a style only names the categories it changes.
      charmPlacement: Object.fromEntries(
        Object.entries(NAME_CHAIN_CONFIG.charmPlacement).map(([category, base]) => [
          category, { ...base, ...(charmPlacement?.[category] || {}) },
        ]),
      ),
    },
  ]),
);

export function getNameChainConfig(path) {
  return NAME_CHAIN_CONFIGS[path] ?? NAME_CHAIN_CONFIG;
}

const FONT_BY_ID = NAME_PENDANT_FONTS.reduce((acc, f) => { acc[f.id] = f; return acc; }, {});
const getFont = (id) => FONT_BY_ID[id] || NAME_PENDANT_FONTS[0];

// ─── Link geometry ──────────────────────────────────────────────────────────
// Every link shape is one rounded rectangle swept into a tube. The corner
// radius is what picks the family, so there is only ever one curve to maintain:
//
//   r = width/2, length > width  ->  stadium  (cable / oval link)
//   r = width/2, length = width  ->  circle   (round link; straights vanish)
//   r << width/2                 ->  square / rectangular link
//
// getPoint is parameterised by ARC LENGTH, not by segment index, so tube
// samples stay evenly spaced along the perimeter whatever the corner radius.
class RoundedRectCurve extends THREE.Curve {
  constructor(length, width, cornerRadius) {
    super();
    this.halfLength = Math.max(length, 1e-4) / 2;
    this.halfWidth = Math.max(width, 1e-4) / 2;
    // A radius can never exceed either half-extent, or the corners overlap.
    this.radius = Math.min(cornerRadius, this.halfLength, this.halfWidth);

    this.straightX = Math.max(2 * (this.halfLength - this.radius), 0);
    this.straightY = Math.max(2 * (this.halfWidth - this.radius), 0);
    this.corner = (Math.PI / 2) * this.radius;
    this.totalLen = 2 * this.straightX + 2 * this.straightY + 4 * this.corner;
  }

  getPoint(t, target = new THREE.Vector3()) {
    const { halfLength: a, halfWidth: b, radius: r, straightX, straightY, corner, totalLen } = this;
    let s = t * totalLen;
    let x;
    let y;

    // Walk the perimeter clockwise from the left end of the top edge.
    if (s <= straightX) {                                   // top edge, +x
      x = -(a - r) + s;
      y = b;
    } else if ((s -= straightX) <= corner) {                // top-right corner
      const angle = Math.PI / 2 - (s / corner) * (Math.PI / 2);
      x = (a - r) + r * Math.cos(angle);
      y = (b - r) + r * Math.sin(angle);
    } else if ((s -= corner) <= straightY) {                // right edge, -y
      x = a;
      y = (b - r) - s;
    } else if ((s -= straightY) <= corner) {                // bottom-right corner
      const angle = -(s / corner) * (Math.PI / 2);
      x = (a - r) + r * Math.cos(angle);
      y = -(b - r) + r * Math.sin(angle);
    } else if ((s -= corner) <= straightX) {                // bottom edge, -x
      x = (a - r) - s;
      y = -b;
    } else if ((s -= straightX) <= corner) {                // bottom-left corner
      const angle = -Math.PI / 2 - (s / corner) * (Math.PI / 2);
      x = -(a - r) + r * Math.cos(angle);
      y = -(b - r) + r * Math.sin(angle);
    } else if ((s -= corner) <= straightY) {                // left edge, +y
      x = -a;
      y = -(b - r) + s;
    } else {                                                // top-left corner
      s -= straightY;
      const angle = Math.PI - (s / corner) * (Math.PI / 2);
      x = -(a - r) + r * Math.cos(angle);
      y = (b - r) + r * Math.sin(angle);
    }

    return target.set(x, y, 0);
  }
}

function createOvalLinkGeometry(cfg) {
  // linkCornerRatio is a fraction of half the link's width: 1 rounds the ends
  // off completely (stadium/circle), lower values square them off.
  const cornerRadius = (cfg.linkWidth / 2) * (cfg.linkCornerRatio ?? 1);
  const curve = new RoundedRectCurve(cfg.linkLength, cfg.linkWidth, cornerRadius);
  return new THREE.TubeGeometry(
    curve, cfg.linkTubularSegments, cfg.linkTube, cfg.linkRadialSegments, true,
  );
}

// ─── Ring maths ─────────────────────────────────────────────────────────────
// The loop lives in the scene's X/Z plane at y = centerY, exactly like the
// existing bracelets. Angle 0 is +X; angle PI/2 is +Z, which is the FRONT of
// the bracelet (nearest the viewer in the default top-down camera) and where
// the name plate sits.
const FRONT_ANGLE = Math.PI / 2;

// Half-angle of the gap the name opens up. `halfWidth` is half the measured
// width of the letters; the washers sit just outside them.
export function getNameGapHalfAngle(halfWidth, cfg = NAME_CHAIN_CONFIG) {
  if (!halfWidth) return 0;
  const anchorX = halfWidth + cfg.washerOuter - cfg.washerOverlap;
  const ratio = Math.min(anchorX / cfg.radiusX, cfg.maxGapSin);
  return Math.asin(ratio);
}

// World position of a point on the ring at `angle`.
function ringPoint(angle, cfg = NAME_CHAIN_CONFIG) {
  return new THREE.Vector3(
    cfg.radiusX * Math.cos(angle),
    cfg.centerY,
    cfg.radiusZ * Math.sin(angle),
  );
}

// ─── Charm placement ────────────────────────────────────────────────────────
// Charms are spread evenly along whatever arc the chain actually occupies, so
// they never collide with the name plate and always re-space when the name (or
// the number of charms) changes. Returned in the same [position]/[rotation]
// shape as Bracelet.jsx's getOrbitCharmTransform, so the existing charm
// renderers need no changes.
export function getNameChainCharmPlacement(index, total, gapHalfAngle = 0, cfg = NAME_CHAIN_CONFIG, category = "glb") {
  const start = FRONT_ANGLE - gapHalfAngle;      // right-hand end of the chain
  const sweep = 2 * Math.PI - 2 * gapHalfAngle;  // arc the chain covers
  const u = total > 0 ? (index + 1) / (total + 1) : 0.5;
  const angle = start - u * sweep;

  const placement = getCharmPlacementConfig(cfg, category);

  // Outward normal of the ring at this angle. For an ellipse that is NOT the
  // same as the direction from the centre, so derive it from the tangent.
  const normalX = cfg.radiusZ * Math.cos(angle);
  const normalZ = cfg.radiusX * Math.sin(angle);
  const normalLength = Math.hypot(normalX, normalZ) || 1;

  const x = cfg.radiusX * Math.cos(angle) + (normalX / normalLength) * placement.radiusOffset;
  const z = cfg.radiusZ * Math.sin(angle) + (normalZ / normalLength) * placement.radiusOffset;

  // "center"-anchored charms (birthstones, diamonds, gemstones) are threaded
  // INTO the chain, bezel-style, rather than hung off it - like the stones on
  // a tennis bracelet, every one should show the same face to the camera. If
  // their rotation tracked the true `angle` the way hanging charms' does,
  // each one would twist to match its own spot on the loop and only the
  // charm nearest FRONT_ANGLE would actually face front. Freezing the
  // rotation to FRONT_ANGLE keeps every one of them facing the same way -
  // forward, toward the default viewing angle - wherever they land along the
  // arc; only their position still follows the real angle.
  const rotationAngle = placement.anchor === "center" ? FRONT_ANGLE : angle;

  return {
    position: [x, cfg.centerY + placement.yOffset, z],
    // Same convention as getOrbitCharmTransform: the Y-flip baked into this
    // Euler triple reverses the Z rotation, so the angle has to be mirrored
    // about the ring's front for a charm to hang OUTWARD off the chain.
    rotation: [Math.PI / 2, Math.PI, (Math.PI - rotationAngle) + Math.PI / 2 + placement.rotationOffset],
    anchor: placement.anchor,
    scale: placement.scale,
  };
}

// ─── Link transforms ────────────────────────────────────────────────────────
// Walks the arc by true arc length, dropping a link every `spacing`, and
// alternates every other link 90 degrees about the local tangent so they
// interlock the way a real chain does.
function buildLinkMatrices(gapHalfAngle, cfg = NAME_CHAIN_CONFIG) {
  const start = FRONT_ANGLE - gapHalfAngle;
  const sweep = 2 * Math.PI - 2 * gapHalfAngle;

  const SAMPLES = 512;
  const at = (u) => {
    const a = start - u * sweep;
    return new THREE.Vector3(cfg.radiusX * Math.cos(a), 0, cfg.radiusZ * Math.sin(a));
  };

  const cum = [0];
  let prev = at(0);
  for (let i = 1; i <= SAMPLES; i += 1) {
    const p = at(i / SAMPLES);
    cum.push(cum[i - 1] + p.distanceTo(prev));
    prev = p;
  }
  const totalLen = cum[SAMPLES];

  const spacing = Math.max(cfg.linkLength * cfg.linkOverlap, 0.01);
  const count = Math.max(6, Math.round(totalLen / spacing));

  const uAtDistance = (d) => {
    let i = 1;
    while (i < SAMPLES && cum[i] < d) i += 1;
    const a = cum[i - 1];
    const b = cum[i];
    const local = b > a ? (d - a) / (b - a) : 0;
    return ((i - 1) + local) / SAMPLES;
  };

  const up = new THREE.Vector3(0, 1, 0);
  const matrices = [];

  for (let i = 0; i <= count; i += 1) {
    const u = uAtDistance((i / count) * totalLen);
    const angle = start - u * sweep;

    const position = ringPoint(angle, cfg);
    // d/dangle of the ellipse, negated because we walk with decreasing angle.
    const tangent = new THREE.Vector3(
      cfg.radiusX * Math.sin(angle),
      0,
      -cfg.radiusZ * Math.cos(angle),
    ).normalize();

    let axisX;
    let axisY;
    let axisZ;
    if (i % 2 === 0) {
      // Flat link: the oval lies in the plane of the bracelet.
      axisX = tangent.clone();
      axisZ = up.clone();
      axisY = new THREE.Vector3().crossVectors(axisZ, axisX).normalize();
    } else {
      // Edge-on link: the oval stands upright, threaded through its neighbours.
      axisX = tangent.clone();
      axisY = up.clone();
      axisZ = new THREE.Vector3().crossVectors(axisX, axisY).normalize();
    }

    const matrix = new THREE.Matrix4().makeBasis(axisX, axisY, axisZ);
    matrix.setPosition(position);
    matrices.push(matrix);
  }

  return matrices;
}

// ─── Metal material shared by links, plate and washers ──────────────────────
// `minRoughness` matters: the name plate is a large FLAT face pointing straight
// at the camera, and a mirror-smooth metal (roughness 0) has no diffuse term at
// all, so it just mirrors whatever is directly above it and reads as near
// black. Blurring the reflection a little makes it read as polished metal.
function useMetalMaterialProps(materialProps = {}, minRoughness = 0) {
  return useMemo(() => ({
    color: new THREE.Color(materialProps.color || "#DBDBDB"),
    metalness: materialProps.metalness ?? 1,
    roughness: Math.max(materialProps.roughness ?? 0.08, minRoughness),
    envMapIntensity: materialProps.envMapIntensity ?? 1,
  }), [materialProps.color, materialProps.metalness, materialProps.roughness, materialProps.envMapIntensity, minRoughness]);
}

// Roughness floor for the flat plate + washers (see note above).
const FLAT_FACE_MIN_ROUGHNESS = 0.26;

// ─── Chain links ────────────────────────────────────────────────────────────
const ChainLinks = ({ gapHalfAngle, materialProps, cfg = NAME_CHAIN_CONFIG }) => {
  const meshRef = useRef();
  const metal = useMetalMaterialProps(materialProps);

  const geometry = useMemo(() => createOvalLinkGeometry(cfg), [
    cfg.linkLength, cfg.linkWidth, cfg.linkTube, cfg.linkCornerRatio,
    cfg.linkTubularSegments, cfg.linkRadialSegments,
  ]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const matrices = useMemo(() => buildLinkMatrices(gapHalfAngle, cfg), [gapHalfAngle, cfg]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.count = matrices.length;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);

  return (
    <instancedMesh
      key={matrices.length}
      ref={meshRef}
      args={[undefined, undefined, matrices.length]}
      castShadow
      receiveShadow
    >
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial {...metal} />
    </instancedMesh>
  );
};

// ─── Washer ─────────────────────────────────────────────────────────────────
const Washer = ({ position, materialProps, cfg = NAME_CHAIN_CONFIG }) => {
  const metal = useMetalMaterialProps(materialProps, FLAT_FACE_MIN_ROUGHNESS);

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.absarc(0, 0, cfg.washerOuter, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, cfg.washerInner, 0, Math.PI * 2, true);
    s.holes.push(hole);
    return s;
  }, [cfg.washerOuter, cfg.washerInner]);

  const extrudeSettings = useMemo(() => ({
    depth: cfg.washerDepth,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 4,
    curveSegments: 24,
  }), [cfg.washerDepth]);

  return (
    <mesh position={position} castShadow receiveShadow>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial {...metal} side={THREE.DoubleSide} />
    </mesh>
  );
};

// ─── Text bounds probe ──────────────────────────────────────────────────────
// Reads the extruded text's own GEOMETRY bounds (not its world bounds), so the
// measurement can't feed back into the transform we then derive from it.
const TextBoundsProbe = ({ targetRef, onMeasured, deps, band }) => {
  const done = useRef(false);

  useEffect(() => { done.current = false; }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    if (done.current || !targetRef.current) return;

    const box = new THREE.Box3();
    const geometries = [];
    targetRef.current.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;
      if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
      const bb = child.geometry.boundingBox;
      if (!bb || !Number.isFinite(bb.min.x) || !Number.isFinite(bb.max.x)) return;
      box.union(bb);
      geometries.push(child.geometry);
    });

    if (!geometries.length || box.isEmpty()) return;
    done.current = true;

    // ── Where the washers sit, vertically ──────────────────────────────────
    // NOT the middle of the bounding box: one capital or one ascender ("A",
    // "l", "d") drags the box top far above the body of the word, which pushes
    // the washers up to float past the top of the small letters. What we want
    // is the middle of the x-height - the band the chain should run through,
    // with tall letters rising above it, exactly like a real name bracelet.
    //
    // The median outline height is a good stand-in for that: the bulk of any
    // word's outline sits in its x-height, so a few tall strokes barely move
    // it, while an all-caps name shifts it up correctly on its own.
    const BINS = 512;
    const spanY = Math.max(box.max.y - box.min.y, 1e-6);
    const histogram = new Int32Array(BINS);
    let totalVerts = 0;
    for (const geometry of geometries) {
      const position = geometry.getAttribute("position");
      if (!position) continue;
      for (let i = 0; i < position.count; i += 1) {
        const t = (position.getY(i) - box.min.y) / spanY;
        const bin = Math.min(BINS - 1, Math.max(0, Math.floor(t * BINS)));
        histogram[bin] += 1;
        totalVerts += 1;
      }
    }
    let midY = (box.min.y + box.max.y) / 2;
    if (totalVerts > 0) {
      const half = totalVerts / 2;
      let running = 0;
      for (let bin = 0; bin < BINS; bin += 1) {
        running += histogram[bin];
        if (running >= half) {
          midY = box.min.y + ((bin + 0.5) / BINS) * spanY;
          break;
        }
      }
    }

    // Leftmost / rightmost actual outline points within the washer's band.
    // Glyph bounding boxes are useless here: a script "p" throws a swash well
    // past its stroke and a descender well below it, so anchoring to the box
    // leaves the washer floating in empty space beside the letter.
    let inkLeft = Infinity;
    let inkRight = -Infinity;
    for (const geometry of geometries) {
      const position = geometry.getAttribute("position");
      if (!position) continue;
      for (let i = 0; i < position.count; i += 1) {
        if (Math.abs(position.getY(i) - midY) > band) continue;
        const x = position.getX(i);
        if (x < inkLeft) inkLeft = x;
        if (x > inkRight) inkRight = x;
      }
    }
    if (!Number.isFinite(inkLeft) || !Number.isFinite(inkRight) || inkRight <= inkLeft) {
      inkLeft = box.min.x;
      inkRight = box.max.x;
    }

    onMeasured({
      left: box.min.x, right: box.max.x,
      bottom: box.min.y, top: box.max.y,
      inkLeft, inkRight, midY,
    });
  });

  return null;
};

// ─── The whole generated bracelet ───────────────────────────────────────────
const NameChainBracelet = ({ namePendant, materialProps, onGeometryChange, braceletPath, cfg: cfgOverride }) => {
  // Link geometry comes from the selected style; everything else (ring size,
  // plate, washers) is shared.
  const cfg = cfgOverride ?? getNameChainConfig(braceletPath);
  const cleanText = sanitizePendantText(namePendant?.text || "");
  const hasName = Boolean(namePendant?.enabled) && cleanText.length > 0;

  const font = getFont(namePendant?.fontStyle);
  const textRef = useRef();
  const [bounds, setBounds] = useState(null);
  const metal = useMetalMaterialProps(materialProps, FLAT_FACE_MIN_ROUGHNESS);

  // A new name or font invalidates the old measurement.
  useEffect(() => { setBounds(null); }, [cleanText, font.id, hasName]);

  // Measured at the base text size, from the letters' real outline at washer
  // height (not the glyph box). A long name is then scaled down so the gap it
  // opens never exceeds cfg.maxGapSin - otherwise the (straight) plate sinks
  // toward the middle of the ring instead of sitting on its front edge.
  const rawHalfWidth = hasName && bounds ? (bounds.inkRight - bounds.inkLeft) / 2 : 0;
  const textScale = useMemo(() => {
    if (!rawHalfWidth) return 1;
    // Must mirror getNameGapHalfAngle's anchorX, or a capped name would open a
    // gap the washers no longer sit at the ends of.
    const allowedHalfWidth = Math.max(
      cfg.radiusX * cfg.maxGapSin - cfg.washerOuter + cfg.washerOverlap,
      0.05,
    );
    return Math.max(Math.min(1, allowedHalfWidth / rawHalfWidth), cfg.minTextScale);
  }, [rawHalfWidth, cfg]);

  const halfWidth = rawHalfWidth * textScale;
  const gapHalfAngle = useMemo(() => getNameGapHalfAngle(halfWidth, cfg), [halfWidth, cfg]);

  // Publish the gap upward so charms can be spread along the remaining arc.
  useEffect(() => {
    onGeometryChange?.({ gapHalfAngle, halfWidth, hasName });
  }, [gapHalfAngle, halfWidth, hasName, onGeometryChange]);

  // Where the plate + washers sit. The two washers must land exactly ON the
  // ring, so the plate is pushed forward by half its own letter height - that
  // way its vertical mid-line (which is what the chain attaches to) coincides
  // with the ring itself.
  const anchorZ = cfg.radiusZ * Math.cos(gapHalfAngle);
  const anchorX = cfg.radiusX * Math.sin(gapHalfAngle);
  const midY = (bounds ? bounds.midY : cfg.textSize * 0.25) * textScale;
  // Centred on the ink band rather than the glyph box, so the two washers stay
  // symmetric about the ring's front even when one end has a long swash.
  const centeredX = bounds ? -(bounds.inkLeft + bounds.inkRight) / 2 : 0;

  return (
    <group>
      <ChainLinks gapHalfAngle={gapHalfAngle} materialProps={materialProps} cfg={cfg} />

      {hasName && (
        // Positioned so the plate's vertical mid-line - the line the washers sit
        // on - lands exactly on the ring, whatever cfg.plateTilt is set to.
        <group
          position={[
            0,
            cfg.centerY - midY * Math.cos(cfg.plateTilt),
            anchorZ - midY * Math.sin(cfg.plateTilt),
          ]}
          rotation={[cfg.plateTilt, 0, 0]}
        >
          <group scale={textScale}>
          <group ref={textRef} position={[centeredX, 0, -cfg.textDepth / 2]}>
            <Suspense fallback={null}>
              <Text3D
                font={font.url}
                size={cfg.textSize}
                height={cfg.textDepth}
                curveSegments={cfg.textCurveSegments}
                bevelEnabled
                bevelThickness={cfg.textBevel}
                bevelSize={cfg.textBevel * 0.5}
                bevelSegments={4}
                letterSpacing={cfg.textSize * (font.letterSpacingEm ?? 0)}
              >
                {cleanText}
                <meshStandardMaterial {...metal} side={THREE.DoubleSide} />
              </Text3D>
            </Suspense>
          </group>
          </group>

          {bounds && (
            <>
              <Washer position={[-anchorX, midY, -cfg.washerDepth / 2]} materialProps={materialProps} cfg={cfg} />
              <Washer position={[anchorX, midY, -cfg.washerDepth / 2]} materialProps={materialProps} cfg={cfg} />
            </>
          )}

          <TextBoundsProbe
            targetRef={textRef}
            onMeasured={setBounds}
            band={cfg.textSize * cfg.washerBandRatio}
            deps={[cleanText, font.id]}
          />
        </group>
      )}
    </group>
  );
};

export default NameChainBracelet;
