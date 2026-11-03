"use client";

import dynamic from "next/dynamic";
import ConfiguratorSkeleton from "@/components/ConfiguratorSkeleton";

const BeedsConfiguratorClient = dynamic(
  () => import("@/components/BeedsConfiguratorClient"),
  { ssr: false, loading: () => <ConfiguratorSkeleton /> }
);

export default function BeadedBraceletConfiguratorPage() {
  return <BeedsConfiguratorClient />;
}
