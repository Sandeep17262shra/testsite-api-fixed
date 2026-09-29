export const DEFAULT_CONFIGURATOR_CONFIG = Object.freeze({
  // Root URLs should open in the same experience as
  // ?theme=theme-3&flow=3B. Explicit URL or parent settings can still
  // override these defaults.
  theme: "theme-3",
  flow: "diamond-preview",
  showDiamondFilters: false,
});

const THEME3_SECTION_DEFINITIONS = Object.freeze({
  shape: Object.freeze({ id: "shape", label: "Stone", subtitle: "Shape • Carat • Cut • Clarity" }),
  setting: Object.freeze({ id: "setting", label: "Head", subtitle: "Head Style" }),
  band: Object.freeze({ id: "band", label: "Shank", subtitle: "Ring Style • Matching Band • Size • Engraving" }),
});

export const THEME3_FLOW_SECTIONS = Object.freeze({
  "setting-only": Object.freeze([
    THEME3_SECTION_DEFINITIONS.setting,
    THEME3_SECTION_DEFINITIONS.band,
  ]),
  "diamond-preview": Object.freeze([
    THEME3_SECTION_DEFINITIONS.setting,
    THEME3_SECTION_DEFINITIONS.band,
    THEME3_SECTION_DEFINITIONS.shape,
  ]),
});

export const getTheme3Sections = (flow) =>
  THEME3_FLOW_SECTIONS[flow] || THEME3_FLOW_SECTIONS[DEFAULT_CONFIGURATOR_CONFIG.flow];

const VALID_THEMES = new Set(["default", "theme-3"]);
const FLOW_ALIASES = new Map([
  ["3A", "setting-only"],
  ["3B", "diamond-preview"],
  ["SETTING-ONLY", "setting-only"],
  ["DIAMOND-PREVIEW", "diamond-preview"],
]);

const readBoolean = (value, fallback) => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return fallback;

  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return fallback;
};

export function resolveConfiguratorConfig({ search = "", parentConfig = {} } = {}) {
  const params = new URLSearchParams(search);
  const requestedTheme = params.get("theme") || parentConfig.theme;
  const requestedFlow = String(
    params.get("flow") || parentConfig.flow || DEFAULT_CONFIGURATOR_CONFIG.flow
  ).toUpperCase();
  const requestedFilters = params.has("showDiamondFilters")
    ? params.get("showDiamondFilters")
    : parentConfig.showDiamondFilters;

  const theme = VALID_THEMES.has(requestedTheme)
    ? requestedTheme
    : DEFAULT_CONFIGURATOR_CONFIG.theme;
  const flow = FLOW_ALIASES.get(requestedFlow) || DEFAULT_CONFIGURATOR_CONFIG.flow;

  return {
    theme,
    flow,
    showDiamondFilters:
      flow === "diamond-preview" &&
      readBoolean(requestedFilters, DEFAULT_CONFIGURATOR_CONFIG.showDiamondFilters),
  };
}

export function resolveConfiguratorConfigWithParentPriority({ search = "", parentConfig = {} } = {}) {
  const urlConfig = resolveConfiguratorConfig({ search, parentConfig: {} });
  const parentOnlyConfig = resolveConfiguratorConfig({ search: "", parentConfig });
  const parentFlowKey = parentConfig.flow ? String(parentConfig.flow).toUpperCase() : "";

  const hasValidParentTheme = VALID_THEMES.has(parentConfig.theme);
  const hasValidParentFlow = FLOW_ALIASES.has(parentFlowKey);

  const theme = hasValidParentTheme ? parentOnlyConfig.theme : urlConfig.theme;
  const flow = hasValidParentFlow ? parentOnlyConfig.flow : urlConfig.flow;
  const showDiamondFilters =
    flow === "diamond-preview" &&
    (
      hasValidParentFlow && parentConfig.showDiamondFilters !== undefined
        ? readBoolean(parentConfig.showDiamondFilters, DEFAULT_CONFIGURATOR_CONFIG.showDiamondFilters)
        : urlConfig.showDiamondFilters
    );

  return {
    theme,
    flow,
    showDiamondFilters,
  };
}

export function getBrowserConfiguratorConfig() {
  if (typeof window === "undefined") return DEFAULT_CONFIGURATOR_CONFIG;

  const parentConfig =
    window.__parentConfig?.configurator || window.__parentConfig || {};

  return resolveConfiguratorConfig({
    search: window.location.search,
    parentConfig,
  });
}
