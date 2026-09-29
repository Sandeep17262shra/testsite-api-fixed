import "./globals.css";
import "../lib/ring-configurator/RCApp.css";
import "../lib/bracelet-configurator/BraceletApp.css";

const storeContextBootstrap = `
  (function () {
    var storeMap = {
      "/bongioielli":  "https://bongioielli.com",
      "/dimendscaasi": "https://www.dimendscaasi.com",
      "/elitejewelers": "https://www.elitejewelers.com",
      "/labgrownlove":  "https://labgrownlove.de",
      "/jdemo364":      "https://jdemo364.wpenginepowered.com",
      // Dedicated route for verifying the live Shopify pricing catalogue.
      "/jewelith-pricing-test": "https://jewelith-pricing-test.myshopify.com",
      // Existing local test URL for the same Shopify test store.
      "/testsite-api-testing": "https://jewelith-pricing-test.myshopify.com"
    };
    var path = window.location.pathname.replace(/\\/+$/, "") || "/";
    var parentUrl = storeMap[path] || "https://jdemo364.wpenginepowered.com";
    window.__parentConfig = { parentUrl: parentUrl };
    window.addEventListener("message", function (event) {
      if (event.data && event.data.parentUrl) {
        window.__parentConfig = event.data;
      }
    });
  })();
`;

export const metadata = {
  title: "Ring Configurator",
  description: "Standalone ring configurator",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        {/* The ?v= must match ASSET_VERSION in lib/ring-configurator/utility/modelLoader.js —
            a mismatch means the preloaded response is discarded and the model fetched twice. */}
        <link rel="preload" href="/3d-models/RING-SHANK/PLAIN.enc?v=2" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/3d-models/RING-HEAD/4-PRONG/ROUND.enc?v=2" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/all_diamonds/round.enc?v=2" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/metal_texture/metal3.hdr" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/env_gem_002.exr" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/sprite_image_diamond.png" as="image" />
        <link rel="preload" href="/data/price-config-data.json" as="fetch" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col">
        <script
          id="store-context-bootstrap"
          dangerouslySetInnerHTML={{ __html: storeContextBootstrap }}
        />
        {children}
      </body>
    </html>
  );
}
