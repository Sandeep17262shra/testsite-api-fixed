import { StoreProvider } from "@/lib/ring-configurator/contexts/StoreContext";
import { AppearanceConfigGate } from "@/lib/ring-configurator/contexts/AppearanceConfigGate";
import { BraceletProvider } from "./BraceletContext";
import { View360Provider } from "./View360Context";
import { ShareProvider } from "./ShareContext";

const ContextProvider = ({ children, initialType }) => {
    return (
        <StoreProvider>
            <AppearanceConfigGate>
                <BraceletProvider initialType={initialType}>
                    <View360Provider>
                        <ShareProvider>
                            {children}
                        </ShareProvider>
                    </View360Provider>
                </BraceletProvider>
            </AppearanceConfigGate>
        </StoreProvider>
    );
};

export default ContextProvider;