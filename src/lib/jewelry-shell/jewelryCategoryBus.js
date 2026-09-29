/**
 * jewelryCategoryBus.js
 *
 * Glue that lets ONE url — /Jewelery-customizer — serve three separate
 * configurator apps (necklace, bracelet, bead bracelet) without the apps
 * knowing about each other, without the url ever changing, and without a page
 * reload when you switch.
 *
 * Why each app runs in its own <iframe> rather than side by side in one React
 * tree: src/lib/necklace-configurator and src/lib/beeds-configurator are forks
 * that each ship ~590 GLOBAL css rules, 391 of them on the very same selectors
 * (a bare `*`, `body`, `.theme3-*`, `.bracelet-*`, ...). Two of those
 * stylesheets in one document means whichever loaded last silently restyles the
 * other app. A frame gives each one its own document, so both stay untouched.
 *
 * The frames are kept mounted once opened, so switching back is instant.
 */

export const JEWELRY_SHELL_PATH = "/Jewelery-customizer";

/** postMessage sent frame -> shell. */
export const JEWELRY_SHELL_MESSAGE = "jewelry-shell:category";

/**
 * postMessage sent shell -> necklace frame, once it's already mounted, to
 * flip it between its "necklace" and "bracelet" views in place. Necklace and
 * bracelet are the same app/frame, so once that frame exists we must not
 * change its `src` again (that forces a real navigation/reload of the whole
 * document, seen as a grey flash) — this lets the shell ask the already-open
 * app to switch the way its own in-app tabs already do, with no reload.
 */
export const JEWELRY_TYPE_SWITCH_MESSAGE = "jewelry-shell:set-type";

export const JEWELRY_CATEGORY_STORAGE_KEY = "jewelry-shell:category";

export const JEWELRY_CATEGORIES = ["necklace", "bracelet", "bead-bracelet"];

/** necklace + bracelet are the same app; bead bracelet is the other one. */
export const JEWELRY_FRAME_PATHS = {
    necklace: "/jewelry-frame/necklace",
    beads: "/jewelry-frame/bead-bracelet",
};

export const jewelryAppForCategory = (category) =>
    normalizeJewelryCategory(category) === "bead-bracelet" ? "beads" : "necklace";

export function normalizeJewelryCategory(value, fallback = "necklace") {
    const lower = String(value || "").toLowerCase();
    return JEWELRY_CATEGORIES.includes(lower) ? lower : fallback;
}

// ── inside a frame ────────────────────────────────────────────────────────────

/**
 * The configurators are also reachable on their own dedicated routes
 * (/beaded-bracelet-configurator, ...) where there is no shell to switch to, so
 * the cross-category buttons only render when the shell loaded us.
 */
export const isJewelryShellActive = () => {
    if (typeof window === "undefined") return false;
    try {
        return new URLSearchParams(window.location.search).get("shell") === "1";
    } catch (error) {
        return false;
    }
};

const postToShell = (category, shouldSwitch) => {
    try {
        window.parent.postMessage(
            { type: JEWELRY_SHELL_MESSAGE, switch: shouldSwitch, category },
            "*"
        );
    } catch (error) {
        // ignore
    }
};

/** Switch to another app. The shell swaps frames — no reload, same url. */
export const requestJewelryCategory = (category) => {
    if (typeof window === "undefined") return;
    const next = normalizeJewelryCategory(category);

    if (isJewelryShellActive()) {
        postToShell(next, true);
        return;
    }

    // Opened on a standalone route: send them to the merged page instead.
    storeJewelryCategory(next);
    window.location.assign(JEWELRY_SHELL_PATH);
};

/**
 * Necklace <-> Bracelet happens inside the necklace app itself (no frame swap),
 * so this only records the pick — a later reload lands on the same one.
 */
export const rememberJewelryCategory = (category) => {
    if (typeof window === "undefined") return;
    const next = normalizeJewelryCategory(category);
    if (isJewelryShellActive()) postToShell(next, false);
    else storeJewelryCategory(next);
};

// ── shell side ────────────────────────────────────────────────────────────────

export const storeJewelryCategory = (category) => {
    try {
        window.sessionStorage.setItem(
            JEWELRY_CATEGORY_STORAGE_KEY,
            normalizeJewelryCategory(category)
        );
    } catch (error) {
        // private mode / blocked storage — the default category is used
    }
};

/**
 * Which app this load should open with: an explicit `?category=` (so a store
 * menu can still deep-link), else the last pick in this tab, else necklace.
 */
export const readStoredJewelryCategory = () => {
    if (typeof window === "undefined") return "necklace";

    let fromQuery = "";
    try {
        fromQuery = new URLSearchParams(window.location.search).get("category") || "";
    } catch (error) {
        // ignore
    }
    if (JEWELRY_CATEGORIES.includes(fromQuery.toLowerCase())) return fromQuery.toLowerCase();

    try {
        return normalizeJewelryCategory(
            window.sessionStorage.getItem(JEWELRY_CATEGORY_STORAGE_KEY)
        );
    } catch (error) {
        return "necklace";
    }
};

/** The embedding store, for the frames (they read `?parentUrl=`). */
export const resolveShellParentUrl = () => {
    if (typeof window === "undefined") return "";
    const fromConfig = window.__parentConfig?.parentUrl;
    if (fromConfig) return fromConfig;
    try {
        const fromQuery = new URLSearchParams(window.location.search).get("parentUrl");
        if (fromQuery) return fromQuery;
    } catch (error) {
        // ignore
    }
    if (window.self !== window.top && document.referrer) return document.referrer;
    return "";
};

/**
 * Frame url: the shell's own query carried through (preview, parentUrl, ...)
 * plus `shell=1`. A shared `?config=` only belongs to the app it was built in,
 * so it rides along only for the app the page opened on.
 */
export const buildJewelryFrameSrc = (app, { type, includeConfig } = {}) => {
    const base = JEWELRY_FRAME_PATHS[app] || JEWELRY_FRAME_PATHS.necklace;
    if (typeof window === "undefined") return base;

    const url = new URL(base, window.location.origin);
    try {
        new URLSearchParams(window.location.search).forEach((value, key) => {
            if (key === "category" || key === "shell" || key === "type") return;
            if (key === "config" && !includeConfig) return;
            url.searchParams.set(key, value);
        });
    } catch (error) {
        // ignore
    }

    url.searchParams.set("shell", "1");
    if (type) url.searchParams.set("type", type);
    if (!url.searchParams.get("parentUrl")) {
        const parentUrl = resolveShellParentUrl();
        if (parentUrl) url.searchParams.set("parentUrl", parentUrl);
    }

    return `${url.pathname}${url.search}`;
};
