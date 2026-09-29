import { createContext, useState } from "react";

export const ShareContext = createContext(false);

export const ShareProvider = ({ children }) => {
  const [ share, setShare ] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [parent, setParent] = useState(null);

  return (
     <ShareContext.Provider value={{ share, setShare, shareUrl, setShareUrl, parent, setParent }}>
      {children}
    </ShareContext.Provider>
  );
};