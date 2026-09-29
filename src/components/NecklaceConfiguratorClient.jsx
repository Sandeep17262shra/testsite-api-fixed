"use client";

import { useEffect, useState } from "react";
import ContextProvider from "@/lib/necklace-configurator/contexts/ContextProvider";
import NecklaceConfigurator from "@/lib/necklace-configurator/NecklaceConfigurator";

export default function NecklaceConfiguratorClient({ initialType }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ContextProvider initialType={initialType}>
      <NecklaceConfigurator />
    </ContextProvider>
  );
}
