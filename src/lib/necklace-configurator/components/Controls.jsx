import React, { useContext, useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { BraceletContext } from "../contexts/BraceletContext";
import * as THREE from 'three';
import { ToastContainer, toast } from 'react-toastify';
import {
    BRACELETS, CHARMS, CHARM_POSITIONS, DEFAULT_PENDANT_CHARM,
    NAME_PENDANT_SUPPORTED_PATHS, NAME_CHAIN_PATHS, PENDANT_CHARMS, MAX_CHARMS_BY_NECKLACE,
    CHARM_METAL_SWATCHES, getImageCharmPath, STONE_COLOR_SWATCHES,
    CHAIN_LENGTH_SUPPORTED_PATHS, CHAIN_LENGTH_OPTIONS, DEFAULT_CHAIN_LENGTH,
    BRACELET_CARD_IMAGE_BY_PATH, withChainIconVersion,
} from '../shared/assets';
import { Base64 } from "js-base64";
import { ShareContext } from "../contexts/ShareContext";
import {
  getNecklaceChainCatalogPrice,
  getNecklaceCharmCatalogPrice,
  getNecklaceMetalCatalogPrice,
  getNecklaceChainLengthTotalPrice,
  getNecklaceNamePendantTextPrice,
  getNecklacePendantCharmCatalogPrice,
  getNecklaceCatalogLabel,
  getNecklaceMetalCatalogLabels,
  isNecklaceCatalogProductActive,
} from "../necklacePriceConfig";
import { resolveParentUrl, isCategoryAllowed } from "../shared/parentCategoryConfig";
import { isJewelryShellActive, rememberJewelryCategory, requestJewelryCategory } from "@/lib/jewelry-shell/jewelryCategoryBus";
import { getFooterSummaryTaxLabel } from "@/lib/jewelry-shell/summaryTaxLabel";
import { View360Context } from "../contexts/View360Context";
import { CHAIN_DRAPE_CONFIG, getSeamCharmSlots } from "../necklace/DrapeChain";
import { buildCharmAddOnLines } from "../shared/orderSummary";
import { playBeadAddSound, playBeadRemoveSound, unlockBeadsAudio } from "../../beeds-configurator/beadsSounds";
import { useClickSound } from "../hooks/useClickSound";
import { useSectionScrollSpy } from "../shared/useSectionScrollSpy";
import {
    getNecklaceChainKeyByPath,
    getNecklaceMetalId,
    getNecklaceBirthstoneIdByHex,
    getNecklaceDiamondCharmIdByPath,
    NECKLACE_CHAIN_IDS,
    NECKLACE_METAL_IDS,
    NAME_PENDANT_FONT_IDS,
    resolveCharmProductId,
    buildJewelryProductIdPayload,
} from "../data/jewelryProductIds";
import { renderOptionBoxLabel } from "@/lib/ring-configurator/theme3OptionLabels";

function CardOption({ active, label, image, onClick, disabled = false }) {
  return (
    <button
      type="button"
      className={`gb-card-option ${active ? "active" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {image && <img src={image} alt={label || ""} />}
      {label && <span className="theme3-option-box-label">{label}</span>}
    </button>
  );
}

function TextOption({ active, label, onClick, disabled = false, children }) {
  const content = children != null ? children : label;
  return (
    <button
      type="button"
      className={`gb-text-option ${active ? "active" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {typeof content === "string" || typeof content === "number"
        ? renderOptionBoxLabel(content)
        : content}
    </button>
  );
}

function OptionRow({ title, children, className }) {
  const trackRef = useRef(null);
  const dragStateRef = useRef(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const handlePointerMove = (event) => {
      const state = dragStateRef.current;
      if (!state || event.pointerId !== state.pointerId) return;

      const deltaX = event.clientX - state.startX;
      if (!state.moved && Math.abs(deltaX) > 4) {
        state.moved = true;
        suppressClickRef.current = true;
        track.classList.add("is-dragging");
        track.style.scrollBehavior = "auto";
      }
      if (state.moved) {
        track.scrollLeft = state.startScrollLeft - deltaX;
      }
    };

    const endDrag = (event) => {
      const state = dragStateRef.current;
      if (!state) return;
      if (event && event.pointerId !== undefined && event.pointerId !== state.pointerId) return;
      if (state.moved) {
        track.classList.remove("is-dragging");
        track.style.scrollBehavior = "";
      }
      dragStateRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, []);

  const handleTrackPointerDown = (event) => {
    const track = trackRef.current;
    if (!track || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (track.scrollWidth <= track.clientWidth + 2) return;

    suppressClickRef.current = false;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: track.scrollLeft,
      moved: false,
    };
  };

  const handleTrackClickCapture = (event) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <section className={`gb-option-row${className ? ` ${className}` : ""}`}>
      {title && (
        <div className="gb-option-title">
          <span className="theme3-section-heading">{title}</span>
        </div>
      )}
      <div className="gb-option-slider">
        <div className="gb-option-track-wrap">
          <div
            className="gb-option-track"
            ref={trackRef}
            onPointerDown={handleTrackPointerDown}
            onClickCapture={handleTrackClickCapture}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

const Controls = forwardRef(function Controls({ activeSection = "bracelet", onSectionChange }, ref) {
    const [braceletPrice, setBraceletPrice] = useState(BRACELETS[0].price);
    const [charmsPrice, setCharmsPrice] = useState(0);
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
    const [dragState, setDragState] = useState(null); // { pointerId, fromIndex, currentIndex, startX, offsetX }
    const charmSlotRefs = useRef([]);
    const suppressCharmClickRef = useRef(false);

    const scrollContainerRef = useRef(null);
    const headerRef = useRef(null);
    const footerRef = useRef(null);
    const sectionRefs = {
      bracelet: useRef(null),
      charms: useRef(null),
    };
    // Highlight the section tab that is scrolled into view (same as the ring).
    const { lockTo: lockSectionSpy } = useSectionScrollSpy({
      containerRef: scrollContainerRef,
      sectionRefs,
      onSectionChange,
    });

    const {
        setJewelryType,
        selectedBracelet, setSelectedBracelet,
        braceletPath, setBraceletPath,
        charms, setCharms,
        lastCharmTemplate, setLastCharmTemplate,
        pendantCharm, setPendantCharm,
        namePendant, setNamePendant,
        braceletMetal, setBraceletMetal,
        braceletPurity, setBraceletPurity,
        currentPurityPrice, setCurrentPurityPrice,
        charmMetal, setCharmMetal,
        chainLength, setChainLength,
        setMaterialPropsBracelet,
        setTexture,
        setMaterialProps,
        cameraView, setCameraView,
        setCapture, capture,
        setResetObj,
        showResetPopup, setShowResetPopup,
        customizeType, setCustomizeType,
        activeCharmCategory, setActiveCharmCategory,
        stoneColor, setStoneColor,
        selectedDiamondPath, setSelectedDiamondPath,
        initialLetter, setInitialLetter,
        activeCharmSlot, setActiveCharmSlot,
        pendantMetalHex, setPendantMetalHex,
    } = useContext(BraceletContext);

    const { setShare, shareUrl, setShareUrl, parent, setParent, necklacePriceConfigVersion } =
        useContext(ShareContext);
    const { view360, setView360 } = useContext(View360Context);

    const { playClick } = useClickSound();

    const [showCopied, setShowCopied] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);
    const [continueMessage, setContinueMessage] = useState("");
    const [pendingCartPayload, setPendingCartPayload] = useState(null);

    const supportsNamePendant = NAME_PENDANT_SUPPORTED_PATHS.includes(braceletPath);
    // A name pendant on a link-by-link drape chain splits the charms into a
    // left and a right side (see getSeamCharmSlots / Necklace.jsx).
    const seamActive = Boolean(CHAIN_DRAPE_CONFIG[braceletPath])
        && supportsNamePendant
        && Boolean(namePendant?.enabled)
        && Boolean((namePendant?.text || "").trim());
    // A name chain builds the name INTO the chain model (BRACELET13/14): it has
    // no initial charm of its own and only the one charm slot under the name.
    // A drape chain also takes a name, but keeps its whole charm catalogue.
    const isNameChain = NAME_CHAIN_PATHS.includes(braceletPath);
    const supportsChainLength = CHAIN_LENGTH_SUPPORTED_PATHS.includes(braceletPath);
    const maxCharmsForNecklace = MAX_CHARMS_BY_NECKLACE[braceletPath] ?? 6;
    const activeCharm = activeCharmSlot !== null ? charms[activeCharmSlot] : null;
    const activeCharmMetal = activeCharm?.metalColor || activeCharm?.bodyColor || charmMetal;

    useEffect(() => {
    const placedCharms = charms.filter(Boolean);
    let nextCharms = isNameChain
        ? placedCharms.filter((charm) => charm.type !== "initial")
        : placedCharms;
    if (nextCharms.length > maxCharmsForNecklace) {
        nextCharms = nextCharms.slice(0, maxCharmsForNecklace);
    }
    if (nextCharms.length !== placedCharms.length) {
        setCharms(nextCharms);
        setActiveCharmSlot(0);
    }
}, [braceletPath, maxCharmsForNecklace, isNameChain]);

useEffect(() => {
    if (isNameChain && activeCharmCategory === "initial") {
        setActiveCharmCategory("birthstones");
    }
}, [isNameChain, activeCharmCategory]);

useEffect(() => {
    if (!supportsNamePendant && customizeType === "text") {
        setCustomizeType("charms");
    }
}, [supportsNamePendant, customizeType]);

    // Each placed charm retains its own metal. Reflect that metal in the
    // frontend swatches when the customer selects a different charm slot.
    useEffect(() => {
        if (!activeCharm) return;
        const selectedMetal = activeCharm.metalColor || activeCharm.bodyColor;
        if (selectedMetal && selectedMetal !== charmMetal) setCharmMetal(selectedMetal);
    }, [activeCharm, charmMetal, setCharmMetal]);

    const selectedPendantCharm = PENDANT_CHARMS.find((charm) => charm.id === pendantCharm.charmId) || PENDANT_CHARMS[0];
    const namePendantPrice =
        supportsNamePendant && namePendant.enabled && namePendant.text.trim()
            ? getNecklaceNamePendantTextPrice(namePendant.fontStyle, namePendant.text)
            : 0;
    const pendantCharmPrice = pendantCharm.enabled
        ? getNecklacePendantCharmCatalogPrice(
              selectedPendantCharm?.id,
              selectedPendantCharm?.price || 350
          )
        : 0;
    const chainLengthPrice = supportsChainLength
        ? getNecklaceChainLengthTotalPrice(chainLength ?? DEFAULT_CHAIN_LENGTH)
        : 0;
    const isPlatinum = String(braceletMetal || "").toLowerCase() === "#a8a8a6";
    const isSilver = String(braceletMetal || "").toLowerCase() === "#c0c0c0" || String(braceletMetal || "").toLowerCase() === "#b8b8b8";
    const hasPurity = !isPlatinum && !isSilver;
    const metalComponentPrice = getNecklaceMetalCatalogPrice(
      braceletMetal,
      braceletPurity,
      hasPurity ? currentPurityPrice : 0
    );
    const totalPrice =
      braceletPrice +
      charmsPrice +
      namePendantPrice +
      pendantCharmPrice +
      metalComponentPrice +
      chainLengthPrice;

    useEffect(() => {
        const currentBracelet = BRACELETS[selectedBracelet];
        if (currentBracelet) {
            setBraceletPrice(
                getNecklaceChainCatalogPrice(currentBracelet.path, currentBracelet.price)
            );
        }
        const totalCharmsPrice = charms.reduce((total, charm) => {
            if (!charm) return total;
            const charmData = CHARMS.find((c) => c.path === charm.path);
            const fallback = charmData ? charmData.price : 0;
            return total + getNecklaceCharmCatalogPrice(charm, fallback);
        }, 0);
        setCharmsPrice(totalCharmsPrice);
    }, [
      selectedBracelet,
      charms,
      braceletPath,
      braceletMetal,
      braceletPurity,
      necklacePriceConfigVersion,
      chainLength,
      namePendant?.enabled,
      namePendant?.text,
      namePendant?.fontStyle,
      pendantCharm?.enabled,
      pendantCharm?.charmId,
    ]);

    // Close summary dropdown on outside click
    useEffect(() => {
        if (!isSummaryExpanded) return undefined;

        const handleClickOutside = (event) => {
            const header = headerRef.current;
            const footer = footerRef.current;
            const isInsideHeader = !!(header && header.contains(event.target));
            const isInsideFooter = !!(footer && footer.contains(event.target));
            if (!isInsideHeader && !isInsideFooter) {
                setIsSummaryExpanded(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [isSummaryExpanded]);

    const handleSummaryArrowClick = () => {
        playClick();
        setIsSummaryExpanded((prev) => !prev);
    };

const metalOptions = [
    { code: "SL", alt: "Silver 925",  hex: "#C0C0C0", color: "#DADADA", roughness: 0.08, metalness: 0.93 },
    { code: "YG", alt: "Yellow Gold", hex: "#ECC875", color: "#FFD280", roughness: 0.14, metalness: 0.92 },
    { code: "RG", alt: "Rose Gold",   hex: "#FFBAA3", color: "#E6B08F", roughness: 0.14, metalness: 0.92 },
    { code: "PL", alt: "Platinum",    hex: "#A8A8A6", color: "#E5E4E2", roughness: 0.22, metalness: 0.88 },
    { code: "WG", alt: "White Gold",  hex: "#C8C8C8", color: "#F1F1EF", roughness: 0.06, metalness: 0.95 },
];
const purityOptions = [
    { label: "9K", value: "9K", price: 100 },
    { label: "14K", value: "14K", price: 200 },
    { label: "18K", value: "18K", price: 300 },
];
    const gemstoneOptions = [
        { name: "Blue Sapphire", hex: "#0047AB" },
        { name: "Green Emerald", hex: "#4AE2A1" },
        { name: "Green Sapphire", hex: "#00AB55" },
        { name: "Moissanite", hex: "#ffffff" },
        { name: "Pink Sapphire", hex: "#D1008F" },
        { name: "Red Ruby", hex: "#B71C1C" },
        { name: "Yellow Sapphire", hex: "#FFA94D" },
    ];

    const fontOptions = [
        { id: "dancing",    label: "Dancing",    sample: "ℛ", connected: true },
        { id: "kingsman",   label: "Kingsman",   sample: "𝒦", connected: true },
        { id: "yellowtail", label: "Yellowtail", sample: "𝒴", connected: true },
    ];

    const connectedFontOptions = fontOptions.filter((font) => font.connected);
    const necklaceChainId = (path) => {
        const key = getNecklaceChainKeyByPath(path);
        return key ? NECKLACE_CHAIN_IDS[key]?.id : undefined;
    };
    const necklaceMetalId = (metal, purity = braceletPurity) => getNecklaceMetalId(metal.hex, purity);
    const necklaceFontId = (font) => NAME_PENDANT_FONT_IDS[font.id]?.id;
    const necklaceMetalLabel = (metal) =>
        getNecklaceMetalCatalogLabels(necklaceMetalId(metal), metal.alt).metal;
    const necklacePurityLabel = (option) =>
        getNecklaceMetalCatalogLabels(getNecklaceMetalId(braceletMetal, option.value), "", option.label).purity;

    useEffect(() => {
        if (!hasPurity) return;
        const validPurities = purityOptions.filter((option) =>
            isNecklaceCatalogProductActive(getNecklaceMetalId(braceletMetal, option.value))
        );
        if (validPurities.length && !validPurities.some((option) => option.value === braceletPurity)) {
            setBraceletPurity(validPurities[0].value);
        }
    }, [necklacePriceConfigVersion, braceletMetal, braceletPurity, hasPurity]);

    useEffect(() => {
        if (!hasPurity) return;
        const validMetals = metalOptions.filter((metal) => isNecklaceCatalogProductActive(necklaceMetalId(metal)));
        if (validMetals.length && !validMetals.some((metal) => metal.hex === braceletMetal)) {
            setBraceletMetal(validMetals[0].hex);
        }
    }, [necklacePriceConfigVersion, braceletMetal, braceletPurity, hasPurity]);

    const updateNamePendant = (updates) =>
        setNamePendant((prev) => ({ ...prev, ...updates }));

    const updatePendantCharm = (updates) =>
        setPendantCharm((prev) => ({ ...prev, ...updates }));

    const applyMaterialBracelet = (color, texturePath = null, roughness = null, metalness = null) => {
        setMaterialPropsBracelet((prev) => ({
            ...prev,
            color,
            ...(roughness !== null ? { roughness } : {}),
            ...(metalness !== null ? { metalness } : {}),
        }));
        if (texturePath) new THREE.TextureLoader().load(texturePath, (tex) => setTexture(tex));
        else setTexture(null);
    };

    const applyMaterial = (color, texturePath = null, roughness = null, metalness = null) => {
        setMaterialProps((prev) => ({
            ...prev,
            color,
            ...(roughness !== null ? { roughness } : {}),
            ...(metalness !== null ? { metalness } : {}),
        }));
        if (texturePath) new THREE.TextureLoader().load(texturePath, (tex) => setTexture(tex));
        else setTexture(null);
    };

    const handleReset = () => {
        setSelectedBracelet(0);
        setBraceletPath(BRACELETS[0].path);
        setCharms([]);
        setChainLength(DEFAULT_CHAIN_LENGTH);
        setPendantCharm(DEFAULT_PENDANT_CHARM);
        setNamePendant({ text: "", fontStyle: "dancing", enabled: false });
        applyMaterialBracelet('#ECC875', '/textures/silver.jpg');
        applyMaterial('#ECC875', '/textures/silver.jpg');
        setTexture(null);
        setBraceletMetal("#ECC875");
        setBraceletPurity("9K");
        setCurrentPurityPrice(100);
        setCharmMetal("#ECC875");
        setPendantMetalHex("#ECC875");
        setCameraView("normal");
        setResetObj({ position: [0, 0.5, 6.5], near: 0.1, far: 100 });
    };

    useImperativeHandle(ref, () => ({
        handleReset,
        scrollToSection: (sectionId) => {
            const sectionNode = sectionRefs[sectionId]?.current;
            const container = scrollContainerRef.current;
            if (sectionNode && container) {
                lockSectionSpy(sectionId);
                const sectionTop = sectionNode.offsetTop;
                container.scrollTo({ top: sectionTop - 10, behavior: "smooth" });
            }
        }
    }));

    const handleShare = async () => {
        try {
            const config = {
                type: "pendant",
                selectedBracelet,
                braceletPath,
                braceletMetal,
                braceletPurity,
                chainLength: chainLength ?? DEFAULT_CHAIN_LENGTH,
                pendantMetalHex,
                charmMetal,
                charms,
                namePendant,
                pendantCharm,
                cameraView,
                braceletPrice,
                charmsPrice,
                namePendantPrice,
                pendantCharmPrice,
                currentPurityPrice: hasPurity ? currentPurityPrice : 0,
                chainLengthPrice,
                totalPrice,
            };

            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);

            const encoded = Base64.encode(JSON.stringify(config));
            const storefrontUrl = resolveStorefrontUrl();
            const url = storefrontUrl || new URL(window.location.href);
            url.search = "";
            url.searchParams.set("config", encoded);
            const finalUrl = url.toString();

            setShareUrl(finalUrl);
            await navigator.clipboard.writeText(finalUrl);
        } catch (err) {
            console.error("Share failed:", err);
        }
    };

    const resolveStorefrontUrl = () => {
        const resolvedParentUrl =
            parent ||
            (typeof window !== "undefined" && window.__parentConfig?.parentUrl) ||
            (typeof window !== "undefined" && window.self !== window.top ? document.referrer : "");

        if (!resolvedParentUrl) return null;
        try {
            return new URL(resolvedParentUrl);
        } catch (error) {
            return null;
        }
    };

    const addToCart = () => {
        if (addedToCart) return;
        setAddedToCart(true);
        setContinueMessage("");
        let Media = null;
        try {
            const canvas = document.querySelector('.theme3-preview-pane canvas') || document.querySelector('canvas');
            if (canvas) Media = canvas.toDataURL('image/png');
        } catch (e) {
            console.warn('Canvas snapshot failed', e);
        }

        const effectivePurity = isPlatinum ? 'Platinum' : isSilver ? 'Silver 925' : braceletPurity;
        const currentChainLength = chainLength ?? DEFAULT_CHAIN_LENGTH;
        const chainLengthLabel = supportsChainLength
            ? (CHAIN_LENGTH_OPTIONS.find((o) => o.id === currentChainLength)?.label || `${currentChainLength}"`)
            : "";

        setPendingCartPayload({
            type: 'ADD_TO_CART',
            quantity: 1,
            Title: `${BRACELETS[selectedBracelet]?.name}${supportsNamePendant && namePendant.enabled && namePendant.text ? ` - "${namePendant.text}"` : ''} - ${hasPurity ? `${braceletPurity} ` : ''}${metalOptions.find(o => o.hex === braceletMetal)?.alt}${supportsChainLength && chainLengthLabel ? ` - ${chainLengthLabel}` : ''}`,
            Price: totalPrice,
            Category: 'Pendant',
            PendantStyle: BRACELETS[selectedBracelet]?.name,
            MetalType: metalOptions.find(o => o.hex === braceletMetal)?.alt,
            Purity: effectivePurity,
            ChainLength: supportsChainLength ? chainLengthLabel : "None",
            Length: supportsChainLength ? chainLengthLabel : "None",
            NameText: supportsNamePendant && namePendant.enabled && namePendant.text.trim() ? namePendant.text : "None",
            FontStyle: fontOptions.find(f => f.id === namePendant.fontStyle)?.label,
            PendantCharm: pendantCharm.enabled ? selectedPendantCharm?.name : "None",
            CharmBody: pendantCharm.enabled ? (metalOptions.find(o => o.hex === pendantCharm.bodyColor)?.alt || "Custom") : "None",
            Gemstone: pendantCharm.enabled ? (gemstoneOptions.find(o => o.hex === pendantCharm.gemstoneColor)?.name || "Custom") : "None",
            // Stable product-ID payload — keyed IDs for chain, metal, font, charms.
            ProductIds: buildJewelryProductIdPayload({
                jewelryType: "necklace",
                braceletPath,
                braceletMetal,
                braceletPurity,
                namePendant,
                charms,
                chainLength: currentChainLength,
            }),
            Media,
        });
        setShareUrl("");
        setShare(true);
    };

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
        } catch (err) {
            console.warn("Failed to append preview parameter to share URL", err);
        }

        window.parent.postMessage({ ...pendingCartPayload, ModelPreviewUrl: previewUrl }, '*');
        try {
            navigator.clipboard.writeText(shareUrl);
            setContinueMessage("Add to cart request sent. Configuration URL copied.");
        } catch (err) {
            setContinueMessage("Add to cart request sent.");
        }
        setPendingCartPayload(null);
        // Same as the ring: keep showing "Adding to Cart..." (and stay disabled) after the click.
        // window.setTimeout(() => setAddedToCart(false), 1000);
    }, [pendingCartPayload, shareUrl]);

    const addCustomCharm = (charm, replaceActive = true) => {
        // Remember what was picked so a chain click can place another one.
        setLastCharmTemplate(charm);
        if (replaceActive && activeCharmSlot !== null && charms[activeCharmSlot]) {
            const updated = [...charms];
            const replaced = updated[activeCharmSlot];
            // Keep the slot's side of the name pendant (chainSide) on a swap.
            updated[activeCharmSlot] = {
                ...charm,
                id: replaced.id,
                ...(replaced.chainSide ? { chainSide: replaced.chainSide } : {}),
            };
            playBeadAddSound();
            setCharms(updated);
            return;
        }
        const placedCharms = charms.filter(Boolean);
        if (placedCharms.length >= maxCharmsForNecklace) {
            toast(`Maximum of ${maxCharmsForNecklace} charm${maxCharmsForNecklace === 1 ? '' : 's'} reached for this necklace!`, { autoClose: 1500 });
            return;
        }
        const newCharm = { ...charm, id: Date.now() + Math.random() };
        let updated = [...placedCharms, newCharm];
        if (seamActive) {
            // Give it the side the pendant layout gives it and keep the list
            // as [left..., right...] (the same order Necklace.jsx maintains),
            // so the new charm's slot - and the active slot - are right at once.
            const slots = getSeamCharmSlots(updated.map((c) => c.chainSide));
            const tagged = updated.map((c, k) => (c.chainSide === slots[k].side ? c : { ...c, chainSide: slots[k].side }));
            const added = tagged[tagged.length - 1];
            const others = tagged.slice(0, -1);
            // The new charm goes on the OUTER end of its side, so the charms
            // already there keep their spots and only the new one appears (and
            // wobbles). Rank runs outward from the pendant: on the left the
            // first charm in the list is the outermost, on the right the last.
            updated = added.chainSide === "left"
                ? [
                    added,
                    ...others.filter((c) => c.chainSide === "left"),
                    ...others.filter((c) => c.chainSide === "right"),
                ]
                : [
                    ...others.filter((c) => c.chainSide === "left"),
                    ...others.filter((c) => c.chainSide === "right"),
                    added,
                ];
        }
        playBeadAddSound();
        setCharms(updated);
        setActiveCharmSlot(Math.max(updated.findIndex((c) => c.id === newCharm.id), 0));
    };

    const selectInitialLetter = (letter) => {
        setInitialLetter(letter);
        addCustomCharm({ type: "initial", letter, metalColor: charmMetal });
    };

    const addBirthstoneCharm = (replaceActive = true, selectedStoneColor = stoneColor) => {
        const birthstoneCharmData = CHARMS.find((c) => c.type === "birthstone");
        if (!birthstoneCharmData) return;
        addCustomCharm({
            type: "birthstone",
            path: birthstoneCharmData.path,
            bodyColor: charmMetal,
            gemstoneColor: selectedStoneColor,
        }, replaceActive);
    };

    const selectBirthstone = (stone) => {
        setStoneColor(stone.hex);
        addBirthstoneCharm(true, stone.hex);
    };

const addDiamondCharm = (diamondCharm, replaceActive = true) => {
    setSelectedDiamondPath(diamondCharm.path);
    addCustomCharm({
        type: "diamond",
        path: diamondCharm.path,
        preview: diamondCharm.preview,
        name: diamondCharm.name,
        bodyColor: charmMetal,
        gemstoneColor: "#F4F8FF",
    }, replaceActive);
};

    const setActiveCharmMetal = (metal) => {
        setCharmMetal(metal.hex);
        if (activeCharmSlot === null || !charms[activeCharmSlot]) return;
        const activeCharm = charms[activeCharmSlot];
        const updated = [...charms];
        if (activeCharm.type === 'initial') {
            updated[activeCharmSlot] = { ...activeCharm, metalColor: metal.hex };
        } else if (activeCharm.type === 'birthstone' || activeCharm.type === 'diamond') {
            updated[activeCharmSlot] = { ...activeCharm, bodyColor: metal.hex };
        }
        setCharms(updated);
    };

    const removeCharmAt = (index) => {
        const updated = charms.filter((_, charmIndex) => charmIndex !== index);
        playBeadRemoveSound();
        setCharms(updated);
        setActiveCharmSlot(updated.length ? Math.min(index, updated.length - 1) : 0);
    };

    const reorderCharms = (fromIndex, toIndex) => {
        if (fromIndex === toIndex) return;
        setCharms((prev) => {
            const updated = [...prev];
            // With a name pendant each charm carries its side (chainSide) and
            // the list is kept as [left charms..., right charms...] (see
            // Necklace.jsx). A slot's side is its position, so after the move
            // the first `leftCount` slots are re-marked left and the rest
            // right - dragging a charm across the boundary moves it across
            // the pendant, exactly like without a pendant.
            const hasSides = updated.some((c) => c?.chainSide === 'left' || c?.chainSide === 'right');
            const leftCount = hasSides ? updated.filter((c) => c?.chainSide === 'left').length : 0;
            const [moved] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, moved);
            if (!hasSides) return updated;
            return updated.map((c, k) => {
                if (!c) return c;
                const side = k < leftCount ? 'left' : 'right';
                return c.chainSide === side ? c : { ...c, chainSide: side };
            });
        });
        setActiveCharmSlot(toIndex);
    };

    const handleCharmPointerDown = (event, index) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        if (event.target.closest(".remove-slot-btn")) return;
        event.preventDefault();
        unlockBeadsAudio();
        suppressCharmClickRef.current = false;
        setDragState({
            pointerId: event.pointerId,
            fromIndex: index,
            currentIndex: index,
            startX: event.clientX,
            offsetX: 0,
        });
    };

    useEffect(() => {
        if (!dragState) return undefined;

        const handlePointerMove = (event) => {
            if (event.pointerId !== dragState.pointerId) return;
            const deltaX = event.clientX - dragState.startX;

            if (!suppressCharmClickRef.current && Math.abs(deltaX) > 4) {
                suppressCharmClickRef.current = true;
            }

            setDragState((prev) => (prev ? { ...prev, offsetX: deltaX } : prev));

            const slots = charmSlotRefs.current;
            for (let i = 0; i < slots.length; i += 1) {
                const el = slots[i];
                if (!el || i === dragState.currentIndex) continue;
                const rect = el.getBoundingClientRect();
                const midX = rect.left + rect.width / 2;
                const crossed =
                    (i < dragState.currentIndex && event.clientX < midX) ||
                    (i > dragState.currentIndex && event.clientX > midX);
                if (crossed) {
                    reorderCharms(dragState.currentIndex, i);
                    setDragState((prev) =>
                        prev ? { ...prev, currentIndex: i, startX: event.clientX, offsetX: 0 } : prev
                    );
                    break;
                }
            }
        };

        const endDrag = (event) => {
            if (event.pointerId !== undefined && event.pointerId !== dragState.pointerId) return;
            setDragState(null);
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", endDrag);
        window.addEventListener("pointercancel", endDrag);
        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", endDrag);
            window.removeEventListener("pointercancel", endDrag);
        };
    }, [dragState]);

    const NECKLACE_CHARM_CATEGORIES = [
        {
            id: "birthstones",
            label: "Birthstones",
            icon: (active) => (
                <svg width="22" height="22" viewBox="0 0 30 30" fill="none">
                    <path d="M11.5 8H18.5L22 11.5V18.5L18.5 22H11.5L8 18.5V11.5L11.5 8Z" stroke={active ? "white" : "#171717"} strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M8 11.5H22" stroke={active ? "white" : "#171717"} strokeWidth="1.2" />
                    <path d="M8 18.5H22" stroke={active ? "white" : "#171717"} strokeWidth="1.2" />
                </svg>
            ),
        },
        {
            id: "diamonds",
            label: "Diamond",
            icon: (active) => (
                <svg width="22" height="22" viewBox="0 0 30 30" fill="none">
                    <path d="M9 10H21L24 13.5L15 23.5L6 13.5L9 10Z" stroke={active ? "white" : "#171717"} strokeLinejoin="round" strokeWidth="1.3"/>
                    <path d="M9 10L11.5 13.5M21 10L18.5 13.5M6 13.5H24M11.5 13.5L15 23.5L18.5 13.5" stroke={active ? "white" : "#171717"} strokeLinejoin="round" strokeWidth="1"/>
                </svg>
            ),
        },
        {
            id: "initial",
            label: "Initial",
            icon: (active) => (
                <svg width="22" height="22" viewBox="0 0 30 30" fill="none">
                    <circle cx="15" cy="15" r="11" stroke={active ? "white" : "#171717"} strokeWidth="1.4" />
                    <text x="15" y="19" textAnchor="middle" fill={active ? "white" : "#171717"} fontSize="12" fontWeight="bold" fontFamily="Arial">A</text>
                </svg>
            ),
        },
    ];

    const compatibleCharmCategories = isNameChain
        ? NECKLACE_CHARM_CATEGORIES.filter((cat) => cat.id !== "initial")
        : NECKLACE_CHARM_CATEGORIES;
    const availableCharmCategories = compatibleCharmCategories.filter((cat) => {
        if (cat.id === "birthstones") {
            return STONE_COLOR_SWATCHES.some((stone) =>
                isNecklaceCatalogProductActive(getNecklaceBirthstoneIdByHex(stone.hex))
            );
        }
        if (cat.id === "diamonds") {
            return CHARMS.some((charm) => charm.type === "diamond" &&
                isNecklaceCatalogProductActive(getNecklaceDiamondCharmIdByPath(charm.path))
            );
        }
        return isNecklaceCatalogProductActive("NIC1");
    });

    useEffect(() => {
        if (availableCharmCategories.length && !availableCharmCategories.some((cat) => cat.id === activeCharmCategory)) {
            setActiveCharmCategory(availableCharmCategories[0].id);
        }
    }, [necklacePriceConfigVersion, activeCharmCategory, availableCharmCategories.map((cat) => cat.id).join(",")]);

    const handleNextStep = () => {
        addToCart();
    };

    const nextStepButtonText = addedToCart
        ? "Adding To Cart..."
        : "Add To Cart";

    const nextStepCopy = "Add your necklace to cart";

    const placedCharms = charms.filter(Boolean);

    const chainStyle = BRACELETS[selectedBracelet]?.name || "Chain";
    const chainLengthLabel = supportsChainLength
        ? (CHAIN_LENGTH_OPTIONS.find((o) => o.id === (chainLength ?? DEFAULT_CHAIN_LENGTH))?.label)
        : "";
    const pendantFontLabel = fontOptions.find((o) => o.id === namePendant.fontStyle)?.label || "Dancing";
    const chainMetalName = metalOptions.find((o) => o.hex?.toLowerCase() === braceletMetal?.toLowerCase())?.alt || "Yellow Gold";
    const chainPurityLabel = hasPurity ? braceletPurity : "";
    const chainSummaryDesc = [chainStyle, [chainPurityLabel, chainMetalName].filter(Boolean).join(" ")].filter(Boolean).join(" · ");
    const chainSummaryPrice = braceletPrice + metalComponentPrice + chainLengthPrice;

    const summaryAddOnLines = [
        ...buildCharmAddOnLines(placedCharms, {
            getPrice: (charm) => {
              const fallback = CHARMS.find((c) => c.path === charm.path)?.price ?? 0;
              return getNecklaceCharmCatalogPrice(charm, fallback);
            },
            getBirthstoneLabel: (charm) => STONE_COLOR_SWATCHES.find((s) => s.hex?.toLowerCase() === charm.gemstoneColor?.toLowerCase())?.label,
            getName: (charm) => charm.name || CHARMS.find((c) => c.path === charm.path)?.name || "Charm",
        }),
        ...(supportsNamePendant && namePendant.enabled && namePendant.text.trim()
            ? [{ key: "text", label: `Text: \u201c${namePendant.text.trim()}\u201d \u00b7 ${pendantFontLabel}`, price: namePendantPrice }]
            : []),
        ...(pendantCharm.enabled && selectedPendantCharm
            ? [{ key: "pendant", label: `Pendant Charm: ${selectedPendantCharm.name}`, price: pendantCharmPrice }]
            : []),
    ];
    const summaryAddOnsPrice = summaryAddOnLines.reduce((sum, line) => sum + (line.price || 0), 0);

    const summaryActionsContent = (
                <div className="theme3-panel-header-actions">
                    <div className="theme3-header-btns">
                        <div className="theme3-share-wrapper">
                            <button
                                type="button"
                                className="theme3-header-btn"
                                onClick={handleShare}
                                aria-label="Share configuration"
                            >
                                Share
                            </button>
                            {showCopied && (
                                <span className="theme3-share-toast" role="status">
                                    URL Copied
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            className="theme3-header-btn"
                            onClick={() => setShowResetPopup(true)}
                            aria-label="Reset configuration"
                        >
                            Reset
                        </button>
                    </div>
                    <div className="theme3-subtotal-block">
                        <button
                            type="button"
                            className={`theme3-summary-scroll-arrow${isSummaryExpanded ? " is-expanded" : ""}`}
                            aria-label={isSummaryExpanded ? "Hide summary" : "Show summary"}
                            aria-expanded={isSummaryExpanded}
                            onClick={handleSummaryArrowClick}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="4" viewBox="0 0 8 4" fill="none" aria-hidden="true">
                                <path d="M8 0.408978C8 0.299252 7.95549 0.199501 7.86648 0.119701C7.68846 -0.0399003 7.38804 -0.0399003 7.21001 0.119701L4.00556 2.99252L0.789986 0.119701C0.611961 -0.0399003 0.311544 -0.0399003 0.133519 0.119701C-0.0445063 0.279302 -0.0445063 0.548629 0.133519 0.70823L3.67177 3.8803C3.84979 4.0399 4.15021 4.0399 4.32823 3.8803L7.86648 0.70823C7.95549 0.628429 8 0.518703 8 0.418953V0.408978Z" fill="black"/>
                            </svg>
                        </button>
                        <strong>${totalPrice.toLocaleString()}</strong>
                    </div>
                </div>
    );

    const buildSummaryContent = isSummaryExpanded ? (
                    <section
                        className="theme3-build-summary order-summary-card jewelry-order-summary"
                        aria-label="Build Summary"
                    >
                        <div className="order-summary-section">
                            <div className="order-summary-row">
                                <span className="order-summary-title theme3-section-heading">Chain</span>
                                <span className="order-summary-price theme3-section-heading">${chainSummaryPrice.toLocaleString()}</span>
                            </div>
                            <div className="order-summary-desc">{chainSummaryDesc}</div>
                            {chainLengthLabel && (
                                <div className="order-summary-desc">
                                    Size: {chainLengthLabel}
                                    {chainLengthPrice > 0 ? ` · $${chainLengthPrice.toLocaleString()}` : ""}
                                </div>
                            )}
                        </div>

                        {summaryAddOnLines.length > 0 && (
                            <div className="order-summary-section">
                                <div className="order-summary-row">
                                    <span className="order-summary-title theme3-section-heading">Add-ons</span>
                                    {summaryAddOnsPrice > 0 && (
                                        <span className="order-summary-price theme3-section-heading">${summaryAddOnsPrice.toLocaleString()}</span>
                                    )}
                                </div>
                                {summaryAddOnLines.map((line) => (
                                    <div key={line.key} className="order-summary-row order-summary-addon">
                                        <span className="order-summary-desc">{line.label}</span>
                                        {line.price > 0 && (
                                            <span className="order-summary-desc">${line.price.toLocaleString()}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
    ) : null;

    return (
        <aside className={`theme3-configurator-panel${isSummaryExpanded ? " is-summary-open" : ""}`}>
            <header className="theme3-panel-header" ref={headerRef}>
                <div className="theme3-panel-suheader">
                    <h2>NECKLACE CONFIGURATOR</h2>
                    <h2>SUMMARY</h2>
                </div>
                {summaryActionsContent}

                {buildSummaryContent}
            </header>

            <div className="theme3-panel-scroll theme3-panel-scroll--flush-top" ref={scrollContainerRef}>
                {/* ── Chain Selection Section ── */}
                <div
                    className="theme3-option-section"
                    data-theme3-section="bracelet"
                    ref={sectionRefs.bracelet}
                >
                    <header className="theme3-jewelry-section-header">
                        <span className="theme3-section-heading">Jewelry</span>
                    </header>
                    <div
                        className="jewelry-category-row jewelry-category-row--compact"
                        role="tablist"
                        aria-label="Jewelry category"
                    >
                        <div className="jewelry-category-row-options">
                        {isCategoryAllowed(parent || resolveParentUrl(), "necklace") && (
                            <button
                                type="button"
                                role="tab"
                                aria-selected="true"
                                className="jewelry-category-btn theme3-option-box-label active"
                            >
                                Necklace
                            </button>
                        )}
                        {isCategoryAllowed(parent || resolveParentUrl(), "bracelet") && (
                            <button
                                type="button"
                                role="tab"
                                aria-selected="false"
                                className="jewelry-category-btn theme3-option-box-label"
                                onClick={() => { playClick(); rememberJewelryCategory("bracelet"); setJewelryType("bracelet"); onSectionChange?.("bracelet"); }}
                            >
                                Bracelet
                            </button>
                        )}
                        {isJewelryShellActive() && isCategoryAllowed(parent || resolveParentUrl(), "bead-bracelet") && (
                            <button
                                type="button"
                                role="tab"
                                aria-selected="false"
                                className="jewelry-category-btn theme3-option-box-label"
                                onClick={() => { playClick(); requestJewelryCategory("bead-bracelet"); }}
                            >
                                Bead Bracelet
                            </button>
                        )}
                    </div>
                </div>

                    <OptionRow title="Style">
                        {BRACELETS.filter((bracelet) => isNecklaceCatalogProductActive(necklaceChainId(bracelet.path))).map((bracelet) => {
                            const index = BRACELETS.indexOf(bracelet);
                            const productId = necklaceChainId(bracelet.path);
                            return (
                            <CardOption
                                key={bracelet.name}
                                active={selectedBracelet === index}
                                image={withChainIconVersion(BRACELET_CARD_IMAGE_BY_PATH[bracelet.path])}
                                label={getNecklaceCatalogLabel(productId, bracelet.name)}
                                onClick={() => {
    playClick();
    setSelectedBracelet(index);
    setBraceletPath(bracelet.path);
    applyMaterialBracelet(braceletMetal, '/textures/silver.jpg');
}}
                            />
                            );
                        })}
                    </OptionRow>

                    {supportsChainLength && (
                        <OptionRow title="Length">
                            {CHAIN_LENGTH_OPTIONS.map((opt) => (
                                <TextOption
                                    key={opt.id}
                                    active={(chainLength ?? DEFAULT_CHAIN_LENGTH) === opt.id}
                                    label={opt.label}
                                    onClick={() => { playClick(); setChainLength(opt.id); }}
                                />
                            ))}
                        </OptionRow>
                    )}

                    <OptionRow title="Metal">
                        {metalOptions.filter((metal) => isNecklaceCatalogProductActive(necklaceMetalId(metal))).map((metal) => (
                            <button
                                key={metal.alt}
                                type="button"
                                className={`gb-metal-option ${braceletMetal === metal.hex ? "active" : ""}`}
                                onClick={() => {
                                    playClick();
                                    applyMaterialBracelet(metal.hex, '/textures/silver.jpg', metal.roughness ?? null, metal.metalness ?? null);
                                    setBraceletMetal(metal.hex);
                                    if (metal.alt === "Platinum" || metal.alt === "Silver 925") {
                                        setBraceletPurity("9K");
                                        setCurrentPurityPrice(0);
                                    } else if (currentPurityPrice === 0) {
                                        setCurrentPurityPrice(100);
                                    }
                                }}
                                title={necklaceMetalLabel(metal)}
                                style={{ backgroundColor: metal.color || metal.hex }}
                            >
                                <small className="theme3-option-box-label">{necklaceMetalLabel(metal)}</small>
                            </button>
                        ))}
                    </OptionRow>

                    {hasPurity && (
                        <OptionRow title="Purity">
                            {purityOptions.filter((option) => isNecklaceCatalogProductActive(getNecklaceMetalId(braceletMetal, option.value))).map((option) => (
                                <TextOption
                                    key={option.value}
                                    active={braceletPurity === option.value}
                                    label={necklacePurityLabel(option)}
                                    onClick={() => {
                                        playClick();
                                        setBraceletPurity(option.value);
                                        setCurrentPurityPrice(option.price);
                                    }}
                                />
                            ))}
                        </OptionRow>
                    )}
                </div>

                {/* ── Charms & Text Section ── */}
                <div
                    className="theme3-option-section"
                    data-theme3-section="charms"
                    ref={sectionRefs.charms}
                >
                    <header className="theme3-option-section-header">
                        <span className="theme3-section-heading">Customize</span>
                        {(customizeType === "text" ? namePendantPrice : charmsPrice) > 0 && (
                            <span className="theme3-section-header-price theme3-section-heading">
                                ${(customizeType === "text" ? namePendantPrice : charmsPrice).toLocaleString()}
                            </span>
                        )}
                    </header>

                    {/* Active charm block — shown above the Charms/Text toggle so the
                        current selection is always visible */}
                    <div className="selected-charms-row" style={{ position: "relative" }}>
                        {charms.filter(Boolean).map((charm, index) => {
                            const isActive = index === activeCharmSlot;
                            const isDragging = dragState?.currentIndex === index;
                            return (
                                <div
                                    key={charm.id ?? index}
                                    ref={(el) => { charmSlotRefs.current[index] = el; }}
                                    className={`selected-charm-slot ${isActive ? 'active-slot' : ''} ${isDragging ? 'is-dragging-slot' : ''}`}
                                    onPointerDown={(e) => handleCharmPointerDown(e, index)}
                                    onDragStart={(e) => e.preventDefault()}
                                    onClick={() => {
                                        if (suppressCharmClickRef.current) {
                                            suppressCharmClickRef.current = false;
                                            return;
                                        }
                                        setActiveCharmSlot(index);
                                    }}
                                    style={{
                                        touchAction: "none",
                                        userSelect: "none",
                                        WebkitUserSelect: "none",
                                        WebkitUserDrag: "none",
                                        cursor: isDragging ? "grabbing" : "grab",
                                        ...(isDragging
                                            ? { transform: `translateX(${dragState.offsetX}px) scale(1.06)`, zIndex: 10, position: "relative" }
                                            : { transition: "transform 150ms ease" }),
                                    }}
                                >
                                    {charm.type === "initial" ? (
                                        <span style={{ fontSize: "24px", fontWeight: "bold", color: charm.metalColor || charmMetal }}>
                                            {(charm.letter || 'A').slice(0, 1).toUpperCase()}
                                        </span>
                                    ) : charm.type === "birthstone" ? (
                                        <img
                                            src={(STONE_COLOR_SWATCHES.find((s) => s.hex === charm.gemstoneColor) ?? STONE_COLOR_SWATCHES[0]).image}
                                            alt="Birthstone charm"
                                            draggable={false}
                                            style={{ WebkitUserDrag: "none", pointerEvents: "none" }}
                                        />
                                    ) : charm.type === "diamond" ? (
                                        <img
                                            src={charm.preview ?? "/images/diamond-charm.svg"}
                                            alt={charm.name ?? "Diamond charm"}
                                            draggable={false}
                                            style={{ WebkitUserDrag: "none", pointerEvents: "none" }}
                                        />
                                    ) : (
                                        <img
                                            src={charm.path || `/pc-assets/images/charm1.webp`}
                                            alt="Charm"
                                            draggable={false}
                                            style={{ WebkitUserDrag: "none", pointerEvents: "none" }}
                                        />
                                    )}
                                    <button
                                        type="button"
                                        className="remove-slot-btn"
                                        aria-label="Remove charm"
                                        onClick={(e) => { e.stopPropagation(); removeCharmAt(index); }}
                                    >
                                        ×
                                    </button>
                                </div>
                            );
                        })}

                        {Array.from({ length: Math.max(0, maxCharmsForNecklace - charms.filter(Boolean).length) }).map((_, emptyIndex) => (
                            <div
                                key={`add-slot-${emptyIndex}`}
                                className="selected-charm-slot add-slot"
                                title="Add a charm"
                                onClick={() => {
                                    if (activeCharmCategory === "initial") {
                                        addCustomCharm({ type: "initial", letter: initialLetter, metalColor: charmMetal }, false);
                                    } else if (activeCharmCategory === "birthstones") {
                                        addBirthstoneCharm(false);
                                    } else if (activeCharmCategory === "diamonds") {
    const diamondToAdd = CHARMS.find((c) => c.path === selectedDiamondPath)
        ?? CHARMS.find((c) => c.type === "diamond");
    if (diamondToAdd) addDiamondCharm(diamondToAdd, false);
}
                                }}
                            >
                                <span>+</span>
                            </div>
                        ))}

                        {charms.filter(Boolean).length > 0 && (
                            <button
                                type="button"
                                className="clear-all-charms-btn"
                                title="Remove all charms"
                                aria-label="Remove all charms"
                                onClick={() => { playBeadRemoveSound(); setCharms([]); setActiveCharmSlot(0); }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                                    <path d="M10 11v6"></path>
                                    <path d="M14 11v6"></path>
                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* TYPE toggle: Charms vs Text (name pendant) */}
                    {supportsNamePendant && (
                        <OptionRow title="Category">
                            <TextOption
                                active={customizeType === "charms"}
                                label="Charms"
                                onClick={() => { playClick(); setCustomizeType("charms"); }}
                            />
                            <TextOption
                                active={customizeType === "text"}
                                label="Text"
                                onClick={() => { playClick(); setCustomizeType("text"); }}
                            />
                        </OptionRow>
                    )}

                    {customizeType === "text" && supportsNamePendant ? (
                        <>
                            <div className="theme3-engraving-controls">
    <label>
        <span className="theme3-section-heading">Text</span>
        <small className="theme3-body-text">{namePendant.text?.length || 0}/16</small>
    </label>
    <div className="theme3-input-wrap" style={{ position: "relative" }}>
        <input
            type="text"
            className="theme3-body-text"
            value={namePendant.text || ""}
            maxLength={16}
            placeholder="Type a name"
            style={namePendant.text ? { paddingRight: "36px" } : undefined}
            onChange={(e) => {
                const cleaned = e.target.value.replace(/[^a-zA-Z0-9 '&.-]/g, '');
                const hasText = cleaned.trim().length > 0;
                updateNamePendant({ text: cleaned, enabled: hasText });
                if (!hasText) updatePendantCharm({ enabled: false });
            }}
        />
        {namePendant.text && (
            <button
                type="button"
                className="theme3-input-clear-btn"
                aria-label="Remove name"
                onClick={() => { playClick(); updateNamePendant({ enabled: false, text: "" }); }}
                style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "16px",
                    lineHeight: 1,
                    color: "#999",
                    padding: "4px",
                }}
            >
                ✕
            </button>
        )}
    </div>
</div>

                            <OptionRow title="Font Style">
                                {connectedFontOptions.filter((font) => isNecklaceCatalogProductActive(necklaceFontId(font))).map((font) => (
                                    <TextOption
                                        key={font.id}
                                        active={namePendant.fontStyle === font.id}
                                        onClick={() => { playClick(); updateNamePendant({ fontStyle: font.id, enabled: true }); }}
                                    >
                                        <span style={{ fontSize: "16px", fontWeight: "bold" }}>{font.sample}</span>
                                        <span>{getNecklaceCatalogLabel(necklaceFontId(font), font.label)}</span>
                                    </TextOption>
                                ))}
                            </OptionRow>

                            <OptionRow title="Metal">
                                {metalOptions.map((metal) => (
                                    <button
                                        key={`pendant-metal-${metal.alt}`}
                                        type="button"
                                        className={`gb-metal-option ${pendantMetalHex === metal.hex ? "active" : ""}`}
                                        onClick={() => {
                                            playClick();
                                            applyMaterial(metal.hex, '/textures/silver.jpg', metal.roughness ?? null, metal.metalness ?? null);
                                            setPendantMetalHex(metal.hex);
                                        }}
                                        title={metal.alt}
                                        style={{ backgroundColor: metal.color || metal.hex }}
                                    >
                                        <small className="theme3-option-box-label">{metal.alt}</small>
                                    </button>
                                ))}
                            </OptionRow>
                        </>
                    ) : (
                    <>

                    <OptionRow title="Metal">
                        {CHARM_METAL_SWATCHES.map((metal) => (
                            <button
                                key={`charm-metal-${metal.label}`}
                                type="button"
                                className={`gb-metal-option ${activeCharmMetal === metal.hex ? "active" : ""}`}
                                onClick={() => { playClick(); setActiveCharmMetal(metal); }}
                                title={metal.label}
                                style={{ backgroundColor: metal.color || metal.hex }}
                            >
                                <small className="theme3-option-box-label">{metal.label}</small>
                            </button>
                        ))}
                    </OptionRow>

                    {/* Charm Category Switcher */}
                    <section className="gb-option-row" >
                        <div className="gb-option-title" >
                            <span className="theme3-section-heading">Collection</span>
                        </div>
                        <div
                            className="necklace-charm-category-nav"
                            style={{ display: "flex", alignItems: "center", gap: "10px" }}
                        >
                            {availableCharmCategories.map((cat) => {
                                const isActive = cat.id === activeCharmCategory;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        title={cat.label}
                                        className={`necklace-charm-category-btn ${isActive ? "active" : ""}`}
                                        onClick={() => { playClick(); setActiveCharmCategory(cat.id); }}
                                    >
                                        {cat.icon(isActive)}
                                    </button>
                                );
                            })}
                            <span
                                className="necklace-charm-category-label theme3-section-heading"
                                style={{ marginLeft: "6px", fontSize: "16px", fontWeight: "700" }}
                            >
                                {availableCharmCategories.find(c => c.id === activeCharmCategory)?.label}
                            </span>
                        </div>
                    </section>

                    {activeCharmCategory === "birthstones" && (
    <OptionRow className="gb-option-row--two-line theme3-initial-grid">
        {STONE_COLOR_SWATCHES.filter((stone) => isNecklaceCatalogProductActive(getNecklaceBirthstoneIdByHex(stone.hex))).map((stone) => (
            <button
                key={stone.hex}
                type="button"
                className={`gb-stone-card-option ${stoneColor === stone.hex ? "active" : ""}`}
                onClick={() => selectBirthstone(stone)}
            >
                <img src={stone.image} alt={stone.label} />
                <span className="theme3-option-box-label">{getNecklaceCatalogLabel(getNecklaceBirthstoneIdByHex(stone.hex), stone.label)}</span>
            </button>
        ))}
    </OptionRow>
)}

                    {activeCharmCategory === "diamonds" && (
    <OptionRow title="Diamond" className="gb-option-row--two-line theme3-initial-grid">
        {CHARMS.filter((c) => c.type === 'diamond' && isNecklaceCatalogProductActive(getNecklaceDiamondCharmIdByPath(c.path))).map((charm) => (
            <CardOption
                key={charm.path}
                active={
                    charms[activeCharmSlot]?.type === 'diamond' &&
                    charms[activeCharmSlot]?.path === charm.path
                }
                image={charm.preview}
                label={getNecklaceCatalogLabel(getNecklaceDiamondCharmIdByPath(charm.path), charm.name)}
                onClick={() => addDiamondCharm(charm)}
            />
        ))}
    </OptionRow>
)}

                    {activeCharmCategory === "initial" && !isNameChain && (
                        <OptionRow title="Initial" className="gb-option-row--two-line theme3-initial-grid">
                            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => (
                                <button
                                    key={letter}
                                    type="button"
                                    className={` initial-charm-block gb-card-option ${initialLetter === letter ? "active" : ""}`}
                                    onClick={() => selectInitialLetter(letter)}
                                    title={`Letter ${letter}`}
                                >
                                    <span style={{ fontSize: "80px", fontWeight: "700", color: "#171717", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>

                                        {letter}
                                    </span>
                                </button>
                            ))}
                        </OptionRow>
                    )}
                    </>
                    )}
                </div>
            </div>

            <footer className="theme3-panel-footer" ref={footerRef}>
                <div className="theme3-footer-build-summary">{buildSummaryContent}</div>

                <div className="theme3-footer-main">
                    <div className="theme3-summary-info">
                        <button
                            type="button"
                            className="theme3-summary-details-toggle"
                            aria-label={isSummaryExpanded ? "Hide details" : "View details"}
                            aria-expanded={isSummaryExpanded}
                            onClick={handleSummaryArrowClick}
                        >
                            <span className="theme3-link-text">View details</span>
                            <svg
                                className={`theme3-summary-toggle-arrow theme3-link-text${isSummaryExpanded ? " is-expanded" : ""}`}
                                xmlns="http://www.w3.org/2000/svg"
                                width="8"
                                height="5"
                                viewBox="0 0 8 5"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M8 4.29102C8 4.40075 7.95549 4.5005 7.86648 4.5803C7.68846 4.7399 7.38804 4.7399 7.21001 4.5803L4.00556 1.70748L0.789986 4.5803C0.611961 4.7399 0.311544 4.7399 0.133519 4.5803C-0.0445063 4.4207 -0.0445063 4.15137 0.133519 3.99177L3.67177 0.819701C3.84979 0.660101 4.15021 0.660101 4.32823 0.819701L7.86648 3.99177C7.95549 4.07157 8 4.1813 8 4.28105V4.29102Z"
                                    fill="currentColor"
                                />
                            </svg>
                        </button>

                        <div className="theme3-summary-price-row">
                            <strong className="theme3-summary-price theme3-section-heading">
                                ${totalPrice.toLocaleString()}
                            </strong>
                            {getFooterSummaryTaxLabel() ? (
                                <span className="theme3-summary-tax-label theme3-body-text">{getFooterSummaryTaxLabel()}</span>
                            ) : null}
                        </div>
                    </div>

                    <div className="theme3-footer-actions">
                        <button
                            type="button"
                            className="theme3-panel-footer-cta"
                            disabled={addedToCart}
                            onClick={handleNextStep}
                        >
                            {nextStepButtonText}
                        </button>

                        <div className="theme3-panel-action-wrapper">
                            <button
                                type="button"
                                className="theme3-panel-action-btn theme3-panel-share-btn"
                                onClick={handleShare}
                                aria-label="Share necklace configuration"
                            >
                                Share
                            </button>
                            <button
                                type="button"
                                className="theme3-panel-action-btn theme3-panel-reset-btn"
                                onClick={() => setShowResetPopup(true)}
                                aria-label="Reset necklace configuration"
                            >
                                Reset
                            </button>
                            {showCopied && (
                                <span className="theme3-share-toast" role="status">
                                    URL Copied
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </footer>

            {/* Reset Confirmation Modal */}
            {showResetPopup && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
                    <div className="confirm-popup">
                        <button
                            className="close-cross"
                            onClick={() => setShowResetPopup(false)}
                            aria-label="Close"
                        >
                            ✕
                        </button>
                        <p style={{ fontSize: "16px", fontWeight: "700", margin: "10px 0 6px" }}>
                            Reset Necklace?
                        </p>
                        <p style={{ color: "#666666", fontSize: "13px", marginBottom: "20px" }}>
                            This will clear all your custom selections.
                        </p>
                        <button
                            className="cnfm-btn"
                            onClick={() => {
                                handleReset();
                                setShowResetPopup(false);
                            }}
                        >
                            Confirm Reset
                        </button>
                    </div>
                </div>
            )}

            <ToastContainer />
        </aside>
    );
});

export default Controls;
