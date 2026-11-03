import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

/**
 * On-demand cache invalidation for tenant storefronts.
 *
 * getStorefrontServer() caches each storefront for 5 minutes under the tag
 * `storefront:{slug}`. Without this endpoint a business that edits its
 * branding, services or prices in the dashboard waits up to 5 minutes to see
 * the public site change (and the booking modal, which fetches fresh data, can
 * disagree with the page meanwhile).
 *
 * The API calls this after saving anything the storefront shows:
 *
 *   POST /api/revalidate
 *   x-revalidate-secret: <REVALIDATE_SECRET>
 *   { "slug": "acme" }          or          { "slugs": ["acme", "acme-old"] }
 *
 * Send the OLD slug as well when a business renames its subdomain.
 */
export const runtime = "nodejs";

const SLUG_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const MAX_SLUGS = 20;

function sha256(value: string) {
  return createHash("sha256").update(value).digest();
}

export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    // Fail closed: an unset secret must never mean "no auth".
    return NextResponse.json({ error: "Revalidation is not configured" }, { status: 503 });
  }

  // Hash first so timingSafeEqual always compares equal-length buffers.
  const given = req.headers.get("x-revalidate-secret") ?? "";
  if (!timingSafeEqual(sha256(given), sha256(secret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { slug?: unknown; slugs?: unknown } | null;
  const raw = Array.isArray(body?.slugs) ? body.slugs : body?.slug ? [body.slug] : [];
  const slugs = [...new Set(raw.map((s) => String(s).trim().toLowerCase()))];

  if (slugs.length === 0 || slugs.length > MAX_SLUGS || !slugs.every((s) => SLUG_RE.test(s))) {
    return NextResponse.json({ error: "Provide 1-20 valid slugs" }, { status: 400 });
  }

  // expire: 0 = drop the cached entry now, so the next request refetches
  // instead of serving stale content while it revalidates in the background.
  for (const slug of slugs) revalidateTag(`storefront:${slug}`, { expire: 0 });

  return NextResponse.json({ revalidated: slugs });
}
