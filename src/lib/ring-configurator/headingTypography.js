/**
 * Heading typography from appearance-page `typography.cards.heading`.
 * Section titles (Ring, Band, …) and the footer total beside Checkout.
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

export function normalizeHeadingTypography(raw) {
  if (!raw || typeof raw !== "object") return null;

  const heading = {
    fontFamily: normalizeFontFamily(raw.fontFamily),
    fontSizeDesktop: normalizeFontSize(raw.fontSizeDesktop),
    fontSizeMobile: normalizeFontSize(raw.fontSizeMobile),
    weight: toSafeString(raw.weight),
    lineHeight: toSafeString(raw.lineHeight),
    letterSpacing: normalizeLetterSpacing(raw.letterSpacing),
    textColor: normalizeCssColor(raw.textColor),
  };

  return Object.values(heading).some(Boolean) ? heading : null;
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

/** Pull `typography.cards.heading` from the appearance-page envelope. */
export function extractHeadingTypography(response) {
  const parsed = parseJsonRoot(response);
  if (!parsed) return null;

  const typography =
    parsed.typography ||
    parsed.data?.typography ||
    parsed.settings?.typography ||
    parsed.result?.typography ||
    null;

  return normalizeHeadingTypography(typography?.cards?.heading);
}

export function buildHeadingCssVars(heading) {
  if (!heading) return undefined;

  const vars = {};
  if (heading.fontFamily) vars["--typography-heading-font-family"] = heading.fontFamily;
  if (heading.fontSizeDesktop) vars["--typography-heading-font-size-desktop"] = heading.fontSizeDesktop;
  if (heading.fontSizeMobile) vars["--typography-heading-font-size-mobile"] = heading.fontSizeMobile;
  if (heading.weight) vars["--typography-heading-font-weight"] = heading.weight;
  if (heading.lineHeight) vars["--typography-heading-line-height"] = heading.lineHeight;
  if (heading.letterSpacing) vars["--typography-heading-letter-spacing"] = heading.letterSpacing;
  if (heading.textColor) vars["--typography-heading-color"] = heading.textColor;
  return Object.keys(vars).length ? vars : undefined;
}

export function headingFontFamilyName(heading) {
  const raw = heading?.fontFamily;
  if (!raw) return "";
  const primary = raw.split(",")[0].replace(/^["']|["']$/g, "").trim();
  if (!primary || /^(arial|helvetica|sans-serif|serif|system-ui)$/i.test(primary)) return "";
  return primary;
}
