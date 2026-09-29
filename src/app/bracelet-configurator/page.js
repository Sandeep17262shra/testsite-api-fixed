import { redirect } from "next/navigation";

// The bracelet and necklace configurators now live on one page
// (/Jewelery-customizer) with an in-panel Necklace/Bracelet category
// switch — no separate route or URL param for it. This old route just
// forwards here; a shared ?config= link still opens on the right category
// because the config payload carries its own `type` field.
export default function BraceletConfiguratorPage({ searchParams }) {
  const params = new URLSearchParams(searchParams);
  const query = params.toString();
  redirect(query ? `/Jewelery-customizer?${query}` : "/Jewelery-customizer");
}
