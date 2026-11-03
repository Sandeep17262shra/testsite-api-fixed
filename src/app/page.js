"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Base64 } from "js-base64";
import ConfiguratorSkeleton from "@/components/ConfiguratorSkeleton";

// Always show skeleton while any chunk is downloading
const loading = () => <ConfiguratorSkeleton />;

const RingConfiguratorClient = dynamic(
  () => import("@/components/RingConfiguratorClient"),
  { ssr: false, loading }
);

const BraceletConfiguratorClient = dynamic(
  () => import("@/components/BraceletConfiguratorClient"),
  { ssr: false, loading }
);

const BeedsConfiguratorClient = dynamic(
  () => import("@/components/BeedsConfiguratorClient"),
  { ssr: false, loading }
);

const NecklaceConfiguratorClient = dynamic(
  () => import("@/components/NecklaceConfiguratorClient"),
  { ssr: false, loading }
);

const BRACELET_FLOWS = new Set(["3C", "BRACELET", "BRACELET-CONFIGURATOR"]);
const BEEDS_FLOWS = new Set(["BEEDS", "BEAD", "BEAD-BRACELET", "BEADS-CONFIGURATOR", "BEEDS-CONFIGURATOR"]);
const NECKLACE_FLOWS = new Set(["NECKLACE", "NECKLACE-CONFIGURATOR", "PENDANT"]);

function resolveFlowFromLocation() {
  if (typeof window === "undefined") return null;
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
  // null = not yet resolved on client (show skeleton); string = resolved
  const [flow, setFlow] = useState(null);
  const prevFlowRef = useRef(null);

  useEffect(() => {
    const currentFlow = resolveFlowFromLocation();
    prevFlowRef.current = currentFlow;
    setFlow(currentFlow);
  }, []);

  // Listen for postMessage flow changes (e.g. parent frame switching configurator)
  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.data || typeof event.data !== "object") return;
      const msgFlow = event.data.flow;
      if (!msgFlow) return;
      const normalized = String(msgFlow).toUpperCase();
      if (normalized !== prevFlowRef.current) {
        prevFlowRef.current = normalized;
        setFlow(normalized);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Show skeleton until the flow is resolved on the client
  if (flow === null) return <ConfiguratorSkeleton />;

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
