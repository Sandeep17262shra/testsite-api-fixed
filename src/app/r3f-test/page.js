"use client";

import dynamic from "next/dynamic";

const R3FSmokeTestClient = dynamic(
  () => import("@/components/R3FSmokeTestClient"),
  { ssr: false }
);

export default function R3FTestPage() {
  return <R3FSmokeTestClient />;
}
