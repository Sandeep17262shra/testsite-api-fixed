"use client";

import dynamic from "next/dynamic";

const R3FModelSmokeTestClient = dynamic(
  () => import("@/components/R3FModelSmokeTestClient"),
  { ssr: false }
);

export default function R3FModelTestPage() {
  return <R3FModelSmokeTestClient />;
}
