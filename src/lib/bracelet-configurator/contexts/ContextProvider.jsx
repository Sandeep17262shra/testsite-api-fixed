import { BraceletProvider } from "./BraceletContext";
import { View360Provider } from "./View360Context";
import { ShareProvider } from "./ShareContext";

const ContextProvider = ({ children }) => {
    return (
        <BraceletProvider>
            <View360Provider>
                <ShareProvider>
                    {children}
                </ShareProvider>
            </View360Provider>                
        </BraceletProvider>
    );
};

export default ContextProvider;
