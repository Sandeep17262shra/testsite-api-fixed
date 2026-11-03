"use client";

import ContextProvider from "@/lib/beeds-configurator/contexts/ContextProvider";
import { preloadCriticalBeadsConfiguratorImages } from "@/lib/beeds-configurator/beadAssetPreload";
import BeedsConfigurator from "@/lib/beeds-configurator/BeedsConfigurator";

if (typeof window !== "undefined") {
  preloadCriticalBeadsConfiguratorImages();
}

export default function BeedsConfiguratorClient() {
  return (
    <ContextProvider>
      <BeedsConfigurator />
    </ContextProvider>
  );
}
