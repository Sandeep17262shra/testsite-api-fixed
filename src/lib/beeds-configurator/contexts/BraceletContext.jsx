import { createContext, useState } from "react";
import { Base64 } from "js-base64";
import { DEFAULT_NAME_PENDANT, GENERATED_NAME_CHAIN_PATH } from "../assets";


export const BraceletContext = createContext({});

export const BraceletProvider = ({ children }) => {
  const getConfigFromURL = () => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const encodedConfig = params.get("config");
  if (!encodedConfig) return null;

  try {
    const decoded = Base64.decode(encodedConfig);
    return JSON.parse(decoded);
  } catch (e) {
    console.error("Failed to decode bracelet config:", e);
    return null;
  }
};

const config = getConfigFromURL();

  const [loader, setLoader] = useState(true);
  const sharedMaterialProps = {
    metalness: 1,
    roughness: 0,
    envMapIntensity: 1,
    transparent: true
  };

  const [selectedBracelet, setSelectedBracelet] = useState(
  config?.selectedBracelet ?? 0
);

  const [braceletPath, setBraceletPath] = useState(
  config?.braceletPath ?? GENERATED_NAME_CHAIN_PATH
);

  const [charms, setCharms] = useState(config?.charms ?? []);

// Name pendant plate for the generated name chain: { enabled, text, fontStyle }.
const [namePendant, setNamePendant] = useState(
  config?.namePendant ?? DEFAULT_NAME_PENDANT
);
const [braceletMetal, setBraceletMetal] = useState(
  config?.braceletMetal ?? "#DBDBDB"
);

const [braceletPurity, setBraceletPurity] = useState(
  config?.braceletPurity ?? "9K"
);

const [currentMetalPrice, setCurrentMetalPrice] = useState(
  config?.currentMetalPrice ?? 100
);

const [currentPurityPrice, setCurrentPurityPrice] = useState(
  config?.currentPurityPrice ?? 100
);

const [braceletSize, setBraceletSize] = useState(
  config?.braceletSize ?? "5"
);

const [currentBraceletSizePrice, setCurrentBraceletSizePrice] = useState(
  config?.currentBraceletSizePrice ?? 30
);

  const [materialPropsBracelet, setMaterialPropsBracelet] = useState({
    color: '#DBDBDB',
    ...sharedMaterialProps
  });
  const [texture, setTexture] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [materialProps, setMaterialProps] = useState({
    color: '#DBDBDB',
    ...sharedMaterialProps
  });
  const [cameraView, setCameraView] = useState("");
  const [capture, setCapture] = useState(false);
const [resetObj, setResetObj] = useState({
  position: [0.01, 2.9, 0.15], // near top-down, tiny XZ offset avoids OrbitControls gimbal lock
  near: 0.1,
  far: 100
});
     const [showPopup, setShowPopup] = useState(false);
     const [showPopup2, setShowPopup2] = useState(false);
     const [showResetPopup, setShowResetPopup] = useState(false);
     const [isOpen, setIsOpen] = useState(false);
  return (
    <BraceletContext.Provider value={{
      selectedBracelet, setSelectedBracelet,
      braceletPath, setBraceletPath,
      charms, setCharms,
      namePendant, setNamePendant,
      materialPropsBracelet, setMaterialPropsBracelet,
      texture, setTexture,
      highlightedIndex, setHighlightedIndex,
      selectedIndex, setSelectedIndex,
      materialProps, setMaterialProps,
      cameraView, setCameraView,
      capture, setCapture,
      resetObj, setResetObj,
      loader, setLoader,
      braceletMetal, setBraceletMetal,
braceletPurity, setBraceletPurity,
currentMetalPrice, setCurrentMetalPrice,
currentPurityPrice, setCurrentPurityPrice,
braceletSize, setBraceletSize,
currentBraceletSizePrice, setCurrentBraceletSizePrice,
showPopup, setShowPopup,
showResetPopup, setShowResetPopup,
showPopup2, setShowPopup2,
isOpen, setIsOpen,
    }}>
      {children}
    </BraceletContext.Provider>
  );
};
