import BeedsConfiguratorClient from "@/components/BeedsConfiguratorClient";

/**
 * Frame route used by /Jewelery-customizer. Its own document keeps the bead
 * app's global css away from the necklace app's — see lib/jewelry-shell.
 */
export const metadata = {
  title: "Beaded Bracelet Configurator",
  robots: { index: false, follow: false },
  icons: { icon: "/RC.png" },
};

export default function BeadBraceletFramePage() {
  return <BeedsConfiguratorClient />;
}
