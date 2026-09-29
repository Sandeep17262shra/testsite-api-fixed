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
import { initPriceConfig, isPriceConfigReady } from "../priceConfig";

const PriceConfigGate = ({ children }) => {
    const [priceConfigReady, setPriceConfigReady] = useState(() => isPriceConfigReady());
    const { parentUrl, shop } = useStoreContext();

    useEffect(() => {
        let cancelled = false;
        // A parentUrl can arrive after the initial iframe load. Do not render
        // the previous store's catalogue while the new store fixture/API
        // response is being selected and loaded.
        setPriceConfigReady(false);

        initPriceConfig({ force: false, parentUrl, shop })
            .then(() => {
                if (!cancelled) setPriceConfigReady(true);
            })
            .catch((err) => {
                console.warn("Pricing config background fetch failed:", err);
                if (!cancelled) setPriceConfigReady(true);
            });

        return () => {
            cancelled = true;
        };
    }, [parentUrl, shop]);

    if (!priceConfigReady) {
        return null;
    }

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
