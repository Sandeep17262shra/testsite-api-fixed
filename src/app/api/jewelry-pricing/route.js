import { NextResponse } from "next/server";

// Legacy path — same upstream as /api/ring-pricing (ring-pricing-v2 holds all product types).
const PRICING_API_URL =
  "https://ring-customizer-app.vercel.app/api/common-admin/settings/ring-pricing-v2";
  
// Server-side proxy only — keeps X-Pricing-Api-Key off the browser (CORS).
const PRICING_API_KEY = process.env.PRICING_API_KEY || "K7pR2mN9xQ4wL8bH";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const store = new URL(request.url).searchParams.get("store")?.trim();
  if (!store) {
    return NextResponse.json({ message: "A store is required." }, { status: 400 });
  }

  const upstreamUrl = new URL(PRICING_API_URL);
  upstreamUrl.searchParams.set("store", store);

  try {
    const response = await fetch(upstreamUrl, {
      headers: { "X-Pricing-Api-Key": PRICING_API_KEY },
      cache: "no-store",
    });
    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json" },
    });
  } catch (error) {
    console.error("[jewelry-pricing] Upstream request failed:", error);
    return NextResponse.json({ message: "Pricing service is unavailable." }, { status: 502 });
  }
}
