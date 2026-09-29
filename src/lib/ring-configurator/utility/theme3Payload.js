const toNumber = (value, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

/**
 * Builds the canonical Theme 3 configuration snapshot from the current
 * configurator state. This is intentionally frontend-only for now.
 *
 * Notes for production:
 * - Totals in this payload are local/demo totals until a backend quote API is confirmed.
 * - This payload is not backend-authoritative.
 * - `configurationId` and `quoteId` can be added later without changing the current UI flow.
 */
export function buildTheme3ConfigurationPayload(input = {}) {
  const engravingText = cleanText(input.engravingText ?? input.engraving);
  const isBiMetalEnabled =
    input.biMetalEnabled !== undefined ? input.biMetalEnabled : input.biMetal === "Yes";
  const isMatchingBandEnabled =
    input.matchingBandEnabled !== undefined
      ? input.matchingBandEnabled
      : input.ringBand === "Yes" || toNumber(input.matchingBandQuantity) > 0;
  const ringSizePrice = toNumber(input.ringSizePrice);
  const shankTotal = toNumber(input.shankTotal);
  const headTotal = toNumber(input.headTotal);
  const matchingBandPrice = toNumber(input.matchingBandPrice);
  const engravingPrice = toNumber(input.engravingPrice);
  const intensityPrice = toNumber(input.intensityPrice);
  const stoneTotal = toNumber(input.stoneTotal);
  const settingSubtotal = toNumber(
    input.settingSubtotal,
    shankTotal + headTotal + ringSizePrice
  );
  const previewTotal = toNumber(
    input.previewTotal,
    settingSubtotal + stoneTotal
  );
  const diamondSize = toNumber(input.diamondSize, input.diamondSize);

  return {
    schemaVersion: 1,
    theme: input.theme ?? "theme-3",
    flow: input.flow,

    ringShank: input.ringShank,
    ringHead: input.ringHead,
    ringSideSetting: input.ringSideSetting,
    ringMatchingBand: input.ringMatchingBand,
    ringBand: input.ringBand,
    matchingBandQuantity: toNumber(input.matchingBandQuantity),
    matchingBandStyle: input.matchingBandStyle,
    matchingBandStyleLabel: input.matchingBandStyleLabel,

    diamondWiseDesign: input.diamondWiseDesign ?? null,
    diamondWiseDesignId: input.diamondWiseDesignId ?? "",
    diamondWiseDesignLabel: input.diamondWiseDesignLabel ?? "",
    diamondWiseShankId:
      input.diamondWiseShankId ?? input.diamondWiseDesign?.shankId ?? "",
    diamondWiseShankLabel:
      input.diamondWiseShankLabel ?? input.diamondWiseDesign?.shankLabel ?? "",
    diamondWiseHeadId:
      input.diamondWiseHeadId ?? input.diamondWiseDesign?.headId ?? "",
    diamondWiseHeadLabel:
      input.diamondWiseHeadLabel ?? input.diamondWiseDesign?.headLabel ?? "",
    diamondWiseCenterStoneMesh:
      input.diamondWiseCenterStoneMesh ?? input.diamondWiseDesign?.centerStoneMesh ?? "",
    diamondWiseReferenceCarat:
      input.diamondWiseReferenceCarat ?? input.diamondWiseDesign?.referenceCarat ?? null,

    metal: input.metal,
    purity: input.purity ?? input.metalPurity,
    metalPurity: input.metalPurity ?? input.purity,
    platinum: Boolean(input.platinum),
    ringColor: input.ringColor,
    headColor: input.headColor,
    bandColor: input.bandColor,
    metalColor: input.metalColor,
    metalColorLabel: input.metalColorLabel,
    headAccentMetal: input.headAccentMetal,
    headAccentMetalLabel: input.headAccentMetalLabel,
    biMetal: input.biMetal ?? (isBiMetalEnabled ? "Yes" : "No"),
    biMetalEnabled: Boolean(isBiMetalEnabled),

    ringSize: {
      system: input.ringSizeSystem ?? input.sizeOption,
      systemLabel: input.ringSizeSystemLabel,
      size: input.ringSize,
      mm: input.ringSizeMm ?? input.sizeMM,
      price: ringSizePrice,
    },
    sizeOption: input.sizeOption ?? input.ringSizeSystem,
    ringSizeValue: input.ringSize,
    ringSizeMm: input.ringSizeMm ?? input.sizeMM,
    ringSizePrice,

    engraving: {
      enabled: input.engravingEnabled ?? Boolean(engravingText),
      text: engravingText,
      font: input.engravingFont,
      fontLabel: input.engravingFontLabel,
      symbol: input.engravingSymbol ?? input.symbol,
      price: engravingPrice,
    },
    engravingText,
    engravingFont: input.engravingFont,
    engravingSymbol: input.engravingSymbol ?? input.symbol,

    stoneType: input.stoneType ?? input.activeTab,
    stoneTypeLabel: input.stoneTypeLabel,
    activeTab: input.activeTab,
    colorType: input.colorType,
    shape: input.shape,
    shapeLabel: input.shapeLabel,
    diamondSize,
    carat: toNumber(input.carat, diamondSize),
    diamondType: input.diamondType,
    diamondOrigin: input.diamondOrigin ?? input.diamondType,
    diamondOriginLabel: input.diamondOriginLabel,
    selectedQuality: input.selectedQuality,
    cut: input.cut,
    clarity: input.clarity,
    fancyDiamond: input.fancyDiamond,
    fancyDiamondIntensity: input.fancyDiamondIntensity,
    intensityPrice,
    gemstone: input.gemstone,

    matchingBand: {
      enabled: Boolean(isMatchingBandEnabled),
      quantity: toNumber(input.matchingBandQuantity),
      style: input.matchingBandStyle ?? input.ringMatchingBand ?? input.ringSideSetting,
      styleLabel: input.matchingBandStyleLabel,
      price: matchingBandPrice,
    },

    pricing: {
      shankTotal,
      headTotal,
      ringSizePrice,
      matchingBandPrice,
      engravingPrice,
      intensityPrice,
      stoneTotal,
      settingSubtotal,
      previewTotal,
      currency: input.currency,
    },

    shankTotal,
    headTotal,
    ringSizePrice,
    matchingBandPrice,
    engravingPrice,
    intensityPrice,
    stoneTotal,
    settingSubtotal,
    previewTotal,
    currency: input.currency,

    configurationId: input.configurationId ?? null,
    quoteId: input.quoteId ?? null,
  };
}

/**
 * Builds the future pricing-request shape from the same Theme 3 configuration
 * snapshot. This does not call a backend and does not make prices authoritative.
 *
 * Notes for production:
 * - Existing totals are included only as local/demo reference values.
 * - The backend should return a quote ID and server-authoritative totals later.
 */
export function buildTheme3PricingPayload(input = {}) {
  const configuration = buildTheme3ConfigurationPayload(input);

  return {
    schemaVersion: 1,
    purpose: "pricing",
    theme: configuration.theme,
    flow: configuration.flow,
    currency: configuration.currency,
    configurationId: configuration.configurationId,
    quoteId: configuration.quoteId,
    configuration,
    localDemoTotals: configuration.pricing,
  };
}

/**
 * Builds the future handoff payload shape for Ring Builder / Choose Diamond.
 * This helper is preparation-only today; current Choose Diamond behavior remains
 * unchanged until this helper is explicitly wired into the app.
 *
 * Notes for production:
 * - `configurationId` and `quoteId` should be supplied once backend save/quote
 *   APIs are confirmed.
 * - Local/demo totals should not be treated as final cart totals.
 */
export function buildTheme3HandoffPayload(input = {}) {
  const configuration = buildTheme3ConfigurationPayload(input);

  return {
    type: input.type ?? "ring-configurator:continue",
    schemaVersion: 1,
    theme: configuration.theme,
    flow: configuration.flow,
    configurationId: configuration.configurationId,
    quoteId: configuration.quoteId,
    configuration,
    pricing: configuration.pricing,
  };
}
