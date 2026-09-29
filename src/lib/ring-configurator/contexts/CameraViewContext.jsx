import { createContext, useState } from "react";

export const CameraViewContext = createContext("");

export const CameraViewProvider = ({ children }) => {
  // The plain shank product pose is the configurator's default camera view.
  const [ cameraView, setCameraView ] = useState("perspective");

  return (
    <CameraViewContext.Provider value={{ cameraView, setCameraView }}>
      {children}
    </CameraViewContext.Provider>
  );
};
