import type { StorefrontResponse } from "@/app/api/widget.api";

/**
 * Server-side storefront fetch for the public tenant pages.
 *
 * Uses the server-only API_URL when set (internal network, no CORS), caches
 * for a few minutes so a busy storefront does not hit the API on every view,
 * and reports "no such business" as `null` so the page can answer with a real
 * 404 instead of a 200 "not found" screen. Any other failure THROWS, so a
 * backend outage renders the error boundary instead of being cached or
 * mistaken for a missing tenant.
 */
const API_BASE_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000/api/v1";

export const STOREFRONT_REVALIDATE_SECONDS = 300;

export async function getStorefrontServer(slug: string): Promise<StorefrontResponse | null> {
  const res = await fetch(
    `${API_BASE_URL}/widget-embed/${encodeURIComponent(slug)}/storefront`,
    {
      headers: { Accept: "application/json" },
      next: { revalidate: STOREFRONT_REVALIDATE_SECONDS, tags: [`storefront:${slug}`] },
    }
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Storefront request failed (${res.status})`);

  const body = await res.json().catch(() => null);
  if (!body || body.success === false || !body.data?.business) return null;
  return body.data as StorefrontResponse;
}
