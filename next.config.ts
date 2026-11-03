import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { optimizableHosts } from "./src/lib/imageHosts";

const nextConfig: NextConfig = {
  images: {
    // Business uploads come from the storage CDN; see src/lib/imageHosts.ts.
    remotePatterns: optimizableHosts().map((hostname) => ({ protocol: "https" as const, hostname })),
    formats: ["image/avif", "image/webp"],
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },

  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },

  // Baseline security headers. The app had none, so the dashboard (which keeps
  // session tokens in localStorage) could be framed by any site (clickjacking).
  // Only the booking widget (/book-now/*) is meant to be embedded in other
  // sites' iframes; everything else refuses to be framed.
  async headers() {
    const common = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    ];
    return [
      {
        // everything except the embeddable widget
        source: "/((?!book-now).*)",
        headers: [
          ...common,
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        ],
      },
      {
        source: "/book-now/:path*",
        headers: [...common, { key: "Content-Security-Policy", value: "frame-ancestors *" }],
      },
    ];
  },

  async redirects() {
    return [
      // Old public storefront → unified /[subdomain]
      {
        source: "/site/:subdomain",
        destination: "/:subdomain",
        permanent: true,
      },
      {
        source: "/site/:subdomain/:path*",
        destination: "/:subdomain/:path*",
        permanent: true,
      },
      // Old customer portal → unified /[subdomain]/portal
      {
        source: "/portal/:slug",
        destination: "/:slug/portal",
        permanent: true,
      },
      {
        source: "/portal/:slug/:path*",
        destination: "/:slug/portal/:path*",
        permanent: true,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
