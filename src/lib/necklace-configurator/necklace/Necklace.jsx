// ─── Necklace scene ──────────────────────────────────────────────────────────
// The shared stage: canvas, lights, camera, charm list and the chain-length /
// share plumbing. It owns nothing chain-specific — the two families of chain
// live in their own files and this file just picks one:
//
//   NamePendantChain.jsx — BRACELET13/14, a GLB chain with a 3D name pendant
//                          hanging in the middle (NAME_PENDANT_SUPPORTED_PATHS)
//   DrapeChain.jsx       — BRACELET15-18, a procedurally generated link chain
//                          draped between two anchors, no name pendant
//
// Charm components (shared by both) live in NecklaceCharms.jsx, and the bits
// both chain families need in necklaceShared.jsx.
import React, { useState, useEffect, useContext, useRef, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useThree, useFrame, useLoader } from '@react-three/fiber';
import { Environment, OrbitControls, SoftShadows } from '@react-three/drei';
import { RGBELoader } from 'three-stdlib';
import { RING_METAL_ENV_URL, RING_TONE_MAPPING_EXPOSURE, JEWELRY_ENV_INTENSITY } from '../shared/metalMaterial';
import RingLightRig from '../shared/RingLightRig';
import * as THREE from 'three';
import { ToastContainer } from 'react-toastify';
import { BraceletContext } from '../contexts/BraceletContext';
import { CameraController } from '../shared/CameraControll';
import { Capture } from '../shared/Capture';
import {
  CHARMS, BRACELET_POSITIONS, NAME_PENDANT_SUPPORTED_PATHS, NAME_CHAIN_PATHS,
  DEFAULT_CHAIN_LENGTH, MAX_CHARMS_BY_NECKLACE, STONE_COLOR_SWATCHES,
} from '../shared/assets';
import { ShareContext } from '../contexts/ShareContext';
import { View360Context } from '../contexts/View360Context';
import { Base64 } from 'js-base64';
// NamePendantNecklace (GLB chain BRACELET13/14) removed - no longer used.
import { /* NamePendantNecklace, */ DrapeNamePendant, ZERO_CHAIN_OFFSET } from './NamePendantChain';
import {
  CHAIN_DRAPE_CONFIG, CHAIN_LENGTH_MULTIPLIERS, getSizedDrapeConfig, getDrapePoint,
  getChainCharmTransform, getSeamCharmSlots, getChainSeamX, ChainDrape, ChainSagAnimator,
  resetChainFallAnimation,
} from './DrapeChain';
import {
  buildCharmKeys, NecklaceImageCharm, NecklaceInitialCharm, NecklaceGemstoneCharm,
} from './NecklaceCharms';

// The ring configurator's metal reflection map (see shared/metalMaterial.js).
const HDR_ENVIRONMENT_URL = RING_METAL_ENV_URL;
if (typeof window !== 'undefined') {
  useLoader.preload(RGBELoader, HDR_ENVIRONMENT_URL);
}

// ─── CameraResetter ───────────────────────────────────────────────────────────
// `position` (the style's default view) wins over resetObj.position, so every
// reset - the Reset button, switching category - lands on the same framing as
// the first load instead of the generic [0, 0.5, 6.5].
function CameraResetter({ resetObj, lookAt = [0, -1, 0], position, onReset }) {
  const { camera } = useThree();
  const orbitControlsRef = useThree((state) => state.controls);
  useEffect(() => {
    if (!camera) return;
    const pos = position ?? resetObj?.position ?? [0, 0.8, 6.8];
    camera.position.set(...pos);
    camera.lookAt(...lookAt);
    camera.updateProjectionMatrix();
    if (orbitControlsRef) {
      orbitControlsRef.target.set(...lookAt);
      orbitControlsRef.update();
    }
    onReset?.();
  }, [resetObj, camera, lookAt, position, orbitControlsRef, onReset]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// Reports the canvas width/height ratio up to Necklace (lives inside <Canvas>).
function CanvasAspectReporter({ onChange }) {
  const size = useThree((state) => state.size);
  useEffect(() => {
    if (size.width > 0 && size.height > 0) onChange(size.width / size.height);
  }, [size.width, size.height, onChange]);
  return null;
}

// The desktop views were framed in a wide preview (about 1.28 : 1). The
// ring-style layout gives the preview the full height of the builder, so it
// is narrower than that and the chain ran off both sides. Below this ratio the
// camera (and its zoom limits) pull back by NECKLACE_FIT_ASPECT / aspect.
const NECKLACE_FIT_ASPECT = 1.28;
const scaleFromTarget = (position, target, factor) =>
  position.map((v, i) => target[i] + (v - target[i]) * factor);
// Drape chains (desktop): a near-level eye point at chest height, matched to
// the view picked on screen (16" with a name pendant) - camera ~y 3.35 at
// 7 units (the zoom-in limit), looking at y 3.25. Compared with the original
// (y 4.5, looking at 3.8) it sits lower, so the name hangs closer to eye level
// and reads upright instead of tipped back, while the clasp ends still sit at
// the top of the frame.
const NECKLACE_CAMERA_DEFAULTS = {
  // Raised 0.6 with the ring-style layout (camera + target together, so the
  // angle is unchanged) - the chain sits a little lower in the taller preview
  // and its clasp ends clear the 360 / view / reset buttons.
  drape:       { position: [0, 3.95, 7], target: [0, 3.85, 0] },
  drapeMobile: { position: [0, 0.5, 16.5], target: [0, 3.8, 0] },
  pendant:     { position: [0, 0.5, 6.5], target: [0, 1.2, 0] },
};
function EnvironmentReadyNotifier({ onReady }) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return null;
}

// ─── FirstLoadGate ────────────────────────────────────────────────────────────
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

const Necklace = () => {
const {
  braceletPath, charms, setCharms,
  lastCharmTemplate,
  selectedBracelet,
  braceletMetal, charmMetal,
  materialPropsBracelet, texture,
  setHighlightedIndex, highlightedIndex,
  setSelectedIndex, materialProps,
  namePendant, pendantCharm, cameraView, setCameraView,
  capture, resetObj, setResetObj,
  chainZOffsets,
  chainLength,
} = useContext(BraceletContext);

  const { share, setShare, setShareUrl } = useContext(ShareContext);
  const { view360 }                      = useContext(View360Context);
  const [parentUrl, setParentUrl]        = useState(null);

  const [scale]          = useState(30);
  const groupRef         = useRef();
  const orbitControlsRef = useRef();

  // Which family of chain is on screen. A name chain (BRACELET13/14) renders
  // NamePendantNecklace — a GLB chain built around the name. Everything else
  // is a drape chain, generated link by link from its CHAIN_DRAPE_CONFIG
  // entry, which takes the same name pendant by hanging it from its own
  // washers (DrapeNamePendant) and cutting the links behind it away.
  const isNameChain = NAME_CHAIN_PATHS.includes(braceletPath);
  const supportsNamePendant = NAME_PENDANT_SUPPORTED_PATHS.includes(braceletPath);
  const namePendantActive =
    supportsNamePendant && Boolean(namePendant.enabled) && Boolean((namePendant.text || '').trim());
  const resolvedChainLength = chainLength ?? DEFAULT_CHAIN_LENGTH;
  const drapeCfgBase = CHAIN_DRAPE_CONFIG[braceletPath];
  const drapeCfg = useMemo(
    () => getSizedDrapeConfig(drapeCfgBase, resolvedChainLength),
    [drapeCfgBase, resolvedChainLength],
  );

  // Published upward by NamePendantNecklace once it has measured the name, so
  // the charms below can hang off wherever the chains actually ended up.
  const [chainOffsetX, setChainOffsetX] = useState(ZERO_CHAIN_OFFSET);
  const handleChainOffsetChange = useCallback((offset) => setChainOffsetX(offset), []);
  useEffect(() => {
    if (!isNameChain) setChainOffsetX(ZERO_CHAIN_OFFSET);
  }, [isNameChain]);

  // Published upward by DrapeNamePendant: the two washers the name hangs from.
  // The chain is rebuilt to end on them, and the charms lay themselves out
  // around the stretch of chain they take up.
  const [pendantAnchors, setPendantAnchors] = useState(null);
  const handlePendantAnchorsChange = useCallback((anchors) => setPendantAnchors(anchors), []);
  useEffect(() => {
    if (!drapeCfgBase || !namePendantActive) setPendantAnchors(null);
  }, [drapeCfgBase, namePendantActive]);

  useEffect(() => {
    resetChainFallAnimation();
    return () => resetChainFallAnimation();
  }, []);

  const [animatedSag, setAnimatedSag] = useState(null);
  // Cleared for a new chain, and whenever a name pendant appears or goes away:
  // the pendant path ignores the animated sag, so whatever value it was left
  // holding is stale, and falling back to it for a frame would show as a jump.
  useEffect(() => { setAnimatedSag(null); }, [drapeCfg, namePendantActive]);
  const animatedDrapeCfg = useMemo(() => {
    if (!drapeCfg || animatedSag == null) return drapeCfg;
    return { ...drapeCfg, sag: animatedSag };
  }, [drapeCfg, animatedSag]);

  // The chain everything downstream reads: same drape, plus the washers the
  // name pendant hangs from. One shared object, so the rendered links, the
  // charm layout and the charms themselves can never disagree about where the
  // chain stops and the pendant starts.
  //
  // With a pendant the chain is anchored on the washers and runs in straight
  // spans between its attachment points, so the settling-sag animation has
  // nothing left to shape — it is skipped entirely (see ChainSagAnimator
  // below) and the resting drape is used as-is. That also keeps the anchors
  // still: they are published up from the pendant through state, so animating
  // the shape underneath them would leave the chain's ends chasing the name by
  // a frame. The entrance for a pendant chain is the per-link drop instead,
  // which the pendant itself rides in step (see DrapeNamePendant).
  const chainCfg = useMemo(
    () => {
      if (!animatedDrapeCfg) return animatedDrapeCfg;
      if (!pendantAnchors) return animatedDrapeCfg;
      return { ...drapeCfg, pendantAnchors };
    },
    [animatedDrapeCfg, drapeCfg, pendantAnchors],
  );

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
  const [canvasAspect, setCanvasAspect] = useState(0);
  // Desktop only - the mobile views have their own framing. Rounded so small
  // resizes don't keep re-framing the camera.
  const fitFactor = !isMobile && canvasAspect > 0
    ? Math.round(Math.max(1, NECKLACE_FIT_ASPECT / canvasAspect) * 20) / 20
    : 1;
  const baseCameraDefaults = drapeCfg
    ? (isMobile ? NECKLACE_CAMERA_DEFAULTS.drapeMobile : NECKLACE_CAMERA_DEFAULTS.drape)
    : NECKLACE_CAMERA_DEFAULTS.pendant;
  const cameraDefaults = useMemo(() => (fitFactor === 1
    ? baseCameraDefaults
    : {
      ...baseCameraDefaults,
      position: scaleFromTarget(baseCameraDefaults.position, baseCameraDefaults.target, fitFactor),
    }), [baseCameraDefaults, fitFactor]);

  const groupPosY = drapeCfg ? -1.5 : -3;
  const charmCenterY = useMemo(() => {
    if (!drapeCfg) return 1.0;
    const bottomPt = getDrapePoint(0.5, drapeCfg.left, drapeCfg.right, drapeCfg.sag, drapeCfg.depthScale ?? 1);
    return bottomPt[1] + groupPosY - 0.35;
  }, [drapeCfg, groupPosY]);

  // Zoom distance calibrated to frame the charms cleanly as shown in user reference
  const zoomDistance = useMemo(() => {
    return 5.3 * (isMobile ? 1.25 : fitFactor);
  }, [isMobile, fitFactor]);

  const necklaceViewPositions = useMemo(() => ({
    front_zoom: {
      position: [0, charmCenterY - 1.2, 0.24 + zoomDistance],
      target: [0, charmCenterY - 1.3, 0.24],
    },
    back_zoom: {
      position: [0, charmCenterY - 1.2, 0.24 - zoomDistance],
      target: [0, charmCenterY - 1.3, 0.24],
    },
    normal: {
      position: cameraDefaults.position,
      target: cameraDefaults.target,
    },
  }), [charmCenterY, zoomDistance, cameraDefaults]);

  const [isZoomedMode, setIsZoomedMode] = useState(false);

  useEffect(() => {
    if (cameraView === "front_zoom" || cameraView === "back_zoom") {
      setIsZoomedMode(true);
    } else if (cameraView === "normal" || cameraView === "" || cameraView == null) {
      setIsZoomedMode(false);
    }
  }, [cameraView]);

  useEffect(() => {
    setIsZoomedMode(false);
  }, [braceletPath]);

  const handleResetViewMode = useCallback(() => {
    setIsZoomedMode(false);
  }, []);

  // When in normal view, minDistance is locked at the full view distance (7.0 * fitFactor)
  // so the user cannot scroll-zoom in and cut the edges of the necklace.
  // The max zoom limit is only accessible through the view button (zoomed views).
  const normalMinDistance = (drapeCfg ? 7.0 : 6.5) * fitFactor;
  const currentMinDistance = isZoomedMode ? (4.9 * fitFactor) : normalMinDistance;
  const currentMaxDistance = isZoomedMode
    ? (6.2 * fitFactor)
    : ((drapeCfg ? (isMobile ? 11 : 9.5) * (CHAIN_LENGTH_MULTIPLIERS[resolvedChainLength] ?? 1) : 10) * fitFactor);

  useEffect(() => {
    setResetObj((prev) => ({ ...prev, position: cameraDefaults.position }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [braceletPath]);

  useEffect(() => {
    const h = e => { if (e.data?.parentUrl) setParentUrl(e.data.parentUrl); };
    window.addEventListener('message', h);
    return () => window.removeEventListener('message', h);
  }, []);

  useEffect(() => {
    if (!share) return;
    const config = {
      type:          'pendant',
      selectedBracelet,
      braceletPath,
      braceletMetal,
      charmMetal,
      charms,
      namePendant,
      pendantCharm,
      cameraView,
    };
    let encoded;
    try { encoded = Base64.encode(JSON.stringify(config)); } catch { return; }

    const url = parentUrl
      ? new URL(parentUrl)
      : new URL(window.location.href);
    url.search = '';
    url.searchParams.set('config', encoded);

    setShareUrl(url.toString());
    setShare(false);
  }, [share, selectedBracelet, braceletPath, braceletMetal, charmMetal, charms,
    namePendant, pendantCharm, cameraView, parentUrl]);

  const deleteCharm = (index) => setCharms(charms.filter((_, i) => i !== index));

  const [firstBraceletLoaded, setFirstBraceletLoaded] = useState(false);
  const [envLoaded, setEnvLoaded] = useState(false);
  const handleEnvReady = useCallback(() => {
    setEnvLoaded(true);
  }, []);
  const handleBraceletLoaded = useCallback(() => setFirstBraceletLoaded(true), []);

  useEffect(() => {
    setFirstBraceletLoaded(Boolean(drapeCfg));
  }, [braceletPath, drapeCfg]);

  const isSceneReady = envLoaded && (drapeCfg ? true : firstBraceletLoaded);

  // ─── Hold the chain's shape until charm models are actually loaded ───────
  // A charm goes into state the instant it is picked, but its GLB/texture
  // takes a moment to arrive and the component renders nothing until it
  // does. The chain, meanwhile, was re-shaping off the raw charm COUNT — so
  // the drape visibly kicked into its new bend while the charm itself was
  // still missing, then the charm popped in afterwards.
  //
  // Charms now report upward when their model is ready, and only those
  // charms are laid out. A charm still loading is rendered (that is what
  // makes it load) but is invisible and contributes nothing to the layout,
  // so the bend and the charm appear in the same frame.
  const placedCharms = useMemo(() => charms.filter(Boolean), [charms]);
  const charmKeys = useMemo(() => buildCharmKeys(placedCharms), [placedCharms]);
  const charmKeysSignature = charmKeys.join('~');

  const [readyCharmKeys, setReadyCharmKeys] = useState(() => new Set());

  const markCharmReady = useCallback((key) => {
    setReadyCharmKeys((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }, []);

  // Forget charms that have since been removed, so their keys can't keep a
  // later charm with the same identity from being waited on properly.
  useEffect(() => {
    const live = new Set(charmKeysSignature ? charmKeysSignature.split('~') : []);
    setReadyCharmKeys((prev) => {
      let changed = false;
      const next = new Set();
      prev.forEach((k) => { if (live.has(k)) next.add(k); else changed = true; });
      return changed ? next : prev;
    });
  }, [charmKeysSignature]);

  // Slot each charm gets in the layout, or -1 while it is still loading.
  const charmLayoutSlots = useMemo(() => {
    let n = 0;
    return charmKeys.map((key) => (readyCharmKeys.has(key) ? n++ : -1));
  }, [charmKeys, readyCharmKeys]);

  const loadedCharms = useMemo(
    () => placedCharms.filter((_, i) => charmLayoutSlots[i] >= 0),
    [placedCharms, charmLayoutSlots],
  );
  const charmLayoutTotal = Math.max(loadedCharms.length, 1);

  const drapeCharms = drapeCfg ? loadedCharms : [];

  // Side of the name pendant each laid-out charm hangs on (see
  // getSeamCharmSlots). Only used when the chain has a pendant gap.
  // Keyed on a string so the result - and everything derived from it, like
  // chainCharmAnchors - stays referentially stable between renders.
  const drapeSidesKey = drapeCharms.map((c) => c.chainSide || '-').join(',');
  const drapeSeamSlots = useMemo(
    () => getSeamCharmSlots(drapeSidesKey ? drapeSidesKey.split(',') : []),
    [drapeSidesKey],
  );

  const chainCharmAnchors = useMemo(() => {
    if (!chainCfg) return [];
    return drapeCharms.map((_, i) => getChainCharmTransform(i, drapeCharms.length, chainCfg, drapeSeamSlots[i]).position);
  }, [chainCfg, drapeCharms.length, drapeSeamSlots, braceletPath]);

  // Same positions as above, just narrowed to the charms whose bodies the
  // links have to make room for — derived from that array rather than solved
  // a second time.
  const chainShrinkAnchors = useMemo(() => {
    if (!chainCfg) return [];
    return drapeCharms
      .map((charm, i) => ({ charm, position: chainCharmAnchors[i] }))
      .filter(({ charm, position }) => position
        && (charm.type === 'birthstone' || charm.type === 'diamond'))
      .map(({ position }) => position);
  }, [chainCfg, drapeCharms, chainCharmAnchors]);

  // ─── Click the chain to place another charm ──────────────────────────────
  // Repeats whatever charm was last picked from the panel; before anything
  // has been picked it falls back to a birthstone in the first swatch colour,
  // so a chain tap always does something rather than prompting first.
  //
  // The click's exact spot is not used as a position — charms stay evenly
  // spaced by getChainCharmTransform — but it DOES decide the charm's ORDER
  // in the row. The new charm is spliced in after every charm sitting to its
  // left, so tapping left of the middle puts it on the left and tapping right
  // puts it on the right, instead of everything piling onto the right end.
  // Once the necklace is full the chain simply stops being tappable: no
  // handler, and no invisible hit spheres either — so a tap falls through to
  // whatever is behind instead of being swallowed and silently ignored.
  const chainCharmLimitReached =
    placedCharms.length >= (MAX_CHARMS_BY_NECKLACE[braceletPath] ?? 6);

  const addCharmFromChain = useCallback((clickX) => {
    const template = lastCharmTemplate ?? {
      type: 'birthstone',
      path: CHARMS.find((c) => c.type === 'birthstone')?.path,
      bodyColor: charmMetal,
      gemstoneColor: STONE_COLOR_SWATCHES[0].hex,
    };
    if (!template.path) return;

    // With a name pendant the chain is split in two, and the tapped half is
    // where the charm must go. The old layout always split the row evenly by
    // count (first half left, second half right), so depending on how many
    // charms were already on it a tap on the left could land the new charm -
    // or push an existing one - onto the right. Now the tapped side is stored
    // on the charm (chainSide) and the layout honours it.
    const seamX = getChainSeamX(chainCfg);
    const side = seamX != null && Number.isFinite(clickX)
      ? (clickX < seamX ? 'left' : 'right')
      : null;

    // No pendant: how many charms already sit to the left of the tap.
    const insertAtNoSeam = Number.isFinite(clickX)
      ? chainCharmAnchors.filter((anchor) => anchor[0] < clickX).length
      : Number.MAX_SAFE_INTEGER;

    setCharms((prev) => {
      const placed = prev.filter(Boolean);
      // Full: do nothing at all, silently. The tap targets are already
      // withdrawn at this point (see chainCharmLimitReached above) — this is
      // just the backstop for a tap that was already in flight.
      if (placed.length >= (MAX_CHARMS_BY_NECKLACE[braceletPath] ?? 6)) return prev;
      const newCharm = { ...template, id: Date.now() + Math.random() };
      if (!side) {
        const next = [...placed];
        next.splice(Math.min(insertAtNoSeam, next.length), 0, newCharm);
        return next;
      }

      // Pin every existing charm to the side it is showing on right now, so
      // adding this one never shuffles the others across the pendant.
      const current = getSeamCharmSlots(placed.map((c) => c.chainSide));
      const next = placed.map((c, k) => (
        c.chainSide === 'left' || c.chainSide === 'right' ? c : { ...c, chainSide: current[k].side }
      ));

      // Within the tapped side, slot it in after every charm left of the tap.
      const xs = next.map((_, k) => getChainCharmTransform(k, next.length, chainCfg, current[k]).position[0]);
      const sameSide = next.map((_, k) => k).filter((k) => current[k].side === side);
      const leftOfTap = sameSide.filter((k) => xs[k] < clickX);
      const insertAt = leftOfTap.length
        ? leftOfTap[leftOfTap.length - 1] + 1
        : (sameSide.length ? sameSide[0] : (side === 'left' ? 0 : next.length));

      next.splice(insertAt, 0, { ...newCharm, chainSide: side });
      return next;
    });
  }, [lastCharmTemplate, charmMetal, chainCharmAnchors, chainCfg, braceletPath, setCharms]);

  // ─── Keep the charm list in on-chain order while a name pendant is on ──────
  // With a pendant, every charm carries the side it hangs on (chainSide). The
  // list is kept as [all left charms..., all right charms...], each side in
  // left-to-right order, so the panel's slots read exactly like the necklace
  // and a slot's SIDE is simply its position: the first N slots are the left
  // side. That is what lets drag-and-drop in the panel move a charm across the
  // pendant (see reorderCharms in Controls.jsx) - a charm dragged into a
  // left-side slot goes left. Charms without a side yet (added from the
  // panel) get the one the balanced layout gives them.
  useEffect(() => {
    if (getChainSeamX(chainCfg) == null) return;
    const placed = charms.filter(Boolean);
    if (!placed.length) return;
    const slots = getSeamCharmSlots(placed.map((c) => c.chainSide));
    const withSide = placed.map((c, k) => ({ charm: c, side: slots[k].side }));
    const ordered = [
      ...withSide.filter((x) => x.side === 'left'),
      ...withSide.filter((x) => x.side === 'right'),
    ];
    const alreadyNormal = ordered.length === charms.length
      && ordered.every((x, k) => x.charm === charms[k] && x.charm.chainSide === x.side);
    if (alreadyNormal) return;
    setCharms(ordered.map((x) => (x.charm.chainSide === x.side ? x.charm : { ...x.charm, chainSide: x.side })));
  }, [charms, chainCfg, setCharms]);

  return (
    <div style={{ height: '100%', width: '100%', background: '#f8f8f8', position: 'relative' }}>
      <Canvas
        shadows
        style={{ width: '100%', height: '100%', background: '#f8f8f8' }}
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
        <CameraResetter resetObj={resetObj} lookAt={cameraDefaults.target} position={cameraDefaults.position} onReset={handleResetViewMode} />
        <CanvasAspectReporter onChange={setCanvasAspect} />
        <color attach="background" args={['#f8f8f8']} />
        <Suspense fallback={null}>
          <Environment
            files={HDR_ENVIRONMENT_URL}
            background={false}
            environmentIntensity={JEWELRY_ENV_INTENSITY}
          />
          <EnvironmentReadyNotifier onReady={handleEnvReady} />
        </Suspense>
        {/* Ring configurator's light rig - see shared/RingLightRig.jsx. */}
        <RingLightRig />
        <SoftShadows frustum={3.75} size={100} near={9.5} samples={17} rings={11} />

        <Suspense fallback={null}>
          <group ref={groupRef} position={[0, drapeCfg ? -1.5 : -3, 0]} visible={isSceneReady}>

            {/* ── Chain family 1 REMOVED: GLB chain + 3D name pendant (BRACELET13/14) - no longer used.
            {isNameChain && (
              <NamePendantNecklace
                braceletPath={braceletPath}
                namePendant={namePendant}
                pendantCharm={pendantCharm}
                materialProps={materialProps}
                materialPropsBracelet={materialPropsBracelet}
                texture={texture}
                scale={scale}
                onChainOffsetChange={handleChainOffsetChange}
                onLoaded={handleBraceletLoaded}
              />
            )}
            ── */}

            {/* ── Chain family 2: procedural link-by-link drape, no name
                 pendant (BRACELET15-18). ChainDrape no-ops (returns null)
                 for any bracelet without a CHAIN_DRAPE_CONFIG entry. ── */}
            <ChainSagAnimator
              // Keyed off the name being ON, not off its washers having been
              // measured: the measurement takes a moment, and letting the sag
              // settle play in that gap meant a pendant chain waved once,
              // snapped into its pendant shape, and never dropped. With a name
              // the entrance is the per-link fall, from the first frame.
              cfg={namePendantActive ? null : drapeCfg}
              resetKey={`${braceletPath}|${resolvedChainLength}`}
              onSag={setAnimatedSag}
            />

            {/* The same name pendant, hung from the generated chain. It
                reports its two washers back up, and the chain is rebuilt to
                end on them. */}
            {drapeCfg && namePendantActive && (
              <DrapeNamePendant
                braceletPath={braceletPath}
                namePendant={namePendant}
                materialProps={materialProps}
                drapeCfg={drapeCfg}
                dropKey={`${braceletPath}|${resolvedChainLength}`}
                onAnchorsChange={handlePendantAnchorsChange}
              />
            )}

            <ChainDrape
              key={braceletPath}
              braceletPath={braceletPath}
              materialProps={materialPropsBracelet}
              charmAnchors={chainCharmAnchors}
              shrinkAnchors={chainShrinkAnchors}
              cfg={chainCfg}
              dropKey={`${braceletPath}|${resolvedChainLength}`}
              // A name pendant sits IN the chain, and the two cannot be made to
              // enter together convincingly: the name has to load its font and
              // measure its own letters before the chain even knows where to
              // end, so the drop was always spent on a chain that was about to
              // be rebuilt. With a name on it the piece is simply drawn at
              // rest - no drop, and no sag settle either (see ChainSagAnimator
              // above). Without one, both play exactly as before.
              animateFall={!namePendantActive}
              onAddCharm={chainCharmLimitReached ? undefined : addCharmFromChain}
            />

            {/* ── Charms: shared by both chain families ── */}
            {placedCharms.map((charm, i) => {
              // A charm still loading is parked one slot past the end of the layout: it
              // renders nothing, so the values only have to be harmless, and the moment
              // it reports ready it re-renders into its real slot.
              const slot = charmLayoutSlots[i];
              const layoutIndex = slot >= 0 ? slot : loadedCharms.length;
              const seamSlot = slot >= 0 ? drapeSeamSlots[slot] : null;
              const shared = {
                charm, index: layoutIndex, total: charmLayoutTotal,
                seamSide: seamSlot?.side ?? null,
                seamRank: seamSlot?.rank ?? null,
                // The chain as rendered, so an initial can hook its bail through a real link.
                chainAnchors: chainCharmAnchors,
                chainShrinkAnchors,
                materialProps, namePendant, braceletPath, chainOffsetX,
                drapeCfg: chainCfg,
                dropKey: `${braceletPath}|${resolvedChainLength}`,
                // Charms ride the chain, so they enter with it - or, with a
                // name pendant, not at all.
                animateDrop: !namePendantActive,
                charmKey: charmKeys[i],
                onReady: markCharmReady,
                onClick: (e) => { e.stopPropagation(); deleteCharm(i); },
              };
              return charm.type === 'initial' ? (
                <NecklaceInitialCharm key={charm.id ?? `initial-${i}`} {...shared} />
              ) : (charm.type === 'birthstone' || charm.type === 'diamond') ? (
                <NecklaceGemstoneCharm key={charm.id ?? `${charm.type}-${i}`} {...shared} />
              ) : (
                <NecklaceImageCharm key={charm.id ?? `${charm.path}-${i}`} {...shared} />
              );
            })}

          </group>
        </Suspense>

        <CameraController
          view={cameraView}
          setView={setCameraView}
          customViewPositions={necklaceViewPositions}
        />
        {capture && <Capture targetGroup={groupRef} />}

        <OrbitControls
          ref={orbitControlsRef}
          makeDefault
          target={cameraDefaults.target}
          minDistance={currentMinDistance}
          maxDistance={currentMaxDistance}
          autoRotate={view360}
          autoRotateSpeed={4}
        />
      </Canvas>

      <FirstLoadGate ready={isSceneReady} />
      <ToastContainer />
    </div>
  );
};

export default Necklace;
