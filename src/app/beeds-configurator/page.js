import { redirect } from "next/navigation";

/** Legacy URL — use /beaded-bracelet-configurator */
export default function BeedsConfiguratorRedirectPage() {
  redirect("/beaded-bracelet-configurator");
}
