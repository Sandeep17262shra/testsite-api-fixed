"use client";

import { useEffect, useState } from "react";
import ContextProvider from "@/lib/beeds-configurator/contexts/ContextProvider";
import BeedsConfigurator from "@/lib/beeds-configurator/BeedsConfigurator";

export default function BeedsConfiguratorClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ContextProvider>
      <BeedsConfigurator />
    </ContextProvider>
  );
}
