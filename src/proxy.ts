import { NextRequest, NextResponse } from "next/server";
import { resolveHostRoute } from "@/lib/hostRouting";
import { splitLocalePrefix } from "@/lib/localePath";

/**
 * Tod Cleaning Services is one business, so there is no host or subdomain lookup.
 *
 * The storefront and customer portal still live under src/app/[subdomain]
 * (they were built for many businesses). This proxy makes them answer at the
 * site root instead:
 *
 *   /          -> /{slug}
 *   /portal/*  -> /{slug}/portal/*
 *   /en, /nl (+ /terms etc.) -> the same page in that language (x-locale header)
 *   /{slug}/*  -> redirected to the clean URL without the slug
 *
 * When NEXT_PUBLIC_ADMIN_URL is set (admin.todcleaning.nl), staff pages live on
 * that host and the public host redirects them there (see lib/hostRouting.ts).
 *
 * Everything else (dashboard, sign-in, API routes, static files) is
 * served as-is. Server components read the business slug from x-tenant-slug.
 */
const SLUG = (process.env.NEXT_PUBLIC_BUSINESS_SLUG || "todcleaning").toLowerCase();
const TENANT_HEADER = "x-tenant-slug";

const BYPASS_PREFIXES = ["/_next", "/favicon.ico", "/api/", "/images/", "/lottie/", "/embed.js"];
const META_FILES = new Set(["/robots.txt", "/sitemap.xml", "/llms.txt"]);

const LOCALE_HEADER = "x-locale";

function withTenant(req: NextRequest, url?: URL, locale?: string) {
  const headers = new Headers(req.headers);
  headers.set(TENANT_HEADER, SLUG); // never trust a client-supplied value
  headers.delete(LOCALE_HEADER);
  if (locale) headers.set(LOCALE_HEADER, locale); // only ever set here, from the URL prefix
  return url ? NextResponse.rewrite(url, { request: { headers } }) : NextResponse.next({ request: { headers } });
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (BYPASS_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (META_FILES.has(pathname)) return withTenant(req);

  const hostRoute = resolveHostRoute({
    host: req.headers.get("x-forwarded-host") || req.headers.get("host") || "",
    pathname,
    search: req.nextUrl.search,
    adminUrl: process.env.NEXT_PUBLIC_ADMIN_URL,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  });
  if (hostRoute.redirectTo) return NextResponse.redirect(hostRoute.redirectTo, 307);
  if (hostRoute.isAdminHost) {
    // Staff area: keep it out of search results.
    const res = withTenant(req);
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  const prefix = `/${SLUG}`;
  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
    const clean = req.nextUrl.clone();
    clean.pathname = pathname.slice(prefix.length) || "/";
    return NextResponse.redirect(clean, 307);
  }

  // /en and /nl (and /nl/terms ...): a crawlable URL per language. The page is
  // the same one served at the unprefixed path, rendered in that language.
  const split = splitLocalePrefix(pathname);
  if (split.locale) {
    const url = req.nextUrl.clone();
    url.pathname = `${prefix}${split.path === "/" ? "" : split.path}`;
    return withTenant(req, url, split.locale);
  }

  // Paths that belong to the storefront and need rewriting to /{slug}/...
  const STOREFRONT_PATHS = ["/portal", "/business", "/terms", "/privacy", "/cookies"];
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
