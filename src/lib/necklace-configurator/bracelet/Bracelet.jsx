import React, { useState, useEffect, useLayoutEffect, useContext, useRef, useMemo, useCallback } from 'react';
import { Canvas, useThree, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, SoftShadows, Reflector, Environment, Text3D, MeshRefractionMaterial } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { RGBELoader } from 'three-stdlib';
import { RING_METAL, RING_METAL_ENV_URL, RING_TONE_MAPPING_EXPOSURE, JEWELRY_ENV_INTENSITY, ringMetalProps, createRingMetalMaterial, toRingMetalColor } from '../shared/metalMaterial';
import RingLightRig from '../shared/RingLightRig';
import { GEM_REFRACTION_PARAMS, useGemEnvTexture } from '../shared/gemMaterial';
import { isTwinPeakInitial, getInitialWasherDrop, INITIAL_WASHER_DROP_FACTOR } from '../shared/initialCharmHardware';
import * as THREE from 'three';
import { ToastContainer } from 'react-toastify';
import { BraceletContext } from '../contexts/BraceletContext';
import { CameraController } from '../shared/CameraControll';
import { Capture } from '../shared/Capture';
import { BRACELET_STYLES, BRACELET_CHARMS, BRACELET_CHAIN_POSITIONS, BRACELET_CHARM_POSITIONS, PLACEHOLDERS_FOR_BRACELET, BIRTHSTONE_POINT_ADJUSTMENTS, BRACELET_NAME_CHAIN_PATHS, isGeneratedNameChain, withModelVersion } from '../shared/assets';
import NameChainBracelet, { getNameChainCharmPlacement, getNameChainConfig, getNameChainCharmCategory } from './NameChain';
import { View360Context } from '../contexts/View360Context';
import { ShareContext } from '../contexts/ShareContext';
import { Base64 } from 'js-base64';
import { Suspense } from 'react';
import initialFontUrl from 'three/examples/fonts/helvetiker_bold.typeface.json?url';

// ─── Environment ────────────────────────────────────────────────────────────
// The same studio HDR the necklace lights with, not drei's `preset="studio"`.
// Two reasons, and the second is the visible one:
//
//   * The preset is fetched from a CDN at runtime. The local file is served
//     with the app, so it is there on first paint.
//   * A metal is BLACK until it has an environment to reflect - that is all a
//     metal shades from. So every frame between "model loaded" and "preset
//     arrived" drew the chain in black and it snapped to gold afterwards,
//     which is the flash on load. Preloading it, and holding the model hidden
//     until it has actually resolved (see isSceneReady), removes the flash
//     rather than shortening it.
const ENV_REVEAL_TIMEOUT_MS = 4000;
// The ring configurator's metal reflection map (see shared/metalMaterial.js).
const HDR_ENVIRONMENT_URL = RING_METAL_ENV_URL;
if (typeof window !== 'undefined') {
  useLoader.preload(RGBELoader, HDR_ENVIRONMENT_URL);
}

// Fires once its Suspense boundary has resolved, i.e. once the HDR above is
// decoded and the environment is actually usable.
function EnvironmentReadyNotifier({ onReady }) {
  useEffect(() => { onReady?.(); }, [onReady]);
  return null;
}

// Covers the canvas until the first frame is worth showing.
const FirstLoadGate = ({ ready }) => {
  if (ready) return null;
  return (
    <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center bg-[#f8f8f8] z-50 pt-20">
      <div className="flex space-x-2 mb-2">
        <div className="dot-bubble"></div>
        <div className="dot-bubble"></div>
        <div className="dot-bubble"></div>
      </div>
    </div>
  );
};

const MESHES = ["dimeonds", "file2", "dimeonds", "TEMP1001"];

// ─── Charm size defaults ───────────────────────────────────────────────────────
const DEFAULT_CHARM_HEIGHT  = 0.2;
const DEFAULT_CHARM_DEPTH   = 0.015;
const ALPHA_THRESHOLD       = 30;
const MARCH_STEP            = 3;
const MIN_HOLE_AREA         = 400;

// ─── Per-bracelet charm size config ───────────────────────────────────────────
// Tune height, depth, bailRingR, bailRingTube per bracelet path.
// Any bracelet NOT listed here falls back to the defaults above.
const CHARM_SIZE_CONFIG = {
  "/bc-assets/bracelet_models/BRACELET1.glb": {
    height:      0.45,
    depth:       0.025,
    bailRingR:   0.08,
    bailRingTube: 0.006,
  },
  "/bc-assets/bracelet_models/BRACELET2.glb": {
    height:      0.40,
    depth:       0.020,
    bailRingR:   0.06,
    bailRingTube: 0.006,
  },
  "/bc-assets/bracelet_models/BRACELET3.glb": {
    height:      0.18,
    depth:       0.015,
    bailRingR:   0.035,
    bailRingTube: 0.004,
  },
  "/bc-assets/bracelet_models/BRACELET4.glb": {
    height:      0.22,
    depth:       0.016,
    bailRingR:   0.045,
    bailRingTube: 0.006,
  },
  "/bc-assets/bracelet_models/BRACELET5.glb": {
    height:      0.20,
    depth:       0.014,
    bailRingR:   0.040,
    bailRingTube: 0.005,
  },
  "/bc-assets/bracelet_models/BRACELET6.glb": {
    height:      0.18,
    depth:       0.013,
    bailRingR:   0.036,
    bailRingTube: 0.0045,
  },
   "/bc-assets/bracelet_models/BRACELET13.glb": {
    height:      0.25,
    depth:       0.013,
    bailRingR:   0.036,
    bailRingTube: 0.0045,
  },
   "/bc-assets/bracelet_models/BRACELET14.glb": {
    height:      0.25,
    depth:       0.013,
    bailRingR:   0.036,
    bailRingTube: 0.0045,
  },
};

// Every generated name chain shares the GLB chains' charm sizing, so charms
// look the same whichever style is selected.
for (const generatedPath of BRACELET_NAME_CHAIN_PATHS) {
  CHARM_SIZE_CONFIG[generatedPath] = {
    height:      0.25,
    depth:       0.013,
    bailRingR:   0.036,
    bailRingTube: 0.0045,
  };
}

function getCharmSizeConfig(braceletPath) {
  return CHARM_SIZE_CONFIG[braceletPath] ?? {
    height:      DEFAULT_CHARM_HEIGHT,
    depth:       DEFAULT_CHARM_DEPTH,
    bailRingR:   0.04,
    bailRingTube: 0.005,
  };
}
// ─── Per-charm thickness override (2D charms) ─────────────────────────────
// Overrides just the extruded body depth for specific charm paths, regardless
// of which bracelet they're placed on. Anything not listed here falls back
// to the bracelet's own charmSizeCfg.depth.
const CHARM_DEPTH_OVERRIDES = {};
for (let n = 24; n <= 36; n++) {
  CHARM_DEPTH_OVERRIDES[`/bc-assets/bracelet_models/CHARMS${n}.png`] = 0.028; // tune this value
}

function getCharmDepth(charmPath, fallbackDepth) {
  return CHARM_DEPTH_OVERRIDES[charmPath] ?? fallbackDepth;
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── POINT-BASED CHARM PLACEMENT ───────────────────────────────────────────
// Every charm (2D image, 3D GLB, initial/letter, birthstone/diamond) is now
// anchored to one of the 9 locator empties ("point-1".."point-9") authored
// inside the bracelet GLB itself, instead of being distributed around a
// mathematical ellipse. All placed charms — whatever their type — share the
// SAME pool of 9 points, exactly like a real bracelet only has so many links
// you can actually hang something from.
//
// Bracelets that don't have point-1..point-9 locators (older models) keep
// working via the legacy elliptical "orbit" placement further below, which
// is now only used as a fallback.
// ═══════════════════════════════════════════════════════════════════════════

// Odd charm counts fan out from a true center point; even counts straddle
// the center. This mirrors getSlotOffsets' center-out ordering, just mapped
// onto the 9 physical locators instead of a computed angle.
const POINT_POOLS = {
  odd:  ['point-1', 'point-3', 'point-5', 'point-7', 'point-9'],
  even: ['point-2', 'point-4', 'point-6', 'point-8'],
};

// ─── Per-bracelet, PER-CHARM-KIND radius nudge ─────────────────────────────
// The point positions come straight from the GLB's locator empties. If a
// charm type needs to sit a little further out/in (e.g. a bulky 3D charm
// needs more clearance than a flat image charm), tune `radiusOffset` here —
// positive pushes the charm away from the bracelet's center, negative pulls
// it in. `yOffset` nudges it up/down. Everything defaults to 0 (i.e. sit
// exactly on the point) unless overridden.
const CHARM_POINT_RADIUS_CONFIG = {
  "/bc-assets/bracelet_models/BRACELET13.glb": {
    initial:  { radiusOffset: 0.18, yOffset: 0 },
    gemstone: { radiusOffset: -0.03,     yOffset: 0 },
    image:    { radiusOffset: 0.18,  yOffset: 0 },
    glb:      { radiusOffset: 0.0,  yOffset: 0 },
  },
  "/bc-assets/bracelet_models/BRACELET14.glb": {
    initial:  { radiusOffset: 0.18, yOffset: 0 },
    gemstone: { radiusOffset: -0.03,     yOffset: 0 },
    image:    { radiusOffset: 0.18,  yOffset: 0 },
    glb:      { radiusOffset: 0.0,  yOffset: 0 },
  },
};
const DEFAULT_POINT_RADIUS = { radiusOffset: 0, yOffset: 0 };

function getPointRadiusConfig(braceletPath, charmKind) {
  return CHARM_POINT_RADIUS_CONFIG[braceletPath]?.[charmKind] ?? DEFAULT_POINT_RADIUS;
}
function computeInwardFacingRotation(dirX, dirZ, adjRotation = 0) {
  const inward = new THREE.Vector3(-dirX, 0, -dirZ);
  if (inward.lengthSq() < 1e-6) inward.set(0, 0, -1);
  inward.normalize();
  if (adjRotation) inward.applyAxisAngle(new THREE.Vector3(0, 1, 0), adjRotation);

  const up = new THREE.Vector3(0, 1, 0);
  let xAxis = new THREE.Vector3().crossVectors(inward, up);
  if (xAxis.lengthSq() < 1e-6) xAxis.set(1, 0, 0);
  xAxis.normalize();

  const m = new THREE.Matrix4().makeBasis(xAxis, inward, up);
  const euler = new THREE.Euler().setFromRotationMatrix(m, 'XYZ');
  return [euler.x, euler.y, euler.z];
}
// charmKind is "initial", "gemstone" (birthstone/diamond/cushion), "image"
// (2D), or "glb" (3D). index/total are counted across ALL currently placed
// charms together (not per-kind), because the 9 physical points are a
// single shared resource on the bracelet.
function getPointPlacement(index, total, braceletPath, points, charmKind, scaleFallback) {
  if (!points || total <= 0) return null;

  const pool = total % 2 === 1 ? POINT_POOLS.odd : POINT_POOLS.even;
  const centerIndex = (pool.length - 1) / 2;
  const offset = getSlotOffsets(total)[index];
  if (offset === undefined) return null;

  const pointName = pool[Math.round(centerIndex + offset)];
  if (!pointName) return null;

  const localPos = points[pointName];
  if (!localPos) return null;

  // Guard against degenerate/placeholder locators sitting at (or near) the
  // model's own origin.
  if (localPos.length() < 0.5) return null;

  const worldPos = braceletLocalToScene(localPos, braceletPath, scaleFallback);

  // Radial direction from the bracelet's approximate center (scene origin),
  // used to apply the radiusOffset knob above.
  const radialLenXZ = Math.sqrt(worldPos.x * worldPos.x + worldPos.z * worldPos.z) || 1;
  const dirX = worldPos.x / radialLenXZ;
  const dirZ = worldPos.z / radialLenXZ;

  const radiusCfg = getPointRadiusConfig(braceletPath, charmKind);
  const px = worldPos.x + dirX * radiusCfg.radiusOffset;
  const pz = worldPos.z + dirZ * radiusCfg.radiusOffset;
  const py = worldPos.y + radiusCfg.yOffset;

  const angle = Math.atan2(worldPos.z, worldPos.x);

  // Manual per-point fine-tuning, shared across every charm kind that ever
  // lands on this point (this is the same table used for birthstone charms
  // before — it now applies uniformly to whatever charm sits on that point).
  const adj = BIRTHSTONE_POINT_ADJUSTMENTS[braceletPath]?.[pointName];
  const adjOffset = adj?.offset || [0, 0, 0];
  const adjRotation = adj?.rotationOffset || 0;

  return {
    position: [
      px + adjOffset[0],
      py + adjOffset[1],
      pz + adjOffset[2],
    ],
    rotation: computeInwardFacingRotation(dirX, dirZ, adjRotation),
    pointName,
    radiusOffset: radiusCfg.radiusOffset,
  };
}

// Classifies a placed charm object into one of the 4 kinds used above.
function getCharmKind(charm) {
  if (charm.type === 'initial') return 'initial';
  if (charm.type === 'birthstone' || charm.type === 'diamond' || charm.type === 'cushion') return 'gemstone';
  const path = charm.path || '';
  if (/\.(png|jpe?g|webp|gif|svg)$/i.test(path)) return 'image';
  return 'glb';
}

// Fixed bracelet/charm dimensions; charms are redistributed over this arc as
// the collection changes so none retain a stale, model-specific slot.
// ─── Fixed slot layout ─────────────────────────────────────────────────────
// 6 evenly-spaced positions around the loop, 60° apart. Slot "top" (the
// clasp/join) is reserved and never used — that's why max charms = 5.
// ─── Fixed slot layout ─────────────────────────────────────────────────────
const SLOT_COUNT = 6;
const STEP_ANGLE = (2 * Math.PI) / SLOT_COUNT;
const CENTER_ANGLE = Math.PI / 2;

function getSlotOffsets(n) {
  const offsets = [];
  if (n % 2 === 1) {
    offsets.push(0);
    for (let i = 1; i <= (n - 1) / 2; i++) offsets.push(-i, i);
  } else {
    for (let i = 1; i <= n / 2; i++) offsets.push(-(i - 0.5), i - 0.5);
  }
  return offsets.sort((a, b) => a - b);
}

// ─── LEGACY elliptical orbit placement (fallback only) ─────────────────────
// Only used for bracelets that do NOT have point-1..point-9 locators baked
// into their GLB. Any bracelet with points defined will always prefer
// getPointPlacement() above.
const CHARM_ORBIT_CONFIG = {
  "/bc-assets/bracelet_models/BRACELET13.glb": {
    initial:  { radiusX: 1.04, radiusZ: 1.04, y: 0.60 },
    gemstone: { radiusX: 0.8, radiusZ: 0.8, y: 0.60 },
    image:    { radiusX: 1.02, radiusZ: 1.02, y: 0.60 },
    glb:      { radiusX: 0.85, radiusZ: 0.85, y: 0.60 },
  },
  "/bc-assets/bracelet_models/BRACELET14.glb": {
    initial:  { radiusX: 1.07, radiusZ: 1.07, y: 0.60 },
    gemstone: { radiusX: 0.95, radiusZ: 0.95, y: 0.57 },
    image:    { radiusX: 1.05, radiusZ: 1.02, y: 0.60 },
    glb:      { radiusX: 0.86, radiusZ: 0.86, y: 0.60 },
  },
};

// Last-resort fallback for any bracelet with no entry above.
const FALLBACK_ORBIT = {
  initial:  { radiusX: 1.45, radiusZ: 1.55, y: 0.24 },
  gemstone: { radiusX: 1.45, radiusZ: 1.55, y: 0.24 },
  image:    { radiusX: 1.45, radiusZ: 1.55, y: 0.24 },
  glb:      { radiusX: 1.45, radiusZ: 1.55, y: 0.24 },
};

function getCharmOrbitConfig(braceletPath, charmKind) {
  const braceletCfg = CHARM_ORBIT_CONFIG[braceletPath];
  return braceletCfg?.[charmKind] ?? FALLBACK_ORBIT[charmKind];
}

function getOrbitCharmTransform(index, total, orbit) {
  if (total === 1) {
    const angle = CENTER_ANGLE; // bottom-center, same anchor as multi-charm case
    return {
      position: [
        Math.cos(angle) * orbit.radiusX,
        orbit.y,
        Math.sin(angle) * orbit.radiusZ,
      ],
      rotation: [Math.PI / 2, Math.PI, angle + Math.PI / 2],
    };
  }

  const offsets = getSlotOffsets(total);
  const offset = offsets[index];

  const angle = CENTER_ANGLE - offset * STEP_ANGLE;
  const rotAngle = CENTER_ANGLE + offset * STEP_ANGLE;

  return {
    position: [
      Math.cos(angle) * orbit.radiusX,
      orbit.y,
      Math.sin(angle) * orbit.radiusZ,
    ],
    rotation: [Math.PI / 2, Math.PI, rotAngle + Math.PI / 2],
  };
}

// ─── Birthstone/point locator loading ──────────────────────────────────────
// Locator empties named "point-1".."point-9" inside each bracelet GLB.
const POINT_NODE_REGEX = /^point[-_]?(\d+)$/i;
const braceletPointCache = new Map();

function loadBraceletPoints(path) {
  if (!braceletPointCache.has(path)) {
    const promise = loadGLTFScene(path).then((scene) => {
      scene.updateMatrixWorld(true);
      const points = {};
      scene.traverse((child) => {
        const match = child.name && child.name.match(POINT_NODE_REGEX);
        if (match) {
          const worldPos = new THREE.Vector3();
          child.getWorldPosition(worldPos);

          // Bracelet 14 was exported with the locator transforms baked into
          // each marker mesh's vertices (their Object3D origins are all
          // [0, 0, 0]). In that export, getWorldPosition() alone would put
          // every point at the bracelet centre and force the legacy orbit.
          // Read the marker geometry centre in that case, then transform it
          // through the parent hierarchy exactly as Three does for the model.
          if (child.position.lengthSq() < 1e-6 && child.isMesh && child.geometry) {
            child.geometry.computeBoundingBox();
            const markerCenter = child.geometry.boundingBox?.getCenter(new THREE.Vector3());
            if (markerCenter) worldPos.copy(child.localToWorld(markerCenter));
          }
          points[`point-${match[1]}`] = worldPos;
        }
      });
      return points;
    }).catch(() => ({}));
    braceletPointCache.set(path, promise);
  }
  return braceletPointCache.get(path);
}

// Re-applies the same wrapper transform GLBModel puts around the bracelet
// (BRACELET_CHAIN_POSITIONS) so a point's local coordinate lands in the same
// space the rest of the scene's charms use.
function braceletLocalToScene(localPos, braceletPath, scaleFallback) {
  const cfg = BRACELET_CHAIN_POSITIONS[braceletPath] || {};
  const wrapper = new THREE.Object3D();
  wrapper.position.set(...(cfg.position || [0, 0, 0]));
  if (cfg.rotation) wrapper.rotation.set(...cfg.rotation);
  wrapper.scale.set(...(cfg.scale || [scaleFallback, scaleFallback, scaleFallback]));
  wrapper.updateMatrixWorld(true);
  return wrapper.localToWorld(localPos.clone());
}

// ─── GLB charm scale lookup ────────────────────────────────────────────────
// Position/rotation now come from getPointPlacement()/getOrbitCharmTransform()
// above. Only `scale` still comes from the hand-tuned BRACELET_CHARM_POSITIONS data,
// since per-charm/per-bracelet size still needs manual tuning.
function getGLBCharmScale(braceletPath, charmPath) {
  const entries = BRACELET_CHARM_POSITIONS[braceletPath]?.[charmPath];
  const first = entries?.[0];
  return first?.scale ?? [20, 20, 20];
}
// ─────────────────────────────────────────────────────────────────────────────
// Remove solid-colour backgrounds via corner flood-fill
// ─────────────────────────────────────────────────────────────────────────────
function removeSolidBackground(ctx, w, h) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  const px = (x, y) => { const i = (y * w + x) * 4; return [d[i], d[i+1], d[i+2], d[i+3]]; };
  const corners = [[0,0],[w-1,0],[0,h-1],[w-1,h-1]].map(([x,y]) => px(x,y));
  if (corners.some(c => c[3] < 200)) return false;
  const [r0,g0,b0] = corners[0];
  const tol = 20;
  if (!corners.every(([r,g,b]) => Math.abs(r-r0)<=tol && Math.abs(g-g0)<=tol && Math.abs(b-b0)<=tol)) return false;
  const visited = new Uint8Array(w * h);
  const stack = [[0,0],[w-1,0],[0,h-1],[w-1,h-1]];
  while (stack.length) {
    const [x,y] = stack.pop();
    if (x<0||y<0||x>=w||y>=h) continue;
    const idx = y*w+x;
    if (visited[idx]) continue;
    visited[idx] = 1;
    const i = idx*4;
    if (d[i+3]<150||Math.abs(d[i]-r0)>tol||Math.abs(d[i+1]-g0)>tol||Math.abs(d[i+2]-b0)>tol) continue;
    d[i+3] = 0;
    stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
  }
  ctx.putImageData(imageData, 0, 0);
  return true;
}

function getOpaqueBBox(data, width, height) {
  let minX=width, minY=height, maxX=0, maxY=0, found=false;
  for (let y=0; y<height; y++) {
    for (let x=0; x<width; x++) {
      if (data[(y*width+x)*4+3] > ALPHA_THRESHOLD) {
        if (x<minX) minX=x; if (y<minY) minY=y;
        if (x>maxX) maxX=x; if (y>maxY) maxY=y;
        found=true;
      }
    }
  }
  return found ? {minX,minY,maxX,maxY} : null;
}

function buildMask(data, width, height) {
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    mask[i] = data[i*4+3] > ALPHA_THRESHOLD ? 1 : 0;
  }
  return mask;
}

function floodFillRegions(mask, width, height) {
  const visited = new Int32Array(width * height).fill(-1);
  const regions = [];
  let id = 0;
  for (let sy = 0; sy < height; sy++) {
    for (let sx = 0; sx < width; sx++) {
      const si = sy*width+sx;
      if (mask[si] !== 1 || visited[si] !== -1) continue;
      const pixels = [];
      const queue = [si];
      visited[si] = id;
      while (queue.length) {
        const idx = queue.pop();
        pixels.push(idx);
        const x = idx % width, y = (idx / width)|0;
        for (const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]) {
          if (nx<0||ny<0||nx>=width||ny>=height) continue;
          const ni = ny*width+nx;
          if (mask[ni]===1 && visited[ni]===-1) { visited[ni]=id; queue.push(ni); }
        }
      }
      regions.push({ id, pixels });
      id++;
    }
  }
  return regions;
}

function traceBoundary(pixels, width, height) {
  if (!pixels.length) return [];
  const set = new Set(pixels);
  let start = pixels[0];
  for (const p of pixels) { if (p < start) start = p; }
  const startX = start % width, startY = (start / width)|0;
  const dirs = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
  const boundary = [];
  let cx = startX, cy = startY;
  let prevDir = 6;
  const maxSteps = pixels.length * 4 + 10;
  let steps = 0;
  do {
    boundary.push({x:cx, y:cy});
    let found = false;
    for (let d = 0; d < 8; d++) {
      const tryDir = (prevDir + 6 + d) % 8;
      const [dx,dy] = dirs[tryDir];
      const nx = cx+dx, ny = cy+dy;
      if (nx>=0&&ny>=0&&nx<width&&ny<height && set.has(ny*width+nx)) {
        cx=nx; cy=ny; prevDir=tryDir; found=true; break;
      }
    }
    if (!found) break;
    steps++;
  } while ((cx!==startX||cy!==startY||boundary.length<3) && steps<maxSteps);
  const simplified = [];
  for (let i=0; i<boundary.length; i+=MARCH_STEP) simplified.push(boundary[i]);
  return simplified.length >= 3 ? simplified : boundary.filter((_,i)=>i%MARCH_STEP===0);
}

function markBackgroundFromBorder(mask, width, height) {
  const bg = new Uint8Array(width * height);
  const stack = [];
  for (let x = 0; x < width; x++) {
    if (!mask[x])                        { bg[x] = 1;                        stack.push(x); }
    const bot = (height-1)*width + x;
    if (!mask[bot])                      { bg[bot] = 1;                      stack.push(bot); }
  }
  for (let y = 0; y < height; y++) {
    const left = y*width, right = y*width + width - 1;
    if (!mask[left])  { bg[left]  = 1; stack.push(left);  }
    if (!mask[right]) { bg[right] = 1; stack.push(right); }
  }
  while (stack.length) {
    const idx = stack.pop();
    const x = idx % width, y = (idx / width)|0;
    for (const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]) {
      if (nx<0||ny<0||nx>=width||ny>=height) continue;
      const ni = ny*width+nx;
      if (!mask[ni] && !bg[ni]) { bg[ni] = 1; stack.push(ni); }
    }
  }
  return bg;
}

function extractContours(imageData) {
  const { data, width, height } = imageData;
  const mask = buildMask(data, width, height);
  const opaqueRegions = floodFillRegions(mask, width, height);
  opaqueRegions.sort((a,b) => b.pixels.length - a.pixels.length);
  const outerRegion = opaqueRegions[0];
  if (!outerRegion) return { outer: null, holes: [] };
  const outerPts = traceBoundary(outerRegion.pixels, width, height);
  const bg = markBackgroundFromBorder(mask, width, height);
  const holeMask = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    if (!mask[i] && !bg[i]) holeMask[i] = 1;
  }
  const holeRegions = floodFillRegions(holeMask, width, height);
  const holes = [];
  for (const hr of holeRegions) {
    if (hr.pixels.length < MIN_HOLE_AREA) continue;
    const pts = traceBoundary(hr.pixels, width, height);
    if (pts.length >= 3) holes.push(pts);
  }
  return { outer: outerPts, holes };
}

function pxToWorld(pts, texW, texH, W, H) {
  return pts.map(({x,y}) => ({
    wx: (x / texW - 0.5) * W,
    wy: (0.5 - y / texH) * H,
  }));
}

function centroid(worldPts) {
  const n = worldPts.length;
  let cx=0, cy=0;
  for (const {wx,wy} of worldPts) { cx+=wx; cy+=wy; }
  return { cx: cx/n, cy: cy/n };
}

function makeBodyGeo(outerWorld, holesWorld, offsetX, offsetY, charmDepth) {
  const shape = new THREE.Shape();
  outerWorld.forEach(({wx,wy}, i) => {
    const x = wx - offsetX, y = wy - offsetY;
    if (i===0) shape.moveTo(x, y); else shape.lineTo(x, y);
  });
  shape.closePath();
  for (const holePts of holesWorld) {
    const path = new THREE.Path();
    holePts.forEach(({wx,wy}, i) => {
      const x = wx - offsetX, y = wy - offsetY;
      if (i===0) path.moveTo(x, y); else path.lineTo(x, y);
    });
    path.closePath();
    shape.holes.push(path);
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: charmDepth, bevelEnabled: false, curveSegments: 16, steps: 1,
  });
  geo.translate(0, 0, -charmDepth / 2);
  return geo;
}

// ─── useCharmAssets: now accepts charmHeight + charmDepth ─────────────────────
function useCharmAssets(imagePath, charmHeight = DEFAULT_CHARM_HEIGHT, charmDepth = DEFAULT_CHARM_DEPTH, bodyColor = '#CCCCCC') {
  const [assets, setAssets] = useState(null);

  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (!alive) return;
      const full = document.createElement('canvas');
      full.width  = img.naturalWidth  || img.width;
      full.height = img.naturalHeight || img.height;
      const fullCtx = full.getContext('2d');
      fullCtx.drawImage(img, 0, 0);
      try { removeSolidBackground(fullCtx, full.width, full.height); } catch(e) {}

      let texCanvas = full, texW = full.width, texH = full.height;
      try {
        const fullData = fullCtx.getImageData(0, 0, full.width, full.height);
        const bbox = getOpaqueBBox(fullData.data, full.width, full.height);
        if (bbox) {
          const cw = bbox.maxX - bbox.minX + 1, ch = bbox.maxY - bbox.minY + 1;
          const c = document.createElement('canvas');
          c.width = cw; c.height = ch;
          c.getContext('2d').drawImage(full, bbox.minX, bbox.minY, cw, ch, 0, 0, cw, ch);
          texCanvas = c; texW = cw; texH = ch;
        }
      } catch(e) {}

      const aspect = texW / texH;
      const H = charmHeight, W = H * aspect;  // use prop, not constant

      let outerWorld = [
        {wx:-W/2,wy:-H/2},{wx:W/2,wy:-H/2},
        {wx:W/2,wy:H/2},{wx:-W/2,wy:H/2},
      ];
      let holesWorld = [];
      try {
        const croppedData = texCanvas.getContext('2d').getImageData(0, 0, texW, texH);
        const { outer, holes } = extractContours(croppedData);
        if (outer && outer.length >= 3) {
          outerWorld = pxToWorld(outer, texW, texH, W, H);
          holesWorld = holes.map(h => pxToWorld(h, texW, texH, W, H));
        }
      } catch(e) {
        console.warn('ThickImageCharm: contour extraction failed, using rect', e);
      }

      const { cx: offX, cy: offY } = centroid(outerWorld);

      let bodyGeo;
      try {
        bodyGeo = makeBodyGeo(outerWorld, holesWorld, offX, offY, charmDepth); // pass prop
      } catch(e) {
        console.warn('ThickImageCharm: extrude failed, using box', e);
        bodyGeo = new THREE.BoxGeometry(W, H, charmDepth);
      }

      // Same ring-matched metal as every other part (was a Phong material,
      // which ignores the environment map and read dull next to the chain).
      const bodyMat = createRingMetalMaterial(bodyColor, { side: THREE.DoubleSide });

      const faceTex = new THREE.CanvasTexture(texCanvas);
faceTex.colorSpace  = THREE.SRGBColorSpace;
faceTex.flipY       = true;
faceTex.needsUpdate = true;

const backFaceTex = new THREE.CanvasTexture(texCanvas);
backFaceTex.colorSpace = THREE.SRGBColorSpace;
backFaceTex.flipY      = true;
backFaceTex.repeat.set(-1, 1);
backFaceTex.offset.set(1, 0);
backFaceTex.needsUpdate = true;

const faceMat = new THREE.MeshBasicMaterial({
  map: faceTex, transparent: true, alphaTest: 0.05,
  side: THREE.FrontSide, depthWrite: false,
  // Skip ACES tone mapping so the charm artwork keeps its original colours.
  toneMapped: false,
});

const backFaceMat = new THREE.MeshBasicMaterial({
  map: backFaceTex, transparent: true, alphaTest: 0.05,
  side: THREE.FrontSide, depthWrite: false,
  // Skip ACES tone mapping so the charm artwork keeps its original colours.
  toneMapped: false,
});

// ← ONLY ONE setAssets call
setAssets({ bodyGeo, bodyMat, faceMat, backFaceMat, faceTex, backFaceTex, W, H, offX, offY });
    };

    img.onerror = () => console.error('ThickImageCharm: failed to load', imagePath);
    img.src = imagePath;

    return () => {
  alive = false;
  setAssets(prev => {
    if (prev) {
      prev.bodyGeo?.dispose(); prev.bodyMat?.dispose();
      prev.faceTex?.dispose(); prev.faceMat?.dispose();
      prev.backFaceTex?.dispose(); prev.backFaceMat?.dispose(); // add this
    }
    return null;
  });
};
  }, [imagePath, charmHeight, charmDepth, bodyColor]); // re-run when sizes change

  return assets;
}

// ─── BAIL_MAT (module-level, shared) ─────────────────────────────────────────
const BAIL_MAT = createRingMetalMaterial('#C0C0C0');

// Initials are loose glyphs, so add the pendant-style washer before linking
// them back to the bracelet with the existing bail-ring hardware.
const INITIAL_WASHER_OUTER_R = 0.025;
const INITIAL_WASHER_INNER_R = 0.020;
const INITIAL_WASHER_DEPTH = 0.010;
const INITIAL_BAIL_R = 0.030;
const INITIAL_BAIL_TUBE = 0.004;
const INITIAL_CHARM_DROP_Y = 0.0;
// The initial assembly is rotated around the bracelet, so local Z is the
// visible up/down direction for independently positioning these two pieces.
const INITIAL_LETTER_OFFSET_Z = -0.025;
const INITIAL_WASHER_Z_OFFSET = 0.005;
// Moves the washer + bail together relative to the letter, without moving
// the outer InitialCharm group. Positive/negative values change their Y gap.
const INITIAL_HARDWARE_TO_LETTER_Y_GAP = 0.01;
const INITIAL_BAIL_Z_NUDGE = -0.008;

const INITIAL_WASHER_GEOMETRY = (() => {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, INITIAL_WASHER_OUTER_R, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, INITIAL_WASHER_INNER_R, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return new THREE.ExtrudeGeometry(shape, {
    depth: INITIAL_WASHER_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0015,
    bevelSegments: 12,
  });
})();

// ─── CharmBail: now accepts ringR + ringTube props ────────────────────────────
const CharmBail = ({ topY, offsetX = 0, offsetZ = 0, ringR = 0.04, ringTube = 0.005, metalColor = '#C0C0C0' }) => {
  const ringY = topY + ringR * 0.3;
  return (
    <group>
      <mesh
        position={[offsetX, ringY, offsetZ]}
        rotation={[Math.PI / 2, Math.PI / 2, 0]}
        castShadow
      >
        <torusGeometry args={[ringR, ringTube, 16, 48]} />
        <meshPhysicalMaterial {...ringMetalProps(metalColor)} />
      </mesh>
    </group>
  );
};

// ─── ThickImageCharm: accepts charm size props ────────────────────────────────
const ThickImageCharm = ({
  imagePath,
  position,
  rotation,
  onClick,
  charmHeight  = DEFAULT_CHARM_HEIGHT,
  charmDepth   = DEFAULT_CHARM_DEPTH,
  bailRingR    = 0.04,
  bailRingTube = 0.005,
  metalColor = '#CCCCCC',
}) => {
  const assets = useCharmAssets(imagePath, charmHeight, charmDepth, metalColor);
  if (!assets) return null;
  const { bodyGeo, bodyMat, faceMat, backFaceMat, W, H, offX, offY } = assets;
  const faceZ = charmDepth / 2 + 0.0015;
  const charmTopY = H / 2 - offY;
  return (
    <group position={position} rotation={rotation} onClick={onClick}>
      <mesh geometry={bodyGeo} material={bodyMat} castShadow receiveShadow />
      {/* Front face */}
      <mesh material={faceMat} position={[-offX, -offY, faceZ]}>
        <planeGeometry args={[W, H]} />
      </mesh>

      {/* Back face — flipped 180° on Y so it reads correctly */}
      {/* Back face — rotation flips it to face outward */}
<mesh material={backFaceMat} position={[-offX, -offY, -faceZ]} rotation={[0, Math.PI, 0]}>
  <planeGeometry args={[W, H]} />
</mesh>
      <CharmBail topY={charmTopY} ringR={bailRingR} ringTube={bailRingTube} metalColor={metalColor} />
    </group>
  );
};
// ─── Module-level GLTF cache: parse each path only once, ever ────────────────
const gltfSceneCache = new Map();
let sharedGLTFLoader = null;

function getSharedGLTFLoader() {
  if (!sharedGLTFLoader) {
    sharedGLTFLoader = new GLTFLoader();
    if (typeof window !== 'undefined') {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/gltf/');
      sharedGLTFLoader.setDRACOLoader(dracoLoader);
    }
  }
  return sharedGLTFLoader;
}

function loadGLTFScene(path) {
  if (!gltfSceneCache.has(path)) {
    const promise = new Promise((resolve, reject) => {
      getSharedGLTFLoader().load(withModelVersion(path), gltf => resolve(gltf.scene), undefined, reject);
    });
    // Don't cache a failure forever: drop it so a later, real request for the
    // same model can try again (e.g. after a flaky network response).
    promise.catch(() => {
      if (gltfSceneCache.get(path) === promise) gltfSceneCache.delete(path);
    });
    gltfSceneCache.set(path, promise);
  }
  return gltfSceneCache.get(path);
}

// Warm the cache in the background. A preload is best-effort by definition, so
// a failure here must never surface: without this catch a missing model file
// becomes an unhandled promise rejection and Next.js throws up its error
// overlay over a perfectly working page.
function preloadModels(paths = []) {
  paths.forEach((path) => {
    loadGLTFScene(path).catch((error) => {
      console.warn(`[bracelet] preload skipped for ${path}:`, error?.message || error);
    });
  });
}

// ─── GLBModel ─────────────────────────────────────────────────────────────────
const GLBModel = ({ path, position, rotation, scale, materialProps, texture, onClick, useOriginalMaterial = false }) => {
  const [model, setModel]             = useState(null);
  const [currentPath, setCurrentPath] = useState(null);
  const { setLoader }                 = useContext(BraceletContext);

  useEffect(() => {
    let cancelled = false;
    if (!gltfSceneCache.has(path)) setLoader(true);

    loadGLTFScene(path)
      .then(scene => {
        if (cancelled) return;
        const obj = scene.clone(true);
        obj.traverse(child => {
          if (child.isMesh) {
            child.castShadow = child.receiveShadow = true;
            if (!useOriginalMaterial) {
              child.material = new THREE.MeshPhysicalMaterial({
                ...materialProps,
                ...RING_METAL,
                color: MESHES.includes(child.name) ? child.material.color : new THREE.Color(toRingMetalColor(materialProps.color)),
                // No texture map: the ring's metal is a clean polished colour,
                // and a JPG multiplied into it only greys the reflections.
                map: null,
              });
            }
          }
        });
        setModel(obj);
        setCurrentPath(path);
      })
      .catch(err => {
        console.error(`Failed to load ${path}`, err);
        gltfSceneCache.delete(path);
      })
      .finally(() => { if (!cancelled) setLoader(false); });

    return () => { cancelled = true; };
  // `path` changing also changes its authored wrapper transform.  Do not put
  // the inline fallback position/rotation arrays from the JSX call site here:
  // they are recreated on every parent render and would otherwise reload the
  // GLB continuously.
  }, [path, materialProps, texture, setLoader, useOriginalMaterial]);

  if (!model || currentPath !== path) return null;
  return <primitive object={model} position={position} rotation={rotation} scale={scale} onClick={onClick} />;
};

// ─── GLBCharmModel ────────────────────────────────────────────────────────────
// Wraps a GLB charm the same way ThickImageCharm wraps a 2D charm: the
// outer <group> sits at the orbit `position`/`rotation` (the hook/hang
// point), and the model itself is shifted internally so that its own
// hook point — approximated as the top-center of its bounding box —
// lands exactly at that group's local origin. Without this shift, a
// GLB's arbitrary internal origin (wherever the artist modeled it around)
// gets placed at `position` directly, and any offset between that origin
// and the visual hook gets amplified by `scale`, causing charms to drift
// far from the chain (worse the larger the scale factor).
// ─── Gemstone refraction ────────────────────────────────────────────────────
// Birthstones and diamonds are rendered the same way the necklace does it: the
// stone mesh is pulled out of the GLB and drawn through drei's
// MeshRefractionMaterial, a real ray-marched refraction shader, instead of an
// approximation with MeshPhysicalMaterial's transmission. That is what gives
// the facets their cut and fire - light actually bounces inside the stone and
// splits into colour at the edges.
// Ring gem system: studio EXR + ring refraction params (shared/gemMaterial.js).
// Old: '/3532532.jpg', ior 2.42, bounces 3, aberration 0.02, fresnel 1.5.
const GEMSTONE_REFRACTION_PARAMS = GEM_REFRACTION_PARAMS;

const isGemMesh = (child, gemstoneColor) => Boolean(gemstoneColor) &&
  /all-diamonds|material_1|gltf_2|gem|stone|diamond/i.test(`${child.name} ${child.material?.name || ''}`);

const glbAnchorOffsetCache = new Map();

// anchorMode "top"    — hook/bail assumed at top-center of the model (same
//                        convention as ThickImageCharm's charmTopY): the charm
//                        HANGS from the placement point.
// anchorMode "center" — the model's own centre goes on the placement point, so
//                        it STRADDLES the chain instead of dangling off it.
//                        This is what a bezel-set stone threaded onto a chain
//                        needs; with "top" the stone hangs a full radius
//                        outside the chain line.
function getAnchorOffset(path, obj, anchorMode = 'top') {
  const cacheKey = `${path}|${anchorMode}`;
  if (glbAnchorOffsetCache.has(cacheKey)) return glbAnchorOffsetCache.get(cacheKey);
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const center = box.getCenter(new THREE.Vector3());
  const offset = {
    x: center.x,
    y: anchorMode === 'center' ? center.y : box.max.y,
    z: center.z,
  };
  glbAnchorOffsetCache.set(cacheKey, offset);
  return offset;
}

const GLBCharmModel = ({ path, position, rotation, scale, onClick, bodyColor, gemstoneColor, modelRotation = [0, 0, 0], anchorMode = 'top' }) => {
  const [model, setModel]               = useState(null);
  const [currentPath, setCurrentPath]   = useState(null);
  const [anchorOffset, setAnchorOffset] = useState(null);
  const [gemGeometry, setGemGeometry]   = useState(null);
  const envTexture = useGemEnvTexture();
  const { setLoader } = useContext(BraceletContext);

  useEffect(() => {
    let cancelled = false;
    if (!gltfSceneCache.has(path)) setLoader(true);

    loadGLTFScene(path)
      .then(scene => {
        if (cancelled) return;
        const obj = scene.clone(true);
        obj.updateMatrixWorld(true);
        // r3f overwrites the root's own transform with the props we pass the
        // <primitive>, so the gem geometry has to be baked into ROOT-LOCAL
        // space, not world space - otherwise the file's own root transform
        // gets applied twice and the stone flies off the charm.
        const rootInverse = new THREE.Matrix4().copy(obj.matrixWorld).invert();

        let foundGemGeometry = null;
        const gemMeshes = [];

        obj.traverse(child => {
          if (!child.isMesh) return;
          child.castShadow = child.receiveShadow = true;
          if (!bodyColor && !gemstoneColor) return;

          if (isGemMesh(child, gemstoneColor)) {
            // Lift the stone out of the model so it can be drawn separately
            // through MeshRefractionMaterial. toNonIndexed splits the shared
            // vertices so every triangle keeps its own normal - that is what
            // makes the crown and pavilion read as real cut facets instead of
            // a smooth coloured dome.
            const geometry = child.geometry.clone().toNonIndexed();
            geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(rootInverse, child.matrixWorld));
            geometry.computeVertexNormals();
            foundGemGeometry = geometry;
            gemMeshes.push(child);
            return;
          }

          child.material = createRingMetalMaterial(bodyColor || '#DBDBDB');
        });

        // Measure the anchor while the stone is still visible, then hide it -
        // otherwise the charm's hang point shifts once the gem is removed.
        const anchor = getAnchorOffset(path, obj, anchorMode);
        gemMeshes.forEach(mesh => { mesh.visible = false; });

        setAnchorOffset(anchor);
        setGemGeometry(foundGemGeometry);
        setModel(obj);
        setCurrentPath(path);
      })
      .catch(err => console.error(`Failed to load ${path}`, err))
      .finally(() => { if (!cancelled) setLoader(false); });

    return () => { cancelled = true; };
  }, [path, setLoader, bodyColor, gemstoneColor, anchorMode]);

  if (!model || currentPath !== path || !anchorOffset) return null;

  // The translation itself must be scaled: this <primitive> is scaled
  // directly, so its own position offset must be pre-multiplied by that
  // same scale to land at the correct point once scaling is applied.
  const innerPosition = [
    -anchorOffset.x * scale[0],
    -anchorOffset.y * scale[1],
    -anchorOffset.z * scale[2],
  ];

  return (
    <group position={position} rotation={rotation} onClick={onClick}>
      <primitive object={model} position={innerPosition} rotation={modelRotation} scale={scale} />

      {gemGeometry && (
        <mesh
          key={`gem_${path}_${gemstoneColor}`}
          geometry={gemGeometry}
          position={innerPosition}
          rotation={modelRotation}
          scale={scale}
          castShadow
        >
          {envTexture ? (
            <MeshRefractionMaterial
              envMap={envTexture}
              color={new THREE.Color(gemstoneColor)}
              ior={GEMSTONE_REFRACTION_PARAMS.ior}
              bounces={GEMSTONE_REFRACTION_PARAMS.bounces}
              aberrationStrength={GEMSTONE_REFRACTION_PARAMS.aberrationStrength}
              fresnel={GEMSTONE_REFRACTION_PARAMS.fresnel}
              toneMapped={false}
              transparent
              fastChroma
            />
          ) : (
            // Stand-in until the env map arrives, so the stone is never a hole.
            <meshPhysicalMaterial
              color={gemstoneColor}
              metalness={0}
              roughness={0.025}
              transmission={0.72}
              thickness={0.35}
              ior={2.417}
              flatShading
              clearcoat={1}
              clearcoatRoughness={0.015}
              envMapIntensity={3}
            />
          )}
        </mesh>
      )}
    </group>
  );
};

// Rough half-width of an initial glyph (size 0.11) - only used for the first
// frame, before the real letter has been measured.
const INITIAL_TYPICAL_HALF_WIDTH = 0.038;

// ─── Washer seating for twin-peak letters ───────────────────────────────────
// See shared/initialCharmHardware.js. Bracelet scale: letter ~0.11 tall.
const INITIAL_WASHER_SEAT = { washerOuterR: INITIAL_WASHER_OUTER_R, overlap: 0.012, maxDrop: 0.035 };

const InitialCharm = ({ charm, position, rotation, onClick }) => {
  const [textMesh, setTextMesh] = useState(null);
  const [attachmentPoint, setAttachmentPoint] = useState(null);

  // Each character has a different width and cap height. Measure the actual
  // Text3D geometry so the washer always contacts the top-center of the glyph.
  useLayoutEffect(() => {
    const geometry = textMesh?.geometry;
    if (!geometry) return;

    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox;
    if (!bounds) return;

    const x = (bounds.min.x + bounds.max.x) / 2;
    setAttachmentPoint({
      x,
      y: bounds.max.y,
      drop: isTwinPeakInitial(charm.letter)
        ? getInitialWasherDrop(geometry, x, bounds.max.y + INITIAL_HARDWARE_TO_LETTER_Y_GAP, INITIAL_WASHER_SEAT) * INITIAL_WASHER_DROP_FACTOR
        : 0,
    });
  }, [textMesh, charm.letter]);

  const washerY = attachmentPoint
    ? attachmentPoint.y + INITIAL_HARDWARE_TO_LETTER_Y_GAP - attachmentPoint.drop
    : null;
  const washerZ = -INITIAL_WASHER_DEPTH / 2
    + INITIAL_WASHER_Z_OFFSET;
  const metalColor = charm.metalColor || '#DBDBDB';
  // Text3D grows from its LEFT edge, so the letter's centre - where the washer
  // and bail sit - landed half a letter to the right of the charm's hang point,
  // and the bail missed the link a 2D charm's bail threads (2D charms are
  // centred on it). Shift the whole assembly back so the bail sits exactly on
  // the hang point. Until the glyph is measured, use a typical half-width.
  const centerShiftX = -(attachmentPoint?.x ?? INITIAL_TYPICAL_HALF_WIDTH);

  return (
    <group
      position={[position[0], position[1] - INITIAL_CHARM_DROP_Y, position[2]]}
      rotation={rotation}
      onClick={onClick}
    >
      <group position={[centerShiftX, 0, 0]}>
      <Suspense fallback={null}>
        <Text3D ref={setTextMesh} position={[0, 0, INITIAL_LETTER_OFFSET_Z]} font={initialFontUrl} size={0.11} height={0.028} curveSegments={16} bevelEnabled bevelThickness={0.004} bevelSize={0.002}>
          {(charm.letter || 'A').toUpperCase()}
          <meshPhysicalMaterial {...ringMetalProps(metalColor)} />
        </Text3D>
      </Suspense>

      {attachmentPoint && (
        <>
          <mesh
            geometry={INITIAL_WASHER_GEOMETRY}
            position={[attachmentPoint.x, washerY, washerZ]}
            rotation={[0, Math.PI, 0]}
            castShadow
          >
            <meshPhysicalMaterial {...ringMetalProps(metalColor)} />
          </mesh>
          <CharmBail
            topY={washerY + INITIAL_BAIL_R * 0.7}
            offsetX={attachmentPoint.x}
            offsetZ={washerZ + INITIAL_BAIL_Z_NUDGE}
            ringR={INITIAL_BAIL_R}
            ringTube={INITIAL_BAIL_TUBE}
            metalColor={metalColor}
          />
        </>
      )}
      </group>
    </group>
  );
};

function CameraResetter({ resetObj }) {
  const { camera } = useThree();
  useEffect(() => {
    if (resetObj && camera) {
      camera.position.set(...resetObj.position);
      camera.updateProjectionMatrix();
    }
  }, [resetObj]);
  return null;
}

const AxesLines = () => { const r = useRef(); return <group ref={r} />; };

// ─── Default camera per bracelet style ──────────────────────────────────────
// The GLB chains are closed flat loops, so they're shot from almost straight
// above. The name chain's plate STANDS UPRIGHT on the ring (NAME_CHAIN_CONFIG
// .plateTilt), which is edge-on and unreadable from directly overhead - so it
// gets a raised front-on angle instead, roughly 30 degrees above the plane,
// which is the standard product-shot view for a name bracelet.
// OrbitControls clamps the distance and keeps the direction, so only the angle
// these encode really matters.
// Desktop: the orbit target is the ring's centre (y 0.6) and every preset sits
// DESKTOP_CHAIN_VIEW_DISTANCE from it, at the same angles as before. That
// distance is also OrbitControls' minDistance, so the default framing is the
// largest the chain can ever appear - identical for every chain style.
const DESKTOP_ORBIT_TARGET = [0, 0.6, 0];
const DESKTOP_CHAIN_VIEW_DISTANCE = 1.8;
// Zoom-out limit (desktop): the smallest the chain may appear.
const DESKTOP_CHAIN_MAX_VIEW_DISTANCE = 2.0;
const CAMERA_POSITIONS = {
  flatLay:    { desktop: [0.007, 2.397, 0.1] },
  // GLB bracelet with charms but no name pendant: tilt forward so the
  // front of the ring (where charms cluster) faces the viewer.
  charmsOnly: { desktop: [0, 1.659, 1.456] },
  nameChain:  { desktop: [0, 1.415, 1.605] },
};
// Mobile uses the desktop framing (same target, angles and zoom limits). Both
// pull back when the canvas is too narrow for the chain to fit across it
// (e.g. the ring-style desktop layout's full-height preview):
// below this width/height ratio the distance grows by MOBILE_FIT_ASPECT/aspect.
const MOBILE_FIT_ASPECT = 1.2;
const getMobileFitFactor = (aspect) =>
  (aspect > 0 ? Math.max(1, MOBILE_FIT_ASPECT / aspect) : 1);
const scaleFromTarget = (position, target, factor) =>
  position.map((v, i) => target[i] + (v - target[i]) * factor);

// Reports the canvas width/height ratio up to Bracelet (lives inside <Canvas>).
function CanvasAspectReporter({ onChange }) {
  const size = useThree((state) => state.size);
  useEffect(() => {
    if (size.width > 0 && size.height > 0) onChange(size.width / size.height);
  }, [size.width, size.height, onChange]);
  return null;
}

// ─── CharmPopIn: pop-in + wobble mount animation for charms ────────────────
// This component now OWNS the charm's position/rotation (pass them in as
// props instead of giving them to the inner charm component). That way the
// scale/wobble animate around the charm's own local origin — i.e. right
// where it sits on the bracelet — instead of swinging around the bracelet's
// world-space center.
//
// It also replays whenever `animKey` changes, not just on mount. `animKey`
// should be a signature that changes both when a brand-new charm is added
// AND when an existing slot's charm is swapped for a different one, so
// replacing a charm re-triggers the pop/wobble even though the slot index
// (and therefore the React `key`) stayed the same.
function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

const CHARM_POP_DURATION = 0.55; // seconds
const CHARM_WOBBLE_AMOUNT = 0.35; // radians, decays over the animation

function charmSignature(charm) {
  return [
    charm?.id ?? '',
    charm?.type ?? '',
    charm?.path ?? '',
    charm?.letter ?? '',
    charm?.metalColor ?? '',
    charm?.bodyColor ?? '',
    charm?.gemstoneColor ?? '',
  ].join('|');
}

const CharmPopIn = ({ children, position = [0, 0, 0], rotation = [0, 0, 0], animKey, wobble: wobbleEnabled = true }) => {
  const ref = useRef();
  const startTime = useRef(null);
  const doneRef = useRef(true); // stays true until an animKey change kicks off a run

  // Reset (and replay) the animation any time animKey changes — covers both
  // "new charm mounted here" and "charm at this slot got swapped".
  useLayoutEffect(() => {
    startTime.current = null;
    doneRef.current = false;
    if (ref.current) ref.current.scale.setScalar(0.0001);
  }, [animKey]);

  useFrame((state) => {
    if (!ref.current) return;
    if (doneRef.current) {
      // Idle: just keep the group locked to the latest position/rotation
      // (these can shift as siblings are added/removed and slots reflow).
      return;
    }
    if (startTime.current === null) startTime.current = state.clock.elapsedTime;

    const t = Math.min((state.clock.elapsedTime - startTime.current) / CHARM_POP_DURATION, 1);
    const s = Math.max(easeOutBack(t), 0.0001);
    // Hanging charms (2D/3D/initial) skip the wobble - they swing down on
    // their chain instead (see HangFromChain).
    const wobble = wobbleEnabled ? Math.sin(t * Math.PI * 5) * (1 - t) * CHARM_WOBBLE_AMOUNT : 0;

    ref.current.scale.setScalar(s);
    // Wobble around this charm's OWN local Y axis, layered on top of its
    // base rotation — since the group itself is already positioned at the
    // charm's spot, this swings the charm in place, not around the origin.
    ref.current.rotation.set(rotation[0], rotation[1] + wobble, rotation[2]);

    if (t >= 1) {
      ref.current.scale.setScalar(1);
      ref.current.rotation.set(rotation[0], rotation[1], rotation[2]);
      doneRef.current = true;
    }
  });

  return (
    <group ref={ref} position={position} rotation={rotation}>
      {children}
    </group>
  );
};

// ─── HangFromChain: tilt a hanging charm downward ───────────────────────────
// Hanging charms (2D, 3D, initials) are laid out flat in the bracelet's plane,
// pointing outward. This swings them down about the chain line they hang from,
// so they read as dangling. In the placement frame local +Y points inward (to
// the chain), -Y outward and +Z up, so the chain sits at local (0, hinge, 0)
// and a +X rotation tips the outward end down.
//
// When a charm is added (or swapped - `animKey` changes) it appears flat, the
// way charms used to sit, then drops on its chain: a damped swing that
// overshoots a little past the rest angle and settles at CHARM_HANG_ANGLE.
const CHARM_HANG_ANGLE = Math.PI / 4;  // 45deg, the resting tilt
const HANG_FALL_DELAY = 0.3;           // s - let the pop-in land flat first
const HANG_FALL_DURATION = 2;          // s - swing length before snapping to rest
const HANG_DAMPING = 3;                // how fast the swing dies out
const HANG_SWING = 6;                  // swing speed (rad/s); overshoots to ~54deg

function hangAngleAt(t) {
  if (t <= 0) return 0;
  if (t >= HANG_FALL_DURATION) return CHARM_HANG_ANGLE;
  return CHARM_HANG_ANGLE * (1 - Math.exp(-HANG_DAMPING * t) * Math.cos(HANG_SWING * t));
}

const HangFromChain = ({ hinge = 0, animKey, children }) => {
  const ref = useRef();
  const startTime = useRef(null);
  const doneRef = useRef(false);

  // Replays on every new/swapped charm: back to flat, then fall again.
  useLayoutEffect(() => {
    startTime.current = null;
    doneRef.current = false;
    if (ref.current) ref.current.rotation.x = 0;
  }, [animKey]);

  useFrame((state) => {
    if (doneRef.current || !ref.current) return;
    if (startTime.current === null) startTime.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - startTime.current - HANG_FALL_DELAY;
    ref.current.rotation.x = hangAngleAt(t);
    if (t >= HANG_FALL_DURATION) doneRef.current = true;
  });

  return (
    <group ref={ref} position={[0, hinge, 0]}>
      <group position={[0, -hinge, 0]}>{children}</group>
    </group>
  );
};

// ─── Bracelet ─────────────────────────────────────────────────────────────────
const Bracelet = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [canvasAspect, setCanvasAspect] = useState(0);
  // Rounded so tiny resizes don't keep re-framing the camera.
  const mobileFitFactor = Math.round(getMobileFitFactor(canvasAspect) * 20) / 20;

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const updateIsMobile = () => setIsMobile(media.matches);
    updateIsMobile();
    media.addEventListener('change', updateIsMobile);
    return () => media.removeEventListener('change', updateIsMobile);
  }, []);
  const {
    braceletPath, charms, setCharms,
    namePendant,
    materialPropsBracelet, materialProps, texture,
    pendantMetalHex,
    setHighlightedIndex, highlightedIndex,
    setSelectedIndex, cameraView, setCameraView,
    capture, resetObj, setResetObj, loader,
  } = useContext(BraceletContext);

  // Nothing is drawn until the studio HDR has resolved. A metal shades entirely
  // from its environment, so a frame rendered before then is black - which is
  // the colour change seen on load. Gated on the environment ALONE, not on the
  // model too: the chain renders nothing until its GLB arrives anyway, and
  // tying the gate to the loader flag would leave the canvas blank for good if
  // that flag ever failed to clear.
  const [envLoaded, setEnvLoaded] = useState(false);
  const handleEnvReady = useCallback(() => setEnvLoaded(true), []);

  // Safety net. The notifier only mounts once its Suspense boundary resolves,
  // so anything that stops the HDR resolving - a slow network, a cached 404,
  // an error swallowed by the boundary - would leave the piece hidden for good.
  // A blank canvas is a far worse failure than the colour flash this gate
  // exists to prevent, so past this deadline the scene shows regardless.
  useEffect(() => {
    if (envLoaded) return undefined;
    const timer = setTimeout(() => setEnvLoaded(true), ENV_REVEAL_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [envLoaded]);

  const isSceneReady = envLoaded;


  const { view360 }                      = useContext(View360Context);
  const { share, setShare, setShareUrl } = useContext(ShareContext);
  const [parentUrl, setParentUrl]        = useState(null);

  // Derive charm sizes from the currently selected bracelet
  const charmSizeCfg = getCharmSizeConfig(braceletPath);

  // The name chains have no GLB: their links, plate and washers are generated
  // in NameChain.jsx, so every model-loading path below has to skip them.
  const isNameChain = isGeneratedNameChain(braceletPath);

  // Published upward by NameChainBracelet once it has measured the name, so
  // charms can be spread along whatever arc the chain actually covers.
  const [nameChainGeom, setNameChainGeom] = useState({ gapHalfAngle: 0, halfWidth: 0, hasName: false });

  // Swap the default camera angle with the style (see CAMERA_POSITIONS).
  // - Name chain (generated): front-on nameChain view so the name plate is readable.
  // - GLB bracelet with charms (no name pendant): charmsOnly view so charms
  //   placed at the front of the ring face the viewer, not the back.
  // - GLB bracelet with no charms: pure flatLay top-down view.
  const hasCharms = charms.filter(Boolean).length > 0;
  const hasNamePendant = Boolean(namePendant?.text?.trim());
  useEffect(() => {
    let preset;
    if (isNameChain) {
      preset = CAMERA_POSITIONS.nameChain;
    } else if (hasCharms && !hasNamePendant) {
      preset = CAMERA_POSITIONS.charmsOnly;
    } else {
      preset = CAMERA_POSITIONS.flatLay;
    }
    setResetObj((prev) => ({
      ...prev,
      position: scaleFromTarget(preset.desktop, DESKTOP_ORBIT_TARGET, mobileFitFactor),
    }));
  }, [isNameChain, hasCharms, hasNamePendant, isMobile, mobileFitFactor, setResetObj]);

// Preload the other bracelet models, but only AFTER the currently
// selected/default bracelet has actually finished loading + rendering.
useEffect(() => {
  if (isNameChain) return undefined;
  let cancelled = false;

  // loadGLTFScene is idempotent — if GLBModel already started loading
  // `braceletPath`, this just piggybacks on that same cached promise.
  loadGLTFScene(braceletPath)
    .then(() => {
      if (cancelled) return;
      // Preload from BRACELET_STYLES, the list of models that actually ship.
      // CHARM_SIZE_CONFIG is a SIZING table, not a model list - it still holds
      // tuning for bracelets that have since been dropped from BRACELET_STYLES and
      // whose .glb files no longer exist, so walking its keys asked the loader
      // for files that 404. Generated chains have no file at all.
      const others = BRACELET_STYLES
        .map(b => b.path)
        .filter(p => p !== braceletPath && !isGeneratedNameChain(p));
      const idle = window.requestIdleCallback || (fn => setTimeout(fn, 200));
      idle(() => { if (!cancelled) preloadModels(others); });
    })
    .catch(() => {}); // main model load errors are already handled/logged in GLBModel

  return () => { cancelled = true; };
}, [braceletPath, isNameChain]);
  useEffect(() => {
    const h = e => { if (e.data?.parentUrl) setParentUrl(e.data.parentUrl); };
    window.addEventListener('message', h);
    return () => window.removeEventListener('message', h);
  }, []);

  useEffect(() => {
    if (!share) return;
    const config = { type: 'bracelet', braceletPath, charms, namePendant, materialPropsBracelet, materialProps, pendantMetalHex, cameraView };
    let encoded;
    try { encoded = Base64.encode(JSON.stringify(config)); } catch { return; }
    const url = parentUrl ? new URL(parentUrl) : new URL(window.location.href);
    url.search = ''; url.searchParams.set('config', encoded);
    const finalUrl = url.toString();
    setShareUrl(finalUrl);
    navigator.clipboard.writeText(finalUrl).catch(console.error);
    setShare(false);
  }, [share, braceletPath, charms, namePendant, materialPropsBracelet, cameraView, parentUrl]);

  const [scale]  = useState(30);
  const groupRef = useRef();
  const orbitRef = useRef();
const [braceletPoints, setBraceletPoints] = useState({});
useEffect(() => {
  if (isNameChain) { setBraceletPoints({}); return undefined; }
  let cancelled = false;
  loadBraceletPoints(braceletPath).then((points) => { if (!cancelled) setBraceletPoints(points); });
  return () => { cancelled = true; };
}, [braceletPath, isNameChain]);
  const currentBraceletSlots = BRACELET_CHARM_POSITIONS[braceletPath]?.[BRACELET_CHARMS[0]?.path]?.length || 0;

const lastDeleteMs = useRef(0);

const deleteCharm = index => {
    // ← these two lines are what's missing
    const now = Date.now();
    if (now - lastDeleteMs.current < 350) return;
    lastDeleteMs.current = now;

    setCharms(charms.filter((_, charmIndex) => charmIndex !== index));
};

  const handlePlaceholderClick = index => {
    setSelectedIndex(index);
    setHighlightedIndex(index === highlightedIndex ? null : index);
  };

  // ─── Per-charm placement, computed once per render ───────────────────────
  // Every placed charm — whatever its kind — shares the SAME pool of 9
  // physical points on the bracelet. If the current bracelet model has no
  // point-1..point-9 locators (older models), each charm falls back to the
  // legacy elliptical orbit placement instead.
  const placedCharms = charms.filter(Boolean);

  const charmRenderData = useMemo(() => {
    return placedCharms.map((charm, i) => {
      const kind = getCharmKind(charm);
      // The generated chain owns its own layout: charms ride the arc that the
      // links actually occupy, which shrinks as the name plate grows.
      if (isNameChain) {
        const placement = getNameChainCharmPlacement(
          i, placedCharms.length, nameChainGeom.gapHalfAngle, getNameChainConfig(braceletPath),
          getNameChainCharmCategory(charm),
        );
        return {
          charm, kind,
          position: placement.position,
          rotation: placement.rotation,
          anchorMode: placement.anchor,
          charmScale: placement.scale,
          hingeOffset: placement.radiusOffset ?? 0,
        };
      }
      const pointPlacement = getPointPlacement(i, placedCharms.length, braceletPath, braceletPoints, kind, scale);
      const placement = pointPlacement
        ?? getOrbitCharmTransform(i, placedCharms.length, getCharmOrbitConfig(braceletPath, kind));
      return {
        charm, kind,
        position: placement.position,
        rotation: placement.rotation,
        anchorMode: 'top',
        charmScale: 1,
        hingeOffset: placement.radiusOffset ?? 0,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charms, braceletPath, braceletPoints, scale, isNameChain, nameChainGeom.gapHalfAngle]);

  return (
    <div style={{ height: '100%', width: '100%', background: '#f8f8f8', position: 'relative' }}>
      <Canvas
        shadows
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          alpha: false,
          shadowMapType: THREE.PCFSoftShadowMap,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: RING_TONE_MAPPING_EXPOSURE,
        }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor('#f8f8f8', 1);
          scene.background = new THREE.Color('#f8f8f8');
        }}
      >
        <CameraResetter resetObj={resetObj} />
        <CanvasAspectReporter onChange={setCanvasAspect} />
        <color attach="background" args={['#f8f8f8']} />

        {/* Lighting + reflections match the ring configurator: its metal3.hdr
            environment (strength calibrated to the ring's on-screen colour, see
            JEWELRY_ENV_INTENSITY) and its light rig (shared/RingLightRig). */}
        <Suspense fallback={null}>
          <Environment
            files={HDR_ENVIRONMENT_URL}
            background={false}
            environmentIntensity={JEWELRY_ENV_INTENSITY}
          />
          <EnvironmentReadyNotifier onReady={handleEnvReady} />
        </Suspense>
        <RingLightRig />

        <SoftShadows frustum={3.75} size={100} near={9.5} samples={17} rings={11} />


        <group ref={groupRef} position={[0, 0, 0]} visible={isSceneReady}>
         {isNameChain ? (
           <NameChainBracelet
             braceletPath={braceletPath}
             namePendant={namePendant}
             materialProps={materialPropsBracelet}
             pendantMaterialProps={materialProps}
             onGeometryChange={setNameChainGeom}
           />
         ) : null
         /* GLB bracelet chain models (BRACELET13/14) removed - no longer used.
           <GLBModel
             path={braceletPath}
             position={BRACELET_CHAIN_POSITIONS[braceletPath]?.position || [-3, 0, 0]}
             rotation={BRACELET_CHAIN_POSITIONS[braceletPath]?.rotation || [0, 0, 0]}
             scale={BRACELET_CHAIN_POSITIONS[braceletPath]?.scale       || [scale, scale, scale]}
             materialProps={materialPropsBracelet}
             texture={texture}
           />
         */}

          {charmRenderData.map(({ charm, kind, position, rotation, anchorMode, charmScale, hingeOffset }, i) => {
            const { path } = charm;

            if (kind === 'initial') {
              return (
                <CharmPopIn key={charm.id ?? i} animKey={charmSignature(charm)} position={position} rotation={rotation} wobble={false}>
                  <HangFromChain hinge={hingeOffset} animKey={charmSignature(charm)}>
                  <group scale={charmScale}>
                    <InitialCharm charm={charm} position={[0, 0, 0]} rotation={[0, 0, 0]} onClick={e => { e.stopPropagation(); deleteCharm(i); }} />
                  </group>
                  </HangFromChain>
                </CharmPopIn>
              );
            }

            // The gem and its bezel are authored on different axes, so this
            // rotation is not a free choice: at [0,0,0] the bezel faces the
            // camera but the stone inside it turns edge-on, which is the thin
            // red slot it showed. +90deg about X is the one value that stands
            // BOTH up, facing out of the plane of the bracelet.
            if (kind === 'gemstone') {
              const isCushionOrPrincess = charm.type === 'cushion' || /cushion|princess/i.test(charm.path || '');
              const gemScale = isCushionOrPrincess ? [0.045, 0.045, 0.045] : [0.04, 0.04, 0.04];
              return (
                <CharmPopIn key={charm.id ?? i} animKey={charmSignature(charm)} position={position} rotation={rotation}>
                  <group scale={charmScale}>
                    {/* +90deg about the chain's tangent (local X) tips the stone's
                        face from pointing up to pointing OUTWARD from the chain
                        (placement frame: local +Z = up, local -Y = outward). */}
                    <GLBCharmModel
                      path={charm.path}
                      position={[0, 0, 0]}
                      rotation={[Math.PI / 2, 0, 0]}
                      scale={gemScale}
                      bodyColor={charm.bodyColor}
                      gemstoneColor={charm.gemstoneColor}
                      modelRotation={[Math.PI / 2, 0, 0]}
                      anchorMode={anchorMode}
                      onClick={e => { e.stopPropagation(); deleteCharm(i); }}
                    />
                  </group>
                </CharmPopIn>
              );
            }

            if (kind === 'image') {
              return (
                <CharmPopIn key={charm.id ?? i} animKey={charmSignature(charm)} position={position} rotation={rotation} wobble={false}>
                  <HangFromChain hinge={hingeOffset} animKey={charmSignature(charm)}>
                  <group scale={charmScale}>
                  <ThickImageCharm
                    imagePath={path}
                    position={[0, 0, 0]}
                    rotation={[0, 0, 0]}
                    onClick={e => { e.stopPropagation(); deleteCharm(i); }}
                    charmHeight={charmSizeCfg.height}
                    charmDepth={getCharmDepth(path, charmSizeCfg.depth)}
                    bailRingR={charmSizeCfg.bailRingR}
                    bailRingTube={charmSizeCfg.bailRingTube}
                    metalColor={charm.metalColor}
                  />
                  </group>
                  </HangFromChain>
                </CharmPopIn>
              );
            }

            // kind === 'glb' (regular 3D charms)
            const glbScale = getGLBCharmScale(braceletPath, path);
            return (
              <CharmPopIn key={charm.id ?? i} animKey={charmSignature(charm)} position={position} rotation={rotation} wobble={false}>
                <HangFromChain hinge={hingeOffset} animKey={charmSignature(charm)}>
                <group scale={charmScale}>
                  <GLBCharmModel
                    path={path}
                    position={[0, 0, 0]}
                    rotation={[0, 0, 0]}
                    scale={glbScale}
                    anchorMode={anchorMode}
                    onClick={e => { e.stopPropagation(); deleteCharm(i); }}
                  />
                </group>
                </HangFromChain>
              </CharmPopIn>
            );
          })}

          {!loader && PLACEHOLDERS_FOR_BRACELET.includes(braceletPath) &&
            Array.from({ length: currentBraceletSlots }).map((_, index) => {
              if (charms[index] != null) return null;
              const position2 = BRACELET_CHARM_POSITIONS[braceletPath]?.[BRACELET_CHARMS[0].path]?.[index]?.position2;
              const scales    = BRACELET_CHARM_POSITIONS[braceletPath]?.[BRACELET_CHARMS[0].path]?.[index]?.scales;
              if (!position2) return null;
              return (
                <group key={`ph-${index}`} position={position2}>
                  <mesh onClick={() => handlePlaceholderClick(index)} castShadow>
                    <sphereGeometry args={scales ?? [0.1, 16, 16]} />
                    <meshStandardMaterial transparent={true} opacity={0} depthWrite={false} />
                  </mesh>
                </group>
              );
            })}

          
        </group>

        <AxesLines />
        <CameraController view={cameraView} setView={setCameraView} />
        {capture && <Capture targetGroup={groupRef} />}
        {/* minDistance is how far IN the shopper can zoom. On desktop it equals
            DESKTOP_CHAIN_VIEW_DISTANCE (measured from the ring centre), so the
            default framing is the max size for every chain. Mobile uses the same
            limits, scaled up only when the canvas is too narrow (see
            getMobileFitFactor). */}
        <OrbitControls
  ref={orbitRef} makeDefault
  minDistance={DESKTOP_CHAIN_VIEW_DISTANCE * mobileFitFactor}
  maxDistance={DESKTOP_CHAIN_MAX_VIEW_DISTANCE * mobileFitFactor}
  autoRotate={view360} autoRotateSpeed={4}
  enablePan={false}
  target={DESKTOP_ORBIT_TARGET}
/>
      </Canvas>
      <FirstLoadGate ready={isSceneReady} />
      <ToastContainer />
    </div>
  );
};

export default Bracelet;
