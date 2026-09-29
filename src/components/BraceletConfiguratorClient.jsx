"use client";

import { useEffect, useState } from "react";
import ContextProvider from "@/lib/bracelet-configurator/contexts/ContextProvider";
import BraceletConfigurator from "@/lib/bracelet-configurator/BraceletConfigurator";

export default function BraceletConfiguratorClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ContextProvider>
      <BraceletConfigurator />
    </ContextProvider>
  );
}

