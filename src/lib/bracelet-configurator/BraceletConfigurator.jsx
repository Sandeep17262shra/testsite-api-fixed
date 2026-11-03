import React, { useContext, useEffect, useState, useRef, useCallback } from "react";
import Bracelet from "./Bracelet";
import './BraceletApp.css';
import '../necklace-configurator/necklace/NecklaceApp.css';
import Controls from "./components/Controls";
import { BraceletContext } from "./contexts/BraceletContext";
import { View360Context } from "./contexts/View360Context";
import { ShareContext } from "./contexts/ShareContext";
import { BRACELETS, NAME_PENDANT_SUPPORTED_PATHS, sanitizePendantText } from "./assets";
import { SoundToggleButton } from "../beeds-configurator/components/BeadsSoundToggleButton";
import { useTheme3Appearance } from "@/lib/ring-configurator/theme3Appearance";

const isModelOnlyPreview =
  typeof window !== "undefined" &&
  (new URLSearchParams(window.location.search).get("preview") === "model-only" ||
   (window.self !== window.top && document.referrer && (() => {
     try { return new URL(document.referrer).searchParams.get("preview") === "model-only"; } catch { return false; }
   })()));

function BraceletConfigurator() {
  const { view360, setView360 } = useContext(View360Context);
  const { parent, setShare } = useContext(ShareContext);
  const isKeyideasParent = (parent || "").toLowerCase().includes("keyideasinfotech");

  const {
    setCameraView,
    showResetPopup, setShowResetPopup,
    showPopup, setShowPopup,
    showPopup2, setShowPopup2,
    selectedBracelet, braceletPath, braceletMetal, braceletPurity, braceletSize, charms,
    namePendant,
  } = useContext(BraceletContext);

  const [activeStep, setActiveStep] = useState("bracelet");
  const [sandboxCollapsed, setSandboxCollapsed] = useState(false);
  const controlsRef = useRef(null);
  const theme3PanelScrollRef = useRef(null);
  const isMobileRef = useRef(false);
  const wasAtPanelBottomRef = useRef(false);
  const wasAtPanelTopRef = useRef(false);

  const { theme3RootClassName, themeRootDataAttrs, appearanceStyle } = useTheme3Appearance(
    "theme3-root--jewelry"
  );
  const theme3RootProps = {
    className: theme3RootClassName,
    style: appearanceStyle,
    ...themeRootDataAttrs,
  };

  const views = ['Top', 'Side', 'Front'];
  const [currentIndex, setCurrentIndex] = useState(0);

  // --- View (zoom) button: momentary "active" state ---
  const [isViewActive, setIsViewActive] = useState(false);
  const viewTimeoutRef = useRef(null);

  const handleClickView = () => {
    setCameraView(views[currentIndex].toLowerCase());
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
    try {
      window.parent?.postMessage({ type: "jewelry-frame:ready", app: "necklace" }, "*");
    } catch {}
  }, []);

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
        try { window.parent.postMessage({ type: "bracelet-configurator:scroll", deltaY: e.deltaY }, "*"); } catch {}
      } else if (atTop && e.deltaY < 0) {
        e.preventDefault();
        try { window.parent.postMessage({ type: "bracelet-configurator:scroll", deltaY: e.deltaY }, "*"); } catch {}
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
        try { window.parent.postMessage({ type: "bracelet-configurator:scroll", deltaY: delta }, "*"); } catch {}
      } else if (atTop && delta < 0) {
        e.preventDefault();
        lastTouchY = currentY;
        try { window.parent.postMessage({ type: "bracelet-configurator:scroll", deltaY: delta }, "*"); } catch {}
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

  const handleSandboxToggle = useCallback(() => {
    if (isMobileRef.current) setSandboxCollapsed(false);
  }, []);

  const handleSectionChange = useCallback((sectionId) => {
    setActiveStep(sectionId);
  }, []);

  // Compute live preview title caption
  const chainName = BRACELETS[selectedBracelet]?.name || "Bracelet";
  const metalName =
    braceletMetal === "#FFD280"
      ? "Yellow Gold"
      : braceletMetal === "#FFBAA3"
      ? "Rose Gold"
      : braceletMetal === "#e5e4e2"
      ? "Platinum"
      : "White Gold";
  const isPlatinum = braceletMetal === "#e5e4e2";
  const purityName = isPlatinum ? "" : (braceletPurity || "");
  const sizeName = `Size ${braceletSize}`;
  const namePendantText = sanitizePendantText(namePendant?.text || "");
  const nameLabel =
    NAME_PENDANT_SUPPORTED_PATHS.includes(braceletPath) && namePendant?.enabled && namePendantText
      ? `"${namePendantText}"`
      : "";
  const placedCharmsCount = charms.filter(Boolean).length;
  const charmsName =
    placedCharmsCount > 0
      ? `${placedCharmsCount} Charm${placedCharmsCount > 1 ? "s" : ""}`
      : "";
  const previewLabel = [purityName, metalName, chainName, nameLabel, `(${[sizeName, charmsName].filter(Boolean).join(", ")})`]
    .filter(Boolean)
    .join(" ");

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
          className={`gb-preview-control ${isResetActive ? "active" : ""}`}
          onClick={handleResetClick}
          title="Reset"
          aria-label="Reset bracelet"
        >
          <img
            src={isResetActive ? "/images/reset-button-active.svg" : "/images/reset-btn.svg"}
            alt="Reset"
            width={40}
            height={40}
          />
        </button>
      )}
      <SoundToggleButton className="gb-preview-control gb-preview-control--sound" />
      {includeShare && (
        <button
          type="button"
          className="gb-preview-control gb-share-control"
          onClick={() => setShare(true)}
          title="Share"
          aria-label="Share bracelet"
        >
          <img src="/images/share-icon.svg" alt="Share" width={20} height={20} />
        </button>
      )}
    </div>
  );

  if (isModelOnlyPreview) {
    return (
      <div {...theme3RootProps} className={`${theme3RootClassName} preview-model-only`}>
        <div className="theme3-builder">
          <div className="theme3-workspace">
            <section className="theme3-preview-pane model-only" aria-label="Interactive bracelet preview">
              {renderPreviewControls({ includeReset: false, includeShare: false })}
              <Bracelet />
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div {...theme3RootProps}>
      <div className="theme3-builder">
        <div className="theme3-mobile-preview-label" aria-live="polite">
          <strong>{previewLabel}</strong>
        </div>

        <div className={`theme3-workspace ${sandboxCollapsed ? "sandbox-collapsed" : ""}`}>
          <section
            className="theme3-preview-pane"
            aria-label="Interactive bracelet preview"
            onClick={handleSandboxToggle}
          >

            {renderPreviewControls({ includeReset: true })}
            <Bracelet />

            <div className="theme3-preview-caption">
              <strong>{previewLabel}</strong>
            </div>
          </section>

          <div className="theme3-options-pane" onClick={() => { if (isMobileRef.current) setSandboxCollapsed(true); }}>
            <Controls
              ref={controlsRef}
              activeSection={activeStep}
              onSectionChange={handleSectionChange}
            />
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
          <div className="confirm-popup">
            <button className="close-cross" onClick={() => setShowPopup(false)}>
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
                window.top.location.href = "https://shopify-jewelry-apps.keyideasinfotech.com/pages/necklace-configurator";
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      )}

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

export default BraceletConfigurator;
