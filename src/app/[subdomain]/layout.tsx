import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Manrope } from "next/font/google";
import "@/components/site/site.css";

// Self-hosted by next/font (no render-blocking @import, no layout shift).
// This used to name "Manrope" in a font-family string, but the font was only
// @import-ed by the (marketing) route group, so tenant sites fell back to
// system-ui in production.
const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

/**
 * Shared layout for the unified business customer experience:
 *   /[subdomain]         → public storefront
 *   /[subdomain]/portal  → customer self-service portal
 */
export default async function BusinessLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  // One business: only its own slug is a real page. Without this, any unknown
  // URL (/signup, /whatever) would resolve to the storefront, because the API
  // always answers with the single business.
  const { subdomain } = await params;
  const slug = (process.env.NEXT_PUBLIC_BUSINESS_SLUG || "todcleaning").toLowerCase();
  if (subdomain.toLowerCase() !== slug) notFound();

  return (
    <div
      id="top"
      className={`${manrope.className} min-h-screen bg-[#f0f4f8] text-[#0c121e] antialiased`}
    >
      {children}
    </div>
  );
}
