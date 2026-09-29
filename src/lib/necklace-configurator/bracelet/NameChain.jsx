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
//   3. A chain of interlocking links is then generated outward from BOTH
//      washers at once, meeting at the back of the wrist - so the first link on
//      each side hooks its washer exactly, and only the rounding meets at the
//      back where nobody looks. The wider the name, the bigger the gap it opens,
//      and the chain re-flows automatically to fill whatever is left.
//
// With the name switched off (or empty) the gap collapses to zero and the same
// generator produces a plain closed link bracelet.
//
// Everything is tunable from NAME_CHAIN_CONFIG below - all values are in the
// same world units the bracelet scene already uses (the GLB chains sit at
// y ~ 0.6 with a radius of ~1.0, so these defaults line up with them).

import React, { useEffect, useMemo, useRef, useState, useLayoutEffect, Suspense } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { RGBELoader, GLTFLoader } from "three-stdlib";
import KernedText3D from "../shared/KernedText3D";
import * as THREE from "three";
import {
  NAME_PENDANT_FONTS, sanitizePendantText,
  GENERATED_NAME_CHAIN_PATH, GENERATED_NAME_CHAIN_ROUND_PATH, GENERATED_NAME_CHAIN_OVAL_PATH,
  GENERATED_NAME_CHAIN_SQUARE_PATH,
} from "../shared/assets";
import { RING_METAL, RING_METAL_ENV_URL, toRingMetalColor } from "../shared/metalMaterial";

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
    initial:    { anchor: "top",    radiusOffset: 0.18, yOffset: 0, rotationOffset: 0, scale: 1 },
    image:      { anchor: "top",    radiusOffset: 0.17, yOffset: 0, rotationOffset: 0, scale: 1 },
    // 3D charms are authored much larger than the 2D ones and have no
    // per-bracelet scale entry to fall back on, so they need reining in here.
    glb:        { anchor: "top",    radiusOffset: 0.008, yOffset: 0, rotationOffset: 0, scale: 0.8 },
  },

  // ── Clasp: spring-ring lock at the BACK, opposite the name plate ──────────
  // The chain is split at the back and its two end links hook into the lock:
  // one through the tab's hole, the other through the spring ring.
  //   scale       size of flat_spring_ring.glb in the bracelet (model units
  //               -> world units). 0.02 = ring about 0.12 across.
  //   tabAttach / ringAttach
  //               points in the MODEL's own units where the end links pass
  //               through (the tab's hole, and just inside the bottom of the
  //               spring ring). The lock is centred between them and laid
  //               along the chain.
  //   leverUp     true = the spring lever points up, false = down.
  //   charmClearance
  //               extra room kept free either side of the lock when charms
  //               are spread along a name bracelet.
  lock: {
    enabled: true,
    // ?v= busts the 1-year immutable cache when the file changes (simplified 1.6 MB -> 80 KB).
    path: "/bc-assets/bracelet_models/flat_spring_ring.glb?v=20260911",
    scale: 0.02,
    tabAttach: [7.323, 0, -4.79],
    ringAttach: [7.323, 0, -10.2],
    leverUp: true,
    charmClearance: 0.07,
  },
};

// Charms allowed on a generated chain: 5 on a plain chain, 4 once a name is
// added (2 each side, between the name and the lock).
export const NAME_CHAIN_MAX_CHARMS = 5;
export const NAME_CHAIN_MAX_CHARMS_WITH_NAME = 4;

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
    linkLength: 0.045,
    linkWidth: 0.045,
    linkTube: 0.0055,
    linkOverlap: 0.80,
    linkTubularSegments: 20,
  },
  [GENERATED_NAME_CHAIN_SQUARE_PATH]: {
    // Square: equal-sided links with barely-rounded corners. They need more
    // tube segments than the round shapes - the curvature all sits in four
    // short corners, so evenly spaced samples get few of them each.
    linkLength: 0.052,
    linkWidth: 0.040,
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
// The clasp sits directly opposite the name.
const BACK_ANGLE = FRONT_ANGLE + Math.PI;

// Where the lock sits along the chain. `endLinkOffset` is how far (in arc
// length) from the lock's centre the chain's last link on each side is centred,
// so that link's near end threads through the lock.
function getLockLayout(cfg = NAME_CHAIN_CONFIG) {
  const lock = cfg.lock;
  if (!lock?.enabled) return null;
  const center = [0, 1, 2].map((i) => (lock.tabAttach[i] + lock.ringAttach[i]) / 2);
  const halfSpan = (Math.abs(lock.tabAttach[2] - lock.ringAttach[2]) / 2) * lock.scale;
  const openLong = Math.max(cfg.linkLength / 2 - cfg.linkTube, 1e-4);
  return { center, halfSpan, endLinkOffset: halfSpan + openLong };
}

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
// Two modes:
//
// NO NAME (gapHalfAngle === 0):
//   Charms are fanned symmetrically around FRONT_ANGLE (+Z, nearest viewer).
//   1 charm → exactly at front. 5 charms → fan left & right of front.
//
// NAME PRESENT (gapHalfAngle > 0):
//   Charms are spread evenly along the BACK arc (chain arc, not the name gap).
//   They never collide with the name plate and re-space when the name changes.
export function getNameChainCharmPlacement(index, total, gapHalfAngle = 0, cfg = NAME_CHAIN_CONFIG, category = "glb") {
  let angle;

  // Charm 1 is the LEFT-hand charm and the row reads left to right, the same
  // way it does on a necklace and on the GLB bracelets (getOrbitCharmTransform).
  // This used to run the other way, so the identical set of charms came out
  // mirrored the moment you switched a necklace over to a name chain.
  if (gapHalfAngle === 0) {
    // No name: fan charms symmetrically around the FRONT
    const MAX_HALF_SPREAD = (2 * Math.PI) / 3; // 120° each side = 240° total
    const halfSpread = total > 1 ? Math.min((total - 1) * 0.42, MAX_HALF_SPREAD) : 0;
    const offsets = [];
    if (total % 2 === 1) {
      offsets.push(0);
      for (let i = 1; i <= (total - 1) / 2; i++) offsets.push(-i, i);
    } else {
      for (let i = 1; i <= total / 2; i++) offsets.push(-(i - 0.5), i - 0.5);
    }
    offsets.sort((a, b) => a - b);
    const step = total > 1 ? halfSpread / Math.max((total - 1) / 2, 0.5) : 0;
    const offset = offsets[index] ?? 0;
    // Minus, so the lowest offset lands on the LEFT of the ring. Same sign
    // convention as getOrbitCharmTransform.
    angle = FRONT_ANGLE - offset * step;
  } else {
    // Name present: distribute along the back arc, away from the name plate,
    // walking from the LEFT washer round the back to the right one.
    const start = FRONT_ANGLE + gapHalfAngle;
    const sweep = 2 * Math.PI - 2 * gapHalfAngle;
    const lockLayout = getLockLayout(cfg);
    if (lockLayout) {
      // The lock sits at the back, opposite the name, so the charms are split
      // either side of it: left half = name -> lock, right half = lock -> name.
      // 4 charms = 2 + 2; an odd count puts the extra one on the left.
      const end = start + sweep;
      const meanRadius = (cfg.radiusX + cfg.radiusZ) / 2;
      const clear = (lockLayout.endLinkOffset + (cfg.lock.charmClearance ?? 0)) / meanRadius;
      const leftCount = Math.ceil(total / 2);
      const rightCount = total - leftCount;
      if (index < leftCount) {
        const u = (index + 1) / (leftCount + 1);
        angle = start + u * ((BACK_ANGLE - clear) - start);
      } else {
        const u = (index - leftCount + 1) / (rightCount + 1);
        angle = (BACK_ANGLE + clear) + u * (end - (BACK_ANGLE + clear));
      }
    } else {
      const u = total > 0 ? (index + 1) / (total + 1) : 0.5;
      angle = start + u * sweep;
    }
  }

  const placement = getCharmPlacementConfig(cfg, category);

  // Outward normal of the ring at this angle. For an ellipse that is NOT the
  // same as the direction from the centre, so derive it from the tangent.
  const normalX = cfg.radiusZ * Math.cos(angle);
  const normalZ = cfg.radiusX * Math.sin(angle);
  const normalLength = Math.hypot(normalX, normalZ) || 1;

  const x = cfg.radiusX * Math.cos(angle) + (normalX / normalLength) * placement.radiusOffset;
  const z = cfg.radiusZ * Math.sin(angle) + (normalZ / normalLength) * placement.radiusOffset;

  // Stones now face OUTWARD from the chain (see the gemstone branch in
  // Bracelet.jsx), so every charm follows its own spot on the loop.
  const rotationAngle = angle;

  return {
    position: [x, cfg.centerY + placement.yOffset, z],
    // Same convention as getOrbitCharmTransform: the Y-flip baked into this
    // Euler triple reverses the Z rotation, so the angle has to be mirrored
    // about the ring's front for a charm to hang OUTWARD off the chain.
    rotation: [Math.PI / 2, Math.PI, (Math.PI - rotationAngle) + Math.PI / 2 + placement.rotationOffset],
    anchor: placement.anchor,
    scale: placement.scale,
    // How far OUTWARD from the chain line this charm's origin sits - lets the
    // bracelet tilt a hanging charm about the chain it hangs from.
    radiusOffset: placement.radiusOffset,
  };
}

// ─── Link transforms ────────────────────────────────────────────────────────
// The chain is generated OUTWARD FROM THE TWO WASHERS and closes at the back,
// not walked once from one end to the other. The first link on each side is
// dropped a fixed distance from its washer's centre - far enough that it hooks
// the rim instead of sitting concentric with it, close enough that the washer's
// band still passes through the link's opening - and the rest step inward from
// there. Everything that has to be exact happens at the front, where it is
// seen; whatever rounding is left over is absorbed into the step and lands at
// the back of the wrist.
//
// Links alternate flat / edge-on so they interlock. A FLAT link's plane is
// horizontal (its normal is the ring's up axis) and that is the ONLY
// orientation that can thread through a washer: the washer stands upright
// facing the viewer, so an edge-on link beside it is coplanar with it and just
// clips through. That is why the number of steps is forced EVEN - the first and
// the last link are then both flat and both washers get a real hook. An odd
// count is what used to leave one end of the chain looking detached.

const GAP_EPSILON = 1e-4;

// Walks the chain's run by TRUE ARC LENGTH. Shared by the link generator and by
// the plate placement, so the two can never drift apart: both ask the same
// question - "which way is the ring facing `d` along from the washer?" - and
// get the same answer.
function createArcSampler(gapHalfAngle, cfg) {
  const start = FRONT_ANGLE - gapHalfAngle;
  const sweep = 2 * Math.PI - 2 * gapHalfAngle;

  const SAMPLES = 512;
  const angleAt = (u) => start - u * sweep;
  const at = (u) => {
    const a = angleAt(u);
    return new THREE.Vector3(cfg.radiusX * Math.cos(a), 0, cfg.radiusZ * Math.sin(a));
  };

  const cum = [0];
  let prev = at(0);
  for (let i = 1; i <= SAMPLES; i += 1) {
    const p = at(i / SAMPLES);
    cum.push(cum[i - 1] + p.distanceTo(prev));
    prev = p;
  }

  const angleAtDistance = (d) => {
    let i = 1;
    while (i < SAMPLES && cum[i] < d) i += 1;
    const a = cum[i - 1];
    const b = cum[i];
    const local = b > a ? (d - a) / (b - a) : 0;
    return angleAt(((i - 1) + local) / SAMPLES);
  };

  return { totalLen: cum[SAMPLES], angleAtDistance };
}

const UP = new THREE.Vector3(0, 1, 0);

// Position + orientation of one link sitting on the ring at `angle`.
//   flat = true  -> the oval lies in the plane of the bracelet. This is the
//                   only orientation that can thread through a washer.
//   flat = false -> the oval stands upright, threaded through its neighbours.
function getLinkFrame(angle, flat, cfg) {
  const position = ringPoint(angle, cfg);
  // d/dangle of the ellipse, negated because we walk with decreasing angle.
  const tangent = new THREE.Vector3(
    cfg.radiusX * Math.sin(angle),
    0,
    -cfg.radiusZ * Math.cos(angle),
  ).normalize();

  const axisX = tangent;
  const axisZ = flat ? UP.clone() : new THREE.Vector3().crossVectors(tangent, UP).normalize();
  const axisY = flat ? new THREE.Vector3().crossVectors(axisZ, axisX).normalize() : UP.clone();

  return { position, axisX, axisY, axisZ };
}

// ─── Where the chain meets the washer ───────────────────────────────────────
// Two numbers decide whether the end link and the washer are really linked, and
// they can only be solved together:
//
//   hook        how far along the arc, from the washer's centre, the first link
//               sits. Too close and the link sits concentric with the washer
//               instead of hooking it; too far and they come apart.
//   depthOffset how far BACK the name plate moves. The washers are welded to a
//               straight plate across the front of a ROUND chain, so the first
//               link has already fallen back from the point of the circle the
//               washer sits on. Rather than bend the chain forward out of its
//               circle, the plate is pushed back to meet it - which is what a
//               real name bracelet does when you lay it flat.
//
// The washer is an UPRIGHT ring and the end link is FLAT, so the only part of
// the washer that can be inside the link is where its circle crosses the link's
// horizontal plane: the two points a band-radius either side of its centre.
// depthOffset puts that crossing point on the link's centre line, and `hook` is
// solved so it also lands half way out along the opening - dead centre, with
// room on every side. Short round links have a small opening and a wide name
// swings the end link far round the curve, so a fixed hook distance cannot
// satisfy both; solving it per name and per link style can.
function solveChainAnchor(gapHalfAngle, cfg) {
  const sampler = createArcSampler(gapHalfAngle, cfg);
  if (!(gapHalfAngle > GAP_EPSILON)) return { hook: 0, depthOffset: 0, sampler };

  const anchorX = cfg.radiusX * Math.sin(gapHalfAngle);
  const anchorZ = cfg.radiusZ * Math.cos(gapHalfAngle);
  const band = (cfg.washerInner + cfg.washerOuter) / 2;
  const openLong = Math.max(cfg.linkLength / 2 - cfg.linkTube, 1e-4);
  // The washer is not a line: its band is (outer - inner) wide and it has
  // thickness, so what it actually puts inside the link is a footprint that
  // big, not a point.
  const halfFootprint = (cfg.washerOuter - cfg.washerInner) / 2 + cfg.washerDepth / 2;
  // Hang the link outward off the washer - negative, because the washer sits
  // BEHIND the link - but never so far that the footprint reaches the end of
  // the opening. Short round links have barely any opening to give away.
  const target = -Math.max(
    Math.min(openLong * 0.35, openLong - halfFootprint - openLong * 0.1),
    0,
  );

  // For a candidate hook: the depth shift it wants, and where the washer's band
  // then lands along the link's long axis.
  const measure = (hook) => {
    const { position, axisX, axisY } = getLinkFrame(sampler.angleAtDistance(hook), true, cfg);
    const depthOffset = Math.abs(axisY.z) < 1e-6
      ? 0
      : -(((anchorX + band) - position.x) * axisY.x) / axisY.z - anchorZ + position.z;
    const rel = new THREE.Vector3(
      (anchorX + band) - position.x,
      0,
      (anchorZ + depthOffset) - position.z,
    );
    return { hook, depthOffset, lx: rel.dot(axisX) };
  };

  // lx falls as the link moves away from the washer, so a plain bisection finds
  // the distance that puts the band where we want it.
  let lo = Math.min(cfg.washerOuter * 0.5, sampler.totalLen / 8);
  let hi = Math.min(band + openLong * 1.5, sampler.totalLen / 4);
  const solved = (hook) => ({ ...measure(hook), sampler });
  if (hi <= lo) return solved(lo);
  if (measure(hi).lx > target) return solved(hi);   // never reaches the target
  if (measure(lo).lx < target) return solved(lo);   // already past it
  for (let i = 0; i < 28; i += 1) {
    const mid = (lo + hi) / 2;
    if (measure(mid).lx > target) lo = mid; else hi = mid;
  }
  return solved((lo + hi) / 2);
}

// How far back the name plate has to sit for its washers to meet the chain.
export function getPlateDepthOffset(gapHalfAngle, cfg = NAME_CHAIN_CONFIG) {
  const { depthOffset } = solveChainAnchor(gapHalfAngle, cfg);
  // Pure safety rail - this is only ever a nudge of a few link widths.
  const limit = cfg.radiusZ * 0.15;
  return Math.max(Math.min(depthOffset, limit), -limit);
}

function buildLinkMatrices(gapHalfAngle, cfg = NAME_CHAIN_CONFIG) {
  const { hook, sampler } = solveChainAnchor(gapHalfAngle, cfg);
  const { totalLen, angleAtDistance } = sampler;
  const spacing = Math.max(cfg.linkLength * cfg.linkOverlap, 0.01);

  // Arc distances at which to drop a link, each with its flat/upright flag.
  // With a name the run is anchored at both washers; without one it is a
  // plain closed loop. The lock (at the back, arc distance totalLen / 2 in
  // both cases) splits whichever run crosses it into two, each ending on a
  // flat link that threads through the lock.
  const links = [];
  // One run from `from` to `to` (inclusive), an EVEN number of steps so both
  // end links are flat.
  const addRun = (from, to, minSteps) => {
    const span = Math.max(to - from, 1e-3);
    let steps = Math.max(minSteps, Math.round(span / spacing));
    if (steps % 2 !== 0) steps += 1;
    const step = span / steps;
    for (let k = 0; k <= steps; k += 1) links.push({ d: from + k * step, flat: k % 2 === 0 });
  };

  const lockLayout = getLockLayout(cfg);
  const back = totalLen / 2;
  if (gapHalfAngle > GAP_EPSILON) {
    if (lockLayout) {
      addRun(hook, back - lockLayout.endLinkOffset, 2);
      addRun(back + lockLayout.endLinkOffset, totalLen - hook, 2);
    } else {
      addRun(hook, hook + Math.max(totalLen - 2 * hook, spacing * 2), 4);
    }
  } else if (lockLayout) {
    // Open loop: from the lock, round the front, back to the lock.
    addRun(back + lockLayout.endLinkOffset, back - lockLayout.endLinkOffset + totalLen, 6);
  } else {
    let steps = Math.max(6, Math.round(totalLen / spacing));
    if (steps % 2 !== 0) steps += 1;          // keeps the alternation wrapping
    const step = totalLen / steps;
    // Exclusive of the last index: at gap 0 it lands back on link 0.
    for (let k = 0; k < steps; k += 1) links.push({ d: k * step, flat: k % 2 === 0 });
  }

  return links.map(({ d, flat }) => {
    const wrapped = ((d % totalLen) + totalLen) % totalLen;
    const { position, axisX, axisY, axisZ } = getLinkFrame(angleAtDistance(wrapped), flat, cfg);
    const matrix = new THREE.Matrix4().makeBasis(axisX, axisY, axisZ);
    matrix.setPosition(position);
    return matrix;
  });
}

// ─── Metal material shared by links, plate and washers ──────────────────────
// `minRoughness` matters: the name plate is a large FLAT face pointing straight
// at the camera, and a mirror-smooth metal (roughness 0) has no diffuse term at
// all, so it just mirrors whatever is directly above it and reads as near
// black. Blurring the reflection a little makes it read as polished metal.
// Ring-matched recipe (shared/metalMaterial.js); only the colour and the
// plate's roughness floor vary.
// `envIntensity` (optional) gives the part its OWN reflection strength instead
// of the scene-wide JEWELRY_ENV_INTENSITY - see FLAT_FACE_ENV_INTENSITY.
function useMetalMaterialProps(materialProps = {}, minRoughness = 0, envIntensity = null) {
  // Same file (and cached texture) the scene <Environment> already loaded.
  const envMap = useLoader(RGBELoader, RING_METAL_ENV_URL);
  envMap.mapping = THREE.EquirectangularReflectionMapping;
  return useMemo(() => ({
    ...RING_METAL,
    color: new THREE.Color(toRingMetalColor(materialProps.color || "#DBDBDB")),
    roughness: Math.max(RING_METAL.roughness, minRoughness),
    ...(envIntensity != null ? { envMap, envMapIntensity: envIntensity } : {}),
  }), [materialProps.color, minRoughness, envIntensity, envMap]);
}

// Roughness floor for the flat plate + washers (see note above). 0 now: with
// the ring's metal3.hdr environment a mirror-polished plate reads as bright
// polished gold, and any floor made the plate look duller than the chain.
const FLAT_FACE_MIN_ROUGHNESS = 0;

// The upright name plate and washers face the camera flat-on and reflect the
// darker lower half of metal3.hdr, so at the scene's reduced strength they
// rendered a deep, darker gold than the chain (measured lum ~149 vs ~179).
// Full ring strength brings them back to the ring's colour (~lum 175).
const FLAT_FACE_ENV_INTENSITY = 1;

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
      <meshPhysicalMaterial {...metal} />
    </instancedMesh>
  );
};

// ─── Lock (spring-ring clasp) ───────────────────────────────────────────────
// flat_spring_ring.glb lies flat in its own X/Z plane with the ring and the
// tab along Z. It is stood upright at the back of the bracelet, facing the
// front like the name plate, with its ring-to-tab axis along the chain.
// Start fetching the lock right away (the chain waits for it, see NameChainBracelet).
if (typeof window !== "undefined" && NAME_CHAIN_CONFIG.lock?.enabled) {
  useLoader.preload(GLTFLoader, NAME_CHAIN_CONFIG.lock.path);
}

const BraceletLock = ({ materialProps, cfg = NAME_CHAIN_CONFIG }) => {
  const lock = cfg.lock;
  const gltf = useLoader(GLTFLoader, lock.path);
  const metal = useMetalMaterialProps(materialProps);
  const layout = getLockLayout(cfg);

  const geometries = useMemo(() => {
    const list = [];
    gltf.scene.traverse((child) => { if (child.isMesh) list.push(child.geometry); });
    return list;
  }, [gltf]);

  // Model X -> world up (lever up or down), model Y (thickness) -> world depth,
  // model Z (ring-to-tab) -> world X, the chain's direction at the back.
  const quaternion = useMemo(() => {
    const s = lock.leverUp ? 1 : -1;
    const basis = new THREE.Matrix4().makeBasis(
      new THREE.Vector3(0, s, 0),
      new THREE.Vector3(0, 0, s),
      new THREE.Vector3(1, 0, 0),
    );
    return new THREE.Quaternion().setFromRotationMatrix(basis);
  }, [lock.leverUp]);

  const position = useMemo(() => ringPoint(BACK_ANGLE, cfg).toArray(), [cfg]);

  if (!layout) return null;

  return (
    <group position={position} quaternion={quaternion}>
      <group scale={lock.scale}>
        <group position={layout.center.map((v) => -v)}>
          {geometries.map((geometry, i) => (
            <mesh key={i} geometry={geometry} castShadow receiveShadow>
              <meshPhysicalMaterial {...metal} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
};

// ─── Washer ─────────────────────────────────────────────────────────────────
const Washer = ({ position, materialProps, cfg = NAME_CHAIN_CONFIG }) => {
  const metal = useMetalMaterialProps(materialProps, FLAT_FACE_MIN_ROUGHNESS, FLAT_FACE_ENV_INTENSITY);

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
      <meshPhysicalMaterial {...metal} side={THREE.DoubleSide} />
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
const NameChainBracelet = ({ namePendant, materialProps, pendantMaterialProps, onGeometryChange, braceletPath, cfg: cfgOverride }) => {
  // Link geometry comes from the selected style; everything else (ring size,
  // plate, washers) is shared.
  const cfg = cfgOverride ?? getNameChainConfig(braceletPath);
  const cleanText = sanitizePendantText(namePendant?.text || "");
  const hasName = Boolean(namePendant?.enabled) && cleanText.length > 0;

  const font = getFont(namePendant?.fontStyle);
  const textRef = useRef();
  const [bounds, setBounds] = useState(null);
  const pendantProps = pendantMaterialProps || materialProps;
  const metal = useMetalMaterialProps(pendantProps, FLAT_FACE_MIN_ROUGHNESS, FLAT_FACE_ENV_INTENSITY);

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
  // ...and pushed back just far enough that the washers meet the end links
  // where those links actually are, on the curve (see getPlateDepthOffset).
  const plateDepth = useMemo(
    () => getPlateDepthOffset(gapHalfAngle, cfg),
    [gapHalfAngle, cfg],
  );
  const midY = (bounds ? bounds.midY : cfg.textSize * 0.25) * textScale;
  // Centred on the ink band rather than the glyph box, so the two washers stay
  // symmetric about the ring's front even when one end has a long swash.
  const centeredX = bounds ? -(bounds.inkLeft + bounds.inkRight) / 2 : 0;

  return (
    <group>
      {/* Chain + lock share one Suspense: the chain only shows once the lock
          GLB is loaded, so the chain never appears without its lock. */}
      <Suspense fallback={null}>
        <ChainLinks gapHalfAngle={gapHalfAngle} materialProps={materialProps} cfg={cfg} />
        {cfg.lock?.enabled && (
          <BraceletLock materialProps={materialProps} cfg={cfg} />
        )}
      </Suspense>

      {hasName && (
        // Positioned so the plate's vertical mid-line - the line the washers sit
        // on - lands exactly on the ring, whatever cfg.plateTilt is set to.
        <group
          position={[
            0,
            cfg.centerY - midY * Math.cos(cfg.plateTilt),
            anchorZ + plateDepth - midY * Math.sin(cfg.plateTilt),
          ]}
          rotation={[cfg.plateTilt, 0, 0]}
        >
          <group scale={textScale}>
          <group ref={textRef} position={[centeredX, 0, -cfg.textDepth / 2]}>
            <Suspense fallback={null}>
              <KernedText3D
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
                <meshPhysicalMaterial {...metal} side={THREE.DoubleSide} />
              </KernedText3D>
            </Suspense>
          </group>
          </group>

          {bounds && (
            <>
              <Washer position={[-anchorX, midY, -cfg.washerDepth / 2]} materialProps={pendantProps} cfg={cfg} />
              <Washer position={[anchorX, midY, -cfg.washerDepth / 2]} materialProps={pendantProps} cfg={cfg} />
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

export { TextBoundsProbe };
export default NameChainBracelet;
