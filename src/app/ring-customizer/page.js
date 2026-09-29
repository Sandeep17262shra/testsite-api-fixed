"use client";

import dynamic from "next/dynamic";

const RingConfiguratorClient = dynamic(
  () => import("@/components/RingConfiguratorClient"),
  { ssr: false }
);

export default function RingCustomizerPage() {
  return <RingConfiguratorClient />;
}
