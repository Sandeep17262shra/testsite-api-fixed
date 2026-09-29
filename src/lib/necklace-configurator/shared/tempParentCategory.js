/**
 * TEMPORARY — opens the right category based on the embedding page.
 *
 *   /pages/pendant-customizer  -> Necklace
 *   /pages/bracelet-customizer -> Bracelet
 *
 * The parent page URL is read from the iframe `?parentUrl=` query (sync, on
 * load) or from a `{ parentUrl }` postMessage (late). A shared `?config=`
 * link always wins. Remove this file + its 3 uses in BraceletContext.jsx
 * when the real per-store config is in place.
 */

const TEMP_PARENT_CATEGORY_RULES = [
    { match: "/pages/pendant-customizer", category: "necklace" },
    { match: "/pages/bracelet-customizer", category: "bracelet" },
];

export const getTempCategoryForParentUrl = (parentUrl) => {
    if (!parentUrl) return null;
    const lower = String(parentUrl).toLowerCase();
    return TEMP_PARENT_CATEGORY_RULES.find((rule) => lower.includes(rule.match))?.category ?? null;
};

// Sync lookup at first render: iframe query param, then an early postMessage
// already caught by the layout bootstrap (window.__parentConfig).
export const getTempInitialParentCategory = () => {
    if (typeof window === "undefined") return null;
    let fromQuery = "";
    try {
        fromQuery = new URLSearchParams(window.location.search).get("parentUrl") || "";
    } catch (error) {
        // ignore
    }
    return (
        getTempCategoryForParentUrl(fromQuery) ||
        getTempCategoryForParentUrl(window.__parentConfig?.parentUrl)
    );
};
