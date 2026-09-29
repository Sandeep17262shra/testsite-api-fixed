import React, { useContext, useEffect, useMemo } from "react";
import { RingContext } from "../contexts/RingContext";
import { useLoader } from "@react-three/fiber";
import { RGBELoader, EXRLoader } from "three-stdlib";
import * as THREE from "three";
import { MeshRefractionMaterial } from "@react-three/drei";
import { DiamondContext } from "../contexts/DiamondContext";
import { SectionContext } from "../contexts/SectionContext";
import { useSceneStage } from "../contexts/SceneStageContext";
import { fetchDecrypted } from '../utility/modelLoader';
import { ensureAsset, getCachedAsset } from '../utility/assetCache';
import { parseGLTF } from '../utility/gltfParser';

const COLORED_MESH_NAMES = new Set(["plain001", "metal002", "plain", "metal003"]);

// ─── The stone's environment ────────────────────────────────────────────────
// Same studio gem HDR and response curve as Diamond.jsx / Head.jsx (see
// Diamond.jsx for the full derivation). The band's accent diamonds go through
// this component, so they need the same map and curve or they'll render with
// the old flat-JPG look while the centre stone looks correct.
//
// TODO: duplicated across Diamond.jsx, Head.jsx, and this file — worth
// pulling into a shared `utility/diamondEnvironment.js` so a future tuning
// pass can't update one file and silently miss the others.
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

// Diamond quality configurations
// `aberration` matches Diamond.jsx's CUT_BASELINE — without it, band diamonds
// fell back to MeshRefractionMaterial's default aberrationStrength (they were
// hardcoded to 0.02 here), which ran 3-6x hotter than the tuned centre-stone
// value and brought back the rainbow-smear look the reference-render fix was
// meant to remove.
const CUT_BASELINE = {
    "Good":       { ior: 2.45, bounces: 4, aberration: 0.0065 },
    "Very Good":  { ior: 2.47, bounces: 5, aberration: 0.0052 },
    "Excellent":  { ior: 2.49, bounces: 6, aberration: 0.0042 },
    "Ideal":      { ior: 2.51, bounces: 7, aberration: 0.0035 }
};

const CLARITY_ADJUSTMENT = {
    "I1": { iorOffset: -0.02, bouncesOffset: -1 },
    "SI2": { iorOffset: -0.01, bouncesOffset: 0 },
    "SI1": { iorOffset: 0.00, bouncesOffset: 0 },
    "VS2": { iorOffset: 0.00, bouncesOffset: 0 },
    "VS1": { iorOffset: 0.01, bouncesOffset: 0 },
    "VVS2": { iorOffset: 0.01, bouncesOffset: 0 },
    "VVS1": { iorOffset: 0.02, bouncesOffset: 1 },
    "FL/IF": { iorOffset: 0.03, bouncesOffset: 1 }
};

const COLOR_CLARITY = {
    "L": { iorOffset: -0.03, bouncesOffset: -1 },
    "K": { iorOffset: -0.025, bouncesOffset: -1 },
    "J": { iorOffset: -0.02, bouncesOffset: 0 },
    "I": { iorOffset: -0.015, bouncesOffset: 0 },
    "H": { iorOffset: -0.01, bouncesOffset: 0 },
    "G": { iorOffset: -0.005, bouncesOffset: 0 },
    "F": { iorOffset: 0.00, bouncesOffset: 0 },
    "E": { iorOffset: 0.01, bouncesOffset: 1 },
    "D": { iorOffset: 0.02, bouncesOffset: 1 }
};

async function loadBandMeshes(bandStyle) {
    const buffer = await fetchDecrypted(`/3d-models/WEDDING-BANDS/${bandStyle}.glb`);
    const gltf = await parseGLTF(buffer);
    const meshes = [];
    gltf.scene.traverse((child) => {
        if (child.isMesh) {
            const mesh = child.clone();
            mesh.geometry = child.geometry.clone();
            meshes.push(mesh);
        }
    });
    if (!meshes.length) throw new Error(`No meshes in matching band ${bandStyle}`);
    return meshes;
}

const loadBand = (bandStyle) => ensureAsset("band", bandStyle, () => loadBandMeshes(bandStyle));

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

const BandMesh = React.memo(({ geometry, position, scale, materialProps, color, isDiamond, diamondProps }) => {
    return (
        <mesh
            geometry={geometry}
            position={position}
            scale={scale}
            castShadow
            receiveShadow
            rotation={[0, 0, 0]}
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
                    transparent
                    opacity={1}
                    color={color}
                />
            )}
        </mesh>
    );
});

function MatchingBand() {
    const { ringColor, bandColor, metalness, roughness, reflectivity, clearcoat, clearcoatRoughness, envMapIntensity } = useContext(RingContext);
    const { cut, clarity, diamondColorClarity } = useContext(DiamondContext);
    const { handleMetal } = useContext(SectionContext);
    const { target, displayed, reportPartReady } = useSceneStage();

    const metalTexture = useLoader(RGBELoader, handleMetal);
    metalTexture.mapping = THREE.EquirectangularReflectionMapping;

    // Studio gem HDR for the band's accent diamonds (see comment block above
    // CUT_BASELINE) — forced to full float so the response curve has real
    // numbers to work on, same as Diamond.jsx / Head.jsx.
    const texture = useLoader(EXRLoader, DIAMOND_ENV_PATH, (loader) => {
        if (typeof loader.setDataType === 'function') loader.setDataType(THREE.FloatType);
        else loader.type = THREE.FloatType;
    });
    useMemo(() => {
        applyGemEnvCurve(texture);
        texture.mapping = THREE.EquirectangularReflectionMapping;
        // Equirectangular maps wrap the long way round, so S has to repeat -
        // clamping it smears the pixel column at the seam across every ray
        // that leaves the stone in that direction.
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

    // ─── LOAD for `target`, RENDER from `displayed` ───────────────────────
    const targetKey = target.parts.band;
    const needsBand = target.ringBand === "Yes";
    const targetBandStyle = target.ringMatchingBand;

    useEffect(() => {
        let alive = true;

        if (!needsBand) {
            reportPartReady("band", targetKey);
            return () => {
                alive = false;
            };
        }

        loadBand(targetBandStyle)
            .catch((error) => {
                console.error(`Error loading matching band (${targetBandStyle}):`, error);
            })
            .finally(() => {
                if (alive) reportPartReady("band", targetKey);
            });

        return () => {
            alive = false;
        };
    }, [needsBand, targetBandStyle, targetKey, reportPartReady]);

    const materialProps = useMemo(() => ({
        envMap: metalTexture,
        metalness,
        roughness,
        reflectivity,
        clearcoat,
        clearcoatRoughness,
        envMapIntensity,
        transparent: true
    }), [metalTexture, metalness, roughness, reflectivity, clearcoat, clearcoatRoughness, envMapIntensity]);

    const { effectiveIor, effectiveBounces, aberrationStrength } = useMemo(() => {
        const base = CUT_BASELINE[cut] || CUT_BASELINE.Good;
        const clarityAdjust = CLARITY_ADJUSTMENT[clarity] || { iorOffset: 0, bouncesOffset: 0 };
        const colorAdjust = COLOR_CLARITY[diamondColorClarity] || { iorOffset: 0, bouncesOffset: 0 };

        let ior = base.ior + clarityAdjust.iorOffset + colorAdjust.iorOffset;
        let bounces = base.bounces + clarityAdjust.bouncesOffset + colorAdjust.bouncesOffset;

        // Same clamps as Diamond.jsx / Head.jsx: ior kept in the calibrated
        // range, bounces floored at 4 so a stone always gets enough internal
        // hops to read as a facet pattern rather than a flat grey disc, and
        // capped at 6 to stay GPU-safe with many small accent stones on
        // screen at once.
        ior = Math.max(2.40, Math.min(2.55, ior));
        bounces = Math.max(4, Math.min(6, Math.round(bounces)));

        return {
            effectiveIor: ior,
            effectiveBounces: bounces,
            aberrationStrength: base.aberration,
        };
    }, [cut, clarity, diamondColorClarity]);

    const diamondMaterialProps = useMemo(() => ({
        envMap: texture,
        ior: effectiveIor,
        bounces: effectiveBounces,
        aberrationStrength,
        // Same low edge-reflection value as Diamond.jsx / Head.jsx — higher
        // laid a milky sheen over the whole stone instead of clear glass with
        // bright edges.
        fresnel: 0.5,
        toneMapped: false,
    }), [texture, effectiveIor, effectiveBounces, aberrationStrength]);

    const bandStyle = displayed.ringMatchingBand;
    const meshes = useMemo(
        () => getCachedAsset("band", bandStyle),
        [bandStyle, displayed.commitId]
    );

    if (displayed.isDiamondWise || displayed.ringBand !== "Yes") return null;

    const ringShank = displayed.ringShank;
    if (!meshes) return null;

    return (
        <>
            {meshes.map((mesh, index) => {
                let position =
                    bandStyle === "PLAIN" && ringShank !== "PLAIN" ? [0, 0.6, 0.5] :
                    bandStyle !== "PLAIN" && ringShank === "PLAIN" ? [0, 0.7, 0.5] :
                    bandStyle === "PLAIN" && ringShank === "PLAIN" ? [0, 0.7, 0.5] :
                    [0, 0.6, 0.5];

                let scale = (mesh.name === "plain001" || mesh.name === "plain")
                    ? [0.40, 0.40, 0.45]
                    : mesh.name === "metal002" ? [0.33, 0.33, 0.33] : [0.335, 0.335, 0.335];
                const color = COLORED_MESH_NAMES.has(mesh.name) ? (ringColor || bandColor) : "#ffffff";
                const isDiamond = !COLORED_MESH_NAMES.has(mesh.name);

                //For Other Models//
                if (ringShank === "KNIFE-EDGE") {
                    if (bandStyle === "PLAIN") {
                        position = [0, 0.4, 0.7];
                        scale = [0.45, 0.45, 0.45];
                    } else if (bandStyle === "CHANNEL") {
                        position = [0, 0.4, 0.8];
                        scale = [0.37, 0.37, 0.37];
                    } else {
                        position = [0, 0.3, 0.7];
                        scale = (mesh.name === "plain001" || mesh.name === "plain") ? [0.45, 0.45, 0.49]
                            : mesh.name === "metal002" ? [0.37, 0.37, 0.37] : [0.380, 0.380, 0.380];
                    }
                } else if (ringShank === "CATHEDRAL") {
                    if (bandStyle === "PLAIN") {
                        position = [0, 0.4, 0.6];
                        scale = [0.47, 0.47, 0.47];
                    } else if (bandStyle === "CHANNEL") {
                        position = [0, 0.2, 0.7];
                        scale = [0.37, 0.37, 0.37];
                    } else {
                        position = [0, 0.2, 0.6];
                        scale = (mesh.name === "plain001" || mesh.name === "plain") ? [0.45, 0.45, 0.49]
                            : mesh.name === "metal002" ? [0.37, 0.37, 0.37] : [0.380, 0.380, 0.380];
                    }
                } else if (ringShank === "SPLIT") {
                    position = [0, 0.6, 0.65];
                    if (bandStyle === "PLAIN") {
                        scale = [0.40, 0.41, 0.44];
                    }
                } else if (ringShank === "PLAIN") {
                    position = [0, 0.75, 0.5];
                    if (bandStyle === "PLAIN") {
                        scale = [0.40, 0.40, 0.44];
                    }
                }
                //For Other Models//

                return (
                    <BandMesh
                        key={`${bandStyle}_${index}`}
                        geometry={mesh.geometry}
                        position={position}
                        scale={scale}
                        materialProps={materialProps}
                        color={color}
                        isDiamond={isDiamond}
                        diamondProps={isDiamond ? diamondMaterialProps : null}
                    />
                );
            })}
        </>
    );
}

export default React.memo(MatchingBand);