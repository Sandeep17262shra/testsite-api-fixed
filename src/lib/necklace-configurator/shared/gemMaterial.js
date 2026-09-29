/**
 * gemMaterial.js — birthstone / diamond look for necklace + bracelet charms.
 *
 * Same system as the ring configurator (ring-configurator/objects/Diamond.jsx,
 * Head.jsx, Ring.jsx):
 *   - studio gem HDR '/env_gem_002.exr' (float), not the old 8-bit JPG
 *   - response curve v' = 1.4 * v^0.9 on that map
 *   - RepeatWrapping on S, no mipmaps (no seam line across the stone)
 *   - refraction params = ring defaults (cut Good, clarity SI2, colour K):
 *     ior 2.415, bounces 4, aberration 0.0065, fresnel 0.5
 */
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { EXRLoader } from 'three-stdlib';

export const GEM_ENV_PATH = '/env_gem_002.exr';
const GEM_ENV_CONTRAST = 0.9;
const GEM_ENV_GAIN = 1.4;

export const GEM_REFRACTION_PARAMS = {
  ior: 2.415,
  bounces: 4,
  aberrationStrength: 0.0065,
  fresnel: 0.5,
};

function applyGemEnvCurve(texture) {
  if (!texture || texture.userData?.gemCurveApplied) return texture;
  const data = texture.image?.data;
  if (!(data instanceof Float32Array)) return texture;
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = GEM_ENV_GAIN * Math.pow(Math.max(data[i], 0),     GEM_ENV_CONTRAST);
    data[i + 1] = GEM_ENV_GAIN * Math.pow(Math.max(data[i + 1], 0), GEM_ENV_CONTRAST);
    data[i + 2] = GEM_ENV_GAIN * Math.pow(Math.max(data[i + 2], 0), GEM_ENV_CONTRAST);
  }
  texture.userData.gemCurveApplied = true;
  return texture;
}

// Loaded once, shared by every stone. Not useLoader: that suspends, and the
// bracelet charms have no Suspense boundary around them.
let _gemEnvTexture = null;
let _gemEnvPromise = null;

export function loadGemEnvTexture() {
  if (_gemEnvTexture) return Promise.resolve(_gemEnvTexture);
  if (!_gemEnvPromise) {
    _gemEnvPromise = new Promise((resolve, reject) => {
      const loader = new EXRLoader();
      if (typeof loader.setDataType === 'function') loader.setDataType(THREE.FloatType);
      else loader.type = THREE.FloatType;
      loader.load(GEM_ENV_PATH, (texture) => {
        applyGemEnvCurve(texture);
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        texture.needsUpdate = true;
        _gemEnvTexture = texture;
        resolve(texture);
      }, undefined, (err) => {
        _gemEnvPromise = null;
        reject(err);
      });
    });
  }
  return _gemEnvPromise;
}

export function useGemEnvTexture() {
  const [texture, setTexture] = useState(_gemEnvTexture);
  useEffect(() => {
    if (texture) return undefined;
    let cancelled = false;
    loadGemEnvTexture()
      .then((t) => { if (!cancelled) setTexture(t); })
      .catch((err) => console.warn('[gem] env map failed to load', err));
    return () => { cancelled = true; };
  }, [texture]);
  return texture;
}
