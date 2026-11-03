/**
 * Body typography from appearance-page `typography.cards.body`.
 * Preview product title, tax line, build-summary detail lines (View details uses links).
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

function mutedBodyFontWeight(weight) {
  const raw = toSafeString(weight);
  const numeric = parseInt(raw, 10);
  if (Number.isFinite(numeric)) return String(Math.max(300, numeric - 100));
  if (/^bold(er)?$/i.test(raw)) return "400";
  if (/^normal$/i.test(raw) || /^lighter$/i.test(raw)) return "300";
  return "400";
}

export function normalizeBodyTypography(raw) {
  if (!raw || typeof raw !== "object") return null;

  const body = {
    fontFamily: normalizeFontFamily(raw.fontFamily),
    fontSizeDesktop: normalizeFontSize(raw.fontSizeDesktop),
    fontSizeMobile: normalizeFontSize(raw.fontSizeMobile),
    weight: toSafeString(raw.weight),
    lineHeight: toSafeString(raw.lineHeight),
    letterSpacing: normalizeLetterSpacing(raw.letterSpacing),
    textColor: normalizeCssColor(raw.textColor),
  };

  return Object.values(body).some(Boolean) ? body : null;
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

export function extractBodyTypography(response) {
  const parsed = parseJsonRoot(response);
  return normalizeBodyTypography(getTypographyBlock(parsed)?.cards?.body);
}

export function buildBodyCssVars(body) {
  if (!body) return undefined;

  const vars = {};
  if (body.fontFamily) vars["--typography-body-font-family"] = body.fontFamily;
  if (body.fontSizeDesktop) vars["--typography-body-font-size-desktop"] = body.fontSizeDesktop;
  if (body.fontSizeMobile) vars["--typography-body-font-size-mobile"] = body.fontSizeMobile;
  if (body.weight) {
    vars["--typography-body-font-weight"] = body.weight;
    vars["--typography-body-muted-weight"] = mutedBodyFontWeight(body.weight);
  }
  if (body.lineHeight) vars["--typography-body-line-height"] = body.lineHeight;
  if (body.letterSpacing) vars["--typography-body-letter-spacing"] = body.letterSpacing;
  if (body.textColor) vars["--typography-body-color"] = body.textColor;
  return Object.keys(vars).length ? vars : undefined;
}

export function bodyFontFamilyName(body) {
  const raw = body?.fontFamily;
  if (!raw) return "";
  const primary = raw.split(",")[0].replace(/^["']|["']$/g, "").trim();
  if (!primary || /^(arial|helvetica|sans-serif|serif|system-ui)$/i.test(primary)) return "";
  return primary;
}
