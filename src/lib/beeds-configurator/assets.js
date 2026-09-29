/**
 * @file This file contains the constant data for bracelets and charms,
 * including their model paths and positioning information.
 */

const beadAssetKeyFromFilename = (filename) =>
  filename.replace(/\.(webp|svg)$/i, "");

const formatBeedsAssetLabel = (filename) =>
  beadAssetKeyFromFilename(filename)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

/** WebP (~30KB each). The matching SVGs are ~2MB embedded rasters and stall live loads. */
const BEAD_IMAGE_FILES = [
  "amethyst.webp",
  "clear-quartz.webp",
  "green-quartz.webp",
  "jade-stone.webp",
  "moonstone.webp",
  "moss-stone.webp",
  "orange-quartz.webp",
  "peach-quartz.webp",
  "pyrite.webp",
  "sky-quartz.webp",
  "tiger-eye.webp",
  "tuorquiose.webp",
  "white-marble.webp",
  "yellow-quartz.webp",
];

export const isSvgBeadAsset = (imageUrl) => /\.svg($|[?#])/i.test(String(imageUrl || ""));

const SEPARATOR_IMAGE_FILES = [
  "s1.webp",
  "s2.webp",
  "s3.webp",
  "s4.webp",
  "s5.webp",
  "s6.webp",
  "s7.webp",
  "s8.webp",
  "s9.webp",
  "s10.webp",
  "s11.webp",
  "s12.webp",
  "s13.webp",
  "s14.webp",
];

export const BEADS_ASSET_BASE_URL = "/beeds-assets/beads";
export const SEPARATORS_ASSET_BASE_URL = "/beeds-assets/separators";
export const SEPARATOR_MODEL_BASE_URL = "/bc-assets/spacer_models";

const SEPARATOR_MODEL_BY_KEY = {
  s1: `${SEPARATOR_MODEL_BASE_URL}/plain-wheel-1.glb`,
  s2: `${SEPARATOR_MODEL_BASE_URL}/stone-wheel-1.glb`,
  s3: `${SEPARATOR_MODEL_BASE_URL}/hex-wheel-1.glb`,
  /** S10–S14 colored glass wheel (faceted crystal body). */
  glassWheel: `${SEPARATOR_MODEL_BASE_URL}/glass-wheel-spacer.glb`,
  /** Export name: scene (81).glb — copy to public as scene-81.glb */
  scene81: `${SEPARATOR_MODEL_BASE_URL}/scene.glb`,
};
export const BEAD_STYLE_PREVIEW_BASE_URL = "/beeds-assets/styles";

export const BEADS = BEAD_IMAGE_FILES.map((filename) => {
  const key = beadAssetKeyFromFilename(filename);
  let collection = "all";
  if (key === "amethyst") collection = "amethyst";
  else if (key === "pyrite") collection = "pyrite";
  else if (key.includes("quartz") || key === "moonstone" || key === "white-marble") collection = "quartz";

  return {
    key,
    name: formatBeedsAssetLabel(filename),
    image: `${BEADS_ASSET_BASE_URL}/${filename}`,
    collection,
    price: 8,
  };
});

export const SEPARATORS = SEPARATOR_IMAGE_FILES.map((filename) => ({
  key: filename.replace(/\.webp$/i, ""),
  name: filename.replace(/\.webp$/i, "").toUpperCase(),
  image: `${SEPARATORS_ASSET_BASE_URL}/${filename}`,
  price: 4,
}));

const BEADS_CHARM_ASSET_BASE = "/beeds-assets/charms";

/** Default 3D spacer mesh until per-SKU GLBs exist. */
export const SPACER_STONE_3D_MODEL = SEPARATOR_MODEL_BY_KEY.s2;
export const SPACER_GLB_URLS = Object.values(SEPARATOR_MODEL_BY_KEY);

/** S1–S6 stone-wheel spacers (stone-wheel-1.glb pavé band). */
export function isStoneWheelSpacerSku(assetKey) {
  const match = /^s(\d+)$/i.exec(String(assetKey || ""));
  if (!match) {
    return false;
  }
  const sku = Number(match[1]);
  return sku >= 1 && sku <= 6;
}

/** S1–S6 and S10–S14: preset PBR metal + gems in 3D (not WebP on gold). */
export function isDiamondSpacerSku(assetKey) {
  const match = /^s(\d+)$/i.exec(String(assetKey || ""));
  if (!match) {
    return false;
  }
  const sku = Number(match[1]);
  return (sku >= 1 && sku <= 6) || (sku >= 10 && sku <= 14);
}

/** S1/S4/S7 yellow gold · S2/S5/S8 silver · S3/S6/S9 rose gold. */
export function getSpacerMetalFinish(assetKey) {
  const match = /^s(\d+)$/i.exec(String(assetKey || ""));
  if (!match) {
    return "yellowGold";
  }
  const sku = Number(match[1]);
  if (sku === 7) {
    return "yellowGold";
  }
  if (sku === 8) {
    return "silver";
  }
  if (sku === 9) {
    return "roseGold";
  }
  if (sku >= 10 && sku <= 14) {
    return "silver";
  }
  if (sku === 2 || sku === 5) {
    return "silver";
  }
  if (sku === 3 || sku === 6) {
    return "roseGold";
  }
  return "yellowGold";
}

/** S7–S9 metal-band WebP in 3D (gold / silver / rose), keyed by SKU not global picker. */
export function resolveScene81MetalSpacerImageUrl(assetKey) {
  const match = /^s(\d+)$/i.exec(String(assetKey || ""));
  if (!match) {
    return null;
  }
  const sku = Number(match[1]);
  if (sku < 7 || sku > 9) {
    return null;
  }
  const key = `s${sku}`;
  return SEPARATORS.find((item) => item.key === key)?.image ?? null;
}

/**
 * S1–S6 stone wheel: white (S1–S3) / black (S4–S6).
 * S10–S14 hex wheel: colored crystal variants.
 * S7–S9: white pavé on metal band.
 */
export function getSpacerDiamondVariant(assetKey) {
  const match = /^s(\d+)$/i.exec(String(assetKey || ""));
  if (!match) {
    return "white";
  }
  const sku = Number(match[1]);
  if (sku >= 10 && sku <= 14) {
    const crystalBySku = {
      10: "crystalSilver",
      11: "crystalPink",
      12: "crystalBlue",
      13: "crystalRoyalBlue",
      14: "crystalEmerald",
    };
    return crystalBySku[sku] ?? "crystalSilver";
  }
  if (sku >= 4 && sku <= 6) {
    return "black";
  }
  return "white";
}

export function isHexSpacer3DModel(modelUrl) {
  return /hex-wheel/i.test(String(modelUrl || ""));
}

/** S10–S14 faceted glass wheel GLB. */
export function isGlassWheelSpacerModel(modelUrl) {
  return /glass-wheel-spacer/i.test(String(modelUrl || ""));
}

/** Bore along local +Y → string +X after `PLAIN_WHEEL_ON_STRING_QUAT` (plain / glass wheel, scene.glb). */
export function isPlainWheel3DModel(modelUrl) {
  return /plain-wheel|glass-wheel-spacer|scene-81|scene\.glb/i.test(String(modelUrl || ""));
}

/** S7–S9 metal band (scene-81.glb), same string tangent as S10–S14 plain wheel. */
export function isScene81MetalSpacerSku(assetKey) {
  const match = /^s(\d+)$/i.exec(String(assetKey || ""));
  if (!match) {
    return false;
  }
  const sku = Number(match[1]);
  return sku >= 7 && sku <= 9;
}

export function isHexSpacerSku(assetKey) {
  const match = /^s(\d+)$/i.exec(String(assetKey || ""));
  if (!match) {
    return false;
  }
  const sku = Number(match[1]);
  return sku >= 10 && sku <= 14;
}

/** S1–S6 stone wheel; S7–S9 scene-81; S10–S14 plain wheel crystal. */
export function resolveSpacer3DModelUrl(assetKey) {
  const match = /^s(\d+)$/i.exec(String(assetKey || "s2"));
  const sku = match ? Number(match[1]) : 2;
  if (sku >= 10 && sku <= 14) {
    return SEPARATOR_MODEL_BY_KEY.glassWheel;
  }
  if (sku >= 7 && sku <= 9) {
    return SEPARATOR_MODEL_BY_KEY.scene81;
  }
  if (sku >= 1 && sku <= 6) {
    return SEPARATOR_MODEL_BY_KEY.s2;
  }
  return SEPARATOR_MODEL_BY_KEY.s2;
}

/** S10–S14 colored faceted crystal (glass-wheel-spacer.glb in 3D). */
export function isColoredCrystalSpacerSku(assetKey) {
  const match = /^s(\d+)$/i.exec(String(assetKey || ""));
  if (!match) {
    return false;
  }
  const sku = Number(match[1]);
  return sku >= 10 && sku <= 14;
}

const withCharmBail = (charm) => ({
  bailX: 0.5,
  bailY: 0.12,
  ...charm,
});

export const BEAD_CHARMS = [
  withCharmBail({ key: "cat-face", name: "Cat Face", image: `${BEADS_CHARM_ASSET_BASE}/cat-face.png`, price: 50 }),
  withCharmBail({ key: "daisy", name: "Daisy", image: `${BEADS_CHARM_ASSET_BASE}/daisy.png`, price: 50 }),
  withCharmBail({ key: "flower", name: "Flower", image: `${BEADS_CHARM_ASSET_BASE}/flower.png`, price: 50 }),
  withCharmBail({ key: "heart", name: "Heart", image: `${BEADS_CHARM_ASSET_BASE}/heart.png`, price: 50, bailY: 0.14 }),
  withCharmBail({ key: "kitten", name: "Kitten", image: `${BEADS_CHARM_ASSET_BASE}/kitten.png`, price: 50 }),
  withCharmBail({ key: "moon-2", name: "Moon", image: `${BEADS_CHARM_ASSET_BASE}/moon-2.png`, price: 50 }),
  withCharmBail({ key: "moon", name: "Crescent Moon", image: `${BEADS_CHARM_ASSET_BASE}/moon.png`, price: 50 }),
  withCharmBail({ key: "paw", name: "Paw", image: `${BEADS_CHARM_ASSET_BASE}/paw.png`, price: 50 }),
  withCharmBail({ key: "puppy", name: "Puppy", image: `${BEADS_CHARM_ASSET_BASE}/puppy.png`, price: 50 }),
  withCharmBail({
    key: "rainbow",
    name: "Rainbow",
    image: `${BEADS_CHARM_ASSET_BASE}/rainbow.png`,
    price: 55,
    aspect: 1.35,
    bailY: 0.09,
    holeR: 0.028,
  }),
  withCharmBail({
    key: "tulip",
    name: "Tulip",
    image: `${BEADS_CHARM_ASSET_BASE}/tulip.png`,
    price: 50,
    aspect: 0.52,
    bailY: 0.08,
    holeR: 0.03,
  }),
  withCharmBail({
    key: "hello-kitty",
    name: "Hello Kitty",
    image: `${BEADS_CHARM_ASSET_BASE}/hello-kitty.png`,
    price: 50,
    aspect: 0.85,
    bailY: 0.1,
    holeR: 0.028,
  }),
];

/** Retired charms — still resolve for saved designs, not offered in the picker. */
const BEAD_CHARMS_RETIRED = [
  { key: "leaf", name: "Leaf", image: `${BEADS_CHARM_ASSET_BASE}/leaf.png`, price: 50 },
  {
    key: "shooting-star",
    name: "Shooting Star",
    image: `${BEADS_CHARM_ASSET_BASE}/shooting-star.png`,
    price: 50,
  },
];

export const BEAD_JEWELRY_CATEGORIES = [
  { id: "bead-bracelet", label: "Bead Bracelet" },
];

/** Manual build — empty string; also available in the style picker. */
export const EMPTY_BEAD_STYLE = {
  id: "empty",
  label: "Empty",
  preview: "empty",
  previewSvg: `${BEAD_STYLE_PREVIEW_BASE_URL}/empty.svg`,
  manual: true,
};

/** Preset styles shown in the Jewelry style picker. */
export const BEAD_STYLES = [
  {
    id: "full-bead",
    label: "Full Bead",
    preview: "full",
    previewSvg: `${BEAD_STYLE_PREVIEW_BASE_URL}/full-bead.svg`,
  },
  {
    id: "style-1",
    label: "Style 1",
    preview: "alternate",
    previewSvg: `${BEAD_STYLE_PREVIEW_BASE_URL}/style-1.svg`,
  },
  {
    id: "style-2",
    label: "Style 2",
    preview: "double-spacer",
    previewSvg: `${BEAD_STYLE_PREVIEW_BASE_URL}/style-2.svg`,
  },
  {
    id: "style-3",
    label: "Style 3",
    preview: "charm",
    previewSvg: `${BEAD_STYLE_PREVIEW_BASE_URL}/style-3.svg`,
  },
];

export const MIN_BRACELET_DISPLAY_INCHES = 4;

export const BEAD_LENGTHS = [
  { id: "4", label: '4"', quantity: 14, displayLength: 5.8, price: 1000 },
  { id: "4.5", label: '4.5"', quantity: 16, displayLength: 6.1, price: 1100 },
  { id: "5", label: '5"', quantity: 18, displayLength: 6.4, price: 1200 },
  { id: "5.5", label: '5.5"', quantity: 20, displayLength: 6.7, price: 1300 },
];

/** Fixed preset lengths for the Jewelry length picker (free size is reset-only). */
export const SELECTABLE_BEAD_LENGTHS = BEAD_LENGTHS;

/** @deprecated Preset lengths only — free size is reset-only, not in this list. */
export const BEAD_LENGTH_OPTIONS = BEAD_LENGTHS;

export const FREE_SIZE_LENGTH_ID = "free";

export const FREE_SIZE_LENGTH = {
  id: FREE_SIZE_LENGTH_ID,
  label: "Free size",
  quantity: 28,
  price: 0,
};

export const isFreeSizeLength = (lengthId) => lengthId === FREE_SIZE_LENGTH_ID;

export function resolveBeadStyle(styleId) {
  if (styleId === EMPTY_BEAD_STYLE.id) {
    return EMPTY_BEAD_STYLE;
  }

  return BEAD_STYLES.find((style) => style.id === styleId) || BEAD_STYLES[0];
}

export function getBeadStyleLabel(styleId) {
  return resolveBeadStyle(styleId)?.label || "Style 1";
}

export function resolveLengthOption(lengthId) {
  if (isFreeSizeLength(lengthId)) {
    return FREE_SIZE_LENGTH;
  }

  return BEAD_LENGTHS.find((item) => item.id === lengthId) || BEAD_LENGTHS.find((item) => item.id === "5") || BEAD_LENGTHS[0];
}

export const BEAD_COLLECTIONS = [
  { id: "all", label: "All" },
  { id: "quartz", label: "Quartz" },
  { id: "amethyst", label: "Amethyst" },
  { id: "pyrite", label: "Pyrite" },
];

/** Smallest selectable bead size; used as the layout reference (scale 1.0). */
export const REFERENCE_BEAD_MM = 6;

export const BEAD_SIZES = [
  { id: "6mm", label: "6mm", mm: 6 },
  { id: "8mm", label: "8mm", mm: 8 },
  { id: "10mm", label: "10mm", mm: 10 },
  { id: "12mm", label: "12mm", mm: 12 },
];

export const BEAD_GRID_SIZE_FILTERS = [
  { id: "all", label: "All" },
  { id: "6", label: "6" },
  { id: "8", label: "8" },
  { id: "10", label: "10" },
  { id: "12", label: "12" },
];

const BEAD_PICKER_SIZE_OPTIONS = [
  { id: "6mm", label: "6mm" },
  { id: "8mm", label: "8mm" },
  { id: "10mm", label: "10mm" },
  { id: "12mm", label: "12mm" },
];

/** Bead picker rows: every size per stone when filter is "all", else one row per bead. */
export function getBeadPickerGridItems(beads, gridSizeFilter) {
  if (!beads?.length) {
    return [];
  }

  const normalizedFilter = String(gridSizeFilter ?? "all").toLowerCase();

  if (normalizedFilter === "all") {
    return beads.flatMap((asset) =>
      BEAD_PICKER_SIZE_OPTIONS.map((size) => ({
        key: `${asset.key}__${size.id}`,
        asset,
        sizeId: size.id,
        sizeLabel: size.label,
        showSizeInLabel: true,
      }))
    );
  }

  const sizeLabel = `${normalizedFilter}mm`;
  return beads.map((asset) => ({
    key: asset.key,
    asset,
    sizeId: sizeLabel,
    sizeLabel,
    showSizeInLabel: false,
  }));
}

export const BEAD_CUSTOMIZE_TABS = [
  { id: "beads", label: "Beads" },
  { id: "charms", label: "Charms" },
  { id: "spacers", label: "Spacers" },
];

/** Hidden from UI for now — underlying style/charm data unchanged. */
export const UI_HIDDEN_BEAD_STYLE_IDS = ["style-3"];
export const UI_HIDDEN_CUSTOMIZE_TAB_IDS = [];

export const VISIBLE_BEAD_STYLES = [
  EMPTY_BEAD_STYLE,
  ...BEAD_STYLES.filter((style) => !UI_HIDDEN_BEAD_STYLE_IDS.includes(style.id)),
];

export const VISIBLE_BEAD_CUSTOMIZE_TABS = BEAD_CUSTOMIZE_TABS.filter(
  (tab) => !UI_HIDDEN_CUSTOMIZE_TAB_IDS.includes(tab.id)
);

export const DEFAULT_BEAD_KEY = "amethyst";
export const DEFAULT_SEPARATOR_KEY = "s1";
export const DEFAULT_CHARM_KEY = "heart";
export const DEFAULT_BEAD_SIZE_ID = "10mm";
/** Initial load — showcase a filled preset bracelet. */
export const DEFAULT_STYLE_ID = "full-bead";
export const DEFAULT_LENGTH_ID = "5";
/** Reset — start manual building on a free-size empty string. */
export const RESET_STYLE_ID = "empty";
export const RESET_LENGTH_ID = FREE_SIZE_LENGTH_ID;
/** @deprecated Charm limit is gap/space based (`getValidCharmGaps`, `MAX_CHARMS_ON_EMPTY_RING`). */
export const MAX_BEAD_CHARMS = 8;
/** Fixed render/capacity size for all beads in the 2D preview. */
export const LAYOUT_BEAD_SIZE_ID = DEFAULT_BEAD_SIZE_ID;

export const getBeadSizeScale = (sizeId = DEFAULT_BEAD_SIZE_ID) => {
  const size = BEAD_SIZES.find((item) => item.id === sizeId);
  if (size?.mm) {
    return size.mm / REFERENCE_BEAD_MM;
  }
  const parsed = Number.parseFloat(String(sizeId).replace(/mm$/i, ""));
  const mm = Number.isFinite(parsed) ? parsed : REFERENCE_BEAD_MM;
  return mm / REFERENCE_BEAD_MM;
};

export const isManualStringStyle = (styleId) => styleId === "empty";

export const isSpacerCustomizationEnabled = (styleId) => {
  if (isManualStringStyle(styleId)) {
    return true;
  }
  return styleId === "full-bead" || styleId === "style-1" || styleId === "style-2";
};

export const isCharmCustomizationEnabled = (styleId) => {
  if (isManualStringStyle(styleId)) {
    return true;
  }
  return (
    styleId === "full-bead" ||
    styleId === "style-1" ||
    styleId === "style-2" ||
    styleId === "style-3"
  );
};

export const resolvePatternAsset = (type, assetKey) => {
  if (type === "spacer") {
    return SEPARATORS.find((item) => item.key === assetKey) || SEPARATORS[0];
  }
  if (type === "charm") {
    return (
      BEAD_CHARMS.find((item) => item.key === assetKey) ||
      BEAD_CHARMS_RETIRED.find((item) => item.key === assetKey) ||
      BEAD_CHARMS[0]
    );
  }
  return BEADS.find((item) => item.key === assetKey) || BEADS[0];
};

export const buildBeadPattern = ({
  styleId = "style-1",
  quantity = 18,
  bead,
  separator,
  defaultSizeId = DEFAULT_BEAD_SIZE_ID,
}) => {
  if (styleId === "empty") return [];

  const beadItem = bead || BEADS.find((item) => item.key === DEFAULT_BEAD_KEY) || BEADS[0];
  const spacerItem = separator || SEPARATORS[0];
  const items = [];

  for (let index = 0; index < quantity; index += 1) {
    if (styleId === "style-1") {
      items.push(
        index % 2 === 0
          ? { type: "bead", asset: beadItem, sizeId: defaultSizeId }
          : { type: "spacer", asset: spacerItem }
      );
      continue;
    }

    if (styleId === "style-2") {
      items.push(
        index % 3 === 2
          ? { type: "spacer", asset: spacerItem }
          : { type: "bead", asset: beadItem, sizeId: defaultSizeId }
      );
      continue;
    }

    if (styleId === "style-3") {
      items.push(
        index === 0
          ? { type: "charm", asset: BEAD_CHARMS[0] }
          : { type: "bead", asset: beadItem, sizeId: defaultSizeId }
      );
      continue;
    }

    items.push({ type: "bead", asset: beadItem, sizeId: defaultSizeId });
  }

  return items;
};

// The procedurally generated chains have no GLB - their links, name plate and
// washers are all built in code at runtime (see NameChain.jsx). Anything that
// loads a model from a path must skip these.
// They differ only in link geometry; NAME_CHAIN_VARIANTS in NameChain.jsx holds
// the per-style dimensions.
// NB: the first one keeps its original id so shared/cart URLs made before the
// other two existed still resolve.
export const GENERATED_NAME_CHAIN_PATH = "generated://name-chain";              // long narrow links
export const GENERATED_NAME_CHAIN_ROUND_PATH = "generated://name-chain-round";  // circular links
export const GENERATED_NAME_CHAIN_OVAL_PATH = "generated://name-chain-oval";    // rounded oval links
export const GENERATED_NAME_CHAIN_SQUARE_PATH = "generated://name-chain-square"; // square links

// Placeholders for bracelets
export const PLACEHOLDERS_FOR_BRACELET = [
    "/bc-assets/bracelet_models/BRACELET1.glb",
    "/bc-assets/bracelet_models/BRACELET3.glb",
    "/bc-assets/bracelet_models/BRACELET4.glb",
    "/bc-assets/bracelet_models/BRACELET5.glb",
    "/bc-assets/bracelet_models/BRACELET6.glb"
];

// Array of paths to the bracelet GLB models.
export const BRACELETS = [
    //{ path: "/bc-assets/bracelet_models/BRACELET1.glb", name: "Bold Link Chain", price: 1000 },
    //{ path: "/bc-assets/bracelet_models/BRACELET2.glb", name: "Classic Chain", price: 1200 },
    //{ path: "/bc-assets/bracelet_models/BRACELET3.glb", name: "Light Chain", price: 1400 },
    //{ path: "/bc-assets/bracelet_models/BRACELET4.glb", name: "Swirl Diamond", price: 1600 },
    //{ path: "/bc-assets/bracelet_models/BRACELET5.glb", name: "Eternal Heart", price: 1800 },
    // { path: "/bc-assets/bracelet_models/BRACELET6.glb", name: "Bolt Closure", price: 2000 },
    // { path: "/bc-assets/bracelet_models/BRACELET7.glb", name: "Diamond Tennis", price: 2200 },
    // { path: "/bc-assets/bracelet_models/BRACELET8.glb", name: "Disc Braid", price: 2400 },
    // { path: "/bc-assets/bracelet_models/BRACELET9.glb", name: "Textured Loop", price: 2600 },
    // { path: "/bc-assets/bracelet_models/BRACELET10.glb", name: "Cut-Out Band", price: 2800 },
    // { path: "/bc-assets/bracelet_models/BRACELET11.glb", name: "Wave Band", price: 3000 },
     { path: GENERATED_NAME_CHAIN_PATH, name: "Cable Name Chain", price: 3400 },
     { path: GENERATED_NAME_CHAIN_ROUND_PATH, name: "Round Name Chain", price: 3400 },
     { path: GENERATED_NAME_CHAIN_OVAL_PATH, name: "Oval Name Chain", price: 3450 },
     { path: GENERATED_NAME_CHAIN_SQUARE_PATH, name: "Square Name Chain", price: 3450 },
     { path: "/bc-assets/bracelet_models/BRACELET13.glb", name: "Knot Link", price: 3200 },
     { path: "/bc-assets/bracelet_models/BRACELET14.glb", name: "clip chain", price: 3200 },
];

// Card thumbnail is tied to the bracelet's identity (path), not its index in
// BRACELETS, so re-ordering the array can never mismatch the artwork.
// The generated name chain has no photo yet - drop one in here when it exists.
export const BRACELET_CARD_IMAGE_BY_PATH = {
    "/bc-assets/bracelet_models/BRACELET13.glb": "/bc-assets/images/bracelets/bracelet13.png",
    "/bc-assets/bracelet_models/BRACELET14.glb": "/bc-assets/images/bracelets/bracelet14.png",
    [GENERATED_NAME_CHAIN_PATH]: "/bc-assets/images/bracelets/name-chain-cable.webp",
    [GENERATED_NAME_CHAIN_ROUND_PATH]: "/bc-assets/images/bracelets/name-chain-round.webp",
    [GENERATED_NAME_CHAIN_OVAL_PATH]: "/bc-assets/images/bracelets/name-chain-oval.webp",
    // Square Name Chain has no photo yet - its card falls back to the label.
};

// ── Name pendant ──────────────────────────────────────────────────────────
// Only the procedurally generated chains accept a name pendant: their links are
// built at runtime around whatever the name measures, so the chain can open up
// to exactly the right width. The two GLB chains are closed loops and cannot.
export const NAME_PENDANT_SUPPORTED_PATHS = [
    GENERATED_NAME_CHAIN_PATH,
    GENERATED_NAME_CHAIN_ROUND_PATH,
    GENERATED_NAME_CHAIN_OVAL_PATH,
    GENERATED_NAME_CHAIN_SQUARE_PATH,
];

export const isGeneratedNameChain = (path) => NAME_PENDANT_SUPPORTED_PATHS.includes(path);

export const NAME_PENDANT_MAX_LENGTH = 12;

// `letterSpacingEm` is a FRACTION OF THE TEXT SIZE, not a world-unit value.
// TextGeometry's own letterSpacing is absolute, so a value tuned at one size
// crushes the glyphs together at a smaller one - which is why this is stored
// as a ratio and multiplied by NAME_CHAIN_CONFIG.textSize at render time.
// The numbers below are the necklace's tuning (-0.10 at size 1.1) expressed
// as a ratio, so both configurators letter-space identically.
// Negative is correct here: these are connected script faces whose glyphs are
// drawn to overlap slightly and join up.
export const NAME_PENDANT_FONTS = [
    { id: "dancing",    label: "Dancing",    sample: "R", url: "/fonts/Dancing Script_Bold.json",  letterSpacingEm: -0.091 },
    { id: "kingsman",   label: "Kingsman",   sample: "K", url: "/fonts/Kingsman Demo_Regular.json", letterSpacingEm: -0.091 },
    { id: "yellowtail", label: "Yellowtail", sample: "Y", url: "/fonts/Yellowtail_Regular.json",    letterSpacingEm: -0.091 },
];

export const DEFAULT_NAME_PENDANT = {
    enabled: true,
    text: "Name",
    fontStyle: "dancing",
};

// Same character allow-list the necklace uses, capped for a wrist-sized plate.
export const sanitizePendantText = (value = "") =>
    value.replace(/[^a-zA-Z0-9 '&.-]/g, "").slice(0, NAME_PENDANT_MAX_LENGTH);

// Array of paths to the charm GLB models.
export const CHARMS = [
    { path: "/bc-assets/bracelet_models/CHARMS1.glb", name: "Classic Butterfly", price: 50 },
    { path: "/bc-assets/bracelet_models/CHARMS2.glb", name: "Elegant Floral", price: 60 },
    { path: "/bc-assets/bracelet_models/CHARMS3.glb", name: "Starfish", price: 70 },
    { path: "/bc-assets/bracelet_models/CHARMS4.glb", name: "Modern Star", price: 80 },
    { path: "/bc-assets/bracelet_models/CHARMS5.glb", name: "Sphere Locket", price: 90 },
    { path: "/bc-assets/bracelet_models/CHARMS6.glb", name: "Silken Tassel", price: 100 },
    { path: "/bc-assets/bracelet_models/CHARMS7.glb", name: "Classic Heart", price: 110 },
    { path: "/bc-assets/bracelet_models/CHARMS8.glb", name: "Gladiator Helmet", price: 120 },
    { path: "/bc-assets/bracelet_models/CHARMS9.png", name: "Butterfly", price: 60 },
    { path: "/bc-assets/bracelet_models/CHARMS10.png", name: "Cat", price: 60 },
    { path: "/bc-assets/bracelet_models/CHARMS11.png", name: "Dog", price: 60 },
    { path: "/bc-assets/bracelet_models/CHARMS12.png", name: "Paw", price: 60 },
    { path: "/bc-assets/bracelet_models/CHARMS13.png", name: "Cherry", price: 50 },
    { path: "/bc-assets/bracelet_models/CHARMS14.png", name: "Cluster", price: 50 },
    { path: "/bc-assets/bracelet_models/CHARMS15.png", name: "Flower", price: 50 },
    { path: "/bc-assets/bracelet_models/CHARMS16.png", name: "Leaf", price: 50 },
    { path: "/bc-assets/bracelet_models/CHARMS17.png", name: "A", price: 40 },
    { path: "/bc-assets/bracelet_models/CHARMS18.png", name: "B", price: 40 },
    { path: "/bc-assets/bracelet_models/CHARMS19.png", name: "C", price: 40 },
    { path: "/bc-assets/bracelet_models/CHARMS20.png", name: "D", price: 40 },
    { path: "/bc-assets/bracelet_models/CHARMS21.png", name: "Gemini", price: 50 },
    { path: "/bc-assets/bracelet_models/CHARMS22.png", name: "Leo", price: 50 },
    { path: "/bc-assets/bracelet_models/CHARMS23.png", name: "Taurus", price: 50 },
    { path: "/bc-assets/gemstone/BIRTHSTONE.glb", name: "Birthstone", price: 50, type: "birthstone" },
    { path: "/bc-assets/gemstone/D1.glb", name: "Round Diamond", price: 50, type: "diamond", preview: "/bc-assets/images/diamonds/round.webp" },
    { path: "/bc-assets/gemstone/D2.glb", name: "Pear Diamond", price: 50, type: "diamond", preview: "/bc-assets/images/diamonds/pear.webp" },
    { path: "/bc-assets/gemstone/D3.glb", name: "Oval Diamond", price: 50, type: "diamond", preview: "/bc-assets/images/diamonds/oval.webp" },
];
export const STONE_COLOR_SWATCHES = [
    { key: "GAR", label: "Garnet (January)",      hex: "#C8102E", image: "/bc-assets/images/birthstones/garnet-jan.webp" },
    { key: "AME", label: "Amethyst (February)",   hex: "#6D3BB5", image: "/bc-assets/images/birthstones/amethyst-feb.webp" },
    { key: "AQU", label: "Aquamarine (March)",    hex: "#8EC7DF", image: "/bc-assets/images/birthstones/aquamarine-march.webp" },
    { key: "DIA", label: "Diamond (April)",       hex: "#F4F8FF", image: "/bc-assets/images/birthstones/diamond-april.webp" },
    { key: "EMR", label: "Emerald (May)",         hex: "#009B77", image: "/bc-assets/images/birthstones/emerald-may.webp" },
    { key: "ALX", label: "Alexandrite (June)",    hex: "#C978A9", image: "/bc-assets/images/birthstones/alexandrite-june.webp" },
    { key: "RBY", label: "Ruby (July)",           hex: "#9B111E", image: "/bc-assets/images/birthstones/ruby-july.webp" },
    { key: "PRD", label: "Peridot (August)",      hex: "#AFCB2B", image: "/bc-assets/images/birthstones/peridot-august.webp" },
    { key: "SAP", label: "Sapphire (September)",  hex: "#0F52BA", image: "/bc-assets/images/birthstones/sapphire-september.webp" },
    { key: "TRM", label: "Tourmaline (October)",  hex: "#F0839C", image: "/bc-assets/images/birthstones/tourmaline-october.webp" },
    { key: "TOP", label: "Topaz (November)",      hex: "#D9B83D", image: "/bc-assets/images/birthstones/topaz-november.webp" },
    { key: "TRQ", label: "Turquoise (December)",  hex: "#4AA7BA", image: "/bc-assets/images/birthstones/turquoise-december.webp" },
];
// Birthstone and diamond charms use pre-rendered images. Platinum intentionally
// shares the white-gold image set, as supplied by the product catalogue.
export const CHARM_METAL_SWATCHES = [
    { key: "WG", label: "White Gold", hex: "#DBDBDB", image: "white.png" },
    { key: "YG", label: "Yellow Gold", hex: "#FFD280", image: "yellow.png" },
    { key: "RG", label: "Rose Gold", hex: "#FFBAA3", image: "rose.png" },
    { key: "WG", label: "Platinum", hex: "#e5e4e2", image: "platinum.png" },
];

export const getCharmNumberFromPath = (path = "") => {
    const match = path.match(/CHARMS(\d+)\.png$/i);
    return match ? Number(match[1]) : null;
};

export const isImageCharmNumber = (number) => number >= 9 && number <= 36;

export const getImageCharmPath = (number, metalKey = "WG") =>
    `/bc-assets/image_charm/${metalKey === "YG" ? "YG" : metalKey === "RG" ? "RG" : "WG"}/CHARMS${number}.png`;

// Control thumbnails are intentionally shared across metals.  The rendered
// charm still uses getImageCharmPath(), which points at the selected metal's
// full-size artwork.
export const getImageCharmIconPath = (number) =>
    `/bc-assets/images/charms/charm${number}.png`;
// Manual per-point fine-tuning for birthstone charm placement.
// Keyed by bracelet path, then by point name ("point-1".."point-9").
//
// `offset` is [x, y, z] added directly to that point's final scene position
// (i.e. AFTER the bracelet's own wrapper transform — same units/scale you
// see the charm rendered at, so small nudges like 0.01–0.05 are typical).
//
// `rotationOffset` is in radians, added on top of the auto-computed radial
// rotation — positive spins the charm counter-clockwise around the bail axis.
//
// Everything defaults to 0/no change; only fill in a point once you've
// checked it in-scene and it needs a nudge.
export const BIRTHSTONE_POINT_ADJUSTMENTS = {
    "/bc-assets/bracelet_models/BRACELET13.glb": {
        "point-1": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-2": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-3": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-4": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-5": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-6": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-7": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-8": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-9": { offset: [0, 0, 0], rotationOffset: 0 },
    },
    "/bc-assets/bracelet_models/BRACELET14.glb": {
        "point-1": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-2": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-3": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-4": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-5": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-6": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-7": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-8": { offset: [0, 0, 0], rotationOffset: 0 },
        "point-9": { offset: [0, 0, 0], rotationOffset: 0 },
    },
};
// Object defining the initial position and scale for each bracelet model.
export const BRACELET_POSITIONS = {
    "/bc-assets/bracelet_models/BRACELET1.glb": { position: [-3.6, 0, 0], },
    "/bc-assets/bracelet_models/BRACELET2.glb": { position: [-3.65, 0.2, -3], },
    "/bc-assets/bracelet_models/BRACELET3.glb": { position: [-0.3, -1.45, -1.4], rotation: [2, 0, 0] },
    "/bc-assets/bracelet_models/BRACELET4.glb": { position: [0, 0.3, 0], scale: [0.2, 0.2, 0.2], rotation: [1.6, 0, 0] },
    "/bc-assets/bracelet_models/BRACELET5.glb": { position: [0, 0.4, 0], scale: [3, 3, 3] },
    "/bc-assets/bracelet_models/BRACELET6.glb": { position: [0, 0.2, 0], scale: [2.3, 2.3, 2.3] },
    "/bc-assets/bracelet_models/BRACELET7.glb": { position: [0, 0.2, 0], scale: [0.07, 0.07, 0.07] },
    "/bc-assets/bracelet_models/BRACELET8.glb": { position: [0, 0.2, 0], scale: [0.07, 0.07, 0.07] },
    "/bc-assets/bracelet_models/BRACELET9.glb": { position: [0, 0.2, 0], scale: [0.07, 0.07, 0.07] },
    "/bc-assets/bracelet_models/BRACELET10.glb": { position: [0, 0.2, 0], scale: [0.07, 0.07, 0.07], rotation: [1.6, 0, 0] },
    "/bc-assets/bracelet_models/BRACELET11.glb": { position: [0, 0.2, 0], scale: [0.07, 0.07, 0.07], rotation: [1.6, 0, 0] },
    "/bc-assets/bracelet_models/BRACELET13.glb": { position: [0, 0.6, 0], scale: [0.04, 0.04, 0.04] },
    "/bc-assets/bracelet_models/BRACELET14.glb": { position: [0, 0.6, -0.03], scale: [0.65, 0.65, 0.65], rotation: [0, 0, 0]  },

};

// Object defining the positions and rotations for charms on each specific bracelet.
// This nested structure allows for precise placement of different charms on different bracelets.
export const CHARM_POSITIONS = {
    "/bc-assets/bracelet_models/BRACELET1.glb": {
        "/bc-assets/bracelet_models/CHARMS1.glb": [
            { position2: [-0.9, 0.2, 0], position: [-1.6, 0.2, -1], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.6, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -2], rotation: [Math.PI / 2, Math.PI, 1.3] },
            { position2: [-0.4, 0.2, -1], position: [-0.3, 0.2, -2.3], rotation: [Math.PI / 2, Math.PI, 0.9] },
            { position2: [0, 0.2, -1.1], position: [0.5, 0.2, -2.2], rotation: [Math.PI / 2, Math.PI, 0.5] },
            { position2: [0.4, 0.2, -1], position: [1.3, 0.2, -1.9], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.74, 0.2, -0.75], position: [1.9, 0.2, -1.2], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.92, 0.2, -0.45], position: [2.2, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.9, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.45, 0.2, 1.5], rotation: [Math.PI / 2, Math.PI, -1.7] },
            { position2: [0.6, 0.2, 0.6], position: [0.7, 0.2, 1.9], rotation: [Math.PI / 2, Math.PI, -2.1] },
            { position2: [0.24, 0.2, 0.8], position: [-0.1, 0.2, 2.05], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS2.glb": [
            { position2: [-0.95, 0.2, 0], position: [-2.1, 0.2, 0], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.9, 0.2, -0.4], position: [-2.0, 0.2, -0.5], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.75, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.9, 0.2, -2], rotation: [Math.PI / 2, Math.PI, 0.5] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -2.2], rotation: [Math.PI / 2, Math.PI, 0.1] },
            { position2: [0.4, 0.2, -1], position: [0.7, 0.2, -2.1], rotation: [Math.PI / 2, Math.PI, -0.2] },
            { position2: [0.74, 0.2, -0.75], position: [1.4, 0.2, -1.7], rotation: [Math.PI / 2, Math.PI, -0.5] },
            { position2: [0.93, 0.2, -0.45], position: [1.9, 0.2, -1.05], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [2.1, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.9, 0.2, 0.7], rotation: [Math.PI / 2, Math.PI, -1.8] },
            { position2: [0.6, 0.2, 0.6], position: [1.5, 0.2, 1.2], rotation: [Math.PI / 2, Math.PI, -2] },
            { position2: [0.24, 0.2, 0.8], position: [0.6, 0.2, 1.9], rotation: [Math.PI / 2, Math.PI, -2.8] }
        ],
        "/bc-assets/bracelet_models/CHARMS3.glb": [
            { position2: [-0.95, 0.2, 0], position: [-1.3, 0.2, 0], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.1, 0.1, 0.1] },
            { position2: [-0.9, 0.2, -0.4], position: [-1.3, 0.2, -0.5], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.1, 0.1, 0.1] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.05, 0.2, -1], rotation: [Math.PI / 2, Math.PI, 1.1], scale: [0.1, 0.1, 0.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.6, 0.2, -1.35], rotation: [Math.PI / 2, Math.PI, 0.5], scale: [0.1, 0.1, 0.1] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.1], scale: [0.1, 0.1, 0.1] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, -0.2], scale: [0.1, 0.1, 0.1] },
            { position2: [0.74, 0.2, -0.75], position: [0.9, 0.2, -1.1], rotation: [Math.PI / 2, Math.PI, -0.5], scale: [0.1, 0.1, 0.1] },
            { position2: [0.93, 0.2, -0.45], position: [1.3, 0.2, -0.6], rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.1, 0.1, 0.1] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0], rotation: [Math.PI / 2, Math.PI, -1.4], scale: [0.1, 0.1, 0.1] },
            { position2: [0.85, 0.2, 0.35], position: [1.2, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.8], scale: [0.1, 0.1, 0.1] },
            { position2: [0.6, 0.2, 0.6], position: [0.8, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.1, 0.1, 0.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.4, 0.2, 1.2], rotation: [Math.PI / 2, Math.PI, -2.8], scale: [0.1, 0.1, 0.1] }
        ],
        "/bc-assets/bracelet_models/CHARMS4.glb": [
            { position2: [-0.95, 0.2, 0], position: [-1.5, 0.2, 0], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.1, 0.1, 0.1] },
            { position2: [-0.9, 0.2, -0.4], position: [-1.4, 0.2, -0.5], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.1, 0.1, 0.1] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.2, 0.2, -1], rotation: [Math.PI / 2, Math.PI, 1.1], scale: [0.1, 0.1, 0.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.65, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.5], scale: [0.1, 0.1, 0.1] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.6], rotation: [Math.PI / 2, Math.PI, 0.1], scale: [0.1, 0.1, 0.1] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, -0.2], scale: [0.1, 0.1, 0.1] },
            { position2: [0.74, 0.2, -0.75], position: [1.0, 0.2, -1.2], rotation: [Math.PI / 2, Math.PI, -0.5], scale: [0.1, 0.1, 0.1] },
            { position2: [0.93, 0.2, -0.45], position: [1.4, 0.2, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.1, 0.1, 0.1] },
            { position2: [0.97, 0.2, -0.05], position: [1.5, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4], scale: [0.1, 0.1, 0.1] },
            { position2: [0.85, 0.2, 0.35], position: [1.3, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.8], scale: [0.1, 0.1, 0.1] },
            { position2: [0.6, 0.2, 0.6], position: [1.0, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.1, 0.1, 0.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.4, 0.2, 1.3], rotation: [Math.PI / 2, Math.PI, -2.8], scale: [0.1, 0.1, 0.1] }
        ],
        "/bc-assets/bracelet_models/CHARMS5.glb": [
            { position2: [-0.95, 0.2, 0], position: [-1.3, 0.15, 0], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.1, 0.1, 0.1] },
            { position2: [-0.9, 0.2, -0.4], position: [-1.25, 0.15, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.1, 0.1, 0.1] },
            { position2: [-0.7, 0.2, -0.74], position: [-0.95, 0.15, -0.98], rotation: [Math.PI / 2, Math.PI, 1.1], scale: [0.1, 0.1, 0.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.6, 0.15, -1.3], rotation: [Math.PI / 2, Math.PI, 0.5], scale: [0.1, 0.1, 0.1] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.15, -1.45], rotation: [Math.PI / 2, Math.PI, 0.1], scale: [0.1, 0.1, 0.1] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.15, -1.35], rotation: [Math.PI / 2, Math.PI, -0.2], scale: [0.1, 0.1, 0.1] },
            { position2: [0.74, 0.2, -0.75], position: [0.9, 0.15, -1.1], rotation: [Math.PI / 2, Math.PI, -0.5], scale: [0.1, 0.1, 0.1] },
            { position2: [0.93, 0.2, -0.45], position: [1.2, 0.15, -0.6], rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.1, 0.1, 0.1] },
            { position2: [0.97, 0.2, -0.05], position: [1.3, 0.15, -0], rotation: [Math.PI / 2, Math.PI, -1.4], scale: [0.1, 0.1, 0.1] },
            { position2: [0.85, 0.2, 0.35], position: [1.2, 0.15, 0.5], rotation: [Math.PI / 2, Math.PI, -1.8], scale: [0.1, 0.1, 0.1] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.15, 0.8], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.1, 0.1, 0.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.3, 0.1, 1.15], rotation: [Math.PI / 2, Math.PI, -2.8], scale: [0.1, 0.1, 0.1] }
        ],
        "/bc-assets/bracelet_models/CHARMS6.glb": [
            { position2: [-0.95, 0.2, 0], position: [-1.3, 0.15, 0], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.2, 0.2, 0.2] },
            { position2: [-0.9, 0.2, -0.4], position: [-1.25, 0.15, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.2, 0.2, 0.2] },
            { position2: [-0.7, 0.2, -0.74], position: [-0.95, 0.15, -0.9], rotation: [Math.PI / 2, Math.PI, 1.1], scale: [0.2, 0.2, 0.2] },
            { position2: [-0.4, 0.2, -1], position: [-0.5, 0.15, -1.3], rotation: [Math.PI / 2, Math.PI, 0.5], scale: [0.2, 0.2, 0.2] },
            { position2: [0, 0.2, -1.1], position: [0, 0.15, -1.4], rotation: [Math.PI / 2, Math.PI, 0.1], scale: [0.2, 0.2, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.15, -1.3], rotation: [Math.PI / 2, Math.PI, -0.2], scale: [0.2, 0.2, 0.2] },
            { position2: [0.74, 0.2, -0.75], position: [0.9, 0.15, -1.05], rotation: [Math.PI / 2, Math.PI, -0.5], scale: [0.2, 0.2, 0.2] },
            { position2: [0.93, 0.2, -0.45], position: [1.2, 0.15, -0.6], rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.2, 0.2, 0.2] },
            { position2: [0.97, 0.2, -0.05], position: [1.3, 0.15, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4], scale: [0.2, 0.2, 0.2] },
            { position2: [0.85, 0.2, 0.35], position: [1.1, 0.15, 0.5], rotation: [Math.PI / 2, Math.PI, -1.8], scale: [0.2, 0.2, 0.2] },
            { position2: [0.6, 0.2, 0.6], position: [0.85, 0.15, 0.8], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.2, 0.2, 0.2] },
            { position2: [0.24, 0.2, 0.8], position: [0.3, 0.1, 1.1], rotation: [Math.PI / 2, Math.PI, -2.8], scale: [0.2, 0.2, 0.2] }
        ],
        "/bc-assets/bracelet_models/CHARMS7.glb": [
            { position2: [-0.95, 0.2, 0], position: [-1.1, 0.15, 0], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.2, 0.2, 0.2] },
            { position2: [-0.9, 0.2, -0.4], position: [-1.15, 0.15, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.2, 0.2, 0.2] },
            { position2: [-0.7, 0.2, -0.74], position: [-0.9, 0.15, -0.9], rotation: [Math.PI / 2, Math.PI, 1.1], scale: [0.2, 0.2, 0.2] },
            { position2: [-0.4, 0.2, -1], position: [-0.5, 0.15, -1.2], rotation: [Math.PI / 2, Math.PI, 0.5], scale: [0.2, 0.2, 0.2] },
            { position2: [0, 0.2, -1.1], position: [0, 0.15, -1.3], rotation: [Math.PI / 2, Math.PI, 0.1], scale: [0.2, 0.2, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.15, -1.2], rotation: [Math.PI / 2, Math.PI, -0.2], scale: [0.2, 0.2, 0.2] },
            { position2: [0.74, 0.2, -0.75], position: [0.9, 0.15, -1], rotation: [Math.PI / 2, Math.PI, -0.5], scale: [0.2, 0.2, 0.2] },
            { position2: [0.93, 0.2, -0.45], position: [1.1, 0.15, -0.5], rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.2, 0.2, 0.2] },
            { position2: [0.97, 0.2, -0.05], position: [1.2, 0.15, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4], scale: [0.2, 0.2, 0.2] },
            { position2: [0.85, 0.2, 0.35], position: [1.0, 0.15, 0.4], rotation: [Math.PI / 2, Math.PI, -1.8], scale: [0.2, 0.2, 0.2] },
            { position2: [0.6, 0.2, 0.6], position: [0.7, 0.15, 0.8], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.2, 0.2, 0.2] },
            { position2: [0.24, 0.2, 0.8], position: [0.3, 0.15, 1], rotation: [Math.PI / 2, Math.PI, -2.8], scale: [0.2, 0.2, 0.2] }
        ],
        "/bc-assets/bracelet_models/CHARMS8.glb": [
            { position2: [-0.95, 0.2, 0], position: [-1.4, -0.7, 0], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.04, 0.04, 0.04] },
            { position2: [-0.9, 0.2, -0.4], position: [-1.45, -0.7, -0.5], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [0.04, 0.04, 0.04] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.15, -0.7, -1.05], rotation: [Math.PI / 2, Math.PI, 1.1], scale: [0.04, 0.04, 0.04] },
            { position2: [-0.4, 0.2, -1], position: [-0.6, -0.7, -1.45], rotation: [Math.PI / 2, Math.PI, 0.5], scale: [0.04, 0.04, 0.04] },
            { position2: [0, 0.2, -1.1], position: [0, -0.7, -1.6], rotation: [Math.PI / 2, Math.PI, 0.1], scale: [0.04, 0.04, 0.04] },
            { position2: [0.4, 0.2, -1], position: [0.5, -0.7, -1.55], rotation: [Math.PI / 2, Math.PI, -0.2], scale: [0.04, 0.04, 0.04] },
            { position2: [0.74, 0.2, -0.75], position: [1.0, -0.7, -1.2], rotation: [Math.PI / 2, Math.PI, -0.5], scale: [0.04, 0.04, 0.04] },
            { position2: [0.93, 0.2, -0.45], position: [1.4, -0.7, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.04, 0.04, 0.04] },
            { position2: [0.97, 0.2, -0.05], position: [1.5, -0.7, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4], scale: [0.04, 0.04, 0.04] },
            { position2: [0.85, 0.2, 0.35], position: [1.4, -0.7, 0.5], rotation: [Math.PI / 2, Math.PI, -1.8], scale: [0.04, 0.04, 0.04] },
            { position2: [0.6, 0.2, 0.6], position: [1.1, -0.7, 0.9], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.04, 0.04, 0.04] },
            { position2: [0.24, 0.2, 0.8], position: [0.4, -0.7, 1.3], rotation: [Math.PI / 2, Math.PI, -2.8], scale: [0.04, 0.04, 0.04] }
        ],
        "/bc-assets/bracelet_models/CHARMS9.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.35, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.33, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.2, -1.4], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.5] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.45, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS10.png": [
           { position2: [-0.9, 0.2, 0], position: [-1.42, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.41, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.18, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.8, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.18, 0.2, -1.55], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.58, 0.2, -1.45], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [1, 0.2, -1.18], rotation: [Math.PI / 2, Math.PI, -0.7] },
            { position2: [0.92, 0.2, -0.45], position: [1.3, 0.2, -0.75], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.45, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.3, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 1], rotation: [Math.PI / 2, Math.PI, -2.5] },
            { position2: [0.24, 0.2, 0.8], position: [0.5, 0.15, 1.2], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS11.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.35, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.33, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.2, -1.4], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.5] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.45, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS12.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.35, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.33, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.2, -1.4], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.5] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.45, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS13.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.35, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.33, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.2, -1.4], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.5] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.45, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS14.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.35, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.33, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.2, -1.4], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.5] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.45, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS15.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.35, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.33, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.2, -1.4], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.5] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.45, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS16.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.35, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.33, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.2, -1.4], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.5] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.45, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS17.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.42, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.41, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.18, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.8, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.18, 0.2, -1.55], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.58, 0.2, -1.45], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [1, 0.2, -1.18], rotation: [Math.PI / 2, Math.PI, -0.7] },
            { position2: [0.92, 0.2, -0.45], position: [1.3, 0.2, -0.75], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.45, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.3, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 1], rotation: [Math.PI / 2, Math.PI, -2.5] },
            { position2: [0.24, 0.2, 0.8], position: [0.5, 0.15, 1.2], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS18.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.38, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.37, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.18, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.55, 0.2, -1.45], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.7] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.75], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.95], rotation: [Math.PI / 2, Math.PI, -2.5] },
            { position2: [0.24, 0.2, 0.8], position: [0.5, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS19.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.38, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.37, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.18, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.55, 0.2, -1.45], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.7] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.75], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.95], rotation: [Math.PI / 2, Math.PI, -2.5] },
            { position2: [0.24, 0.2, 0.8], position: [0.5, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS20.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.38, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.37, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.18, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.55, 0.2, -1.45], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.7] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.75], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.95], rotation: [Math.PI / 2, Math.PI, -2.5] },
            { position2: [0.24, 0.2, 0.8], position: [0.5, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS21.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.35, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.33, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.2, -1.4], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.5] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.45, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS22.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.39, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.36, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.13, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.35], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.55], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.55, 0.2, -1.45], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.15], rotation: [Math.PI / 2, Math.PI, -0.7] },
            { position2: [0.92, 0.2, -0.45], position: [1.3, 0.2, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.45, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.3, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 1], rotation: [Math.PI / 2, Math.PI, -2.5] },
            { position2: [0.24, 0.2, 0.8], position: [0.5, 0.15, 1.2], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],
        "/bc-assets/bracelet_models/CHARMS23.png": [
            { position2: [-0.9, 0.2, 0], position: [-1.35, 0.2, 0.1], rotation: [Math.PI / 2, Math.PI, 1.9] },
            { position2: [-0.95, 0.2, -0.4], position: [-1.33, 0.2, -0.4], rotation: [Math.PI / 2, Math.PI, 1.5] },
            { position2: [-0.7, 0.2, -0.74], position: [-1.1, 0.2, -0.95], rotation: [Math.PI / 2, Math.PI, 1.1] },
            { position2: [-0.4, 0.2, -1], position: [-0.7, 0.2, -1.3], rotation: [Math.PI / 2, Math.PI, 0.8] },
            { position2: [0, 0.2, -1.1], position: [-0.1, 0.2, -1.5], rotation: [Math.PI / 2, Math.PI, 0.2] },
            { position2: [0.4, 0.2, -1], position: [0.5, 0.2, -1.4], rotation: [Math.PI / 2, Math.PI, -0.3] },
            { position2: [0.74, 0.2, -0.75], position: [0.95, 0.2, -1.13], rotation: [Math.PI / 2, Math.PI, -0.5] },
            { position2: [0.92, 0.2, -0.45], position: [1.24, 0.2, -0.7], rotation: [Math.PI / 2, Math.PI, -0.9] },
            { position2: [0.97, 0.2, -0.05], position: [1.4, 0.2, -0.1], rotation: [Math.PI / 2, Math.PI, -1.4] },
            { position2: [0.85, 0.2, 0.35], position: [1.25, 0.2, 0.5], rotation: [Math.PI / 2, Math.PI, -1.9] },
            { position2: [0.6, 0.2, 0.6], position: [0.9, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.1] },
            { position2: [0.24, 0.2, 0.8], position: [0.45, 0.15, 1.15], rotation: [Math.PI / 2, Math.PI, -2.5] }
        ],

    },
    "/bc-assets/bracelet_models/BRACELET2.glb": {
        "/bc-assets/bracelet_models/CHARMS1.glb": [
            { position2: [0.3, 0.2, -1.1], position: [-0.5, 0.2, 1.75], rotation: [Math.PI / 2, Math.PI, -2.5] },
            { position2: [1.3, 0.2, -0.9], position: [-0.95, 0.22, 1.4], rotation: [Math.PI / 2, Math.PI, -3] },
            { position2: [1.55, 0.2, 0], position: [-1.35, 0.24, 0.9], rotation: [Math.PI / 2, Math.PI, -3.5] },
        ],
        "/bc-assets/bracelet_models/CHARMS2.glb": [
            { position2: [0.3, 0.2, -1.1], position: [0.85, 0.2, 1.05], rotation: [Math.PI / 2, Math.PI, -2] },
            { position2: [1.3, 0.2, -0.9], position: [0.05, 0.6, 1.6], rotation: [1.2, Math.PI, -3] },
            { position2: [1.55, 0.2, 0], position: [-0.95, 0.5, 1.2], rotation: [1.2, Math.PI, -4] },
        ],
        "/bc-assets/bracelet_models/CHARMS3.glb": [
            { position2: [0.3, 0.2, -1.1], position: [0.15, 0.2, 0.8], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.1, 0.1, 0.1] },
            { position2: [1.3, 0.2, -0.9], position: [-0.11, 0.3, 0.9], rotation: [1.2, Math.PI, -3], scale: [0.1, 0.1, 0.1] },
            { position2: [1.55, 0.2, 0], position: [-0.28, 0.3, 0.8], rotation: [1.2, Math.PI, -3.7], scale: [0.1, 0.1, 0.1] },
        ],
        "/bc-assets/bracelet_models/CHARMS4.glb": [
            { position2: [0.3, 0.2, -1.1], position: [0.25, 0.2, 0.8], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.1, 0.1, 0.1] },
            { position2: [1.3, 0.2, -0.9], position: [-0.08, 0.3, 1], rotation: [1.2, Math.PI, -3], scale: [0.1, 0.1, 0.1] },
            { position2: [1.55, 0.2, 0], position: [-0.35, 0.3, 0.9], rotation: [1.2, Math.PI, -3.7], scale: [0.1, 0.1, 0.1] },
        ],
        "/bc-assets/bracelet_models/CHARMS5.glb": [
            { position2: [0.3, 0.2, -1.1], position: [0.15, 0.2, 0.75], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.1, 0.1, 0.1] },
            { position2: [1.3, 0.2, -0.9], position: [-0.11, 0.3, 0.85], rotation: [1.2, Math.PI, -3], scale: [0.1, 0.1, 0.1] },
            { position2: [1.55, 0.2, 0], position: [-0.28, 0.3, 0.75], rotation: [1.2, Math.PI, -3.7], scale: [0.1, 0.1, 0.1] },
        ],
        "/bc-assets/bracelet_models/CHARMS6.glb": [
            { position2: [0.3, 0.2, -1.1], position: [-0.05, 0.2, 0.74], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.1, 0.1, 0.1] },
            { position2: [1.3, 0.2, -0.9], position: [-0.11, 0.2, 0.75], rotation: [1.2, Math.PI, -3], scale: [0.1, 0.1, 0.1] },
            { position2: [1.55, 0.2, 0], position: [-0.20, 0.2, 0.75], rotation: [1.2, Math.PI, -3.7], scale: [0.1, 0.1, 0.1] },
        ],
        "/bc-assets/bracelet_models/CHARMS7.glb": [
            { position2: [0.3, 0.2, -1.1], position: [-0.05, 0.2, 0.7], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.1, 0.1, 0.1] },
            { position2: [1.3, 0.2, -0.9], position: [-0.11, 0.2, 0.7], rotation: [1.2, Math.PI, -3], scale: [0.1, 0.1, 0.1] },
            { position2: [1.55, 0.2, 0], position: [-0.20, 0.2, 0.69], rotation: [1.2, Math.PI, -3.7], scale: [0.1, 0.1, 0.1] },
        ],
        "/bc-assets/bracelet_models/CHARMS8.glb": [
            { position2: [0.3, 0.2, -1.1], position: [0.15, -0.4, 0.89], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, -0.3, 1.2], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.25, -0.25, 1.1], rotation: [1.2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS9.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS10.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.1, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.95], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.3, 0.1, 0.9], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS11.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS12.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS13.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS14.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS15.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS16.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS17.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.1, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.97], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.3, 0.1, 0.9], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS18.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS19.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS20.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS21.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS22.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.1, 0.2, 0.9], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.94], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.3, 0.1, 0.88], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ],
        "/bc-assets/bracelet_models/CHARMS23.png": [
            { position2: [0.3, 0.2, -1.1], position: [0.07, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.03, 0.03, 0.03] },
            { position2: [1.3, 0.2, -0.9], position: [-0.07, 0.33, 0.90], rotation: [1.2, Math.PI, -3], scale: [0.03, 0.03, 0.03] },
            { position2: [1.55, 0.2, 0], position: [-0.27, 0.1, 0.86], rotation: [2, Math.PI, -3.7], scale: [0.03, 0.03, 0.03] },
        ]
    },
    "/bc-assets/bracelet_models/BRACELET13.glb": {
        "/bc-assets/bracelet_models/CHARMS1.glb": [
            { position2: [0.2, 0.12, -1.0], scales: [0.02, 16, 16], position: [0.75, 0.1, -1.35], rotation: [Math.PI / 2, Math.PI, 0],scale: [20, 20, 20] },
            { position2: [0.46, 0.12, -0.85], scales: [0.02, 16, 16], position: [1.03, 0.13, -1.22], rotation: [Math.PI / 2, Math.PI, 0],scale: [20, 20, 20] },
            { position2: [0.65, 0.15, -0.67], scales: [0.02, 16, 16], position: [1.3, 0.15, -0.85], rotation: [Math.PI / 2, Math.PI, -0.3],scale: [20, 20, 20] },
            { position2: [0.82, 0.18, -0.43], scales: [0.02, 16, 16], position: [1.45, 0.16, -0.6], rotation: [Math.PI / 2, Math.PI, -0.3],scale: [20, 20, 20] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1.5, 0.23, 0.0], rotation: [Math.PI / 2, Math.PI, -0.8],scale: [20, 20, 20] },
            { position2: [0.85, 0.275, 0.11], scales: [0.02, 16, 16], position: [1.45, 0.29, 0.4], rotation: [Math.PI / 2, Math.PI, -1],scale: [20, 20, 20] },
            { position2: [0.78, 0.35, 0.37], scales: [0.02, 16, 16], position: [1.27, 0.35, 0.8], rotation: [Math.PI / 2, Math.PI, -1.3],scale: [20, 20, 20] },
            { position2: [0.65, 0.39, 0.61], scales: [0.02, 16, 16], position: [0.9, 0.37, 1.2], rotation: [Math.PI / 2, Math.PI, -1.8],scale: [20, 20, 20] },
            { position2: [0.46, 0.4, 0.82], scales: [0.02, 16, 16], position: [0.5, 0.4, 1.45], rotation: [Math.PI / 2, Math.PI, -2.1],scale: [20, 20, 20] },
            { position2: [0.2, 0.41, 0.94], scales: [0.02, 16, 16], position: [0.2, 0.4, 1.6], rotation: [Math.PI / 2, Math.PI, -2.1],scale: [20, 20, 20] },
            { position2: [-0.08, 0.42, 0.97], scales: [0.02, 16, 16], position: [-0.45, 0.43, 1.53], rotation: [Math.PI / 2, Math.PI, -2.7],scale: [20, 20, 20] },
            { position2: [-0.37, 0.41, 0.94], scales: [0.02, 16, 16], position: [-0.95, 0.43, 1.25], rotation: [Math.PI / 2, Math.PI, -3.2],scale: [20, 20, 20] },
            { position2: [-0.62, 0.41, 0.8], scales: [0.02, 16, 16], position: [-1.2, 0.43, 1.1], rotation: [Math.PI / 2, Math.PI, -3.2],scale: [20, 20, 20] },
            { position2: [-0.8, 0.38, 0.58], scales: [0.02, 16, 16], position: [-1.45, 0.41, 0.6], rotation: [Math.PI / 2, Math.PI, -3.7],scale: [20, 20, 20] },
            { position2: [-0.9, 0.32, 0.34], scales: [0.02, 16, 16], position: [-1.4, 0.35, -0.1], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [20, 20, 20] },
            { position2: [-0.92, 0.25, 0.05], scales: [0.02, 16, 16], position: [-1.4, 0.28, -0.35], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [20, 20, 20] },
            { position2: [-0.92, 0.2, -0.22], scales: [0.02, 16, 16], position: [-1.2, 0.23, -0.8], rotation: [Math.PI / 2, Math.PI, -4.8],scale: [20, 20, 20] },
            { position2: [-0.9, 0.15, -0.5], scales: [0.02, 16, 16], position: [-1.15, 0.2, -1.1], rotation: [Math.PI / 2, Math.PI, -4.8],scale: [20, 20, 20] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.8, 0.18, -1.4], rotation: [Math.PI / 2, Math.PI, -5.2],scale: [20, 20, 20] },
            { position2: [-0.53, 0.1, -0.96], scales: [0.02, 16, 16], position: [-0.31, 0.15, -1.6], rotation: [Math.PI / 2, Math.PI, -5.6],scale: [20, 20, 20] },
            { position2: [-0.26, 0.1, -1.04], scales: [0.02, 16, 16], position: [-0.05, 0.12, -1.68], rotation: [Math.PI / 2, Math.PI, -5.6],scale: [20, 20, 20] },
        ],
        "/bc-assets/bracelet_models/CHARMS2.glb": [
            { position2: [0.2, 0.12, -1.0], scales: [0.02, 16, 16], position: [0.2, 0.1, -1.57], rotation: [Math.PI / 2, Math.PI, 0],scale: [20, 20, 20] },
            { position2: [0.46, 0.12, -0.85], scales: [0.02, 16, 16], position: [0.47, 0.13, -1.45], rotation: [Math.PI / 2, Math.PI, 0],scale: [20, 20, 20] },
            { position2: [0.65, 0.15, -0.67], scales: [0.02, 16, 16], position: [0.84, 0.13, -1.2], rotation: [Math.PI / 2, Math.PI, -0.3],scale: [20, 20, 20] },
            { position2: [0.82, 0.18, -0.43], scales: [0.02, 16, 16], position: [1.25, 0.15, -0.8], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [20, 20, 20] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1.3, 0.2, -0.5], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [20, 20, 20] },
            { position2: [0.85, 0.275, 0.11], scales: [0.02, 16, 16], position: [1.31, 0.3, -0.22], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [20, 20, 20] },
            { position2: [0.78, 0.35, 0.37], scales: [0.02, 16, 16], position: [1.35, 0.35, 0.35], rotation: [Math.PI / 2, Math.PI, -1.5],scale: [20, 20, 20] },
            { position2: [0.65, 0.39, 0.61], scales: [0.02, 16, 16], position: [1.15, 0.38, 0.85], rotation: [Math.PI / 2, Math.PI, -2],scale: [20, 20, 20] },
            { position2: [0.46, 0.4, 0.82], scales: [0.02, 16, 16], position: [0.75, 0.39, 1.28], rotation: [Math.PI / 2, Math.PI, -2.5],scale: [20, 20, 20] },
            { position2: [0.2, 0.41, 0.94], scales: [0.02, 16, 16], position: [0.5, 0.39, 1.4], rotation: [Math.PI / 2, Math.PI, -2.5],scale: [20, 20, 20] },
            { position2: [-0.08, 0.42, 0.97], scales: [0.02, 16, 16], position: [0.0, 0.39, 1.53], rotation: [Math.PI / 2, Math.PI, -3],scale: [20, 20, 20] },
            { position2: [-0.37, 0.41, 0.94], scales: [0.02, 16, 16], position: [-0.56, 0.44, 1.45], rotation: [Math.PI / 2, Math.PI, -3.5],scale: [20, 20, 20] },
            { position2: [-0.62, 0.41, 0.8], scales: [0.02, 16, 16], position: [-1.0, 0.44, 1.2], rotation: [Math.PI / 2, Math.PI, -3.9],scale: [20, 20, 20] },
            { position2: [-0.8, 0.38, 0.58], scales: [0.02, 16, 16], position: [-1.3, 0.42, 0.78], rotation: [Math.PI / 2, Math.PI, -4.3],scale: [20, 20, 20] },
            { position2: [-0.9, 0.32, 0.34], scales: [0.02, 16, 16], position: [-1.46, 0.36, 0.25], rotation: [Math.PI / 2, Math.PI, -4.8],scale: [20, 20, 20] },
            { position2: [-0.92, 0.25, 0.05], scales: [0.02, 16, 16], position: [-1.46, 0.3, -0.02], rotation: [Math.PI / 2, Math.PI, -4.8],scale: [20, 20, 20] },
            { position2: [-0.92, 0.2, -0.22], scales: [0.02, 16, 16], position: [-1.46, 0.26, -0.3], rotation: [Math.PI / 2, Math.PI, -4.8],scale: [20, 20, 20] },
            { position2: [-0.9, 0.15, -0.5], scales: [0.02, 16, 16], position: [-1.42, 0.2, -0.55], rotation: [Math.PI / 2, Math.PI, -4.8],scale: [20, 20, 20] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-1.32, 0.15, -0.8], rotation: [Math.PI / 2, Math.PI, -4.8],scale: [20, 20, 20] },
            { position2: [-0.53, 0.1, -0.96], scales: [0.02, 16, 16], position: [-1.0, 0.13, -1.31], rotation: [Math.PI / 2, Math.PI, -5.4],scale: [20, 20, 20] },
            { position2: [-0.26, 0.1, -1.04], scales: [0.02, 16, 16], position: [-0.55, 0.1, -1.55], rotation: [Math.PI / 2, Math.PI, -5.8],scale: [20, 20, 20] },
        ],
        "/bc-assets/bracelet_models/CHARMS3.glb": [
            { position2: [0.2, 0.12, -1.0], scales: [0.02, 16, 16], position: [0.23, 0.1, -1.14], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.05, 0.05, 0.05] },
            { position2: [0.46, 0.12, -0.85], scales: [0.02, 16, 16], position: [0.5, 0.1, -1.01], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.05, 0.05, 0.05] },
            { position2: [0.65, 0.15, -0.67], scales: [0.02, 16, 16], position: [0.77, 0.15, -0.75], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.82, 0.18, -0.43], scales: [0.02, 16, 16], position: [0.96, 0.15, -0.5], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1.0, 0.22, -0.22], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.85, 0.275, 0.11], scales: [0.02, 16, 16], position: [1.0, 0.28, 0.05], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.78, 0.35, 0.37], scales: [0.02, 16, 16], position: [0.95, 0.34, 0.4], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.05, 0.05, 0.05] },
            { position2: [0.65, 0.39, 0.61], scales: [0.02, 16, 16], position: [0.78, 0.38, 0.63], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.05, 0.05, 0.05] },
            { position2: [0.46, 0.4, 0.82], scales: [0.02, 16, 16], position: [0.56, 0.4, 0.9], rotation: [Math.PI / 2, Math.PI, -2.1],scale: [0.05, 0.05, 0.05] },
            { position2: [0.2, 0.41, 0.94], scales: [0.02, 16, 16], position: [0.25, 0.43, 1.05], rotation: [Math.PI / 2, Math.PI, -2.5],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.08, 0.42, 0.97], scales: [0.02, 16, 16], position: [-0.06, 0.43, 1.13], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.37, 0.41, 0.94], scales: [0.02, 16, 16], position: [-0.36, 0.43, 1.08], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.62, 0.41, 0.8], scales: [0.02, 16, 16], position: [-0.67, 0.43, 0.9], rotation: [Math.PI / 2, Math.PI, -3.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.8, 0.38, 0.58], scales: [0.02, 16, 16], position: [-0.9, 0.43, 0.68], rotation: [Math.PI / 2, Math.PI, -3.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.9, 0.32, 0.34], scales: [0.02, 16, 16], position: [-1.0, 0.36, 0.35], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.92, 0.25, 0.05], scales: [0.02, 16, 16], position: [-1.04, 0.29, 0.07], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.92, 0.2, -0.22], scales: [0.02, 16, 16], position: [-1.04, 0.24, -0.2], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.9, 0.15, -0.5], scales: [0.02, 16, 16], position: [-1.02, 0.2, -0.5], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.88, 0.17, -0.83], rotation: [Math.PI / 2, Math.PI, -5],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.53, 0.1, -0.96], scales: [0.02, 16, 16], position: [-0.58, 0.1, -1.1], rotation: [Math.PI / 2, Math.PI, -5.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.26, 0.1, -1.04], scales: [0.02, 16, 16], position: [-0.3, 0.1, -1.2], rotation: [Math.PI / 2, Math.PI, -5.9],scale: [0.05, 0.05, 0.05] },
        ],
        "/bc-assets/bracelet_models/CHARMS4.glb": [
            { position2: [0.2, 0.12, -1.0], scales: [0.02, 16, 16], position: [0.23, 0.1, -1.21], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.05, 0.05, 0.05] },
            { position2: [0.46, 0.12, -0.85], scales: [0.02, 16, 16], position: [0.5, 0.1, -1.04], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.05, 0.05, 0.05] },
            { position2: [0.65, 0.15, -0.67], scales: [0.02, 16, 16], position: [0.84, 0.15, -0.8], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.82, 0.18, -0.43], scales: [0.02, 16, 16], position: [0.96, 0.15, -0.55], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1.05, 0.22, -0.28], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.85, 0.275, 0.11], scales: [0.02, 16, 16], position: [1.04, 0.3, 0.0], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.78, 0.35, 0.37], scales: [0.02, 16, 16], position: [1.0, 0.34, 0.4], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.05, 0.05, 0.05] },
            { position2: [0.65, 0.39, 0.61], scales: [0.02, 16, 16], position: [0.84, 0.38, 0.63], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.05, 0.05, 0.05] },
            { position2: [0.46, 0.4, 0.82], scales: [0.02, 16, 16], position: [0.62, 0.42, 0.9], rotation: [Math.PI / 2, Math.PI, -2.1],scale: [0.05, 0.05, 0.05] },
            { position2: [0.2, 0.41, 0.94], scales: [0.02, 16, 16], position: [0.3, 0.43, 1.1], rotation: [Math.PI / 2, Math.PI, -2.5],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.08, 0.42, 0.97], scales: [0.02, 16, 16], position: [-0.04, 0.43, 1.2], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.37, 0.41, 0.94], scales: [0.02, 16, 16], position: [-0.33, 0.43, 1.13], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.62, 0.41, 0.8], scales: [0.02, 16, 16], position: [-0.67, 0.43, 1.0], rotation: [Math.PI / 2, Math.PI, -3.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.8, 0.38, 0.58], scales: [0.02, 16, 16], position: [-0.95, 0.41, 0.74], rotation: [Math.PI / 2, Math.PI, -3.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.9, 0.32, 0.34], scales: [0.02, 16, 16], position: [-1.1, 0.36, 0.38], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.92, 0.25, 0.05], scales: [0.02, 16, 16], position: [-1.1, 0.29, 0.09], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.92, 0.2, -0.22], scales: [0.02, 16, 16], position: [-1.1, 0.24, -0.18], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.9, 0.15, -0.5], scales: [0.02, 16, 16], position: [-1.04, 0.2, -0.47], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.93, 0.17, -0.82], rotation: [Math.PI / 2, Math.PI, -5],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.53, 0.1, -0.96], scales: [0.02, 16, 16], position: [-0.68, 0.12, -1.1], rotation: [Math.PI / 2, Math.PI, -5.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.26, 0.1, -1.04], scales: [0.02, 16, 16], position: [-0.3, 0.1, -1.23], rotation: [Math.PI / 2, Math.PI, -5.9],scale: [0.05, 0.05, 0.05] },
        ],
        "/bc-assets/bracelet_models/CHARMS5.glb": [
            { position2: [0.2, 0.12, -1.0], scales: [0.02, 16, 16], position: [0.23, 0.1, -1.14], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.05, 0.05, 0.05] },
            { position2: [0.46, 0.12, -0.85], scales: [0.02, 16, 16], position: [0.48, 0.1, -1.01], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.05, 0.05, 0.05] },
            { position2: [0.65, 0.15, -0.67], scales: [0.02, 16, 16], position: [0.77, 0.15, -0.75], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.82, 0.18, -0.43], scales: [0.02, 16, 16], position: [0.94, 0.15, -0.52], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [0.98, 0.22, -0.24], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.85, 0.275, 0.11], scales: [0.02, 16, 16], position: [0.98, 0.28, 0.03], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.78, 0.35, 0.37], scales: [0.02, 16, 16], position: [0.93, 0.34, 0.38], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.05, 0.05, 0.05] },
            { position2: [0.65, 0.39, 0.61], scales: [0.02, 16, 16], position: [0.78, 0.38, 0.63], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.05, 0.05, 0.05] },
            { position2: [0.46, 0.4, 0.82], scales: [0.02, 16, 16], position: [0.56, 0.4, 0.88], rotation: [Math.PI / 2, Math.PI, -2.1],scale: [0.05, 0.05, 0.05] },
            { position2: [0.2, 0.41, 0.94], scales: [0.02, 16, 16], position: [0.28, 0.43, 1.05], rotation: [Math.PI / 2, Math.PI, -2.5],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.08, 0.42, 0.97], scales: [0.02, 16, 16], position: [-0.06, 0.43, 1.1], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.37, 0.41, 0.94], scales: [0.02, 16, 16], position: [-0.34, 0.43, 1.06], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.62, 0.41, 0.8], scales: [0.02, 16, 16], position: [-0.66, 0.43, 0.9], rotation: [Math.PI / 2, Math.PI, -3.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.8, 0.38, 0.58], scales: [0.02, 16, 16], position: [-0.9, 0.4, 0.68], rotation: [Math.PI / 2, Math.PI, -3.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.9, 0.32, 0.34], scales: [0.02, 16, 16], position: [-1.0, 0.33, 0.35], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.92, 0.25, 0.05], scales: [0.02, 16, 16], position: [-1.04, 0.26, 0.07], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.92, 0.2, -0.22], scales: [0.02, 16, 16], position: [-1.04, 0.22, -0.2], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.9, 0.15, -0.5], scales: [0.02, 16, 16], position: [-1.0, 0.18, -0.48], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.87, 0.14, -0.82], rotation: [Math.PI / 2, Math.PI, -5],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.53, 0.1, -0.96], scales: [0.02, 16, 16], position: [-0.63, 0.1, -1.03], rotation: [Math.PI / 2, Math.PI, -5.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.26, 0.1, -1.04], scales: [0.02, 16, 16], position: [-0.32, 0.1, -1.17], rotation: [Math.PI / 2, Math.PI, -5.9],scale: [0.05, 0.05, 0.05] },
        ],
        "/bc-assets/bracelet_models/CHARMS6.glb": [
            { position2: [0.2, 0.12, -1.0], scales: [0.02, 16, 16], position: [0.21, 0.1, -1.11], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.08, 0.08, 0.08] },
            { position2: [0.46, 0.12, -0.85], scales: [0.02, 16, 16], position: [0.48, 0.1, -0.98], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.08, 0.08, 0.08] },
            { position2: [0.65, 0.15, -0.67], scales: [0.02, 16, 16], position: [0.73, 0.15, -0.74], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.08, 0.08, 0.08] },
            { position2: [0.82, 0.18, -0.43], scales: [0.02, 16, 16], position: [0.91, 0.15, -0.49], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.08, 0.08, 0.08] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [0.96, 0.22, -0.22], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.08, 0.08, 0.08] },
            { position2: [0.85, 0.275, 0.11], scales: [0.02, 16, 16], position: [0.95, 0.28, 0.06], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.08, 0.08, 0.08] },
            { position2: [0.78, 0.35, 0.37], scales: [0.02, 16, 16], position: [0.9, 0.34, 0.38], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.08, 0.08, 0.08] },
            { position2: [0.65, 0.39, 0.61], scales: [0.02, 16, 16], position: [0.75, 0.38, 0.63], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.08, 0.08, 0.08] },
            { position2: [0.46, 0.4, 0.82], scales: [0.02, 16, 16], position: [0.54, 0.4, 0.87], rotation: [Math.PI / 2, Math.PI, -2.1],scale: [0.08, 0.08, 0.08] },
            { position2: [0.2, 0.41, 0.94], scales: [0.02, 16, 16], position: [0.26, 0.43, 1.01], rotation: [Math.PI / 2, Math.PI, -2.5],scale: [0.08, 0.08, 0.08] },
            { position2: [-0.08, 0.42, 0.97], scales: [0.02, 16, 16], position: [-0.06, 0.43, 1.07], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.08, 0.08, 0.08] },
            { position2: [-0.37, 0.41, 0.94], scales: [0.02, 16, 16], position: [-0.34, 0.43, 1.03], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.08, 0.08, 0.08] },
            { position2: [-0.62, 0.41, 0.8], scales: [0.02, 16, 16], position: [-0.64, 0.43, 0.89], rotation: [Math.PI / 2, Math.PI, -3.4],scale: [0.08, 0.08, 0.08] },
            { position2: [-0.8, 0.38, 0.58], scales: [0.02, 16, 16], position: [-0.85, 0.4, 0.62], rotation: [Math.PI / 2, Math.PI, -3.9],scale: [0.08, 0.08, 0.08] },
            { position2: [-0.9, 0.32, 0.34], scales: [0.02, 16, 16], position: [-0.98, 0.33, 0.35], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.08, 0.08, 0.08] },
            { position2: [-0.92, 0.25, 0.05], scales: [0.02, 16, 16], position: [-1.02, 0.26, 0.07], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.08, 0.08, 0.08] },
            { position2: [-0.92, 0.2, -0.22], scales: [0.02, 16, 16], position: [-1.01, 0.22, -0.2], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.08, 0.08, 0.08] },
            { position2: [-0.9, 0.15, -0.5], scales: [0.02, 16, 16], position: [-0.98, 0.18, -0.48], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.08, 0.08, 0.08] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.14, -0.81], rotation: [Math.PI / 2, Math.PI, -5],scale: [0.08, 0.08, 0.08] },
            { position2: [-0.53, 0.1, -0.96], scales: [0.02, 16, 16], position: [-0.61, 0.13, -1.03], rotation: [Math.PI / 2, Math.PI, -5.4],scale: [0.08, 0.08, 0.08] },
            { position2: [-0.26, 0.1, -1.04], scales: [0.02, 16, 16], position: [-0.32, 0.1, -1.13], rotation: [Math.PI / 2, Math.PI, -5.9],scale: [0.08, 0.08, 0.08] },
        ],
        "/bc-assets/bracelet_models/CHARMS7.glb": [
            { position2: [0.2, 0.12, -1.0], scales: [0.02, 16, 16], position: [0.21, 0.1, -1.06], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.05, 0.05, 0.05] },
            { position2: [0.46, 0.12, -0.85], scales: [0.02, 16, 16], position: [0.48, 0.13, -0.93], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.05, 0.05, 0.05] },
            { position2: [0.65, 0.15, -0.67], scales: [0.02, 16, 16], position: [0.71, 0.15, -0.69], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.82, 0.18, -0.43], scales: [0.02, 16, 16], position: [0.85, 0.18, -0.45], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [0.92, 0.22, -0.17], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.85, 0.275, 0.11], scales: [0.02, 16, 16], position: [0.9, 0.28, 0.09], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.05, 0.05, 0.05] },
            { position2: [0.78, 0.35, 0.37], scales: [0.02, 16, 16], position: [0.83, 0.36, 0.38], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.05, 0.05, 0.05] },
            { position2: [0.65, 0.39, 0.61], scales: [0.02, 16, 16], position: [0.69, 0.38, 0.62], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.05, 0.05, 0.05] },
            { position2: [0.46, 0.4, 0.82], scales: [0.02, 16, 16], position: [0.5, 0.4, 0.84], rotation: [Math.PI / 2, Math.PI, -2.1],scale: [0.05, 0.05, 0.05] },
            { position2: [0.2, 0.41, 0.94], scales: [0.02, 16, 16], position: [0.22, 0.43, 0.98], rotation: [Math.PI / 2, Math.PI, -2.5],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.08, 0.42, 0.97], scales: [0.02, 16, 16], position: [-0.06, 0.43, 1.03], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.37, 0.41, 0.94], scales: [0.02, 16, 16], position: [-0.36, 0.43, 0.97], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.62, 0.41, 0.8], scales: [0.02, 16, 16], position: [-0.64, 0.43, 0.82], rotation: [Math.PI / 2, Math.PI, -3.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.8, 0.38, 0.58], scales: [0.02, 16, 16], position: [-0.8, 0.4, 0.6], rotation: [Math.PI / 2, Math.PI, -3.9],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.9, 0.32, 0.34], scales: [0.02, 16, 16], position: [-0.94, 0.33, 0.35], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.92, 0.25, 0.05], scales: [0.02, 16, 16], position: [-0.97, 0.26, 0.06], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.92, 0.2, -0.22], scales: [0.02, 16, 16], position: [-0.97, 0.22, -0.22], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.9, 0.15, -0.5], scales: [0.02, 16, 16], position: [-0.92, 0.18, -0.51], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.78, 0.14, -0.79], rotation: [Math.PI / 2, Math.PI, -5],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.53, 0.1, -0.96], scales: [0.02, 16, 16], position: [-0.56, 0.13, -0.99], rotation: [Math.PI / 2, Math.PI, -5.4],scale: [0.05, 0.05, 0.05] },
            { position2: [-0.26, 0.1, -1.04], scales: [0.02, 16, 16], position: [-0.28, 0.1, -1.08], rotation: [Math.PI / 2, Math.PI, -5.9],scale: [0.05, 0.05, 0.05] },
        ],
        "/bc-assets/bracelet_models/CHARMS8.glb": [
            { position2: [0.2, 0.12, -1.0], scales: [0.02, 16, 16], position: [0.21, -0.1, -1.11], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85], scales: [0.02, 16, 16], position: [0.48, -0.1, -0.99], rotation: [Math.PI / 2, Math.PI, 0],scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67], scales: [0.02, 16, 16], position: [0.75, -0.06, -0.75], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43], scales: [0.02, 16, 16], position: [0.91, -0.04, -0.51], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [0.98, 0.01, -0.22], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11], scales: [0.02, 16, 16], position: [0.95, 0.07, 0.06], rotation: [Math.PI / 2, Math.PI, -0.9],scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37], scales: [0.02, 16, 16], position: [0.9, 0.14, 0.4], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61], scales: [0.02, 16, 16], position: [0.76, 0.17, 0.64], rotation: [Math.PI / 2, Math.PI, -1.6],scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82], scales: [0.02, 16, 16], position: [0.55, 0.21, 0.85], rotation: [Math.PI / 2, Math.PI, -2.1],scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94], scales: [0.02, 16, 16], position: [0.26, 0.21, 1.04], rotation: [Math.PI / 2, Math.PI, -2.5],scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97], scales: [0.02, 16, 16], position: [-0.06, 0.21, 1.1], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94], scales: [0.02, 16, 16], position: [-0.34, 0.22, 1.04], rotation: [Math.PI / 2, Math.PI, -2.9],scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8], scales: [0.02, 16, 16], position: [-0.64, 0.22, 0.9], rotation: [Math.PI / 2, Math.PI, -3.4],scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58], scales: [0.02, 16, 16], position: [-0.88, 0.18, 0.66], rotation: [Math.PI / 2, Math.PI, -3.9],scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34], scales: [0.02, 16, 16], position: [-1.0, 0.13, 0.35], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05], scales: [0.02, 16, 16], position: [-1.03, 0.06, 0.07], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22], scales: [0.02, 16, 16], position: [-1.02, 0.01, -0.21], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5], scales: [0.02, 16, 16], position: [-0.98, -0.03, -0.48], rotation: [Math.PI / 2, Math.PI, -4.4],scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.85, -0.06, -0.8], rotation: [Math.PI / 2, Math.PI, -5],scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96], scales: [0.02, 16, 16], position: [-0.62, -0.09, -1.02], rotation: [Math.PI / 2, Math.PI, -5.4],scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04], scales: [0.02, 16, 16], position: [-0.3, -0.09, -1.15], rotation: [Math.PI / 2, Math.PI, -5.9],scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS9.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS10.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.96],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.09],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.12],  rotation: [Math.PI / 2,   Math.PI, -3.3], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.08],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.92],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS11.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS12.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ]
        ,
        "/bc-assets/bracelet_models/CHARMS13.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS14.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS15.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS16.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS17.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.16],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.005, 0.005, 0.005] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.52, 0.12,  -0.99],  rotation: [Math.PI / 1.7, Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.73, 0.15,  -0.78],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 1.7, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [0.98, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.95, 0.275,  0.12],  rotation: [Math.PI / 1.7, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.87, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.73, 0.39,   0.68],  rotation: [Math.PI / 1.7, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.09],  rotation: [Math.PI / 1.7, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.12],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.41,  1.08],  rotation: [Math.PI / 1.7, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 1.7, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-1.01, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.03, 0.25,  0.06],  rotation: [Math.PI / 1.7, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.03, 0.2,  -0.25],  rotation: [Math.PI / 1.7, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-1.01, 0.15, -0.56],  rotation: [Math.PI / 1.7, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.87],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.11],  rotation: [Math.PI / 1.7, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.1,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },

        ],
        "/bc-assets/bracelet_models/CHARMS18.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS19.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS20.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS21.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS22.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ],
        "/bc-assets/bracelet_models/CHARMS23.png": [
            { position2: [0.2, 0.12, -1.0],    scales: [0.02, 16, 16], position: [0.23, 0.1,   -1.13],  rotation: [Math.PI / 2,   Math.PI, 0],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.12, -0.85],  scales: [0.02, 16, 16], position: [0.57, 0.12,  -0.96],  rotation: [Math.PI / 2, Math.PI, -0.5],    scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.15, -0.67],  scales: [0.02, 16, 16], position: [0.78, 0.15,  -0.75],  rotation: [Math.PI / 2,   Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.82, 0.18, -0.43],  scales: [0.02, 16, 16], position: [0.92, 0.18,  -0.48],  rotation: [Math.PI / 2, Math.PI, -0.9], scale: [0.01, 0.01, 0.01] },
            { position2: [0.87, 0.225, -0.15], scales: [0.02, 16, 16], position: [1, 0.225, -0.17],  rotation: [Math.PI / 2,   Math.PI, -1.4], scale: [0.01, 0.01, 0.01] },
            { position2: [0.85, 0.275, 0.11],  scales: [0.02, 16, 16], position: [0.99, 0.235,  0.12],  rotation: [Math.PI / 2, Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.78, 0.35, 0.37],   scales: [0.02, 16, 16], position: [0.90, 0.35,   0.41],  rotation: [Math.PI / 2,   Math.PI, -2],   scale: [0.01, 0.01, 0.01] },
            { position2: [0.65, 0.39, 0.61],   scales: [0.02, 16, 16], position: [0.77, 0.35,   0.68],  rotation: [Math.PI / 2, Math.PI, -2.5], scale: [0.01, 0.01, 0.01] },
            { position2: [0.46, 0.4, 0.82],    scales: [0.02, 16, 16], position: [0.52, 0.4,    0.92],  rotation: [Math.PI / 2,   Math.PI, -2.8], scale: [0.01, 0.01, 0.01] },
            { position2: [0.2, 0.41, 0.94],    scales: [0.02, 16, 16], position: [0.23, 0.41,   1.06],  rotation: [Math.PI / 2, Math.PI, -3],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.08, 0.42, 0.97],  scales: [0.02, 16, 16], position: [-0.09, 0.42,  1.09],  rotation: [Math.PI / 2,   Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.37, 0.41, 0.94],  scales: [0.02, 16, 16], position: [-0.41, 0.45,  1.06],  rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.62, 0.41, 0.8],   scales: [0.02, 16, 16], position: [-0.69, 0.41,  0.9],   rotation: [Math.PI / 2,   Math.PI, -4],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.8, 0.38, 0.58],   scales: [0.02, 16, 16], position: [-0.9,  0.38,  0.65],  rotation: [Math.PI / 2, Math.PI, -4.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.32, 0.34],   scales: [0.02, 16, 16], position: [-0.99, 0.32,  0.38],  rotation: [Math.PI / 2,   Math.PI, -4.8], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.25, 0.05],  scales: [0.02, 16, 16], position: [-1.05, 0.25,  0.06],  rotation: [Math.PI / 2, Math.PI, -4.9], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.92, 0.2, -0.22],  scales: [0.02, 16, 16], position: [-1.05, 0.2,  -0.25],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.9, 0.15, -0.5],   scales: [0.02, 16, 16], position: [-0.99, 0.15, -0.56],  rotation: [Math.PI / 2, Math.PI, -5],   scale: [0.01, 0.01, 0.01] },
            { position2: [-0.75, 0.15, -0.75], scales: [0.02, 16, 16], position: [-0.84, 0.15, -0.84],  rotation: [Math.PI / 2,   Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.53, 0.1, -0.96],  scales: [0.02, 16, 16], position: [-0.59, 0.1,  -1.08],  rotation: [Math.PI / 2, Math.PI, -5.5], scale: [0.01, 0.01, 0.01] },
            { position2: [-0.26, 0.1, -1.04],  scales: [0.02, 16, 16], position: [-0.29, 0.08,  -1.17],  rotation: [Math.PI / 2,   Math.PI, -5.8], scale: [0.01, 0.01, 0.01] },
        ]
    },
    "/bc-assets/bracelet_models/BRACELET4.glb": {
        "/bc-assets/bracelet_models/CHARMS1.glb": [
            { position2: [-1.2, 0.3, -0.7], position: [-3, 0.5, -3], rotation: [Math.PI / 2, Math.PI, 1.7], scale: [90, 90, 90] },
            { position2: [-0, 0.3, -1.45], position: [2, 0.5, -3.5], rotation: [Math.PI / 2, Math.PI, 6.5], scale: [90, 90, 90] },
            { position2: [1.3, 0.3, -0.65], position: [3.95, 0.5, 0.7], rotation: [Math.PI / 2, Math.PI, -1], scale: [90, 90, 90] },
            { position2: [1.25, 0.25, 0.75], position: [0.4, 0.5, 3.65], rotation: [Math.PI / 2, Math.PI, -2.4], scale: [90, 90, 90] },
            { position2: [0., 0.25, 1.43], position: [-3, 0.5, 2], rotation: [Math.PI / 2, Math.PI, -3.5], scale: [90, 90, 90] },
            { position2: [-1.2, 0.27, 0.7], position: [-4.1, 0.5, -0.25], rotation: [Math.PI / 2, Math.PI, -4], scale: [90, 90, 90] },
        ],
        "/bc-assets/bracelet_models/CHARMS2.glb": [
            { position2: [-1.2, 0.3, -0.7], position: [-3.55, 0.5, -0.5], rotation: [Math.PI / 2, Math.PI, 1.7], scale: [90, 90, 90] },
            { position2: [-0, 0.3, -1.45], position: [-0.3, 0.6, -3.74], rotation: [Math.PI / 2, Math.PI, 6.5], scale: [90, 90, 90] },
            { position2: [1.3, 0.3, -0.65], position: [3.3, 0.5, -1.9], rotation: [Math.PI / 2, Math.PI, -1], scale: [90, 90, 90] },
            { position2: [1.25, 0.25, 0.75], position: [2.8, 0.45, 2.5], rotation: [Math.PI / 2, Math.PI, -2.4], scale: [90, 90, 90] },
            { position2: [0., 0.25, 1.43], position: [-1, 0.45, 3.7], rotation: [Math.PI / 2, Math.PI, -3.5], scale: [90, 90, 90] },
            { position2: [-1.2, 0.27, 0.7], position: [-3, 0.45, 2.3], rotation: [Math.PI / 2, Math.PI, -4], scale: [90, 90, 90] },
        ],
        "/bc-assets/bracelet_models/CHARMS3.glb": [
            { position2: [-1.2, 0.3, -0.7], position: [-1.8, 0.5, -0.8], rotation: [Math.PI / 2, Math.PI, 1.7], scale: [0.3, 0.3, 0.3] },
            { position2: [-0, 0.3, -1.45], position: [0.1, 0.6, -2], rotation: [Math.PI / 2, Math.PI, 6.5], scale: [0.3, 0.3, 0.3] },
            { position2: [1.3, 0.3, -0.65], position: [1.8, 0.5, -1], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.3, 0.3, 0.3] },
            { position2: [1.25, 0.25, 0.75], position: [1.5, 0.45, 1.5], rotation: [Math.PI / 2, Math.PI, -2.4], scale: [0.3, 0.3, 0.3] },
            { position2: [0., 0.25, 1.43], position: [-0.5, 0.45, 2], rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.3, 0.3, 0.3] },
            { position2: [-1.2, 0.27, 0.7], position: [-1.8, 0.45, 1], rotation: [Math.PI / 2, Math.PI, -4], scale: [0.3, 0.3, 0.3] },
        ],
        "/bc-assets/bracelet_models/CHARMS4.glb": [
            { position2: [-1.2, 0.3, -0.7], position: [-2.3, 0.5, -0.5], rotation: [Math.PI / 2, Math.PI, 1.7], scale: [0.3, 0.3, 0.3] },
            { position2: [-0, 0.3, -1.45], position: [0, 0.6, -2.5], rotation: [Math.PI / 2, Math.PI, 6.5], scale: [0.3, 0.3, 0.3] },
            { position2: [1.3, 0.3, -0.65], position: [2.1, 0.5, -1.3], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.3, 0.3, 0.3] },
            { position2: [1.25, 0.25, 0.75], position: [2, 0.45, 1.5], rotation: [Math.PI / 2, Math.PI, -2.4], scale: [0.3, 0.3, 0.3] },
            { position2: [0., 0.25, 1.43], position: [-0.5, 0.45, 2.4], rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.3, 0.3, 0.3] },
            { position2: [-1.2, 0.27, 0.7], position: [-2.1, 0.45, 1.3], rotation: [Math.PI / 2, Math.PI, -4], scale: [0.3, 0.3, 0.3] },
        ],
        "/bc-assets/bracelet_models/CHARMS5.glb": [
            { position2: [-1.2, 0.3, -0.7], position: [-1.8, 0.45, -0.7], rotation: [Math.PI / 2, Math.PI, 1.7], scale: [0.3, 0.3, 0.3] },
            { position2: [-0, 0.3, -1.45], position: [0, 0.45, -2], rotation: [Math.PI / 2, Math.PI, 6.5], scale: [0.3, 0.3, 0.3] },
            { position2: [1.3, 0.3, -0.65], position: [1.8, 0.4, -1], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.3, 0.3, 0.3] },
            { position2: [1.25, 0.25, 0.75], position: [1.65, 0.3, 1.2], rotation: [Math.PI / 2, Math.PI, -2.4], scale: [0.3, 0.3, 0.3] },
            { position2: [0., 0.25, 1.43], position: [-0.3, 0.3, 2], rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.3, 0.3, 0.3] },
            { position2: [-1.2, 0.27, 0.7], position: [-1.6, 0.3, 1.1], rotation: [Math.PI / 2, Math.PI, -4], scale: [0.3, 0.3, 0.3] },
        ],
        "/bc-assets/bracelet_models/CHARMS6.glb": [
            { position2: [-1.2, 0.3, -0.7], position: [-1.5, 0.45, -0.7], rotation: [Math.PI / 2, Math.PI, 1.7], scale: [0.3, 0.3, 0.3] },
            { position2: [-0, 0.3, -1.45], position: [0, 0.45, -1.7], rotation: [Math.PI / 2, Math.PI, 6.5], scale: [0.3, 0.3, 0.3] },
            { position2: [1.3, 0.3, -0.65], position: [1.5, 0.4, -0.8], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.3, 0.3, 0.3] },
            { position2: [1.25, 0.25, 0.75], position: [1.4, 0.4, 1], rotation: [Math.PI / 2, Math.PI, -2.4], scale: [0.3, 0.3, 0.3] },
            { position2: [0., 0.25, 1.43], position: [-0.3, 0.4, 1.7], rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.3, 0.3, 0.3] },
            { position2: [-1.2, 0.27, 0.7], position: [-1.5, 0.4, 0.9], rotation: [Math.PI / 2, Math.PI, -4], scale: [0.3, 0.3, 0.3] },
        ],
        "/bc-assets/bracelet_models/CHARMS7.glb": [
            { position2: [-1.2, 0.3, -0.7], position: [-1.3, 0.45, -0.7], rotation: [Math.PI / 2, Math.PI, 1.7], scale: [0.3, 0.3, 0.3] },
            { position2: [-0, 0.3, -1.45], position: [0, 0.45, -1.5], rotation: [Math.PI / 2, Math.PI, 6.5], scale: [0.3, 0.3, 0.3] },
            { position2: [1.3, 0.3, -0.65], position: [1.2, 0.4, -0.8], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.3, 0.3, 0.3] },
            { position2: [1.25, 0.25, 0.75], position: [1.2, 0.4, 0.8], rotation: [Math.PI / 2, Math.PI, -2.4], scale: [0.3, 0.3, 0.3] },
            { position2: [0., 0.25, 1.43], position: [-0.2, 0.4, 1.45], rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.3, 0.3, 0.3] },
            { position2: [-1.2, 0.27, 0.7], position: [-1.3, 0.4, 0.8], rotation: [Math.PI / 2, Math.PI, -4], scale: [0.3, 0.3, 0.3] },
        ],
        "/bc-assets/bracelet_models/CHARMS8.glb": [
            { position2: [-1.2, 0.3, -0.7], position: [-1.8, -1, -0.7], rotation: [Math.PI / 2, Math.PI, 1.7], scale: [0.07, 0.07, 0.07] },
            { position2: [-0, 0.3, -1.45], position: [0, -1, -2.05], rotation: [Math.PI / 2, Math.PI, 6.5], scale: [0.07, 0.07, 0.07] },
            { position2: [1.3, 0.3, -0.65], position: [1.9, -1, -0.9], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.07, 0.07, 0.07] },
            { position2: [1.25, 0.25, 0.75], position: [1.65, -1.1, 1.2], rotation: [Math.PI / 2, Math.PI, -2.4], scale: [0.07, 0.07, 0.07] },
            { position2: [0., 0.25, 1.43], position: [-0.2, -1.1, 2], rotation: [Math.PI / 2, Math.PI, -3.5], scale: [0.07, 0.07, 0.07] },
            { position2: [-1.2, 0.27, 0.7], position: [-1.65, -1.1, 1.2], rotation: [Math.PI / 2, Math.PI, -4], scale: [0.07, 0.07, 0.07] },
        ],
    },
      "/bc-assets/bracelet_models/BRACELET14.glb": {
        "/bc-assets/bracelet_models/CHARMS1.glb": [{ scale: [20, 20, 20] }],
        "/bc-assets/bracelet_models/CHARMS2.glb": [{ scale: [20, 20, 20] }],
        "/bc-assets/bracelet_models/CHARMS3.glb": [{ scale: [0.08, 0.08, 0.08] }],
        "/bc-assets/bracelet_models/CHARMS4.glb": [{ scale: [0.07, 0.07, 0.07] }],
        "/bc-assets/bracelet_models/CHARMS5.glb": [{ scale: [0.08, 0.08, 0.08] }],
        "/bc-assets/bracelet_models/CHARMS6.glb": [{ scale: [0.1, 0.1, 0.1] }],
        "/bc-assets/bracelet_models/CHARMS7.glb": [{ scale: [0.08, 0.08, 0.08] }],
        "/bc-assets/bracelet_models/CHARMS8.glb": [{ scale: [0.02, 0.02, 0.02] }],
    },
    "/bc-assets/bracelet_models/BRACELET5.glb": {
        "/bc-assets/bracelet_models/CHARMS1.glb": [
            { position2: [-1.3, 0.4, 1.1], scales: [0.05, 16, 16], position: [-2.55, 0.4, 1.03], rotation: [Math.PI / 2, Math.PI, 2.5], scale: [40, 40, 40] },
            { position2: [-1.6, 0.4, 0.6], scales: [0.05, 16, 16], position: [-2.86, 0.4, 0.52], rotation: [Math.PI / 2, Math.PI, 2.5], scale: [40, 40, 40] },
            { position2: [-1.7, 0.4, 0], scales: [0.05, 16, 16], position: [-2.78, 0.4, -0.7], rotation: [Math.PI / 2, Math.PI, 2], scale: [40, 40, 40] },
            { position2: [-1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [-2.66, 0.4, -1.3], rotation: [Math.PI / 2, Math.PI, 2], scale: [40, 40, 40] },
            { position2: [-1.3, 0.4, -1.14], scales: [0.05, 16, 16], position: [-1.25, 0.4, -2.42], rotation: [Math.PI / 2, Math.PI, 1], scale: [40, 40, 40] },
            { position2: [-0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [-0.78, 0.4, -2.78], rotation: [Math.PI / 2, Math.PI, 1], scale: [40, 40, 40] },
            { position2: [0, 0.4, -1.7], scales: [0.05, 16, 16], position: [0.93, 0.4, -2.59], rotation: [Math.PI / 2, Math.PI, 0.2], scale: [40, 40, 40] },
            { position2: [0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [1.87, 0.4, -2.2], rotation: [Math.PI / 2, Math.PI, 0], scale: [40, 40, 40] },
            { position2: [1.3, 0.4, -1.1], scales: [0.05, 16, 16], position: [2.51, 0.4, -0.84], rotation: [Math.PI / 2, Math.PI, -0.8], scale: [40, 40, 40] },
            { position2: [1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [2.83, 0.4, -0.32], rotation: [Math.PI / 2, Math.PI, -0.8], scale: [40, 40, 40] },
            { position2: [1.7, 0.4, 0], scales: [0.05, 16, 16], position: [2.46, 0.4, 1.04], rotation: [Math.PI / 2, Math.PI, -1.5], scale: [40, 40, 40] },
            { position2: [1.6, 0.4, 0.62], scales: [0.05, 16, 16], position: [1.48, 0.4, 1.91], rotation: [Math.PI / 2, Math.PI, -2.2], scale: [40, 40, 40] },
            { position2: [1.25, 0.4, 1.13], scales: [0.05, 16, 16], position: [0.68, 0.4, 2.28], rotation: [Math.PI / 2, Math.PI, -2.6], scale: [40, 40, 40] },
        ],
        "/bc-assets/bracelet_models/CHARMS2.glb": [
            { position2: [-1.3, 0.4, 1.1], scales: [0.05, 16, 16], position: [-1.65, 0.4, 1.55], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [20, 20, 20] },
            { position2: [-1.6, 0.4, 0.6], scales: [0.05, 16, 16], position: [-1.95, 0.4, 1.05], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [20, 20, 20] },
            { position2: [-1.7, 0.4, 0], scales: [0.05, 16, 16], position: [-2.25, 0.4, 0.13], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [20, 20, 20] },
            { position2: [-1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [-2.14, 0.4, -0.46], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [20, 20, 20] },
            { position2: [-1.3, 0.4, -1.14], scales: [0.05, 16, 16], position: [-1.8, 0.4, -1.33], rotation: [Math.PI / 2, Math.PI, 1.2], scale: [20, 20, 20] },
            { position2: [-0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [-1.2, 0.4, -1.9], rotation: [Math.PI / 2, Math.PI, 0.8], scale: [20, 20, 20] },
            { position2: [0, 0.4, -1.7], scales: [0.05, 16, 16], position: [-0.11, 0.4, -2.24], rotation: [Math.PI / 2, Math.PI, 0.2], scale: [20, 20, 20] },
            { position2: [0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [1.01, 0.4, -2.03], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [20, 20, 20] },
            { position2: [1.3, 0.4, -1.1], scales: [0.05, 16, 16], position: [1.48, 0.4, -1.65], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [20, 20, 20] },
            { position2: [1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [2.06, 0.4, -0.92], rotation: [Math.PI / 2, Math.PI, -1], scale: [20, 20, 20] },
            { position2: [1.7, 0.4, 0], scales: [0.05, 16, 16], position: [2.17, 0.4, -0.305], rotation: [Math.PI / 2, Math.PI, -1], scale: [20, 20, 20] },
            { position2: [1.6, 0.4, 0.62], scales: [0.05, 16, 16], position: [2.13, 0.4, 0.63], rotation: [Math.PI / 2, Math.PI, -1.6], scale: [20, 20, 20] },
            { position2: [1.25, 0.4, 1.13], scales: [0.05, 16, 16], position: [1.78, 0.4, 1.35], rotation: [Math.PI / 2, Math.PI, -2], scale: [20, 20, 20] },
        ],
         "/bc-assets/bracelet_models/CHARMS3.glb": [
            { position2: [-1.3, 0.4, 1.1], scales: [0.05, 16, 16], position: [-1.36, 0.4, 1.22], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.6, 0.4, 0.6], scales: [0.05, 16, 16], position: [-1.68, 0.4, 0.7], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.7, 0.4, 0], scales: [0.05, 16, 16], position: [-1.83, 0.4, 0], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [-1.72, 0.4, -0.6], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.3, 0.4, -1.14], scales: [0.05, 16, 16], position: [-1.37, 0.4, -1.2], rotation: [Math.PI / 2, Math.PI, 1.2], scale: [0.05, 0.05, 0.05] },
            { position2: [-0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [-0.88, 0.4, -1.61], rotation: [Math.PI / 2, Math.PI, 0.8], scale: [0.05, 0.05, 0.05] },
            { position2: [0, 0.4, -1.7], scales: [0.05, 16, 16], position: [-0.0, 0.4, -1.83], rotation: [Math.PI / 2, Math.PI, 0.2], scale: [0.05, 0.05, 0.05] },
            { position2: [0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [0.85, 0.4, -1.62], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.05, 0.05, 0.05] },
            { position2: [1.3, 0.4, -1.1], scales: [0.05, 16, 16], position: [1.33, 0.4, -1.25], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.05, 0.05, 0.05] },
            { position2: [1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [1.7, 0.4, -0.67], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.05, 0.05, 0.05] },
            { position2: [1.7, 0.4, 0], scales: [0.05, 16, 16], position: [1.81, 0.4, -0.07], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.05, 0.05, 0.05] },
            { position2: [1.6, 0.4, 0.62], scales: [0.05, 16, 16], position: [1.71, 0.4, 0.63], rotation: [Math.PI / 2, Math.PI, -1.6], scale: [0.05, 0.05, 0.05] },
            { position2: [1.25, 0.4, 1.13], scales: [0.05, 16, 16], position: [1.38, 0.4, 1.2], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.05, 0.05, 0.05] },
        ],
        "/bc-assets/bracelet_models/CHARMS4.glb": [
            { position2: [-1.3, 0.4, 1.1], scales: [0.05, 16, 16], position: [-1.4, 0.4, 1.26], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.6, 0.4, 0.6], scales: [0.05, 16, 16], position: [-1.72, 0.4, 0.76], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.7, 0.4, 0], scales: [0.05, 16, 16], position: [-1.9, 0.4, 0.05], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [-1.77, 0.4, -0.57], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.3, 0.4, -1.14], scales: [0.05, 16, 16], position: [-1.45, 0.4, -1.2], rotation: [Math.PI / 2, Math.PI, 1.2], scale: [0.05, 0.05, 0.05] },
            { position2: [-0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [-0.93, 0.4, -1.65], rotation: [Math.PI / 2, Math.PI, 0.8], scale: [0.05, 0.05, 0.05] },
            { position2: [0, 0.4, -1.7], scales: [0.05, 16, 16], position: [-0.04, 0.4, -1.89], rotation: [Math.PI / 2, Math.PI, 0.2], scale: [0.05, 0.05, 0.05] },
            { position2: [0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [0.86, 0.4, -1.69], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.05, 0.05, 0.05] },
            { position2: [1.3, 0.4, -1.1], scales: [0.05, 16, 16], position: [1.33, 0.4, -1.32], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.05, 0.05, 0.05] },
            { position2: [1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [1.76, 0.4, -0.72], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.05, 0.05, 0.05] },
            { position2: [1.7, 0.4, 0], scales: [0.05, 16, 16], position: [1.87, 0.4, -0.11], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.05, 0.05, 0.05] },
            { position2: [1.6, 0.4, 0.62], scales: [0.05, 16, 16], position: [1.77, 0.4, 0.63], rotation: [Math.PI / 2, Math.PI, -1.6], scale: [0.05, 0.05, 0.05] },
            { position2: [1.25, 0.4, 1.13], scales: [0.05, 16, 16], position: [1.45, 0.4, 1.21], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.05, 0.05, 0.05] },
        ],
        "/bc-assets/bracelet_models/CHARMS5.glb": [
            { position2: [-1.3, 0.4, 1.1], scales: [0.05, 16, 16], position: [-1.35, 0.37, 1.2], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.6, 0.4, 0.6], scales: [0.05, 16, 16], position: [-1.66, 0.37, 0.72], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.7, 0.4, 0], scales: [0.05, 16, 16], position: [-1.81, 0.37, 0.02], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [-1.7, 0.37, -0.57], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.3, 0.4, -1.14], scales: [0.05, 16, 16], position: [-1.39, 0.37, -1.16], rotation: [Math.PI / 2, Math.PI, 1.2], scale: [0.05, 0.05, 0.05] },
            { position2: [-0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [-0.9, 0.37, -1.57], rotation: [Math.PI / 2, Math.PI, 0.8], scale: [0.05, 0.05, 0.05] },
            { position2: [0, 0.4, -1.7], scales: [0.05, 16, 16], position: [-0.04, 0.37, -1.81], rotation: [Math.PI / 2, Math.PI, 0.2], scale: [0.05, 0.05, 0.05] },
            { position2: [0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [0.82, 0.37, -1.62], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.05, 0.05, 0.05] },
            { position2: [1.3, 0.4, -1.1], scales: [0.05, 16, 16], position: [1.31, 0.37, -1.25], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.05, 0.05, 0.05] },
            { position2: [1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [1.68, 0.37, -0.69], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.05, 0.05, 0.05] },
            { position2: [1.7, 0.4, 0], scales: [0.05, 16, 16], position: [1.8, 0.37, -0.07], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.05, 0.05, 0.05] },
            { position2: [1.6, 0.4, 0.62], scales: [0.05, 16, 16], position: [1.69, 0.37, 0.62], rotation: [Math.PI / 2, Math.PI, -1.6], scale: [0.05, 0.05, 0.05] },
            { position2: [1.25, 0.4, 1.13], scales: [0.05, 16, 16], position: [1.37, 0.37, 1.18], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.05, 0.05, 0.05] },
        ],
        "/bc-assets/bracelet_models/CHARMS6.glb": [
            { position2: [-1.3, 0.4, 1.1], scales: [0.05, 16, 16], position: [-1.34, 0.37, 1.2], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.1, 0.1, 0.1] },
            { position2: [-1.6, 0.4, 0.6], scales: [0.05, 16, 16], position: [-1.64, 0.37, 0.7], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.1, 0.1, 0.1] },
            { position2: [-1.7, 0.4, 0], scales: [0.05, 16, 16], position: [-1.79, 0.37, 0.02], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.1, 0.1, 0.1] },
            { position2: [-1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [-1.69, 0.37, -0.58], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.1, 0.1, 0.1] },
            { position2: [-1.3, 0.4, -1.14], scales: [0.05, 16, 16], position: [-1.36, 0.37, -1.17], rotation: [Math.PI / 2, Math.PI, 1.2], scale: [0.1, 0.1, 0.1] },
            { position2: [-0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [-0.88, 0.37, -1.55], rotation: [Math.PI / 2, Math.PI, 0.8], scale: [0.1, 0.1, 0.1] },
            { position2: [0, 0.4, -1.7], scales: [0.05, 16, 16], position: [-0.04, 0.37, -1.79], rotation: [Math.PI / 2, Math.PI, 0.2], scale: [0.1, 0.1, 0.1] },
            { position2: [0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [0.82, 0.37, -1.6], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.1, 0.1, 0.1] },
            { position2: [1.3, 0.4, -1.1], scales: [0.05, 16, 16], position: [1.3, 0.37, -1.23], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.1, 0.1, 0.1] },
            { position2: [1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [1.65, 0.37, -0.68], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.1, 0.1, 0.1] },
            { position2: [1.7, 0.4, 0], scales: [0.05, 16, 16], position: [1.78, 0.37, -0.07], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.1, 0.1, 0.1] },
            { position2: [1.6, 0.4, 0.62], scales: [0.05, 16, 16], position: [1.68, 0.37, 0.62], rotation: [Math.PI / 2, Math.PI, -1.6], scale: [0.1, 0.1, 0.1] },
            { position2: [1.25, 0.4, 1.13], scales: [0.05, 16, 16], position: [1.36, 0.37, 1.17], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.1, 0.1, 0.1] },
        ],
        "/bc-assets/bracelet_models/CHARMS7.glb": [
            { position2: [-1.3, 0.4, 1.1], scales: [0.05, 16, 16], position: [-1.28, 0.4, 1.16], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.6, 0.4, 0.6], scales: [0.05, 16, 16], position: [-1.6, 0.4, 0.64], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.7, 0.4, 0], scales: [0.05, 16, 16], position: [-1.72, 0.4, 0.0], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [-1.61, 0.4, -0.61], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.05, 0.05, 0.05] },
            { position2: [-1.3, 0.4, -1.14], scales: [0.05, 16, 16], position: [-1.29, 0.4, -1.14], rotation: [Math.PI / 2, Math.PI, 1.2], scale: [0.05, 0.05, 0.05] },
            { position2: [-0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [-0.82, 0.4, -1.52], rotation: [Math.PI / 2, Math.PI, 0.8], scale: [0.05, 0.05, 0.05] },
            { position2: [0, 0.4, -1.7], scales: [0.05, 16, 16], position: [-0.02, 0.4, -1.72], rotation: [Math.PI / 2, Math.PI, 0.2], scale: [0.05, 0.05, 0.05] },
            { position2: [0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [0.8, 0.4, -1.53], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.05, 0.05, 0.05] },
            { position2: [1.3, 0.4, -1.1], scales: [0.05, 16, 16], position: [1.26, 0.4, -1.16], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.05, 0.05, 0.05] },
            { position2: [1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [1.6, 0.4, -0.63], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.05, 0.05, 0.05] },
            { position2: [1.7, 0.4, 0], scales: [0.05, 16, 16], position: [1.72, 0.4, -0.03], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.05, 0.05, 0.05] },
            { position2: [1.6, 0.4, 0.62], scales: [0.05, 16, 16], position: [1.61, 0.4, 0.62], rotation: [Math.PI / 2, Math.PI, -1.6], scale: [0.05, 0.05, 0.05] },
            { position2: [1.25, 0.4, 1.13], scales: [0.05, 16, 16], position: [1.29, 0.4, 1.13], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.05, 0.05, 0.05] },
        ],
        "/bc-assets/bracelet_models/CHARMS8.glb": [
            { position2: [-1.3, 0.4, 1.1], scales: [0.05, 16, 16], position: [-1.37, 0.06, 1.25], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.015, 0.015, 0.015] },
            { position2: [-1.6, 0.4, 0.6], scales: [0.05, 16, 16], position: [-1.68, 0.06, 0.74], rotation: [Math.PI / 2, Math.PI, 2.4], scale: [0.015, 0.015, 0.015] },
            { position2: [-1.7, 0.4, 0], scales: [0.05, 16, 16], position: [-1.85, 0.06, 0.03], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.015, 0.015, 0.015] },
            { position2: [-1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [-1.73, 0.06, -0.57], rotation: [Math.PI / 2, Math.PI, 1.8], scale: [0.015, 0.015, 0.015] },
            { position2: [-1.3, 0.4, -1.14], scales: [0.05, 16, 16], position: [-1.41, 0.06, -1.19], rotation: [Math.PI / 2, Math.PI, 1.2], scale: [0.015, 0.015, 0.015] },
            { position2: [-0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [-0.92, 0.06, -1.61], rotation: [Math.PI / 2, Math.PI, 0.8], scale: [0.015, 0.015, 0.015] },
            { position2: [0, 0.4, -1.7], scales: [0.05, 16, 16], position: [-0.04, 0.06, -1.85], rotation: [Math.PI / 2, Math.PI, 0.2], scale: [0.015, 0.015, 0.015] },
            { position2: [0.8, 0.4, -1.5], scales: [0.05, 16, 16], position: [0.84, 0.06, -1.65], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.015, 0.015, 0.015] },
            { position2: [1.3, 0.4, -1.1], scales: [0.05, 16, 16], position: [1.32, 0.06, -1.29], rotation: [Math.PI / 2, Math.PI, -0.4], scale: [0.015, 0.015, 0.015] },
            { position2: [1.6, 0.4, -0.6], scales: [0.05, 16, 16], position: [1.71, 0.06, -0.7], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.015, 0.015, 0.015] },
            { position2: [1.7, 0.4, 0], scales: [0.05, 16, 16], position: [1.83, 0.06, -0.1], rotation: [Math.PI / 2, Math.PI, -1], scale: [0.015, 0.015, 0.015] },
            { position2: [1.6, 0.4, 0.62], scales: [0.05, 16, 16], position: [1.73, 0.06, 0.62], rotation: [Math.PI / 2, Math.PI, -1.6], scale: [0.015, 0.015, 0.015] },
            { position2: [1.25, 0.4, 1.13], scales: [0.05, 16, 16], position: [1.4, 0.06, 1.2], rotation: [Math.PI / 2, Math.PI, -2], scale: [0.015, 0.015, 0.015] },
        ],
    },
    "/bc-assets/bracelet_models/BRACELET6.glb": {
        "/bc-assets/bracelet_models/CHARMS1.glb": [
            { position2: [-1.2, 0.2, -0.48], scales: [0.05, 16, 16], position: [-1.52, 0.2, -1.04], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [20, 20, 20] },
            { position2: [-0.6, 0.2, -1.15], scales: [0.05, 16, 16], position: [-0.6, 0.2, -1.77], rotation: [Math.PI / 2, Math.PI, 1], scale: [20, 20, 20] },
            { position2: [-0, 0.2, -1.29], scales: [0.05, 16, 16], position: [0, 0.2, -1.93], rotation: [Math.PI / 2, Math.PI, 1], scale: [20, 20, 20] },
            { position2: [0.6, 0.2, -1.15], scales: [0.05, 16, 16], position: [1.14, 0.2, -1.49], rotation: [Math.PI / 2, Math.PI, 0], scale: [20, 20, 20] },
            { position2: [1.2, 0.2, -0.47], scales: [0.05, 16, 16], position: [1.85, 0.2, -0.38], rotation: [Math.PI / 2, Math.PI, -0.7], scale: [20, 20, 20] },
            { position2: [1.2, 0.2, 0.48], scales: [0.05, 16, 16], position: [1.58, 0.2, 1], rotation: [Math.PI / 2, Math.PI, -1.5], scale: [20, 20, 20] },
            { position2: [0.7, 0.2, 1.09], scales: [0.05, 16, 16], position: [0.795, 0.2, 1.7], rotation: [Math.PI / 2, Math.PI, -2], scale: [20, 20, 20] },
            { position2: [0, 0.2, 1.28], scales: [0.05, 16, 16], position: [-0.35, 0.2, 1.82], rotation: [Math.PI / 2, Math.PI, -2.7], scale: [20, 20, 20] },
            { position2: [-0.75, 0.2, 1.05], scales: [0.05, 16, 16], position: [-1.23, 0.2, 1.49], rotation: [Math.PI / 2, Math.PI, -3], scale: [20, 20, 20] },
            { position2: [-1.2, 0.2, 0.49], scales: [0.05, 16, 16], position: [-1.85, 0.2, 0.42], rotation: [Math.PI / 2, Math.PI, -3.8], scale: [20, 20, 20] },
        ],
         "/bc-assets/bracelet_models/CHARMS2.glb": [
            { position2: [-1.2, 0.2, -0.48], scales: [0.05, 16, 16], position: [-1.78, 0.2, -0.5], rotation: [Math.PI / 2, Math.PI, 1.5], scale: [20, 20, 20] },
            { position2: [-0.6, 0.2, -1.15], scales: [0.05, 16, 16], position: [-0.88, 0.2, -1.63], rotation: [Math.PI / 2, Math.PI, 0.5], scale: [20, 20, 20] },
            { position2: [-0, 0.2, -1.29], scales: [0.05, 16, 16], position: [-0, 0.2, -1.85], rotation: [Math.PI / 2, Math.PI, 0], scale: [20, 20, 20] },
            { position2: [0.6, 0.2, -1.15], scales: [0.05, 16, 16], position: [0.88, 0.2, -1.64], rotation: [Math.PI / 2, Math.PI, -0.5], scale: [20, 20, 20] },
            { position2: [1.2, 0.2, -0.47], scales: [0.05, 16, 16], position: [1.69, 0.2, -0.77], rotation: [Math.PI / 2, Math.PI, -1], scale: [20, 20, 20] },
            { position2: [1.2, 0.2, 0.48], scales: [0.05, 16, 16], position: [1.77, 0.2, 0.44], rotation: [Math.PI / 2, Math.PI, -1.5], scale: [20, 20, 20] },
            { position2: [0.7, 0.2, 1.09], scales: [0.05, 16, 16], position: [1.23, 0.2, 1.31], rotation: [Math.PI / 2, Math.PI, -2], scale: [20, 20, 20] },
            { position2: [0, 0.2, 1.28], scales: [0.05, 16, 16], position: [0.35, 0.2, 1.74], rotation: [Math.PI / 2, Math.PI, -2.5], scale: [20, 20, 20] },
            { position2: [-0.75, 0.2, 1.05], scales: [0.05, 16, 16], position: [-0.66, 0.2, 1.62], rotation: [Math.PI / 2, Math.PI, -3], scale: [20, 20, 20] },
            { position2: [-1.2, 0.2, 0.49], scales: [0.05, 16, 16], position:  [-1.64, 0.2, 0.85], rotation: [Math.PI / 2, Math.PI, -4], scale: [20, 20, 20] },
        ],
    },
};
