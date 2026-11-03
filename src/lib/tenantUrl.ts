import type { WidgetBusiness } from "@/app/api/widget.api";

const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN || "").toLowerCase();

/**
 * The one URL a storefront should be indexed under. The same site is reachable
 * at app-host/{slug}, {slug}.{root} and a custom domain, so without a
 * canonical search engines see three copies. Preference: verified custom
 * domain, then the platform subdomain, else null (leave the canonical unset
 * rather than point it at the wrong host, e.g. in local development).
 */
export function canonicalOrigin(
  business: Pick<WidgetBusiness, "customDomain" | "subdomain">,
  slug: string
): string | null {
  if (business.customDomain) return `https://${business.customDomain.toLowerCase()}`;
  if (ROOT_DOMAIN) return `https://${(business.subdomain || slug).toLowerCase()}.${ROOT_DOMAIN}`;
  return null;
}
