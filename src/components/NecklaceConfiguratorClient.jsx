"use client";

import ContextProvider from "@/lib/necklace-configurator/contexts/ContextProvider";
import NecklaceConfigurator from "@/lib/necklace-configurator/NecklaceConfigurator";

export default function NecklaceConfiguratorClient({ initialType }) {
  return (
    <ContextProvider initialType={initialType}>
      <NecklaceConfigurator />
    </ContextProvider>
  );
}
