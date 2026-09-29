/**
 * Central configuration for all parent URL-based customizations.
 * Add new clients here and the assistant/store behavior will inherit it.
 */

const PARENT_CONFIGS = [
  {
    key: "anelladiamond",
    logo: "//anelladiamonds.com/cdn/shop/files/Screenshot_2026-01-02_at_9.28.30_PM.png?v=1767418140&width=600",
    logoClass: "h-[37px]",
    currency: "$",
    currencyCode: "USD",
    locale: "en-US",
    language: "en",
    currencyRate: 1,
    hideNaturalOption: true,
    homeUrl: "https://anelladiamonds.com/",
    contactUrl: "https://anelladiamonds.com/pages/contact",
    fancyPriceFactor: 0.7,
    ringSizeType: "R1",
  },
  {
    key: "bongioielli",
    logo: "https://www.bongioielli.com/wp-content/themes/bongioielli/assets/image/header/bg-dark-logo.png",
    logoClass: "h-[37px]",
    currency: "€",
    currencyCode: "EUR",
    locale: "it-IT",
    language: "it",
    currencyRate: 1,
    hideNaturalOption: false,
    homeUrl: "https://bongioielli.com/",
    contactUrl: "https://www.bongioielli.com/contattaci/",
    fancyPriceFactor: 0.7,
    ringSizeType: "R1",
  },
  {
    key: "dimendscaasi",
    logo: "https://www.dimendscaasi.com/wp-content/themes/dimendcaasi/images/ds-logo-new-160.webp",
    logoClass: "w-[145px]",
    currency: "$",
    currencyCode: "USD",
    locale: "en-US",
    language: "en",
    currencyRate: 1,
    hideNaturalOption: false,
    homeUrl: "https://www.dimendscaasi.com/",
    contactUrl: "https://www.dimendscaasi.com/contact-us/",
    fancyPriceFactor: 0.7,
    ringSizeType: "R1",
  },
  {
    key: "elitejewelers",
    logo: "//www.elitejewelers.com/cdn/shop/files/Elite_logo_HR.jpg?v=1692222877&width=600",
    logoClass: "w-[145px]",
    currency: "$",
    currencyCode: "USD",
    locale: "en-US",
    language: "en",
    currencyRate: 1,
    hideNaturalOption: false,
    homeUrl: "https://www.elitejewelers.com/",
    contactUrl: "https://www.elitejewelers.com/pages/contact",
    fancyPriceFactor: 0.7,
    ringSizeType: "R1",
  },
  {
    key: "labgrownlove",
    logo: "/images/labgrownlove.webp",
    logoClass: "w-[145px]",
    currency: "€",
    currencyCode: "EUR",
    locale: "de-DE",
    language: "de",
    currencyRate: 1,
    hideNaturalOption: false,
    homeUrl: "https://labgrownlove.de/en",
    contactUrl: "https://labgrownlove.de/en/pages/kontakt",
    fancyPriceFactor: 1,
    ringSizeType: "R3",
    summaryTaxLabel: "+tax",
  },
];

const DEFAULT_CONFIG = {
  currency: "$",
  currencyCode: "USD",
  locale: "en-US",
  language: "en",
  currencyRate: 1,
  hideNaturalOption: false,
  homeUrl: "/",
  contactUrl: null,
  fancyPriceFactor: 0.7,
  ringSizeType: "R1",
  summaryTaxLabel: null,
};

const getConfig = (parentUrl) => {
  if (!parentUrl) return null;
  const lower = parentUrl.toLowerCase();
  return PARENT_CONFIGS.find((config) => lower.includes(config.key)) ?? null;
};

export const resolveParentUrl = () => {
  if (typeof window === "undefined") return "";

  const fromConfig = window.__parentConfig?.parentUrl;
  if (fromConfig) return fromConfig;

  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("parentUrl") || params.get("parent") || params.get("store") || params.get("shop");
    if (fromQuery) return fromQuery;
  } catch {}

  if (window.self !== window.top && document.referrer) {
    return document.referrer;
  }

  return window.location.href;
};

export const getLogo = (parentUrl) => getConfig(parentUrl)?.logo ?? "";
export const getLogoClass = (parentUrl) => getConfig(parentUrl)?.logoClass ?? "";
export const getCurrencySign = (parentUrl) => getConfig(parentUrl)?.currency ?? DEFAULT_CONFIG.currency;
export const getStoreCurrencyCode = (parentUrl) => getConfig(parentUrl)?.currencyCode ?? DEFAULT_CONFIG.currencyCode;
export const getStoreLocale = (parentUrl) => getConfig(parentUrl)?.locale ?? DEFAULT_CONFIG.locale;
export const getStoreLanguage = (parentUrl) => getConfig(parentUrl)?.language ?? DEFAULT_CONFIG.language;
export const getContactUrl = (parentUrl) => getConfig(parentUrl)?.contactUrl ?? DEFAULT_CONFIG.contactUrl;
export const getCurrencyRate = (parentUrl) => getConfig(parentUrl)?.currencyRate ?? DEFAULT_CONFIG.currencyRate;
export const hideNaturalOption = (parentUrl) => getConfig(parentUrl)?.hideNaturalOption ?? DEFAULT_CONFIG.hideNaturalOption;
export const isKnownParent = (parentUrl) => getConfig(parentUrl) !== null;
export const getFancyPriceFactor = (parentUrl) => getConfig(parentUrl)?.fancyPriceFactor ?? DEFAULT_CONFIG.fancyPriceFactor;
export const getRingSizeType = (parentUrl) => getConfig(parentUrl)?.ringSizeType ?? DEFAULT_CONFIG.ringSizeType;
export const getSummaryTaxLabel = (parentUrl) => getConfig(parentUrl)?.summaryTaxLabel ?? DEFAULT_CONFIG.summaryTaxLabel;

export const normalizeRingSizeSystem = (type) => {
  const map = {
    R1: "US",
    R2: "UK",
    R3: "EU",
    R4: "TR",
    R5: "UA",
    R6: "IT",
    R7: "HK",
  };
  return (type && map[type]) || type || "US";
};
export const getHomeUrl = (parentUrl) => {
  const known = getConfig(parentUrl);
  if (known?.homeUrl) return known.homeUrl;

  // Unknown parent: fall back to that storefront's own origin instead of "/"
  if (parentUrl) {
    try {
      return new URL(parentUrl).origin + "/";
    } catch (error) {
      console.warn("Failed to parse parentUrl for home fallback:", parentUrl, error);
    }
  }

  return DEFAULT_CONFIG.homeUrl; // final fallback: "/" (not embedded, or no parentUrl at all)
};
export const formatStoreCurrency = (amount, parentUrl, options = {}) => {
  const locale = getStoreLocale(parentUrl);
  const currency = getStoreCurrencyCode(parentUrl);

  try {
    // Keep storefront configurator prices consistent with USD: symbol first
    // and comma thousands separators. The Italian/German browser locales place
    // EUR after the number and use a period as the grouping separator.
    if (currency === "EUR") {
      const value = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount ?? 0);

      return `€${value}`;
    }

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      ...options,
    }).format(amount ?? 0);
  } catch (error) {
    return `${getCurrencySign(parentUrl)}${Math.round(amount ?? 0)}`;
  }
};
