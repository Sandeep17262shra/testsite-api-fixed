/**
 * storePriceHelper.js
 *
 * Helper functions to get prices with currency conversion applied.
 * This combines priceConfig.js with Parentconfig.js
 *
 * NOTE: No logic changes here vs. before. priceConfig.js now reads its data
 * from a fetched/cached source (JSON today, real API later) instead of a
 * hardcoded object, but exposes the exact same synchronous functions, so
 * everything below keeps working unmodified. Just make sure `initPriceConfig()`
 * (re-exported below) has resolved before the configurator renders.
 */

import {
  formatStoreCurrency,
  getCurrencyRate,
  getStoreCurrencyCode,
  getStoreLanguage,
  getStoreLocale,
} from './Parentconfig.js';
import { getStorePriceConfig, getPrice as getRawPrice, getAvailableOptions, getBandWidthPrice as getRawBandWidthPrice, getSideStoneCarat as getRawSideStoneCarat, isOptionAvailable, isJDemo364ParentUrl } from '../priceConfig.js';
import { DIAMONDWISE_DESIGNS } from '../data/diamondwiseDesigns.js';

/**
 * Get a price with currency conversion applied
 * @param {string|null} parentUrl - The parent URL identifier
 * @param {string} category - Price category (e.g., 'metalPrices', 'shankPrices')
 * @param {string} item - Specific item (e.g., '14K', 'PLAIN')
 * @returns {number} - The price with currency conversion applied
 */
export const getConvertedPrice = (parentUrl, category, item) => {
  const rawPrice = getRawPrice(parentUrl, category, item);
  const rate = getCurrencyRate(parentUrl);
  return Math.round(rawPrice * rate);
};

/**
 * Get metal price with currency conversion
 */
export const getMetalPrice = (parentUrl, purity) => {
  return getConvertedPrice(parentUrl, 'metalPrices', purity);
};

/**
 * Get shank style price with currency conversion
 */
export const getShankPrice = (parentUrl, style) => {
  return getConvertedPrice(parentUrl, 'shankPrices', style);
};

/**
 * Get head style price with currency conversion.
 * Three-stone heads (OVAL, TRAPEZOID, HALF-MOON, PEAR, BAGUETTE, THREE-STONE)
 * are represented in the API by H008 ("Oval"). When a three-stone variant
 * (e.g. HALF-MOON for round center stone) is queried, fall back to OVAL (H008)
 * price so the Three Stone head price is always added correctly.
 */
const THREE_STONE_HEAD_LABELS = new Set(["OVAL", "TRAPEZOID", "HALF-MOON", "PEAR", "BAGUETTE", "ROUND", "THREE-STONE"]);
export const getHeadPrice = (parentUrl, style) => {
  const normStyle = String(style || "").toUpperCase();
  const price = getConvertedPrice(parentUrl, 'headPrices', style);
  if ((!price || price === 0) && THREE_STONE_HEAD_LABELS.has(normStyle)) {
    const ovalPrice = getConvertedPrice(parentUrl, 'headPrices', 'OVAL');
    if (ovalPrice > 0) return ovalPrice;
  }
  return price;
};

/**
 * Get side stone style price with currency conversion
 */
export const getSideStonePrice = (parentUrl, style) => {
  if (!style) return 0;
  const raw = String(style).trim();
  const lower = raw.toLowerCase();
  const upper = raw.toUpperCase();
  const price = getConvertedPrice(parentUrl, 'sideStonePrices', lower);
  if (price > 0) return price;
  const upperPrice = getConvertedPrice(parentUrl, 'sideStonePrices', upper);
  if (upperPrice > 0) return upperPrice;
  return price || 0;
};

/**
 * Get matching band price with currency conversion
 */
export const getMatchingBandPrice = (parentUrl, style) => {
  return getConvertedPrice(parentUrl, 'matchingBandPrices', style);
};

export const getBandWidthPrice = (parentUrl, width) => {
  return Math.round(getRawBandWidthPrice(parentUrl, width) * getCurrencyRate(parentUrl));
};

export const getSideStoneCarat = (parentUrl, productType, style) =>
  getRawSideStoneCarat(parentUrl, productType, style);

/**
 * Get diamond price with currency conversion
 * @param {string|null} parentUrl - The parent URL identifier
 * @param {number} carat - Diamond carat size
 * @param {string} quality - Quality level (Standard, Premium, High-End)
 * @param {string} type - Diamond type (Lab or Natural)
 * @returns {number} - The price with currency conversion applied
 */
export const getDiamondPrice = (parentUrl, carat, quality, type = 'Lab', shape) => {
  const config = getStorePriceConfig(parentUrl);
  const priceTable = type === 'Natural' ? config.naturalDiamondPrices : config.labDiamondPrices;
  const rate = getCurrencyRate(parentUrl);

  const numCarat = Number(carat) || 1;
  const exactKey = String(numCarat);

  const shapePrice = Number(config.shapePrices?.[shape] ?? 0);
  if (priceTable[exactKey]?.[quality] !== undefined) {
    return Math.round((priceTable[exactKey][quality] + shapePrice) * rate);
  }

  // Linear interpolation for in-between fractional carat points:
  // e.g. if 1ct = 1000 and 2ct = 2000 (gap = 1000), 1.25ct = 1250, 1.5ct = 1500, 1.75ct = 1750
  let rawPrice = 0;
  if (numCarat < 1) {
    const p1 = priceTable['1']?.[quality] ?? 0;
    rawPrice = numCarat * p1;
  } else {
    const lower = Math.floor(numCarat);
    const upper = lower + 1;
    const pLower = priceTable[String(lower)]?.[quality] ?? 0;
    const pUpper =
      priceTable[String(upper)]?.[quality] ??
      (pLower + (pLower - (priceTable[String(lower - 1)]?.[quality] ?? 0)));
    const fraction = numCarat - lower;
    rawPrice = pLower + fraction * (pUpper - pLower);
  }

  return Math.round((rawPrice + shapePrice) * rate);
};

/**
 * Get engraving price with currency conversion
 */
export const getEngravingPrice = (parentUrl) => {
  const config = getStorePriceConfig(parentUrl);
  const rate = getCurrencyRate(parentUrl);
  return Math.round(config.engravingPrice * rate);
};

/**
 * Filter available options based on store configuration
 * @param {Array} allOptions - Array of all possible options
 * @param {string|null} parentUrl - The parent URL identifier
 * @param {string} optionType - Type of options to filter
 * @returns {Array} - Filtered array of available options
 */
export const filterAvailableOptions = (allOptions, parentUrl, optionType) => {
  const options = getAvailableOptions(parentUrl, optionType);
  // Older panels still use their internal style keys while the API returns
  // stable catalogue values. Keep that boundary here so every panel reads the
  // same store response instead of maintaining its own conversion table.
  const aliases = {
    headStyles: {
      plain: "4-PRONG", "hidden-halo": "HIDDEN-HALO", "hidden-halo-2": "HIDDEN-HALO-2", "single-halo": "HALO",
      "double-halo": "DOUBLE-HALO", bezel: "BEZEL", halo: "HALO", "three-stone": "OVAL",
      tulip: "TULIP", "two-stone": "TWO-STONE", "claw-set": "CLAW-SET",
    },
  };
  const filtered = allOptions.filter((option) => options.includes(aliases[optionType]?.[option] ?? option));
  if (optionType === "headStyles" && isJDemo364ParentUrl(parentUrl)) {
    const isDw = (opt) => String(opt).startsWith("dw-") || DIAMONDWISE_DESIGNS.some((d) => d.headId === opt);
    return [...filtered.filter(isDw), ...filtered.filter((opt) => !isDw(opt))];
  }
  return filtered;
};

export const getDefaultQuality = (parentUrl) => {
  const availableQualities = getAvailableOptions(parentUrl, "qualityLevels");
  return availableQualities[0] || "Standard";
};

/**
 * Get extra price for a colored diamond with currency conversion.
 * Added on top of the base diamond price when a colored diamond is selected.
 */
export const getColoredDiamondExtraPrice = (parentUrl, color) => {
  const config = getStorePriceConfig(parentUrl);
  const rate = getCurrencyRate(parentUrl);
  const rawPrice = config.coloredDiamondExtraPrices?.[color] ?? 0;
  return Math.round(rawPrice * rate);
};

/**
 * Get extra price for a gemstone with currency conversion.
 * Added on top of the base diamond price when a gemstone is selected.
 */
export const getGemstoneExtraPrice = (parentUrl, gemstone) => {
  const config = getStorePriceConfig(parentUrl);
  const rate = getCurrencyRate(parentUrl);
  const rawPrice = config.gemstoneExtraPrices?.[gemstone] ?? 0;
  return Math.round(rawPrice * rate);
};

export const INTENSITY_OPTIONS = ["Light", "Fancy", "Intense", "Vivid", "Deep", "Dark"];

/**
 * Get diamond intensity price with currency conversion
 * @param {string|null} parentUrl - The parent URL identifier
 * @param {string} intensity - Intensity option ("Light", "Fancy", "Intense", "Vivid", "Deep", "Dark")
 * @returns {number} - The price with currency conversion applied
 */
export const getIntensityPrice = (parentUrl, intensity) => {
  return 0;
};

/**
 * Get available carat sizes for a store and diamond type
 * @param {string|null} parentUrl - The parent URL identifier
 * @param {string} [diamondType='Lab'] - Diamond type ('Lab' or 'Natural')
 * @returns {Array<number>} - Array of available carat sizes sorted ascending
 */
export const getAvailableCaratSizes = (parentUrl, diamondType = "Lab") => {
  const normType = String(diamondType || "Lab").toLowerCase() === "natural" ? "Natural" : "Lab";
  const config = getStorePriceConfig(parentUrl);

  // 1. Check caratSizesByOrigin for this specific diamond type
  const byOrigin = config.availableOptions?.caratSizesByOrigin?.[normType];
  if (Array.isArray(byOrigin) && byOrigin.length > 0) {
    return byOrigin.map(Number).filter((n) => !isNaN(n) && n > 0).sort((a, b) => a - b);
  }

  // 2. Check price table keys for this specific diamond type
  const priceTable = normType === "Natural" ? config.naturalDiamondPrices : config.labDiamondPrices;
  const tableKeys = Object.keys(priceTable || {})
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0)
    .sort((a, b) => a - b);
  if (tableKeys.length > 0) {
    return tableKeys;
  }

  // 3. Check general caratSizes in availableOptions
  const options = getAvailableOptions(parentUrl, "caratSizes");
  if (Array.isArray(options) && options.length > 0) {
    return options.map(Number).filter((n) => !isNaN(n) && n > 0).sort((a, b) => a - b);
  }

  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
};

/**
 * Get default diamond carat (smallest available carat size) for a store and diamond type
 * @param {string|null} parentUrl - The parent URL identifier
 * @param {string} [diamondType='Lab'] - Diamond type ('Lab' or 'Natural')
 * @returns {number} - Smallest available carat size
 */
export const getDefaultCarat = (parentUrl, diamondType = "Lab") => {
  const sizes = getAvailableCaratSizes(parentUrl, diamondType);
  return sizes.length > 0 ? sizes[0] : 1;
};

// Re-export for convenience
export {
  formatStoreCurrency,
  getAvailableOptions,
  getStoreCurrencyCode,
  getStoreLanguage,
  getStoreLocale,
  isOptionAvailable,
  getStorePriceConfig,
};

// Re-export the loader here too, so callers who already import from
// storePriceHelper.js don't need a second import from priceConfig.js.
export { initPriceConfig, isPriceConfigReady, refreshPriceConfig, getPriceConfigError } from '../priceConfig.js';
