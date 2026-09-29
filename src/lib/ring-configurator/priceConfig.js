/**
 * Store catalogue adapter.
 *
 * The pricing endpoint returns one catalogue for the requested store:
 * `{ components: [], pricingRules: [] }`. This module is the only place
 * that translates that API format into the labels used by the existing UI.
 */
import { getConfigCache } from "./priceApiClient.js";
import staticPriceData from "../../../public/data/price-config-data.json";
import { SHAPE_BY_ID, COLORED_DIAMOND_BY_ID, GEMSTONE_BY_ID, getProductById } from "./data/productIds.js";

export const isDiamondWiseParentUrl = (parentUrl) => {
  const value = String(parentUrl ?? "").toLowerCase();
  return value.includes("diamondwise") || value.includes("jdemo364.wpenginepowered");
};

const STORE_KEY_MAP = {
  "anelladiamonds.com": "anelladiamond",
  bongioielli: "bongioielli",
  bonguilli: "bongioielli",
  dimendscaasi: "dimendscaasi",
  dimensacci: "dimendscaasi",
  elitejewelers: "elitejewelers",
  elite: "elitejewelers",
  labgrownlove: "labgrownlove",
  diamondwise: "diamondwise",
  "jewelith-pricing-test.myshopify.com": "jewelith-pricing-test",
  jewelith: "jewelith",
  "apps.keyideasinfotech.com": "jewelith",
  demostore: "default",
};

export const getStoreKey = (parentUrl) => {
  if (isDiamondWiseParentUrl(parentUrl)) return "diamondwise";
  const value = String(parentUrl ?? "").toLowerCase();
  return Object.entries(STORE_KEY_MAP).find(([pattern]) => value.includes(pattern))?.[1] ?? "default";
};

const FALLBACK_OPTIONS = {
  metalColors: ["White Gold", "Yellow Gold", "Rose Gold", "Platinum", "Titanium", "Sterling Silver"],
  metalPurities: ["9K", "10K", "14K", "18K"],
  shankStyles: ["PLAIN", "PLATE-PRONG", "KNIFE-EDGE", "CHANNEL", "CATHEDRAL", "SPLIT", "TWISTED", "WIDE-PLAIN", "FRENCH-PAVE", "PAVE-STONES", "8-STONES", "MULTI-ROW", "TWISTED-2", "FLUTED", "BRAIDED", "CATHEDRAL-SIDE-STONE", "SIDE-BEZEL-STONES"],
  headStyles: ["4-PRONG", "6-PRONG", "HIDDEN-HALO", "DOUBLE-HALO", "BEZEL", "HALO", "OVAL", "TULIP", "TWO-STONE"],
  matchingBandStyles: ["PLAIN", "CATHEDRAL", "KNIFE-EDGE", "SPLIT", "CHANNEL", "PLATE-PRONG"],
  diamondShapes: ["round", "pear", "princess", "emerald", "cushion", "marquise", "oval", "heart", "asscher", "radiant", "moval"],
  diamondTypes: ["Lab", "Natural"], qualityLevels: ["Standard", "Premium", "High-End"], qualityClarities: {},
  headLabels: {}, shankLabels: {}, matchingBandLabels: {},
  caratSizes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  coloredDiamonds: ["Yellow", "Blue", "Red", "Green", "Orange", "Pink", "Brown", "Purple", "Black", "Peach"],
  gemstones: ["blue-sapphire", "green-emerald", "green-sapphire", "moissanite", "pink-sapphire", "red-ruby", "yellow-sapphire"],
};

const HEAD_BY_NAME = {
  "4 PRONG": "4-PRONG", "6 PRONG": "6-PRONG", "HIDDEN HALO": "HIDDEN-HALO", "SINGLE HALO": "HALO", "DOUBLE HALO": "DOUBLE-HALO", BEZEL: "BEZEL", HALO: "HALO",
  // The source API calls H008 "Oval", but it is the Three Stone head.
  OVAL: "OVAL", "THREE STONE": "OVAL", TULIP: "TULIP", "TWO STONE": "TWO-STONE",
  AMELIE: "dw-jul-ma-02-head", ELAN: "dw-ju-m-0031-head", ELANORA: "dw-mar-ma-019-head",
  AURELIE: "dw-LR1046-head", ESTELLE: "dw-LR1046-head",
  ISADORA: "dw-JAN027-head", CELINE: "dw-JAN027-head",
  TRAPEZOID: "TRAPEZOID", "HALF MOON": "HALF-MOON", PEAR: "PEAR", BAGUETTE: "BAGUETTE",
};
const SHANK_BY_NAME = {
  PLAIN: "PLAIN", "PLATE PRONG": "PLATE-PRONG", PAVE: "PLATE-PRONG", "KNIFE EDGE": "KNIFE-EDGE", CHANNEL: "CHANNEL", CATHEDRAL: "CATHEDRAL", SPLIT: "SPLIT", TWISTED: "TWISTED", "WIDE PLAIN": "WIDE-PLAIN", "FRENCH PAVE": "FRENCH-PAVE", "PAVE STONES": "PAVE-STONES", "8 STONES": "8-STONES", "MULTI ROW": "MULTI-ROW", "TWISTED 2": "TWISTED-2", FLUTED: "FLUTED", BRAIDED: "BRAIDED", "CATHEDRAL SIDE STONE": "CATHEDRAL-SIDE-STONE", "SIDE BEZEL STONES": "SIDE-BEZEL-STONES",
  AMELIE: "dw-jul-ma-02-shank", ELAN: "dw-ju-m-0031-shank", ELANORA: "dw-mar-ma-019-shank",
  AURELIE: "dw-LR1046-shank", ESTELLE: "dw-LR1046-shank",
  ISADORA: "dw-JAN027-shank", CELINE: "dw-JAN027-shank",
};
const BAND_BY_NAME = {
  "PLAIN BAND": "PLAIN", PLAIN: "PLAIN",
  CATHEDRAL: "CATHEDRAL",
  "KNIFE EDGE": "KNIFE-EDGE",
  SPLIT: "SPLIT",
  "CHANNEL BAND": "CHANNEL", CHANNEL: "CHANNEL",
  "PLATE PRONG BAND": "PLATE-PRONG", "PLATE PRONG": "PLATE-PRONG",
  PAVE: "PLATE-PRONG", "PAVE BAND": "PLATE-PRONG",
};
const apiName = (name) => String(name ?? "").trim().toUpperCase().replace(/[ÉÈÊ]/g, "E");
const active = (item) => String(item?.status ?? "active").toLowerCase() === "active";

const emptyConfig = () => ({ metalPrices: { Titanium: 0, "Sterling Silver": 0, Silver: 0 }, shankPrices: {}, headPrices: {}, matchingBandPrices: {}, shapePrices: {}, labDiamondPrices: {}, naturalDiamondPrices: {}, coloredDiamondExtraPrices: {}, gemstoneExtraPrices: {}, engravingPrice: 0, ringSizePrices: {}, availableOptions: FALLBACK_OPTIONS });

const catalogueToConfig = (catalogue) => {
  const config = emptyConfig();
  const rawItems = Array.isArray(catalogue?.products)
    ? catalogue.products
    : (Array.isArray(catalogue?.components) ? catalogue.components : []);
  const components = rawItems.filter(active);
  const options = { ...FALLBACK_OPTIONS };
  const byType = (type, map) =>
    components
      .filter((item) => (item.product_type || item.component_type) === type)
      .map((item) => ({
        item,
        value: ((item.product_id || item.component_id) && getProductById(item.product_id || item.component_id)?.rawLabel) || map[apiName(item.name)],
      }))
      .filter(({ value }) => Boolean(value));
  // "Single Halo" and "Halo" are one product. Keep the first active API
  // record so it supplies a single card and a single, stable price.
  const uniqueByValue = (entries) => entries.filter(({ value }, index) =>
    entries.findIndex((entry) => entry.value === value) === index,
  );
  const heads = uniqueByValue(byType("head", HEAD_BY_NAME));
  const shanks = byType("shank", SHANK_BY_NAME);
  const bands = byType("band", BAND_BY_NAME);
  heads.forEach(({ item, value }) => { config.headPrices[value] = Number(item.price) || 0; });
  shanks.forEach(({ item, value }) => { config.shankPrices[value] = Number(item.price) || 0; });
  bands.forEach(({ item, value }) => { config.matchingBandPrices[value] = Number(item.price) || 0; });
  components.filter((item) => (item.product_type || item.component_type) === "metal").forEach((item) => {
    const purity = String(item.name ?? "").match(/\b(9K|10K|14K|18K)\b/i)?.[1]?.toUpperCase()
      || (/platinum/i.test(item.name ?? "") ? "Platinum" : "")
      || (/titanium/i.test(item.name ?? "") ? "Titanium" : "")
      || (/silver/i.test(item.name ?? "") ? "Sterling Silver" : "");
    if (purity && config.metalPrices[purity] === undefined) config.metalPrices[purity] = Number(item.price) || 0;
  });

  const metalComponents = components.filter((item) => (item.product_type || item.component_type) === "metal");
  const metalNames = metalComponents.map((item) => String(item.name ?? ""));
  const activeMetals = [];
  if (metalNames.some((n) => /white\s*gold/i.test(n))) activeMetals.push("White Gold");
  if (metalNames.some((n) => /yellow\s*gold/i.test(n))) activeMetals.push("Yellow Gold");
  if (metalNames.some((n) => /rose\s*gold/i.test(n))) activeMetals.push("Rose Gold");
  if (metalNames.some((n) => /platinum/i.test(n))) activeMetals.push("Platinum");
  if (metalNames.some((n) => /titanium/i.test(n))) activeMetals.push("Titanium");
  if (metalNames.some((n) => /silver/i.test(n))) activeMetals.push("Sterling Silver");

  // Visibility is controlled solely by API status. Compatibility is evaluated
  // by the picker after this step and may disable an otherwise active option.
  options.metalColors = activeMetals.length > 0 ? activeMetals : FALLBACK_OPTIONS.metalColors;
  options.headStyles = heads.map(({ value }) => value);
  // Product IDs select the internal head/model. The API name is presentation
  // metadata, so a catalogue rename updates the customer-facing card and
  // summary without affecting availability, pricing, or model selection.
  options.headLabels = Object.fromEntries(
    heads
      .map(({ item, value }) => [value, String(item.name ?? "").trim()])
      .filter(([, label]) => Boolean(label)),
  );
  options.shankLabels = Object.fromEntries(
    shanks.map(({ item, value }) => [value, String(item.name ?? "").trim()]).filter(([, label]) => Boolean(label)),
  );
  options.matchingBandLabels = Object.fromEntries(
    bands.map(({ item, value }) => [value, String(item.name ?? "").trim()]).filter(([, label]) => Boolean(label)),
  );
  options.shankStyles = shanks.map(({ value }) => value);
  options.matchingBandStyles = bands.map(({ value }) => value);
  options.metalPurities = Object.keys(config.metalPrices).filter((value) => !["Platinum", "Titanium", "Silver", "Sterling Silver"].includes(value));

  const rawRules = Array.isArray(catalogue?.stones)
    ? catalogue.stones
    : (Array.isArray(catalogue?.pricingRules)
      ? catalogue.pricingRules
      : (Array.isArray(catalogue?.pricing_rules) ? catalogue.pricing_rules : []));
  const rules = rawRules.filter(active);
  const shapeRules = rules.filter((rule) => rule.rule_type === "shape");
  const activeShapes = shapeRules
    .map((rule) => ({ rule, shape: SHAPE_BY_ID[rule.shape]?.rawLabel }))
    .filter(({ shape }) => Boolean(shape));
  activeShapes.forEach(({ rule, shape }) => { config.shapePrices[shape] = Number(rule.value) || 0; });
  // Shape rules are part of the API catalogue too: an inactive rule means the
  // shape is not displayed, never merely disabled.
  options.diamondShapes = activeShapes.map(({ shape }) => shape);

  const coloredDiamondRules = rawRules.filter((rule) => rule.rule_type === "colored_diamond" || rule.rule_type === "coloredDiamond");
  const activeColoredDiamondRules = coloredDiamondRules.filter(active);
  const activeColoredDiamonds = activeColoredDiamondRules
    .map((rule) => rule.color || COLORED_DIAMOND_BY_ID[rule.shape]?.rawLabel)
    .filter(Boolean);
  activeColoredDiamondRules.forEach((rule) => {
    const color = rule.color || COLORED_DIAMOND_BY_ID[rule.shape]?.rawLabel;
    if (color) config.coloredDiamondExtraPrices[color] = Number(rule.value) || 0;
  });

  const gemstoneRules = rawRules.filter((rule) => rule.rule_type === "gemstone");
  const activeGemstoneRules = gemstoneRules.filter(active);
  const activeGemstones = activeGemstoneRules
    .map((rule) => rule.color || GEMSTONE_BY_ID[rule.shape]?.rawLabel)
    .filter(Boolean);
  activeGemstoneRules.forEach((rule) => {
    const color = rule.color || GEMSTONE_BY_ID[rule.shape]?.rawLabel;
    if (color) config.gemstoneExtraPrices[color] = Number(rule.value) || 0;
  });

  if (coloredDiamondRules.length > 0) {
    options.coloredDiamonds = activeColoredDiamonds;
  }
  if (gemstoneRules.length > 0) {
    options.gemstones = activeGemstones;
  }

  const origins = [...new Set(rules.filter((rule) => rule.rule_type === "carat").map((rule) => rule.color).filter(Boolean))];
  // The current UI exposes three quality tiers: Standard, Premium, High-End.
  // In the updated API files, this is provided in `rule.quality` (previously on `clarity`).
  // Check `rule.quality` first, falling back to `rule.clarity` for legacy payloads.
  const qualityForGrade = { VS1: "Standard", VVS2: "Premium", VVS1: "High-End" };
  const normalizeQuality = (val) => {
    if (!val) return null;
    const key = String(val).trim();
    const upper = key.toUpperCase();
    if (upper === "STANDARD") return "Standard";
    if (upper === "PREMIUM") return "Premium";
    if (upper === "HIGH-END" || upper === "HIGHEND" || upper === "HIGH END") return "High-End";
    if (upper === "VS1") return "Standard";
    if (upper === "VVS2") return "Premium";
    if (upper === "VVS1") return "High-End";
    return qualityForGrade[key] ?? key;
  };
  const getRuleQuality = (rule) => normalizeQuality(rule.quality) || normalizeQuality(rule.clarity);

  const activeGradeRules = rules.filter((rule) => rule.rule_type === "grade");
  const qualities = [...new Set(activeGradeRules.map((rule) => getRuleQuality(rule)).filter(Boolean))];
  // Preserve the clarity shown by the catalogue beside each commercial grade.
  // The grade remains the value used for pricing and selection; this is display
  // metadata only, sourced directly from the active API rule.
  const qualityClarities = {};
  activeGradeRules.forEach((rule) => {
    const quality = getRuleQuality(rule);
    const clarity = String(rule.clarity ?? "").trim();
    if (quality && clarity && !qualityClarities[quality]) {
      qualityClarities[quality] = clarity;
    }
  });
  options.diamondTypes = origins.length ? origins : FALLBACK_OPTIONS.diamondTypes;
  options.qualityLevels = qualities.length ? qualities : FALLBACK_OPTIONS.qualityLevels;
  options.qualityClarities = qualityClarities;
  const caratRulesByOrigin = {};
  for (const origin of options.diamondTypes) {
    const originCaratRules = rules.filter(
      (rule) => rule.rule_type === "carat" && (!rule.color || rule.color === "All" || rule.color.toLowerCase() === origin.toLowerCase())
    );
    const originCaratSizes = [...new Set(originCaratRules.map((rule) => Number(rule.carat ?? rule.carat_min)).filter((v) => !isNaN(v) && v > 0))].sort((a, b) => a - b);
    caratRulesByOrigin[origin] = originCaratSizes.length ? originCaratSizes : FALLBACK_OPTIONS.caratSizes;
  }
  options.caratSizesByOrigin = caratRulesByOrigin;
  const defaultOriginCarats = caratRulesByOrigin["Lab"] || Object.values(caratRulesByOrigin)[0];
  options.caratSizes = defaultOriginCarats?.length ? defaultOriginCarats : FALLBACK_OPTIONS.caratSizes;
  const allQualityKeys = [...new Set([...options.qualityLevels, ...FALLBACK_OPTIONS.qualityLevels])];

  for (const origin of options.diamondTypes) {
    const caratRules = rules.filter((rule) => rule.rule_type === "carat" && rule.color === origin);
    const originGradeRules = activeGradeRules.filter(
      (rule) => !rule.color || rule.color === "All" || rule.color.toLowerCase() === origin.toLowerCase()
    );
    const effectiveGradeRules = originGradeRules.length > 0 ? originGradeRules : activeGradeRules;

    const table = Object.fromEntries(
      caratRules.map((caratRule) => {
        const baseCaratPrice = Number(caratRule.value) || 0;
        const qualityPrices = Object.fromEntries(
          allQualityKeys.map((quality) => {
            const gradeRule = effectiveGradeRules.find(
              (rule) => getRuleQuality(rule) === quality
            );
            if (!gradeRule) return [quality, baseCaratPrice];

            const gradeVal = Number(gradeRule.value) || 0;
            const pricingMethod = String(gradeRule.pricing_method ?? "fixed").toLowerCase().trim();
            const isRate =
              pricingMethod === "rate" ||
              pricingMethod === "rates" ||
              pricingMethod === "percentage" ||
              pricingMethod === "percent";

            const finalPrice = isRate
              ? Math.round(baseCaratPrice + (baseCaratPrice * gradeVal) / 100)
              : baseCaratPrice + gradeVal;

            return [quality, finalPrice];
          })
        );
        const caratKey = String(caratRule.carat ?? caratRule.carat_min ?? 1);
        return [caratKey, qualityPrices];
      })
    );

    if (origin === "Natural") config.naturalDiamondPrices = table;
    else if (origin === "Lab") config.labDiamondPrices = table;
  }
  config.availableOptions = options;
  return config;
};

export const getStorePriceConfig = (parentUrl) => {
  const cache = getConfigCache();
  if (Array.isArray(cache?.products) || Array.isArray(cache?.components) || Array.isArray(cache?.stones)) return catalogueToConfig(cache);
  // Some API gateways retain a `default` wrapper around the flat catalogue.
  // Support that envelope without reintroducing a second store configuration.
  const cachedCatalogue = cache?.[getStoreKey(parentUrl)] ?? cache?.default;
  if (Array.isArray(cachedCatalogue?.products) || Array.isArray(cachedCatalogue?.components) || Array.isArray(cachedCatalogue?.stones)) return catalogueToConfig(cachedCatalogue);
  const configs = cache && Object.keys(cache).length ? cache : staticPriceData;
  return configs?.[getStoreKey(parentUrl)] ?? configs?.default ?? emptyConfig();
};

export const getPrice = (parentUrl, category, item) => getStorePriceConfig(parentUrl)[category]?.[item] ?? 0;
export const getAvailableOptions = (parentUrl, optionType) => getStorePriceConfig(parentUrl).availableOptions?.[optionType] ?? FALLBACK_OPTIONS[optionType] ?? [];
export const isOptionAvailable = (parentUrl, optionType, optionValue) => getAvailableOptions(parentUrl, optionType).includes(optionValue);
export { initPriceConfig, isPriceConfigReady, refreshPriceConfig, getPriceConfigError } from "./priceApiClient.js";
