"use client";

import ContextProvider from "@/lib/bracelet-configurator/contexts/ContextProvider";
import BraceletConfigurator from "@/lib/bracelet-configurator/BraceletConfigurator";

export default function BraceletConfiguratorClient() {
  return (
    <ContextProvider>
      <BraceletConfigurator />
    </ContextProvider>
  );
}

