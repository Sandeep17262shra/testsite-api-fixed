import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CONFIGURATOR_CONFIG,
  resolveConfiguratorConfig,
  resolveConfiguratorConfigWithParentPriority,
} from "../configuratorConfig";

const EMPTY_STORE_CONTEXT = Object.freeze({
  parentUrl: "",
  shop: "",
  token: "",
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

export const normalizeHttpUrl = (value) => {
  const nextValue = toSafeString(value);
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

  const domainPattern =
    /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

  return domainPattern.test(nextValue) ? nextValue : "";
};

const normalizeToken = (value) => {
  const nextValue = toSafeString(value);
  return nextValue ? nextValue : "";
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

const hasStoreMessageShape = (data) => {
  if (!data || typeof data !== "object") return false;

  return Boolean(
    Object.prototype.hasOwnProperty.call(data, "parentUrl") ||
      Object.prototype.hasOwnProperty.call(data, "shop") ||
      Object.prototype.hasOwnProperty.call(data, "token") ||
      Object.prototype.hasOwnProperty.call(data, "theme") ||
      Object.prototype.hasOwnProperty.call(data, "flow") ||
      Object.prototype.hasOwnProperty.call(data, "configurator")
  );
};

const normalizeContextInput = (input = {}, source = "fallback", preferThemeFlow = false) => {
  const parentUrl = normalizeHttpUrl(input.parentUrl);
  const parentOrigin = parentUrl ? toHttpOrigin(parentUrl) : "";
  const shop = normalizeShop(input.shop);
  const token = normalizeToken(input.token);
  const configuratorConfig = resolveThemeFlow(input, preferThemeFlow);

  return {
    parentUrl,
    shop,
    token,
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
  if (fromParentConfig.parentUrl || fromParentConfig.shop || fromParentConfig.token || hasThemeFlowInput(parentConfig)) {
    return fromParentConfig;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const queryParent = params.get("parentUrl") || params.get("parent") || params.get("store") || params.get("shop");
    if (queryParent) {
      const normalizedQueryUrl = normalizeHttpUrl(queryParent);
      return normalizeContextInput({ parentUrl: normalizedQueryUrl || queryParent }, "searchParams", false);
    }
  } catch {}

  const embedded = isEmbeddedWindow();
  if (embedded && document.referrer) {
    const referrerUrl = normalizeHttpUrl(document.referrer);
    if (referrerUrl) {
      return normalizeContextInput({ parentUrl: referrerUrl }, "document.referrer", false);
    }
  }

  return normalizeContextInput({ parentUrl: window.location.href }, "standalone", false);
};

const isSameStoreContext = (previous, next) =>
  previous.parentUrl === next.parentUrl &&
  previous.shop === next.shop &&
  previous.token === next.token &&
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

  useEffect(() => {
    if (!isBrowser()) return undefined;

    const handleStoreMessage = (event) => {
      if (!hasStoreMessageShape(event.data)) return;

      const normalizedPayload = normalizeContextInput(event.data, "postMessage", true);
      if (
        !normalizedPayload.parentUrl &&
        !normalizedPayload.shop &&
        !normalizedPayload.token &&
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
          token: normalizedPayload.token || previous.token,
          contextSource: "postMessage",
          isReady: true,
        };

        return isSameStoreContext(previous, nextContext) ? previous : nextContext;
      });
    };

    window.addEventListener("message", handleStoreMessage);
    return () => window.removeEventListener("message", handleStoreMessage);
  }, []);

  const value = useMemo(() => storeContext, [storeContext]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStoreContext = () => useContext(StoreContext);
