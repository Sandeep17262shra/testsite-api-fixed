import { createContext, useState, useCallback } from "react";
import { useSceneStage } from "./SceneStageContext";

const initialLoaderState = {
  loader: false,
  setLoader: () => { },
  percentage: 0,
  setPercentage: () => { },
  resetObj: {
    // Same angled product pose used by the plain shank.
    position: [10, 8, -13],
    near: 0.1,
    far: 100
  },
  setResetObj: () => {}
};

export const LoaderContext = createContext(initialLoaderState);

export const LoaderProvider = ({ children }) => {
  const [loadingCount, setLoadingCount] = useState(0);
  const setLoader = useCallback((val) => {
    setLoadingCount(prev => val ? prev + 1 : Math.max(0, prev - 1));
  }, []);
  // The spinner is driven by the scene stage: it is visible for exactly as
  // long as the selected configuration has not been painted yet. A superseded,
  // slower selection can therefore never keep it spinning after a newer one is
  // already on screen. `setLoader` remains for non-model work (AI assistant).
  const { isPending } = useSceneStage();
  const loader = isPending || loadingCount > 0;
  const [percentage, setPercentage] = useState(initialLoaderState.percentage);
  const [resetObj, setResetObj] = useState(initialLoaderState.resetObj);

  return (
    <LoaderContext.Provider value={{ loader, setLoader, percentage, setPercentage, resetObj, setResetObj }}>
      {children}
    </LoaderContext.Provider>
  );
};
