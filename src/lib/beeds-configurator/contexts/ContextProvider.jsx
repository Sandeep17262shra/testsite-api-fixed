import { StoreProvider } from "@/lib/ring-configurator/contexts/StoreContext";
import { AppearanceConfigGate } from "@/lib/ring-configurator/contexts/AppearanceConfigGate";
import { BeedsProvider } from "./BeedsContext";
import { PreviewFocusProvider } from "./PreviewFocusContext";
import { View360Provider } from "./View360Context";
import { ShareProvider } from "./ShareContext";

const ContextProvider = ({ children }) => {
  return (
    <StoreProvider>
      <AppearanceConfigGate>
        <BeedsProvider>
          <PreviewFocusProvider>
            <View360Provider>
              <ShareProvider>
                {children}
              </ShareProvider>
            </View360Provider>
          </PreviewFocusProvider>
        </BeedsProvider>
      </AppearanceConfigGate>
    </StoreProvider>
  );
};

export default ContextProvider;
