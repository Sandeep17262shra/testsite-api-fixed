import { createContext, useState, useContext, useEffect } from "react";
import { StoreContext } from "./StoreContext";
import data from '../data/data.json'
import { Base64 } from 'js-base64';
import { isDiamondWiseParentUrl } from "../priceConfig";
import { normalizeRingSizeSystem } from "../utility/Parentconfig";

const LS_KEY = "ring_configurator_state";

const initialRingState = {
  ringColor: "#FFD280",
  setRingColor: () => { },
  engraving: "",
  setEngraving: () => { },
  ringWidth: 0.3,
  setRingWidth: () => { },
  metal: "14K",
  setMetal: () => { },
  sizeOption: "US",
  setSizeOption: () => { },
  ringSize: "6",
  setRingSize: () => { },
  engravingFont: "Arial",
  setEngravingFont: () => { },
  mobileZoomIn: false,
  setMobileZoomIn: () => { },
  isEnabled: false,
  setIsEnabled: () => { },
  ringHead: "4-PRONG",
  setRingHead: () => { },
  twoStoneLeft: "round",
  setTwoStoneLeft: () => { },
  twoStoneRight: "pear",
  setTwoStoneRight: () => { },
  ringShank: "PLAIN",
  setRingShank: () => { },
  ringSideSetting: "PLAIN",
  setRingSideSetting: () => { },
  ringMatchingBand: "PLAIN",
  setRingMatchingBand: () => { },
  headColor: "#FFD280",
  setHeadColor: () => { },
  ringBand: "No",
  setRingBand: () => { },
  biMetal: "No",
  setBiMetal: () => { },
  diamondWiseDesignId: "",
  setDiamondWiseDesignId: () => { },
  bandColor: "#FFD280",
  setBandColor: () => { },
  finalRingPrice: data.ringPrice,
  setFinalRingPrice: () => { },
  metalness: 1,
  setMetalness: () => { },                // full metallic
  roughness: 0,
  setRoughness: () => { },         // smoother surface
  reflectivity: 1,
  setReflectivity: () => { },        // max reflection
  clearcoat: 1,                   // adds a glossy layer
  setClearcoat: () => { },
  clearcoatRoughness: 0.05,       // smoother clear coat
  setClearcoatRoughness: () => { },
  envMapIntensity: 1,
  setEnvMapIntensity: () => { },
  bandWidth: "2mm",
  setBandWidth:() => { },
  weddingBandCoverage: "3_4",
  setWeddingBandCoverage: () => { },
  styleShape: "D",
  setStyleShape:() => { },
  engravingFocus: false,
  setEngravingFocus: () => {},
};

export const RingContext = createContext(initialRingState);

export const RingProvider = ({ children }) => {

  	const getConfigFromURL = () => {
	  if (typeof window === "undefined") return null;
	  const params = new URLSearchParams(window.location.search);
	  let encodedConfig = params.get('config');

	  if (!encodedConfig && window.self !== window.top && document.referrer) {
	    try {
	      const refUrl = new URL(document.referrer);
	      encodedConfig = refUrl.searchParams.get('config');
	    } catch {}
	  }

	  if (!encodedConfig) {
	    try {
	      const stored = sessionStorage.getItem(LS_KEY);
	      if (stored) return JSON.parse(stored);
	    } catch {}
	    return null;
	  }

	  try {
		const decoded = Base64.decode(encodedConfig);
		return JSON.parse(decoded);
	  } catch (e) {
		console.error("Failed to decode config:", e);
		return null;
	  }
	};	
	
  const config = getConfigFromURL();
  const { parentUrl } = useContext(StoreContext) || {};
  const isDiamondwise = isDiamondWiseParentUrl(parentUrl);

  const initialShank = config?.ringShank || (isDiamondwise ? "dw-jul-ma-02-shank" : initialRingState.ringShank);
  const initialHead = config?.ringHead || (isDiamondwise ? "dw-jul-ma-02-head" : initialRingState.ringHead);
  // An empty design id is meaningful: it identifies a standard (non-
  // DiamondWise) ring. Use the DiamondWise store default only when a shared
  // configuration did not provide this field at all.
  const initialDWId = config?.diamondWiseDesignId ?? (isDiamondwise ? "diamondwise-jul-ma-02" : initialRingState.diamondWiseDesignId);
	
  const [ringColor, setRingColor] = useState(config?.ringColor || initialRingState.ringColor);
  const [engraving, setEngraving] = useState(config?.engraving || initialRingState.engraving);
  const [engravingFocus, setEngravingFocus] = useState(false);
  const [ringWidth, setRingWidth] = useState(config?.ringWidth || initialRingState.ringWidth);
  const [metal, setMetal] = useState(config?.metal || initialRingState.metal);
  const [sizeOption, setSizeOption] = useState(
    (config?.sizeOption ? normalizeRingSizeSystem(config.sizeOption) : null) || initialRingState.sizeOption
  );
  const [ringSize, setRingSize] = useState(
    config?.ringSize != null ? String(config.ringSize) : initialRingState.ringSize
  );
  const [engravingFont, setEngravingFont] = useState(config?.engravingFont || initialRingState.engravingFont);
  const [mobileZoomIn, setMobileZoomIn] = useState(config?.mobileZoomIn || initialRingState.mobileZoomIn);
  const [ringHead, setRingHead] = useState(initialHead);
  const [twoStoneLeft, setTwoStoneLeft] = useState(config?.twoStoneLeft || initialRingState.twoStoneLeft);
  const [twoStoneRight, setTwoStoneRight] = useState(config?.twoStoneRight || initialRingState.twoStoneRight);
  const initialBiMetal =
    config?.biMetal === "Yes" || config?.biMetal === true
      ? "Yes"
      : config?.biMetal === "No" || config?.biMetal === false
      ? "No"
      : config?.isEnabled != null
      ? (config.isEnabled ? "Yes" : "No")
      : (config?.headColor && config?.ringColor && config.headColor.toLowerCase() !== config.ringColor.toLowerCase())
      ? "Yes"
      : initialRingState.biMetal;

  const [ringShank, setRingShank] = useState(initialShank);
  const [ringSideSetting, setRingSideSetting] = useState(config?.ringSideSetting || initialRingState.ringSideSetting);
  const [ringMatchingBand, setRingMatchingBand] = useState(config?.ringMatchingBand || initialRingState.ringMatchingBand);
  const [headColor, setHeadColor] = useState(config?.headColor || initialRingState.headColor);
  const [ringBand, setRingBand] = useState(config?.ringBand || initialRingState.ringBand);
  const [biMetal, setBiMetal] = useState(initialBiMetal);
  const [isEnabled, setIsEnabled] = useState(config?.isEnabled ?? (initialBiMetal === "Yes"));
  const [diamondWiseDesignId, setDiamondWiseDesignId] = useState(initialDWId);
  const [bandColor, setBandColor] = useState(config?.ringColor || config?.bandColor || initialRingState.bandColor);
  const [finalRingPrice, setFinalRingPrice] = useState(config?.finalRingPrice || initialRingState.finalRingPrice);

  const [metalness, setMetalness] = useState(config?.metalness || initialRingState.metalness);
  const [roughness, setRoughness] = useState(config?.roughness || initialRingState.roughness);
  const [reflectivity, setReflectivity] = useState(config?.reflectivity || initialRingState.reflectivity);
  const [clearcoat, setClearcoat] = useState(config?.clearcoat || initialRingState.clearcoat);
  const [clearcoatRoughness, setClearcoatRoughness] = useState(config?.clearcoatRoughness || initialRingState.clearcoatRoughness);
  const [envMapIntensity, setEnvMapIntensity] = useState(config?.envMapIntensity || initialRingState.envMapIntensity);
  const [bandWidth, setBandWidth] = useState(config?.bandWidth || initialRingState.bandWidth);
  const [weddingBandCoverage, setWeddingBandCoverage] = useState(config?.weddingBandCoverage || initialRingState.weddingBandCoverage || "3_4");
  const [styleShape, setStyleShape] = useState(config?.styleShape || initialRingState.styleShape);
  const [glInstance, setGlInstance] = useState(null);

  // Keep matching band metal color (bandColor) always in sync with shank metal color (ringColor)
  useEffect(() => {
    if (ringColor && bandColor !== ringColor) {
      setBandColor(ringColor);
    }
  }, [ringColor, bandColor]);

  // Keep isEnabled in sync with biMetal
  useEffect(() => {
    const shouldBeEnabled = biMetal === "Yes";
    if (isEnabled !== shouldBeEnabled) {
      setIsEnabled(shouldBeEnabled);
    }
  }, [biMetal, isEnabled]);

  // When switching to a DiamondWise store dynamically without an explicit config,
  // ensure the initial DiamondWise preset (Amelie) is selected.
  useEffect(() => {
    if (!config && isDiamondWiseParentUrl(parentUrl)) {
      setRingShank((prev) => (prev === initialRingState.ringShank ? "dw-jul-ma-02-shank" : prev));
      setRingHead((prev) => (prev === initialRingState.ringHead ? "dw-jul-ma-02-head" : prev));
      setDiamondWiseDesignId((prev) => (prev === initialRingState.diamondWiseDesignId ? "diamondwise-jul-ma-02" : prev));
    }
  }, [parentUrl, config]);

  // Persist ring state to sessionStorage whenever any setting changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const existing = JSON.parse(sessionStorage.getItem(LS_KEY) || "{}");
      sessionStorage.setItem(LS_KEY, JSON.stringify({
        ...existing,
        ringColor,
        headColor,
        bandColor: ringColor,
        metal,
        ringHead,
        twoStoneLeft,
        twoStoneRight,
        ringShank,
        ringSideSetting,
        ringMatchingBand,
        ringBand,
        biMetal,
        sizeOption,
        ringSize,
        engraving,
        engravingFont,
        bandWidth,
        weddingBandCoverage,
        styleShape,
        diamondWiseDesignId,
      }));
    } catch {}
  }, [
    ringColor, headColor, metal, ringHead, twoStoneLeft, twoStoneRight, ringShank, ringSideSetting,
    ringMatchingBand, ringBand, biMetal, sizeOption, ringSize,
    engraving, engravingFont, bandWidth, weddingBandCoverage, styleShape, diamondWiseDesignId,
  ]);

  return (
    <RingContext.Provider value={{
      ringColor, setRingColor,
      engraving, setEngraving,
	  engravingFocus, setEngravingFocus,
      ringWidth, setRingWidth,
      metal, setMetal,
      sizeOption, setSizeOption,
      ringSize, setRingSize,
      engravingFont, setEngravingFont,
      mobileZoomIn, setMobileZoomIn,
      isEnabled, setIsEnabled,
      ringHead, setRingHead,
      twoStoneLeft, setTwoStoneLeft,
      twoStoneRight, setTwoStoneRight,
      ringShank, setRingShank,
      ringSideSetting,
      setRingSideSetting,
	  ringMatchingBand,
      setRingMatchingBand,
      headColor,
      setHeadColor,
      ringBand,
      setRingBand,
      biMetal,
      setBiMetal,
      diamondWiseDesignId,
      setDiamondWiseDesignId,
      bandColor,
      setBandColor,
      finalRingPrice,
      setFinalRingPrice,
      metalness, setMetalness,
      roughness, setRoughness,
      reflectivity, setReflectivity,
      clearcoat, setClearcoat,
      clearcoatRoughness, setClearcoatRoughness,
      envMapIntensity, setEnvMapIntensity,
      bandWidth, setBandWidth,
      weddingBandCoverage, setWeddingBandCoverage,
      styleShape, setStyleShape,
	  glInstance, setGlInstance,
    }}>
      {children}
    </RingContext.Provider>
  );
};
