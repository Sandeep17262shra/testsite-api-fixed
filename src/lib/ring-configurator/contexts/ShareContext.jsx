import { createContext, useEffect, useMemo, useState } from "react";
import {
  getStoreCurrencyCode,
  getStoreLanguage,
  getStoreLocale,
  resolveParentUrl,
} from "../utility/Parentconfig";
import { useStoreContext } from "./StoreContext";
import { initPriceConfig } from "../priceConfig";

export const ShareContext = createContext(false);

export const ShareProvider = ({ children }) => {
  const [share, setShare] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const { parentUrl } = useStoreContext();
  const [parent, setParent] = useState(() => parentUrl || resolveParentUrl());
  const [priceConfigVersion, setPriceConfigVersion] = useState(0);

  useEffect(() => {
    const initialParent = parentUrl || resolveParentUrl();
    if (initialParent && initialParent !== parent) setParent(initialParent);

    // Same direct parentUrl listener used by Version 1. This makes prices and
    // available options react immediately whenever the store posts an update.
    const handleParentMessage = (event) => {
      const nextParent = event.data?.parentUrl;
      if (typeof nextParent === "string" && nextParent.trim()) {
        setParent(nextParent);
      }
    };

    window.addEventListener("message", handleParentMessage);
    return () => window.removeEventListener("message", handleParentMessage);
  }, [parentUrl]);

  useEffect(() => {
    let cancelled = false;

    // The simulator can send `parentUrl` after the configurator has mounted.
    // Refresh the actual catalogue used by the UI whenever that happens, then
    // trigger a context update so inactive API options disappear immediately.
    initPriceConfig({ parentUrl: parent })
      .then(() => {
        if (!cancelled) setPriceConfigVersion((version) => version + 1);
      })
      .catch((error) => {
        console.warn("Unable to refresh store price configuration:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [parent]);

  const storeMeta = useMemo(
    () => ({
      locale: getStoreLocale(parent),
      language: getStoreLanguage(parent),
      currencyCode: getStoreCurrencyCode(parent),
    }),
    [parent]
  );

  return (
    <ShareContext.Provider
      value={{
        share,
        setShare,
        shareUrl,
        setShareUrl,
        parent,
        setParent,
        priceConfigVersion,
        ...storeMeta,
      }}
    >
      {children}
    </ShareContext.Provider>
  );
};
