// ─── Name-pendant chains ─────────────────────────────────────────────────────
// Everything that only the name-pendant necklaces use: BRACELET13/14, the two
// models in NAME_PENDANT_SUPPORTED_PATHS. These load a real GLB chain whose
// left/right chain groups slide outward as the 3D name in the middle gets
// wider, and hang their charms off those moving chains.
//
// The plain drape chains (BRACELET15-18) live in DrapeChain.jsx.
import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import KernedText3D from '../shared/KernedText3D';
import * as THREE from 'three';
import { RING_METAL, ringMetalProps, createRingMetalMaterial, toRingMetalColor } from '../shared/metalMaterial';
import { BRACELET_POSITIONS, NAME_CHAR_CONFIG, PENDANT_CHARM_CONFIG } from '../shared/assets';
import { getChainPointAtX, chainDropOffsetAt } from './DrapeChain';
import { TextBoundsProbe } from '../bracelet/NameChain';
import {
  NAME_FONT_URLS, NAME_FONT_LETTER_SPACING, CHARM_FONT_Y_OFFSET, DEFAULT_LETTER_SPACING,
  loadGLBCached, sanitizePendantText, isGemstoneMesh,
  NAME_PENDANT_CHARM_SIDE_INSET, NAME_PENDANT_CHARM_TILT,
  WasherBail,
  WASHER_BAIL_DIMENSIONS,
} from '../shared/necklaceShared';

// The name pendant no longer offers a size choice — what was the "medium"
// entry is now simply THE pendant geometry config.
const NAME_SIZE_CONFIG = { size: 1.1, height: 0.13, bevel: 0.016, leftOffset: +0.05, rightOffset: -0.12, loopYMultiplier: 0.3, loopZOffset: -0.02, chainLeftZOffset: 0, chainRightZOffset: 0 };

// ─── Zero config fallback ─────────────────────────────────────────────────────
// All 10 fields — charmX/charmY for middle char,
// left*/right* for first/last char respectively.
const ZERO_CHAR_CONFIG = {
  leftWasherX:  0,
  leftWasherY:  0,   // applied as Z offset in 3D scene
  leftChainX:   0,
  leftChainY:   0,   // applied as Z offset in 3D scene
  rightWasherX: 0,
  rightWasherY: 0,   // applied as Z offset in 3D scene
  rightChainX:  0,
  rightChainY:  0,   // applied as Z offset in 3D scene
  charmX:       0,
  charmY:       0,
};

// ─── EASY POSITION CONFIG ─────────────────────────────────────────────────────
const NAME_PENDANT_POSITIONS = {
  '/pc-assets/pendant_models//BRACELET13.glb': {
    y: 1.5,
    z: 0.08,
    rotation: [0, 0, 0],
  },
  '/pc-assets/pendant_models//BRACELET14.glb': {
    y: 1.5,
    z: 0.08,
    rotation: [0, 0, 0],
  },
};

// ─── CHAIN INNER EDGE ────────────────────────────────────────────────────────
// Used only by the BRACELET13/14 name-pendant chains below — untouched.
const CHAIN_INNER_EDGE = 3.7595;

// ─── getCharmPositionCase ─────────────────────────────────────────────────────

// ─── NEW: Pick which character index the charm should center on ───────────────
const getCharmTargetIndex = (text, specialCharsSet) => {
  if (!text || text.length === 0) return { index: 0, side: 'center' };
  const len = text.length;

  if (len % 2 === 1) {
    // Odd: always use the center character
    return { index: Math.floor(len / 2), side: 'center' };
  }

  // Even: check the two middle characters
  const leftIdx  = len / 2 - 1;
  const rightIdx = len / 2;
  const leftSpecial  = specialCharsSet.has(text[leftIdx].toLowerCase());
  const rightSpecial = specialCharsSet.has(text[rightIdx].toLowerCase());

  if (leftSpecial && !rightSpecial) return { index: leftIdx,  side: 'left' };
  // both special or right special or neither: use right-middle
  return { index: rightIdx, side: 'right' };
};

// ─── NEW: Estimate the X center of a character at charIndex in the rendered text
// Uses the font's size + letterSpacing to approximate glyph advance widths.
// Since Three.js Text3D doesn't expose glyph metrics at this stage,
// we approximate: each character ≈ sizeConfig.size * 0.55 advance width,
// then add letterSpacing between each pair.
const estimateCharCenterX = (text, charIndex, sizeConfig, letterSpacing) => {
  const charWidth   = sizeConfig.size * 0.55;   // approximate advance per glyph
  const spacing     = sizeConfig.size * (letterSpacing ?? 0);

  // X start of the character at charIndex
  let x = 0;
  for (let i = 0; i < charIndex; i++) {
    x += charWidth + spacing;
  }
  // Center of that character
  x += charWidth / 2;

  // The text group itself is already centered (centeredX offsets it),
  // so we return the offset from the text's local origin (x=0)
  return x;
};
const getCharmPositionCase = (text, specialCharsSet) => {
  if (!text || text.length === 0) return 1;
  const len = text.length;

  if (len % 2 === 1) {
    const mid = text[Math.floor(len / 2)].toLowerCase();
    return specialCharsSet.has(mid) ? 2 : 1;
  }

  const leftMid  = text[len / 2 - 1].toLowerCase();
  const rightMid = text[len / 2    ].toLowerCase();
  const leftSpecial  = specialCharsSet.has(leftMid);
  const rightSpecial = specialCharsSet.has(rightMid);

  if (leftSpecial && rightSpecial) return 5;
  if (leftSpecial)                 return 4;
  return 3;
};

// Use the same placement rules for every charm that hangs from the middle of a
// name pendant.  Keeping this calculation shared ensures its position follows
// the configured font and per-character adjustments.
const getNamePendantCharmPlacement = ({ pendantText, pendantFontStyle }) => {
  const fontConfig = PENDANT_CHARM_CONFIG[pendantFontStyle] ?? PENDANT_CHARM_CONFIG.dancing;
  const specialCharsSet = new Set(fontConfig.specialChars);
  const sizeConfig = NAME_SIZE_CONFIG;
  const letterSpacing = NAME_FONT_LETTER_SPACING[pendantFontStyle] ?? DEFAULT_LETTER_SPACING;
  const cleanText = sanitizePendantText(pendantText || '');
  const { index: targetIndex } = getCharmTargetIndex(cleanText, specialCharsSet);
  const targetChar = cleanText[targetIndex] ?? '';
  const targetCharCfg = (NAME_CHAR_CONFIG[pendantFontStyle] ?? {})[targetChar] ?? ZERO_CHAR_CONFIG;
  const basePlacement = fontConfig.placements[1] ?? {
    position: [0, 1, 0.16],
    rotation: [Math.PI / 2, 0, 0],
    scale: [0.18, 0.18, 0.18],
  };
  const totalTextWidth = cleanText.length > 0
    ? (sizeConfig.size * 0.55 + sizeConfig.size * letterSpacing) * cleanText.length - sizeConfig.size * letterSpacing
    : 0;
  const charCenterX = -totalTextWidth / 2 + estimateCharCenterX(cleanText, targetIndex, sizeConfig, letterSpacing);
  const [bx, by, bz] = basePlacement.position;

  return {
    ...basePlacement,
    position: [
      bx + charCenterX + (targetCharCfg.charmX ?? 0),
      by + (CHARM_FONT_Y_OFFSET[pendantFontStyle] ?? 0) + (targetCharCfg.charmY ?? 0),
      bz,
    ],
  };
};

// ─── BoundsMeasurer ───────────────────────────────────────────────────────────
const BoundsMeasurer = ({ targetRef, onMeasured, deps }) => {
  const stableCount = useRef(0);
  const lastBox     = useRef(null);
  const reported    = useRef(false);

  useEffect(() => {
    stableCount.current = 0;
    lastBox.current     = null;
    reported.current    = false;
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    if (reported.current || !targetRef.current) return;
    targetRef.current.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(targetRef.current);
    if (box.isEmpty()) return;
    const prev   = lastBox.current;
    const stable =
      prev &&
      Math.abs(box.min.x - prev.min.x) < 0.001 &&
      Math.abs(box.max.x - prev.max.x) < 0.001;
    lastBox.current = box.clone();
    if (stable) {
      stableCount.current += 1;
      if (stableCount.current >= 3) {
        reported.current = true;
        onMeasured({
          left:    box.min.x,
          right:   box.max.x,
          centerX: (box.min.x + box.max.x) / 2,
        });
      }
    } else {
      stableCount.current = 0;
    }
  });

  return null;
};

// ─── GLBModel ─────────────────────────────────────────────────────────────────

const GLBModel = ({
  path, position, rotation, scale,
  materialProps, texture, onClick,
  chainLeft, chainRight,
  chainLeftZ, chainRightZ,
  materialResolver,
  onLoaded,
  onChainDefaults,
  chainResetKey,
}) => {
  const [model, setModel] = useState(null);
  const defaultChainPos   = useRef({});

  useEffect(() => {
    let cancelled = false;
    loadGLBCached(path)
      .then((obj) => {
        if (cancelled) return;
        obj.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material = materialResolver
              ? materialResolver(child, child.material)
              : new THREE.MeshPhysicalMaterial({
                  ...materialProps,
                  ...RING_METAL,
                  color: isGemstoneMesh(child)
                    ? child.material.color
                    : new THREE.Color(toRingMetalColor(materialProps.color)),
                  // No texture map - ring-matched polished metal (see
                  // shared/metalMaterial.js).
                  map: null,
                  side: THREE.DoubleSide,
                });
          }
        });
        obj.traverse((child) => {
          if (child.name === 'chain_left_group' || child.name === 'chain_right_group') {
            defaultChainPos.current[child.name] = {
              x: child.position.x,
              z: child.position.z,
            };
          }
        });
        onChainDefaults?.({
          left: defaultChainPos.current.chain_left_group ?? { x: 0, z: 0 },
          right: defaultChainPos.current.chain_right_group ?? { x: 0, z: 0 },
        });
        setModel(obj);
        onLoaded?.();
      })
      .catch((err) => console.error(`Failed to load ${path}`, err));
    return () => { cancelled = true; };
  }, [path, materialProps, texture, materialResolver]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!model) return;
    model.traverse((child) => {
      if (child.name === 'chain_left_group') {
        const def = defaultChainPos.current['chain_left_group'];
        child.position.x = chainLeft  != null ? -chainLeft  : (def?.x ?? 0);
        child.position.z = chainLeftZ != null ?  chainLeftZ : (def?.z ?? 0);
      }
      if (child.name === 'chain_right_group') {
        const def = defaultChainPos.current['chain_right_group'];
        child.position.x = chainRight  != null ? chainRight  : (def?.x ?? 0);
        child.position.z = chainRightZ != null ? chainRightZ : (def?.z ?? 0);
      }
    });
  }, [model, chainLeft, chainRight, chainLeftZ, chainRightZ, chainResetKey]);

  if (!model) return null;
  return (
    <primitive object={model} position={position} rotation={rotation} scale={scale} onClick={onClick} />
  );
};

// ─── PendantCharmModel ────────────────────────────────────────────────────────
const PendantCharmModel = ({ charm = {}, braceletPath, materialProps, pendantText, pendantFontStyle }) => {
  const placement = getNamePendantCharmPlacement({ pendantText, pendantFontStyle });

const materialResolver = useMemo(() => (child) => {
  const isGem = isGemstoneMesh(child);
  if (!isGem) {
    return createRingMetalMaterial(charm.bodyColor || materialProps.color || "#ECC875");
  }
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(
      isGem
        ? (charm.gemstoneColor || "#0047AB")
        : (charm.bodyColor     || materialProps.color || "#ECC875")
    ),
    metalness:   isGem ? 0.1  : (materialProps.metalness ?? 0.92),
    roughness:   isGem ? 0.05 : (materialProps.roughness ?? 0.14),
    envMap:      isGem ? null  : (materialProps.envMap   ?? null),
    envMapIntensity: isGem ? 0 : (materialProps.envMapIntensity ?? 1.4),
    transparent: isGem,
    opacity:     isGem ? 0.85 : 1,
  });
}, [charm.bodyColor, charm.gemstoneColor, materialProps]);

  if (!charm.enabled || !charm.path) return null;

  return (
    <GLBModel
      path={charm.path}
      position={placement.position}
      rotation={placement.rotation}
      scale={placement.scale}
      materialProps={materialProps}
      materialResolver={materialResolver}
    />
  );
};

// ─── CHAIN POSITION ADJUSTMENT BY BRACELET ───────────────────────────────────
// Per-bracelet nudges applied on top of everything else (char config, size config).
// Add an entry per braceletPath as needed — anything missing defaults to 0.
const CHAIN_POSITION_BY_BRACELET = {
  '/pc-assets/pendant_models//BRACELET13.glb': { leftX: 0,   leftZ: 0,    rightX: 0,   rightZ: 0 },
  '/pc-assets/pendant_models//BRACELET14.glb': { leftX: 0.4, leftZ: 0, rightX: 0.4, rightZ: 0 },
};
// ─── CHAIN-ANGLE CHARM PLACEMENT (BRACELET13/14) ─────────────────────────────
// Each open chain runs from a starting point next to the name pendant/washer
// up and out at a roughly constant angle. That starting point is exactly
// what slides outward as the pendant text gets wider (chainOffsetX), so:
//   1. every side charm is placed along a straight line defined by an angle
//      + a starting point (the "anchor") — instead of a fixed x/y
//   2. when the pendant widens, the anchor shifts by chainOffsetX and the
//      whole line — and every charm on it, including the gaps between them
//      — slides out together with it
//
// Left and right are configured completely independently below, since the
// two chains don't have to be perfectly symmetric on every model.
//
//   angleDeg       — angle of THIS chain from the horizontal, in degrees.
//                    0 = flat, 90 = straight up. Nudge until the line tracks
//                    the rendered chain's slope.
//   anchor         — [x, y] starting point the angle is measured FROM — the
//                    point on the chain right next to the pendant/washer,
//                    BEFORE any pendant-width offset is applied. This is
//                    exactly the point chainOffsetX shifts.
//   charmDistances — distance along the chain line (world units) from the
//                    anchor to each successive charm. distances[0] is the
//                    charm nearest the pendant. If you place more charms
//                    than there are entries, the last step size repeats.
//   tiltDeg        — (optional) charm lean, in degrees, applied as the
//                    charm's own z-rotation. Leave it out to use the same
//                    default lean as before; set it per side to fine-tune.
const CHAIN_ANGLE_CONFIG = {
  '/pc-assets/pendant_models//BRACELET13.glb': {
    left:  { angleDeg: 70, anchor: [0.9, 2.55], charmDistances: [0, 2.05, 3.85] },
    right: { angleDeg: 70, anchor: [0.9, 2.55], charmDistances: [0, 2.05, 3.85] },
  },
  '/pc-assets/pendant_models//BRACELET14.glb': {
    left:  { angleDeg: 66, anchor: [1.0, 2.55], charmDistances: [0, 2.05, 3.85] },
    right: { angleDeg: 66, anchor: [1.0, 2.55], charmDistances: [0, 2.05, 3.85] },
  },
};

const getChainDistanceForRank = (rank, charmDistances) => {
  if (rank <= charmDistances.length) return charmDistances[rank - 1];
  const lastIdx = charmDistances.length - 1;
  const step = charmDistances[lastIdx] - (charmDistances[lastIdx - 1] ?? 0);
  return charmDistances[lastIdx] + step * (rank - charmDistances.length);
};

// Default charm lean (matches the original fixed NAME_PENDANT_CHARM_TILT
// convention: right side leans +, left side leans -) used whenever a side
// doesn't specify its own tiltDeg.
const DEFAULT_CHARM_TILT_DEG = (NAME_PENDANT_CHARM_TILT * 180) / Math.PI;

function getChainAngleCharmTransform(sideRank, isLeft, chainOffsetX, angleCfg) {
  const sideCfg = isLeft ? angleCfg.left : angleCfg.right;
  const { angleDeg, anchor, charmDistances, tiltDeg } = sideCfg;

  const angleRad  = (angleDeg * Math.PI) / 180;
  const distance  = getChainDistanceForRank(sideRank, charmDistances);
  const sign      = isLeft ? -1 : 1;

  const [anchorX, anchorY] = anchor;
  const sideChainOffset = isLeft ? chainOffsetX.left : chainOffsetX.right;

  // The anchor (distance 0) is the only point tied to the moving chain —
  // shifting IT by the live chainOffsetX is what makes the whole line, and
  // every charm on it, slide out together as the pendant text grows.
  // Apply the fixed inward clearance after the live chain displacement. This
  // removes the small visual gap without weakening the character-specific
  // first/last-letter rules from NAME_CHAR_CONFIG.
  const baseAnchorX = anchorX * sign + sideChainOffset.x - sign * NAME_PENDANT_CHARM_SIDE_INSET;

  // Walk `distance` further out along this side's own fixed angle from there.
  const dx = distance * Math.cos(angleRad) * sign;
  const dy = distance * Math.sin(angleRad);

  const resolvedTiltDeg = tiltDeg ?? DEFAULT_CHARM_TILT_DEG;

  return {
    // Keep the calibrated vertical link distance. The model's Z adjustments
    // control depth, while the charm artwork already has its own drop height.
    position: [baseAnchorX + dx, anchorY + dy, 0.24],
    // small aesthetic lean toward the chain, not the full chain angle —
    // charms still hang ~vertically from their own bail.
    rotation: [0, 0, resolvedTiltDeg * (Math.PI / 180) * sign],
  };
}

const ZERO_CHAIN_BRACELET_OFFSET = { leftX: 0, leftZ: 0, rightX: 0, rightZ: 0 };

// ─── Washers the name-bracelet way (`inkWashers`) ────────────────────────────
// Same method as the generated name bracelet (bracelet/NameChain.jsx): the
// text's real outline is measured (TextBoundsProbe), the washers sit at the
// middle of the lettering's x-height (median outline height, so one tall
// capital or ascender doesn't lift them) and at the leftmost / rightmost ink
// within a band around that height (so swashes and descenders elsewhere don't
// push them out), overlapping the first / last stroke by a fixed amount. No
// per-letter tuning (NAME_CHAR_CONFIG) involved.
// Same proportions to the text size as the bracelet (0.35 / 0.056 of 0.28).
const INK_WASHER_BAND_RATIO = 0.35;
const INK_WASHER_OVERLAP_RATIO = 0.2;
// ─── NamePendant ──────────────────────────────────────────────────────────────
// `positionY` / `positionZ` override the per-model NAME_PENDANT_POSITIONS
// entry. The name chains leave them out and sit at their tuned spot; a drape
// chain passes them in so the pendant hangs exactly on the generated chain.
// `onWashersChange` reports where the two washers ended up (X in the scene,
// Y/Z as offsets from the pendant's own origin, so the caller can solve for
// the origin without a feedback loop).
const NamePendant = ({
  pendant, braceletPath, materialProps, onBoundsChange,
  positionY, positionZ, pendantScale = 1, onWashersChange,
  inkWashers = false,
}) => {
  const cleanText  = sanitizePendantText(pendant.text || '');
  const isActive   = Boolean(pendant.enabled) && cleanText.length > 0;
  const groupRef   = useRef();
  // Bounds are measured off this ref, NOT groupRef — groupRef also contains
  // the two washers, and their position is itself derived from the last
  // measured bounds. Measuring groupRef would fold the (possibly stale)
  // washers into the box: on a shrink, the washer from the longer name
  // sticks out further right than the new, shorter text, so the box could
  // never report anything smaller than "wherever the washer currently is"
  // — a self-locking loop where the chain's anchor could never shrink back.
  // Measuring just the text mesh avoids that entirely.
  const textRef    = useRef();
  const [centeredX,      setCenteredX]     = useState(0);
  const [measuredBounds, setMeasuredBounds] = useState(null);
  // inkWashers: the text's own outline measurement (see TextBoundsProbe). The
  // last good one is kept while a new name is measured, so the chain never
  // snaps back to its bare curve mid-typing.
  const [inkBounds, setInkBounds] = useState(null);

  const fontUrl    = NAME_FONT_URLS[pendant.fontStyle] || NAME_FONT_URLS.dancing;
  const sizeConfig = NAME_SIZE_CONFIG;
  const appliedSpacing = NAME_FONT_LETTER_SPACING[pendant.fontStyle] ?? DEFAULT_LETTER_SPACING;

  const _fontCharMap = NAME_CHAR_CONFIG[pendant.fontStyle] ?? {};

  // ── First character → drives LEFT washer + LEFT chain ──────────────────────
  const _firstChar    = cleanText[0] ?? '';
  const _firstCharCfg = _fontCharMap[_firstChar] ?? ZERO_CHAR_CONFIG;

  // ── Last character → drives RIGHT washer + RIGHT chain ─────────────────────
  const _lastChar    = cleanText[cleanText.length - 1] ?? '';
  const _lastCharCfg = _fontCharMap[_lastChar] ?? ZERO_CHAR_CONFIG;




  // Text/font/size changing does NOT clear the measured bounds anymore.
  // It used to reset them to null on every keystroke, which dropped
  // `washersReady`/the published washers to null for the few frames
  // BoundsMeasurer takes to re-settle — and that, in turn, dropped the
  // chain's pendant anchors, so the chain snapped back to its bare curve
  // and then re-bent around the name on every single character typed.
  // Instead we keep rendering (and hanging the chain off) the last good
  // measurement until BoundsMeasurer reports a new stable one via
  // handleMeasured, which replaces centeredX/measuredBounds together in
  // one atomic update — so the chain only re-shapes once, when the new
  // name is actually ready, never mid-typing.
  const measureGeneration = useRef(0);
  useEffect(() => {
    measureGeneration.current += 1;
  }, [cleanText, pendant.fontStyle, pendant.size]);

  useEffect(() => {
    if (!pendant.enabled || cleanText.length === 0) onBoundsChange?.(null);
  }, [pendant.enabled, cleanText, onBoundsChange]);

  const handleMeasured = (bounds) => {
    if (!bounds) { onBoundsChange?.(null); return; }
    const measuredCenter = (bounds.left + bounds.right) / 2;
    setCenteredX((prev) => prev - measuredCenter);
    const halfWidth = (bounds.right - bounds.left) / 2;
    const reported  = { left: -halfWidth, right: +halfWidth, centerX: 0 };
    setMeasuredBounds(reported);
    onBoundsChange?.(reported);
  };

  const placement = NAME_PENDANT_POSITIONS[braceletPath];
  const FIXED_Y   = positionY ?? placement?.y        ?? -1.2;
  const FIXED_Z   = positionZ ?? placement?.z        ?? 0.08;
  const rotation  = placement?.rotation ?? [0, 0, 0];
  const depArray  = [cleanText, pendant.fontStyle, pendant.size, pendantScale];

  // ── LEFT washer position ───────────────────────────────────────────────────
  // X: base left edge + sizeConfig offset + per-first-char leftWasherX nudge
  // Z (Y in UI): base loopZ + per-first-char leftWasherY nudge
  // Y (height): base loopY from sizeConfig + per-first-char loopYMultiplier (kept for compat)
  let leftLoopY  = sizeConfig.size * (sizeConfig.loopYMultiplier)  + (_firstCharCfg.leftWasherY ?? 0);
  const leftLoopZ  = sizeConfig.height + sizeConfig.loopZOffset;
  // The washer sits in the pendant's own (unscaled) design space, so the
  // measured edge — which is a real scene measurement — is divided back down
  // by whatever scale the pendant is drawn at.
  let leftWasherX = measuredBounds
    ? (measuredBounds.left - centeredX) / pendantScale + sizeConfig.leftOffset + (_firstCharCfg.leftWasherX ?? 0)
    : 0;

  // ── RIGHT washer position ──────────────────────────────────────────────────
  let rightLoopY  = sizeConfig.size * (sizeConfig.loopYMultiplier) + (_lastCharCfg.rightWasherY ?? 0);
  const rightLoopZ  = sizeConfig.height + sizeConfig.loopZOffset ;
  let rightWasherX = measuredBounds
    ? (measuredBounds.right - centeredX) / pendantScale + sizeConfig.rightOffset + (_lastCharCfg.rightWasherX ?? 0)
    : 0;

  // inkWashers: the text is centred on its ink band inside the pendant (so
  // the pendant's own origin is the name's centre) and each washer sits on
  // the first / last letter at the x-height middle - see INK_WASHER_*.
  let textOffsetX = 0;
  let groupX = centeredX;
  if (inkWashers && inkBounds) {
    const halfInk = (inkBounds.inkRight - inkBounds.inkLeft) / 2;
    const anchorX = halfInk + WASHER_BAIL_DIMENSIONS.outerRadius
      - sizeConfig.size * INK_WASHER_OVERLAP_RATIO;
    textOffsetX = -(inkBounds.inkLeft + inkBounds.inkRight) / 2;
    groupX = 0;
    leftWasherX = -anchorX;
    rightWasherX = anchorX;
    leftLoopY = inkBounds.midY;
    rightLoopY = inkBounds.midY;
  }

  // Washer X is reported in scene space (the pendant self-centres, so
  // centeredX cancels out of it); Y and Z stay as offsets from the pendant's
  // origin, which is what a caller needs to place that origin.
  const washersReady = Boolean(inkWashers ? inkBounds : measuredBounds) && isActive;
  useEffect(() => {
    if (!onWashersChange) return;
    if (!washersReady) { onWashersChange(null); return; }
    // Reported in scene units, i.e. with the pendant's scale already applied —
    // the caller places the chain around it and does not care how the pendant
    // is drawn internally.
    onWashersChange({
      left:  {
        x: groupX + leftWasherX * pendantScale,
        offsetY: leftLoopY * pendantScale,
        offsetZ: leftLoopZ * pendantScale,
      },
      right: {
        x: groupX + rightWasherX * pendantScale,
        offsetY: rightLoopY * pendantScale,
        offsetZ: rightLoopZ * pendantScale,
      },
    });
  }, [washersReady, groupX, leftWasherX, rightWasherX, pendantScale,
      leftLoopY, rightLoopY, leftLoopZ, rightLoopZ, onWashersChange]);

  if (!isActive) return null;

  return (
    <>
      <group ref={groupRef} position={[groupX, FIXED_Y, FIXED_Z]} rotation={rotation}>
        <group scale={pendantScale}>
        <group ref={textRef} position={[textOffsetX, 0, 0]}>
          <Suspense fallback={null}>
            <KernedText3D
              font={fontUrl}
              size={sizeConfig.size}
              height={sizeConfig.height}
              curveSegments={24}
              bevelEnabled
              bevelThickness={sizeConfig.bevel}
              bevelSize={sizeConfig.bevel * 0.5}
              bevelSegments={6}
              letterSpacing={appliedSpacing}
            >
              {cleanText}
              <meshPhysicalMaterial
                {...ringMetalProps(materialProps.color || '#ECC875')}
                side={THREE.DoubleSide}
              />
            </KernedText3D>
          </Suspense>
        </group>

        {/* Left washer — ink measurement (inkWashers) or first-character config */}
        {(inkWashers ? inkBounds : measuredBounds) && (
          <WasherBail
            position={[leftWasherX, leftLoopY, leftLoopZ]}
            materialProps={materialProps}
          />
        )}

        {/* Right washer — ink measurement (inkWashers) or last-character config */}
        {(inkWashers ? inkBounds : measuredBounds) && (
          <WasherBail
            position={[rightWasherX, rightLoopY, rightLoopZ]}
            materialProps={materialProps}
          />
        )}
        </group>
      </group>

      <BoundsMeasurer
        targetRef={textRef}
        onMeasured={handleMeasured}
        deps={depArray}
      />
      {inkWashers && (
        <TextBoundsProbe
          targetRef={textRef}
          onMeasured={setInkBounds}
          band={sizeConfig.size * INK_WASHER_BAND_RATIO}
          deps={[cleanText, pendant.fontStyle]}
        />
      )}
    </>
  );
};

// ─── NamePendantNecklace ─────────────────────────────────────────────────────
// The whole name-pendant half of the scene in one component: the GLB chain,
// the 3D name hanging in the middle of it, and the optional charm that hangs
// off the name. It owns the measurement loop that turns the rendered name's
// width into how far each chain group slides outward, and publishes the
// resulting offset upward (onChainOffsetChange) so the charms rendered by
// Necklace.jsx can ride the same moving chains.
const NamePendantNecklace = ({
  braceletPath,
  namePendant,
  pendantCharm,
  materialProps,
  materialPropsBracelet,
  texture,
  scale,
  onChainOffsetChange,
  onLoaded,
}) => {
  const [pendantBounds, setPendantBounds] = useState(null);
  const [defaultChainPositions, setDefaultChainPositions] = useState(null);
  const [chainResetKey] = useState(0);

  const braceletScale = BRACELET_POSITIONS[braceletPath]?.scale || [scale, scale, scale];
  const modelScaleX   = Array.isArray(braceletScale) ? braceletScale[0] : braceletScale;

  // ─── Per-character chain adjustments ─────────────────────────────────────
  const cleanText = sanitizePendantText(namePendant.text || '');
  const hasActiveNamePendant = namePendant.enabled && cleanText.length > 0;
  const _fontCharMap = NAME_CHAR_CONFIG[namePendant.fontStyle] ?? {};
  const sizeConfig = NAME_SIZE_CONFIG;

  const _firstCharCfg = _fontCharMap[cleanText[0] ?? ''] ?? ZERO_CHAR_CONFIG;
  const _lastCharCfg  = _fontCharMap[cleanText[cleanText.length - 1] ?? ''] ?? ZERO_CHAR_CONFIG;
  const chainBraceletCfg = CHAIN_POSITION_BY_BRACELET[braceletPath] ?? ZERO_CHAIN_BRACELET_OFFSET;

  // ─── Chain X placement ────────────────────────────────────────────────────
  const chainRightX = hasActiveNamePendant && pendantBounds
    ? (-pendantBounds.left / modelScaleX) - CHAIN_INNER_EDGE - 0.4
        + (_lastCharCfg.rightChainX ?? 0)
        + chainBraceletCfg.rightX
    : null;

  const chainLeftX = hasActiveNamePendant && pendantBounds
    ? (pendantBounds.right / modelScaleX) - CHAIN_INNER_EDGE - 0.4
        + (_firstCharCfg.leftChainX ?? 0)
        + chainBraceletCfg.leftX
    : null;

  const chainLeftZ = hasActiveNamePendant
    ? ((_firstCharCfg.leftChainY ?? 0) !== 0 ? (_firstCharCfg.leftChainY ?? 0) : 0)
      + sizeConfig.chainLeftZOffset
      + chainBraceletCfg.leftZ
    : null;

  const chainRightZ = hasActiveNamePendant
    ? ((_lastCharCfg.rightChainY ?? 0) !== 0 ? (_lastCharCfg.rightChainY ?? 0) : 0)
      + sizeConfig.chainRightZOffset - 0.6
      + chainBraceletCfg.rightZ
    : null;

  const chainOffsetX = useMemo(() => {
    const zero = { x: 0, y: 0 };
    if (!defaultChainPositions) return { left: zero, right: zero };
    const visibleLeftChainX = chainLeftX != null
      ? chainLeftX
      : defaultChainPositions.right.x;
    const visibleRightChainX = chainRightX != null
      ? -chainRightX
      : defaultChainPositions.left.x;
    return {
      left: {
        x: -(visibleLeftChainX - defaultChainPositions.right.x) * modelScaleX,
        y: 0,
      },
      right: {
        x: -(visibleRightChainX - defaultChainPositions.left.x) * modelScaleX,
        y: 0,
      },
    };
  }, [chainRightX, chainLeftX, defaultChainPositions, modelScaleX]);

  // Charms are rendered by Necklace.jsx, so the offset has to travel upward.
  useEffect(() => {
    onChainOffsetChange?.(chainOffsetX);
  }, [chainOffsetX, onChainOffsetChange]);

  return (
    <>
      <GLBModel
        path={braceletPath}
        position={BRACELET_POSITIONS[braceletPath]?.position || [0, 0, 0]}
        rotation={BRACELET_POSITIONS[braceletPath]?.rotation || [0, 0, 0]}
        scale={BRACELET_POSITIONS[braceletPath]?.scale || [scale, scale, scale]}
        materialProps={materialPropsBracelet}
        texture={texture}
        chainLeft={chainRightX}
        chainRight={chainLeftX}
        chainLeftZ={chainRightZ}
        chainRightZ={chainLeftZ}
        chainResetKey={chainResetKey}
        onLoaded={onLoaded}
        onChainDefaults={setDefaultChainPositions}
      />

      <NamePendant
        pendant={namePendant}
        braceletPath={braceletPath}
        materialProps={materialProps}
        onBoundsChange={setPendantBounds}
      />

      <PendantCharmModel
        charm={pendantCharm}
        braceletPath={braceletPath}
        materialProps={{
          ...materialProps,
          color: pendantCharm.bodyColor || materialProps.color,
        }}
        pendantText={namePendant.text}
        pendantFontStyle={namePendant.fontStyle}
      />
    </>
  );
};

export const ZERO_CHAIN_OFFSET = { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } };

// ─── DrapeNamePendant ────────────────────────────────────────────────────────
// The same name pendant, hung from a generated drape chain (BRACELET15-18)
// instead of a GLB name chain. Nothing about the pendant itself changes: it
// still measures its own text and puts a washer at each end. What changes is
// who moves for whom — on a name chain the chain slides to fit the name; here
// the name is placed onto the chain's own curve, and the chain is then rebuilt
// as two halves that END on the two washers, so it literally hangs from them.
//
//   1. the pendant reports its washers (X in the scene, Y/Z as offsets)
//   2. the chain's curve is sampled at those X's to find the depth there
//   3. the pendant's origin is set so it hangs at that depth
//   4. the washers' resulting world positions are published upward as the
//      chain's two inner anchors
//
// Step 2 uses no value that depends on the pendant's own origin, so there is
// no feedback loop between the pendant and the chain.

// Extra sink below the chain line, if the name should hang lower than the
// links it replaces. 0 == the name sits right on the drape's own curve.
const DRAPE_PENDANT_DROP = 0;
// The name chains are built around their name, so it is drawn full size there.
// On a drape chain it is one element hanging from a plain chain, so it reads
// better a little smaller — text and washers together.
const DRAPE_PENDANT_SCALE = 0.8;
// Fallback washer height for the very first frame, before the text has been
// measured — keeps the name from appearing elsewhere and then jumping.
const DRAPE_PENDANT_FALLBACK_WASHER_Y =
  NAME_SIZE_CONFIG.size * NAME_SIZE_CONFIG.loopYMultiplier * DRAPE_PENDANT_SCALE;

const DrapeNamePendant = ({
  braceletPath,
  namePendant,
  materialProps,
  drapeCfg,
  dropKey,
  onAnchorsChange,
}) => {
  const [washers, setWashers] = useState(null);
  const dropRef = useRef();
  const { clock } = useThree();

  // The chain does not play its entrance while a name hangs in it (the name
  // cannot be measured in time to drop with it, so the whole piece is drawn at
  // rest — see ChainDrape's animateFall). The hook stays, driven straight onto
  // the group rather than through state, so if the entrance is ever turned
  // back on here the 3D name is still never rebuilt mid-swing.
  const animateDrop = false;
  useFrame(() => {
    if (!dropRef.current) return;
    dropRef.current.position.y = drapeCfg
      ? chainDropOffsetAt(0.5, dropKey, clock.elapsedTime, animateDrop)
      : 0;
  });

  // Where the pendant's own origin has to sit for it to hang on the chain's
  // curve. Before the first measurement the belly of the chain stands in for
  // both washers.
  const placement = useMemo(() => {
    if (!drapeCfg) return null;
    const leftPoint  = getChainPointAtX(drapeCfg, washers ? washers.left.x  : 0);
    const rightPoint = getChainPointAtX(drapeCfg, washers ? washers.right.x : 0);
    if (!leftPoint || !rightPoint) return null;
    const chainY = (leftPoint[1] + rightPoint[1]) / 2;
    const chainZ = (leftPoint[2] + rightPoint[2]) / 2;
    const washerY = washers
      ? (washers.left.offsetY + washers.right.offsetY) / 2
      : DRAPE_PENDANT_FALLBACK_WASHER_Y;
    const washerZ = washers ? (washers.left.offsetZ + washers.right.offsetZ) / 2 : 0;
    return { y: chainY - washerY - DRAPE_PENDANT_DROP, z: chainZ - washerZ };
  }, [drapeCfg, washers]);

  // The two washers in scene space. This is where the chain has to end, and
  // the chain is rendered by Necklace.jsx, so it travels back up there.
  const anchors = useMemo(() => {
    if (!washers || !placement) return null;
    return {
      left:  [washers.left.x,  placement.y + washers.left.offsetY,  placement.z + washers.left.offsetZ],
      right: [washers.right.x, placement.y + washers.right.offsetY, placement.z + washers.right.offsetZ],
      // The washers' real size, in scene units. The chain needs it to end ON
      // them - to know how far short of the centre to stop, and how deep the
      // ring it has to thread actually sits.
      washer: {
        outer: WASHER_BAIL_DIMENSIONS.outerRadius * DRAPE_PENDANT_SCALE,
        inner: WASHER_BAIL_DIMENSIONS.innerRadius * DRAPE_PENDANT_SCALE,
        depth: WASHER_BAIL_DIMENSIONS.depth * DRAPE_PENDANT_SCALE,
      },
    };
  }, [washers, placement]);

  useEffect(() => { onAnchorsChange?.(anchors); }, [anchors, onAnchorsChange]);
  useEffect(() => () => onAnchorsChange?.(null), [onAnchorsChange]);

  return (
    <group ref={dropRef}>
      <NamePendant
        pendant={namePendant}
        braceletPath={braceletPath}
        materialProps={materialProps}
        positionY={placement?.y}
        positionZ={placement?.z}
        pendantScale={DRAPE_PENDANT_SCALE}
        onWashersChange={setWashers}
        inkWashers
      />
    </group>
  );
};


export {
  NamePendantNecklace,
  DrapeNamePendant,
  NAME_SIZE_CONFIG,
  ZERO_CHAR_CONFIG,
  NAME_PENDANT_POSITIONS,
  CHAIN_INNER_EDGE,
  CHAIN_POSITION_BY_BRACELET,
  ZERO_CHAIN_BRACELET_OFFSET,
  CHAIN_ANGLE_CONFIG,
  getNamePendantCharmPlacement,
  getChainAngleCharmTransform,
  GLBModel,
  PendantCharmModel,
  NamePendant,
  BoundsMeasurer,
};
