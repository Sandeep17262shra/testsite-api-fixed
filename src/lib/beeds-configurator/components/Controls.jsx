import React, { useContext, useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { BraceletContext } from "../contexts/BraceletContext";
import * as THREE from 'three';
import { ToastContainer, toast } from 'react-toastify';
import {
    BRACELETS, CHARMS, CHARM_METAL_SWATCHES, STONE_COLOR_SWATCHES,
    getImageCharmPath, getImageCharmIconPath, getCharmNumberFromPath, isImageCharmNumber,
    BRACELET_CARD_IMAGE_BY_PATH, NAME_PENDANT_SUPPORTED_PATHS, NAME_PENDANT_FONTS,
    NAME_PENDANT_MAX_LENGTH, DEFAULT_NAME_PENDANT, sanitizePendantText,
} from '../assets';
import { Base64 } from "js-base64";
import { ShareContext } from "../contexts/ShareContext";
import { View360Context } from "../contexts/View360Context";

function CardOption({ active, label, image, onClick, disabled = false }) {
  return (
    <button
      type="button"
      className={`gb-card-option ${active ? "active" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {image && <img src={image} alt={label || ""} />}
      {label && <span>{label}</span>}
    </button>
  );
}

function TextOption({ active, label, onClick, disabled = false, children }) {
  return (
    <button
      type="button"
      className={`gb-text-option ${active ? "active" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children || label}
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
          <span>{title}</span>
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

const BRACELET_CHARM_CATEGORIES = [
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
  {
    id: "2d",
    label: "2D Charms",
    icon: (active) => (
      <img
        src="/images/2d-charm.svg"
        alt="2D Charms"
        width={22}
        height={22}
        style={{ filter: active ? "invert(1) brightness(2)" : "none" }}
      />
    ),
  },
  {
    id: "3d",
    label: "3D Charms",
    icon: (active) => (
      <img
        src="/images/3d-charm.svg"
        alt="3D Charms"
        width={22}
        height={22}
        style={{ filter: active ? "invert(1) brightness(2)" : "none" }}
      />
    ),
  },
];

const Controls = forwardRef(function Controls({ activeSection = "bracelet", onSectionChange }, ref) {
    const {
        selectedBracelet, setSelectedBracelet,
        braceletPath, setBraceletPath,
        charms, setCharms,
        namePendant, setNamePendant,
        braceletMetal, setBraceletMetal,
        braceletPurity, setBraceletPurity,
        currentMetalPrice, setCurrentMetalPrice,
        currentPurityPrice, setCurrentPurityPrice,
        braceletSize, setBraceletSize,
        currentBraceletSizePrice, setCurrentBraceletSizePrice,
        setMaterialPropsBracelet,
        setTexture,
        setMaterialProps,
        showResetPopup, setShowResetPopup,
        setResetObj,
    } = useContext(BraceletContext);

    const { setShare, shareUrl, setShareUrl, parent, setParent } = useContext(ShareContext);

    const [activeCharmSlot, setActiveCharmSlot] = useState(0);
    const [activeCharmCategory, setActiveCharmCategory] = useState("birthstones");
    const [customizeType, setCustomizeType] = useState("charms"); // 'charms' | 'text'
    const [stoneColor, setStoneColor] = useState(STONE_COLOR_SWATCHES[0].hex);
    const [initialLetter, setInitialLetter] = useState("A");
    const [initialFont, setInitialFont] = useState("dancing");
    const [charmMetal, setCharmMetal] = useState("#DBDBDB");

    const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
    const [dragState, setDragState] = useState(null); // { pointerId, fromIndex, currentIndex, startX, offsetX }
    const [showCopied, setShowCopied] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);
    const [continueMessage, setContinueMessage] = useState("");
    const [pendingCartPayload, setPendingCartPayload] = useState(null);

    const scrollContainerRef = useRef(null);
    const headerRef = useRef(null);
    const footerRef = useRef(null);
    const charmSlotRefs = useRef([]);
    const suppressCharmClickRef = useRef(false);
    const sectionRefs = {
      bracelet: useRef(null),
      charms: useRef(null),
    };

    const metalOptions = [
        { code: "WG", alt: "White Gold",  hex: "#DBDBDB", color: "#D8D8D8", price: 100 },
        { code: "YG", alt: "Yellow Gold", hex: "#FFD280", color: "#FFDFA5", price: 100 },
        { code: "RG", alt: "Rose Gold",   hex: "#FFBAA3", color: "#FFC9B0", price: 100 },
        { code: "PL", alt: "Platinum",    hex: "#e5e4e2", color: "#D8D8D8", price: 200 },
    ];

    const purityOptions = [
        { label: "9K", value: "9K", price: 100 },
        { label: "14K", value: "14K", price: 200 },
        { label: "18K", value: "18K", price: 300 },
    ];

    const bSizes = [
        { size: "4", price: 0 },
        { size: "4.25", price: 10 },
        { size: "4.5", price: 20 },
        { size: "4.75", price: 20 },
        { size: "5", price: 30 },
        { size: "5.25", price: 30 },
        { size: "5.5", price: 40 },
        { size: "5.75", price: 40 },
        { size: "6", price: 50 },
        { size: "6.25", price: 50 },
        { size: "6.5", price: 60 },
        { size: "6.75", price: 60 },
        { size: "7", price: 70 },
        { size: "7.25", price: 70 },
        { size: "7.5", price: 80 },
        { size: "7.75", price: 80 },
        { size: "8", price: 90 },
        { size: "8.25", price: 90 },
    ];

    // Only the generated name chain can open up around a name plate.
    const supportsNamePendant = NAME_PENDANT_SUPPORTED_PATHS.includes(braceletPath);
    const namePendantText = sanitizePendantText(namePendant?.text || "");
    const hasNamePendant = supportsNamePendant && Boolean(namePendant?.enabled) && namePendantText.length > 0;

    const updateNamePendant = (updates) =>
        setNamePendant((prev) => ({ ...(prev || DEFAULT_NAME_PENDANT), ...updates }));

    useEffect(() => {
        if (!supportsNamePendant && customizeType === "text") {
            setCustomizeType("charms");
        }
    }, [supportsNamePendant, customizeType]);

    const isPlatinum = braceletMetal === "#e5e4e2";
    const braceletBasePrice = BRACELETS[selectedBracelet]?.price || 3200;
    const braceletTotalPrice =
        braceletBasePrice +
        currentMetalPrice +
        (isPlatinum ? 0 : currentPurityPrice) +
        currentBraceletSizePrice;

    const charmsPrice = charms.reduce((total, charm) => {
        if (!charm) return total;
        if (charm.type === "initial") return total + 40;
        if (charm.type === "birthstone") return total + 50;
        if (charm.type === "diamond") return total + 50;
        const charmData = CHARMS.find((c) => c.path === charm.path);
        return total + (charmData ? charmData.price : 50);
    }, 0);

    const finalProductPrice = braceletTotalPrice + charmsPrice;

    const applyMaterialBracelet = (color, texturePath = null) => {
        setMaterialPropsBracelet((prev) => ({ ...prev, color }));
        if (texturePath) {
            new THREE.TextureLoader().load(texturePath, (tex) => setTexture(tex));
        } else {
            setTexture(null);
        }
    };

    const applyMaterial = (color, texturePath = null) => {
        setMaterialProps((prev) => ({ ...prev, color }));
        if (texturePath) {
            new THREE.TextureLoader().load(texturePath, (tex) => setTexture(tex));
        } else {
            setTexture(null);
        }
    };

    // Close summary dropdown on outside click
    useEffect(() => {
        if (!isSummaryExpanded) return undefined;

        const handleClickOutside = (event) => {
            const header = headerRef.current;
            const footer = footerRef.current;
            const isInsideHeader = header && header.contains(event.target);
            const isInsideFooter = footer && footer.contains(event.target);
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
        setIsSummaryExpanded((prev) => !prev);
    };

    const handleMetalClick = (metal) => {
        applyMaterialBracelet(metal.hex, '/textures/silver.jpg');
        setBraceletMetal(metal.hex);
        setCurrentMetalPrice(metal.price);
        if (metal.alt === "Platinum") {
            setBraceletPurity("9K");
            setCurrentPurityPrice(0);
        } else if (currentPurityPrice === 0) {
            setCurrentPurityPrice(100);
        }
    };

    const handlePurityClick = (option) => {
        setBraceletPurity(option.value);
        setCurrentPurityPrice(option.price);
    };

    const handleBraceletSize = (option) => {
        setBraceletSize(option.size);
        setCurrentBraceletSizePrice(option.price);
    };

    const getCharmData = (charm) => {
        const number = charm?.imageCharmNumber ?? getCharmNumberFromPath(charm?.path);
        return CHARMS.find((item) => item.path === charm?.path || getCharmNumberFromPath(item.path) === number);
    };

    // No charm is placed automatically - a bare chain is a valid product, and
    // the empty "+" slot is how the user adds their first one.

    const activeCharmObj = activeCharmSlot !== null ? charms[activeCharmSlot] : null;
    useEffect(() => {
        if (!activeCharmObj) return;
        if (activeCharmObj.type === "initial") {
            if (activeCharmObj.metalColor) setCharmMetal(activeCharmObj.metalColor);
            if (activeCharmObj.letter) setInitialLetter(activeCharmObj.letter);
            return;
        }
        if (activeCharmObj.type === "birthstone" || activeCharmObj.type === "diamond") {
            if (activeCharmObj.bodyColor) setCharmMetal(activeCharmObj.bodyColor);
            if (activeCharmObj.type === "birthstone" && activeCharmObj.gemstoneColor) {
                setStoneColor(activeCharmObj.gemstoneColor);
            }
            return;
        }
        const number = activeCharmObj.imageCharmNumber ?? getCharmNumberFromPath(activeCharmObj.path);
        if (isImageCharmNumber(number)) {
            const selectedMetal = CHARM_METAL_SWATCHES.find((m) => m.hex === activeCharmObj.metalColor)
                ?? CHARM_METAL_SWATCHES.find((m) => m.key === activeCharmObj.metal);
            if (selectedMetal) setCharmMetal(selectedMetal.hex);
        }
    }, [activeCharmSlot, charms]);

    const addCustomCharm = (charm, replaceActive = true) => {
        if (replaceActive && activeCharmSlot !== null && charms[activeCharmSlot]) {
            const updated = [...charms];
            updated[activeCharmSlot] = { ...charm, id: updated[activeCharmSlot].id };
            setCharms(updated);
            return;
        }
        const placedCharms = charms.filter(Boolean);
        if (placedCharms.length >= 5) {
            toast("Maximum of 5 charms reached for this bracelet!", { autoClose: 1500 });
            return;
        }
        const updated = [...placedCharms, { ...charm, id: Date.now() + Math.random() }];
        setCharms(updated);
        setActiveCharmSlot(updated.length - 1);
    };

    const addMetalVariantCharm = (charm, forceNew = false) => {
        const number = getCharmNumberFromPath(charm.path);
        const selectedMetal = CHARM_METAL_SWATCHES.find((m) => m.hex === charmMetal) ?? CHARM_METAL_SWATCHES[0];
        const variant = {
            path: getImageCharmPath(number, selectedMetal.key),
            imageCharmNumber: number,
            metal: selectedMetal.key,
            metalColor: selectedMetal.hex,
            name: charm.name,
        };
        if (!forceNew && activeCharmSlot !== null && charms[activeCharmSlot]) {
            const updated = [...charms];
            updated[activeCharmSlot] = { ...variant, id: updated[activeCharmSlot].id };
            setCharms(updated);
            return;
        }
        if (charms.filter(Boolean).length >= 5) {
            toast("Maximum of 5 charms reached for this bracelet!", { autoClose: 1500 });
            return;
        }
        const updated = [...charms.filter(Boolean), { ...variant, id: Date.now() + Math.random() }];
        setCharms(updated);
        setActiveCharmSlot(updated.length - 1);
    };

    const addCharm = (charmPath, forceNew = false) => {
        const charmData = CHARMS.find((c) => c.path === charmPath);
        if (!forceNew && activeCharmSlot !== null && charms[activeCharmSlot]) {
            const updated = [...charms];
            updated[activeCharmSlot] = { path: charmPath, name: charmData?.name, id: updated[activeCharmSlot].id };
            setCharms(updated);
            return;
        }
        const placedCharms = charms.filter(Boolean);
        if (placedCharms.length >= 5) {
            toast("Maximum of 5 charms reached for this bracelet!", { autoClose: 1500 });
            return;
        }
        const updated = [...placedCharms, { path: charmPath, name: charmData?.name, id: Date.now() + Math.random() }];
        setCharms(updated);
        setActiveCharmSlot(updated.length - 1);
    };

    const addBirthstoneCharm = (replaceActive = true, selectedStoneColor = stoneColor) => {
        const birthstoneCharmData = CHARMS.find((c) => c.type === "birthstone");
        if (!birthstoneCharmData) return;
        addCustomCharm({
            type: "birthstone",
            path: birthstoneCharmData.path,
            name: "Birthstone",
            bodyColor: charmMetal,
            gemstoneColor: selectedStoneColor,
        }, replaceActive);
    };

    const selectBirthstone = (stone) => {
        setStoneColor(stone.hex);
        addBirthstoneCharm(true, stone.hex);
    };

    const addDiamondCharm = (diamondCharm, replaceActive = true) => {
        addCustomCharm({
            type: "diamond",
            path: diamondCharm.path,
            preview: diamondCharm.preview,
            name: diamondCharm.name,
            bodyColor: charmMetal,
            gemstoneColor: "#F4F8FF",
        }, replaceActive);
    };

    const selectInitialLetter = (letter) => {
        setInitialLetter(letter);
        addCustomCharm({ type: "initial", letter, fontStyle: initialFont, metalColor: charmMetal });
    };

    const setActiveCharmMetal = (metal) => {
        setCharmMetal(metal.hex);
        if (activeCharmSlot === null || !charms[activeCharmSlot]) return;
        const activeCharm = charms[activeCharmSlot];
        const updated = [...charms];
        if (activeCharm.type === 'initial') {
            updated[activeCharmSlot] = { ...activeCharm, metalColor: metal.hex };
            setCharms(updated);
            return;
        }
        if (activeCharm.type === 'birthstone' || activeCharm.type === 'diamond') {
            updated[activeCharmSlot] = { ...activeCharm, bodyColor: metal.hex };
            setCharms(updated);
            return;
        }
        const number = activeCharm.imageCharmNumber ?? getCharmNumberFromPath(activeCharm.path);
        if (isImageCharmNumber(number)) {
            updated[activeCharmSlot] = {
                ...activeCharm,
                path: getImageCharmPath(number, metal.key),
                imageCharmNumber: number,
                metal: metal.key,
                metalColor: metal.hex,
            };
            setCharms(updated);
        }
    };

    const removeCharmAt = (index) => {
        const updated = charms.filter((_, charmIndex) => charmIndex !== index);
        setCharms(updated);
        setActiveCharmSlot(updated.length ? Math.min(index, updated.length - 1) : 0);
    };

    // --- Drag-to-reorder charm slots ---
    const reorderCharms = (fromIndex, toIndex) => {
        if (fromIndex === toIndex) return;
        setCharms((prev) => {
            const updated = [...prev];
            const [moved] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, moved);
            return updated;
        });
        setActiveCharmSlot(toIndex);
    };

    const handleCharmPointerDown = (event, index) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        if (event.target.closest(".remove-slot-btn")) return;
        event.preventDefault();
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

    const handleReset = () => {
        setSelectedBracelet(0);
        setBraceletPath(BRACELETS[0].path);
        setCharms([]);
        setActiveCharmSlot(0);
        applyMaterialBracelet('#DBDBDB', '/textures/silver.jpg');
        applyMaterial('#DBDBDB', '/textures/silver.jpg');
        setTexture(null);
        setBraceletMetal("#DBDBDB");
        setBraceletPurity("9K");
        setCurrentMetalPrice(100);
        setCurrentPurityPrice(100);
        setBraceletSize("5");
        setCurrentBraceletSizePrice(30);
        setCharmMetal("#DBDBDB");
        setNamePendant(DEFAULT_NAME_PENDANT);
        setResetObj({
            position: [0.01, 2.9, 0.15],
            near: 0.1,
            far: 100,
        });
    };

    useImperativeHandle(ref, () => ({
        handleReset,
        scrollToSection: (sectionId) => {
            const sectionNode = sectionRefs[sectionId]?.current;
            const container = scrollContainerRef.current;
            if (sectionNode && container) {
                const sectionTop = sectionNode.offsetTop;
                container.scrollTo({ top: sectionTop - 10, behavior: "smooth" });
            }
        }
    }));

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

    const handleShare = async () => {
        try {
            const config = {
                type: "bracelet",
                selectedBracelet,
                braceletPath,
                charms,
                namePendant,
                braceletMetal,
                braceletPurity,
                braceletSize,
                currentMetalPrice,
                currentPurityPrice,
                currentBraceletSizePrice,
                braceletTotalPrice,
                charmsPrice,
                finalProductPrice,
            };
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);

            const encoded = Base64.encode(JSON.stringify(config));
            const storefrontUrl = resolveStorefrontUrl();
            const url = storefrontUrl || new URL(window.location.href);
            url.search = "";
            url.searchParams.set("config", encoded);
            const finalUrl = url.toString();

            await navigator.clipboard.writeText(finalUrl);
        } catch (err) {
            console.error("Share failed:", err);
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

        const selectedCharmsSummary = charms.filter(Boolean).map((charm) => {
            if (charm.type === "initial") return `Initial "${charm.letter || 'A'}"`;
            if (charm.type === "birthstone") return STONE_COLOR_SWATCHES.find((s) => s.hex === charm.gemstoneColor)?.label || "Birthstone";
            if (charm.type === "diamond") return charm.name || "Diamond Charm";
            return getCharmData(charm)?.name || "Charm";
        }).join(", ");

        setPendingCartPayload({
            type: 'ADD_TO_CART',
            quantity: 1,
            Title: `${BRACELETS[selectedBracelet]?.name}${hasNamePendant ? ` "${namePendantText}"` : ''} - ${isPlatinum ? '' : `${braceletPurity} `}${metalOptions.find((o) => o.hex === braceletMetal)?.alt} - Size ${braceletSize}`,
            Price: finalProductPrice,
            Category: 'Bracelet',
            BraceletStyle: BRACELETS[selectedBracelet]?.name,
            BraceletSize: braceletSize,
            MetalType: metalOptions.find((o) => o.hex === braceletMetal)?.alt,
            Purity: isPlatinum ? 'Platinum' : braceletPurity,
            Name: hasNamePendant ? namePendantText : "None",
            NameFont: hasNamePendant
                ? (NAME_PENDANT_FONTS.find((f) => f.id === namePendant.fontStyle)?.label || "Dancing")
                : "None",
            Charms: selectedCharmsSummary || "None",
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
        window.setTimeout(() => setAddedToCart(false), 1000);
    }, [pendingCartPayload, shareUrl]);

    const handleNextStep = () => {
        if (activeSection === "bracelet") {
            onSectionChange?.("charms");
            const node = sectionRefs.charms?.current;
            node?.scrollIntoView({ behavior: "smooth" });
        } else {
            addToCart();
        }
    };

    const nextStepButtonText = activeSection === "bracelet"
        ? "Add-ons"
        : addedToCart
        ? "Adding to Cart..."
        : "Add to Cart";

    const nextStepCopy = activeSection === "bracelet"
        ? "Add charms or a name"
        : "Add your bracelet to cart";

    const charms2D = CHARMS.slice(8, 23);
    const charms3D = CHARMS.slice(0, 8);

    // ---- Build-summary derived values ----
    const placedCharms = charms.filter(Boolean);

    const getMetalDisplayLabel = (hex) => {
        const found = metalOptions.find((o) => o.hex?.toLowerCase() === hex?.toLowerCase());
        return found ? (found.alt || found.code) : "White Gold";
    };

    const braceletSummaryDesc = [
        BRACELETS[selectedBracelet]?.name || "Bracelet",
        hasNamePendant ? `"${namePendantText}"` : "",
        [isPlatinum ? "" : braceletPurity, getMetalDisplayLabel(braceletMetal)].filter(Boolean).join(" "),
        `${braceletSize}"`,
    ].filter(Boolean).join(" \u00b7 ");

    const getCharmSummaryName = (charm) => {
        if (charm.type === "diamond") return charm.name || "Round Diamond";
        if (charm.type === "birthstone") {
            return STONE_COLOR_SWATCHES.find((s) => s.hex?.toLowerCase() === charm.gemstoneColor?.toLowerCase())?.label || "Birthstone";
        }
        if (charm.type === "initial") return `Initial "${charm.letter || 'A'}"`;
        return getCharmData(charm)?.name || charm.name || "Charm";
    };

    const getCharmSummaryMetal = (charm) => {
        const hex = charm.bodyColor || charm.metalColor || charmMetal || braceletMetal;
        const foundCharmMetal = CHARM_METAL_SWATCHES.find((m) => m.hex?.toLowerCase() === hex?.toLowerCase());
        const metalLabel = foundCharmMetal
            ? foundCharmMetal.label
            : getMetalDisplayLabel(hex);
        const price =
            charm.type === "initial" ? 40
            : charm.type === "birthstone" ? 50
            : charm.type === "diamond" ? 50
            : (CHARMS.find((c) => c.path === charm.path)?.price ?? 50);
        return `${metalLabel} ($${price})`;
    };

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
                <strong>${finalProductPrice.toLocaleString()}</strong>
            </div>
        </div>
    );

    const buildSummaryContent = isSummaryExpanded ? (
        <section
            className="theme3-build-summary order-summary-card"
            aria-label="Build Summary"
        >
            {/* Bracelet */}
            <div className="order-summary-section">
                <div className="order-summary-row">
                    <span className="order-summary-title">Bracelet</span>
                    <span className="order-summary-price">${braceletTotalPrice.toLocaleString()}</span>
                </div>
                <div className="order-summary-desc">{braceletSummaryDesc}</div>
            </div>

            {/* Charms (if any placed) */}
            {placedCharms.length > 0 && (
                <div className="order-summary-section">
                    <div className="order-summary-row">
                        <span className="order-summary-title">Charms ({placedCharms.length})</span>
                        {charmsPrice > 0 && (
                            <span className="order-summary-price">${charmsPrice.toLocaleString()}</span>
                        )}
                    </div>
                    <div className="order-summary-charms-list">
                        {placedCharms.map((charm, index) => (
                            <div key={charm.id ?? index} className="order-summary-charm-item">
                                <span className="order-summary-charm-name">{getCharmSummaryName(charm)}</span>
                                <span className="order-summary-charm-metal">{getCharmSummaryMetal(charm)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    ) : null;

    return (
        <aside className="theme3-configurator-panel">
            <header className="theme3-panel-header" ref={headerRef}>
                <div className="theme3-panel-suheader">
                    <h2>BRACELET CONFIGURATOR</h2>
                    <h2>SUMMARY</h2>
                </div>
                {summaryActionsContent}
                {buildSummaryContent}
            </header>

            <div className="theme3-panel-scroll" ref={scrollContainerRef}>
                <div
                    className="theme3-option-section"
                    data-theme3-section="bracelet"
                    ref={sectionRefs.bracelet}
                >
                    <header className="theme3-option-section-header">
                        <h3>Bracelet Selection</h3>
                        <span className="theme3-section-header-price">
                            ${(braceletBasePrice + currentBraceletSizePrice + currentMetalPrice + (isPlatinum ? 0 : currentPurityPrice)).toLocaleString()}
                        </span>
                    </header>

                    <OptionRow title="Style">
                        {BRACELETS.map((bracelet, index) => {
                            return (
                                <CardOption
                                    key={bracelet.name}
                                    active={selectedBracelet === index}
                                    image={BRACELET_CARD_IMAGE_BY_PATH[bracelet.path]}
                                    label={bracelet.name}
                                    onClick={() => {
                                        setSelectedBracelet(index);
                                        setBraceletPath(bracelet.path);
                                        applyMaterialBracelet(braceletMetal, '/textures/silver.jpg');
                                    }}
                                />
                            );
                        })}
                    </OptionRow>

                    <OptionRow title="Size">
                        {bSizes.map((opt) => (
                            <TextOption
                                key={opt.size}
                                active={braceletSize === opt.size}
                                onClick={() => handleBraceletSize(opt)}
                            >
                                <span>{opt.size}&quot;</span>
                            </TextOption>
                        ))}
                    </OptionRow>

                    <OptionRow title="Metal">
                        {metalOptions.map((metal) => (
                            <button
                                key={metal.alt}
                                type="button"
                                className={`gb-metal-option ${braceletMetal === metal.hex ? "active" : ""}`}
                                onClick={() => handleMetalClick(metal)}
                                title={metal.alt}
                                style={{ backgroundColor: metal.color || metal.hex }}
                            >
                                <small>{metal.alt}</small>
                            </button>
                        ))}
                    </OptionRow>

                    {!isPlatinum && (
                        <OptionRow title="Purity">
                            {purityOptions.map((option) => (
                                <TextOption
                                    key={option.value}
                                    active={braceletPurity === option.value}
                                    label={option.label}
                                    onClick={() => handlePurityClick(option)}
                                />
                            ))}
                        </OptionRow>
                    )}
                </div>

                <div
                    className="theme3-option-section"
                    data-theme3-section="charms"
                    ref={sectionRefs.charms}
                >
                    <header className="theme3-option-section-header">
                        <h3>{customizeType === "text" ? "Name Plate" : "Charms"}</h3>
                        {(customizeType === "text" ? 0 : charmsPrice) > 0 && (
                            <span className="theme3-section-header-price">
                                ${charmsPrice.toLocaleString()}
                            </span>
                        )}
                    </header>

                    {supportsNamePendant && (
                        <OptionRow title="Type">
                            <TextOption
                                active={customizeType === "charms"}
                                label="Charms"
                                onClick={() => setCustomizeType("charms")}
                            />
                            <TextOption
                                active={customizeType === "text"}
                                label="Text"
                                onClick={() => setCustomizeType("text")}
                            />
                        </OptionRow>
                    )}

                    {customizeType === "text" && supportsNamePendant ? (
                        <>
                            <div className="theme3-engraving-controls">
                                <label>
                                    Name
                                    <small>{namePendant?.text?.length || 0}/{NAME_PENDANT_MAX_LENGTH}</small>
                                </label>
                                <div className="theme3-input-wrap" style={{ position: "relative" }}>
                                    <input
                                        type="text"
                                        value={namePendant?.text || ""}
                                        maxLength={NAME_PENDANT_MAX_LENGTH}
                                        placeholder="Type a name"
                                        style={namePendant?.text ? { paddingRight: "36px" } : undefined}
                                        onChange={(e) => {
                                            const cleaned = sanitizePendantText(e.target.value);
                                            updateNamePendant({ text: cleaned, enabled: cleaned.trim().length > 0 });
                                        }}
                                    />
                                    {namePendant?.text && (
                                        <button
                                            type="button"
                                            className="theme3-input-clear-btn"
                                            aria-label="Remove name"
                                            onClick={() => updateNamePendant({ enabled: false, text: "" })}
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
                                            &#10005;
                                        </button>
                                    )}
                                </div>
                            </div>

                            <OptionRow title="Name Font">
                                {NAME_PENDANT_FONTS.map((font) => (
                                    <TextOption
                                        key={font.id}
                                        active={namePendant?.fontStyle === font.id}
                                        onClick={() => updateNamePendant({ fontStyle: font.id })}
                                    >
                                        <span style={{ fontSize: "16px", fontWeight: "bold" }}>{font.sample}</span>
                                        <span>{font.label}</span>
                                    </TextOption>
                                ))}
                            </OptionRow>
                        </>
                    ) : (
                    <>
                    <div className="selected-charms-row">
                        {charms.filter(Boolean).map((charm, index) => {
                            const isActive = index === activeCharmSlot;
                            const isDragging = dragState?.currentIndex === index;
                            const charmData = getCharmData(charm);
                            const charmNumber = charm.imageCharmNumber ?? getCharmNumberFromPath(charm.path);
                            const realCharmIndex = CHARMS.findIndex((c) => c.path === charmData?.path);

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
                                        <span style={{ fontSize: "20px", fontWeight: "bold", color: charm.metalColor || charmMetal }}>
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
                                            src={charm.preview ?? charmData?.preview ?? "/images/diamond-charm.svg"}
                                            alt={charm.name ?? "Diamond charm"}
                                            draggable={false}
                                            style={{ WebkitUserDrag: "none", pointerEvents: "none" }}
                                        />
                                    ) : (
                                        <img
                                            src={isImageCharmNumber(charmNumber)
                                                ? getImageCharmIconPath(charmNumber)
                                                : `/bc-assets/images/charms/charm${charmNumber ?? realCharmIndex + 1}.png`}
                                            alt={charmData?.name || "Charm"}
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
                                        &times;
                                    </button>
                                </div>
                            );
                        })}

                        {charms.filter(Boolean).length < 5 && (
                            <div
                                className="selected-charm-slot add-slot"
                                title="Add a charm"
                                onClick={() => {
                                    if (activeCharmCategory === "initial") {
                                        addCustomCharm({ type: "initial", letter: initialLetter, fontStyle: initialFont, metalColor: charmMetal }, false);
                                    } else if (activeCharmCategory === "birthstones") {
                                        addBirthstoneCharm(false);
                                    } else if (activeCharmCategory === "diamonds") {
                                        const firstDiamond = CHARMS.find((c) => c.type === "diamond");
                                        if (firstDiamond) addDiamondCharm(firstDiamond, false);
                                    } else if (activeCharmCategory === "2d") {
                                        const first2D = charms2D[0];
                                        if (first2D) addMetalVariantCharm(first2D, true);
                                    } else if (activeCharmCategory === "3d") {
                                        const first3D = charms3D[0];
                                        if (first3D) addCharm(first3D.path, true);
                                    }
                                }}
                            >
                                <span>+</span>
                            </div>
                        )}
                    </div>

                    <section className="gb-option-row" style={{ marginTop: "20px", marginBottom: "16px" }}>
                        <div className="gb-option-title" style={{ marginBottom: "10px" }}>
                            <span>Charm Category</span>
                        </div>
                        <div
                            className="necklace-charm-category-nav"
                            style={{ display: "flex", alignItems: "center", gap: "10px" }}
                        >
                        {BRACELET_CHARM_CATEGORIES.map((cat) => {
                            const isActive = cat.id === activeCharmCategory;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    title={cat.label}
                                    className={`necklace-charm-category-btn ${isActive ? "active" : ""}`}
                                    onClick={() => setActiveCharmCategory(cat.id)}
                                >
                                    {cat.icon(isActive)}
                                </button>
                            );
                        })}
                        <span
                            className="necklace-charm-category-label"
                            style={{ marginLeft: "6px", fontSize: "16px", fontWeight: "700" }}
                        >
                            {BRACELET_CHARM_CATEGORIES.find((c) => c.id === activeCharmCategory)?.label}
                        </span>
                        </div>
                    </section>

                    <OptionRow title="Metal">
                        {CHARM_METAL_SWATCHES.map((metal) => (
                            <button
                                key={`charm-metal-${metal.label}`}
                                type="button"
                                className={`gb-metal-option ${charmMetal === metal.hex ? "active" : ""}`}
                                onClick={() => setActiveCharmMetal(metal)}
                                title={activeCharmCategory === "3d" ? "Metal options unavailable for 3D charms" : metal.label}
                                disabled={activeCharmCategory === "3d"}
                                style={{ backgroundColor: metal.hex }}
                            >
                                <small>{metal.label}</small>
                            </button>
                        ))}
                    </OptionRow>

                    {activeCharmCategory === "birthstones" && (
                        <OptionRow className="gb-option-row--two-line theme3-initial-grid">
                            {STONE_COLOR_SWATCHES.map((stone) => (
                                <button
                                    key={stone.hex}
                                    type="button"
                                    className={`gb-stone-card-option ${stoneColor === stone.hex ? "active" : ""}`}
                                    onClick={() => selectBirthstone(stone)}
                                >
                                    <img src={stone.image} alt={stone.label} />
                                    <span>{stone.label}</span>
                                </button>
                            ))}
                        </OptionRow>
                    )}

                    {activeCharmCategory === "diamonds" && (
                        <OptionRow title="Diamond" className="gb-option-row--two-line theme3-initial-grid">
                            {CHARMS.filter((c) => c.type === 'diamond').map((charm) => (
                                <CardOption
                                    key={charm.path}
                                    active={charms.some((c) => c?.type === 'diamond' && c?.path === charm.path)}
                                    image={charm.preview}
                                    label={charm.name}
                                    onClick={() => addDiamondCharm(charm)}
                                />
                            ))}
                        </OptionRow>
                    )}

                    {activeCharmCategory === "initial" && (
                        <OptionRow title="Initial" className="gb-option-row--two-line theme3-initial-grid">
                            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => (
                                <button
                                    key={letter}
                                    type="button"
                                    className={`gb-card-option ${initialLetter === letter ? "active" : ""}`}
                                    onClick={() => selectInitialLetter(letter)}
                                    title={`Letter ${letter}`}
                                >
                                    <span style={{ fontSize: "28px", fontWeight: "700", color: "#171717", lineHeight: 1 }}>
                                        {letter}
                                    </span>
                                </button>
                            ))}
                        </OptionRow>
                    )}

                    {activeCharmCategory === "2d" && (
                        <OptionRow title="2D Charms" className="gb-option-row--two-line theme3-initial-grid gb-option-row--charm-2d">
                            {charms2D.map((charm) => {
                                const charmNumber = getCharmNumberFromPath(charm.path);
                                const charmCount = charms.filter((c) => c && c.path === charm.path).length;
                                return (
                                    <CardOption
                                        key={charm.path}
                                        active={charmCount > 0}
                                        image={getImageCharmIconPath(charmNumber)}
                                        label={charm.name}
                                        onClick={() => addMetalVariantCharm(charm)}
                                    />
                                );
                            })}
                        </OptionRow>
                    )}

                    {activeCharmCategory === "3d" && (
                        <OptionRow title="3D Charms" className="gb-option-row--two-line theme3-initial-grid">
                            {charms3D.map((charm, i) => {
                                const charmCount = charms.filter((c) => c && c.path === charm.path).length;
                                return (
                                    <CardOption
                                        key={charm.path}
                                        active={charmCount > 0}
                                        image={`/bc-assets/images/charms/charm${i + 1}.png`}
                                        label={charm.name}
                                        onClick={() => addCharm(charm.path)}
                                    />
                                );
                            })}
                        </OptionRow>
                    )}

                    {charms.length > 0 && (
                        <button
                            className="name-remove-btn"
                            type="button"
                            onClick={() => { setCharms([]); setActiveCharmSlot(0); }}
                        >
                            Remove all charms ✕
                        </button>
                    )}
                    </>
                    )}
                </div>

            </div>

            <footer className="theme3-panel-footer" ref={footerRef}>
                <div className="theme3-footer-build-summary">
                    {buildSummaryContent}
                </div>
                <div className="theme3-panel-footer-label">
                    <span>Next step</span>
                </div>
                <button type="button" className="theme3-panel-footer-cta" disabled={addedToCart} onClick={handleNextStep}>
                    {nextStepButtonText}
                </button>
                <div className="theme3-footer-actions">
                    {summaryActionsContent}
                </div>
                {continueMessage && (
                    <p className="theme3-continue-status" role="status" aria-live="polite">
                        {continueMessage}
                    </p>
                )}
            </footer>

            {showResetPopup && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
                    <div className="confirm-popup">
                        <button className="close-cross" onClick={() => setShowResetPopup(false)}>✕</button>
                        <p style={{ fontSize: "16px", fontWeight: "700", margin: "10px 0 6px" }}>Reset Bracelet?</p>
                        <p style={{ color: "#666666", fontSize: "13px", marginBottom: "20px" }}>This will clear all your custom selections.</p>
                        <button className="cnfm-btn" onClick={() => { handleReset(); setShowResetPopup(false); }}>Confirm Reset</button>
                    </div>
                </div>
            )}

            <ToastContainer />
        </aside>
    );
});

export default Controls;
