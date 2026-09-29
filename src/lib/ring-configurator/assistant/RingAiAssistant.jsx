import React, { startTransition, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DiamondContext } from "../contexts/DiamondContext";
import { LoaderContext } from "../contexts/LoaderContext";
import { RingContext } from "../contexts/RingContext";
import { SectionContext } from "../contexts/SectionContext";
import { ShareContext } from "../contexts/ShareContext";
import { CameraViewContext } from "../contexts/CameraViewContext";
import { View360Context } from "../contexts/View360Context";
import initialPrice from "../data/data.json";
import {
  fetchRemoteRingIntent,
  resolveRingAssistantConfig,
  shouldUseRemoteRingIntent,
} from "./ringAssistantResolver";
import {
  getDefaultQuality,
  getDiamondPrice,
  getHeadPrice,
  getMetalPrice,
  getShankPrice,
  getDefaultCarat,
} from "../utility/storePriceHelper";
import { getRingSizeType } from "../utility/Parentconfig";

function SendIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 8H12M12 8L8.9 4.9M12 8L8.9 11.1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="ring-ai-sparkle"
    >
      <path
        d="M5 2.5L5.7 5.2L8.4 6L5.7 6.8L5 9.5L4.2 6.8L1.5 6L4.2 5.2L5 2.5Z"
        fill="currentColor"
      />
      <path
        d="M11.4 6.6L11.9 8.45L13.75 8.95L11.9 9.45L11.4 11.3L10.9 9.45L9.05 8.95L10.9 8.45L11.4 6.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function AssistantAvatar() {
  return (
    <span className="ring-ai-message-avatar" aria-hidden="true">
      <img src="/images/keyideas-ai-logo.jpg" alt="" />
    </span>
  );
}

function RingAiPortal({ target, children }) {
  return target ? createPortal(children, target) : children;
}

function TripleSparkleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="ring-ai-title-sparkles"
    >
      <path d="M4.35 2.1L5.15 5.2L8.25 6L5.15 6.8L4.35 9.9L3.55 6.8L0.45 6L3.55 5.2L4.35 2.1Z" fill="currentColor" />
      <path d="M10.95 2L11.35 3.55L12.9 3.95L11.35 4.35L10.95 5.9L10.55 4.35L9 3.95L10.55 3.55L10.95 2Z" fill="currentColor" />
      <path d="M10.95 8.25L11.35 9.8L12.9 10.2L11.35 10.6L10.95 12.15L10.55 10.6L9 10.2L10.55 9.8L10.95 8.25Z" fill="currentColor" />
    </svg>
  );
}

function UserArrowIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="ring-ai-user-arrow"
    >
      <path
        d="M2.5 9.5L9.5 2.5M9.5 2.5H5M9.5 2.5V7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const HEAD_LABELS = {
  plain: "Solitaire",
  bezel: "Bezel",
  "hidden-halo": "Hidden Halo",
  "single-halo": "Halo",
  "double-halo": "Double Halo",
  "three-stone": "Three Stone",
};

const METAL_COLOR_LABELS = {
  "#DBDBDB": "White Gold",
  "#FFBAA3": "Rose Gold",
  "#e5e4e2": "Platinum",
  "#8C8C8C": "Titanium",
  "#8c8c8c": "Titanium",
  "#D8D8D8": "Sterling Silver",
  "#d8d8d8": "Sterling Silver",
};

const SUMMARY_COPY = {
  en: {
    iSet: "I set",
    head: "head",
    ct: "ct",
    matchingBand: "matching band",
    engraving: "engraving",
    metals: {
      yellow: "Yellow Gold",
      white: "White Gold",
      rose: "Rose Gold",
      platinum: "Platinum",
      titanium: "Titanium",
      silver: "Sterling Silver",
    },
  },
  it: {
    iSet: "Ho impostato",
    head: "testa",
    ct: "ct",
    matchingBand: "fedina abbinata",
    engraving: "incisione",
    metals: {
      yellow: "Oro Giallo",
      white: "Oro Bianco",
      rose: "Oro Rosa",
      platinum: "Platino",
    },
  },
  de: {
    iSet: "Ich habe eingestellt",
    head: "Kopf",
    ct: "ct",
    matchingBand: "passender Bandring",
    engraving: "Gravur",
    metals: {
      yellow: "Gelbgold",
      white: "Weissgold",
      rose: "Roségold",
      platinum: "Platin",
    },
  },
  es: {
    iSet: "He configurado",
    head: "cabeza",
    ct: "ct",
    matchingBand: "alianza a juego",
    engraving: "grabado",
    metals: {
      yellow: "Oro Amarillo",
      white: "Oro Blanco",
      rose: "Oro Rosa",
      platinum: "Platino",
    },
  },
  fr: {
    iSet: "J'ai configure",
    head: "tete",
    ct: "ct",
    matchingBand: "anneau assorti",
    engraving: "gravure",
    metals: {
      yellow: "Or Jaune",
      white: "Or Blanc",
      rose: "Or Rose",
      platinum: "Platine",
    },
  },
  pt: {
    iSet: "Configurei",
    head: "cabeca",
    ct: "ct",
    matchingBand: "alianca combinando",
    engraving: "gravacao",
    metals: {
      yellow: "Ouro Amarelo",
      white: "Ouro Branco",
      rose: "Ouro Rosa",
      platinum: "Platina",
    },
  },
  nl: {
    iSet: "Ik heb ingesteld",
    head: "kop",
    ct: "ct",
    matchingBand: "bijpassende band",
    engraving: "gravure",
    metals: {
      yellow: "Geelgoud",
      white: "Witgoud",
      rose: "Roségoud",
      platinum: "Platina",
    },
  },
};

const PROCESSING_DELAY_MS = 1500;
const STARTER_PROMPTS = [
  "Build an engagement ring",
  "Design a solitaire ring",
  "Create a halo ring",
  "Find a vintage-inspired ring",
];

const ASSISTANT_COPY = {
  en: {
    title: "ASK AI",
    subtitle: "Design your perfect ring with AI.",
    reset: "Reset",
    welcome:
      "Hi! I'm here to help you design the perfect ring. Tell me about your preferences or what you're looking for, and I'll suggest the best options.",
    empty: "Type a ring request first so I can configure it for you.",
    error:
      "I couldn't apply that request. Try a simpler ring description or mention the main choices like shape, metal, and budget.",
    poweredBy: "POWERED BY KEYIDEAS",
    welcomeTitle: "Welcome!",
    welcomeListTitle: "I can help you with:",
    welcomeBullets: [
      "Choose the right ring style",
      "Match metals and gemstones",
      "Personalize your ring design",
      "Recommend the best combination",
    ],
    placeholder: "Design a ring for an event...",
  },
  it: {
    title: "ASK AI",
    subtitle: "Progetta il tuo anello perfetto con l'AI.",
    reset: "Reset",
    welcome:
      "Ciao! Ti aiuto a creare l'anello perfetto. Dimmi le tue preferenze o cosa stai cercando e ti suggeriro le opzioni migliori.",
    empty: "Scrivi prima una richiesta per l'anello cosi posso configurarlo.",
    error:
      "Non sono riuscito ad applicare questa richiesta. Prova con una descrizione piu semplice oppure indica forma, metallo e budget.",
    poweredBy: "POWERED BY KEYIDEAS",
    welcomeTitle: "Benvenuto!",
    welcomeListTitle: "Posso aiutarti a:",
    welcomeBullets: [
      "Scegliere lo stile giusto",
      "Abbinare metalli e gemme",
      "Personalizzare il design",
      "Suggerire la combinazione migliore",
    ],
    placeholder: "Progetta un anello per un evento...",
  },
  de: {
    title: "ASK AI",
    subtitle: "Entwirf deinen perfekten Ring mit KI.",
    reset: "Reset",
    welcome:
      "Hallo! Ich helfe dir dabei, den perfekten Ring zu gestalten. Sag mir einfach deine Wuensche oder wonach du suchst, und ich schlage passende Optionen vor.",
    empty: "Bitte gib zuerst einen Ringwunsch ein, damit ich ihn konfigurieren kann.",
    error:
      "Ich konnte diese Anfrage nicht anwenden. Versuche es mit einer einfacheren Beschreibung oder nenne Form, Metall und Budget.",
    poweredBy: "POWERED BY KEYIDEAS",
    welcomeTitle: "Willkommen!",
    welcomeListTitle: "Ich kann dir helfen bei:",
    welcomeBullets: [
      "Dem passenden Ringstil",
      "Metall- und Stein-Kombinationen",
      "Der Personalisierung",
      "Der besten Zusammenstellung",
    ],
    placeholder: "Entwirf einen Ring fuer einen Anlass...",
  },
};

function RingAiAssistant({ portalTargetId = "" }) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: ASSISTANT_COPY.en.welcome,
    },
  ]);
  const [isApplying, setIsApplying] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcomeIntro, setShowWelcomeIntro] = useState(false);
  const threadRef = useRef(null);
  const composerRef = useRef(null);
  const inputRef = useRef(null);
  const requestTokenRef = useRef(0);
  const undoConfigRef = useRef(null);
  const [portalTarget, setPortalTarget] = useState(null);

  const { parent, language } = useContext(ShareContext);
  const { setLoader, setResetObj } = useContext(LoaderContext);
  const { setCameraView } = useContext(CameraViewContext);
  const { setView360 } = useContext(View360Context);
  const copy = ASSISTANT_COPY[language] ?? ASSISTANT_COPY.en;

  const {
    ringShank,
    ringSideSetting,
    ringMatchingBand,
    ringBand,
    metal,
    engraving,
    sizeOption,
    ringSize,
    ringColor,
    headColor,
    bandColor,
    isEnabled,
    biMetal,
    setRingShank,
    setRingSideSetting,
    setRingMatchingBand,
    setRingColor,
    setMetal,
    setRingBand,
    setEngraving,
    setEngravingFont,
    setSizeOption,
    setRingSize,
    setRingHead,
    setHeadColor,
    setBandColor,
    setIsEnabled,
    setBiMetal,
    setFinalRingPrice,
    setBandWidth,
    setStyleShape,
  } = useContext(RingContext);

  const {
    shape,
    diamondSize,
    diamondType,
    selectedQuality,
    activeTab,
    colorType,
    fancyDiamond,
    gemstone,
    setCut,
    setClarity,
    setShape,
    setDiamondSize,
    setDiamondType,
    setDiamondColorClarity,
    setSelectedQuality,
    setActiveTab,
    setFancyDiamondIntensity,
    setColorType,
    setFancyDiamond,
    setGemstone,
  } = useContext(DiamondContext);

  const {
    headStyle,
    platinum,
    setShankTotal,
    setHeadTotal,
    setStoneTotal,
    setStylePrice,
    setEngravingPrice,
    setRingSideSettingPrice,
    setMetalPrice,
    setMatchingBandPrice,
    setHeadPrice,
    setHeadstyle,
    setThreestone,
    setShapeList,
    setStoneThreestone,
    setActiveDiamondSize,
    setActiveDiamondType,
    setCaratP,
    setDiamondCarat,
    setClarityPrice,
    setActivePriceColor,
    setShapePrice,
    setCutPrice,
    setFancyColorPrice,
    setIntensityPrice,
    setPlatinum,
    setSummaryBlink,
    setSelectedTab,
  } = useContext(SectionContext);

  useEffect(() => {
    if (!portalTargetId || typeof document === "undefined") {
      setPortalTarget(null);
      return;
    }

    setPortalTarget(document.getElementById(portalTargetId));
  }, [portalTargetId]);

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("ring-ai-toggle", handleToggle);
    return () => window.removeEventListener("ring-ai-toggle", handleToggle);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const host = portalTarget || (portalTargetId ? document.getElementById(portalTargetId) : null);
    const themeRoot = host?.closest(".theme3-root");
    if (!themeRoot) return undefined;

    themeRoot.classList.toggle("theme3-ai-open", isOpen);
    return () => {
      themeRoot.classList.remove("theme3-ai-open");
    };
  }, [isOpen, portalTarget, portalTargetId]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return undefined;
    }

    const root = document.documentElement;

    const updateViewportMetrics = () => {
      const visualViewport = window.visualViewport;
      const viewportHeight = visualViewport?.height ?? window.innerHeight;
      const viewportWidth = visualViewport?.width ?? window.innerWidth;
      const keyboardOffset = visualViewport
        ? Math.max(0, window.innerHeight - visualViewport.height - visualViewport.offsetTop)
        : 0;

      root.style.setProperty("--ring-ai-visual-height", `${Math.round(viewportHeight)}px`);
      root.style.setProperty("--ring-ai-visual-width", `${Math.round(viewportWidth)}px`);
      root.style.setProperty("--ring-ai-keyboard-offset", `${Math.round(keyboardOffset)}px`);

      const tabBar = document.querySelector(".tab-main-wappar");
      if (tabBar && window.innerWidth <= 640) {
        const tabRect = tabBar.getBoundingClientRect();
        const triggerTop = Math.max(16, Math.round(tabRect.top - 42));
        const triggerLeft = Math.max(8, Math.round(tabRect.left + 6));

        root.style.setProperty("--ring-ai-mobile-trigger-top", `${triggerTop}px`);
        root.style.setProperty("--ring-ai-mobile-trigger-left", `${triggerLeft}px`);
      }
    };

    updateViewportMetrics();

    const visualViewport = window.visualViewport;
    window.addEventListener("resize", updateViewportMetrics);
    window.addEventListener("orientationchange", updateViewportMetrics);
    visualViewport?.addEventListener("resize", updateViewportMetrics);
    visualViewport?.addEventListener("scroll", updateViewportMetrics);

    return () => {
      window.removeEventListener("resize", updateViewportMetrics);
      window.removeEventListener("orientationchange", updateViewportMetrics);
      visualViewport?.removeEventListener("resize", updateViewportMetrics);
      visualViewport?.removeEventListener("scroll", updateViewportMetrics);
    };
  }, []);

  useEffect(() => {
    setMessages((previous) =>
      previous.map((message) =>
        message.id === "welcome"
          ? { ...message, text: copy.welcome }
          : message
      )
    );
  }, [copy.welcome]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    const originalOverscrollBehavior = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscrollBehavior;
    };
  }, [isOpen]);

  const hasUserMessage = useMemo(
    () => messages.some((message) => message.role === "user"),
    [messages]
  );

  useEffect(() => {
    if (!isOpen || hasUserMessage) {
      setShowWelcomeIntro(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setShowWelcomeIntro(true);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [isOpen, hasUserMessage]);

  const applyConfig = (config) => {
    setRingShank(config.ringShank);
    setRingSideSetting(config.ringSideSetting);
    setRingMatchingBand(config.ringMatchingBand);
    setRingBand(config.ringBand);
    setRingHead(config.ringHead);
    setHeadstyle(config.headStyle);
    setThreestone(config.threestone ?? "");
    setShapeList(config.shapeList ?? "");

    setMetal(config.platinum ? "14K" : config.metal);
    setEngraving(config.engraving ?? "");
    setSizeOption(config.sizeOption ?? getRingSizeType(parent));
    setRingSize(config.ringSize ?? ringSize);
    setPlatinum(config.platinum);
    setRingColor(config.ringColor ?? config.metalColor);
    setHeadColor(config.headColor ?? config.metalColor);
    setBandColor(config.bandColor ?? config.metalColor);
    setIsEnabled(Boolean(config.isEnabled));
    setBiMetal(config.isEnabled ? "Yes" : "No");

    setShape(config.shape);
    setDiamondSize(config.diamondSize);
    setActiveDiamondSize(config.diamondSize);
    setDiamondCarat(config.diamondSize);
    setCaratP(config.stoneTotal);
    setDiamondType(config.selectedQuality.type);
    setSelectedQuality(config.selectedQuality);
    setActiveDiamondType(config.selectedQuality.type === "Natural" ? config.stoneTotal : 0);
    setStoneThreestone(config.selectedQuality.type === "Natural" ? "natural-diamond" : "lab-diamond");
    setActiveTab(config.activeTab);
    setColorType(config.colorType);
    setFancyDiamond(config.fancyDiamond);
    setGemstone(config.gemstone);

    setStylePrice(config.ringTotals.stylePrice);
    setEngravingPrice(config.ringTotals.engravingPrice ?? 0);
    setRingSideSettingPrice(0);
    setMatchingBandPrice(config.ringTotals.matchingBandPrice);
    setMetalPrice(config.ringTotals.metalPrice);
    setHeadPrice(config.ringTotals.headPrice);
    setShankTotal(config.ringTotals.shankTotal);
    setHeadTotal(config.ringTotals.headPrice);
    setStoneTotal(config.stoneTotal);
    setFinalRingPrice(config.ringTotals.finalRingPrice);
    setSelectedTab("stone");
    setSummaryBlink(true);
  };

  const appendMessages = (nextEntries) => {
    startTransition(() => {
      setMessages((previous) => [...previous, ...nextEntries]);
    });
  };

  const buildCurrentAssistantState = () => ({
    ringShank,
    ringSideSetting,
    ringMatchingBand,
    ringBand,
    metal,
    engraving,
    sizeOption,
    ringSize,
    metalColor: ringColor || headColor || bandColor,
    ringColor,
    headColor,
    bandColor,
    isEnabled: biMetal === "Yes" || isEnabled,
    headStyle,
    platinum,
    shape,
    diamondSize,
    diamondType,
    selectedQuality,
    activeTab,
    colorType,
    fancyDiamond,
    gemstone,
  });

  const buildCurrentResolvedConfig = () =>
    resolveRingAssistantConfig(
      "What ring do I currently have?",
      parent,
      buildCurrentAssistantState(),
      null
    ).config;

  const resetAssistant = () => {
    requestTokenRef.current += 1;
    const defaultQuality = getDefaultQuality(parent);
    const metalPrice = getMetalPrice(parent, "14K");
    const shankPrice = getShankPrice(parent, "PLAIN");
    const headPrice = getHeadPrice(parent, "4-PRONG");
    const defaultCarat = getDefaultCarat(parent);
    const diamondPrice = getDiamondPrice(parent, defaultCarat, defaultQuality, "Lab");
    const defaultSizeOption = getRingSizeType(parent);

    setBandWidth("2mm");
    setStyleShape("D");
    setRingShank("PLAIN");
    setRingSideSetting("PLAIN");
    setRingMatchingBand("PLAIN");
    setRingColor("#FFD280");
    setHeadColor("#FFD280");
    setBandColor("#FFD280");
    setMetal("14K");
    setPlatinum(false);
    setEngraving("");
    setEngravingFont("Arial");
    setSizeOption(defaultSizeOption);
    setRingSize(defaultSizeOption === "R3" ? "44" : "3");
    setRingBand("No");
    setBiMetal("No");
    setRingHead("4-PRONG");
    setHeadstyle("plain");
    setThreestone("");
    setShapeList("");
    setShape("round");
    setDiamondSize(defaultCarat);
    setDiamondCarat(defaultCarat);
    setActiveDiamondSize(defaultCarat);
    setCut("Good");
    setClarity("SI2");
    setDiamondColorClarity("K");
    setDiamondType("Lab");
    setStoneThreestone("lab-diamond");
    setFancyDiamondIntensity("Light");
    setFancyDiamond("Blue");
    setGemstone("blue-sapphire");
    setColorType("colorless");
    setActiveTab("Colorless");
    setSelectedQuality({
      type: "Lab",
      quality: defaultQuality,
    });
    setStylePrice(shankPrice);
    setEngravingPrice(0);
    setRingSideSettingPrice(0);
    setMetalPrice(metalPrice);
    setMatchingBandPrice(0);
    setHeadPrice(headPrice);
    setClarityPrice(100);
    setActivePriceColor(100);
    setShapePrice(100);
    setCaratP(diamondPrice);
    setCutPrice(100);
    setActiveDiamondType(diamondPrice);
    setFancyColorPrice(100);
    setIntensityPrice(20);
    setIsEnabled(false);
    setShankTotal(shankPrice + metalPrice);
    setHeadTotal(headPrice);
    setStoneTotal(diamondPrice);
    setFinalRingPrice(shankPrice + metalPrice + headPrice + diamondPrice);
    setSelectedTab("shank");
    setSummaryBlink(false);
    setResetObj({
      position: [5, 8, 5],
      near: 0.1,
      far: 100,
    });
    setCameraView("");
    setView360(true);

    setPrompt("");
    setIsApplying(false);
    setLoader(false);
    setShowWelcomeIntro(false);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text: copy.welcome,
      },
    ]);
  };

  const handleStarterPrompt = (starterPrompt) => {
    setPrompt(starterPrompt);
  };

  const handleInputFocus = () => {
    window.setTimeout(() => {
      composerRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
      inputRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }, 120);
  };

  const buildAssistantSummary = (previousConfig, config, message, responseLanguage = "en", intent = {}) => {
    const summaryCopy = SUMMARY_COPY[responseLanguage] ?? SUMMARY_COPY.en;
    const normalizedMetal =
      config.metalColor === "#DBDBDB"
        ? summaryCopy.metals.white
        : config.metalColor === "#FFBAA3"
          ? summaryCopy.metals.rose
          : config.metalColor === "#e5e4e2"
            ? summaryCopy.metals.platinum
            : summaryCopy.metals.yellow;
    const changedBits = [];

    if (previousConfig.ringShank !== config.ringShank) {
      changedBits.push(`${config.ringShank.replace(/-/g, " ").toLowerCase()} shank`);
    }
    if (previousConfig.ringMatchingBand !== config.ringMatchingBand && config.ringBand === "Yes") {
      changedBits.push(`${config.ringMatchingBand.replace(/-/g, " ").toLowerCase()} ${summaryCopy.matchingBand}`);
    }
    if (previousConfig.headStyle !== config.headStyle) {
      changedBits.push(`${HEAD_LABELS[config.headStyle] ?? config.headStyle} ${summaryCopy.head}`);
    }
    if (previousConfig.shape !== config.shape || previousConfig.diamondSize !== config.diamondSize) {
      changedBits.push(`${config.diamondSize} ${summaryCopy.ct} ${config.shape}`);
    }
    if (
      previousConfig.selectedQuality?.type !== config.selectedQuality?.type ||
      previousConfig.selectedQuality?.quality !== config.selectedQuality?.quality
    ) {
      changedBits.push(`${config.selectedQuality.type} ${config.selectedQuality.quality}`);
    }
    if (previousConfig.activeTab !== config.activeTab) {
      if (config.activeTab === "Fancy Colored") {
        changedBits.push(`${config.fancyDiamond} colored diamond`);
      } else if (config.activeTab === "Fancy-Gemstone") {
        changedBits.push(`${config.gemstone?.replace(/-/g, " ") ?? "gemstone"}`);
      } else {
        changedBits.push("colorless diamond");
      }
    } else if (config.activeTab === "Fancy Colored" && previousConfig.fancyDiamond !== config.fancyDiamond) {
      changedBits.push(`${config.fancyDiamond} colored diamond`);
    } else if (config.activeTab === "Fancy-Gemstone" && previousConfig.gemstone !== config.gemstone) {
      changedBits.push(`${config.gemstone?.replace(/-/g, " ") ?? "gemstone"}`);
    }
    if (
      previousConfig.platinum !== config.platinum ||
      previousConfig.metal !== config.metal ||
      previousConfig.metalColor !== config.metalColor
    ) {
      changedBits.push(config.platinum ? summaryCopy.metals.platinum : `${config.metal} ${normalizedMetal}`);
    }
    if (previousConfig.headColor !== config.headColor && config.isEnabled) {
      changedBits.push(`bi-metal head ${config.headMetalColor?.replace(/^\w/, (c) => c.toUpperCase()) ?? "custom"}`);
    }
    if (previousConfig.ringBand !== config.ringBand && previousConfig.ringMatchingBand === config.ringMatchingBand) {
      changedBits.push(config.ringBand === "Yes" ? summaryCopy.matchingBand : "no matching band");
    }
    if (previousConfig.engraving !== config.engraving && config.engraving) {
      changedBits.push(`${summaryCopy.engraving} "${config.engraving}"`);
    }
    if (previousConfig.ringSize !== config.ringSize) {
      changedBits.push(`ring size ${config.ringSize}`);
    }

    if (!changedBits.length) {
      if (intent.ringShank) {
        changedBits.push(`${config.ringShank.replace(/-/g, " ").toLowerCase()} shank`);
      }
      if (intent.ringMatchingBand && config.ringBand === "Yes") {
        changedBits.push(`${config.ringMatchingBand.replace(/-/g, " ").toLowerCase()} ${summaryCopy.matchingBand}`);
      } else if (intent.ringBand) {
        changedBits.push(config.ringBand === "Yes" ? summaryCopy.matchingBand : "no matching band");
      }
      if (intent.headStyle) {
        changedBits.push(`${HEAD_LABELS[config.headStyle] ?? config.headStyle} ${summaryCopy.head}`);
      }
      if (intent.shape || intent.carat) {
        changedBits.push(`${config.diamondSize} ${summaryCopy.ct} ${config.shape}`);
      }
      if (intent.diamondType || intent.quality) {
        changedBits.push(`${config.selectedQuality.type} ${config.selectedQuality.quality}`);
      }
      if (intent.activeTab || intent.fancyDiamond || intent.gemstone) {
        if (config.activeTab === "Fancy Colored") {
          changedBits.push(`${config.fancyDiamond} colored diamond`);
        } else if (config.activeTab === "Fancy-Gemstone") {
          changedBits.push(`${config.gemstone?.replace(/-/g, " ") ?? "gemstone"}`);
        } else {
          changedBits.push("colorless diamond");
        }
      }
      if (intent.metal || intent.metalColor || intent.platinum) {
        changedBits.push(config.platinum ? summaryCopy.metals.platinum : `${config.metal} ${normalizedMetal}`);
      }
    }

    if (!changedBits.length) {
      changedBits.push(`${HEAD_LABELS[config.headStyle] ?? config.headStyle} ${summaryCopy.head}`);
    }

    return `${message} ${summaryCopy.iSet} ${changedBits.join(", ")}.`;
  };

  const handleApply = async () => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      appendMessages([
        {
          id: `assistant-empty-${Date.now()}`,
          role: "assistant",
          text: copy.empty,
        },
      ]);
      return;
    }

    setIsApplying(true);
    setLoader(true);
    setIsOpen(true);
    setPrompt("");
    appendMessages([
      {
        id: `user-${Date.now()}`,
        role: "user",
        text: trimmedPrompt,
      },
    ]);

    const processingId = `processing-${Date.now()}`;
    const requestToken = requestTokenRef.current + 1;
    requestTokenRef.current = requestToken;

    try {
      let remoteIntent = null;

      if (shouldUseRemoteRingIntent(trimmedPrompt)) {
        try {
          remoteIntent = await fetchRemoteRingIntent(trimmedPrompt, parent);
        } catch (error) {
          remoteIntent = null;
        }
      }

      const currentAssistantState = buildCurrentAssistantState();

      const result = resolveRingAssistantConfig(
        trimmedPrompt,
        parent,
        currentAssistantState,
        remoteIntent
      );

      if (result.status === "reset") {
        undoConfigRef.current = buildCurrentResolvedConfig();
        resetAssistant();
        appendMessages([
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: result.message,
          },
        ]);
        return;
      }

      if (result.status === "undo") {
        if (undoConfigRef.current) {
          applyConfig(undoConfigRef.current);
          appendMessages([
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              text: result.message,
            },
          ]);
        } else {
          appendMessages([
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              text: "There is no previous ring change to undo yet.",
            },
          ]);
        }
        return;
      }

      if (result.status === "view") {
        if (result.intent?.viewMode === "360") {
          setView360(true);
          setCameraView("");
        } else {
          setView360(false);
          setCameraView(result.intent?.viewMode === "off" ? "" : result.intent?.viewMode ?? "");
        }
        appendMessages([
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: result.message,
          },
        ]);
        return;
      }

      if (result.status === "info") {
        appendMessages([
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: result.message,
          },
        ]);
        return;
      }

      const previousConfig = {
        ringShank,
        headStyle,
        shape,
        diamondSize,
        selectedQuality,
        metal,
        metalColor: ringColor || headColor || bandColor,
        headColor,
        platinum,
        ringBand,
        ringMatchingBand,
        engraving,
        ringSize,
        activeTab,
        fancyDiamond,
        gemstone,
      };

      const shouldApplyConfiguration = ["ready", "adjusted"].includes(result.status);

      if (shouldApplyConfiguration) {
        if (requestToken !== requestTokenRef.current) {
          return;
        }

        appendMessages([
          {
            id: processingId,
            role: "assistant",
            text: "",
            isProcessing: true,
          },
        ]);

        await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAY_MS));

        if (requestToken !== requestTokenRef.current) {
          setMessages((previous) => previous.filter((msg) => msg.id !== processingId));
          return;
        }

        undoConfigRef.current = buildCurrentResolvedConfig();
        applyConfig(result.config);

        setMessages((previous) =>
          previous.map((msg) =>
            msg.id === processingId
                  ? {
                      id: `assistant-${Date.now()}`,
                      role: "assistant",
                      text: buildAssistantSummary(previousConfig, result.config, result.message, result.responseLanguage, result.intent),
                    }
              : msg
          )
        );
      } else {
        if (requestToken !== requestTokenRef.current) {
          return;
        }

        appendMessages([
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: result.message,
          },
        ]);
      }
    } catch (error) {
      console.error("Ring assistant failed:", error);
      if (requestToken !== requestTokenRef.current) {
        return;
      }
      setMessages((previous) =>
        previous.filter((msg) => msg.id !== processingId)
      );
      appendMessages([
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          text: copy.error,
        },
      ]);
    } finally {
      if (requestToken === requestTokenRef.current) {
        setIsApplying(false);
        setLoader(false);
      }
    }
  };

  return (
    <>
      <div className="ring-ai-trigger-wrap ring-ai-trigger-desktop">
        <button
          type="button"
          className={`ring-ai-trigger ${isOpen ? "ring-ai-trigger-open" : ""}`}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span>Ask AI</span>
          <img src="/ai-icon.svg" alt="AI" />
        </button>
      </div>

      {isOpen && (
        <RingAiPortal target={portalTarget}>
        <div
          className="ring-ai-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
          onTouchStart={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <aside className="ring-ai-panel" onMouseDown={(event) => event.stopPropagation()}>
            <div className="ring-ai-panel-inner">
              <div className="ring-ai-header">
                <div className="ring-ai-header-title">
                  <TripleSparkleIcon />
                  <span>{copy.title}</span>
                </div>
                <div className="ring-ai-header-actions">
                  <button type="button" className="ring-ai-reset" onClick={resetAssistant}>
                    {copy.reset}
                  </button>
                  <button
                    type="button"
                    className="ring-ai-close"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close AI Assistant"
                  >
                    ×
                  </button>
                </div>
              </div>

              <p className="ring-ai-subtitle">{copy.subtitle}</p>
              <div className="ring-ai-powered">
                <span>{copy.poweredBy}</span>
              </div>

              {!hasUserMessage && (
                <div
                  className={`ring-ai-welcome-card ${
                    showWelcomeIntro ? "ring-ai-welcome-card-visible" : "ring-ai-welcome-card-hidden"
                  }`}
                >
                  <div className="ring-ai-welcome-avatar">
                    <img src="/images/keyideas-ai-logo.jpg" alt="Keyideas" />
                  </div>
                  <div className="ring-ai-welcome-content">
                    <h4>{copy.welcomeTitle}</h4>
                    <p>{copy.welcomeListTitle}</p>
                    <div className="ring-ai-welcome-list">
                      {copy.welcomeBullets.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="ring-ai-thread" ref={threadRef}>
                {messages
                  .filter((entry) => entry.id !== "welcome")
                  .map((entry) => {
                    const bubbleText = typeof entry.text === "string" ? entry.text.trim() : "";

                    return (
                  <div
                    key={entry.id}
                    className={`ring-ai-message-row ${entry.role === "user" ? "ring-ai-message-row-user" : ""}`}
                  >
                    {entry.role === "assistant" && !entry.isProcessing && <AssistantAvatar />}
                    {entry.isProcessing ? (
                      <div className="ring-ai-bubble ring-ai-bubble-processing">
                        <div className="ring-ai-dots">
                          <span className="ring-ai-dot" />
                          <span className="ring-ai-dot" />
                          <span className="ring-ai-dot" />
                        </div>
                      </div>
                    ) : (
                      <div className={`ring-ai-bubble ${entry.role === "user" ? "ring-ai-bubble-user" : ""}`}>
                        <span className="ring-ai-bubble-text">{bubbleText || copy.error}</span>
                        {entry.role === "user" && <UserArrowIcon />}
                      </div>
                    )}
                  </div>
                );
                  })}
              </div>

              {!hasUserMessage && (
                <div className="ring-ai-starters">
                  {STARTER_PROMPTS.map((starterPrompt) => (
                    <button
                      key={starterPrompt}
                      type="button"
                      className="ring-ai-starter-chip"
                      onClick={() => handleStarterPrompt(starterPrompt)}
                    >
                      {starterPrompt}
                    </button>
                  ))}
                </div>
              )}

              <div className="ring-ai-composer" ref={composerRef}>
                <input
                  id="ring-ai-prompt"
                  ref={inputRef}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onFocus={handleInputFocus}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleApply();
                    }
                  }}
                  placeholder={copy.placeholder}
                  className="ring-ai-input"
                />
                <button
                  className="ring-ai-send"
                  onClick={handleApply}
                  disabled={isApplying}
                  aria-label={isApplying ? "Applying request" : "Send request"}
                >
                  {isApplying ? (
                    <div className="ring-ai-send-loading">
                      <span className="ring-ai-send-dot" />
                      <span className="ring-ai-send-dot" />
                      <span className="ring-ai-send-dot" />
                    </div>
                  ) : (
                    <SendIcon />
                  )}
                </button>
              </div>
            </div>
          </aside>
        </div>
        </RingAiPortal>
      )}
    </>
  );
}

export default RingAiAssistant;
