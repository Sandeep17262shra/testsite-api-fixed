/**
 * Button label typography from appearance-page `typography.cards.button`.
 * Text only: footer actions, ring-type toggle, option tiles, preview controls, and Ask AI trigger.
 * primaryTextColor — tile labels and tile prices (prices use a lighter weight).
 * secondaryTextColor — filled primary buttons (Checkout, active ring-type) + other secondary UI.
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

function mutedButtonFontWeight(weight) {
  const raw = toSafeString(weight);
  const numeric = parseInt(raw, 10);
  if (Number.isFinite(numeric)) return String(Math.max(300, numeric - 150));
  if (/^bold(er)?$/i.test(raw)) return "400";
  if (/^normal$/i.test(raw) || /^lighter$/i.test(raw)) return "300";
  return "400";
}

export function normalizeButtonTypography(raw) {
  if (!raw || typeof raw !== "object") return null;

  const button = {
    fontFamily: normalizeFontFamily(raw.fontFamily),
    fontSizeDesktop: normalizeFontSize(raw.fontSizeDesktop),
    fontSizeMobile: normalizeFontSize(raw.fontSizeMobile),
    weight: toSafeString(raw.weight),
    lineHeight: toSafeString(raw.lineHeight),
    letterSpacing: normalizeLetterSpacing(raw.letterSpacing),
    primaryTextColor: normalizeCssColor(raw.primaryTextColor),
    secondaryTextColor: normalizeCssColor(raw.secondaryTextColor),
  };

  return Object.values(button).some(Boolean) ? button : null;
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

export function extractButtonTypography(response) {
  const parsed = parseJsonRoot(response);
  if (!parsed) return null;

  const typography =
    parsed.typography ||
    parsed.data?.typography ||
    parsed.settings?.typography ||
    parsed.result?.typography ||
    null;

  return normalizeButtonTypography(typography?.cards?.button);
}

export function buildButtonCssVars(button) {
  if (!button) return undefined;

  const vars = {};
  if (button.fontFamily) vars["--typography-button-font-family"] = button.fontFamily;
  if (button.fontSizeDesktop) vars["--typography-button-font-size-desktop"] = button.fontSizeDesktop;
  if (button.fontSizeMobile) vars["--typography-button-font-size-mobile"] = button.fontSizeMobile;
  if (button.weight) {
    vars["--typography-button-font-weight"] = button.weight;
    vars["--typography-button-muted-weight"] = mutedButtonFontWeight(button.weight);
  }
  if (button.lineHeight) vars["--typography-button-line-height"] = button.lineHeight;
  if (button.letterSpacing) vars["--typography-button-letter-spacing"] = button.letterSpacing;
  if (button.primaryTextColor) vars["--typography-button-primary-text-color"] = button.primaryTextColor;
  if (button.secondaryTextColor) vars["--typography-button-secondary-text-color"] = button.secondaryTextColor;
  return Object.keys(vars).length ? vars : undefined;
}

export function buttonFontFamilyName(button) {
  const raw = button?.fontFamily;
  if (!raw) return "";
  const primary = raw.split(",")[0].replace(/^["']|["']$/g, "").trim();
  if (!primary || /^(arial|helvetica|sans-serif|serif|system-ui)$/i.test(primary)) return "";
  return primary;
}
