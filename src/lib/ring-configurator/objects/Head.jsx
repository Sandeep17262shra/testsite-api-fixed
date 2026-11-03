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
import { getVisualCarat, getVisualCaratForHead, getStoneAssemblyScale, STONE_ASSEMBLY_SHRINK, STONE_ASSEMBLY_PIVOT_Y } from '../utility/visualCarat';
import { FANCY_BASE_COLORS } from '../data/fancyDiamondColors';
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
  } else if (ringHead === "HIDDEN-HALO-2") {
    pivotY = (shapeDataForHiddenHalo2[activeShape] || shapeDataForHiddenHalo2.round).position[1];
  } else if (ringHead === "HIDDEN-HALO") {
    pivotY = (shapeDataForHiddenHalo[activeShape] || shapeDataForHiddenHalo.round).position[1];
  } else if (ringHead === "TULIP") {
    pivotY = (shapeDataForTulip[activeShape] || shapeDataForTulip.round).position[1];
  } else if (ringHead === "CLAW-SET") {
    pivotY = (shapeDataForClawSet[activeShape] || shapeDataForClawSet.round).position[1];
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
        scale: (carat) => [0.27 + carat, 0.35 + carat, 0.42],
        position: [0, 0.2, 0]
    },
    radiant: {
        scale: (carat) => [0.3 + carat, 0.43 + carat, 0.40],
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
        specialPosition: [0, 0.3, -0.15]
    },
    asscher: {
        scale: (carat) => [0.35 + carat, 0.35 + carat, 0.40],
        position: [0, 0.16, 0]
    },
};

const shapeDataForBezel = {
    round: { rotation: [Math.PI / 2, 0, 0], position: [0, 4.5, 0] },
    princess: { rotation: [Math.PI / 2, 0, 0], position: [0, 4.5, 0] },
    cushion: { rotation: [Math.PI / 2, 0, 0], position: [0, 4.5, 0] },
    oval: { rotation: [Math.PI / 2, 0, 0], position: [0, 4.5, 0] },
    moval: { rotation: [Math.PI / 2, 0, 0], position: [0, 4.5, 0], scale: (carat) => [0.24 + carat, 0.32 + carat, 0.38] },
    radiant: { rotation: [Math.PI / 2, 0, 0], position: [0, 4.5, 0], scale: (carat) => [0.293 + carat, 0.40 + carat, 0.39]  },
    pear: { rotation: [Math.PI / 2, 0, 0], position: [0, 4.5, 0.2] },
    emerald: { rotation: [Math.PI / 2, 0, 0], position: [0, 4.5, 0] },
    marquise: { rotation: [Math.PI / 2, 0, 0], position: [0, 4.5, 0] },
    heart: { rotation: [Math.PI / 2, 0, Math.PI], position: [0, 4.5, -0.15] },
    asscher: { rotation: [Math.PI / 2, 0, 0], position: [0.04, 4.5, 0] },
};

// ══════════════════════════════════════════════════════════════════════════════
// HIDDEN-HALO CARAT GROWTH RATE & TRANSFORMS
// Controls how much the head basket and attached diamond grow as carat increases.
// ══════════════════════════════════════════════════════════════════════════════
export const HIDDEN_HALO_CARAT_GROWTH_RATE = 0.065;

const shapeDataForHiddenHalo = {
    round: {
        scale: [0.45, 0.45, 0.45],
        position: [0, 0.52, 0]
    },
    princess: {
        scale: [0.45, 0.45, 0.45],
        position: [0, 0.50, 0]
    },
    cushion: {
        scale: [0.48, 0.48, 0.48],
        position: [0, 0.37, 0]
    },
    oval: {
        scale: [0.53, 0.53, 0.53],
        position: [0, 0.0, 0]
    },
    moval: {
        scale: [0.42, 0.42, 0.6],
        position: [0, 0.70, 0]
    },
    radiant: {
        scale: [0.44, 0.44, 0.44],
        position: [0, 0.58, 0]
    },
    pear: {
        scale: [0.5, 0.5, 0.5],
        position: [0, 0.22, 0],
        rotation: [0, Math.PI, 0]
    },
    emerald: {
        scale: [0.42, 0.42, 0.42],
        position: [0, 0.73, 0]
    },
    marquise: {
        scale: [0.5, 0.5, 0.5],
        position: [0, 0.2, 0]
    },
    heart: {
        scale: [0.40, 0.40, 0.44],
        position: [0, 0.85, 0],
        rotation: [0, Math.PI, 0]
    },
    asscher: {
        scale: [0.48, 0.48, 0.48],
        position: [0, 0.27, 0]
    }
};

const shapeDataForHiddenHalo2 = {
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
        scale: (carat) => [0.45 + carat, 0.45, 0.5 + carat],
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

// ══════════════════════════════════════════════════════════════════════════════
// CLAW-SET CARAT GROWTH RATE
// Controls how much the head basket and attached diamond grow as carat increases.
// ══════════════════════════════════════════════════════════════════════════════
export const CLAW_SET_CARAT_GROWTH_RATE = 0.065;

// CLAW-SET: 11 individually-modelled GLBs with baked diamond and metal head.
// Each file ships with non-identity node transforms baked into vertices.
const shapeDataForClawSet = {
    round: {
        scale: [0.35, 0.35, 0.35],
        position: [0, 1.13, 0]
    },
    oval: {
        scale: [0.42, 0.42, 0.42],
        position: [0, 0.72, 0]
    },
    cushion: {
        scale: [0.46, 0.46, 0.46],
        position: [0, 0.45, 0]
    },
    emerald: {
        scale: [0.52, 0.52, 0.52],
        position: [0, 0.08, 0]
    },
    pear: {
        scale: [0.46, 0.46, 0.46],
        position: [0, 0.44, 0],
  
    },
    princess: {
        scale: [0.38, 0.38, 0.38],
        position: [0, 0.98, 0]
    },
    radiant: {
        scale: [0.39, 0.35, 0.39],
        position: [0, 1.12, 0]
    },
    asscher: {
        scale: [0.36, 0.36, 0.36],
        position: [0, 1.11, 0]
    },
    marquise: {
        scale: [0.6, 0.6, 0.6],
        position: [0, -0.4, 0]
    },
    heart: {
        scale: [0.5, 0.5, 0.5],
        position: [0, 0.2, 0],
        rotation: [0, Math.PI, 0]
    },
    moval: {
        scale: [0.5, 0.6, 0.45],
        position: [0, -0.75, 0],
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
    princess: 1,
    cushion: 1.1212,
    oval: 1.1676,
    moval: 1.1676,
    radiant: 1.07,
    pear: 0.7,
    emerald: 1,
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
        position: [0, 3.1, 0],
        rotation: HALO_ROTATION[shape] || [0, 0, 0],
        scale: (carat) => (0.39 + carat) * ratio
    };
    return acc;
}, {});

// ─── Moval-specific per-axis halo scale ─────────────────────────────────────
// Adjust x / y / z independently to fit the moval halo model perfectly.
// The base uniform scale (controlled by HALO_SIZE_RATIO.moval above) is
// multiplied by each factor below, so 1.0 = no change from the uniform value.
//   x → left/right width
//   y → up/down height (usually leave near 1.0)
//   z → front/back depth
const HALO_MOVAL_SCALE_OFFSET = {
    x: 0.8,
    y: 1.0,
    z: 1.0,
};
// Override moval's entry so its scale() returns a [sx, sy, sz] tuple.
{
    const ratio = HALO_SIZE_RATIO.moval ?? 1.0;
    shapeDataForHalo.moval = {
        position: [0, 3.1, 0],
        rotation: HALO_ROTATION.moval || [0, 0, 0],
        scale: (carat) => {
            const s = (0.39 + carat) * ratio;
            return [
                s * HALO_MOVAL_SCALE_OFFSET.x,
                s * HALO_MOVAL_SCALE_OFFSET.y,
                s * HALO_MOVAL_SCALE_OFFSET.z,
            ];
        },
    };
}


function getHaloHeadPath(shape) {
    // For moval diamond, use the current oval halo model; otherwise the shape's model.
    const s = shape === "moval" ? "oval" : shape;
    return `HALO/halo-${s}/halo-${s}-3`;
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
            rotation: [Math.PI / 2, 0.0, 0],   // mirrored Z-tilt
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
            position: [1.4, 3.6, 0],
            scale: [0.18, 0.18, 0.18],
        },
        left: {
            rotation: [Math.PI / 2, 0.5, 0],
            position: [-1.4, 3.6, 0],
            scale: [0.18, 0.18, 0.18],
        },
        rotation: [Math.PI / 2, 0.5, 0],
        position: [-1.2, 3.8, 0],
        scale: [0.2, 0.2, 0.2],
    },
    pear: {
        right: {
            rotation: [Math.PI / 1, 0, 3.1],
            position: [1.55, 3.6, 0],
            scale: [0.35, 0.35, 0.35],
        },
        left: {
            rotation: [Math.PI / 1, 0, -3.1],
            position: [-1.55, 3.5, 0],
            scale: [0.35, 0.36, 0.35],
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
            rotation: [Math.PI / 1, 0, 4.1],
            position: [1.4, 3.5, 0],
            scale: [0.35, 0.35, 0.35],
        },
        left: {
            rotation: [Math.PI / 1, 0, -4.1],
            position: [-1.4, 3.5, 0],
            scale: [0.35, 0.36, 0.35],
        },
        rotation: [Math.PI / 2, 0.43, Math.PI / 2],
        position: [-1.4, 3.5, 0],
        scale: [0.2, 0.2, 0.2],
    },
    round: {
        right: {
            rotation: [Math.PI / 2, 1.55, 1.55],
            position: [1.5, 3.5, 0],
            scale: [0.15, 0.15, 0.15],
        },
        left: {
            rotation: [Math.PI / 2, -1.55, -1.55],
            position: [-1.5, 3.5, 0],
            scale: [0.15, 0.15, 0.15],
        },
        rotation: [Math.PI / 2, 0.5, 0],
        position: [-1.2, 3.8, 0],
        scale: [0.2, 0.2, 0.2],
    }
};

// Add center stone transforms for three-stone rings
const threeStoneCenterShapes = {
    round: {
        scale: (carat) => [0.40 + carat, 0.34, 0.40 + carat],
        position: [0, 1.1, 0],
        rotation: [0, 0, 0],
    },
    princess: {
        scale: (carat) => [0.32 + carat, 0.32 + carat, 0.37],
        position: [0, 0.5, 0],
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
        scale: (carat) => [0.3 + carat, 0.43 + carat, 0.40],
        position: [0, 0.4, 0],
        rotation: [Math.PI / 2, 0, 0],
    },
    pear: {
        scale: (carat) => [0.34 + carat, 0.34 + carat, 0.3],
        position: [0, 1.05, 0.2],
        rotation: [Math.PI / 2, 0, 0],
    },
    emerald: {
        scale: (carat) => [0.35 + carat, 0.33 + carat, 0.35],
        position: [0, 0.6, 0],
        rotation: [Math.PI / 2, 0, 0],
    },
    marquise: {
        scale: (carat) => [0.35 + carat, 0.35 + carat, 0.37],
        position: [0, 0.5, 0],
        rotation: [Math.PI / 2, 0, 0],
    },
    heart: {
        scale: (carat) => [0.40 + carat, 0.40 + carat, 0.40],
        position: [0, 0.4, -0.15],
        rotation: [Math.PI / 2, 0, Math.PI],
    },
    asscher: {
        scale: (carat) => [0.38 + carat, 0.38 + carat, 0.42],
        position: [0, 0.16, 0],
        rotation: [Math.PI / 2, 0, 0],
    },
    moval: {
        scale: (carat) => [0.27 + carat, 0.35 + carat, 0.42],
        position: [0, 0.2, 0],
        rotation: [Math.PI / 2, 0, 0],

    },
};

// ══════════════════════════════════════════════════════════════════════════════
// TWO-STONE CARAT GROWTH RATE & PER-SHAPE TRANSFORMS
// Controls scale and position for each two-stone shape.
// To move a shape up or down, adjust the Y value (the 2nd number in position: [x, Y, z]).
//   Higher Y (e.g. 0.60) = moves UP
//   Lower Y  (e.g. 0.45) = moves DOWN
//
// Optional per-side overrides: if left or right needs independent tuning, add
// `left:` or `right:` inside any shape (e.g. left: { position: [0, 0.55, 0] }).
// ══════════════════════════════════════════════════════════════════════════════
export const TWO_STONE_CARAT_GROWTH_RATE = 0.045;
export const TWO_STONE_BASE_MODEL_Y = 5.91;

export const shapeDataForTwoStone = {
    round: {
        scale: [0.4, 0.4, 0.4],
        position: [0, 0.72, 0],
        left:  { position: [0.045, 0.78, 0] },
        right: { position: [-0.045, 0.78, 0] }, 
    },
    pear: {
        scale: [0.4, 0.4, 0.4],
        position: [0, 0.72, 0],
        left:  { position: [0.05, 0.78, 0] },
        right: { position: [-0.05, 0.78, 0] }, 
    },
    oval: {
        scale: [0.4, 0.4, 0.4],
        position: [0, 0.72, 0],
        left:  { position: [0.05, 0.78, 0] },
        right: { position: [-0.05, 0.78, 0] }, 
    },
    cushion: {
        scale: [0.4, 0.4, 0.4],
        position: [0, 0.72, 0],
        left:  { position: [0.05, 0.78, 0] },
        right: { position: [-0.05, 0.78, 0] }, 
    },
    emerald: {
        scale: [0.4, 0.4, 0.4],
        position: [0, 0.72, 0],
        left:  { position: [0.05, 0.78, 0] },
        right: { position: [-0.05, 0.78, 0] }, 
    },
    princess: {
        scale: [0.4, 0.4, 0.4],
        position: [0, 0.72, 0],
        left:  { position: [0.05, 0.78, 0] },
        right: { position: [-0.05, 0.78, 0] }, 
    },
    marquise: {
        scale: [0.4, 0.4, 0.4],
        position: [0, 0.72, 0],
        left:  { position: [0.05, 0.78, 0] },
        right: { position: [-0.05, 0.78, 0] }, 
    },
    asscher: {
        scale: [0.4, 0.4, 0.4],
        position: [0, 0.72, 0],
        left:  { position: [0.05, 0.78, 0] },
        right: { position: [-0.05, 0.78, 0] }, 
    },
    radiant: {
        scale: [0.4, 0.4, 0.4],
        position: [0, 0.72, 0],
        left:  { position: [0.05, 0.78, 0] },
        right: { position: [-0.05, 0.78, 0] }, 
    },
    heart: {
        scale: [0.4, 0.4, 0.4],
        position: [0, 0.72, 0],
        left:  { position: [0.05, 0.82, -0.3] },
        right: { position: [-0.05, 0.82, 0] }, 
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

const PRONG_HEADS = ["4-PRONG", "6-PRONG", "BEZEL", "HIDDEN-HALO", "HIDDEN-HALO-2", "TULIP", "CLAW-SET"];
// Halo heads: the halo stones stay colourless; only the centre stone
// (Diamond.jsx) takes the selected diamond / gemstone colour.
const COLORLESS_HALO_HEADS = new Set(["HIDDEN-HALO", "HIDDEN-HALO-2", "SINGLE-HALO", "DOUBLE-HALO"]);
const COLORLESS_SIDE_STONE = "#FFFFFF";
const GEMSTONE_COLORS = {
    "blue-sapphire": "#0047AB",
    "green-emerald": "#4AE2A1",
    "green-sapphire": "#00AB55",
    moissanite: "#FFFFFF",
    "pink-sapphire": "#D1008F",
    "red-ruby": "#B71C1C",
    "yellow-sapphire": "#FFA94D",
};
const SIDE_STONE_COLORS = {
    colorless: COLORLESS_SIDE_STONE,
    ...GEMSTONE_COLORS,
};
const THREE_STONE_HEADS = ["OVAL", "TRAPEZOID", "HALF-MOON", "PEAR", "BAGUETTE", "ROUND"];

/** Everything that identifies one loadable head, derived from head + shape. */
function describeHead(ringHead, shape, carat, twoStoneLeft, twoStoneRight) {
    const isThreeStone = THREE_STONE_HEADS.includes(ringHead);
    const isTwoStone = ringHead === "TWO-STONE";
    const isHalo = ringHead === "HALO";
    const safeShape = shape || "round";
    let headPath;
    let leftHeadPath;
    let rightHeadPath;
    let leftShape;
    let rightShape;

    if (isHalo) {
        headPath = getHaloHeadPath(safeShape);
    } else if (PRONG_HEADS.includes(ringHead)) {
        headPath = `${ringHead}/${safeShape.toUpperCase()}`;
    } else if (isThreeStone) {
        headPath = `THREE-STONE/${ringHead.toUpperCase()}`;
    } else if (isTwoStone) {
        leftShape = (shape || twoStoneLeft || "round").toLowerCase();
        rightShape = (twoStoneRight || "pear").toLowerCase();
        leftHeadPath = `TWO-STONE/left-head/${leftShape}`;
        rightHeadPath = `TWO-STONE/right-head/${rightShape}`;
        headPath = `TWO-STONE|${leftShape}|${rightShape}`;
    } else {
        headPath = ringHead;
    }
    return { ringHead, shape: safeShape, isThreeStone, isTwoStone, isHalo, headPath, leftHeadPath, rightHeadPath, leftShape, rightShape };
}

async function loadHeadMeshes(headPath, isThreeStone) {
    const buffer = await fetchDecrypted(`/3d-models/RING-HEAD/${headPath}.glb`);
    const gltf = await parseGLTF(buffer);
    const isMovalHalo = headPath === "HALO/halo-moval/halo-moval-3";
    const isMovalTulip = headPath === "TULIP/MOVAL";
    const isClawSet = headPath.startsWith("CLAW-SET/");
    const isHiddenHalo = headPath.startsWith("HIDDEN-HALO/");
    const isTwoStoneSub = headPath.startsWith("TWO-STONE/");
    const isHalo = headPath.startsWith("HALO/");
    // The Moval source files retain their node transforms while all other
    // head exports have those transforms baked into their vertices. This
    // loader deliberately clears node transforms for the shared head frame;
    // preserve the Moval assets' authored placement by baking it first.
    // CLAW-SET and HIDDEN-HALO models also carry node transforms that must be baked into vertices.
    // TWO-STONE is handled separately below (multi-variant GLB structure).
    const needsBakedNodeTransforms = isMovalHalo || isMovalTulip || isClawSet || isHiddenHalo || isTwoStoneSub || isHalo;
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
            // authored placements into its cloned geometry before rendering
            // in the common head frame.
            mesh.geometry.applyMatrix4(child.matrixWorld);
        }
        if (isTwoStoneSub) {
            // TWO-STONE GLBs contain multiple variant meshes in the same file
            // (different LODs/shapes all exported together). Only the active
            // variant is placed in world space via the parent "Scene" node that
            // carries scale ≈ 390. After matrixWorld baking, valid head meshes
            // land at Y ≈ 5-11; the inactive variants stay near Y ≈ 0 (their
            // local-space origin). Discard any mesh whose baked center Y < 1.
            const bakedBox = new THREE.Box3().setFromBufferAttribute(mesh.geometry.attributes.position);
            const center = new THREE.Vector3();
            bakedBox.getCenter(center);
            if (center.y < 1.0) return; // inactive variant — skip

            // Tag stone meshes so getHaloDiamondKind() returns "center" for them.
            const name = child.name.toLowerCase();
            const matName = (child.material?.name || "").toLowerCase();
            const isDiamond = name.includes("diamond") || name.includes("asscher") || name.includes("heart") ||
                              matName.includes("diamond") || matName.includes("radiant") || matName.includes("heart");
            if (isDiamond) {
                mesh.name = `${HALO_CENTER_PREFIX}${child.name}`;
            }

            mesh.userData = mesh.userData || {};
            mesh.userData.side = headPath.includes("left-head") ? "left" : "right";
        }
        if (isMovalHalo) {
            if (child.name === "Diamond_Round_5") mesh.name = `${HALO_ACCENT_PREFIX}${child.name}`;
            if (child.name === "geometry_0") mesh.name = `${HALO_CENTER_PREFIX}${child.name}`;
        }
        if (isClawSet) {
            const isMetal = child.name.toLowerCase().includes("metal");
            if (!isMetal) {
                mesh.name = `${HALO_CENTER_PREFIX}${child.name}`;
            }
        }
        if (isHiddenHalo) {
            const matName = child.material?.name || "";
            if (matName.startsWith("Center") || matName.toLowerCase().includes("center")) {
                if (!mesh.name.startsWith(HALO_CENTER_PREFIX)) {
                    mesh.name = `${HALO_CENTER_PREFIX}${child.name}`;
                }
            } else if (matName.startsWith("Halo") || matName.toLowerCase().includes("halo")) {
                if (!mesh.name.startsWith(HALO_ACCENT_PREFIX)) {
                    mesh.name = `${HALO_ACCENT_PREFIX}${child.name}`;
                }
            }
        }
        if (isHalo) {
            const matName = child.material?.name || "";
            if (matName.startsWith("Center") || matName.toLowerCase().includes("center")) {
                if (!mesh.name.startsWith(HALO_CENTER_PREFIX)) {
                    mesh.name = `${HALO_CENTER_PREFIX}${child.name}`;
                }
            } else if (matName.startsWith("Halo") || matName.toLowerCase().includes("halo")) {
                if (!mesh.name.startsWith(HALO_ACCENT_PREFIX)) {
                    mesh.name = `${HALO_ACCENT_PREFIX}${child.name}`;
                }
            }
        }
        meshes.push(mesh);
    });
    if (!meshes.length) throw new Error(`No meshes in head ${headPath}`);

    if (isTwoStoneSub && headPath.includes("left-head") && headPath.toLowerCase().includes("heart")) {
        // Rotate the left two-stone heart head by 180° around its local tilted vertical axis.
        // The head has an authored ~10.5° outward tilt along the shank curve (Z axis).
        // Rotating around the world Y axis previously inverted this tilt to -10.5° (leaning inward).
        // Rotating around the tilted local axis preserves the outward tilt tangent to the shank,
        // while flipping the tip 180° to point backward (-Z) opposing the right head.
        const combinedBox = new THREE.Box3();
        for (const m of meshes) {
            if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
            combinedBox.union(m.geometry.boundingBox);
        }
        const center = new THREE.Vector3();
        combinedBox.getCenter(center);

        const tiltAngle = 10.5 * Math.PI / 180;
        const localAxis = new THREE.Vector3(-Math.sin(tiltAngle), Math.cos(tiltAngle), 0).normalize();
        const rotMat = new THREE.Matrix4()
            .makeTranslation(center.x, center.y, center.z)
            .multiply(new THREE.Matrix4().makeRotationAxis(localAxis, Math.PI))
            .multiply(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));

        for (const m of meshes) {
            m.geometry.applyMatrix4(rotMat);
            m.geometry.computeVertexNormals();
            m.geometry.computeBoundingBox();
        }
    }

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
    const { cut, clarity, diamondColor, sideStoneColor, diamondSize, diamondColorClarity, colorType, gemstone, fancyDiamond, fancyDiamondIntensity } = useContext(DiamondContext);
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

    const selectedStoneColor = useMemo(() => {
        if (colorType === "fancygem" && gemstone) return GEMSTONE_COLORS[gemstone] || diamondColor;
        if (colorType === "fancycolored" && fancyDiamond && fancyDiamondIntensity) {
            return FANCY_BASE_COLORS[fancyDiamond]?.[fancyDiamondIntensity] || diamondColor;
        }
        return diamondColor;
    }, [colorType, gemstone, fancyDiamond, fancyDiamondIntensity, diamondColor]);
    const coloredDiamondMaterialProps = useMemo(() => ({
        ...diamondMaterialProps,
        color: selectedStoneColor,
    }), [diamondMaterialProps, selectedStoneColor]);

    const colorlessDiamondMaterialProps = useMemo(() => ({
        ...diamondMaterialProps,
        color: COLORLESS_SIDE_STONE,
    }), [diamondMaterialProps]);
    const sideStoneMaterialProps = useMemo(() => ({
        ...diamondMaterialProps,
        // Accept a legacy raw hex value from a shared configuration too.
        color: SIDE_STONE_COLORS[sideStoneColor] || sideStoneColor || COLORLESS_SIDE_STONE,
    }), [diamondMaterialProps, sideStoneColor]);

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

    // ─────────────────────────────────────────────────────────────────────
    // LOAD for `target`, RENDER from `displayed`. The head currently on
    // screen is never touched until the whole new configuration is ready.
    // DiamondWise designs carry their own head geometry, so nothing is
    // fetched from the standard head library while one is selected.
    // ─────────────────────────────────────────────────────────────────────
    const targetKey = target.parts.head;
    const isStandardTarget = !target.isDiamondWise;
    const targetHead = useMemo(
        () => describeHead(target.ringHead, target.shape, target.diamondSize, target.twoStoneLeft, target.twoStoneRight),
        [target.ringHead, target.shape, target.diamondSize, target.twoStoneLeft, target.twoStoneRight]
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
        const requests = [];
        if (targetHead.isTwoStone) {
            requests.push(loadHead(targetHead.leftHeadPath, false));
            requests.push(loadHead(targetHead.rightHeadPath, false));
        } else {
            requests.push(loadHead(targetHead.headPath, targetHead.isThreeStone));
            if (targetHead.isThreeStone) requests.push(loadCenterStone(targetHead.shape));
        }

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
        const described = describeHead(displayed.ringHead, displayed.shape, displayed.diamondSize, displayed.twoStoneLeft, displayed.twoStoneRight);
        let meshes;
        if (described.isTwoStone) {
            const leftMeshes = getCachedAsset("head", described.leftHeadPath);
            const rightMeshes = getCachedAsset("head", described.rightHeadPath);
            if (!leftMeshes || !rightMeshes) return null;
            leftMeshes.forEach((m) => { m.userData = m.userData || {}; m.userData.side = "left"; });
            rightMeshes.forEach((m) => { m.userData = m.userData || {}; m.userData.side = "right"; });
            meshes = [...leftMeshes, ...rightMeshes];
        } else {
            meshes = getCachedAsset("head", described.headPath);
            if (!meshes) return null;
        }
        return {
            ...described,
            meshes,
            centerStoneMeshes: described.isThreeStone
                ? getCachedAsset("centerStone", described.shape) || null
                : null,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displayed.isDiamondWise, displayed.ringHead, displayed.shape, displayed.commitId, displayed.diamondSize, displayed.twoStoneLeft, displayed.twoStoneRight]);

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

        const WIDE_PLAIN_HEAD_Y_OFFSET = 0.22;
        const shankYOffset = displayedShank === "WIDE-PLAIN" ? WIDE_PLAIN_HEAD_Y_OFFSET : 0;

        if (activeThreeStone) {
            const visualCarat = getVisualCarat(diamondSize);
            const stoneAssemblyScale = getStoneAssemblyScale(visualCarat);
            const stoneAssemblyOffsetY = STONE_ASSEMBLY_PIVOT_Y * (1 - stoneAssemblyScale);
            // Counteract parent Scene.jsx group's stoneAssemblyScale so side stones NEVER change size
            const scaleCorrection = STONE_ASSEMBLY_SHRINK / stoneAssemblyScale;

            const threeStoneKey = activeHead.toLowerCase().replace('-', '_');
            const shapeConfig = threeStoneHeadShapes[threeStoneKey] || threeStoneHeadShapes.oval;

            let baseRightPos = [...(shapeConfig.right?.position || shapeConfig.position)];
            let baseLeftPos  = [...(shapeConfig.left?.position  || shapeConfig.position)];

            if (["CHANNEL", "PLATE-PRONG"].includes(ringSideSetting) && threeStoneKey === "trapezoid") {
                baseRightPos = [1.2, 3.7, 0];
                baseLeftPos  = [-1.2, 3.7, 0];
            } else if (["CHANNEL", "PLATE-PRONG"].includes(ringSideSetting) && threeStoneKey === "baguette") {
                baseRightPos = [1.45, 3.45, 0];
                baseLeftPos  = [-1.45, 3.45, 0];
            }

            // ═════════════════════════════════════════════════════════════════
            // THREE-STONE MOVEMENT CONFIGURATION
            // ═════════════════════════════════════════════════════════════════
            // • THREE_STONE_SPREAD_FACTOR: How far outward (X-axis) the side
            //   stones travel as the center carat increases. Increase this number
            //   (e.g. 0.18 or 0.20) for more outward movement; decrease it (e.g. 0.10)
            //   for less.
            // • THREE_STONE_Y_DROP_FACTOR: How much the side stones drop down
            //   (Y-axis) along the curved shoulder of the shank as they push outward.
            // ═════════════════════════════════════════════════════════════════
            const THREE_STONE_SPREAD_FACTOR = 0.02;
            const THREE_STONE_Y_DROP_FACTOR = 0.25;

            // World spread: starts at 0 at 1ct, moves outward as center carat increases
            const caratGrowth = Math.max(0, visualCarat - 1);
            const worldSpread = caratGrowth * THREE_STONE_SPREAD_FACTOR;

            // Target world coordinates for right and left side stones
            const worldRightX = (baseRightPos[0] * STONE_ASSEMBLY_SHRINK) + worldSpread;
            const worldLeftX  = (baseLeftPos[0] * STONE_ASSEMBLY_SHRINK) - worldSpread;
            // Subtle drop following the curve of the shank shoulder
            const worldY_base = (baseRightPos[1] * STONE_ASSEMBLY_SHRINK) + (STONE_ASSEMBLY_PIVOT_Y * (1 - STONE_ASSEMBLY_SHRINK));
            const worldY      = worldY_base - worldSpread * THREE_STONE_Y_DROP_FACTOR;
            const worldZ      = (baseRightPos[2] || 0) * STONE_ASSEMBLY_SHRINK;

            // Convert world targets back into the parent group's local coordinate space:
            // Local coords: pos_world = pos_local * stoneAssemblyScale + stoneAssemblyOffsetY
            const rightPos = [
                worldRightX / stoneAssemblyScale,
                (worldY - stoneAssemblyOffsetY) / stoneAssemblyScale + shankYOffset,
                worldZ / stoneAssemblyScale,
            ];
            const leftPos = [
                worldLeftX / stoneAssemblyScale,
                (worldY - stoneAssemblyOffsetY) / stoneAssemblyScale + shankYOffset,
                worldZ / stoneAssemblyScale,
            ];

            const fixedRightScale = [
                (shapeConfig.right?.scale?.[0] || shapeConfig.scale?.[0] || 0.2) * scaleCorrection,
                (shapeConfig.right?.scale?.[1] || shapeConfig.scale?.[1] || 0.2) * scaleCorrection,
                (shapeConfig.right?.scale?.[2] || shapeConfig.scale?.[2] || 0.2) * scaleCorrection,
            ];
            const fixedLeftScale = [
                (shapeConfig.left?.scale?.[0] || shapeConfig.scale?.[0] || 0.2) * scaleCorrection,
                (shapeConfig.left?.scale?.[1] || shapeConfig.scale?.[1] || 0.2) * scaleCorrection,
                (shapeConfig.left?.scale?.[2] || shapeConfig.scale?.[2] || 0.2) * scaleCorrection,
            ];
            const fixedBaseScale = [
                (shapeConfig.scale?.[0] || 0.2) * scaleCorrection,
                (shapeConfig.scale?.[1] || 0.2) * scaleCorrection,
                (shapeConfig.scale?.[2] || 0.2) * scaleCorrection,
            ];

            const baseWorldPos = [
                (shapeConfig.position?.[0] ?? rightPos[0]) * STONE_ASSEMBLY_SHRINK,
                ((shapeConfig.position?.[1] ?? rightPos[1]) * STONE_ASSEMBLY_SHRINK) + (STONE_ASSEMBLY_PIVOT_Y * (1 - STONE_ASSEMBLY_SHRINK)),
                (shapeConfig.position?.[2] ?? 0) * STONE_ASSEMBLY_SHRINK,
            ];
            const basePos = shapeConfig.position
                ? [
                    baseWorldPos[0] / stoneAssemblyScale,
                    (baseWorldPos[1] - stoneAssemblyOffsetY) / stoneAssemblyScale + shankYOffset,
                    baseWorldPos[2] / stoneAssemblyScale,
                  ]
                : rightPos;

            return {
                position: basePos,
                rotation: shapeConfig.rotation || [0, 0, 0],
                scale:    fixedBaseScale,
                haloTransforms: {},
                sideStoneTransforms: {
                    right: {
                        position: rightPos,
                        rotation: shapeConfig.right?.rotation || shapeConfig.rotation || [0, 0, 0],
                        scale:    fixedRightScale,
                    },
                    left: {
                        position: leftPos,
                        rotation: shapeConfig.left?.rotation  || shapeConfig.rotation || [0, 0, 0],
                        scale:    fixedLeftScale,
                    },
                }
            };
        }

        if (activeHead === "BEZEL") {
            const bezelData = shapeDataForBezel[activeShape] || shapeDataForBezel.round;
            const computedScale = typeof bezelData.scale === "function"
                ? bezelData.scale(diamondCaratSize)
                : (activeShape === "heart" ? ringHeadBezelForHeart : (activeShape === "princess" || activeShape === "radiant") ? ringHeadBezelForPrincess : ringHeadBezel);
            return {
                position: [bezelData.position[0], bezelData.position[1] + shankYOffset, bezelData.position[2]],
                rotation: bezelData.rotation,
                scale: computedScale,
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

        if (activeHead === "CLAW-SET") {
            const clawData = shapeDataForClawSet[activeShape] || shapeDataForClawSet.round;
            const visualCarat = getVisualCaratForHead(diamondSize);
            const growthRate = clawData.growthRate ?? CLAW_SET_CARAT_GROWTH_RATE;
            const caratGrowth = Math.max(0.7, 1 + (visualCarat - 1) * growthRate);

            const rawScale = typeof clawData.scale === "function" ? clawData.scale(0) : clawData.scale;
            const baseScale = Array.isArray(rawScale) ? rawScale : [rawScale || 0.35, rawScale || 0.35, rawScale || 0.35];

            const scaled = [
                baseScale[0] * caratGrowth,
                baseScale[1] * caratGrowth,
                baseScale[2] * caratGrowth
            ];

            const CLAW_BASE_MODEL_Y = 5.85;
            const yDrop = (caratGrowth - 1) * baseScale[1] * CLAW_BASE_MODEL_Y;
            const posY = clawData.position[1] + shankYOffset - yDrop;

            return {
                position: [clawData.position[0], posY, clawData.position[2]],
                rotation: clawData.rotation || [0, 0, 0],
                scale: scaled,
                haloTransforms: {}
            };
        }

        if (activeHead === "HALO") {
            const haloData = shapeDataForHalo[activeShape] || shapeDataForHalo.round;
            const raw = haloData.scale(diamondCaratSize);
            // moval returns [sx, sy, sz]; every other shape returns a scalar.
            const scale = Array.isArray(raw) ? raw : [raw, raw, raw];
            return {
                position: [haloData.position[0], haloData.position[1] + shankYOffset, haloData.position[2]],
                rotation: haloData.rotation,
                scale,
                haloTransforms: {}
            };
        }


        if (activeHead === "HIDDEN-HALO") {
            const haloData = shapeDataForHiddenHalo[activeShape] || shapeDataForHiddenHalo.round;
            const visualCarat = getVisualCaratForHead(diamondSize);
            const growthRate = haloData.growthRate ?? HIDDEN_HALO_CARAT_GROWTH_RATE;
            const caratGrowth = Math.max(0.7, 1 + (visualCarat - 1) * growthRate);

            const rawScale = typeof haloData.scale === "function" ? haloData.scale(0) : haloData.scale;
            const baseScale = Array.isArray(rawScale) ? rawScale : [rawScale || 0.40, rawScale || 0.40, rawScale || 0.40];

            const scaled = [
                baseScale[0] * caratGrowth,
                baseScale[1] * caratGrowth,
                baseScale[2] * caratGrowth
            ];

            const HIDDEN_HALO_BASE_MODEL_Y = 5.91;
            const yDrop = (caratGrowth - 1) * baseScale[1] * HIDDEN_HALO_BASE_MODEL_Y;
            const posY = haloData.position[1] + shankYOffset - yDrop;

            return {
                position: [haloData.position[0], posY, haloData.position[2]],
                rotation: haloData.rotation || [0, 0, 0],
                scale: scaled,
                haloTransforms: {}
            };
        }

        if (activeHead === "HIDDEN-HALO-2") {
            const haloData = shapeDataForHiddenHalo2[activeShape] || shapeDataForHiddenHalo2.round;
            return {
                position: [haloData.position[0], haloData.position[1] + shankYOffset, haloData.position[2]],
                rotation: haloData.rotation,
                haloTransforms: (meshes || []).reduce((acc, mesh) => {
                    const isHaloMesh = HIDDEN_HALO_MESHES.has(mesh.name) || mesh.name?.toLowerCase().includes("hidden_halo") || mesh.name?.toLowerCase().includes("hidden halo");
                    acc[mesh.name] = isHaloMesh
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

        rotation = activeShape !== "round" && (activeHead === "4-PRONG" || activeHead === "6-PRONG")
            ? (activeShape === "heart" ? [Math.PI / 2, 0, Math.PI] : [Math.PI / 2, 0, 0])
            : [0, 0, 0];

        if ((activeHead === "4-PRONG" || activeHead === "6-PRONG") && activeShape === "asscher") {
            scale = [...scale];
            scale[0] += 0.03;
            scale[1] += 0.03;
            scale[2] += 0.02;
        }

        if (activeHead === "TWO-STONE") {
            const visualCarat = getVisualCaratForHead(diamondSize);
            const caratGrowth = Math.max(0.7, 1 + (visualCarat - 1) * TWO_STONE_CARAT_GROWTH_RATE);

            const getSideTransform = (side, shapeKey) => {
                const shapeEntry = shapeDataForTwoStone[shapeKey] || shapeDataForTwoStone.round;
                const sideOverride = shapeEntry[side] || {};
                const baseScale = sideOverride.scale || shapeEntry.scale || [0.45, 0.45, 0.45];
                const basePos = sideOverride.position || shapeEntry.position || [0, 0.52, 0];
                const baseRot = sideOverride.rotation || shapeEntry.rotation || [0, 0, 0];

                const scaled = [
                    baseScale[0] * caratGrowth,
                    baseScale[1] * caratGrowth,
                    baseScale[2] * caratGrowth
                ];
                const yDrop = (caratGrowth - 1) * baseScale[1] * TWO_STONE_BASE_MODEL_Y;
                const posY = basePos[1] + shankYOffset - yDrop;

                return {
                    position: [basePos[0], posY, basePos[2]],
                    rotation: baseRot,
                    scale: scaled,
                };
            };

            const leftTransform = getSideTransform("left", displayHead.leftShape || "round");
            const rightTransform = getSideTransform("right", displayHead.rightShape || "pear");

            return {
                position: leftTransform.position,
                rotation: [0, 0, 0],
                scale: leftTransform.scale,
                twoStoneTransforms: {
                    left: leftTransform,
                    right: rightTransform,
                },
                haloTransforms: {}
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
    }, [displayHead, diamondSize, displayedShank, displayed.shape]);

    const headHeightBoost = getHeadHeightBoost(getVisualCarat(diamondSize));

    if (!displayHead || !activeTransforms) return null;

    return (
        <>
            {displayHead.meshes.flatMap((mesh, index) => {
                // HALO, CLAW-SET, HIDDEN-HALO and TWO-STONE have their center
                // stone(s) included in their own head models.
                const isSelfContainedHead = displayHead.ringHead === "HALO" || displayHead.ringHead === "CLAW-SET" || displayHead.ringHead === "HIDDEN-HALO" || displayHead.ringHead === "TWO-STONE";
                const haloDiamondKind = isSelfContainedHead ? getHaloDiamondKind(mesh.name) : null;
                // HALO, CLAW-SET, HIDDEN-HALO and TWO-STONE render their OWN baked stone(s) instead of
                // the shared <Diamond> component - Scene.jsx does not mount that
                // shared diamond while a self-contained head is displayed.
                const isDiamond = isSelfContainedHead ? Boolean(haloDiamondKind) : (diamondMeshNames.has(mesh.name) || (mesh.name && mesh.name.toLowerCase().includes("diamond")));
                const sideStoneDirection = displayHead.isThreeStone ? getSideStoneDirection(mesh.name) : null;
                const stoneProps = sideStoneDirection
                    ? sideStoneMaterialProps
                    : isSelfContainedHead
                    ? (haloDiamondKind === "center" ? coloredDiamondMaterialProps : colorlessDiamondMaterialProps)
                    : (COLORLESS_HALO_HEADS.has(displayHead.ringHead) ? colorlessDiamondMaterialProps : diamondMaterialProps);

                let finalTransform;

                if (displayHead.isThreeStone && activeTransforms.sideStoneTransforms) {
                    const direction = sideStoneDirection;
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
                } else if (displayHead.isTwoStone && activeTransforms.twoStoneTransforms) {
                    const side = mesh.userData?.side || (mesh.name?.toLowerCase().includes("left") ? "left" : "right");
                    finalTransform = activeTransforms.twoStoneTransforms[side] || {
                        position: activeTransforms.position,
                        rotation: activeTransforms.rotation,
                        scale:    activeTransforms.scale,
                    };
                } else {
                    const baseTransform = {
                        position: activeTransforms.position,
                        rotation: activeTransforms.rotation,
                        scale:    activeTransforms.scale,
                    };
                    const haloTransform = activeTransforms.haloTransforms?.[mesh.name];
                    finalTransform = haloTransform || baseTransform;
                }

                // Multi-stone settings (three-stone and two-stone) are laid out as a group and left alone.
                const shown = (displayHead.isThreeStone || displayHead.isTwoStone)
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
