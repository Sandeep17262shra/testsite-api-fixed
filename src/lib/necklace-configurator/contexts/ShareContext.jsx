import { createContext, useEffect, useState } from "react";
import { useStoreContext } from "@/lib/ring-configurator/contexts/StoreContext";
import { resolveParentUrl } from "../shared/parentCategoryConfig";
import { initNecklacePriceConfig } from "../necklacePriceConfig";
import { initBraceletPriceConfig } from "../braceletPriceConfig";

export const ShareContext = createContext(false);

export const ShareProvider = ({ children }) => {
  const [share, setShare] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const { parentUrl: storeParentUrl, shop, canonicalShop } = useStoreContext();
  const [parent, setParent] = useState(() => storeParentUrl || resolveParentUrl() || null);
  const [necklacePriceConfigVersion, setNecklacePriceConfigVersion] = useState(0);
  const [braceletPriceConfigVersion, setBraceletPriceConfigVersion] = useState(0);

  useEffect(() => {
    const initialParent = storeParentUrl || resolveParentUrl();
    if (initialParent && initialParent !== parent) {
      setParent(initialParent);
    }

    const handleParentMessage = (event) => {
      const nextParent = event.data?.parentUrl;
      if (typeof nextParent === "string" && nextParent.trim()) {
        setParent(nextParent);
      }
    };

    window.addEventListener("message", handleParentMessage);
    return () => window.removeEventListener("message", handleParentMessage);
  }, [storeParentUrl]);

  useEffect(() => {
    let cancelled = false;

    const pricingParent = parent || storeParentUrl || null;
    const pricingShop = shop || canonicalShop || null;

    Promise.all([
      initNecklacePriceConfig({
        parentUrl: pricingParent,
        shop: pricingShop,
        canonicalShop,
      }),
      initBraceletPriceConfig({
        parentUrl: pricingParent,
        shop: pricingShop,
        canonicalShop,
      }),
    ])
      .then(() => {
        if (!cancelled) {
          setNecklacePriceConfigVersion((version) => version + 1);
          setBraceletPriceConfigVersion((version) => version + 1);
        }
      })
      .catch((error) => {
        console.warn("Unable to refresh jewelry price configuration:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [parent, storeParentUrl, shop, canonicalShop]);

  return (
    <ShareContext.Provider
      value={{
        share,
        setShare,
        shareUrl,
        setShareUrl,
        parent,
        setParent,
        necklacePriceConfigVersion,
        braceletPriceConfigVersion,
      }}
    >
      {children}
    </ShareContext.Provider>
  );
};