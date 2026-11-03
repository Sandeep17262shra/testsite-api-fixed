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
import { SoundToggleButton } from "../beeds-configurator/components/BeadsSoundToggleButton";
import { useTheme3Appearance } from "@/lib/ring-configurator/theme3Appearance";

const isModelOnlyPreview =
  typeof window !== "undefined" &&
  (new URLSearchParams(window.location.search).get("preview") === "model-only" ||
   (window.self !== window.top && document.referrer && (() => {
     try { return new URL(document.referrer).searchParams.get("preview") === "model-only"; } catch { return false; }
   })()));

function NecklaceConfigurator() {
  const { view360, setView360 } = useContext(View360Context);
  const { parent, setShare } = useContext(ShareContext);
  const isKeyideasParent = (parent || "").toLowerCase().includes("keyideasinfotech");

  const {
    jewelryType, setJewelryType,
    setCameraView,
    showResetPopup, setShowResetPopup,
    showPopup2, setShowPopup2,
    selectedBracelet, braceletPath, braceletMetal, braceletPurity, braceletSize, chainLength, namePendant, charms,
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
    try {
      window.parent?.postMessage({ type: "jewelry-frame:ready", app: "necklace" }, "*");
    } catch {}
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

    // The Text/Charms toggle can change scrollHeight without emitting a scroll
    // event. Read the dimensions at input time so a stale "at bottom" value
    // cannot swallow the first downward scroll after that layout change.
    const getPanelBounds = () => ({
      atBottom: panelScroll.scrollTop + panelScroll.clientHeight >= panelScroll.scrollHeight - 5,
      atTop: panelScroll.scrollTop <= 5,
    });

    const handleWheel = (e) => {
      const { atBottom, atTop } = getPanelBounds();
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
      const { atBottom, atTop } = getPanelBounds();
      if (!atBottom && !atTop) { lastTouchY = null; return; }
      lastTouchY = e.touches[0]?.clientY ?? null;
    };
    const handleTouchMove = (e) => {
      const { atBottom, atTop } = getPanelBounds();
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

  const handleSandboxToggle = useCallback(() => {
    if (isMobileRef.current) setSandboxCollapsed(false);
  }, []);

  const handleSectionChange = useCallback((sectionId) => {
    setActiveStep(sectionId);
  }, []);

  // Compute live preview title caption
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
  const { theme3RootClassName, themeRootDataAttrs, appearanceStyle } = useTheme3Appearance(
    "theme3-root--jewelry"
  );
  const theme3RootProps = {
    className: theme3RootClassName,
    style: appearanceStyle,
    ...themeRootDataAttrs,
  };

  const previewLabel = isBracelet
    ? (() => {
        const hasNoPurity = metalName === "Platinum" || metalName === "Silver 925";
        const purityName = hasNoPurity ? "" : (braceletPurity || "");
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
        const hasNoPurity = metalName === "Platinum" || metalName === "Silver 925";
        const purityName = hasNoPurity ? "" : (braceletPurity || "");
        const lengthName = chainLength ? `${chainLength}"` : "";
        const pendantName =
          namePendant.enabled && namePendant.text.trim()
            ? `${namePendant.text} Pendant`
            : "";
        const details = [lengthName, charmsName].filter(Boolean).join(", ");
        return [purityName, chainName, metalName, pendantName, details ? `(${details})` : ""].filter(Boolean).join(" ") + " Necklace";
      })();

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
<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.97836 21.1888C5.45562 23.5995 17.6383 25.0637 20.3829 25.04V23.5698L22.6636 25.7829L20.3829 28V26.6227C14.8673 26.8263 1.88503 23.3782 9.69352 20.5169C9.76677 20.7402 9.85629 20.9517 9.95801 21.1493L9.97836 21.1888ZM29.3043 16.642C29.3043 16.1263 29.3999 15.7647 29.5911 15.5592C29.7824 15.3537 30.0733 15.2509 30.466 15.2509C30.6532 15.2509 30.8098 15.2747 30.9299 15.3181C31.0499 15.3636 31.1496 15.4209 31.2249 15.494C31.3022 15.5651 31.3612 15.6422 31.4059 15.7212C31.4507 15.8003 31.4853 15.8931 31.5117 15.9998C31.5646 16.2014 31.589 16.4128 31.589 16.6341C31.589 17.1262 31.5036 17.4878 31.3307 17.715C31.1598 17.9422 30.8647 18.0568 30.4436 18.0568C30.2096 18.0568 30.0184 18.0193 29.8739 17.9482C29.7295 17.8751 29.6095 17.7684 29.5179 17.6281C29.4508 17.5273 29.3979 17.3909 29.3612 17.219C29.3226 17.0432 29.3043 16.8535 29.3043 16.642ZM12.6436 17.0728L10.8125 16.7566C10.9651 16.1915 11.256 15.7568 11.6894 15.4545C12.1207 15.1522 12.7331 15 13.5245 15C14.434 15 15.0891 15.164 15.496 15.494C15.9008 15.824 16.1023 16.2389 16.1023 16.7369C16.1023 17.0293 16.0188 17.2941 15.8561 17.5293C15.6913 17.7664 15.4451 17.9739 15.1135 18.1517C15.382 18.2169 15.5896 18.292 15.7299 18.3789C15.9619 18.5173 16.1409 18.701 16.2691 18.9263C16.3973 19.1535 16.4624 19.4223 16.4624 19.7364C16.4624 20.1316 16.3566 20.509 16.145 20.8726C15.9314 21.2342 15.6262 21.5128 15.2274 21.7085C14.8287 21.9041 14.3037 22.0009 13.6527 22.0009C13.02 22.0009 12.5195 21.9278 12.1553 21.7836C11.7891 21.6393 11.488 21.4279 11.252 21.1473C11.016 20.8687 10.8349 20.5169 10.7087 20.0941L12.6476 19.8431C12.725 20.2225 12.8409 20.4873 13.0017 20.6355C13.1603 20.7817 13.3638 20.8568 13.612 20.8568C13.8704 20.8568 14.0861 20.7639 14.259 20.5802C14.4319 20.3964 14.5174 20.1494 14.5174 19.8412C14.5174 19.527 14.434 19.2839 14.2692 19.112C14.1044 18.9401 13.8785 18.8532 13.5937 18.8532C13.4431 18.8532 13.2336 18.8887 12.9691 18.9638L13.0688 17.6182C13.1746 17.634 13.258 17.6419 13.317 17.6419C13.5673 17.6419 13.7768 17.5629 13.9436 17.4067C14.1105 17.2506 14.1959 17.0669 14.1959 16.8515C14.1959 16.644 14.1328 16.48 14.0067 16.3595C13.8806 16.237 13.7056 16.1757 13.4879 16.1757C13.26 16.1757 13.0769 16.2429 12.9345 16.3753C12.7901 16.5057 12.6944 16.7389 12.6436 17.0728ZM22.5476 16.6341L20.6189 16.8634C20.568 16.6025 20.4846 16.4207 20.3666 16.314C20.2466 16.2073 20.1001 16.154 19.9272 16.154C19.6138 16.154 19.3697 16.3061 19.1968 16.6144C19.0706 16.8377 18.975 17.3099 18.916 18.0351C19.1479 17.8059 19.386 17.6379 19.6281 17.5293C19.8722 17.4206 20.155 17.3653 20.4745 17.3653C21.097 17.3653 21.6219 17.5806 22.0512 18.0114C22.4805 18.4441 22.6961 18.9915 22.6961 19.6534C22.6961 20.1 22.5883 20.5071 22.3706 20.8786C22.1529 21.2481 21.8518 21.5287 21.4673 21.7183C21.0807 21.908 20.5986 22.0029 20.0167 22.0029C19.3188 22.0029 18.7593 21.8883 18.3382 21.6551C17.9171 21.4239 17.5793 21.0564 17.327 20.5505C17.0748 20.0447 16.9486 19.3748 16.9486 18.539C16.9486 17.3178 17.2131 16.4227 17.7441 15.8536C18.2711 15.2845 19.0055 15 19.9455 15C20.5009 15 20.9383 15.0613 21.2598 15.1857C21.5812 15.3102 21.8498 15.494 22.0614 15.7311C22.275 15.9722 22.4378 16.2725 22.5476 16.6341ZM18.9811 19.6534C18.9811 20.021 19.0767 20.3075 19.2659 20.515C19.4572 20.7224 19.6891 20.8272 19.9658 20.8272C20.2201 20.8272 20.4338 20.7323 20.6047 20.5446C20.7756 20.3569 20.861 20.0763 20.861 19.7028C20.861 19.3215 20.7715 19.029 20.5945 18.8295C20.4155 18.6299 20.1957 18.5291 19.9312 18.5291C19.6627 18.5291 19.4348 18.6259 19.2517 18.8216C19.0706 19.0152 18.9811 19.2918 18.9811 19.6534ZM23.1092 18.4718C23.1092 17.1854 23.3472 16.2844 23.8253 15.7706C24.3014 15.2569 25.0297 15 26.0043 15C26.4743 15 26.8588 15.0573 27.1599 15.168C27.461 15.2806 27.7072 15.4268 27.8964 15.6066C28.0876 15.7864 28.2382 15.9761 28.346 16.1737C28.4559 16.3733 28.5434 16.6045 28.6105 16.8693C28.7407 17.3732 28.8058 17.9007 28.8058 18.4501C28.8058 19.6791 28.5922 20.5762 28.1629 21.1453C27.7357 21.7144 26.9992 21.9989 25.9514 21.9989C25.3654 21.9989 24.8914 21.908 24.5293 21.7263C24.1671 21.5445 23.8721 21.2777 23.6402 20.926C23.4733 20.677 23.3411 20.3371 23.2475 19.9044C23.1559 19.4736 23.1092 18.9954 23.1092 18.4718ZM25.0277 18.4758C25.0277 19.3373 25.105 19.9261 25.2637 20.2423C25.4204 20.5584 25.6482 20.7145 25.9473 20.7145C26.1447 20.7145 26.3135 20.6474 26.458 20.515C26.6024 20.3806 26.7082 20.1672 26.7754 19.8787C26.8445 19.5882 26.8771 19.1377 26.8771 18.5252C26.8771 17.6261 26.7998 17.0234 26.6411 16.7112C26.4844 16.4029 26.2484 16.2468 25.9351 16.2468C25.6137 16.2468 25.3838 16.4049 25.2393 16.7191C25.0989 17.0372 25.0277 17.6221 25.0277 18.4758ZM30.0733 16.644C30.0733 16.9898 30.1038 17.225 30.1669 17.3514C30.23 17.4779 30.3215 17.5411 30.4416 17.5411C30.5209 17.5411 30.5881 17.5154 30.6471 17.4601C30.704 17.4067 30.7467 17.3218 30.7752 17.2052C30.8017 17.0886 30.8159 16.9088 30.8159 16.6638C30.8159 16.3041 30.7854 16.0611 30.7223 15.9366C30.6593 15.8121 30.5657 15.7509 30.4395 15.7509C30.3114 15.7509 30.2178 15.8141 30.1608 15.9406C30.1018 16.067 30.0733 16.3022 30.0733 16.644ZM29.4955 20.9734C31.644 22.0345 31.1313 23.5402 27.3267 24.4551C26.2484 24.7139 25.0297 24.9491 23.6931 25.0459V26.2414C25.1803 26.1406 26.5638 25.8086 27.7743 25.5241C33.4954 24.1784 33.296 21.7756 29.6786 20.4201C29.6278 20.6157 29.5667 20.7995 29.4955 20.9734Z" fill="currentColor"></path></svg>
      </button>
      <button
        type="button"
        className={`gb-preview-control ${isViewActive ? "active" : ""}`}
        onClick={handleClickView}
        title="Change view"
        aria-label="Change view angle"
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
      {includeReset && (
        <button
          type="button"
          className={`gb-preview-control gb-preview-control--reset ${isResetActive ? "active" : ""}`}
          onClick={handleResetClick}
          title="Reset"
          aria-label={`Reset ${jewelryType}`}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M29 15.5A10 10 0 1 0 30 24M29 15.5v-5.2m0 5.2h-5.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
          aria-label={`Share ${jewelryType}`}
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
    <div {...theme3RootProps}>
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


            {renderPreviewControls({ includeReset: false })}
            {isBracelet ? <BraceletScene /> : <NecklaceScene />}
            <div className={`theme3-model-loading ${isSwitchingJewelryType ? "is-visible" : ""}`} aria-hidden="true" />

            <div className="theme3-preview-caption">
              <strong>{previewLabel}</strong>
            </div>
          </section>

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
