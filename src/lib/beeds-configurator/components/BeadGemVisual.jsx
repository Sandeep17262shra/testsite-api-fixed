import React, { useId } from "react";

import { isSvgBeadAsset } from "../assets";

/** Outward side shadow: blob hugs the bead rim and casts along the string radius. */
export const BEAD_DROP_SHADOW_OUTWARD_RATIO = 0.64;
export const BEAD_DROP_SHADOW_BLOB_RADIUS_RATIO = 0.82;

const BEAD_SCENE_LIGHT_TOWARD = { x: -0.34, y: -0.94 };

/** Unit vector from ring center through the bead (world / ring space). */
export function getBeadOutwardUnit(beadX, beadY, centerX, centerY) {
  const dx = beadX - centerX;
  const dy = beadY - centerY;
  const len = Math.hypot(dx, dy);
  if (len < 1e-3) {
    return { x: 0, y: 1 };
  }
  return { x: dx / len, y: dy / len };
}

export function getBeadDropShadowVisualParams(beadX, beadY, centerX, centerY) {
  const u = getBeadOutwardUnit(beadX, beadY, centerX, centerY);
  const lx = BEAD_SCENE_LIGHT_TOWARD.x;
  const ly = BEAD_SCENE_LIGHT_TOWARD.y;
  const lLen = Math.hypot(lx, ly) || 1;
  const nl = { x: lx / lLen, y: ly / lLen };
  const shadowFacing = -(u.x * nl.x + u.y * nl.y);
  const t = Math.max(0, Math.min(1, (shadowFacing + 1) / 2));
  return {
    opacity: 0.88 + t * 0.12,
    distanceScale: 0.98 + t * 0.03,
  };
}

export function getBeadOutwardDropShadowOffset(
  beadX,
  beadY,
  centerX,
  centerY,
  radius,
  distanceScale = 1
) {
  const u = getBeadOutwardUnit(beadX, beadY, centerX, centerY);
  const dist = radius * BEAD_DROP_SHADOW_OUTWARD_RATIO * distanceScale;
  return { x: u.x * dist, y: u.y * dist, angleDeg: (Math.atan2(u.y, u.x) * 180) / Math.PI };
}

/**
 * Angle (deg) to rotate bead-local lighting so shade points outward on the ring.
 * Bead art is already rotated by beadRotationDeg on the parent <g>.
 */
export function getBeadOutwardLightingAngleDeg(beadX, beadY, centerX, centerY, beadRotationDeg) {
  const u = getBeadOutwardUnit(beadX, beadY, centerX, centerY);
  const worldAngleRad = Math.atan2(u.y, u.x);
  const localRad = worldAngleRad - (beadRotationDeg * Math.PI) / 180;
  return (localRad * 180) / Math.PI;
}

function sanitizeSvgId(raw) {
  return `beads-gem-clip-${String(raw).replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

function gemId(idPrefix, name) {
  return `${idPrefix}${name}`;
}

function gemUrl(idPrefix, name) {
  return `url(#${gemId(idPrefix, name)})`;
}

/** @param {{ idPrefix?: string }} props */
export function BeadGemDefs({ idPrefix = "" }) {
  return (
    <>
      <filter
        id={gemId(idPrefix, "beads-gem-color-boost")}
        x="-12%"
        y="-12%"
        width="124%"
        height="124%"
        colorInterpolationFilters="sRGB"
      >
        <feColorMatrix in="SourceGraphic" type="saturate" values="1.38" result="gemSat" />
        <feComponentTransfer in="gemSat" result="gemContrast">
          <feFuncR type="linear" slope="1.06" intercept="-0.068" />
          <feFuncG type="linear" slope="1.05" intercept="-0.062" />
          <feFuncB type="linear" slope="1.07" intercept="-0.07" />
        </feComponentTransfer>
      </filter>

      <radialGradient
        id={gemId(idPrefix, "beads-gem-drop-shadow-fill")}
        cx="50%"
        cy="50%"
        r="50%"
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0%" stopColor="#26232a" stopOpacity="0.68" />
        <stop offset="45%" stopColor="#302c33" stopOpacity="0.46" />
        <stop offset="75%" stopColor="#464149" stopOpacity="0.19" />
        <stop offset="100%" stopColor="#6a6468" stopOpacity="0" />
      </radialGradient>

      <filter
        id={gemId(idPrefix, "beads-gem-drop-blur-wide")}
        x="-120%"
        y="-120%"
        width="340%"
        height="340%"
        filterUnits="objectBoundingBox"
        primitiveUnits="objectBoundingBox"
        colorInterpolationFilters="sRGB"
      >
        <feGaussianBlur stdDeviation="0.15" />
      </filter>

      <radialGradient
        id={gemId(idPrefix, "beads-gem-inward-shine")}
        cx="0.5"
        cy="0.28"
        r="0.52"
        fx="0.5"
        fy="0.22"
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.26" />
        <stop offset="42%" stopColor="#fff8f0" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
    </>
  );
}

const DRAG_SHADOW_SMOOTH_T = 0.34;

function svgCoord(n) {
  return Math.round(n * 1000) / 1000;
}

function lerpAngleDeg(from, to, t) {
  const delta = ((to - from + 540) % 360) - 180;
  return from + delta * t;
}

export function syncBeadPortableDropShadowGroup(
  shadowGroupEl,
  ringX,
  ringY,
  centerX,
  centerY,
  radius,
  smoothState = null
) {
  if (!shadowGroupEl) {
    return;
  }
  const shadowVisual = getBeadDropShadowVisualParams(ringX, ringY, centerX, centerY);
  const offset = getBeadOutwardDropShadowOffset(
    ringX,
    ringY,
    centerX,
    centerY,
    radius,
    shadowVisual.distanceScale
  );
  let along = Math.hypot(offset.x, offset.y);
  let angleDeg = offset.angleDeg;
  let opacity = shadowVisual.opacity;

  if (smoothState) {
    if (!smoothState.initialized) {
      smoothState.along = along;
      smoothState.angleDeg = angleDeg;
      smoothState.opacity = opacity;
      smoothState.initialized = true;
    } else {
      smoothState.along += (along - smoothState.along) * DRAG_SHADOW_SMOOTH_T;
      smoothState.angleDeg = lerpAngleDeg(smoothState.angleDeg, angleDeg, DRAG_SHADOW_SMOOTH_T);
      smoothState.opacity += (opacity - smoothState.opacity) * DRAG_SHADOW_SMOOTH_T;
    }
    along = smoothState.along;
    angleDeg = smoothState.angleDeg;
    opacity = smoothState.opacity;
  }

  shadowGroupEl.removeAttribute("transform");
  shadowGroupEl.setAttribute("opacity", String(svgCoord(opacity)));
  const wrap = shadowGroupEl.querySelector(".beads-2d-gem-drop-shadow-wrap");
  const circle = shadowGroupEl.querySelector(".beads-2d-gem-drop-shadow--halo");
  if (wrap) {
    wrap.setAttribute("transform", `rotate(${svgCoord(angleDeg)})`);
  }
  if (circle) {
    circle.setAttribute("cx", String(svgCoord(along)));
  }
}

export function BeadGemDropShadow({
  radius,
  offsetX = 0,
  offsetY = 0,
  angleDeg = 90,
  idPrefix = "",
  opacity = 1,
}) {
  const r = radius;
  const dist = Math.hypot(offsetX, offsetY);
  const along = dist > 1e-3 ? dist : r * BEAD_DROP_SHADOW_OUTWARD_RATIO;

  return (
    <g
      className="beads-2d-gem-drop-shadow-wrap"
      transform={`rotate(${angleDeg})`}
      opacity={opacity}
    >
      <circle
        className="beads-2d-gem-drop-shadow beads-2d-gem-drop-shadow--halo"
        cx={along}
        cy={0}
        r={r * BEAD_DROP_SHADOW_BLOB_RADIUS_RATIO}
        fill={gemUrl(idPrefix, "beads-gem-drop-shadow-fill")}
        filter={gemUrl(idPrefix, "beads-gem-drop-blur-wide")}
      />
    </g>
  );
}

/** Imperative updates for drag/fly ghosts (avoids React re-renders per frame). */
export function updateBeadPortableRingVisuals({
  shadowGroupEl,
  shineWrapEl,
  faceGroupEl,
  ringX,
  ringY,
  centerX,
  centerY,
  radius,
  rotation = 0,
  shadowSmoothState = null,
}) {
  let lightingAngleDeg = getBeadOutwardLightingAngleDeg(
    ringX,
    ringY,
    centerX,
    centerY,
    rotation
  );

  if (shadowSmoothState?.initialized) {
    if (shadowSmoothState.lightingAngleDeg == null) {
      shadowSmoothState.lightingAngleDeg = lightingAngleDeg;
    } else {
      shadowSmoothState.lightingAngleDeg = lerpAngleDeg(
        shadowSmoothState.lightingAngleDeg,
        lightingAngleDeg,
        DRAG_SHADOW_SMOOTH_T
      );
    }
    lightingAngleDeg = shadowSmoothState.lightingAngleDeg;
  } else if (shadowSmoothState) {
    shadowSmoothState.lightingAngleDeg = lightingAngleDeg;
  }

  const shineAngleDeg = lightingAngleDeg - 180;

  if (shadowGroupEl && Number.isFinite(radius)) {
    syncBeadPortableDropShadowGroup(
      shadowGroupEl,
      ringX,
      ringY,
      centerX,
      centerY,
      radius,
      shadowSmoothState
    );
  }
  if (shineWrapEl) {
    shineWrapEl.setAttribute("transform", `rotate(${svgCoord(shineAngleDeg)})`);
  }
  if (faceGroupEl) {
    faceGroupEl.setAttribute("transform", `rotate(${svgCoord(rotation)})`);
  }
}

/** @param {"full" | "face"} layer */
export function BeadGemVisual({
  href,
  width,
  height,
  className = "",
  imageProps = {},
  layer = "full",
  lightingAngleDeg = 90,
  idPrefix = "",
  shineWrapRef,
}) {
  const clipId = sanitizeSvgId(useId());
  const w = width;
  const h = height;
  const r = Math.max(w, h) / 2;
  const fromSvg = isSvgBeadAsset(href);
  const stackClass = fromSvg
    ? "beads-2d-gem-stack beads-2d-gem-stack--svg-source"
    : "beads-2d-gem-stack";
  const clipRef = `url(#${clipId})`;
  const shineAngleDeg = lightingAngleDeg - 180;

  if (layer !== "full" && layer !== "face") {
    return null;
  }

  return (
    <g className={stackClass}>
      <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
        <circle cx={0} cy={0} r={r} />
      </clipPath>

      <g className="beads-2d-gem-face" clipPath={clipRef}>
        <g className="beads-2d-gem-texture" filter={gemUrl(idPrefix, "beads-gem-color-boost")}>
          <image
            href={href}
            x={-w / 2}
            y={-h / 2}
            width={w}
            height={h}
            className={`beads-2d-svg-item beads-2d-svg-item--bead ${fromSvg ? "beads-2d-svg-item--bead-svg" : ""} ${className}`.trim()}
            preserveAspectRatio={fromSvg ? "xMidYMid meet" : "xMidYMid slice"}
            {...imageProps}
          />
        </g>
        <g
          ref={shineWrapRef}
          className="beads-2d-gem-inward-shine-wrap"
          transform={`rotate(${shineAngleDeg})`}
        >
          <circle
            className="beads-2d-gem-inward-shine"
            cx={0}
            cy={0}
            r={r}
            fill={gemUrl(idPrefix, "beads-gem-inward-shine")}
          />
          <ellipse
            className="beads-2d-gem-specular"
            cx={0}
            cy={-r * 0.24}
            rx={r * 0.16}
            ry={r * 0.11}
          />
        </g>
      </g>
    </g>
  );
}

/**
 * Drag/fly ghost stack. Shadow + shine are driven imperatively each frame so React
 * re-renders (e.g. snap gap) do not reset them and cause jitter.
 */
export function BeadGemPortableStack({
  href,
  width,
  height,
  rotation = 0,
  shadowGroupRef,
  faceScaleRef,
  faceGroupRef,
  shineWrapRef,
  idPrefix = "",
}) {
  const radius = Math.max(width, height) / 2;
  const along = radius * BEAD_DROP_SHADOW_OUTWARD_RATIO;

  return (
    <>
      <g
        ref={shadowGroupRef}
        className="beads-2d-ghost-bead-shadow beads-2d-bead-shadows-layer"
        pointerEvents="none"
      >
        <BeadGemDropShadow
          radius={radius}
          offsetX={along}
          offsetY={0}
          angleDeg={0}
          idPrefix={idPrefix}
        />
      </g>
      <g ref={faceScaleRef} className="beads-2d-ghost-bead-face-scale" pointerEvents="none">
        <g
          ref={faceGroupRef}
          className="beads-2d-ghost-bead-face"
          transform={`rotate(${rotation})`}
          pointerEvents="none"
        >
          <BeadGemVisual
            href={href}
            width={width}
            height={height}
            lightingAngleDeg={0}
            idPrefix={idPrefix}
            shineWrapRef={shineWrapRef}
          />
        </g>
      </g>
    </>
  );
}
