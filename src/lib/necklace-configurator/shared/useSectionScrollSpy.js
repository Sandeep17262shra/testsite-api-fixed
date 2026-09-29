import { useEffect, useRef } from "react";

// Keeps the top section nav (Chain Selection / Add-ons) in sync with the
// panel's scroll position, the same way the ring configurator does: the
// active tab is the last section whose top has scrolled past the marker, and
// at the very bottom of the panel the last section is always active.
//
// While a tab click / "Add-ons" button is smooth-scrolling, the spy is paused
// (lockTo) so the tab doesn't flicker back through the sections it passes.
export function useSectionScrollSpy({ containerRef, sectionRefs, onSectionChange }) {
  const sectionRefsRef = useRef(sectionRefs);
  const onChangeRef = useRef(onSectionChange);
  const lockTimerRef = useRef(0);
  const lockedRef = useRef(false);

  useEffect(() => {
    sectionRefsRef.current = sectionRefs;
    onChangeRef.current = onSectionChange;
  });

  // The scroll panel can mount after this component does, so (re)attach on
  // every commit until it is found, and again if it is ever replaced.
  const attachedRef = useRef(null);
  const detachRef = useRef(null);
  useEffect(() => () => { detachRef.current?.(); }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || container === attachedRef.current) return;
    detachRef.current?.();
    attachedRef.current = container;

    const update = () => {
      if (lockedRef.current) return;
      const refs = sectionRefsRef.current;
      const order = Object.keys(refs);
      if (!order.length) return;

      // The panel scrolls on desktop; on some mobile layouts the page does.
      const panelScrolls = container.scrollHeight > container.clientHeight + 2;
      const markerTop = (panelScrolls ? container.getBoundingClientRect().top : 0) + 24;

      let next = order[0];
      order.forEach((id) => {
        const node = refs[id]?.current;
        if (node && node.getBoundingClientRect().top <= markerTop) next = id;
      });

      const scrolled = panelScrolls ? container.scrollTop > 0 : window.scrollY > 0;
      const atBottom = panelScrolls
        ? container.scrollTop + container.clientHeight >= container.scrollHeight - 3
        : window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3;
      if (scrolled && atBottom) next = order[order.length - 1];

      onChangeRef.current?.(next);
    };

    let frame = 0;
    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };
    // Manual scrolling always wins over an in-flight programmatic scroll.
    const unlock = () => {
      if (!lockedRef.current) return;
      lockedRef.current = false;
      window.clearTimeout(lockTimerRef.current);
    };

    container.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    container.addEventListener("wheel", unlock, { passive: true });
    container.addEventListener("touchstart", unlock, { passive: true });
    schedule();

    detachRef.current = () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(lockTimerRef.current);
      container.removeEventListener("scroll", schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      container.removeEventListener("wheel", unlock);
      container.removeEventListener("touchstart", unlock);
      attachedRef.current = null;
      detachRef.current = null;
    };
  });

  // Call before a programmatic scroll to `sectionId`.
  const lockTo = (sectionId) => {
    lockedRef.current = true;
    onChangeRef.current?.(sectionId);
    window.clearTimeout(lockTimerRef.current);
    lockTimerRef.current = window.setTimeout(() => { lockedRef.current = false; }, 900);
  };

  return { lockTo };
}
