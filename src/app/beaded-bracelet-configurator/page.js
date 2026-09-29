import BeedsConfiguratorClient from "@/components/BeedsConfiguratorClient";

export const metadata = {
  title: "Beaded Bracelet Configurator",
  description: "Create a personalized beaded bracelet",
  icons: {
    icon: "/RC.png",
  },
};

export default function BeadedBraceletConfiguratorPage() {
  return <BeedsConfiguratorClient />;
}
