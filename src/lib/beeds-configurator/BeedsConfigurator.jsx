import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import "./BeedsApp.css";
import "./beads-randomize.css";
import "../necklace-configurator/necklace/NecklaceApp.css";
import BeadsPreviewMorph from "./components/BeadsPreviewMorph";
import BeedsControls from "./components/BeedsControls.jsx";
import { ManualRandomizeButton } from "./components/ManualRandomizeButton";
import { BeadsSoundToggleButton } from "./components/BeadsSoundToggleButton";
import { useBeedsContext } from "./contexts/BeedsContext";
import { View360Context } from "./contexts/View360Context";
import { BEAD_CHARMS, BEADS, SEPARATORS, getBeadStyleLabel } from "./assets";
import { preloadBeadsConfiguratorAssets } from "./beadAssetPreload";
import { unlockBeadsAudio } from "./beadsSounds";
import { useMomentaryPreviewControlActive } from "./useMomentaryPreviewControlActive";

const BEEDS_SECTIONS = [
  { id: "jewelry", label: "Style", subtitle: "Length & pattern", icon: "/images/bracelet-tab-icon.svg" },
  { id: "customize", label: "Beads", subtitle: "Beads, spacers & charms", icon: "/images/charms-tab-icon.svg" },
];

function BeedsConfigurator() {
  const {
    styleId,
    displayLengthLabel,
    selectedBead,
    showResetPopup,
    setShowResetPopup,
    resetConfiguration,
    canUndoDesign,
    undoDesignStep,
  } = useBeedsContext();
  const { view360, setView360 } = useContext(View360Context);

  const [activeStep, setActiveStep] = useState("jewelry");
  const [sandboxCollapsed, setSandboxCollapsed] = useState(false);
  const [isUndoActive, pulseUndoActive] = useMomentaryPreviewControlActive();
  const controlsRef = useRef(null);
  const theme3SectionNavRef = useRef(null);
  const isMobileRef = useRef(false);

  useEffect(() => {
    document.title = "Beaded Bracelet Configurator by Keyideas";
    const favicon = document.querySelector("link[rel='icon']") || document.createElement("link");
    favicon.rel = "icon";
    favicon.href = "/RC.png";
    document.head.appendChild(favicon);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      isMobileRef.current = window.innerWidth <= 900;
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const unlockOnGesture = () => unlockBeadsAudio();
    window.addEventListener("pointerdown", unlockOnGesture, { passive: true });
    // Drag/remove sounds fire on pointer-up or after settle — keep the context warm.
    window.addEventListener("pointerup", unlockOnGesture, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", unlockOnGesture);
      window.removeEventListener("pointerup", unlockOnGesture);
    };
  }, []);

  useEffect(() => {
    preloadBeadsConfiguratorAssets({
      beadUrls: BEADS.map((bead) => bead.image),
      spacerUrls: SEPARATORS.map((spacer) => spacer.image),
      charmUrls: BEAD_CHARMS.map((charm) => charm.image),
    });
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

  const handleSectionClick = (sectionId) => {
    setActiveStep(sectionId);
    controlsRef.current?.scrollToSection?.(sectionId);
    if (isMobileRef.current) setSandboxCollapsed(true);
  };

  const handleSectionChange = useCallback((sectionId) => {
    setActiveStep(sectionId);
  }, []);

  const handleSandboxToggle = () => {
    if (isMobileRef.current) {
      setSandboxCollapsed((value) => !value);
    }
  };

  const handle360Click = () => {
    setView360((prev) => !prev);
  };

  const handleUndoClick = () => {
    if (!canUndoDesign) {
      return;
    }
    if (undoDesignStep()) {
      pulseUndoActive();
    }
  };

  const renderPreviewControls = () => (
    <div className="gb-preview-controls" aria-label="Preview controls">
      <button
        type="button"
        className={`gb-preview-control ${view360 ? "active" : ""}`}
        onClick={handle360Click}
        aria-pressed={view360}
        aria-label={view360 ? "Switch to 2D preview" : "Switch to 3D preview"}
        title={view360 ? "3D preview on" : "3D preview off"}
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
        className={`gb-preview-control gb-preview-control--undo${isUndoActive ? " active" : ""}`}
        onClick={handleUndoClick}
        disabled={!canUndoDesign}
        aria-label="Undo last change"
        title="Undo"
      >
        <img
          src={isUndoActive ? "/images/beads-undo-arrow-active.svg" : "/images/beads-undo-arrow.svg"}
          alt=""
          width={40}
          height={40}
          aria-hidden="true"
        />
      </button>
      <ManualRandomizeButton className="gb-preview-control gb-preview-control--randomize" />
      <BeadsSoundToggleButton className="gb-preview-control gb-preview-control--sound" />
    </div>
  );

  const styleLabel = getBeadStyleLabel(styleId);
  const previewLabel = `${selectedBead?.name || "Bead Bracelet"} · ${styleLabel} · ${displayLengthLabel}`;
  const activeSectionMeta =
    BEEDS_SECTIONS.find((section) => section.id === activeStep) || BEEDS_SECTIONS[0];

  return (
    <div className="theme3-root theme3-root--beeds beeds-configurator-root">
      <div className="theme3-builder">
        <div className="theme3-mobile-preview-label" aria-live="polite">
          <strong>{previewLabel}</strong>
        </div>

        <div className={`theme3-workspace ${sandboxCollapsed ? "sandbox-collapsed" : ""}`}>
          <section
            className="theme3-preview-pane beeds-preview-pane"
            aria-label="Bead bracelet preview"
            onClick={(event) => {
              if (
                event.target.closest(
                  ".beads-2d-drag-hit, .beads-2d-preview.is-ring-dragging, .beads-2d-preview.is-settling, .beads-2d-preview.is-preview-pinching, .gb-preview-controls, .beads-preview-morph, .beads-3d-preview"
                )
              ) {
                return;
              }
              handleSandboxToggle();
            }}
          >
            {renderPreviewControls()}
            <BeadsPreviewMorph previewLabel={previewLabel} />

            <div className="theme3-preview-caption">
              <strong>{previewLabel}</strong>
            </div>
          </section>

          <nav
            className="theme3-section-nav"
            ref={theme3SectionNavRef}
            aria-label="Bead bracelet customization sections"
            style={{ "--theme3-section-count": BEEDS_SECTIONS.length }}
          >
            {BEEDS_SECTIONS.map((section) => (
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
            <div className="theme3-mobile-section-label" aria-live="polite">
              <strong className="theme3-mobile-section-title">{activeSectionMeta.label}</strong>
              <small className="theme3-mobile-section-subtitle">{activeSectionMeta.subtitle}</small>
              <span className="theme3-mobile-caption-text">{previewLabel}</span>
            </div>
          </nav>

          <div
            className="theme3-options-pane beeds-options-pane"
            onClick={() => {
              if (isMobileRef.current) setSandboxCollapsed(true);
            }}
          >
            <BeedsControls
              ref={controlsRef}
              activeSection={activeStep}
              onSectionChange={handleSectionChange}
            />
          </div>
        </div>
      </div>

      {showResetPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
          <div className="confirm-popup">
            <button className="close-cross" type="button" onClick={() => setShowResetPopup(false)}>
              ✕
            </button>
            <p style={{ fontSize: "16px", fontWeight: "700", margin: "10px 0 6px" }}>
              Reset Bead Bracelet?
            </p>
            <p style={{ color: "#666666", fontSize: "13px", marginBottom: "20px" }}>
              You&apos;ll lose your current customizations and start building your own bracelet.
            </p>
            <button
              className="cnfm-btn"
              type="button"
              onClick={() => {
                resetConfiguration();
                setShowResetPopup(false);
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

export default BeedsConfigurator;
