import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RingContext } from "./RingContext";
import { DiamondContext } from "./DiamondContext";
import { getDiamondWiseDesignById } from "../data/diamondwiseDesigns";
import { pauseBackgroundPreload, resumeBackgroundPreload } from "../utility/modelLoader";

// ─────────────────────────────────────────────────────────────────────────────
// SCENE STAGING
//
// The configurator has two configurations at any moment:
//
//   target    – what the shopper just selected (live context values)
//   displayed – what is actually on screen right now
//
// Every 3D part loads for `target` but renders from `displayed`. `displayed`
// only advances to `target` once EVERY part required by that configuration
// reports that its model is fully loaded. That is what makes a selection
// atomic: the previous ring (shank + head + diamond together) stays on screen,
// untouched, until the complete new ring is ready to be swapped in.
//
// It also gives an accurate loader: the spinner is shown exactly while
// `displayed !== target`, so a superseded (slower) selection can never keep the
// spinner alive after a newer, faster selection has already been painted.
// ─────────────────────────────────────────────────────────────────────────────

const PARTS_STANDARD = ["ring", "head", "diamond", "band"];
// HALO's centre stone is baked into its own head model (see Head.jsx /
// Scene.jsx "own centre stone" change) - the shared <Diamond> component is
// never mounted while a HALO head is displayed, so it never reports the
// "diamond" part ready. Requiring that part for HALO would leave every
// shape/carat change stuck pending forever (until the watchdog force-commits
// 45s later), which is why shape switches looked like they weren't loading.
const PARTS_HALO = ["ring", "head", "band"];
const PARTS_DIAMONDWISE = ["diamondwise", "diamond"];
const PARTS_NO_HEAD = ["ring", "band"];
const WEDDING_BAND_MODEL_SHANKS = new Set(["CHANNEL", "PLATE-PRONG"]);

const getRingLayer = (ringHead, ringShank, ringSideSetting) => {
  // A wedding ring is rendered without a head. For its Pave and Channel
  // styles, use the matching-band geometry; engagement rings retain their
  // regular shank assets, even when they use those same style IDs.
  if (ringHead === "NO-HEAD" && WEDDING_BAND_MODEL_SHANKS.has(ringShank)) {
    return `wedding-band:${ringShank}`;
  }

  return ringSideSetting === "PLAIN" ? `shank:${ringShank}` : `setting:${ringSideSetting}`;
};

// Safety net: if a model 404s or a part never reports (bad data, dead network),
// never leave the shopper staring at a frozen ring forever.
const COMMIT_WATCHDOG_MS = 45000;

const noop = () => {};

export const SceneStageContext = createContext({
  target: null,
  displayed: null,
  isPending: false,
  reportPartReady: noop,
});

export const useSceneStage = () => useContext(SceneStageContext);

export const SceneStageProvider = ({ children }) => {
  const {
    ringShank,
    ringHead,
    ringSideSetting,
    ringBand,
    ringMatchingBand,
    diamondWiseDesignId,
  } = useContext(RingContext);
  const { shape, diamondSize } = useContext(DiamondContext);

  const isDiamondWise = Boolean(getDiamondWiseDesignById(diamondWiseDesignId));

  const target = useMemo(() => {
    const ringLayer = getRingLayer(ringHead, ringShank, ringSideSetting);

    return {
      isDiamondWise,
      ringShank,
      ringHead,
      ringSideSetting,
      ringBand,
      ringMatchingBand,
      diamondWiseDesignId,
      shape,
      diamondSize,
      parts: {
        ring: ringLayer,
        head: `${ringHead}|${shape}`,
        diamond: shape,
        diamondwise: `${diamondWiseDesignId}|${ringShank}`,
        band: ringBand === "Yes" ? `band:${ringMatchingBand}` : "none",
      },
    };
  }, [
    isDiamondWise,
    ringShank,
    ringHead,
    ringSideSetting,
    ringBand,
    ringMatchingBand,
    diamondWiseDesignId,
    shape,
    diamondSize,
  ]);

  const isHaloTarget = ringHead === "HALO";
  const isNoHeadTarget = ringHead === "NO-HEAD";
  const requiredParts = isDiamondWise
    ? PARTS_DIAMONDWISE
    : isHaloTarget
    ? PARTS_HALO
    : isNoHeadTarget
    ? PARTS_NO_HEAD
    : PARTS_STANDARD;

  const signature = useMemo(
    () =>
      `${isDiamondWise ? "dw" : "std"}:` +
      requiredParts.map((part) => `${part}=${target.parts[part]}`).join("&"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDiamondWise, target]
  );

  const commitIdRef = useRef(0);
  const [displayed, setDisplayed] = useState(() => ({ ...target, commitId: 0 }));
  const [committedSignature, setCommittedSignature] = useState(null);

  // part id -> the part key it has finished loading
  const readyRef = useRef({});
  const [readyTick, setReadyTick] = useState(0);

  const reportPartReady = useCallback((part, key) => {
    if (readyRef.current[part] === key) return;
    readyRef.current[part] = key;
    setReadyTick((tick) => tick + 1);
  }, []);

  // Signature of a configuration that was painted by the watchdog BEFORE all of
  // its parts had finished loading. Such a commit renders whatever is in the
  // asset cache at that instant — which is how a ring ends up on screen with a
  // missing head/shank. We remember it so the scene can be repainted the moment
  // the stragglers land.
  const forcedSignatureRef = useRef(null);

  const commit = useCallback(
    (nextTarget, nextSignature) => {
      commitIdRef.current += 1;
      setDisplayed({ ...nextTarget, commitId: commitIdRef.current });
      setCommittedSignature(nextSignature);
    },
    []
  );

  useEffect(() => {
    const allReady = requiredParts.every(
      (part) => readyRef.current[part] === target.parts[part]
    );

    if (committedSignature === signature) {
      // Already on screen. If it was force-committed while parts were still
      // downloading, commit again now that everything has reported: bumping
      // commitId is what makes each part re-read the asset cache and finally
      // render the mesh that was missing.
      if (allReady && forcedSignatureRef.current === signature) {
        forcedSignatureRef.current = null;
        commit(target, signature);
      }
      return;
    }

    if (!allReady) return;
    forcedSignatureRef.current = null;
    commit(target, signature);
  }, [readyTick, requiredParts, target, signature, committedSignature, commit]);

  useEffect(() => {
    if (committedSignature === signature) return undefined;
    const timeoutId = window.setTimeout(() => {
      console.warn("[ring-configurator] Commit watchdog fired for:", signature);
      forcedSignatureRef.current = signature;
      commit(target, signature);
    }, COMMIT_WATCHDOG_MS);
    return () => window.clearTimeout(timeoutId);
  }, [signature, committedSignature, target, commit]);

  const isPending = committedSignature !== signature;

  // A shopper selection always outranks speculative background downloading.
  // Preloading is paused for the whole time a selection is resolving and picks
  // up again the moment the new ring is on screen.
  useEffect(() => {
    if (isPending) pauseBackgroundPreload();
    else resumeBackgroundPreload();
  }, [isPending]);

  const value = useMemo(
    () => ({ target, displayed, isPending, reportPartReady }),
    [target, displayed, isPending, reportPartReady]
  );

  return (
    <SceneStageContext.Provider value={value}>{children}</SceneStageContext.Provider>
  );
};
