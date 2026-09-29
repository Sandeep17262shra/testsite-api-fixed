"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Base64 } from "js-base64";

const RingConfiguratorClient = dynamic(
  () => import("@/components/RingConfiguratorClient"),
  { ssr: false }
);

const BraceletConfiguratorClient = dynamic(
  () => import("@/components/BraceletConfiguratorClient"),
  { ssr: false }
);

const BeedsConfiguratorClient = dynamic(
  () => import("@/components/BeedsConfiguratorClient"),
  { ssr: false }
);

const NecklaceConfiguratorClient = dynamic(
  () => import("@/components/NecklaceConfiguratorClient"),
  { ssr: false }
);

const BRACELET_FLOWS = new Set(["3C", "BRACELET", "BRACELET-CONFIGURATOR"]);
const BEEDS_FLOWS = new Set(["BEEDS", "BEAD", "BEAD-BRACELET", "BEADS-CONFIGURATOR", "BEEDS-CONFIGURATOR"]);
const NECKLACE_FLOWS = new Set(["NECKLACE", "NECKLACE-CONFIGURATOR", "PENDANT"]);

function resolveFlowFromLocation() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  const flowParam = params.get("flow")?.toUpperCase();
  if (flowParam) return flowParam;

  const encodedConfig = params.get("config");
  if (encodedConfig) {
    try {
      const config = JSON.parse(Base64.decode(encodedConfig));
      if (config.type === "beads" || config.type === "beeds" || BEEDS_FLOWS.has(String(config.flow || "").toUpperCase())) {
        return "BEEDS";
      }
      if (config.type === "bracelet" || BRACELET_FLOWS.has(String(config.flow || "").toUpperCase())) {
        return "BRACELET";
      }
      if (config.type === "pendant" || config.type === "necklace" || NECKLACE_FLOWS.has(String(config.flow || "").toUpperCase())) {
        return "NECKLACE";
      }
      if (config.flow) {
        return String(config.flow).toUpperCase();
      }
    } catch {}
  }
  return "";
}

export default function Home() {
  const [flow, setFlow] = useState(resolveFlowFromLocation);

  useEffect(() => {
    const currentFlow = resolveFlowFromLocation();
    if (currentFlow !== flow) {
      setFlow(currentFlow);
    }
  }, [flow]);

  if (BEEDS_FLOWS.has(flow)) {
    return <BeedsConfiguratorClient />;
  }

  if (BRACELET_FLOWS.has(flow)) {
    return <BraceletConfiguratorClient />;
  }

  if (NECKLACE_FLOWS.has(flow)) {
    return <NecklaceConfiguratorClient />;
  }

  return <RingConfiguratorClient />;
}

