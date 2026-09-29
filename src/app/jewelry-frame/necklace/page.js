import NecklaceConfiguratorClient from "@/components/NecklaceConfiguratorClient";

/**
 * Frame route used by /Jewelery-customizer. Its own document keeps the necklace
 * app's global css away from the bead app's — see lib/jewelry-shell.
 */
export const metadata = {
  title: "Jewelry Configurator",
  robots: { index: false, follow: false },
};

export default function NecklaceFramePage({ searchParams }) {
  const type = searchParams?.type === "bracelet" ? "bracelet" : "necklace";
  return <NecklaceConfiguratorClient initialType={type} />;
}
