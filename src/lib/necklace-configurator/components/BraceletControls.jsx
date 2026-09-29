import React, { useContext, useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { BraceletContext } from "../contexts/BraceletContext";
import * as THREE from 'three';
import { ToastContainer, toast } from 'react-toastify';
import {
    BRACELET_STYLES, BRACELET_CHARMS, BRACELET_CHARM_METAL_SWATCHES, BRACELET_STONE_COLOR_SWATCHES,
    getImageCharmPath, getImageCharmIconPath, getCharmNumberFromPath, isImageCharmNumber,
    BRACELET_CHAIN_CARD_IMAGE_BY_PATH, withChainIconVersion, BRACELET_NAME_CHAIN_PATHS, NAME_PENDANT_FONTS,
    NAME_PENDANT_MAX_LENGTH, DEFAULT_NAME_PENDANT, sanitizePendantText,
} from '../shared/assets';
import { Base64 } from "js-base64";
import { buildCharmAddOnLines } from "../shared/orderSummary";
import { useSectionScrollSpy } from "../shared/useSectionScrollSpy";
import { NAME_CHAIN_MAX_CHARMS, NAME_CHAIN_MAX_CHARMS_WITH_NAME } from "../bracelet/NameChain";
import { ShareContext } from "../contexts/ShareContext";
import { resolveParentUrl, isCategoryAllowed } from "../shared/parentCategoryConfig";
import { isJewelryShellActive, rememberJewelryCategory, requestJewelryCategory } from "@/lib/jewelry-shell/jewelryCategoryBus";
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

const BraceletControls = forwardRef(function BraceletControls({ activeSection = "bracelet", onSectionChange }, ref) {
    const {
        setJewelryType,
        selectedBracelet, setSelectedBracelet,
        braceletPath, setBraceletPath,
        charms, setCharms,
        namePendant, setNamePendant,
        braceletMetal, setBraceletMetal,
        pendantMetalHex, setPendantMetalHex,
        charmMetal, setCharmMetal,
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
        customizeType, setCustomizeType,
        activeCharmCategory, setActiveCharmCategory,
        stoneColor, setStoneColor,
        selectedDiamondPath, setSelectedDiamondPath,
        initialLetter, setInitialLetter,
        activeCharmSlot, setActiveCharmSlot,
    } = useContext(BraceletContext);

    const { setShare, shareUrl, setShareUrl, parent, setParent } = useContext(ShareContext);

    const [initialFont, setInitialFont] = useState(namePendant?.fontStyle || "dancing");

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
    // Highlight the section tab that is scrolled into view (same as the ring).
    const { lockTo: lockSectionSpy } = useSectionScrollSpy({
      containerRef: scrollContainerRef,
      sectionRefs,
      onSectionChange,
    });

    const metalOptions = [
        // `color` = swatch colour, same as the ring's GOLD_COLORS (Silver has no ring equivalent).
        { code: "SL", alt: "Silver 925",  hex: "#B8B8B8", color: "#CFCFCF", price: 100 },
        { code: "YG", alt: "Yellow Gold", hex: "#FFD280", color: "#FFD280", price: 100 },
        { code: "RG", alt: "Rose Gold",   hex: "#FFBAA3", color: "#E6B08F", price: 100 },
        { code: "PL", alt: "Platinum",    hex: "#e5e4e2", color: "#E5E4E2", price: 200 },
        { code: "WG", alt: "White Gold",  hex: "#DBDBDB", color: "#F1F1EF", price: 100 },
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
    const supportsNamePendant = BRACELET_NAME_CHAIN_PATHS.includes(braceletPath);
    const namePendantText = sanitizePendantText(namePendant?.text || "");
    const hasNamePendant = supportsNamePendant && Boolean(namePendant?.enabled) && namePendantText.length > 0;
    // 5 charms on a plain chain; 4 with a name (2 each side, between the name
    // and the lock at the back).
    const maxBraceletCharms = hasNamePendant ? NAME_CHAIN_MAX_CHARMS_WITH_NAME : NAME_CHAIN_MAX_CHARMS;

    // Adding a name to a chain that already carries 5 charms drops the last one.
    useEffect(() => {
        const placed = charms.filter(Boolean);
        if (placed.length <= maxBraceletCharms) return;
        setCharms(placed.slice(0, maxBraceletCharms));
        setActiveCharmSlot((slot) => Math.min(slot ?? 0, maxBraceletCharms - 1));
        toast(`A name bracelet holds up to ${maxBraceletCharms} charms - the last charm was removed.`, { autoClose: 2000 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxBraceletCharms]);

    const updateNamePendant = (updates) =>
        setNamePendant((prev) => ({ ...(prev || DEFAULT_NAME_PENDANT), ...updates }));

    useEffect(() => {
        if (!supportsNamePendant && customizeType === "text") {
            setCustomizeType("charms");
        }
    }, [supportsNamePendant, customizeType]);

    const isPlatinum = braceletMetal === "#e5e4e2";
    const braceletBasePrice = BRACELET_STYLES[selectedBracelet]?.price || 3200;
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
        const charmData = BRACELET_CHARMS.find((c) => c.path === charm.path);
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

    const handlePendantMetalClick = (metal) => {
        applyMaterial(metal.hex, '/textures/silver.jpg');
        setPendantMetalHex(metal.hex);
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
        return BRACELET_CHARMS.find((item) => item.path === charm?.path || getCharmNumberFromPath(item.path) === number);
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
            const selectedMetal = BRACELET_CHARM_METAL_SWATCHES.find((m) => m.hex === activeCharmObj.metalColor)
                ?? BRACELET_CHARM_METAL_SWATCHES.find((m) => m.key === activeCharmObj.metal);
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
        if (placedCharms.length >= maxBraceletCharms) {
            toast(`Maximum of ${maxBraceletCharms} charms reached for this bracelet!`, { autoClose: 1500 });
            return;
        }
        const updated = [...placedCharms, { ...charm, id: Date.now() + Math.random() }];
        setCharms(updated);
        setActiveCharmSlot(updated.length - 1);
    };

    const addMetalVariantCharm = (charm, forceNew = false) => {
        const number = getCharmNumberFromPath(charm.path);
        const selectedMetal = BRACELET_CHARM_METAL_SWATCHES.find((m) => m.hex === charmMetal) ?? BRACELET_CHARM_METAL_SWATCHES.find((m) => m.key === "WG");
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
        if (charms.filter(Boolean).length >= maxBraceletCharms) {
            toast(`Maximum of ${maxBraceletCharms} charms reached for this bracelet!`, { autoClose: 1500 });
            return;
        }
        const updated = [...charms.filter(Boolean), { ...variant, id: Date.now() + Math.random() }];
        setCharms(updated);
        setActiveCharmSlot(updated.length - 1);
    };

    const addCharm = (charmPath, forceNew = false) => {
        const charmData = BRACELET_CHARMS.find((c) => c.path === charmPath);
        if (!forceNew && activeCharmSlot !== null && charms[activeCharmSlot]) {
            const updated = [...charms];
            updated[activeCharmSlot] = { path: charmPath, name: charmData?.name, id: updated[activeCharmSlot].id };
            setCharms(updated);
            return;
        }
        const placedCharms = charms.filter(Boolean);
        if (placedCharms.length >= maxBraceletCharms) {
            toast(`Maximum of ${maxBraceletCharms} charms reached for this bracelet!`, { autoClose: 1500 });
            return;
        }
        const updated = [...placedCharms, { path: charmPath, name: charmData?.name, id: Date.now() + Math.random() }];
        setCharms(updated);
        setActiveCharmSlot(updated.length - 1);
    };

    const addBirthstoneCharm = (replaceActive = true, selectedStoneColor = stoneColor) => {
        const birthstoneCharmData = BRACELET_CHARMS.find((c) => c.type === "birthstone");
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
        setHasReachedAddOns(false);
        setSelectedBracelet(0);
        setBraceletPath(BRACELET_STYLES[0].path);
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
        setPendantMetalHex("#DBDBDB");
        // Reset gives a plain chain: no name on the bracelet.
        setNamePendant({ ...DEFAULT_NAME_PENDANT, text: "", enabled: false });
        setResetObj({
            position: [0.007, 2.397, 0.1],
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
                lockSectionSpy(sectionId);
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
                pendantMetalHex,
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
            if (charm.type === "birthstone") return BRACELET_STONE_COLOR_SWATCHES.find((s) => s.hex === charm.gemstoneColor)?.label || "Birthstone";
            if (charm.type === "diamond") return charm.name || "Diamond Charm";
            return getCharmData(charm)?.name || "Charm";
        }).join(", ");

        setPendingCartPayload({
            type: 'ADD_TO_CART',
            quantity: 1,
            Title: `${BRACELET_STYLES[selectedBracelet]?.name}${hasNamePendant ? ` "${namePendantText}"` : ''} - ${isPlatinum ? '' : `${braceletPurity} `}${metalOptions.find((o) => o.hex === braceletMetal)?.alt} - Size ${braceletSize}`,
            Price: finalProductPrice,
            Category: 'Bracelet',
            BraceletStyle: BRACELET_STYLES[selectedBracelet]?.name,
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
        // Same as the ring: keep showing "Adding to Cart..." (and stay disabled) after the click.
        // window.setTimeout(() => setAddedToCart(false), 1000);
    }, [pendingCartPayload, shareUrl]);

    // "Add-ons" only leads the customer through once: after the add-ons
    // section has been reached the button stays "Add to Cart", even when
    // scrolling back up (cleared again by Reset).
    const [hasReachedAddOns, setHasReachedAddOns] = useState(false);
    useEffect(() => {
        if (activeSection === "charms") setHasReachedAddOns(true);
    }, [activeSection]);
    const showAddOnsStep = activeSection === "bracelet" && !hasReachedAddOns;

    const handleNextStep = () => {
        if (showAddOnsStep) {
            lockSectionSpy("charms");
            const node = sectionRefs.charms?.current;
            node?.scrollIntoView({ behavior: "smooth" });
        } else {
            addToCart();
        }
    };

    const nextStepButtonText = showAddOnsStep
        ? "Add-ons"
        : addedToCart
        ? "Checking out..."
        : "Checkout";

    const nextStepCopy = showAddOnsStep
        ? "Add charms or a name"
        : "Add your bracelet to cart";

    const charms2D = BRACELET_CHARMS.slice(8, 23);
    const charms3D = BRACELET_CHARMS.slice(0, 8);

    // ---- Build-summary derived values ----
    const placedCharms = charms.filter(Boolean);

    const getMetalDisplayLabel = (hex) => {
        const found = metalOptions.find((o) => o.hex?.toLowerCase() === hex?.toLowerCase());
        return found ? (found.alt || found.code) : "White Gold";
    };

    const braceletMetalName = getMetalDisplayLabel(braceletMetal);
    const braceletPurityLabel = isPlatinum || braceletMetalName.startsWith("Silver") ? "" : braceletPurity;
    const braceletSummaryDesc = [
        BRACELET_STYLES[selectedBracelet]?.name || "Bracelet",
        [braceletPurityLabel, braceletMetalName].filter(Boolean).join(" "),
    ].filter(Boolean).join(" \u00b7 ");

    // Same per-charm prices as charmsPrice above, so the lines add up to it.
    const getSummaryCharmPrice = (charm) => {
        if (charm.type === "initial") return 40;
        if (charm.type === "birthstone" || charm.type === "diamond") return 50;
        return BRACELET_CHARMS.find((c) => c.path === charm.path)?.price ?? 50;
    };
    const summaryAddOnLines = [
        ...buildCharmAddOnLines(placedCharms, {
            getPrice: getSummaryCharmPrice,
            getBirthstoneLabel: (charm) => BRACELET_STONE_COLOR_SWATCHES.find((s) => s.hex?.toLowerCase() === charm.gemstoneColor?.toLowerCase())?.label,
            getName: (charm) => charm.name || getCharmData(charm)?.name || "Charm",
        }),
        ...(hasNamePendant
            ? [{
                key: "text",
                label: `Text: \u201c${namePendantText}\u201d \u00b7 ${NAME_PENDANT_FONTS.find((f) => f.id === namePendant.fontStyle)?.label || "Dancing"}`,
                price: 0,
            }]
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
                <strong>${finalProductPrice.toLocaleString()}</strong>
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
                    <span className="order-summary-title">Chain</span>
                    <span className="order-summary-price">${braceletTotalPrice.toLocaleString()}</span>
                </div>
                <div className="order-summary-desc">{braceletSummaryDesc}</div>
                <div className="order-summary-desc">Size: {`${braceletSize}\u201d`}</div>
            </div>

            {summaryAddOnLines.length > 0 && (
                <div className="order-summary-section">
                    <div className="order-summary-row">
                        <span className="order-summary-title">Add-ons</span>
                        {summaryAddOnsPrice > 0 && (
                            <span className="order-summary-price">${summaryAddOnsPrice.toLocaleString()}</span>
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
                        <h3>Jewelry</h3>
                        <span className="theme3-section-header-price">
                            ${(braceletBasePrice + currentBraceletSizePrice + currentMetalPrice + (isPlatinum ? 0 : currentPurityPrice)).toLocaleString()}
                        </span>
                    </header>

                    <div className="jewelry-category-row" role="tablist" aria-label="Jewelry category">
                        <div className="jewelry-category-row-title">CATEGORY</div>
                        <div className="jewelry-category-row-options">
                        {isCategoryAllowed(parent || resolveParentUrl(), "necklace") && (
                            <button
                                type="button"
                                role="tab"
                                aria-selected="false"
                                className="jewelry-category-btn"
                                onClick={() => { rememberJewelryCategory("necklace"); setJewelryType("necklace"); onSectionChange?.("bracelet"); }}
                            >
                                Necklace
                            </button>
                        )}
                        {isCategoryAllowed(parent || resolveParentUrl(), "bracelet") && (
                            <button
                                type="button"
                                role="tab"
                                aria-selected="true"
                                className="jewelry-category-btn active"
                            >
                                Bracelet
                            </button>
                        )}
                        {isJewelryShellActive() && isCategoryAllowed(parent || resolveParentUrl(), "bead-bracelet") && (
                            <button
                                type="button"
                                role="tab"
                                aria-selected="false"
                                className="jewelry-category-btn"
                                onClick={() => requestJewelryCategory("bead-bracelet")}
                            >
                                Bead Bracelet
                            </button>
                        )}
                    </div>
                </div>

                    <OptionRow title="Style">
                        {BRACELET_STYLES.map((bracelet, index) => {
                            return (
                                <CardOption
                                    key={bracelet.name}
                                    active={selectedBracelet === index}
                                    image={withChainIconVersion(BRACELET_CHAIN_CARD_IMAGE_BY_PATH[bracelet.path])}
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

                    <OptionRow title="Length">
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
                        <h3>Customize</h3>
                        {(customizeType === "text" ? 0 : charmsPrice) > 0 && (
                            <span className="theme3-section-header-price">
                                ${charmsPrice.toLocaleString()}
                            </span>
                        )}
                    </header>

                    {/* Active charm slots - right under the header, above the
                        Charms/Text toggle, so the current selection is always
                        visible (same order as the necklace panel). */}
                    <div className="selected-charms-row" style={{ paddingBottom: "4px" }}>
                        {charms.filter(Boolean).map((charm, index) => {
                            const isActive = index === activeCharmSlot;
                            const isDragging = dragState?.currentIndex === index;
                            const charmData = getCharmData(charm);
                            const charmNumber = charm.imageCharmNumber ?? getCharmNumberFromPath(charm.path);
                            const realCharmIndex = BRACELET_CHARMS.findIndex((c) => c.path === charmData?.path);

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
                                            src={(BRACELET_STONE_COLOR_SWATCHES.find((s) => s.hex === charm.gemstoneColor) ?? BRACELET_STONE_COLOR_SWATCHES[0]).image}
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

                        {Array.from({ length: Math.max(0, maxBraceletCharms - charms.filter(Boolean).length) }).map((_, emptyIndex) => (
                            <div
                                key={`add-slot-${emptyIndex}`}
                                className="selected-charm-slot add-slot"
                                title="Add a charm"
                                onClick={() => {
                                    if (activeCharmCategory === "initial") {
                                        addCustomCharm({ type: "initial", letter: initialLetter, fontStyle: initialFont, metalColor: charmMetal }, false);
                                    } else if (activeCharmCategory === "birthstones") {
                                        addBirthstoneCharm(false);
                                    } else if (activeCharmCategory === "diamonds") {
                                        const firstDiamond = BRACELET_CHARMS.find((c) => c.type === "diamond");
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
                        ))}

                        {charms.filter(Boolean).length > 0 && (
                            <button
                                type="button"
                                className="clear-all-charms-btn"
                                title="Remove all charms"
                                aria-label="Remove all charms"
                                onClick={() => { setCharms([]); setActiveCharmSlot(0); }}
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

                    {supportsNamePendant && (
                        <OptionRow title="Category">
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
                                    Text
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

                            <OptionRow title="Font Style">
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

                            <OptionRow title="Metal">
                                {metalOptions.map((metal) => (
                                    <button
                                        key={`text-metal-${metal.alt}`}
                                        type="button"
                                        className={`gb-metal-option ${(pendantMetalHex || braceletMetal) === metal.hex ? "active" : ""}`}
                                        onClick={() => handlePendantMetalClick(metal)}
                                        title={metal.alt}
                                        style={{ backgroundColor: metal.color || metal.hex }}
                                    >
                                        <small>{metal.alt}</small>
                                    </button>
                                ))}
                            </OptionRow>
                        </>
                    ) : (
                    <>
                    <section className="gb-option-row" style={{ marginTop: "4px", marginBottom: "4px" }}>
                        <div className="gb-option-title" >
                            <span>Collection</span>
                        </div>
                        <div
                            className="necklace-charm-category-nav"
                            style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: 0 }}
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
                        {BRACELET_CHARM_METAL_SWATCHES.map((metal) => (
                            <button
                                key={`charm-metal-${metal.label}`}
                                type="button"
                                className={`gb-metal-option ${charmMetal === metal.hex ? "active" : ""}`}
                                onClick={() => setActiveCharmMetal(metal)}
                                title={activeCharmCategory === "3d" ? "Metal options unavailable for 3D charms" : metal.label}
                                disabled={activeCharmCategory === "3d"}
                                style={{ backgroundColor: metal.color || metal.hex }}
                            >
                                <small>{metal.label}</small>
                            </button>
                        ))}
                    </OptionRow>

                    {activeCharmCategory === "birthstones" && (
                        <OptionRow className="gb-option-row--two-line theme3-initial-grid">
                            {BRACELET_STONE_COLOR_SWATCHES.map((stone) => (
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
                            {BRACELET_CHARMS.filter((c) => c.type === 'diamond').map((charm) => (
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
                    </>
                    )}
                </div>

            </div>

            <footer className="theme3-panel-footer" ref={footerRef}>
                <div className="theme3-footer-build-summary">
                    {buildSummaryContent}
                </div>

                <div className="theme3-footer-main">
                    <div className="theme3-summary-info">
                        <button
                            type="button"
                            className="theme3-summary-details-toggle"
                            aria-label={isSummaryExpanded ? "Hide details" : "View details"}
                            aria-expanded={isSummaryExpanded}
                            onClick={handleSummaryArrowClick}
                        >
                            <span>View details</span>
                            <svg
                                className={`theme3-summary-toggle-arrow${isSummaryExpanded ? " is-expanded" : ""}`}
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
                            <strong className="theme3-summary-price">
                                ${finalProductPrice.toLocaleString()}
                            </strong>
                            <span className="theme3-summary-tax-label">+ tax</span>
                        </div>
                    </div>

                    <div className="theme3-footer-actions">
                        <button type="button" className="theme3-panel-footer-cta" disabled={addedToCart} onClick={handleNextStep}>
                            {nextStepButtonText}
                        </button>

                        <div className="theme3-panel-action-wrapper">
                            <button
                                type="button"
                                className="theme3-panel-action-btn theme3-panel-share-btn"
                                onClick={handleShare}
                                aria-label="Share bracelet configuration"
                            >
                                Share
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

export default BraceletControls;
