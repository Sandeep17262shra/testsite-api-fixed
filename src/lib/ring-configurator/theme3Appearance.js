import { useEffect, useMemo } from "react";
import { useStoreContext } from "./contexts/StoreContext";
import { buildHeadingCssVars, headingFontFamilyName } from "./headingTypography.js";
import { buildButtonCssVars, buttonFontFamilyName } from "./buttonTypography.js";
import { buildBodyCssVars, bodyFontFamilyName } from "./bodyTypography.js";
import { buildLinkCssVars, linkFontFamilyName, linkUnderlineDataAttr } from "./linkTypography.js";

const TYPOGRAPHY_FONT_LINK_ID = "theme3-typography-google-fonts";
const FONT_PRELOAD_TIMEOUT_MS = 1500;

export function collectTypographyFontFamilies({
  headingTypography,
  buttonTypography,
  bodyTypography,
  linkTypography,
} = {}) {
  return [
    ...new Set(
      [
        headingFontFamilyName(headingTypography),
        buttonFontFamilyName(buttonTypography),
        bodyFontFamilyName(bodyTypography),
        linkFontFamilyName(linkTypography),
      ].filter(Boolean)
    ),
  ];
}

export function buildTypographyFontsHref(families) {
  if (!families?.length) return "";
  const familyQuery = families
    .map((name) => `family=${encodeURIComponent(name).replace(/%20/g, "+")}:wght@400;500;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${familyQuery}&display=swap`;
}

/** Inject the store font stylesheet and wait until it is usable, or time out. */
export function preloadThemeTypographyFonts(themePage) {
  if (typeof document === "undefined") return Promise.resolve();
  const families = collectTypographyFontFamilies({
    headingTypography: themePage?.heading,
    buttonTypography: themePage?.button,
    bodyTypography: themePage?.body,
    linkTypography: themePage?.links,
  });
  if (!families.length) return Promise.resolve();

  const href = buildTypographyFontsHref(families);
  let link = document.getElementById(TYPOGRAPHY_FONT_LINK_ID);
  if (!link) {
    link = document.createElement("link");
    link.id = TYPOGRAPHY_FONT_LINK_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }

  const hrefChanged = link.getAttribute("href") !== href;
  const stylesheetReady = hrefChanged
    ? new Promise((resolve) => {
        const done = () => resolve();
        link.addEventListener("load", done, { once: true });
        link.addEventListener("error", done, { once: true });
        link.setAttribute("href", href);
      })
    : Promise.resolve();

  const fontsReady = stylesheetReady.then(() => {
    if (!document.fonts?.load) return null;
    return Promise.all(
      families.map((name) => document.fonts.load(`16px "${name}"`).catch(() => null))
    );
  });

  return Promise.race([
    fontsReady,
    new Promise((resolve) => {
      setTimeout(resolve, FONT_PRELOAD_TIMEOUT_MS);
    }),
  ]);
}

export function buildTheme3RootClassName({
  rootModifier,
  extraClassNames = [],
  headingTypography,
  buttonTypography,
  bodyTypography,
  linkTypography,
}) {
  const classes = ["theme3-root", rootModifier].filter(Boolean);
  if (headingTypography) classes.push("theme3-has-heading-typography");
  if (buttonTypography) classes.push("theme3-has-button-typography");
  if (bodyTypography) classes.push("theme3-has-body-typography");
  if (linkTypography) classes.push("theme3-has-link-typography");
  if (extraClassNames.length) classes.push(...extraClassNames);
  return classes.join(" ");
}

export function useTheme3Appearance(rootModifier, extraClassNames = []) {
  const {
    appearance,
    headingTypography,
    buttonTypography,
    bodyTypography,
    linkTypography,
  } = useStoreContext();

  const hasLinkTypography = Boolean(linkTypography);

  const theme3RootClassName = useMemo(
    () =>
      buildTheme3RootClassName({
        rootModifier,
        extraClassNames,
        headingTypography,
        buttonTypography,
        bodyTypography,
        linkTypography,
      }),
    [
      rootModifier,
      extraClassNames,
      headingTypography,
      buttonTypography,
      bodyTypography,
      linkTypography,
    ]
  );

  const themeRootDataAttrs = useMemo(() => {
    if (!hasLinkTypography) return undefined;
    const underline =
      linkUnderlineDataAttr(linkTypography?.underlineStyle) || "underline-on-hover";
    return { "data-link-underline": underline };
  }, [linkTypography, hasLinkTypography]);

  const appearanceStyle = useMemo(() => {
    const vars = {
      ...(buildHeadingCssVars(headingTypography) || {}),
      ...(buildButtonCssVars(buttonTypography) || {}),
      ...(buildBodyCssVars(bodyTypography) || {}),
      ...(buildLinkCssVars(linkTypography) || {}),
    };
    if (appearance) {
      if (appearance.primaryColor) vars["--appearance-primary"] = appearance.primaryColor;
      if (appearance.primaryTextColor) vars["--appearance-primary-text"] = appearance.primaryTextColor;
      if (appearance.secondaryColor) vars["--appearance-secondary"] = appearance.secondaryColor;
      if (appearance.secondaryTextColor) {
        vars["--appearance-secondary-text"] = appearance.secondaryTextColor;
      }
      if (appearance.hoverSecondaryColor) {
        vars["--appearance-hover-primary"] = appearance.hoverSecondaryColor;
        vars["--appearance-hover-secondary"] = appearance.hoverSecondaryColor;
      }
    }
    return Object.keys(vars).length ? vars : undefined;
  }, [appearance, headingTypography, buttonTypography, bodyTypography, linkTypography]);

  useEffect(() => {
    preloadThemeTypographyFonts({
      heading: headingTypography,
      button: buttonTypography,
      body: bodyTypography,
      links: linkTypography,
    });
  }, [headingTypography, buttonTypography, bodyTypography, linkTypography]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (appearance) {
      if (appearance.primaryColor) root.style.setProperty("--appearance-primary", appearance.primaryColor);
      if (appearance.primaryTextColor) {
        root.style.setProperty("--appearance-primary-text", appearance.primaryTextColor);
      }
      if (appearance.secondaryColor) {
        root.style.setProperty("--appearance-secondary", appearance.secondaryColor);
      }
      if (appearance.secondaryTextColor) {
        root.style.setProperty("--appearance-secondary-text", appearance.secondaryTextColor);
      }
      if (appearance.hoverSecondaryColor) {
        root.style.setProperty("--appearance-hover-primary", appearance.hoverSecondaryColor);
        root.style.setProperty("--appearance-hover-secondary", appearance.hoverSecondaryColor);
      }
    } else {
      root.style.removeProperty("--appearance-primary");
      root.style.removeProperty("--appearance-primary-text");
      root.style.removeProperty("--appearance-secondary");
      root.style.removeProperty("--appearance-secondary-text");
      root.style.removeProperty("--appearance-hover-primary");
      root.style.removeProperty("--appearance-hover-secondary");
    }
  }, [appearance]);

  return { theme3RootClassName, themeRootDataAttrs, appearanceStyle };
}
