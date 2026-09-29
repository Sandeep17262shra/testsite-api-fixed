import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BEADS,
  BEAD_CHARMS,
  BEAD_COLLECTIONS,
  BEAD_GRID_SIZE_FILTERS,
  BEAD_JEWELRY_CATEGORIES,
  BEAD_LENGTHS,
  BEAD_LENGTH_OPTIONS,
  getBeadPickerGridItems,
  getBeadStyleLabel,
  SEPARATORS,
  UI_HIDDEN_BEAD_STYLE_IDS,
  UI_HIDDEN_CUSTOMIZE_TAB_IDS,
  VISIBLE_BEAD_CUSTOMIZE_TABS,
  VISIBLE_BEAD_STYLES,
  isCharmCustomizationEnabled,
  isSpacerCustomizationEnabled,
  resolveBeadStyle,
  resolvePatternAsset,
} from "../assets";
import { isJewelryShellActive, requestJewelryCategory } from "@/lib/jewelry-shell/jewelryCategoryBus";
import { useBeedsContext } from "../contexts/BeedsContext";
import { usePreviewFocus } from "../contexts/PreviewFocusContext";
import { unlockBeadsAudio } from "../beadsSounds";
import { buildPatternCustomizeSummaryLines } from "../pricing";

const customizeTabsShownInUi = VISIBLE_BEAD_CUSTOMIZE_TABS;

/** Matches necklace / bracelet charm slot row. */
const SLOT_SWAP_TRANSITION = "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)";

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

function BeadPickerCard({
  asset,
  active,
  disabled,
  sizeLabel,
  onClick,
  showPrice = true,
  showSizeInLabel = false,
  displayLabel,
}) {
  const cardLabel =
    displayLabel ??
    (showSizeInLabel && sizeLabel ? `${asset.name} · ${sizeLabel}` : asset.name);

  return (
    <button
      type="button"
      className={`beads-grid-card ${active ? "active" : ""} ${disabled ? "is-disabled" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="beads-grid-card__image-wrap">
        <img
          src={asset.image}
          alt={cardLabel}
          draggable={false}
          decoding="async"
          loading="eager"
        />
      </span>
      <span className="beads-grid-card__label">{cardLabel}</span>
      {showPrice && (
        <span className="beads-grid-card__meta">
          {sizeLabel && !showSizeInLabel ? `${sizeLabel} - ` : ""}${asset.price || 8}
        </span>
      )}
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
      track.classList.remove("is-dragging");
      track.style.scrollBehavior = "";
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
    if (event.target.closest("button, a, input, select, textarea")) return;
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

function StylePreviewThumb({ styleId }) {
  const previewSvg = resolveBeadStyle(styleId)?.previewSvg;

  if (!previewSvg) {
    return null;
  }

  return (
    <img
      src={previewSvg}
      alt=""
      className="beads-style-card__thumb-img"
      aria-hidden="true"
      draggable={false}
    />
  );
}

const BeedsControls = forwardRef(function BeedsControls({ activeSection = "jewelry", onSectionChange }, ref) {
  const {
    jewelryCategory,
    setJewelryCategory,
    styleId,
    selectStyleId,
    lengthId,
    selectLengthId,
    customizeTab,
    setCustomizeTab,
    collectionId,
    setCollectionId,
    sizeId,
    setSizeId,
    selectedBeadKey,
    setSelectedBeadKey,
    selectedSeparatorKey,
    setSelectedSeparatorKey,
    selectedCharmKey,
    setSelectedCharmKey,
    selectedBead,
    isManualMode,
    isCustomizeEnabled,
    canAddMore,
    canAddBead,
    canReplaceCustomizeSlotAt,
    canApplyBeadSizeToAllPresetSlots,
    canAddSpacer,
    canAddCharm,
    addManualItem,
    addPresetSlotItem,
    addBraceletCharm,
    flyInAnimation,
    flyInSourceRectRef,
    removeManualItemAt,
    removePresetSlotAt,
    reorderManualItems,
    reorderPresetSlotItems,
    updateManualItemSizeAt,
    replaceCustomizeSlotAt,
    applyBeadToAllPresetBeadSlots,
    applySpacerToAllPresetSpacerSlots,
    clearManualItems,
    manualItems,
    customizeSlotItems,
    pattern,
    jewelryPrice,
    customizePrice,
    totalPrice,
    displayLengthLabel,
    setShowResetPopup,
  } = useBeedsContext();
  const { requestPreviewFocus } = usePreviewFocus();

  const sectionRefs = {
    jewelry: useRef(null),
    customize: useRef(null),
  };
  const scrollContainerRef = useRef(null);
  const headerRef = useRef(null);
  const footerRef = useRef(null);
  const beadSlotRefs = useRef([]);
  const slotRowRef = useRef(null);
  const beadDragRef = useRef(null);
  const suppressBeadClickRef = useRef(false);
  const slotFlipOriginsRef = useRef(null);
  const slotFlipRafRef = useRef(null);
  /** Layout midpoints (client X) — unaffected by FLIP transforms on siblings. */
  const slotLayoutMidXRef = useRef([]);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState(null);
  /** Only which slot is held, not how far — the offset never goes through React. */
  const [draggingSlotIndex, setDraggingSlotIndex] = useState(null);
  const slotDragRafRef = useRef(null);
  const [gridSizeFilter, setGridSizeFilter] = useState("all");
  /** Size for new beads from the picker — only set when user picks a Size (mm) filter, not on bead card click. */
  const [pickerBeadSizeId, setPickerBeadSizeId] = useState(null);

  useImperativeHandle(ref, () => ({
    scrollToSection(sectionId) {
      const sectionNode = sectionRefs[sectionId]?.current;
      const container = scrollContainerRef.current;
      if (sectionNode && container) {
        const sectionTop = sectionNode.offsetTop;
        container.scrollTo({ top: sectionTop - 10, behavior: "smooth" });
      }
    },
  }));

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return undefined;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const customizeTop = sectionRefs.customize.current?.offsetTop ?? Number.MAX_SAFE_INTEGER;
      const nextSection = scrollTop >= customizeTop - 80 ? "customize" : "jewelry";
      if (nextSection !== activeSection) {
        onSectionChange?.(nextSection);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, [activeSection, onSectionChange]);

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

  const scrollToSectionId = useCallback(
    (sectionId) => {
      const sectionNode = sectionRefs[sectionId]?.current;
      const container = scrollContainerRef.current;
      if (sectionNode && container) {
        container.scrollTo({ top: sectionNode.offsetTop - 10, behavior: "smooth" });
      }
      onSectionChange?.(sectionId);
    },
    [onSectionChange]
  );

  const footerCtaLabel = activeSection === "jewelry" ? "Choose Beads" : "Add to cart";
  const footerCtaDisabled = activeSection !== "jewelry";

  const handleFooterContinue = () => {
    if (activeSection === "jewelry") {
      scrollToSectionId("customize");
    }
  };

  const filteredBeads = useMemo(() => {
    if (collectionId === "all") {
      return BEADS;
    }
    return BEADS.filter((bead) => bead.collection === collectionId);
  }, [collectionId]);

  const beadGridItems = useMemo(() => {
    if (customizeTab !== "beads") {
      return [];
    }
    return getBeadPickerGridItems(filteredBeads, gridSizeFilter);
  }, [customizeTab, filteredBeads, gridSizeFilter]);

  const visibleAssets =
    customizeTab === "spacers"
      ? SEPARATORS
      : customizeTab === "charms"
        ? BEAD_CHARMS
        : [];

  const selectedAssetKey =
    customizeTab === "spacers"
      ? selectedSeparatorKey
      : customizeTab === "charms"
        ? selectedCharmKey
        : selectedBeadKey;

  const activeBeadSizeId = useMemo(() => {
    if (
      activeSlotIndex !== null &&
      customizeSlotItems[activeSlotIndex]?.type === "bead"
    ) {
      return customizeSlotItems[activeSlotIndex].sizeId || sizeId;
    }
    if (pickerBeadSizeId) {
      return pickerBeadSizeId;
    }
    if (gridSizeFilter !== "all") {
      return `${gridSizeFilter}mm`;
    }
    return sizeId;
  }, [activeSlotIndex, customizeSlotItems, pickerBeadSizeId, gridSizeFilter, sizeId]);

  const getFlyInSourceRect = (event) => {
    const root = event?.currentTarget;
    if (!root?.getBoundingClientRect) {
      return null;
    }
    const visual =
      root.querySelector?.(".beads-grid-card__image-wrap img, img") ?? root;
    if (visual?.getBoundingClientRect) {
      return visual.getBoundingClientRect();
    }
    return root.getBoundingClientRect();
  };

  const activeSlotItem =
    activeSlotIndex !== null && activeSlotIndex < customizeSlotItems.length
      ? customizeSlotItems[activeSlotIndex]
      : null;

  const requestFocusForCustomizeSlot = useCallback(
    (index) => {
      if (index == null || index < 0 || index >= customizeSlotItems.length) {
        return;
      }
      const slot = customizeSlotItems[index];
      if (!slot?.id) {
        return;
      }
      requestPreviewFocus({ itemId: slot.id, patternIndex: index });
    },
    [customizeSlotItems, requestPreviewFocus]
  );

  const requestFocusForPickerContext = useCallback(() => {
    if (activeSlotIndex != null) {
      requestFocusForCustomizeSlot(activeSlotIndex);
      return;
    }
    const focusType =
      customizeTab === "spacers" ? "spacer" : customizeTab === "charms" ? "charm" : "bead";
    const patternIndex = pattern.findIndex((entry) => entry.type === focusType);
    if (patternIndex < 0) {
      return;
    }
    const entry = pattern[patternIndex];
    if (!entry?.id) {
      return;
    }
    requestPreviewFocus({ itemId: entry.id, patternIndex });
  }, [
    activeSlotIndex,
    customizeTab,
    pattern,
    requestFocusForCustomizeSlot,
    requestPreviewFocus,
  ]);

  const handleSlotSelect = (index) => {
    setActiveSlotIndex(index);
    requestFocusForCustomizeSlot(index);
  };

  const getCharmInsertIndex = () =>
    activeSlotIndex !== null ? activeSlotIndex + 1 : undefined;

  const isBeadPickerEntryEnabled = useCallback(
    (assetKey, beadSizeId) => {
      if (activeSlotIndex !== null && activeSlotItem) {
        if (
          activeSlotItem.type === "bead" ||
          activeSlotItem.type === "spacer" ||
          activeSlotItem.type === "charm"
        ) {
          return canReplaceCustomizeSlotAt(activeSlotIndex, {
            type: "bead",
            assetKey,
            beadSizeId,
          });
        }
      }

      if (!isManualMode && customizeSlotItems.some((item) => item.type === "bead")) {
        return canAddBead(beadSizeId) || canApplyBeadSizeToAllPresetSlots(beadSizeId);
      }

      return canAddBead(beadSizeId);
    },
    [
      activeSlotIndex,
      activeSlotItem,
      canAddBead,
      canApplyBeadSizeToAllPresetSlots,
      canReplaceCustomizeSlotAt,
      customizeSlotItems,
      isManualMode,
    ]
  );

  const isSpacerPickerEntryEnabled = useCallback(
    (assetKey) => {
      if (activeSlotIndex !== null && activeSlotItem) {
        if (
          activeSlotItem.type === "spacer" ||
          activeSlotItem.type === "bead" ||
          activeSlotItem.type === "charm"
        ) {
          return canReplaceCustomizeSlotAt(activeSlotIndex, { type: "spacer", assetKey });
        }
      }
      if (
        activeSlotIndex === null &&
        customizeSlotItems.some((item) => item.type === "spacer")
      ) {
        return true;
      }
      return canAddSpacer();
    },
    [
      activeSlotIndex,
      activeSlotItem,
      canAddSpacer,
      canReplaceCustomizeSlotAt,
      customizeSlotItems,
      isManualMode,
    ]
  );

  const handleAssetSelect = (key, event, beadSizeIdOverride) => {
    const sourceRect = getFlyInSourceRect(event);

    if (customizeTab === "spacers") {
      setSelectedSeparatorKey(key);
      const hasSpacers = customizeSlotItems.some((item) => item.type === "spacer");

      if (
        activeSlotIndex !== null &&
        activeSlotIndex < customizeSlotItems.length &&
        isSpacerPickerEntryEnabled(key)
      ) {
        replaceCustomizeSlotAt(activeSlotIndex, {
          type: "spacer",
          assetKey: key,
          sourceRect,
        });
        return;
      }

      if (hasSpacers && isSpacerPickerEntryEnabled(key)) {
        applySpacerToAllPresetSpacerSlots(key, { applyToAll: true });
        return;
      }

      requestFocusForPickerContext();
      if (isManualMode) {
        addManualItem("spacer", key, sizeId, { sourceRect });
      } else if (canAddSpacer()) {
        addPresetSlotItem("spacer", key, sizeId, { sourceRect });
      }
      return;
    }

    if (customizeTab === "charms") {
      setSelectedCharmKey(key);
      if (activeSlotIndex !== null && activeSlotItem?.type === "charm") {
        replaceCustomizeSlotAt(activeSlotIndex, { type: "charm", assetKey: key, sourceRect });
        return;
      }
      requestFocusForPickerContext();
      if (canAddCharm()) {
        addBraceletCharm(key, { sourceRect, insertIndex: getCharmInsertIndex() });
      }
      return;
    }

    const beadSizeId =
      beadSizeIdOverride ??
      (gridSizeFilter !== "all" ? `${gridSizeFilter}mm` : activeBeadSizeId);

    if (activeSlotIndex !== null && activeSlotItem) {
      if (
        activeSlotItem.type === "bead" ||
        activeSlotItem.type === "spacer" ||
        activeSlotItem.type === "charm"
      ) {
        if (isBeadPickerEntryEnabled(key, beadSizeId)) {
          replaceCustomizeSlotAt(activeSlotIndex, {
            type: "bead",
            assetKey: key,
            beadSizeId,
            sourceRect,
          });
        }
        return;
      }
    }

    requestFocusForPickerContext();
    setSelectedBeadKey(key);
    if (isManualMode) {
      if (gridSizeFilter === "all" && beadSizeIdOverride) {
        setSizeId(beadSizeIdOverride);
      }
      if (canAddBead(beadSizeId)) {
        addManualItem("bead", key, beadSizeId, { sourceRect });
      }
      return;
    }

    if (beadSizeId !== sizeId && activeSlotIndex === null) {
      setSizeId(beadSizeId);
      return;
    }

    const hasPresetBeads = customizeSlotItems.some((item) => item.type === "bead");
    if (hasPresetBeads) {
      if (canApplyBeadSizeToAllPresetSlots(beadSizeId)) {
        applyBeadToAllPresetBeadSlots(key, beadSizeId);
      }
      return;
    }

    if (canAddBead(beadSizeId)) {
      addPresetSlotItem("bead", key, beadSizeId, { sourceRect });
    }
  };

  const handleAddSlotClick = (event) => {
    const sourceRect = getFlyInSourceRect(event);

    if (customizeTab === "spacers" && canAddSpacer()) {
      if (isManualMode) {
        addManualItem("spacer", selectedSeparatorKey, sizeId, { sourceRect });
      } else {
        addPresetSlotItem("spacer", selectedSeparatorKey, sizeId, { sourceRect });
      }
      return;
    }

    if (customizeTab === "charms" && canAddCharm()) {
      addBraceletCharm(selectedCharmKey, {
        sourceRect,
        insertIndex: getCharmInsertIndex(),
      });
      return;
    }

    if (canAddBead(activeBeadSizeId)) {
      if (isManualMode) {
        addManualItem("bead", selectedBeadKey, activeBeadSizeId, { sourceRect });
      } else {
        addPresetSlotItem("bead", selectedBeadKey, activeBeadSizeId, { sourceRect });
      }
    }
  };

  const charmsTabEnabled = isCharmCustomizationEnabled(styleId);
  const spacersTabEnabled = isSpacerCustomizationEnabled(styleId);
  const canAddCurrentSelection =
    customizeTab === "spacers"
      ? canAddSpacer()
      : customizeTab === "charms"
        ? canAddCharm()
        : canAddBead(activeBeadSizeId);

  const reorderBeads = useCallback(
    (fromIndex, toIndex) => {
      if (fromIndex === toIndex) {
        return false;
      }
      const didReorder = isManualMode
        ? reorderManualItems(fromIndex, toIndex)
        : reorderPresetSlotItems(fromIndex, toIndex);
      if (didReorder) {
        setActiveSlotIndex(toIndex);
      }
      return didReorder;
    },
    [isManualMode, reorderManualItems, reorderPresetSlotItems]
  );

  useEffect(() => {
    beadSlotRefs.current.length = customizeSlotItems.length;
  }, [customizeSlotItems.length]);

  useEffect(() => {
    if (UI_HIDDEN_BEAD_STYLE_IDS.includes(styleId)) {
      selectStyleId("full-bead");
    }
  }, [styleId, selectStyleId]);

  useEffect(() => {
    if (UI_HIDDEN_CUSTOMIZE_TAB_IDS.includes(customizeTab)) {
      setCustomizeTab("beads");
    }
  }, [customizeTab, setCustomizeTab]);

  useEffect(() => {
    if (activeSlotIndex === null) {
      return;
    }
    if (!customizeSlotItems[activeSlotIndex]) {
      setActiveSlotIndex(null);
    }
  }, [activeSlotIndex, customizeSlotItems]);

  useEffect(() => {
    if (!spacersTabEnabled && customizeTab === "spacers") {
      setCustomizeTab("beads");
    }
  }, [spacersTabEnabled, customizeTab, setCustomizeTab]);

  useLayoutEffect(() => {
    if (!flyInAnimation) {
      return undefined;
    }

    if (flyInAnimation.sourceRect) {
      return undefined;
    }

    let slotIndex = -1;
    if (flyInAnimation.itemId) {
      slotIndex = customizeSlotItems.findIndex((item) => item.id === flyInAnimation.itemId);
    }
    if (slotIndex < 0 && flyInAnimation.slotIndex != null) {
      slotIndex = flyInAnimation.slotIndex;
    }
    if (slotIndex < 0 || slotIndex >= customizeSlotItems.length) {
      return undefined;
    }

    const slot = beadSlotRefs.current[slotIndex];
    if (slot) {
      flyInSourceRectRef.current = slot.getBoundingClientRect();
    }

    return undefined;
  }, [flyInAnimation?.sessionKey, flyInAnimation?.sourceRect, customizeSlotItems, flyInSourceRectRef]);

  /**
   * Pointer events outrun the display, so the held slot is moved by writing its transform
   * straight to the node once per frame. Routing the offset through state instead re-rendered
   * the whole panel on every move, which is what made dragging along the row stutter.
   */
  const applySlotDragTransform = useCallback(() => {
    slotDragRafRef.current = null;
    const drag = beadDragRef.current;
    if (!drag?.element) {
      return;
    }
    drag.element.style.transform = `translateX(${drag.offsetX}px) scale(1.06)`;
  }, []);

  const measureSlotLayoutMidXs = useCallback(() => {
    const row = slotRowRef.current;
    if (!row) {
      return [];
    }
    const rowRect = row.getBoundingClientRect();
    const rowContentLeft = rowRect.left + row.clientLeft - row.scrollLeft;
    return beadSlotRefs.current.map((element) => {
      if (!element) {
        return null;
      }
      return rowContentLeft + element.offsetLeft + element.offsetWidth / 2;
    });
  }, []);

  const getSlotLayoutPitch = useCallback(() => {
    const mids = slotLayoutMidXRef.current;
    for (let index = 1; index < mids.length; index += 1) {
      const prev = mids[index - 1];
      const next = mids[index];
      if (prev != null && next != null && Math.abs(next - prev) > 1) {
        return next - prev;
      }
    }
    const first = beadSlotRefs.current.find(Boolean);
    if (first) {
      const row = slotRowRef.current;
      const gap = row ? parseFloat(getComputedStyle(row).columnGap || getComputedStyle(row).gap || "8") : 8;
      return first.offsetWidth + (Number.isFinite(gap) ? gap : 8);
    }
    return 72;
  }, []);

  const landSlotFlipAnimations = useCallback(() => {
    if (slotFlipRafRef.current != null) {
      cancelAnimationFrame(slotFlipRafRef.current);
      slotFlipRafRef.current = null;
    }
    beadSlotRefs.current.forEach((element) => {
      if (!element) {
        return;
      }
      element.style.transition = "none";
      element.style.transform = "";
    });
  }, []);

  const captureSlotFlipOrigins = useCallback(() => {
    const origins = new Map();
    beadSlotRefs.current.forEach((element) => {
      const slotId = element?.dataset?.slotId;
      if (!slotId) {
        return;
      }
      origins.set(slotId, element.getBoundingClientRect().left);
    });
    slotFlipOriginsRef.current = origins;
  }, []);

  const handleBeadPointerDown = (event, index) => {
    if (customizeSlotItems.length < 2) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target.closest(".remove-slot-btn")) return;
    event.preventDefault();
    suppressBeadClickRef.current = false;
    unlockBeadsAudio();

    landSlotFlipAnimations();
    slotLayoutMidXRef.current = measureSlotLayoutMidXs();

    beadDragRef.current = {
      pointerId: event.pointerId,
      currentIndex: index,
      startX: event.clientX,
      offsetX: 0,
      // Slots are keyed by item id, so this node follows the item through reorders.
      element: event.currentTarget,
    };

    setDraggingSlotIndex(index);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const isSlotDragActive = draggingSlotIndex !== null;

  useEffect(
    () => () => {
      if (slotDragRafRef.current != null) {
        cancelAnimationFrame(slotDragRafRef.current);
      }
      if (slotFlipRafRef.current != null) {
        cancelAnimationFrame(slotFlipRafRef.current);
      }
    },
    []
  );

  useLayoutEffect(() => {
    const origins = slotFlipOriginsRef.current;
    if (origins) {
      slotFlipOriginsRef.current = null;

      const heldId = beadDragRef.current?.element?.dataset?.slotId ?? null;
      const moved = [];

      beadSlotRefs.current.forEach((element) => {
        if (!element) {
          return;
        }
        const slotId = element.dataset?.slotId;
        if (!slotId || slotId === heldId) {
          return;
        }
        const originLeft = origins.get(slotId);
        if (originLeft == null) {
          return;
        }
        const delta = originLeft - element.getBoundingClientRect().left;
        if (!delta) {
          return;
        }
        element.style.transition = "none";
        element.style.transform = `translateX(${delta}px)`;
        moved.push(element);
      });

      if (moved.length) {
        if (slotFlipRafRef.current != null) {
          cancelAnimationFrame(slotFlipRafRef.current);
        }
        slotFlipRafRef.current = requestAnimationFrame(() => {
          slotFlipRafRef.current = null;
          moved.forEach((element) => {
            element.style.transition = SLOT_SWAP_TRANSITION;
            element.style.transform = "";
          });
        });
      }
    }

    if (beadDragRef.current) {
      slotLayoutMidXRef.current = measureSlotLayoutMidXs();
    }
  }, [customizeSlotItems, measureSlotLayoutMidXs]);

  useEffect(() => {
    if (!isSlotDragActive) return undefined;

    const handlePointerMove = (event) => {
      const drag = beadDragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;

      const deltaX = event.clientX - drag.startX;
      if (!suppressBeadClickRef.current && Math.abs(deltaX) > 4) {
        suppressBeadClickRef.current = true;
      }

      const slots = beadSlotRefs.current;
      const layoutMids = slotLayoutMidXRef.current;
      let didReorder = false;

      // Midline rule + layout centers (offsetLeft), not getBoundingClientRect, so FLIP
      // transforms on neighbours do not pull the swap threshold back and forth.
      for (let index = 0; index < slots.length; index += 1) {
        if (!slots[index] || index === drag.currentIndex) continue;

        const midX = layoutMids[index];
        if (midX == null) continue;

        const crossed =
          (index < drag.currentIndex && event.clientX < midX) ||
          (index > drag.currentIndex && event.clientX > midX);

        if (crossed) {
          const fromIndex = drag.currentIndex;
          captureSlotFlipOrigins();
          if (!reorderBeads(fromIndex, index)) {
            break;
          }
          const pitch = getSlotLayoutPitch();
          drag.offsetX += (fromIndex - index) * pitch;
          drag.currentIndex = index;
          drag.startX = event.clientX - drag.offsetX;
          setDraggingSlotIndex(index);
          didReorder = true;
          break;
        }
      }

      if (!didReorder) {
        drag.offsetX = deltaX;
      }

      if (didReorder) {
        applySlotDragTransform();
      } else if (slotDragRafRef.current == null) {
        slotDragRafRef.current = requestAnimationFrame(applySlotDragTransform);
      }
    };

    const endDrag = (event) => {
      const drag = beadDragRef.current;
      if (!drag) return;
      if (event.pointerId !== undefined && event.pointerId !== drag.pointerId) return;

      if (slotDragRafRef.current != null) {
        cancelAnimationFrame(slotDragRafRef.current);
        slotDragRafRef.current = null;
      }
      if (drag.element) {
        drag.element.style.transform = "";
      }

      unlockBeadsAudio();
      beadDragRef.current = null;
      setDraggingSlotIndex(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [
    isSlotDragActive,
    reorderBeads,
    applySlotDragTransform,
    captureSlotFlipOrigins,
    getSlotLayoutPitch,
  ]);

  const gridSizeLabel = useMemo(() => {
    if (gridSizeFilter === "all") {
      return activeBeadSizeId;
    }
    return `${gridSizeFilter}mm`;
  }, [gridSizeFilter, activeBeadSizeId]);

  const handleGridSizeFilter = (filterId) => {
    const normalizedFilterId = String(filterId).toLowerCase();
    setGridSizeFilter(normalizedFilterId);
    if (normalizedFilterId === "all") {
      setPickerBeadSizeId(null);
      return;
    }

    const nextSizeId = `${normalizedFilterId}mm`;
    if (activeSlotIndex !== null && customizeSlotItems[activeSlotIndex]?.type === "bead") {
      const slot = customizeSlotItems[activeSlotIndex];
      if (isManualMode) {
        updateManualItemSizeAt(activeSlotIndex, nextSizeId);
      } else {
        replaceCustomizeSlotAt(activeSlotIndex, {
          type: "bead",
          assetKey: slot.assetKey,
          beadSizeId: nextSizeId,
        });
      }
      return;
    }

    setPickerBeadSizeId(nextSizeId);
    setSizeId(nextSizeId);
  };

  const styleLabel = getBeadStyleLabel(styleId);
  const lengthOptions = isManualMode ? BEAD_LENGTH_OPTIONS : BEAD_LENGTHS;

  const customizeSummaryLines = useMemo(
    () => buildPatternCustomizeSummaryLines(pattern),
    [pattern]
  );

  const showCustomizeAddSlot =
    customizeTab === "charms" ? canAddCharm() : canAddCurrentSelection;

  const buildSummaryContent = isSummaryExpanded ? (
    <section className="theme3-build-summary order-summary-card" aria-label="Build Summary">
      <div className="order-summary-section">
        <div className="order-summary-row">
          <span className="order-summary-title">String</span>
          <span className="order-summary-price">${jewelryPrice.toLocaleString()}</span>
        </div>
        <div className="order-summary-desc">Thread included · {styleLabel}</div>
        <div className="order-summary-desc">Length: {displayLengthLabel}</div>
      </div>
      {customizeSummaryLines.length > 0 && (
        <>
          <div className="order-summary-section">
            <div className="order-summary-row">
              <span className="order-summary-title">Customize</span>
              <span className="order-summary-price">${customizePrice.toLocaleString()}</span>
            </div>
          </div>
          {customizeSummaryLines.map((line) => (
            <div key={line.key} className="order-summary-section order-summary-section--nested">
              <div className="order-summary-row">
                <span className="order-summary-title">{line.title}</span>
                <span className="order-summary-price">${line.price.toLocaleString()}</span>
              </div>
              {line.detail && <div className="order-summary-desc">{line.detail}</div>}
            </div>
          ))}
        </>
      )}
    </section>
  ) : null;

  return (
    <aside className="theme3-configurator-panel">
      <header className="theme3-panel-header" ref={headerRef} aria-hidden="true" />

      <div className="theme3-panel-scroll" ref={scrollContainerRef}>
        <div className="theme3-option-section" data-theme3-section="jewelry" ref={sectionRefs.jewelry}>
          <header className="theme3-option-section-header">
            <h3>Jewelry</h3>
            <span className="theme3-section-header-price">${jewelryPrice.toLocaleString()}</span>
          </header>

          <OptionRow title="Category">
            {/* Merged /Jewelery-customizer shell only: jump to the other apps. */}
            {isJewelryShellActive() && (
              <>
                <TextOption
                  active={false}
                  label="Necklace"
                  onClick={() => requestJewelryCategory("necklace")}
                />
                <TextOption
                  active={false}
                  label="Bracelet"
                  onClick={() => requestJewelryCategory("bracelet")}
                />
              </>
            )}
            {BEAD_JEWELRY_CATEGORIES.map((category) => (
              <TextOption
                key={category.id}
                active={jewelryCategory === category.id}
                label={category.label}
                disabled={category.disabled}
                onClick={() => setJewelryCategory(category.id)}
              />
            ))}
          </OptionRow>

          <OptionRow title="Style" className="beads-style-row">
            {VISIBLE_BEAD_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                className={`gb-card-option beads-style-card ${styleId === style.id ? "active" : ""}`}
                onClick={() => selectStyleId(style.id)}
              >
                <span className="beads-style-card__thumb">
                  <StylePreviewThumb styleId={style.id} />
                </span>
                <span>{style.label}</span>
              </button>
            ))}
          </OptionRow>

          <OptionRow title="Length">
            {lengthOptions.map((length) => (
              <TextOption
                key={length.id}
                active={lengthId === length.id}
                onClick={() => selectLengthId(length.id)}
              >
                <span>{length.label}</span>
              </TextOption>
            ))}
          </OptionRow>
        </div>

        <div
          className="theme3-option-section"
          data-theme3-section="customize"
          ref={sectionRefs.customize}
        >
          <header className="theme3-option-section-header">
            <h3>Customize</h3>
            <span className="theme3-section-header-price">${customizePrice.toLocaleString()}</span>
          </header>

          {activeSlotItem && (
            <p className="beads-slot-replace-hint">
              Slot selected — use the{" "}
              {activeSlotItem.type === "bead"
                ? "Beads"
                : activeSlotItem.type === "spacer"
                  ? "Spacers"
                  : "Charms"}{" "}
              tab to pick a replacement
              {showCustomizeAddSlot ? ", or use + to add." : "."}
            </p>
          )}

          <div
            ref={slotRowRef}
            className={`selected-charms-row${isSlotDragActive ? " is-dragging-slots" : ""}`}
            style={{ position: "relative" }}
          >
            {customizeSlotItems.length > 0 || (isManualMode && showCustomizeAddSlot) ? (
              <>
                {showCustomizeAddSlot && (
                  <div
                    className="selected-charm-slot add-slot"
                    title="Add to string"
                    role="button"
                    tabIndex={0}
                    onClick={handleAddSlotClick}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleAddSlotClick(event);
                      }
                    }}
                  >
                    <span aria-hidden="true">+</span>
                  </div>
                )}

                {customizeSlotItems.map((item, index) => {
                  const asset = resolvePatternAsset(item.type, item.assetKey);
                  const isActive = index === activeSlotIndex;
                  const isDragging = draggingSlotIndex === index;

                  return (
                    <div
                      key={item.id || `slot-${index}`}
                      ref={(el) => {
                        beadSlotRefs.current[index] = el;
                      }}
                      data-slot-id={item.id || `slot-${index}`}
                      className={`selected-charm-slot ${isActive ? "active-slot" : ""} ${isDragging ? "is-dragging-slot" : ""}`}
                      onPointerDown={(event) => handleBeadPointerDown(event, index)}
                      onDragStart={(event) => event.preventDefault()}
                      onClick={() => {
                        if (suppressBeadClickRef.current) {
                          suppressBeadClickRef.current = false;
                          return;
                        }
                        handleSlotSelect(index);
                      }}
                      style={{
                        touchAction: "none",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        WebkitUserDrag: "none",
                        cursor: isDragging
                          ? "grabbing"
                          : customizeSlotItems.length >= 2
                            ? "grab"
                            : "pointer",
                        // No transform while held: the drag loop writes it to this node each
                        // frame, and a value here would overwrite it on every re-render.
                        ...(isDragging ? { zIndex: 10, position: "relative" } : {}),
                      }}
                    >
                      <img
                        src={asset.image}
                        alt={asset.name}
                        draggable={false}
                        style={{ WebkitUserDrag: "none", pointerEvents: "none" }}
                      />
                      {item.type === "bead" && (
                        <span className="beads-slot-size-label">{item.sizeId || sizeId}</span>
                      )}
                      {item.type === "charm" && (
                        <span className="beads-slot-size-label">Charm</span>
                      )}
                      <button
                        type="button"
                        className="remove-slot-btn"
                        aria-label={`Remove ${item.type}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (isManualMode) {
                            removeManualItemAt(index);
                          } else {
                            removePresetSlotAt(index);
                          }
                          setActiveSlotIndex((prev) => {
                            if (prev === null) return null;
                            if (prev === index) return null;
                            if (prev > index) return prev - 1;
                            return prev;
                          });
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}

                {isManualMode && manualItems.length > 0 && (
                  <button
                    type="button"
                    className="clear-all-charms-btn"
                    title="Remove all beads"
                    aria-label="Remove all beads"
                    onClick={() => {
                      clearManualItems();
                      setActiveSlotIndex(null);
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                )}
              </>
            ) : (
              <p className="beads-slot-replace-hint">
                {isManualMode
                  ? "Use the tabs below and + to add beads, charms, or spacers."
                  : "Add beads on the bracelet to customize slots here."}
              </p>
            )}
          </div>

          <OptionRow title="" className="beads-customize-tabs">
            {customizeTabsShownInUi.map((tab) => (
              <TextOption
                key={tab.id}
                active={customizeTab === tab.id}
                label={tab.label}
                disabled={
                  (tab.id === "spacers" && !spacersTabEnabled) ||
                  (tab.id === "charms" && !charmsTabEnabled)
                }
                onClick={() => setCustomizeTab(tab.id)}
              />
            ))}
          </OptionRow>

          {(customizeTab === "beads" || customizeTab === "spacers" || customizeTab === "charms") && (
            <div className="beads-customize-picker">
              {customizeTab === "beads" && (
                <div className="beads-picker-filters">
                  <div className="beads-picker-filter beads-picker-filter--type">
                    <span className="beads-picker-filter__label">Type</span>
                    <div className="beads-picker-type-select-wrap">
                      <select
                        className="beads-picker-type-select"
                        value={collectionId}
                        onChange={(event) => setCollectionId(event.target.value)}
                        aria-label="Bead type"
                      >
                        {BEAD_COLLECTIONS.map((collection) => (
                          <option key={collection.id} value={collection.id}>
                            {collection.label}
                          </option>
                        ))}
                      </select>
                      <span className="beads-picker-type-select__chevron" aria-hidden="true">
                        <svg viewBox="0 0 12 8" fill="none">
                          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  <div className="beads-picker-filter beads-picker-filter--size">
                    <span className="beads-picker-filter__label">Size (mm)</span>
                    <div className="beads-picker-size-options">
                      {BEAD_GRID_SIZE_FILTERS.map((filter) => {
                        const isActive = gridSizeFilter === filter.id;

                        return (
                          <button
                            key={filter.id}
                            type="button"
                            className={`beads-picker-size-btn ${isActive ? "active" : ""}`}
                            onClick={() => handleGridSizeFilter(filter.id)}
                          >
                            {filter.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="beads-asset-grid-section">
                <div
                  className={`beads-asset-grid ${
                    customizeTab === "spacers"
                      ? "beads-asset-grid--spacers"
                      : customizeTab === "charms"
                        ? "beads-asset-grid--charms"
                        : "beads-asset-grid--picker"
                  }`}
                >
                  {customizeTab === "beads"
                    ? beadGridItems.map((entry) => (
                        <BeadPickerCard
                          key={entry.key}
                          asset={entry.asset}
                          active={
                            (activeSlotItem?.type === "bead" &&
                              activeSlotIndex !== null &&
                              customizeSlotItems[activeSlotIndex]?.assetKey === entry.asset.key &&
                              (customizeSlotItems[activeSlotIndex]?.sizeId || sizeId) === entry.sizeId) ||
                            (activeSlotItem?.type !== "bead" &&
                              activeSlotIndex === null &&
                              selectedBeadKey === entry.asset.key &&
                              (gridSizeFilter === "all"
                                ? pickerBeadSizeId === null || entry.sizeId === pickerBeadSizeId
                                : entry.sizeId === `${gridSizeFilter}mm`))
                          }
                          disabled={!isBeadPickerEntryEnabled(entry.asset.key, entry.sizeId)}
                          sizeLabel={entry.sizeLabel}
                          showSizeInLabel={entry.showSizeInLabel}
                          showPrice
                          onClick={(event) => handleAssetSelect(entry.asset.key, event, entry.sizeId)}
                        />
                      ))
                    : visibleAssets.map((asset) => (
                        <BeadPickerCard
                          key={asset.key}
                          asset={asset}
                          active={
                            customizeTab === "charms"
                              ? (activeSlotItem?.type === "charm" &&
                                  activeSlotIndex !== null &&
                                  customizeSlotItems[activeSlotIndex]?.assetKey === asset.key) ||
                                (activeSlotIndex === null && selectedAssetKey === asset.key)
                              : customizeTab === "spacers"
                                ? (activeSlotIndex !== null &&
                                    activeSlotItem?.type === "spacer" &&
                                    customizeSlotItems[activeSlotIndex]?.assetKey === asset.key) ||
                                  (activeSlotIndex === null && selectedSeparatorKey === asset.key)
                                : selectedAssetKey === asset.key
                          }
                          disabled={
                            customizeTab === "charms"
                              ? !canAddCharm() &&
                                !(activeSlotItem?.type === "charm" && activeSlotIndex !== null)
                              : customizeTab === "spacers"
                                ? !isSpacerPickerEntryEnabled(asset.key)
                                : !canAddCurrentSelection
                          }
                          sizeLabel={customizeTab === "charms" ? "Charm" : gridSizeLabel}
                          showPrice={customizeTab === "beads" || customizeTab === "charms"}
                          displayLabel={customizeTab === "charms" ? "Charm" : undefined}
                          onClick={(event) => handleAssetSelect(asset.key, event)}
                        />
                      ))}
                </div>
              </div>
            </div>
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
              <strong className="theme3-summary-price">${totalPrice.toLocaleString()}</strong>
              <span className="theme3-summary-tax-label">+ tax</span>
            </div>
          </div>

          <div className="theme3-footer-actions">
            <button
              type="button"
              className="theme3-panel-footer-cta"
              disabled={footerCtaDisabled}
              onClick={handleFooterContinue}
            >
              {footerCtaLabel}
            </button>

            <div className="theme3-footer-secondary-actions">
              <button type="button" className="theme3-panel-action-btn theme3-panel-share-btn">
                Share
              </button>
              <button
                type="button"
                className="theme3-panel-action-btn theme3-panel-reset-btn"
                onClick={() => setShowResetPopup(true)}
                aria-label="Reset bracelet configuration"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </footer>
    </aside>
  );
});

export default BeedsControls;
