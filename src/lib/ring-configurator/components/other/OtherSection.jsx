import React, { useContext, useEffect, useMemo, useState, useRef } from "react";
import { RingContext } from "../../contexts/RingContext";
import SizeGuideDetails from "./SizeGuideDetails";
import { SectionContext } from "../../contexts/SectionContext";
import { ShareContext } from "../../contexts/ShareContext";
import { getStorePriceConfig } from "../../priceConfig"; 
import { getCurrencySign, getCurrencyRate, getRingSizeType  } from "../../utility/Parentconfig";

function OtherSection() {
    const [shapeIndex, setShapeIndex] = useState(0);
    const [openDropdown, setOpenDropdown] = useState(null);
    const shapesToShow = 5;
    const { sizeOption, setSizeOption, ringSize, setRingSize } = useContext(RingContext);
    const {setCountryShortName, setSizeMM} = useContext(SectionContext);
    const [longName, setLongName] = useState("US - Mexico - Canada");
    const isMobile = window.innerWidth <= 768;

    const { parent } = useContext(ShareContext);
    const { setOtherTotal } = useContext(SectionContext); // already imported
    const CurrencySign = getCurrencySign(parent);
    const CurrencyRate = getCurrencyRate(parent);

   const defaultRingSizeType = getRingSizeType(parent);

useEffect(() => {
    if (parent) {
        const defaultType = getRingSizeType(parent);
        const selected = ringSize3.find(item => item.label === defaultType);
        setSizeOption(defaultType);
        setLongName(selected?.longName || '');
        setCountryShortName(selected?.shortName || '');
    }
}, [parent]);

    const nextShape = () => {
        setShapeIndex((prev) => {
            const remainingItems = sizeOptions.length - prev;
            if (remainingItems <= shapesToShow) {
                return prev;
            }
            const nextIndex = prev + shapesToShow;
            return nextIndex + shapesToShow > sizeOptions.length
                ? sizeOptions.length - shapesToShow
                : nextIndex;
        });
    };

    const prevShape = () => {
        setShapeIndex((prev) => (prev - shapesToShow >= 0 ? prev - shapesToShow : 0));
    };

    const sizeOptions = [
        "R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8"
    ];

    const ringSize3 = [
        {
            label: "R1", // Corresponds to Screenshot 2025-06-06 102022.png
            value: ["3", "3.5", "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11"],
            mm: ["44.2", "45.5", "46.8", "48.0", "49.3", "50.6", "51.9", "53.1", "54.4", "55.7", "57.0", "58.3", "59.5", "60.8", "62.1", "63.4", "64.6"],
            shortName: "US - MX - CA",
            longName: "US - Mexico - Canada"
        },
        {
            label: "R2", // Corresponds to Screenshot 2025-06-06 102128.png
            value: ["F", "F 1/2", "G", "G 1/2", "H", "H 1/2", "I", "I 1/2", "J", "J 1/2", "K", "K 1/2", "L", "L 1/2", "M", "M 1/2", "N", "N 1/2", "O", "O 1/2", "P", "P 1/2", "Q", "Q 1/2", "R", "R 1/2", "Z 1/2"],
            mm: ["44.2", "44.8", "45.5", "46.1", "46.8", "47.4", "48.0", "48.6", "48.7", "49.3", "50.0", "50.6", "51.2", "51.9", "52.5", "53.1", "53.8", "54.4", "55.1", "55.7", "56.3", "57.0", "57.6", "58.3", "58.9", "59.5", "69.1"],
            shortName: "UK - ZAF - NZ - AU",
            longName: "UK - South Africa - New Zealand - Australia"
        },
        {
    label: "R3",
    value: ["44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "70"],
    mm: ["44.0", "45.0", "46.0", "47.0", "48.0", "49.0", "50.0", "51.0", "52.0", "53.0", "54.0", "55.0", "56.0", "57.0", "58.0", "59.0", "60.0", "61.0", "62.0", "63.0", "64.0", "65.0", "66.0", "67.0", "68.0", "69.0", "70.0"],
    shortName: "EU - FR",
    longName: "Europe - France"
},
        {
            label: "R4", // Corresponds to Screenshot 2025-06-06 102152.png
            value: ["4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27"],
            mm: ["44.2", "45.5", "46.1", "46.8", "48.0", "49.3", "50.6", "51.2", "51.9", "53.1", "54.4", "55.7", "57.0", "58.3", "59.5", "60.8", "65.9", "67.2", "68.5", "69.7", "62.1", "62.7", "63.4", "64.6"],
            shortName: "TR - SA - SG - JP - IL - IN - CN",
            longName: "Turkey - South America - Singapore - Japan - Israel - India - China"
        },
        {
            label: "R5", // Corresponds to Screenshot 2025-06-06 102201.png
            value: ["14", "14 1/4", "14 1/2", "14 3/4", "15", "15 1/4", "15 1/2", "15 3/4", "16", "16 1/4", "16 1/2", "16 3/4", "17", "17 1/4", "17 1/2", "17 3/4", "18", "18 1/4", "18 1/2", "18 3/4", "19", "19 1/4", "19 1/2", "19 3/4", "20", "20 1/2", "22"],
            mm: ["44.2", "44.8", "45.5", "46.1", "46.8", "48.0", "48.7", "49.3", "50.0", "50.6", "51.9", "52.5", "53.1", "54.4", "55.1", "55.7", "56.3", "57.6", "58.3", "58.9", "59.5", "60.2", "60.8", "62.1", "62.7", "64.0", "69.7"],
            shortName: "UA - RU - DE - AS",
            longName: "Ukraine - Russia - Germany - Asia"
        },
        {
            label: "R6", // Corresponds to Screenshot 2025-06-06 102332.png
            value: ["4", "4 5/8", "5 1/4", "5 7/8", "6 1/2", "7 1/8", "7 3/4", "8 3/8", "9", "9 5/8", "10 1/4", "10 7/8", "11 1/2", "12 1/8", "12 3/4", "13 3/8", "14", "14 5/8", "15 1/4", "15 7/8", "16 1/2", "17 1/8", "17 3/4", "18 3/8", "19", "19 5/8", "29"],
            mm: ["44.2", "44.8", "45.5", "46.1", "46.8", "47.4", "48.0", "48.7", "49.3", "50.0", "50.6", "51.2", "51.9", "52.5", "53.1", "53.8", "54.4", "55.1", "55.7", "56.3", "57.0", "57.6", "58.3", "58.9", "59.5", "60.2", "69.7"],
            shortName: "CH - ES - NL - IT",
            longName: "Switzerland - Spain - Netherlands - Italy"
        },
        {
            label: "R7", // Corresponds to Screenshot 2025-06-06 102345.png (Hong Kong)
            value: ["5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"],
            mm: ["43.3", "44.3", "45.5", "46.5", "47.7", "48.7", "49.9", "50.9", "52.1", "53.1", "54.3", "55.6", "56.5", "57.5", "58.7", "59.7", "60.9", "61.9", "63.1", "64.1", "65.3", "66.3", "67.5", "68.5", "69.7", "70.7"],
            shortName: "HK",
            longName: "Hong Kong"
        },
        {
            label: "R8", // Corresponds to Screenshot 2025-06-06 102354.png
            value: ["I", "I 1/2", "J", "J 1/2", "K", "K 1/2", "L", "L 1/2", "M", "M 1/2", "N", "N 1/2", "O", "O 1/2", "P", "P 1/2", "Q", "Q 1/2", "R"],
            mm: ["15.27", "15.39", "15.49", "15.80", "15.90", "16.10", "16.31", "16.51", "16.71", "16.92", "17.12", "17.32", "17.53", "17.73", "17.93", "18.14", "18.34", "18.54", "18.75"],
            shortName: "VIC",
            longName: "Victoria"
        }
    ];

    // The rest of your component logic remains the same as provided in the previous fix.
    // ... (rest of the component code, including useMemo for rSizes and currentMmSize, and useEffect)

    const rSizes = useMemo(() => {
        const selectedSizeOptionData = ringSize3.find(item => item.label === sizeOption);
        return selectedSizeOptionData ? selectedSizeOptionData.value : [];
    }, [sizeOption, ringSize3]);
    

    const currentMmSize = useMemo(() => {
    const selectedSizeOptionData = ringSize3.find(item => item.label === sizeOption);
    if (selectedSizeOptionData) {
        const index = selectedSizeOptionData.value.indexOf(ringSize);
        if (index !== -1) {
            return selectedSizeOptionData.mm[index];
        }
    }
    return null;
}, [sizeOption, ringSize, ringSize3]);

// ✅ NOW ringSizePrice comes after currentMmSize
const ringSizePrice = useMemo(() => {
    console.log("parent:", parent);           // ✅ check if parent is set
    console.log("currentMmSize:", currentMmSize); // ✅ check mm value
    
    const config = getStorePriceConfig(parent);
    console.log("config ringSizePrices:", config?.ringSizePrices); // ✅ check prices
    
    if (!config?.ringSizePrices) return 0;
    const mm = parseFloat(currentMmSize);
    console.log("mm parsed:", mm);            // ✅ check parsed mm
    if (!mm) return 0;
    const prices = config.ringSizePrices;
    if (mm >= 55 && mm < 57) return prices["55-56"] ?? 0;
    if (mm >= 57 && mm < 60) return prices["57-59"] ?? 0;
    if (mm >= 60 && mm < 64) return prices["60-63"] ?? 0;
    if (mm >= 64 && mm < 68) return prices["64-67"] ?? 0;
    if (mm >= 68 && mm <= 70) return prices["68-70"] ?? 0;
    return 0;
}, [parent, currentMmSize]);

// ✅ useEffect also after
useEffect(() => {
    setOtherTotal(ringSizePrice);
}, [ringSizePrice]);

    
    useEffect(() => {
        if (rSizes.length > 0 && !rSizes.includes(ringSize)) {
            setRingSize(rSizes[0]);
        } else if (rSizes.length === 0) {
            setRingSize(null);
        }
    }, [rSizes, ringSize, setRingSize]);

    const handleSizeOption = (option) => {
        const selected = ringSize3.find(item => item.label === option);
        setLongName(selected?.longName || '');
        setCountryShortName(selected?.shortName || '');
        setSizeOption(option);
    }

    const handleRingSize = (size) => {
        setRingSize(size);
        
        setOpenDropdown(null);
    }

    const visibleItems = isMobile
        ? sizeOptions
        : sizeOptions.slice(shapeIndex, shapeIndex + shapesToShow);

    const [showSizeGuide, setShowSizeGuide] = useState(false);

    const handleToggle = () => {
        setShowSizeGuide((prev) => !prev);
    };

    const [hoveredSize, setHoveredSize] = useState(null);
    const [hoveredOption, setHoveredOption] = useState(null);

    useEffect(()=> {
        setSizeMM(currentMmSize);
    }, [currentMmSize]);

    const openPdf = () => {
        window.open("/size-guide/size-guide-R9.pdf", "_blank"); 
    };
const dropdownRef = useRef(null);
useEffect(() => {
    const handleClickOutside = (event) => {
        if (
            dropdownRef.current &&
            !dropdownRef.current.contains(event.target)
        ) {
            setOpenDropdown(null);
        }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
}, []);


    return (
        <>
            {/* <div className="mobile-overflow-scroll"> */}
                <div>
                    {/* <h2 className="font-heading text-lg mb-2.5 flex items-center justify-between relative">
                        <span className="flex items-center font-heading">
                            {showSizeGuide ? "SIZE GUIDE" : "SIZE OPTION"}
                            <span className="mx-[10px] popup-btn">
                                <img src="/images/info-icon.svg" alt="Info" />
                                <span className="popup-info font-semibold">
                                    This setting has no impact on price or appearance of the ring.
                                </span>
                            </span>
                            <span className="text-sm font-normal font-6b6">
                                {hoveredSize || sizeOption}
                            </span>

                        </span>
                        {showSizeGuide ? (
                            <button
                                className="float-right font-6b6 font-6b6-400 close-cross bg-white size-guide-btn"
                                onClick={handleToggle}>✕</button>
                        ) : (
                            <button
                                className="float-right font-6b6 font-6b6-400 size-guide-btn"
                                onClick={handleToggle}>Size Guide</button>
                        )}
                    </h2>
                    <div className="diamond-shape-section size-option-section flex items-center space-x-2 mt-4 style-block">
                        {shapeIndex > 0 && (
                            <button className="arrow-btn" onClick={prevShape} aria-label="Previous">
                                <img
                                    src="/images/left-arrow-bg-grey.png"
                                    width={20}
                                    height={20}
                                    alt="Previous"
                                />
                            </button>
                        )}

                        {visibleItems
                            .map((so, i) => {
                                const globalIndex = shapeIndex + i;
                                return (
                                    <button
                                        className={`shape-btn style-round-btn flex--center ${so === sizeOption ? "active-border" : ""} ${i === visibleItems.length - 1 ? "last-shape-btn" : ""}`}
                                        key={globalIndex}
                                        onClick={() => handleSizeOption(so)}
                                        onMouseEnter={() => {
                                            setHoveredSize(so);
                                            setHoveredOption(so);
                                        }}
                                        onMouseLeave={() => {
                                            setHoveredSize(null);
                                            setHoveredOption(null);
                                        }}
                                    >

                                        {so}
                                    </button>
                                );
                            })}

                        {shapeIndex < sizeOptions.length - shapesToShow && (
                            <button className="arrow-btn" onClick={nextShape} aria-label="Next">
                                <img
                                    src="/images/right-arrow-grey-bg.svg"
                                    width={20}
                                    height={20}
                                    alt="Next"
                                />
                            </button>
                        )}
                    </div> */}
                    
                    {!showSizeGuide && (
                        <div className="ring-size">
                            {/* <div className="size-option-country">
                                <span>{ringSize3.find(item => item.label === (hoveredOption || sizeOption))?.longName || ''}</span>
                            </div> */}
                              <p className="mb-2.5 font-heading mt-[30px] relative flex justify-between">
    <div className="flex items-center">
        <span>RING SIZE</span>
        <span className="mx-[10px] popup-btn">
            <img src="/images/info-icon.svg" alt="Info" />
            <span className="popup-info font-semibold -mt-8">
                This setting has no impact on price or appearance of the ring
            </span>
        </span>
        <span className="font-6b6 font-normal ml-2">{ringSize}</span>
    </div>
    <div className="flex items-center gap-3">
        {ringSizePrice > 0 && (
            <span className="font-6b6-700 font-6b6">
                {CurrencySign}{ringSizePrice}
            </span>
        )}
        <button
            onClick={openPdf}
            className="float-right font-6b6 font-6b6-400 size-guide-btn"
        >
            Size Guide
        </button>
    </div>
</p>
                            <div className="carat-dropdown relative flex space-x-2 style-block"  ref={dropdownRef}>
                                <div
                                    type="button"
                                    onClick={() => setOpenDropdown(openDropdown === "carat" ? null : "carat")}
                                    className="select-div focus:outline-none"
                                >
                                    {ringSize}
                                    <img src="images/dropdown-icon.svg" alt="dropdown-icon" />
                                </div>

                                {openDropdown === "carat" && (
                                    <div className="carat-dropdown-div  absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow show"
 >
                                        <ul>
                                            {rSizes.map((opt) => (
                                                <li
                                                    key={opt}
                                                    onClick={() => handleRingSize(opt)}
                                                    className={`px-3 py-1 hover:bg-gray-100 ${ringSize === opt ? `bg-gray-100` : ``} cursor-pointer text-sm`}
                                                >
                                                    <span>{opt}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {/* <div>{showSizeGuide && <SizeGuideDetails />}</div> */}
                </div>
            {/* </div> */}
        </>
    );
}

export default OtherSection;