import { createContext, useState } from "react";

export const CaptureContext = createContext(false);

export const CaptureProvider = ({ children }) => {
  const [ capture, setCapture ] = useState(false);

  return (
    <CaptureContext.Provider value={{ capture, setCapture }}>
      {children}
    </CaptureContext.Provider>
  );
};
