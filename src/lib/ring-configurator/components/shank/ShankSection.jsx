import apiData from '../../data/api-data.json';
import { RingContext } from '../../contexts/RingContext';
import { useRef, useContext, useEffect, useState } from 'react';
import { LoaderContext } from '../../contexts/LoaderContext';
import { calculateFinalRingPrice } from '../../utility/calculateFInalRingDiamondPrice';
import { applyFilterWithLoader } from '../../utility/applyFilterWithLoader';
import initialPrice from '../../data/data.json'
import { SectionContext } from '../../contexts/SectionContext';
import { Base64 } from 'js-base64';
import OtherSection from "../other/OtherSection";
import { CameraViewContext } from "../../contexts/CameraViewContext";
import { ShareContext } from "../../contexts/ShareContext";
import { DIAMONDWISE_DESIGNS } from '../../data/diamondwiseDesigns';
import {
  getCurrencyRate,
  hideNaturalOption,
  getCurrencySign,
  } from "../../utility/Parentconfig";
import { 
  getMetalPrice, 
  getShankPrice,
  getMatchingBandPrice,
  filterAvailableOptions,
  isOptionAvailable
} from "../../utility/storePriceHelper";

const fonts = apiData.ring.engravingFont;
const symbols = [
    "symbol-1",
    "symbol-2",
    "symbol-3",
    "symbol-4",
    "symbol-5",
    "symbol-6",
    "symbol-7",
    "symbol-8",
    "symbol-9",
    "symbol-10",
    "symbol-11",
    "symbol-12",
    "symbol-13",
    "symbol-14",
    "symbol-15",
    "symbol-16",
];

// const symbs = [
//     "♡", "☆", "☾", "∞", "☯", "♑", "♓", "♈", "♉", "♒", "♋", "♌", "♍", "♎", "♏", "♐"
// ];

const symbs = ["♡", "☆", "☽", "∞", "☯︎", "♑︎", "♓︎", "♉︎", "♍︎", "♎︎",  "♏︎", "♋︎", "♈︎", "♌︎", "♒︎", "♐︎"];

// Metal items
const metalItems = apiData.ring.color;

function ShankSection() {
    const {
        setShankTotal, shankTotal,
        stylePrice, setStylePrice,
        engravingPrice, setEngravingPrice,
        ringSideSettingPrice, setRingSideSettingPrice,
        metalPrice, setMetalPrice,
        matchingBandPrice, setMatchingBandPrice,
        platinum, setPlatinum,
        sideStyle, setSideStyle,
        symbol, setSymbol,
        summaryBlink, setSummaryBlink,
        // setRang
    } = useContext(SectionContext);

    // Use separate refs for each hover type to avoid conflicts
    const preShankHoverState = useRef(null);
    const preSideSettingHoverState = useRef(null);
    const preMatchingBandHoverState = useRef(null);
    const engarvingInputRef = useRef(null);
	const engravingZoneRef = useRef(null);

    const isMobile = window.innerWidth <= 768;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentIndex2, setCurrentIndex2] = useState(0);
    const itemsToShow = 5;

    // State for temporarily displayed prices and name during hover
    const [hoverStylePrice, setHoverStylePrice] = useState(null);
    const [hoveredShankName, setHoveredShankName] = useState(null);
    const [priceDifference, setPriceDifference] = useState(null);

    const [sideSettingHoverPrice, setSideSettingHoverPrice] = useState(null);
    const [hoveredSideSettingName, setHoveredSideSettingName] = useState(null);
    const [sideSettingPriceDifference, setSideSettingPriceDifference] = useState(null);

    const [matchingBandHoverPrice, setMatchingBandHoverPrice] = useState(null);
    const [hoveredMatchingBandName, setHoveredMatchingBandName] = useState(null);
    const [priceMetalDifference, setPriceMetalDifference] = useState(0);

    const [hoveredMetal, setHoveredMetal] = useState(null);

    const [hoveredMetalItem, setHoveredMetalItem] = useState(null);
    //new state for new features
    const [selectedMetalItem, setSelectedMetalItem] = useState(null);
    const [persistedMetalDiff, setPersistedMetalDiff] = useState(0);
    const [hoveredPurity, setHoveredPurity] = useState(null);
    const [purityPriceDifference, setPurityPriceDifference] = useState(null);
    const [persistedPurityDiff, setPersistedPurityDiff] = useState(null);
    const [selectedPurity, setSelectedPurity] = useState(null);
    const [hoveredCarat, setHoveredCarat] = useState(null);
    const [caratPriceDifference, setCaratPriceDifference] = useState(null);
    const { setSelectedTab } = useContext(SectionContext);
    
    // REPLACE handleMetalHover:
// ✅ WITH THIS NEW VERSION:
const handleMetalHover = (item) => {
    setHoveredMetalItem(item);
    
    let hoveredMetalPrice = 0;
    let currentMetalPrice = 0;
    
    if (item.src === "/images/platinum.webp" || 
        item.src === "/images/tantalum.webp" || 
        item.src === "/images/carbon-fiber.webp") {
        hoveredMetalPrice = getMetalPrice(parent, "Platinum");
        
        if (platinum) {
            currentMetalPrice = getMetalPrice(parent, "Platinum");
        } else {
            currentMetalPrice = getMetalPrice(parent, metal);
        }
    } else {
        hoveredMetalPrice = getMetalPrice(parent, metal);
        
        if (platinum) {
            currentMetalPrice = getMetalPrice(parent, "Platinum");
        } else {
            currentMetalPrice = getMetalPrice(parent, metal);
        }
    }
    
    const difference = hoveredMetalPrice - currentMetalPrice;
    setPriceMetalDifference(difference === 0 ? 0 : difference);
};

    const handleMetalHoverEnd = () => {
    setHoveredMetalItem(null);
    setPriceMetalDifference(persistedMetalDiff); // already correct, no change needed
};




    const [hoverFinalRingPrice, setHoverFinalRingPrice] = useState(null);


    const next = () => {
        if (currentIndex < metalItems.length - itemsToShow) {
            setCurrentIndex(currentIndex + 1);
        }
    };
    const prev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const next2 = () => {
        if (currentIndex2 < apiData.ring.shank.length - itemsToShow) {
            setCurrentIndex2(currentIndex2 + 1);
        }
    };
    const prev2 = () => {
        if (currentIndex2 > 0) {
            setCurrentIndex2(currentIndex2 - 1);
        }
    };

    const {
        ringShank, setRingShank,
        setRingSideSetting,
		setRingMatchingBand,
		ringMatchingBand,
        setRingBand,
        setEngraving,
        finalRingPrice, setFinalRingPrice,
        metal, setMetal,
        ringHead,
        ringSideSetting,
        ringBand,
        setRingColor, ringColor,
        setEngravingFont, engravingFont,
        engraving,
        bandColor, setBandColor,
        sideSetting, setHeadColor,
        setRingHead, bandWidth, setBandWidth ,styleShape, setStyleShape, setEngravingFocus 
    } = useContext(RingContext);
	
	const { setCameraView } = useContext(CameraViewContext);

    const { setLoader } = useContext(LoaderContext);

    // --- Currency and price conversion  ---
    const {parent, setParent } = useContext(ShareContext);
        const CurrencyRate=getCurrencyRate(parent);
        const CurrencySign=getCurrencySign(parent);
        const naturaldiamondoption=hideNaturalOption(parent);

    // --- Updated Shank Hover Logic with Price Difference ---
const handleShankHover = (hoveredShank) => {
    if (!preShankHoverState.current) {
        preShankHoverState.current = {
            currentStylePrice: stylePrice,
        };
    }

    // Calculate FULL price with the hovered shank using calculateFinalRingPrice
    // This accounts for all components and their interactions
    const hoveredResult = calculateFinalRingPrice(
        metal, 
        ringHead, 
        hoveredShank, 
        ringMatchingBand, 
        ringBand,
        bandWidth, 
        styleShape, 
        engraving, 
        parent  // ✅ IMPORTANT: Pass parent for store prices
    );

    // Get just the shank price from the breakdown
    const hoveredShankPrice = hoveredResult.breakdown.ringShankPrice;
    
    // Calculate the difference
    const difference = hoveredShankPrice - stylePrice;

    setHoverStylePrice(hoveredShankPrice);
    setHoveredShankName(hoveredShank);
    setPriceDifference(difference);
};

    const handleShankHoverEnd = () => {
        if (preShankHoverState.current) {
            setHoverStylePrice(null);
            setHoveredShankName(null);
            setPriceDifference(null);
            preShankHoverState.current = null;
        }
    };

    // --- Updated Side Setting Hover Logic with Price Difference ---
// ✅ REPLACE ENTIRE FUNCTION
const handleSideSettingHover = (hoveredSideSetting) => {
    if (!preSideSettingHoverState.current) {
        preSideSettingHoverState.current = {
            currentRingSideSettingPrice: ringSideSettingPrice,
        };
    }

    // Calculate FULL price with hovered matching band
    const hoveredResult = calculateFinalRingPrice(
        metal, 
        ringHead, 
        ringShank, 
        hoveredSideSetting, 
        ringBand,
        bandWidth, 
        styleShape, 
        engraving, 
        parent  // ✅ Pass parent
    );

    const hoveredMatchingBandPrice = hoveredResult.breakdown.matchingBandPrice;
    const difference = hoveredMatchingBandPrice - matchingBandPrice;

    setSideSettingHoverPrice(hoveredMatchingBandPrice);
    setHoveredSideSettingName(hoveredSideSetting);
    setSideSettingPriceDifference(difference);
};

    const handleSideSettingHoverEnd = () => {
        if (preSideSettingHoverState.current) {
            setSideSettingHoverPrice(null);
            setHoveredSideSettingName(null);
            setSideSettingPriceDifference(null);
            preSideSettingHoverState.current = null;
        }
    };

    const handleShankChange = (newShank) => {
    // Clear all hover states
    setHoverFinalRingPrice(null);
    setHoverStylePrice(null);
    setHoveredShankName(null);
    setSideSettingHoverPrice(null);
    setHoveredSideSettingName(null);
    setMatchingBandHoverPrice(null);
    setHoveredMatchingBandName(null);
    preShankHoverState.current = null;

    applyFilterWithLoader(setLoader, () => {
        setRingShank(newShank);
        setRingHead("4-PRONG");

        let price = calculateFinalRingPrice(
            metal, 
            ringHead, 
            newShank, 
            ringMatchingBand, 
            ringBand,
            bandWidth, 
            styleShape, 
            engraving, 
            parent  // ✅ ADD THIS
        );

        setFinalRingPrice(price.finalPrice);
        setStylePrice(price.breakdown.ringShankPrice);  // ✅ Remove CurrencyRate multiplication (already in price)
        setRingSideSettingPrice(price.breakdown.ringSideSettingPrice);
        setMatchingBandPrice(price.breakdown.matchingBandPrice);
        setSummaryBlink(true);
    });
}

    const handleSideSettingChange = (newSideSetting) => {
    // Clear all hover states
    setHoverFinalRingPrice(null);
    setHoverStylePrice(null);
    setHoveredShankName(null);
    setPriceDifference(null);
    setSideSettingHoverPrice(null);
    setHoveredSideSettingName(null);
    setMatchingBandHoverPrice(null);
    setHoveredMatchingBandName(null);
    preSideSettingHoverState.current = null;

    applyFilterWithLoader(setLoader, () => {
        setRingMatchingBand(newSideSetting);

        const price = calculateFinalRingPrice(
            metal, 
            ringHead, 
            ringShank, 
            newSideSetting, 
            ringBand,
            bandWidth, 
            styleShape, 
            engraving, 
            parent  // ✅ ADD THIS
        );
        
        setFinalRingPrice(price.finalPrice);
        setRingSideSettingPrice(price.breakdown.ringSideSettingPrice);  // ✅ Remove CurrencyRate
        setMatchingBandPrice(price.breakdown.matchingBandPrice);  // ✅ Remove CurrencyRate
        setStylePrice(price.breakdown.ringShankPrice);
        setSummaryBlink(true);
    });
};

    // --- Matching Band Hover Logic ---
    const handleMatchingBandHover = (hoveredBand) => {
        if (!preMatchingBandHoverState.current) {
            preMatchingBandHoverState.current = {
                currentFinalRingPrice: finalRingPrice,
                currentMatchingBandPrice: matchingBandPrice,
            };
        }

        const price = calculateFinalRingPrice(metal, ringHead, ringShank, ringSideSetting, hoveredBand);
        setHoverFinalRingPrice(price.finalPrice);
        setMatchingBandHoverPrice(price.breakdown.matchingBandPrice);
        setHoveredMatchingBandName(hoveredBand);
    };

    const handleMatchingBandHoverEnd = () => {
        if (preMatchingBandHoverState.current) {
            setHoverFinalRingPrice(null);
            setMatchingBandHoverPrice(null);
            setHoveredMatchingBandName(null);
            preMatchingBandHoverState.current = null;
        }
    };

    const handleColorChange = (activeColor, src) => {
    applyFilterWithLoader(setLoader, () => {
        setRingColor(activeColor);
        setBandColor(activeColor);
        setHeadColor(activeColor);
        if (src === "/images/platinum.webp" || src === "/images/tantalum.webp" || src === "/images/carbon-fiber.webp") {
            setPlatinum(true);
        } else {
            setPlatinum(false);
        }
        if (platinum) {
            setPersistedPurityDiff(null);
            setHoveredPurity(null);
        } else {
            // back to gold → default should behave like 14K (0 diff)
            setPersistedPurityDiff(null);
            setSelectedPurity("14K");
        }
        setSelectedMetalItem(hoveredMetalItem);
        // Save whatever is currently showing as the persisted diff
        setPersistedMetalDiff(priceMetalDifference);
    });
};
    const handlePurityHover = (purity) => {
        setHoveredPurity(purity);
        const hoveredPrice = getMetalPrice(parent, purity);
        const basePrice = getMetalPrice(parent, "14K");
        const diff = hoveredPrice - basePrice;
        setPurityPriceDifference(diff === 0 ? null : diff);
    };
    const handlePurityHoverEnd = () => {
        setHoveredPurity(null);
        // keep showing diff for the currently selected purity
        setPurityPriceDifference(persistedPurityDiff);
    };

    if(ringColor=="#e5e4e2")
        setPlatinum(true);

    const matchedColor = metalItems.find(
        (color) => color.hex.toLowerCase() === ringColor.toLowerCase()
    );

    // REPLACE handleMetal:
// ✅ REPLACE ENTIRE FUNCTION
const handleMetal = (newMetal) => {
  const metalPrice = getMetalPrice(parent, newMetal);
  const basePrice = getMetalPrice(parent, "14K");
  const diff = metalPrice - basePrice;
  
  setPersistedPurityDiff(diff === 0 ? null : diff);
  setSelectedPurity(newMetal);
  
  applyFilterWithLoader(setLoader, () => {
    setMetal(newMetal);
    let price = calculateFinalRingPrice(
      newMetal, ringHead, ringShank, ringSideSetting, ringBand,
      bandWidth, styleShape, engraving, parent  // ✅ ADD parent
    );
    setFinalRingPrice(price.finalPrice);
    setMetalPrice(price.breakdown.metalPrice);
    setSummaryBlink(true);
    
    if (newMetal === "Platinum") {
      const whiteGoldColor = apiData.ring.color.find(c => c.name === "White Gold");
      if (whiteGoldColor) {
        setRingColor(whiteGoldColor.hex);
        setHeadColor(whiteGoldColor.hex);
      }
    }
  });
};

    const handleBandWidth = (newBandWidth) => {
    setBandWidth(newBandWidth);
    let price = calculateFinalRingPrice(
        metal, 
        ringHead, 
        ringShank, 
        ringSideSetting, 
        ringBand, 
        newBandWidth, 
        styleShape, 
        engraving, 
        parent  // ✅ ADD THIS
    );
    setStylePrice(price.breakdown.ringShankPrice);
    setSummaryBlink(true);
};

    const handleStyleShape = (newStyleShape) => {
    setStyleShape(newStyleShape);
    let price = calculateFinalRingPrice(
        metal, 
        ringHead, 
        ringShank, 
        ringSideSetting, 
        ringBand, 
        bandWidth, 
        newStyleShape, 
        engraving, 
        parent  // ✅ ADD THIS
    );
    setStylePrice(price.breakdown.ringShankPrice);
    setSummaryBlink(true);
};


    const double_count_emojisApp2 = [ "☯︎", "♑︎", "♓︎", "♈︎", "♉︎", "♒︎", "♋︎", "♌︎", "♍︎", "♎︎", "♏︎", "♐︎"];

    const getAdjustedLength = (newValue) => {
      let length = newValue.length;
  
      double_count_emojisApp2.forEach(emoji => {
          const occurrences = (newValue.match(new RegExp(emoji, "g")) || []).length;
          length -= occurrences; // Reduce count for each double-counted emoji
      });
  
      return length;
  }

    const trimToAdjustedLength = (str, maxLen) => {
        let result = "";
        let count = 0;

        for (let char of str) {
            count = getAdjustedLength(result + char);

            if (count > maxLen) break; // stop adding more chars
            result += char;
        }

        return result;
    }


    const handleEngraving = (e) => {
        let activeEngraving = e.target.value;
        if (getAdjustedLength(activeEngraving) > 15) {
            activeEngraving = trimToAdjustedLength(activeEngraving, 15);
        }

        applyFilterWithLoader(setLoader, () => {
            setEngraving(activeEngraving);
            setSummaryBlink(true);
        });
    };
	
	const activateEngravingZoom = () => {
	  setEngravingFocus(true);
	  setCameraView("engravingZoom");
	};

	const deactivateEngravingZoom = () => {
	  setEngravingFocus(false);
	  setCameraView("perspective");
	};

    const handleSymbol = (symbol) => {
        const input = engarvingInputRef.current;
        if (!input) return;
		
		activateEngravingZoom();

        const start = input.selectionStart;
        const end = input.selectionEnd;
        const newValue = engraving.slice(0, start) + symbol + engraving.slice(end);

        if (getAdjustedLength(newValue) <= 15) {
            setEngraving(newValue);
            requestAnimationFrame(() => {
                input.setSelectionRange(start + symbol.length, start + symbol.length);
            });
            setSummaryBlink(true);
        }
  };

    useEffect(() => {
    let price = calculateFinalRingPrice(
        metal, 
        ringHead, 
        ringShank, 
        ringSideSetting, 
        ringBand, 
        bandWidth, 
        styleShape, 
        engraving, 
        parent  // ✅ ADD THIS
    );
    setEngravingPrice(price.breakdown.engravingPrice);
}, [engraving, parent]);  // ✅ Add parent to dependency array

    const handleEngravingFont = (font) => {
		activateEngravingZoom();
        setEngravingFont(font);
    }

    const handleBandChange = (band) => {
    if(ringBand == "Yes"){
        band = "No";
        handleSideSettingChange(ringSideSetting);
    } else if(band == "No"){
        band = "Yes";
    }
    
    setHoverFinalRingPrice(null);
    setHoverStylePrice(null);
    setHoveredShankName(null);
    setPriceDifference(null);
    setSideSettingHoverPrice(null);
    setHoveredSideSettingName(null);
    setMatchingBandHoverPrice(null);
    setHoveredMatchingBandName(null);
    preMatchingBandHoverState.current = null;

    applyFilterWithLoader(setLoader, () => {
        setRingBand(band);
        
        if (["WIDE-PLAIN", "TWISTED"].includes(ringShank)) {
            setRingShank(ringSideSetting);
            
            let priceShankSet = calculateFinalRingPrice(
                metal, 
                ringHead, 
                ringSideSetting, 
                ringSideSetting, 
                band,
                bandWidth, 
                styleShape, 
                engraving, 
                parent  // ✅ ADD THIS
            );
            setStylePrice(priceShankSet.breakdown.ringShankPrice);  // ✅ Remove CurrencyRate
        }
        
        let price = calculateFinalRingPrice(
            metal, 
            ringHead, 
            ringShank, 
            ringSideSetting, 
            band,
            bandWidth, 
            styleShape, 
            engraving, 
            parent  // ✅ ADD THIS
        );
        
        setFinalRingPrice(price.finalPrice);
        if (band === "No") {
            setMatchingBandPrice(0);
        } else {
            setMatchingBandPrice(price.breakdown.matchingBandPrice);  // ✅ Remove CurrencyRate
        }
        setSummaryBlink(true);
    });
}


    useEffect(() => {
        const shank_ttl = (stylePrice + ringSideSettingPrice + metalPrice + matchingBandPrice + engravingPrice);
        setShankTotal(shank_ttl);
    }, [stylePrice, ringSideSettingPrice, metalPrice, matchingBandPrice, engravingPrice]);

useEffect(() => {
  if (platinum) {
    setMetalPrice(getMetalPrice(parent, "Platinum"));
    setMetal("14K");
  } else {
    setMetalPrice(getMetalPrice(parent, metal));
  }
  setStylePrice(getShankPrice(parent, ringShank));
}, [platinum, parent, metal, ringShank]);

    const visibleItems = isMobile
        ? metalItems
        : metalItems.slice(currentIndex, currentIndex + itemsToShow);

    // const visibleItems2 = isMobile
    //     ? apiData.ring.shank
    //     : apiData.ring.shank.slice(currentIndex2, currentIndex2 + itemsToShow);
    
    const visibleItems2 = apiData.ring.shank;

    // Add these handlers
    const handleCaratHover = (m) => {
        const hoveredPrice = calculateFinalRingPrice(
            m,
            ringHead,
            ringShank,
            ringSideSetting,
            ringBand
        ).breakdown.metalPrice;

        setHoveredCarat(m);
        setCaratPriceDifference(hoveredPrice - metalPrice);
    };

    const handleCaratHoverEnd = () => {
        setHoveredCarat(null);
        setCaratPriceDifference(null);
    };

    function formatString(input) {
        return input
            .replace(/-/g, ' ')          // Replace hyphens with spaces
            .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letter of each word
    }
	
	
	const getConfigFromURL = () => {
	  const params = new URLSearchParams(window.location.search);
	  const encodedConfig = params.get('config');
	  if (!encodedConfig) {
	    try {
	      const stored = localStorage.getItem("ring_configurator_state");
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
	
	useEffect(() => {
    if (config && parent) {  // ✅ Wait for parent to be available
        let price = calculateFinalRingPrice(
            metal, 
            ringHead, 
            config.ringShank, 
            config.ringMatchingBand, 
            config.ringBand,
            bandWidth, 
            styleShape, 
            engraving, 
            parent  // ✅ ADD THIS
        );
        setStylePrice(price.breakdown.ringShankPrice);
        setRingSideSettingPrice(price.breakdown.ringSideSettingPrice);
        setMatchingBandPrice(price.breakdown.matchingBandPrice);
    }
}, [config, parent]);  // ✅ Add parent to dependency array
	
	useEffect(() => {
	  const handleClickOutside = (e) => {
		if (!engravingZoneRef.current) return;

		// If click is outside engraving section → deactivate zoom
		if (!engravingZoneRef.current.contains(e.target)) {
		  deactivateEngravingZoom();
		}
	  };

	  document.addEventListener("mousedown", handleClickOutside);

	  return () => {
		document.removeEventListener("mousedown", handleClickOutside);
	  };
	}, []);
const metalpricediff=priceMetalDifference;
// Filter available purities
const allPurities = ["9K", "10K", "14K", "18K"];
const availablePurities = filterAvailableOptions(
  allPurities, 
  parent, 
  'metalPurities'
);

// Filter available shank styles
const availableShankStyles = filterAvailableOptions(
  [...apiData.ring.shank, ...DIAMONDWISE_DESIGNS.map((design) => design.shankId)],
  parent,
  'shankStyles'
);

// Filter matching band styles
const availableMatchingBands = filterAvailableOptions(
  apiData.ring.sideSetting,
  parent,
  'matchingBandStyles'
);
    return (
        <div className="mobile-overflow-scroll">
            <div className="bg-white p-5 rounded-lg shadow mb-2.5">
                <p className="font-semibold text-lg mb-2.5 font-heading">
                    STYLE{" "}
                    <span className="font-6b6 font-normal ml-2">
                        {/* Display hovered shank name if hovering, otherwise actual ringShank */}
                        {(() => {
                            const displayId = hoveredShankName !== null ? hoveredShankName : ringShank;
                            const dw = DIAMONDWISE_DESIGNS.find(d => d.shankId === displayId);
                            return dw ? dw.shankLabel : displayId;
                        })()}

                        {/* Display price difference during hover */}
                        {(priceDifference !== null && priceDifference !== 0) && (
                            priceDifference > 0
                                ? ` (+${priceDifference})`
                                : ` (${priceDifference})`
                        )}

                        {/* Display actual price when not hovering */}
                        {(priceDifference === null && ringShank.toLowerCase() !== "plain") && ` (+${stylePrice})`}
                    </span>
                    {/* Display actual price */}
                    <span className="float-right font-6b6 font-6b6-700">
                        {`${CurrencySign}${ shankTotal - matchingBandPrice}`} 
                    </span>
                </p>
<div className="diamond-shape-section flex flex-nowrap gap-[15px] mt-4 style-block style-scroll-x">
    {availableShankStyles.map((style, i) => {
        // DiamondWise designs — use their dedicated image and label
        const dwDesign = DIAMONDWISE_DESIGNS.find(d => d.shankId === style);
        if (dwDesign) {
            return (
                <button
                    key={style}
                    className={`style-square-btn flex--center mr-0-important 
                        ${ringShank === style ? "active-border" : ""} 
                        ${i === availableShankStyles.length - 1 ? "last-shape-btn" : ""}`}
                    onClick={() => { handleShankChange(style); }}
                    onMouseEnter={() => handleShankHover(style)}
                    onMouseLeave={handleShankHoverEnd}
                >
                    <img
                        className="absolute"
                        src={dwDesign.shankImage || dwDesign.image}
                        alt={dwDesign.shankLabel}
                        width={50}
                        height={50}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                    />
                </button>
            );
        }

        const allowedMatchingBandStyles = ["PLAIN", "CATHEDRAL", "KNIFE-EDGE", "SPLIT", "CHANNEL", "PLATE-PRONG", "FRENCH-PAVE", "PAVE-STONES", "8-STONES", "MULTI-ROW", "TWISTED-2", "FLUTED", "BRAIDED", "CATHEDRAL-SIDE-STONE"];
        const isDisabled =
            ringBand === "Yes"
                ? !allowedMatchingBandStyles.includes(style)
                : false;

        return (
            <button
                key={style}
                className={`style-square-btn flex--center mr-0-important 
                    ${ringShank === style ? "active-border" : ""} 
                    ${i === availableShankStyles.length - 1 ? "last-shape-btn" : ""}`}
                onClick={() => { handleShankChange(style); }}
                onMouseEnter={() => handleShankHover(style)}
                onMouseLeave={handleShankHoverEnd}
                disabled={isDisabled}
            >
                <img
                    className="absolute"
                    src={`/images/${style.toLowerCase().replace(" ", "-")}.webp`}
                    alt={style}
                    width={50}
                    height={50}
                />
            </button>
        );
    })}
</div>

                <h2 className="font-heading text-lg mb-2.5 mt-[30px] flex items-center justify-between relative">
                    <span className="flex items-center font-heading">
                        METAL
                        <span className="mx-[10px] popup-btn">
                            <img src="/images/info-icon.svg" alt="Info" />
                            <span className="popup-info font-semibold -mt-10">
                                The same metal settings will be used for the ring head
                            </span>
                        </span>
                        <span className="text-sm font-normal font-6b6">
    {hoveredMetalItem
        ? hoveredMetalItem.alt
        : matchedColor?.alt || ""}
    {(() => {
        const diff = hoveredMetalItem ? priceMetalDifference : persistedMetalDiff;
        if (!diff || diff === 0) return null;
        return diff > 0 ? ` (+${Math.round(diff)})` : ` (${Math.round(diff)})`;
    })()}
</span>
                    </span>

                </h2>

<div className="diamond-shape-section flex items-center gap-2 style-block style-scroll-x">
    {metalItems.map((item, i) => (
        <button
            className="metal-btn style-round-btn"
            key={i}
            onClick={() => handleColorChange(item.hex, item.src)}
            onMouseEnter={() => handleMetalHover(item)}
            onMouseLeave={handleMetalHoverEnd}
            style={{
                border: item.hex === ringColor ? "1.5px solid black" : "",
            }}
        >
            <img
                src={item.src}
                width={"auto"}
                className="max-w-full h-auto"
                alt={item.alt}
            />
        </button>
    ))}
</div>

                  {!platinum && (
                    <>
                        <div className="font-sub-heading mt-[30px] mb-2.5">
            <span className="text-bold text-[16px]">Purity</span>
            <span className="font-normal font-6b6 mx-2">
                {hoveredPurity !== null ? hoveredPurity : metal}
                {(() => {
                    const diff = hoveredPurity !== null ? purityPriceDifference : persistedPurityDiff;
                    if (!diff || diff === 0) return null;
                    return diff > 0 ? ` (+${Math.round(diff)})` : ` (${Math.round(diff)})`;
                })()}
            </span>
        </div>

						<div className="diamond-shape-section flex gap-3 style-block">
          {availablePurities.map((purity) => (
            <button
              key={purity}
              onClick={() => handleMetal(purity)}
              onMouseEnter={() => handlePurityHover(purity)}
              onMouseLeave={handlePurityHoverEnd}
              className={`purity-square-btn ${metal === purity ? "active" : ""}`}
            >
              {purity}
            </button>
          ))}
						</div>
                    </>
                )}

                {availableMatchingBands.length > 0 && (
                  <>
                    <p className="font-sub-heading mt-[30px] mb-2.5 flex justify-between">
                      <p className="font-sub-heading flex items-center">
                        Matching Band
                        <span className="mx-[10px] cursor-pointer">
                          <img src={ringBand ==="Yes" ? "/images/toggle-black.svg" : "/images/toggle-grey.svg"}
                            alt="Toggle"
                            onClick={() => handleBandChange(ringBand)}
                          />
                        </span>
                        {ringBand ==="No" && 
                          <span className="font-normal font-6b6">
                            none
                          </span>
                        }
                        {ringBand ==="Yes" && <span className="font-6b6 font-normal">
                          {hoveredSideSettingName !== null
                            ? hoveredSideSettingName
                            : ringMatchingBand}
                        </span>}
                      </p>
                      {ringBand ==="Yes" && <span className="font-normal font-6b6 left-0">
                        {CurrencySign}{matchingBandPrice}
                      </span>}
                    </p>
                    <div className="diamond-shape-section flex space-x-2 style-block">
                      {availableMatchingBands.map((setting) => (
                        <button
                          key={setting}
                          className={`style-square-btn ${ringBand ==="Yes" && ringMatchingBand === setting ? "active-border" : ""} ${ringBand !="Yes" ? "opacity-30 !cursor-default" : ""} flex--center`}
                          onClick={ringBand ==="Yes" ? () => handleSideSettingChange(setting): null}
                          onMouseLeave={ringBand ==="Yes" ? () => handleSideSettingHoverEnd(): null}
                          onMouseEnter={ringBand ==="Yes" ? () => handleSideSettingHover(setting): null}
                        >
                          <img
                            className="absolute"
                            src={`/images/${setting.toLowerCase().replace('-', '')}-band.webp`}
                            alt={setting.charAt(0).toUpperCase() + setting.slice(1)}
                            width={50}
                            height={50}
                          />
                        </button>
                      ))}
                    </div>
                  </>
                )}
                 <OtherSection />
            </div>

            <div ref={engravingZoneRef} className="bg-white p-5 mb-2.5 rounded-lg shadow">
                <p className="font-heading mb-4">ADD ENGRAVING
                   <span className="float-right font-6b6 font-6b6-700">{CurrencySign}0</span>
                </p>
				
				<input
				  ref={engarvingInputRef}
				  type="text"
				  value={engraving}
				  onChange={handleEngraving}
				  onFocus={activateEngravingZoom}
				  onBlur={(e) => {
					if (e.relatedTarget) return;
					deactivateEngravingZoom();
				  }}
				  className="engraving-input"
				  placeholder="Type here"
				  style={{
					fontFamily: "'Segoe UI Symbol', 'Arial Unicode MS', Arial, sans-serif",
					fontWeight: 'normal'
				  }}
				/>

				
                <div className="text-end text-[#B0B0B0] font-normal text-[11px]">
                    {getAdjustedLength(engraving)}/15
                </div>
                <div className="font-sub-heading mt-[10px] mb-5">Select a font</div>
                <div className="Select-font-icon flex mb-3 font-select-btns">
                    {fonts.map((f) => (
                        <button
                            style={{
                                border:
                                    engravingFont === f.name ? "1px solid black" : "1px solid #D3D3D3",
                            }}
                            key={f.alt}
							tabIndex={0}
                            onClick={() => handleEngravingFont(f.name)}
                            className={`border font-select-btn`}
                        >
                            <img src={f.src} alt={f.alt} />
                        </button>
                    ))}
                </div>
                <div className="font-sub-heading mt-[30px] mb-5">
                    Insert symbols
                </div>
                <div className="grid grid-cols-8 gap-x-[12px] gap-y-2 items-center">
                    {symbs.map((sym, index) => (
                        <button
                            key={index}
							tabIndex={0}
                            style={{
                                border: sym === symbol ? "1px solid black" : "", fontFamily: "'Segoe UI Symbol', 'Arial Unicode MS'",
                                fontWeight: 'normal'
                            }}
                            // className="symbol-btn"
                            className={`symbol-btn ${index < 5 ? "symbol-25" : ""}`}
                            onClick={() => handleSymbol(sym)}
                        >
                            <span style={{ color: "black" }}> {sym}</span>
                        </button>
                    ))}
                </div>
            </div>
           
            {/* {<button className="next-select-button" onClick={() => setSelectedTab("head")}> <img src="/images/active-head.svg" alt="Icon" width="17" /> SELECT HEAD <img src="/images/down-arrow-11.svg" alt="next" width="12" className="rotate-minus-90" /></button>} */}
        </div>
    );
}

export default ShankSection;
