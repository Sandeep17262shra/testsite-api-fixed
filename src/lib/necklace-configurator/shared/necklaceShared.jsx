// Shared building blocks used by BOTH necklace chain families:
// the name-pendant chains (NamePendantChain.jsx) and the plain drape
// chains (DrapeChain.jsx), plus the charm components in NecklaceCharms.jsx.
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { FontLoader as DreiFontLoader } from 'three/examples/jsm/loaders/FontLoader';
import * as THREE from 'three';
import { ringMetalProps } from './metalMaterial';
import { withModelVersion } from './assets';

const initialFontUrl = '/fonts/helvetiker_bold.typeface.json';

// ─── Font URLs ────────────────────────────────────────────────────────────────
const NAME_FONT_URLS = {
  dancing:       '/fonts/Dancing Script_Bold.json',
  yellowtail:    '/fonts/Yellowtail_Regular.json',
  //lobster:       '/fonts/Lobster_Regular.json',
  //darklarch:     '/fonts/Dark Larch PERSONAL USE ONLY_Regular.json',
  //marmellata:    '/fonts/Marmellata (Jam)_demo_Regular.json',
  //elevate:       '/fonts/Elevate PERSONAL USE ONLY_Regular.json',
  kingsman:      '/fonts/Kingsman Demo_Regular.json',
  //querinoscript: '/fonts/Querino Script PERSONAL USE_Italic.json',
  //blackrose:     '/fonts/Black Rose Personal Use_Regular.json',
};

// ─── Letter spacing per font ─────────────────────────────────────────────────
const NAME_FONT_LETTER_SPACING = {
  dancing:       -0.10,
  yellowtail:    -0.10,
  lobster:       -0.08,
  darklarch:     -0.08,
  marmellata:    -0.06,
  elevate:       -0.2,
  kingsman:      -0.1,
  querinoscript: -0.04,
  blackrose:     -0.05,
};

// ─── CHARM Y-AXIS OFFSETS ─────────────────────────────────────────────────────
// The per-size Y nudge is gone with the pendant Size selector — medium was 0,
// so there is nothing left to add here.

const CHARM_FONT_Y_OFFSET = {
  dancing:       0,
  yellowtail:    0,
  lobster:       0,
  darklarch:     0,
  marmellata:    0,
  elevate:       0,
  kingsman:      -0.2,
  querinoscript: 0,
  theodora:      0,
  blackrose:     0,
  tallcasatmed:  0,
};

const DEFAULT_LETTER_SPACING = 0;
const DEFAULT_FONT_KEY = 'dancing';

const _prewarmedFontLoader = new DreiFontLoader();

if (typeof window !== 'undefined') {
  _prewarmedFontLoader.load(NAME_FONT_URLS[DEFAULT_FONT_KEY], () => {}, undefined, () => {});
  _prewarmedFontLoader.load(initialFontUrl, () => {}, undefined, () => {});

  const warmRest = () => {
    Object.entries(NAME_FONT_URLS).forEach(([key, url]) => {
      if (key === DEFAULT_FONT_KEY) return;
      _prewarmedFontLoader.load(url, () => {}, undefined, () => {});
    });
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(warmRest, { timeout: 4000 });
  } else {
    setTimeout(warmRest, 2500);
  }
}

// ─── GLB cache ────────────────────────────────────────────────────────────────
let _gltfLoader = null;
const getGLTFLoader = () => {
  if (!_gltfLoader) {
    _gltfLoader = new GLTFLoader();
    if (typeof window !== 'undefined') {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/gltf/');
      _gltfLoader.setDRACOLoader(dracoLoader);
    }
  }
  return _gltfLoader;
};

const _gltfCache    = new Map();
const _gltfInflight = new Map();

const loadGLBCached = (path) => {
  if (_gltfCache.has(path)) {
    return Promise.resolve(_gltfCache.get(path).clone(true));
  }
  if (_gltfInflight.has(path)) {
    return _gltfInflight.get(path).then((scene) => scene.clone(true));
  }
  const promise = new Promise((resolve, reject) => {
    getGLTFLoader().load(
      withModelVersion(path),
      (gltf) => { _gltfCache.set(path, gltf.scene); resolve(gltf.scene); },
      undefined,
      reject
    );
  });
  _gltfInflight.set(path, promise);
  promise.finally(() => _gltfInflight.delete(path));
  return promise.then((scene) => scene.clone(true));
};

// ─── Constants ────────────────────────────────────────────────────────────────
const MESHES = ['dimeonds'];
const GEMSTONE_NAME_RE = /(diamond|dimeond|gem|stone)/i;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sanitizePendantText = (v) => v.replace(/[^a-zA-Z0-9 '&.-]/g, '').slice(0, 16);
const isGemstoneMesh = (mesh) => MESHES.includes(mesh.name) || GEMSTONE_NAME_RE.test(mesh.name);

const GEMSTONE_ENV_TEXTURE_PATH = '/3532532.jpg'; // must exist in this app's /public
const GEMSTONE_REFRACTION_PARAMS = {
  ior: 2.42,
  bounces: 3,
  aberrationStrength: 0.02,
};

const CHARM_ALPHA_THRESHOLD = 30;
const CHARM_MARCH_STEP = 3;
const CHARM_MIN_HOLE_AREA = 400;
const NECKLACE_CHARM_VERTICAL_CLEARANCE = 0.45;
// Pull each name-pendant side charm slightly toward the necklace centre. The
// chain transform still supplies all dynamic first/last-character movement.
const NAME_PENDANT_CHARM_SIDE_INSET = 0.12;
const NAME_PENDANT_CHARM_TILT = 0.26;
const NECKLACE_CHARM_BAIL_RADIUS = 0.20;
const NECKLACE_CHARM_BAIL_TUBE = 0.026;

// ─── Charm "add" wobble ───────────────────────────────────────────────────
// Plays a quick decaying rotation + scale punch on top of the charm's
// normal placement, purely imperative so it never fights with the
// position/rotation/scale props driven by placement logic.
//
// `trigger` is whatever value identifies "which charm is this, visually" —
// e.g. the image path, or letter+font for an initial. The wobble restarts
// any time that value changes, which covers both cases:
//   - a brand new charm mounting (fresh `trigger` on first render)
//   - an EXISTING slot being replaced with a different charm (same React
//     key/id, but `trigger` changes) — this is the case a plain
//     mount-only effect would miss, since the <group> never remounts.
const CHARM_WOBBLE_DURATION   = 0.7;   // seconds
const CHARM_WOBBLE_FREQUENCY  = 16;    // oscillation speed
const CHARM_WOBBLE_MAX_ANGLE  = 0.5;   // radians, ~28°
const CHARM_WOBBLE_MAX_SCALE  = 0.35;  // scale punch amount

function useCharmAddWobble(baseRotationZ = 0, baseScale = 1, trigger, ready = true) {
  const groupRef = useRef();
  const mountElapsed = useRef(null);
  const { clock } = useThree();

  const baseRef = useRef({ rotationZ: baseRotationZ, scale: baseScale });
  baseRef.current.rotationZ = baseRotationZ;
  baseRef.current.scale = baseScale;

  useEffect(() => {
    if (!ready) return;
    mountElapsed.current = clock.elapsedTime;
  }, [trigger, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    const node = groupRef.current;
    if (!node || mountElapsed.current == null) return;
    const elapsed = clock.elapsedTime - mountElapsed.current;
    const { rotationZ, scale } = baseRef.current;

    if (elapsed < CHARM_WOBBLE_DURATION) {
      const decay = 1 - elapsed / CHARM_WOBBLE_DURATION;
      const wobbleAngle = Math.sin(elapsed * CHARM_WOBBLE_FREQUENCY) * CHARM_WOBBLE_MAX_ANGLE * decay * decay;
      const wobbleScale = 1 + Math.sin(elapsed * CHARM_WOBBLE_FREQUENCY * 0.6 + Math.PI / 4) * CHARM_WOBBLE_MAX_SCALE * decay * decay;
      node.rotation.z = rotationZ + wobbleAngle;
      node.scale.setScalar(scale * wobbleScale);
    } else {
      node.rotation.z = rotationZ;
      node.scale.setScalar(scale);
    }
  });

  return groupRef;
}

// ─── WasherBail ───────────────────────────────────────────────────────────────
// The ring the chain hangs from. It lies in the XY plane (its hole faces the
// viewer, along Z) and is extruded BACKWARDS from its position, so it occupies
// z from (position.z - depth) to position.z. Anything that has to link into it
// - the end of a chain, above all - needs these numbers, so they live here
// rather than as inline defaults.
const WASHER_BAIL_DIMENSIONS = { outerRadius: 0.17, innerRadius: 0.13, depth: 0.09 };

const WasherBail = ({
  position,
  materialProps,
  outerRadius = WASHER_BAIL_DIMENSIONS.outerRadius,
  innerRadius = WASHER_BAIL_DIMENSIONS.innerRadius,
  depth = WASHER_BAIL_DIMENSIONS.depth,
  rotation = [0, Math.PI, 0],
}) => {
  const shape = useMemo(() => {
    const s    = new THREE.Shape();
    s.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
    s.holes.push(hole);
    return s;
  }, [innerRadius, outerRadius]);

  const extrudeSettings = useMemo(() => ({
    depth,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 20,
  }), [depth]);

  return (
    <mesh position={position} rotation={rotation}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshPhysicalMaterial
        {...ringMetalProps(materialProps.color || '#ECC875')}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export {
  initialFontUrl,
  NAME_FONT_URLS,
  NAME_FONT_LETTER_SPACING,
  CHARM_FONT_Y_OFFSET,
  DEFAULT_LETTER_SPACING,
  DEFAULT_FONT_KEY,
  loadGLBCached,
  MESHES,
  GEMSTONE_NAME_RE,
  sanitizePendantText,
  isGemstoneMesh,
  GEMSTONE_ENV_TEXTURE_PATH,
  GEMSTONE_REFRACTION_PARAMS,
  CHARM_ALPHA_THRESHOLD,
  CHARM_MARCH_STEP,
  CHARM_MIN_HOLE_AREA,
  NECKLACE_CHARM_VERTICAL_CLEARANCE,
  NAME_PENDANT_CHARM_SIDE_INSET,
  NAME_PENDANT_CHARM_TILT,
  NECKLACE_CHARM_BAIL_RADIUS,
  NECKLACE_CHARM_BAIL_TUBE,
  CHARM_WOBBLE_DURATION,
  useCharmAddWobble,
  WasherBail,
  WASHER_BAIL_DIMENSIONS,
};
