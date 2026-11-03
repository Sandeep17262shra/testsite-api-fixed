import { useEffect, useState } from "react";
import { RingProvider } from "./RingContext";
import { DiamondProvider } from "./DiamondContext";
import { CameraViewProvider } from "./CameraViewContext";
import { View360Provider } from "./View360Context";
import { CaptureProvider } from "./CaptureContext";
import { ShareProvider } from "./ShareContext";
import { StoreProvider, useStoreContext } from "./StoreContext";
import { LoaderProvider } from "./LoaderContext";
import { RecordingProvider } from "./RecordingContext";
import { SectionProvider } from "./SectionContext";
import { SceneStageProvider } from "./SceneStageContext";
import { initAppearanceConfig } from "../appearanceApiClient";
import { preloadThemeTypographyFonts } from "../theme3Appearance";
import { initPriceConfig, getPricingAccessState } from "../priceConfig";
import ConfiguratorSkeleton from "../../../components/ConfiguratorSkeleton";

const PriceConfigGate = ({ children }) => {
    const {
        parentUrl,
        shop,
        canonicalShop,
        planStatus,
        setAppearance,
        setHeadingTypography,
        setButtonTypography,
        setBodyTypography,
        setLinkTypography,
        setRemoveLogo,
    } = useStoreContext();
    const [planInactive, setPlanInactive] = useState(() => planStatus === "inactive" || getPricingAccessState().planStatus === "inactive");
    const storeConfigKey = `${canonicalShop}|${shop}|${parentUrl}`;
    const [loadedStoreConfigKey, setLoadedStoreConfigKey] = useState("");
    const hasStoreIdentity = Boolean(parentUrl || shop || canonicalShop);

    useEffect(() => {
        let cancelled = false;
        // Localhost/default mode deliberately has no store identity. It must
        // use the full built-in catalogue and must never be hidden by plan
        // status returned for another store during development or hot reload.
        const applyThemePage = (themePage) => {
            if (cancelled || !themePage) return;
            if (themePage.appearance) {
                setAppearance(themePage.appearance);
            }
            if (themePage.heading) {
                setHeadingTypography(themePage.heading);
            }
            if (themePage.button) {
                setButtonTypography(themePage.button);
            }
            if (themePage.body) {
                setBodyTypography(themePage.body);
            }
            if (themePage.links) {
                setLinkTypography(themePage.links);
            }
        };

        if (!hasStoreIdentity) {
            Promise.all([
                initPriceConfig({ parentUrl: "", shop: "", canonicalShop: "" }),
                initAppearanceConfig({ parentUrl: "", shop: "", canonicalShop: "" }),
            ]).then(async ([, themePage]) => {
                if (cancelled) return;
                applyThemePage(themePage);
                await preloadThemeTypographyFonts(themePage);
                if (cancelled) return;
                const accessState = getPricingAccessState();
                if (typeof accessState.removeLogo === "boolean" && setRemoveLogo) {
                    setRemoveLogo(accessState.removeLogo);
                }
                setPlanInactive(false);
                setLoadedStoreConfigKey("");
            });

            return () => {
                cancelled = true;
            };
        }

        // A parentUrl can arrive after the initial iframe load. Keep the
        // existing controls interactive while the new store fixture/API
        // response is selected and applied in the background.
        Promise.all([
            initPriceConfig({ force: false, parentUrl, shop, canonicalShop }).catch((err) => {
                console.warn("Pricing config background fetch failed:", err);
                return null;
            }),
            initAppearanceConfig({ force: false, parentUrl, shop, canonicalShop }),
        ]).then(async ([, themePage]) => {
            if (cancelled) return;
            applyThemePage(themePage);
            await preloadThemeTypographyFonts(themePage);
            if (cancelled) return;
            const accessState = getPricingAccessState();
            if (typeof accessState.removeLogo === "boolean" && setRemoveLogo) {
                setRemoveLogo(accessState.removeLogo);
            }
            setPlanInactive(planStatus === "inactive" || getPricingAccessState().planStatus === "inactive");
            setLoadedStoreConfigKey(storeConfigKey);
        });

        return () => {
            cancelled = true;
        };
    }, [
        parentUrl,
        shop,
        canonicalShop,
        planStatus,
        setAppearance,
        setHeadingTypography,
        setButtonTypography,
        setBodyTypography,
        setLinkTypography,
        setRemoveLogo,
        storeConfigKey,
    ]);

    if (planInactive) {
        return null;
    }

    if (hasStoreIdentity && loadedStoreConfigKey !== storeConfigKey) {
        return <ConfiguratorSkeleton label="Loading your store configuration" />;
    }

    // Pricing and store appearance are enhancements, not prerequisites for
    // mounting the configurator. The contexts already expose their default
    // values, so render the controls immediately and update their labels and
    // prices when the async config request finishes. This leaves the scene's
    // own loader responsible only for the 3D assets that are still loading.
    return children;
};

const ContextProvider = ({ children }) => {
    return (
        <StoreProvider>
            <PriceConfigGate>
                <RingProvider>
                    <DiamondProvider>
                      <SceneStageProvider>
                        <CameraViewProvider>
                            <View360Provider>
                                <CaptureProvider>
                                    <ShareProvider>
                                        <LoaderProvider>
                                            <RecordingProvider>
                                                <SectionProvider>
                                                    {children}
                                                </SectionProvider>
                                            </RecordingProvider>
                                        </LoaderProvider>
                                    </ShareProvider>
                                </CaptureProvider>
                            </View360Provider>
                        </CameraViewProvider>
                      </SceneStageProvider>
                    </DiamondProvider>
                </RingProvider>
            </PriceConfigGate>
        </StoreProvider>
    );
};

export default ContextProvider;
