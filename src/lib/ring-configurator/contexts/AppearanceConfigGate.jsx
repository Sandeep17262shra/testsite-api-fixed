import { useEffect, useState } from "react";
import { initAppearanceConfig } from "../appearanceApiClient";
import { preloadThemeTypographyFonts } from "../theme3Appearance";
import { useStoreContext } from "./StoreContext";
import ConfiguratorSkeleton from "@/components/ConfiguratorSkeleton";

/**
 * Loads appearance-page colours and typography when a store identity exists.
 * Holds the configurator until that theme is applied so the first paint is
 * the store theme, not the built-in defaults.
 *
 * Renders the skeleton loader while waiting so there is no white flash
 * between the dynamic-import skeleton and the real configurator UI.
 */
export function AppearanceConfigGate({ children }) {
  const {
    parentUrl,
    shop,
    canonicalShop,
    setAppearance,
    setHeadingTypography,
    setButtonTypography,
    setBodyTypography,
    setLinkTypography,
  } = useStoreContext();
  const hasStoreIdentity = Boolean(parentUrl || shop || canonicalShop);
  const [ready, setReady] = useState(() => !hasStoreIdentity);

  useEffect(() => {
    let cancelled = false;

    const applyThemePage = (themePage) => {
      if (cancelled || !themePage) return;
      if (themePage.appearance) setAppearance(themePage.appearance);
      if (themePage.heading) setHeadingTypography(themePage.heading);
      if (themePage.button) setButtonTypography(themePage.button);
      if (themePage.body) setBodyTypography(themePage.body);
      if (themePage.links) setLinkTypography(themePage.links);
    };

    if (!hasStoreIdentity) {
      setReady(true);
      return undefined;
    }

    setReady(false);
    initAppearanceConfig({ parentUrl, shop, canonicalShop })
      .then(async (themePage) => {
        if (cancelled) return;
        applyThemePage(themePage);
        await preloadThemeTypographyFonts(themePage);
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [
    hasStoreIdentity,
    parentUrl,
    shop,
    canonicalShop,
    setAppearance,
    setHeadingTypography,
    setButtonTypography,
    setBodyTypography,
    setLinkTypography,
  ]);

  if (!ready) return <ConfiguratorSkeleton />;

  return children;
}
