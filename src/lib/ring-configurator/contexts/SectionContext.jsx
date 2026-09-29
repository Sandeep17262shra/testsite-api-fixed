import { createContext, useState, useContext, useEffect } from "react";
import initialPrice from '../data/data.json';
import { StoreContext } from "./StoreContext";
import { ShareContext } from "./ShareContext";
import { resolveParentUrl, getCurrencyRate, getFancyPriceFactor } from "../utility/Parentconfig";
import { Base64 } from "js-base64";
import {
  getMetalPrice,
  getShankPrice,
  getHeadPrice,
  getDiamondPrice,
  getDefaultQuality,
  getMatchingBandPrice,
  getEngravingPrice,
  getColoredDiamondExtraPrice,
  getGemstoneExtraPrice,
  getIntensityPrice,
  getDefaultCarat,
} from "../utility/storePriceHelper";
import { isDiamondWiseParentUrl, isPriceConfigReady } from "../priceConfig";

const LS_KEY = "ring_configurator_state";

const getConfigFromURLOrStorage = (storeParentUrl) => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  let encodedConfig = params.get("config");

  if (!encodedConfig && window.self !== window.top && document.referrer) {
    try {
      const refUrl = new URL(document.referrer);
      encodedConfig = refUrl.searchParams.get("config");
    } catch {}
  }

  if (!encodedConfig) {
    try {
      const stored = sessionStorage.getItem(LS_KEY);
      if (stored) {
        const savedConfig = JSON.parse(stored);
        if (savedConfig._storeParentUrl === storeParentUrl) return savedConfig;
      }
    } catch {}
    return null;
  }

  try {
    const decoded = Base64.decode(encodedConfig);
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
};

const deriveHeadStyle = (config) => {
  if (config?.headStyle) return config.headStyle;
  if (!config?.ringHead) return "plain";
  const raw = config.ringHead.trim().toUpperCase();
  if (raw === "DOUBLE-HALO") return "double-halo";
  if (raw === "SINGLE-HALO") return "single-halo";
  if (raw === "HIDDEN-HALO") return "hidden-halo";
  if (raw === "BEZEL") return "bezel";
  if (["OVAL", "TRAPEZOID", "HALF-MOON", "PEAR", "BAGUETTE"].includes(raw)) return "three-stone";
  return "plain";
};

const initialSectionState = {
  // Totals
  shankTotal: 0,
  setShankTotal: () => { },
  headTotal: 0,
  setHeadTotal: () => { },
  stoneTotal: 0,
  setStoneTotal: () => { },
  otherTotal: 0,
  setOtherTotal: () => { },

  // Shank Section
  stylePrice: 0,
  setStylePrice: () => { },
  engravingPrice: 0,
  setEngravingPrice: () => { },
  ringSideSettingPrice: 0,
  setRingSideSettingPrice: () => { },
  metalPrice: 0,
  setMetalPrice: () => { },
  matchingBandPrice: 0,
  setMatchingBandPrice: () => { },
  platinum: false,
  setPlatinum: () => { },
  sideStyle: "none",
  setSideStyle: () => { },
  symbol: "",
  setSymbol: () => { },

  // Head Section
  headStyle: "plain",
  setHeadstyle: () => { },
  // haloStyle: "",
  // setHaloStyle: () => { },
  threestone: "",
  setThreestone: () => { },
  headPrice: 0,
  setHeadPrice: () => { },

  // Stone Section
  stoneThreestone: "lab-diamond",
  setStoneThreestone: () => { },
  activeDiamondSize: 0,
  setActiveDiamondSize: () => { },
  activeDiamondType: 0,
  setActiveDiamondType: () => { },
  activeCut: "Good",
  setActiveCut: () => { },
  clarityPrice: 0,
  setClarityPrice: () => { },
  activePriceColor: 0,
  setActivePriceColor: () => { },
  shapePrice: 0,
  setShapePrice: () => { },
  caratP: 0,
  setCaratP: () => { },
  diamondCarat: 0.5,
  setDiamondCarat: () => { },
  cutPrice: 0,
  setCutPrice: () => { },
  selectedTab: "shank",
  setSelectedTab: () => { },
  countryShortName: "US - MX - CA",
  setCountryShortName: () => { },
  sizeMM: "41.5",
  setSizeMM: () => { },
  fancyColorPrice: 100,
  setFancyColorPrice: () => { },
  getGemstonePrice: 100,
  setGemstonePrice: () => { },
  intensityPrice: 0,
  setIntensityPrice: () => { },
  summaryBlink: false, 
  setSummaryBlink: () => {},
  handleMetal: "/metal_texture/metal3.hdr",
  setHandleMetal: () => {},
  shapeList: "",
  setShapeList:() => { },
};

export const SectionContext = createContext(initialSectionState);

export const SectionProvider = ({ children }) => {
  const { parent, priceConfigVersion } = useContext(ShareContext) || {};
  const { parentUrl } = useContext(StoreContext) || {};
  const currentParent = parent || parentUrl || (typeof window !== "undefined" ? resolveParentUrl() : "");
  const isDiamondwise = isDiamondWiseParentUrl(currentParent);

  const initialMetalPrice = isPriceConfigReady() ? getMetalPrice(currentParent, "14K") : (getMetalPrice(currentParent, "14K") ?? initialPrice.metalPrice);
  const initialShankPrice = isPriceConfigReady() ? getShankPrice(currentParent, "PLAIN") : (getShankPrice(currentParent, "PLAIN") ?? initialPrice.ringPrice);
  const initialHeadPrice = isPriceConfigReady() ? getHeadPrice(currentParent, "4-PRONG") : (getHeadPrice(currentParent, "4-PRONG") ?? initialPrice.ringHeadStylePrice);
  const initialQuality = getDefaultQuality(currentParent) || "Standard";
  const initialCarat = getDefaultCarat(currentParent);
  const initialDiamondPrice = getDiamondPrice(currentParent, initialCarat, initialQuality, "Lab") || initialPrice.diamondPrice;

  const config = getConfigFromURLOrStorage(currentParent);
  const initialHeadStyle = deriveHeadStyle(config);
  const initialPlatinum = config?.platinum ?? (config?.metal === "Platinum" || config?.ringColor === "#dbdbdb" || false);
  const initialThreestone = config?.threestone || "";
  const initialShapeList = config?.shapeList || "";

  const effectiveMetal = initialPlatinum ? "Platinum" : (config?.metal || "14K");
  const effectiveShank = config?.ringShank || (isDiamondwise ? "dw-jul-ma-02-shank" : "PLAIN");
  const effectiveHead = config?.ringHead || (isDiamondwise ? "dw-jul-ma-02-head" : "4-PRONG");
  const effectiveSideSetting = config?.ringSideSetting || "PLAIN";
  const effectiveBandStyle = config?.ringMatchingBand || effectiveSideSetting;
  const effectiveRingBand = config?.ringBand || "No";
  const effectiveEngraving = config?.engraving || "";
  const effectiveCarat = Number(config?.diamondSize || initialCarat);
  const effectiveQuality = config?.selectedQuality?.quality || getDefaultQuality(currentParent) || "Standard";
  const effectiveType = config?.selectedQuality?.type || config?.diamondType || "Lab";

  const calcInitMetalPrice = isPriceConfigReady()
    ? getMetalPrice(currentParent, effectiveMetal)
    : (getMetalPrice(currentParent, effectiveMetal) ?? initialPrice.metalPrice);
  const calcInitShankPrice = isPriceConfigReady()
    ? getShankPrice(currentParent, effectiveShank)
    : (getShankPrice(currentParent, effectiveShank) ?? initialPrice.ringPrice);
  const calcInitHeadPrice = isPriceConfigReady()
    ? getHeadPrice(currentParent, effectiveHead)
    : (getHeadPrice(currentParent, effectiveHead) ?? initialPrice.ringHeadStylePrice);
  const calcInitMatchingBandPrice = effectiveRingBand === "Yes" ? getMatchingBandPrice(currentParent, effectiveBandStyle) : 0;
  const calcInitEngravingPrice = effectiveEngraving ? getEngravingPrice(currentParent) : 0;

  const calcInitIntensityPrice = config?.intensityPrice != null
    ? Number(config.intensityPrice)
    : getIntensityPrice(currentParent, config?.fancyDiamondIntensity || "Light");

  let calcInitDiamondPrice = getDiamondPrice(currentParent, effectiveCarat, effectiveQuality, effectiveType) || initialPrice.diamondPrice;
  if (config?.activeTab === "Fancy-Gemstone") {
    calcInitDiamondPrice = Math.round(calcInitDiamondPrice * getFancyPriceFactor(currentParent)) + getGemstoneExtraPrice(currentParent, config?.gemstone || "blue-sapphire");
  } else if (config?.activeTab === "Fancy Colored") {
    calcInitDiamondPrice = calcInitDiamondPrice + getColoredDiamondExtraPrice(currentParent, config?.fancyDiamond || "Blue") + Math.round(calcInitIntensityPrice);
  }

  const [shankTotal, setShankTotal] = useState(() => calcInitShankPrice + calcInitMetalPrice + calcInitMatchingBandPrice + calcInitEngravingPrice);
  const [headTotal, setHeadTotal] = useState(() => calcInitHeadPrice);
  const [stoneTotal, setStoneTotal] = useState(() => calcInitDiamondPrice);
  const [otherTotal, setOtherTotal] = useState(initialSectionState.otherTotal);

  // Shank Section
  const [stylePrice, setStylePrice] = useState(() => calcInitShankPrice);
  const [engravingPrice, setEngravingPrice] = useState(() => calcInitEngravingPrice);
  const [ringSideSettingPrice, setRingSideSettingPrice] = useState(initialPrice.ringSideSettingPrice);
  const [metalPrice, setMetalPrice] = useState(() => calcInitMetalPrice);
  const [matchingBandPrice, setMatchingBandPrice] = useState(() => calcInitMatchingBandPrice);
  const [platinum, setPlatinum] = useState(initialPlatinum);
  const [sideStyle, setSideStyle] = useState("none");
  const [symbol, setSymbol] = useState("");
  const [bandWidth, setBandWidth] = useState(config?.bandWidth || "2mm");
  const [styleShape, setStyleShape] = useState(config?.styleShape || "D");

  // Head Section
  const [headStyle, setHeadstyle] = useState(initialHeadStyle);
  // const [haloStyle, setHaloStyle] = useState("");
  const [threestone, setThreestone] = useState(initialThreestone);
  const [headPrice, setHeadPrice] = useState(() => calcInitHeadPrice);
  const [shapeList, setShapeList] = useState(initialShapeList);

  // Persist section state (headStyle, platinum, threestone, shapeList) to sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const existing = JSON.parse(sessionStorage.getItem(LS_KEY) || "{}");
      sessionStorage.setItem(LS_KEY, JSON.stringify({
        ...existing,
        _storeParentUrl: currentParent,
        headStyle,
        platinum,
        threestone,
        shapeList,
      }));
    } catch {}
  }, [currentParent, headStyle, platinum, threestone, shapeList]);

  // Stone Section
  const [stoneThreestone, setStoneThreestone] = useState("lab-diamond");
  const [activeDiamondSize, setActiveDiamondSize] = useState(effectiveCarat);
  const [activeDiamondType, setActiveDiamondType] = useState(() => calcInitDiamondPrice);
  const [activeCut, setActiveCut] = useState(config?.cut || "Good");
  const [clarityPrice, setClarityPrice] = useState(100);
  const [activePriceColor, setActivePriceColor] = useState(100);
  const [shapePrice, setShapePrice] = useState(100);
  const [caratP, setCaratP] = useState(() => calcInitDiamondPrice);
  const [diamondCarat, setDiamondCarat] = useState(effectiveCarat);
  const [cutPrice, setCutPrice] = useState(100);

  const [selectedTab, setSelectedTab] = useState(config?.activeTab || initialSectionState.selectedTab);
  const [countryShortName, setCountryShortName] = useState(initialSectionState.countryShortName);
  const [sizeMM, setSizeMM] = useState(initialSectionState.sizeMM);
  const [fancyColorPrice, setFancyColorPrice] = useState(initialSectionState.fancyColorPrice);
  const [getGemstonePrice, setGemstonePrice] = useState(initialSectionState.getGemstonePrice);
  const [intensityPrice, setIntensityPrice] = useState(() => calcInitIntensityPrice);
  const [summaryBlink, setSummaryBlink] = useState(initialSectionState.summaryBlink);
  const [handleMetal, setHandleMetal] = useState(initialSectionState.handleMetal);

  useEffect(() => {
    if (!currentParent) return;
    const cfg = getConfigFromURLOrStorage(currentParent);
    const isDw = isDiamondWiseParentUrl(currentParent);
    const currMetal = cfg?.platinum ? "Platinum" : (cfg?.metal || (platinum ? "Platinum" : "14K"));
    const currShank = cfg?.ringShank || (isDw ? "dw-jul-ma-02-shank" : "PLAIN");
    const currHead = cfg?.ringHead || (isDw ? "dw-jul-ma-02-head" : "4-PRONG");
    const currSideSetting = cfg?.ringSideSetting || "PLAIN";
    const currBandStyle = cfg?.ringMatchingBand || currSideSetting;
    const currRingBand = cfg?.ringBand || "No";
    const currEngraving = cfg?.engraving || "";
    const currCarat = Number(cfg?.diamondSize || diamondCarat || getDefaultCarat(currentParent));
    const currQuality = cfg?.selectedQuality?.quality || getDefaultQuality(currentParent) || "Standard";
    const currType = cfg?.selectedQuality?.type || cfg?.diamondType || "Lab";

    const nextMetalPrice = isPriceConfigReady()
      ? getMetalPrice(currentParent, currMetal)
      : (getMetalPrice(currentParent, currMetal) ?? initialPrice.metalPrice);
    const nextShankPrice = isPriceConfigReady()
      ? getShankPrice(currentParent, currShank)
      : (getShankPrice(currentParent, currShank) ?? initialPrice.ringPrice);
    const nextHeadPrice = isPriceConfigReady()
      ? getHeadPrice(currentParent, currHead)
      : (getHeadPrice(currentParent, currHead) ?? initialPrice.ringHeadStylePrice);
    const nextMatchingBandPrice = currRingBand === "Yes" ? getMatchingBandPrice(currentParent, currBandStyle) : 0;
    const nextEngravingPrice = currEngraving ? getEngravingPrice(currentParent) : 0;
    const nextIntensityPrice = cfg?.intensityPrice != null
      ? Number(cfg.intensityPrice)
      : getIntensityPrice(currentParent, cfg?.fancyDiamondIntensity || "Light");

    let nextDiamondPrice = getDiamondPrice(currentParent, currCarat, currQuality, currType) || initialPrice.diamondPrice;
    if (cfg?.activeTab === "Fancy-Gemstone") {
      nextDiamondPrice = Math.round(nextDiamondPrice * getFancyPriceFactor(currentParent)) + getGemstoneExtraPrice(currentParent, cfg?.gemstone || "blue-sapphire");
    } else if (cfg?.activeTab === "Fancy Colored") {
      nextDiamondPrice = nextDiamondPrice + getColoredDiamondExtraPrice(currentParent, cfg?.fancyDiamond || "Blue") + Math.round(nextIntensityPrice);
    }

    setMetalPrice(nextMetalPrice);
    setStylePrice(nextShankPrice);
    setHeadPrice(nextHeadPrice);
    setMatchingBandPrice(nextMatchingBandPrice);
    setEngravingPrice(nextEngravingPrice);
    setIntensityPrice(nextIntensityPrice);
    setCaratP(nextDiamondPrice);
    setActiveDiamondType(nextDiamondPrice);
    setStoneTotal(nextDiamondPrice);
    setShankTotal(nextShankPrice + nextMetalPrice + nextMatchingBandPrice + nextEngravingPrice);
    setHeadTotal(nextHeadPrice);
  }, [currentParent, priceConfigVersion]);

  return (
    <SectionContext.Provider value={{
      // Totals
      shankTotal, setShankTotal,
      headTotal, setHeadTotal,
      stoneTotal, setStoneTotal,
      otherTotal, setOtherTotal,

      // Shank Section
      stylePrice, setStylePrice,
      engravingPrice, setEngravingPrice,
      ringSideSettingPrice, setRingSideSettingPrice,
      metalPrice, setMetalPrice,
      matchingBandPrice, setMatchingBandPrice,
      platinum, setPlatinum,
      sideStyle, setSideStyle,
      symbol, setSymbol,

      // Head Section
      headStyle, setHeadstyle,
      // haloStyle, setHaloStyle,
      threestone, setThreestone,
      headPrice, setHeadPrice,
      shapeList, setShapeList,

      // Stone Section
      stoneThreestone, setStoneThreestone,
      activeDiamondSize, setActiveDiamondSize,
      activeDiamondType, setActiveDiamondType,
      activeCut, setActiveCut,
      clarityPrice, setClarityPrice,
      activePriceColor, setActivePriceColor,
      shapePrice, setShapePrice,
      caratP, setCaratP,
      diamondCarat, setDiamondCarat,
      cutPrice, setCutPrice,
      selectedTab, setSelectedTab,
      countryShortName, setCountryShortName,
      sizeMM, setSizeMM,
      fancyColorPrice, setFancyColorPrice,
      getGemstonePrice, setGemstonePrice,
      intensityPrice, setIntensityPrice,
      summaryBlink, setSummaryBlink,
      handleMetal, setHandleMetal
    }}>
      {children}
    </SectionContext.Provider>
  );
};
