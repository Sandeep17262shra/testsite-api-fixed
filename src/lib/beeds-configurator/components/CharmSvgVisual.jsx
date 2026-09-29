import React, { useId } from "react";

import { getCharmPendantLayout } from "../beadRingLayout";

function charmGradientId(idPrefix) {
  return `${idPrefix}beads-charm-gold-gradient`;
}

export function CharmGoldDefs({ idPrefix = "" }) {
  const gradId = charmGradientId(idPrefix);
  return (
    <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#F6E27A" />
      <stop offset="45%" stopColor="#D4AF37" />
      <stop offset="100%" stopColor="#A67C00" />
    </linearGradient>
  );
}

function CharmJumpRing({ jumpRing, stroke }) {
  if (!jumpRing) {
    return null;
  }

  const common = {
    className: "beads-2d-charm-jump-ring",
    fill: "none",
    stroke,
    strokeWidth: jumpRing.strokeWidth,
    strokeLinecap: "round",
    vectorEffect: "non-scaling-stroke",
  };

  if (jumpRing.edgeOn && (jumpRing.rx != null || jumpRing.ry != null)) {
    return (
      <ellipse
        {...common}
        cx={jumpRing.cx}
        cy={jumpRing.cy}
        rx={jumpRing.rx ?? jumpRing.r}
        ry={jumpRing.ry ?? jumpRing.r}
        className="beads-2d-charm-jump-ring beads-2d-charm-jump-ring--edge-on"
      />
    );
  }

  if (jumpRing.rx != null || jumpRing.ry != null) {
    return (
      <ellipse
        cx={jumpRing.cx}
        cy={jumpRing.cy}
        rx={jumpRing.rx ?? jumpRing.r}
        ry={jumpRing.ry ?? jumpRing.r}
        {...common}
      />
    );
  }

  return <circle cx={jumpRing.cx} cy={jumpRing.cy} r={jumpRing.r} {...common} />;
}

function CharmBailFrontArc({ arc, stroke }) {
  if (!arc) {
    return null;
  }

  return (
    <path
      className="beads-2d-charm-jump-ring beads-2d-charm-jump-ring--front"
      d={`M ${arc.x1} ${arc.y1} A ${arc.rx} ${arc.ry} 0 0 0 ${arc.x2} ${arc.y2}`}
      fill="none"
      stroke={stroke}
      strokeWidth={arc.strokeWidth}
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
  );
}

export function CharmPendantSvg({ parts, imageHref, idPrefix = "" }) {
  const stroke = `url(#${charmGradientId(idPrefix)})`;

  return (
    <>
      <CharmJumpRing jumpRing={parts.stringJumpRing} stroke={stroke} />
      {parts.image && (
        <image
          href={imageHref}
          x={parts.image.x}
          y={parts.image.y}
          width={parts.image.width}
          height={parts.image.height}
          className="beads-2d-svg-item beads-2d-svg-item--charm"
          preserveAspectRatio="xMidYMin meet"
        />
      )}
      <CharmBailFrontArc arc={parts.stringBailFrontArc} stroke={stroke} />
    </>
  );
}

function expandBounds(bounds, x, y) {
  bounds.minX = Math.min(bounds.minX, x);
  bounds.minY = Math.min(bounds.minY, y);
  bounds.maxX = Math.max(bounds.maxX, x);
  bounds.maxY = Math.max(bounds.maxY, y);
}

/** Layout for fly-in / portal: attachment at (0,0), viewBox centered on charm image. */
export function buildCharmFlyInGhostLayout(targetItem) {
  if (!targetItem?.asset?.image) {
    return null;
  }

  const pendant = getCharmPendantLayout({ ...targetItem, x: 0, y: 0 });
  const parts = {
    stringJumpRing: pendant.stringJumpRing,
    stringBailFrontArc: pendant.stringBailFrontArc,
    image: pendant.charmImage,
  };
  const center = { x: 0, y: 0 };
  const bounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  if (parts.image) {
    expandBounds(bounds, parts.image.x, parts.image.y);
    expandBounds(
      bounds,
      parts.image.x + parts.image.width,
      parts.image.y + parts.image.height
    );
  }

  const ring = parts.stringJumpRing;
  if (ring) {
    const rx = ring.rx ?? ring.r ?? 0;
    const ry = ring.ry ?? ring.r ?? 0;
    expandBounds(bounds, ring.cx - rx, ring.cy - ry);
    expandBounds(bounds, ring.cx + rx, ring.cy + ry);
  }

  const arc = parts.stringBailFrontArc;
  if (arc) {
    expandBounds(bounds, arc.x1, arc.y1);
    expandBounds(bounds, arc.x2, arc.y2);
  }

  if (!Number.isFinite(bounds.minX)) {
    bounds.minX = center.x - 14;
    bounds.maxX = center.x + 14;
    bounds.minY = center.y - 14;
    bounds.maxY = center.y + 14;
  }

  const padding = 8;
  const halfW = Math.max(center.x - bounds.minX, bounds.maxX - center.x) + padding;
  const halfH = Math.max(center.y - bounds.minY, bounds.maxY - center.y) + padding;

  return {
    parts,
    viewBox: `${center.x - halfW} ${center.y - halfH} ${halfW * 2} ${halfH * 2}`,
    layoutWidth: halfW * 2,
    layoutHeight: halfH * 2,
    imageHref: targetItem.asset.image,
  };
}

export function BeadsFlyInCharmGhost({ targetItem }) {
  const idPrefix = `${useId().replace(/[^a-zA-Z0-9_-]/g, "")}-`;
  const layout = buildCharmFlyInGhostLayout(targetItem);

  if (!layout) {
    return null;
  }

  return (
    <svg
      className="beads-fly-in-ghost__svg beads-fly-in-ghost__svg--charm"
      viewBox={layout.viewBox}
      width="100%"
      height="100%"
      overflow="visible"
      aria-hidden="true"
    >
      <CharmGoldDefs idPrefix={idPrefix} />
      <CharmPendantSvg parts={layout.parts} imageHref={layout.imageHref} idPrefix={idPrefix} />
    </svg>
  );
}
