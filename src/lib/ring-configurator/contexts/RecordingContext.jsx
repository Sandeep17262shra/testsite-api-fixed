import { createContext, useState } from "react";

export const RecordingContext = createContext(false);

export const RecordingProvider = ({ children }) => {
  const [ recording, setRecording ] = useState(false);

  return (
    <RecordingContext.Provider value={{ recording, setRecording }}>
      {children}
    </RecordingContext.Provider>
  );
};
