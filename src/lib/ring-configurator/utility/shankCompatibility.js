/** Store-specific head, shape, shank, and matching-band compatibility. */
import defaultRules from "../data/store-compatibility/default.json";
import bongioielliRules from "../data/store-compatibility/bongioielli.json";
import dimendscaasiRules from "../data/store-compatibility/dimendscaasi.json";
import elitejewelersRules from "../data/store-compatibility/elitejewelers.json";
import labgrownloveRules from "../data/store-compatibility/labgrownlove.json";
import diamondwiseRules from "../data/store-compatibility/diamondwise.json";
import jewelithRules from "../data/store-compatibility/jewelith.json";
import { getProductIdByRawLabel } from "../data/productIds.js";
import { getStoreKey } from "../priceConfig.js";

const RULES_BY_STORE = {
  default: defaultRules,
  bongioielli: bongioielliRules,
  dimendscaasi: dimendscaasiRules,
  elitejewelers: elitejewelersRules,
  labgrownlove: labgrownloveRules,
  diamondwise: diamondwiseRules,
  // The pricing-test store does not have its own compatibility catalogue.
  // Use the default model rules (which include Moval / SH11) rather than the
  // more restrictive Jewelith rules.
  "jewelith-pricing-test": defaultRules,
  jewelith: jewelithRules,
};

const getHeadRule = (parentUrl, head) => {
  let headId = getProductIdByRawLabel("head", head) ?? (typeof head === "string" && head.startsWith("H") ? head : undefined);
  if (headId === "H004") headId = "H007";
  const storeRules = RULES_BY_STORE[getStoreKey(parentUrl)];
  // H000 is opt-in: only present where the H000 entry exists and has compatible shanks (e.g. diamondwise, default)
  if (head === "NO-HEAD" || headId === "H000") {
    const storeKey = getStoreKey(parentUrl);
    const rules = storeKey === "default" ? defaultRules : storeRules;
    const rule = rules?.find((r) => r.head_id === "H000");
    return rule && Array.isArray(rule.compatible_shanks) && rule.compatible_shanks.length > 0 ? rule : null;
  }
  return storeRules?.find((rule) => rule.head_id === headId) ?? defaultRules?.find((rule) => rule.head_id === headId);
};

export const hasNoHeadCompatibility = (parentUrl) =>
  Boolean(getHeadRule(parentUrl, "NO-HEAD"));

export const isHeadCompatible = (parentUrl, shank, head) => {
  const rule = getHeadRule(parentUrl, head);
  const shankId = getProductIdByRawLabel("shank", shank);
  return Boolean(rule && shankId && rule.compatible_shanks.includes(shankId));
};

export const isShapeCompatible = (parentUrl, head, shape) => {
  const rule = getHeadRule(parentUrl, head);
  const shapeId = getProductIdByRawLabel("shape", shape);
  return Boolean(rule && shapeId && rule.compatible_shapes.includes(shapeId));
};

export const isMatchingBandCompatible = (parentUrl, head, matchingBand) => {
  const rule = getHeadRule(parentUrl, head);
  const bandId = getProductIdByRawLabel("matchingBand", matchingBand);
  return Boolean(rule && bandId && (rule.compatible_bands || []).includes(bandId));
};
