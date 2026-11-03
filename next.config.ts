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
    // API and socket server origin — used in connect-src so the browser
    // allows XHR/fetch/WebSocket to the backend.
    const apiOrigin = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1")
      .replace(/\/api\/v\d+\/?$/, "")   // strip path: keep scheme+host+port
      .replace(/\/$/, "");
    const socketOrigin = (process.env.NEXT_PUBLIC_SOCKET_URL || apiOrigin);

    // Third-party script hosts that must be allowed to execute JS.
    // Stripe JS is only used by InvoicePaymentModal (not yet wired up, but
    // listed here so a future activation doesn't need a config change).
    const scriptHosts = [
      "https://challenges.cloudflare.com",  // Cloudflare Turnstile
      "https://js.stripe.com",              // Stripe.js
    ].join(" ");

    // Third-party connect endpoints (XHR/fetch/WebSocket).
    const connectHosts = [
      apiOrigin,
      socketOrigin,
      "https://challenges.cloudflare.com",
      "https://api.stripe.com",
    ].join(" ");

    // Frames: Stripe payment UI, Cloudflare Turnstile challenge.
    const frameHosts = [
      "https://js.stripe.com",
      "https://challenges.cloudflare.com",
    ].join(" ");

    // Next.js App Router injects small inline scripts for hydration and
    // __NEXT_DATA__. Those require 'unsafe-inline' until the framework fully
    // supports per-request nonces (tracked in next.js#42170). This is the
    // practical CSP floor — it blocks injected <script src="..."> tags from
    // unknown origins, which is the primary XSS vector when tokens are in
    // localStorage.
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' ${scriptHosts}`,
      "script-src-attr 'none'",
      `connect-src 'self' ${connectHosts}`,
      "style-src 'self' 'unsafe-inline'",          // Tailwind inlines styles
      "img-src 'self' data: blob: https:",          // business CDN images
      "font-src 'self' data:",
      `frame-src ${frameHosts}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; ");

    const common = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
      { key: "Content-Security-Policy", value: csp },
    ];
    return [
      {
        // everything except the embeddable widget
        source: "/((?!book-now).*)",
        headers: [
          ...common,
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      {
        // The booking widget is meant to be embedded in third-party iframes.
        // Keep the CSP for script protection but allow framing from any origin.
        source: "/book-now/:path*",
        headers: common,
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
