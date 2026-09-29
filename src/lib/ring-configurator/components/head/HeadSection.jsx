import React, { useContext, useEffect, useRef, useState } from "react";
import apiData from '../../data/api-data.json';
import initialPrice from '../../data/data.json';
import { applyFilterWithLoader } from "../../utility/applyFilterWithLoader";
import { RingContext } from "../../contexts/RingContext";
import { LoaderContext } from "../../contexts/LoaderContext";
import { calculateFinalRingPrice } from "../../utility/calculateFInalRingDiamondPrice"; // Ensure this is your original calculateFinalRingPrice
import { SectionContext } from "../../contexts/SectionContext";
import { DiamondContext } from "../../contexts/DiamondContext";
import { Base64 } from 'js-base64';
import { ShareContext } from "../../contexts/ShareContext";
import { DIAMONDWISE_DESIGNS } from '../../data/diamondwiseDesigns';
import {
  getCurrencyRate,
  getCurrencySign,
} from "../../utility/Parentconfig";
import { getHeadPrice, filterAvailableOptions } from "../../utility/storePriceHelper";

const metalItems = apiData.ring.color;

function HeadSection() {

    const [currentIndex, setCurrentIndex] = useState(0);
    
    // ═══════════════════════════════════════════════════════════
    // CONTEXTS - Get parent and all needed values
    // ═══════════════════════════════════════════════════════════
    const { parent, setParent } = useContext(ShareContext);
    const CurrencyRate = getCurrencyRate(parent);
    const CurrencySign = getCurrencySign(parent);
    
    const { setSelectedTab, setSummaryBlink, platinum, setPlatinum } = useContext(SectionContext);
    
    const { 
        setHeadColor, headColor, ringHead, setRingHead, metal, ringShank, 
        ringSideSetting, ringBand, finalRingPrice, setFinalRingPrice, 
        ringColor, isEnabled, setIsEnabled,
        bandWidth, styleShape, engraving  // ✅ ADD THESE - they were missing!
    } = useContext(RingContext);
    
    const { setLoader } = useContext(LoaderContext);
    
    const { 
        setHeadTotal,
        headStyle, setHeadstyle,
        // haloStyle, setHaloStyle,
        threestone, setThreestone,
        headPrice, setHeadPrice,
        shapeList, setShapeList
    } = useContext(SectionContext);
    const { setShape, shape } = useContext(DiamondContext);
    const isMobile = window.innerWidth <= 768;

    const itemsToShow = 5;
    
    // ═══════════════════════════════════════════════════════════
    // FILTER AVAILABLE OPTIONS
    // ═══════════════════════════════════════════════════════════
    const availableHeadStyles = filterAvailableOptions(
        [
            "plain", "bezel", "hidden-halo", "single-halo", "double-halo", "three-stone",
            ...DIAMONDWISE_DESIGNS.map((design) => design.headId),
        ],
        parent,
        'headStyles'
    );

    // ═══════════════════════════════════════════════════════════
    // STATE & REFS
    // ═══════════════════════════════════════════════════════════
    const preHeadHoverState = useRef(null);
    const preSubHeadHoverState = useRef(null);

    const [hoverHeadPrice, setHoverHeadPrice] = useState(null);
    const [hoveredHeadStyleName, setHoveredHeadStyleName] = useState(null);
    const [hoveredHaloStyleName, setHoveredHaloStyleName] = useState(null);
    const [hoveredThreestoneName, setHoveredThreestoneName] = useState(null);
    const [hoveredHeadPriceDifference, setHoveredHeadPriceDifference] = useState(null);
    const [hoveredHeadColorItem, setHoveredHeadColorItem] = useState(null);

    // ═══════════════════════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════════
    // UTILITY FUNCTIONS
    // ═══════════════════════════════════════════════════════════
    const formatDisplayName = (name) => {
        if (!name) return "";
        return name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const handleHeadColorChange = (color) => {
        applyFilterWithLoader(setLoader, () => {
            setHeadColor(color);
        });
    };

    const matchedColor = metalItems.find(
        (color) => color.hex.toLowerCase() === headColor.toLowerCase()
    );


    // ring color
    const readableColorObj = metalItems.find(color =>
        color.hex.toLowerCase().trim() === (ringColor || "").toLowerCase().trim()
    );

    // ═══════════════════════════════════════════════════════════
    // MAIN HEAD HOVER LOGIC - CORRECTED
    // ═══════════════════════════════════════════════════════════
    const handleHeadHover = (hoveredStyle) => {
        if (!preHeadHoverState.current) {
            preHeadHoverState.current = {
                currentHeadStyle: headStyle,
                currentRingHead: ringHead,
                currentThreestone: threestone,
                currentShape: shape,
                currentHeadPrice: headPrice,
            };
        }

        // Map hovered style to ring head style for calculation
        let tempRingHeadStyleForCalc = "";

        if (hoveredStyle === "plain") {
            tempRingHeadStyleForCalc = "4-PRONG"; // Assuming "4-PRONG" is default for plain
        } else if (hoveredStyle === "halo") {
            tempRingHeadStyleForCalc = "HIDDEN-HALO"; // Default halo sub-style for hover
        } else if (hoveredStyle === "bezel") {
            tempRingHeadStyleForCalc = "BEZEL";
        } else if (hoveredStyle === "three-stone") {
            tempRingHeadStyleForCalc = "OVAL"; // Default three-stone sub-style for hover
        }else if(hoveredStyle === "single-halo"){
            tempRingHeadStyleForCalc =  'SINGLE-HALO'
        }else if(hoveredStyle === "double-halo"){
            tempRingHeadStyleForCalc =  'DOUBLE-HALO'
        }else if(hoveredStyle === "hidden-halo"){
            tempRingHeadStyleForCalc =  'HIDDEN-HALO'
        }

        // Determine the 'ringHeadStyle' value for the currently selected item
        let currentRingHeadStyleForCalc = "";
        if (headStyle === "plain") {
            currentRingHeadStyleForCalc = "4-PRONG";
        } 
        // else if (headStyle === "halo") {
        //     // For active halo, use the actual haloStyle for comparison
        //     currentRingHeadStyleForCalc = haloStyle.toUpperCase().replace('-', ' ');
        // } 
        else if (headStyle === "bezel") {
            currentRingHeadStyleForCalc = "BEZEL";
        } else if (headStyle === "three-stone") {
            // For active three-stone, use the actual threestone for comparison
            currentRingHeadStyleForCalc = threestone.toUpperCase().replace('-', ' ');
        }else if(headStyle === "single-halo"){
            currentRingHeadStyleForCalc =  'SINGLE-HALO'
        }else if(headStyle === "double-halo"){
            currentRingHeadStyleForCalc =  'DOUBLE-HALO'
        }else if(headStyle === "hidden-halo"){
            currentRingHeadStyleForCalc =  'HIDDEN-HALO'
        }

        // Calculate current selected head's price based on actual current state
        const currentHeadResult = calculateFinalRingPrice(
            metal, 
            currentRingHeadStyleForCalc, 
            ringShank, 
            ringSideSetting, 
            ringBand,
            bandWidth, 
            styleShape, 
            engraving, 
            parent
        );
        const currentHeadCalculatedPrice = currentHeadResult.breakdown.ringHeadStylePrice;

        // Calculate temporary price with hovered style
        const hoveredHeadResult = calculateFinalRingPrice(
            metal, 
            tempRingHeadStyleForCalc, 
            ringShank, 
            ringSideSetting, 
            ringBand,
            bandWidth, 
            styleShape, 
            engraving, 
            parent
        );
        const hoveredHeadCalculatedPrice = hoveredHeadResult.breakdown.ringHeadStylePrice;


        setHoveredHeadPriceDifference(hoveredHeadCalculatedPrice - currentHeadCalculatedPrice);
        setHoverHeadPrice(hoveredHeadCalculatedPrice);
        setHoveredHeadStyleName(hoveredStyle);
        setHoveredHaloStyleName(null);
        setHoveredThreestoneName(null);
    };

    const handleHeadHoverEnd = () => {
        if (preHeadHoverState.current) {
            setHoverHeadPrice(null);
            setHoveredHeadStyleName(null);
            setHoveredHeadPriceDifference(null);
            preHeadHoverState.current = null;
        }
    };

    // ═══════════════════════════════════════════════════════════
    // MAIN HEAD CHANGE LOGIC - CORRECTED
    // ═══════════════════════════════════════════════════════════
    const handleHeadChange = (newHeadStyle) => {
        setHoverHeadPrice(null);
        setHoveredHeadStyleName(null);
        setHoveredHaloStyleName(null);
        setHoveredThreestoneName(null);
        setHoveredHeadPriceDifference(null);
        preHeadHoverState.current = null;
        preSubHeadHoverState.current = null;

        applyFilterWithLoader(setLoader, () => {
            let newRingHeadForState = ringHead; // Actual state value
            //let newHaloStyle = "";
            let newThreestone = "";
            let newShape = shape;
            let newShapeList = "";

            // Value to pass to calculateFinalRingPrice
            let ringHeadStyleForCalc = "";

            if (newHeadStyle === "plain") {
                newRingHeadForState = "4-PRONG";
                ringHeadStyleForCalc = "4-PRONG";
                newShape = "round";
            } 
            //else if (newHeadStyle === "halo") {
            //     newRingHeadForState = "HIDDEN-HALO"; // This is the default display for halo
            //     newHaloStyle = "hidden-halo"; // This is the sub-style
            //     ringHeadStyleForCalc = "HIDDEN-HALO"; // Pass this to calc function
            //     newShape = "round";
            // } 
            else if (newHeadStyle === "bezel") {
                newRingHeadForState = "BEZEL";
                ringHeadStyleForCalc = "BEZEL";
                newShape = "round";
            } 
            else if (newHeadStyle === "three-stone") {
                newRingHeadForState = "OVAL"; // This is the default display for three-stone
                newThreestone = "oval"; // This is the sub-style
                ringHeadStyleForCalc = "OVAL"; // Pass this to calc function
                newShape = "oval";
                newShapeList = "oval,round,princess";
            }
            else if(newHeadStyle === "single-halo"){
                newRingHeadForState = "SINGLE-HALO"; 
                //newHaloStyle = "single-halo"; 
                ringHeadStyleForCalc = "SINGLE-HALO"; 
                newShape = "round";
            }else if(newHeadStyle === "double-halo"){
                newRingHeadForState = "DOUBLE-HALO"; 
                //newHaloStyle = "double-halo"; 
                ringHeadStyleForCalc = "DOUBLE-HALO"; 
                newShape = "round";
            }else if(newHeadStyle === "hidden-halo"){
                newRingHeadForState = "HIDDEN-HALO"; 
                //newHaloStyle = "hidden-halo"; 
                ringHeadStyleForCalc = "HIDDEN-HALO"; 
                newShape = "round";
            }

            setHeadstyle(newHeadStyle);
            setRingHead(newRingHeadForState); // Update main ring head state
            // setHaloStyle(newHaloStyle);
            setThreestone(newThreestone);
            setShape(newShape);
            setShapeList(newShapeList);
            
            const price = calculateFinalRingPrice(
                metal, 
                ringHeadStyleForCalc, 
                ringShank, 
                ringSideSetting, 
                ringBand,
                bandWidth, 
                styleShape, 
                engraving, 
                parent
            );
            
            setFinalRingPrice(price.finalPrice);
            setHeadPrice(price.breakdown.ringHeadStylePrice);  // ✅ Remove CurrencyRate multiplication
            setSummaryBlink(true);
        });
    };

    // --- SUB-HEAD HOVER LOGIC (Halo/Three-Stone) ---
    const handleHeadSubHover = (hoveredSub) => {
        if (!preSubHeadHoverState.current) {
            preSubHeadHoverState.current = {
                currentRingHead: ringHead,
                // currentHaloStyle: haloStyle,
                currentThreestone: threestone,
                currentShape: shape,
                currentHeadPrice: headPrice,
            };
        }

        let tempRingHeadStyleForCalc = ""; // Value for calculateFinalRingPrice
        let currentRingHeadStyleForCalc = ""; // Value for calculateFinalRingPrice for current state

        // if (headStyle === "halo") {
        //     tempRingHeadStyleForCalc = hoveredSub.toUpperCase().replace('-', ' '); // e.g., "SINGLE HALO"
        //     currentRingHeadStyleForCalc = haloStyle.toUpperCase().replace('-', ' ');
        //     setHoveredHaloStyleName(hoveredSub);
        //     setHoveredThreestoneName(null);
        // }  
        if (headStyle === "three-stone") {
            // HERE IS THE KEY TEMPORARY MODIFICATION FOR THREE-STONE HOVER
            tempRingHeadStyleForCalc = hoveredSub.toUpperCase().replace('-', ' '); // e.g., "TRAPEZOID"
            currentRingHeadStyleForCalc = threestone.toUpperCase().replace('-', ' '); // e.g., "OVAL"
            setHoveredThreestoneName(hoveredSub);
            setHoveredHaloStyleName(null);
        }

        // Calculate current selected head's price based on actual current state
        const currentHeadResult = calculateFinalRingPrice(
            metal, 
            currentRingHeadStyleForCalc, 
            ringShank, 
            ringSideSetting, 
            ringBand,
            bandWidth, 
            styleShape, 
            engraving, 
            parent
        );
        const currentHeadCalculatedPrice = currentHeadResult.breakdown.ringHeadStylePrice;

        // Calculate temporary price with hovered sub-style
        const hoveredHeadResult = calculateFinalRingPrice(
            metal, 
            tempRingHeadStyleForCalc, 
            ringShank, 
            ringSideSetting, 
            ringBand,
            bandWidth, 
            styleShape, 
            engraving, 
            parent
        );
        const hoveredHeadCalculatedPrice = hoveredHeadResult.breakdown.ringHeadStylePrice;

        setHoveredHeadPriceDifference(hoveredHeadCalculatedPrice - currentHeadCalculatedPrice);
        setHoverHeadPrice(hoveredHeadCalculatedPrice);
    };

    const handleHeadSubHoverEnd = () => {
        if (preSubHeadHoverState.current) {
            setHoverHeadPrice(null);
            setHoveredHaloStyleName(null);
            setHoveredThreestoneName(null);
            setHoveredHeadPriceDifference(null);
            preSubHeadHoverState.current = null;
        }
    };

    const handleHeadChangeSub = (newSubHead, mappedHead = null) => {
        setHoverHeadPrice(null);
        setHoveredHeadStyleName(null);
        setHoveredHaloStyleName(null);
        setHoveredThreestoneName(null);
        setHoveredHeadPriceDifference(null);
        preSubHeadHoverState.current = null;
        preHeadHoverState.current = null;

        applyFilterWithLoader(setLoader, () => {
            let actualRingHeadForState = ringHead; // The value to store in ringHead state
            //let newHaloStyle = "";
            let newThreestone = "";
            let newShape = shape;
			
			const effectiveHeadStyle = mappedHead || headStyle;

            // Value to pass to calculateFinalRingPrice
            let ringHeadStyleForCalc = "";

            if (effectiveHeadStyle === "halo") {
                actualRingHeadForState = newSubHead.toUpperCase() // e.g. "SINGLE HALO"
                //newHaloStyle = newSubHead;
                ringHeadStyleForCalc = newSubHead.toUpperCase();
                newShape = "round";
            } else if (effectiveHeadStyle === "three-stone") {
                actualRingHeadForState = newSubHead.toUpperCase(); // Temporarily set ringHead to the sub-style name for calc
                newThreestone = newSubHead;
                ringHeadStyleForCalc = newSubHead.toUpperCase(); // Pass sub-style directly to calc
                if (newSubHead === "oval") {
                     newShape = "oval";
                } else if (newSubHead === "trapezoid") {
                     newShape = "princess";
                } else if (newSubHead === "half-moon") {
                     newShape = "round";
                } else if (newSubHead === "pear") {
                     newShape = "round";
                } else if (newSubHead === "baguette") {
                     newShape = "round";
                }
            }

            setRingHead(actualRingHeadForState); // Update main ring head state
            // setHaloStyle(newHaloStyle);
            setThreestone(newThreestone);
            setShape(newShape);

            const price = calculateFinalRingPrice(
                metal, 
                ringHeadStyleForCalc, 
                ringShank, 
                ringSideSetting, 
                ringBand,
                bandWidth, 
                styleShape, 
                engraving, 
                parent
            );
            
            setFinalRingPrice(price.finalPrice);
            setHeadPrice(price.breakdown.ringHeadStylePrice);  // ✅ Remove CurrencyRate multiplication
            setSummaryBlink(true);
        });
    };

    // ═══════════════════════════════════════════════════════════
    // BI-METAL SWITCH
    // ═══════════════════════════════════════════════════════════
    const biMetalSwitch = (isEnabled) => {
        setIsEnabled(isEnabled);
        if (!isEnabled)
            handleHeadColorChange(readableColorObj.hex);
    };

    // ═══════════════════════════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════════════════════════
    useEffect(() => {
        setHeadPrice(getHeadPrice(parent, ringHead));
    }, [parent, ringHead]);

    useEffect(() => {
        const head_ttl = headPrice;
        setHeadTotal(head_ttl);
    }, [headPrice]);


    const visibleItems = isMobile
        ? metalItems
        : metalItems.slice(currentIndex, currentIndex + itemsToShow);
		
		
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
	  if (config && config.ringHead) {
		const rawHead = config.ringHead.trim().toLowerCase();

		const threeStoneHeads = ["oval", "trapezoid", "half-moon", "pear", "baguette"];
		const haloHeads = ["hidden-halo", "single-halo", "double-halo"];
		const bezelHeads = ["bezel"];
		const plainHeads = ["4-prong", "4-prongs", "6-prong", "6-prongs"];

            let mappedHead = "";

		if (threeStoneHeads.includes(rawHead)) {
		  mappedHead = "three-stone";
		}else if (haloHeads.includes(rawHead)) {
		  mappedHead = rawHead;
		} else if (bezelHeads.includes(rawHead)) {
		  mappedHead = "bezel";
		} else if (plainHeads.includes(rawHead)) {
		  mappedHead = "plain";
		} else {
		  console.warn(`Unrecognized ring head type in config: "${rawHead}"`);
		  return;
		}

            handleHeadChange(mappedHead);

            if (haloHeads.includes(rawHead)) {
                handleHeadChangeSub(rawHead, mappedHead);
            } else if (threeStoneHeads.includes(rawHead)) {
                handleHeadChangeSub(rawHead, mappedHead);
            }

            if (config.headColor != config.bandColor) {
                setIsEnabled(true);
            }
        }
    }, []);



    // ═══════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════
    return (
        <div className="mobile-overflow-scroll">
            <div className="bg-white p-5 rounded-lg shadow mb-2.5">
                <p className="mb-2.5 font-heading">
                    STYLE
                    <span className="font-6b6 font-normal ml-2">
                        {/* Display hovered name and price difference for main heads */}
                        {(() => {
                            const displayId = hoveredHeadStyleName !== null
                                ? hoveredHeadStyleName
                                : headStyle;
                            const dw = DIAMONDWISE_DESIGNS.find(d => d.headId === displayId);
                            return dw ? dw.headLabel : displayId;
                        })()}

                        {hoveredHeadPriceDifference !== null && (
                            hoveredHeadPriceDifference !== 0
                                ? ` (${hoveredHeadPriceDifference > 0 ? '+' : ''}${Math.round(hoveredHeadPriceDifference)})`
                                : ' '
                        )}
                    </span>
                    <span className="float-right font-6b6-700 font-6b6">
                        {(headPrice != 0 && headPrice && `${CurrencySign}${Math.round(headPrice)}`)}
                    </span>
                </p>
                <div className="diamond-shape-section flex flex-nowrap gap-[15px] space-x-2 mt-4 style-block md:flex-wrap">
                    {availableHeadStyles.map((style) => {
                        const dwDesign = DIAMONDWISE_DESIGNS.find(d => d.headId === style);
                        if (dwDesign) {
                            return (
                                <button
                                    key={style}
                                    className={`style-square-btn mr-0-important ${headStyle === style ? "active-border" : ""} flex--center`}
                                    onClick={() => handleHeadChange(style)}
                                    onMouseLeave={handleHeadHoverEnd}
                                    onMouseEnter={() => handleHeadHover(style)}
                                >
                                    <img
                                        className="absolute"
                                        src={dwDesign.headImage || dwDesign.image}
                                        alt={dwDesign.headLabel}
                                        width={50}
                                        height={50}
                                        style={{ objectFit: 'cover', borderRadius: 4 }}
                                    />
                                </button>
                            );
                        }
                        return (
                            <button
                                key={style}
                                className={`style-square-btn mr-0-important ${headStyle === style ? "active-border" : ""} flex--center`}
                                onClick={() => handleHeadChange(style)}
                                onMouseLeave={handleHeadHoverEnd}
                                onMouseEnter={() => handleHeadHover(style)}
                                disabled={
                                    style === "three-stone" &&
                                    !["PLAIN", "WIDE-PLAIN", "KNIFE-EDGE"].includes(ringShank?.toUpperCase())
                                }
                            >
                                <img
                                    className="absolute"
                                    src={`/images/${style.endsWith('-head') ? style : style + '-head'}.webp`}
                                    alt={style}
                                    width={50}
                                    height={50}
                                />
                            </button>
                        );
                    })}
                </div>
            </div>
            {!platinum &&
            <div className="bg-white p-5 rounded-lg shadow mb-2.5">
                <h2 className="font-heading text-lg mb-2.5 flex items-center justify-between relative">
                <span className="flex items-center">
                    BI-METAL
                    <span className="mx-[10px] cursor-pointer">
                    <img
                        src={isEnabled ? `/images/toggle-black.svg` : `/images/toggle-grey.svg`}
                        alt="Toggle"
                        onClick={()=>biMetalSwitch(!isEnabled)}
                    />
                    </span>
                    <span className="font-normal font-6b6">
                    {hoveredHeadColorItem
                        ? hoveredHeadColorItem.alt
                        : matchedColor?.alt || ""}
                    </span>
                </span>
                <span className="float-right font-6b6 font-6b6-700"></span>
                </h2>

                <div className="diamond-shape-section flex items-center space-x-2 style-block" style={{ opacity: isEnabled ? 1 : 0.5 }}>
                    {/* Conditionally render previous button */}
                    {currentIndex > 0 && (
                        <button className="arrow-btn " onClick={prev} aria-label="Previous">
                            <img
                                src="/images/left-arrow-bg-grey.webp"
                                width={20}
                                height={20}
                                alt="Previous"
                            />
                        </button>
                    )}

                    {visibleItems.map((item, i) => {
                        const globalIndex = currentIndex + i;
                        return ( ((readableColorObj.alt =="Platinum" && item.alt == "Platinum") || (readableColorObj.alt !="Platinum" && item.alt !="Platinum")) &&
                            <button
                            className="metal-btn style-round-btn"
                            key={globalIndex}
                            onClick={() => handleHeadColorChange(item.hex)}
                            onMouseEnter={() => setHoveredHeadColorItem(item)}
                            onMouseLeave={() => setHoveredHeadColorItem(null)}
                            disabled={!isEnabled}
                            style={{
                                border: item.hex === headColor ? "1.5px solid black" : "",
                                cursor: isEnabled ? "pointer" : "not-allowed"
                            }}
                            >
                            <img
                                src={item.src}
                                width={"auto"}
                                className="max-w-full h-auto"
                                alt={item.alt}
                            />
                            </button>
                        );
                        })}


                    {/* Conditionally render next button */}
                    {currentIndex < metalItems.length - itemsToShow && (
                        <button className="arrow-btn" onClick={next} aria-label="Next">
                            <img
                                src="/images/right-arrow-grey-bg.svg"
                                width={20}
                                height={20}
                                alt="Next"
                            />
                        </button>
                    )}
                </div>
            </div>
}
            {/* {<button className="next-select-button" onClick={() => setSelectedTab("stone")}><img src="/images/active-stone.svg" alt="Icon" width="17" /> SELECT STONE <img src="/images/down-arrow-11.svg" alt="next" width="12" className="rotate-minus-90" /></button>} */}
        
        </div>
    );
}

export default HeadSection;
