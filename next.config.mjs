/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  async headers() {
    return [
      {
        source: "/:all*(enc|glb|hdr|obj|webp|png|jpg|jpeg|svg|dmat)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/3d-models/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/all_diamonds/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/metal_texture/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      // Theme 3 is embedded at the site root. Keep bracelet requests on that
      // same integration URL while serving the dedicated bracelet app.
      {
        source: "/",
        has: [
          {
            type: "query",
            key: "flow",
            value: "3C|bracelet|bracelet-configurator",
          },
        ],
        destination: "/bracelet-configurator",
      },
      {
        source: "/ring-customizer",
        destination: "/",
      },
    ];
  },
};

export default nextConfig;
