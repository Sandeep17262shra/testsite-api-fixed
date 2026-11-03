"use client";

import dynamic from "next/dynamic";
import ConfiguratorSkeleton from "@/components/ConfiguratorSkeleton";

const RingConfiguratorClient = dynamic(
  () => import("@/components/RingConfiguratorClient"),
  { ssr: false, loading: () => <ConfiguratorSkeleton /> }
);

export default function RingCustomizerPage() {
  return <RingConfiguratorClient />;
}
