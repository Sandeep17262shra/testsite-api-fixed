import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CONFIGURATOR_CONFIG,
  resolveConfiguratorConfig,
  resolveConfiguratorConfigWithParentPriority,
} from "../configuratorConfig";
import { normalizeHeadingTypography } from "../headingTypography.js";
import { normalizeButtonTypography } from "../buttonTypography.js";
import { normalizeBodyTypography } from "../bodyTypography.js";
import { normalizeLinkTypography } from "../linkTypography.js";

const EMPTY_STORE_CONTEXT = Object.freeze({
  parentUrl: "",
  shop: "",
  canonicalShop: "",
  planStatus: "",
  removeLogo: null,
  token: "",
  appearance: null,
  headingTypography: null,
  buttonTypography: null,
  bodyTypography: null,
  linkTypography: null,
  parentOrigin: "",
  theme: DEFAULT_CONFIGURATOR_CONFIG.theme,
  flow: DEFAULT_CONFIGURATOR_CONFIG.flow,
  showDiamondFilters: DEFAULT_CONFIGURATOR_CONFIG.showDiamondFilters,
  isEmbedded: false,
  isReady: false,
  contextSource: "initial",
});

export const StoreContext = createContext(EMPTY_STORE_CONTEXT);

const isBrowser = () => typeof window !== "undefined";

const isEmbeddedWindow = () => {
  if (!isBrowser()) return false;

  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

const toSafeString = (value) => (typeof value === "string" ? value.trim() : "");

const APPEARANCE_FIELD_ALIASES = {
  primaryColor: ["primaryColor", "primary_color", "primary-color", "primary"],
  primaryTextColor: [
    "primaryTextColor",
    "primary_text_color",
    "primary-text-color",
    "primaryText",
    "primary_text",
  ],
  secondaryColor: ["secondaryColor", "secondary_color", "secondary-color", "secondary"],
  secondaryTextColor: [
    "secondaryTextColor",
    "secondary_text_color",
    "secondary-text-color",
    "secondaryText",
    "secondary_text",
  ],
  hoverSecondaryColor: [
    "hoverSecondaryColor",
    "hover_secondary_color",
    "hover-secondary-color",
    "hoverPrimaryColor",
    "hover_primary_color",
    "hover-primary-color",
    "hoverColor",
    "hover_color",
  ],
};

const normalizeCssColor = (value) => {
  const str = toSafeString(value);
  if (!str) return "";

  const candidate = str.startsWith("#") ? str : `#${str}`;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(candidate)) {
    if (candidate.length === 4) {
      return `#${candidate[1]}${candidate[1]}${candidate[2]}${candidate[2]}${candidate[3]}${candidate[3]}`.toUpperCase();
    }
    return candidate.toUpperCase();
  }

  if (/^(rgb|hsl)a?\(.+\)$/i.test(str)) {
    return str;
  }

  return "";
};

export const normalizeAppearance = (value) => {
  if (!value) return null;

  let parsed = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }

  if (!parsed || typeof parsed !== "object") return null;

  const appearance = {};
  for (const [targetKey, aliases] of Object.entries(APPEARANCE_FIELD_ALIASES)) {
    for (const alias of aliases) {
      const color = normalizeCssColor(parsed[alias]);
      if (color) {
        appearance[targetKey] = color;
        break;
      }
    }
  }

  return Object.keys(appearance).length ? appearance : null;
};

export const normalizeHttpUrl = (value) => {
  const rawValue = toSafeString(value);
  // Store payloads may provide a hostname (for example
  // `jdemo364.wpenginepowered.com`) rather than a complete URL.
  const nextValue = rawValue && !/^[a-z][a-z\d+.-]*:\/\//i.test(rawValue)
    ? `https://${rawValue}`
    : rawValue;
  if (!nextValue) return "";

  try {
    const parsed = new URL(nextValue);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return parsed.href;
  } catch {
    return "";
  }
};

export const toHttpOrigin = (value) => {
  const normalizedUrl = normalizeHttpUrl(value);
  if (!normalizedUrl) return "";

  try {
    return new URL(normalizedUrl).origin;
  } catch {
    return "";
  }
};

const normalizeShop = (value) => {
  const nextValue = toSafeString(value).toLowerCase();
  if (!nextValue || nextValue.length > 253 || /\s/.test(nextValue)) return "";

  const domainOrSlugPattern =
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/;

  return domainOrSlugPattern.test(nextValue) ? nextValue : "";
};

const normalizeToken = (value) => {
  const nextValue = toSafeString(value);
  return nextValue ? nextValue : "";
};

const normalizePlanStatus = (value) => {
  if (value === false || String(value ?? "").trim().toLowerCase() === "false") return "inactive";
  if (value === true) return "active";
  return toSafeString(value).toLowerCase();
};

const getParentConfigObject = (candidate = {}) => {
  if (!candidate || typeof candidate !== "object") return {};
  return candidate.configurator && typeof candidate.configurator === "object"
    ? candidate.configurator
    : candidate;
};

const hasThemeFlowInput = (candidate = {}) => {
  const parentConfig = getParentConfigObject(candidate);
  return Boolean(parentConfig.theme || parentConfig.flow || parentConfig.showDiamondFilters !== undefined);
};

const resolveThemeFlow = (candidate = {}, preferCandidate = false) => {
  if (!isBrowser()) return DEFAULT_CONFIGURATOR_CONFIG;

  const parentConfig = getParentConfigObject(candidate);
  const shouldPreferCandidate = preferCandidate && hasThemeFlowInput(candidate);

  if (shouldPreferCandidate) {
    return resolveConfiguratorConfigWithParentPriority({
      search: window.location.search,
      parentConfig,
    });
  }

  return resolveConfiguratorConfig({
    search: window.location.search,
    parentConfig,
  });
};

const normalizeRemoveLogo = (value) => {
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === "true" || trimmed === "yes" || trimmed === "1") return true;
    if (trimmed === "false" || trimmed === "no" || trimmed === "0") return false;
  }
  return null;
};

const hasStoreMessageShape = (data) => {
  if (!data || typeof data !== "object") return false;

  return Boolean(
    Object.prototype.hasOwnProperty.call(data, "parentUrl") ||
      Object.prototype.hasOwnProperty.call(data, "shop") ||
      Object.prototype.hasOwnProperty.call(data, "canonicalShop") ||
      Object.prototype.hasOwnProperty.call(data, "planStatus") ||
      Object.prototype.hasOwnProperty.call(data, "removeLogo") ||
      Object.prototype.hasOwnProperty.call(data, "remove_logo") ||
      Object.prototype.hasOwnProperty.call(data, "removelogo") ||
      Object.prototype.hasOwnProperty.call(data, "token") ||
      Object.prototype.hasOwnProperty.call(data, "appearance") ||
      Object.prototype.hasOwnProperty.call(data, "theme") ||
      Object.prototype.hasOwnProperty.call(data, "flow") ||
      Object.prototype.hasOwnProperty.call(data, "configurator")
  );
};

const normalizeContextInput = (input = {}, source = "fallback", preferThemeFlow = false) => {
  const nestedConfig = getParentConfigObject(input);
  const parentUrl = normalizeHttpUrl(input.parentUrl || nestedConfig.parentUrl);
  const parentOrigin = parentUrl ? toHttpOrigin(parentUrl) : "";
  const shop = normalizeShop(input.shop || nestedConfig.shop);
  const canonicalShop = normalizeShop(input.canonicalShop || nestedConfig.canonicalShop);
  const planStatus = normalizePlanStatus(input.planStatus ?? nestedConfig.planStatus);
  const removeLogoRaw =
    input.removeLogo ??
    input.remove_logo ??
    input.removelogo ??
    input.isRemoveLogo ??
    input.is_remove_logo ??
    nestedConfig.removeLogo ??
    nestedConfig.remove_logo ??
    nestedConfig.removelogo ??
    nestedConfig.isRemoveLogo ??
    nestedConfig.is_remove_logo ??
    input.settings?.removeLogo ??
    input.settings?.remove_logo ??
    input.appearance?.removeLogo ??
    input.appearance?.remove_logo ??
    nestedConfig.settings?.removeLogo ??
    nestedConfig.settings?.remove_logo;
  const removeLogo = normalizeRemoveLogo(removeLogoRaw);
  const token = normalizeToken(input.token || nestedConfig.token);
  const appearance = normalizeAppearance(input.appearance || nestedConfig.appearance);
  const configuratorConfig = resolveThemeFlow(input, preferThemeFlow);

  return {
    parentUrl,
    shop,
    canonicalShop,
    planStatus,
    removeLogo,
    token,
    appearance,
    parentOrigin,
    theme: configuratorConfig.theme,
    flow: configuratorConfig.flow,
    showDiamondFilters: configuratorConfig.showDiamondFilters,
    isEmbedded: isEmbeddedWindow(),
    isReady: true,
    contextSource: source,
  };
};

const getInitialStoreContext = () => {
  if (!isBrowser()) return EMPTY_STORE_CONTEXT;

  const parentConfig = window.__parentConfig || {};
  const fromParentConfig = normalizeContextInput(parentConfig, "parentConfig", true);
  if (fromParentConfig.parentUrl || fromParentConfig.shop || fromParentConfig.canonicalShop || fromParentConfig.planStatus || fromParentConfig.removeLogo !== null || fromParentConfig.token || fromParentConfig.appearance || hasThemeFlowInput(parentConfig)) {
    return fromParentConfig;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const queryParent = params.get("parentUrl") || params.get("parent");
    const queryShop = params.get("shop") || params.get("store") || "";
    const queryAppearance = params.get("appearance") || params.get("theme_appearance") || null;
    const queryRemoveLogo =
      params.get("removeLogo") ||
      params.get("remove_logo") ||
      params.get("removelogo");
    if (queryParent || queryShop || queryAppearance || queryRemoveLogo) {
      const normalizedQueryUrl = normalizeHttpUrl(queryParent);
      return normalizeContextInput({
        parentUrl: normalizedQueryUrl || queryParent || "",
        shop: queryShop,
        canonicalShop: params.get("canonicalShop") || "",
        planStatus: params.get("planStatus") || "",
        removeLogo: queryRemoveLogo ? normalizeRemoveLogo(queryRemoveLogo) : null,
        appearance: queryAppearance,
      }, "searchParams", false);
    }
  } catch {}

  const embedded = isEmbeddedWindow();
  if (embedded && document.referrer) {
    const referrerUrl = normalizeHttpUrl(document.referrer);
    if (referrerUrl) {
      return normalizeContextInput({ parentUrl: referrerUrl }, "document.referrer", false);
    }
  }

  // Running standalone (not embedded, no query params).
  // Treat localhost as default mode — do NOT pass it as a store parentUrl
  // or it gets mistaken for a real store and restricts available options.
  const selfUrl = window.location.href;
  const selfHostname = (() => { try { return new URL(selfUrl).hostname; } catch { return ""; } })();
  const isDefaultConfiguratorHost =
    selfHostname === "localhost" ||
    selfHostname === "127.0.0.1" ||
    selfHostname.endsWith(".projects.apps.keyideasglobal.com");
  if (isDefaultConfiguratorHost) {
    return normalizeContextInput({ parentUrl: "" }, "standalone", false);
  }

  return normalizeContextInput({ parentUrl: selfUrl }, "standalone", false);
};

const isSameStoreContext = (previous, next) =>
  previous.parentUrl === next.parentUrl &&
  previous.shop === next.shop &&
  previous.canonicalShop === next.canonicalShop &&
  previous.planStatus === next.planStatus &&
  previous.removeLogo === next.removeLogo &&
  previous.token === next.token &&
  JSON.stringify(previous.appearance) === JSON.stringify(next.appearance) &&
  previous.parentOrigin === next.parentOrigin &&
  previous.theme === next.theme &&
  previous.flow === next.flow &&
  previous.showDiamondFilters === next.showDiamondFilters &&
  previous.isEmbedded === next.isEmbedded &&
  previous.contextSource === next.contextSource;

const getTrustedReferrerOrigin = () => {
  if (!isBrowser() || !document.referrer) return "";
  return toHttpOrigin(document.referrer);
};

const isTrustedStoreMessage = (event, normalizedPayload) => {
  if (!isBrowser()) return false;
  if (window.parent && event.source !== window.parent) return false;

  const referrerOrigin = getTrustedReferrerOrigin();
  if (referrerOrigin) return event.origin === referrerOrigin;

  if (normalizedPayload.parentOrigin) return event.origin === normalizedPayload.parentOrigin;

  return false;
};

export const StoreProvider = ({ children }) => {
  const [storeContext, setStoreContext] = useState(getInitialStoreContext);
  const setAppearance = useCallback((appearance) => {
    const normalizedAppearance = normalizeAppearance(appearance);
    setStoreContext((previous) =>
      JSON.stringify(previous.appearance) === JSON.stringify(normalizedAppearance)
        ? previous
        : { ...previous, appearance: normalizedAppearance }
    );
  }, []);
  const setHeadingTypography = useCallback((heading) => {
    const normalizedHeading = normalizeHeadingTypography(heading);
    setStoreContext((previous) =>
      JSON.stringify(previous.headingTypography) === JSON.stringify(normalizedHeading)
        ? previous
        : { ...previous, headingTypography: normalizedHeading }
    );
  }, []);
  const setButtonTypography = useCallback((button) => {
    const normalizedButton = normalizeButtonTypography(button);
    setStoreContext((previous) =>
      JSON.stringify(previous.buttonTypography) === JSON.stringify(normalizedButton)
        ? previous
        : { ...previous, buttonTypography: normalizedButton }
    );
  }, []);
  const setBodyTypography = useCallback((body) => {
    const normalizedBody = normalizeBodyTypography(body);
    setStoreContext((previous) =>
      JSON.stringify(previous.bodyTypography) === JSON.stringify(normalizedBody)
        ? previous
        : { ...previous, bodyTypography: normalizedBody }
    );
  }, []);
  const setLinkTypography = useCallback((links) => {
    const normalizedLinks = normalizeLinkTypography(links);
    setStoreContext((previous) =>
      JSON.stringify(previous.linkTypography) === JSON.stringify(normalizedLinks)
        ? previous
        : { ...previous, linkTypography: normalizedLinks }
    );
  }, []);
  const setRemoveLogo = useCallback((removeLogo) => {
    const normalized = normalizeRemoveLogo(removeLogo);
    if (normalized !== null) {
      setStoreContext((previous) =>
        previous.removeLogo === normalized
          ? previous
          : { ...previous, removeLogo: normalized }
      );
    }
  }, []);
  useEffect(() => {
    if (!isBrowser()) return undefined;

    const handleStoreMessage = (event) => {
      if (!hasStoreMessageShape(event.data)) return;

      const normalizedPayload = normalizeContextInput(event.data, "postMessage", true);
      if (
        !normalizedPayload.parentUrl &&
        !normalizedPayload.shop &&
        !normalizedPayload.canonicalShop &&
        !normalizedPayload.planStatus &&
        normalizedPayload.removeLogo === null &&
        !normalizedPayload.token &&
        !normalizedPayload.appearance &&
        !hasThemeFlowInput(event.data)
      ) {
        return;
      }

      if (!isTrustedStoreMessage(event, normalizedPayload)) return;

      setStoreContext((previous) => {
        const nextContext = {
          ...previous,
          ...normalizedPayload,
          parentUrl: normalizedPayload.parentUrl || previous.parentUrl,
          parentOrigin: normalizedPayload.parentOrigin || previous.parentOrigin,
          shop: normalizedPayload.shop || previous.shop,
          canonicalShop: normalizedPayload.canonicalShop || previous.canonicalShop,
          planStatus: normalizedPayload.planStatus || previous.planStatus,
          removeLogo: normalizedPayload.removeLogo === null ? previous.removeLogo : normalizedPayload.removeLogo,
          token: normalizedPayload.token || previous.token,
          appearance: normalizedPayload.appearance || previous.appearance,
          contextSource: "postMessage",
          isReady: true,
        };

        return isSameStoreContext(previous, nextContext) ? previous : nextContext;
      });
    };

    window.addEventListener("message", handleStoreMessage);
    return () => window.removeEventListener("message", handleStoreMessage);
  }, []);

  const value = useMemo(
    () => ({
      ...storeContext,
      setAppearance,
      setHeadingTypography,
      setButtonTypography,
      setBodyTypography,
      setLinkTypography,
      setRemoveLogo,
    }),
    [storeContext, setAppearance, setHeadingTypography, setButtonTypography, setBodyTypography, setLinkTypography, setRemoveLogo]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStoreContext = () => useContext(StoreContext);
