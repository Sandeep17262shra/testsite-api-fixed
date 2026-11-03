/* eslint-disable react/no-unknown-property */
import { useRef, useEffect, useState, useContext, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useProgress, SoftShadows } from '@react-three/drei'; // Added SoftShadows
import { Capture } from './utility/Capture';
import { CameraController } from './utility/CameraController';
import Diamond from './objects/Diamond';
import Ring from './objects/Ring';
import { getEngravingLocalPosition } from './objects/Ring';
import { CameraViewContext } from './contexts/CameraViewContext';
import { View360Context } from './contexts/View360Context';
import { CaptureContext } from './contexts/CaptureContext';
import { ShareContext } from './contexts/ShareContext';
import { useStoreContext } from './contexts/StoreContext';
import { RecordingContext } from './contexts/RecordingContext';
import { RingContext } from './contexts/RingContext';
import { Suspense } from "react";
import MatchingBand from './objects/MatchingBand';
import Head, { getHeadStoneAnchorY } from './objects/Head';
import { getVisualCarat, getStoneAssemblyScale, STONE_ASSEMBLY_SHRINK, STONE_ASSEMBLY_PIVOT_Y, STONE_ANCHOR_Y } from './utility/visualCarat';
import DiamondWiseRing, { getDiamondWiseHeadTransform } from './objects/DiamondWiseRing';
import { DIAMONDWISE_DESIGNS, getDiamondWiseDesignById, getDiamondWiseDesignByShankId } from './data/diamondwiseDesigns';
import * as THREE from "three";
import { Reflector } from '@react-three/drei';
import { DiamondContext } from './contexts/DiamondContext';
import { LoaderContext } from './contexts/LoaderContext';
import { SectionContext } from './contexts/SectionContext';
import { useSceneStage } from './contexts/SceneStageContext';
import { Base64 } from 'js-base64';
import { GLTFLoader } from 'three-stdlib';
import { queueModelPreload, queueRawModelPreload, getPreloadBudget } from './utility/modelLoader';
// The DiamondWise models are authored larger than the standard ring: measured
// at the same camera distance (7), a DiamondWise piece renders 990px tall
// against the standard ring's 836px - 18.4% bigger, which is why it overflowed
// the frame at full zoom while a standard ring sat comfortably inside it.
// Apparent size goes as 1/distance, so holding the camera this much further
// back at the zoom-IN limit makes the two families frame identically there.
// Only the floor needs it; the ceiling stays at 10 for both, so switching
// between families never leaves the camera outside the allowed range.
const DIAMONDWISE_ZOOM_LIMIT_SCALE = 1;

// Per-shank framing for the STANDARD ring.
//
// Shank styles are not the same size on screen: a wide or cathedral band fills
// noticeably more of the frame than a plain or channel one, so a single camera
// floor and a single group offset either cropped the chunky styles or left the
// slim ones floating in empty space. Each style therefore carries its own pair:
//
//   minDistance – the closest the camera may come (desktop only; the mobile
//                 zoom-in floor stays shared)
//   positionY   – how far the ring group is pushed down, on mobile and desktop
//
// DiamondWise designs are framed separately and are not affected by this table.
const SHANK_FRAMING_DEFAULT = { minDistance: 7.4, positionY: -1.5 };
// Wedding bands have no head or centre stone above the shank. Lift their
// complete model slightly so the visible band, rather than the empty head
// space an engagement ring needs, is centered in the product frame.
const WEDDING_RING_FRAME_OFFSET_Y = 0.95;
// Pave and Channel use their dedicated wedding-band assets, whose geometry
// already sits higher than the regular shank assets. Give those two a smaller
// lift so they do not look over-raised beside the other wedding styles.
const WEDDING_BAND_MODEL_SHANKS = new Set(["CHANNEL", "PLATE-PRONG"]);
const WEDDING_BAND_MODEL_FRAME_OFFSET_Y = 0.7;
// The standard-ring group (see the <group> wrapping <Ring>/<Head> below) is
// scaled uniformly by this factor - needed to convert a local Y (inside Ring)
// into the world Y the camera controller targets.
const RING_GROUP_SCALE = 1.05;
// OrbitControls clamps camera distance to [minDistance, maxDistance] on every
// internal update() call regardless of its `enabled` prop, so the normal
// per-shank floor (shankFraming.minDistance, ~6.7-7.4) would silently pull the
// engraving-zoom camera back out to that floor - far short of
// CameraController's own ENGRAVING_DISTANCE - the moment OrbitControls next
// updates. This floor only needs to clear CameraController's tight
// close-up distance.
const ENGRAVING_ORBIT_MIN_DISTANCE = 1.5;
const SHANK_FRAMING = {
  PLAIN:         { minDistance: 6.5, positionY: -1.9 },
  "PLATE-PRONG": { minDistance: 6.5, positionY: -1.9 },
  CHANNEL:       { minDistance: 6.5, positionY: -1.9 },
  SPLIT:         { minDistance: 6.5, positionY: -1.8 },
  "KNIFE-EDGE":  { minDistance: 7, positionY: -1.6 },
  CATHEDRAL:     { minDistance: 7.2, positionY: -1.45 },
  TWISTED:       { minDistance: 6.3, positionY: -2.1 },
  "WIDE-PLAIN":  { minDistance: 7.5, positionY: -1.6 },

  // New default-only shanks — same export pipeline/local-space offset as
  // PLATE-PRONG/CHANNEL after the rotation+translation bake fix (see Ring.jsx
  // NEW_DEFAULT_SHANKS), so reuse their framing as the starting point.
  "FRENCH-PAVE":          { minDistance: 6.6, positionY: -1.85 },
  "PAVE-STONES":          { minDistance: 6.6, positionY: -1.85 },
  "8-STONES":             { minDistance: 6.6, positionY: -1.85},
  "MULTI-ROW":            { minDistance: 6.6, positionY: -1.85 },
  "TWISTED-2":            { minDistance: 6.6, positionY: -1.85 },
  FLUTED:                 { minDistance: 6.6, positionY: -1.85 },
  BRAIDED:                { minDistance: 6.6, positionY: -1.85 },
  "CATHEDRAL-SIDE-STONE": { minDistance: 6.6, positionY: -1.85 },
  "SIDE-BEZEL-STONES":    { minDistance: 6.6, positionY: -1.85 },
  "BAGUETTE-SIDE-STONE":  { minDistance: 6.5, positionY: -1.95 },
  "PEAR-SIDE-STONE":      { minDistance: 6.5, positionY: -1.95 },
  "HALF-MOON-SIDE-STONE": { minDistance: 6.5, positionY: -1.95 },
  BAGUETTE:               { minDistance: 6.6, positionY: -1.85 },
  PEAR:                   { minDistance: 6.6, positionY: -1.85 },
};

// Framing follows the ring that is ON SCREEN, not the one being loaded, so the
// camera floor and the ring offset move together with the model swap.
const getShankFraming = (shank) =>
  SHANK_FRAMING[String(shank || "").toUpperCase()] || SHANK_FRAMING_DEFAULT;

const DIAMONDWISE_MIN_DISTANCE = 7.1;

// ───────────────────────────────────────────────────────────────────────────
// CENTRE-STONE ASSEMBLY SIZING (standard ring only)
//
// The head models and the centre stone were authored oversized relative to the
// band. Everything about HOW they respond to carat is unchanged - the stone
// still grows with weight and the head still widens to take it (see Head.jsx
// and Diamond.jsx). This shrinks the finished assembly, easing the shrink off
// above 1ct so the large end of the slider reads as big as it should.
//
// It is applied about the point where the head meets the shank, so making the
// assembly smaller never sinks the prongs into the band or lifts the stone out
// of them.
//
// DiamondWise designs carry their own integrated head and are left untouched.
// ───────────────────────────────────────────────────────────────────────────
// Sizing constants and getStoneAssemblyScale are imported from utility/visualCarat.js

// The reset pose only fixes the camera's DIRECTION. Its distance is taken from
// `distance` (the current zoom-in floor), so the configurator opens - and the
// Reset button returns - at maximum zoom instead of the far-away default that
// made the ring look small on first paint. The distance is read through a ref
// so that changing shank (which moves the floor) never yanks a camera the
// shopper has already rotated or zoomed.
function CameraResetter({ resetObj, distance }) {
  const { camera } = useThree();
  const distanceRef = useRef(distance);
  distanceRef.current = distance;

  useEffect(() => {
    if (resetObj && camera) {
      const [x, y, z] = resetObj.position;
      const length = Math.hypot(x, y, z);
      const target = distanceRef.current;
      const scale = length > 0 && target > 0 ? target / length : 1;
      camera.position.set(x * scale, y * scale, z * scale);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }
  }, [resetObj]);

  return null;
}

function GLBinder() {
  const { gl } = useThree();
  const { setGlInstance } = useContext(RingContext);

  useEffect(() => {
    if (gl) {
      setGlInstance(gl);
    }
  }, [gl]);

  return null;
}

function Scene() {
  const chunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const groupRef = useRef();
  const orbitControlsRef = useRef();
  const canvasRef = useRef(null);
  const hasAppliedInitialViewRef = useRef(false);
  const { cameraView, setCameraView } = useContext(CameraViewContext);
  const { view360, setView360 } = useContext(View360Context);
  const { capture } = useContext(CaptureContext);
  const { share, setShare, setShareUrl, parent } = useContext(ShareContext);
  const { parentUrl: storeParentUrl } = useStoreContext();
  const { recording, setRecording } = useContext(RecordingContext);
  const { ringColor, engraving, ringWidth, metal, sizeOption, ringSize, engravingFont, mobileZoomIn, ringHead, ringShank, ringSideSetting, ringMatchingBand, headColor, biMetal, ringBand, bandColor, finalRingPrice, metalness, roughness, reflectivity, clearcoat, clearcoatRoughness, envMapIntensity, bandWidth ,styleShape, isEnabled, engravingFocus, diamondWiseDesignId } = useContext(RingContext);
  const { shankTotal, headTotal, stoneTotal, otherTotal, countryShortName, sizeMM, summaryBlink, setSummaryBlink, metalPrice, platinum, intensityPrice } = useContext(SectionContext);
  const [isLoading, setIsLoading] = useState(true);
  const { shape, colorType, gemstone, fancyDiamond, fancyDiamondIntensity, diamondSize, selectedQuality, activeTab, diamondColor} = useContext(DiamondContext);
  const { resetObj, loader } = useContext(LoaderContext);
  const [copied, setCopied] = useState(false);
  const selectedDiamondWiseDesign = getDiamondWiseDesignById(diamondWiseDesignId);

  // ───────────────────────────────────────────────────────────────────────
  // SCENE STAGING
  //
  // `target` is what the shopper just picked. `displayed` is the last
  // configuration whose models are ALL loaded. Nothing in the viewport
  // changes until a configuration commits, so a half-loaded ring — a new
  // shank wearing the old head, or a new diamond dropped onto the previous
  // ring while switching to/from a DiamondWise design — can never be shown.
  // Both trees stay mounted once used; only visibility flips.
  // ───────────────────────────────────────────────────────────────────────
  const { target, displayed, isPending } = useSceneStage();
  const displayedIsDiamondWise = displayed.isDiamondWise;
  const displayedIsSelfContainedHead = displayed.ringHead === "HALO" || displayed.ringHead === "CLAW-SET" || displayed.ringHead === "HIDDEN-HALO" || displayed.ringHead === "TWO-STONE";
  const targetIsSelfContainedHead = target.ringHead === "HALO" || target.ringHead === "CLAW-SET" || target.ringHead === "HIDDEN-HALO" || target.ringHead === "TWO-STONE";
  const displayedIsNoHead = displayed.ringHead === "NO-HEAD";
  const targetIsNoHead = target.ringHead === "NO-HEAD";
  const shankFraming = getShankFraming(displayed.ringShank);
  const isRaisedWeddingBandModel =
    displayedIsNoHead && WEDDING_BAND_MODEL_SHANKS.has(displayed.ringShank);
  const ringFramePositionY =
    shankFraming.positionY +
    (displayedIsNoHead
      ? (isRaisedWeddingBandModel
        ? WEDDING_BAND_MODEL_FRAME_OFFSET_Y
        : WEDDING_RING_FRAME_OFFSET_Y)
      : 0);
  // Where the engraving actually sits in WORLD space, so the engraving-zoom
  // camera can center and frame it tightly instead of aiming at a fixed
  // guessed height. Local Y (inside <Ring>) varies by shank/setting - see
  // getEngravingLocalPosition - and the ring group's own Y offset varies by
  // shank too (see SHANK_FRAMING above), so both have to be combined here.
  const engravingTargetY =
    ringFramePositionY +
    getEngravingLocalPosition(displayed.ringSideSetting, displayed.ringShank)[1] * RING_GROUP_SCALE;
  const stoneAssemblyScale = displayedIsDiamondWise ? 1 : getStoneAssemblyScale(getVisualCarat(diamondSize));
  const stoneAssemblyOffsetY = STONE_ASSEMBLY_PIVOT_Y * (1 - stoneAssemblyScale);
  // The head's height varies with carat, and it is scaled about its own anchor,
  // so the seat the stone sits in moves with it. Head.jsx owns that geometry.
  const stoneAnchorY = getHeadStoneAnchorY(
    displayed.ringHead,
    displayed.shape,
    getVisualCarat(diamondSize),
    STONE_ANCHOR_Y
  );
  const cameraMinDistance =
    (mobileZoomIn ? 4 : (displayedIsDiamondWise ? DIAMONDWISE_MIN_DISTANCE : shankFraming.minDistance))
    * (displayedIsDiamondWise ? DIAMONDWISE_ZOOM_LIMIT_SCALE : 1);

  const [hasMountedNormalRing, setHasMountedNormalRing] = useState(!target.isDiamondWise);
  const [hasMountedDiamondWiseRing, setHasMountedDiamondWiseRing] = useState(target.isDiamondWise);
  useEffect(() => {
    if (target.isDiamondWise) setHasMountedDiamondWiseRing(true);
    else setHasMountedNormalRing(true);
  }, [target.isDiamondWise]);

  // Background preloading may only start once the first complete ring is on
  // screen, and it is paused again by the scene stage on every selection.
  const [hasCommittedOnce, setHasCommittedOnce] = useState(false);
  useEffect(() => {
    if (!isPending) setHasCommittedOnce(true);
  }, [isPending]);

  const selectedDiamondWiseShank = getDiamondWiseDesignByShankId(ringShank);
  const diamondWiseDiamondPosition = useMemo(
    () =>
      getDiamondWiseHeadTransform(
        diamondSize,
        displayed.diamondWiseDesignId,
        displayed.ringShank
      ).diamondPosition,
    [diamondSize, displayed.diamondWiseDesignId, displayed.ringShank]
  );
  const isModelOnlyPreview =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("preview") === "model-only";
  
  const resolveShareBaseUrl = () => {
    const resolvedParentUrl =
      parent ||
      storeParentUrl ||
      (window.self !== window.top ? document.referrer : "");

    if (resolvedParentUrl) {
      try {
        return new URL(resolvedParentUrl);
      } catch (error) {
        console.warn("Failed to parse parent/store URL:", resolvedParentUrl, error);
      }
    }

    return new URL(window.location.href);
  };

	const autoStopped = useRef(false);
	useEffect(() => {
	  if (autoStopped.current) return;
	  const stopRotation = () => {
		setView360(false);
		autoStopped.current = true; 
	  };
	  window.addEventListener("click", stopRotation, { once: true });
	  window.addEventListener("touchstart", stopRotation, { once: true });
	  window.addEventListener("mousedown", stopRotation, { once: true });
	  return () => {
		window.removeEventListener("click", stopRotation);
		window.removeEventListener("touchstart", stopRotation);
		window.removeEventListener("mousedown", stopRotation);
	  };
	}, [setView360]);
  
  const triggerRecording = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const stream = canvas.captureStream(60);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

    // Reset recording chunks
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);

      // Create temporary link and click it programmatically
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    };

    mediaRecorderRef.current = recorder;
    recorder.start(100); // Collect data every 100ms

    // Set up initial camera position
    if (orbitControlsRef.current) {
      orbitControlsRef.current.object.position.set(-1, 8, 15);
      orbitControlsRef.current.update();
    }

    // Start rotation animation
    animateRotation();
  };

  const animateRotation = () => {
    const startRotation = groupRef.current.rotation.y;
    const startTime = performance.now();
    const duration = 5000; // 5 seconds

    const animateFrame = (timestamp) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      groupRef.current.rotation.y = startRotation + (Math.PI * 2) * progress;

      if (progress < 1) {
        requestAnimationFrame(animateFrame);
      } else {
        // Final cleanup after animation
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.requestData(); // Force final data chunk
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current = null;
        }
        setRecording(false);
      }
    };

    requestAnimationFrame(animateFrame);
  };

  useEffect(() => {
    if (recording) {
      triggerRecording();
    }
  }, [recording]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);
  
	useEffect(() => {
	  if (share) {
		setShare(false);
		// Full config you want serialized/shared
		const config = {
		  ringColor,
		  engraving,
		  ringWidth,
		  metal,
		  sizeOption,
		  ringSize,
		  engravingFont,
		  mobileZoomIn,
		  ringHead,
		  ringShank,
		  ringSideSetting,
		  ringMatchingBand,
		  headColor,
		  biMetal,
		  ringBand,
		  bandColor,
		  finalRingPrice,
		  metalness,
		  roughness,
		  reflectivity,
		  clearcoat,
		  clearcoatRoughness,
		  envMapIntensity,
		  shape, // from DiamondContext
		  shankTotal,
		  headTotal,
		  stoneTotal,
		  otherTotal,
		  bandWidth,
		  styleShape,
		  isEnabled,
		  colorType, 
		  gemstone, 
		  fancyDiamond, 
		  fancyDiamondIntensity,
		  intensityPrice,
		  diamondSize, 
		  selectedQuality, 
		  activeTab,
		  metalPrice,
		  platinum,
		  diamondColor,
		  diamondWiseDesignId,
		  diamondWiseDesignLabel: selectedDiamondWiseDesign?.label || "",
		  diamondWiseShankId: selectedDiamondWiseShank?.shankId || "",
		  diamondWiseShankLabel: selectedDiamondWiseShank?.shankLabel || "",
		  diamondWiseHeadId: selectedDiamondWiseDesign?.headId || "",
		  diamondWiseHeadLabel: selectedDiamondWiseDesign?.headLabel || "",
		  diamondWiseCenterStoneMesh: selectedDiamondWiseDesign?.centerStoneMesh || "",
		  diamondWiseReferenceCarat: selectedDiamondWiseDesign?.referenceCarat || null
		};

		// Log before encoding
		console.log('Generating share URL from full config:', config);

		// Encode and build URL
		let encoded;
		try {
		  encoded = Base64.encode(JSON.stringify(config));
		} catch (e) {
		  console.error('Failed to encode share config:', e);
		  return;
		}

		const url = resolveShareBaseUrl();
		url.search = ""; // clear existing query
		url.searchParams.set("config", encoded);
		const finalUrl = url.toString();

		setShareUrl(finalUrl);

		// Optional: log the final shareable URL
		console.log('Final shareable URL:', finalUrl);

		const copyPromise = navigator.clipboard?.writeText
		  ? navigator.clipboard.writeText(finalUrl)
		  : new Promise((resolve, reject) => {
			  try {
				const textarea = document.createElement("textarea");
				textarea.value = finalUrl;
				textarea.setAttribute("readonly", "");
				textarea.style.position = "fixed";
				textarea.style.left = "-9999px";
				document.body.appendChild(textarea);
				textarea.select();
				const successful = document.execCommand("copy");
				document.body.removeChild(textarea);
				if (successful) resolve();
				else reject(new Error("execCommand failed"));
			  } catch (err) {
				reject(err);
			  }
			});

		copyPromise
		  .then(() => {
			console.log("URL copied to clipboard:", finalUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000); // auto hide after 2 seconds
		  })
		  .catch(err => {
			console.error("Failed to copy:", err);
		  });
	  }
	}, [
	  share,
	  setShare,
	  ringColor,
	  engraving,
	  ringWidth,
	  metal,
	  sizeOption,
	  ringSize,
	  engravingFont,
	  mobileZoomIn,
	  ringHead,
	  ringShank,
	  ringSideSetting,
	  ringMatchingBand,
	  headColor,
	  biMetal,
	  ringBand,
	  bandColor,
	  finalRingPrice,
	  metalness,
	  roughness,
	  reflectivity,
	  clearcoat,
	  clearcoatRoughness,
	  envMapIntensity,
	  shape,
	  shankTotal,
	  headTotal,
	  stoneTotal,
	  otherTotal,
	  colorType, 
	  gemstone, 
	  fancyDiamond, 
	  fancyDiamondIntensity,
	  diamondSize, 
	  selectedQuality, 
	  activeTab,
	  diamondColor,
	  diamondWiseDesignId
	]);
	
	const VIEW_MAP = {
	  PLAIN: "perspective",
	  CATHEDRAL: "front",
	  "KNIFE-EDGE": "perspective",
	  SPLIT: "perspective",
	  TWISTED: "perspective",
	  "WIDE-PLAIN": "perspectiveHeadView",
	  CHANNEL: "perspectiveHeadView",
	  "PLATE-PRONG": "perspectiveHeadView",
	  "FRENCH-PAVE": "perspectiveHeadView",
	  "PAVE-STONES": "perspectiveHeadView",
	  "8-STONES": "perspectiveHeadView",
	  "MULTI-ROW": "perspectiveHeadView",
	  "TWISTED-2": "perspective",
	  FLUTED: "perspective",
	  BRAIDED: "perspective",
	  "CATHEDRAL-SIDE-STONE": "perspectiveHeadView",
	  "SIDE-BEZEL-STONES": "perspectiveHeadView",
	  "BAGUETTE-SIDE-STONE": "perspectiveHeadView",
	  "PEAR-SIDE-STONE": "perspectiveHeadView",
	  "HALF-MOON-SIDE-STONE": "perspectiveHeadView",
	  BAGUETTE: "perspectiveHeadView",
	  PEAR: "perspectiveHeadView",
	};

	useEffect(() => {
	  if (isModelOnlyPreview || engravingFocus) return;
	  if (engravingFocus) return;
	  setCameraView(VIEW_MAP[displayed.ringShank] || "perspective");
	}, [displayed.ringShank, engravingFocus, isModelOnlyPreview]);

	useEffect(() => {
	  if (isModelOnlyPreview || engravingFocus) return;
	  if (!hasAppliedInitialViewRef.current) {
	    hasAppliedInitialViewRef.current = true;
	    // Open in the same product pose as the plain shank.
	    setCameraView("perspective");
	    return;
	  }
	  // Each standard head gets its own editable camera key. DiamondWise heads
	  // deliberately share one key, so their common position is tuned in one
	  // place without affecting any shank view.
	  const headView = displayed.isDiamondWise
	    ? "head:diamondwise"
	    : displayed.ringHead === "NO-HEAD"
	    ? "perspective"
	    : `head:${displayed.ringHead}`;
	  setCameraView(headView);
	}, [displayed.ringHead, displayed.diamondWiseDesignId, displayed.isDiamondWise, engravingFocus, isModelOnlyPreview, setCameraView]);
	

	useEffect(() => {
	  if (isModelOnlyPreview || engravingFocus) return;
	  if (engravingFocus) return;
	  if (ringBand === "Yes") {
		setCameraView("side");
	  }
	}, [ringBand, engravingFocus, isModelOnlyPreview]);
	
	useEffect(() => {
	  if (engravingFocus) {
		setCameraView("engravingZoom");
	  }
	}, [engravingFocus]);

	useEffect(() => {
	  if (!isModelOnlyPreview) return;
	  setCameraView("perspective");
	}, [isModelOnlyPreview, setCameraView]);

// After the default ring has painted, queue the remaining models one at a time.
// A shopper selection interrupts the active background request.
const hasPreloadedRef = useRef(false);
useEffect(() => {
  if (!hasCommittedOnce) return;
  if (hasPreloadedRef.current) return;
  hasPreloadedRef.current = true;

  const backgroundModels = [
    '/3d-models/RING-SHANK/CATHEDRAL.glb',
    '/3d-models/RING-SHANK/KNIFE-EDGE.glb',
    '/3d-models/RING-SHANK/TWISTED.glb',
    '/3d-models/RING-SHANK/WIDE-PLAIN.glb',
    '/3d-models/RING-SHANK/SPLIT.glb',
    '/3d-models/RING-SHANK/CHANNEL.glb',
    '/3d-models/RING-SHANK/PLATE-PRONG.glb',
    '/3d-models/RING-SHANK/FRENCH-PAVE.glb',
    '/3d-models/RING-SHANK/PAVE-STONES.glb',
    '/3d-models/RING-SHANK/8-STONES.glb',
    '/3d-models/RING-SHANK/MULTI-ROW.glb',
    '/3d-models/RING-SHANK/TWISTED-2.glb',
    '/3d-models/RING-SHANK/FLUTED.glb',
    '/3d-models/RING-SHANK/BRAIDED.glb',
    '/3d-models/RING-SHANK/CATHEDRAL-SIDE-STONE.glb',
    '/3d-models/RING-SHANK/SIDE-BEZEL-STONES.glb',
    '/3d-models/RING-SHANK/BAGUETTE-SIDE-STONE.glb',
    '/3d-models/RING-SHANK/PEAR-SIDE-STONE.glb',
    '/3d-models/RING-SHANK/HALF-MOON-SIDE-STONE.glb',
    '/3d-models/SIDE-RING-SETTING/CHANNEL.glb',
    '/3d-models/SIDE-RING-SETTING/PLATE-PRONG.glb',
    '/3d-models/RING-HEAD/4-PRONG/OVAL.glb',
    '/3d-models/RING-HEAD/4-PRONG/CUSHION.glb',
    '/3d-models/RING-HEAD/4-PRONG/PRINCESS.glb',
    '/3d-models/RING-HEAD/4-PRONG/EMERALD.glb',
    '/3d-models/RING-HEAD/4-PRONG/PEAR.glb',
    '/3d-models/RING-HEAD/4-PRONG/MARQUISE.glb',
    '/3d-models/RING-HEAD/6-PRONG/ROUND.glb',
    '/3d-models/RING-HEAD/6-PRONG/OVAL.glb',
    '/3d-models/RING-HEAD/BEZEL/ROUND.glb',
    '/3d-models/RING-HEAD/BEZEL/OVAL.glb',
    '/3d-models/RING-HEAD/HIDDEN-HALO/ROUND.glb',
    '/3d-models/RING-HEAD/HIDDEN-HALO/CUSHION.glb',
    '/3d-models/RING-HEAD/HIDDEN-HALO/EMERALD.glb',
    '/3d-models/RING-HEAD/HIDDEN-HALO/PRINCESS.glb',
    '/3d-models/RING-HEAD/HIDDEN-HALO/OVAL.glb',
    '/3d-models/RING-HEAD/HIDDEN-HALO/PEAR.glb',
    '/3d-models/RING-HEAD/HIDDEN-HALO/MARQUISE.glb',
    '/3d-models/RING-HEAD/HIDDEN-HALO/HEART.glb',
    '/3d-models/RING-HEAD/HIDDEN-HALO/ASSCHER.glb',
    '/3d-models/RING-HEAD/HIDDEN-HALO/RADIANT.glb',
    '/3d-models/RING-HEAD/HIDDEN-HALO-2/ROUND.glb',
    '/3d-models/RING-HEAD/HIDDEN-HALO-2/CUSHION.glb',
    '/3d-models/RING-HEAD/HIDDEN-HALO-2/EMERALD.glb',
    '/3d-models/RING-HEAD/HIDDEN-HALO-2/PRINCESS.glb',
    '/3d-models/RING-HEAD/HIDDEN-HALO-2/OVAL.glb',
    '/3d-models/RING-HEAD/HIDDEN-HALO-2/PEAR.glb',
    '/3d-models/RING-HEAD/HIDDEN-HALO-2/MARQUISE.glb',
    '/3d-models/RING-HEAD/HIDDEN-HALO-2/HEART.glb',
    '/3d-models/RING-HEAD/HIDDEN-HALO-2/ASSCHER.glb',
    '/3d-models/RING-HEAD/HIDDEN-HALO-2/RADIANT.glb',
    '/3d-models/RING-HEAD/HIDDEN-HALO-2/MOVAL.glb',
    '/3d-models/RING-HEAD/TULIP/ROUND.glb',
    '/3d-models/RING-HEAD/TULIP/CUSHION.glb',
    '/3d-models/RING-HEAD/TULIP/OVAL.glb',
    '/3d-models/RING-HEAD/TULIP/PEAR.glb',
    '/3d-models/RING-HEAD/TULIP/EMERALD.glb',
    '/3d-models/RING-HEAD/CLAW-SET/ROUND.glb',
    '/3d-models/RING-HEAD/CLAW-SET/OVAL.glb',
    '/3d-models/RING-HEAD/CLAW-SET/CUSHION.glb',
    // HALO uses one fixed (tier-3) model per shape - no carat switching.
    '/3d-models/RING-HEAD/HALO/halo-round/halo-round-3.glb',
    '/3d-models/RING-HEAD/HALO/halo-princess/halo-princess-3.glb',
    '/3d-models/RING-HEAD/HALO/halo-cushion/halo-cushion-3.glb',
    '/3d-models/RING-HEAD/HALO/halo-oval/halo-oval-3.glb',
    '/3d-models/RING-HEAD/HALO/halo-radiant/halo-radiant-3.glb',
    '/3d-models/RING-HEAD/HALO/halo-pear/halo-pear-3.glb',
    '/3d-models/RING-HEAD/HALO/halo-emerald/halo-emerald-3.glb',
    '/3d-models/RING-HEAD/HALO/halo-marquise/halo-marquise-3.glb',
    '/3d-models/RING-HEAD/HALO/halo-heart/halo-heart-3.glb',
    '/3d-models/RING-HEAD/HALO/halo-asscher/halo-asscher-3.glb',
    '/3d-models/RING-HEAD/HALO/halo-moval/halo-moval-3.glb',
    '/3d-models/WEDDING-BANDS/CHANNEL.glb',
    '/3d-models/WEDDING-BANDS/PLATE-PRONG.glb',
    '/3d-models/WEDDING-BANDS/Channel-Models/1_2.glb',
    '/3d-models/WEDDING-BANDS/Channel-Models/3_4.glb',
    '/3d-models/WEDDING-BANDS/Channel-Models/full.glb',
    '/3d-models/WEDDING-BANDS/Pave-Models/1_2.glb',
    '/3d-models/WEDDING-BANDS/Pave-Models/3_4.glb',
    '/3d-models/WEDDING-BANDS/Pave-Models/full.glb',
    // TWO-STONE: two models must load in parallel (left + right head) on every
    // first-time selection, so they are slower than any other head type that
    // fetches only one file. Preload the default pair (round left, pear right)
    // first — those are what the shopper sees immediately when they switch to
    // TWO-STONE — then warm all remaining shape variants behind them.
    '/3d-models/RING-HEAD/TWO-STONE/left-head/round.glb',
    '/3d-models/RING-HEAD/TWO-STONE/right-head/pear.glb',
    '/3d-models/RING-HEAD/TWO-STONE/left-head/pear.glb',
    '/3d-models/RING-HEAD/TWO-STONE/right-head/round.glb',
    '/3d-models/RING-HEAD/TWO-STONE/left-head/oval.glb',
    '/3d-models/RING-HEAD/TWO-STONE/right-head/oval.glb',
    '/3d-models/RING-HEAD/TWO-STONE/left-head/cushion.glb',
    '/3d-models/RING-HEAD/TWO-STONE/right-head/cushion.glb',
    '/3d-models/RING-HEAD/TWO-STONE/left-head/princess.glb',
    '/3d-models/RING-HEAD/TWO-STONE/right-head/princess.glb',
    '/3d-models/RING-HEAD/TWO-STONE/left-head/emerald.glb',
    '/3d-models/RING-HEAD/TWO-STONE/right-head/emerald.glb',
    '/3d-models/RING-HEAD/TWO-STONE/left-head/radiant.glb',
    '/3d-models/RING-HEAD/TWO-STONE/right-head/radiant.glb',
    '/3d-models/RING-HEAD/TWO-STONE/left-head/marquise.glb',
    '/3d-models/RING-HEAD/TWO-STONE/right-head/marquise.glb',
    '/3d-models/RING-HEAD/TWO-STONE/left-head/asscher.glb',
    '/3d-models/RING-HEAD/TWO-STONE/right-head/asscher.glb',
    '/3d-models/RING-HEAD/TWO-STONE/left-head/heart.glb',
    '/3d-models/RING-HEAD/TWO-STONE/right-head/heart.glb',
  ];

  // Diamond .obj files are served unencrypted, so they must be warmed through
  // the raw queue — the encrypted queue would ask for a .enc that does not
  // exist and every one of them would 404.
  const backgroundRawModels = [
    '/all_diamonds/oval.obj',
    '/all_diamonds/cushion.obj',
    '/all_diamonds/princess.obj',
    '/all_diamonds/emerald.obj',
    '/all_diamonds/pear.obj',
    '/all_diamonds/marquise.obj',
    '/all_diamonds/heart.obj',
    '/all_diamonds/radiant.obj',
    '/all_diamonds/asscher.obj',
    '/all_diamonds/moval.obj',
  ];

  const startBackgroundPreload = window.setTimeout(
    () => {
      const budget = getPreloadBudget();
      // Data saver / 2G: the shopper's own selection needs every byte of the
      // pipe. Models still load on demand, just nothing ahead of time.
      if (budget === "none") return;

      // Order matters — the queue is FIFO and one request at a time. Warm the
      // shanks, heads and stone shapes a shopper actually clicks through first;
      // DiamondWise designs are a separate, rarely-entered flow and go last.
      queueModelPreload(backgroundModels);
      queueRawModelPreload(backgroundRawModels);

      if (budget !== "full") return;

      const diamondWiseModels = DIAMONDWISE_DESIGNS.flatMap((design) => [
        design.headModelPath,
        design.shankModelPath,
      ]);
      // Encrypted queue: DiamondWise models are fetched as `.enc` too, so
      // warming them through the raw queue would request a `.glb` the app never
      // uses and leave the real download cold.
      queueModelPreload(diamondWiseModels);
    },
    1500
  );

  return () => window.clearTimeout(startBackgroundPreload);
}, [hasCommittedOnce]);

	
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const handleResize = () => {
		  setIsMobile(window.innerWidth <= 768);
		};
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

  return (
    <div className="ring-field">

		<Canvas
		  ref={canvasRef}
		  shadows
		  dispose={null}
		  style={{ background: isModelOnlyPreview ? '#ffffff !important' : '#f8f8f8 !important' }}
		  gl={{
  powerPreference: 'high-performance',
  antialias: false,
  preserveDrawingBuffer: true,
  failIfMajorPerformanceCaveat: false
}}
		>
		<GLBinder />
        <CameraResetter resetObj={resetObj} distance={cameraMinDistance} />
        <color attach="background" args={[isModelOnlyPreview ? '#ffffff' : '#f8f8f8']} />

        {/* Reduced ambient light for better shadow contrast */}
		<ambientLight
		intensity={engravingFocus ? 0.08 : 0.3}
		color="#e2e2e2"
		/>

		{engravingFocus && (
		<spotLight
		position={[0, 2, -0.8]}
		angle={0.25}
		penumbra={0.9}
		intensity={45}
		color="#ffffff"
		castShadow
		/>
		)}


        {/* Top-down directional light */}
        {/* <ambientLight intensity={0.5} /> */}

        <directionalLight
          position={[0, 20, 0]}
          intensity={15}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={1}
          shadow-camera-far={40}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
          shadow-bias={-0.0001}
        />

        <directionalLight
          position={[0, 5, 10]}
          intensity={1}
          color="#ffffff"
        />

        <group
          ref={groupRef}
          position={
            displayedIsDiamondWise
              ? (isMobile ? [0, -1, 0] : [0, -1, 0])
              : [0, ringFramePositionY, 0]
          }
          scale={[RING_GROUP_SCALE, RING_GROUP_SCALE, RING_GROUP_SCALE]}
        >
          {/* Standard ring. Stays mounted once used so toggling back to it is
              instant, and is only hidden (never unmounted) while a DiamondWise
              design is displayed. Its own Suspense boundary means a texture
              load here can never blank the DiamondWise ring. */}
          {hasMountedNormalRing && (
            <Suspense fallback={null}>
              <group visible={!displayedIsDiamondWise}>
                <Ring castShadow />
                {/* Head and centre stone share this transform - see
                    CENTRE-STONE ASSEMBLY SIZING above. */}
                {(!displayedIsNoHead || !targetIsNoHead) && (
                  <group
                    visible={!displayedIsNoHead}
                    scale={stoneAssemblyScale}
                    position={[0, stoneAssemblyOffsetY, 0]}
                  >
                    <Head castShadow />
                  </group>
                )}
                <MatchingBand castShadow />
              </group>
            </Suspense>
          )}

          {/* DiamondWise ring, isolated in its own Suspense boundary. It loads
              without suspending, so switching designs never tears down what is
              currently on screen. */}
          {hasMountedDiamondWiseRing && (
            <Suspense fallback={null}>
              <group visible={displayedIsDiamondWise}>
                <DiamondWiseRing />
              </group>
            </Suspense>
          )}

          {/* One shared centre stone for every ring type EXCEPT HALO - HALO's
              baked head asset supplies its own centre stone mesh (see
              objects/Head.jsx's HALOCENTER__-tagged node, rendered with the
              same diamond material/color/quality), so mounting this shared
              stone too would double it up. Positioned from the DISPLAYED
              configuration, so a new stone shape appears only together with
              the ring it belongs to. */}
          {/* When moving away from HALO, keep the shared diamond mounted but
              hidden while the old halo remains visible. The scene stage
              requires the incoming non-halo diamond to report ready; gating
              this component only on `displayedIsHalo` left it unmounted, so
              reset/head changes had to wait for the 45-second watchdog. */}
          {(!displayedIsSelfContainedHead || !targetIsSelfContainedHead) && (!displayedIsNoHead || !targetIsNoHead) && (
            <Suspense fallback={null}>
              <group
                visible={!displayedIsSelfContainedHead && !displayedIsNoHead}
                scale={stoneAssemblyScale}
                position={[0, displayedIsDiamondWise ? 0 : stoneAssemblyOffsetY, 0]}
              >
                <Diamond
                  rotation={[0, 0, 0]}
                  position={displayedIsDiamondWise ? diamondWiseDiamondPosition : [0, stoneAnchorY, 0]}
                  castShadow
                />
              </group>
            </Suspense>
          )}
        </group>

        <OrbitControls
          ref={orbitControlsRef}
          makeDefault
          autoRotate={view360 && !recording}
          autoRotateSpeed={4}
          enabled={!recording && !engravingFocus}
		  enableZoom={!engravingFocus}
          minDistance={engravingFocus ? ENGRAVING_ORBIT_MIN_DISTANCE : cameraMinDistance}
          maxDistance={10}
		  enablePan={false}
        />
        <CameraController view={cameraView} setView={setCameraView} engravingTargetY={engravingTargetY} sideSetting={displayed.ringSideSetting} shank={displayed.ringShank} />
        {capture && <Capture targetGroup={groupRef} />}
      
      </Canvas>
    </div>
  );
}

export default Scene;
