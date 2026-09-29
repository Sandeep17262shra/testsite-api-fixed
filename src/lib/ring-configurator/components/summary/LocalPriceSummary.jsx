import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { DiamondContext } from "../../contexts/DiamondContext";
import { RingContext } from "../../contexts/RingContext";
import { SectionContext } from "../../contexts/SectionContext";
import { ShareContext } from "../../contexts/ShareContext";
import apiData from "../../data/api-data.json";
import {
  formatStoreCurrency,
  getContactUrl,
  getHomeUrl,
  getSummaryTaxLabel,
} from "../../utility/Parentconfig";
import { getDiamondWiseDesignById, getDiamondWiseDesignByShankId } from "../../data/diamondwiseDesigns";

const toTitleCase = (value = "") =>
  String(value)
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const formatString = (value = "") =>
  String(value)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const capitalize = (value = "") =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "";

function LocalPriceSummary() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [pendingCartPayload, setPendingCartPayload] = useState(null);
  const summaryRef = useRef(null);
  const {
    share,
    setShare,
    shareUrl,
    setShareUrl,
    parent,
    setParent,
  } = useContext(ShareContext);
  const {
    diamondType,
    shape,
    diamondSize,
    fancyDiamond,
    fancyDiamondIntensity,
    gemstone,
    colorType,
    selectedQuality,
    activeTab,
  } = useContext(DiamondContext);
  const {
    metal,
    ringColor,
    engraving,
    ringSize,
    sizeOption,
    headColor,
    ringHead,
    ringShank,
    ringSideSetting,
    ringBand,
    isEnabled,
    bandColor,
    engravingFont,
    glInstance,
    diamondWiseDesignId,
  } = useContext(RingContext);
  const {
    shankTotal,
    headTotal,
    stoneTotal,
    otherTotal,
    countryShortName,
    sizeMM,
    summaryBlink,
    setSummaryBlink,
    intensityPrice,
  } = useContext(SectionContext);

  const total = useMemo(
    () =>
      Number(shankTotal || 0) +
      (ringHead === "NO-HEAD" ? 0 : Number(headTotal || 0) + Number(stoneTotal || 0)) +
      Number(otherTotal || 0),
    [shankTotal, headTotal, stoneTotal, otherTotal, ringHead]
  );
  const summaryTaxLabel = getSummaryTaxLabel(parent);

  const ringColorNames = apiData.ring.color;
  const engravingFonts = apiData.ring.engravingFont;

  const readableColor =
    ringColorNames.find(
      (color) =>
        color.hex.toLowerCase().trim() === String(ringColor || "").toLowerCase().trim()
    )?.alt || ringColor;

  const readableHeadColor =
    ringColorNames.find(
      (color) =>
        color.hex.toLowerCase().trim() === String(headColor || "").toLowerCase().trim()
    )?.alt || headColor;

  const readableBandColor =
    ringColorNames.find(
      (color) =>
        color.hex.toLowerCase().trim() === String(bandColor || "").toLowerCase().trim()
    )?.alt || bandColor;

  const engravingFontAlt =
    engravingFonts.find(
      (font) =>
        font.name.toLowerCase().trim() ===
        String(engravingFont || "").toLowerCase().trim()
    )?.alt || engravingFont;

  const qualityDetails = {
    Colorless: {
      Standard: { color: "K-J-I", clarity: "SI2, SI1, VS2", cut: "Good, Very Good" },
      Premium: { color: "H, G, F", clarity: "VS1, VVS2, VVS1", cut: "Excellent" },
      "High-End": { color: "E, D", clarity: "IF, FL", cut: "Ideal" },
    },
    Fancy: {
      Standard: { clarity: "SI2, SI1, VS2", intensity: "Light, Fancy" },
      Premium: { clarity: "VS1, VVS2, VVS1", intensity: "Intense, Vivid" },
      "High-End": { clarity: "IF, FL", intensity: "Deep, Dark" },
    },
  };

  const selectedDetail =
    selectedQuality &&
    qualityDetails[activeTab === "Colorless" ? "Colorless" : "Fancy"]?.[
      selectedQuality.quality
    ];

  const qualityDetailsText =
    selectedQuality && selectedDetail
      ? activeTab === "Colorless"
        ? `(Color: ${selectedDetail.color} | Clarity: ${selectedDetail.clarity} | Cut: ${selectedDetail.cut})`
        : `(Clarity: ${selectedDetail.clarity} | Intensity: ${selectedDetail.intensity})`
      : "";

  const shankData = {
    Style: formatString(ringShank),
    "Side Setting": ringSideSetting === "PLAIN" ? "None" : formatString(ringSideSetting),
    "Matching Band": ringBand,
    Metal: readableColor === "Platinum" ? readableColor : `${metal} ${readableColor}`,
    ...(engraving !== "" && { Engraving: engraving || "N/A" }),
    ...(engraving !== "" && { "Engraving Font": engravingFontAlt }),
    "Ring Size": `${sizeOption} ${ringSize} (${sizeMM}mm)`,
    size_option: `(${String(countryShortName || "").replaceAll(" -", ",")})`,
  };

  const headData = {
    Style: ringHead === "4-PRONG" ? "Plain" : formatString(ringHead),
    "Bi-metal": isEnabled ? "Yes" : "No",
  };

  const formatValue = (value) =>
    String(value || "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const stoneData = {
    Shape: capitalize(shape) || "N/A",
    Carat: Number.isInteger(Number(diamondSize)) ? `${Number(diamondSize).toFixed(1)}` : `${diamondSize}`,
    ...(colorType === "fancycolored"
      ? {
          "Stone Fancy Color": fancyDiamond,
          Intensity: fancyDiamondIntensity,
        }
      : colorType === "fancygem"
        ? { "Stone Fancy Color": formatValue(gemstone) }
        : {}),
    Type: activeTab?.replace(/^Fancy-/, "") || "N/A",
    Quality: selectedQuality
      ? `${selectedQuality.quality} (${selectedQuality.type})`
      : diamondType || "N/A",
  };

  const resolveStorefrontUrl = () => {
    const resolvedParentUrl =
      parent ||
      window.__parentConfig?.parentUrl ||
      (window.self !== window.top ? document.referrer : "");

    if (!resolvedParentUrl) return null;

    try {
      return new URL(resolvedParentUrl);
    } catch (error) {
      console.warn("Failed to parse storefront URL:", resolvedParentUrl, error);
      return null;
    }
  };

  const toggleSummary = () => {
    setSummaryBlink(false);
    setIsOpen((current) => !current);
  };

  const goToHome = () => {
    const url = getHomeUrl(parent);
    if (url) {
      window.top.location.href = url;
    }
  };

  const handleContactForm = () => {
    const url = getContactUrl(parent);
    if (url) {
      window.open(url, "");
    }
  };

  useEffect(() => {
    if (share) {
      const timer = window.setTimeout(() => {
        setShare(false);
      }, 0);

      setCopied(true);
      const copiedTimer = window.setTimeout(() => {
        setCopied(false);
      }, 2000);

      return () => {
        window.clearTimeout(timer);
        window.clearTimeout(copiedTimer);
      };
    }

    return undefined;
  }, [share, setShare]);

  useEffect(() => {
    if (!pendingCartPayload || !shareUrl) return;

    let previewUrl = shareUrl;

    try {
      const shareConfigUrl = new URL(shareUrl);
      const storefrontUrl = resolveStorefrontUrl();
      const url = storefrontUrl || shareConfigUrl;

      url.search = "";

      const encodedConfig = shareConfigUrl.searchParams.get("config");
      if (encodedConfig) {
        url.searchParams.set("config", encodedConfig);
      }

      url.searchParams.set("preview", "model-only");
      previewUrl = url.toString();
    } catch (error) {
      console.warn("Failed to append preview parameter to share URL", error);
    }

    window.parent.postMessage(
      {
        ...pendingCartPayload,
        ModelPreviewUrl: previewUrl,
      },
      "*"
    );

    setPendingCartPayload(null);
  }, [pendingCartPayload, shareUrl]);

  useEffect(() => {
    const applyConfig = (data) => {
      if (data?.parentUrl) {
        setParent(data.parentUrl);
      }
    };

    if (window.__parentConfig) {
      applyConfig(window.__parentConfig);
    }

    const handler = (event) => {
      if (event.data?.parentUrl) {
        applyConfig(event.data);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [setParent]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        summaryRef.current &&
        !summaryRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const addToCart = () => {
    if (typeof window === "undefined") return;

    setAddedToCart(true);

    const stoneColorLabel = colorType === "fancycolored" || activeTab === "Fancy Colored"
      ? fancyDiamond
      : colorType === "fancygem" || activeTab === "Fancy-Gemstone"
        ? formatValue(gemstone)
        : "";
    const stoneOriginTypeLabel = colorType === "fancygem" || activeTab === "Fancy-Gemstone"
      ? "Gemstone"
      : (selectedQuality?.type || diamondType) === "Natural"
        ? "Natural Diamond"
        : "Lab Diamond";
    const metalPurityLabel = readableColor === "Platinum" ? "Platinum" : `${metal} ${readableColor}`;
    const selectedDiamondWiseDesign = getDiamondWiseDesignById(diamondWiseDesignId);
    const selectedDiamondWiseShank = getDiamondWiseDesignByShankId(ringShank);
    const dwHeadLabel = selectedDiamondWiseDesign?.headLabel?.trim() || "";
    const dwShankLabel = (selectedDiamondWiseShank?.shankLabel || selectedDiamondWiseDesign?.shankLabel || "")?.trim();
    const dwShape = selectedDiamondWiseDesign
      ? (selectedDiamondWiseDesign.defaultShape || "marquise").replace(/\b\w/g, (c) => c.toUpperCase())
      : toTitleCase(shape);
    const dwDesignName = (dwHeadLabel && dwShankLabel && dwHeadLabel.toLowerCase() === dwShankLabel.toLowerCase())
      ? dwHeadLabel
      : (dwHeadLabel && dwShankLabel)
        ? `${dwHeadLabel} head with ${dwShankLabel} shank`
        : (dwHeadLabel || dwShankLabel);
    const title = selectedDiamondWiseDesign
      ? [
          dwDesignName,
          `${Number(diamondSize || 0).toFixed(2)} ct`,
          dwShape,
          stoneColorLabel,
          stoneOriginTypeLabel,
          metalPurityLabel,
          "ring",
        ].filter(Boolean).join(" ")
      : [
          toTitleCase(ringShank),
          ringHead === "NO-HEAD" ? null : ringHead === "4-PRONG" ? "4 Prongs" : toTitleCase(ringHead),
          ringHead === "NO-HEAD" ? null : `${Number(diamondSize || 0).toFixed(2)} ct`,
          ringHead === "NO-HEAD" ? null : toTitleCase(shape),
          ringHead === "NO-HEAD" ? null : stoneColorLabel,
          ringHead === "NO-HEAD" ? null : stoneOriginTypeLabel,
          metalPurityLabel,
          "ring",
        ].filter(Boolean).join(" ");
    const description = "Custom engagement ring configuration";
    let media = null;

    try {
      if (glInstance?.domElement) {
        media = glInstance.domElement.toDataURL("image/png");
      }
    } catch (error) {
      console.warn("Canvas snapshot failed", error);
    }

    setPendingCartPayload({
      type: "ADD_TO_CART",
      quantity: 1,
      Title: title,
      Description: description,
      Price: total,
      Category: "Engagement Ring",
      DiamondCategory: activeTab,
      DiamondCarat: diamondSize,
      DiamondIntensity: colorType === "fancycolored" || activeTab === "Fancy Colored"
        ? fancyDiamondIntensity
        : null,
      fancyDiamondIntensity: colorType === "fancycolored" || activeTab === "Fancy Colored"
        ? fancyDiamondIntensity
        : null,
      DiamondIntensityPrice: colorType === "fancycolored" || activeTab === "Fancy Colored"
        ? intensityPrice
        : null,
      intensityPrice: colorType === "fancycolored" || activeTab === "Fancy Colored"
        ? intensityPrice
        : null,
      MetalType: readableColor,
      Purity: metal,
      Engraving: engraving,
      EngravingFont: engravingFontAlt,
      RingSize: ringSize,
      Media: media,
    });

    setShareUrl("");
    setShare(true);
  };

  return (
    <div ref={summaryRef} className="summary-dropdown-section relative">
      <div className={`summary-button-section ${summaryBlink ? "blink-shadow" : ""} ${summaryTaxLabel ? "has-tax-label" : ""}`}>
        <button
          type="button"
          className="summary-button flex items-center gap-2"
          onClick={toggleSummary}
        >
          <img src="/images/summary-icon.svg" alt="summary" width={20} height={20} />
        </button>

        <div className="price-div">
          <span>{formatStoreCurrency(total, parent)}</span>
          {summaryTaxLabel ? <span className="summary-tax-label">{summaryTaxLabel}</span> : null}
        </div>
      </div>

      <div className={`summary-dropdown-section summary-dropdown-section-2 transition-all mobile-overflow-scroll-side duration-300 ${isOpen ? "show" : ""}`}>
        <div>
          <h4>
            <span>SHANK</span>
            <span>{formatStoreCurrency(shankTotal, parent)}</span>
          </h4>
          <ul>
            {Object.entries(shankData).map(([label, value]) => (
              <li key={label}>
                {label.toLowerCase() !== "size_option" ? <span>{label}</span> : <span />}
                <span
                  className={label}
                  style={
                    label === "Engraving"
                      ? { fontFamily: "'Segoe UI Symbol', Arial, sans-serif", fontWeight: "normal" }
                      : undefined
                  }
                >
                  {label === "Engraving"
                    ? value
                    : String(value)
                        .toLowerCase()
                        .split(" ")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}
                </span>
              </li>
            ))}
          </ul>

          {ringHead !== "NO-HEAD" && (
            <>
              <h4>
                <span>Ring</span>
                <span>{formatStoreCurrency(headTotal, parent)}</span>
              </h4>
              <ul>
                {Object.entries(headData).map(([label, value]) => (
                  <li key={label}>
                    <span>{label}</span>
                    <span>{toTitleCase(value)}</span>
                  </li>
                ))}
              </ul>

              <h4>
                <span>STONE</span>
                <span>{formatStoreCurrency(stoneTotal, parent)}</span>
              </h4>
              <ul>
                {Object.entries(stoneData).map(([label, value]) => (
                  <React.Fragment key={label}>
                    <li>
                      <span>{label}</span>
                      <span>
                        {label.toLowerCase() === "clarity"
                          ? String(value).toUpperCase()
                          : String(value)
                              .split(" ")
                              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(" ")}
                      </span>
                    </li>
                    {label.toLowerCase() === "quality" && qualityDetailsText ? (
                      <li className="stone-quality-details">
                        <span className="text-right">{qualityDetailsText}</span>
                      </li>
                    ) : null}
                  </React.Fragment>
                ))}
              </ul>
            </>
          )}

          {ringBand === "Yes" && readableBandColor ? (
            <>
              <h4>
                <span>BAND</span>
                <span>{readableBandColor}</span>
              </h4>
            </>
          ) : null}

          <div className="flex justify-end mt-2 gap-3">
            <button
              type="button"
              className="cart-btn-summary flex gap-2 w-[100%] items-center"
              onClick={addToCart}
              disabled={addedToCart}
            >
              <span className="w-[18px] h-[18px]">
                <img
                  className="absolute"
                  src="/images/cart-icon.svg"
                  alt="cart"
                  width={18}
                  height={18}
                />
              </span>
              <span>{addedToCart ? "Adding to Cart..." : "Add to Cart"}</span>
            </button>
          </div>

          <div className="flex justify-center mt-4 gap-8">
            <button
              type="button"
              className="border-0 share-btn font-[400] !text-[#6F6F6F] !p-0 !bg-transparent gap-3 flex--center text-black"
              onClick={() => setShare(true)}
            >
              <img
                src="/images/share-icon.webp"
                alt="Share"
                width={15}
                height={15}
              />
              Share
            </button>
            {getContactUrl(parent) ? (
              <button
                type="button"
                className="border-0 font-[400] !p-0 !text-[#6F6F6F] !bg-transparent gap-3 flex--center text-black"
                onClick={handleContactForm}
              >
                <img
                  src="/images/inbox-icon.webp"
                  alt="Contact"
                  width={18}
                  height={18}
                />
                Contact an Expert
              </button>
            ) : null}
          </div>

          <div className="flex justify-center pt-4">
            <button
              type="button"
              className="border-0 font-[400] !p-0 !bg-transparent gap-3 flex--center text-black"
              onClick={goToHome}
            >
              <img src="/images/home.webp" alt="Home" width={18} height={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="share-tooltip absolute px-1 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded shadow-md font-normal z-2 w-[90px]">
        {copied ? (
          <span className="flex items-center justify-center font-semibold text-[13px]">
            URL Copied
          </span>
        ) : (
          <span className="hidden md:block ml-5 flex items-center justify-center font-semibold text-[13px]">
            Share
          </span>
        )}
      </div>

      <div className="cart-tooltip absolute mb-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded shadow-md whitespace-nowrap bottom-[-545px] left-[35px] font-normal z-2">
        Add to Cart
      </div>
    </div>
  );
}

export default LocalPriceSummary;
