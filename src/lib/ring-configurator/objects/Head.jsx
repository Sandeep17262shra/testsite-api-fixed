/* eslint-disable react/no-unknown-property */
import React, { useContext, useMemo, useEffect } from "react";
import { useLoader } from "@react-three/fiber";
import { RGBELoader, EXRLoader } from "three-stdlib";
import * as THREE from "three";
import { RingContext } from "../contexts/RingContext";
import { DiamondContext } from "../contexts/DiamondContext";
import { MeshRefractionMaterial } from "@react-three/drei";
import { SectionContext } from "../contexts/SectionContext";
import { useSceneStage } from "../contexts/SceneStageContext";
import { fetchDecrypted } from '../utility/modelLoader';
import { ensureAsset, getCachedAsset } from '../utility/assetCache';
import { parseGLTF } from '../utility/gltfParser';
import { getVisualCarat, getVisualCaratForHead } from '../utility/visualCarat';
const diamondMeshNames = new Set(["diamond002", "oval004_1", "pear003_2", "pear_diamond","baquette_diamond", "diamond", "diamond001", "hidden_halo_-_diamonds", "all-diamonds1342_1", "all-diamonds929_1", "4_prong001_1", "4_prong007_1", "emerald002_2", "hidden_halo_-_diamonds001", "hidden_halo_-_diamonds002", "hidden_halo_-_diamonds003", "hidden_halo_-_diamonds004", "hidden_halo_-_diamonds005", "hidden_halo_-_diamonds006", "hidden_halo_-_diamonds007", "hidden_halo_-_diamonds008", "hidden_halo_-_diamonds009", "emerald001_1", "left_stone_diamond", "right_stone_diamond"]);
const HIDDEN_HALO_MESHES = new Set([
    "hidden_halo001", "hidden_halo_-_diamonds001",
    "hidden_halo008", "hidden_halo_-_diamonds008",
    "hidden_halo002", "hidden_halo_-_diamonds002",
    "hidden_halo006", "hidden_halo_-_diamonds006",
    "hidden_halo009", "hidden_halo_-_diamonds009",
    "hidden_halo007", "hidden_halo_-_diamonds007",
    "hidden_halo003", "hidden_halo_-_diamonds003",
    "hidden_halo005", "hidden_halo_-_diamonds005",
    "hidden_halo004", "hidden_halo_-_diamonds004"
]);

// Add center stone names to skip in three-stone models
const threeStoneCenterStoneNames = new Set([
    "center_stone", "center_stone001",
    "center_diamond", "main_diamond"
]);

// How much carat adds to a head's WIDTH (its height never varies - the shape
// scale functions below hold Y fixed).
//
// From 1ct up this is the original carat/(2*unit). Under 1ct that ramp is too
// shallow: 0.25ct came out barely narrower than 1ct and the basket swamped the
// stone. Below 1ct the rate is doubled about a 0.5ct anchor instead, which for
// a round head (unit 25, base 0.40) gives:
//   0.25ct 0.39   0.5ct 0.40   0.75ct 0.41   1ct 0.42
// Both branches meet exactly at 1ct, so the curve has no step in it, and it
// works off `unit` so every head type scales the same way.
const getHeadCaratWidth = (carat, unit) =>
  (carat < 1 ? carat - 0.5 : carat / 3) / unit;

// Head HEIGHT boost for small and mid stones.
//
// The shape scale functions hold the vertical axis constant, so a 0.25ct head
// stood as low as a 2ct one and the basket read squashed. This lifts the model
// itself (not its position) below HEAD_HEIGHT_BOOST_UNTIL, then eases back to
// nothing by HEAD_HEIGHT_BOOST_FADE_TO so crossing that carat has no step.
const HEAD_HEIGHT_BOOST = 0.08;
const HEAD_HEIGHT_BOOST_UNTIL = 1.5;
const HEAD_HEIGHT_BOOST_FADE_TO = 2;

const getHeadHeightBoost = (carat) => {
  const weight = Number(carat);
  if (!Number.isFinite(weight) || weight <= HEAD_HEIGHT_BOOST_UNTIL) {
    return 1 + HEAD_HEIGHT_BOOST;
  }
  if (weight >= HEAD_HEIGHT_BOOST_FADE_TO) return 1;
  const t =
    (weight - HEAD_HEIGHT_BOOST_UNTIL) /
    (HEAD_HEIGHT_BOOST_FADE_TO - HEAD_HEIGHT_BOOST_UNTIL);
  return 1 + HEAD_HEIGHT_BOOST * (1 - t);
};

// Which entry of a scale triple points up depends on the head's rotation: the
// shapes tipped a quarter turn about X stand on their local Z instead of Y.
const applyHeadHeightBoost = (scale, rotation, boost) => {
  if (!Array.isArray(scale) || boost === 1) return scale;
  const tipped = Math.abs(Math.abs(rotation?.[0] || 0) - Math.PI / 2) < 1e-3;
  const next = [...scale];
  const axis = tipped ? 2 : 1;
  next[axis] *= boost;
  return next;
};

// A head is scaled about its own mesh position, which sits BELOW the metal, so
// boosting its height would also lift the whole basket off the band - and as
// the boost faded out between 1.5ct and 2ct the head visibly settled back down
// again. Dropping the mesh by this much cancels that: the head's underside now
// stays put at every carat and the extra height goes upward only.
//
// Measured on the standard head: it starts 3.21 with its mesh anchored at 0.80
// and the stone seat at 4.50, so the underside sits 65% of the way from the
// anchor to the seat. A bezel is anchored AT the seat, which makes the distance
// zero and correctly leaves it untouched.
const HEAD_BASE_FRACTION = 0.65;
const HEAD_SEAT_Y = 4.5;

const boostHeadTransform = (transform, boost) => {
  if (!transform || boost === 1) return transform;
  const scale = applyHeadHeightBoost(transform.scale, transform.rotation, boost);
  const position = transform.position;
  if (!Array.isArray(position)) return { ...transform, scale };
  const drop = (boost - 1) * HEAD_BASE_FRACTION * (HEAD_SEAT_Y - position[1]);
  return { ...transform, scale, position: [position[0], position[1] - drop, position[2]] };
};

// Where the centre stone has to sit once the boost above is applied.
//
// A head is scaled about its own mesh position, so lifting its height raises
// the seat the stone rests in by the same proportion. That anchor differs by
// head type - a bezel is placed AT the stone, so its seat does not move at all,
// while a prong head is anchored down near the shank and its seat moves a lot.
// Scene.jsx feeds the result straight to <Diamond position>.
export function getHeadStoneAnchorY(ringHead, shape, carat, baseAnchorY) {
  if (THREE_STONE_HEADS.includes(ringHead)) return baseAnchorY;
  const boost = getHeadHeightBoost(carat);
  if (boost === 1) return baseAnchorY;

  const activeShape = shape || "round";
  let pivotY;
  if (ringHead === "BEZEL") {
    pivotY = (shapeDataForBezel[activeShape] || shapeDataForBezel.round).position[1];
  } else if (ringHead === "HIDDEN-HALO") {
    pivotY = (shapeDataForHiddenHalo[activeShape] || shapeDataForHiddenHalo.round).position[1];
  } else if (ringHead === "TULIP") {
    pivotY = (shapeDataForTulip[activeShape] || shapeDataForTulip.round).position[1];
  } else if (ringHead === "HALO") {
    pivotY = (shapeDataForHalo[activeShape] || shapeDataForHalo.round).position[1];
  } else {
    const info = shapeData[activeShape] || shapeData.round;
    const raw =
      activeShape === "pear" || activeShape === "heart"
        ? info.specialPosition || info.position
        : info.position;
    pivotY = raw[1];
  }

  // Matches boostHeadTransform: the mesh is dropped, then scaled about the
  // dropped anchor, so the seat rises by rather less than the raw boost.
  const reach = baseAnchorY - pivotY;
  return pivotY + reach * (boost - (boost - 1) * HEAD_BASE_FRACTION);
}

const shapeData = {
    round: {
        scale: (carat) => [0.35 + carat, 0.39, 0.35 + carat],
        position: [0, 0.8, 0]
    },
    princess: {
        scale: (carat) => [0.33 + carat, 0.33 + carat, 0.40],
        position: [0, 0.4, 0]
    },
    cushion: {
        scale: (carat) => [0.35 + carat, 0.35 + carat, 0.40],
        position: [0, 0.4, 0]
    },
    oval: {
        scale: (carat) => [0.35 + carat, 0.35 + carat, 0.40],
        position: [0, 0.35, 0]
    },
    moval: {
        scale: (carat) => [0.35 + carat, 0.35 + carat, 0.40],
        position: [0, 0.35, 0]
    },
    radiant: {
        scale: (carat) => [0.33 + carat, 0.33 + carat, 0.40],
        position: [0, 0.4, 0]
    },
    pear: {
        scale: (carat) => [0.35 + carat, 0.33 + carat, 0.40],
        position: [0, 0.4, 0],
        specialPosition: [0, 0.4, 0.15]
    },
    emerald: {
        scale: (carat) => [0.35 + carat, 0.33 + carat, 0.40],
        position: [0, 0.4, 0]
    },
    marquise: {
        scale: (carat) => [0.35 + carat, 0.35 + carat, 0.40],
        position: [0, 0.3, 0]
    },
    heart: {
        scale: (carat) => [0.4 + carat, 0.40 + carat, 0.4],
        position: [0, 0.4, 0],
        specialPosition: [0, 0.3, 0.15]
    },
    asscher: {
        scale: (carat) => [0.35 + carat, 0.35 + carat, 0.40],
        position: [0, 0.16, 0]
    },
};

// TWO-STONE ("Toi et Moi"): two 4-PRONG heads placed side by side, each
// holding a stone of the currently selected shape (PLAIN shank only - see
// RingCustomizer.jsx's TWO_STONE_COMPATIBLE_SHANKS). This first pass only
// places the pair of metal head baskets: describeHead() below points
// "TWO-STONE" at the SAME existing 4-PRONG/{shape} basket asset used for a
// single stone, and activeTransforms renders it twice (left/right), reusing
// that shape's normal shapeData position/rotation/scale and just offsetting
// X. It does not yet duplicate the actual centre diamond - Diamond.jsx still
// renders one stone via getHeadStoneAnchorY, centered between the two
// baskets for now. Wiring a second Diamond.jsx instance into the left/right
// slots is the next step once this placement is confirmed live.
//
// Each value is a first-pass half-gap guess (roughly the shape's own
// half-width per shapeData's scale) - tune live once stones are on screen,
// the same way Ring.jsx's activePosition values were tuned per shank.
const TWO_STONE_X_OFFSET = {
    round: 1.1,
    princess: 1.0,
    cushion: 1.0,
    oval: 1.0,
    moval: 1.0,
    radiant: 1.0,
    pear: 1.0,
    emerald: 1.0,
    marquise: 0.9,
    heart: 1.1,
    asscher: 1.0,
};

const shapeDataForBezel = {
    round: { rotation: [Math.PI / 2, 0, 0], position: [0, 4.5, 0] },
    princess: { rotation: [Math.PI / 2, 0, 0], position: [0, 4.5, 0] },
    cushion: { rotation: [Math.PI / 2, 0, 0], position: [0, 4.5, 0] },
    oval: { rotation: [Math.PI / 2, 0, 0], position: [0, 4.5, 0] },
    moval: { rotation: [Math.PI / 2, 0, 0], position: [0, 4.5, 0] },
    radiant: { rotation: [Math.PI / 2, 0, 0], position: [0.04, 4.5, 0] },
    pear: { rotation: [Math.PI / 2, 0, 0], position: [0, 4.5, 0.2] },
    emerald: { rotation: [Math.PI / 2, 0, 0], position: [0, 4.5, 0] },
    marquise: { rotation: [Math.PI / 2, 0, 0], position: [0, 4.5, 0] },
    heart: { rotation: [Math.PI / 2, 0, 0], position: [0, 4.5, 0.25] },
    asscher: { rotation: [Math.PI / 2, 0, 0], position: [0.04, 4.5, 0] },
};

const shapeDataForHiddenHalo = {
    round: {
        rotation: [0, 0, 0], position: [0, 0.80, 0],
        rotation2: [0, 0, 0], position2: [0, 0.85, 0]
    },
    princess: {
        rotation: [Math.PI / 2, 0, 0], position: [0, 0.35, 0],
        rotation2: [0, 0, 0], position2: [0, 0.85, 0]
    },
    cushion: {
        rotation: [Math.PI / 2, 0, 0], position: [0, 0.35, 0],
        rotation2: [0, 0, 0], position2: [0, 0.85, 0]
    },
    oval: {
        rotation: [Math.PI / 2, 0, 0], position: [0, 0.35, 0],
        rotation2: [0, 0, 0], position2: [0, 0.85, 0]
    },
    moval: {
        rotation: [Math.PI / 2, 0, 0], position: [0, 0.35, 0],
        rotation2: [0, 0, 0], position2: [0, 0.85, 0]
    },
    radiant: {
        rotation: [Math.PI / 2, 0, 0], position: [0, 0.35, 0],
        rotation2: [0, 0, 0], position2: [0, 0.85, 0]
    },
    pear: {
        rotation: [Math.PI / 2, 0, 0], position: [0, 0.35, 0.2],
        rotation2: [0, 0, 0], position2: [0, 0.85, 0]
    },
    emerald: {
        rotation: [Math.PI / 2, 0, 0], position: [0, 0.35, 0],
        rotation2: [0, 0, 0], position2: [0, 0.85, 0]
    },
    marquise: {
        rotation: [Math.PI / 2, 0, 0], position: [0, 0.35, 0],
        rotation2: [0, 0, 0], position2: [0, 0.85, 0]
    },
    heart: {
        rotation: [Math.PI / 2, 0, 0], position: [0, 0.35, 0.15],
        rotation2: [0, 0, 0], position2: [0, 0.85, 0]
    },
    // Starting values mirror EMERALD (nearest analogue: asscher is a square
    // step-cut) -- tune live if the head sits high/low/off-center for asscher.
    asscher: {
        rotation: [Math.PI / 2, 0, 0], position: [0, 0.35, 0],
        rotation2: [0, 0, 0], position2: [0, 0.85, 0]
    }
};

// TULIP: each of the 5 supported shapes (round/cushion/oval/pear/emerald) is
// its own individually-modeled GLB, already correctly oriented once its
// export-time node transform was baked into the vertex data (see the
// jewelry-configurator-tulip-head project doc) — unlike the generic
// shapeData table above (built around 4-PRONG's single shared basket, which
// needs a runtime tilt per shape), Tulip needs no rotation at all. scale is
// a uniform (non-distorting) multiplier per shape, since each model already
// carries its own correct proportions; position is tuned so the basket's
// prong tips meet the centre stone at roughly the same world height
// 4-PRONG's own basket does for that shape.
const shapeDataForTulip = {

    round: {
        scale: (carat) => [0.60 + carat, 0.45, 0.60 + carat],
        position: [0, 0.8, 0]
    },
    cushion: {
        scale: (carat) => [0.32 + carat, 0.25, 0.32 + carat],
        position: [0, 1, 0]
    },
    oval: {
        scale: (carat) => [0.35 + carat, 0.28, 0.35 + carat],
        position: [0, 0.6, 0]
    },
    moval: {
        scale: (carat) => [0.6 + carat, 0.45, 0.6 + carat],
        position: [0, 0.65, 0],
    },
    pear: {
        scale: (carat) => [0.34 + carat, 0.25, 0.34 + carat],
        position: [0, 1, 0]
    },
    emerald: {
        scale: (carat) => [0.3 + carat, 0.25, 0.35 + carat],
        position: [0, 1, 0]
    },
};

// HALO: full head+halo+centre-diamond assemblies baked from Vervi's uploaded
// GLBs, one fixed (tier-3) asset per shape - the surrounding ring of accent
// diamonds AND the centre stone are both modelled into the file itself, so
// unlike every other head type here, Diamond.jsx renders nothing for this
// head (see Scene.jsx).
//
// The source GLBs carried real per-node placement transforms (translation +
// rotation + scale, not simple "-90 on X" artifacts) plus some stray debris
// geometry (a couple of near-zero-size slivers, a leftover flat reference
// disc on 2 shapes) - both were baked/cleaned in an offline pass before these
// files were deployed. That pass also tagged every accent-diamond and
// centre-diamond mesh's NODE NAME with a HALOACCENT__/HALOCENTER__ prefix
// (see getHaloDiamondKind below), since the files' glTF MATERIAL names -
// while individually correct per shape - don't survive Draco/dedup
// compression as distinct materials and can't be trusted for classification
// at runtime.
//
// Every shape's baked geometry sits in the same rough coordinate range as
// the existing 4-PRONG/HIDDEN-HALO round basket (local Y ~5.3-5.9 up to
// ~9-10, vs HIDDEN-HALO round's own 5.59-10.12), so position/scale below
// start from that head's own tuned values (position [0, 0.80, 0], uniform
// scale 0.39) rather than a blind guess. First-pass, non-distorting (one
// scale number, not per-axis) - tune live per shape same as every other head
// style's tuning history in these docs if one looks over/under-sized next to
// its neighbours.
const HALO_SHAPES = ["round", "princess", "cushion", "oval", "moval", "radiant", "pear", "emerald", "marquise", "heart", "asscher"];

// Each baked halo-<shape>-3.glb has a different real-world footprint (a
// marquise/pear outline is much longer than round's, heart's is smaller),
// so applying the same scale() to every shape made marquise/pear render
// visibly larger than round and heart visibly smaller. These ratios
// normalize every shape's footprint diagonal (sqrt(sizeX^2+sizeZ^2),
// measured off the baked tier-3 mesh) to match round's, so all ten shapes
// read as the same visual size at a given carat, matching how the other
// head styles were tuned. 1.0 = same footprint as round already.
const HALO_SIZE_RATIO = {
    round: 1.0,
    princess: 1.1,
    cushion: 1.1212,
    oval: 1.1676,
    moval: 1.1676,
    radiant: 1.07,
    pear: 0.9,
    emerald: 1.06,
    marquise: 0.94,
    heart: 1.3,
    asscher: 1.074,
};
const HALO_ROTATION = {
    heart: [0, Math.PI, 0],   // 180° turn
    pear:  [0, Math.PI, 0],
};
const shapeDataForHalo = HALO_SHAPES.reduce((acc, shape) => {
    // Same additive pattern as every other head's scale(carat) below (e.g.
    // shapeDataForTulip) - 0.39 is the base every shape was first-pass tuned
    // at, plus diamondCaratSize so the whole baked head+halo+stone assembly
    // grows and shrinks continuously with the carat slider instead of
    // staying one fixed size across the whole range. The per-shape ratio
    // corrects for each shape's own footprint (see HALO_SIZE_RATIO above).
    // position.y=0.80 sits on top of the baked mesh's own base, which is
    // re-anchored to local Y=0 in the asset itself - scaling multiplies
    // vertex Y by the scale factor, so a base already at 0 stays at 0 as
    // carat/scale increases, keeping the head level with the shank at every
    // size instead of drifting upward.
    const ratio = HALO_SIZE_RATIO[shape] ?? 1.0;
    acc[shape] = {
    position: shape === "moval" ? [0, 0.2, 0] : [0, 3.1, 0],
    
    rotation: HALO_ROTATION[shape] || [0, 0, 0],   // was: [0, 0, 0]
    scale: (carat) => (0.39 + carat) * ratio
};
    return acc;
}, {});

function getHaloHeadPath(shape) {
    // Always the tier-3 (largest) baked model - no per-carat switching.
    return `HALO/halo-${shape}/halo-${shape}-3`;
}

const HALO_CENTER_PREFIX = "HALOCENTER__";
const HALO_ACCENT_PREFIX = "HALOACCENT__";

/** Returns 'center' | 'halo' | null (metal) for a HALO head's mesh, read off
 * the node-name prefix the asset pipeline tagged (see comment above). */
function getHaloDiamondKind(meshName) {
    const name = meshName || "";
    if (name.startsWith(HALO_CENTER_PREFIX)) return "center";
    if (name.startsWith(HALO_ACCENT_PREFIX)) return "halo";
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// THREE-STONE: side-stone (head) transforms
// Each entry has:
//   right  → position/rotation/scale for the right side stone
//   left   → mirrored position (negate X) for the left side stone
//   center → used by the centre stone section below
// ─────────────────────────────────────────────────────────────────────────────
const threeStoneHeadShapes = {
    oval: {
        // Stones recentered to origin — position is world placement on ring shoulders
        right: {
            rotation: [Math.PI / 2, -0.4, 0],  // stand upright, slight inward Z-tilt
            position: [1.25, 3.5, 0],
            scale: [0.2, 0.2, 0.2],
        },
        left: {
            rotation: [Math.PI / 2, 0.2, 0],   // mirrored Z-tilt
            position: [-1.25, 3.5, 0],
            scale: [0.2, 0.2, 0.2],
        },
        // fallback
        rotation: [Math.PI / 2, 0, -0.17],
        position: [0.9, 3.6, 0],
        scale: [0.2, 0.2, 0.2],
    },
    trapezoid: {
        right: {
            rotation: [Math.PI / 2, 0.5, 0],
            position: [1.5, 3.6, 0],
            scale: [0.2, 0.2, 0.2],
        },
        left: {
            rotation: [Math.PI / 2, 0.5, 0],
            position: [-1.5, 3.6, 0],
            scale: [0.2, 0.2, 0.2],
        },
        rotation: [Math.PI / 2, 0.5, 0],
        position: [-1.2, 3.8, 0],
        scale: [0.2, 0.2, 0.2],
    },
    half_moon: {
        right: {
            rotation: [Math.PI / 2, -0.55, 0],  // stand upright, slight inward Z-tilt
            position: [1.52, 3.35, 0],
            scale: [0.3, 0.2, 0.2],
        },
        left: {
            rotation: [Math.PI / 2, 0.35, 0],   // mirrored Z-tilt
            position: [-1.5, 3.35, 0],
            scale: [0.3, 0.2, 0.2],
        },
        // fallback
        rotation: [Math.PI / 2, 0, -0.17],
        position: [0.9, 3.6, 0],
        scale: [0.3, 0.2, 0.2],
    },
    pear: {
        right: {
            rotation: [Math.PI / 2, 0.43, Math.PI / 2],
            position: [1.4, 3.5, 0],
            scale: [0.2, 0.2, 0.2],
        },
        left: {
            rotation: [Math.PI / 2, -0.43, Math.PI / 2],
            position: [-1.4, 3.5, 0],
            scale: [0.2, 0.2, 0.2],
        },
        rotation: [Math.PI / 2, 0.43, Math.PI / 2],
        position: [-1.4, 3.5, 0],
        scale: [0.2, 0.2, 0.2],
    },
    // Single combined mesh (like `pear`) - one glTF node holds both side
    // stones, baked to identity orientation (see model-fix notes below), so
    // right/left/fallback are intentionally identical: the mesh has no
    // "left"/"right" named parts, so it always renders once via the
    // top-level fallback (see getSideStoneDirection / the render loop).
    baguette: {
        right: {
            rotation: [Math.PI / 2, 0.43, Math.PI / 2],
            position: [1.4, 3.5, 0],
            scale: [0.2, 0.2, 0.2],
        },
        left: {
            rotation: [Math.PI / 2, -0.43, Math.PI / 2],
            position: [-1.4, 3.5, 0],
            scale: [0.2, 0.2, 0.2],
        },
        rotation: [Math.PI / 2, 0.42, Math.PI / 2],
        position: [-1.55, 3.5, 0],
        scale: [0.22, 0.22, 0.22],
    }
};

// Add center stone transforms for three-stone rings
const threeStoneCenterShapes = {
    round: {
        scale: (carat) => [0.40 + carat, 0.34, 0.40 + carat],
        position: [0, 1, 0],
        rotation: [0, 0, 0],
    },
    princess: {
        scale: (carat) => [0.33 + carat, 0.33 + carat, 0.37],
        position: [0, 0.4, 0],
        rotation: [Math.PI / 2, 0, 0],
    },
    cushion: {
        scale: (carat) => [0.35 + carat, 0.35 + carat, 0.40],
        position: [0, 0.4, 0],
        rotation: [Math.PI / 2, 0, 0],
    },
    oval: {
        scale: (carat) => [0.35 + carat, 0.35 + carat, 0.367],
        position: [0, 0.45, 0],
        rotation: [Math.PI / 2, 0, 0],
    },
    moval: {
        scale: (carat) => [0.35 + carat, 0.35 + carat, 0.367],
        position: [0, 0.45, 0],
        rotation: [Math.PI / 2, 0, 0],
    },
    radiant: {
        scale: (carat) => [0.33 + carat, 0.33 + carat, 0.40],
        position: [0, 0.4, 0],
        rotation: [Math.PI / 2, 0, 0],
    },
    pear: {
        scale: (carat) => [0.3 + carat, 0.3 + carat, 0.3],
        position: [0, 1.05, 0.2],
        rotation: [Math.PI / 2, 0, 0],
    },
    emerald: {
        scale: (carat) => [0.35 + carat, 0.33 + carat, 0.35],
        position: [0, 0.6, 0],
        rotation: [Math.PI / 2, 0, 0],
    },
    marquise: {
        scale: (carat) => [0.35 + carat, 0.35 + carat, 0.40],
        position: [0, 0.3, 0],
        rotation: [Math.PI / 2, 0, 0],
    },
    heart: {
        scale: (carat) => [0.40 + carat, 0.40 + carat, 0.40],
        position: [0, 0.4, 0.15],
        rotation: [Math.PI / 2, 0, 0],
    },
    asscher: {
        scale: (carat) => [0.38 + carat, 0.38 + carat, 0.42],
        position: [0, 0.16, 0],
        rotation: [Math.PI / 2, 0, 0],
    },
};

// ─── The stone's environment ────────────────────────────────────────────────
// Same studio gem HDR and response curve as Diamond.jsx (see that file for the
// full derivation). Head-mounted diamonds — side stones, three-stone centre
// stones, halo diamonds — go through this component, so they need the same
// map and the same curve, or they'll render with the old flat-JPG look while
// the main stone looks correct.
//
// TODO: these five items (path + curve constants + curve fn) are duplicated
// from Diamond.jsx. Worth pulling into a shared `utility/diamondEnvironment.js`
// so a future tuning pass can't update one file and silently miss the other.
const DIAMOND_ENV_PATH = '/env_gem_002.exr';
const DIAMOND_ENV_CONTRAST = 0.9;
const DIAMOND_ENV_GAIN = 1.4;

function applyGemEnvCurve(texture) {
    if (!texture || texture.userData?.gemCurveApplied) return texture;
    const data = texture.image?.data;
    if (!(data instanceof Float32Array)) return texture;   // not float: leave it alone

    for (let i = 0; i < data.length; i += 4) {
        data[i]     = DIAMOND_ENV_GAIN * Math.pow(Math.max(data[i], 0),     DIAMOND_ENV_CONTRAST);
        data[i + 1] = DIAMOND_ENV_GAIN * Math.pow(Math.max(data[i + 1], 0), DIAMOND_ENV_CONTRAST);
        data[i + 2] = DIAMOND_ENV_GAIN * Math.pow(Math.max(data[i + 2], 0), DIAMOND_ENV_CONTRAST);
    }
    texture.userData.gemCurveApplied = true;
    texture.needsUpdate = true;
    return texture;
}

// Diamond quality configurations
// `aberration` matches Diamond.jsx's CUT_BASELINE — without it, head-mounted
// diamonds fell back to MeshRefractionMaterial's default aberrationStrength,
// which ran 3-6x hotter than the tuned centre-stone value and brought back
// the rainbow-smear look the reference-render fix was meant to remove.
const CUT_BASELINE = {
    "Good":       { ior: 2.45, bounces: 4, aberration: 0.0065 },
    "Very Good":  { ior: 2.47, bounces: 5, aberration: 0.0052 },
    "Excellent":  { ior: 2.49, bounces: 6, aberration: 0.0042 },
    "Ideal":      { ior: 2.51, bounces: 7, aberration: 0.0035 }
};

const CLARITY_ADJUSTMENT = {
    "I1": { iorOffset: -0.02, bouncesOffset: -1 },
    "SI2": { iorOffset: -0.01, bouncesOffset: 0 },
    "SI1": { iorOffset: 0.00, bouncesOffset: 0 },
    "VS2": { iorOffset: 0.00, bouncesOffset: 0 },
    "VS1": { iorOffset: 0.01, bouncesOffset: 0 },
    "VVS2": { iorOffset: 0.01, bouncesOffset: 0 },
    "VVS1": { iorOffset: 0.02, bouncesOffset: 1 },
    "FL/IF": { iorOffset: 0.03, bouncesOffset: 1 }
};

const COLOR_CLARITY = {
    "L": { iorOffset: -0.03, bouncesOffset: -1 },
    "K": { iorOffset: -0.025, bouncesOffset: -1 },
    "J": { iorOffset: -0.02, bouncesOffset: 0 },
    "I": { iorOffset: -0.015, bouncesOffset: 0 },
    "H": { iorOffset: -0.01, bouncesOffset: 0 },
    "G": { iorOffset: -0.005, bouncesOffset: 0 },
    "F": { iorOffset: 0.00, bouncesOffset: 0 },
    "E": { iorOffset: 0.01, bouncesOffset: 1 },
    "D": { iorOffset: 0.02, bouncesOffset: 1 }
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: given a mesh name, decide if it belongs to the left or right side
// stone group (returns 'left', 'right', or null for unrecognised meshes).
// We match case-insensitively on the substrings "left" / "right".
// ─────────────────────────────────────────────────────────────────────────────
function getSideStoneDirection(meshName) {
    const lower = (meshName || "").toLowerCase();
    // Matches both "left_stone" and "left_stone_diamond"
    if (lower.includes("left"))  return "left";
    if (lower.includes("right")) return "right";
    return null;
}

const PRONG_HEADS = ["4-PRONG", "6-PRONG", "BEZEL", "HIDDEN-HALO", "TULIP"];
// Halo heads: the halo stones stay colourless; only the centre stone
// (Diamond.jsx) takes the selected diamond / gemstone colour.
const COLORLESS_HALO_HEADS = new Set(["HIDDEN-HALO", "SINGLE-HALO", "DOUBLE-HALO"]);
const COLORLESS_SIDE_STONE = "#FFFFFF";
const THREE_STONE_HEADS = ["OVAL", "TRAPEZOID", "HALF-MOON", "PEAR", "BAGUETTE"];

/** Everything that identifies one loadable head, derived from head + shape. */
function describeHead(ringHead, shape, carat) {
    const isThreeStone = THREE_STONE_HEADS.includes(ringHead);
    const isTwoStone = ringHead === "TWO-STONE";
    const isHalo = ringHead === "HALO";
    const safeShape = shape || "round";
    let headPath;
    if (isHalo) {
        headPath = getHaloHeadPath(safeShape);
    } else if (PRONG_HEADS.includes(ringHead)) {
        headPath = `${ringHead}/${safeShape.toUpperCase()}`;
    } else if (isThreeStone) {
        headPath = `THREE-STONE/${ringHead.toUpperCase()}`;
    } else if (isTwoStone) {
        // No dedicated TWO-STONE asset yet - reuses the existing single-stone
        // 4-PRONG basket, rendered twice (see activeTransforms below).
        headPath = `4-PRONG/${safeShape.toUpperCase()}`;
    } else {
        headPath = ringHead;
    }
    return { ringHead, shape: safeShape, isThreeStone, isTwoStone, isHalo, headPath };
}

async function loadHeadMeshes(headPath, isThreeStone) {
    const buffer = await fetchDecrypted(`/3d-models/RING-HEAD/${headPath}.glb`);
    const gltf = await parseGLTF(buffer);
    const isMovalHalo = headPath === "HALO/halo-moval/halo-moval-3";
    const isMovalTulip = headPath === "TULIP/MOVAL";
    // The Moval source files retain their node transforms while all other
    // head exports have those transforms baked into their vertices. This
    // loader deliberately clears node transforms for the shared head frame;
    // preserve the Moval assets' authored placement by baking it first.
    const needsBakedNodeTransforms = isMovalHalo || isMovalTulip;
    if (needsBakedNodeTransforms) gltf.scene.updateMatrixWorld(true);
    const meshes = [];
    gltf.scene.traverse((child) => {
        if (!child.isMesh) return;
        if (isThreeStone && threeStoneCenterStoneNames.has(child.name)) return;
        const mesh = child.clone();
        mesh.position.set(0, 0, 0);
        mesh.rotation.set(0, 0, 0);
        mesh.scale.set(1, 1, 1);
        mesh.geometry = child.geometry.clone();
        if (needsBakedNodeTransforms) {
            // The normal head loader resets node transforms, so bake the
            // Moval export's authored placements into its cloned geometry
            // before rendering it in the common head frame.
            mesh.geometry.applyMatrix4(child.matrixWorld);
        }
        if (isMovalHalo) {
            if (child.name === "Diamond_Round_5") mesh.name = `${HALO_ACCENT_PREFIX}${child.name}`;
            if (child.name === "geometry_0") mesh.name = `${HALO_CENTER_PREFIX}${child.name}`;
        }
        meshes.push(mesh);
    });
    if (!meshes.length) throw new Error(`No meshes in head ${headPath}`);
    return meshes;
}

const loadHead = (headPath, isThreeStone) =>
    ensureAsset("head", headPath, () => loadHeadMeshes(headPath, isThreeStone));

const loadCenterStone = (shape) =>
    ensureAsset("centerStone", shape, () =>
        loadHeadMeshes(`4-PRONG/${shape.toUpperCase()}`, false)
    );

const DiamondMaterial = React.memo(({ envMap, color, ior, bounces, aberrationStrength, fresnel, opacity }) => {
    return (
        <MeshRefractionMaterial
            envMap={envMap}
            color={color}
            ior={ior}
            bounces={bounces}
            aberrationStrength={aberrationStrength}
            fresnel={fresnel}
            roughness={0}
            metalness={0}
            transparent
            opacity={opacity}
            toneMapped={false}
        />
    );
});

const HeadMesh = React.memo(({ geometry, position, rotation, scale, materialProps, headColor, isDiamond, diamondProps }) => {
    // isDiamond meshes here are always accent stones (hidden-halo ring, or a
    // three-stone side stone) - the hero center diamond is rendered separately
    // by Diamond.jsx and keeps full shadowing. Skipping the shadow pass for
    // these small stones avoids a full extra geometry pass per mesh across
    // potentially dozens of hidden-halo stones, with no visible loss - see the
    // matching note in Ring.jsx's FadeMeshRing for the same reasoning.
    const castShadow = !isDiamond;
    const receiveShadow = !isDiamond;
    return (
        <mesh
            geometry={geometry}
            position={position}
            rotation={rotation}
            scale={scale}
            castShadow={castShadow}
            receiveShadow={receiveShadow}
        >
            {isDiamond ? (
                <DiamondMaterial
                    envMap={diamondProps.envMap}
                    color={diamondProps.color}
                    ior={diamondProps.ior}
                    bounces={diamondProps.bounces}
                    aberrationStrength={diamondProps.aberrationStrength}
                    fresnel={diamondProps.fresnel}
                    opacity={1}
                />
            ) : (
                <meshStandardMaterial
                    {...materialProps}
                    transparent={materialProps.transparent}
                    opacity={1}
                    color={headColor}
                />
            )}
        </mesh>
    );
});

function Head() {
    const { headColor, ringHead, ringSideSetting, metalness, roughness, reflectivity, clearcoat, clearcoatRoughness, envMapIntensity } = useContext(RingContext);
    const { setShape, cut, clarity, diamondColor, diamondSize, diamondColorClarity } = useContext(DiamondContext);
    const { handleMetal } = useContext(SectionContext);
    const { target, displayed, reportPartReady } = useSceneStage();

    const { effectiveIor, effectiveBounces, aberrationStrength } = useMemo(() => {
        const base = CUT_BASELINE[cut] || CUT_BASELINE.Good;
        const clarityAdjust = CLARITY_ADJUSTMENT[clarity] || { iorOffset: 0, bouncesOffset: 0 };
        const colorAdjust = COLOR_CLARITY[diamondColorClarity] || { iorOffset: 0, bouncesOffset: 0 };

        let ior = base.ior + clarityAdjust.iorOffset + colorAdjust.iorOffset;
        let bounces = base.bounces + clarityAdjust.bouncesOffset + colorAdjust.bouncesOffset;

        // Same clamps as Diamond.jsx: ior kept in the calibrated range, bounces
        // floored at 4 so a round stone always gets enough internal hops to
        // read as a facet pattern rather than a flat grey disc (see Diamond.jsx
        // for the full reasoning), and capped at 6 to stay GPU-safe with
        // multiple side stones on screen at once.
        ior = Math.max(2.40, Math.min(2.55, ior));
        bounces = Math.max(4, Math.min(6, Math.round(bounces)));

        return {
            effectiveIor: ior,
            effectiveBounces: bounces,
            aberrationStrength: base.aberration,
        };
    }, [cut, clarity, diamondColorClarity]);

    const metalTexture = useLoader(RGBELoader, handleMetal);
    metalTexture.mapping = THREE.EquirectangularReflectionMapping;

    // Studio gem HDR for head-mounted diamonds (see comment block above
    // CUT_BASELINE) — forced to full float so the response curve has real
    // numbers to work on, same as Diamond.jsx.
    const texture = useLoader(EXRLoader, DIAMOND_ENV_PATH, (loader) => {
        if (typeof loader.setDataType === 'function') loader.setDataType(THREE.FloatType);
        else loader.type = THREE.FloatType;
    });
    useMemo(() => {
        applyGemEnvCurve(texture);
        texture.mapping = THREE.EquirectangularReflectionMapping;
        // Equirectangular maps wrap the long way round, so S has to repeat -
        // clamping it smears the pixel column at the seam across every ray
        // that leaves the stone in that direction.
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        // All five gem components load the SAME '/env_gem_002.exr' through useLoader,
        // which hands every one of them the SAME cached texture object - so the LAST
        // component to run its setup wins for the whole scene. Mipmaps must stay OFF
        // here: drei's MeshRefractionMaterial samples this equirect map with
        // textureGrad(), and equirect U wraps (atan) along one meridian, so across that
        // seam the derivative jumps a full unit, the sampler reads a huge footprint and
        // drops to the coarsest mip - a flat average of the whole studio, ~3.5x brighter
        // than the map's actual content there. On screen that is the hard white line
        // drawn straight across the stones. See Diamond.jsx for the full note.
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        texture.needsUpdate = true;
    }, [texture]);

    const diamondMaterialProps = useMemo(() => ({
        envMap: texture,
        color: diamondColor,
        ior: effectiveIor,
        bounces: effectiveBounces,
        aberrationStrength,
        // Same low edge-reflection value as Diamond.jsx — higher laid a milky
        // sheen over the whole stone instead of clear glass with bright edges.
        fresnel: 0.5,
        toneMapped: false,
    }), [texture, effectiveIor, effectiveBounces, aberrationStrength, diamondColor]);

    const colorlessDiamondMaterialProps = useMemo(() => ({
        ...diamondMaterialProps,
        color: COLORLESS_SIDE_STONE,
    }), [diamondMaterialProps]);

    const metalMaterialProps = useMemo(() => ({
        envMap: metalTexture,
        metalness,
        roughness,
        reflectivity,
        clearcoat,
        clearcoatRoughness,
        envMapIntensity,
        transparent: true,
    }), [metalTexture, metalness, roughness, reflectivity, clearcoat, clearcoatRoughness, envMapIntensity]);

    // A three-stone head dictates the centre stone shape.
    useEffect(() => {
        if (!THREE_STONE_HEADS.includes(ringHead)) return;
        if (ringHead === "HALF-MOON") {
            setShape("round");
        } else if (ringHead === "OVAL") {
            setShape("oval");
        } else if (ringHead === "PEAR") {
            setShape("pear");
        } else if (ringHead === "BAGUETTE") {
            setShape("emerald");
        } else {
            setShape("princess");
        }
    }, [ringHead, setShape]);

    // ─────────────────────────────────────────────────────────────────────
    // LOAD for `target`, RENDER from `displayed`. The head currently on
    // screen is never touched until the whole new configuration is ready.
    // DiamondWise designs carry their own head geometry, so nothing is
    // fetched from the standard head library while one is selected.
    // ─────────────────────────────────────────────────────────────────────
    const targetKey = target.parts.head;
    const isStandardTarget = !target.isDiamondWise;
    const targetHead = useMemo(
        () => describeHead(target.ringHead, target.shape, target.diamondSize),
        [target.ringHead, target.shape, target.diamondSize]
    );

    useEffect(() => {
        if (!isStandardTarget) return undefined;

        // H000 is a catalogue-only "No Head" selection. It intentionally
        // has no model, and must still resolve the scene stage immediately.
        if (target.ringHead === "NO-HEAD") {
            reportPartReady("head", targetKey);
            return undefined;
        }

        let alive = true;
        const requests = [loadHead(targetHead.headPath, targetHead.isThreeStone)];
        if (targetHead.isThreeStone) requests.push(loadCenterStone(targetHead.shape));

        Promise.all(requests)
            .catch((error) => {
                console.error(`Error loading head model (${targetHead.headPath}):`, error);
            })
            .finally(() => {
                if (alive) reportPartReady("head", targetKey);
            });

        return () => {
            alive = false;
        };
    }, [isStandardTarget, targetHead, targetKey, reportPartReady, target.diamondSize]);

    const displayHead = useMemo(() => {
        if (displayed.isDiamondWise) return null;
        if (displayed.ringHead === "NO-HEAD") return null;
        const described = describeHead(displayed.ringHead, displayed.shape, displayed.diamondSize);
        const meshes = getCachedAsset("head", described.headPath);
        if (!meshes) return null;
        return {
            ...described,
            meshes,
            centerStoneMeshes: described.isThreeStone
                ? getCachedAsset("centerStone", described.shape) || null
                : null,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displayed.isDiamondWise, displayed.ringHead, displayed.shape, displayed.commitId, displayed.diamondSize]);

    const displayedShank = displayed.ringShank;

    // Compute transforms based strictly on displayHead (the active visible head)
    const activeTransforms = useMemo(() => {
        if (!displayHead) return null;

        const { ringHead: activeHead, shape: activeShape, isThreeStone: activeThreeStone, meshes } = displayHead;

        let unit = 25;
        if (activeHead === "BEZEL" && activeShape === "emerald") {
            unit = 29;
        } else if (activeHead === "BEZEL" && activeShape === "radiant") {
            unit = 40;
        } else if ((activeHead === "4-PRONG" || activeHead === "6-PRONG") && activeShape === "radiant") {
            unit = 50;
        } else {
            unit = 25;
        }

        const diamondCaratSize = getHeadCaratWidth(getVisualCaratForHead(diamondSize), unit);
        const ringHeadBezel = [0.35 + diamondCaratSize, (activeShape === "pear" ? 0.33 : 0.348) + diamondCaratSize, 0.35];
        const ringHeadBezelForHeart = [0.35 + diamondCaratSize, (activeShape === "pear" ? 0.33 : 0.35) + diamondCaratSize, 0.35];
        const ringHeadBezelForPrincess = [0.3 + diamondCaratSize, 0.29 + diamondCaratSize, 0.35];

        // Spread has to track the DRAWN stone, not the weight, or the side
        // prongs walk away from a centre stone that is no longer growing
        // as fast. visualCarat(5) is 3.5, so the spread now tops out where
        // 3.5ct used to sit - matching the head it belongs to.
        const visualCarat = getVisualCarat(diamondSize);
        const sideStoneXOffset = visualCarat <= 3 ? 0 : ((visualCarat - 3) / 1) * 0.04;
        const WIDE_PLAIN_HEAD_Y_OFFSET = 0.22;
        const shankYOffset = displayedShank === "WIDE-PLAIN" ? WIDE_PLAIN_HEAD_Y_OFFSET : 0;

        if (activeThreeStone) {
            const threeStoneKey = activeHead.toLowerCase().replace('-', '_');
            const shapeConfig = threeStoneHeadShapes[threeStoneKey] || threeStoneHeadShapes.oval;

            let rightPos = [...(shapeConfig.right?.position || shapeConfig.position)];
            let leftPos  = [...(shapeConfig.left?.position  || shapeConfig.position)];

            rightPos[0] = rightPos[0] + sideStoneXOffset;
            leftPos[0]  = leftPos[0]  - sideStoneXOffset;
            rightPos[1] = rightPos[1] - sideStoneXOffset * 0.4 + shankYOffset;
            leftPos[1]  = leftPos[1]  - sideStoneXOffset * 0.4 + shankYOffset;

            if (["CHANNEL", "PLATE-PRONG"].includes(ringSideSetting) && ["baguette", "trapezoid"].includes(threeStoneKey)) {
                rightPos = [1.45 + sideStoneXOffset, 3.45 + shankYOffset, 0];
                leftPos  = [-1.45 - sideStoneXOffset, 3.45 + shankYOffset, 0];
            }
            if (["CHANNEL", "PLATE-PRONG"].includes(ringSideSetting) && threeStoneKey === "trapezoid") {
                rightPos = [1.2 + sideStoneXOffset, 3.7 + shankYOffset, 0];
                leftPos  = [-1.2 - sideStoneXOffset, 3.7 + shankYOffset, 0];
            }

            const basePos = shapeConfig.position
                ? [shapeConfig.position[0], shapeConfig.position[1] + shankYOffset, shapeConfig.position[2]]
                : rightPos;

            return {
                position: basePos,
                rotation: shapeConfig.rotation || [0, 0, 0],
                scale:    shapeConfig.scale    || [0.2, 0.2, 0.2],
                haloTransforms: {},
                sideStoneTransforms: {
                    right: {
                        position: rightPos,
                        rotation: shapeConfig.right?.rotation || shapeConfig.rotation || [0, 0, 0],
                        scale:    shapeConfig.right?.scale    || shapeConfig.scale    || [0.2, 0.2, 0.2],
                    },
                    left: {
                        position: leftPos,
                        rotation: shapeConfig.left?.rotation  || shapeConfig.rotation || [0, 0, 0],
                        scale:    shapeConfig.left?.scale     || shapeConfig.scale    || [0.2, 0.2, 0.2],
                    },
                }
            };
        }

        if (activeHead === "BEZEL") {
            const bezelData = shapeDataForBezel[activeShape] || shapeDataForBezel.round;
            return {
                position: [bezelData.position[0], bezelData.position[1] + shankYOffset, bezelData.position[2]],
                rotation: bezelData.rotation,
                scale: activeShape === "heart" ? ringHeadBezelForHeart : (activeShape === "princess" || activeShape === "radiant") ? ringHeadBezelForPrincess : ringHeadBezel,
                haloTransforms: {}
            };
        }

        if (activeHead === "TULIP") {
            const tulipData = shapeDataForTulip[activeShape] || shapeDataForTulip.round;
            return {
                position: [tulipData.position[0], tulipData.position[1] + shankYOffset, tulipData.position[2]],
                rotation: [0, 0, 0],
                scale: tulipData.scale(diamondCaratSize),
                haloTransforms: {}
            };
        }

        if (activeHead === "HALO") {
            const haloData = shapeDataForHalo[activeShape] || shapeDataForHalo.round;
            const s = haloData.scale(diamondCaratSize);
            return {
                position: [haloData.position[0], haloData.position[1] + shankYOffset, haloData.position[2]],
                rotation: haloData.rotation,
                scale: [s, s, s],
                haloTransforms: {}
            };
        }

        if (activeHead === "HIDDEN-HALO") {
            const haloData = shapeDataForHiddenHalo[activeShape] || shapeDataForHiddenHalo.round;
            return {
                position: [haloData.position[0], haloData.position[1] + shankYOffset, haloData.position[2]],
                rotation: haloData.rotation,
                haloTransforms: (meshes || []).reduce((acc, mesh) => {
                    acc[mesh.name] = HIDDEN_HALO_MESHES.has(mesh.name)
                        ? { position: [haloData.position2[0], haloData.position2[1] + shankYOffset, haloData.position2[2]], rotation: haloData.rotation2, scale: [0.4, 0.38, 0.4] }
                        : { position: [haloData.position[0], haloData.position[1] + shankYOffset, haloData.position[2]], rotation: haloData.rotation, scale: (shapeData[activeShape] || shapeData.round).scale(diamondCaratSize) };
                    return acc;
                }, {})
            };
        }

        const shapeInfo = shapeData[activeShape] || shapeData.round;
        let position, rotation, scale;

        const rawPos = (activeShape === "pear" || activeShape === "heart")
            ? (shapeInfo.specialPosition || shapeInfo.position)
            : shapeInfo.position;

        position = [rawPos[0], rawPos[1] + shankYOffset, rawPos[2]];

        if (activeHead === "DOUBLE-HALO" || activeHead === "SINGLE-HALO") {
            scale = [0.34 + diamondCaratSize, 0.40, 0.34 + diamondCaratSize];
        } else {
            scale = (activeShape === "pear" || activeShape === "heart")
                ? shapeInfo.scale(diamondCaratSize - 0.04)
                : shapeInfo.scale(diamondCaratSize);
        }
        if (activeShape === "heart") {
            scale = shapeInfo.scale(diamondCaratSize);
        }

        rotation = activeShape !== "round" && (activeHead === "4-PRONG" || activeHead === "6-PRONG" || activeHead === "TWO-STONE")
            ? [Math.PI / 2, 0, 0]
            : [0, 0, 0];

        if ((activeHead === "4-PRONG" || activeHead === "6-PRONG" || activeHead === "TWO-STONE") && activeShape === "asscher") {
            scale = [...scale];
            scale[0] += 0.03;
            scale[1] += 0.03;
            scale[2] += 0.02;
        }

        if (activeHead === "TWO-STONE") {
            const xOffset = TWO_STONE_X_OFFSET[activeShape] ?? TWO_STONE_X_OFFSET.round;
            return {
                position, rotation, scale, haloTransforms: {},
                twoStoneTransforms: {
                    left:  { position: [position[0] - xOffset, position[1], position[2]], rotation, scale },
                    right: { position: [position[0] + xOffset, position[1], position[2]], rotation, scale },
                },
            };
        }

        return { position, rotation, scale, haloTransforms: {} };
    }, [displayHead, diamondSize, ringSideSetting, displayedShank]);

    const centerStoneTransforms = useMemo(() => {
        if (!displayHead?.isThreeStone || !displayHead?.centerStoneMeshes) return null;
        const { shape: activeShape, ringHead: activeHead } = displayHead;

        let unit = 25;
        if (activeHead === "BEZEL" && activeShape === "emerald") {
            unit = 29;
        } else if (activeHead === "BEZEL" && activeShape === "radiant") {
            unit = 40;
        } else if ((activeHead === "4-PRONG" || activeHead === "6-PRONG") && activeShape === "radiant") {
            unit = 50;
        } else {
            unit = 25;
        }
        const diamondCaratSize = getHeadCaratWidth(getVisualCaratForHead(diamondSize), unit);
        const transforms = threeStoneCenterShapes[activeShape] || threeStoneCenterShapes.round;
        const WIDE_PLAIN_HEAD_Y_OFFSET = 0.22;
        const shankYOffset = displayedShank === "WIDE-PLAIN" ? WIDE_PLAIN_HEAD_Y_OFFSET : 0;

        return {
            position: [transforms.position[0], transforms.position[1] + shankYOffset, transforms.position[2]],
            rotation: transforms.rotation || [0, 0, 0],
            scale: transforms.scale(diamondCaratSize)
        };
    }, [displayHead, diamondSize, displayedShank]);

    const headHeightBoost = getHeadHeightBoost(getVisualCarat(diamondSize));

    if (!displayHead || !activeTransforms) return null;

    return (
        <>
            {displayHead.meshes.flatMap((mesh, index) => {
                // HALO's accent ring and centre stone are told apart by the
                // node-name tag the asset pipeline applied (see
                // getHaloDiamondKind) rather than the fixed-name Set every
                // other head uses. The baked centre-stone mesh itself is
                // skipped entirely for HALO - the hero stone is now the same
                // shared <Diamond> every other head style uses (see
                // Scene.jsx), so rendering the baked one too would double it
                // up. Only the surrounding ring of small accent diamonds
                // (and the metal basket) still come from this baked model.
                const isHaloHead = displayHead.ringHead === "HALO";
                const haloDiamondKind = isHaloHead ? getHaloDiamondKind(mesh.name) : null;
                // HALO now renders its OWN baked centre stone (this mesh) instead of
                // the shared <Diamond> component - Scene.jsx no longer mounts that
                // shared diamond while a HALO head is displayed, so nothing doubles up.
                const isDiamond = isHaloHead ? Boolean(haloDiamondKind) : diamondMeshNames.has(mesh.name);
                const stoneProps = isHaloHead
                    ? colorlessDiamondMaterialProps
                    : (COLORLESS_HALO_HEADS.has(displayHead.ringHead) ? colorlessDiamondMaterialProps : diamondMaterialProps);

                // TWO-STONE: render every mesh in the (single, shared) 4-PRONG
                // basket asset TWICE, once per side - see activeTransforms above.
                if (displayHead.isTwoStone && activeTransforms.twoStoneTransforms) {
                    return ["left", "right"].map((side) => {
                        const shown = boostHeadTransform(activeTransforms.twoStoneTransforms[side], headHeightBoost);
                        return (
                            <HeadMesh
                                key={`head_${displayHead.headPath}_${side}_${mesh.name}_${index}`}
                                geometry={mesh.geometry}
                                position={shown.position}
                                rotation={shown.rotation}
                                scale={shown.scale}
                                materialProps={metalMaterialProps}
                                headColor={headColor}
                                isDiamond={isDiamond}
                                diamondProps={isDiamond ? stoneProps : null}
                            />
                        );
                    });
                }

                let finalTransform;

                if (displayHead.isThreeStone && activeTransforms.sideStoneTransforms) {
                    const direction = getSideStoneDirection(mesh.name);
                    if (direction === "left") {
                        finalTransform = activeTransforms.sideStoneTransforms.left;
                    } else if (direction === "right") {
                        finalTransform = activeTransforms.sideStoneTransforms.right;
                    } else {
                        finalTransform = {
                            position: activeTransforms.position,
                            rotation: activeTransforms.rotation,
                            scale:    activeTransforms.scale,
                        };
                    }
                } else {
                    const baseTransform = {
                        position: activeTransforms.position,
                        rotation: activeTransforms.rotation,
                        scale:    activeTransforms.scale,
                    };
                    const haloTransform = activeTransforms.haloTransforms?.[mesh.name];
                    finalTransform = haloTransform || baseTransform;
                }

                // Three-stone settings are laid out as a group and are left alone.
                const shown = displayHead.isThreeStone
                    ? finalTransform
                    : boostHeadTransform(finalTransform, headHeightBoost);

                return (
                    <HeadMesh
                        key={`head_${displayHead.headPath}_${mesh.name}_${index}`}
                        geometry={mesh.geometry}
                        position={shown.position}
                        rotation={shown.rotation}
                        scale={shown.scale}
                        materialProps={metalMaterialProps}
                        headColor={headColor}
                        isDiamond={isDiamond}
                        diamondProps={isDiamond ? stoneProps : null}
                    />
                );
            })}

            {/* Center stone for three-stone rings */}
            {displayHead.isThreeStone && displayHead.centerStoneMeshes && centerStoneTransforms && (
                displayHead.centerStoneMeshes.map((mesh, index) => (
                    <HeadMesh
                        key={`center_stone_${displayHead.shape}_${mesh.name}_${index}`}
                        geometry={mesh.geometry}
                        position={centerStoneTransforms.position}
                        rotation={centerStoneTransforms.rotation}
                        scale={centerStoneTransforms.scale}
                        materialProps={metalMaterialProps}
                        headColor={headColor}
                        isDiamond={false}
                        diamondProps={null}
                    />
                ))
            )}
        </>
    );
}

export default React.memo(Head);
