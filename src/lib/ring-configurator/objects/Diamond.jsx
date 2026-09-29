import React, { useRef, useContext, useEffect, useMemo, forwardRef } from 'react';
import { useLoader, extend } from '@react-three/fiber';
import { MeshRefractionMaterial } from '@react-three/drei';
import { OBJLoader } from 'three-stdlib';
import { GLTFLoader } from 'three-stdlib';
import { EXRLoader } from 'three-stdlib';
import {
  Color, EquirectangularReflectionMapping, ClampToEdgeWrapping, RepeatWrapping,
  LinearFilter, FloatType,
} from 'three';
import { DiamondContext } from '../contexts/DiamondContext';
import { useSceneStage } from '../contexts/SceneStageContext';
import { fetchDecrypted, fetchPlainBuffer } from '../utility/modelLoader';
import { ensureAsset, getCachedAsset } from '../utility/assetCache';
import { parseGLTF } from '../utility/gltfParser';
import { FANCY_BASE_COLORS } from '../data/fancyDiamondColors';
import { getVisualCarat } from '../utility/visualCarat';

// Constants outside component
// ─── The stone's environment ────────────────────────────────────────────────
// This is what a refractive gem actually shows you: MeshRefractionMaterial has
// no lighting of its own, it traces rays through the stone and reads whatever
// this map holds wherever they come out. So the map IS the look.
//
// It used to be an ordinary JPG, and that is where the shattered, rainbow-
// smeared stone came from: an 8-bit photo has no real highlights - its
// brightest white is the same value as a sheet of paper - so nothing in it can
// read as a light source. The facets had no crisp speculars to bounce, only
// mid-greys, and every bounce muddied them further.
//
// This is the studio gem HDR the designer supplied. Being floating point it
// carries highlights many times brighter than white, which is what gives the
// facets their hard sparkle and the clean, mostly-colourless body of a real
// diamond.
const DIAMOND_ENV_PATH = '/env_gem_002.exr';

// ─── Response curve on that environment ─────────────────────────────────────
// The raw map is a physically correct studio: a few very small, very bright
// lights (up to ~260x white) in a much darker surround. Traced literally, that
// splits the stone in two - facets that happen to catch a light clip to flat
// white, facets that catch the surround fall to dark grey - and it reads as
// smoky rather than brilliant.
//
// Measured against the reference render, the difference was not brightness
// (mean luminance was within 7%) but SPREAD: the reference sits in a tight
// band with nothing clipped, ours had ~30% blown out and ~25% down in the
// darks. So the map is put through a compression curve before use:
//
//     v' = GAIN * v ^ CONTRAST
//
// CONTRAST < 1 pulls the extremes toward each other - it lifts the dark
// surround and reins the lights in - while leaving the ORDER of every sample
// untouched, so the facet pattern and the sparkle survive; only the brutal
// contrast between them goes.
//
// The exponent is fitted against the reference render's own luminance
// percentiles, measured off matched crops of the same stone. The DARK facets
// were the whole problem - ours sat at 0.14 linear where the reference sits at
// 0.43 - and the exponent is what lifts them. The brightest lights still come
// through it well above white (260x -> ~5x), so a facet that catches one still
// clips to a hard specular: it is the murk being flattened, not the sparkle.
const DIAMOND_ENV_CONTRAST = 0.9;
const DIAMOND_ENV_GAIN = 1.4;

// Applied once per loaded texture - useLoader hands back the same cached
// object to every stone, so the curve must not compound.
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

// Diamond shape paths - updated round to use GLB
const DIAMOND_SHAPES = {
  asscher: "/all_diamonds/asscher.obj",
  cushion: "/all_diamonds/cushion.obj",
  emerald: "/all_diamonds/emerald.obj",
  heart: "/all_diamonds/heart.obj",
  marquise: "/all_diamonds/marquise.obj",
  moval: "/all_diamonds/moval.obj",
  oval: "/all_diamonds/oval.obj",
  pear: "/all_diamonds/pear.obj",
  princess: "/all_diamonds/princess.obj",
  radiant: "/all_diamonds/radiant.obj",
  round: "/all_diamonds/round.glb"  // Changed to GLB format
};DIAMOND_SHAPES

// Diamond quality configurations
// const CUT_BASELINE = {
//   "Good": { ior: 2.40, bounces: 3, aberration: 0.03 },
//   "Very Good": { ior: 2.42, bounces: 4, aberration: 0.025 },
//   "Excellent": { ior: 2.44, bounces: 5, aberration: 0.02 },
//   "Ideal": { ior: 2.46, bounces: 6, aberration: 0.015 }
// };

// const CLARITY_ADJUSTMENT = {
//   "I1": { iorOffset: -0.03, bouncesOffset: -1 },
//   "SI2": { iorOffset: -0.02, bouncesOffset: -0.5 },
//   "SI1": { iorOffset: -0.01, bouncesOffset: 0 },
//   "VS2": { iorOffset: 0.005, bouncesOffset: 0.5 },
//   "VS1": { iorOffset: 0.01, bouncesOffset: 1 },
//   "VVS2": { iorOffset: 0.015, bouncesOffset: 1.5 },
//   "VVS1": { iorOffset: 0.02, bouncesOffset: 2 },
//   "FL/IF": { iorOffset: 0.025, bouncesOffset: 2.5 }
// };

// const COLOR_CLARITY = {
//   "L": { iorOffset: -0.03, bouncesOffset: -1, saturation: 0.85 },
//   "K": { iorOffset: -0.025, bouncesOffset: -0.8, saturation: 0.88 },
//   "J": { iorOffset: -0.02, bouncesOffset: -0.6, saturation: 0.92 },
//   "I": { iorOffset: -0.015, bouncesOffset: -0.4, saturation: 0.95 },
//   "H": { iorOffset: -0.01, bouncesOffset: -0.2, saturation: 0.97 },
//   "G": { iorOffset: -0.005, bouncesOffset: 0, saturation: 1.0 },
//   "F": { iorOffset: 0.00, bouncesOffset: 0.2, saturation: 1.03 },
//   "E": { iorOffset: 0.005, bouncesOffset: 0.4, saturation: 1.06 },
//   "D": { iorOffset: 0.01, bouncesOffset: 0.6, saturation: 1.09 }
// };

// Dispersion ("fire"). These used to be roughly double, which on the old LDR
// environment was the only thing making the stone look alive - there were no
// real highlights to split, so the splitting itself had to carry the sparkle,
// and it came out as pastel rainbow smeared across the table. The studio HDR
// supplies genuine speculars now, so the dispersion can go back to what a real
// stone shows: a hint of colour at the facet edges, not a film over the whole
// crown. Better cuts still disperse LESS, which is the right way round - a
// well-cut stone returns white light rather than scattering it.
//
// Measured against the reference: the environment is essentially colourless
// (mean saturation 0.012), so every warm flash on the stone is dispersion and
// nothing else. Ours was running at twice the reference's saturation - orange
// and red blotches where the reference shows only a faint blue-violet edge -
// so these are set from that measurement rather than by eye.
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

const QUALITY_ADJUSTMENT = {
  "Standard":     { iorOffset: -0.03, bouncesOffset: -1 },
  "Premium":    { iorOffset: 0.01, bouncesOffset: 1 },
  "High-End":  { iorOffset: 0.03, bouncesOffset: 3 }
};

const COLOR_CLARITY = {
  "L": { iorOffset: -0.025, bouncesOffset: -1,   saturation: 0.88 },
  "K": { iorOffset: -0.02,  bouncesOffset: -0.8, saturation: 0.90 },
  "J": { iorOffset: -0.015, bouncesOffset: -0.6, saturation: 0.93 },
  "I": { iorOffset: -0.01,  bouncesOffset: -0.4, saturation: 0.95 },
  "H": { iorOffset: -0.005, bouncesOffset: -0.2, saturation: 0.98 },
  "G": { iorOffset: 0.0,    bouncesOffset: 0,    saturation: 1.00 },
  "F": { iorOffset: 0.005,  bouncesOffset: 0.2,  saturation: 1.04 },
  "E": { iorOffset: 0.01,   bouncesOffset: 0.4,  saturation: 1.08 },
  "D": { iorOffset: 0.015,  bouncesOffset: 0.6,  saturation: 1.12 }
};

// Shape position configurations
const SHAPE_POSITIONS = {
  round: {
    position: [0, 4.35, 0],
    scale: (size) => [size-0.01, size+0.05, size-0.01]
  },
  princess: {
    position: [0, 4.35, 0],
    scale: (size) => [size, size, size]
  },
  cushion: {
    position: [0, 4.3, 0],
    scale: (size) => [size, size, size]
  },
  oval: {
    position: [0, 4.5, 0],
    scale: (size) => [size+0.02, size+0.07, size + 0.06]
  },
  moval: {
    position: [0, 4.5, 0],
    scale: (size) => [size+0.7, size+0.4, size + 0.6]
  },
  radiant: {
    position: [0, 4.4, 0],
    scale: (size) => [size + 0.23, size+0.2, size + 0.22]
  },
  pear: {
    position: [0, 4.5, -0.1],
    scale: (size) => [size, size, size ]
  },
  emerald: {
    position: [0, 4.5, 0],
    scale: (size) => [size + 0.08, size, size + 0.1]
  },
  marquise: {
    position: [0, 4.55, 0],
    scale: (size) => [size + 0.02, size+0.05 , size-0.01]
  },
  heart: {
    position: [0, 4.7, -0.2],
    scale: (size) => [size - 0.03, size+0.04, size - 0.03]
  },
  asscher: {
    position: [0, 4.5, 0],
    scale: (size) => [size, size, size]
  },
};

const headThreeStone = ["OVAL", "TRAPEZOID", "BAGUETTE", "PEAR", "HALF-MOON"];

// How far a heart sits above the head's stone anchor in a prong head. 0.05 is
// the gap the old hardcoded 4.55 had over the un-boosted anchor of 4.50, so at
// full-size heads nothing moves; below that the stone now follows the head up.
const HEART_PRONG_ANCHOR_OFFSET_Y = 0.05;

const FANCY_INTENSITY_ADJUSTMENT = {
  Light: { saturation: 0.4, lightness: 1.2 },
  Fancy: { saturation: 0.7, lightness: 1.1 },
  Intense: { saturation: 0.9, lightness: 1.0 },
  Vivid: { saturation: 1.1, lightness: 0.9 },
  Deep: { saturation: 1.0, lightness: 0.7 },
  Dark: { saturation: 0.8, lightness: 0.6 }
};

const FANCY_INTENSITY_ADJUSTMENT_QUALITY = {
  "Standard": { saturation: 1, lightness: 1 },
  "Premium": { saturation: 1, lightness: 1 },
  "High-End": { saturation: 1, lightness: 1 }
};


const GEMSTONE_COLORS = {
  "blue-sapphire": "#0047AB",
  "green-emerald": "#4AE2A1",
  "green-sapphire": "#00AB55",
  "moissanite": "#ffffff",
  "pink-sapphire": "#D1008F",
  "red-ruby": "#B71C1C",
  "yellow-sapphire": "#FFA94D",
};

// Extend Three.js with OBJLoader and GLTFLoader
extend({ OBJLoader, GLTFLoader });
async function loadDiamondGeometry(shape) {
  const shapePath = DIAMOND_SHAPES[shape] || DIAMOND_SHAPES.round;

  if (shapePath.endsWith('.glb')) {
    const buffer = await fetchDecrypted(shapePath);
    const gltf = await parseGLTF(buffer);
    let geometry;
    gltf.scene.traverse((child) => {
      if (child.isMesh && !geometry) geometry = child.geometry;
    });
    if (!geometry) throw new Error(`No geometry in diamond ${shape}`);
    return geometry;
  }

  const buffer = await fetchPlainBuffer(shapePath);
  const text = new TextDecoder().decode(buffer);
  const parsed = new OBJLoader().parse(text);
  const geometry = parsed.children[0]?.geometry;
  if (!geometry) throw new Error(`No geometry in diamond ${shape}`);
  return geometry;
}

const loadDiamond = (shape) => ensureAsset("diamond", shape, () => loadDiamondGeometry(shape));

const FadeMeshDiamond = React.memo(forwardRef(({ geometry, position, scale, materialProps, calculatedSize, shape, headType, ringHead, ringShank }, ref) => {
  let basePosition = position;
  if (ringHead === "BEZEL" && shape === "asscher")
    basePosition = [0.05, 4.5, 0];
  const diamondYOffset = ringShank === "WIDE-PLAIN" ? 0.22 : 0;
  // Heart in a prong head (4-PRONG / 6-PRONG). Its seat is a fixed offset ABOVE
  // the head's stone anchor, not a fixed world height: Head.jsx grows the head's
  // height for small and mid carats and scales it about its own mesh anchor, so
  // the seat the stone rests in rides up with the carat. Scene.jsx already feeds
  // that moved anchor in as `position`. Hardcoding 4.55 here ignored it, which
  // left the heart sitting low in the basket with its point pushed through the
  // underside. Reading the anchor off basePosition keeps the same seating the
  // stone had before the head-height change, at every carat.
  const heartProngPos = [-0.01, basePosition[1] + HEART_PRONG_ANCHOR_OFFSET_Y, -0.14];
  // HALO's own basket already anchors the seat correctly via
  // getHeadStoneAnchorY/shapeDataForHalo (see Head.jsx) - the heartProngPos
  // lift below is tuned for the classic 4-PRONG/6-PRONG basket only and
  // floats the heart stone visibly above the halo ring if applied here too.
  const rawPos = headThreeStone.includes(headType) ? [0, 4.2, 0] : shape === "heart" ? (ringHead === "BEZEL" ? [0, 4.6, -0] : ringHead === "HALO" ? basePosition : heartProngPos) : (shape === "radiant" && ringHead === "4-PRONG") ? [-0.01, 4.65, 0] : basePosition;
  const finalPosition = [rawPos[0], rawPos[1] + diamondYOffset, rawPos[2]];

  return (
    <mesh
      ref={ref}
      geometry={geometry}
      position={finalPosition}
      scale={shape === "emerald" ? [calculatedSize + 0.02, calculatedSize+0.03, calculatedSize + 0.06] : scale(calculatedSize)}
      castShadow
      receiveShadow
      rotation={[0, 0, 0]}
    >
      <MeshRefractionMaterial
        {...materialProps}
        transparent
        opacity={1}
      />
    </mesh>
  );
}));

function Diamond(props) {
  const ref = useRef();
  const shadowRef = useRef();
  const { cut, clarity, diamondColor, diamondSize, diamondColorClarity, fancyDiamond,
    fancyDiamondIntensity, colorType, selectedQuality, gemstone, activeTab, setDiamondColor } = useContext(DiamondContext);
  const { target, displayed, reportPartReady } = useSceneStage();

  // Load the stone's environment (see DIAMOND_ENV_PATH above). Forced to full
  // float so the response curve below has real numbers to work on.
  const texture = useLoader(EXRLoader, DIAMOND_ENV_PATH, (loader) => {
    if (typeof loader.setDataType === 'function') loader.setDataType(FloatType);
    else loader.type = FloatType;
  });
  useMemo(() => {
    applyGemEnvCurve(texture);
    texture.mapping = EquirectangularReflectionMapping;
    // Equirectangular maps wrap the long way round, so S has to repeat -
    // clamping it (as the old JPG did) smears the pixel column at the seam
    // across every ray that leaves the stone in that direction.
    texture.wrapS = RepeatWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    // ─── No mipmaps on this map, deliberately ──────────────────────────────
    // drei's MeshRefractionMaterial samples an equirectangular envMap with
    // textureGrad(), feeding it dFdx/dFdy of the equirect UV. Equirect U comes
    // from atan(), so it WRAPS from 1 back to 0 along one meridian. Across that
    // seam the screen-space derivative jumps by a full unit, the sampler reads
    // that as an enormous footprint and drops to the coarsest mip - a flat 1x1
    // average of the whole studio. On screen that is a hard bright line drawn
    // straight across the stone, and because the gradient is taken from the
    // CAMERA ray (correctMips), the line sweeps over the crown as the ring is
    // orbited. It is not a light in the scene: MeshRefractionMaterial ignores
    // scene lights entirely.
    //
    // With no mip chain there is no level for the bad gradient to select, so
    // every ray reads level 0 and the seam disappears. The map is small and
    // mostly smooth, so losing mip filtering costs nothing visible.
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
  }, [texture]);

  // ─────────────────────────────────────────────────────────────────────
  // LOAD for `target`, RENDER from `displayed`.
  //
  // This is what stops a newly picked stone shape from being dropped onto
  // the ring that is still on screen: the diamond only changes at the same
  // instant the rest of the ring does.
  // ─────────────────────────────────────────────────────────────────────
  const targetShape = target.shape;

  useEffect(() => {
    let alive = true;
    if (target.ringHead === "NO-HEAD") {
      reportPartReady("diamond", targetShape);
      return undefined;
    }
    loadDiamond(targetShape)
      .catch((error) => {
        console.error(`Error loading diamond model (${targetShape}):`, error);
      })
      .finally(() => {
        if (alive) reportPartReady("diamond", targetShape);
      });
    return () => {
      alive = false;
    };
  }, [targetShape, target.ringHead, reportPartReady]);

  const displayedShape = displayed.shape;
  const displayedGeometry = useMemo(
    () => getCachedAsset("diamond", displayedShape),
    [displayedShape, displayed.commitId]
  );

  const actualDiamondColor = useMemo(() => {
    if (activeTab === "Colorless") {
      return "#FFFFFF";
    }

    if (colorType === "fancygem" && gemstone) {
      return GEMSTONE_COLORS[gemstone] || diamondColor;
    }

    if (colorType === "fancycolored" && fancyDiamond && fancyDiamondIntensity) {
      const colorGroup = FANCY_BASE_COLORS[fancyDiamond] || {};
      return colorGroup[fancyDiamondIntensity] || diamondColor;
    }

    return diamondColor; // fallback
  }, [
    colorType,
    gemstone,
    fancyDiamond,
    fancyDiamondIntensity,
    diamondColor,
    activeTab
  ]);

  useEffect(() => {
    if (actualDiamondColor !== diamondColor) {
      setDiamondColor(actualDiamondColor);
    }
  }, [actualDiamondColor, diamondColor, setDiamondColor]);

  // Calculate material properties
  const { effectiveIor, effectiveBounces, aberrationStrength, colorSaturation, colorLightness, calculatedSize } = useMemo(() => {
    const base = CUT_BASELINE[cut] || CUT_BASELINE.Good;
    const qualityKey = selectedQuality && typeof selectedQuality === "object"
      ? selectedQuality.quality
      : "Standard";
    const clarityAdjust = QUALITY_ADJUSTMENT[qualityKey] || QUALITY_ADJUSTMENT.Standard;

    let colorAdjust;
    let intensityAdjust = { saturation: 1.0, lightness: 1.0 };

    if (colorType === "fancycolored") {
      intensityAdjust = FANCY_INTENSITY_ADJUSTMENT_QUALITY[selectedQuality?.quality] || FANCY_INTENSITY_ADJUSTMENT_QUALITY.Standard;
      colorAdjust = { iorOffset: 0, bouncesOffset: 0 };
    } else {
      colorAdjust = COLOR_CLARITY[diamondColorClarity] || { iorOffset: 0, bouncesOffset: 0, saturation: 1.0 };
      intensityAdjust = { saturation: colorAdjust.saturation, lightness: 1.0 };
    }

    // Drawn size follows the VISUAL carat, not the weight - see
    // utility/visualCarat.js. Price and copy still use diamondSize.
    const newCaratStatic = getVisualCarat(diamondSize) / 2;
    const minCarat = 0.5;
    const minSize = 0.30;
    const sizeStep = 0.015;
    const calculatedSize = minSize + ((newCaratStatic - minCarat) / 0.5) * sizeStep;

    let ior = base.ior + clarityAdjust.iorOffset + colorAdjust.iorOffset;
    let bounces = base.bounces + clarityAdjust.bouncesOffset + colorAdjust.bouncesOffset;

    ior = Math.max(2.40, Math.min(2.55, ior));
    // Refraction bounces are expensive, so the upper bound stays conservative -
    // side stones must not unexpectedly saturate mobile/integrated GPUs.
    //
    // The FLOOR matters just as much, and it used to be 2. A round brilliant
    // only returns light to the eye after the ray has crossed the stone and
    // reflected off BOTH pavilion halves, so it needs at least three internal
    // hops; at two the tracer runs out and reads the environment in whatever
    // direction the ray happened to be travelling still inside the stone. From
    // the side that is survivable - the light path in is short. Looked at
    // straight down the table, which is the longest path through the stone, it
    // is not: every facet returns roughly the same mid-grey and the diamond
    // reads as a flat grey disc.
    //
    // The stacked negative offsets made this the DEFAULT rather than an edge
    // case: cut "Good" (4) with quality "Standard" (-1) and colour "K" (-0.8)
    // lands on 2.2, so a freshly loaded ring was rendering at the floor. Grade
    // still drives the sparkle, it just no longer drops below the number of
    // bounces the shape physically needs to light up at all.
    bounces = Math.max(4, Math.min(6, Math.round(bounces)));

    return {
      effectiveIor: ior,
      effectiveBounces: bounces,
      aberrationStrength: base.aberration,
      colorSaturation: intensityAdjust.saturation,
      colorLightness: intensityAdjust.lightness,
      calculatedSize
    };
  }, [cut, clarity, diamondColorClarity, diamondSize, colorType, fancyDiamondIntensity, selectedQuality]);

  // Memoized material props
  const materialProps = useMemo(() => {
    const color = new Color(actualDiamondColor);
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);

    const adjustedSaturation = Math.max(0, Math.min(1, hsl.s * colorSaturation));
    const adjustedLightness = Math.max(0, Math.min(1, hsl.l * colorLightness));

    color.setHSL(hsl.h, adjustedSaturation, adjustedLightness);

    return {
      envMap: texture,
      // Edge reflection. At 1.5 this laid a milky white sheen over the whole
      // stone, which was hiding how little the old environment had to give.
      // Kept low so the crown reads as clear glass with bright edges, the way
      // the reference render does.
      fresnel: 0.5,
      color: color,
      ior: effectiveIor,
      bounces: effectiveBounces,
      aberrationStrength: aberrationStrength,
      toneMapped: false,
      transparent: true,
      fastChroma: true
    };
  }, [texture, actualDiamondColor, effectiveIor, effectiveBounces, aberrationStrength, colorSaturation, colorLightness]);

  // Nothing to draw until the very first stone has loaded, or when No Head is selected.
  if (!displayedGeometry || displayed.ringHead === "NO-HEAD") return null;

  const shapeConfig = SHAPE_POSITIONS[displayedShape] || SHAPE_POSITIONS.round;
  const { position, scale } = shapeConfig;

  return (
    <>
      {/* NOTE: drei's MeshRefractionMaterial builds its BVH once, on mount
          (useLayoutEffect with an empty dep array). Swapping the `geometry`
          prop on a mesh that stays mounted therefore leaves the refraction
          shader tracing the PREVIOUS stone's BVH — the facets and sparkle
          come out flat and smeared. Keying on the geometry remounts the mesh
          and its material, so every stone gets a BVH built from its own
          geometry. */}
      <FadeMeshDiamond
        key={`diamond_${displayedShape}_${displayedGeometry.uuid}`}
        ref={ref}
        geometry={displayedGeometry}
        position={position}
        scale={scale}
        calculatedSize={calculatedSize}
        materialProps={materialProps}
        shape={displayedShape}
        headType={displayed.ringHead}
        ringHead={displayed.ringHead}
        ringShank={displayed.ringShank}
        {...props}
      />

      {/* Shadow-only proxy (no animation needed) */}
      <mesh
        ref={shadowRef}
        geometry={displayedGeometry}
        scale={[calculatedSize, calculatedSize, calculatedSize]}
        castShadow
        receiveShadow={false}
        visible={false}
        position={[0, 0.0001, 0]}
      >
        <meshStandardMaterial color="black" />
      </mesh>
    </>
  );
}

export default React.memo(Diamond);
