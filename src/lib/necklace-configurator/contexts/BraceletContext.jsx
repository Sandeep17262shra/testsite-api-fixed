import { createContext, useState, useRef, useEffect } from "react";
import { Base64 } from "js-base64";
import {
  BRACELETS, BRACELET_STYLES, DEFAULT_PENDANT_CHARM, DEFAULT_CHAIN_LENGTH,
  DEFAULT_BRACELET_CHAIN_PATH, DEFAULT_NAME_PENDANT, BRACELET_NAME_CHAIN_PATHS,
  MAX_CHARMS_BY_NECKLACE,
  STONE_COLOR_SWATCHES, CHARMS,
  getMappedMetal, isCommonCharm,
} from "../shared/assets";
// TEMP: parent page -> category (pendant/bracelet customizer pages)
import { getTempCategoryForParentUrl, getTempInitialParentCategory } from "../shared/tempParentCategory";
import { JEWELRY_TYPE_SWITCH_MESSAGE } from "@/lib/jewelry-shell/jewelryCategoryBus";

export const BraceletContext = createContext({});

export const BraceletProvider = ({ children, initialType }) => {

  // ── Restore from a shared URL ─────────────────────────────────────────────
  const getConfigFromURL = () => {
    if (typeof window === "undefined") return null;

    const params = new URLSearchParams(window.location.search);
    const encodedConfig = params.get("config");
    if (!encodedConfig) return null;
    try {
      return JSON.parse(Base64.decode(encodedConfig));
    } catch (e) {
      console.error("Failed to decode shared config:", e);
      return null;
    }
  };
  const config = getConfigFromURL();

  // TEMP: without a shared config, open the category of the parent page.
  const initialJewelryType = config
    ? (config.type === "bracelet" ? "bracelet" : "necklace")
    : (initialType === "bracelet" ? "bracelet"
      : initialType === "necklace" ? "necklace"
      : (getTempInitialParentCategory() || "necklace"));

  // Old share links may still point at a removed chain (GLB BRACELET13/14).
  // Drop it so the default chain loads instead.
  if (config?.braceletPath) {
    const chainList = initialJewelryType === "bracelet" ? BRACELET_STYLES : BRACELETS;
    const chainIndex = chainList.findIndex((b) => b.path === config.braceletPath);
    if (chainIndex === -1) {
      delete config.braceletPath;
      config.selectedBracelet = 0;
    } else {
      // Keep the index in step with the path (the chain order can change).
      config.selectedBracelet = chainIndex;
    }
  }

  const NECKLACE_MATERIAL_PROPS = { metalness: 0.92, roughness: 0.14, envMapIntensity: 1.4, transparent: true };
  const BRACELET_MATERIAL_PROPS = { metalness: 1,    roughness: 0,    envMapIntensity: 1,   transparent: true };

  const NECKLACE_RESET_OBJ = { position: [0, 0.5, 6.5], near: 0.1, far: 100 };
  const BRACELET_RESET_OBJ = { position: [0.01, 2.9, 0.15], near: 0.1, far: 100 }; // near top-down, tiny XZ offset avoids OrbitControls gimbal lock

  const NECKLACE_DEFAULT_METAL = "#ECC875";
  const BRACELET_DEFAULT_METAL = "#DBDBDB";

  // ── Jewelry category (Necklace / Bracelet) ────────────────────────────────
  const [jewelryType, setJewelryTypeState] = useState(initialJewelryType);

  // Remember chain selections for each jewelry type
  const necklaceChainRef = useRef({
    index: initialJewelryType === "necklace" ? (config?.selectedBracelet ?? 0) : 0,
    path: initialJewelryType === "necklace" ? (config?.braceletPath ?? BRACELETS[0]?.path) : (BRACELETS[0]?.path || ""),
  });
  const braceletChainRef = useRef({
    index: initialJewelryType === "bracelet" ? (config?.selectedBracelet ?? 0) : 0,
    path: initialJewelryType === "bracelet" ? (config?.braceletPath ?? DEFAULT_BRACELET_CHAIN_PATH) : DEFAULT_BRACELET_CHAIN_PATH,
  });

  // ── State — all initialised from URL config when present ─────────────────
  const [selectedBracelet, setSelectedBraceletState] = useState(config?.selectedBracelet ?? 0);
  const [braceletPath, setBraceletPathState] = useState(
    config?.braceletPath ?? (initialJewelryType === "bracelet" ? DEFAULT_BRACELET_CHAIN_PATH : (BRACELETS[0]?.path || ""))
  );

  const setSelectedBracelet = (index) => {
    setSelectedBraceletState(index);
    if (jewelryType === "bracelet") {
      braceletChainRef.current.index = index;
      if (BRACELET_STYLES[index]) braceletChainRef.current.path = BRACELET_STYLES[index].path;
    } else {
      necklaceChainRef.current.index = index;
      if (BRACELETS[index]) necklaceChainRef.current.path = BRACELETS[index].path;
    }
  };

  const setBraceletPath = (path) => {
    setBraceletPathState(path);
    if (jewelryType === "bracelet") {
      braceletChainRef.current.path = path;
    } else {
      necklaceChainRef.current.path = path;
    }
  };

  const [charms, setCharms] = useState(config?.charms ?? []);
  // The most recent charm the user chose from the panel, minus its per-instance
  // id. Clicking the chain in the 3D view replays this, so a charm can be
  // picked once and then placed repeatedly without going back to the panel.
  const [lastCharmTemplate, setLastCharmTemplate] = useState(null);
  // Necklace-only: the clasp-end "pendant" charm.
  const [pendantCharm, setPendantCharm] = useState(config?.pendantCharm ?? DEFAULT_PENDANT_CHARM);
  // Necklace-only: 16"/18" chain length.
  const [chainLength, setChainLength] = useState(DEFAULT_CHAIN_LENGTH);
  const [namePendant, setNamePendant] = useState(
    // Bracelet also opens as a plain chain (no "Name" plate) — same as reset.
    config?.namePendant ?? (initialJewelryType === "bracelet"
      ? { ...DEFAULT_NAME_PENDANT, text: "", enabled: false }
      : { text: "", fontStyle: "dancing", enabled: false })
  );

  // Shared UI states between necklace and bracelet
  const [customizeType, setCustomizeType] = useState('charms');
  const [activeCharmCategory, setActiveCharmCategory] = useState('birthstones');
  const [stoneColor, setStoneColor] = useState(STONE_COLOR_SWATCHES[0].hex);
  const [selectedDiamondPath, setSelectedDiamondPath] = useState(
    CHARMS.find((c) => c.type === "diamond")?.path || "/bc-assets/gemstone/D1.glb"
  );
  const [initialLetter, setInitialLetter] = useState("A");
  const [activeCharmSlot, setActiveCharmSlot] = useState(0);

  // Metal colours kept in context so share/cart can encode them.
  const initialMetalHex = config?.braceletMetal ?? (initialJewelryType === "bracelet" ? BRACELET_DEFAULT_METAL : NECKLACE_DEFAULT_METAL);
  const initialPendantMetalHex = config?.pendantMetalHex ?? (initialJewelryType === "bracelet" ? BRACELET_DEFAULT_METAL : NECKLACE_DEFAULT_METAL);
  const [braceletMetal, setBraceletMetal] = useState(initialMetalHex);
  const [pendantMetalHex, setPendantMetalHex] = useState(initialPendantMetalHex);
  const [charmMetal, setCharmMetal] = useState(
    config?.charmMetal ?? initialMetalHex
  );

  // Bracelet-only: purity / size selectors and their line-item prices.
  const [braceletPurity, setBraceletPurity] = useState(config?.braceletPurity ?? "9K");
  const [currentMetalPrice, setCurrentMetalPrice] = useState(config?.currentMetalPrice ?? 100);
  const [currentPurityPrice, setCurrentPurityPrice] = useState(config?.currentPurityPrice ?? 100);
  const [braceletSize, setBraceletSize] = useState(config?.braceletSize ?? "5");
  const [currentBraceletSizePrice, setCurrentBraceletSizePrice] = useState(config?.currentBraceletSizePrice ?? 30);
  // Bracelet-only: GLB load spinner.
  const [loader, setLoader] = useState(true);

  const initialMaterialProps = initialJewelryType === "bracelet" ? BRACELET_MATERIAL_PROPS : NECKLACE_MATERIAL_PROPS;
  const [materialPropsBracelet, setMaterialPropsBracelet] = useState({
    color: initialMetalHex,
    ...initialMaterialProps,
  });
  const [texture, setTexture] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [materialProps, setMaterialProps] = useState({
    color: initialPendantMetalHex,
    ...initialMaterialProps,
  });
  const [cameraView, setCameraView] = useState("");
  const [capture, setCapture] = useState(false);
  const [resetObj, setResetObj] = useState(initialJewelryType === "bracelet" ? BRACELET_RESET_OBJ : NECKLACE_RESET_OBJ);
  const [showResetPopup, setShowResetPopup] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showPopup2, setShowPopup2] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Switching category seamlessly syncs common state (chain metal, common charms, name pendant)
  const setJewelryType = (type) => {
    if (type === jewelryType) return;
    setJewelryTypeState(type);

    const isTargetBracelet = type === "bracelet";

    // 1. Sync Chain Metal: map current chain metal to target jewelry type's specs
    const targetMetal = getMappedMetal(braceletMetal, type);
    const targetHex = targetMetal.hex;
    setBraceletMetal(targetHex);

    // 1b. Sync Charm Metal independently (may differ from chain metal)
    const targetCharmMetal = getMappedMetal(charmMetal, type);
    const targetCharmHex = targetCharmMetal.hex;
    setCharmMetal(targetCharmHex);

    // 1c. Sync Pendant/Name Metal independently
    const targetPendantMetal = getMappedMetal(pendantMetalHex, type);
    const targetPendantHex = targetPendantMetal.hex;
    setPendantMetalHex(targetPendantHex);

    const scenePropsChain = isTargetBracelet
      ? { ...BRACELET_MATERIAL_PROPS, color: targetHex }
      : {
          ...NECKLACE_MATERIAL_PROPS,
          color: targetHex,
          roughness: targetMetal.roughness ?? 0.14,
          metalness: targetMetal.metalness ?? 0.92,
        };
    const scenePropsPendant = isTargetBracelet
      ? { ...BRACELET_MATERIAL_PROPS, color: targetPendantHex }
      : {
          ...NECKLACE_MATERIAL_PROPS,
          color: targetPendantHex,
          roughness: targetPendantMetal.roughness ?? 0.14,
          metalness: targetPendantMetal.metalness ?? 0.92,
        };
    setMaterialPropsBracelet(scenePropsChain);
    setMaterialProps(scenePropsPendant);

    if (isTargetBracelet) {
      setCurrentMetalPrice(targetMetal.price || 100);
      if (targetMetal.alt === "Platinum") {
        setBraceletPurity("9K");
        setCurrentPurityPrice(0);
      } else if (currentPurityPrice === 0) {
        setCurrentPurityPrice(100);
      }
    }

    // 2. Sync Name Pendant / Name Bracelet:
    const hasNameText = Boolean(namePendant?.text && namePendant.text.trim().length > 0);
    const syncedNamePendant = {
      text: namePendant?.text || "",
      fontStyle: namePendant?.fontStyle || "dancing",
      enabled: hasNameText,
    };
    setNamePendant(syncedNamePendant);

    // 3. Chain style selection:
    if (isTargetBracelet) {
      let targetIndex = braceletChainRef.current.index ?? 0;
      let targetPath = braceletChainRef.current.path || DEFAULT_BRACELET_CHAIN_PATH;
      // If user has a name pendant entered, make sure bracelet style supports name pendant
      if (hasNameText && !BRACELET_NAME_CHAIN_PATHS.includes(targetPath)) {
        targetIndex = 0;
        targetPath = DEFAULT_BRACELET_CHAIN_PATH;
        braceletChainRef.current = { index: targetIndex, path: targetPath };
      }
      setSelectedBraceletState(targetIndex);
      setBraceletPathState(targetPath);
    } else {
      const targetIndex = necklaceChainRef.current.index ?? 0;
      const targetPath = necklaceChainRef.current.path || BRACELETS[0]?.path;
      setSelectedBraceletState(targetIndex);
      setBraceletPathState(targetPath);
      // Ensure active category is valid for necklace
      if (activeCharmCategory !== "birthstones" && activeCharmCategory !== "diamonds" && activeCharmCategory !== "initial") {
        setActiveCharmCategory("birthstones");
      }
    }

    // 4. Sync Common Charms (birthstone, diamond, initial) using mapped charm metal:
    const targetChainPath = isTargetBracelet
      ? (braceletChainRef.current.path || DEFAULT_BRACELET_CHAIN_PATH)
      : (necklaceChainRef.current.path || BRACELETS[0]?.path);
    // Bracelet: 5 charms, or 4 with a name (2 each side of the lock).
    const maxCharms = isTargetBracelet ? (hasNameText ? 4 : 5) : (MAX_CHARMS_BY_NECKLACE[targetChainPath] ?? 5);

    // Every charm keeps ITS OWN metal, mapped across into the target type's
    // palette (the same White Gold is a different hex on a bracelet than on a
    // necklace). It used to be stamped with the single global charm metal
    // instead, which flattened five differently-coloured charms into one the
    // moment you switched category — the stones came through untouched only
    // because gemstoneColor was never rewritten. The global metal is now just
    // the fallback, for a charm that never had one of its own.
    const mapCharmHex = (hex) => (hex ? getMappedMetal(hex, type).hex : targetCharmHex);

    const validCharms = (charms || []).filter(isCommonCharm);
    const updatedCharms = validCharms.map((charm) => {
      const mapped = { ...charm };
      // Both fields are mapped wherever they exist: an initial charm carries
      // its metal as metalColor, a birthstone/diamond as bodyColor, and a
      // charm that has picked up both must not end up with them disagreeing.
      if (charm.metalColor) mapped.metalColor = mapCharmHex(charm.metalColor);
      if (charm.bodyColor)  mapped.bodyColor  = mapCharmHex(charm.bodyColor);

      if (charm.type === "initial") {
        if (!charm.metalColor) mapped.metalColor = targetCharmHex;
        mapped.fontStyle = charm.fontStyle || namePendant?.fontStyle || "dancing";
      } else if (charm.type === "birthstone" || charm.type === "diamond") {
        if (!charm.bodyColor) mapped.bodyColor = targetCharmHex;
      }
      return mapped;
    }).slice(0, maxCharms);

    setCharms(updatedCharms);
    setLastCharmTemplate(null);
    setLoader(true);
    setTexture(null);
    setHighlightedIndex(null);
    setSelectedIndex(null);
    setCameraView("");
    setResetObj(isTargetBracelet ? BRACELET_RESET_OBJ : NECKLACE_RESET_OBJ);
  };

  // TEMP: parentUrl can arrive by postMessage after first render — switch
  // category once. Skipped for shared-config links.
  const setJewelryTypeRef = useRef(setJewelryType);
  setJewelryTypeRef.current = setJewelryType;
  const hasSharedConfigRef = useRef(Boolean(config));
  const tempParentCategoryAppliedRef = useRef(false);
  useEffect(() => {
    if (hasSharedConfigRef.current) return undefined;
    const apply = (parentUrl) => {
      if (tempParentCategoryAppliedRef.current) return;
      const category = getTempCategoryForParentUrl(parentUrl);
      if (!category) return;
      tempParentCategoryAppliedRef.current = true;
      setJewelryTypeRef.current(category);
    };
    apply(window.__parentConfig?.parentUrl);
    const onMessage = (event) => apply(event.data?.parentUrl);
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // The shell (src/components/JewelryCustomizerClient.jsx) keeps this frame
  // mounted once opened and never changes its `src` again, so it asks for a
  // necklace <-> bracelet switch this way instead — same effect as clicking
  // the in-app tab, just triggered from outside. setJewelryType already
  // no-ops when the type is unchanged.
  useEffect(() => {
    const onMessage = (event) => {
      if (event.data?.type !== JEWELRY_TYPE_SWITCH_MESSAGE) return;
      const type = event.data.jewelryType === "bracelet" ? "bracelet" : "necklace";
      setJewelryTypeRef.current(type);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <BraceletContext.Provider value={{
      jewelryType, setJewelryType,
      selectedBracelet, setSelectedBracelet,
      braceletPath,     setBraceletPath,
      charms,           setCharms,
      lastCharmTemplate, setLastCharmTemplate,
      pendantCharm,     setPendantCharm,
      namePendant,      setNamePendant,
      braceletMetal,    setBraceletMetal,
      pendantMetalHex,  setPendantMetalHex,
      charmMetal,       setCharmMetal,
      braceletPurity,   setBraceletPurity,
      currentMetalPrice, setCurrentMetalPrice,
      currentPurityPrice, setCurrentPurityPrice,
      braceletSize,     setBraceletSize,
      currentBraceletSizePrice, setCurrentBraceletSizePrice,
      loader,           setLoader,
      materialPropsBracelet, setMaterialPropsBracelet,
      texture,          setTexture,
      highlightedIndex, setHighlightedIndex,
      selectedIndex,    setSelectedIndex,
      materialProps,    setMaterialProps,
      cameraView,       setCameraView,
      capture,          setCapture,
      resetObj,         setResetObj,
      showResetPopup,   setShowResetPopup,
      showPopup,        setShowPopup,
      showPopup2,       setShowPopup2,
      chainLength, setChainLength,
      isOpen, setIsOpen,
      customizeType, setCustomizeType,
      activeCharmCategory, setActiveCharmCategory,
      stoneColor, setStoneColor,
      selectedDiamondPath, setSelectedDiamondPath,
      initialLetter, setInitialLetter,
      activeCharmSlot, setActiveCharmSlot,
    }}>
      {children}
    </BraceletContext.Provider>
  );
};
