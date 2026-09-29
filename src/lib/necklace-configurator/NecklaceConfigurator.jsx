import React, { useContext, useEffect, useState, useRef, useCallback, useMemo } from "react";
import NecklaceScene from "./necklace/Necklace";
import BraceletScene from "./bracelet/Bracelet";
import './necklace/NecklaceApp.css';
import './bracelet/BraceletApp.css';
import Controls from "./components/Controls";
import BraceletControls from "./components/BraceletControls";
import { View360Context } from "./contexts/View360Context";
import { BraceletContext } from "./contexts/BraceletContext";
import { ShareContext } from "./contexts/ShareContext";
import { BRACELETS, BRACELET_STYLES, BRACELET_NAME_CHAIN_PATHS, sanitizePendantText } from "./shared/assets";

const isModelOnlyPreview =
  typeof window !== "undefined" &&
  (new URLSearchParams(window.location.search).get("preview") === "model-only" ||
   (window.self !== window.top && document.referrer && (() => {
     try { return new URL(document.referrer).searchParams.get("preview") === "model-only"; } catch { return false; }
   })()));

const NECKLACE_SECTIONS = [
  { id: "bracelet", label: "Chain Selection", icon: "/images/bracelet-tab-icon.svg" },
  { id: "charms", label: "Add-ons", icon: "/images/charms-tab-icon.svg" },
];

const BRACELET_SECTIONS = [
  { id: "bracelet", label: "Bracelet Selection", icon: "/images/bracelet-tab-icon.svg" },
  { id: "charms", label: "Add-ons", icon: "/images/charms-tab-icon.svg" },
];


function NecklaceConfigurator() {
  const { view360, setView360 } = useContext(View360Context);
  const { parent, setShare } = useContext(ShareContext);
  const isKeyideasParent = (parent || "").toLowerCase().includes("keyideasinfotech");

  const {
    jewelryType, setJewelryType,
    setCameraView,
    showResetPopup, setShowResetPopup,
    showPopup2, setShowPopup2,
    selectedBracelet, braceletPath, braceletMetal, braceletPurity, braceletSize, namePendant, charms,
  } = useContext(BraceletContext);

  const [activeStep, setActiveStep] = useState("bracelet");
  const [sandboxCollapsed, setSandboxCollapsed] = useState(false);

  // Mask the preview canvas for a beat after switching Necklace <-> Bracelet:
  // the scene remounts (new Environment/lighting warm-up), and metal
  // materials render dark/flat for a frame or two before reflections kick
  // in. A fixed, bounded timer is used instead of the app's own `loader`
  // flag because that flag is only ever cleared by the GLB-loading effects
  // in Bracelet.jsx — the default bracelet (a generated name chain) never
  // goes through them, so it would leave the mask stuck on forever.
  const isFirstJewelryMountRef = useRef(true);
  const [isSwitchingJewelryType, setIsSwitchingJewelryType] = useState(false);
  const controlsRef = useRef(null);
  const theme3SectionNavRef = useRef(null);
  const theme3PanelScrollRef = useRef(null);
  const isMobileRef = useRef(false);
  const wasAtPanelBottomRef = useRef(false);
  const wasAtPanelTopRef = useRef(false);

  const isBracelet = jewelryType === "bracelet";
  const views = useMemo(() => {
    return isBracelet ? ['top', 'side', 'front'] : ['front_zoom', 'back_zoom', 'normal'];
  }, [isBracelet]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset view index and camera view when switching between necklace and bracelet
  useEffect(() => {
    setCurrentIndex(0);
    setCameraView("");
  }, [jewelryType, setCameraView]);

  // --- View (zoom) button: momentary "active" state ---
  const [isViewActive, setIsViewActive] = useState(false);
  const viewTimeoutRef = useRef(null);

  const handleClickView = () => {
    const nextView = views[currentIndex % views.length];
    setCameraView(nextView);
    setCurrentIndex((prev) => (prev + 1) % views.length);

    setIsViewActive(true);
    if (viewTimeoutRef.current) clearTimeout(viewTimeoutRef.current);
    viewTimeoutRef.current = setTimeout(() => {
      setIsViewActive(false);
    }, 1500);
  };

  const handle360Click = () => {
    setView360((prev) => !prev);
  };

  // --- Reset button: momentary "active" state ---
  const [isResetActive, setIsResetActive] = useState(false);
  const resetTimeoutRef = useRef(null);

  const handleResetClick = () => {
    setCurrentIndex(0);
    setCameraView("");
    setShowResetPopup(true);
    setIsResetActive(true);
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(() => {
      setIsResetActive(false);
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (viewTimeoutRef.current) clearTimeout(viewTimeoutRef.current);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => { isMobileRef.current = window.innerWidth <= 900; };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isFirstJewelryMountRef.current) {
      isFirstJewelryMountRef.current = false;
      return undefined;
    }
    // Only mask when switching to bracelet. For necklace, do not mask so the
    // full chain fall animation is visible immediately from start to finish.
    if (jewelryType === "necklace") {
      setIsSwitchingJewelryType(false);
      return undefined;
    }
    setIsSwitchingJewelryType(true);
    const timer = setTimeout(() => setIsSwitchingJewelryType(false), 260);
    return () => clearTimeout(timer);
  }, [jewelryType]);

  // --- Scroll passthrough: find the scroll container on mount ---
  useEffect(() => {
    const panelScroll = document.querySelector(".theme3-root .theme3-panel-scroll");
    if (panelScroll) theme3PanelScrollRef.current = panelScroll;
  }, []);

  // --- Track scroll position (top/bottom boundaries) for passthrough ---
  useEffect(() => {
    const panelScroll = theme3PanelScrollRef.current;
    if (!panelScroll) return undefined;

    const isEmbedded = typeof window !== "undefined" && window.self !== window.top;
    if (!isEmbedded) return undefined;

    const updateScrollPosition = () => {
      const atBottom = panelScroll.scrollTop + panelScroll.clientHeight >= panelScroll.scrollHeight - 5;
      const atTop = panelScroll.scrollTop <= 5;
      wasAtPanelBottomRef.current = atBottom;
      wasAtPanelTopRef.current = atTop;
    };

    panelScroll.addEventListener("scroll", updateScrollPosition, { passive: true });
    updateScrollPosition();

    return () => {
      panelScroll.removeEventListener("scroll", updateScrollPosition);
      wasAtPanelBottomRef.current = false;
      wasAtPanelTopRef.current = false;
    };
  }, []);

  // --- Forward scroll past panel boundaries to parent page ---
  useEffect(() => {
    const panelScroll = theme3PanelScrollRef.current;
    if (!panelScroll) return undefined;

    const isEmbedded = typeof window !== "undefined" && window.self !== window.top;
    if (!isEmbedded) return undefined;

    const handleWheel = (e) => {
      const atBottom = wasAtPanelBottomRef.current;
      const atTop = wasAtPanelTopRef.current;
      if (atBottom && e.deltaY > 0) {
        e.preventDefault();
        try { window.parent.postMessage({ type: "necklace-configurator:scroll", deltaY: e.deltaY }, "*"); } catch {}
      } else if (atTop && e.deltaY < 0) {
        e.preventDefault();
        try { window.parent.postMessage({ type: "necklace-configurator:scroll", deltaY: e.deltaY }, "*"); } catch {}
      }
    };

    let lastTouchY = null;
    const handleTouchStart = (e) => {
      const atBottom = wasAtPanelBottomRef.current;
      const atTop = wasAtPanelTopRef.current;
      if (!atBottom && !atTop) { lastTouchY = null; return; }
      lastTouchY = e.touches[0]?.clientY ?? null;
    };
    const handleTouchMove = (e) => {
      const atBottom = wasAtPanelBottomRef.current;
      const atTop = wasAtPanelTopRef.current;
      if ((!atBottom && !atTop) || lastTouchY === null) return;
      const currentY = e.touches[0]?.clientY;
      if (currentY == null) return;
      const delta = lastTouchY - currentY;
      if (atBottom && delta > 0) {
        e.preventDefault();
        lastTouchY = currentY;
        try { window.parent.postMessage({ type: "necklace-configurator:scroll", deltaY: delta }, "*"); } catch {}
      } else if (atTop && delta < 0) {
        e.preventDefault();
        lastTouchY = currentY;
        try { window.parent.postMessage({ type: "necklace-configurator:scroll", deltaY: delta }, "*"); } catch {}
      }
    };
    const handleTouchEnd = () => { lastTouchY = null; };

    panelScroll.addEventListener("wheel", handleWheel, { passive: false });
    panelScroll.addEventListener("touchstart", handleTouchStart, { passive: true });
    panelScroll.addEventListener("touchmove", handleTouchMove, { passive: false });
    panelScroll.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      panelScroll.removeEventListener("wheel", handleWheel);
      panelScroll.removeEventListener("touchstart", handleTouchStart);
      panelScroll.removeEventListener("touchmove", handleTouchMove);
      panelScroll.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  const handleSectionClick = (sectionId) => {
    setActiveStep(sectionId);
    controlsRef.current?.scrollToSection(sectionId);
    if (isMobileRef.current) setSandboxCollapsed(true);
  };

  const handleSandboxToggle = useCallback(() => {
    if (isMobileRef.current) setSandboxCollapsed(false);
  }, []);

  const handleSectionChange = useCallback((sectionId) => {
    setActiveStep(sectionId);
  }, []);

  useEffect(() => {
    const nav = theme3SectionNavRef.current;
    const activeButton = nav?.querySelector(`[data-theme3-nav="${activeStep}"]`);
    if (!nav || !activeButton) return;

    nav.scrollTo({
      left: activeButton.offsetLeft - (nav.clientWidth - activeButton.clientWidth) / 2,
      behavior: "smooth",
    });
  }, [activeStep]);

  // Compute live preview title caption
  const SECTIONS = isBracelet ? BRACELET_SECTIONS : NECKLACE_SECTIONS;
  const chainName = isBracelet
    ? (BRACELET_STYLES[selectedBracelet]?.name || "Bracelet")
    : (BRACELETS[selectedBracelet]?.name || "Chain");
  const metalName =
    braceletMetal === "#ECC875" || braceletMetal === "#FFD280" || braceletMetal === "#E4C088"
      ? "Yellow Gold"
      : braceletMetal === "#FFBAA3" || braceletMetal === "#EBB39C" || braceletMetal === "#e6b08f" || braceletMetal === "#f0a47b"
      ? "Rose Gold"
      : braceletMetal === "#A8A8A6" || braceletMetal === "#e5e4e2" || braceletMetal === "#E2E4E8"
      ? "Platinum"
      : braceletMetal === "#C0C0C0" || braceletMetal === "#B8B8B8"
      ? "Silver 925"
      : "White Gold";
  const placedCharmsCount = charms.filter(Boolean).length;
  const charmsName =
    placedCharmsCount > 0
      ? `${placedCharmsCount} Charm${placedCharmsCount > 1 ? "s" : ""}`
      : "";
  const previewLabel = isBracelet
    ? (() => {
        const isPlatinum = braceletMetal === "#e5e4e2";
        const purityName = isPlatinum ? "" : (braceletPurity || "");
        const namePendantText = sanitizePendantText(namePendant?.text || "");
        const nameLabel =
          BRACELET_NAME_CHAIN_PATHS.includes(braceletPath) && namePendant?.enabled && namePendantText
            ? `"${namePendantText}"`
            : "";
        const sizeName = `Size ${braceletSize}`;
        return [purityName, metalName, chainName, nameLabel, `(${[sizeName, charmsName].filter(Boolean).join(", ")})`]
          .filter(Boolean)
          .join(" ");
      })()
    : (() => {
        const isNecklacePlatinum = braceletMetal === "#A8A8A6";
        const purityName = isNecklacePlatinum ? "" : (braceletPurity || "");
        const pendantName =
          namePendant.enabled && namePendant.text.trim()
            ? `${namePendant.text} Pendant`
            : "";
        return [purityName, chainName, metalName, pendantName, charmsName].filter(Boolean).join(" ") + " Necklace";
      })();

  const activeSectionMeta =
    SECTIONS.find((s) => s.id === activeStep) || SECTIONS[0];

  const renderPreviewControls = ({ includeReset = false, includeShare = false } = {}) => (
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
      <button
        type="button"
        className={`gb-preview-control ${isViewActive ? "active" : ""}`}
        onClick={handleClickView}
        title="Change view"
        aria-label="Change view angle"
      >
        <img
          src={isViewActive ? "/images/view-button-active.svg" : "/images/zoom-view.svg"}
          alt="Change model view"
          width={40}
          height={40}
        />
      </button>
      {includeReset && (
        <button
          type="button"
          className={`gb-preview-control gb-preview-control--reset ${isResetActive ? "active" : ""}`}
          onClick={handleResetClick}
          title="Reset"
          aria-label={`Reset ${jewelryType}`}
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
          aria-label={`Share ${jewelryType}`}
        >
          <img src="/images/share-icon.svg" alt="Share" width={20} height={20} />
        </button>
      )}
    </div>
  );

  if (isModelOnlyPreview) {
    return (
      <div className="theme3-root preview-model-only">
        <div className="theme3-builder">
          <div className="theme3-workspace">
            <section className="theme3-preview-pane model-only" aria-label={`Interactive ${jewelryType} preview`}>
              {renderPreviewControls({ includeReset: false, includeShare: false })}
              {isBracelet ? <BraceletScene /> : <NecklaceScene />}
              <div className={`theme3-model-loading ${isSwitchingJewelryType ? "is-visible" : ""}`} aria-hidden="true" />
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="theme3-root theme3-root--jewelry">
      <div className="theme3-builder">
        <div className="theme3-mobile-preview-label" aria-live="polite">
          <strong>{previewLabel}</strong>
        </div>

        <div className={`theme3-workspace ${sandboxCollapsed ? "sandbox-collapsed" : ""}`}>
          <section
            className="theme3-preview-pane"
            aria-label={`Interactive ${jewelryType} preview`}
            onClick={handleSandboxToggle}
          >
            {isKeyideasParent && (
              <div className="bracelet-necklace">
                <button
                  type="button"
                  onClick={() => setShowPopup2(true)}
                  title="Switch to Ring"
                >
                  <span style={{ marginRight: "4px" }}>GO TO RING</span>
                  <img
                    src="/down-arrow.svg"
                    alt=""
                    style={{ width: "10px", height: "10px", transform: "rotate(-90deg)" }}
                  />
                </button>
              </div>
            )}

            {/* Reset sits here with 360 and view, as on the ring (the panel's
                top bar that carried it is hidden on desktop - NecklaceApp.css). */}
            {renderPreviewControls({ includeReset: true })}
            {isBracelet ? <BraceletScene /> : <NecklaceScene />}
            <div className={`theme3-model-loading ${isSwitchingJewelryType ? "is-visible" : ""}`} aria-hidden="true" />

            <div className="theme3-preview-caption">
              <strong>{previewLabel}</strong>
            </div>
          </section>

          <nav
            className="theme3-section-nav"
            ref={theme3SectionNavRef}
            aria-label={`${isBracelet ? "Bracelet" : "Necklace"} customization sections`}
            style={{ "--theme3-section-count": SECTIONS.length }}
          >
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                className={activeStep === section.id ? "active" : ""}
                data-theme3-nav={section.id}
                onClick={() => handleSectionClick(section.id)}
                aria-current={activeStep === section.id ? "true" : undefined}
              >
                <span className="theme3-section-index" aria-hidden="true">
                  <span
                    className="theme3-section-icon"
                    style={{
                      maskImage: `url(${section.icon})`,
                      WebkitMaskImage: `url(${section.icon})`,
                    }}
                  />
                </span>
                <span className="theme3-section-copy">
                  <strong>{section.label}</strong>
                </span>
              </button>
            ))}
          </nav>

          <div className="theme3-options-pane" onClick={() => { if (isMobileRef.current) setSandboxCollapsed(true); }}>
            {isBracelet ? (
              <BraceletControls
                ref={controlsRef}
                activeSection={activeStep}
                onSectionChange={handleSectionChange}
              />
            ) : (
              <Controls
                ref={controlsRef}
                activeSection={activeStep}
                onSectionChange={handleSectionChange}
              />
            )}
          </div>
        </div>
      </div>

      {showPopup2 && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
          <div className="confirm-popup">
            <button className="close-cross" onClick={() => setShowPopup2(false)}>
              ✕
            </button>
            <p style={{ fontSize: "16px", fontWeight: "700", margin: "10px 0 6px" }}>
              Switch Configurator?
            </p>
            <p style={{ color: "#666666", fontSize: "13px", marginBottom: "20px" }}>
              You'll lose your current customizations.
            </p>
            <button
              className="cnfm-btn"
              onClick={() => {
                window.top.location.href = "https://shopify-jewelry-apps.keyideasinfotech.com/pages/jewellery-configurator";
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NecklaceConfigurator;
