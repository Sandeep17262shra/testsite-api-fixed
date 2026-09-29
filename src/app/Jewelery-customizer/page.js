import JewelryCustomizerClient from "@/components/JewelryCustomizerClient";

export const metadata = {
  title: "Jewelry Configurator",
  description: "Create a personalized charm necklace, bracelet or bead bracelet",
};

/**
 * Single entry point for all three configurators. The url stays
 * /Jewelery-customizer whichever one is open — the category switcher inside the
 * panel reloads this same page with the new pick (see jewelryCategoryBus.js).
 */
export default function JewelryCustomizerPage() {
  return <JewelryCustomizerClient />;
}
