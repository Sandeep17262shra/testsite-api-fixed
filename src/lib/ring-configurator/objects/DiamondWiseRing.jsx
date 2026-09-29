/* eslint-disable react/no-unknown-property */
import React, { useContext, useEffect, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { MeshRefractionMaterial } from "@react-three/drei";
import * as THREE from "three";
import { RGBELoader, EXRLoader } from "three-stdlib";
import { DiamondContext } from "../contexts/DiamondContext";
import { RingContext } from "../contexts/RingContext";
import { SectionContext } from "../contexts/SectionContext";
import { useSceneStage } from "../contexts/SceneStageContext";
import { fetchDecrypted } from "../utility/modelLoader";
import { ensureAsset, getCachedAsset } from "../utility/assetCache";
import { parseGLTF } from "../utility/gltfParser";
import { getVisualCaratForHead, getHeadTrimFactor } from "../utility/visualCarat";
import {
  DIAMONDWISE_HEAD_SHANK_Y_OFFSETS,
  getDiamondWiseDesignById,
  getDiamondWiseDesignByShankId,
} from "../data/diamondwiseDesigns";
import { EngravingMesh } from "./Ring";

const MIN_CARAT = 0.75;
const FALLBACK_DESIGN_ID = "diamondwise-jul-ma-02";

// ─── The stone's environment ────────────────────────────────────────────────
// Same studio gem HDR and response curve as Diamond.jsx / Head.jsx /
// MatchingBand.jsx (see Diamond.jsx for the full derivation). DiamondWise
// diamonds go through this component, so they need the same map and curve
// or they'll render with the old flat-JPG look while the rest of the
// configurator looks correct.
//
// TODO: duplicated across four files now — worth pulling into a shared
// `utility/diamondEnvironment.js` so a future tuning pass can't update some
// of them and silently miss the others.
const DIAMOND_ENV_PATH = '/env_gem_002.exr';
const DIAMOND_ENV_CONTRAST = 0.9;
const DIAMOND_ENV_GAIN = 1.4;

function applyGemEnvCurve(texture) {
  if (!texture || texture.userData?.gemCurveApplied) return texture;
  const data = texture.image?.data;
  if (!(data instanceof Float32Array)) return texture;   // not float: leave it alone

  for (let i = 0; i < data.length; i += 4) {
    data[i]     = DIAMOND_ENV_GAIN * Math.pow(Math.max(data[i], 0),     DIAMOND_ENV_CONTRAST);
    data[i + 1] = DIAMOND_ENV_GAIN * Math.pow(Math.max(data[i + 1], 0), DIAMOND_ENV_CONTRAST);
    data[i + 2] = DIAMOND_ENV_GAIN * Math.pow(Math.max(data[i + 2], 0), DIAMOND_ENV_CONTRAST);
  }
  texture.userData.gemCurveApplied = true;
  texture.needsUpdate = true;
  return texture;
}

// Diamond quality configurations — matches Diamond.jsx's CUT_BASELINE.
// DiamondWise stones were previously hardcoded to ior 2.45 / bounces 5 /
// aberration 0.015 regardless of cut, clarity, or colour grade, so a
// DiamondWise ring never reflected the same grade-driven sparkle as a
// standard-head ring built from the same selections.
const CUT_BASELINE = {
  "Good":       { ior: 2.45, bounces: 4, aberration: 0.0065 },
  "Very Good":  { ior: 2.47, bounces: 5, aberration: 0.0052 },
  "Excellent":  { ior: 2.49, bounces: 6, aberration: 0.0042 },
  "Ideal":      { ior: 2.51, bounces: 7, aberration: 0.0035 }
};

const CLARITY_ADJUSTMENT = {
  "I1":     { iorOffset: -0.03, bouncesOffset: -1 },
  "SI2":    { iorOffset: -0.015, bouncesOffset: -0.5 },
  "SI1":    { iorOffset: 0.0, bouncesOffset: 0 },
  "VS2":    { iorOffset: 0.01, bouncesOffset: 1 },
  "VS1":    { iorOffset: 0.015, bouncesOffset: 1.5 },
  "VVS2":   { iorOffset: 0.02, bouncesOffset: 2 },
  "VVS1":   { iorOffset: 0.025, bouncesOffset: 2.5 },
  "FL/IF":  { iorOffset: 0.03, bouncesOffset: 3 }
};

const COLOR_CLARITY = {
  "L": { iorOffset: -0.025, bouncesOffset: -1 },
  "K": { iorOffset: -0.02,  bouncesOffset: -0.8 },
  "J": { iorOffset: -0.015, bouncesOffset: -0.6 },
  "I": { iorOffset: -0.01,  bouncesOffset: -0.4 },
  "H": { iorOffset: -0.005, bouncesOffset: -0.2 },
  "G": { iorOffset: 0.0,    bouncesOffset: 0 },
  "F": { iorOffset: 0.005,  bouncesOffset: 0.2 },
  "E": { iorOffset: 0.01,   bouncesOffset: 0.4 },
  "D": { iorOffset: 0.015,  bouncesOffset: 0.6 }
};

/**
 * Straighten a head's carat response between two carats it is already correct at.
 *
 * The stacked curves (visual carat, cube root, per-design trim) do not have to
 * come out monotonic, and for the marquise baskets they did not: the head grew
 * to a peak at 2.5ct and then came back down to 5ct. The 5ct end was right and
 * the 1ct end was right; everything between them was oversized, worst at the
 * turning point.
 *
 * So for a design that asks for it, the two anchors are taken from its OWN
 * curve - whatever that currently evaluates to - and the carats in between are
 * ramped smoothly from one to the other. The ramp runs on the cube root of
 * carat, the same shape a real stone's width follows, so it rises quickly at
 * first and eases off, rather than marching up in a straight line.
 *
 * Taking the anchors from the live curve (instead of writing two numbers into
 * the data) means the ends stay put if HEAD_GROWTH or the trim is ever
 * retuned - only the shape between them is being fixed here.
 */
function rampHeadScale(carat, ramp, scaleAt) {
  const weight = Number(carat);
  if (!ramp || !Number.isFinite(weight)) return scaleAt(carat);

  const { fromCarat, toCarat } = ramp;
  if (weight <= fromCarat) return scaleAt(weight);

  const start = scaleAt(fromCarat);
  const end = scaleAt(toCarat);
  const span = Math.cbrt(toCarat) - Math.cbrt(fromCarat);
  if (span <= 0) return start;

  // No cap: continue the same cube-root ramp past toCarat so the head
  // keeps growing when the user selects carats above 5.
  const progress = (Math.cbrt(weight) - Math.cbrt(fromCarat)) / span;
  return start + (end - start) * progress;
}

/**
 * The supplied heads were authored for a 10 ct stone. Carat is a volume
 * measurement, so the cube root produces the corresponding linear scale.
 *
 * The weight it works from is the VISUAL carat, not the sold weight - the same
 * number the centre stone is drawn at (see utility/visualCarat.js). A
 * DiamondWise design carries its own integrated head, so Scene.jsx skips it
 * with the assembly scale and this function is the only thing sizing it. Left
 * on the raw weight the head kept growing on the old ramp while the stone it
 * holds grew on the compressed one, and above 2.5ct the basket and the stone
 * visibly came apart. Remapping here covers BOTH callers - the head mesh and
 * the `diamondPosition` Scene.jsx seats the stone at - so the two cannot drift.
 */
export function getDiamondWiseHeadTransform(rawDiamondSize, headDesignId, shankId) {
  const headDesign = getDiamondWiseDesignById(headDesignId);
  if (!headDesign) return { scale: 1, position: [0, 0, 0], diamondPosition: [0, 4.5, 0] };

  // This design's own curve at a given SOLD carat: the visual-carat remap, then
  // the cube root (weight is a volume, the model scales linearly), then any
  // per-design trim. `headTrimAboveKnee` lets one design pull its head in
  // further than the shared curve does - the marquise baskets need it. Trimming
  // the finished scale (rather than the carat feeding it) also carries the
  // stone seat down with the basket, since `positionY` and `diamondPosition`
  // below are both derived from this number.
  const headScaleAt = (soldCarat) => {
    const drawn = Number(getVisualCaratForHead(soldCarat));
    const boundedCarat = Number.isFinite(drawn)
      ? THREE.MathUtils.clamp(drawn, MIN_CARAT, headDesign.referenceCarat)
      : MIN_CARAT;
    const caratRatio = Math.cbrt(boundedCarat / headDesign.referenceCarat);
    return headDesign.modelScale * (
      headDesign.minHeadScaleRatio + (1 - headDesign.minHeadScaleRatio) * caratRatio
    ) * getHeadTrimFactor(soldCarat, headDesign.headTrimAboveKnee);
  };

  const scale = rampHeadScale(rawDiamondSize, headDesign.headScaleRamp, headScaleAt);
  const headShankOffsetY = DIAMONDWISE_HEAD_SHANK_Y_OFFSETS[headDesign.headId] || 0;
  const positionY =
    headDesign.headAttachmentY * (headDesign.modelScale - scale) +
    headShankOffsetY;
  const [stoneX, stoneY, stoneZ] = headDesign.headStoneCenter;

  return {
    scale,
    position: [0, positionY, 0],
    diamondPosition: [stoneX * scale, positionY + stoneY * scale, stoneZ * scale],
  };
}

const COLORLESS_SIDE_STONE = "#FFFFFF";

function isDiamondMesh(node) {
  return /(?:diamond|marquise)/i.test([node.name, node.material?.name].filter(Boolean).join(" "));
}

// DiamondWise models are served encrypted like every other model in the
// configurator — `fetchDecrypted` maps the `.glb` path to its `.enc` file, so
// no unprotected GLB is ever requested. They are loaded through the shared
// asset cache instead of `useGLTF` so that loading a new design never
// suspends — suspending would tear down the whole ring that is still on screen.
async function loadDiamondWiseScene(path) {
  const buffer = await fetchDecrypted(path);
  const gltf = await parseGLTF(buffer);
  return gltf.scene;
}

const loadDiamondWisePart = (path) =>
  ensureAsset("diamondwise", path, () => loadDiamondWiseScene(path));

function RingPart({ scene, metalMaterialProps, diamondMaterialProps, scale, position = [0, 0, 0] }) {
  // Render the GLB meshes individually so diamonds can use the same refraction
  // shader as the rest of the configurator, rather than a dull PBR fallback.
  const meshes = useMemo(() => {
    scene.updateWorldMatrix(true, true);
    const records = [];
    scene.traverse((node) => {
      if (!node.isMesh) return;
      records.push({
        key: node.uuid,
        geometry: node.geometry,
        matrix: node.matrixWorld.clone(),
        isDiamond: isDiamondMesh(node),
        castShadow: node.castShadow !== false,
        receiveShadow: node.receiveShadow !== false,
      });
    });
    return records;
  }, [scene]);

  return (
    <group position={position} scale={scale}>
      {meshes.map((mesh) => (
        <mesh
          key={mesh.key}
          geometry={mesh.geometry}
          matrix={mesh.matrix}
          matrixAutoUpdate={false}
          castShadow={mesh.castShadow}
          receiveShadow={mesh.receiveShadow}
        >
          {mesh.isDiamond ? (
            <MeshRefractionMaterial {...diamondMaterialProps} opacity={0.96} />
          ) : (
            <meshStandardMaterial {...metalMaterialProps} />
          )}
        </mesh>
      ))}
    </group>
  );
}

function DiamondWiseRing() {
  const { ringColor, headColor, biMetal, metalness, roughness, envMapIntensity } = useContext(RingContext);
  const { diamondSize, cut, clarity, diamondColorClarity } = useContext(DiamondContext);
  const { handleMetal } = useContext(SectionContext);
  const { target, displayed, reportPartReady } = useSceneStage();

  const metalEnvironment = useLoader(RGBELoader, handleMetal);

  // Studio gem HDR for DiamondWise diamonds (see comment block above
  // CUT_BASELINE) — forced to full float so the response curve has real
  // numbers to work on, same as Diamond.jsx / Head.jsx / MatchingBand.jsx.
  const diamondEnvironment = useLoader(EXRLoader, DIAMOND_ENV_PATH, (loader) => {
    if (typeof loader.setDataType === 'function') loader.setDataType(THREE.FloatType);
    else loader.type = THREE.FloatType;
  });
  useMemo(() => {
    applyGemEnvCurve(diamondEnvironment);
    diamondEnvironment.mapping = THREE.EquirectangularReflectionMapping;
    // Equirectangular maps wrap the long way round, so S has to repeat -
    // clamping it (as this file previously did on both axes) smears the
    // pixel column at the seam across every ray that leaves the stone in
    // that direction.
    diamondEnvironment.wrapS = THREE.RepeatWrapping;
    diamondEnvironment.wrapT = THREE.ClampToEdgeWrapping;
    // All five gem components load the SAME '/env_gem_002.exr' through useLoader,
    // which hands every one of them the SAME cached texture object - so the LAST
    // component to run its setup wins for the whole scene. Mipmaps must stay OFF
    // here: drei's MeshRefractionMaterial samples this equirect map with
    // textureGrad(), and equirect U wraps (atan) along one meridian, so across that
    // seam the derivative jumps a full unit, the sampler reads a huge footprint and
    // drops to the coarsest mip - a flat average of the whole studio, ~3.5x brighter
    // than the map's actual content there. On screen that is the hard white line
    // drawn straight across the stones. See Diamond.jsx for the full note.
    diamondEnvironment.minFilter = THREE.LinearFilter;
    diamondEnvironment.magFilter = THREE.LinearFilter;
    diamondEnvironment.generateMipmaps = false;
    diamondEnvironment.needsUpdate = true;
  }, [diamondEnvironment]);

  // ─── LOAD for `target` ───────────────────────────────────────────────
  const targetKey = target.parts.diamondwise;
  const targetPaths = useMemo(() => {
    if (!target.isDiamondWise) return null;
    const headDesign =
      getDiamondWiseDesignById(target.diamondWiseDesignId) ||
      getDiamondWiseDesignById(FALLBACK_DESIGN_ID);
    const shankDesign = getDiamondWiseDesignByShankId(target.ringShank) || headDesign;
    return { head: headDesign.headModelPath, shank: shankDesign.shankModelPath };
  }, [target.isDiamondWise, target.diamondWiseDesignId, target.ringShank]);

  useEffect(() => {
    if (!targetPaths) return undefined;

    let alive = true;
    Promise.all([
      loadDiamondWisePart(targetPaths.head),
      loadDiamondWisePart(targetPaths.shank),
    ])
      .catch((error) => {
        console.error("Error loading DiamondWise model:", error);
      })
      .finally(() => {
        if (alive) reportPartReady("diamondwise", targetKey);
      });

    return () => {
      alive = false;
    };
  }, [targetPaths, targetKey, reportPartReady]);

  // ─── RENDER from `displayed` ─────────────────────────────────────────
  const displayedDesigns = useMemo(() => {
    if (!displayed.isDiamondWise) return null;
    const headDesign =
      getDiamondWiseDesignById(displayed.diamondWiseDesignId) ||
      getDiamondWiseDesignById(FALLBACK_DESIGN_ID);
    const shankDesign = getDiamondWiseDesignByShankId(displayed.ringShank) || headDesign;
    return { headDesign, shankDesign };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayed.isDiamondWise, displayed.diamondWiseDesignId, displayed.ringShank, displayed.commitId]);

  const headTransform = useMemo(
    () =>
      displayedDesigns
        ? getDiamondWiseHeadTransform(
            diamondSize,
            displayedDesigns.headDesign.id,
            displayedDesigns.shankDesign.shankId
          )
        : null,
    [diamondSize, displayedDesigns]
  );

  // The same metal the rest of the configurator uses - see Ring.jsx and
  // Head.jsx, which both render it with meshStandardMaterial.
  //
  // This used to be a meshPhysicalMaterial, and that is what made DiamondWise
  // gold look off next to a standard ring. The two were handed the same values,
  // but `clearcoat` (1, from RingContext) is a physical-only property:
  // meshStandardMaterial ignores it, meshPhysicalMaterial applies it. A
  // full-strength clearcoat lays an untinted dielectric highlight over the
  // metal, which pulls its colour toward white - measured side by side on 14K
  // yellow gold, DiamondWise came out 17% less saturated than the standard
  // shank (0.300 vs 0.362) with blue lifted from 131 to 143, at the same
  // brightness. Matching the material type is what puts the tint back.
  //
  // `reflectivity` is passed for the same reason the other two files pass it:
  // it is inert on a standard material, and kept only so the prop lists match.
  const shankMetalMaterialProps = useMemo(() => {
    metalEnvironment.mapping = THREE.EquirectangularReflectionMapping;
    return {
      color: ringColor,
      metalness,
      roughness,
      envMap: metalEnvironment,
      envMapIntensity,
      side: THREE.DoubleSide,
    };
  }, [metalEnvironment, ringColor, metalness, roughness, envMapIntensity]);

  const headMetalMaterialProps = useMemo(() => {
    metalEnvironment.mapping = THREE.EquirectangularReflectionMapping;
    return {
      color: biMetal === "Yes" && headColor ? headColor : ringColor,
      metalness,
      roughness,
      envMap: metalEnvironment,
      envMapIntensity,
      side: THREE.DoubleSide,
    };
  }, [metalEnvironment, biMetal, headColor, ringColor, metalness, roughness, envMapIntensity]);

  const { effectiveIor, effectiveBounces, aberrationStrength } = useMemo(() => {
    const base = CUT_BASELINE[cut] || CUT_BASELINE.Good;
    const clarityAdjust = CLARITY_ADJUSTMENT[clarity] || { iorOffset: 0, bouncesOffset: 0 };
    const colorAdjust = COLOR_CLARITY[diamondColorClarity] || { iorOffset: 0, bouncesOffset: 0 };

    let ior = base.ior + clarityAdjust.iorOffset + colorAdjust.iorOffset;
    let bounces = base.bounces + clarityAdjust.bouncesOffset + colorAdjust.bouncesOffset;

    // Same clamps as Diamond.jsx / Head.jsx / MatchingBand.jsx: ior kept in
    // the calibrated range, bounces floored at 4 so a stone always gets
    // enough internal hops to read as a facet pattern rather than a flat
    // grey disc, and capped at 6 to stay GPU-safe.
    ior = Math.max(2.40, Math.min(2.55, ior));
    bounces = Math.max(4, Math.min(6, Math.round(bounces)));

    return {
      effectiveIor: ior,
      effectiveBounces: bounces,
      aberrationStrength: base.aberration,
    };
  }, [cut, clarity, diamondColorClarity]);

  // Stones built into the DiamondWise head/shank models are accent stones and
  // stay colourless; only the centre stone (Diamond.jsx) takes the selected
  // diamond / gemstone colour.
  const diamondMaterialProps = useMemo(() => ({
    envMap: diamondEnvironment,
    color: new THREE.Color(COLORLESS_SIDE_STONE),
    ior: effectiveIor,
    bounces: effectiveBounces,
    aberrationStrength,
    // Same low edge-reflection value as Diamond.jsx / Head.jsx /
    // MatchingBand.jsx — higher laid a milky sheen over the whole stone
    // instead of clear glass with bright edges.
    fresnel: 0.5,
    toneMapped: false,
    transparent: true,
    fastChroma: true,
  }), [diamondEnvironment, effectiveIor, effectiveBounces, aberrationStrength]);

  if (!displayedDesigns || !headTransform) return null;

  const headScene = getCachedAsset("diamondwise", displayedDesigns.headDesign.headModelPath);
  const shankScene = getCachedAsset("diamondwise", displayedDesigns.shankDesign.shankModelPath);
  if (!headScene || !shankScene) return null;

  return (
    <>
      <RingPart
        scene={headScene}
        metalMaterialProps={headMetalMaterialProps}
        diamondMaterialProps={diamondMaterialProps}
        scale={headTransform.scale}
        position={headTransform.position}
      />
      <RingPart
        scene={shankScene}
        metalMaterialProps={shankMetalMaterialProps}
        diamondMaterialProps={diamondMaterialProps}
        scale={displayedDesigns.shankDesign.modelScale}
      />
      <EngravingMesh />
    </>
  );
}

export default React.memo(DiamondWiseRing);