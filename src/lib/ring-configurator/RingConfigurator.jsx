import Scene from './Scene';
import RingCustomizer from './RingCustomizer';
import RingAiAssistant from "./assistant/RingAiAssistant";
import { useState, useEffect, useContext, useMemo, useRef, useCallback } from "react";
import { LoaderContext } from './contexts/LoaderContext';
import { CameraViewContext } from "./contexts/CameraViewContext";
import { View360Context } from "./contexts/View360Context";
import { ShareContext } from "./contexts/ShareContext";
import { useStoreContext } from "./contexts/StoreContext";
import { DiamondContext } from "./contexts/DiamondContext";
import { RingContext } from "./contexts/RingContext";
import { SectionContext } from "./contexts/SectionContext";
import { getTheme3Sections } from "./configuratorConfig";
import { getDiamondWiseDesignById, getDiamondWiseDesignByShankId } from "./data/diamondwiseDesigns";
import LocalPriceSummary from "./components/summary/LocalPriceSummary";
import { Base64 } from "js-base64";

const RING_STYLE_LABELS = {
  PLAIN: "Plain",
  "WIDE-PLAIN": "Wide Plain",
  "KNIFE-EDGE": "Knife Edge",
  CATHEDRAL: "Cathedral",
  SPLIT: "Split",
  TWISTED: "Twisted",
  CHANNEL: "French Pave / Channel",
  "PLATE-PRONG": "Pave",
  // New default-only shanks (see priceConfig.js STORE_AVAILABLE_OPTIONS.default)
  "FRENCH-PAVE": "French Pave",
  "PAVE-STONES": "Pave Stones",
  "8-STONES": "8 Stones",
  "MULTI-ROW": "Multi-Row",
  "TWISTED-2": "Twisted II",
  FLUTED: "Fluted",
  BRAIDED: "Braided",
  "CATHEDRAL-SIDE-STONE": "Cathedral Side Stone",
  "SIDE-BEZEL-STONES": "Side Bezel Stones",
};

const HEAD_STYLE_LABELS = {
  plain: "Classic Prong",
  bezel: "Bezel",
  "hidden-halo": "Hidden Halo",
  "single-halo": "Halo",
  halo: "Halo",
  "double-halo": "Double Halo",
  "three-stone": "Three Stone",
  tulip: "Tulip",
};

const MATCHING_BAND_STYLE_LABELS = {
  PLAIN: "Plain",
  CHANNEL: "Channel",
  "PLATE-PRONG": "Pave",
};

const ENGRAVING_FONT_LABELS = {
  "Times New Roman": "Roman",
  "Dancing Script": "Script",
  "Segoe UI": "Italics",
  Arial: "Regular",
};

const getMetalLabel = ({ metal, ringColor, platinum }) => {
  if (platinum || metal === "Platinum") return "Platinum";
  if (metal === "Titanium" || String(ringColor || "").toLowerCase() === "#8c8c8c") return "Titanium";
  if (metal === "Silver" || metal === "Sterling Silver" || String(ringColor || "").toLowerCase() === "#d8d8d8") return "Sterling Silver";

  const normalizedColor = String(ringColor || "").toLowerCase();
  if (normalizedColor === "f8f8f8" || normalizedColor === "#dbdbdb" || normalizedColor === "#f1f1ef") return `${metal} White Gold`;
  if (normalizedColor === "#e6b08f" || normalizedColor === "#ffbaa3") return `${metal} Rose Gold`;
  return `${metal} Yellow Gold`;
};

const formatGemstoneLabel = (value) =>
  String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getMatchingBandStyleLabel = (value) =>
  MATCHING_BAND_STYLE_LABELS[value] ||
  String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const THEME3_SECTION_ICON = {
  shank: "/images/shank-step-icon.svg",
  setting: "/images/head-step-icon.svg",
  shape: "/images/stone-step-icon.svg",
};

function RingConfigurator() {
     const ringCustomizerRef = useRef(null);
     const theme3SectionNavRef = useRef(null);
     const [showPopup, setShowPopup] = useState(false);
     const [showPopup2, setShowPopup2] = useState(false);
     const { theme, flow, showDiamondFilters } = useStoreContext();
     const configuratorConfig = useMemo(
       () => ({ theme, flow, showDiamondFilters }),
       [theme, flow, showDiamondFilters]
     );
     const theme3Sections = useMemo(
       () => getTheme3Sections(configuratorConfig.flow),
       [configuratorConfig.flow]
     );
     const [activeTheme3Section, setActiveTheme3Section] = useState(theme3Sections[0].id);
     const [sandboxCollapsed, setSandboxCollapsed] = useState(false);
     const previewPaneRef = useRef(null);
     const isMobileRef = useRef(false);
     const { setCameraView } = useContext(CameraViewContext);
     const isModelOnlyPreview = useMemo(() => {
       if (typeof window === "undefined") return false;
       const params = new URLSearchParams(window.location.search);
       if (params.get("preview") === "model-only") return true;

       let encodedConfig = params.get("config");

       if (window.self !== window.top && document.referrer) {
         try {
           const refUrl = new URL(document.referrer);
           if (refUrl.searchParams.get("preview") === "model-only") return true;
           if (!encodedConfig) {
             encodedConfig = refUrl.searchParams.get("config");
           }
         } catch {}
       }

       if (encodedConfig) {
         try {
           const decoded = JSON.parse(Base64.decode(encodedConfig));
           if (decoded?.preview === "model-only" || decoded?.previewMode === "model-only") return true;
         } catch {}
       }
       return false;
     }, []);
    const isTheme3 = configuratorConfig.theme === "theme-3" && !isModelOnlyPreview;
    const isDiamondPreviewFlow = configuratorConfig.flow === "diamond-preview";
    const { parent, setShare } = useContext(ShareContext);
    const {
      diamondSize,
      shape,
      cut,
      clarity,
      activeTab,
      fancyDiamond,
      fancyDiamondIntensity,
      gemstone,
      selectedQuality,
      diamondType,
    } = useContext(DiamondContext);
    const { ringShank, ringHead, ringBand, ringMatchingBand, metal, ringColor, headColor, biMetal, sizeOption, ringSize, engraving, engravingFont, diamondWiseDesignId } = useContext(RingContext);
    const { headStyle, platinum } = useContext(SectionContext);
    const theme3StyleLabel = ringShank === "CHANNEL"
      ? "Channel"
      : RING_STYLE_LABELS[ringShank] || "Solitaire";
    const theme3SettingLabel = headStyle === "plain"
      ? `${ringHead === "6-PRONG" ? "Classic 6" : "Classic 4"} Prong`
      : HEAD_STYLE_LABELS[headStyle] || ringHead;
    const theme3MetalLabel = getMetalLabel({ metal, ringColor, platinum });
    const theme3HeadAccentLabel = getMetalLabel({ metal, ringColor: headColor, platinum: false });
    const theme3StoneMode = activeTab === "Fancy Colored"
      ? "Colored"
      : activeTab === "Fancy-Gemstone" ? "Gemstone" : "Colorless";
    const theme3EngravingFontLabel = ENGRAVING_FONT_LABELS[engravingFont] || "Regular";
    const selectedDiamondWiseDesign = getDiamondWiseDesignById(diamondWiseDesignId);
    const selectedDiamondWiseShank = getDiamondWiseDesignByShankId(ringShank);
    const theme3DisplayStyleLabel = selectedDiamondWiseShank?.shankLabel || theme3StyleLabel;
    const theme3DisplaySettingLabel = selectedDiamondWiseDesign?.headLabel || theme3SettingLabel;
    const displayShapeLabel = selectedDiamondWiseDesign
      ? (selectedDiamondWiseDesign.defaultShape || "marquise").replace(/\b\w/g, (c) => c.toUpperCase())
      : (shape ? String(shape).replace(/\b\w/g, (char) => char.toUpperCase()) : "Round");
    const stoneColorLabel = activeTab === "Fancy Colored"
      ? fancyDiamond
      : activeTab === "Fancy-Gemstone"
        ? formatGemstoneLabel(gemstone)
        : "";
    const stoneOriginTypeLabel = activeTab === "Fancy-Gemstone"
      ? "Gemstone"
      : (selectedQuality?.type || diamondType) === "Natural"
        ? "Natural Diamond"
        : "Lab Diamond";
    // For DiamondWise rings: "{DesignName} {Shape} {carat} ct {color?} {origin/type} {metal} ring"
    const isDiamondWiseActive = Boolean(selectedDiamondWiseDesign);
    const dwHeadLabel = selectedDiamondWiseDesign?.headLabel?.trim() || "";
    const dwShankLabel = (selectedDiamondWiseShank?.shankLabel || selectedDiamondWiseDesign?.shankLabel || "")?.trim();
    const dwDesignName = (dwHeadLabel && dwShankLabel && dwHeadLabel.toLowerCase() === dwShankLabel.toLowerCase())
      ? dwHeadLabel
      : (dwHeadLabel && dwShankLabel)
        ? `${dwHeadLabel} head with ${dwShankLabel} shank`
        : (dwHeadLabel || dwShankLabel);
    const diamondWisePreviewLabel = isDiamondWiseActive
      ? [
          dwDesignName,
          `${Number(diamondSize || 0).toFixed(2)} ct`,
          displayShapeLabel,
          stoneColorLabel,
          stoneOriginTypeLabel,
          theme3MetalLabel,
          "ring",
        ].filter(Boolean).join(" ")
      : null;
    const previewLabel = [
      theme3DisplayStyleLabel,
      theme3DisplaySettingLabel,
      `${Number(diamondSize || 0).toFixed(2)} ct`,
      displayShapeLabel,
      stoneColorLabel,
      stoneOriginTypeLabel,
      theme3MetalLabel,
      "ring",
    ].filter(Boolean).join(" ");
    const activeTheme3SectionMeta =
      theme3Sections.find((section) => section.id === activeTheme3Section) || theme3Sections[0];

     const isKeyideasParent = (parent || "").toLowerCase().includes("keyideasinfotech");

   useEffect(() => {
      document.title = "Jewelry Ring Configurator by Keyideas";
      const favicon = document.querySelector("link[rel='icon']") || document.createElement('link');
      favicon.rel = 'icon';
      favicon.href = '/RC.png';
      document.head.appendChild(favicon);
   }, []);
   const { loader, percentage } = useContext(LoaderContext);
   useEffect(() => {
      const removeLevaPanel = () => {
         const levaPanel = document.querySelector('.leva-c-kWgxhW');
         if (levaPanel) {
            levaPanel.remove();
         }
      };

      removeLevaPanel();

      const observer = new MutationObserver(() => {
         removeLevaPanel();
      });

      observer.observe(document.body, { childList: true, subtree: true });

      return () => observer.disconnect();
   }, []);

  const views = ["Top", "Side", "Front"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const { view360, setView360 } = useContext(View360Context);

  // --- View (zoom) button: momentary "active" state for 1 second ---
  const [isViewActive, setIsViewActive] = useState(false);
  const viewTimeoutRef = useRef(null);

  const handleClickView = () => {
    if (views[currentIndex].toLowerCase() === "360") {
      // no-op
    } else {
      if (currentIndex != 3) {
        setCameraView(views[currentIndex].toLowerCase());
      } else {
        setCameraView(views[currentIndex]);
      }
    }
    setCurrentIndex((prevIndex) => (prevIndex + 1) % views.length);

    setIsViewActive(true);
    if (viewTimeoutRef.current) clearTimeout(viewTimeoutRef.current);
    viewTimeoutRef.current = setTimeout(() => {
       setIsViewActive(false);
    }, 2000); // 1 second
  };

  const handle360Click = () => {
    setView360(prev => !prev);
  };

  // --- Reset button and confirmation popup ---
  const [isResetActive, setIsResetActive] = useState(false);
  const [showResetPopup, setShowResetPopup] = useState(false);
  const resetTimeoutRef = useRef(null);

  const handleResetClick = () => {
    setShowResetPopup(true);

    setIsResetActive(true);
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(() => {
       setIsResetActive(false);
    }, 1500);
  };

  const handleConfirmReset = () => {
    ringCustomizerRef.current?.handleReset?.() || ringCustomizerRef.current?.openResetPopup?.();
    setView360(false);
    setIsViewActive(false);
    setShowResetPopup(false);
  };

  const handleTheme3SectionChange = useCallback((sectionId) => {
    setActiveTheme3Section(sectionId);
  }, []);

  useEffect(() => {
    setActiveTheme3Section((currentSection) =>
      theme3Sections.some((section) => section.id === currentSection)
        ? currentSection
        : theme3Sections[0].id
    );
  }, [theme3Sections]);

  const handleTheme3SectionClick = (section) => {
    if (section.disabled) return;
    setActiveTheme3Section(section.id);
    ringCustomizerRef.current?.scrollToTheme3Section(section.id);
    if (isMobileRef.current) setSandboxCollapsed(true);
  };

  const handleSandboxToggle = useCallback(() => {
    if (isMobileRef.current) setSandboxCollapsed(false);
  }, []);

  const allowTheme3FileDrop = (event) => {
    event.preventDefault();
  };

  useEffect(() => {
    const checkMobile = () => { isMobileRef.current = window.innerWidth <= 900; };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const nav = theme3SectionNavRef.current;
    const activeButton = nav?.querySelector(`[data-theme3-nav="${activeTheme3Section}"]`);
    if (!nav || !activeButton) return;

    nav.scrollTo({
      left: activeButton.offsetLeft - (nav.clientWidth - activeButton.clientWidth) / 2,
      behavior: "smooth",
    });
  }, [activeTheme3Section]);

  const renderPreviewControls = ({
    includeView = true,
    includeReset = true,
    includeShare = false,
  } = {}) => (
    <div className="gb-preview-controls" aria-label="Preview controls">
      <button
        type="button"
        className={`gb-preview-control ${view360 ? "active" : ""}`}
        onClick={handle360Click}
        aria-pressed={view360}
        aria-label={view360 ? "Turn 360 view off" : "Turn 360 view on"}
        title={view360 ? "360 view on" : "360 view off"}
      >
        <img
          src={view360 ? "/images/360-button-active.svg" : "/images/360-icon.svg"}
          alt="360 view"
          width={40}
          height={40}
        />
      </button>
      {includeView && (
        <button
          type="button"
          className={`gb-preview-control ${isViewActive ? "active" : ""}`}
          onClick={handleClickView}
          title="Change view"
        >
          <img
            src={isViewActive ? "/images/view-button-active.svg" : "/images/zoom-view.svg"}
            alt="Change model view"
            width={40}
            height={40}
          />
        </button>
      )}
      {includeReset && (
        <button
          type="button"
          className={`gb-preview-control ${isResetActive ? "active" : ""}`}
          onClick={handleResetClick}
          title="Reset"
        >
          <img
            src={isResetActive ? "/images/reset-button-active.svg" : "/images/reset-btn.svg"}
            alt="Reset"
            width={40}
            height={40}
          />
        </button>
      )}
      {includeShare && (
        <button
          type="button"
          className="gb-preview-control gb-share-control"
          onClick={() => setShare(true)}
          title="Share"
          aria-label="Share"
        >
          <img src="/images/share-icon.svg" alt="Share" width={40} height={40} />
        </button>
      )}
      <button
        type="button"
        className="gb-preview-control gb-ai-control"
        onClick={() => window.dispatchEvent(new Event("ring-ai-toggle"))}
        title="Ask AI"
        aria-label="Ask AI"
      >
        <img src="/ai-icon.svg" alt="AI" width={40} height={40} />
      </button>
    </div>
  );

  // Clean up any pending timers if component unmounts
  useEffect(() => {
     return () => {
        if (viewTimeoutRef.current) clearTimeout(viewTimeoutRef.current);
        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
     };
  }, []);

  if (isModelOnlyPreview) {
    return (
      <div className="theme3-root theme3-root--ring preview-model-only">
        <div className="theme3-builder">
          <div className="theme3-workspace">
            <section className="theme3-preview-pane model-only" aria-label="Interactive ring preview">
              {loader && (
                <div className="theme3-loader" role="status" aria-label="Loading ring model">
                  <span />
                  <span />
                  <span />
                </div>
              )}
              {renderPreviewControls({ includeView: false, includeReset: false, includeShare: false })}
              <Scene />
            </section>
          </div>
        </div>
      </div>
    );
  }

  if (isTheme3) {
    return (
      <div className="theme3-root theme3-root--ring" onDragOver={allowTheme3FileDrop} onDrop={allowTheme3FileDrop}>
        <div className="theme3-builder">
          <div className={`theme3-workspace ${sandboxCollapsed ? "sandbox-collapsed" : ""}`}>
            <section
              className="theme3-preview-pane"
              aria-label="Interactive ring preview"
              ref={previewPaneRef}
              onClick={handleSandboxToggle}
            >
              {loader && (
                <div className="theme3-loader" role="status" aria-label="Loading ring model">
                  <span />
                  <span />
                  <span />
                </div>
              )}

              {/* Reset joins 360 and view here - the panel's top bar, which used to
                  carry it, is gone on desktop (see RCApp.css). Same confirm popup. */}
              {renderPreviewControls({ includeShare: false })}
              <Scene />

              <div className="theme3-ai-assistant-slot" aria-label="AI ring assistant">
                <RingAiAssistant portalTargetId="theme3-ai-panel-host" />
              </div>

              <div className="theme3-preview-caption">
                <strong>{diamondWisePreviewLabel || previewLabel}</strong>
              </div>
              {/*<p className="theme3-orbit-hint">Drag to rotate / Scroll to zoom</p>*/}
            </section>

          <div className="theme3-right-panel">

            <div className="theme3-options-pane" onClick={() => { if (isMobileRef.current) setSandboxCollapsed(true); }}>
              <RingCustomizer
                ref={ringCustomizerRef}
                theme="theme-3"
                flow={configuratorConfig.flow}
                activeTheme3Section={activeTheme3Section}
                onTheme3SectionChange={handleTheme3SectionChange}
              />
              <div id="theme3-ai-panel-host" className="theme3-ai-panel-host" />
            </div>
          </div>
        </div>
      </div>

        {showResetPopup && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
            <div
              className="confirm-popup bg-white rounded-xl shadow-xl relative text-center"
              style={{ width: "90%", maxWidth: "400px", padding: "24px" }}
            >
              <button
                className="close-cross"
                onClick={() => setShowResetPopup(false)}
                aria-label="Close"
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  background: "transparent",
                  border: "none",
                  fontSize: "18px",
                  cursor: "pointer",
                  color: "#555555",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
              <p style={{ fontSize: "16px", fontWeight: "700", margin: "10px 0 6px", color: "#000000" }}>
                Reset Ring?
              </p>
              <p style={{ color: "#666666", fontSize: "13px", marginBottom: "20px" }}>
                This will clear all your custom selections.
              </p>
              <button
                className="cnfm-btn"
                onClick={handleConfirmReset}
                style={{
                  background: "#303030",
                  color: "#ffffff",
                  padding: "10px 24px",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "13px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Confirm Reset
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

   return (
         <div className={`gb-builder-shell ${isModelOnlyPreview ? "preview-model-only" : ""}`}>

            <div className={`ring-filter-section-main gb-preview-pane ${isModelOnlyPreview ? "model-only" : ""}`}>

               {!isModelOnlyPreview && isKeyideasParent && (
               <div className="bracelet-necklace gap-6">
               <button className="" title="Reset"
                  onClick={() => setShowPopup2(true)}>
                  <span className='bracelet-configurator-name' style={{marginRight: "0px", lineHeight:"20px", marginLeft:"8px"}}>GO TO PENDANT</span> 
                  <img className="arrow-icon" src="/down-arrow.svg"  alt="arrow" style={{ width: "10px", height: "10px", marginRight: "4px",transform: "rotate(-90deg)", lineHeight:"20px" }}/>
               </button>
               <button className="" title="Reset"
                  onClick={() => setShowPopup(true)}>
                  <span className='bracelet-configurator-name' style={{marginLeft: "8px",lineHeight:"20px" }}>GO TO BRACELET</span> 
                  <img className="arrow-icon" src="/down-arrow.svg"  alt="arrow" style={{ width: "10px", height: "10px", marginLeft: "4px",transform: "rotate(-90deg)", marginRight:"4px", lineHeight:"20px" }}/>
               </button>
            </div>
            )}
               {loader && (
                  <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center bg-transparent z-50 pt-20">
                     <div className="flex space-x-2 mb-2">
                        <div className="dot-bubble"></div>
                        <div className="dot-bubble"></div>
                        <div className="dot-bubble"></div>
                     </div>
                  </div>
               )}
               {renderPreviewControls({
                  includeView: !isModelOnlyPreview,
                  includeReset: !isModelOnlyPreview,
               })}

               <Scene />
               {!isModelOnlyPreview && (
                  <div className="gb-preview-label">{previewLabel}</div>
               )}

            </div>

            {!isModelOnlyPreview && (
              <div className="gb-options-pane">
                 <LocalPriceSummary />
                 <RingCustomizer ref={ringCustomizerRef} />
              </div>
            )}

{!isModelOnlyPreview && showPopup && (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 confirm-popup relative shadow-xl">
      <button
        className="round-btn close-cross text-black"
        onClick={() => setShowPopup(false)}
      >
        ✕
      </button>
      <p className="text-center text-black">
        You'll lose all customizations.
      </p>
      <p className="text-center mb-5 text-black">
       Are you sure you want to switch?
      </p>
      <button
        className="w-[200px] mx-auto block text-white py-2 rounded cnfm-btn"
        onClick={() => {
           window.top.location.href = "https://shopify-jewelry-apps.keyideasinfotech.com/pages/bracelet-configurator";
        }}
      >
        Confirm
      </button>
    </div>
  </div>
)}
{!isModelOnlyPreview && showPopup2 && (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 confirm-popup relative shadow-xl">
      <button
        className="round-btn close-cross text-black"
        onClick={() => setShowPopup2(false)}
      >
        ✕
      </button>
      <p className="text-center text-black">
        You'll lose all customizations.
      </p>
      <p className="text-center mb-5 text-black">
       Are you sure you want to switch?
      </p>
      <button
        className="w-[200px] mx-auto block text-white py-2 rounded cnfm-btn"
        onClick={() => {
           window.top.location.href = "https://shopify-jewelry-apps.keyideasinfotech.com/pages/necklace-configurator";
        }}
      >
        Confirm
      </button>
    </div>
  </div>
)}

{showResetPopup && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
    <div
      className="confirm-popup bg-white rounded-xl shadow-xl relative text-center"
      style={{ width: "90%", maxWidth: "400px", padding: "24px" }}
    >
      <button
        className="close-cross"
        onClick={() => setShowResetPopup(false)}
        aria-label="Close"
        style={{
          position: "absolute",
          top: "14px",
          right: "14px",
          background: "transparent",
          border: "none",
          fontSize: "18px",
          cursor: "pointer",
          color: "#555555",
          lineHeight: 1,
        }}
      >
        ✕
      </button>
      <p style={{ fontSize: "16px", fontWeight: "700", margin: "10px 0 6px", color: "#000000" }}>
        Reset Ring?
      </p>
      <p style={{ color: "#666666", fontSize: "13px", marginBottom: "20px" }}>
        This will clear all your custom selections.
      </p>
      <button
        className="cnfm-btn"
        onClick={handleConfirmReset}
        style={{
          background: "#303030",
          color: "#ffffff",
          padding: "10px 24px",
          borderRadius: "6px",
          fontWeight: 700,
          fontSize: "13px",
          border: "none",
          cursor: "pointer",
        }}
      >
        Confirm Reset
      </button>
    </div>
  </div>
)}

         </div>
   );
}

export default RingConfigurator;
