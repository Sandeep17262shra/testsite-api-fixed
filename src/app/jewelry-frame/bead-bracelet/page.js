"use client";

import dynamic from "next/dynamic";
import ConfiguratorSkeleton from "@/components/ConfiguratorSkeleton";

const BeedsConfiguratorClient = dynamic(
  () => import("@/components/BeedsConfiguratorClient"),
  { ssr: false, loading: () => <ConfiguratorSkeleton /> }
);

/**
 * Frame route used by /Jewelery-customizer. Its own document keeps the bead
 * app's global css away from the necklace app's — see lib/jewelry-shell.
 */
export default function BeadBraceletFramePage() {
  return <BeedsConfiguratorClient />;
}
