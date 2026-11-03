import { createContext, useState, useContext, useEffect } from "react";
import { StoreContext } from "./StoreContext";
import data  from '../data/data.json';
import { Base64 } from 'js-base64';
import { isDiamondWiseParentUrl } from "../priceConfig";
import { getDefaultQuality, getDiamondPrice, getAvailableOptions, getAvailableCaratSizes, getDefaultCarat } from "../utility/storePriceHelper";
import { resolveParentUrl } from "../utility/Parentconfig";

const LS_KEY = "ring_configurator_state";

// Define initial state values
const initialDiamondState = {
  cut: "Good",
  setCut: () => {},
  clarity: "SI2",
  setClarity: () => {},
  shape: "round",
  setShape: () => {},
  diamondColor: "#FFFFFF",
  setDiamondColor: () => {},
  sideStoneColor: "colorless",
  setSideStoneColor: () => {},
  diamondSize: data.carat,
  setDiamondSize: () => {},
  diamondType: "Lab",
  setDiamondType: () => {},
  diamondPriceColor: "L",
  setDiamondPriceColor: () => {},
  diamondColorClarity: "K",
  setDiamondColorClarity: () => {},
  initialDiamondPrice: data.diamondPrice,
  setInitialDiamondPrice: () => {},
  fancyDiamond: "Blue",
  setFancyDiamond: () => {},
  gemstone: "blue-sapphire",
  setGemstone: () => {},
  fancyDiamondIntensity: "Light",
  setFancyDiamondIntensity: () => {},
  colorType: "colorless",
  setColorType: () => {}
};

// Create context with initial values
export const DiamondContext = createContext(initialDiamondState);

export const DiamondProvider = ({ children }) => {
  const { parentUrl } = useContext(StoreContext) || {};
  const currentParent = parentUrl || (typeof window !== "undefined" ? resolveParentUrl() : "");
  const isDiamondwise = isDiamondWiseParentUrl(currentParent);
  const defaultQuality = getDefaultQuality(currentParent);
  const initialType = "Lab";
  const defaultCarat = getDefaultCarat(currentParent, initialType);
  const storeCaratSizes = getAvailableCaratSizes(currentParent, initialType);

  const params = new URLSearchParams(
    typeof window === "undefined" ? "" : window.location.search,
  );
  let shapeFromURL = isDiamondwise ? "marquise" : initialDiamondState.shape;
  let diamondSizeFromURL = defaultCarat;
  let qualityFromURL = { type: "Lab", quality: defaultQuality || "Standard" };
  let diamondColorFromURL = initialDiamondState.diamondColor;
  let sideStoneColorFromURL = initialDiamondState.sideStoneColor;
  let fancyDiamondFromURL = initialDiamondState.fancyDiamond;
  let gemstoneFromURL = initialDiamondState.gemstone;
  let activeTabFromURL = "Colorless";
  let cutFromURL = initialDiamondState.cut;
  let clarityFromURL = initialDiamondState.clarity;
  let diamondTypeFromURL = initialDiamondState.diamondType;
  let fancyDiamondIntensityFromURL = initialDiamondState.fancyDiamondIntensity;
  let colorTypeFromURL = initialDiamondState.colorType;
  
  let encodedConfig = params.get("config");
  if (!encodedConfig && typeof window !== "undefined" && window.self !== window.top && document.referrer) {
    try {
      const refUrl = new URL(document.referrer);
      encodedConfig = refUrl.searchParams.get("config");
    } catch {}
  }

  let decodedConfig = null;
  if (encodedConfig) {
    try {
      decodedConfig = JSON.parse(Base64.decode(encodedConfig));
    } catch (err) {
      console.warn("Invalid config parameter in URL:", err);
    }
  } else if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem(LS_KEY);
      if (stored) {
        decodedConfig = JSON.parse(stored);
      }
    } catch (err) {}
  }

  if (decodedConfig) {
    shapeFromURL = decodedConfig.shape ? decodedConfig.shape.toLowerCase() : shapeFromURL;
    const configType = decodedConfig.selectedQuality?.type || decodedConfig.diamondType || initialType;
    const typeCaratSizes = getAvailableCaratSizes(currentParent, configType);
    const typeDefCarat = typeCaratSizes[0] || defaultCarat;
    if (decodedConfig.diamondSize !== undefined && decodedConfig.diamondSize !== null) {
      const decodedNum = Number(decodedConfig.diamondSize);
      if (typeCaratSizes.includes(decodedNum)) {
        diamondSizeFromURL = decodedNum;
      } else {
        diamondSizeFromURL = typeDefCarat;
      }
    }
    qualityFromURL = decodedConfig.selectedQuality && typeof decodedConfig.selectedQuality === "object"
      ? decodedConfig.selectedQuality
      : qualityFromURL;
    diamondColorFromURL = decodedConfig.diamondColor ?? diamondColorFromURL;
    sideStoneColorFromURL = decodedConfig.sideStoneColor ?? sideStoneColorFromURL;
    fancyDiamondFromURL = decodedConfig.fancyDiamond ?? fancyDiamondFromURL;
    gemstoneFromURL = decodedConfig.gemstone ?? gemstoneFromURL;
    activeTabFromURL = decodedConfig.activeTab ?? activeTabFromURL;
    cutFromURL = decodedConfig.cut ?? cutFromURL;
    clarityFromURL = decodedConfig.clarity ?? clarityFromURL;
    diamondTypeFromURL = decodedConfig.diamondType ?? diamondTypeFromURL;
    fancyDiamondIntensityFromURL = decodedConfig.fancyDiamondIntensity ?? decodedConfig.intensity ?? decodedConfig.DiamondIntensity ?? fancyDiamondIntensityFromURL;
    colorTypeFromURL = decodedConfig.colorType ?? colorTypeFromURL;
  }

  const [cut, setCut] = useState(cutFromURL);
  const [clarity, setClarity] = useState(clarityFromURL);
  const [diamondType, setDiamondType] = useState(diamondTypeFromURL);
  const [diamondPriceColor, setDiamondPriceColor] = useState(initialDiamondState.diamondPriceColor);
  const [diamondColorClarity, setDiamondColorClarity] = useState(initialDiamondState.diamondColorClarity);
  const [fancyDiamondIntensity, setFancyDiamondIntensity] = useState(fancyDiamondIntensityFromURL);
  const [colorType, setColorType] = useState(colorTypeFromURL);

  const initialP = getDiamondPrice(currentParent, diamondSizeFromURL || defaultCarat, qualityFromURL.quality, qualityFromURL.type) || initialDiamondState.initialDiamondPrice;
  const [initialDiamondPrice, setInitialDiamondPrice] = useState(initialP);

  const [diamondSize, setDiamondSize] = useState(diamondSizeFromURL);
  const [shape, setShape] = useState(shapeFromURL);
  const [selectedQuality, setSelectedQuality] = useState(qualityFromURL);
  const [diamondColor, setDiamondColor] = useState(diamondColorFromURL);
  const [sideStoneColor, setSideStoneColor] = useState(sideStoneColorFromURL);
  const [fancyDiamond, setFancyDiamond] = useState(fancyDiamondFromURL);
  const [gemstone, setGemstone] = useState(gemstoneFromURL);
  const [activeTab, setActiveTab] = useState(activeTabFromURL);

  // Synchronize diamond size if current store doesn't support the current carat
  useEffect(() => {
    const activeType = selectedQuality?.type || diamondType || "Lab";
    const sizes = getAvailableCaratSizes(currentParent, activeType);
    const storeDef = sizes[0] || 1;
    if (sizes.length > 0 && !sizes.includes(Number(diamondSize))) {
      setDiamondSize(storeDef);
      const nextP = getDiamondPrice(currentParent, storeDef, selectedQuality?.quality || defaultQuality, activeType);
      if (nextP) setInitialDiamondPrice(nextP);
    }
  }, [currentParent, selectedQuality?.type, diamondType]);

  // Persist stone state to sessionStorage whenever any setting changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const existing = JSON.parse(sessionStorage.getItem(LS_KEY) || "{}");
      sessionStorage.setItem(LS_KEY, JSON.stringify({
        ...existing,
        cut,
        clarity,
        shape,
        diamondSize,
        diamondType,
        selectedQuality,
        diamondColor,
        sideStoneColor,
        fancyDiamond,
        gemstone,
        fancyDiamondIntensity,
        colorType,
        activeTab,
      }));
    } catch {}
  }, [
    cut,
    clarity,
    shape,
    diamondSize,
    diamondType,
    selectedQuality,
    diamondColor,
    sideStoneColor,
    fancyDiamond,
    gemstone,
    fancyDiamondIntensity,
    colorType,
    activeTab,
  ]);

  useEffect(() => {
    const availableQualities = getAvailableOptions(currentParent, "qualityLevels");
    if (availableQualities.length > 0 && !availableQualities.includes(selectedQuality?.quality)) {
      setSelectedQuality((prev) => ({
        type: prev?.type || "Lab",
        quality: availableQualities[0],
      }));
    }
  }, [currentParent, selectedQuality?.quality]);

  return (
    <DiamondContext.Provider
      value={{
        cut,
        setCut,
        clarity,
        setClarity,
        shape,
        setShape,
        diamondColor,
        setDiamondColor,
        sideStoneColor,
        setSideStoneColor,
        diamondSize,
        setDiamondSize,
        diamondType,
        setDiamondType,
        diamondPriceColor,
        setDiamondPriceColor,
        diamondColorClarity,
        setDiamondColorClarity,
        initialDiamondPrice,
        setInitialDiamondPrice,
        fancyDiamond, setFancyDiamond,
        gemstone, setGemstone,
        fancyDiamondIntensity, setFancyDiamondIntensity,
        colorType, setColorType,
		selectedQuality, setSelectedQuality,
		activeTab, setActiveTab
      }}
    >
      {children}
    </DiamondContext.Provider>
  );
};
