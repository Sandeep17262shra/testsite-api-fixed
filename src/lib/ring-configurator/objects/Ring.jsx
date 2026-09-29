import React, { useRef, useState, useEffect, useContext, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { MeshRefractionMaterial } from "@react-three/drei";
import { RGBELoader, EXRLoader } from "three-stdlib";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { RingContext } from "../contexts/RingContext";
import { DiamondContext } from "../contexts/DiamondContext";
import { SectionContext } from "../contexts/SectionContext";
import { useSceneStage } from "../contexts/SceneStageContext";
import { fetchDecrypted } from '../utility/modelLoader';
import { ensureAsset, getCachedAsset } from '../utility/assetCache';
import { parseGLTF } from '../utility/gltfParser';

// Constants
const COLORED_MESH_NAMES = new Set(["plain001", "metal002", "plain", "metal003"]);

// New default-only shanks (see priceConfig.js STORE_AVAILABLE_OPTIONS.default).
// Source GLBs had their mesh geometry nested under a rotated/scaled/translated
// parent "Empty" node (Blender's Z-up export convention) that this app's
// loader silently drops — it clones only leaf mesh nodes and reads raw
// geometry, discarding every ancestor transform. Before use, every one of
// these was re-baked: each node's full local transform (translation +
// rotation + scale, composed down the hierarchy) folded directly into its
// mesh's vertex data, node transforms then zeroed.
//
// The Head/centre-stone assembly (see Scene.jsx — <Head> is a sibling of
// <Ring>, positioned entirely independently of the shank) is FIXED and must
// stay that way, since it's shared by every shank; only the shank's own
// activePosition moves to meet it. Bounding-box math got the rotation fix
// right but not this part — matching PLATE-PRONG/CHANNEL's bounding box
// doesn't mean matching their head-junction height, since the head sits at a
// fixed world position regardless of which shank is under it. The values
// below were tuned by eye against the running app (band top reaching the
// head/prongs with no gap and no overlap), grouped by shank profile:
// CATHEDRAL-SIDE-STONE, TWISTED-2, FLUTED and BRAIDED each carve a notch/
// recess ("dept") into the band to seat the head — CATHEDRAL-SIDE-STONE
// needs lift 1.0, TWISTED-2/FLUTED/BRAIDED need 0.85 (their subtler relief
// needs slightly less than CATHEDRAL-SIDE-STONE's deeper notch). The
// remaining "whole round" designs (FRENCH-PAVE, PAVE-STONES, 8-STONES,
// MULTI-ROW, CHANNEL-2, PLATE-PRONG-2, SIDE-BEZEL-STONES) have no notch and
// need lift 1.0 too — same number as CATHEDRAL-SIDE-STONE by coincidence,
// arrived at independently.
// (Earlier passes: 0.6 — gap on all 11; then 0.86/1.18/1.4 — overlap on 10
// of 11; then 0.86/0.7/1.0 — fixed the overlap but left a visible gap on
// these 4 notched shanks specifically; 1.0/0.85/1.0 is the corrected,
// user-verified final values.) Of the 11,
// only the 8 pave/stone-set designs actually carry gem geometry; unlike
// CHANNEL/PLATE-PRONG (where the diamond mesh was authored separately and
// needs SETTING_SCALE to line back up), these are single unified exports —
// metal and gem meshes share one coordinate space, so they're scaled
// identically and only their glTF material name ("Gem ..." vs "Metal ...")
// tells them apart.
const NEW_DEFAULT_SHANKS = new Set([
  "FRENCH-PAVE", "PAVE-STONES", "8-STONES", "MULTI-ROW",
  "TWISTED-2", "FLUTED", "BRAIDED",
  "CATHEDRAL-SIDE-STONE", "SIDE-BEZEL-STONES",
  // CHANNEL/PLATE-PRONG added here (2026-09-18, Vervi's request): their
  // underlying GLB asset was swapped in place for CHANNEL-2/PLATE-PRONG-2's
  // geometry (see toEncPath note below and modelLoader.js ASSET_VERSION) so
  // the upgrade rolls out to every store automatically, with the shank ids
  // "CHANNEL"/"PLATE-PRONG" themselves, their price, and their store
  // availability all left untouched. Since the mesh data is now literally
  // identical to CHANNEL-2/PLATE-PRONG-2, they need the exact same
  // rendering treatment (scale, activePosition, material-based isDiamond)
  // this set already drives - added here rather than duplicating a parallel
  // branch. Their `sideSetting` in RingCustomizer.jsx's styleOptions was
  // also changed from "CHANNEL"/"PLATE-PRONG" to "PLAIN", since the old
  // sideSetting drove a SEPARATE diamond-overlay layer (renderSettingModels)
  // meant for the OLD raw shank+separate-diamond-mesh asset - left as-is it
  // would double-render diamonds on top of the new single-mesh geometry's
  // own baked-in stones.
  "CHANNEL", "PLATE-PRONG",
]);
const ENGRAVING_CANVAS_FONT_FAMILIES = {
  "Times New Roman": '"Times New Roman", Times, serif',
  "Dancing Script": '"Dancing Script", cursive',
  "Segoe UI": '"Segoe UI", Arial, sans-serif',
  Arial: "Arial, sans-serif",
};

// ─── The stone's environment ────────────────────────────────────────────────
// Same studio gem HDR and response curve as Diamond.jsx / Head.jsx /
// MatchingBand.jsx / DiamondWiseRing.jsx (see Diamond.jsx for the full
// derivation). The channel/plate-prong side diamonds on the shank itself go
// through this component, so they need the same map and curve or they'll
// render with the old flat-JPG look while the rest of the ring looks correct.
//
// TODO: duplicated across five files now — worth pulling into a shared
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
// `aberration` matters here for the same reason it did in Head.jsx and
// MatchingBand.jsx: side diamonds were previously hardcoded to
// aberrationStrength 0.02, which ran 3-6x hotter than the tuned centre-stone
// range and brought back the rainbow-smear look on every shank/setting
// diamond regardless of the selected cut.
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

// Configuration
export const ENGRAVING_POSITIONS = {
  // Each asset has a different inner-band profile. These positions keep the
  // text mask in the metal instead of using one shared offset for all shanks.
  "PLAIN": [0, 1.29, -0.05],
  "WIDE-PLAIN": [0, 0.57, 0],
  "CATHEDRAL": [0, 0.51, 0],
  "KNIFE-EDGE": [0, 0.57, 0],
  "SPLIT": [0, 1.265, 0],
  "TWISTED": [0, 0.57, 0],
  "CHANNEL": [0, 1.16, -0.05],
  "PLATE-PRONG": [0, 1.16, -0.05],
  // DiamondWise shanks (default placeholder coordinates — user can tune directly)
  "dw-jul-ma-02-shank": [0, 0.21, 0],
  "dw-ju-m-0031-shank": [0, 0.21, 0],
  "dw-mar-ma-019-shank": [0, 0.21, 0],
  "dw-LR1046-shank": [0, 0.21, 0],
  "dw-JAN027-shank": [0, 0.21, 0],
  "diamondwise-jul-ma-02": [0, 1.0, 0],
  "diamondwise-ju-m-0031": [0, 1.0, 0],
  "diamondwise-mar-ma-019": [0, 1.0, 0],
  "diamondwise-LR1046": [0, 1.0, 0],
  "diamondwise-JAN027": [0, 1.0, 0],
};

// Same "side setting overrides a plain shank" rule the engraving position
// itself follows below. Exported so Scene.jsx's engraving camera can target
// the actual engraving mesh instead of guessing a fixed world height - the
// engraving sits at a different local Y per shank/setting, and the ring
// group's own Y offset also changes per shank (see SHANK_FRAMING there), so
// a single hardcoded camera target can't stay correct across ring styles.
export const getEngravingLocalPosition = (sideSetting, shank) => {
  if (shank && ENGRAVING_POSITIONS[shank]) return ENGRAVING_POSITIONS[shank];
  const mixSettingShank =
    sideSetting === "PLAIN" && shank !== "PLAIN" ? shank : sideSetting;
  return ENGRAVING_POSITIONS[mixSettingShank] || ENGRAVING_POSITIONS.PLAIN;
};

const RING_SCALE = [0.40, 0.40, 0.45];
const SETTING_SCALE = [0.335, 0.335, 0.335];
const DEFAULT_ROTATION = [0, 0, 0];
const ENGRAVING_SCALE = [-0.3, 0.33, 0.315];

const ENGRAVING_LETTER_SPACING = 2.5;
function cloneMeshes(gltf) {
  const meshes = [];
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      const mesh = child.clone();
      mesh.geometry = child.geometry.clone();
      meshes.push(mesh);
    }
  });
  return meshes;
}

async function loadEncryptedMeshes(url) {
  const buffer = await fetchDecrypted(url);
  const gltf = await parseGLTF(buffer);
  const meshes = cloneMeshes(gltf);
  if (!meshes.length) throw new Error(`No meshes in ${url}`);
  return meshes;
}

const loadShank = (shank) =>
  ensureAsset("shank", shank, () => loadEncryptedMeshes(`/3d-models/RING-SHANK/${shank}.glb`));

const loadWeddingBand = (band) =>
  ensureAsset("wedding-band", band, () =>
    loadEncryptedMeshes(`/3d-models/WEDDING-BANDS/${band}.glb`)
  );

const loadSideSetting = (setting) =>
  ensureAsset("setting", setting, () =>
    loadEncryptedMeshes(`/3d-models/SIDE-RING-SETTING/${setting}.glb`)
  );

const DiamondMaterial = React.memo(({ envMap, color, ior, bounces, aberrationStrength, fresnel, opacity }) => {
  return (
    <MeshRefractionMaterial
      envMap={envMap}
      color={color}
      ior={ior}
      bounces={bounces}
      aberrationStrength={aberrationStrength}
      fresnel={fresnel}
      roughness={0}
      metalness={0}
      transparent
      opacity={opacity}
      toneMapped={false}
    />
  );
});

const FadeMeshRing = React.memo(({ geometry, position, rotation, scale, materialProps, color, isDiamond, diamondProps }) => {
  // Small accent/pave stones (isDiamond meshes here are always shank/side-setting
  // melee, never the hero stone - Head.jsx renders that separately) skip the
  // shadow pass entirely. Two shadow-casting lights (see Scene.jsx) each need a
  // full extra geometry pass per mesh, and with many-stone shanks (Multi-Row,
  // Side Bezel Stones, etc. - up to ~115 separate gem meshes, left unmerged so
  // MeshRefractionMaterial's per-mesh BVH stays correct) that adds up fast. A
  // stone this small casts no visible shadow anyway, and real diamonds don't
  // cast opaque shadows to begin with - light refracts through them - so this
  // is if anything more physically correct, not just a perf shortcut. Metal
  // keeps full shadowing.
  const castShadow = !isDiamond;
  const receiveShadow = !isDiamond;
  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      {isDiamond ? (
        <DiamondMaterial
          envMap={diamondProps.envMap}
          color={diamondProps.color}
          ior={diamondProps.ior}
          bounces={diamondProps.bounces}
          aberrationStrength={diamondProps.aberrationStrength}
          fresnel={diamondProps.fresnel}
          opacity={1}
        />
      ) : (
        <meshStandardMaterial
          {...materialProps}
          opacity={1}
          color={color}
        />
      )}
    </mesh>
  );
});

let cachedEngravingObj = null;
let engravingObjRequest = null;

// The engraving band is a 2.7 MB plain-text .obj. It must be fetched ONCE and
// the request must outlive the effect that started it: `engraving` changes on
// every keystroke, so an in-effect load was torn down and restarted on each
// character typed, and the download only ever finished if the shopper happened
// to stop typing for long enough. Sharing one module-level promise means a
// re-render can no longer discard a download that is already in flight.
function loadEngravingObj() {
  if (cachedEngravingObj) return Promise.resolve(cachedEngravingObj);
  if (!engravingObjRequest) {
    engravingObjRequest = new Promise((resolve, reject) => {
      new OBJLoader().load("/rings/ring_4.obj", resolve, undefined, reject);
    })
      .then((loadedObj) => {
        cachedEngravingObj = loadedObj;
        engravingObjRequest = null;
        return loadedObj;
      })
      .catch((error) => {
        // Drop the failed request so the next attempt starts clean instead of
        // inheriting the rejection.
        engravingObjRequest = null;
        throw error;
      });
  }
  return engravingObjRequest;
}

export const EngravingMesh = React.memo(function EngravingMesh({ customPosition } = {}) {
  const { ringColor, engraving, engravingFont, metalness, roughness, envMapIntensity, engravingFocus, ringSideSetting, ringShank } = useContext(RingContext);
  const { handleMetal } = useContext(SectionContext);
  const { displayed } = useSceneStage();

  const [textTexture, setTextTexture] = useState(null);
  const engravingRef = useRef();

  const metalTexture = useLoader(RGBELoader, handleMetal);
  metalTexture.mapping = THREE.EquirectangularReflectionMapping;

  const [obj, setObj] = useState(cachedEngravingObj);

  useEffect(() => {
    if (obj || (!engraving && !engravingFocus)) return undefined;

    let alive = true;
    loadEngravingObj()
      .then((loadedObj) => {
        if (alive) setObj(loadedObj);
      })
      .catch((error) => {
        console.error("Error loading engraving model (/rings/ring_4.obj):", error);
      });

    return () => {
      alive = false;
    };
  }, [engraving, engravingFocus, obj]);

  const engravingGeometry = useMemo(() => {
    if (!obj) return null;
    let geometry = null;
    obj.traverse((child) => {
      if (child.isMesh && child.name === "Cylinder") {
        geometry = child.geometry;
      }
    });
    return geometry;
  }, [obj]);

  const activeShank = displayed?.ringShank || ringShank;
  const activeSideSetting = displayed?.ringSideSetting || ringSideSetting;
  const engravePos = useMemo(
    () => customPosition || getEngravingLocalPosition(activeSideSetting, activeShank),
    [customPosition, activeSideSetting, activeShank]
  );

  useEffect(() => {
    if (!engraving) {
      setTextTexture(null);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1500;
    canvas.height = 35;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#858686";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const baseFont =
      ENGRAVING_CANVAS_FONT_FAMILIES[engravingFont] ||
      ENGRAVING_CANVAS_FONT_FAMILIES.Arial;
    let fontStyle = "normal";
    if (engravingFont === "Segoe UI") {
      fontStyle = "italic";
    }

    const symbolFont = "'Segoe UI Symbol', 'Arial Unicode MS', Arial, sans-serif";
    const y = canvas.height / 2 - 6;
    const symbolRegex = /[♡☆☾∞☯♑♓♈♉♒♋♌♍♎♏♐]/;
    const fontFor = (char) =>
      `${fontStyle} 13px ${symbolRegex.test(char) ? symbolFont : baseFont}`;

    const chars = [...engraving];
    const widths = chars.map((char) => {
      ctx.font = fontFor(char);
      return ctx.measureText(char).width;
    });
    const totalWidth =
      widths.reduce((a, b) => a + b, 0) +
      ENGRAVING_LETTER_SPACING * (chars.length - 1);

    let x = (canvas.width - totalWidth) / 2;
    chars.forEach((char, i) => {
      ctx.font = fontFor(char);
      ctx.fillText(char, x, y);
      x += widths[i] + ENGRAVING_LETTER_SPACING;
    });

    const canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTexture.anisotropy = 16;
    canvasTexture.wrapS = canvasTexture.wrapT = THREE.ClampToEdgeWrapping;
    canvasTexture.needsUpdate = true;

    setTextTexture(canvasTexture);

    return () => canvasTexture.dispose();
  }, [engraving, engravingFont]);

  const engravingMaterialProps = useMemo(() => {
    const baseColor = new THREE.Color(ringColor);
    const luminance = baseColor.r * 0.299 + baseColor.g * 0.587 + baseColor.b * 0.114;
    const shadowFactor = luminance > 0.6 ? 0.25 : 0.14;
    const shadowColor = baseColor.clone().multiplyScalar(shadowFactor);

    return {
      map: textTexture,
      transparent: true,
      opacity: 1,
      alphaTest: 0.01,
      depthTest: !engravingFocus,
      depthWrite: !engravingFocus,
      color: shadowColor,
      side: THREE.BackSide,
      metalness,
      roughness: Math.min(1, roughness + 0.4),
      envMap: metalTexture || undefined,
      envMapIntensity: envMapIntensity * 0.35,
    };
  }, [textTexture, ringColor, engravingFocus, metalness, roughness, metalTexture, envMapIntensity]);

  if (!engravingGeometry || !textTexture) return null;

  return (
    <mesh
      ref={engravingRef}
      geometry={engravingGeometry}
      position={engravePos}
      rotation={[0, engravingFocus ? 0 : Math.PI, 0]}
      scale={ENGRAVING_SCALE}
    >
      <meshStandardMaterial {...engravingMaterialProps} />
    </mesh>
  );
});

function Ring() {
  const { ringColor, engraving, engravingFont, ringWidth, metalness, roughness, reflectivity, clearcoat, clearcoatRoughness, envMapIntensity, engravingFocus } = useContext(RingContext);
  const { cut, clarity, diamondColorClarity } = useContext(DiamondContext);
  const { handleMetal } = useContext(SectionContext);
  const { target, displayed, reportPartReady } = useSceneStage();

  const [textTexture, setTextTexture] = useState(null);
  const engravingRef = useRef();

  // ───────────────────────────────────────────────────────────────────────
  // LOAD for `target`, RENDER from `displayed`.
  //
  // Only the layer that will actually be visible is downloaded: a side
  // setting replaces the plain shank on screen, so there is no point fetching
  // both. The previously displayed shank keeps rendering untouched until the
  // scene stage commits the new configuration.
  // ───────────────────────────────────────────────────────────────────────
  const targetKey = target.parts.ring;
  const isStandardTarget = !target.isDiamondWise;

  useEffect(() => {
    if (!isStandardTarget) return undefined;

    let alive = true;
    const [kind, name] = targetKey.split(":");
    const request = kind === "setting"
      ? loadSideSetting(name)
      : kind === "wedding-band"
      ? loadWeddingBand(name)
      : loadShank(name);

    request
      .catch((error) => {
        console.error(`Error loading ring model (${targetKey}):`, error);
      })
      .finally(() => {
        // Report either way — a missing model must not freeze the configurator.
        if (alive) reportPartReady("ring", targetKey);
      });

    return () => {
      alive = false;
    };
  }, [isStandardTarget, targetKey, reportPartReady]);

  // Load textures
  const metalTexture = useLoader(RGBELoader, handleMetal);
  metalTexture.mapping = THREE.EquirectangularReflectionMapping;

  const [obj, setObj] = useState(cachedEngravingObj);

  useEffect(() => {
    if (obj || (!engraving && !engravingFocus)) return undefined;

    let alive = true;
    loadEngravingObj()
      .then((loadedObj) => {
        if (alive) setObj(loadedObj);
      })
      .catch((error) => {
        // Previously a failed load was silent and never retried, so the
        // engraving simply never appeared.
        console.error("Error loading engraving model (/rings/ring_4.obj):", error);
      });

    // Only the state update is cancelled on re-render; the download itself
    // carries on and lands in the module cache.
    return () => {
      alive = false;
    };
  }, [engraving, engravingFocus, obj]);

  // Materials
  const ringMaterialProps = useMemo(() => ({
    color: ringColor || '#DBDBDB',
    metalness: metalness,
    roughness: roughness,
    reflectivity: reflectivity,
    clearcoat: clearcoat,
    clearcoatRoughness: clearcoatRoughness,
    envMap: metalTexture || undefined,
    envMapIntensity: envMapIntensity,
    transparent: engraving === "",
  }), [metalTexture, ringColor, engraving, metalness, roughness, reflectivity, clearcoat, clearcoatRoughness, envMapIntensity]);

  const engravingMaterialProps = useMemo(() => {
    const baseColor = new THREE.Color(ringColor);
    // Keep the engraving metal-toned and understated, like a shallow cut in
    // the shank rather than a dark printed label.
    const luminance = baseColor.r * 0.299 + baseColor.g * 0.587 + baseColor.b * 0.114;
    const shadowFactor = luminance > 0.6 ? 0.25 : 0.14;
    const shadowColor = baseColor.clone().multiplyScalar(shadowFactor);

    return {
      map: textTexture,
      transparent: true,
      opacity: 1,
      alphaTest: 0.01,
      // In product views, let the shank occlude the recessed mask. The
      // engraving close-up uses a locked camera, where drawing the mask over
      // the surface keeps the shallow cut legible without exposing it through
      // the ring from other angles.
      depthTest: !engravingFocus,
      depthWrite: !engravingFocus,
      color: shadowColor,
      side: THREE.BackSide,
      metalness,
      roughness: Math.min(1, roughness + 0.4),
      envMap: metalTexture || undefined,
      envMapIntensity: envMapIntensity * 0.35,
    };
  }, [textTexture, ringColor, engravingFocus, metalness, roughness, metalTexture, envMapIntensity]);

  // Studio gem HDR for shank/setting diamonds (see comment block above
  // CUT_BASELINE) — forced to full float so the response curve has real
  // numbers to work on, same as Diamond.jsx / Head.jsx / MatchingBand.jsx /
  // DiamondWiseRing.jsx.
  const texture = useLoader(EXRLoader, DIAMOND_ENV_PATH, (loader) => {
    if (typeof loader.setDataType === 'function') loader.setDataType(THREE.FloatType);
    else loader.type = THREE.FloatType;
  });
  useMemo(() => {
    applyGemEnvCurve(texture);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    // Equirectangular maps wrap the long way round, so S has to repeat -
    // clamping it smears the pixel column at the seam across every ray that
    // leaves the stone in that direction.
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    // All five gem components load the SAME '/env_gem_002.exr' through useLoader,
    // which hands every one of them the SAME cached texture object - so the LAST
    // component to run its setup wins for the whole scene. Mipmaps must stay OFF
    // here: drei's MeshRefractionMaterial samples this equirect map with
    // textureGrad(), and equirect U wraps (atan) along one meridian, so across that
    // seam the derivative jumps a full unit, the sampler reads a huge footprint and
    // drops to the coarsest mip - a flat average of the whole studio, ~3.5x brighter
    // than the map's actual content there. On screen that is the hard white line
    // drawn straight across the stones. See Diamond.jsx for the full note.
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
  }, [texture]);

  const { effectiveIor, effectiveBounces, aberrationStrength } = useMemo(() => {
    const base = CUT_BASELINE[cut] || CUT_BASELINE.Good;
    const clarityAdjust = CLARITY_ADJUSTMENT[clarity] || { iorOffset: 0, bouncesOffset: 0 };
    const colorAdjust = COLOR_CLARITY[diamondColorClarity] || { iorOffset: 0, bouncesOffset: 0 };

    let ior = base.ior + clarityAdjust.iorOffset + colorAdjust.iorOffset;
    let bounces = base.bounces + clarityAdjust.bouncesOffset + colorAdjust.bouncesOffset;

    // Same clamps as the other four files: ior kept in the calibrated range.
    // Bounces floored at 3 (was 4) and capped at 5 (was 6) - Vervi flagged the
    // small band-side stones as reading too "sparkly"/busy, and fewer internal
    // hops both calms that facet pattern down and is cheaper per-pixel for
    // MeshRefractionMaterial's raymarch, which matters with many small side
    // diamonds on screen at once (Multi-Row, Side Bezel Stones, etc).
    // Aberration also cut by ~35% for the same reason - chromatic dispersion
    // (rainbow fringing) is the biggest driver of a "busy" look at this scale.
    ior = Math.max(2.40, Math.min(2.55, ior));
    bounces = Math.max(3, Math.min(5, Math.round(bounces)));

    return {
      effectiveIor: ior,
      effectiveBounces: bounces,
      aberrationStrength: base.aberration * 0.65,
    };
  }, [cut, clarity, diamondColorClarity]);

  const diamondMaterialProps = useMemo(() => ({
    envMap: texture,
    ior: effectiveIor,
    bounces: effectiveBounces,
    aberrationStrength,
    // Same low edge-reflection value as the other four files — higher laid a
    // milky sheen over the whole stone instead of clear glass with bright
    // edges.
    fresnel: 0.5,
    toneMapped: false,
  }), [texture, effectiveIor, effectiveBounces, aberrationStrength]);

  // Everything below renders the DISPLAYED configuration.
  const displayedShank = displayed.ringShank;
  const displayedSideSetting = displayed.ringSideSetting;
  const isWeddingBandModel = displayed.ringHead === "NO-HEAD" &&
    ["CHANNEL", "PLATE-PRONG"].includes(displayedShank);
  const displayedLayer = displayedSideSetting === "PLAIN" ? "shank" : "setting";
  const commitId = displayed.commitId;

  const engravePos = useMemo(
    () => getEngravingLocalPosition(displayedSideSetting, displayedShank),
    [displayedSideSetting, displayedShank]
  );

  // Engraving texture
  useEffect(() => {
    if (!engraving) {
      setTextTexture(null);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1500;
    canvas.height = 35;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#858686";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const baseFont =
      ENGRAVING_CANVAS_FONT_FAMILIES[engravingFont] ||
      ENGRAVING_CANVAS_FONT_FAMILIES.Arial;
    var fontStyle = "normal";
    if (engravingFont === "Segoe UI") {
      fontStyle = "italic";
    }

    const symbolFont = "'Segoe UI Symbol', 'Arial Unicode MS', Arial, sans-serif";
    const y = canvas.height / 2 - 6;
    const symbolRegex = /[♡☆☾∞☯♑♓♈♉♒♋♌♍♎♏♐]/;
    const fontFor = (char) =>
      `${fontStyle} 13px ${symbolRegex.test(char) ? symbolFont : baseFont}`;

    // Measure every character first (spacing must be included before we
    // can center the whole string).
    const chars = [...engraving];
    const widths = chars.map((char) => {
      ctx.font = fontFor(char);
      return ctx.measureText(char).width;
    });
    const totalWidth =
      widths.reduce((a, b) => a + b, 0) +
      ENGRAVING_LETTER_SPACING * (chars.length - 1);

    let x = (canvas.width - totalWidth) / 2;
    chars.forEach((char, i) => {
      ctx.font = fontFor(char);
      ctx.fillText(char, x, y);
      x += widths[i] + ENGRAVING_LETTER_SPACING;
    });

    const canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTexture.anisotropy = 16;
    canvasTexture.wrapS = canvasTexture.wrapT = THREE.ClampToEdgeWrapping;
    canvasTexture.needsUpdate = true;

    setTextTexture(canvasTexture);

    return () => canvasTexture.dispose();
  }, [engraving, engravingFont]);

  // Engraving geometry
  const engravingGeometry = useMemo(() => {
    if (!obj) return null;
    let geometry = null;
    obj.traverse((child) => {
      if (child.isMesh && child.name === "Cylinder") {
        geometry = child.geometry;
      }
    });
    return geometry;
  }, [obj]);

  const renderRingModels = useMemo(() => {
    if (displayedLayer !== "shank") return null;

    const models = getCachedAsset(
      isWeddingBandModel ? "wedding-band" : "shank",
      displayedShank
    );
    if (!models) return null;

    const width = ringWidth / 10;
    const scale = [RING_SCALE[0], RING_SCALE[1], 0.40 + Number(width)];

    let activePosition = displayedShank === "PLAIN" ? [0, 0.75, 0] : displayedShank === "SPLIT" ? [0, 0.65, 0] : [0, 0.4, 0];
    if (displayedShank === "CATHEDRAL") {
      // Asset swap (2026-09-19, Vervi's new cathedral GLB): the new model's
      // own local top-Y (~7.463, after baking its Blender parent-node
      // transform into vertex data - the app drops all node transforms, only
      // raw POSITION/NORMAL buffers are used, same class of issue as
      // CRITICAL BUG #1 in the 11-shank batch) sits lower in local space than
      // the old asset's (~9.886). Both scale by RING_SCALE[1]=0.40 at render
      // time, so keeping the shared default 0.4 would leave a visible gap
      // under the head. Solved for worldTopY to match the old asset's head-
      // junction height exactly: 9.886*0.40+0.4 = 4.3544 (old) ==
      // 7.463*0.40+X (new) => X = 1.37.
      activePosition = [0, 1, 0];
    }
    if (displayedShank === "CATHEDRAL-SIDE-STONE") {
      // Re-tuned after the BUG #3 scale fix (scale/SETTING_SCALE = 0.40/0.335):
      // shrinking the geometry toward its own local origin pulls the band's
      // top edge down in world space by localTopY * (0.40 - 0.335) - measured
      // from this shank's own GLB bounding box (local max Y ~=7.63) that's
      // ~0.50, so the old 1.0 needs to become ~1.5 to keep the same
      // head-junction height as before the scale changed.
      activePosition = [0, 1.5, 0];
    } else if (displayedShank === "TWISTED-2") {
      // Re-tuned for the same reason as CATHEDRAL-SIDE-STONE/whole-round
      // shanks above: extending the SETTING_SCALE fix to this shank (was
      // `scale`) drops its world-space top edge by localTopY * (0.40 -
      // 0.335); measured localTopY ~=6.82 -> drop ~=0.44, so 0.85 -> ~1.29.
      activePosition = [0, 1.29, 0];
    } else if (displayedShank === "FLUTED") {
      // Same correction, this shank's own localTopY ~=6.86 -> drop ~=0.45.
      activePosition = [0, 1.30, 0];
    } else if (displayedShank === "BRAIDED") {
      // Same correction, this shank's own localTopY ~=6.28 -> drop ~=0.41.
      activePosition = [0, 1.3, 0];
    } else if (NEW_DEFAULT_SHANKS.has(displayedShank)) {
      // Re-tuned after the BUG #3 scale fix for the same reason as
      // CATHEDRAL-SIDE-STONE above: these 7 "whole round" shanks
      // (FRENCH-PAVE, PAVE-STONES, 8-STONES, MULTI-ROW, CHANNEL-2,
      // PLATE-PRONG-2, SIDE-BEZEL-STONES) share nearly the same local top-Y
      // (~6.24-6.37) and shrink factor, so the same ~0.41 lift applies to
      // all of them - old 1.0 becomes ~1.41. CHANNEL/PLATE-PRONG also land
      // here now (see NEW_DEFAULT_SHANKS comment above) since their new
      // geometry is literally CHANNEL-2/PLATE-PRONG-2's own model.
      activePosition = [0, 1.2, 0];
    }

    return models.map((mesh, i) => {
      const isPlainMesh = mesh.name === "plain001" || mesh.name === "plain";

      let showDiamond = scale;
      let isDiamond = "";
      if (isWeddingBandModel) {
        // Matching-band assets use mesh names to distinguish their metal from
        // their stones (the same convention used by MatchingBand.jsx).
        isDiamond = !COLORED_MESH_NAMES.has(mesh.name);
      } else if (NEW_DEFAULT_SHANKS.has(displayedShank)) {
        // All 11 new default-only shanks (not just the 8 gem-carrying ones)
        // were exported through the same pipeline as CHANNEL/PLATE-PRONG and
        // need the same fixed SETTING_SCALE (0.335), not `scale`
        // (RING_SCALE's 0.40, plus ringWidth for the Z axis) - using `scale`
        // rendered all 11 visibly bigger than the app's existing shanks.
        // First fix pass only touched GEM_MATERIAL_SHANKS (the 8 pave/
        // stone-set designs) reasoning that metal+gem share one coordinate
        // space in those exports and must scale identically or the gems
        // detach from their sockets - true, but it left TWISTED-2/FLUTED/
        // BRAIDED (no gem geometry, single metal mesh) on the old oversized
        // `scale`, which Vervi then flagged as still too big. Extending the
        // same SETTING_SCALE fix to the full NEW_DEFAULT_SHANKS set (a
        // superset of GEM_MATERIAL_SHANKS) covers all 11 uniformly. Tradeoff,
        // same as CHANNEL/PLATE-PRONG already accepts: these shanks no
        // longer grow/shrink with the ringWidth slider (every other gem-
        // bearing shank in the app already ignores it too).
        showDiamond = SETTING_SCALE;
        isDiamond = Boolean(mesh.material?.name?.toLowerCase().startsWith("gem"));
      }

      // Keep wedding Pave/Channel mesh transforms identical to MatchingBand.
      // Their stone meshes are authored at a smaller scale than the band;
      // applying the shank scale makes the stones appear to float outside it.
      const meshScale = isWeddingBandModel
        ? isPlainMesh
          ? RING_SCALE
          : mesh.name === "metal002"
          ? [0.33, 0.33, 0.33]
          : SETTING_SCALE
        : isPlainMesh
        ? RING_SCALE
        : mesh.name === "metal002"
        ? [0.33, 0.33, 0.33]
        : showDiamond;

      return (
        <FadeMeshRing
          key={`ring_${displayedShank}_${i}_${ringWidth}`}
          geometry={mesh.geometry}
          position={activePosition}
          rotation={DEFAULT_ROTATION}
          scale={meshScale}
          materialProps={ringMaterialProps}
          isDiamond={isDiamond}
          color={ringColor}
          diamondProps={isDiamond ? diamondMaterialProps : null}
        />
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedLayer, displayedShank, isWeddingBandModel, commitId, ringMaterialProps, ringColor, ringWidth, diamondMaterialProps]);

  const renderSettingModels = useMemo(() => {
    if (displayedLayer !== "setting") return null;

    const models = getCachedAsset("setting", displayedSideSetting);
    if (!models) return null;

    return models.map((mesh, i) => {
      const isPlainMesh = mesh.name === "plain001" || mesh.name === "plain";
      const isDiamond = !COLORED_MESH_NAMES.has(mesh.name);
      return (
        <FadeMeshRing
          key={`setting_${displayedSideSetting}_${i}`}
          geometry={mesh.geometry}
          position={[0, 0.6, 0]}
          rotation={DEFAULT_ROTATION}
          scale={isPlainMesh ? RING_SCALE : mesh.name === "metal002" ? [0.33, 0.33, 0.33] : SETTING_SCALE}
          materialProps={ringMaterialProps}
          isDiamond={isDiamond}
          color={COLORED_MESH_NAMES.has(mesh.name) ? ringColor : "#ffffff"}
          diamondProps={isDiamond ? diamondMaterialProps : null}
        />
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedLayer, displayedSideSetting, commitId, ringMaterialProps, ringColor, diamondMaterialProps]);

  return (
    <group>
      {renderRingModels}
      {renderSettingModels}
      <EngravingMesh />
    </group>
  );
}

export default React.memo(Ring);
