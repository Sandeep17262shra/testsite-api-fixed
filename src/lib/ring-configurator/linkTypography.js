/**
 * Link typography from appearance-page `typography.cards.links`.
 * Size guide, View details toggle, and other theme3-link-text controls.
 */

function toSafeString(value) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function normalizeCssColor(value) {
  const str = toSafeString(value);
  if (!str) return "";

  const candidate = str.startsWith("#") ? str : `#${str}`;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(candidate)) {
    if (candidate.length === 4) {
      return `#${candidate[1]}${candidate[1]}${candidate[2]}${candidate[2]}${candidate[3]}${candidate[3]}`.toUpperCase();
    }
    return candidate.toUpperCase();
  }

  if (/^(rgb|hsl)a?\(.+\)$/i.test(str)) return str;
  return "";
}

function normalizeFontFamily(value) {
  const family = toSafeString(value);
  if (!family) return "";
  if (family.includes(",")) return family;
  const quoted = family.includes(" ") ? `"${family}"` : family;
  return `${quoted}, Arial, Helvetica, sans-serif`;
}

function normalizeFontSize(value) {
  const raw = toSafeString(value);
  if (!raw) return "";
  if (/^\d+(\.\d+)?(px|rem|em|%)$/.test(raw)) return raw;
  if (/^\d+(\.\d+)?$/.test(raw)) return `${raw}px`;
  return "";
}

function normalizeLetterSpacing(value) {
  const raw = toSafeString(value);
  if (!raw) return "";
  if (/^-?\d+(\.\d+)?(px|em|rem)$/.test(raw)) return raw;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return `${raw}px`;
  return raw;
}

export function normalizeLinkTypography(raw) {
  if (!raw || typeof raw !== "object") return null;

  const link = {
    fontFamily: normalizeFontFamily(raw.fontFamily),
    fontSizeDesktop: normalizeFontSize(raw.fontSizeDesktop),
    fontSizeMobile: normalizeFontSize(raw.fontSizeMobile),
    weight: toSafeString(raw.weight),
    lineHeight: toSafeString(raw.lineHeight),
    letterSpacing: normalizeLetterSpacing(raw.letterSpacing),
    textColor: normalizeCssColor(raw.textColor),
    hoverTextColor: normalizeCssColor(raw.hoverTextColor),
    underlineStyle: toSafeString(raw.underlineStyle || raw.underline_style),
  };

  return Object.values(link).some(Boolean) ? link : null;
}

function parseJsonRoot(response) {
  if (!response) return null;
  if (typeof response === "string") {
    try {
      return JSON.parse(response);
    } catch {
      return null;
    }
  }
  return typeof response === "object" ? response : null;
}

function getTypographyBlock(parsed) {
  if (!parsed) return null;
  return (
    parsed.typography ||
    parsed.data?.typography ||
    parsed.settings?.typography ||
    parsed.result?.typography ||
    null
  );
}

export function extractLinkTypography(response) {
  const parsed = parseJsonRoot(response);
  return normalizeLinkTypography(getTypographyBlock(parsed)?.cards?.links);
}

export function buildLinkCssVars(link) {
  if (!link) return undefined;

  const vars = {};
  if (link.fontFamily) vars["--typography-link-font-family"] = link.fontFamily;
  if (link.fontSizeDesktop) vars["--typography-link-font-size-desktop"] = link.fontSizeDesktop;
  if (link.fontSizeMobile) vars["--typography-link-font-size-mobile"] = link.fontSizeMobile;
  if (link.weight) vars["--typography-link-font-weight"] = link.weight;
  if (link.lineHeight) vars["--typography-link-line-height"] = link.lineHeight;
  if (link.letterSpacing) vars["--typography-link-letter-spacing"] = link.letterSpacing;
  if (link.textColor) vars["--typography-link-color"] = link.textColor;
  if (link.hoverTextColor) vars["--typography-link-hover-color"] = link.hoverTextColor;
  const underlineMode = linkUnderlineDataAttr(link.underlineStyle) || "underline-on-hover";
  vars["--typography-link-underline-mode"] = underlineMode;
  return Object.keys(vars).length ? vars : undefined;
}

export function linkUnderlineDataAttr(underlineStyle) {
  const normalized = toSafeString(underlineStyle).toLowerCase();
  if (!normalized) return "";
  if (normalized.includes("hover")) return "underline-on-hover";
  if (normalized.includes("always") || normalized === "underline") return "always";
  if (normalized.includes("none")) return "none";
  return "";
}

export function linkFontFamilyName(link) {
  const raw = link?.fontFamily;
  if (!raw) return "";
  const primary = raw.split(",")[0].replace(/^["']|["']$/g, "").trim();
  if (!primary || /^(arial|helvetica|sans-serif|serif|system-ui)$/i.test(primary)) return "";
  return primary;
}
