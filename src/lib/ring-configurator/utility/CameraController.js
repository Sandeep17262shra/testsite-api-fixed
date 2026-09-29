/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

// Per-shank camera framing for the engraving-zoom view. Same map + getter
// shape as ENGRAVING_POSITIONS / getEngravingLocalPosition in Ring.jsx -
// distance is how far back the camera sits, yOffset is added on top of the
// engraving's own world Y (engravingTargetY) to fine-tune vertical framing.
// Seeded with the current flat values (6.6 / 1.5) for every shank; adjust
// per shank as needed.
const ENGRAVING_ZOOM_CONFIG = {
  "PLAIN": { distance: 4.6, yOffset: -3 },
  "WIDE-PLAIN": { distance: 4.6, yOffset: -3 },
  "CATHEDRAL": { distance: 4.6, yOffset: -3 },
  "KNIFE-EDGE": { distance: 4.6, yOffset: -3 },
  "SPLIT": { distance: 4.6, yOffset: -3 },
  "TWISTED": { distance: 4.6, yOffset: -3 },
  "CHANNEL": { distance: 4.6, yOffset: -3 },
  "PLATE-PRONG": { distance: 4.6, yOffset: -3 },
};

// Same "side setting overrides a plain shank" rule as getEngravingLocalPosition
// in Ring.jsx, so this resolves to the same key that positioned the engraving.
const getEngravingZoomConfig = (sideSetting, shank) => {
  const mixSettingShank =
    sideSetting === "PLAIN" && shank !== "PLAIN" ? shank : sideSetting;
  return ENGRAVING_ZOOM_CONFIG[mixSettingShank] || ENGRAVING_ZOOM_CONFIG.PLAIN;
};

// ─── Head camera positions ────────────────────────────────────────────────
//
// Edit these values to tune a head's product shot without changing any shank
// view. `position` controls the camera direction; its current zoom distance is
// preserved so changing a head never unexpectedly zooms the shopper out.
// `target` is the point the camera looks at.
//
// DiamondWise heads intentionally share the `diamondwise` entry. Update that
// one entry to adjust all five DiamondWise heads together.
export const HEAD_CAMERA_POSITIONS = Object.freeze({
  "4-PRONG": { position: [10, 25, -13], target: [0, 0, 0] },
  "6-PRONG": { position: [10, 25, -13], target: [0, 0, 0] },
  BEZEL: { position: [10, 40, -13], target: [0, 0, 0] },
  "HIDDEN-HALO": { position: [5, 10, -13], target: [0, 0, 0] },
  "SINGLE-HALO": { position: [10, 40, -13], target: [0, 0, 0] },
  "DOUBLE-HALO": { position: [10, 40, -13], target: [0, 0, 0] },
  OVAL: { position: [0, 15, -13], target: [0, 0, 0] },
  TRAPEZOID: { position: [0, 15, -13], target: [0, 0, 0] },
  "HALF-MOON": { position: [0, 15, -13], target: [0, 0, 0] },
  PEAR: { position: [10, 20, -13], target: [0, 0, 0] },
  BAGUETTE: { position: [10, 20, -13], target: [0, 0, 0] },
  diamondwise: { position: [8, 15, -13], target: [0, 0, 0] },
});

const getHeadCameraPosition = (headId) =>
  HEAD_CAMERA_POSITIONS[headId] || HEAD_CAMERA_POSITIONS["4-PRONG"];

export function CameraController({ view, setView, engravingTargetY, sideSetting, shank }) {
  const { camera } = useThree();
  const orbitControlsRef = useThree((state) => state.controls);
  const prevViewRef = useRef(view);
  const animationRef = useRef(null);
  const isDraggingRef = useRef(false);
  const defaultFov = useRef(camera.fov);
  
  // Store initial distances for each view
  const viewDistances = useRef({
    perspective: null,
    top: null,
    front: null,
    side: null,
    perspectiveHeadView: null
  });

  const viewDirections = {
	engravingZoom: new THREE.Vector3(0, 2, -1).normalize(),
    perspective: new THREE.Vector3(10, 8, -13).normalize(),
    top: new THREE.Vector3(0, 15, 0.001).normalize(),
    front: new THREE.Vector3(0, 2, 15).normalize(),
    side: new THREE.Vector3(15, 2, 0).normalize(),
	perspectiveHeadView: new THREE.Vector3(10, 20, -13).normalize(),
  };
  const isHeadView = typeof view === "string" && view.startsWith("head:");
  const headCameraPosition = isHeadView
    ? getHeadCameraPosition(view.slice("head:".length))
    : null;
  
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
  // Aim at the engraving's own world height (passed down from Scene.jsx,
  // which knows the per-shank offsets) rather than a fixed guess - otherwise
  // zooming in this close would as likely frame empty air above the band as
  // the text itself.
  const engravingY = engravingTargetY ?? (isMobile ? 1.15 : 1);
  // Per-shank engraving-zoom camera framing - same map/getter pattern as
  // ENGRAVING_POSITIONS / getEngravingLocalPosition in Ring.jsx, keyed by the
  // same "side setting overrides a plain shank" rule, so it resolves to the
  // same shank key that positioned the engraving itself. Seeded with the
  // current values (distance 6.6, yOffset 1.5) for every shank - tune each
  // one here.
  const engravingZoomConfig = getEngravingZoomConfig(sideSetting, shank);
  const ENGRAVING_DISTANCE = engravingZoomConfig.distance;
  const viewTarget =
    view === "engravingZoom"
      ? new THREE.Vector3(0, engravingY + engravingZoomConfig.yOffset, 0)
      : headCameraPosition
        ? new THREE.Vector3(...headCameraPosition.target)
        : new THREE.Vector3(0, 0, 0);

  useEffect(() => {
    if (view) {
      if (view !== "custom") {
        animateCamera(prevViewRef.current);
      }
      prevViewRef.current = view;
    }

    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const handleDragStart = () => {
      if (view !== "custom") {
        setView("custom");
      }
    };

    canvas.addEventListener("mousedown", handleDragStart);
    canvas.addEventListener("touchstart", handleDragStart);

    return () => {
      canvas.removeEventListener("mousedown", handleDragStart);
      canvas.removeEventListener("touchstart", handleDragStart);
    };
  }, [view]);

  useEffect(() => {
    if (!orbitControlsRef) return;

    const originalOnStart = orbitControlsRef.onStart;
    const originalOnEnd = orbitControlsRef.onEnd;

    orbitControlsRef.onStart = (event) => {
      isDraggingRef.current = true;
      if (view !== "custom") {
        setView("custom");
      }
      if (originalOnStart) originalOnStart(event);
    };

    orbitControlsRef.onEnd = (event) => {
      isDraggingRef.current = false;
      if (originalOnEnd) originalOnEnd(event);
    };

    return () => {
      if (orbitControlsRef) {
        orbitControlsRef.onStart = originalOnStart;
        orbitControlsRef.onEnd = originalOnEnd;
      }
    };
  }, [orbitControlsRef, view, setView]);

  useEffect(() => {
    // Initialize view distances
    Object.keys(viewDirections).forEach(key => {
      const direction = viewDirections[key];
      const dist = viewDistances.current[key] || direction.length();
      viewDistances.current[key] = dist;
    });
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const animateCamera = (prevView = prevViewRef.current) => {
    if (!orbitControlsRef) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    orbitControlsRef.enabled = false;

    const startPosition = camera.position.clone();
    const startTarget = orbitControlsRef.target.clone();
	const targetFov = view === "engravingZoom" ? 40 : defaultFov.current;

    // Get current distance to target
    const currentDistance = startPosition.distanceTo(startTarget);
    
    // Store current distance for previous view so returning to it restores zoom
    if (prevView && prevView !== "engravingZoom" && prevView !== "custom" && viewDistances.current[prevView] !== undefined) {
      viewDistances.current[prevView] = currentDistance;
    }
    
    // Get direction for new view
    const direction = headCameraPosition
      ? new THREE.Vector3(...headCameraPosition.position).normalize()
      : viewDirections[view]?.clone();
    if (!direction) return;
    const distance = view === "engravingZoom"
      ? ENGRAVING_DISTANCE
      : (viewDistances.current[view] || currentDistance);
    
    // Calculate target position maintaining current zoom distance
    const targetPosition = new THREE.Vector3()
      .copy(viewTarget)
      .add(direction.multiplyScalar(distance));

    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
	  
		camera.fov = THREE.MathUtils.lerp(
		  camera.fov,
		  targetFov,
		  easeProgress
		);
		camera.updateProjectionMatrix();

	  
      orbitControlsRef.target.lerpVectors(startTarget, viewTarget, easeProgress);

      camera.lookAt(orbitControlsRef.target);
      orbitControlsRef.update();

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        camera.position.copy(targetPosition);
        orbitControlsRef.target.copy(viewTarget);
        camera.lookAt(orbitControlsRef.target);

        orbitControlsRef.enabled = true;
        orbitControlsRef.update();

        const canvas = document.querySelector("canvas");
        canvas?.focus();

        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  return null;
}
