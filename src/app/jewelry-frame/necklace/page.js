"use client";

import dynamic from "next/dynamic";
import ConfiguratorSkeleton from "@/components/ConfiguratorSkeleton";

const NecklaceConfiguratorClient = dynamic(
  () => import("@/components/NecklaceConfiguratorClient"),
  { ssr: false, loading: () => <ConfiguratorSkeleton /> }
);

/**
 * Frame route used by /Jewelery-customizer. Its own document keeps the necklace
 * app's global css away from the bead app's — see lib/jewelry-shell.
 */
export default function NecklaceFramePage({ searchParams }) {
  const type = searchParams?.type === "bracelet" ? "bracelet" : "necklace";
  return <NecklaceConfiguratorClient initialType={type} />;
}
