// ─── Charms ──────────────────────────────────────────────────────────────────
// The charm components themselves, shared by both necklace chain families.
// Where a charm ENDS UP is decided by getNecklaceCharmPlacement, which routes
// to the drape-chain math (DrapeChain.jsx) or the name-pendant chain math
// (NamePendantChain.jsx) depending on the necklace in hand.
import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Text3D, MeshRefractionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { ringMetalProps, createRingMetalMaterial } from '../shared/metalMaterial';
import { isTwinPeakInitial, getInitialWasherDrop, INITIAL_WASHER_DROP_FACTOR } from '../shared/initialCharmHardware';
import {
  CHARMS, NAME_CHAIN_PATHS, NON_NAME_CHAIN_CHARM_LAYOUTS, NAME_CHAR_CONFIG,
} from '../shared/assets';
import {
  initialFontUrl, loadGLBCached,
  CHARM_ALPHA_THRESHOLD, CHARM_MARCH_STEP, CHARM_MIN_HOLE_AREA,
  NECKLACE_CHARM_VERTICAL_CLEARANCE, NECKLACE_CHARM_BAIL_RADIUS, NECKLACE_CHARM_BAIL_TUBE,
  useCharmAddWobble, WasherBail,
} from '../shared/necklaceShared';
import { GEM_REFRACTION_PARAMS, useGemEnvTexture } from '../shared/gemMaterial';
import {
  BRACELET_ELLIPSE_CONFIG, getEllipseCharmTransform, getEllipseSlotOffsets,
  getChainCharmTransform, useChainCharmDropOffset, buildChainLinkTransforms,
} from './DrapeChain';
import {
  CHAIN_ANGLE_CONFIG, getChainAngleCharmTransform, getNamePendantCharmPlacement,
} from './NamePendantChain';

// ─── CHARM SIZE + BAIL TUNING BY NECKLACE ───────────────────────────────────
// Update these values to tune individual models without affecting the others.
// charmScale: scales the charm body and bail together.
// bailRadius/bailTube: outer size and thickness of the bail ring.
// bailOffset: [x, y, z] moves the bail relative to the top-centre of its charm.
const NECKLACE_CHARM_STYLE_BY_BRACELET = {
  '/pc-assets/pendant_models//BRACELET13.glb': {
    charmScale: 0.0006,
    bailRadius: NECKLACE_CHARM_BAIL_RADIUS,
    bailTube: NECKLACE_CHARM_BAIL_TUBE,
    bailOffset: [0, 0.14, 0],
    charmDrop: 0.3,
    initialDrop: 0.3,
    gemstoneExtraDrop: 0,          // ← new
  },
  '/pc-assets/pendant_models//BRACELET14.glb': {
    charmScale: 0.0006,
    bailRadius: NECKLACE_CHARM_BAIL_RADIUS,
    bailTube: NECKLACE_CHARM_BAIL_TUBE,
    bailOffset: [0, 0.09, 0],
    charmDrop: 0.5,
    initialDrop: 0.5,
    gemstoneExtraDrop: -0.2,          // ← new
  },
  '/pc-assets/pendant_models//BRACELET15.glb': {
    charmScale: 1,
    bailRadius: 0.13,
    bailTube: 0.016,
    bailOffset: [0, 0, 0],
    charmDrop: -0.15,
    // Initials hang from a washer, so reserve room for that hardware between
    // the chain and the top of the letter.
    initialDrop: 0.23,
  },
  '/pc-assets/pendant_models//BRACELET16.glb': {
    charmScale: 1,
    bailRadius: 0.13,
    bailTube: 0.016,
    bailOffset: [0, 0, 0],
    charmDrop: -0.15,
    initialDrop: 0.2,
  },
  '/pc-assets/pendant_models//BRACELET17.glb': {
    charmScale: 1,
    bailRadius: 0.13,
    bailTube: 0.016,
    bailOffset: [0, 0, 0],
    charmDrop: -0.15,
    initialDrop: 0.2,
  },
  '/pc-assets/pendant_models//BRACELET18.glb': {
    charmScale: 1,
    bailRadius: 0.13,
    bailTube: 0.016,
    bailOffset: [0, 0, 0],
    charmDrop: -0.15,
    initialDrop: 0.2,
  },
};

const DEFAULT_NECKLACE_CHARM_STYLE = {
  charmScale: 1,
  bailRadius: NECKLACE_CHARM_BAIL_RADIUS,
  bailTube: NECKLACE_CHARM_BAIL_TUBE,
  bailOffset: [0, 0.09, 0],
};

const removeSolidCharmBackground = (context, width, height) => {
  const imageData = context.getImageData(0, 0, width, height), data = imageData.data;
  const read = (x, y) => { const index = (y * width + x) * 4; return [data[index], data[index + 1], data[index + 2], data[index + 3]]; };
  const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]].map(([x, y]) => read(x, y));
  if (corners.some((corner) => corner[3] < 200)) return;
  const [red, green, blue] = corners[0], tolerance = 20;
  if (!corners.every(([nextRed, nextGreen, nextBlue]) => Math.abs(nextRed - red) <= tolerance && Math.abs(nextGreen - green) <= tolerance && Math.abs(nextBlue - blue) <= tolerance)) return;
  const visited = new Uint8Array(width * height), stack = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height || visited[y * width + x]) continue;
    visited[y * width + x] = 1;
    const index = (y * width + x) * 4;
    if (data[index + 3] < 150 || Math.abs(data[index] - red) > tolerance || Math.abs(data[index + 1] - green) > tolerance || Math.abs(data[index + 2] - blue) > tolerance) continue;
    data[index + 3] = 0;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  context.putImageData(imageData, 0, 0);
};

const getOpaqueBBox = (data, width, height) => {
  let minX = width, minY = height, maxX = 0, maxY = 0, found = false;
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    if (data[(y * width + x) * 4 + 3] <= CHARM_ALPHA_THRESHOLD) continue;
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); found = true;
  }
  return found ? { minX, minY, maxX, maxY } : null;
};

const fillRegions = (mask, width, height) => {
  const visited = new Int32Array(width * height).fill(-1), regions = [];
  let id = 0;
  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || visited[start] !== -1) continue;
    const pixels = [], stack = [start]; visited[start] = id;
    while (stack.length) {
      const pixel = stack.pop(); pixels.push(pixel);
      const x = pixel % width, y = (pixel / width) | 0;
      [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].forEach(([nextX, nextY]) => {
        if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) return;
        const next = nextY * width + nextX;
        if (mask[next] && visited[next] === -1) { visited[next] = id; stack.push(next); }
      });
    }
    regions.push(pixels); id += 1;
  }
  return regions;
};

const traceBoundary = (pixels, width, height) => {
  if (!pixels.length) return [];
  const all = new Set(pixels), start = pixels.reduce((minimum, pixel) => Math.min(minimum, pixel), pixels[0]), startX = start % width, startY = (start / width) | 0;
  const directions = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const boundary = []; let x = startX, y = startY, previousDirection = 6, steps = 0;
  do {
    boundary.push({ x, y }); let found = false;
    for (let direction = 0; direction < 8; direction += 1) {
      const nextDirection = (previousDirection + 6 + direction) % 8;
      const [deltaX, deltaY] = directions[nextDirection], nextX = x + deltaX, nextY = y + deltaY;
      if (nextX >= 0 && nextY >= 0 && nextX < width && nextY < height && all.has(nextY * width + nextX)) {
        x = nextX; y = nextY; previousDirection = nextDirection; found = true; break;
      }
    }
    if (!found) break;
    steps += 1;
  } while ((x !== startX || y !== startY || boundary.length < 3) && steps < pixels.length * 4 + 10);
  return boundary.filter((_, index) => index % CHARM_MARCH_STEP === 0);
};

const extractCharmContours = (imageData) => {
  const { data, width, height } = imageData;
  const mask = new Uint8Array(width * height);
  for (let index = 0; index < mask.length; index += 1) mask[index] = data[index * 4 + 3] > CHARM_ALPHA_THRESHOLD ? 1 : 0;
  const regions = fillRegions(mask, width, height).sort((a, b) => b.length - a.length);
  if (!regions[0]) return { outer: null, holes: [] };
  const background = new Uint8Array(width * height), stack = [];
  for (let x = 0; x < width; x += 1) [x, (height - 1) * width + x].forEach((index) => { if (!mask[index] && !background[index]) { background[index] = 1; stack.push(index); } });
  for (let y = 0; y < height; y += 1) [y * width, y * width + width - 1].forEach((index) => { if (!mask[index] && !background[index]) { background[index] = 1; stack.push(index); } });
  while (stack.length) {
    const pixel = stack.pop(), x = pixel % width, y = (pixel / width) | 0;
    [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].forEach(([nextX, nextY]) => {
      if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) return;
      const next = nextY * width + nextX;
      if (!mask[next] && !background[next]) { background[next] = 1; stack.push(next); }
    });
  }
  const holeMask = new Uint8Array(width * height);
  for (let index = 0; index < holeMask.length; index += 1) holeMask[index] = !mask[index] && !background[index] ? 1 : 0;
  return {
    outer: traceBoundary(regions[0], width, height),
    holes: fillRegions(holeMask, width, height).filter((region) => region.length >= CHARM_MIN_HOLE_AREA).map((region) => traceBoundary(region, width, height)),
  };
};

const toWorldPoints = (points, textureWidth, textureHeight, width, height) => points.map(({ x, y }) => ({ wx: (x / textureWidth - 0.5) * width, wy: (0.5 - y / textureHeight) * height }));
const getCentroid = (points) => points.reduce((sum, point) => ({ x: sum.x + point.wx / points.length, y: sum.y + point.wy / points.length }), { x: 0, y: 0 });
const createExtrudedCharmBody = (outer, holes, offsetX, offsetY, depth) => {
  const shape = new THREE.Shape();
  outer.forEach(({ wx, wy }, index) => index ? shape.lineTo(wx - offsetX, wy - offsetY) : shape.moveTo(wx - offsetX, wy - offsetY));
  shape.closePath();
  holes.forEach((holePoints) => {
    const hole = new THREE.Path();
    holePoints.forEach(({ wx, wy }, index) => index ? hole.lineTo(wx - offsetX, wy - offsetY) : hole.moveTo(wx - offsetX, wy - offsetY));
    hole.closePath(); shape.holes.push(hole);
  });
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 16, steps: 1 });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
};

const useBraceletStyleCharmAssets = (imagePath, charmHeight = 0.76, charmDepth = 0.035, materialProps = {}) => {
  const [assets, setAssets] = useState(null);
  useEffect(() => {
    let alive = true;
    const image = new Image(); image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth || image.width; canvas.height = image.naturalHeight || image.height;
      const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
      removeSolidCharmBackground(context, canvas.width, canvas.height);
      const bounds = getOpaqueBBox(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
      if (!bounds || !alive) return;
      const textureWidth = bounds.maxX - bounds.minX + 1, textureHeight = bounds.maxY - bounds.minY + 1;
      const cropped = document.createElement('canvas'); cropped.width = textureWidth; cropped.height = textureHeight;
      cropped.getContext('2d').drawImage(canvas, bounds.minX, bounds.minY, textureWidth, textureHeight, 0, 0, textureWidth, textureHeight);
      const contourData = cropped.getContext('2d').getImageData(0, 0, textureWidth, textureHeight);
      const width = charmHeight * (textureWidth / textureHeight);
      const { outer, holes } = extractCharmContours(contourData);
      const outerWorld = outer?.length >= 3 ? toWorldPoints(outer, textureWidth, textureHeight, width, charmHeight) : [{ wx: -width / 2, wy: -charmHeight / 2 }, { wx: width / 2, wy: -charmHeight / 2 }, { wx: width / 2, wy: charmHeight / 2 }, { wx: -width / 2, wy: charmHeight / 2 }];
      const holesWorld = holes.map((hole) => toWorldPoints(hole, textureWidth, textureHeight, width, charmHeight));
      const centroid = getCentroid(outerWorld);
      const bodyGeo = createExtrudedCharmBody(outerWorld, holesWorld, centroid.x, centroid.y, charmDepth);
const bodyMat = createRingMetalMaterial(materialProps.color || '#ECC875', { side: THREE.DoubleSide });
      const frontTexture = new THREE.CanvasTexture(cropped); frontTexture.colorSpace = THREE.SRGBColorSpace; frontTexture.flipY = true;
      const backTexture = new THREE.CanvasTexture(cropped); backTexture.colorSpace = THREE.SRGBColorSpace; backTexture.flipY = true; backTexture.repeat.set(-1, 1); backTexture.offset.set(1, 0);
if (alive) setAssets({ bodyGeo, bodyMat, frontTexture, backTexture, width, height: charmHeight, offsetX: centroid.x, offsetY: centroid.y, depth: charmDepth });    };
    image.src = imagePath;
    return () => { alive = false; setAssets((current) => { current?.bodyGeo?.dispose(); current?.bodyMat?.dispose(); current?.frontTexture?.dispose(); current?.backTexture?.dispose(); return null; }); };
}, [imagePath, charmHeight, charmDepth, materialProps]);
  return assets;
};

const getNecklaceCharmPlacement = ({ index, total, namePendant, braceletPath, chainOffsetX, charmKind = 'image', drapeCfg, seamSide = null, seamRank = null }) => {
    const hasCenterCharm = total % 2 === 1;
    const centerIndex = Math.floor(total / 2);
    const isNameChain = NAME_CHAIN_PATHS.includes(braceletPath);
    const nonNameLayout = NON_NAME_CHAIN_CHARM_LAYOUTS[braceletPath];
    const ellipseCfg = BRACELET_ELLIPSE_CONFIG[braceletPath];

    // ── Open two-anchor drape necklaces (chain-with-links, e.g. BRACELET15) ──
    // Charms are threaded along an actual link-by-link chain between two
    // fixed top anchor points, rather than sitting on a closed ellipse or a
    // fixed per-slot table. This takes priority over the ellipse branch below
    // when a bracelet has a CHAIN_DRAPE_CONFIG entry, since both would
    // otherwise apply to the same bracelet path. `drapeCfg` is passed in
    // already sized for the selected chain length, so this must never
    // re-derive it from the un-sized CHAIN_DRAPE_CONFIG lookup.
    if (drapeCfg) {
      return getChainCharmTransform(index, total, drapeCfg, seamSide ? { side: seamSide, rank: seamRank } : null);
    }

    // ── Elliptical loop bracelets (closed loop, no open drape) ──────────────
    // These place every charm — including the "center" slot — directly on
    // the true ellipse, so they skip the name-pendant / legacy fixed-slot
    // logic below entirely. BRACELET13/14 have no entry in
    // BRACELET_ELLIPSE_CONFIG, so they never hit this branch and keep their
    // existing behavior unchanged.
    if (ellipseCfg) {
      const orbitCfg = ellipseCfg[charmKind] ?? ellipseCfg.image;
      const offsets = getEllipseSlotOffsets(total, hasCenterCharm);
      const offset = offsets[index];
      return getEllipseCharmTransform(offset, orbitCfg);
    }

    // Odd totals reserve the centre slot for the charm beneath the name pendant.
    if (hasCenterCharm && index === centerIndex) {
      // Bracelets without a name pendant (fixed calibrated layout).
      if (!isNameChain && nonNameLayout) {
        return { position: nonNameLayout.center, rotation: [0, 0, 0] };
      }
      const centerPosition = namePendant?.enabled && namePendant.text?.trim()
        ? getNamePendantCharmPlacement({
            pendantText: namePendant.text,
            pendantFontStyle: namePendant.fontStyle,
          }).position
        : [0, 0.76, 0.24];
      return {
        position: [
          centerPosition[0],
          centerPosition[1] + NECKLACE_CHARM_VERTICAL_CLEARANCE,
          centerPosition[2],
        ],
        rotation: [0, 0, 0],
      };
    }

    // All remaining charms are paired on the necklace sides.
    const charmsPerSide = Math.floor(total / 2);
    // For an odd total the center item is never a side slot. Excluding it
    // keeps both left and right charm pairs on the lower, matching links.
    const sideIndex = hasCenterCharm && index > centerIndex
      ? index - 1
      : index;
    const isLeft = sideIndex < charmsPerSide;
    const baseSideRank = isLeft
      ? charmsPerSide - sideIndex
      : sideIndex - charmsPerSide + 1;
    const sideRank = baseSideRank;

    // ── Angle-based placement for chains that move with the pendant ────────
    const angleCfg = CHAIN_ANGLE_CONFIG[braceletPath];
    if (isNameChain && angleCfg) {
      return getChainAngleCharmTransform(sideRank, isLeft, chainOffsetX, angleCfg);
    }

    // ── Legacy fixed-slot placement (bracelets with no angle config) ───────
    const sideSlots = nonNameLayout?.sideSlots ?? [
      { x: 1.0, y: 2.55 + NECKLACE_CHARM_VERTICAL_CLEARANCE },
      { x: 1.9, y: 4.55 + NECKLACE_CHARM_VERTICAL_CLEARANCE },
      { x: 2.8, y: 6.30 + NECKLACE_CHARM_VERTICAL_CLEARANCE },
    ];
    const slot = sideSlots[Math.min(sideRank - 1, sideSlots.length - 1)];
    let slotX = slot.x;
    let slotY = slot.y;

    const slotXFinal = !hasCenterCharm && sideRank === 1 && nonNameLayout?.evenInnerX != null
      ? nonNameLayout.evenInnerX
      : slotX;

    return {
      position: [slotXFinal * (isLeft ? -1 : 1), slotY, 0.24],
      rotation: [0, 0, 0],
    };
};

// Existing catalogue entries are all image charms, but the first ten are the
// Birthstones category. Keep their orbit independently tuneable, while an
// explicit `orbitType` on a future charm record always takes precedence.
const getNecklaceCharmKind = (charm) => {
  if (charm.type === 'initial') return 'initial';
  if (charm.type === 'birthstone' || charm.type === 'diamond') return 'gemstone';
  if (charm.orbitType) return charm.orbitType;
  const catalogueIndex = CHARMS.findIndex((item) => item.path === charm.path);
  return catalogueIndex >= 0 && catalogueIndex < 10 ? 'gemstone' : 'image';
};

// ─── Charm identity, for tracking which charms have finished loading ────────
// Charms are plain objects with no guaranteed id, and the list is reordered
// and spliced, so a bare array index is not a usable identity. This keys off
// what the charm actually IS; two identical charms are interchangeable
// anyway, and the trailing occurrence number keeps them distinct.
const charmIdentityBase = (charm) => (
  charm?.id
  ?? `${charm?.type ?? 'image'}|${charm?.path ?? charm?.letter ?? ''}|${charm?.gemstoneColor ?? charm?.bodyColor ?? charm?.metalColor ?? ''}`
);

const buildCharmKeys = (list) => {
  const seen = new Map();
  return list.map((charm) => {
    const base = charmIdentityBase(charm);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return `${base}#${n}`;
  });
};

// Reports upward the first time this charm's model/geometry is actually
// available, so the chain can hold off on re-shaping until then.
function useReportCharmReady(isReady, charmKey, onReady) {
  useEffect(() => {
    if (isReady && charmKey != null) onReady?.(charmKey);
  }, [isReady, charmKey, onReady]);
}

const NecklaceImageCharm = ({ charm, index, total, seamSide = null, seamRank = null, materialProps, namePendant, braceletPath, chainOffsetX, drapeCfg, dropKey, animateDrop = true, charmKey, onReady, onClick }) => {
  const charmMaterialProps = useMemo(() => ({
    ...materialProps,
    color: charm.metalColor || materialProps.color,
  }), [charm.metalColor, materialProps]);
  const asset = useBraceletStyleCharmAssets(charm.path, 0.76, 0.09, charmMaterialProps);
  const charmStyle = NECKLACE_CHARM_STYLE_BY_BRACELET[braceletPath] ?? DEFAULT_NECKLACE_CHARM_STYLE;
  const placement = useMemo(
    () => getNecklaceCharmPlacement({
      index, total, namePendant, braceletPath, chainOffsetX,
      charmKind: getNecklaceCharmKind(charm),
      drapeCfg, seamSide, seamRank,
    }),
    [index, total, namePendant, braceletPath, chainOffsetX, charm, drapeCfg, seamSide, seamRank],
  );

  // Wobbles on add AND on replace — retriggers whenever this slot's charm
  // path changes, not just on first mount.
 const wobbleRef = useCharmAddWobble(placement.rotation[2], charmStyle.charmScale, charm.path, Boolean(asset));
  const dropOffsetY = useChainCharmDropOffset(placement.t, dropKey, Boolean(drapeCfg), animateDrop);
  useReportCharmReady(Boolean(asset), charmKey, onReady);

  if (!asset) return null;

  const [bailOffsetX, bailOffsetY, bailOffsetZ] = charmStyle.bailOffset;

  return (
    <group
      ref={wobbleRef}
      position={[
        placement.position[0],
        placement.position[1] - (charmStyle.charmDrop ?? 0) + dropOffsetY,
        placement.position[2],
      ]}
      rotation={[placement.rotation[0], placement.rotation[1], placement.rotation[2]]}
      scale={charmStyle.charmScale}
      onClick={onClick}
    >
      <mesh geometry={asset.bodyGeo} material={asset.bodyMat} castShadow receiveShadow />
     <mesh position={[-asset.offsetX, -asset.offsetY, 0.05]}>
  <planeGeometry args={[asset.width, asset.height]} />
  <meshBasicMaterial map={asset.frontTexture} transparent alphaTest={0.05} side={THREE.FrontSide} depthWrite={false} />
</mesh>
<mesh position={[-asset.offsetX, -asset.offsetY, -0.05]} rotation={[0, Math.PI, 0]}>
  <planeGeometry args={[asset.width, asset.height]} />
  <meshBasicMaterial map={asset.backTexture} transparent alphaTest={0.05} side={THREE.FrontSide} depthWrite={false} />
</mesh>
      <mesh position={[
        bailOffsetX,
        asset.height / 2 - asset.offsetY + bailOffsetY,
        bailOffsetZ,
      ]} rotation={[Math.PI / 2, Math.PI / 2, 0]} castShadow>
  <torusGeometry args={[charmStyle.bailRadius, charmStyle.bailTube, 12, 32]} />
        <meshPhysicalMaterial
          {...ringMetalProps(charmMaterialProps.color || '#ECC875')}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

// ─── Standalone initial charm ────────────────────────────────────────────────
// This uses the selected bundled 3D font and hangs directly from the chain link.
const NECKLACE_INITIAL_CHARM = {
  letterSize: 0.55,
  letterDepth: 0.07,
};

// ─── Initial hardware: letter + washer + bail ring ──────────────────────────
// Same build as the bracelet initial (Bracelet.jsx InitialCharm), scaled up by
// the letter size (0.55 here vs 0.11 there, x5): a flat washer sits centred on
// top of the letter, facing the viewer, and a round bail ring stands edge-on
// through its hole and up onto the chain.
//
// Everything is positioned from the top of the bail down, so the bail meets
// the chain exactly where the old single edge-on washer did (its top was
// 0.055 + 0.125 = 0.18 above this charm's origin); the letter hangs below the
// new hardware instead.
const NECKLACE_INITIAL_HW = {
  bailTopY: 0.18,          // top of the bail ring, in the charm's frame
  bailR: 0.15,             // bracelet 0.030 x5
  bailTube: 0.02,          // bracelet 0.004 x5
  washerOuter: 0.125,      // bracelet 0.025 x5
  washerInner: 0.10,       // bracelet 0.020 x5
  washerDepth: 0.05,       // bracelet 0.010 x5
  letterGap: 0.05,         // washer centre above the letter top (bracelet 0.01 x5)
};
// Hardware heights below a given bail-top height (all in the charm's frame).
const getNecklaceInitialLayout = (bailTopY) => {
  const bailY = bailTopY - NECKLACE_INITIAL_HW.bailR - NECKLACE_INITIAL_HW.bailTube;
  return { bailTopY, bailY, washerY: bailY - NECKLACE_INITIAL_HW.bailR };
};
const NECKLACE_INITIAL_WASHER_SEAT = {
  washerOuterR: NECKLACE_INITIAL_HW.washerOuter,
  overlap: 0.06,   // bracelet 0.012 x5
  maxDrop: 0.175,  // bracelet 0.035 x5
};

const NecklaceInitialCharm = ({ charm, index, total, seamSide = null, seamRank = null, chainAnchors = null, chainShrinkAnchors = null, materialProps, namePendant, braceletPath, chainOffsetX, drapeCfg, dropKey, animateDrop = true, charmKey, onReady, onClick }) => {
  const [textMesh, setTextMesh] = useState(null);
  const [attachmentPoint, setAttachmentPoint] = useState(null);
  const charmStyle = NECKLACE_CHARM_STYLE_BY_BRACELET[braceletPath] ?? DEFAULT_NECKLACE_CHARM_STYLE;

  const placement = useMemo(
    () => getNecklaceCharmPlacement({
      index, total, namePendant, braceletPath, chainOffsetX, charmKind: 'initial', drapeCfg, seamSide, seamRank,
    }),
    [index, total, namePendant, braceletPath, chainOffsetX, drapeCfg, seamSide, seamRank],
  );

  // Wobbles on add AND on replace — retriggers whenever this slot's letter
  // or font changes, not just on first mount. The outer group's resting
  // rotation is now 0 (not the chain tilt) — the tilt moved to a nested
  // group around the letter's own pivot (see below), so the outer group
  // no longer swings the whole charm sideways off the washer.
  const wobbleRef = useCharmAddWobble(0, 1, charm.letter, Boolean(attachmentPoint));
  const dropOffsetY = useChainCharmDropOffset(placement.t, dropKey, Boolean(drapeCfg), animateDrop);
  useReportCharmReady(Boolean(attachmentPoint), charmKey, onReady);

  useEffect(() => {
    const geometry = textMesh?.geometry;
    if (!geometry) return;
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox;
    if (!bounds) return;
    const x = (bounds.min.x + bounds.max.x) / 2;
    setAttachmentPoint({
      x,
      y: bounds.max.y,
      z: (bounds.min.z + bounds.max.z) / 2,
      // Twin-peak letters (H, M, N...) sit a touch closer to the washer - see
      // shared/initialCharmHardware.js.
      drop: isTwinPeakInitial(charm.letter)
        ? getInitialWasherDrop(geometry, x, bounds.max.y + NECKLACE_INITIAL_HW.letterGap, NECKLACE_INITIAL_WASHER_SEAT)
          * INITIAL_WASHER_DROP_FACTOR
        : 0,
    });
  }, [textMesh, charm.letter]);

  const material = ringMetalProps(charm.metalColor || materialProps.color || '#ECC875', { side: THREE.DoubleSide });

  const drop = charmStyle.initialDrop ?? charmStyle.charmDrop ?? 0.05;

  // ── Hook the bail THROUGH its chain link ─────────────────────────────────
  // On a drape chain the placement also reports the link this charm hangs
  // from. The bail ring is then positioned so its top wire rests on the
  // inside of that link's bottom wire - the two rings interlock like chain
  // links - and the whole assembly is centred under the link. Elsewhere
  // (GLB name chains) the fixed bail height is kept.
  // The link is looked up on the chain AS RENDERED (built with the same
  // charm anchors ChainDrape uses - a cache hit), nearest front-facing link to
  // this charm's anchor, since charms bend the chain away from its free drape.
  const hookLink = useMemo(() => {
    if (!drapeCfg || !placement.linkPosition) return null;
    const fallback = {
      position: placement.linkPosition, reach: placement.linkBottomReach, tube: placement.linkTube,
    };
    if (!chainAnchors?.length) return fallback;
    const { links } = buildChainLinkTransforms(drapeCfg, chainAnchors, chainShrinkAnchors ?? chainAnchors);
    const [px, py] = placement.position;
    let best = null;
    let bestD = Infinity;
    links.forEach((link) => {
      if (!link.isFrontFacing) return;
      const d = Math.hypot(link.position[0] - px, link.position[1] - py);
      if (d < bestD) { bestD = d; best = link; }
    });
    if (!best) return fallback;
    const k = best.scale ?? 1;
    const isOval = drapeCfg.linkShape === 'oval';
    const reach = isOval
      ? (Math.max((drapeCfg.linkLength ?? 0.34) - (drapeCfg.linkWidth ?? 0.15), 0) / 2 * Math.abs(best.tangent?.y ?? 0)
        + (drapeCfg.linkWidth ?? 0.15) / 2) * k
      : (drapeCfg.linkOuterRadius ?? 0.12) * k;
    return { position: best.position, reach, tube: placement.linkTube * k };
  }, [drapeCfg, chainAnchors, chainShrinkAnchors, placement]);

  let hookX = 0;
  let bailTopY = NECKLACE_INITIAL_HW.bailTopY;
  if (hookLink) {
    const originY = placement.position[1] - drop; // this group's origin (before the shared drop offset)
    const linkLocalY = hookLink.position[1] - originY;
    hookX = hookLink.position[0] - placement.position[0];
    // Bail's top wire resting on the inside of the link's bottom wire.
    bailTopY = linkLocalY - hookLink.reach + hookLink.tube + NECKLACE_INITIAL_HW.bailTube;
  }
  const hw = getNecklaceInitialLayout(bailTopY);

  // The letter's top-centre goes `letterGap` below the washer (less the small
  // twin-peak drop), and the glyph is centred in depth on the hardware.
  const letterTopY = hw.washerY - NECKLACE_INITIAL_HW.letterGap + (attachmentPoint?.drop ?? 0);
  const textPosition = attachmentPoint
    ? [-attachmentPoint.x, letterTopY - attachmentPoint.y, -attachmentPoint.z]
    : [0, letterTopY, 0];

  return (
    <group
      ref={wobbleRef}
      position={[
        placement.position[0],
        placement.position[1] - drop + dropOffsetY,
        placement.position[2],
      ]}
      rotation={[placement.rotation[0], placement.rotation[1], 0]}
      onClick={onClick}
    >
      {/* The charm's own lean, pivoted at the top of the bail - the point
          where it hangs on the chain - so the letter, washer and bail swing
          together about it instead of sliding away from the link. */}
      <group position={[hookX, hw.bailTopY, 0]} rotation={[0, 0, placement.rotation[2] * 0.15]}>
      <group position={[0, -hw.bailTopY, 0]}>
        <Suspense fallback={null}>
          <Text3D
            ref={setTextMesh}
            position={textPosition}
            font={initialFontUrl}
            size={NECKLACE_INITIAL_CHARM.letterSize}
            height={NECKLACE_INITIAL_CHARM.letterDepth}
            curveSegments={16}
            bevelEnabled
            bevelThickness={0.015}
            bevelSize={0.008}
            bevelSegments={5}
          >
            {(charm.letter || 'A').slice(0, 1).toUpperCase()}
            <meshPhysicalMaterial {...material} />
          </Text3D>
        </Suspense>
        {attachmentPoint && (
          <>
            {/* Flat washer on top of the letter, facing the viewer (extruded
                backwards, so shifted forward half its depth to centre it). */}
            <WasherBail
              position={[0, hw.washerY, NECKLACE_INITIAL_HW.washerDepth / 2]}
              rotation={[0, Math.PI, 0]}
              materialProps={material}
              outerRadius={NECKLACE_INITIAL_HW.washerOuter}
              innerRadius={NECKLACE_INITIAL_HW.washerInner}
              depth={NECKLACE_INITIAL_HW.washerDepth}
            />
            {/* Bail ring, edge-on: through the washer's hole and up onto the chain. */}
            <mesh position={[0, hw.bailY, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
              <torusGeometry args={[NECKLACE_INITIAL_HW.bailR, NECKLACE_INITIAL_HW.bailTube, 16, 48]} />
              <meshPhysicalMaterial {...material} />
            </mesh>
          </>
        )}
      </group>
      </group>
    </group>
  );
};

const glbCharmAnchorOffsetCache = new Map();
function getGlbCharmAnchorOffset(path, obj) {
  if (glbCharmAnchorOffsetCache.has(path)) return glbCharmAnchorOffsetCache.get(path);
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const center = box.getCenter(new THREE.Vector3());
  const offset = { x: center.x, y: box.max.y, z: center.z };
  glbCharmAnchorOffsetCache.set(path, offset);
  return offset;
}

const GEMSTONE_CHARM_SCALE_BY_TYPE = {
  birthstone: [0.15, 0.15, 0.15],
  diamond: [0.15, 0.15, 0.15],
};

const GEMSTONE_CHARM_SCALE_BY_PATH = {
  '/bc-assets/gemstone/cushion.glb': [0.17, 0.17, 0.17],
  '/bc-assets/gemstone/princess.glb': [0.17, 0.17, 0.17],
};

const NecklaceGemstoneCharm = ({ charm, index, total, seamSide = null, seamRank = null, materialProps, namePendant, braceletPath, chainOffsetX, drapeCfg, dropKey, animateDrop = true, charmKey, onReady, onClick }) => {  const [model, setModel] = useState(null);
  const [currentPath, setCurrentPath] = useState(null);
  const [anchorOffset, setAnchorOffset] = useState(null);
  const [gemGeometry, setGemGeometry] = useState(null);
  const charmStyle = NECKLACE_CHARM_STYLE_BY_BRACELET[braceletPath] ?? DEFAULT_NECKLACE_CHARM_STYLE;
  // Only the GLB name chains dress their gems with a washer and drop them
  // lower; on a drape chain the gem hangs straight off the link it sits on.
  const isNameChain = NAME_CHAIN_PATHS.includes(braceletPath);

  // Ring gem system: studio EXR + ring refraction params (shared/gemMaterial.js)
  const envTexture = useGemEnvTexture();

  const placement = useMemo(
    () => getNecklaceCharmPlacement({ index, total, namePendant, braceletPath, chainOffsetX, charmKind: 'gemstone', drapeCfg, seamSide, seamRank }),
    [index, total, namePendant, braceletPath, chainOffsetX, drapeCfg, seamSide, seamRank],
  );

  const wobbleRef = useCharmAddWobble(placement.rotation[2], 1, `${charm.path}-${charm.gemstoneColor}`, Boolean(model));
  const dropOffsetY = useChainCharmDropOffset(placement.t, dropKey, Boolean(drapeCfg), animateDrop);
  useEffect(() => {
    let cancelled = false;
    loadGLBCached(charm.path).then((obj) => {
      if (cancelled) return;
      obj.updateMatrixWorld(true);
      let foundGemGeometry = null;

      obj.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        const isGem = charm.gemstoneColor &&
          /all-diamonds|material_1|gltf_2|gem|stone|diamond/i.test(`${child.name} ${child.material?.name || ''}`);

        if (isGem) {
          // Pull this mesh's geometry out (baked into obj-local space via
          // its matrixWorld) so we can render it separately through
          // MeshRefractionMaterial instead of a flat-shaded material.
          const geo = child.geometry.clone().toNonIndexed();
          geo.applyMatrix4(child.matrixWorld);
          geo.computeVertexNormals();
          foundGemGeometry = geo;
          child.visible = false; // hide the original flat gem mesh
        } else {
          child.material = createRingMetalMaterial(charm.bodyColor || materialProps.color || '#ECC875', { side: THREE.DoubleSide });
        }
      });

      setAnchorOffset(getGlbCharmAnchorOffset(charm.path, obj));
      setModel(obj);
      setGemGeometry(foundGemGeometry);
      setCurrentPath(charm.path);
    }).catch((err) => console.error(`Failed to load ${charm.path}`, err));
    return () => { cancelled = true; };
  }, [charm.path, charm.bodyColor, charm.gemstoneColor, materialProps]);

  const gemReady = Boolean(model) && currentPath === charm.path && Boolean(anchorOffset) && Boolean(envTexture);
  useReportCharmReady(gemReady, charmKey, onReady);

  if (!gemReady) return null;

  const scale = GEMSTONE_CHARM_SCALE_BY_PATH[charm.path] ?? GEMSTONE_CHARM_SCALE_BY_TYPE[charm.type] ?? [0.05, 0.05, 0.05];
  const innerPosition = [-anchorOffset.x * scale[0], -anchorOffset.y * scale[1], -anchorOffset.z * scale[2]];
  const hardwareMaterial = ringMetalProps(charm.bodyColor || materialProps.color || '#ECC875', { side: THREE.DoubleSide });
  const [bailOffsetX, bailOffsetY, bailOffsetZ] = charmStyle.bailOffset;
  const nameChainExtraDrop = isNameChain ? (charmStyle.gemstoneExtraDrop ?? 0.5) : 0;
  const washerYOffset = charmStyle.bailRadius * 0.6;

  return (
    <group
      ref={wobbleRef}
      position={[
        placement.position[0],
        placement.position[1] - (charmStyle.charmDrop ?? 0) - nameChainExtraDrop + dropOffsetY,
        placement.position[2],
      ]}
      rotation={placement.rotation}
      onClick={onClick}
    >
      <primitive object={model} position={innerPosition} rotation={[Math.PI / 2, 0, 0]} scale={scale} />

      {gemGeometry && (
        <mesh
          key={`gem_${charm.path}_${charm.gemstoneColor}`}
          geometry={gemGeometry}
          position={innerPosition}
          rotation={[Math.PI / 2, 0, 0]}
          scale={scale}
          castShadow
        >
          <MeshRefractionMaterial
            envMap={envTexture}
            color={new THREE.Color(charm.gemstoneColor)}
            ior={GEM_REFRACTION_PARAMS.ior}
            bounces={GEM_REFRACTION_PARAMS.bounces}
            aberrationStrength={GEM_REFRACTION_PARAMS.aberrationStrength}
            fresnel={GEM_REFRACTION_PARAMS.fresnel}
            toneMapped={false}
            transparent
            fastChroma
          />
        </mesh>
      )}

      {isNameChain && (
        <>
          <WasherBail
            position={[bailOffsetX, bailOffsetY + 0.4, bailOffsetZ - 0.05]}
            rotation={[0, 0, 0]}
            materialProps={hardwareMaterial}
            outerRadius={charmStyle.bailRadius}
            innerRadius={charmStyle.bailRadius - charmStyle.bailTube * 2}
            depth={charmStyle.bailTube * 2}
          />
          <mesh
            position={[bailOffsetX, bailOffsetY - washerYOffset + charmStyle.bailRadius + charmStyle.bailTube, bailOffsetZ]}
            rotation={[Math.PI / 2, Math.PI / 2, 0]}
            castShadow
          >
            <torusGeometry args={[charmStyle.bailRadius * 0.85, charmStyle.bailTube, 12, 32]} />
            <meshPhysicalMaterial {...hardwareMaterial} />
          </mesh>
        </>
      )}
    </group>
  );
};

export {
  NECKLACE_CHARM_STYLE_BY_BRACELET,
  DEFAULT_NECKLACE_CHARM_STYLE,
  getNecklaceCharmPlacement,
  getNecklaceCharmKind,
  buildCharmKeys,
  NecklaceImageCharm,
  NecklaceInitialCharm,
  NecklaceGemstoneCharm,
};
