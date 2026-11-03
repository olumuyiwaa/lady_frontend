import { NextRequest, NextResponse } from "next/server";

/**
 * Lady Greener is one business, so there is no host or subdomain lookup.
 *
 * The storefront and customer portal still live under src/app/[subdomain]
 * (they were built for many businesses). This proxy makes them answer at the
 * site root instead:
 *
 *   /          -> /{slug}
 *   /portal/*  -> /{slug}/portal/*
 *   /{slug}/*  -> redirected to the clean URL without the slug
 *
 * Everything else (dashboard, sign-in, /book-now, API routes, static files) is
 * served as-is. Server components read the business slug from x-tenant-slug.
 */
const SLUG = (process.env.NEXT_PUBLIC_BUSINESS_SLUG || "ladygreener").toLowerCase();
const TENANT_HEADER = "x-tenant-slug";

const BYPASS_PREFIXES = ["/_next", "/favicon.ico", "/api/", "/images/", "/lottie/", "/embed.js"];
const META_FILES = new Set(["/robots.txt", "/sitemap.xml"]);

function withTenant(req: NextRequest, url?: URL) {
  const headers = new Headers(req.headers);
  headers.set(TENANT_HEADER, SLUG); // never trust a client-supplied value
  return url ? NextResponse.rewrite(url, { request: { headers } }) : NextResponse.next({ request: { headers } });
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (BYPASS_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (META_FILES.has(pathname)) return withTenant(req);

  // /book-now/{anything} is the embeddable widget page; the slug in the path is ignored by the API.
  if (pathname.startsWith("/book-now/")) return withTenant(req);

  const prefix = `/${SLUG}`;
  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
    const clean = req.nextUrl.clone();
    clean.pathname = pathname.slice(prefix.length) || "/";
    return NextResponse.redirect(clean, 307);
  }

  // Paths that belong to the storefront and need rewriting to /{slug}/...
  const STOREFRONT_PATHS = ["/portal", "/terms", "/privacy", "/cookies"];
  const isStorefrontPath =
    pathname === "/" ||
    STOREFRONT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isStorefrontPath) {
    const url = req.nextUrl.clone();
    url.pathname = `${prefix}${pathname === "/" ? "" : pathname}`;
    return withTenant(req, url);
  }

  return withTenant(req);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
