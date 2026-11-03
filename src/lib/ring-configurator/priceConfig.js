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
import { resolveParentUrl } from "./utility/Parentconfig.js";
import { DIAMONDWISE_DESIGNS } from "./data/diamondwiseDesigns.js";

export const isDiamondWiseParentUrl = (parentUrl) => {
  const value = String(parentUrl ?? "").toLowerCase();
  return value.includes("diamondwise") || value.includes("jdemo364.wpenginepowered");
};

export const isJDemo364ParentUrl = (parentUrl) => {
  const value = String(parentUrl || (typeof window !== "undefined" ? resolveParentUrl() : "")).toLowerCase();
  return value.includes("jdemo364.wpenginepowered");
};

export const isDiamondWiseHead = (headId) =>
  String(headId ?? "").startsWith("dw-") ||
  DIAMONDWISE_DESIGNS.some((d) => d.headId === headId);

export const orderHeadStylesForStore = (headStyles, parentUrl) => {
  if (!Array.isArray(headStyles) || !isJDemo364ParentUrl(parentUrl)) {
    return headStyles;
  }
  const dwHeads = headStyles.filter(isDiamondWiseHead);
  const otherHeads = headStyles.filter((id) => !isDiamondWiseHead(id));
  return [...dwHeads, ...otherHeads];
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
  shankStyles: [
    "PLAIN", "PLATE-PRONG", "KNIFE-EDGE", "CHANNEL", "CATHEDRAL", "SPLIT", "TWISTED", "WIDE-PLAIN",
    "FRENCH-PAVE", "PAVE-STONES", "8-STONES", "MULTI-ROW", "TWISTED-2", "FLUTED", "BRAIDED",
    "CATHEDRAL-SIDE-STONE", "SIDE-BEZEL-STONES", "BAGUETTE-SIDE-STONE", "PEAR-SIDE-STONE", "HALF-MOON-SIDE-STONE",
    "dw-jul-ma-02-shank", "dw-ju-m-0031-shank", "dw-mar-ma-019-shank", "dw-LR1046-shank", "dw-JAN027-shank",
  ],
  headStyles: [
    "4-PRONG", "6-PRONG", "HIDDEN-HALO", "HIDDEN-HALO-2", "DOUBLE-HALO", "BEZEL", "HALO", "OVAL", "TULIP", "TWO-STONE", "CLAW-SET",
    "dw-jul-ma-02-head", "dw-ju-m-0031-head", "dw-mar-ma-019-head", "dw-LR1046-head", "dw-JAN027-head",
  ],
  matchingBandStyles: ["PLAIN", "CATHEDRAL", "KNIFE-EDGE", "SPLIT", "CHANNEL", "PLATE-PRONG"],
  diamondShapes: ["round", "pear", "princess", "emerald", "cushion", "marquise", "oval", "heart", "asscher", "radiant", "moval"],
  sideStoneStyles: ["oval", "round", "pear", "baguette", "trapezoid"],
  diamondTypes: ["Lab", "Natural"], qualityLevels: ["Standard", "Premium", "High-End"], qualityClarities: {},
  headLabels: {}, shankLabels: {}, matchingBandLabels: {}, metalLabels: {}, metalProductIds: [],
  sideStoneLabels: {
    oval: "Oval",
    round: "Round",
    pear: "Pear",
    baguette: "Emerald",
    trapezoid: "Princess",
  },
  bandWidths: [],
  caratSizes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  coloredDiamonds: ["Yellow", "Blue", "Red", "Green", "Orange", "Pink", "Brown", "Purple", "Black", "Peach"],
  gemstones: ["blue-sapphire", "green-emerald", "green-sapphire", "moissanite", "pink-sapphire", "red-ruby", "yellow-sapphire"],
};

const HEAD_BY_NAME = {
  "4 PRONG": "4-PRONG", "6 PRONG": "6-PRONG", "HIDDEN HALO": "HIDDEN-HALO", "HIDDEN HALO 2": "HIDDEN-HALO-2", "HIDDEN-HALO-2": "HIDDEN-HALO-2", "SINGLE HALO": "HALO", "DOUBLE HALO": "DOUBLE-HALO", BEZEL: "BEZEL", HALO: "HALO",
  // The source API calls H008 "Oval", but it is the Three Stone head.
  OVAL: "OVAL", "THREE STONE": "OVAL", TULIP: "TULIP", "TWO STONE": "TWO-STONE",
  AMELIE: "dw-jul-ma-02-head", ELAN: "dw-ju-m-0031-head", ELANORA: "dw-mar-ma-019-head",
  AURELIE: "dw-LR1046-head", ESTELLE: "dw-LR1046-head",
  ISADORA: "dw-JAN027-head", CELINE: "dw-JAN027-head",
  TRAPEZOID: "TRAPEZOID", "HALF MOON": "HALF-MOON", PEAR: "PEAR", BAGUETTE: "BAGUETTE",
};
const SHANK_BY_NAME = {
  PLAIN: "PLAIN", "PLATE PRONG": "PLATE-PRONG", PAVE: "PLATE-PRONG", "KNIFE EDGE": "KNIFE-EDGE", CHANNEL: "CHANNEL", CATHEDRAL: "CATHEDRAL", SPLIT: "SPLIT", TWISTED: "TWISTED", "WIDE PLAIN": "WIDE-PLAIN", "FRENCH PAVE": "FRENCH-PAVE", "PAVE STONES": "PAVE-STONES", "8 STONES": "8-STONES", "MULTI ROW": "MULTI-ROW", "TWISTED 2": "TWISTED-2", FLUTED: "FLUTED", BRAIDED: "BRAIDED", "CATHEDRAL SIDE STONE": "CATHEDRAL-SIDE-STONE", "SIDE BEZEL STONES": "SIDE-BEZEL-STONES",
  "BAGUETTE SIDE STONE": "BAGUETTE-SIDE-STONE", "BAGUETTE-SIDE-STONE": "BAGUETTE-SIDE-STONE", BAGUETTE: "BAGUETTE-SIDE-STONE", "BAGUETTE SHANK": "BAGUETTE-SIDE-STONE",
  "PEAR SIDE STONE": "PEAR-SIDE-STONE", "PEAR-SIDE-STONE": "PEAR-SIDE-STONE", PEAR: "PEAR-SIDE-STONE", "PEAR SHANK": "PEAR-SIDE-STONE",
  "HALF MOON SIDE STONE": "HALF-MOON-SIDE-STONE", "HALF-MOON-SIDE-STONE": "HALF-MOON-SIDE-STONE", "HALF MOON": "HALF-MOON-SIDE-STONE", "HALF MOON SHANK": "HALF-MOON-SIDE-STONE",
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
const SIDESTONE_BY_NAME = {
  OVAL: "oval",
  ROUND: "round",
  PEAR: "pear",
  EMERALD: "baguette",
  BAGUETTE: "baguette",
  PRINCESS: "trapezoid",
  TRAPEZOID: "trapezoid",
};
const apiName = (name) => String(name ?? "").trim().toUpperCase().replace(/[ÉÈÊ]/g, "E");
// Catalogues have been returned with both `status: "active"` and boolean
// flags.  Treat an explicit inactive/false value as unavailable; only an
// omitted status preserves the legacy-active default.
const active = (item) => {
  const status = item?.status ?? item?.product_status ?? item?.state;
  const flag = item?.active ?? item?.isActive ?? item?.is_active ?? item?.enabled ?? item?.is_enabled;

  if (flag !== undefined && flag !== null && flag !== "") {
    if (flag === false || flag === 0) return false;
    const normalizedFlag = String(flag).trim().toLowerCase();
    if (["false", "0", "no", "off", "inactive", "disabled"].includes(normalizedFlag)) return false;
    if (["true", "1", "yes", "on", "active", "enabled"].includes(normalizedFlag)) return true;
  }

  if (status === undefined || status === null || status === "") return true;
  return ["active", "enabled", "true", "1"].includes(String(status).trim().toLowerCase());
};

const emptyConfig = () => ({
  metalPrices: { Titanium: 0, "Sterling Silver": 0, Silver: 0 },
  shankPrices: {},
  headPrices: {},
  sideStonePrices: {},
  matchingBandPrices: {},
  shapePrices: {},
  labDiamondPrices: {},
  naturalDiamondPrices: {},
  coloredDiamondExtraPrices: {},
  gemstoneExtraPrices: {},
  bandWidthPrices: {},
  sideStoneCarats: { head: {}, shank: {}, matchingBand: {} },
  engravingPrice: 0,
  ringSizePrices: {},
  availableOptions: FALLBACK_OPTIONS,
});

const isSideStoneType = (type) => {
  const t = String(type ?? "").toLowerCase().replace(/[-_]/g, "");
  return t === "sidestone" || t === "threestone";
};

const catalogueToConfig = (catalogue, parentUrl) => {
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
  const bandWidths = components
    .filter((item) => String(item.product_type || item.component_type || "").toLowerCase() === "bandwidth")
    .map((item) => ({ item, value: String(item.name || "").trim() }))
    .filter(({ value }) => /^\d+(?:\.\d+)?mm$/i.test(value));

  const sideStones = components
    .filter((item) => isSideStoneType(item.product_type || item.component_type))
    .map((item) => ({
      item,
      value: ((item.product_id || item.component_id) && getProductById(item.product_id || item.component_id)?.rawLabel) || SIDESTONE_BY_NAME[apiName(item.name)],
    }))
    .filter(({ value }) => Boolean(value));

  heads.forEach(({ item, value }) => { config.headPrices[value] = Number(item.price) || 0; });
  heads.forEach(({ item, value }) => {
    const carat = Number(item.sidestone_carat);
    if (Number.isFinite(carat) && carat > 0) config.sideStoneCarats.head[value] = carat;
  });
  // Three Stone head is H008 (named "Oval" in the API, internally "OVAL").
  // When different center diamond shapes are chosen (round -> HALF-MOON, princess -> TRAPEZOID,
  // pear -> PEAR, emerald -> BAGUETTE), copy the H008 / OVAL price to all three-stone variant keys
  // so any chosen shape receives the Three Stone head price.
  const THREE_STONE_RAW_LABELS = ["TRAPEZOID", "HALF-MOON", "PEAR", "BAGUETTE"];
  if (config.headPrices["OVAL"] > 0) {
    THREE_STONE_RAW_LABELS.forEach((label) => {
      if (!config.headPrices[label]) {
        config.headPrices[label] = config.headPrices["OVAL"];
      }
    });
  }
  shanks.forEach(({ item, value }) => { config.shankPrices[value] = Number(item.price) || 0; });
  shanks.forEach(({ item, value }) => {
    const carat = Number(item.sidestone_carat);
    if (Number.isFinite(carat) && carat > 0) config.sideStoneCarats.shank[value] = carat;
  });
  bands.forEach(({ item, value }) => { config.matchingBandPrices[value] = Number(item.price) || 0; });
  bands.forEach(({ item, value }) => {
    const carat = Number(item.sidestone_carat);
    if (Number.isFinite(carat) && carat > 0) config.sideStoneCarats.matchingBand[value] = carat;
  });
  bandWidths.forEach(({ item, value }) => { config.bandWidthPrices[value] = Number(item.price) || 0; });
  options.bandWidths = bandWidths.map(({ value }) => value);
  sideStones.forEach(({ item, value }) => {
    const priceNum = Number(item.price) || 0;
    config.sideStonePrices[value] = priceNum;
    config.sideStonePrices[value.toLowerCase()] = priceNum;
    config.sideStonePrices[value.toUpperCase()] = priceNum;
    // THREE_STONE_SIDE_OPTIONS uses "baguette" as the threestone key for Emerald
    // and "trapezoid" as the threestone key for Princess. Store prices under
    // both the rawLabel (emerald/princess) and the threestone lookup key (baguette/trapezoid).
    if (value === "baguette" || value === "emerald") {
      config.sideStonePrices["emerald"] = priceNum;
      config.sideStonePrices["EMERALD"] = priceNum;
      config.sideStonePrices["baguette"] = priceNum;
      config.sideStonePrices["BAGUETTE"] = priceNum;
    }
    if (value === "trapezoid" || value === "princess") {
      config.sideStonePrices["princess"] = priceNum;
      config.sideStonePrices["PRINCESS"] = priceNum;
      config.sideStonePrices["trapezoid"] = priceNum;
      config.sideStonePrices["TRAPEZOID"] = priceNum;
    }
  });
  const metalComponents = components.filter((item) => (item.product_type || item.component_type) === "metal");
  const activeMetals = [];
  const addActiveMetal = (metal) => {
    if (metal && !activeMetals.includes(metal)) activeMetals.push(metal);
  };
  metalComponents.forEach((item) => {
    const productId = String(item.product_id || item.component_id || "").toUpperCase();
    const product = getProductById(productId);
    // Product ID is authoritative. Name parsing remains only for legacy rows
    // that do not yet provide an ID.
    const name = String(item.name ?? "");
    const purity = product?.purity
      || name.match(/\b(9K|10K|14K|18K)\b/i)?.[1]?.toUpperCase()
      || (/platinum/i.test(name) ? "Platinum" : "")
      || (/titanium/i.test(name) ? "Titanium" : "")
      || (/silver/i.test(name) ? "Sterling Silver" : "");
    const metal = product?.metal
      || (/white\s*gold/i.test(name) ? "White Gold" : "")
      || (/yellow\s*gold/i.test(name) ? "Yellow Gold" : "")
      || (/rose\s*gold/i.test(name) || /\brg\b/i.test(name) ? "Rose Gold" : "")
      || (/platinum/i.test(name) ? "Platinum" : "")
      || (/titanium/i.test(name) ? "Titanium" : "")
      || (/silver/i.test(name) ? "Sterling Silver" : "");

    if (purity && config.metalPrices[purity] === undefined) config.metalPrices[purity] = Number(item.price) || 0;
    addActiveMetal(metal);
    if (productId && product?.metal) {
      options.metalProductIds.push(productId);
      // Preserve merchant-controlled copy in the UI. Fall back to the stable
      // registry label only when the API omitted a name.
      options.metalLabels[productId] = name.trim() || product.rawLabel;
    }
  });

  // Visibility is controlled solely by API status. Compatibility is evaluated
  // by the picker after this step and may disable an otherwise active option.
  options.metalColors = activeMetals.length > 0 ? activeMetals : FALLBACK_OPTIONS.metalColors;
  options.headStyles = orderHeadStylesForStore(heads.map(({ value }) => value), parentUrl);
  // Product IDs select the internal head/model. The API name is presentation
  // metadata, so a catalogue rename updates the customer-facing card and
  // summary without affecting availability, pricing, or model selection.
  options.headLabels = Object.fromEntries(
    heads
      .map(({ item, value }) => {
        let label = String(item.name ?? "").trim();
        if (value === "OVAL" || label.toLowerCase() === "oval") {
          label = "Three Stone";
        }
        return [value, label];
      })
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

  const allSideStoneItems = rawItems.filter((item) => isSideStoneType(item.product_type || item.component_type));
  if (allSideStoneItems.length > 0) {
    options.sideStoneStyles = sideStones.map(({ value }) => value);
    options.sideStoneLabels = {
      ...FALLBACK_OPTIONS.sideStoneLabels,
      ...Object.fromEntries(
        sideStones
          .map(({ item, value }) => [value, String(item.name ?? "").trim()])
          .filter(([, label]) => Boolean(label))
      ),
    };
  }

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

  // Side stone price rules — rule_type: "sidestone"
  // shape = product ID (SS001…SS005), color = display name, value = additional price
  // The stones rules are the authoritative source for both price AND active/inactive visibility.
  const sideStoneRules = rawRules.filter((rule) => rule.rule_type === "sidestone");
  const activeSideStoneRules = sideStoneRules.filter(active);
  if (sideStoneRules.length > 0) {
    // Rebuild sideStoneStyles from the rules (active only) so inactive entries are hidden.
    const ruleBasedStyles = [];
    const ruleBasedLabels = { ...FALLBACK_OPTIONS.sideStoneLabels };
    activeSideStoneRules.forEach((rule) => {
      const priceNum = Number(rule.value) || 0;
      const byId = rule.shape ? getProductById(rule.shape) : null;
      const rawLabel = byId?.rawLabel || SIDESTONE_BY_NAME[apiName(rule.color || "")] || "";
      if (!rawLabel) return;
      ruleBasedStyles.push(rawLabel);
      const displayName = String(rule.color ?? "").trim();
      if (displayName) ruleBasedLabels[rawLabel] = displayName;
      // Store price under the rawLabel and common aliases
      config.sideStonePrices[rawLabel] = priceNum;
      config.sideStonePrices[rawLabel.toLowerCase()] = priceNum;
      config.sideStonePrices[rawLabel.toUpperCase()] = priceNum;
      // bidirectional aliases: THREE_STONE_SIDE_OPTIONS uses "baguette"/"trapezoid"
      // as threestone keys for Emerald/Princess, so store both directions
      if (rawLabel === "baguette" || rawLabel === "emerald") {
        config.sideStonePrices["emerald"] = priceNum;
        config.sideStonePrices["EMERALD"] = priceNum;
        config.sideStonePrices["baguette"] = priceNum;
        config.sideStonePrices["BAGUETTE"] = priceNum;
      }
      if (rawLabel === "trapezoid" || rawLabel === "princess") {
        config.sideStonePrices["princess"] = priceNum;
        config.sideStonePrices["PRINCESS"] = priceNum;
        config.sideStonePrices["trapezoid"] = priceNum;
        config.sideStonePrices["TRAPEZOID"] = priceNum;
      }
    });
    // Override the products-based sideStoneStyles with the rules-based one
    options.sideStoneStyles = ruleBasedStyles;
    options.sideStoneLabels = ruleBasedLabels;
  } else {
    // No rules: fall back to products-based prices (already set in sideStones.forEach above)
    activeSideStoneRules.forEach((rule) => {
      const priceNum = Number(rule.value) || 0;
      const byId = rule.shape ? getProductById(rule.shape) : null;
      const rawLabel = byId?.rawLabel || SIDESTONE_BY_NAME[apiName(rule.color || "")] || "";
      if (!rawLabel) return;
      config.sideStonePrices[rawLabel] = priceNum;
      config.sideStonePrices[rawLabel.toLowerCase()] = priceNum;
      config.sideStonePrices[rawLabel.toUpperCase()] = priceNum;
      if (rawLabel === "baguette" || rawLabel === "emerald") {
        config.sideStonePrices["emerald"] = priceNum;
        config.sideStonePrices["EMERALD"] = priceNum;
        config.sideStonePrices["baguette"] = priceNum;
        config.sideStonePrices["BAGUETTE"] = priceNum;
      }
      if (rawLabel === "trapezoid" || rawLabel === "princess") {
        config.sideStonePrices["princess"] = priceNum;
        config.sideStonePrices["PRINCESS"] = priceNum;
        config.sideStonePrices["trapezoid"] = priceNum;
        config.sideStonePrices["TRAPEZOID"] = priceNum;
      }
    });
  }

  const hasCaratRules = rawRules.some((rule) => rule.rule_type === "carat");
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
  const qualityClaritiesByOrigin = {};
  activeGradeRules.forEach((rule) => {
    const quality = getRuleQuality(rule);
    const clarity = String(rule.clarity ?? "").trim();
    const origin = String(rule.color ?? "").trim();
    if (quality && clarity && !qualityClarities[quality]) {
      qualityClarities[quality] = clarity;
    }
    // Grade rules can define a different clarity for Lab and Natural diamonds.
    // Retain that origin-specific value instead of allowing the first matching
    // rule (usually Lab) to be shown for both diamond types.
    if (quality && clarity && origin && origin.toLowerCase() !== "all") {
      const matchingOrigin = options.diamondTypes.find(
        (type) => type.toLowerCase() === origin.toLowerCase(),
      );
      if (matchingOrigin) {
        qualityClaritiesByOrigin[matchingOrigin] ||= {};
        if (!qualityClaritiesByOrigin[matchingOrigin][quality]) {
          qualityClaritiesByOrigin[matchingOrigin][quality] = clarity;
        }
      }
    }
  });
  // Retain legacy defaults only when the catalogue has no carat rules at all.
  // If it does have rules, an origin without active carats is unavailable.
  options.diamondTypes = origins.length
    ? origins
    : hasCaratRules
      ? []
      : FALLBACK_OPTIONS.diamondTypes;
  options.qualityLevels = qualities.length ? qualities : FALLBACK_OPTIONS.qualityLevels;
  options.qualityClarities = qualityClarities;
  options.qualityClaritiesByOrigin = qualityClaritiesByOrigin;
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
  if (Array.isArray(cache?.products) || Array.isArray(cache?.components) || Array.isArray(cache?.stones)) return catalogueToConfig(cache, parentUrl);
  // Some API gateways retain a `default` wrapper around the flat catalogue.
  // Support that envelope without reintroducing a second store configuration.
  const cachedCatalogue = cache?.[getStoreKey(parentUrl)] ?? cache?.default;
  if (Array.isArray(cachedCatalogue?.products) || Array.isArray(cachedCatalogue?.components) || Array.isArray(cachedCatalogue?.stones)) return catalogueToConfig(cachedCatalogue, parentUrl);
  const configs = cache && Object.keys(cache).length ? cache : staticPriceData;
  return configs?.[getStoreKey(parentUrl)] ?? configs?.default ?? emptyConfig();
};

export const getPrice = (parentUrl, category, item) => {
  const storeConfig = getStorePriceConfig(parentUrl);
  const cat = storeConfig[category];
  if (!cat) return 0;
  if (cat[item] !== undefined) return cat[item];
  if (typeof item === "string") {
    if (cat[item.toLowerCase()] !== undefined) return cat[item.toLowerCase()];
    if (cat[item.toUpperCase()] !== undefined) return cat[item.toUpperCase()];
  }
  return 0;
};
export const getAvailableOptions = (parentUrl, optionType) => {
  const options = getStorePriceConfig(parentUrl).availableOptions?.[optionType] ?? FALLBACK_OPTIONS[optionType] ?? [];
  if (optionType === "headStyles" && isJDemo364ParentUrl(parentUrl)) {
    return orderHeadStylesForStore(options, parentUrl);
  }
  return options;
};
export const getSideStoneCarat = (parentUrl, productType, style) => {
  const carats = getStorePriceConfig(parentUrl).sideStoneCarats?.[productType] || {};
  return Number(carats[style] || 0);
};
export const getBandWidthPrice = (parentUrl, width) =>
  Number(getStorePriceConfig(parentUrl).bandWidthPrices?.[width] || 0);
export const isOptionAvailable = (parentUrl, optionType, optionValue) => getAvailableOptions(parentUrl, optionType).includes(optionValue);
export { initPriceConfig, isPriceConfigReady, refreshPriceConfig, getPriceConfigError, getPricingAccessState, setPricingRemoveLogo } from "./priceApiClient.js";
