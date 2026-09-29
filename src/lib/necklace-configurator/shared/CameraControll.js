/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

export function CameraController({ view, setView, customViewPositions }) {
  const { camera } = useThree();
  const orbitControlsRef = useThree((state) => state.controls);
  const prevViewRef = useRef(view);
  const animationRef = useRef(null);
  const isDraggingRef = useRef(false);

  const defaultViewPositions = {
    perspective: {
      position: new THREE.Vector3(10, 8, -13),
      target: new THREE.Vector3(0, 0, 0),
    },
    top: {
      position: new THREE.Vector3(0, 15, 0.001),
      target: new THREE.Vector3(0, 0, 0),
    },
    front: {
      position: new THREE.Vector3(0, 2, 15),
      target: new THREE.Vector3(0, 0, 0),
    },
    side: {
      position: new THREE.Vector3(15, 2, 0),
      target: new THREE.Vector3(0, 0, 0),
    },
  };

  const viewPositions = {
    ...defaultViewPositions,
    ...customViewPositions,
  };

  useEffect(() => {
    if (view && view !== "custom" && viewPositions[view]) {
      prevViewRef.current = view;
      animateCamera();
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
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const animateCamera = () => {
    if (!orbitControlsRef || !view || !viewPositions[view]) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    orbitControlsRef.enabled = false;

    const startPosition = camera.position.clone();
    const startTarget = orbitControlsRef.target.clone();

    const rawTargetPos = viewPositions[view].position;
    const rawTargetLookAt = viewPositions[view].target;

    const targetPosition = rawTargetPos instanceof THREE.Vector3
      ? rawTargetPos
      : new THREE.Vector3(...rawTargetPos);
    const targetLookAt = rawTargetLookAt instanceof THREE.Vector3
      ? rawTargetLookAt
      : new THREE.Vector3(...rawTargetLookAt);

    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
      orbitControlsRef.target.lerpVectors(startTarget, targetLookAt, easeProgress);

      camera.lookAt(orbitControlsRef.target);
      orbitControlsRef.update();

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        camera.position.copy(targetPosition);
        orbitControlsRef.target.copy(targetLookAt);
        camera.lookAt(orbitControlsRef.target);

        orbitControlsRef.enabled = true; // Ensure controls are re-enabled
        orbitControlsRef.update();       // Ensure controls state is synced

        const canvas = document.querySelector("canvas");
        canvas?.focus();                 // Ensure canvas receives interaction again

        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  return null;
}
