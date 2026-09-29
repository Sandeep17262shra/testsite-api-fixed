import { BeedsProvider } from "./BeedsContext";
import { PreviewFocusProvider } from "./PreviewFocusContext";
import { View360Provider } from "./View360Context";
import { ShareProvider } from "./ShareContext";

const ContextProvider = ({ children }) => {
  return (
    <BeedsProvider>
      <PreviewFocusProvider>
        <View360Provider>
          <ShareProvider>
            {children}
          </ShareProvider>
        </View360Provider>
      </PreviewFocusProvider>
    </BeedsProvider>
  );
};

export default ContextProvider;
