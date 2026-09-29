import React, { useId } from "react";

import { BeadGemDefs, BeadGemPortableStack } from "./BeadGemVisual";

export function BeadsFlyInBeadGhost({
  ghost,
  shadowGroupRef,
  faceScaleRef,
  faceGroupRef,
  shineWrapRef,
}) {
  const idPrefix = `${useId().replace(/[^a-zA-Z0-9_-]/g, "")}-`;
  const w = ghost.width;
  const h = ghost.height;

  return (
    <svg
      className="beads-fly-in-ghost__svg"
      viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`}
      width="100%"
      height="100%"
      overflow="visible"
      aria-hidden="true"
    >
      <BeadGemDefs idPrefix={idPrefix} />
      <BeadGemPortableStack
        href={ghost.asset.image}
        width={w}
        height={h}
        rotation={0}
        shadowGroupRef={shadowGroupRef}
        faceScaleRef={faceScaleRef}
        faceGroupRef={faceGroupRef}
        shineWrapRef={shineWrapRef}
        idPrefix={idPrefix}
      />
    </svg>
  );
}
