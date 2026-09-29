import * as THREE from 'three';

// ─── Ring-matched metal ─────────────────────────────────────────────────────
// Necklace + bracelet use the SAME metal recipe as the ring configurator
// (ring-configurator/contexts/RingContext.jsx defaults, applied in
// objects/Ring.jsx + Head.jsx): a mirror-polished MeshPhysicalMaterial with a
// clear-coat layer, reflecting /metal_texture/metal3.hdr.
//
// Every metal part (chain links, name plate, washers, bails, charm bodies,
// initials, bezels) goes through this one recipe, so no single component can
// read brighter or duller than the rest. Only the colour changes per metal.
export const RING_METAL_ENV_URL = '/metal_texture/metal3.hdr';

export const RING_METAL = {
  metalness: 1,
  roughness: 0,
  reflectivity: 1,
  clearcoat: 1,
  clearcoatRoughness: 0.05,
  envMapIntensity: 1,
};

// Ring canvas uses R3F's default ACES tone mapping at exposure 1.
export const RING_TONE_MAPPING_EXPOSURE = 1;

// Reflection strength for the necklace + bracelet scenes. Their thin links and
// flat name faces pick up far more of metal3.hdr's bright studio panels than
// the ring's curved band, so at the ring's 1.0 the same metal rendered ~13%
// brighter and ~25% less saturated - washed out next to the ring. 0.65 was
// measured on screen to match the ring (yellow gold ~rgb(200,177,126) and
// white gold ~rgb(188,188,187) on both). Raised to 0.8 on request for a
// brighter look - still below 1.0, where the metal washed out.
export const JEWELRY_ENV_INTENSITY = 0.8;

// ─── Ring-matched metal colours ──────────────────────────────────────────────
// The ring renders each metal in these colours (GOLD_COLORS in
// ring-configurator/RingCustomizer.jsx). The necklace/bracelet UI keeps its own
// swatch hex values - prices, share links and metal matching are keyed off
// them - so they are translated to the ring colour only at render time, here.
export const RING_METAL_COLORS = {
  white: '#f1f1ef',
  yellow: '#FFD280',
  rose: '#e6b08f',
  platinum: '#e5e4e2',
};

// Every hex the necklace/bracelet uses for a metal (swatch `hex`, `color`,
// and older aliases - same list as getMetalCode in assets.js). Silver has no
// ring equivalent, so it is left as it is.
const HEX_TO_RING_COLOR = {
  // White gold
  '#c8c8c8': RING_METAL_COLORS.white,
  '#dbdbdb': RING_METAL_COLORS.white,
  '#f1f1ef': RING_METAL_COLORS.white,
  '#d8d8d8': RING_METAL_COLORS.white,
  // Yellow gold
  '#ecc875': RING_METAL_COLORS.yellow,
  '#ffd280': RING_METAL_COLORS.yellow,
  '#e4c088': RING_METAL_COLORS.yellow,
  '#ffdfa5': RING_METAL_COLORS.yellow,
  // Rose gold
  '#ffbaa3': RING_METAL_COLORS.rose,
  '#ebb39c': RING_METAL_COLORS.rose,
  '#e6b08f': RING_METAL_COLORS.rose,
  '#f0a47b': RING_METAL_COLORS.rose,
  '#ffc9b0': RING_METAL_COLORS.rose,
  // Platinum
  '#a8a8a6': RING_METAL_COLORS.platinum,
  '#e5e4e2': RING_METAL_COLORS.platinum,
  '#e2e4e8': RING_METAL_COLORS.platinum,
};

export function toRingMetalColor(color) {
  if (typeof color !== 'string') return color;
  return HEX_TO_RING_COLOR[color.trim().toLowerCase()] ?? color;
}

// Props for <meshPhysicalMaterial {...ringMetalProps(color)} /> or
// new THREE.MeshPhysicalMaterial(ringMetalProps(color)).
export function ringMetalProps(color, extra = {}) {
  return {
    ...RING_METAL,
    color: new THREE.Color(toRingMetalColor(color || '#DBDBDB')),
    ...extra,
  };
}

export function createRingMetalMaterial(color, extra = {}) {
  return new THREE.MeshPhysicalMaterial(ringMetalProps(color, extra));
}
