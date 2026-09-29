/**
 * parentCategoryConfig.js
 *
 * Same idea as src/lib/ring-configurator/utility/Parentconfig.js's parent-URL
 * based config, but for a much simpler question: which jewelry categories
 * (Necklace / Bracelet / Bead Bracelet) should THIS embedding site's customers be allowed to
 * pick from in the Category switcher?
 *
 * To onboard a new store: add one entry to STORE_RULES below with its
 * hostname/identifier substrings and allowed categories. Anything that
 * matches no rule falls back to DEFAULT_CATEGORIES (shows everything).
 */

// Each store is matched by ANY of its substrings being found in the
// incoming parent value — the real embedding hostname (e.g.
// "jdemo364.wpenginepowered.com") in production, but some integrations
// (and the storefront simulator) only ever send the short identifier
// (e.g. "jdemo364.wpenginepowered", no ".com") as the parent value, so
// both forms are listed explicitly rather than relying on one implying
// the other.
const STORE_RULES = [
    {
        key: "jdemo364.wpenginepowered",
        matchSubstrings: ["jdemo364.wpenginepowered.com", "jdemo364.wpenginepowered"],
        categories: ["necklace"],
    },
    {
        key: "keyideas",
        matchSubstrings: ["shopify-jewelry-apps.keyideasinfotech.com", "keyideas"],
        categories: ["necklace", "bracelet", "bead-bracelet"],
    },
];

// Unknown/unrecognized parent — show everything.
const DEFAULT_CATEGORIES = ["necklace", "bracelet", "bead-bracelet"];

const resolveStoreRule = (parentUrl) => {
    if (!parentUrl) return null;
    const lower = String(parentUrl).toLowerCase();

    return STORE_RULES.find((rule) => rule.matchSubstrings.some((sub) => lower.includes(sub))) ?? null;
};

/**
 * Resolve the embedding parent's URL when nothing else (ShareContext's
 * `parent`, etc.) has already supplied one. Mirrors the ring configurator's
 * resolveParentUrl(): window.__parentConfig, then iframe referrer, then a
 * `parentUrl`/`parent`/`store`/`shop` query param, then the page's own URL.
 */
export const resolveParentUrl = () => {
    if (typeof window === "undefined") return "";

    const fromConfig = window.__parentConfig?.parentUrl;
    if (fromConfig) return fromConfig;

    if (window.self !== window.top && document.referrer) {
        return document.referrer;
    }

    try {
        const params = new URLSearchParams(window.location.search);
        const fromQuery =
            params.get("parentUrl") ||
            params.get("parent") ||
            params.get("store") ||
            params.get("shop");
        if (fromQuery) return fromQuery;
    } catch (error) {
        // ignore
    }

    return window.location.href;
};

/**
 * Get the list of jewelry categories allowed for this parent URL.
 * @param {string|null} parentUrl
 * @returns {string[]} e.g. ["necklace"] or ["necklace", "bracelet"]
 */
export const getAllowedCategories = (parentUrl) => {
    const rule = resolveStoreRule(parentUrl);
    return rule?.categories ?? DEFAULT_CATEGORIES;
};

/**
 * Check if a single category ("necklace" | "bracelet" | "bead-bracelet") is allowed for this
 * parent URL.
 * @param {string|null} parentUrl
 * @param {string} category
 * @returns {boolean}
 */
export const isCategoryAllowed = (parentUrl, category) => {
    return getAllowedCategories(parentUrl).includes(category);
};
