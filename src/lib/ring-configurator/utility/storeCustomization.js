import { getAvailableOptions } from "./storePriceHelper.js";
import { isDiamondWiseParentUrl } from "../priceConfig.js";

const STORE_KEYS = ["anelladiamond", "bongioielli", "dimendscaasi", "elitejewelers", "labgrownlove", "diamondwise", "jewelith-pricing-test", "jewelith"];

const OPTION_CATALOG = {
  metalPurities: ["9K", "10K", "14K", "18K"],
  shankStyles: ["PLAIN", "PLATE-PRONG", "KNIFE-EDGE", "CHANNEL", "CATHEDRAL", "SPLIT", "TWISTED", "WIDE-PLAIN"],
  headStyles: ["4-PRONG", "SINGLE-HALO", "6-PRONG", "DOUBLE-HALO", "BEZEL", "OVAL", "HIDDEN-HALO"],
  diamondShapes: ["round", "pear", "princess", "emerald", "cushion", "marquise", "oval", "moval", "heart", "asscher", "radiant"],
  matchingBandStyles: ["PLAIN", "CHANNEL", "PLATE-PRONG"],
  diamondTypes: ["Lab", "Natural"],
  qualityLevels: ["Standard", "Premium", "High-End"],
  coloredDiamonds: ["Yellow", "Blue", "Red", "Green", "Orange", "Pink", "Brown", "Purple", "Black", "Peach"],
  gemstones: ["blue-sapphire", "green-emerald", "green-sapphire", "moissanite", "pink-sapphire", "red-ruby", "yellow-sapphire"],
};

const DEFAULT_RULES = {
  defaultActiveTab: "Colorless",
  defaultColorType: "colorless",
  defaultMetalColor: "#FFD280",
  roundOnlyHeadStyles: ["hidden-halo", "single-halo", "double-halo"],
  threeStoneShapes: ["round", "princess", "oval", "pear", "baguette"],
  headDefaultShapes: {
    plain: "round",
    bezel: "round",
    "hidden-halo": "round",
    "single-halo": "round",
    "double-halo": "round",
    "three-stone": "oval",
  },
  headShapeSupport: {
    plain: ["round", "emerald", "oval", "moval", "pear", "asscher", "cushion", "marquise", "princess", "radiant", "heart"],
    bezel: ["round", "emerald", "oval", "moval", "pear", "asscher", "cushion", "marquise", "princess", "radiant", "heart"],
    "hidden-halo": ["round", "moval"],
    "single-halo": ["round"],
    "double-halo": ["round"],
    "three-stone": ["round", "princess", "oval", "pear"],
  },
  threeStoneShapeMap: {
    round: "HALF-MOON",
    princess: "TRAPEZOID",
    oval: "OVAL",
    pear: "PEAR",
  },
  ringHeadMap: {
    plain: "4-PRONG",
    bezel: "BEZEL",
    "hidden-halo": "HIDDEN-HALO",
    "single-halo": "SINGLE-HALO",
    "double-halo": "DOUBLE-HALO",
  },
  matchingBandCompatibleShanks: ["PLAIN", "CATHEDRAL", "KNIFE-EDGE", "SPLIT", "CHANNEL", "PLATE-PRONG", "FRENCH-PAVE", "PAVE-STONES", "8-STONES", "MULTI-ROW", "TWISTED-2", "FLUTED", "BRAIDED", "CATHEDRAL-SIDE-STONE", "SIDE-BEZEL-STONES"],
};

const STORE_RULE_OVERRIDES = {
  default: {},
  anelladiamond: {},
  bongioielli: {},
  dimendscaasi: {},
  elitejewelers: {},
  labgrownlove: {},
  diamondwise: {},
  "jewelith-pricing-test": {},
  jewelith: {},
};

const findStoreKey = (parentUrl) => {
  if (!parentUrl) return "default";

  if (isDiamondWiseParentUrl(parentUrl)) return "diamondwise";

  const lower = parentUrl.toLowerCase();
  return STORE_KEYS.find((key) => lower.includes(key)) ?? "default";
};

const firstAvailable = (options, fallback) => options[0] ?? fallback;

export const getStoreCustomizationSettings = (parentUrl) => {
  const storeKey = findStoreKey(parentUrl);
  const rules = {
    ...DEFAULT_RULES,
    ...(STORE_RULE_OVERRIDES.default ?? {}),
    ...(STORE_RULE_OVERRIDES[storeKey] ?? {}),
  };

  const availableOptions = Object.fromEntries(
    Object.entries(OPTION_CATALOG).map(([key, values]) => [key, getAvailableOptions(parentUrl, key).length > 0 ? getAvailableOptions(parentUrl, key) : values])
  );

  const compatibleShanks = rules.matchingBandCompatibleShanks.filter((shank) => availableOptions.shankStyles.includes(shank));
  const threeStoneShapes = rules.threeStoneShapes.filter((shape) => availableOptions.diamondShapes.includes(shape));
  const roundOnlyHeadStyles = rules.roundOnlyHeadStyles.filter((headStyle) => availableOptions.headStyles.includes(headStyle));
  const headDefaultShapes = Object.fromEntries(
    Object.entries(rules.headDefaultShapes ?? {}).filter(([headStyle, shape]) => {
      return availableOptions.headStyles.includes(headStyle) && availableOptions.diamondShapes.includes(shape);
    })
  );
  const headShapeSupport = Object.fromEntries(
    Object.entries(rules.headShapeSupport ?? {}).map(([headStyle, shapes]) => [
      headStyle,
      shapes.filter((shape) => availableOptions.diamondShapes.includes(shape)),
    ])
  );

  return {
    storeKey,
    rules: {
      ...rules,
      roundOnlyHeadStyles,
      matchingBandCompatibleShanks: compatibleShanks,
      threeStoneShapes,
      headDefaultShapes,
      headShapeSupport,
    },
    availableOptions,
  };
};

export const getStoreDefaults = (parentUrl) => {
  const { availableOptions, rules } = getStoreCustomizationSettings(parentUrl);

  return {
    activeTab: rules.defaultActiveTab,
    colorType: rules.defaultColorType,
    fancyDiamond: firstAvailable(availableOptions.coloredDiamonds, "Blue"),
    gemstone: firstAvailable(availableOptions.gemstones, "blue-sapphire"),
    diamondType: firstAvailable(availableOptions.diamondTypes, "Lab"),
    selectedQuality: {
      type: firstAvailable(availableOptions.diamondTypes, "Lab"),
      quality: firstAvailable(availableOptions.qualityLevels, "Standard"),
    },
    metal: firstAvailable(availableOptions.metalPurities, "14K"),
    metalColor: rules.defaultMetalColor,
    headStyle: firstAvailable(availableOptions.headStyles, "plain"),
    ringShank: firstAvailable(availableOptions.shankStyles, "PLAIN"),
    ringSideSetting: "PLAIN",
    ringMatchingBand: firstAvailable(availableOptions.matchingBandStyles, "PLAIN"),
    ringBand: "No",
    engraving: "",
    shape: firstAvailable(availableOptions.diamondShapes, "round"),
    diamondSize: 1,
  };
};

export const getResolvedHeadSelection = (headStyle, requestedShape, settings) => {
  const { rules } = settings;

  if (headStyle === "three-stone") {
    const shape = rules.threeStoneShapes.includes(requestedShape)
      ? requestedShape
      : firstAvailable(rules.threeStoneShapes, "oval");

    return {
      headStyle,
      shape,
      ringHead: rules.threeStoneShapeMap[shape] ?? "OVAL",
      threestone: shape === "round" ? "half-moon" : shape === "princess" ? "trapezoid" : shape,
      shapeList: rules.threeStoneShapes.join(","),
    };
  }

  return {
    headStyle,
    shape: requestedShape,
    ringHead: rules.ringHeadMap[headStyle] ?? "4-PRONG",
    threestone: "",
    shapeList: "",
  };
};

export const getSupportedShapesForHeadStyle = (headStyle, settings) => {
  const { rules, availableOptions } = settings;
  return (
    rules.headShapeSupport?.[headStyle]?.filter((shape) => availableOptions.diamondShapes.includes(shape)) ??
    availableOptions.diamondShapes
  );
};

export const getDefaultShapeForHeadStyle = (headStyle, settings) => {
  const { rules } = settings;
  const supportedShapes = getSupportedShapesForHeadStyle(headStyle, settings);
  return rules.headDefaultShapes?.[headStyle] && supportedShapes.includes(rules.headDefaultShapes[headStyle])
    ? rules.headDefaultShapes[headStyle]
    : supportedShapes[0] ?? "round";
};

export const normalizeMatchingBandSelection = (ringBand, ringShank, matchingBand, ringSideSetting, settings) => {
  const { availableOptions, rules } = settings;
  const compatibleShanks = rules.matchingBandCompatibleShanks;
  const fallbackMatchingBand = firstAvailable(availableOptions.matchingBandStyles, "PLAIN");
  const fallbackShank = firstAvailable(compatibleShanks, firstAvailable(availableOptions.shankStyles, "PLAIN"));

  if (ringBand !== "Yes") {
    return {
      ringBand: "No",
      ringShank,
      ringMatchingBand: matchingBand ?? fallbackMatchingBand,
      ringSideSetting: ringSideSetting ?? "PLAIN",
    };
  }

  return {
    ringBand: "Yes",
    ringShank: compatibleShanks.includes(ringShank) ? ringShank : fallbackShank,
    ringMatchingBand: availableOptions.matchingBandStyles.includes(matchingBand) ? matchingBand : fallbackMatchingBand,
    ringSideSetting: ringSideSetting ?? "PLAIN",
  };
};
