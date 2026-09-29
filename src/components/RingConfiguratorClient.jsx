"use client";

import ContextProvider from "@/lib/ring-configurator/contexts/ContextProvider";
import RingConfigurator from "@/lib/ring-configurator/RingConfigurator";

export default function RingConfiguratorClient() {
  return (
    <ContextProvider>
      <RingConfigurator />
    </ContextProvider>
  );
}
