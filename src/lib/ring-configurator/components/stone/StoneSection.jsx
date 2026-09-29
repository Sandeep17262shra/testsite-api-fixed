import React, { useContext, useEffect, useMemo, useState } from "react";
import apiData from '../../data/api-data.json';
import { applyFilterWithLoader } from "../../utility/applyFilterWithLoader";
import { DiamondContext } from "../../contexts/DiamondContext";
import data from '../../data/data.json'
import { calculateFinalRingPrice } from "../../utility/calculateFInalRingDiamondPrice"; 
import { LoaderContext } from "../../contexts/LoaderContext";
import { SectionContext } from "../../contexts/SectionContext";
import { RingContext } from "../../contexts/RingContext";
import { Base64 } from 'js-base64';
import { ShareContext } from "../../contexts/ShareContext";
import { getCurrencyRate, hideNaturalOption, getCurrencySign, getFancyPriceFactor } from "../../utility/Parentconfig";
// AFTER
import { formatStoreCurrency, getDiamondPrice, filterAvailableOptions, getColoredDiamondExtraPrice, getGemstoneExtraPrice, getIntensityPrice as getStoreIntensityPrice, getAvailableCaratSizes } from "../../utility/storePriceHelper";

function StoneSection() {
    const shapeItems = [
        "Round",
        "Emerald",
        "Oval",
        "Pear",
        "Asscher",
        "Cushion",
        "Marquise",
        "Princess",
        "Radiant",
        "Heart",
    ];

    const intensity = ["Light", "Fancy", "Intense", "Vivid", "Deep", "Dark"];

    const ALL_FANCY_DIAMONDS = ["Blue", "Green", "Pink", "Purple", "Peach", "Yellow", "Red", "Orange", "Black", "Brown"];
const ALL_GEMSTONES = ["blue-sapphire", "green-emerald", "green-sapphire", "moissanite", "pink-sapphire", "red-ruby", "yellow-sapphire"];

const SPRITE_POSITIONS = {
  Blue: "-6px 7px", Green: "-72px -59px", Pink: "-270px -59px", Purple: "-204px -59px",
  Peach: "-6px -59px", Yellow: "-138px -59px", Red: "-270px 7px", Orange: "-204px 7px",
  Black: "-138px 7px", Brown: "-72px 7px",
  "blue-sapphire": "-6px -125px", "green-emerald": "-270px -125px", "green-sapphire": "-6px -191px",
  moissanite: "-72px -191px", "pink-sapphire": "-204px -125px", "red-ruby": "-138px -125px",
  "yellow-sapphire": "-72px -125px",
};
const SPRITE_BG = { backgroundImage: "url(/images/spritesheet.webp)", backgroundSize: "330px", width: 55, height: 70, backgroundRepeat: "no-repeat" };

const INTENSITY_SPRITE_POSITIONS = {
  Light: "-30px 16px", Fancy: "-137px 16px", Intense: "-243px 16px",
  Vivid: "-352px 16px", Deep: "-460px 16px", Dark: "-567px 16px",
};
const INTENSITY_SPRITE_BG = { backgroundImage: "url(/images/intensity.webp)", backgroundSize: "650px", width: 55, height: 116, backgroundRepeat: "no-repeat" };
    const COLOR_GRADES = apiData.diamond.color;
    const { setStoneTotal,
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
        fancyColorPrice, setFancyColorPrice,
        gemstonePrice, setGemstonePrice,
        intensityPrice, setIntensityPrice,
        setSummaryBlink,
        shapeList, setThreestone, headStyle
    } = useContext(SectionContext);
    const [shapeIndex, setShapeIndex] = useState(0);
    const [fancyIndex, setFancyIndex] = useState(0);
    const shapesToShow = 10;
    const [openDropdown, setOpenDropdown] = useState(null);
    const { setSelectedTab } = useContext(SectionContext);
    const { parent, setParent } = useContext(ShareContext);

    const isMobile = window.innerWidth <= 768;

    // const nextShape = () => {
    //     setShapeIndex((prev) =>
    //         prev + shapesToShow < shapeItems.length ? prev + shapesToShow : prev
    //     );
    // };

    // const prevShape = () => {
    //     setShapeIndex((prev) => (prev - shapesToShow >= 0 ? prev - shapesToShow : 0));
    // };

    // const nextFancy = () => {
    //     setFancyIndex((prev) =>
    //         prev + shapesToShow < fancyDiamonds.length ? prev + shapesToShow : prev
    //     );
    // };

    // const prevFancy = () => {
    //     setFancyIndex((prev) => (prev - shapesToShow >= 0 ? prev - shapesToShow : 0));
    // };


    // caratOptions is computed dynamically below based on store configuration



    const cutOptions = [
        "Good", "Very Good", "Excellent", "Ideal"
    ];

    // clarity dropdown
    const clarityOptions = [
        "SI2", "SI1", "VS2", "VS1", "VVS2", "VVS1", "IF"
    ];

    const colorOptions = [
        "K", "J", "I", "H", "G", "F", "E", "D"
    ];


    const calculateFinalDiamondPrice = (size, type, cut, clarity, priceColor, shape) => {

        let breakdown = {
            naturalAddon: data.diamondPrice,
            cut: 100,
            clarity: 20,
            color: 20,
            shape: 100,
            carat: 0
        }
        let finalPrice = size;
        breakdown.carat = size;
        if (type === "Natural") {
            finalPrice += data.naturalPriceAddon;
            breakdown.naturalAddon += data.naturalPriceAddon;
        }

        if (cut === "Very Good") {
            finalPrice += 200;
            breakdown.cut = 200;
        } else if (cut === "Excellent") {
            finalPrice += 400;
            breakdown.cut = 400;
        } else if (cut === "Ideal") {
            finalPrice += 600;
            breakdown.cut = 600;
        }

        if (clarity === "SI2") {
            finalPrice += 100;
            breakdown.clarity = 100;
        } else if (clarity === "SI1") {
            finalPrice += 120;
            breakdown.clarity = 120;
        } else if (clarity === "VS2") {
            finalPrice += 140;
            breakdown.clarity = 140;
        } else if (clarity === "VS1") {
            finalPrice += 160;
            breakdown.clarity = 160;
        } else if (clarity === "VVS2") {
            finalPrice += 180;
            breakdown.clarity = 180;
        } else if (clarity === "VVS1") {
            finalPrice += 200;
            breakdown.clarity = 200;
        } else if (clarity === "IF") {
            finalPrice += 220;
            breakdown.clarity = 220;
        }

        if (priceColor === "K") {
            finalPrice += 100;
            breakdown.color = 100;
        } else if (priceColor === "J") {
            finalPrice += 120;
            breakdown.color = 120;
        } else if (priceColor === "I") {
            finalPrice += 140;
            breakdown.color = 140;
        } else if (priceColor === "H") {
            finalPrice += 160;
            breakdown.color = 160;
        } else if (priceColor === "G") {
            finalPrice += 180;
            breakdown.color = 180;
        } else if (priceColor === "F") {
            finalPrice += 200;
            breakdown.color = 200;
        } else if (priceColor === "E") {
            finalPrice += 220;
            breakdown.color = 220;
        } else if (priceColor === "D") {
            finalPrice += 240;
            breakdown.color = 240;
        }

        if (shape === "princess") {
            finalPrice += 200;
            breakdown.shape = 200;
        } else if (shape === "cushion") {
            finalPrice += 400;
            breakdown.shape = 400;
        } else if (shape === "oval") {
            finalPrice += 600;
            breakdown.shape = 600;
        } else if (shape === "radiant") {
            finalPrice += 800;
            breakdown.shape = 800;
        } else if (shape === "pear") {
            finalPrice += 1000;
            breakdown.shape = 1000;
        } else if (shape === "emerald") {
            finalPrice += 1200;
            breakdown.shape = 1200;
        } else if (shape === "marquise") {
            finalPrice += 1400;
            breakdown.shape = 1400;
        } else if (shape === "asscher") {
            finalPrice += 1600;
            breakdown.shape = 1600;
        } else if (shape === "heart") {
            finalPrice += 1800;
            breakdown.shape = 1800;
        }

        return { finalPrice: finalPrice, breakdown: breakdown };
    };

    const { setShape, shape, setDiamondSize, setCut, cut, setClarity, clarity, diamondColorClarity, setDiamondColorClarity, diamondType, setDiamondType, initialDiamondPrice, setInitialDiamondPrice, fancyDiamond, setFancyDiamond, gemstone, setGemstone, fancyDiamondIntensity, setFancyDiamondIntensity, colorType, setColorType, selectedQuality, setSelectedQuality , activeTab, setActiveTab} = useContext(DiamondContext);
    const { setLoader } = useContext(LoaderContext);
    const { setRingHead, ringHead , metal, ringShank, ringSideSetting, ringBand , setFinalRingPrice} = useContext(RingContext);

    const availableCaratSizes = useMemo(() => getAvailableCaratSizes(parent, diamondType || "Lab"), [parent, diamondType]);
    const caratOptions = useMemo(() => {
        return availableCaratSizes.map((size) => ({
            size,
            price: getDiamondPrice(parent, size, selectedQuality?.quality || "Standard", diamondType || "Lab", shape) || 600,
        }));
    }, [availableCaratSizes, parent, selectedQuality, diamondType, shape]);

    const getLabelPosition = (wholeNum) => {
        const index = caratOptions.findIndex(item => item.size === parseFloat(wholeNum));
        if (index === -1) return 0;
        return (index / Math.max(1, caratOptions.length - 1)) * 100;
    };

    // Hover states and price differences
    const [hoveredShape, setHoveredShape] = useState(null);
    const [shapePriceDiff, setShapePriceDiff] = useState(null);
    const [hoveredType, setHoveredType] = useState(null);
    const [typePriceDiff, setTypePriceDiff] = useState(null);
    const [hoveredCut, setHoveredCut] = useState(null);
    const [cutPriceDiff, setCutPriceDiff] = useState(null);
    const [hoveredColor, setHoveredColor] = useState(null);
    const [colorPriceDiff, setColorPriceDiff] = useState(null);
    const [hoveredClarity, setHoveredClarity] = useState(null);
    const [clarityPriceDiff, setClarityPriceDiff] = useState(null);
    const [hoveredFancyDiamond, setHoveredFancyDiamond] = useState(null);
    const [fancyDiamondPriceDiff, setFancyDiamondPriceDiff] = useState(null);
    const [hoveredIntensity, setHoveredIntensity] = useState(null);
    const [intensityPriceDiff, setIntensityPriceDiff] = useState(null);

    // Calculate fancy color price (100, 200, 300, ...)


    // Calculate intensity price (20, 40, 60, ...)
    const getIntensityPrice = (intensityValue) => {
        return getStoreIntensityPrice(parent, intensityValue);
    };



    const handleHeadChangeSub = (newShape) => {
    
                let actualRingHeadForState = ringHead; // The value to store in ringHead state
                let newThreestone = ringHead.toLowerCase();
    
                    if (newShape === "oval") {
                         newThreestone = "Oval";
                         actualRingHeadForState = "OVAL";
                    } else if (newShape === "princess") {
                         newThreestone = "trapezoid";
                         actualRingHeadForState = "TRAPEZOID";
                    } else if (newShape === "round") {
                         newThreestone = "half-moon";
                         actualRingHeadForState = "HALF-MOON";
                    } 

    
                setRingHead(actualRingHeadForState); 
                setThreestone(newThreestone);

        };

    const handleShape = (shape) => {
        applyFilterWithLoader(setLoader, () => {
            setShape(shape);
            const newPrice = calculateFinalDiamondPrice(activeDiamondSize, activeDiamondType, activeCut, clarity, activePriceColor, shape);

            if(shapeList.includes(shape) && headStyle == "three-stone"){
                handleHeadChangeSub(shape);
            }

            //setInitialDiamondPrice(newPrice.finalPrice);
            //setShapePrice(newPrice.breakdown.shape);
          //setSummaryBlink(true);
        });
    };

	// Update the handleCarat function
	const handleCarat = (caratObj) => {
	  applyFilterWithLoader(setLoader, () => {
		setActiveDiamondSize(caratObj.size);
		setCaratP(caratObj.price);
		setDiamondCarat(caratObj.size);
		setDiamondSize(caratObj.size);
		
		const newPrice = calculateFinalDiamondPrice(
		  caratObj.price, 
		  activeDiamondType, 
		  activeCut, 
		  clarity, 
		  activePriceColor, 
		  shape
		);
		
		setInitialDiamondPrice(newPrice.finalPrice);
		setSummaryBlink(true);
	  });

	};

    const handleCut = (cut) => {
        applyFilterWithLoader(setLoader, () => {
            setActiveCut(cut);
            setCut(cut);
            const newPrice = calculateFinalDiamondPrice(caratP, activeDiamondType, cut, clarity, activePriceColor, shape);
            setInitialDiamondPrice(newPrice.finalPrice);
            setCutPrice(newPrice.breakdown.cut);
            setSummaryBlink(true);
        });
        setOpenDropdown(null);
    };

    const handleClarity = (clarity) => {
        applyFilterWithLoader(setLoader, () => {
            setClarity(clarity);
            const newPrice = calculateFinalDiamondPrice(caratP, activeDiamondType, activeCut, clarity, activePriceColor, shape);
            setClarityPrice(newPrice.breakdown.clarity);
            setInitialDiamondPrice(newPrice.finalPrice);
            setSummaryBlink(true);
        });
        setOpenDropdown(null);
    };

    const handlePriceColorChange = (values) => {
        setDiamondColorClarity(values);
        const newPrice = calculateFinalDiamondPrice(caratP, activeDiamondType, activeCut, clarity, values, shape);
        setActivePriceColor(newPrice.breakdown.color);
        setInitialDiamondPrice(newPrice.finalPrice);
        setSummaryBlink(true);
        setOpenDropdown(null);
    };

    const handleDiamondType = (type) => {
        if (type === "lab-diamond")
            setDiamondType("Lab");
        else
            setDiamondType("Natural");
        const newPrice = calculateFinalDiamondPrice(caratP, type === "lab-diamond" ? "Lab" : "Natural", activeCut, clarity, activePriceColor, shape);
        setActiveDiamondType(newPrice.breakdown.naturalAddon);
        setInitialDiamondPrice(newPrice.finalPrice);
        setSummaryBlink(true);
    };

    useEffect(() => {
        if (activeTab === "Fancy-Gemstone") {
            setSelectedQuality({ type: "Lab", quality: qualities[0].quality });
        }

        let stone_ttl = shapePrice + caratP + parseInt(clarityPrice) + parseInt(activeDiamondType);
        // Add fancy color and intensity prices if applicable
        if (colorType === "fancycolored") {
            stone_ttl += (fancyColorPrice || 0) + (intensityPrice || 0);
        } 
        else if (colorType === "fancygem") {
            stone_ttl += (gemstonePrice || 0);
        }
        else {
            stone_ttl += (parseInt(cutPrice) || 0) + (activePriceColor || 0);
        }

        //setStoneTotal(stone_ttl);
    }, [shapePrice, caratP, cutPrice, clarityPrice, activePriceColor, activeDiamondType, fancyColorPrice, gemstonePrice, intensityPrice, activeTab]);
    

    const visibleItems = isMobile
        ? apiData.diamond.shape
        : apiData.diamond.shape
            .slice(shapeIndex, shapeIndex + shapesToShow);


    
    // const visibleFancyGemstones = isMobile
    //     ? fancyGemstones
    //     : fancyGemstones
    //         .slice(gemIndex, gemIndex + shapesToShow);

    // Hover handlers
    const handleShapeHover = (shp) => {
        setHoveredShape(shp);
        const newPrice = calculateFinalDiamondPrice(
            activeDiamondSize,
            activeDiamondType,
            activeCut,
            clarity,
            activePriceColor,
            shp
        );
        const diff = newPrice.breakdown.shape - shapePrice;
        setShapePriceDiff(diff);
    };

    const handleShapeHoverEnd = () => {
        setHoveredShape(null);
        setShapePriceDiff(null);
    };

    const handleTypeHover = (type) => {
        setHoveredType(type);
        const hoveredPrice = calculateFinalDiamondPrice(
            caratP,
            type === "lab-diamond" ? "Lab" : "Natural",
            activeCut,
            clarity,
            activePriceColor,
            shape
        ).breakdown.naturalAddon;
        const diff = hoveredPrice - activeDiamondType;
        setTypePriceDiff(diff);
    };

    const handleTypeHoverEnd = () => {
        setHoveredType(null);
        setTypePriceDiff(null);
    };

    const handleCutHover = (cutValue) => {
        setHoveredCut(cutValue);
        const newPrice = calculateFinalDiamondPrice(
            caratP,
            activeDiamondType,
            cutValue,
            clarity,
            activePriceColor,
            shape
        );
        const diff = newPrice.breakdown.cut - cutPrice;
        setCutPriceDiff(diff);
    };

    const handleCutHoverEnd = () => {
        setHoveredCut(null);
        setCutPriceDiff(null);
    };

    const handleColorHover = (colorValue) => {
        setHoveredColor(colorValue);
        const newPrice = calculateFinalDiamondPrice(
            caratP,
            activeDiamondType,
            activeCut,
            clarity,
            colorValue,
            shape
        );
        const diff = newPrice.breakdown.color - activePriceColor;
        setColorPriceDiff(diff);
    };

    const handleColorHoverEnd = () => {
        setHoveredColor(null);
        setColorPriceDiff(null);
    };

    const handleClarityHover = (clarityValue) => {
        setHoveredClarity(clarityValue);
        const newPrice = calculateFinalDiamondPrice(
            caratP,
            activeDiamondType,
            activeCut,
            clarityValue,
            activePriceColor,
            shape
        );
        const diff = newPrice.breakdown.clarity - clarityPrice;
        setClarityPriceDiff(diff);
    };

    const handleClarityHoverEnd = () => {
        setHoveredClarity(null);
        setClarityPriceDiff(null);
    };
const handleFancyDiamond = (value) => {
    setFancyDiamond(value);
    setSummaryBlink(true);
};

const handleGemstone = (value) => {
    setGemstone(value);
    setSummaryBlink(true);
};

    const handleFancyColorChange = (value) => {
        setFancyDiamondIntensity(value);
        const price = getIntensityPrice(value);
        setIntensityPrice(price);
        setSummaryBlink(true);
        setOpenDropdown(null);
    }



    const handleIntensityHover = (intensityValue) => {
        setHoveredIntensity(intensityValue);

        // Calculate difference between hovered price and current selection's price
        const hoveredPrice = getIntensityPrice(intensityValue);
        const diff = hoveredPrice - (intensityPrice || 0);
        setIntensityPriceDiff(diff);
    };

    const handleIntensityHoverEnd = () => {
        setHoveredIntensity(null);
        setIntensityPriceDiff(null);
    };
	
	const getConfigFromURL = () => {
	  const params = new URLSearchParams(window.location.search);
	  const encodedConfig = params.get('config');
	  if (!encodedConfig) {
	    try {
	      const stored = sessionStorage.getItem("ring_configurator_state");
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
	  if (config) {
         handleShape(config.shape);
		 const matchCarat = caratOptions.find(opt => opt.size === config.diamondSize) || caratOptions[0];
         if (matchCarat) handleCarat(matchCarat);
		 setActiveTab(config.activeTab);
		 setSelectedQuality(config.selectedQuality);
		 setFancyDiamond(config.fancyDiamond);
		 setGemstone(config.gemstone);
         if (config.fancyDiamondIntensity) {
           setFancyDiamondIntensity(config.fancyDiamondIntensity);
         }
         const initIntPrice = config.intensityPrice != null
           ? Number(config.intensityPrice)
           : getIntensityPrice(config.fancyDiamondIntensity || "Light");
         setIntensityPrice(initIntPrice);
	  }
	}, []);

    const [hoveredGemstone, setHoveredGemstone] = useState(null);
    const [gemstonePriceDiff, setGemstonePriceDiff] = useState(null);

const CurrencyRate=getCurrencyRate(parent);
const CurrencySign=getCurrencySign(parent);
const fancyPriceFactor = getFancyPriceFactor(parent);
const naturaldiamondoption=hideNaturalOption(parent);
const availableFancyDiamonds = filterAvailableOptions(ALL_FANCY_DIAMONDS, parent, 'coloredDiamonds');
const availableGemstones     = filterAvailableOptions(ALL_GEMSTONES,      parent, 'gemstones');

const visibleFancyDiamonds = isMobile
    ? availableFancyDiamonds
    : availableFancyDiamonds.slice(fancyIndex, fancyIndex + shapesToShow);
const handleFancyDiamondHover = (fancyValue) => {
    setHoveredFancyDiamond(fancyValue);
    const hoveredExtra = getColoredDiamondExtraPrice(parent, fancyValue);
    const currentExtra = fancyDiamond ? getColoredDiamondExtraPrice(parent, fancyDiamond) : 0;
    setFancyDiamondPriceDiff(hoveredExtra - currentExtra);
};

const handleFancyDiamondHoverEnd = () => {
    setHoveredFancyDiamond(null);
    setFancyDiamondPriceDiff(null);
};

const handleGemstoneHover = (stoneValue) => {
    setHoveredGemstone(stoneValue);
    const hoveredExtra = getGemstoneExtraPrice(parent, stoneValue);
    const currentExtra = gemstone ? getGemstoneExtraPrice(parent, gemstone) : 0;
    setGemstonePriceDiff(hoveredExtra - currentExtra);
};

const handleGemstoneHoverEnd = () => {
    setHoveredGemstone(null);
    setGemstonePriceDiff(null);
};
const labPriceTable = {
    1:  { Standard: 600,  Premium: 750,  "High-End": 1100 },
    2:  { Standard: 1500, Premium: 1700, "High-End": 2400 },
    3:  { Standard: 2500, Premium: 2800, "High-End": 4000 },
    4:  { Standard: 3600, Premium: 4000, "High-End": 5800 },
    5:  { Standard: 4700, Premium: 5200, "High-End": 7800 },
    6:  { Standard: 5700, Premium: 6500, "High-End": 9800 },
    7:  { Standard: 7200, Premium: 8000, "High-End": 12500 },
    8:  { Standard: 8500, Premium: 9600, "High-End": 15500 },
    9:  { Standard: 9200, Premium: 11500,"High-End": 18500 },
    10: { Standard: 11800,Premium: 13500,"High-End": 22000 },
};

const naturalPriceTable = {
    1:  { Standard: 900,  Premium: 1200,  "High-End": 1800 },
    2:  { Standard: 2400, Premium: 2900,  "High-End": 4200 },
    3:  { Standard: 4000, Premium: 4800,  "High-End": 7000 },
    4:  { Standard: 5800, Premium: 7000,  "High-End": 10500 },
    5:  { Standard: 7800, Premium: 9200,  "High-End": 14000 },
    6:  { Standard: 8800, Premium: 9500, "High-End": 16000 },
    7:  { Standard: 10500,Premium: 11000, "High-End": 18000 },
    8:  { Standard: 11500,Premium: 12000, "High-End": 19000 },
    9:  { Standard: 12500,Premium: 14000, "High-End": 25000 },
    10: { Standard: 14000,Premium: 17000, "High-End": 32000 },
};;
const recalculationPrice = (diamondCarat, quality, type = "Lab") => {
  return getDiamondPrice(parent, diamondCarat, quality, type);
};

// Replace the hardcoded qualities array with:
const availableQualityLevels = filterAvailableOptions(
  ["Standard", "Premium", "High-End"],
  parent,
  'qualityLevels'
);

const qualities = availableQualityLevels.map(q => ({ quality: q, Natural: 0, Lab: 0 }));
	
const recalculatedQualities = qualities.map((q) => {
  const labBase   = Math.round(recalculationPrice(diamondCarat, q.quality, "Lab"))   || 0;
  const natBase   = Math.round(recalculationPrice(diamondCarat, q.quality, "Natural")) || 0;

  let labExtra = 0;
  let natExtra = 0;

  if (activeTab === "Fancy Colored" && fancyDiamond) {
    labExtra = getColoredDiamondExtraPrice(parent, fancyDiamond);
    natExtra = getColoredDiamondExtraPrice(parent, fancyDiamond);
  }

  return {
    quality: q.quality,
    Natural: natBase + natExtra,
    Lab:     labBase + labExtra,
  };
});

	
useEffect(() => {
  if (qualities.length > 0 && (!selectedQuality || !qualities.find(q => q.quality === selectedQuality.quality))) {
    setSelectedQuality({ type: "Lab", quality: qualities[0].quality });
  }
}, [parent, qualities]);

useEffect(() => {
  const currentQuality = selectedQuality?.quality && qualities.find(q => q.quality === selectedQuality.quality)
    ? selectedQuality
    : (qualities[0] ? { type: "Lab", quality: qualities[0].quality } : selectedQuality);

  if (!currentQuality || !diamondCarat) return;
  try {
    let total;
    if (activeTab === "Fancy-Gemstone") {
      const baseQuality = qualities[0]?.quality || getDefaultQuality(parent);
      const basePrice = recalculationPrice(diamondCarat, baseQuality, currentQuality.type) || 0;
      const extra = gemstone ? getGemstoneExtraPrice(parent, gemstone) : 0;
      total = Math.round(basePrice * fancyPriceFactor) + extra;
    } else if (activeTab === "Fancy Colored") {
      const basePrice = recalculationPrice(diamondCarat, currentQuality.quality, currentQuality.type) || 0;
      const extra = fancyDiamond ? getColoredDiamondExtraPrice(parent, fancyDiamond) : 0;
      const intPrice = getIntensityPrice(fancyDiamondIntensity);
      total = basePrice + extra + intPrice;
    } else {
      total = recalculationPrice(diamondCarat, currentQuality.quality, currentQuality.type) || 0;
    }

    const rounded = Math.round(total);
    setStoneTotal(rounded);
    setCaratP(rounded);
    setSummaryBlink(true);
  } catch (error) {
    console.error("Price calculation error:", error);
  }
}, [selectedQuality, diamondCarat, activeTab, CurrencyRate, fancyDiamond, gemstone, parent, qualities, fancyDiamondIntensity, intensityPrice]);
    

    const formatPrice = (price) => formatStoreCurrency(price, parent);
    // quality related ends
const availableShapes = filterAvailableOptions(
  ["round", "emerald", "oval", "pear", "asscher", "cushion", "marquise", "princess", "radiant", "heart"],
  parent,
  'diamondShapes'
);

const availableDiamondTypes = filterAvailableOptions(
  ["Lab", "Natural"],
  parent,
  'diamondTypes'
);
    return (
        <div className="mobile-overflow-scroll">
            {/* Shape */}
            <div className="bg-white p-5 rounded-lg shadow mb-2.5">
                <p className="mb-2.5 font-heading">
                    SHAPE
                    <span className="font-6b6 font-normal ml-2">
                        {hoveredShape ? hoveredShape : shape}
                        {/*shapePriceDiff !== null && shapePriceDiff !== 0 && (
                            shapePriceDiff > 0
                                ? ` (+${shapePriceDiff})`
                                : ` (${shapePriceDiff})`
                        )*/}
                        {/*shapePriceDiff === null && shape !== "Round" && ` (+${shapePrice - 100})`*/}
                    </span>
                    <span className="float-right font-6b6-700 font-6b6">
  {selectedQuality && (() => {
    let displayPrice;
    if (activeTab === "Fancy-Gemstone") {
      const baseQuality = qualities[0]?.quality;
      const basePrice = recalculatedQualities.find(q => q.quality === baseQuality)?.[selectedQuality.type] || 0;
      const extra = gemstone ? getGemstoneExtraPrice(parent, gemstone) : 0;
      displayPrice = Math.round(basePrice * fancyPriceFactor) + extra;
    } else if (activeTab === "Fancy Colored") {
      // Use selectedQuality so it reflects the currently selected row
      displayPrice = recalculatedQualities.find(q => q.quality === selectedQuality.quality)?.[selectedQuality.type] || 0;
    } else {
      displayPrice = recalculatedQualities.find(q => q.quality === selectedQuality.quality)?.[selectedQuality.type] || 0;
    }
    return `${CurrencySign}${displayPrice}`;
  })()}
</span>
                </p>
                <div className="diamond-shape-section flex flex-nowrap gap-[15px] space-x-2 mt-4 style-block md:flex-wrap">

                    {availableShapes.map((shp, i) => {
                        const globalIndex = shapeIndex + i;
                        const isAllowedHead =
                            ringHead === "4-PRONG" ||
                            ringHead === "6-PRONG" ||
                            ringHead === "BEZEL" ||
                            (shape === shp) || (shapeList.includes(shp));

                        const isBasicHead =
                            ringHead === "4-PRONG" ||
                            ringHead === "6-PRONG" ||
                            ringHead === "BEZEL" ||
                            (shape === shp) || (shapeList.includes(shp));
                        return (
                            <button
                                className={`mr-0-important shape-btn style-square-btn square-btn-center flex--center ${shp === shape ? "active-border" : ""} ${i === visibleItems.length - 1 ? "last-shape-btn" : ""}`}
                                key={globalIndex}
                                onClick={() => handleShape(shp)}
                                onMouseEnter={() => handleShapeHover(shp)}
                                onMouseLeave={handleShapeHoverEnd}
                                disabled={!isAllowedHead}
                                style={{
                                    opacity: isBasicHead ? 1 : 0.5,
                                    filter: isBasicHead ? "none" : "grayscale(100%)",
                                    cursor: isBasicHead ? "pointer" : "not-allowed",
                                }}
                            >
                                <img
                                    className="absolute"
                                    src={`/images/shape-${shp.charAt(0).toUpperCase() + shp.slice(1)}.webp`}
                                    alt={shp}
                                    width={50}
                                    height={50}
                                />
                            </button>
                        );
                    })}

                </div>

                {/* CARAT Slider starts*/}
                <div className="mt-[30px] carat-pricing relative">
                <p className="mb-3 font-heading flex items-center justify-between w-full">
                    <span className="flex items-center">
                    CARAT
                      <span className="mx-[10px] popup-btn">
							<img src="/images/info-icon.svg" alt="Info" />
							<span className="popup-info font-semibold -mt-4">
                              Carat sizes are approximate. Actual values may vary slightly
							</span>
					  </span>
                    </span>
                    <span className="font-6b6-700 font-bold text-black text-sm" style={{ textTransform: 'none' }}>
                    {`${activeDiamondSize} ct`}
                    </span>
                </p>

                <div className="carat-slider w-full py-2 relative">
                    {/* Marks row above track: whole numbers and dots for in-between values */}
                    <div className="gb-carat-slider-ticks" style={{ marginBottom: '8px', marginTop: 0 }}>
                      {caratOptions.map((opt, index) => {
                        const leftPos = caratOptions.length > 1
                          ? `calc(9px + (100% - 18px) * (${index} / ${caratOptions.length - 1}))`
                          : "50%";
                        const sizeNum = Number(opt.size);
                        const isWholeNumber = Number.isInteger(sizeNum) || Math.abs(sizeNum - Math.round(sizeNum)) < 1e-4;

                        return (
                          <div
                            key={opt.size}
                            className="gb-carat-slider-tick-item"
                            style={{
                              left: leftPos,
                              transform: "translateX(-50%)",
                            }}
                            onClick={() => handleCarat(opt)}
                            title={`${opt.size} ct`}
                          >
                            {isWholeNumber ? (
                              <span className="gb-carat-slider-tick">
                                {Math.round(sizeNum)}
                              </span>
                            ) : (
                              <span className="gb-carat-slider-dot" aria-hidden="true" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="gb-carat-slider-track-wrap">
                      {/* Gray full track (background) */}
                      <div className="gb-carat-slider-track-bg" />

                      {/* Black filled progress track */}
                      <div
                        className="gb-carat-slider-track-fill"
                        style={{
                          width: `calc(9px + (100% - 18px) * (${Math.max(0, caratOptions.findIndex((c) => c.size === activeDiamondSize))} / ${caratOptions.length - 1}))`,
                        }}
                      />

                      {/* Slider input — sits over the track */}
                      <input
                        type="range"
                        min={0}
                        max={caratOptions.length - 1}
                        step={1}
                        value={Math.max(0, caratOptions.findIndex((c) => c.size === activeDiamondSize))}
                        onChange={(e) => {
                          const index = parseInt(e.target.value);
                          handleCarat(caratOptions[index]);
                        }}
                        className="carat-slider-range w-full relative z-[2] bg-transparent"
                      />
                    </div>
                </div>
                </div>
                {/* CARAT Slider ends */}

                {/* TYPE section starts */}
                <div className="mt-[30px]">
                    <div>
                        <p className="mb-2.5 font-heading">
                            TYPE
                            <span className="font-6b6 font-normal ml-2">
                            {activeTab === "Fancy Colored" && (hoveredFancyDiamond || fancyDiamond)}
                            {activeTab === "Fancy-Gemstone" && 
                                (hoveredGemstone || gemstone)
                                .replace(/-/g, ' ')
                                .replace(/\b\w/g, char => char.toUpperCase())}
                            </span>
                        </p>
                        <div className="color-style-tab">
                            <span
                                className={`cursor-pointer ${activeTab === "Colorless" ? "active" : ""}`}
                                onClick={() => { setActiveTab("Colorless"); setColorType("colorless") }}
                            >
                                Colorless
                            </span>
                            <span
                                className={`cursor-pointer ${activeTab === "Fancy Colored" ? "active" : ""}`}
                                onClick={() => { setActiveTab("Fancy Colored"); setColorType("fancycolored") }}
                            >
                                Colored
                            </span>
                            <span
                                className={`cursor-pointer ${activeTab === "Fancy-Gemstone" ? "active" : ""}`}
                                onClick={() => { setActiveTab("Fancy-Gemstone"); setColorType("fancygem") }}
                            >
                                Gemstone
                            </span>
                        </div>
                    </div>

                    {activeTab === "Fancy Colored" && (
                        <div>
                            <div className="mb-2.5">
                                {/* <p className="mb-2.5 font-sub-heading">
                                    Color
                                    <span className="font-6b6 font-normal ml-2">
                                        {hoveredFancyDiamond || fancyDiamond}
                                        {fancyDiamondPriceDiff !== null && fancyDiamondPriceDiff !== 0 && (
                                            fancyDiamondPriceDiff > 0
                                                ? ` (+${fancyDiamondPriceDiff})`
                                                : ` (${fancyDiamondPriceDiff})`
                                        )}
                                        {fancyDiamondPriceDiff === null && fancyDiamond && fancyColorPrice > 0 && ` (+${fancyColorPrice})`}
                                    </span>
                                    <span className="float-right font-6b6-700 font-6b6">
                                        {fancyColorPrice > 0 && `$${fancyColorPrice}`}
                                    </span>
                                </p> */}
                                <div className="diamond-shape-section flex flex-nowrap gap-[15px] space-x-2 mt-4 style-block md:flex-wrap">
                                    {/* {fancyIndex > 0 && (
                                        <button className="arrow-btn" onClick={prevFancy} aria-label="Previous">
                                            <img
                                                src="/images/left-arrow-bg-grey.png"
                                                width={20}
                                                height={20}
                                                alt="Previous"
                                            />
                                        </button>
                                    )} */}

                                    {availableFancyDiamonds.map((f, i) => {
                                        const globalIndex = fancyIndex + i;
                                        return (
                                            <button
                                                className={`mr-0-important shape-btn style-round-btn flex--center ${f === fancyDiamond ? "active-border" : ""}`}
                                                key={globalIndex}
                                                onClick={() => handleFancyDiamond(f)}
                                                onMouseEnter={() => handleFancyDiamondHover(f)}
                                                onMouseLeave={handleFancyDiamondHoverEnd}
                                            >
                                                <span
                                                    className="absolute colored"
                                                    style={{ ...SPRITE_BG, backgroundPosition: SPRITE_POSITIONS[f] }}
                                                />
                                            </button>
                                        );
                                    })}

                                    {/* {fancyIndex < fancyDiamonds.length - shapesToShow && (
                                        <button className="arrow-btn" onClick={nextFancy} aria-label="Next">
                                            <img
                                                src="/images/right-arrow-grey-bg.svg"
                                                width={20}
                                                height={20}
                                                alt="Next"
                                            />
                                        </button>
                                    )} */}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "Fancy-Gemstone" && (
                        <div>
                            <div className="mb-2.5">
                                {/* <p className="mb-2.5 font-sub-heading">
                                    Gemstone
                                    <span className="font-6b6 font-normal ml-2">
                                        {hoveredGemstone || gemstone}
                                        {gemstonePriceDiff !== null && gemstonePriceDiff !== 0 && (
                                            gemstonePriceDiff > 0
                                                ? ` (+${gemstonePriceDiff})`
                                                : ` (${gemstonePriceDiff})`
                                        )}
                                        {gemstonePriceDiff === null && gemstone && getGemstonePrice > 0 && ` (+${getGemstonePrice})`}
                                    </span>
                                    <span className="float-right font-6b6-700 font-6b6">
                                        {getGemstonePrice > 0 && `$${getGemstonePrice}`}
                                    </span>
                                </p> */}
                                <div className="diamond-shape-section flex flex-nowrap gap-[15px] space-x-2 mt-4 style-block md:flex-wrap">
                                    {availableGemstones.map((g, i) => (
                                        <button
                                            className={`mr-0-important shape-btn style-round-btn flex--center ${g === gemstone ? "active-border" : ""}`}
                                            key={i}
                                            onClick={() => handleGemstone(g)}
                                            onMouseEnter={() => handleGemstoneHover(g)}
                                            onMouseLeave={handleGemstoneHoverEnd}
                                        >
                                            <span
                                                className="absolute colored"
                                                style={{ ...SPRITE_BG, backgroundPosition: SPRITE_POSITIONS[g] }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quality pricing starts */}
					{activeTab !== "Fancy-Gemstone" && (
                    <div className="quality-pricing">
						<p className="mb-2.5 mt-[30px] font-heading flex items-center relative">
						  QUALITY
						  <span className="mx-[10px] popup-btn">
							<img src="/images/info-icon.svg" alt="Info" />
							<span className="popup-info font-semibold">
                                {activeTab === "Colorless" ? (
                                <>
                                    {availableQualityLevels.includes("Standard") && (
                                    <>
                                        <p className="fw-600">Standard</p>
                                        <div>Colors: K, J, I</div>
                                        <div>Clarity: SI2, SI1, VS2</div>
                                        <div>Cut: Good, Very Good</div>
                                    </>
                                    )}
                                    {availableQualityLevels.includes("Premium") && (
                                    <>
                                        <p className="fw-600 mt-3">Premium</p>
                                        <div>Colors: H, G, F</div>
                                        <div>Clarity: VS1, VVS2, VVS1</div>
                                        <div>Cut: Excellent</div>
                                    </>
                                    )}
                                    {availableQualityLevels.includes("High-End") && (
                                        <>
                                        <p className="fw-600 mt-3">High-End</p>
                                        <div>Colors: E, D</div>
                                        <div>Clarity: IF, FL</div>
                                        <div>Cut: Ideal</div>
                                        </>
                                    )}
                                    </>
                                ) : (
                                    <>
                                    {availableQualityLevels.includes("Standard") && (
                                    <>
                                        <p className="fw-600">Standard</p>
                                        <div>Clarity: SI2, SI1, VS2</div>
                                        <div>Intensity: Light, Fancy</div>
                                    </>
                                    )}
                                    {availableQualityLevels.includes("Premium") && (
                                        <>
                                        <p className="fw-600 mt-3">Premium</p>
                                        <div>Clarity: VS1, VVS2, VVS1</div>
                                        <div>Intensity: Intense, Vivid</div>
                                        </>
                                    )}
                                    {availableQualityLevels.includes("High-End") && (
                                        <>
                                        <p className="fw-600 mt-3">High-End</p>
                                        <div>Clarity: IF, FL</div>
                                        <div>Intensity: Deep, Dark</div>
                                    </>
                                    )}
                                </>
                                )}
                            </span>
						</span>
						</p>

                        <div className="grid grid-cols-[65px_1fr_1fr] mb-2 text-sm font-6b6 text-gray-700">
                            <div></div>
                            {activeTab !== "Fancy-Gemstone" && !naturaldiamondoption && availableDiamondTypes.includes("Natural") && (

  <div className="text-center font-000">Natural</div>
)}
                            <div className="text-center font-000">Lab</div>
                        </div>

                        {recalculatedQualities.map((row) => (
                            <div
                            key={row.quality}
                            className="grid grid-cols-[65px_1fr_1fr] items-center mb-2">
                                <div className="font-000">{row.quality}</div>
                                {activeTab !== "Fancy-Gemstone" &&
  !naturaldiamondoption && availableDiamondTypes.includes("Natural") && (
    <button
      className={`${
        selectedQuality.type === "Natural" && selectedQuality.quality === row.quality
          ? "border-black"
          : "border-gray-300"
      }`}
      onClick={() =>
        setSelectedQuality({ type: "Natural", quality: row.quality })
      }
    >
        {CurrencySign}{(row.Natural)}
    </button>
)}

                                <button
                                className={`${
                                    selectedQuality.type === "Lab" && selectedQuality.quality === row.quality
                                    ? "border-black"
                                    : "border-gray-300"
                                }`}
                                onClick={() => setSelectedQuality({ type: "Lab", quality: row.quality })}
                                >
                                {CurrencySign}{(row.Lab)}
                                </button>
                            </div>
                        ))}
                    </div>
					)}
                    {/* Quality pricing ends */}

                </div>{/* type section ends */}

            </div>
            

            {/* CLARITY dropdown */}
            {/* <div className="bg-white p-5 rounded-lg shadow mb-2.5">
                <p className="mb-2.5 font-heading">
                    CLARITY
                    <span className="font-6b6 font-normal ml-2">
                        {hoveredClarity || clarity}
                        {clarityPriceDiff !== null && clarityPriceDiff !== 0 && (
                            clarityPriceDiff > 0
                                ? ` (+${clarityPriceDiff})`
                                : ` (${clarityPriceDiff})`
                        )}
                        {clarityPriceDiff === null && clarity !== "SI2" && (clarityPrice-100) > 0 && ` (+${clarityPrice - 100})`}
                    </span>
                    <span className="float-right font-6b6-700 font-6b6">{clarityPrice && `$${clarityPrice}`}</span>
                </p>
                <div className="carat-dropdown relative flex space-x-2 style-block">
                    <div
                        type="button"
                        onClick={() => setOpenDropdown(openDropdown === "clarity" ? null : "clarity")}
                        className="select-div focus:outline-none"
                    >
                        {clarity}
                        <img src="images/dropdown-icon.svg" alt="" />
                    </div>

                    {openDropdown === "clarity" && (
                        <div className="carat-dropdown-div absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow show botom-40">
                            <ul>
                                {clarityOptions.map((optclarity, index) => (
                                    <li
                                        key={optclarity}
                                        onClick={() => handleClarity(optclarity)}
                                        onMouseEnter={() => handleClarityHover(optclarity)}
                                        onMouseLeave={handleClarityHoverEnd}
                                        className={`px-3 py-1 hover:bg-gray-100 ${clarity === optclarity ? `bg-gray-100` : ``} cursor-pointer text-sm`}
                                    >
                                        <span>
                                            {optclarity}
                                        </span>
                                        <span className="ml-2 text-gray-500">${100 + index * 20}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div> */}

            {/* TYPE */}
            {/* <div className="bg-white p-5 rounded-lg shadow mb-2.5">
                <p className="mb-2.5 font-heading">
                    TYPE
                    <span className="font-6b6 font-normal ml-2">
                        {hoveredType
                            ? hoveredType === "lab-diamond" ? "Lab" : "Natural"
                            : diamondType === "Lab" ? "Lab" : "Natural"}
                        {typePriceDiff !== null && typePriceDiff !== 0 && (
                            typePriceDiff > 0
                                ? ` (+${typePriceDiff})`
                                : ` (${typePriceDiff})`
                        )}
                        {typePriceDiff === null && diamondType === "Natural" && ` (+${data.naturalPriceAddon})`}
                    </span>
                    <span className="float-right font-6b6-700 font-6b6">
                        {activeDiamondType && `$${activeDiamondType}`}
                    </span>
                </p>
                <div className="lab-natural-diamond flex space-x-2 style-block">
                    {["lab-diamond", "natural-diamond"].map((style) => (
                        <button
                            key={style}
                            className={`style-round-btn ${stoneThreestone === style ? "active-border" : ""} flex--center`}
                            onClick={() => {
                                setStoneThreestone(style);
                                handleDiamondType(style);
                            }}
                            onMouseEnter={() => handleTypeHover(style)}
                            onMouseLeave={handleTypeHoverEnd}
                        >
                            <img
                                className="absolute"
                                src={`/images/${style}.png`}
                                alt={style.charAt(0).toUpperCase() + style.slice(1)}
                                width={50}
                                height={50}
                            />
                        </button>
                    ))}
                </div>
            </div> */}

            {/* <button className="next-select-button sel-other" onClick={() => setSelectedTab("other")}><img src="/images/active-other.svg" alt="Icon" width="17" /> SELECT OTHER <img src="/images/down-arrow-11.svg" alt="next" width="12" className="rotate-minus-90" /></button> */}
        </div>
    );
}

export default StoneSection;
