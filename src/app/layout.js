import "./globals.css";
import "../lib/ring-configurator/RCApp.css";
import "../lib/bracelet-configurator/BraceletApp.css";

const storeContextBootstrap = `
  window.__parentConfig = null;
  window.addEventListener("message", function (event) {
    if (event.data?.parentUrl) {
      window.__parentConfig = event.data;
    }
  });
`;

export const metadata = {
  title: "Ring Configurator",
  description: "Standalone ring configurator",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        {/*
          The default ring cannot render its metal or diamond material until
          these two environment maps are decoded. Start their requests during
          HTML parsing rather than waiting for the client-only R3F tree to
          mount after its JavaScript chunk has loaded. `as="fetch"` plus the
          matching CORS mode lets Three's FileLoader reuse the browser cache.
        */}
        <link
          rel="preload"
          href="/metal_texture/metal3.hdr"
          as="fetch"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/env_gem_002.exr"
          as="fetch"
          crossOrigin="anonymous"
        />
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
