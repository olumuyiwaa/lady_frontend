import type { Metadata } from "next";
import type { ReactNode } from "react";
import type { CSSProperties } from "react";
import { getStorefrontServer } from "@/app/api/storefront.server";
import { brandScaleVars } from "@/lib/color";

/**
 * Customer portal: branded title, and never indexed (it is a login screen
 * with per-customer data behind it).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  let name = "";
  try {
    name = (await getStorefrontServer(subdomain))?.business.name ?? "";
  } catch {
    /* a failed lookup must not break the portal; fall back to a generic title */
  }
  return {
    title: name ? `${name} · My bookings` : "My bookings",
    robots: { index: false, follow: false },
  };
}

/**
 * The customer portal is "My Account" for ONE business, so it wears that
 * business's colours from the very first paint. The brand scale used to be
 * applied only after the page's client-side storefront fetch, so every visit
 * flashed the default green before switching. The background matches the
 * storefront's warm neutral so clicking "My bookings" doesn't feel like
 * landing in a different product.
 */
export default async function PortalLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  let style: CSSProperties | undefined;
  try {
    const primary = (await getStorefrontServer(subdomain))?.business.branding?.primaryColor;
    if (primary) style = brandScaleVars(primary) as CSSProperties;
  } catch {
    /* the page falls back to the default scale and loads branding itself */
  }
  return (
    <div
      style={style}
      className="min-h-screen bg-[#F6F2ED] font-normal text-gray-900 antialiased dark:bg-gray-900 dark:text-white/90"
    >
      {children}
    </div>
  );
}
