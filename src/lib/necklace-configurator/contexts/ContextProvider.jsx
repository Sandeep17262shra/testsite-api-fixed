import { BraceletProvider } from "./BraceletContext";
import { View360Provider } from "./View360Context";
import { ShareProvider } from "./ShareContext";

const ContextProvider = ({ children, initialType }) => {
    return (
        <BraceletProvider initialType={initialType}>
            <View360Provider>
                <ShareProvider>
                    {children}
                </ShareProvider>
            </View360Provider>
        </BraceletProvider>
    );
};

export default ContextProvider;