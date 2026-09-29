import React, { forwardRef, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { CameraViewContext } from "./contexts/CameraViewContext";
import { DiamondContext } from "./contexts/DiamondContext";
import { LoaderContext } from "./contexts/LoaderContext";
import { RingContext } from "./contexts/RingContext";
import { SectionContext } from "./contexts/SectionContext";
import { ShareContext } from "./contexts/ShareContext";
import initialPrice from "./data/data.json";
import apiData from "./data/api-data.json";
import { getTheme3Sections } from "./configuratorConfig";
import { calculateFinalRingPrice } from "./utility/calculateFInalRingDiamondPrice";
import { Base64 } from "js-base64";
import {
  formatStoreCurrency,
  getDefaultQuality,
  getDiamondPrice,
  filterAvailableOptions,
  getAvailableOptions,
  getStorePriceConfig,
  getColoredDiamondExtraPrice,
  getGemstoneExtraPrice,
  getMatchingBandPrice,
  getAvailableCaratSizes,
  getDefaultCarat,
} from "./utility/storePriceHelper";
import { getCurrencyRate, getFancyPriceFactor, getRingSizeType, getSummaryTaxLabel, normalizeRingSizeSystem } from "./utility/Parentconfig";
import { isDiamondWiseParentUrl } from "./priceConfig";
import { FANCY_BASE_COLORS } from "./data/fancyDiamondColors";
import {
  DIAMONDWISE_DESIGN_NONE,
  DIAMONDWISE_DESIGNS,
  getDiamondWiseDesignById,
  getDiamondWiseDesignByShankId,
} from "./data/diamondwiseDesigns";
import {
  hasNoHeadCompatibility,
  isHeadCompatible,
  isMatchingBandCompatible,
  isShapeCompatible,
} from "./utility/shankCompatibility";

const GOLD_COLORS = {
  white: "#f1f1ef",
  yellow: "#FFD280",
  rose: "#e6b08f",
  platinum: "#e5e4e2",
  titanium: "#8C8C8C",
  silver: "#D8D8D8",
};

const T3_FONT = "Arial, sans-serif";
const T3_PRIMARY = "#303030";
const T3_SECONDARY = "#92928D";
const T3_SECTION_STYLE = { fontFamily: T3_FONT, fontWeight: 400, fontSize: "16px", color: T3_PRIMARY };
const T3_SUBHEADER_STYLE = { fontFamily: T3_FONT, fontWeight: 700, fontSize: "12px", color: T3_PRIMARY };
const T3_BODY_STYLE = { fontFamily: T3_FONT, fontWeight: 600, fontSize: "12px", color: T3_PRIMARY };

const styleOptions = [
  { label: "Plain", shank: "PLAIN", sideSetting: "PLAIN", image: "/images/basic-bands/plain.webp?v3" },
  { label: "Pave", shank: "PLATE-PRONG", sideSetting: "PLAIN", image: "/images/basic-bands/plate-prong.webp?v3" }, // sideSetting was "PLATE-PRONG" (separate diamond-overlay layer) - changed to "PLAIN" because the underlying GLB now IS PLATE-PRONG-2's single unified mesh (stones baked in), so the old overlay would double-render diamonds on top of it
  { label: "Knife Edge", shank: "KNIFE-EDGE", sideSetting: "PLAIN", image: "/images/basic-bands/knife-edge.webp?v3" },
  { label: "Channel", shank: "CHANNEL", sideSetting: "PLAIN", image: "/images/basic-bands/channel.webp?v3" }, // sideSetting was "CHANNEL" (separate diamond-overlay layer) - changed to "PLAIN" for the same reason as Pave above: underlying GLB now IS CHANNEL-2's single unified mesh
  { label: "Cathedral", shank: "CATHEDRAL", sideSetting: "PLAIN", image: "/images/basic-bands/cathedral.webp?v3" },
  { label: "Split", shank: "SPLIT", sideSetting: "PLAIN", image: "/images/basic-bands/split.webp?v3" },
  { label: "Twisted", shank: "TWISTED", sideSetting: "PLAIN", image: "/images/basic-bands/twisted.webp?v3" },
  { label: "Wide Plain", shank: "WIDE-PLAIN", sideSetting: "PLAIN", image: "/images/basic-bands/wide-plain.webp?v3" },

  // New default-only shanks (see priceConfig.js STORE_AVAILABLE_OPTIONS.default).
  // sideSetting is "PLAIN" for all of them: their stones are baked into the
  // model itself, not a separate procedural SIDE-RING-SETTING overlay - the
  // pattern CHANNEL/PLATE-PRONG used to use before their own GLB was swapped
  // for CHANNEL-2/PLATE-PRONG-2's geometry (2026-09-18), at which point their
  // sideSetting also moved to "PLAIN" above for the same reason.
  { label: "French Pave", shank: "FRENCH-PAVE", sideSetting: "PLAIN", image: "/images/basic-bands/french-pave.webp?v4" },
  { label: "Pave Stones", shank: "PAVE-STONES", sideSetting: "PLAIN", image: "/images/basic-bands/pave-stones.webp?v3" },
  { label: "8 Stones", shank: "8-STONES", sideSetting: "PLAIN", image: "/images/basic-bands/8-stones.webp?v3" },
  { label: "Multi-Row", shank: "MULTI-ROW", sideSetting: "PLAIN", image: "/images/basic-bands/multi-row.webp?v3" },
  // Channel II / Plate Prong II removed from picker (2026-09-18): their geometry
  // is now what Channel/Pave use directly, so keeping them as separate options
  // would just duplicate Channel/Pave. Ids/assets left untouched on disk.
  { label: "Twisted II", shank: "TWISTED-2", sideSetting: "PLAIN", image: "/images/basic-bands/twisted-2.webp?v3" },
  { label: "Fluted", shank: "FLUTED", sideSetting: "PLAIN", image: "/images/basic-bands/fluted.webp?v3" },
  { label: "Braided", shank: "BRAIDED", sideSetting: "PLAIN", image: "/images/basic-bands/braided.webp?v3" },
  { label: "Cathedral Stone", shank: "CATHEDRAL-SIDE-STONE", sideSetting: "PLAIN", image: "/images/basic-bands/cathedral-side-stone.webp?v3" },
  { label: "Side Bezel Stones", shank: "SIDE-BEZEL-STONES", sideSetting: "PLAIN", image: "/images/basic-bands/side-bezel-stones.webp?v4" },
];

const SHAPE_SPRITE_POSITIONS = {
  Round:    "5px 3px",
  Princess: "-100px 0px",
  Cushion:  "-205px 0px",
  Emerald:  "-303px 0px",
  Marquise: "-414px 0px",
  Oval:     "-520px 0px",
  Radiant:  "2px -88px",
  Pear:     "-103px -88px",
  Asscher:  "-205px -88px",
  Heart:    "-303px -88px",
};

const SHAPE_SPRITE_URL = "/sprite_image_diamond.png";
const SHAPE_SPRITE_CELL = { width: 83, height: 70 };

const shapeOptions = [
  { label: "Round", value: "round", spritePosition: SHAPE_SPRITE_POSITIONS.Round },
  { label: "Pear", value: "pear", spritePosition: SHAPE_SPRITE_POSITIONS.Pear },
  { label: "Princess", value: "princess", spritePosition: SHAPE_SPRITE_POSITIONS.Princess },
  { label: "Emerald", value: "emerald", spritePosition: SHAPE_SPRITE_POSITIONS.Emerald },
  { label: "Cushion", value: "cushion", spritePosition: SHAPE_SPRITE_POSITIONS.Cushion },
  { label: "Marquise", value: "marquise", spritePosition: SHAPE_SPRITE_POSITIONS.Marquise },
  { label: "Oval", value: "oval", spritePosition: SHAPE_SPRITE_POSITIONS.Oval },
  { label: "Heart", value: "heart", spritePosition: SHAPE_SPRITE_POSITIONS.Heart },
  { label: "Asscher", value: "asscher", spritePosition: SHAPE_SPRITE_POSITIONS.Asscher },
  { label: "Radiant", value: "radiant", spritePosition: SHAPE_SPRITE_POSITIONS.Radiant },
  // Versioned because static image assets are served immutable; this avoids a
  // cached pre-upload 404 leaving the newly added icon blank for return users.
  { label: "Moval", value: "moval", image: "/images/shape-Moval.webp?v=3", imageClassName: "moval-shape-icon" },
];

const caratOptions = [0.25, 0.50, 0.75, 1, 1.25, 1.50, 1.75, 2, 2.25, 2.50, 2.75, 3, 3.25, 3.50, 3.75, 4, 4.25, 4.50, 4.75, 5,];

const settingOptions = [
  { label: "4 Prongs", head: "4-PRONG", headStyle: "plain", image: "/images/basic-heads/4-prongs.webp?v2" },
  { label: "Halo", head: "HALO", headStyle: "halo", image: "/images/basic-heads/single-halo.webp?v2" },
  { label: "6 Prongs", head: "6-PRONG", headStyle: "plain", image: "/images/basic-heads/6-prongs.webp?v2" },
  { label: "Double Halo", head: "DOUBLE-HALO", headStyle: "double-halo", image: "/images/basic-heads/double-halo.webp" },
  { label: "Bezel", head: "BEZEL", headStyle: "bezel", image: "/images/basic-heads/bezel.webp?v2" },
  { label: "Three Stone", head: "OVAL", headStyle: "three-stone", image: "/images/basic-heads/three-stone.webp?v2" },
  { label: "Hidden Halo", head: "HIDDEN-HALO", headStyle: "hidden-halo", image: "/images/basic-heads/hidden-halo.webp?v2" },
  { label: "Two Stone", head: "TWO-STONE", headStyle: "two-stone", image: "/images/basic-heads/two-stone.webp" },
  { label: "Tulip", head: "TULIP", headStyle: "tulip", image: "/images/basic-heads/tulip.webp" },
];

const metalOptions = [
  { label: "PL", purity: "Platinum", metal: "Platinum", color: GOLD_COLORS.platinum, platinum: true },
  { label: "TI", purity: "Titanium", metal: "Titanium", color: GOLD_COLORS.titanium, platinum: false, fixedPurity: "Titanium" },
  { label: "SS", purity: "Sterling Silver", metal: "Sterling Silver", color: GOLD_COLORS.silver, gradient: "linear-gradient(120deg, #A8A6A6 0%, #686767 50%, #A2A0A0 100%)", platinum: false, fixedPurity: "Sterling Silver" },
  { label: "9K White Gold", purity: "9K", metal: "9K", color: GOLD_COLORS.white, platinum: false },
  { label: "9K Yellow Gold", purity: "9K", metal: "9K", color: GOLD_COLORS.yellow, platinum: false },
  { label: "9K Rose Gold", purity: "9K", metal: "9K", color: GOLD_COLORS.rose, platinum: false },
  { label: "10K White Gold", purity: "10K", metal: "10K", color: GOLD_COLORS.white, platinum: false },
  { label: "10K Yellow Gold", purity: "10K", metal: "10K", color: GOLD_COLORS.yellow, platinum: false },
  { label: "10K Rose Gold", purity: "10K", metal: "10K", color: GOLD_COLORS.rose, platinum: false },
  { label: "14K White Gold", purity: "14K", metal: "14K", color: GOLD_COLORS.white, platinum: false },
  { label: "14K Yellow Gold", purity: "14K", metal: "14K", color: GOLD_COLORS.yellow, platinum: false },
  { label: "14K Rose Gold", purity: "14K", metal: "14K", color: GOLD_COLORS.rose, platinum: false },
  { label: "18K White Gold", purity: "18K", metal: "18K", color: GOLD_COLORS.white, platinum: false },
  { label: "18K Yellow Gold", purity: "18K", metal: "18K", color: GOLD_COLORS.yellow, platinum: false },
  { label: "18K Rose Gold", purity: "18K", metal: "18K", color: GOLD_COLORS.rose, platinum: false },
];

const matchingBandOptions = [
  { label: "No Band", quantity: 0, style: null },
  { label: "Plain", quantity: 1, style: "PLAIN" },
  { label: "Channel", quantity: 1, style: "CHANNEL" },
  { label: "Pave", quantity: 1, style: "PLATE-PRONG" },
];

const diamondOriginOptions = [
  { label: "Lab-grown", value: "Lab" },
  { label: "Natural", value: "Natural" },
];

// Quality is the commercial grade used by the local price table.  The
// available colour, clarity, and cut options must stay within that grade.
// Keeping this mapping here also prevents a shopper from building a
// combination that does not match the specification supplied for Jewelith v2.
const DIAMOND_QUALITY_SPECS = Object.freeze({
  Standard: Object.freeze({
    colors: Object.freeze(["K", "J", "I"]),
    clarities: Object.freeze(["SI2", "SI1", "VS2"]),
    cuts: Object.freeze(["Good", "Very Good"]),
  }),
  Premium: Object.freeze({
    colors: Object.freeze(["H", "G", "F"]),
    clarities: Object.freeze(["VS1", "VVS2", "VVS1"]),
    cuts: Object.freeze(["Excellent"]),
  }),
  "High-End": Object.freeze({
    colors: Object.freeze(["E", "D"]),
    clarities: Object.freeze(["IF", "FL"]),
    cuts: Object.freeze(["Ideal"]),
  }),
});

const getQualitySpec = (quality) =>
  DIAMOND_QUALITY_SPECS[quality] || DIAMOND_QUALITY_SPECS.Standard;
const stoneTypeOptions = [
  { label: "Colorless Lab Grown", activeTab: "Colorless", colorType: "colorless", diamondOrigin: "Lab" },
  { label: "Colorless Natural", activeTab: "Colorless", colorType: "colorless", diamondOrigin: "Natural" },
  { label: "Colored Lab Grown", activeTab: "Fancy Colored", colorType: "fancycolored", diamondOrigin: "Lab" },
  // "Colored Natural" (Fancy Colored + Natural) was retired from the Category
  // row. This list is the only place the row is built from, so deleting the
  // entry is what removes it - and it is also the only way the origin can be
  // set, so the combination is no longer reachable from the UI. The effect
  // near `activeStoneTab` snaps any saved or shared config still carrying it
  // over to Colored Lab Grown.
  { label: "Gemstones", activeTab: "Fancy-Gemstone", colorType: "fancygem", diamondOrigin: "Lab" },
];
const fancyDiamondOptions = ["Yellow", "Blue", "Red", "Green", "Orange", "Pink", "Brown", "Purple", "Black", "Peach"];
// Display order of the colored diamond swatches. OptionRow switches to its
// two-line grid at COLORED_DIAMOND_MAX_ONE_ROW swatches; that grid fills
// column by column, so the two rows are interleaved to read left to right.
const COLORED_DIAMOND_MAX_ONE_ROW = 8;
const FANCY_DIAMOND_SINGLE_ROW_ORDER = ["Yellow", "Pink", "Blue", "Green", "Orange", "Brown", "Purple", "Red", "Black", "Peach"];
const FANCY_DIAMOND_TWO_ROW_ORDER = [
  "Yellow", "Pink", "Orange", "Brown", "Red",   // top row
  "Blue", "Green", "Purple", "Black", "Peach",  // bottom row
];
const byOrder = (order) => (a, b) => {
  const ia = order.indexOf(a);
  const ib = order.indexOf(b);
  return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib);
};
function orderFancyDiamondSwatches(options) {
  if (options.length < COLORED_DIAMOND_MAX_ONE_ROW) {
    return [...options].sort(byOrder(FANCY_DIAMOND_SINGLE_ROW_ORDER));
  }
  const rowMajor = [...options].sort(byOrder(FANCY_DIAMOND_TWO_ROW_ORDER));
  const topCount = Math.ceil(rowMajor.length / 2);
  const top = rowMajor.slice(0, topCount);
  const bottom = rowMajor.slice(topCount);
  const out = [];
  for (let i = 0; i < topCount; i += 1) {
    out.push(top[i]);
    if (i < bottom.length) out.push(bottom[i]);
  }
  return out;
}
const gemstoneOptions = ["blue-sapphire", "green-emerald", "green-sapphire", "moissanite", "pink-sapphire", "red-ruby", "yellow-sapphire"];
const intensityOptions = ["Light", "Fancy", "Intense", "Vivid", "Deep", "Dark"];

const SPRITE_POSITIONS = {
  Blue: "-6px 7px", Green: "-72px -59px", Pink: "-270px -59px", Purple: "-204px -59px",
  Peach: "-6px -59px", Yellow: "-138px -59px", Red: "-270px 7px", Orange: "-204px 7px",
  Black: "-138px 7px", Brown: "-72px 7px",
  "blue-sapphire": "-6px -125px", "green-emerald": "-270px -125px", "green-sapphire": "-6px -191px",
  moissanite: "-72px -191px", "pink-sapphire": "-204px -125px", "red-ruby": "-138px -125px",
  "yellow-sapphire": "-72px -125px",
};
const SPRITE_BG = { backgroundImage: "url(/images/spritesheet.webp)", backgroundSize: "330px", width: 55, height: 70, backgroundRepeat: "no-repeat" };

const INTENSITY_SPRITE_POSITIONS = {
  Light: "-30px 16px", Fancy: "-137px 16px", Intense: "-243px 16px",
  Vivid: "-352px 16px", Deep: "-460px 16px", Dark: "-567px 16px",
};
const INTENSITY_SPRITE_BG = { backgroundImage: "url(/images/intensity.webp)", backgroundSize: "650px", width: 55, height: 116, backgroundRepeat: "no-repeat" };

// The Intensity icons ship as one grey artwork stepping light -> dark, which
// showed the STRENGTH of the intensity but never the colour it applied to -
// "Vivid" looked identical whether the stone was blue or yellow.
//
// The artwork is reused as a MASK rather than replaced: the same six glyphs,
// with the flat grey swapped for the body colour that intensity actually
// produces (FANCY_BASE_COLORS - the very colour Diamond.jsx tints the stone
// with, so the swatch cannot promise a shade the stone will not show). The
// palette already darkens Light -> Dark on its own, so the ramp survives the
// recolour, now in the chosen hue.
//
// A colour with no entry falls back to the original grey sprite.
const getIntensitySwatchStyle = (fancyDiamond, intensity) => {
  const shade = FANCY_BASE_COLORS[fancyDiamond]?.[intensity];
  const position = INTENSITY_SPRITE_POSITIONS[intensity];
  if (!shade) return { ...INTENSITY_SPRITE_BG, backgroundPosition: position };

  const mask = {
    maskImage: "url(/images/intensity.webp)",
    maskSize: "650px",
    maskPosition: position,
    maskRepeat: "no-repeat",
  };
  return {
    width: INTENSITY_SPRITE_BG.width,
    height: INTENSITY_SPRITE_BG.height,
    backgroundColor: shade,
    ...mask,
    WebkitMaskImage: mask.maskImage,
    WebkitMaskSize: mask.maskSize,
    WebkitMaskPosition: mask.maskPosition,
    WebkitMaskRepeat: mask.maskRepeat,
  };
};

const ENGRAVING_LIMIT = 15;
const ENGRAVING_FONTS = [
  { label: "Roman", value: "Times New Roman", fontFamily: '"Times New Roman", serif', image: "/images/roman.webp" },
  { label: "Script", value: "Dancing Script", fontFamily: '"Apple Chancery", "Dancing Script", cursive', image: "/images/script.webp" },
  { label: "Italics", value: "Segoe UI", fontFamily: '"Segoe UI", Arial, sans-serif', fontStyle: "italic", image: "/images/italics.webp" },
  //{ label: "Regular", value: "Arial", fontFamily: "Arial, sans-serif", image: "/images/regular.webp" },
];

const metalColorOptions = [
  { label: "White Gold",  value: "white",    color: GOLD_COLORS.white,    shortLabel: "WG", platinum: false },
  { label: "Yellow Gold", value: "yellow",   color: GOLD_COLORS.yellow,   shortLabel: "YG", platinum: false },
  { label: "Rose Gold",   value: "rose",     color: GOLD_COLORS.rose,     shortLabel: "RG", platinum: false },
  { label: "Platinum",    value: "platinum", color: GOLD_COLORS.platinum, shortLabel: "PL", platinum: true  },
  { label: "Titanium",    value: "titanium", color: GOLD_COLORS.titanium, shortLabel: "TI", fixedPurity: "Titanium" },
  { label: "Sterling Silver", value: "silver", color: GOLD_COLORS.silver, gradient: "linear-gradient(120deg, #A8A6A6 0%, #686767 50%, #A2A0A0 100%)", shortLabel: "SS", fixedPurity: "Sterling Silver" },
];

const purityOptions = ["9K", "10K", "14K", "18K"];

const ringSizeSystems = [
  {
    label: "US",
    value: ["3", "3.5", "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11"],
    mm: ["44.2", "45.5", "46.8", "48.0", "49.3", "50.6", "51.9", "53.1", "54.4", "55.7", "57.0", "58.3", "59.5", "60.8", "62.1", "63.4", "64.6"],
    shortName: "US - MX - CA",
    longName: "US - Mexico - Canada",
  },
  {
    label: "UK",
    value: ["F", "F 1/2", "G", "G 1/2", "H", "H 1/2", "I", "I 1/2", "J", "J 1/2", "K", "K 1/2", "L", "L 1/2", "M", "M 1/2", "N", "N 1/2", "O", "O 1/2", "P", "P 1/2", "Q", "Q 1/2", "R", "R 1/2", "Z 1/2"],
    mm: ["44.2", "44.8", "45.5", "46.1", "46.8", "47.4", "48.0", "48.6", "48.7", "49.3", "50.0", "50.6", "51.2", "51.9", "52.5", "53.1", "53.8", "54.4", "55.1", "55.7", "56.3", "57.0", "57.6", "58.3", "58.9", "59.5", "69.1"],
    shortName: "UK - ZAF - NZ - AU",
    longName: "UK - South Africa - New Zealand - Australia",
  },
  {
    label: "EU",
    value: ["44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "70"],
    mm: ["44.0", "45.0", "46.0", "47.0", "48.0", "49.0", "50.0", "51.0", "52.0", "53.0", "54.0", "55.0", "56.0", "57.0", "58.0", "59.0", "60.0", "61.0", "62.0", "63.0", "64.0", "65.0", "66.0", "67.0", "68.0", "69.0", "70.0"],
    shortName: "EU - FR",
    longName: "Europe - France",
  },
  {
    label: "TR",
    value: ["4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27"],
    mm: ["44.2", "45.5", "46.1", "46.8", "48.0", "49.3", "50.6", "51.2", "51.9", "53.1", "54.4", "55.7", "57.0", "58.3", "59.5", "60.8", "65.9", "67.2", "68.5", "69.7", "62.1", "62.7", "63.4", "64.6"],
    shortName: "TR - SA - SG - JP - IL - IN - CN",
    longName: "Turkey - South America - Singapore - Japan - Israel - India - China",
  },
  {
    label: "UA",
    value: ["14", "14 1/4", "14 1/2", "14 3/4", "15", "15 1/4", "15 1/2", "15 3/4", "16", "16 1/4", "16 1/2", "16 3/4", "17", "17 1/4", "17 1/2", "17 3/4", "18", "18 1/4", "18 1/2", "18 3/4", "19", "19 1/4", "19 1/2", "19 3/4", "20", "20 1/2", "22"],
    mm: ["44.2", "44.8", "45.5", "46.1", "46.8", "48.0", "48.7", "49.3", "50.0", "50.6", "51.9", "52.5", "53.1", "54.4", "55.1", "55.7", "56.3", "57.6", "58.3", "58.9", "59.5", "60.2", "60.8", "62.1", "62.7", "64.0", "69.7"],
    shortName: "UA - RU - DE - AS",
    longName: "Ukraine - Russia - Germany - Asia",
  },
  {
    label: "IT",
    value: ["4", "4 5/8", "5 1/4", "5 7/8", "6 1/2", "7 1/8", "7 3/4", "8 3/8", "9", "9 5/8", "10 1/4", "10 7/8", "11 1/2", "12 1/8", "12 3/4", "13 3/8", "14", "14 5/8", "15 1/4", "15 7/8", "16 1/2", "17 1/8", "17 3/4", "18 3/8", "19", "19 5/8", "29"],
    mm: ["44.2", "44.8", "45.5", "46.1", "46.8", "47.4", "48.0", "48.7", "49.3", "50.0", "50.6", "51.2", "51.9", "52.5", "53.1", "53.8", "54.4", "55.1", "55.7", "56.3", "57.0", "57.6", "58.3", "58.9", "59.5", "60.2", "69.7"],
    shortName: "CH - ES - NL - IT",
    longName: "Switzerland - Spain - Netherlands - Italy",
  },
  {
    label: "HK",
    value: ["5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"],
    mm: ["43.3", "44.3", "45.5", "46.5", "47.7", "48.7", "49.9", "50.9", "52.1", "53.1", "54.3", "55.6", "56.5", "57.5", "58.7", "59.7", "60.9", "61.9", "63.1", "64.1", "65.3", "66.3", "67.5", "68.5", "69.7", "70.7"],
    shortName: "HK",
    longName: "Hong Kong",
  },
  {
    label: "VIC",
    value: ["I", "I 1/2", "J", "J 1/2", "K", "K 1/2", "L", "L 1/2", "M", "M 1/2", "N", "N 1/2", "O", "O 1/2", "P", "P 1/2", "Q", "Q 1/2", "R"],
    mm: ["15.27", "15.39", "15.49", "15.80", "15.90", "16.10", "16.31", "16.51", "16.71", "16.92", "17.12", "17.32", "17.53", "17.73", "17.93", "18.14", "18.34", "18.54", "18.75"],
    shortName: "VIC",
    longName: "Victoria",
  },
];
const ENGRAVING_SYMBOLS = [
  { symbol: "♡", fontSize: 24 },
  { symbol: "☆", fontSize: 24 },
  { symbol: "☽", fontSize: 20 },
  { symbol: "∞", fontSize: 18 },
  { symbol: "☯︎", fontSize: 20 },
  { symbol: "♑︎" },
  { symbol: "♓︎" },
  { symbol: "♉︎" },
  { symbol: "♍︎" },
  { symbol: "♎︎" },
  { symbol: "♏︎" },
  { symbol: "♋︎" },
  { symbol: "♈︎" },
  { symbol: "♌︎" },
  { symbol: "♒︎" },
  { symbol: "♐︎" },
];
const ENGRAVING_VARIATION_SELECTORS = /[\uFE0E\uFE0F]/g;

const getAdjustedEngravingLength = (value) =>
  Array.from(String(value || "").replace(ENGRAVING_VARIATION_SELECTORS, "")).length;

const trimEngraving = (value, maxLength = ENGRAVING_LIMIT) => {
  let result = "";
  let length = 0;

  for (const char of Array.from(String(value || ""))) {
    const isVariationSelector = ENGRAVING_VARIATION_SELECTORS.test(char);
    ENGRAVING_VARIATION_SELECTORS.lastIndex = 0;

    if (isVariationSelector) {
      if (result) result += char;
      continue;
    }

    if (length + 1 > maxLength) break;
    result += char;
    length += 1;
  }

  return result;
};
const getEngravingFontOption = (font) =>
  ENGRAVING_FONTS.find((option) => option.value === font) ||
  ENGRAVING_FONTS.find((option) => option.value === "Arial") ||
  ENGRAVING_FONTS[0];
const getEngravingFontLabel = (font) =>
  getEngravingFontOption(font)?.label || "Regular";

const getTheme3ScrollContainer = (panelScroll, themeRoot) => {
  const panelStyle = window.getComputedStyle(panelScroll);
  const panelCanScroll =
    panelStyle.overflowY !== "visible" &&
    panelScroll.scrollHeight > panelScroll.clientHeight + 2;
  if (panelCanScroll) return { element: panelScroll, isPage: false };

  const rootStyle = window.getComputedStyle(themeRoot);
  const rootCanScroll =
    rootStyle.overflowY !== "visible" &&
    themeRoot.scrollHeight > themeRoot.clientHeight + 2;
  if (rootCanScroll) return { element: themeRoot, isPage: false };

  return {
    element: document.scrollingElement || document.documentElement,
    isPage: true,
  };
};

const THREE_STONE_COMPATIBLE_SHANKS = ["PLAIN", "WIDE-PLAIN", "KNIFE-EDGE"];
// TWO-STONE ("Toi et Moi"): two 4-PRONG heads side by side, matching the
// centre stone shape. Placement-only scaffold for now - PLAIN shank only.
const TWO_STONE_COMPATIBLE_SHANKS = ["PLAIN"];
const BEZEL_INCOMPATIBLE_SHANKS = ["SPLIT", "TWISTED", "CHANNEL", "PLATE-PRONG"];
// The standard Halo head does not fit these raised/open shank profiles.
const HALO_INCOMPATIBLE_SHANKS = [ "SPLIT", "TWISTED"];
const TULIP_INCOMPATIBLE_SHANKS = ["CATHEDRAL", "SPLIT", "TWISTED"];
// These 11 new default-only shanks have their diamonds/texture baked directly
// into a single unified mesh with the metal (see Ring.jsx NEW_DEFAULT_SHANKS) —
// there is no separate hidden-halo ring of stones under the head the way the
// standard heads expect for a double halo, so it is disabled for all of them.
const DOUBLE_HALO_INCOMPATIBLE_SHANKS = ["FRENCH-PAVE", "PAVE-STONES", "8-STONES", "MULTI-ROW", "TWISTED-2", "FLUTED", "BRAIDED", "CATHEDRAL-SIDE-STONE", "SIDE-BEZEL-STONES"];
const MATCHING_BAND_COMPATIBLE_SHANKS = ["PLAIN", "CATHEDRAL", "KNIFE-EDGE", "SPLIT", "CHANNEL", "PLATE-PRONG", "FRENCH-PAVE", "PAVE-STONES", "8-STONES", "MULTI-ROW", "TWISTED-2", "FLUTED", "BRAIDED", "CATHEDRAL-SIDE-STONE", "SIDE-BEZEL-STONES"];
// These 11 new default-only shanks (see priceConfig.js STORE_AVAILABLE_OPTIONS.default)
// have their diamonds/texture baked directly into the shank mesh itself, with
// no flat, engravable inner-band surface the way PLAIN/CHANNEL/etc. do — so
// engraving is disabled for all of them, the same way it already is for
// DiamondWise presets (fixed setting geometry).
const ENGRAVING_INCOMPATIBLE_SHANKS = ["FRENCH-PAVE", "PAVE-STONES", "8-STONES", "MULTI-ROW", "TWISTED-2", "FLUTED", "BRAIDED", "CATHEDRAL-SIDE-STONE", "SIDE-BEZEL-STONES"];
const THREE_STONE_SHAPE_TO_HEAD = {
  round: { head: "HALF-MOON", threestone: "half-moon" },
  princess: { head: "TRAPEZOID", threestone: "trapezoid" },
  oval: { head: "OVAL", threestone: "oval" },
  pear: { head: "PEAR", threestone: "pear" },
  emerald: { head: "BAGUETTE", threestone: "baguette" },
};

// Hidden Halo now has its own per-shape head model for every stone shape
// (see objects/Head.jsx shapeDataForHiddenHalo), so it is no longer round-only.
// Single Halo and Double Halo still only have a round head model.
const ROUND_ONLY_HEAD_STYLES = ["single-halo", "double-halo"];
// Tulip only has per-shape head models for these 5 shapes (see objects/Head.jsx
// public/3d-models/RING-HEAD/TULIP/*) — every other shape falls back to round.
const TULIP_COMPATIBLE_SHAPES = ["round", "cushion", "oval", "pear", "emerald", "moval"];
const MATCHING_BAND_STYLE_LABELS = {
  PLAIN: "Plain",
  CHANNEL: "Channel",
  "PLATE-PRONG": "Pave",
};

const THEME3_GUIDE_META = {
  "center-stone-shape": { section: "shape", label: "Stone" },
  "stone-type": { section: "shape", label: "Category" },
  "target-carat": { section: "shape", label: "Carat" },
  "cut-clarity": { section: "shape", label: "Cut / Clarity" },
  "colored-diamond": { section: "shape", label: "Colored Diamond" },
  gemstone: { section: "shape", label: "Gemstone" },
  "setting-head": { section: "setting", label: "Head" },
  "bi-metal": { section: "band", label: "Bi-metal" },
  band: { section: "band", label: "Shank" },
  "ring-size": { section: "band", label: "Ring Size" },
  "metal-purity": { section: "band", label: "Metal & Purity" },
  engraving: { section: "band", label: "Engraving" },
  "build-summary": { section: "summary", label: "Build Summary" },
  "choose-diamond": { section: "continue", label: "Choose Diamond" },
};

const THEME3_SECTION_GUIDE_FEATURE = {
  band: "band",
  setting: "setting-head",
  shape: "center-stone-shape",
  engraving: "engraving",
};

const THEME3_SECTION_CTA_LABEL = {
  band: "Checkout",
  setting: "Checkout",
  shape: "Checkout",
};

const THEME3_SECTION_ICON = {
  band: "/images/shank-step-icon.svg",
  setting: "/images/head-step-icon.svg",
  shape: "/images/stone-step-icon.svg",
};

const THEME3_NEXT_STEP_COPY = {
  band: "Choose your shank and metal",
  setting: "Choose your head",
  shape: "Choose your center stone",
};

const THEME3_STONE_GUIDE_FEATURES = new Set([
  "center-stone-shape",
  "stone-type",
  "target-carat",
  "cut-clarity",
  "colored-diamond",
  "gemstone",
]);

const getTheme3GuideMeta = (feature, fallbackSection = "") => {
  const meta = THEME3_GUIDE_META[feature] || {};
  return {
    feature,
    section: meta.section || fallbackSection || feature,
    label: meta.label || String(feature || "").replace(/-/g, " "),
  };
};

const resolveFeatureGuideTargetOrigin = (parentUrl) => {
  if (typeof window === "undefined" || window.self === window.top) return null;

  const toOrigin = (value) => {
    if (!value) return null;

    try {
      const origin = new URL(value).origin;
      if (origin && origin !== "null") return origin;
      if (String(value).startsWith("file:")) return "*";
    } catch {
      return null;
    }
  };

  const referrerOrigin = toOrigin(document.referrer);
  if (referrerOrigin) return referrerOrigin;

  const configuredParentOrigin = toOrigin(window.__parentConfig?.parentUrl);
  if (configuredParentOrigin) return configuredParentOrigin;

  const contextParentOrigin = toOrigin(parentUrl);
  if (contextParentOrigin && contextParentOrigin !== window.location.origin) {
    return contextParentOrigin;
  }

  const isLocalHost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (isLocalHost) {
    // Controlled local demo fallback: demo page on :8080 embedding app on :3000.
    return `http://${window.location.hostname}:8080`;
  }

  if (window.location.protocol === "file:") return "*";

  return null;
};

const getMatchingBandStyleLabel = (value) =>
  MATCHING_BAND_STYLE_LABELS[value] ||
  String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

function OptionRow({ title, children, guide, className, price, parent, hovered, maxOneRow, titleExtra, showHoverDelta = true }) {
  const trackRef = useRef(null);
  const dragStateRef = useRef(null);
  const suppressClickRef = useRef(false);
  const guideMeta = guide ? getTheme3GuideMeta(guide) : null;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const handlePointerMove = (event) => {
      const state = dragStateRef.current;
      if (!state || event.pointerId !== state.pointerId) return;

      const deltaX = event.clientX - state.startX;
      if (!state.moved && Math.abs(deltaX) > 4) {
        state.moved = true;
        suppressClickRef.current = true;
        track.classList.add("is-dragging");
        track.style.scrollBehavior = "auto";
      }
      if (state.moved) {
        track.scrollLeft = state.startScrollLeft - deltaX;
      }
    };

    const endDrag = (event) => {
      const state = dragStateRef.current;
      if (!state) return;
      if (event && event.pointerId !== undefined && event.pointerId !== state.pointerId) return;
      if (state.moved) {
        track.classList.remove("is-dragging");
        track.style.scrollBehavior = "";
      }
      dragStateRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, []);

  const handleTrackPointerDown = (event) => {
    const track = trackRef.current;
    if (!track || event.pointerType !== "mouse" || event.button !== 0) return;
    if (track.scrollWidth <= track.clientWidth + 2) return;

    suppressClickRef.current = false;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: track.scrollLeft,
      moved: false,
    };
  };

  const handleTrackClickCapture = (event) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <section
      className={`gb-option-row${className ? ` ${className}` : ""}${maxOneRow != null && React.Children.count(children) >= maxOneRow ? " gb-option-row--two-line" : ""}`}
      data-theme3-guide={guide || undefined}
      data-theme3-guide-section={guideMeta?.section}
      data-theme3-guide-label={guideMeta?.label}
    >
      <div className="gb-option-title" style={{ justifyContent: 'space-between' }}>
        <span style={T3_SUBHEADER_STYLE}>{title}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {showHoverDelta && hovered && hovered.delta !== 0 && (
            <span className="gb-option-title-price" style={{ fontSize: '12px', fontWeight: 700, color: '#303030' }}>
              {hovered.delta > 0 ? '+' : ''}{formatStoreCurrency(hovered.delta, parent)}
            </span>
          )}
          {titleExtra}
        </span>
      </div>
      <div className="gb-option-slider">
        <div className="gb-option-track-wrap">
          <div
            className="gb-option-track "
            ref={trackRef}
            onPointerDown={handleTrackPointerDown}
            onClickCapture={handleTrackClickCapture}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

function Theme3SectionHeader({ step, total, title, sectionId, isActive = false, price, parent }) {
  return (
    <header className={`theme3-option-section-header${isActive ? " is-active" : ""}`}>
      <h3 style={T3_SECTION_STYLE}>{title}</h3>
      {price != null && price !== 0 && (
        <span className="theme3-section-header-price" style={T3_SECTION_STYLE}>
          {formatStoreCurrency(price, parent)}
        </span>
      )}
    </header>
  );
}

function CardOption({ active, label, image, imageClassName = "", spritePosition, onClick, disabled = false, className = "", onMouseEnter, onMouseLeave, badge = null, delta = null, parent = null }) {
  return (
    <button
      type="button"
      className={`gb-card-option ${active ? "active" : ""} ${className}`}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {badge && (
        <span className="demo-only-ribbon" aria-hidden="true">
          <span>{badge}</span>
        </span>
      )}
      {spritePosition ? (
        <span
          style={{
            display: "block",
            width: `${SHAPE_SPRITE_CELL.width}px`,
            height: `${SHAPE_SPRITE_CELL.height}px`,
            backgroundImage: `url(${SHAPE_SPRITE_URL})`,
            backgroundPosition: spritePosition,
            backgroundSize: "600px auto",
            backgroundRepeat: "no-repeat",
          }}
          aria-hidden="true"
        />
      ) : image ? (
        <img className={imageClassName} src={image} alt="" />
      ) : null}
      <span style={{ ...T3_BODY_STYLE, fontWeight: 600 }}>{label}</span>
      <span style={{ display: "block", fontSize: "10px", fontWeight: 400, color: "#555", lineHeight: 1.2, marginTop: "2px" }}>
        {!active && delta !== null && delta !== 0 ? `${delta > 0 ? "+" : ""}${formatStoreCurrency(delta, parent)}` : ""}
      </span>
    </button>
  );
}

function TextOption({ active, label, onClick, disabled = false, onMouseEnter, onMouseLeave, className, delta = null, parent = null }) {
  return (
    <button
      type="button"
      className={`gb-text-option ${active ? "active" : ""}${className ? ` ${className}` : ""}`}
      onClick={onClick}
      disabled={disabled}
      style={T3_BODY_STYLE}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span>{label}</span>
      {delta !== null && delta !== 0 && !active && (
        <span className="gb-delta-label" style={{ fontWeight: 400 }}>{delta > 0 ? "+" : ""}{formatStoreCurrency(delta, parent)}</span>
      )}
    </button>
  );
}
function CaratSlider({
  value,
  onChange,
  stops: propStops,
  min = caratOptions[0],
  max = caratOptions[caratOptions.length - 1],
  step = 0.25,
}) {
  // Build the discrete stops between min/max at the given step or use provided stops
  const stops = useMemo(() => {
    if (Array.isArray(propStops) && propStops.length > 0) {
      return propStops;
    }
    const list = [];
    for (let v = min; v <= max + 1e-6; v += step) list.push(Math.round(v * 100) / 100);
    if (list[list.length - 1] !== max) list.push(max);
    return list;
  }, [propStops, min, max, step]);

  const minStop = stops[0] ?? min;
  const maxStop = stops[stops.length - 1] ?? max;
  const clamped = Math.min(Math.max(Number(value) || minStop, minStop), maxStop);
  const activeIndex = stops.reduce(
    (bestIdx, stop, idx) => (Math.abs(stop - clamped) < Math.abs(stops[bestIdx] - clamped) ? idx : bestIdx),
    0
  );
  const totalStops = stops.length > 1 ? stops.length - 1 : 1;

  return (
    <div className="gb-carat-slider">
      {/* Marks row above track: start value, mid points, and end value from the list */}
      <div className="gb-carat-slider-ticks">
        {stops.map((stop, idx) => {
          const leftPos = stops.length > 1 ? `calc(9px + (100% - 18px) * (${idx} / ${totalStops}))` : "50%";
          const stopNum = Number(stop);
          const isWholeNumber = Number.isInteger(stopNum) || Math.abs(stopNum - Math.round(stopNum)) < 1e-4;

          return (
            <div
              key={stop}
              className="gb-carat-slider-tick-item"
              style={{
                left: leftPos,
                transform: "translateX(-50%)",
              }}
              onClick={() => onChange(stop)}
              title={`${stop} ct`}
            >
              {isWholeNumber ? (
                <span className="gb-carat-slider-tick">
                  {Math.round(stopNum)}
                </span>
              ) : (
                <span className="gb-carat-slider-dot" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>

      <div className="gb-carat-slider-track-wrap">
        <div className="gb-carat-slider-track-bg" />
        <div
          className="gb-carat-slider-track-fill"
          style={{
            width: stops.length > 1
              ? `calc(9px + (100% - 18px) * (${activeIndex} / ${totalStops}))`
              : "100%",
          }}
        />

        <input
          type="range"
          min={0}
          max={stops.length - 1}
          step={1}
          value={activeIndex}
          onChange={(event) => onChange(stops[Math.round(Number(event.target.value))])}
          aria-label="Carat"
        />
      </div>
    </div>
  );
}

function CaratOptionRow({ title, guide, value, onChange, stops, min, max, step }) {
  const guideMeta = guide ? getTheme3GuideMeta(guide) : null;
  const displayVal = value !== undefined && value !== null ? `${Number(value).toFixed(2)} Ct` : "";

  return (
    <section
      className="gb-option-row gb-carat-option-row"
      data-theme3-guide={guide || undefined}
      data-theme3-guide-section={guideMeta?.section}
      data-theme3-guide-label={guideMeta?.label}
    >
      <div className="gb-option-title" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '8px', width: '100%' }}>
        <span style={T3_SUBHEADER_STYLE}>{title}</span>
        <span style={{ fontWeight: 700, color: '#111', fontSize: '13px', textTransform: 'none', letterSpacing: '-0.01em' }}>{displayVal}</span>
      </div>
      <CaratSlider value={value} onChange={onChange} stops={stops} min={min} max={max} step={step} />
    </section>
  );
}
const resolveMetalLabel = ({ metal, ringColor, platinum }) => {
  if (platinum || metal === "Platinum") return "Platinum";
  if (metal === "Titanium" || String(ringColor || "").toLowerCase() === GOLD_COLORS.titanium.toLowerCase()) return "Titanium";
  if (metal === "Silver" || metal === "Sterling Silver" || String(ringColor || "").toLowerCase() === GOLD_COLORS.silver.toLowerCase()) return "Sterling Silver";

  const normalizedColor = String(ringColor || "").toLowerCase();
  if (normalizedColor === GOLD_COLORS.white.toLowerCase()) return `${metal} White Gold`;
  if (normalizedColor === GOLD_COLORS.rose.toLowerCase()) return `${metal} Rose Gold`;
  return `${metal} Yellow Gold`;
};

const resolveMetalColorValue = ({ ringColor, platinum, metal }) => {
  if (platinum || metal === "Platinum") return "platinum";
  if (metal === "Titanium" || String(ringColor || "").toLowerCase() === GOLD_COLORS.titanium.toLowerCase()) return "titanium";
  if (metal === "Silver" || metal === "Sterling Silver" || String(ringColor || "").toLowerCase() === GOLD_COLORS.silver.toLowerCase()) return "silver";

  const normalizedColor = String(ringColor || "").toLowerCase();
  if (normalizedColor === GOLD_COLORS.white.toLowerCase() || normalizedColor === "#dbdbdb") return "white";
  if (normalizedColor === GOLD_COLORS.rose.toLowerCase() || normalizedColor === "#ffbaa3") return "rose";
  return "yellow";
};

const getRingSizePrice = (parent, sizeMm) => {
  const prices = getStorePriceConfig(parent)?.ringSizePrices;
  const mm = parseFloat(sizeMm);
  if (!prices || !mm) return 0;

  let rawPrice = 0;
  if (mm >= 55 && mm < 57) rawPrice = prices["55-56"] ?? 0;
  if (mm >= 57 && mm < 60) rawPrice = prices["57-59"] ?? 0;
  if (mm >= 60 && mm < 64) rawPrice = prices["60-63"] ?? 0;
  if (mm >= 64 && mm < 68) rawPrice = prices["64-67"] ?? 0;
  if (mm >= 68 && mm <= 70) rawPrice = prices["68-70"] ?? 0;

  return Math.round(rawPrice * getCurrencyRate(parent));
};

const getIntensityPrice = (parent, intensity) => {
  const index = intensityOptions.indexOf(intensity);
  const rawPrice = index >= 0 ? 20 * index : 0;
  return Math.round(rawPrice * getCurrencyRate(parent));
};

const formatGemstoneLabel = (value) =>
  String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const RingCustomizer = forwardRef(({
  theme = "default",
  flow = "setting-only",
  activeTheme3Section,
  onTheme3SectionChange,
}, ref) => {
  const { parent, currencyCode, setShare, priceConfigVersion } = useContext(ShareContext);
  // The DiamondWise head/shank designs are sample content on every store
  // EXCEPT DiamondWise's own, where they are the real catalogue - so the
  // "Demo Only" corner badge is shown everywhere else and hidden there.
  const isDiamondWiseStore = isDiamondWiseParentUrl(parent);
  const demoOnlyBadge = isDiamondWiseStore ? null : "Demo Only";
  const { setCameraView } = useContext(CameraViewContext);
  const { setResetObj } = useContext(LoaderContext);
  const {
    ringShank,
    ringHead,
    ringSideSetting,
    ringMatchingBand,
    ringBand,
    biMetal,
    metal,
    ringColor,
    headColor,
    bandWidth,
    styleShape,
    sizeOption,
    ringSize,
    engraving,
    engravingFont,
    engravingFocus,
    diamondWiseDesignId,
    setEngraving,
    setEngravingFont,
    setEngravingFocus,
    setRingShank,
    setRingSideSetting,
    setRingMatchingBand,
    setRingColor,
    setBandColor,
    setMetal,
    setRingBand,
    setBiMetal,
    setSizeOption,
    setRingSize,
    setRingHead,
    setHeadColor,
    setFinalRingPrice,
    setDiamondWiseDesignId,
  } = useContext(RingContext);
  const {
    shape,
    diamondSize,
    cut,
    clarity,
    diamondColorClarity,
    selectedQuality,
    diamondType,
    activeTab,
    colorType,
    fancyDiamond,
    fancyDiamondIntensity,
    gemstone,
    setShape,
    setDiamondSize,
    setCut,
    setClarity,
    setDiamondColorClarity,
    setSelectedQuality,
    setDiamondType,
    setActiveTab,
    setColorType,
    setFancyDiamond,
    setFancyDiamondIntensity,
    setGemstone,
  } = useContext(DiamondContext);
  const {
    shankTotal,
    headTotal,
    stoneTotal,
    matchingBandPrice,
    engravingPrice,
    metalPrice,
    setShankTotal,
    setHeadTotal,
    setStoneTotal,
    setOtherTotal,
    setStylePrice,
    setEngravingPrice,
    setRingSideSettingPrice,
    setMetalPrice,
    setMatchingBandPrice,
    setHeadPrice,
    setHeadstyle,
    setSizeMM,
    headStyle,
    threestone,
    shapeList,
    setThreestone,
    setShapeList,
    setPlatinum,
    setCaratP,
    setDiamondCarat,
    setActiveDiamondSize,
    setFancyColorPrice,
    setGemstonePrice,
    setIntensityPrice,
    setSummaryBlink,
    platinum,
  } = useContext(SectionContext);
  const [matchingBandQuantity, setMatchingBandQuantity] = useState(() =>
    ringBand === "Yes" ? 1 : 0
  );
  const [continueMessage, setContinueMessage] = useState("");
  const [isAddingTheme3ToCart, setIsAddingTheme3ToCart] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [isResetActive, setIsResetActive] = useState(false);
  const [showCopiedTooltip, setShowCopiedTooltip] = useState(false);
  const [showNaturalDiamondNotice, setShowNaturalDiamondNotice] = useState(false);
  const [noHeadSelected, setNoHeadSelected] = useState(() => ringHead === "NO-HEAD");
  const theme3PanelScrollRef = useRef(null);
  const theme3SectionRefs = useRef({});
  const theme3HeaderRef = useRef(null);
  const theme3FooterRef = useRef(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const engravingInputRef = useRef(null);
  const [ringSizeOpen, setRingSizeOpen] = useState(false);
  const ringSizeDropdownRef = useRef(null);
  const isProgrammaticTheme3ScrollRef = useRef(false);
  const programmaticTheme3TargetSectionRef = useRef("");
  const programmaticTheme3ScrollTimeoutRef = useRef(null);
  const programmaticTheme3ScrollSettleTimeoutRef = useRef(null);
  const programmaticTheme3ScrollFrameRef = useRef(0);
  const shareStatusTimeoutRef = useRef(null);
  const resetTimeoutRef = useRef(null);
  const copiedTooltipTimeoutRef = useRef(null);
  const lastTheme3GuideEventRef = useRef("");
  const hasTheme3GuideInteractionStartedRef = useRef(false);
  const wasAtPanelBottomRef = useRef(false);
  const wasAtPanelTopRef = useRef(false);
  const engravingFocusRef = useRef(engravingFocus);
  useEffect(() => {
    engravingFocusRef.current = engravingFocus;
  }, [engravingFocus]);

  const theme3Sections = useMemo(() => {
    const sections = getTheme3Sections(flow);
    if (noHeadSelected) {
      return sections.filter((section) => section.id === "band");
    }
    return sections;
  }, [flow, noHeadSelected]);

  useEffect(() => {
    if (ringHead !== "NO-HEAD" && noHeadSelected) setNoHeadSelected(false);
  }, [noHeadSelected, ringHead]);

  useEffect(() => {
    if (headStyle !== "bezel" || !BEZEL_INCOMPATIBLE_SHANKS.includes(ringShank)) return;

    setRingHead("4-PRONG");
    setHeadstyle("plain");
    setThreestone("");
    setShapeList("");
  }, [headStyle, ringShank, setHeadstyle, setRingHead, setShapeList, setThreestone]);

  useEffect(() => {
    if (!ringHead) return;
    const option = settingOptions.find((opt) => opt.head === ringHead);
    if (option && headStyle !== option.headStyle) {
      setHeadstyle(option.headStyle);
    } else if (["OVAL", "TRAPEZOID", "HALF-MOON", "PEAR", "BAGUETTE"].includes(ringHead.toUpperCase())) {
      if (headStyle !== "three-stone") setHeadstyle("three-stone");
    }
  }, [ringHead, headStyle, setHeadstyle]);

  const [hoveredHead, setHoveredHead] = useState(null);
  const [hoveredShank, setHoveredShank] = useState(null);
  const [hoveredPurity, setHoveredPurity] = useState(null);
  const [hoveredStone, setHoveredStone] = useState(null);
  const [hoveredStoneCategory, setHoveredStoneCategory] = useState(null);
  const [hoveredQuality, setHoveredQuality] = useState(null);
  const isDiamondPreviewFlow = flow === "diamond-preview";

  const availableFancyDiamonds = useMemo(
    () => filterAvailableOptions(fancyDiamondOptions, parent, "coloredDiamonds"),
    [parent]
  );
  const fancyDiamondSwatches = useMemo(
    () => orderFancyDiamondSwatches(availableFancyDiamonds),
    [availableFancyDiamonds]
  );
  const availableGemstones = useMemo(
    () => filterAvailableOptions(gemstoneOptions, parent, "gemstones"),
    [parent]
  );
  const availableDiamondTypes = useMemo(
    () => filterAvailableOptions(apiData.diamond.type, parent, "diamondTypes"),
    [parent]
  );

  const availableStoneTypeOptions = useMemo(() => {
    return stoneTypeOptions.filter((option) => {
      if (option.activeTab === "Fancy Colored") {
        return availableFancyDiamonds.length > 0;
      }
      if (option.activeTab === "Fancy-Gemstone") {
        return availableGemstones.length > 0;
      }
      // A diamond origin is selectable only when the live catalogue has at
      // least one active carat rule for it. This removes Colorless Natural
      // when every Natural price rule is inactive.
      if (option.diamondOrigin === "Natural") {
        return availableDiamondTypes.includes("Natural");
      }
      return true;
    });
  }, [availableDiamondTypes, availableFancyDiamonds.length, availableGemstones.length]);

  const activeStoneTab =
    availableStoneTypeOptions.find((option) => option.activeTab === activeTab && option.diamondOrigin === (selectedQuality?.type || diamondType || "Lab"))?.activeTab ||
    availableStoneTypeOptions.find((option) => option.activeTab === activeTab)?.activeTab ||
    availableStoneTypeOptions[0]?.activeTab ||
    "Colorless";
  const isGemstoneMode = activeStoneTab === "Fancy-Gemstone" && availableGemstones.length > 0;
  const isColoredMode = activeStoneTab === "Fancy Colored" && availableFancyDiamonds.length > 0;
  const getTheme3SectionStep = (sectionId) =>
    theme3Sections.findIndex((section) => section.id === sectionId) + 1;
  const activeTheme3SectionId = theme3Sections.some(
    (section) => section.id === activeTheme3Section && !section.disabled
  )
    ? activeTheme3Section
    : theme3Sections.find((section) => !section.disabled)?.id;
  const upcomingTheme3Section = theme3Sections
    .slice(theme3Sections.findIndex((section) => section.id === activeTheme3SectionId) + 1)
    .find((section) => !section.disabled);
  // "Choose Head" / "Choose Stone"... only lead the customer through once.
  // After the last section has been reached the button stays "Add to Cart",
  // even when scrolling back up (cleared again by Reset).
  const [hasReachedTheme3FinalStep, setHasReachedTheme3FinalStep] = useState(false);
  useEffect(() => {
    if (!upcomingTheme3Section) setHasReachedTheme3FinalStep(true);
  }, [upcomingTheme3Section]);
  const nextTheme3Section = hasReachedTheme3FinalStep ? undefined : upcomingTheme3Section;
  const theme3FooterLabel =
    nextTheme3Section
      ? THEME3_SECTION_CTA_LABEL[nextTheme3Section.id]
      : isAddingTheme3ToCart
      ? "Checking out..."
      : "Checkout";
  const theme3NextStepCopy = nextTheme3Section
    ? THEME3_NEXT_STEP_COPY[nextTheme3Section.id] || `Choose ${nextTheme3Section.label}`
    : "Add your ring to cart";
  const selectedDiamondOrigin = selectedQuality?.type || diamondType || "Lab";
  const availableCaratSizes = useMemo(
    () => getAvailableCaratSizes(parent, selectedDiamondOrigin),
    [parent, selectedDiamondOrigin]
  );
  const defaultCarat = availableCaratSizes[0] || 1;

  const availableQualityLevels = useMemo(() => {
    const configuredOptions = filterAvailableOptions(["Standard", "Premium", "High-End"], parent, "qualityLevels");
    const fallbackOptions = configuredOptions.length > 0 ? configuredOptions : ["Standard", "Premium", "High-End"];
    const storeConfig = getStorePriceConfig(parent);
    const currentCarat = String(Number(diamondSize || defaultCarat));

    const pricedOptions = fallbackOptions.filter((quality) =>
      availableDiamondTypes.every((type) => {
        const priceTable = type === "Natural" ? storeConfig.naturalDiamondPrices : storeConfig.labDiamondPrices;
        return typeof priceTable?.[currentCarat]?.[quality] === "number";
      })
    );

    return pricedOptions.length > 0 ? pricedOptions : fallbackOptions;
  }, [availableDiamondTypes, defaultCarat, diamondSize, parent]);
  const qualityClarities = getStorePriceConfig(parent).availableOptions?.qualityClarities || {};
  const headLabels = getStorePriceConfig(parent).availableOptions?.headLabels || {};
  const shankLabels = getStorePriceConfig(parent).availableOptions?.shankLabels || {};
  const matchingBandLabels = getStorePriceConfig(parent).availableOptions?.matchingBandLabels || {};

  useEffect(() => {
    if (availableCaratSizes.length > 0 && !availableCaratSizes.includes(Number(diamondSize))) {
      handleCarat(defaultCarat);
    }
  }, [availableCaratSizes, defaultCarat]);
  const availableMatchingBandStyles = useMemo(
    () => filterAvailableOptions(apiData.ring.sideSetting, parent, "matchingBandStyles"),
    [parent]
  );
  const availableHeadChoices = useMemo(() => getAvailableOptions(parent, "headStyles").flatMap((id) => {
    const design = DIAMONDWISE_DESIGNS.find((item) => item.headId === id);
    if (design) return [{ kind: "diamondwise", value: design }];
    return settingOptions
      .filter((option) => option.head === id)
      .map((option) => ({ kind: "standard", value: option }));
  }), [parent]);
  const availableShankChoices = useMemo(() => {
    const activeHead = noHeadSelected ? "NO-HEAD" : (headStyle === "three-stone" ? "OVAL" : ringHead);

    return getAvailableOptions(parent, "shankStyles")
      .filter((shank) => isHeadCompatible(parent, shank, activeHead))
      .flatMap((id) => {
        const design = !noHeadSelected && DIAMONDWISE_DESIGNS.find((item) => item.shankId === id);
        if (design) return [{ kind: "diamondwise", value: design }];
        return styleOptions
          .filter((option) => option.shank === id)
          .map((option) => ({ kind: "standard", value: option }));
      });
  }, [headStyle, noHeadSelected, parent, ringHead]);

  // When the current head restricts shanks to exactly one option, auto-select
  // it silently so the shank row can be hidden without stale state.
  useEffect(() => {
    if (availableShankChoices.length !== 1) return;
    const only = availableShankChoices[0];
    const onlyShankId = only.kind === "diamondwise" ? only.value.shankId : only.value.shank;
    if (ringShank !== onlyShankId) {
      if (only.kind === "diamondwise") {
        handleDiamondWisePreset(only.value, "shank");
      } else {
        handleStyle(only.value);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableShankChoices]);

  const selectedQualitySpec = getQualitySpec(selectedQuality?.quality);
  const selectedDiamondOriginLabel =
    stoneTypeOptions.find((option) => option.activeTab === activeStoneTab && option.diamondOrigin === selectedDiamondOrigin)?.label ||
    "Colorless Lab Grown";

  const handleDiamondQuality = (quality) => {
    const nextSpec = getQualitySpec(quality);
    const nextSelectedQuality = { type: selectedDiamondOrigin, quality };
    const diamondPrice = calculateTheme3DiamondPrice({ nextSelectedQuality });

    setSelectedQuality(nextSelectedQuality);
    setDiamondType(selectedDiamondOrigin);
    setDiamondColorClarity(nextSpec.colors[0]);
    setCut(nextSpec.cuts[0]);
    setClarity(nextSpec.clarities[0]);
    setStoneTotal(diamondPrice);
    setCaratP(diamondPrice);
    setSummaryBlink(true);
  };

  const startTheme3GuideInteraction = () => {
    if (theme !== "theme-3") return false;
    hasTheme3GuideInteractionStartedRef.current = true;
    return true;
  };

  const emitTheme3GuideEvent = (feature, sectionOverride) => {
    if (theme !== "theme-3" || !feature) return;
    if (typeof window === "undefined" || window.self === window.top) return;
    if (!hasTheme3GuideInteractionStartedRef.current) return;
    if (!isDiamondPreviewFlow && THEME3_STONE_GUIDE_FEATURES.has(feature)) return;

    const meta = getTheme3GuideMeta(feature, sectionOverride);
    const eventKey = `${flow}:${meta.section}:${meta.feature}`;
    if (lastTheme3GuideEventRef.current === eventKey) return;

    const targetOrigin = resolveFeatureGuideTargetOrigin(parent);
    if (!targetOrigin) return;

    window.parent.postMessage(
      {
        type: "ring-configurator:feature-guide",
        version: 1,
        theme: "theme-3",
        flow,
        section: meta.section,
        feature: meta.feature,
        label: meta.label,
      },
      targetOrigin
    );
    lastTheme3GuideEventRef.current = eventKey;
  };

  const emitTheme3GuideEventAfterInteraction = (feature, sectionOverride) => {
    if (!startTheme3GuideInteraction()) return;
    emitTheme3GuideEvent(feature, sectionOverride);
  };

  const clearTheme3ProgrammaticScrollTimers = () => {
    window.clearTimeout(programmaticTheme3ScrollTimeoutRef.current);
    window.clearTimeout(programmaticTheme3ScrollSettleTimeoutRef.current);
    window.cancelAnimationFrame(programmaticTheme3ScrollFrameRef.current);
  };

  const isTheme3ProgrammaticTargetReached = () => {
    const targetSection = programmaticTheme3TargetSectionRef.current;
    const panelScroll = theme3PanelScrollRef.current;
    const target = targetSection ? theme3SectionRefs.current[targetSection] : null;
    const themeRoot = panelScroll?.closest(".theme3-root");
    if (!targetSection || !target || !panelScroll || !themeRoot) return true;

    const { element: scrollContainer, isPage } = getTheme3ScrollContainer(panelScroll, themeRoot);
    const containerRect = isPage ? { top: 0 } : scrollContainer.getBoundingClientRect();
    const navHeight = themeRoot.querySelector(".theme3-section-nav")?.offsetHeight || 0;
    const markerTop =
      scrollContainer === panelScroll
        ? containerRect.top + 24
        : navHeight + 40;
    const targetTop = target.getBoundingClientRect().top;
    const enabledSections = theme3Sections.filter((section) => !section.disabled);
    const lastEnabledSection = enabledSections[enabledSections.length - 1]?.id;
    const isAtBottom = isPage
      ? window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3
      : scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 3;

    return targetTop <= markerTop + 8 || (targetSection === lastEnabledSection && isAtBottom);
  };

  const releaseTheme3ProgrammaticScrollLock = ({ keepTargetActive = true } = {}) => {
    const targetSection = programmaticTheme3TargetSectionRef.current;
    clearTheme3ProgrammaticScrollTimers();
    isProgrammaticTheme3ScrollRef.current = false;
    programmaticTheme3TargetSectionRef.current = "";
    if (keepTargetActive && targetSection) onTheme3SectionChange?.(targetSection);
  };

  const scheduleTheme3ProgrammaticScrollSettleRelease = () => {
    if (!isProgrammaticTheme3ScrollRef.current || !programmaticTheme3TargetSectionRef.current) return;

    window.clearTimeout(programmaticTheme3ScrollSettleTimeoutRef.current);
    programmaticTheme3ScrollSettleTimeoutRef.current = window.setTimeout(() => {
      if (!isProgrammaticTheme3ScrollRef.current) return;
      if (isTheme3ProgrammaticTargetReached()) {
        releaseTheme3ProgrammaticScrollLock({ keepTargetActive: true });
      }
    }, 160);
  };

  const calculateTheme3DiamondPrice = ({
    nextCarat = diamondSize,
    nextShape = shape,
    nextActiveTab = activeStoneTab,
    nextFancyDiamond = fancyDiamond,
    nextFancyDiamondIntensity = fancyDiamondIntensity,
    nextGemstone = gemstone,
    nextSelectedQuality = selectedQuality,
  } = {}) => {
    const carat = Number(nextCarat || defaultCarat);
    const quality = nextSelectedQuality?.quality || getDefaultQuality(parent);
    const type = nextSelectedQuality?.type || diamondType || "Lab";
    const configuredPrice = getDiamondPrice(parent, carat, quality, type, nextShape);
    // A configured price > 0 is valid. Only fall back when the requested
    // carat/quality combination is genuinely absent from local pricing.
    const basePrice = Number.isFinite(configuredPrice) && configuredPrice > 0
      ? configuredPrice
      : initialPrice.diamondPrice;

    if (nextActiveTab === "Fancy-Gemstone") {
      return Math.round(basePrice * getFancyPriceFactor(parent)) +
        getGemstoneExtraPrice(parent, nextGemstone);
    }

    if (nextActiveTab === "Fancy Colored") {
      return basePrice +
        getColoredDiamondExtraPrice(parent, nextFancyDiamond) +
        getIntensityPrice(parent, nextFancyDiamondIntensity);
    }

    return basePrice;
  };

  const applyRingPrice = ({
    nextMetal = metal,
    nextHead = ringHead,
    nextShank = ringShank,
    nextSideSetting = ringSideSetting,
    nextRingBand = ringBand,
    nextMatchingBandQuantity = matchingBandQuantity,
    nextEngraving = engraving,
    nextMatchingBandStyle = ringMatchingBand,
    metalPriceKey,
  } = {}) => {
    const matchingBandPriceStyle =
      nextMatchingBandStyle ||
      ringMatchingBand ||
      (nextSideSetting === "PLAIN" && nextShank !== "PLAIN" ? nextShank : nextSideSetting);
    const effectiveMetal = metalPriceKey || (platinum ? "Platinum" : nextMetal);
    const price = calculateFinalRingPrice(
      effectiveMetal,
      nextHead,
      nextShank,
      matchingBandPriceStyle,
      nextRingBand,
      bandWidth,
      styleShape,
      nextEngraving,
      parent
    );
    const matchingBandTotal = price.breakdown.matchingBandPrice * nextMatchingBandQuantity;
    const finalRingPrice =
      price.finalPrice - price.breakdown.matchingBandPrice + matchingBandTotal;

    setFinalRingPrice(finalRingPrice);
    setStylePrice(price.breakdown.ringShankPrice);
    setHeadPrice(price.breakdown.ringHeadStylePrice);
    setRingSideSettingPrice(price.breakdown.ringSideSettingPrice);
    setMetalPrice(price.breakdown.metalPrice);
    setMatchingBandPrice(matchingBandTotal);
    setEngravingPrice(price.breakdown.engravingPrice);
    setShankTotal(
      price.breakdown.ringShankPrice +
        price.breakdown.ringSideSettingPrice +
        price.breakdown.metalPrice +
        matchingBandTotal +
        price.breakdown.engravingPrice
    );
    setHeadTotal(price.breakdown.ringHeadStylePrice);
    setOtherTotal(0);
    setSummaryBlink(true);
  };

  const handleStyle = (option) => {
    const isLeavingDiamondWiseDesign = Boolean(diamondWiseDesignId);
    if (isLeavingDiamondWiseDesign) setDiamondWiseDesignId(DIAMONDWISE_DESIGN_NONE);

    // Compatibility flows from the selected head to the available shanks.
    // A shank card can normally not reach this handler when incompatible, but
    // keep this guard for keyboard/programmatic selection as well.
    if (!isLeavingDiamondWiseDesign && !isHeadCompatible(parent, option.shank, ringHead)) return;

    const nextHead = isLeavingDiamondWiseDesign ? "4-PRONG" : ringHead;

    setRingShank(option.shank);
    setRingSideSetting(option.sideSetting);
    const nextMatchingBandStyle =
      matchingBandQuantity > 0 ? ringMatchingBand : option.sideSetting;
    setRingMatchingBand(nextMatchingBandStyle);
    if (nextHead !== ringHead) {
      setRingHead(nextHead);
      setHeadstyle("plain");
      setThreestone("");
      setShapeList("");
    }
    // Leaving a DiamondWise design with a standard shank: the custom head and
    // its custom stone shape do not exist outside that design, so rebuild a
    // complete, valid ring — plain 4-prong head with a round stone.
    if (isLeavingDiamondWiseDesign && shape !== "round") {
      setShape("round");
    }
    // These shanks have no plain, engravable inner surface (see
    // ENGRAVING_INCOMPATIBLE_SHANKS) — drop any existing engraving rather
    // than leaving a priced-in engraving the UI now hides and disables.
    const isMovingToEngravingIncompatibleShank =
      ENGRAVING_INCOMPATIBLE_SHANKS.includes(option.shank) && Boolean(engraving.trim());
    if (isMovingToEngravingIncompatibleShank) {
      if (engravingFocus) deactivateEngravingPreview();
      setEngraving("");
      setEngravingFont("Arial");
    }
    applyRingPrice({
      nextShank: option.shank,
      nextSideSetting: option.sideSetting,
      nextHead,
      nextMatchingBandStyle,
      ...(isMovingToEngravingIncompatibleShank && { nextEngraving: "" }),
    });
  };

  const handleShape = (option) => {
    if (diamondWiseDesignId && option.value !== (selectedDiamondWiseDesign?.defaultShape || "marquise")) return;
    if (ROUND_ONLY_HEAD_STYLES.includes(headStyle) && option.value !== "round") return;
    if (headStyle === "three-stone") {
      const threeStoneSelection = THREE_STONE_SHAPE_TO_HEAD[option.value];
      if (!threeStoneSelection) return;
      setRingHead(threeStoneSelection.head);
      setThreestone(threeStoneSelection.threestone);
      applyRingPrice({ nextHead: threeStoneSelection.head });
    }

    const diamondPrice = calculateTheme3DiamondPrice({ nextShape: option.value });
    setShape(option.value);
    setStoneTotal(diamondPrice);
    setCaratP(diamondPrice);
    setSummaryBlink(true);
  };

  const handleStoneType = (option) => {
    if (isDiamondWiseStore && option.diamondOrigin === "Natural") {
      setShowNaturalDiamondNotice(true);
      return;
    }

    const nextSelectedQuality = {
      type: option.diamondOrigin,
      quality: selectedQuality?.quality || getDefaultQuality(parent),
    };
    const nextFancyDiamond = availableFancyDiamonds.includes(fancyDiamond)
      ? fancyDiamond
      : availableFancyDiamonds[0] || fancyDiamondOptions[0];
    const nextGemstone = availableGemstones.includes(gemstone)
      ? gemstone
      : availableGemstones[0] || gemstoneOptions[0];
    const nextPrice = calculateTheme3DiamondPrice({
      nextActiveTab: option.activeTab,
      nextSelectedQuality,
      nextFancyDiamond,
      nextGemstone,
    });

    setActiveTab(option.activeTab);
    setColorType(option.colorType);
    setSelectedQuality(nextSelectedQuality);
    setDiamondType(option.diamondOrigin);
    if (option.activeTab === "Fancy Colored") setFancyDiamond(nextFancyDiamond);
    if (option.activeTab === "Fancy-Gemstone") setGemstone(nextGemstone);
    setStoneTotal(nextPrice);
    setCaratP(nextPrice);
    setSummaryBlink(true);
  };

  const handleSwitchToLabGrown = () => {
    const labGrownOption = stoneTypeOptions.find(
      (option) => option.activeTab === "Colorless" && option.diamondOrigin === "Lab"
    );
    setShowNaturalDiamondNotice(false);
    if (labGrownOption) handleStoneType(labGrownOption);
  };

  const handleCarat = (carat) => {
    const diamondPrice = calculateTheme3DiamondPrice({ nextCarat: carat });

    setDiamondSize(carat);
    setCaratP(diamondPrice);
    setDiamondCarat(carat);
    setActiveDiamondSize(carat);
    setStoneTotal(diamondPrice);
    setSummaryBlink(true);
  };

  const handleDiamondWisePreset = (design, part) => {
    if (!isDiamondPreviewFlow || !design) return;

    // Each DiamondWise design is a fixed head+shank set (5 total) — picking
    // either the head or the shank card always jumps to that whole set, so
    // a head from one design can never end up paired with another design's
    // shank. `part` no longer changes which side gets updated.
    const nextHead = design.headId;
    const nextShank = design.shankId;

    setDiamondWiseDesignId(design.id);
    setRingHead(nextHead);
    setRingShank(nextShank);
    setShape(design.defaultShape || "marquise");

    if (engravingFocus) deactivateEngravingPreview();

    const needsUnsupportedReset =
      ringBand === "Yes" ||
      matchingBandQuantity > 0 ||
      ringMatchingBand !== "PLAIN";

    if (needsUnsupportedReset) {
      setMatchingBandQuantity(0);
      setRingBand("No");
      setRingMatchingBand("PLAIN");
    }

    applyRingPrice({
      nextHead,
      nextShank,
      ...(needsUnsupportedReset && {
        nextRingBand: "No",
        nextMatchingBandQuantity: 0,
        nextMatchingBandStyle: "PLAIN",
      }),
    });

    setSummaryBlink(true);
  };

  const handleFancyDiamond = (value) => {
    const diamondPrice = calculateTheme3DiamondPrice({ nextFancyDiamond: value });
    setFancyDiamond(value);
    setFancyColorPrice(getColoredDiamondExtraPrice(parent, value));
    setStoneTotal(diamondPrice);
    setCaratP(diamondPrice);
    setSummaryBlink(true);
  };

  const handleFancyDiamondIntensity = (value) => {
    const intensityPrice = getIntensityPrice(parent, value);
    const diamondPrice = calculateTheme3DiamondPrice({ nextFancyDiamondIntensity: value });
    setFancyDiamondIntensity(value);
    setIntensityPrice(intensityPrice);
    setStoneTotal(diamondPrice);
    setCaratP(diamondPrice);
    setSummaryBlink(true);
  };

  const handleGemstone = (value) => {
    const diamondPrice = calculateTheme3DiamondPrice({ nextGemstone: value });
    setGemstone(value);
    setGemstonePrice(getGemstoneExtraPrice(parent, value));
    setStoneTotal(diamondPrice);
    setCaratP(diamondPrice);
    setSummaryBlink(true);
  };

  const handleSetting = (option) => {
    const isLeavingDiamondWiseDesign = Boolean(diamondWiseDesignId);
    let nextShank = isLeavingDiamondWiseDesign ? "PLAIN" : ringShank;

    // Heads are controlled by the active API catalogue. Once a head is
    // selected, choose a compatible active shank instead of preventing that
    // head from being selected because of the old shank.
    if (!isHeadCompatible(parent, nextShank, option.head)) {
      const compatibleShank = getAvailableOptions(parent, "shankStyles").find(
        (shank) => isHeadCompatible(parent, shank, option.head),
      );
      if (compatibleShank) nextShank = compatibleShank;
    }
    if (isLeavingDiamondWiseDesign) {
      // A custom design's IDs only exist within its paired GLBs. Restore a
      // complete default ring before applying the newly selected standard head.
      setDiamondWiseDesignId(DIAMONDWISE_DESIGN_NONE);
      setRingShank(nextShank);
      setRingSideSetting("PLAIN");
      setRingMatchingBand("PLAIN");
    }

    // Leaving a DiamondWise design with a standard head: fall back to a plain
    // shank and a round stone so head, shank and stone are a valid trio again.
    let nextShape = isLeavingDiamondWiseDesign ? "round" : shape;
    let nextHead = option.head;
    let nextThreestone = "";
    let nextShapeList = "";

    if (ROUND_ONLY_HEAD_STYLES.includes(option.headStyle)) {
      nextShape = "round";
    }

    if (option.headStyle === "tulip" && !TULIP_COMPATIBLE_SHAPES.includes(nextShape)) {
      nextShape = "round";
    }

    if (option.headStyle === "three-stone") {
      nextShape = THREE_STONE_SHAPE_TO_HEAD[nextShape] ? nextShape : "oval";
      const threeStoneSelection = THREE_STONE_SHAPE_TO_HEAD[nextShape];
      nextHead = threeStoneSelection.head;
      nextThreestone = threeStoneSelection.threestone;
      nextShapeList = Object.keys(THREE_STONE_SHAPE_TO_HEAD).join(",");
    }

    setRingHead(nextHead);
    if (nextShank !== ringShank) {
      setRingShank(nextShank);
      setRingSideSetting(nextShank === "PLAIN" ? "PLAIN" : ringSideSetting);
    }
    setHeadstyle(option.headStyle);
    setThreestone(nextThreestone);
    setShapeList(nextShapeList);
    if (nextShape !== shape) {
      setShape(nextShape);
    }
    applyRingPrice({
      nextHead,
      ...(nextShank !== ringShank && { nextShank }),
      ...(isLeavingDiamondWiseDesign && {
        nextShank,
        nextSideSetting: "PLAIN",
        nextMatchingBandStyle: "PLAIN",
      }),
    });
  };

  const handleNoHeadToggle = () => {
    if (noHeadSelected) {
      setNoHeadSelected(false);
      if (engravingFocus) deactivateEngravingPreview();
      setHasReachedTheme3FinalStep(false);
      onTheme3SectionChange?.("setting");
      const fallbackHead = getAvailableOptions(parent, "headStyles")[0] || "4-PRONG";
      const design = DIAMONDWISE_DESIGNS.find((item) => item.headId === fallbackHead);
      if (design) {
        handleDiamondWisePreset(design, "head");
        return;
      }
      setRingHead(fallbackHead);
      setHeadstyle("plain");
      let nextShank = ringShank;
      if (!isHeadCompatible(parent, nextShank, fallbackHead)) {
        nextShank = getAvailableOptions(parent, "shankStyles").find(
          (shank) => isHeadCompatible(parent, shank, fallbackHead),
        ) || "PLAIN";
        setRingShank(nextShank);
      }
      applyRingPrice({ nextHead: fallbackHead, nextShank });
      return;
    }

    if (engravingFocus) deactivateEngravingPreview();

    const availableNoHeadShanks = getAvailableOptions(parent, "shankStyles")
      .filter((shank) => isHeadCompatible(parent, shank, "NO-HEAD"))
      .flatMap((id) => {
        const design = DIAMONDWISE_DESIGNS.find((item) => item.shankId === id);
        if (design) return [{ kind: "diamondwise", value: design }];
        return styleOptions
          .filter((option) => option.shank === id)
          .map((option) => ({ kind: "standard", value: option }));
      });

    const firstChoice = availableNoHeadShanks[0];
    if (!firstChoice) return;

    setNoHeadSelected(true);
    setDiamondWiseDesignId("");
    setRingHead("NO-HEAD");
    onTheme3SectionChange?.("band");

    const nextShank = firstChoice.kind === "diamondwise" ? firstChoice.value.shankId : firstChoice.value.shank;
    const nextSideSetting = firstChoice.kind === "diamondwise" ? "PLAIN" : (firstChoice.value.sideSetting || "PLAIN");

    setRingShank(nextShank);
    setRingSideSetting(nextSideSetting);
    setRingMatchingBand("PLAIN");
    setMatchingBandQuantity(0);
    setRingBand("No");
    setBiMetal("No");
    setHeadColor(ringColor);
    applyRingPrice({
      nextHead: "NO-HEAD",
      nextShank,
      nextSideSetting,
      nextMatchingBandStyle: "PLAIN",
      nextMatchingBandQuantity: 0,
      nextRingBand: "No",
    });
  };

  const handleMetal = (option) => {
    setPlatinum(option.platinum);
    setMetal(option.metal);
    setRingColor(option.color);
    setHeadColor(option.color);
    setBandColor(option.color);
    setBiMetal("No");
    applyRingPrice({ nextMetal: option.metal, metalPriceKey: option.purity });
  };

  const handleMetalColor = (option) => {
    if (option.platinum || option.fixedPurity) {
      const metalName = option.fixedPurity || "Platinum";
      setPlatinum(Boolean(option.platinum));
      setMetal(metalName);
      setRingColor(option.color);
      setHeadColor(option.color);
      setBandColor(option.color);
      setBiMetal("No");
      applyRingPrice({ nextMetal: metalName, metalPriceKey: metalName });
      return;
    }

    const nextMetal = purityOptions.includes(metal)
      ? metal
      : availablePurities.includes("14K") ? "14K" : availablePurities[0] || "14K";

    setPlatinum(false);
    setMetal(nextMetal);
    setRingColor(option.color);
    setBandColor(option.color);
    if (biMetal !== "Yes") {
      setHeadColor(option.color);
    }
    applyRingPrice({ nextMetal, metalPriceKey: nextMetal });
  };

  const handlePurity = (purity) => {
    if (platinum || ["Titanium", "Silver", "Sterling Silver"].includes(metal)) return;
    setMetal(purity);
    applyRingPrice({ nextMetal: purity, metalPriceKey: purity });
  };

  const handleBiMetalSelect = (colorValue) => {
    if (platinum || ["Titanium", "Silver", "Sterling Silver"].includes(metal)) return;

    if (colorValue === "none") {
      if (biMetal !== "Yes") return;
      setBiMetal("No");
      setHeadColor(ringColor);
      setSummaryBlink(true);
      return;
    }

    const option = metalColorOptions.find((item) => item.value === colorValue && !item.platinum && !item.fixedPurity);
    if (!option) return;

    setBiMetal("Yes");
    setHeadColor(option.color);
    setSummaryBlink(true);
  };

  const handleHeadCardHover = (headId, headLabel) => {
    const effectiveMatchingBandStyle = ringMatchingBand || ringSideSetting;
    const hovered = calculateFinalRingPrice(metal, headId, ringShank, effectiveMatchingBandStyle, ringBand, bandWidth, styleShape, engraving, parent);
    const current = calculateFinalRingPrice(metal, ringHead, ringShank, effectiveMatchingBandStyle, ringBand, bandWidth, styleShape, engraving, parent);
    const delta = hovered.breakdown.ringHeadStylePrice - current.breakdown.ringHeadStylePrice;
    setHoveredHead({ name: headLabel, delta });
  };

  const handleHeadCardLeave = () => {
    setHoveredHead(null);
  };

  const handleDiamondWiseCardHover = (design) => {
    if (!design) return;
    const hovered = calculateFinalRingPrice(
      metal,
      design.headId,
      design.shankId,
      "PLAIN",
      "No",
      bandWidth,
      styleShape,
      engraving,
      parent
    );
    const current = calculateFinalRingPrice(
      metal,
      ringHead,
      ringShank,
      ringMatchingBand || ringSideSetting,
      ringBand,
      bandWidth,
      styleShape,
      engraving,
      parent
    );
    const hoveredSettingTotal =
      (hovered?.breakdown?.ringShankPrice || 0) +
      (hovered?.breakdown?.ringHeadStylePrice || 0) +
      (hovered?.breakdown?.ringSideSettingPrice || 0) +
      (hovered?.breakdown?.metalPrice || 0) +
      (hovered?.breakdown?.engravingPrice || 0);
    const currentSettingTotal =
      (current?.breakdown?.ringShankPrice || 0) +
      (current?.breakdown?.ringHeadStylePrice || 0) +
      (current?.breakdown?.ringSideSettingPrice || 0) +
      (current?.breakdown?.metalPrice || 0) +
      (current?.breakdown?.engravingPrice || 0);
    const delta = hoveredSettingTotal - currentSettingTotal;
    setHoveredHead({ name: design.headLabel || design.label, delta });
  };

  const handleShankCardHover = (shankId, shankLabel, sideSetting) => {
    const calcTotal = (shank, side) => {
      const bandStyle = matchingBandQuantity > 0 ? (ringMatchingBand || side) : side;
      const p = calculateFinalRingPrice(metal, ringHead, shank, bandStyle, ringBand, bandWidth, styleShape, engraving, parent);
      return p.breakdown.ringShankPrice + p.breakdown.ringSideSettingPrice + p.breakdown.metalPrice + p.breakdown.matchingBandPrice + p.breakdown.engravingPrice;
    };
    const delta = calcTotal(shankId, sideSetting) - calcTotal(ringShank, ringSideSetting);
    setHoveredShank({ name: shankLabel, delta });
  };

  const handleShankCardLeave = () => {
    setHoveredShank(null);
  };

  const handlePurityHover = (purity) => {
    const effectiveMatchingBandStyle = ringMatchingBand || ringSideSetting;
    const hovered = calculateFinalRingPrice(purity, ringHead, ringShank, effectiveMatchingBandStyle, ringBand, bandWidth, styleShape, engraving, parent);
    const current = calculateFinalRingPrice(metal, ringHead, ringShank, effectiveMatchingBandStyle, ringBand, bandWidth, styleShape, engraving, parent);
    setHoveredPurity({ delta: hovered.breakdown.metalPrice - current.breakdown.metalPrice });
  };

  const handlePurityLeave = () => {
    setHoveredPurity(null);
  };

  const getPurityDelta = (purity) => {
    const effectiveMatchingBandStyle = ringMatchingBand || ringSideSetting;
    const target = calculateFinalRingPrice(purity, ringHead, ringShank, effectiveMatchingBandStyle, ringBand, bandWidth, styleShape, engraving, parent);
    const current = calculateFinalRingPrice(metal, ringHead, ringShank, effectiveMatchingBandStyle, ringBand, bandWidth, styleShape, engraving, parent);
    return target.breakdown.metalPrice - current.breakdown.metalPrice;
  };

  const handleStoneOptionHover = (delta) => {
    setHoveredStone({ delta });
  };

  const handleStoneOptionLeave = () => {
    setHoveredStone(null);
  };

  const handleStoneCategoryHover = (option) => {
    const nextSelectedQuality = {
      type: option.diamondOrigin,
      quality: selectedQuality?.quality || getDefaultQuality(parent),
    };
    const nextFancyDiamond = availableFancyDiamonds.includes(fancyDiamond)
      ? fancyDiamond
      : availableFancyDiamonds[0] || fancyDiamondOptions[0];
    const nextGemstone = availableGemstones.includes(gemstone)
      ? gemstone
      : availableGemstones[0] || gemstoneOptions[0];
    const hoveredPrice = calculateTheme3DiamondPrice({
      nextActiveTab: option.activeTab,
      nextSelectedQuality,
      nextFancyDiamond,
      nextGemstone,
    });
    const currentPrice = calculateTheme3DiamondPrice({});
    setHoveredStoneCategory({ delta: hoveredPrice - currentPrice });
  };

  const handleStoneCategoryLeave = () => {
    setHoveredStoneCategory(null);
  };

  const handleQualityHover = (quality) => {
    const nextSelectedQuality = { type: selectedDiamondOrigin, quality };
    const hoveredPrice = calculateTheme3DiamondPrice({ nextSelectedQuality });
    const currentPrice = calculateTheme3DiamondPrice({});
    setHoveredQuality({ delta: hoveredPrice - currentPrice });
  };

  const handleQualityLeave = () => {
    setHoveredQuality(null);
  };

  const getStoneCategoryDelta = (option) => {
    const nextSelectedQuality = {
      type: option.diamondOrigin,
      quality: selectedQuality?.quality || getDefaultQuality(parent),
    };
    const nextFancyDiamond = availableFancyDiamonds.includes(fancyDiamond) ? fancyDiamond : availableFancyDiamonds[0] || fancyDiamondOptions[0];
    const nextGemstone = availableGemstones.includes(gemstone) ? gemstone : availableGemstones[0] || gemstoneOptions[0];
    return calculateTheme3DiamondPrice({ nextActiveTab: option.activeTab, nextSelectedQuality, nextFancyDiamond, nextGemstone }) - calculateTheme3DiamondPrice({});
  };

  const getQualityDelta = (quality) => calculateTheme3DiamondPrice({ nextSelectedQuality: { type: selectedDiamondOrigin, quality } }) - calculateTheme3DiamondPrice({});

  const handleSizeOption = (option) => {
    const nextSystem = ringSizeSystems.find((system) => system.label === option);
    if (!nextSystem) return;
    setSizeOption(nextSystem.label);
    setRingSize(nextSystem.value[0]);
    setSummaryBlink(true);
  };

  const handleRingSize = (value) => {
    setRingSize(value);
    setRingSizeOpen(false);
    setSummaryBlink(true);
  };

  const handleMatchingBand = (option) => {
    if (diamondWiseDesignId) return;
    if (option.quantity > 0 && !isMatchingBandCompatible(parent, ringHead, option.style || "PLAIN")) return;

    const nextRingBand = option.quantity > 0 ? "Yes" : "No";
    const nextMatchingBandStyle = option.style || "PLAIN";
    setMatchingBandQuantity(option.quantity);
    setRingBand(nextRingBand);
    setRingMatchingBand(nextMatchingBandStyle);
    applyRingPrice({
      nextRingBand,
      nextSideSetting: ringSideSetting,
      nextMatchingBandQuantity: option.quantity,
      nextMatchingBandStyle,
    });
  };


  const activateEngravingPreview = () => {
    setEngravingFocus(true);
    setCameraView("engravingZoom");
  };

  const deactivateEngravingPreview = () => {
    setEngravingFocus(false);
    setCameraView("perspective");
  };

  const handleEngravingChange = (event) => {
    const nextEngraving = trimEngraving(event.target.value);
    setEngraving(nextEngraving);
    applyRingPrice({ nextEngraving });
  };

  const handleEngravingSymbol = (symbol) => {
    const input = engravingInputRef.current;
    if (!input) return;

    activateEngravingPreview();

    const start = input.selectionStart ?? engraving.length;
    const end = input.selectionEnd ?? start;
    const nextEngraving = engraving.slice(0, start) + symbol + engraving.slice(end);
    if (getAdjustedEngravingLength(nextEngraving) > ENGRAVING_LIMIT) {
      requestAnimationFrame(() => input.focus());
      return;
    }

    setEngraving(nextEngraving);
    applyRingPrice({ nextEngraving });
    setSummaryBlink(true);

    requestAnimationFrame(() => {
      input.focus();
      const nextCursor = start + symbol.length;
      input.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleEngravingFont = (font) => {
    setEngravingFont(font);
    activateEngravingPreview();
  };

  const handleEngravingClear = () => {
    setEngraving("");
    applyRingPrice({ nextEngraving: "" });
    requestAnimationFrame(() => {
      engravingInputRef.current?.focus();
    });
  };

  const handleShareClick = () => {
    setShare(true);
    setShowCopiedTooltip(true);
    if (copiedTooltipTimeoutRef.current) {
      clearTimeout(copiedTooltipTimeoutRef.current);
    }
    copiedTooltipTimeoutRef.current = setTimeout(() => {
      setShowCopiedTooltip(false);
    }, 2000);
  };

  const handleReset = () => {
    setIsResetActive(true);
    setHasReachedTheme3FinalStep(false);
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = window.setTimeout(() => setIsResetActive(false), 2000);

    const isDiamondwise = isDiamondWiseParentUrl(parent);
    const targetShank = isDiamondwise ? "dw-jul-ma-02-shank" : "PLAIN";
    const targetHead = isDiamondwise ? "dw-jul-ma-02-head" : "4-PRONG";
    const targetShape = isDiamondwise ? "marquise" : "round";
    const targetDWId = isDiamondwise ? "diamondwise-jul-ma-02" : DIAMONDWISE_DESIGN_NONE;

    setRingShank(targetShank);
    setRingSideSetting("PLAIN");
    setRingMatchingBand("PLAIN");
    setRingColor(GOLD_COLORS.yellow);
    setHeadColor(GOLD_COLORS.yellow);
    setBandColor(GOLD_COLORS.yellow);
    setMetal("14K");
    setPlatinum(false);
    setBiMetal("No");
    setRingBand("No");
    const defaultSys = normalizeRingSizeSystem(getRingSizeType(parent));
    setSizeOption(defaultSys);
    setRingSize(ringSizeSystems.find((system) => system.label === defaultSys)?.value[0] || ringSizeSystems[0].value[0]);
    setMatchingBandQuantity(0);
    setRingHead(targetHead);
    setHeadstyle("plain");
    setThreestone("");
    setShapeList("");
    setShape(targetShape);
    setActiveTab("Colorless");
    setColorType("colorless");
    setFancyDiamond("Blue");
    setFancyDiamondIntensity("Light");
    setGemstone("blue-sapphire");
    setDiamondWiseDesignId(targetDWId);
    setSelectedQuality({ type: "Lab", quality: getDefaultQuality(parent) });
    setDiamondType("Lab");
    if (theme === "theme-3") {
      setEngraving("");
      setEngravingFont("Arial");
      deactivateEngravingPreview();
    }
    handleCarat(defaultCarat);
    setContinueMessage("");
    applyRingPrice({
      nextMetal: "14K",
      nextHead: targetHead,
      nextShank: targetShank,
      nextSideSetting: "PLAIN",
      nextRingBand: "No",
      nextMatchingBandQuantity: 0,
      nextMatchingBandStyle: "PLAIN",
      nextEngraving: theme === "theme-3" ? "" : engraving,
    });
    // Reset the model and camera to the plain-shank product pose.
    setCameraView("perspective");
    setResetObj({ position: [10, 8, -13], near: 0.1, far: 100 });
  };

  useEffect(() => {
    const diamondPrice = calculateTheme3DiamondPrice({
      nextCarat: diamondSize,
      nextActiveTab: activeStoneTab,
      nextFancyDiamond: fancyDiamond,
      nextFancyDiamondIntensity: fancyDiamondIntensity,
      nextGemstone: gemstone,
      nextSelectedQuality: selectedQuality,
    });
    setStoneTotal(diamondPrice);
    setCaratP(diamondPrice);
    applyRingPrice({
      nextMetal: metal,
      metalPriceKey: platinum ? "Platinum" : metal,
      nextHead: ringHead,
      nextShank: ringShank,
      nextSideSetting: ringSideSetting,
      nextRingBand: ringBand,
      nextMatchingBandQuantity: matchingBandQuantity,
      nextEngraving: engraving,
    });
    // Run when store context becomes available; option handlers keep later updates synced.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parent]);

  const isShapeDisabled = (shapeValue) => {
    if (diamondWiseDesignId) return shapeValue !== (selectedDiamondWiseDesign?.defaultShape || "marquise");
    if (ROUND_ONLY_HEAD_STYLES.includes(headStyle)) return shapeValue !== "round";
    if (headStyle === "tulip") return !TULIP_COMPATIBLE_SHAPES.includes(shapeValue);
    if (headStyle === "three-stone") return !THREE_STONE_SHAPE_TO_HEAD[shapeValue];
    if (!isShapeCompatible(parent, ringHead, shapeValue)) return true;
    return false;
  };

  const isSettingActive = (option) => {
    if (option.headStyle === "three-stone") {
      return headStyle === "three-stone" || ["OVAL", "TRAPEZOID", "HALF-MOON", "PEAR", "BAGUETTE"].includes(ringHead?.toUpperCase());
    }
    return ringHead === option.head;
  };

  // The API decides which heads exist. Compatibility decides which shanks
  // can be selected after the head, not whether that head can be selected.
  const isSettingDisabled = () => false;

  const compatibilityHead = noHeadSelected ? "NO-HEAD" : (headStyle === "three-stone" ? "OVAL" : ringHead);

  const isStyleDisabled = (option) =>
    !isHeadCompatible(parent, option.shank, compatibilityHead) ||
    (matchingBandQuantity > 0 && !isMatchingBandCompatible(parent, ringHead, ringMatchingBand));

  const isMatchingBandDisabled = (option) =>
    Boolean(diamondWiseDesignId) ||
    (option.quantity > 0 && !isMatchingBandCompatible(parent, ringHead, option.style || "PLAIN"));

  const selectedStyle = styleOptions.find((option) => option.shank === ringShank) || styleOptions[0];
  const selectedShape = shapeOptions.find((option) => option.value === shape) || shapeOptions[0];
  const selectedSetting = settingOptions.find(isSettingActive) || settingOptions[0];
  const selectedDiamondWiseDesign = getDiamondWiseDesignById(diamondWiseDesignId);
  const isEngravingDisabledForShank = ENGRAVING_INCOMPATIBLE_SHANKS.includes(ringShank);
  const selectedDiamondWiseShank = getDiamondWiseDesignByShankId(ringShank);
  const displayStyleLabel = selectedDiamondWiseShank?.shankLabel || shankLabels[ringShank] || selectedStyle.label;
  const displaySettingLabel = selectedDiamondWiseDesign?.headLabel || headLabels[ringHead] || selectedSetting.label;
  const displayShapeLabel = selectedDiamondWiseDesign
    ? (selectedDiamondWiseDesign.defaultShape || "marquise").replace(/^./, (letter) => letter.toUpperCase())
    : selectedShape.label;
  const availablePurities = useMemo(
    () => filterAvailableOptions(purityOptions, parent, "metalPurities"),
    [parent]
  );
  const availableMetalColors = useMemo(() => {
    const activeMetalNames = getAvailableOptions(parent, "metalColors");
    if (!activeMetalNames || activeMetalNames.length === 0) return metalColorOptions;
    return metalColorOptions.filter((option) =>
      activeMetalNames.includes(option.label) ||
      (option.label === "Sterling Silver" && activeMetalNames.includes("Silver")) ||
      (option.label === "Silver" && activeMetalNames.includes("Sterling Silver"))
    );
  }, [parent]);
  const selectedMetalColorValue = resolveMetalColorValue({ ringColor, platinum, metal });
  const selectedHeadMetalColorValue = resolveMetalColorValue({ ringColor: headColor, platinum: false, metal: "14K" });
  const selectedMetalColorOption =
    metalColorOptions.find((option) => option.value === selectedMetalColorValue) || metalColorOptions[1];
  const selectedHeadMetalColorOption =
    metalColorOptions.find((option) => option.value === selectedHeadMetalColorValue) || selectedMetalColorOption;
  const primaryMetalLabel = resolveMetalLabel({ metal, ringColor, platinum });
  const activePurity = platinum || metal === "Platinum" ? "Platinum" : metal;
  const getMatchingBandDisplayLabel = (style) => matchingBandLabels[style] || getMatchingBandStyleLabel(style);
  const selectedRingSizeSystem =
    ringSizeSystems.find((option) => option.label === sizeOption) || ringSizeSystems[0];
  const ringSizeOptions = selectedRingSizeSystem.value;
  const currentRingSizeIndex = ringSizeOptions.indexOf(String(ringSize));
  const currentRingSizeMm =
    currentRingSizeIndex >= 0 ? selectedRingSizeSystem.mm[currentRingSizeIndex] : selectedRingSizeSystem.mm[0];
  const ringSizePrice = useMemo(
    () => getRingSizePrice(parent, currentRingSizeMm),
    [parent, currentRingSizeMm]
  );
  const total = useMemo(
    () => Number(shankTotal || 0) + (noHeadSelected ? 0 : Number(headTotal || 0) + Number(stoneTotal || 0)) + ringSizePrice,
    [noHeadSelected, shankTotal, headTotal, stoneTotal, ringSizePrice]
  );
  const settingSubtotal = useMemo(
    () => Number(shankTotal || 0) + (noHeadSelected ? 0 : Number(headTotal || 0)) + ringSizePrice,
    [noHeadSelected, shankTotal, headTotal, ringSizePrice]
  );
  const diamondPreviewPrice = useMemo(
    () => (!noHeadSelected && isDiamondPreviewFlow ? Number(stoneTotal || 0) : 0),
    [noHeadSelected, isDiamondPreviewFlow, stoneTotal]
  );
  const theme3DisplayTotal = useMemo(
    () => settingSubtotal + diamondPreviewPrice,
    [settingSubtotal, diamondPreviewPrice]
  );

  const selectedHeadShankPrice = useMemo(
    () => Math.max(0, settingSubtotal - Number(matchingBandPrice || 0)),
    [settingSubtotal, matchingBandPrice]
  );

  const selectedStonePrice = useMemo(() => {
    if (stoneTotal && Number(stoneTotal) > 0) return Number(stoneTotal);
    return calculateTheme3DiamondPrice();
  }, [stoneTotal, calculateTheme3DiamondPrice]);

  const shapeDeltaMap = useMemo(() => {
    const currentPrice = calculateTheme3DiamondPrice();
    return Object.fromEntries(
      shapeOptions.map((option) => [
        option.value,
        calculateTheme3DiamondPrice({ nextShape: option.value }) - currentPrice,
      ])
    );
  }, [calculateTheme3DiamondPrice]);

  const displayedHeadShankPrice = useMemo(() => {
    if (hoveredHead && typeof hoveredHead.delta === "number") {
      return Math.max(0, selectedHeadShankPrice + hoveredHead.delta);
    }
    if (hoveredShank && typeof hoveredShank.delta === "number") {
      return Math.max(0, selectedHeadShankPrice + hoveredShank.delta);
    }
    return selectedHeadShankPrice;
  }, [selectedHeadShankPrice, hoveredHead, hoveredShank]);

  // Pre-compute price deltas for every head/shank/metal card so they show
  // +/- price differences relative to the current selection at all times.
  const headDeltaMap = useMemo(() => {
    const effectiveMatchingBandStyle = ringMatchingBand || ringSideSetting;
    const current = calculateFinalRingPrice(metal, ringHead, ringShank, effectiveMatchingBandStyle, ringBand, bandWidth, styleShape, engraving, parent);
    const map = {};
    availableHeadChoices.forEach(({ kind, value }) => {
      if (kind === "diamondwise") {
        const hov = calculateFinalRingPrice(metal, value.headId, value.shankId, "PLAIN", "No", bandWidth, styleShape, engraving, parent);
        const hovTotal = (hov?.breakdown?.ringShankPrice || 0) + (hov?.breakdown?.ringHeadStylePrice || 0) + (hov?.breakdown?.ringSideSettingPrice || 0) + (hov?.breakdown?.metalPrice || 0) + (hov?.breakdown?.engravingPrice || 0);
        const curTotal = (current?.breakdown?.ringShankPrice || 0) + (current?.breakdown?.ringHeadStylePrice || 0) + (current?.breakdown?.ringSideSettingPrice || 0) + (current?.breakdown?.metalPrice || 0) + (current?.breakdown?.engravingPrice || 0);
        map[value.headId] = hovTotal - curTotal;
      } else {
        const hov = calculateFinalRingPrice(metal, value.head, ringShank, effectiveMatchingBandStyle, ringBand, bandWidth, styleShape, engraving, parent);
        map[value.head] = hov.breakdown.ringHeadStylePrice - current.breakdown.ringHeadStylePrice;
      }
    });
    return map;
  }, [availableHeadChoices, metal, ringHead, ringShank, ringMatchingBand, ringSideSetting, ringBand, bandWidth, styleShape, engraving, parent]);

  const shankDeltaMap = useMemo(() => {
    const calcTotal = (shank, side) => {
      const bandStyle = matchingBandQuantity > 0 ? (ringMatchingBand || side) : side;
      const p = calculateFinalRingPrice(metal, ringHead, shank, bandStyle, ringBand, bandWidth, styleShape, engraving, parent);
      return p.breakdown.ringShankPrice + p.breakdown.ringSideSettingPrice + p.breakdown.metalPrice + p.breakdown.matchingBandPrice + p.breakdown.engravingPrice;
    };
    const currentTotal = calcTotal(ringShank, ringSideSetting);
    const map = {};
    availableShankChoices.forEach(({ kind, value }) => {
      if (kind === "diamondwise") {
        const hov = calculateFinalRingPrice(metal, ringHead, value.shankId, "PLAIN", "No", bandWidth, styleShape, engraving, parent);
        const hovTotal = (hov?.breakdown?.ringShankPrice || 0) + (hov?.breakdown?.ringSideSettingPrice || 0) + (hov?.breakdown?.metalPrice || 0) + (hov?.breakdown?.matchingBandPrice || 0) + (hov?.breakdown?.engravingPrice || 0);
        map[value.shankId] = hovTotal - currentTotal;
      } else {
        map[value.shank] = calcTotal(value.shank, value.sideSetting) - currentTotal;
      }
    });
    return map;
  }, [availableShankChoices, metal, ringHead, ringShank, ringSideSetting, ringMatchingBand, ringBand, bandWidth, styleShape, engraving, parent, matchingBandQuantity]);

  const metalColorDeltaMap = useMemo(() => {
    const effectiveMatchingBandStyle = ringMatchingBand || ringSideSetting;
    const current = calculateFinalRingPrice(metal, ringHead, ringShank, effectiveMatchingBandStyle, ringBand, bandWidth, styleShape, engraving, parent);
    const map = {};
    availableMetalColors.forEach((option) => {
      let targetMetal;
      if (option.platinum || option.fixedPurity) {
        targetMetal = option.fixedPurity || "Platinum";
      } else {
        targetMetal = purityOptions.includes(metal) ? metal : availablePurities.includes("14K") ? "14K" : availablePurities[0] || "14K";
      }
      const hov = calculateFinalRingPrice(targetMetal, ringHead, ringShank, effectiveMatchingBandStyle, ringBand, bandWidth, styleShape, engraving, parent);
      map[option.value] = hov.breakdown.metalPrice - current.breakdown.metalPrice;
    });
    return map;
  }, [availableMetalColors, metal, ringHead, ringShank, ringMatchingBand, ringSideSetting, ringBand, bandWidth, styleShape, engraving, parent, purityOptions, availablePurities]);

  const matchingBandDeltaMap = useMemo(() => {
    const map = {};
    matchingBandOptions.forEach((option) => {
      const targetPrice = option.quantity > 0
        ? getMatchingBandPrice(parent, option.style || "PLAIN") * option.quantity
        : 0;
      map[option.style || "none"] = targetPrice - Number(matchingBandPrice || 0);
    });
    return map;
  }, [parent, matchingBandPrice]);

  useEffect(() => {
    if (!isDiamondPreviewFlow && diamondWiseDesignId) {
      setDiamondWiseDesignId(DIAMONDWISE_DESIGN_NONE);
    }
  }, [diamondWiseDesignId, isDiamondPreviewFlow, setDiamondWiseDesignId]);

  useEffect(() => {
    if (selectedDiamondWiseDesign && shape !== selectedDiamondWiseDesign.defaultShape) {
      setShape(selectedDiamondWiseDesign.defaultShape);
    }
  }, [selectedDiamondWiseDesign, shape, setShape]);

  useEffect(() => {
    if (!selectedDiamondWiseDesign) return;

    let shouldRefreshPrice = false;
    if (matchingBandQuantity > 0 || ringBand === "Yes" || ringMatchingBand !== "PLAIN") {
      setMatchingBandQuantity(0);
      setRingBand("No");
      setRingMatchingBand("PLAIN");
      shouldRefreshPrice = true;
    }
    if (shouldRefreshPrice) {
      applyRingPrice({
        nextRingBand: "No",
        nextMatchingBandQuantity: 0,
        nextMatchingBandStyle: "PLAIN",
        nextEngraving: engraving,
      });
    }
    // Keep restored DiamondWise presets normalized without wiring new pricing behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDiamondWiseDesign, matchingBandQuantity, ringBand, ringMatchingBand, engraving]);

  useEffect(() => {
    // Skip if config was loaded from URL / share link — preserve shared sizeOption and ringSize
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const hasUrlConfig = Boolean(
      params.get("config") ||
      (typeof window !== "undefined" && window.self !== window.top && document.referrer && (() => {
        try {
          return new URL(document.referrer).searchParams.get("config");
        } catch {
          return false;
        }
      })())
    );
    if (hasUrlConfig) return;

    const defaultSizeOption = normalizeRingSizeSystem(getRingSizeType(parent));
    if (defaultSizeOption && defaultSizeOption !== sizeOption) {
      const defaultSystem =
        ringSizeSystems.find((option) => option.label === defaultSizeOption) || ringSizeSystems[0];
      setSizeOption(defaultSystem.label);
      setRingSize(defaultSystem.value[0]);
    }
    // Match the old app: parent/store context controls the default size system.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parent]);

  useEffect(() => {
    const mode = availableStoneTypeOptions.find((option) => option.activeTab === activeStoneTab) || availableStoneTypeOptions[0] || stoneTypeOptions[0];
    if (activeTab !== mode.activeTab) {
      setActiveTab(mode.activeTab);
    }
    if (colorType !== mode.colorType) {
      setColorType(mode.colorType);
    }
  }, [activeStoneTab, activeTab, availableStoneTypeOptions, colorType, setActiveTab, setColorType]);

  useEffect(() => {
    if (!isColoredMode || availableFancyDiamonds.length === 0 || availableFancyDiamonds.includes(fancyDiamond)) return;
    setFancyDiamond(availableFancyDiamonds[0]);
  }, [availableFancyDiamonds, fancyDiamond, isColoredMode, setFancyDiamond]);

  useEffect(() => {
    if (!isGemstoneMode || availableGemstones.length === 0 || availableGemstones.includes(gemstone)) return;
    setGemstone(availableGemstones[0]);
  }, [availableGemstones, gemstone, isGemstoneMode, setGemstone]);

  // A category that is no longer offered must not survive in state, or the
  // Category row renders with nothing highlighted while the stone still shows
  // as that type. Anything not in `availableStoneTypeOptions` is snapped to the first
  // option sharing its tab - so an old "Colored Natural" link opens as
  // "Colored Lab Grown" rather than as an unselectable ghost.
  useEffect(() => {
    if (isGemstoneMode) return;
    const isOffered = availableStoneTypeOptions.some(
      (option) => option.activeTab === activeStoneTab && option.diamondOrigin === selectedDiamondOrigin
    );
    if (isOffered) return;
    const fallback = availableStoneTypeOptions.find((option) => option.activeTab === activeStoneTab) || availableStoneTypeOptions[0];
    if (!fallback || fallback.diamondOrigin === selectedDiamondOrigin) return;
    setSelectedQuality({
      type: fallback.diamondOrigin,
      quality: selectedQuality?.quality || getDefaultQuality(parent),
    });
    setDiamondType(fallback.diamondOrigin);
  }, [
    activeStoneTab,
    availableStoneTypeOptions,
    isGemstoneMode,
    parent,
    selectedDiamondOrigin,
    selectedQuality?.quality,
    setDiamondType,
    setSelectedQuality,
  ]);

  useEffect(() => {
    if (!isDiamondPreviewFlow || isGemstoneMode || availableDiamondTypes.length === 0) return;
    if (availableDiamondTypes.includes(selectedDiamondOrigin)) return;

    const fallbackOrigin = availableDiamondTypes.includes("Lab") ? "Lab" : availableDiamondTypes[0];
    const nextSelectedQuality = {
      type: fallbackOrigin,
      quality: selectedQuality?.quality || getDefaultQuality(parent),
    };
    setSelectedQuality(nextSelectedQuality);
    setDiamondType(fallbackOrigin);
  }, [
    availableDiamondTypes,
    isDiamondPreviewFlow,
    isGemstoneMode,
    parent,
    selectedDiamondOrigin,
    selectedQuality?.quality,
    setDiamondType,
    setSelectedQuality,
  ]);

  useEffect(() => {
    if (!isDiamondPreviewFlow || isGemstoneMode || availableQualityLevels.length === 0) return;
    if (availableQualityLevels.includes(selectedQuality?.quality)) return;

    const nextSelectedQuality = {
      type: selectedQuality?.type || diamondType || "Lab",
      quality: availableQualityLevels[0],
    };

    setSelectedQuality(nextSelectedQuality);
  }, [
    availableQualityLevels,
    diamondType,
    isDiamondPreviewFlow,
    isGemstoneMode,
    selectedQuality?.quality,
    selectedQuality?.type,
    setSelectedQuality,
  ]);

  useEffect(() => {
    if (availableMatchingBandStyles.length === 0) {
      if (matchingBandQuantity > 0 || ringBand === "Yes") {
        setMatchingBandQuantity(0);
        setRingBand("No");
        applyRingPrice({
          nextRingBand: "No",
          nextMatchingBandQuantity: 0,
        });
      }
    } else if (matchingBandQuantity > 0 && !availableMatchingBandStyles.includes(ringMatchingBand)) {
      const fallbackStyle = availableMatchingBandStyles[0];
      setRingMatchingBand(fallbackStyle);
      applyRingPrice({
        nextMatchingBandStyle: fallbackStyle,
      });
    }
  }, [availableMatchingBandStyles, matchingBandQuantity, ringBand, ringMatchingBand]);

  useEffect(() => {
    const diamondPrice = calculateTheme3DiamondPrice();
    setStoneTotal(diamondPrice);
    setCaratP(diamondPrice);
    setDiamondCarat(Number(diamondSize || defaultCarat));
    setActiveDiamondSize(Number(diamondSize || defaultCarat));
    setFancyColorPrice(getColoredDiamondExtraPrice(parent, fancyDiamond));
    setGemstonePrice(getGemstoneExtraPrice(parent, gemstone));
    setIntensityPrice(getIntensityPrice(parent, fancyDiamondIntensity));
    // Keep local/demo preview pricing in sync with stone mode controls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isDiamondPreviewFlow,
    activeStoneTab,
    shape,
    diamondSize,
    selectedQuality,
    diamondType,
    fancyDiamond,
    fancyDiamondIntensity,
    gemstone,
    parent,
    priceConfigVersion,
  ]);

  // On first load and when store pricing config is ready/updated,
  // calculate the price of the currently selected setting and update totals.
  useEffect(() => {
    applyRingPrice({
      nextMetal: platinum ? "Platinum" : metal,
      metalPriceKey: platinum ? "Platinum" : metal,
      nextHead: ringHead,
      nextShank: ringShank,
      nextSideSetting: ringSideSetting,
      nextRingBand: ringBand,
      nextMatchingBandQuantity: matchingBandQuantity,
      nextEngraving: engraving,
      nextMatchingBandStyle: ringMatchingBand,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parent, priceConfigVersion, ringHead, ringShank]);

  useEffect(() => {
    if (ringSizeOptions.length > 0 && !ringSizeOptions.includes(String(ringSize))) {
      setRingSize(ringSizeOptions[0]);
    }
  }, [ringSizeOptions, ringSize, setRingSize]);

  useEffect(() => {
    setSizeMM(currentRingSizeMm);
    setOtherTotal(ringSizePrice);
  }, [currentRingSizeMm, ringSizePrice, setOtherTotal, setSizeMM]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ringSizeDropdownRef.current && !ringSizeDropdownRef.current.contains(event.target)) {
        setRingSizeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (copiedTooltipTimeoutRef.current) {
        clearTimeout(copiedTooltipTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (platinum || ["Titanium", "Silver", "Sterling Silver"].includes(metal) || availablePurities.includes(metal)) return;
    const fallbackPurity = availablePurities.includes("14K") ? "14K" : availablePurities[0];
    if (!fallbackPurity) return;
    setMetal(fallbackPurity);
    applyRingPrice({ nextMetal: fallbackPurity, metalPriceKey: fallbackPurity });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePurities, platinum, metal]);

  // Auto-switch metal color when the currently selected metal is not available for this store
  useEffect(() => {
    if (availableMetalColors.length === 0) return;
    const currentValue = resolveMetalColorValue({ ringColor, platinum, metal });
    const isCurrentAvailable = availableMetalColors.some((option) => option.value === currentValue);
    if (!isCurrentAvailable) {
      const firstAvailable = availableMetalColors[0];
      if (firstAvailable) handleMetalColor(firstAvailable);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableMetalColors]);

  useEffect(() => {
    if (!isDiamondPreviewFlow || isGemstoneMode) return;

    const spec = getQualitySpec(selectedQuality?.quality);
    if (!spec.colors.includes(diamondColorClarity)) {
      setDiamondColorClarity(spec.colors[0]);
    }
    if (!spec.cuts.includes(cut)) {
      setCut(spec.cuts[0]);
    }
    if (!spec.clarities.includes(clarity)) {
      setClarity(spec.clarities[0]);
    }
  }, [
    clarity,
    cut,
    diamondColorClarity,
    isDiamondPreviewFlow,
    isGemstoneMode,
    selectedQuality?.quality,
    setClarity,
    setCut,
    setDiamondColorClarity,
  ]);

  const handleCut = (nextCut) => {
    setCut(nextCut);
    setSummaryBlink(true);
  };

  const handleClarity = (nextClarity) => {
    setClarity(nextClarity);
    setSummaryBlink(true);
  };


  useEffect(() => {
    hasTheme3GuideInteractionStartedRef.current = false;
    lastTheme3GuideEventRef.current = "";
  }, [theme, flow]);

  useEffect(() => {
    if (theme !== "theme-3") return undefined;

    const panelScroll = theme3PanelScrollRef.current;
    const themeRoot = panelScroll?.closest(".theme3-root");
    if (!panelScroll || !themeRoot) return undefined;

    const updateActiveSection = () => {
      if (isProgrammaticTheme3ScrollRef.current) return;

      const { element: scrollContainer, isPage } = getTheme3ScrollContainer(panelScroll, themeRoot);
      const containerRect = isPage ? { top: 0 } : scrollContainer.getBoundingClientRect();
      const navHeight = themeRoot.querySelector(".theme3-section-nav")?.offsetHeight || 0;
      const markerTop =
        scrollContainer === panelScroll
          ? containerRect.top + 24
          : navHeight + 40;
      let nextSection = theme3Sections.find((section) => !section.disabled)?.id;

      theme3Sections.forEach((section) => {
        if (section.disabled) return;
        const element = theme3SectionRefs.current[section.id];
        if (element && element.getBoundingClientRect().top <= markerTop) {
          nextSection = section.id;
        }
      });

      const enabledSections = theme3Sections.filter((section) => !section.disabled);
      const isAtBottom = isPage
        ? window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3
        : scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 3;
      if (isAtBottom) nextSection = enabledSections[enabledSections.length - 1]?.id;

      const panelAtBottom = !isPage && scrollContainer === panelScroll &&
        panelScroll.scrollTop + panelScroll.clientHeight >= panelScroll.scrollHeight - 5;

      const panelAtTop = !isPage && scrollContainer === panelScroll &&
        panelScroll.scrollTop <= 5;

      wasAtPanelBottomRef.current = panelAtBottom;
      wasAtPanelTopRef.current = panelAtTop;

      if (nextSection) {
        if (nextSection !== "band" && engravingFocusRef.current) {
          setEngravingFocus(false);
          setCameraView("perspective");
        }
        onTheme3SectionChange?.(nextSection);
      }
    };

    let animationFrame = 0;
    const scheduleUpdate = () => {
      scheduleTheme3ProgrammaticScrollSettleRelease();
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateActiveSection);
    };
    const releaseProgrammaticScrollForManualInput = () => {
      if (!isProgrammaticTheme3ScrollRef.current) return;
      releaseTheme3ProgrammaticScrollLock({ keepTargetActive: false });
      scheduleUpdate();
    };

    panelScroll.addEventListener("scroll", scheduleUpdate, { passive: true });
    themeRoot.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    panelScroll.addEventListener("wheel", releaseProgrammaticScrollForManualInput, { passive: true });
    panelScroll.addEventListener("touchstart", releaseProgrammaticScrollForManualInput, { passive: true });
    scheduleUpdate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      panelScroll.removeEventListener("scroll", scheduleUpdate);
      themeRoot.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      panelScroll.removeEventListener("wheel", releaseProgrammaticScrollForManualInput);
      panelScroll.removeEventListener("touchstart", releaseProgrammaticScrollForManualInput);
      wasAtPanelBottomRef.current = false;
      wasAtPanelTopRef.current = false;
    };
  }, [theme, theme3Sections, onTheme3SectionChange, setEngravingFocus, setCameraView]);

  useEffect(() => {
    wasAtPanelBottomRef.current = false;
    wasAtPanelTopRef.current = false;
  }, [activeTab, diamondType]);

  useEffect(() => {
    if (theme !== "theme-3") return undefined;

    const panelScroll = theme3PanelScrollRef.current;
    const themeRoot = panelScroll?.closest(".theme3-root");
    if (!panelScroll || !themeRoot) return undefined;

    const isEmbedded = typeof window !== "undefined" && window.self !== window.top;
    if (!isEmbedded) return undefined;

    const handleWheel = (e) => {
      const atBottom = wasAtPanelBottomRef.current;
      const atTop = wasAtPanelTopRef.current;
      if (atBottom && e.deltaY > 0) {
        e.preventDefault();
        try { window.parent.postMessage({ type: "ring-configurator:scroll", deltaY: e.deltaY }, "*"); } catch {}
      } else if (atTop && e.deltaY < 0) {
        e.preventDefault();
        try { window.parent.postMessage({ type: "ring-configurator:scroll", deltaY: e.deltaY }, "*"); } catch {}
      }
    };

    let lastTouchY = null;
    const handleTouchStart = (e) => {
      const atBottom = wasAtPanelBottomRef.current;
      const atTop = wasAtPanelTopRef.current;
      if (!atBottom && !atTop) { lastTouchY = null; return; }
      lastTouchY = e.touches[0]?.clientY ?? null;
    };
    const handleTouchMove = (e) => {
      const atBottom = wasAtPanelBottomRef.current;
      const atTop = wasAtPanelTopRef.current;
      if ((!atBottom && !atTop) || lastTouchY === null) return;
      const currentY = e.touches[0]?.clientY;
      if (currentY == null) return;
      const delta = lastTouchY - currentY;
      if (atBottom && delta > 0) {
        e.preventDefault();
        lastTouchY = currentY;
        try { window.parent.postMessage({ type: "ring-configurator:scroll", deltaY: delta }, "*"); } catch {}
      } else if (atTop && delta < 0) {
        e.preventDefault();
        lastTouchY = currentY;
        try { window.parent.postMessage({ type: "ring-configurator:scroll", deltaY: delta }, "*"); } catch {}
      }
    };
    const handleTouchEnd = () => { lastTouchY = null; };

    panelScroll.addEventListener("wheel", handleWheel, { passive: false });
    panelScroll.addEventListener("touchstart", handleTouchStart, { passive: true });
    panelScroll.addEventListener("touchmove", handleTouchMove, { passive: false });
    panelScroll.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      panelScroll.removeEventListener("wheel", handleWheel);
      panelScroll.removeEventListener("touchstart", handleTouchStart);
      panelScroll.removeEventListener("touchmove", handleTouchMove);
      panelScroll.removeEventListener("touchend", handleTouchEnd);
    };
  }, [theme]);

  useEffect(() => {
    if (theme !== "theme-3") return undefined;

    const panelScroll = theme3PanelScrollRef.current;
    const themeRoot = panelScroll?.closest(".theme3-root");
    if (!panelScroll || !themeRoot) return undefined;

    const startFromScroll = () => {
      if (isProgrammaticTheme3ScrollRef.current) return;
      startTheme3GuideInteraction();
    };

    const startFromGuideTarget = (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      startTheme3GuideInteraction();

      const guideNode = target.closest("[data-theme3-guide]");
      if (!guideNode || !panelScroll.contains(guideNode)) return;
      emitTheme3GuideEvent(
        guideNode.getAttribute("data-theme3-guide"),
        guideNode.getAttribute("data-theme3-guide-section")
      );
    };

    panelScroll.addEventListener("scroll", startFromScroll, { passive: true });
    themeRoot.addEventListener("scroll", startFromScroll, { passive: true });
    panelScroll.addEventListener("pointerover", startFromGuideTarget, { passive: true });
    panelScroll.addEventListener("focusin", startFromGuideTarget);
    panelScroll.addEventListener("click", startFromGuideTarget);

    return () => {
      panelScroll.removeEventListener("scroll", startFromScroll);
      themeRoot.removeEventListener("scroll", startFromScroll);
      panelScroll.removeEventListener("pointerover", startFromGuideTarget);
      panelScroll.removeEventListener("focusin", startFromGuideTarget);
      panelScroll.removeEventListener("click", startFromGuideTarget);
    };
    // The listener uses the current Theme 3 context and delegates to data attributes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, flow, isDiamondPreviewFlow, activeStoneTab, isColoredMode, isGemstoneMode, parent]);

  useEffect(() => {
    if (theme !== "theme-3") return undefined;

    const panelScroll = theme3PanelScrollRef.current;
    const themeRoot = panelScroll?.closest(".theme3-root");
    if (!panelScroll || !themeRoot) return undefined;

    const guideNodes = Array.from(panelScroll.querySelectorAll("[data-theme3-guide]"))
      .filter((node) => {
        const feature = node.getAttribute("data-theme3-guide");
        return feature && (isDiamondPreviewFlow || !THEME3_STONE_GUIDE_FEATURES.has(feature));
      });

    if (guideNodes.length === 0) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      const firstFeature = guideNodes[0].getAttribute("data-theme3-guide");
      emitTheme3GuideEvent(firstFeature, guideNodes[0].getAttribute("data-theme3-guide-section"));
      return undefined;
    }

    const { element: scrollContainer, isPage } = getTheme3ScrollContainer(panelScroll, themeRoot);
    const observerRoot = isPage ? null : scrollContainer;
    const visibleEntries = new Map();
    let animationFrame = 0;

    const emitVisibleGuide = () => {
      const entries = Array.from(visibleEntries.values())
        .filter((entry) => entry.isIntersecting && entry.intersectionRatio > 0);
      if (entries.length === 0) return;

      const rootTop = observerRoot?.getBoundingClientRect().top ?? 0;
      const guideLine = rootTop + 72;
      entries.sort((a, b) => {
        const distanceA = Math.abs(a.boundingClientRect.top - guideLine);
        const distanceB = Math.abs(b.boundingClientRect.top - guideLine);
        if (Math.abs(distanceA - distanceB) > 8) return distanceA - distanceB;
        return b.intersectionRatio - a.intersectionRatio;
      });

      const node = entries[0].target;
      emitTheme3GuideEvent(
        node.getAttribute("data-theme3-guide"),
        node.getAttribute("data-theme3-guide-section")
      );
    };

    const scheduleEmit = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(emitVisibleGuide);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleEntries.set(entry.target, entry);
          } else {
            visibleEntries.delete(entry.target);
          }
        });
        scheduleEmit();
      },
      {
        root: observerRoot,
        rootMargin: "-8% 0px -48% 0px",
        threshold: [0.05, 0.15, 0.3, 0.5, 0.75, 1],
      }
    );

    guideNodes.forEach((node) => observer.observe(node));

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      visibleEntries.clear();
    };
    // Re-observe when conditional Theme 3 guide blocks appear/disappear.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, flow, isDiamondPreviewFlow, activeStoneTab, isColoredMode, isGemstoneMode, parent]);

  useEffect(() => () => {
    clearTheme3ProgrammaticScrollTimers();
    programmaticTheme3TargetSectionRef.current = "";
    window.clearTimeout(shareStatusTimeoutRef.current);
    if (resetTimeoutRef.current) window.clearTimeout(resetTimeoutRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolveTheme3ShareBaseUrl = () => {
    const resolvedParentUrl =
      parent ||
      window.__parentConfig?.parentUrl ||
      (window.self !== window.top ? document.referrer : "");

    if (resolvedParentUrl) {
      try {
        return new URL(resolvedParentUrl);
      } catch (error) {
        console.warn("Failed to parse parent/storefront URL:", resolvedParentUrl, error);
      }
    }

    return new URL(window.location.href);
  };

  const buildTheme3ShareUrl = () => {
    const url = resolveTheme3ShareBaseUrl();
    // The core URL now defaults to Theme 3 / 3B, so copied configuration
    // links stay clean and need only carry the encoded ring configuration.
    url.searchParams.delete("theme");
    url.searchParams.delete("flow");

    const config = {
      theme: "theme-3",
      flow,
      ringColor,
      headColor,
      metal,
      platinum,
      ringHead,
      headStyle,
      threestone,
      shapeList,
      ringShank,
      ringSideSetting,
      ringMatchingBand,
      ringBand,
      biMetal,
      sizeOption,
      ringSize,
      engraving,
      engravingFont,
      shape,
      diamondSize,
      selectedQuality,
      diamondType: selectedDiamondOrigin,
      activeTab,
      colorType,
      fancyDiamond,
      fancyDiamondIntensity,
      intensityPrice: getIntensityPrice(parent, fancyDiamondIntensity),
      gemstone,
      finalRingPrice: theme3DisplayTotal,
      stoneTotal,
      shankTotal,
      headTotal,
      diamondWiseDesignId,
      diamondWiseDesignLabel: selectedDiamondWiseDesign?.label || "",
      diamondWiseShankId: selectedDiamondWiseShank?.shankId || "",
      diamondWiseShankLabel: selectedDiamondWiseShank?.shankLabel || "",
      diamondWiseHeadId: selectedDiamondWiseDesign?.headId || "",
      diamondWiseHeadLabel: selectedDiamondWiseDesign?.headLabel || "",
      diamondWiseCenterStoneMesh: selectedDiamondWiseDesign?.centerStoneMesh || "",
      diamondWiseReferenceCarat: selectedDiamondWiseDesign?.referenceCarat || null,
    };

    url.searchParams.set("config", Base64.encode(JSON.stringify(config)));
    return url.toString();
  };

  const copyShareUrl = async (shareUrl) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = shareUrl;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!copied) throw new Error("Clipboard copy failed");
  };

  const handleTheme3Share = async () => {
    try {
      const shareUrl = buildTheme3ShareUrl();
      const isEmbeddedShare = typeof window !== "undefined" && window.self !== window.top;

      if (!isEmbeddedShare && navigator.share) {
        await navigator.share({
          title: "Jewelith Ring Configuration",
          url: shareUrl,
        });
        setShareStatus("Shared");
      } else {
        await copyShareUrl(shareUrl);
        setShareStatus("Copied");
      }
    } catch (error) {
      if (error?.name === "AbortError") return;

      try {
        const shareUrl = buildTheme3ShareUrl();
        await copyShareUrl(shareUrl);
        setShareStatus("Copied");
      } catch (copyError) {
        console.warn("Theme 3 share failed", error);
        console.warn("Theme 3 clipboard fallback failed", copyError);
        setShareStatus("Unable to share");
      }
    }

    window.clearTimeout(shareStatusTimeoutRef.current);
    shareStatusTimeoutRef.current = window.setTimeout(() => setShareStatus(""), 2200);
  };

  const handleTheme3SummaryArrowClick = () => {
    setIsSummaryExpanded((prev) => !prev);
  };

  useEffect(() => {
    if (!isSummaryExpanded) return undefined;

    const handleClickOutside = (event) => {
      const header = theme3HeaderRef.current;
      const footer = theme3FooterRef.current;
      const isInsideHeader = header && header.contains(event.target);
      const isInsideFooter = footer && footer.contains(event.target);
      if (!isInsideHeader && !isInsideFooter) {
        setIsSummaryExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSummaryExpanded]);

  const handleTheme3SectionClick = (sectionId) => {
    const section = theme3Sections.find((item) => item.id === sectionId);
    const target = theme3SectionRefs.current[sectionId];
    const panelScroll = theme3PanelScrollRef.current;
    const themeRoot = panelScroll?.closest(".theme3-root");
    if (!section || section.disabled || !target || !panelScroll || !themeRoot) return;

    if (sectionId !== "band") deactivateEngravingPreview();
    emitTheme3GuideEventAfterInteraction(THEME3_SECTION_GUIDE_FEATURE[sectionId], sectionId);

    const { element: scrollContainer, isPage } = getTheme3ScrollContainer(panelScroll, themeRoot);
    const containerRect = isPage ? { top: 0 } : scrollContainer.getBoundingClientRect();
    const navHeight = themeRoot.querySelector(".theme3-section-nav")?.offsetHeight || 0;
    const navOffset = scrollContainer === panelScroll ? 12 : navHeight + 12;
    const top = isPage
      ? window.scrollY + target.getBoundingClientRect().top - navOffset
      : scrollContainer.scrollTop + target.getBoundingClientRect().top - containerRect.top - navOffset;

    clearTheme3ProgrammaticScrollTimers();
    isProgrammaticTheme3ScrollRef.current = true;
    programmaticTheme3TargetSectionRef.current = sectionId;
    onTheme3SectionChange?.(sectionId);

    if (isPage) {
      window.scrollTo({ top, behavior: "smooth" });
    } else {
      scrollContainer.scrollTo({ top, behavior: "smooth" });
    }

    programmaticTheme3ScrollTimeoutRef.current = window.setTimeout(() => {
      releaseTheme3ProgrammaticScrollLock({ keepTargetActive: true });
    }, 1800);
    scheduleTheme3ProgrammaticScrollSettleRelease();
  };

  useImperativeHandle(ref, () => ({
    openResetPopup: handleReset,
    handleReset,
    scrollToTheme3Section: handleTheme3SectionClick,
  }));

  const handleContinue = () => {
    const payload = {
      type: "ring-configurator:continue",
      theme: "theme-3",
      flow,
      style: ringShank,
      styleLabel: displayStyleLabel,
      sideSetting: ringSideSetting,
      diamondWiseDesign: selectedDiamondWiseDesign
        ? {
            id: selectedDiamondWiseDesign.id,
            label: selectedDiamondWiseDesign.label,
            shankId: selectedDiamondWiseShank?.shankId || selectedDiamondWiseDesign.shankId,
            shankLabel: selectedDiamondWiseShank?.shankLabel || selectedDiamondWiseDesign.shankLabel,
            headId: selectedDiamondWiseDesign.headId,
            headLabel: selectedDiamondWiseDesign.headLabel,
            centerStoneMesh: selectedDiamondWiseDesign.centerStoneMesh,
            referenceCarat: selectedDiamondWiseDesign.referenceCarat,
            sourceFile: selectedDiamondWiseDesign.sourceFile,
            client: selectedDiamondWiseDesign.client,
          }
        : null,
      diamondWiseDesignId,
      diamondWiseDesignLabel: selectedDiamondWiseDesign?.label || "",
      diamondWiseShankId: selectedDiamondWiseShank?.shankId || "",
      diamondWiseShankLabel: selectedDiamondWiseShank?.shankLabel || "",
      diamondWiseHeadId: selectedDiamondWiseDesign?.headId || "",
      diamondWiseHeadLabel: selectedDiamondWiseDesign?.headLabel || "",
      diamondWiseCenterStoneMesh: selectedDiamondWiseDesign?.centerStoneMesh || "",
      diamondWiseReferenceCarat: selectedDiamondWiseDesign?.referenceCarat || null,
      shape,
      shapeLabel: displayShapeLabel,
      carat: Number(diamondSize || 0),
      stoneType: activeStoneTab,
      stoneTypeLabel: stoneTypeOptions.find((option) => option.activeTab === activeStoneTab && option.diamondOrigin === selectedDiamondOrigin)?.label || "Colorless Lab Grown",
      colorType,
      cut: isGemstoneMode ? null : cut,
      clarity: isGemstoneMode ? null : clarity,
      selectedQuality,
      diamondOrigin: isGemstoneMode ? null : selectedDiamondOrigin,
      diamondOriginLabel: isGemstoneMode ? null : selectedDiamondOriginLabel,
      fancyDiamond: isColoredMode ? fancyDiamond : null,
      fancyDiamondIntensity: isColoredMode ? fancyDiamondIntensity : null,
      gemstone: isGemstoneMode ? gemstone : null,
      setting: headStyle,
      settingLabel: displaySettingLabel,
      head: ringHead,
      metal,
      metalColor: selectedMetalColorOption.value,
      metalColorLabel: selectedMetalColorOption.label,
      metalPurity: activePurity,
      metalLabel: primaryMetalLabel,
      platinum: platinum || metal === "Platinum",
      biMetal: {
        enabled: biMetal === "Yes",
        headAccentMetal: biMetal === "Yes" ? selectedHeadMetalColorOption.value : selectedMetalColorOption.value,
        headAccentMetalLabel: biMetal === "Yes" ? selectedHeadMetalColorOption.label : selectedMetalColorOption.label,
      },
      ringSize: {
        system: sizeOption,
        systemLabel: selectedRingSizeSystem.shortName,
        size: ringSize,
        mm: currentRingSizeMm,
        price: ringSizePrice,
      },
      matchingBand: {
        enabled: ringBand === "Yes",
        quantity: matchingBandQuantity,
        style: ringMatchingBand || ringSideSetting,
        styleLabel: getMatchingBandDisplayLabel(ringMatchingBand || ringSideSetting),
      },
      engraving: {
        enabled: Boolean(engraving.trim()),
        text: engraving.trim(),
        font: engravingFont,
        fontLabel: getEngravingFontLabel(engravingFont),
        price: Number(engravingPrice || 0),
      },
      subtotal: settingSubtotal,
      diamondPreviewPrice,
      previewTotal: theme3DisplayTotal,
      currency: currencyCode || "USD",
    };

    if (window.self === window.top) {
      setContinueMessage(
        "Your setting is ready. Open this configurator inside Ring Builder to continue to diamond selection."
      );
      return;
    }

    const parentSource = document.referrer || parent;
    try {
      const targetOrigin = new URL(parentSource).origin;
      window.parent.postMessage(payload, targetOrigin);
      setContinueMessage("Setting sent to Ring Builder for diamond selection.");
    } catch (error) {
      console.warn("Unable to resolve a trusted Ring Builder origin.", error);
      setContinueMessage(
        "Unable to continue safely. Reload this configurator from the Ring Builder page."
      );
    }
  };

  const handleTheme3AddToCart = async () => {
    if (typeof window === "undefined" || isAddingTheme3ToCart) return;

    setIsAddingTheme3ToCart(true);

    let media = null;
    try {
      const canvas = document.querySelector(".theme3-preview-pane canvas");
      if (canvas) media = canvas.toDataURL("image/png");
    } catch (error) {
      console.warn("Canvas snapshot failed", error);
    }

    const shareUrl = buildTheme3ShareUrl();
    let modelPreviewUrl = shareUrl;
    try {
      const previewUrl = new URL(modelPreviewUrl);
      previewUrl.searchParams.set("preview", "model-only");
      modelPreviewUrl = previewUrl.toString();
    } catch (error) {
      console.warn("Failed to create model preview URL", error);
    }

    const stoneColorLabel = isColoredMode
      ? fancyDiamond
      : isGemstoneMode
        ? formatGemstoneLabel(gemstone)
        : "";
    const stoneOriginTypeLabel = isGemstoneMode
      ? "Gemstone"
      : selectedDiamondOrigin === "Natural"
        ? "Natural Diamond"
        : "Lab Diamond";
    const dwHeadLabel = selectedDiamondWiseDesign?.headLabel?.trim() || "";
    const dwShankLabel = (selectedDiamondWiseShank?.shankLabel || selectedDiamondWiseDesign?.shankLabel || "")?.trim();
    const ringTitle = selectedDiamondWiseDesign
      ? [
          (dwShankLabel || dwHeadLabel) && (dwShankLabel || dwHeadLabel),
          `${Number(diamondSize || 0).toFixed(2)} ct`,
          displayShapeLabel,
          stoneColorLabel,
          stoneOriginTypeLabel,
          primaryMetalLabel,
          "ring",
        ].filter(Boolean).join(" ")
      : [
          displayStyleLabel,
          displaySettingLabel,
          `${Number(diamondSize || 0).toFixed(2)} ct`,
          displayShapeLabel,
          stoneColorLabel,
          stoneOriginTypeLabel,
          primaryMetalLabel,
          "ring",
        ].filter(Boolean).join(" ");

    // This is the same ADD_TO_CART postMessage contract used by the existing
    // price-summary cart button, now available from the final Theme 3 footer.
    window.parent.postMessage(
      {
        type: "ADD_TO_CART",
        quantity: 1,
        Title: ringTitle,
        Description: "Custom engagement ring configuration",
        Price: theme3DisplayTotal,
        Category: "Engagement Ring",
        DiamondCategory: activeTab,
        DiamondCarat: diamondSize,
        DiamondIntensity: isColoredMode ? fancyDiamondIntensity : null,
        fancyDiamondIntensity: isColoredMode ? fancyDiamondIntensity : null,
        DiamondIntensityPrice: isColoredMode ? getIntensityPrice(parent, fancyDiamondIntensity) : null,
        intensityPrice: isColoredMode ? getIntensityPrice(parent, fancyDiamondIntensity) : null,
        MetalType: selectedMetalColorOption.label,
        Purity: activePurity,
        Engraving: engraving,
        EngravingFont: getEngravingFontLabel(engravingFont),
        RingSize: ringSize,
        Media: media,
        ModelPreviewUrl: modelPreviewUrl,
      },
      "*"
    );

    try {
      // Copy the shareable configured-ring URL as part of the Add to Cart action.
      await copyShareUrl(shareUrl);
    } catch (error) {
      console.warn("Failed to copy configuration URL", error);
    }
  };

  const handleTheme3Continue = () => {
    if (nextTheme3Section) {
      setContinueMessage("");
      handleTheme3SectionClick(nextTheme3Section.id);
      return;
    }

    handleTheme3AddToCart();
  };

  if (theme === "theme-3") {
    const engagementRingSubtotal = settingSubtotal - Number(matchingBandPrice || 0);
    const subtotalLabel = isDiamondPreviewFlow ? "Summary" : "Setting subtotal";
    const subtotalValue = isDiamondPreviewFlow ? theme3DisplayTotal : settingSubtotal;
    const engravingText = engraving.trim();
    const engravingSymbols = ENGRAVING_SYMBOLS.filter(({ symbol }) => engravingText.includes(symbol)).map(({ symbol }) => symbol);
    const shankSettingSubtotal = Number(shankTotal || 0) + ringSizePrice;
    const matchingBandValue =
      matchingBandQuantity > 0 ? `${matchingBandQuantity} band${matchingBandQuantity > 1 ? "s" : ""}` : "No matching band";
    const ringSizeValue = `${selectedRingSizeSystem.label} ${ringSize}`;
    const previewStoneTypeLabel =
      stoneTypeOptions.find((option) => option.activeTab === activeStoneTab && option.diamondOrigin === selectedDiamondOrigin)?.label || "Colorless Lab Grown";
    const previewStoneCarat = `${Number(diamondSize || 0).toFixed(2)} ct`;
    const renderSummaryRow = (label, value) => {
      if (value === null || value === undefined || value === "") return null;
      return (
        <div key={label}>
          <dt style={T3_SUBHEADER_STYLE}>{label}</dt>
          <dd style={T3_BODY_STYLE}>{value}</dd>
        </div>
      );
    };

    const summaryTaxLabel = getSummaryTaxLabel(parent);

    const summaryActionsContent = null;

    const buildSummaryContent = isSummaryExpanded ? (
            <section
              className="theme3-build-summary order-summary-card"
              aria-labelledby="theme3-summary-title"
              data-theme3-guide="build-summary"
              data-theme3-guide-section="summary"
              data-theme3-guide-label="Build Summary"
            >

              {isDiamondPreviewFlow ? (
                <>
                  {selectedDiamondWiseDesign ? (
                    <div className="order-summary-section">
                      <div className="order-summary-row">
                        <span className="order-summary-title">Ring</span>
                        {(Number(shankSettingSubtotal || 0) + Number(headTotal || 0)) > 0 && (
                          <span className="order-summary-price">
                            {formatStoreCurrency(Number(shankSettingSubtotal || 0) + Number(headTotal || 0), parent)}
                          </span>
                        )}
                      </div>
                      <div className="order-summary-desc">
                        {displayStyleLabel} · {selectedMetalColorOption.label === activePurity ? activePurity : `${selectedMetalColorOption.label} · ${activePurity}`}{biMetal === "Yes" ? ` · Bi-Metal ${selectedHeadMetalColorOption.label}` : ""}{matchingBandQuantity > 0 ? ` · ${getMatchingBandDisplayLabel(ringMatchingBand || ringSideSetting)}` : ""}
                      </div>
                      <div className="order-summary-desc">Size: {ringSizeValue}</div>
                      {engravingText && <div className="order-summary-desc">Engraving: "{engravingText}"</div>}
                    </div>
                  ) : (
                    <>
                      {!noHeadSelected && (
                        <div className="order-summary-section">
                          <div className="order-summary-row">
                            <span className="order-summary-title">Ring</span>
                            {Number(headTotal || 0) > 0 && (
                              <span className="order-summary-price">{formatStoreCurrency(Number(headTotal || 0), parent)}</span>
                            )}
                          </div>
                          <div className="order-summary-desc">
                            {displaySettingLabel}{biMetal === "Yes" ? ` · Bi-Metal ${selectedHeadMetalColorOption.label}` : ""}
                          </div>
                        </div>
                      )}

                      <div className="order-summary-section">
                        <div className="order-summary-row">
                          <span className="order-summary-title">Band</span>
                          {Number(shankSettingSubtotal || 0) > 0 && (
                            <span className="order-summary-price">{formatStoreCurrency(shankSettingSubtotal, parent)}</span>
                          )}
                        </div>
                        <div className="order-summary-desc">
                          {displayStyleLabel} · {selectedMetalColorOption.label === activePurity ? activePurity : `${selectedMetalColorOption.label} · ${activePurity}`}{matchingBandQuantity > 0 ? ` · ${getMatchingBandDisplayLabel(ringMatchingBand || ringSideSetting)}` : ""}
                        </div>
                        <div className="order-summary-desc">Size: {ringSizeValue}</div>
                        {engravingText && <div className="order-summary-desc">Engraving: "{engravingText}"</div>}
                      </div>
                    </>
                  )}

                  {!noHeadSelected && (
                  <div className="order-summary-section">
                    <div className="order-summary-row">
                      <span className="order-summary-title">Stone</span>
                      {Number(diamondPreviewPrice || 0) > 0 && <span className="order-summary-price">{formatStoreCurrency(diamondPreviewPrice, parent)}</span>}
                    </div>
                    <div className="order-summary-desc">
                      {[
                        // Read in the order the Stone panel asks for them:
                        // Shape, Carat, Category, Colour, Intensity, Quality.
                        // The line used to open with the colour, which put it
                        // two items away from its own intensity ("Blue ... Light")
                        // and in a different order from the controls above.
                        displayShapeLabel,
                        previewStoneCarat,
                        previewStoneTypeLabel,
                        // Nothing for colourless stones: the category label
                        // already says "Colorless Lab Grown" / "Colorless
                        // Natural". A fancy colour or a gemstone name is NOT in
                        // that label, so those still appear.
                        isColoredMode ? fancyDiamond : isGemstoneMode ? formatGemstoneLabel(gemstone) : null,
                        isColoredMode && fancyDiamondIntensity,
                        !isGemstoneMode && selectedQuality?.quality,
                      ].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  )}

                  <div className="order-summary-divider" />

                </>
              ) : (
                <>
                  {selectedDiamondWiseDesign ? (
                    <div className="order-summary-section">
                      <div className="order-summary-row">
                        <span className="order-summary-title">Ring</span>
                        {(Number(engagementRingSubtotal || 0) + Number(headTotal || 0)) > 0 && (
                          <span className="order-summary-price">
                            {formatStoreCurrency(Number(engagementRingSubtotal || 0) + Number(headTotal || 0), parent)}
                          </span>
                        )}
                      </div>
                      <div className="order-summary-desc">
                        {displayStyleLabel} · {selectedMetalColorOption.label === activePurity ? activePurity : `${selectedMetalColorOption.label} · ${activePurity}`}{biMetal === "Yes" ? ` · Bi-Metal ${selectedHeadMetalColorOption.label}` : ""}
                      </div>
                      <div className="order-summary-desc">Size: {selectedRingSizeSystem.label} {ringSize}</div>
                      {engraving && <div className="order-summary-desc">Engraving: "{engraving}"</div>}
                    </div>
                  ) : (
                    <>
                      {!noHeadSelected && (
                        <div className="order-summary-section">
                          <div className="order-summary-row">
                            <span className="order-summary-title">Ring</span>
                            {Number(headTotal || 0) > 0 && (
                              <span className="order-summary-price">{formatStoreCurrency(Number(headTotal || 0), parent)}</span>
                            )}
                          </div>
                          <div className="order-summary-desc">
                            {displaySettingLabel}{biMetal === "Yes" ? ` · Bi-Metal ${selectedHeadMetalColorOption.label}` : ""}
                          </div>
                        </div>
                      )}

                      <div className="order-summary-section">
                        <div className="order-summary-row">
                          <span className="order-summary-title">Band</span>
                          {Number(engagementRingSubtotal || 0) > 0 && (
                            <span className="order-summary-price">{formatStoreCurrency(engagementRingSubtotal, parent)}</span>
                          )}
                        </div>
                        <div className="order-summary-desc">{displayStyleLabel} · {selectedMetalColorOption.label === activePurity ? activePurity : `${selectedMetalColorOption.label} · ${activePurity}`}</div>
                        <div className="order-summary-desc">Size: {selectedRingSizeSystem.label} {ringSize}</div>
                        {engraving && <div className="order-summary-desc">Engraving: "{engraving}"</div>}
                      </div>
                    </>
                  )}

                  {!noHeadSelected && (
                  <div className="order-summary-section">
                    <div className="order-summary-row">
                      <span className="order-summary-title">Stone</span>
                      {Number(stoneTotal || 0) > 0 && <span className="order-summary-price">{formatStoreCurrency(stoneTotal, parent)}</span>}
                    </div>
                    <div className="order-summary-desc">
                      {[
                        // Same order as the diamond-preview flow above, so the
                        // two summaries do not describe a stone differently.
                        // This flow has no category label, so "Colorless" is
                        // the only thing naming the colour and it stays.
                        displayShapeLabel,
                        `${diamondSize}ct`,
                        !isGemstoneMode && selectedDiamondOriginLabel,
                        isColoredMode ? fancyDiamond : isGemstoneMode ? formatGemstoneLabel(gemstone) : "Colorless",
                        isColoredMode && fancyDiamondIntensity,
                        !isGemstoneMode && selectedQuality?.quality,
                      ].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  )}

                  <div className="order-summary-divider" />
                </>
              )}
            </section>
          
    ) : null;

return (
      <aside className="theme3-configurator-panel">
        <header className="theme3-panel-header" ref={theme3HeaderRef}>
          <div className="theme3-panel-suheader">

            <h2>RING CONFIGURATOR</h2>
            <h2>SUMMARY</h2>
          </div>
          {summaryActionsContent}
          {buildSummaryContent}
        </header>

        <div className="theme3-panel-scroll" ref={theme3PanelScrollRef}>
          {hasNoHeadCompatibility(parent) && (
            <div className="theme3-ring-type-header-row">
              <div className="theme3-ring-type-toggle" role="tablist" aria-label="Ring Type">
                <button
                  type="button"
                  role="tab"
                  aria-selected={!noHeadSelected}
                  className={`theme3-ring-type-btn ${!noHeadSelected ? "active" : ""}`}
                  onClick={() => {
                    if (noHeadSelected) handleNoHeadToggle();
                  }}
                >
                  Engagement
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={noHeadSelected}
                  className={`theme3-ring-type-btn ${noHeadSelected ? "active" : ""}`}
                  onClick={() => {
                    if (!noHeadSelected) handleNoHeadToggle();
                  }}
                >
                  Wedding
                </button>
              </div>
            </div>
          )}

          {!noHeadSelected && (
            <div
              className="theme3-option-section theme3-single-row-section"
              data-theme3-section="setting"
              ref={(node) => { theme3SectionRefs.current.setting = node; }}
            >
              <OptionRow
                title="Ring"
                guide="setting-head"
                maxOneRow={10}
                price={headTotal}
                parent={parent}
                hovered={hoveredHead}
                showHoverDelta={false}
                titleExtra={
                  <span className="theme3-ring-type-price">
                    {formatStoreCurrency(selectedHeadShankPrice, parent)}
                  </span>
                }
              >
                {availableHeadChoices.map(({ kind, value }) => kind === "diamondwise" ? (
                  <CardOption key={value.headId} active={ringHead === value.headId} label={value.headLabel} image={value.headImage || value.image} badge={demoOnlyBadge} className="theme3-image-option" onClick={() => handleDiamondWisePreset(value, "head")} onMouseEnter={() => handleDiamondWiseCardHover(value)} onMouseLeave={handleHeadCardLeave} delta={headDeltaMap[value.headId] ?? null} parent={parent} />
                ) : (
                  <CardOption key={value.label} active={!selectedDiamondWiseDesign && isSettingActive(value)} label={headLabels[value.head] || value.label} image={value.image} className="theme3-image-option" onClick={() => handleSetting(value)} disabled={isSettingDisabled(value)} onMouseEnter={() => handleHeadCardHover(value.head, headLabels[value.head] || value.label)} onMouseLeave={handleHeadCardLeave} delta={headDeltaMap[value.head] ?? null} parent={parent} />
                ))}
              </OptionRow>
            </div>
          )}

          <div
            className="theme3-option-section theme3-band-section"
            data-theme3-section="band"
            ref={(node) => { theme3SectionRefs.current.band = node; }}
          >
            {(noHeadSelected || availableShankChoices.length > 1) && (
            <OptionRow
              title="BAND"
              guide="band"
              className="theme3-band-style"
              maxOneRow={10}
              price={shankTotal}
              parent={parent}
              hovered={hoveredShank}
              showHoverDelta={false}
              titleExtra={
                noHeadSelected ? (
                  <span className="theme3-ring-type-price">
                    {formatStoreCurrency(selectedHeadShankPrice, parent)}
                  </span>
                ) : null
              }
            >
              {availableShankChoices.map(({ kind, value }) => kind === "diamondwise" ? (
                <CardOption key={value.shankId} active={ringShank === value.shankId} label={value.shankLabel} image={value.shankImage || value.image} badge={demoOnlyBadge} className="theme3-image-option" onClick={() => handleDiamondWisePreset(value, "shank")} onMouseEnter={() => handleDiamondWiseCardHover(value)} onMouseLeave={handleShankCardLeave} delta={shankDeltaMap[value.shankId] ?? null} parent={parent} />
              ) : (
                <CardOption key={value.shank} active={!selectedDiamondWiseDesign && ringShank === value.shank} label={shankLabels[value.shank] || value.label} image={value.image} className="theme3-image-option" onClick={() => handleStyle(value)} disabled={isStyleDisabled(value)} onMouseEnter={() => handleShankCardHover(value.shank, shankLabels[value.shank] || value.label, value.sideSetting)} onMouseLeave={handleShankCardLeave} delta={shankDeltaMap[value.shank] ?? null} parent={parent} />
              ))}
            </OptionRow>
            )}

            <OptionRow title="Metal" guide="metal-purity" className="theme3-band-metal" price={metalPrice} parent={parent} showHoverDelta={false}>
              {availableMetalColors.map((option) => {
                const metalDelta = metalColorDeltaMap[option.value] ?? null;
                const isActiveMetal = selectedMetalColorValue === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`gb-metal-option ${isActiveMetal ? "active" : ""}`}
                    onClick={() => handleMetalColor(option)}
                    title={option.label}
                    style={{
                      background: option.gradient || option.color,
                      backgroundColor: option.color,
                    }}
                  >
                    <small style={{T3_BODY_STYLE, fontWeight: 600, color: "#303030"}}>{option.label}</small>
                    <span className="gb-delta-label" style={{ display: "block", fontSize: "10px", fontWeight: 400, color: "#555", lineHeight: 1.2, marginTop: "2px"}}>
                      {!isActiveMetal && metalDelta !== null && metalDelta !== 0 ? `${metalDelta > 0 ? "+" : ""}${formatStoreCurrency(metalDelta, parent)}` : ""}
                    </span>
                  </button>
                );
              })}
            </OptionRow>

            {!platinum && !["Titanium", "Silver", "Sterling Silver"].includes(metal) && (
              <OptionRow title="Purity" guide="metal-purity" className="theme3-band-purity" price={metalPrice} parent={parent} showHoverDelta={false}>
                {availablePurities.map((option) => (
                  <TextOption
                    key={option}
                    active={activePurity === option}
                    label={option}
                    delta={getPurityDelta(option)}
                    parent={parent}
                    onClick={() => handlePurity(option)}
                    onMouseEnter={() => handlePurityHover(option)}
                    onMouseLeave={handlePurityLeave}
                  />
                ))}
              </OptionRow>
            )}<div
              className="theme3-ring-size-card"
              data-theme3-guide="ring-size"
              data-theme3-guide-section="band"
              data-theme3-guide-label="Ring Size"
              data-theme3-band-order="ring-size"
            >
              <div className="theme3-ring-size-header">
                <span style={T3_SUBHEADER_STYLE}>Ring Size</span>
              </div>
              <div className="custom-ring-size-wrapper" ref={ringSizeDropdownRef}>
                <button
                  type="button"
                  className={`custom-ring-size-trigger ${ringSizeOpen ? "active" : ""}`}
                  onClick={() => setRingSizeOpen(!ringSizeOpen)}
                >
                  <span>{selectedRingSizeSystem.label} {ringSize}</span>
                  <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                type="button"
                className="size-guide-link"
                onClick={() => window.open("/size-guide/size-guide-R9.pdf", "_blank")}
              >
                Size Guide
              </button>
                {ringSizeOpen && (
                  <div className="custom-ring-size-dropdown">
                    <div className="custom-ring-size-list">
                      {ringSizeOptions.map((option, i) => (
                        <button
                          key={option}
                          type="button"
                          className={`custom-ring-size-option ${String(ringSize) === option ? "selected" : ""}`}
                          onClick={() => handleRingSize(option)}
                        >
                          <span>{selectedRingSizeSystem.label} {option}</span>
                          <span className="custom-ring-size-mm">{selectedRingSizeSystem.mm[i]} mm</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
            </div>

            {!noHeadSelected && availableMatchingBandStyles.length > 0 && (
            <OptionRow
              title="Matching Band"
              guide="matching-band"
              className="theme3-matching-band"
              price={matchingBandPrice}
              parent={parent}
              showHoverDelta={false}
            >
              <TextOption
                active={matchingBandQuantity === 0}
                label="None"
                className="theme3-matching-band-none"
                onClick={() => handleMatchingBand(matchingBandOptions[0])}
              />
              {matchingBandOptions
                .filter((option) => option.quantity > 0 && availableMatchingBandStyles.includes(option.style))
                .map((option) => (
                  <CardOption
                    key={option.label}
                    active={matchingBandQuantity > 0 && ringMatchingBand === option.style}
                    label={getMatchingBandDisplayLabel(option.style)}
                    image={styleOptions.find((styleOption) => styleOption.shank === option.style)?.image}
                    className="theme3-image-option theme3-matching-band-option"
                    onClick={() => handleMatchingBand(option)}
                    disabled={isMatchingBandDisabled(option)}
                    delta={matchingBandDeltaMap[option.style] ?? null}
                    parent={parent}
                  />
                ))}
            </OptionRow>
            )}

            <div
              className="theme3-engraving-inline"
              data-theme3-guide="engraving"
              data-theme3-guide-section="band"
              data-theme3-guide-label="Engraving"
            >
              {isEngravingDisabledForShank && (
                <div className="theme3-model-note" role="note">
                  This band style doesn't have a plain inner surface, so engraving is unavailable for it.
                </div>
              )}
              <div className="theme3-engraving-controls">
                <label htmlFor="theme3-engraving-input">
                  <span style={T3_SUBHEADER_STYLE}>Engraving</span>
                </label>
                <div className="theme3-engraving-input-wrap">
                  <input
                    id="theme3-engraving-input"
                    ref={engravingInputRef}
                    type="text"
                    value={engraving}
                    onChange={handleEngravingChange}
                    onFocus={activateEngravingPreview}
                    onBlur={(event) => {
                      const controls = event.currentTarget.closest(".theme3-engraving-controls");
                      if (event.relatedTarget && controls?.contains(event.relatedTarget)) return;
                      deactivateEngravingPreview();
                    }}
                    placeholder="Enter up to 15 characters"
                    aria-describedby="theme3-engraving-help"
                    disabled={isEngravingDisabledForShank}
                    style={{
                      fontFamily: getEngravingFontOption(engravingFont)?.fontFamily,
                      fontStyle: getEngravingFontOption(engravingFont)?.fontStyle || "normal",
                    }}
                  />
                  <small className="theme3-engraving-count" style={{ ...T3_BODY_STYLE, fontWeight: 400 }}>{getAdjustedEngravingLength(engraving)} / {ENGRAVING_LIMIT}</small>
                  {engraving && (
                    <button
                      type="button"
                      className="theme3-engraving-clear-btn"
                      onClick={handleEngravingClear}
                      aria-label="Clear engraving"
                      tabIndex={-1}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="#303030" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>

                {engravingFocus && (
                  <>
                    <fieldset>
                      <legend>Font style</legend>
                      <div className="theme3-engraving-fonts">
                        {ENGRAVING_FONTS.map((font) => (
                          <button
                            key={font.value}
                            type="button"
                            className={engravingFont === font.value ? "active" : ""}
                            onClick={() => handleEngravingFont(font.value)}
                            aria-pressed={engravingFont === font.value}
                            disabled={isEngravingDisabledForShank}
                            style={{ fontFamily: font.fontFamily, fontStyle: font.fontStyle || "normal" }}
                          >
                            {font.label}
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    <fieldset>
                      <legend>Insert symbols</legend>
                      <div className="theme3-engraving-symbols">
                        {ENGRAVING_SYMBOLS.map(({ symbol, fontSize }) => (
                          <button
                            key={symbol}
                            type="button"
                            onClick={() => handleEngravingSymbol(symbol)}
                            aria-label={`Insert ${symbol} symbol`}
                            disabled={isEngravingDisabledForShank}
                            style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
                          >
                            {symbol}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  </>
                )}
              </div>
            </div>

{!noHeadSelected && (
<>
<OptionRow title="Bi-metal" guide="bi-metal" className="theme3-band-bimetal">
              <button
                type="button"
                className={`gb-metal-option gb-metal-option-bi ${biMetal !== "Yes" ? "active" : ""}`}
                onClick={() => handleBiMetalSelect("none")}
                disabled={platinum || ["Titanium", "Sterling Silver"].includes(metal)}
                style={{height: 42}}
              >
                <small style={T3_BODY_STYLE}>None</small>
              </button>
              {availableMetalColors
                .filter((option) => !option.platinum && !option.fixedPurity)
                .map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`gb-metal-option gb-metal-option-bi ${
                      biMetal === "Yes" && selectedHeadMetalColorValue === option.value ? "active" : ""
                    }`}
                    onClick={() => handleBiMetalSelect(option.value)}
                    disabled={platinum || ["Titanium", "Sterling Silver"].includes(metal)}
                    title={option.label}
                    style={{
                      background: option.gradient || option.color,
                      backgroundColor: option.color,
                    }}
                  >
                    <small style={T3_BODY_STYLE}>{option.label}</small>
                  </button>
                ))}
            </OptionRow>
</>
)}

            

          </div>
          {isDiamondPreviewFlow && !noHeadSelected && (
            <>


              <div
                className="theme3-option-section"
                data-theme3-section="shape"
                ref={(node) => { theme3SectionRefs.current.shape = node; }}
              >
                <section className="gb-option-row theme3-stone-row">
                  <div
                    className="gb-option-title"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBottom: 0,
                    }}
                  >
                    <span style={T3_SUBHEADER_STYLE}>Stone</span>
                    <span className="theme3-ring-type-price">
                      {formatStoreCurrency(selectedStonePrice, parent)}
                    </span>
                  </div>
                </section>

                <OptionRow title="Shape" guide="center-stone-shape" className="theme3-shape-grid" maxOneRow={6}>
                  {shapeOptions.filter((option) => {
                    if (!getAvailableOptions(parent, "diamondShapes").includes(option.value)) return false;
                    if (headStyle === "three-stone") return Boolean(THREE_STONE_SHAPE_TO_HEAD[option.value]);
                    return isShapeCompatible(parent, ringHead, option.value);
                  }).map((option) => (
                    <CardOption
                      key={option.value}
                      active={shape === option.value}
                      label={option.label}
                      image={option.image}
                      imageClassName={option.imageClassName}
                      spritePosition={option.spritePosition}
                      onClick={() => handleShape(option)}
                      disabled={isShapeDisabled(option.value)}
                      delta={shapeDeltaMap[option.value] ?? null}
                      parent={parent}
                    />
                  ))}
                </OptionRow>

<CaratOptionRow
  title="Carat"
  guide="target-carat"
  value={Number(diamondSize) || defaultCarat}
  onChange={handleCarat}
  stops={availableCaratSizes}
/>

                {availableStoneTypeOptions.length > 1 && (
                  <OptionRow title="Category" guide="stone-type" className="theme3-category-options" price={stoneTotal} parent={parent} showHoverDelta={false}>
                    {availableStoneTypeOptions.map((option) => (
                      <TextOption
                        key={option.activeTab + option.diamondOrigin}
                        active={activeStoneTab === option.activeTab && selectedDiamondOrigin === option.diamondOrigin}
                        label={option.label}
                        delta={getStoneCategoryDelta(option)}
                        parent={parent}
                        onClick={() => handleStoneType(option)}
                        onMouseEnter={() => handleStoneCategoryHover(option)}
                        onMouseLeave={handleStoneCategoryLeave}
                      />
                    ))}
                  </OptionRow>
                )}

                {isColoredMode && availableFancyDiamonds.length > 0 && (
                  <>
                    <OptionRow title="Colored Diamond" guide="colored-diamond" maxOneRow={COLORED_DIAMOND_MAX_ONE_ROW}>
                      {fancyDiamondSwatches.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`theme3-stone-swatch ${fancyDiamond === option ? "active" : ""}`}
                          onClick={() => handleFancyDiamond(option)}
                          title={option}
                        >
                          <span style={{ ...SPRITE_BG, backgroundPosition: SPRITE_POSITIONS[option] }} />
                          <span>{option}</span>
                        </button>
                      ))}
                    </OptionRow>

                    <OptionRow title="Intensity" guide="colored-diamond">
                      {intensityOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`theme3-stone-swatch ${fancyDiamondIntensity === option ? "active" : ""}`}
                          onClick={() => handleFancyDiamondIntensity(option)}
                          title={option}
                        >
                          <span style={getIntensitySwatchStyle(fancyDiamond, option)} />
                          <span>{option}</span>
                        </button>
                      ))}
                    </OptionRow>
                  </>
                )}

                {isGemstoneMode && availableGemstones.length > 0 && (
                  <OptionRow title="Gemstone" guide="gemstone" maxOneRow={8}>
                    {availableGemstones.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`theme3-stone-swatch ${gemstone === option ? "active" : ""}`}
                        onClick={() => handleGemstone(option)}
                        title={formatGemstoneLabel(option)}
                      >
                        <span style={{ ...SPRITE_BG, backgroundPosition: SPRITE_POSITIONS[option] }} />
                        <span>{formatGemstoneLabel(option)}</span>
                      </button>
                    ))}
                  </OptionRow>
                )}

                {!isGemstoneMode && availableQualityLevels.length > 0 && (
                  <OptionRow title="Quality" guide="cut-clarity" className="theme3-quality-options" price={stoneTotal} parent={parent} showHoverDelta={false}>
                    {availableQualityLevels.map((option) => (
                      <TextOption
                        key={option}
                        active={selectedQuality?.quality === option}
                        label={qualityClarities[option] ? (
                          <span className="quality-option-label">
                            <span>{option}</span>
                            <span>({qualityClarities[option]})</span>
                          </span>
                        ) : option}
                        delta={getQualityDelta(option)}
                        parent={parent}
                        onClick={() => handleDiamondQuality(option)}
                        onMouseEnter={() => handleQualityHover(option)}
                        onMouseLeave={handleQualityLeave}
                      />
                    ))}
                  </OptionRow>
                )}

                {!isGemstoneMode && (
                  <>
                  </>
                )}
              </div>
            </>
          )}
          
        </div>

        <footer className="theme3-panel-footer" ref={theme3FooterRef}>
          <div className="theme3-footer-build-summary">
            {buildSummaryContent}
          </div>

          <div className="theme3-footer-main">
            <div className="theme3-summary-info">
              <button
                type="button"
                className="theme3-summary-details-toggle"
                aria-label={isSummaryExpanded ? "Hide details" : "View details"}
                aria-expanded={isSummaryExpanded}
                onClick={handleTheme3SummaryArrowClick}
              >
                <span>View details</span>
                <svg
                  className={`theme3-summary-toggle-arrow${isSummaryExpanded ? " is-expanded" : ""}`}
                  xmlns="http://www.w3.org/2000/svg"
                  width="8"
                  height="5"
                  viewBox="0 0 8 5"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M8 4.29102C8 4.40075 7.95549 4.5005 7.86648 4.5803C7.68846 4.7399 7.38804 4.7399 7.21001 4.5803L4.00556 1.70748L0.789986 4.5803C0.611961 4.7399 0.311544 4.7399 0.133519 4.5803C-0.0445063 4.4207 -0.0445063 4.15137 0.133519 3.99177L3.67177 0.819701C3.84979 0.660101 4.15021 0.660101 4.32823 0.819701L7.86648 3.99177C7.95549 4.07157 8 4.1813 8 4.28105V4.29102Z"
                    fill="currentColor"
                  />
                </svg>
              </button>

              <div className="theme3-summary-price-row">
                <strong className="theme3-summary-price">
                  {formatStoreCurrency(subtotalValue, parent)}
                </strong>
                <span className="theme3-summary-tax-label">
                  {summaryTaxLabel ? (summaryTaxLabel.startsWith("+") ? `+ ${summaryTaxLabel.slice(1).trim()}` : summaryTaxLabel) : null}
                </span>
              </div>
            </div>

            <div className="theme3-footer-actions">
              <button
                type="button"
                className="theme3-panel-footer-cta"
                disabled={isAddingTheme3ToCart}
                onMouseEnter={() => emitTheme3GuideEventAfterInteraction(THEME3_SECTION_GUIDE_FEATURE[activeTheme3SectionId] || "choose-diamond", activeTheme3SectionId || "continue")}
                onFocus={() => emitTheme3GuideEventAfterInteraction(THEME3_SECTION_GUIDE_FEATURE[activeTheme3SectionId] || "choose-diamond", activeTheme3SectionId || "continue")}
                onClick={() => {
                  emitTheme3GuideEventAfterInteraction(THEME3_SECTION_GUIDE_FEATURE[activeTheme3SectionId] || "choose-diamond", activeTheme3SectionId || "continue");
                  handleTheme3Continue();
                }}
              >
                {theme3FooterLabel}
              </button>

              <div className="theme3-panel-action-wrapper">
                <button
                  type="button"
                  className="theme3-panel-action-btn theme3-panel-share-btn"
                  onClick={handleShareClick}
                  aria-label="Share configuration"
                >
                  Share
                </button>
                {showCopiedTooltip && <span className="theme3-share-tooltip">URL Copied</span>}
              </div>
            </div>
          </div>

          <p className="theme3-continue-status" role="status" aria-live="polite">
            {continueMessage}
          </p>
        </footer>
        {showNaturalDiamondNotice && (
          <div
            className="diamondwise-natural-notice-backdrop"
            role="presentation"
            onMouseDown={() => setShowNaturalDiamondNotice(false)}
          >
            <section
              className="diamondwise-natural-notice"
              role="dialog"
              aria-modal="true"
              aria-labelledby="diamondwise-natural-notice-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="diamondwise-natural-notice-close"
                aria-label="Close natural diamond notice"
                onClick={() => setShowNaturalDiamondNotice(false)}
              >
                ×
              </button>
              <h2 id="diamondwise-natural-notice-title">
                <img className="diamondwise-natural-notice-icon" src="/images/famicons_diamond-outline.svg" alt="" />
                Natural diamonds are priced by our team
              </h2>
              <p>Natural diamond orders cannot be placed through the Ring Builder system.</p>
              <p>Please reach out to our team at <a href="tel:+12254008189">(225) 400-8189</a> for natural diamond jewelry prices on custom build pieces.</p>
              <a className="diamondwise-natural-notice-call" href="tel:+12254008189">Call Us</a>
              <button type="button" className="diamondwise-natural-notice-switch" onClick={handleSwitchToLabGrown}>
                Switch to Lab Grown
              </button>
            </section>
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside className="gb-configurator-panel">
      {styleOptions.filter((option) => isHeadCompatible(parent, option.shank, compatibilityHead)).length > 1 && (
      <OptionRow title="Ring Style & Design">
        {styleOptions.filter((option) => isHeadCompatible(parent, option.shank, compatibilityHead)).map((option) => (
          <CardOption
            key={option.shank}
            active={ringShank === option.shank}
            label={shankLabels[option.shank] || option.label}
            image={option.image}
            onClick={() => handleStyle(option)}
            disabled={isStyleDisabled(option)}
          />
        ))}
      </OptionRow>
      )}

      {!noHeadSelected && (
        <OptionRow title="Shape">
          {shapeOptions.filter((option) => getAvailableOptions(parent, "diamondShapes").includes(option.value) && isShapeCompatible(parent, ringHead, option.value)).map((option) => (
            <CardOption
              key={option.value}
              active={shape === option.value}
              label={option.label}
              image={option.image}
              imageClassName={option.imageClassName}
              spritePosition={option.spritePosition}
              onClick={() => handleShape(option)}
              disabled={isShapeDisabled(option.value)}
              delta={shapeDeltaMap[option.value] ?? null}
              parent={parent}
            />
          ))}
        </OptionRow>
      )}

      {!noHeadSelected && (
        <CaratOptionRow
          title="Carat"
          value={Number(diamondSize) || defaultCarat}
          onChange={handleCarat}
          stops={availableCaratSizes}
        />
      )}

      <OptionRow
        title="Setting"
        titleExtra={hasNoHeadCompatibility(parent) ? (
          <div className="theme3-ring-type-toggle" role="tablist" aria-label="Ring Type">
            <button
              type="button"
              role="tab"
              aria-selected={!noHeadSelected}
              className={`theme3-ring-type-btn ${!noHeadSelected ? "active" : ""}`}
              onClick={() => {
                if (noHeadSelected) handleNoHeadToggle();
              }}
            >
              Engagement
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={noHeadSelected}
              className={`theme3-ring-type-btn ${noHeadSelected ? "active" : ""}`}
              onClick={() => {
                if (!noHeadSelected) handleNoHeadToggle();
              }}
            >
              Wedding
            </button>
          </div>
        ) : null}
      >
        {!noHeadSelected && settingOptions.map((option) => (
          <CardOption
            key={option.label}
            active={isSettingActive(option)}
            label={headLabels[option.head] || option.label}
            image={option.image}
            onClick={() => handleSetting(option)}
            disabled={isSettingDisabled(option)}
          />
        ))}
      </OptionRow>

      <OptionRow title="Ring Metal">
        {metalOptions.map((option) => (
          <button
            key={option.label}
            type="button"
            className={`gb-metal-option ${
              option.platinum
                ? (platinum || metal === "Platinum" ? "active" : "")
                : (option.fixedPurity ? (metal === option.fixedPurity ? "active" : "") : (primaryMetalLabel === option.label ? "active" : ""))
            }`}
            onClick={() => handleMetal(option)}
            title={option.label}
          >
            <span style={{ background: option.gradient || option.color, backgroundColor: option.color }} />
            <b>{["PL", "TI", "SL"].includes(option.label) ? option.label : option.label.split(" ")[0]}</b>
          </button>
        ))}
      </OptionRow>

      <div className="gb-bottom-panel">
        {!noHeadSelected && availableMatchingBandStyles.length > 0 && (
          <OptionRow title="Matching Band">
            {matchingBandOptions
              .filter((option) => option.quantity === 0 || availableMatchingBandStyles.includes(option.style))
              .map((option) => (
                <TextOption
                  key={option.label}
                  active={option.quantity === 0 ? matchingBandQuantity === 0 : (matchingBandQuantity > 0 && ringMatchingBand === option.style)}
                  label={getMatchingBandDisplayLabel(option.style)}
                  onClick={() => handleMatchingBand(option)}
                  disabled={option.quantity > 0 && isMatchingBandDisabled(option)}
                />
              ))}
          </OptionRow>
        )}

        <div className="gb-price-summary">
          <div><span>{noHeadSelected ? "Ring Shank" : "Engagement Ring"}</span><b>{formatStoreCurrency(Number(shankTotal || 0) + (noHeadSelected ? 0 : Number(headTotal || 0)) - Number(matchingBandPrice || 0), parent)}</b></div>
          {matchingBandQuantity > 0 && availableMatchingBandStyles.length > 0 && (
            <div><span>Matching Band ({getMatchingBandDisplayLabel(ringMatchingBand)})</span><b>{formatStoreCurrency(Number(matchingBandPrice || 0), parent)}</b></div>
          )}
          {!noHeadSelected && <div><span>Diamond</span><b>{formatStoreCurrency(Number(stoneTotal || 0), parent)}</b></div>}
          <div className="total"><span>Total</span><b>{formatStoreCurrency(total, parent)}</b></div>
          <button type="button">Next</button>
          <p>Diamond price is local demo pricing for this standalone page.</p>
        </div>
      </div>
    </aside>
  );
});

RingCustomizer.displayName = "RingCustomizer";

export default RingCustomizer;
