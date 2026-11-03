import Scene from './Scene';
import RingCustomizer from './RingCustomizer';
import RingAiAssistant from "./assistant/RingAiAssistant";
import SoundToggleButton from "./components/SoundToggleButton";
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
import { getSideStoneCarat } from "./utility/storePriceHelper";
import { Base64 } from "js-base64";
import { getPricingAccessState } from "./priceConfig";
import { buildHeadingCssVars, headingFontFamilyName } from "./headingTypography.js";
import { buildButtonCssVars, buttonFontFamilyName } from "./buttonTypography.js";
import { buildBodyCssVars, bodyFontFamilyName } from "./bodyTypography.js";
import { buildLinkCssVars, linkFontFamilyName, linkUnderlineDataAttr } from "./linkTypography.js";

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
  "BAGUETTE-SIDE-STONE": "Baguette",
  "PEAR-SIDE-STONE": "Pear",
  "HALF-MOON-SIDE-STONE": "Half Moon",
  BAGUETTE: "Baguette",
  PEAR: "Pear",
};

const HEAD_STYLE_LABELS = {
  plain: "Classic Prong",
  bezel: "Bezel",
  "hidden-halo": "Hidden Halo",
  "single-halo": "Halo",
  halo: "Halo",
  "double-halo": "Double Halo",
  "three-stone": "Three Stone",
  "two-stone": "Two Stone",
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
     const {
       theme,
       flow,
       showDiamondFilters,
       removeLogo,
       appearance,
       headingTypography,
       buttonTypography,
       bodyTypography,
       linkTypography,
     } = useStoreContext();
     const hasHeadingTypography = Boolean(headingTypography);
     const hasButtonTypography = Boolean(buttonTypography);
     const hasBodyTypography = Boolean(bodyTypography);
     const hasLinkTypography = Boolean(linkTypography);
     const theme3RootClass = (extra = "") => {
       const classes = ["theme3-root", "theme3-root--ring"];
       if (hasHeadingTypography) classes.push("theme3-has-heading-typography");
       if (hasButtonTypography) classes.push("theme3-has-button-typography");
       if (hasBodyTypography) classes.push("theme3-has-body-typography");
       if (hasLinkTypography) classes.push("theme3-has-link-typography");
       const base = classes.join(" ");
       return extra ? `${base} ${extra}`.trim() : base;
     };
     const themeRootDataAttrs = useMemo(() => {
       if (!hasLinkTypography) return undefined;
       const underline =
         linkUnderlineDataAttr(linkTypography?.underlineStyle) || "underline-on-hover";
       return { "data-link-underline": underline };
     }, [linkTypography, hasLinkTypography]);
     const appearanceStyle = useMemo(() => {
       const vars = {
         ...(buildHeadingCssVars(headingTypography) || {}),
         ...(buildButtonCssVars(buttonTypography) || {}),
         ...(buildBodyCssVars(bodyTypography) || {}),
         ...(buildLinkCssVars(linkTypography) || {}),
       };
       if (appearance) {
         if (appearance.primaryColor) vars["--appearance-primary"] = appearance.primaryColor;
         if (appearance.primaryTextColor) vars["--appearance-primary-text"] = appearance.primaryTextColor;
         if (appearance.secondaryColor) vars["--appearance-secondary"] = appearance.secondaryColor;
         if (appearance.secondaryTextColor) vars["--appearance-secondary-text"] = appearance.secondaryTextColor;
         if (appearance.hoverSecondaryColor) {
           vars["--appearance-hover-primary"] = appearance.hoverSecondaryColor;
           vars["--appearance-hover-secondary"] = appearance.hoverSecondaryColor;
         }
       }
       return Object.keys(vars).length ? vars : undefined;
     }, [appearance, headingTypography, buttonTypography, bodyTypography, linkTypography]);

     useEffect(() => {
       if (typeof document === "undefined") return undefined;
       const families = new Set(
         [
           headingFontFamilyName(headingTypography),
           buttonFontFamilyName(buttonTypography),
           bodyFontFamilyName(bodyTypography),
           linkFontFamilyName(linkTypography),
         ].filter(Boolean)
       );
       if (!families.size) return undefined;

       const id = "ring-typography-google-fonts";
       const familyQuery = [...families]
         .map((name) => `family=${encodeURIComponent(name).replace(/%20/g, "+")}:wght@400;500;600;700`)
         .join("&");
       const href = `https://fonts.googleapis.com/css2?${familyQuery}&display=swap`;
       let link = document.getElementById(id);
       if (!link) {
         link = document.createElement("link");
         link.id = id;
         link.rel = "stylesheet";
         document.head.appendChild(link);
       }
       if (link.getAttribute("href") !== href) {
         link.setAttribute("href", href);
       }
       return undefined;
     }, [headingTypography, buttonTypography, bodyTypography, linkTypography]);

     useEffect(() => {
       if (typeof document === "undefined") return;
       const root = document.documentElement;
       if (appearance) {
         if (appearance.primaryColor) root.style.setProperty("--appearance-primary", appearance.primaryColor);
         if (appearance.primaryTextColor) root.style.setProperty("--appearance-primary-text", appearance.primaryTextColor);
         if (appearance.secondaryColor) root.style.setProperty("--appearance-secondary", appearance.secondaryColor);
         if (appearance.secondaryTextColor) root.style.setProperty("--appearance-secondary-text", appearance.secondaryTextColor);
         if (appearance.hoverSecondaryColor) {
           root.style.setProperty("--appearance-hover-primary", appearance.hoverSecondaryColor);
           root.style.setProperty("--appearance-hover-secondary", appearance.hoverSecondaryColor);
         }
       } else {
         root.style.removeProperty("--appearance-primary");
         root.style.removeProperty("--appearance-primary-text");
         root.style.removeProperty("--appearance-secondary");
         root.style.removeProperty("--appearance-secondary-text");
         root.style.removeProperty("--appearance-hover-primary");
         root.style.removeProperty("--appearance-hover-secondary");
       }
     }, [appearance]);
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
    const withTitleSideStoneCarat = (label, carat) =>
      carat > 0 ? `${label} (${carat.toFixed(2)}ctw)` : label;
    const previewStyleLabel = withTitleSideStoneCarat(
      theme3DisplayStyleLabel,
      getSideStoneCarat(parent, "shank", ringShank)
    );
    const previewSettingLabel = withTitleSideStoneCarat(
      theme3DisplaySettingLabel,
      getSideStoneCarat(parent, "head", ringHead)
    );
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
      previewStyleLabel,
      previewSettingLabel,
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
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9.97836 21.1888C5.45562 23.5995 17.6383 25.0637 20.3829 25.04V23.5698L22.6636 25.7829L20.3829 28V26.6227C14.8673 26.8263 1.88503 23.3782 9.69352 20.5169C9.76677 20.7402 9.85629 20.9517 9.95801 21.1493L9.97836 21.1888ZM29.3043 16.642C29.3043 16.1263 29.3999 15.7647 29.5911 15.5592C29.7824 15.3537 30.0733 15.2509 30.466 15.2509C30.6532 15.2509 30.8098 15.2747 30.9299 15.3181C31.0499 15.3636 31.1496 15.4209 31.2249 15.494C31.3022 15.5651 31.3612 15.6422 31.4059 15.7212C31.4507 15.8003 31.4853 15.8931 31.5117 15.9998C31.5646 16.2014 31.589 16.4128 31.589 16.6341C31.589 17.1262 31.5036 17.4878 31.3307 17.715C31.1598 17.9422 30.8647 18.0568 30.4436 18.0568C30.2096 18.0568 30.0184 18.0193 29.8739 17.9482C29.7295 17.8751 29.6095 17.7684 29.5179 17.6281C29.4508 17.5273 29.3979 17.3909 29.3612 17.219C29.3226 17.0432 29.3043 16.8535 29.3043 16.642ZM12.6436 17.0728L10.8125 16.7566C10.9651 16.1915 11.256 15.7568 11.6894 15.4545C12.1207 15.1522 12.7331 15 13.5245 15C14.434 15 15.0891 15.164 15.496 15.494C15.9008 15.824 16.1023 16.2389 16.1023 16.7369C16.1023 17.0293 16.0188 17.2941 15.8561 17.5293C15.6913 17.7664 15.4451 17.9739 15.1135 18.1517C15.382 18.2169 15.5896 18.292 15.7299 18.3789C15.9619 18.5173 16.1409 18.701 16.2691 18.9263C16.3973 19.1535 16.4624 19.4223 16.4624 19.7364C16.4624 20.1316 16.3566 20.509 16.145 20.8726C15.9314 21.2342 15.6262 21.5128 15.2274 21.7085C14.8287 21.9041 14.3037 22.0009 13.6527 22.0009C13.02 22.0009 12.5195 21.9278 12.1553 21.7836C11.7891 21.6393 11.488 21.4279 11.252 21.1473C11.016 20.8687 10.8349 20.5169 10.7087 20.0941L12.6476 19.8431C12.725 20.2225 12.8409 20.4873 13.0017 20.6355C13.1603 20.7817 13.3638 20.8568 13.612 20.8568C13.8704 20.8568 14.0861 20.7639 14.259 20.5802C14.4319 20.3964 14.5174 20.1494 14.5174 19.8412C14.5174 19.527 14.434 19.2839 14.2692 19.112C14.1044 18.9401 13.8785 18.8532 13.5937 18.8532C13.4431 18.8532 13.2336 18.8887 12.9691 18.9638L13.0688 17.6182C13.1746 17.634 13.258 17.6419 13.317 17.6419C13.5673 17.6419 13.7768 17.5629 13.9436 17.4067C14.1105 17.2506 14.1959 17.0669 14.1959 16.8515C14.1959 16.644 14.1328 16.48 14.0067 16.3595C13.8806 16.237 13.7056 16.1757 13.4879 16.1757C13.26 16.1757 13.0769 16.2429 12.9345 16.3753C12.7901 16.5057 12.6944 16.7389 12.6436 17.0728ZM22.5476 16.6341L20.6189 16.8634C20.568 16.6025 20.4846 16.4207 20.3666 16.314C20.2466 16.2073 20.1001 16.154 19.9272 16.154C19.6138 16.154 19.3697 16.3061 19.1968 16.6144C19.0706 16.8377 18.975 17.3099 18.916 18.0351C19.1479 17.8059 19.386 17.6379 19.6281 17.5293C19.8722 17.4206 20.155 17.3653 20.4745 17.3653C21.097 17.3653 21.6219 17.5806 22.0512 18.0114C22.4805 18.4441 22.6961 18.9915 22.6961 19.6534C22.6961 20.1 22.5883 20.5071 22.3706 20.8786C22.1529 21.2481 21.8518 21.5287 21.4673 21.7183C21.0807 21.908 20.5986 22.0029 20.0167 22.0029C19.3188 22.0029 18.7593 21.8883 18.3382 21.6551C17.9171 21.4239 17.5793 21.0564 17.327 20.5505C17.0748 20.0447 16.9486 19.3748 16.9486 18.539C16.9486 17.3178 17.2131 16.4227 17.7441 15.8536C18.2711 15.2845 19.0055 15 19.9455 15C20.5009 15 20.9383 15.0613 21.2598 15.1857C21.5812 15.3102 21.8498 15.494 22.0614 15.7311C22.275 15.9722 22.4378 16.2725 22.5476 16.6341ZM18.9811 19.6534C18.9811 20.021 19.0767 20.3075 19.2659 20.515C19.4572 20.7224 19.6891 20.8272 19.9658 20.8272C20.2201 20.8272 20.4338 20.7323 20.6047 20.5446C20.7756 20.3569 20.861 20.0763 20.861 19.7028C20.861 19.3215 20.7715 19.029 20.5945 18.8295C20.4155 18.6299 20.1957 18.5291 19.9312 18.5291C19.6627 18.5291 19.4348 18.6259 19.2517 18.8216C19.0706 19.0152 18.9811 19.2918 18.9811 19.6534ZM23.1092 18.4718C23.1092 17.1854 23.3472 16.2844 23.8253 15.7706C24.3014 15.2569 25.0297 15 26.0043 15C26.4743 15 26.8588 15.0573 27.1599 15.168C27.461 15.2806 27.7072 15.4268 27.8964 15.6066C28.0876 15.7864 28.2382 15.9761 28.346 16.1737C28.4559 16.3733 28.5434 16.6045 28.6105 16.8693C28.7407 17.3732 28.8058 17.9007 28.8058 18.4501C28.8058 19.6791 28.5922 20.5762 28.1629 21.1453C27.7357 21.7144 26.9992 21.9989 25.9514 21.9989C25.3654 21.9989 24.8914 21.908 24.5293 21.7263C24.1671 21.5445 23.8721 21.2777 23.6402 20.926C23.4733 20.677 23.3411 20.3371 23.2475 19.9044C23.1559 19.4736 23.1092 18.9954 23.1092 18.4718ZM25.0277 18.4758C25.0277 19.3373 25.105 19.9261 25.2637 20.2423C25.4204 20.5584 25.6482 20.7145 25.9473 20.7145C26.1447 20.7145 26.3135 20.6474 26.458 20.515C26.6024 20.3806 26.7082 20.1672 26.7754 19.8787C26.8445 19.5882 26.8771 19.1377 26.8771 18.5252C26.8771 17.6261 26.7998 17.0234 26.6411 16.7112C26.4844 16.4029 26.2484 16.2468 25.9351 16.2468C25.6137 16.2468 25.3838 16.4049 25.2393 16.7191C25.0989 17.0372 25.0277 17.6221 25.0277 18.4758ZM30.0733 16.644C30.0733 16.9898 30.1038 17.225 30.1669 17.3514C30.23 17.4779 30.3215 17.5411 30.4416 17.5411C30.5209 17.5411 30.5881 17.5154 30.6471 17.4601C30.704 17.4067 30.7467 17.3218 30.7752 17.2052C30.8017 17.0886 30.8159 16.9088 30.8159 16.6638C30.8159 16.3041 30.7854 16.0611 30.7223 15.9366C30.6593 15.8121 30.5657 15.7509 30.4395 15.7509C30.3114 15.7509 30.2178 15.8141 30.1608 15.9406C30.1018 16.067 30.0733 16.3022 30.0733 16.644ZM29.4955 20.9734C31.644 22.0345 31.1313 23.5402 27.3267 24.4551C26.2484 24.7139 25.0297 24.9491 23.6931 25.0459V26.2414C25.1803 26.1406 26.5638 25.8086 27.7743 25.5241C33.4954 24.1784 33.296 21.7756 29.6786 20.4201C29.6278 20.6157 29.5667 20.7995 29.4955 20.9734Z"
            fill="currentColor"
          />
        </svg>
      </button>
      {includeView && (
        <button
          type="button"
          className={`gb-preview-control ${isViewActive ? "active" : ""}`}
          onClick={handleClickView}
          title="Change view"
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M20.1484 7.1875L19.9684 7.5L18.2252 10.5155H19.5234V21.2605L10.2177 26.633L9.56844 25.5085L7.64844 28.8382H8.00869L11.4922 28.8403L10.8427 27.7157L20.1484 22.3433L29.4542 27.7157L28.8047 28.8403L32.6484 28.8382L32.4684 28.5257L30.7284 25.5085L30.0792 26.6332L20.7734 21.2607V10.5152H22.0717L20.1484 7.1875Z"
              fill="currentColor"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M19.9267 12.5502L12.6152 17.345C12.4467 17.4667 12.4014 17.6052 12.3984 17.7312V24.8962C12.3984 25.0537 12.4804 25.2002 12.6152 25.2825L19.9267 30.077C20.1029 30.1732 20.2822 30.157 20.4012 30.0745L27.7092 25.2825C27.7754 25.2421 27.8301 25.1853 27.868 25.1177C27.906 25.05 27.9259 24.9738 27.9259 24.8962V17.7312C27.9244 17.5402 27.8434 17.4395 27.7022 17.3402L20.3977 12.5502C20.2237 12.451 20.0872 12.4982 19.9267 12.5502ZM20.1622 13.4652L26.5409 17.6917L20.1582 21.9932L13.7197 17.731L20.1622 13.4652ZM13.3022 18.536L19.7102 22.78V28.8862L13.3027 24.6422L13.3022 18.536ZM27.0222 18.536V24.642L20.6142 28.886V22.7795L27.0222 18.536Z"
              fill="currentColor"
            />
          </svg>
        </button>
      )}
      <SoundToggleButton className="gb-preview-control gb-preview-control--sound" />
      {includeShare && (
        <button
          type="button"
          className="gb-preview-control gb-share-control"
          onClick={() => setShare(true)}
          title="Share"
          aria-label="Share"
        >
          <svg width="20" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path
              d="M8.4089 1.29408C8.58045 1.29408 8.74498 1.36223 8.86628 1.48354C8.98759 1.60484 9.05573 1.76937 9.05573 1.94092C9.05573 2.11247 8.98759 2.277 8.86628 2.3983C8.74498 2.51961 8.58045 2.58776 8.4089 2.58776H3.88103C3.19482 2.58776 2.53672 2.86035 2.05149 3.34558C1.56627 3.8308 1.29368 4.4889 1.29368 5.17511V15.5245C1.29368 16.2107 1.56627 16.8688 2.05149 17.3541C2.53672 17.8393 3.19482 18.1119 3.88103 18.1119H14.2304C14.9167 18.1119 15.5748 17.8393 16.06 17.3541C16.5452 16.8688 16.8178 16.2107 16.8178 15.5245V13.584C16.8178 13.4125 16.8859 13.2479 17.0072 13.1266C17.1286 13.0053 17.2931 12.9372 17.4646 12.9372C17.6362 12.9372 17.8007 13.0053 17.922 13.1266C18.0433 13.2479 18.1115 13.4125 18.1115 13.584V15.5245C18.1115 16.5538 17.7026 17.541 16.9747 18.2688C16.2469 18.9967 15.2598 19.4056 14.2304 19.4056H3.88103C2.85172 19.4056 1.86456 18.9967 1.13673 18.2688C0.408893 17.541 0 16.5538 0 15.5245V5.17511C0 4.1458 0.408893 3.15864 1.13673 2.43081C1.86456 1.70298 2.85172 1.29408 3.88103 1.29408H8.4089ZM13.321 0.0560338C13.4352 0.0051196 13.5617 -0.0115908 13.6853 0.00792541C13.8088 0.0274416 13.924 0.0823477 14.017 0.165996L20.4854 5.98754C20.5529 6.0482 20.6069 6.1224 20.6439 6.20532C20.6809 6.28823 20.7 6.378 20.7 6.46879C20.7 6.55957 20.6809 6.64934 20.6439 6.73226C20.6069 6.81517 20.5529 6.88937 20.4854 6.95004L14.017 12.7716C13.924 12.8555 13.8087 12.9106 13.6851 12.9302C13.5614 12.9499 13.4347 12.9332 13.3204 12.8822C13.206 12.8313 13.1089 12.7482 13.0408 12.6432C12.9727 12.5381 12.9366 12.4155 12.9368 12.2903V9.49599C11.1256 9.66158 9.48912 10.5051 8.15016 11.5762C6.83708 12.628 5.85389 13.8634 5.31054 14.7897L5.10614 15.1662C5.04093 15.2963 4.93374 15.4006 4.8019 15.4623C4.67006 15.5239 4.52127 15.5393 4.3796 15.506C4.23793 15.4726 4.11165 15.3924 4.02118 15.2784C3.93071 15.1644 3.88133 15.0232 3.88103 14.8777C3.88103 12.2269 4.37521 9.33558 5.84483 7.08458C7.25752 4.92673 9.53181 3.41959 12.9368 3.25141V0.647244L12.9432 0.552806C12.9592 0.444861 13.0022 0.342706 13.0682 0.255849C13.1343 0.168991 13.2212 0.100254 13.321 0.0560338ZM14.2304 3.88143C14.2304 4.05299 14.1623 4.21751 14.041 4.33882C13.9197 4.46012 13.7552 4.52827 13.5836 4.52827C10.2356 4.52827 8.17992 5.88017 6.92893 7.79222C6.04276 9.14929 5.54082 10.8194 5.31701 12.5581C5.87717 11.8854 6.55894 11.1946 7.34161 10.5659C8.982 9.25407 11.1256 8.17127 13.5836 8.17127C13.7552 8.17127 13.9197 8.23941 14.041 8.36072C14.1623 8.48203 14.2304 8.64655 14.2304 8.8181V10.8362L19.0817 6.46879L14.2304 2.10004V3.88143Z"
              fill="currentColor"
            />
          </svg>
        </button>
      )}
      <button
        type="button"
        className="gb-preview-control gb-ai-control"
        onClick={() => window.dispatchEvent(new Event("ring-ai-toggle"))}
        title="Ask AI"
        aria-label="Ask AI"
      >
        <svg width="20" height="20" viewBox="0 0 19 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M13.623 2.48228C13.6268 2.38158 13.7284 2.34036 13.8151 2.37127C13.9448 2.58766 13.9752 2.84434 14.0525 3.08087C14.1963 3.62935 14.6525 4.07806 15.1973 4.22841C15.408 4.2982 15.6328 4.31366 15.8408 4.38954C15.9546 4.45839 15.8867 4.61764 15.7673 4.62467C15.3898 4.71179 14.993 4.7783 14.6745 5.01577C14.3125 5.18298 14.1663 5.57549 14.0343 5.92256C13.9331 6.14129 13.9228 6.38485 13.8745 6.61717C13.8019 6.63591 13.7261 6.64059 13.6521 6.63169C13.5368 6.38064 13.5326 6.09399 13.4193 5.84059C13.3425 5.54879 13.1944 5.26776 12.9453 5.0879C12.7214 4.93848 12.482 4.80406 12.2179 4.74036C12.0305 4.67947 11.831 4.66823 11.6455 4.60312C11.5551 4.52818 11.6033 4.3886 11.7026 4.34926C12.1228 4.26167 12.5565 4.15816 12.9214 3.92162C13.3813 3.59001 13.5064 3.00265 13.623 2.48228Z" />
          <path d="M7.79099 4.12836C7.8767 4.07777 7.98677 4.1054 8.05609 4.17192C8.17975 4.26278 8.1849 4.42765 8.21488 4.56489C8.33244 5.13913 8.45469 5.71524 8.66687 6.26325C8.80691 6.75271 9.0575 7.22156 9.43642 7.56723C9.63033 7.74943 9.79801 7.96723 10.0416 8.08761C10.4992 8.38644 11.0299 8.53819 11.547 8.69885C11.9812 8.83889 12.4388 8.8848 12.8786 9.00142C13.1062 9.06653 13.1348 9.47168 12.8776 9.51056C12.4467 9.59815 12.0088 9.66231 11.5905 9.80189C11.1479 9.90587 10.7109 10.0497 10.3123 10.2707C9.96757 10.4937 9.61488 10.7176 9.339 11.0262C9.213 11.1579 9.13993 11.3274 9.03876 11.4768C8.75773 11.8885 8.613 12.3724 8.47858 12.8469C8.34274 13.3106 8.25188 13.786 8.15867 14.259C8.07623 14.4956 7.67061 14.4604 7.62096 14.2178C7.46733 13.5077 7.32916 12.7888 7.05656 12.112C6.93853 11.7471 6.75726 11.3991 6.50106 11.112C6.31886 10.904 6.13572 10.6885 5.89637 10.5438C5.67342 10.4089 5.4678 10.2417 5.22143 10.1499C4.9315 10.0206 4.63502 9.90681 4.32682 9.83C3.86218 9.67496 3.36804 9.64545 2.90012 9.50447C2.70106 9.46325 2.66265 9.11946 2.86312 9.05154C3.19567 8.91103 3.56195 8.88245 3.90761 8.78409C4.30059 8.67074 4.7137 8.60517 5.07764 8.40939C5.59427 8.20611 6.10481 7.9307 6.45563 7.48808C6.79895 7.09135 6.98537 6.5944 7.19427 6.12086C7.40082 5.5499 7.50996 4.95037 7.62331 4.35599C7.63736 4.25716 7.70106 4.17192 7.79099 4.12836Z" />
          <path d="M12.8806 12.1255C12.942 12.0248 13.0792 12.0426 13.1757 12.0703C13.2501 12.2534 13.267 12.4529 13.3162 12.6436C13.3949 13.0084 13.5359 13.3588 13.7246 13.6806C13.9565 14.0141 14.2951 14.2703 14.674 14.4131C14.9682 14.5017 15.2576 14.6117 15.5626 14.66C15.6642 14.6829 15.7864 14.6909 15.8516 14.785C15.9513 14.875 15.8525 15.0272 15.7405 15.0464C15.4 15.1415 15.0431 15.1869 14.7181 15.333C14.4609 15.4487 14.1963 15.5696 14 15.778C13.6038 16.1869 13.4103 16.7447 13.3031 17.2932C13.2703 17.4333 13.2787 17.6019 13.1686 17.7096C13.0745 17.7579 12.9059 17.7541 12.8722 17.6314C12.7813 17.1686 12.6633 16.7082 12.4783 16.274C12.3747 16.023 12.1537 15.8543 11.9686 15.6665C11.5232 15.2871 10.9307 15.1906 10.3794 15.0604C10.1893 15.0483 10.1757 14.7326 10.3705 14.7166C10.8057 14.6211 11.2595 14.5508 11.6497 14.3204C11.9485 14.186 12.1808 13.9457 12.3752 13.6881C12.5902 13.3967 12.6487 13.0314 12.7499 12.6923C12.8066 12.5063 12.8249 12.3115 12.8806 12.1255Z" />
        </svg>
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
      <div className={theme3RootClass("preview-model-only")} style={appearanceStyle} {...themeRootDataAttrs}>
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

  const isRemoveLogo =
    removeLogo === true ||
    String(removeLogo ?? "").trim().toLowerCase() === "true" ||
    removeLogo === 1 ||
    removeLogo === "1" ||
    Boolean(getPricingAccessState().removeLogo);

  if (isTheme3) {
    return (
      <div
        className={theme3RootClass()}
        data-remove-logo={isRemoveLogo ? "true" : "false"}
        style={appearanceStyle}
        {...themeRootDataAttrs}
        onDragOver={allowTheme3FileDrop}
        onDrop={allowTheme3FileDrop}
      >
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

              <div className="theme3-preview-caption theme3-body-text">
                <strong className="theme3-body-text">{diamondWisePreviewLabel || previewLabel}</strong>
              </div>
              {!isRemoveLogo && (
                <img
                  className="theme3-powered-by-keyideas"
                  src="/logo_keyideas.svg"
                  alt="Powered by Keyideas"
                />
              )}
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
                onResetClick={handleResetClick}
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
         <div className={`gb-builder-shell ${isModelOnlyPreview ? "preview-model-only" : ""}`} style={appearanceStyle}>

            <div className={`ring-filter-section-main gb-preview-pane ${isModelOnlyPreview ? "model-only" : ""}`}>

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
                  <div className="gb-preview-label theme3-body-text">{previewLabel}</div>
               )}

            </div>

            {!isModelOnlyPreview && (
              <div className="gb-options-pane">
                 <LocalPriceSummary />
                 <RingCustomizer ref={ringCustomizerRef} onResetClick={handleResetClick} />
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
