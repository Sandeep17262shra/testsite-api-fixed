"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { PREVIEW_FOCUS_ANIM_MS, easeInOutCubic } from "./previewFocus";
import { usePreviewFocus } from "./contexts/PreviewFocusContext";
import {
  getBeads3DCameraPosition,
  getBeads3DOrbitDistance,
  getBeads3DSpacerFocusDistance,
  getBeads3DSpacerFocusMinDistance,
} from "./beadsPreview3DCamera";

const DEFAULT_ORBIT_TARGET = new THREE.Vector3(0, 0, 0);
const SPACER_ZOOM_ANIM_MS = PREVIEW_FOCUS_ANIM_MS + 120;
/** Skip dolly when already within this fraction of the focus distance. */
const SPACER_ZOOM_DISTANCE_TOLERANCE = 0.09;

function resolvePreviewFocusItem(settledItems, pattern, focusItemId, focusPatternIndex) {
  if (focusItemId) {
    const byId = settledItems.find((item) => item.id === focusItemId);
    if (byId) {
      return byId;
    }
  }
  if (focusPatternIndex != null && pattern[focusPatternIndex]) {
    const entry = pattern[focusPatternIndex];
    if (entry?.id) {
      return settledItems.find((item) => item.id === entry.id) ?? null;
    }
  }
  return null;
}

function getViewOffset(camera, target) {
  return camera.position.clone().sub(target);
}

function cameraAtDistance(target, offset, distance) {
  if (offset.lengthSq() < 1e-12) {
    return null;
  }
  return target.clone().add(offset.clone().normalize().multiplyScalar(distance));
}

function getCameraGoalPreservingView(camera, target, goalDistance, fallbackPosition) {
  const offset = getViewOffset(camera, target);
  const goal = cameraAtDistance(target, offset, goalDistance);
  if (goal) {
    return goal;
  }
  return fallbackPosition.clone();
}

function getRestoreCameraPreservingView(
  camera,
  target,
  defaultDistance,
  fallbackPosition
) {
  const offset = getViewOffset(camera, target);
  const goal = cameraAtDistance(target, offset, defaultDistance);
  if (goal) {
    return goal;
  }
  return fallbackPosition.clone();
}

function isNearDistance(currentDistance, goalDistance) {
  const band = Math.max(goalDistance * SPACER_ZOOM_DISTANCE_TOLERANCE, 0.12);
  return Math.abs(currentDistance - goalDistance) <= band;
}

function animateOrbit({
  controls,
  camera,
  targetFrom,
  targetTo,
  camFrom,
  camTo,
  durationMs,
  ease = easeInOutCubic,
  onComplete,
}) {
  const start = performance.now();
  let frame = null;
  const wasEnabled = controls.enabled;
  controls.enabled = false;

  const finish = () => {
    controls.enabled = wasEnabled;
    onComplete?.();
  };

  const tick = (now) => {
    const t = ease(Math.min(1, (now - start) / durationMs));
    controls.target.lerpVectors(targetFrom, targetTo, t);
    camera.position.lerpVectors(camFrom, camTo, t);
    controls.update();
    if (t < 1) {
      frame = requestAnimationFrame(tick);
    } else {
      controls.target.copy(targetTo);
      camera.position.copy(camTo);
      controls.update();
      finish();
    }
  };

  const onUserOrbit = () => {
    if (frame) {
      cancelAnimationFrame(frame);
      frame = null;
    }
    controls.removeEventListener("start", onUserOrbit);
    controls.enabled = true;
  };

  controls.addEventListener("start", onUserOrbit);
  frame = requestAnimationFrame(tick);

  return () => {
    controls.removeEventListener("start", onUserOrbit);
    if (frame) {
      cancelAnimationFrame(frame);
    }
    controls.enabled = wasEnabled;
  };
}

/**
 * When customize focus lands on a spacer, dolly closer along the current view axis
 * (keeps user orbit angle; target stays at bracelet center).
 */
export function usePreviewFocusSpacerZoom({
  controlsRef,
  settledItems,
  pattern,
  ringItems,
  stringRadiusPx,
  setOrbitMinDistance,
}) {
  const { camera } = useThree();
  const { focusItemId, focusPatternIndex } = usePreviewFocus();
  const cancelAnimRef = useRef(null);
  const zoomedRef = useRef(false);
  const zoomedItemIdRef = useRef(null);
  const zoomedPatternIndexRef = useRef(null);
  const settledRef = useRef(settledItems);
  const patternRef = useRef(pattern);
  const ringItemsRef = useRef(ringItems);
  const stringRadiusPxRef = useRef(stringRadiusPx);
  settledRef.current = settledItems;
  patternRef.current = pattern;
  ringItemsRef.current = ringItems;
  stringRadiusPxRef.current = stringRadiusPx;

  const getViewportMetrics = () => {
    const isMobile =
      typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches;
    const aspect = camera.aspect > 0 ? camera.aspect : 1.2;
    const stringRadiusPxValue = stringRadiusPxRef.current;
    const defaultCam = getBeads3DCameraPosition(stringRadiusPxValue, isMobile, aspect);
    const defaultDistance = getBeads3DOrbitDistance(stringRadiusPxValue, { isMobile, aspect });
    const focusDistance = getBeads3DSpacerFocusDistance(stringRadiusPxValue, isMobile, aspect);
    const focusMinDistance = getBeads3DSpacerFocusMinDistance(
      stringRadiusPxValue,
      isMobile,
      aspect
    );
    const fallbackFocusCam = defaultCam
      .clone()
      .normalize()
      .multiplyScalar(focusDistance);
    return {
      isMobile,
      aspect,
      defaultCam,
      defaultDistance,
      focusDistance,
      focusMinDistance,
      fallbackFocusCam,
    };
  };

  const stopActiveAnimation = () => {
    if (cancelAnimRef.current) {
      cancelAnimRef.current();
      cancelAnimRef.current = null;
    }
  };

  const restoreDefaultOrbit = () => {
    const controls = controlsRef.current;
    if (!controls || !zoomedRef.current) {
      return;
    }
    stopActiveAnimation();

    const { defaultCam, defaultDistance } = getViewportMetrics();
    const targetFrom = controls.target.clone();
    const camFrom = camera.position.clone();
    const camTo = getRestoreCameraPreservingView(
      camera,
      DEFAULT_ORBIT_TARGET,
      defaultDistance,
      defaultCam
    );

    cancelAnimRef.current = animateOrbit({
      controls,
      camera,
      targetFrom,
      targetTo: DEFAULT_ORBIT_TARGET.clone(),
      camFrom,
      camTo,
      durationMs: SPACER_ZOOM_ANIM_MS,
      onComplete: () => {
        zoomedRef.current = false;
        zoomedItemIdRef.current = null;
        zoomedPatternIndexRef.current = null;
        setOrbitMinDistance?.(null);
        cancelAnimRef.current = null;
      },
    });
  };

  useEffect(() => {
    return () => {
      stopActiveAnimation();
    };
  }, []);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!focusItemId && focusPatternIndex == null) {
      if (zoomedRef.current) {
        restoreDefaultOrbit();
      }
      return undefined;
    }
    if (!controls) {
      return undefined;
    }

    const item = resolvePreviewFocusItem(
      settledRef.current,
      patternRef.current,
      focusItemId,
      focusPatternIndex
    );

    if (!item || item.type !== "spacer") {
      if (zoomedRef.current) {
        restoreDefaultOrbit();
      }
      return undefined;
    }

    const ringIndex = ringItemsRef.current.findIndex((entry) => entry.id === item.id);
    if (ringIndex < 0) {
      return undefined;
    }

    const { focusDistance, focusMinDistance, fallbackFocusCam, defaultDistance } =
      getViewportMetrics();

    setOrbitMinDistance?.(focusMinDistance);

    const sameCustomizeSlot =
      zoomedRef.current &&
      focusPatternIndex != null &&
      focusPatternIndex === zoomedPatternIndexRef.current;

    if (sameCustomizeSlot) {
      zoomedItemIdRef.current = item.id;
      return undefined;
    }

    const currentDistance = camera.position.distanceTo(DEFAULT_ORBIT_TARGET);
    const alreadyInFocusBand =
      zoomedRef.current && isNearDistance(currentDistance, focusDistance);

    zoomedRef.current = true;
    zoomedItemIdRef.current = item.id;
    zoomedPatternIndexRef.current = focusPatternIndex;

    if (alreadyInFocusBand) {
      return undefined;
    }

    stopActiveAnimation();

    const targetFrom = controls.target.clone();
    const camFrom = camera.position.clone();
    const camTo = getCameraGoalPreservingView(
      camera,
      DEFAULT_ORBIT_TARGET,
      focusDistance,
      fallbackFocusCam
    );

    const distanceSpan = Math.abs(defaultDistance - focusDistance);
    const remaining = Math.abs(currentDistance - focusDistance);
    const spanT = distanceSpan > 1e-6 ? Math.min(1, remaining / distanceSpan) : 1;
    const durationMs = Math.round(
      SPACER_ZOOM_ANIM_MS * (0.42 + 0.58 * easeInOutCubic(spanT))
    );

    cancelAnimRef.current = animateOrbit({
      controls,
      camera,
      targetFrom,
      targetTo: DEFAULT_ORBIT_TARGET.clone(),
      camFrom,
      camTo,
      durationMs,
      onComplete: () => {
        cancelAnimRef.current = null;
      },
    });

    return undefined;
  }, [focusItemId, focusPatternIndex, controlsRef, camera, setOrbitMinDistance]);
}
