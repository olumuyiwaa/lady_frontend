import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { getStorefrontServer } from "@/app/api/storefront.server";
import { defaultLocale, LOCALE_COOKIE, isSupportedLocale, type AppLocale } from "./locales";

/**
 * Locale is resolved WITHOUT next-intl's URL-based routing ([locale]
 * segment / localePrefix). proxy.ts already rewrites every tenant
 * request straight to /${subdomain}${pathname} based on the Host header —
 * there is no room in that scheme for a locale segment ahead of it without
 * restructuring the entire tenant-resolution scheme, and a business's own
 * custom domain (acme-cleaning.nl) has no natural place to carry a locale
 * prefix at all. So: locale lives in a cookie, set by the language
 * switcher (see LanguageSwitcher.tsx + setLocale.ts), falling back to the
 * browser's Accept-Language on a first visit with no cookie yet.
 *
 * locales/defaultLocale/LOCALE_COOKIE/isSupportedLocale live in ./locales
 * rather than here: this file imports next/headers (server-only), and a
 * client component importing anything from a file that does would pull
 * next/headers into the client bundle, which Next.js rejects at build
 * time. Every other consumer (LanguageSwitcher.tsx, setLocale.ts) imports
 * those constants from ./locales directly — nothing should import them
 * from this file.
 */

/** Picks the first supported locale from an Accept-Language header, e.g. "nl-NL,nl;q=0.9,en;q=0.8". */
function localeFromAcceptLanguage(header: string | null): AppLocale | null {
  if (!header) return null;
  const tags = header.split(",").map((part) => part.split(";")[0].trim().toLowerCase());
  for (const tag of tags) {
    const base = tag.split("-")[0];
    if (isSupportedLocale(base)) return base;
  }
  return null;
}

/**
 * The business's own default language, for visitors with no cookie. Without
 * this, a Dutch business was shown in English to any browser not sending
 * Accept-Language: Googlebot, link-preview fetchers and English-configured
 * phones alike. Reuses the storefront fetch (same cache tag), so it costs no
 * extra API call. Any failure falls through to the next rule.
 *
 * Businesses that predate the `defaultLocale` field fall back on their
 * timezone: a Europe/Amsterdam business is Dutch.
 */
async function localeFromTenant(slug: string | null): Promise<AppLocale | null> {
  if (!slug) return null;
  try {
    const data = await getStorefrontServer(slug);
    const business = data?.business;
    if (!business) return null;
    if (isSupportedLocale(business.defaultLocale)) return business.defaultLocale;
    if (business.timezone === "Europe/Amsterdam") return "nl";
  } catch {
    /* outage: use the browser's language instead */
  }
  return null;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;

  let locale: AppLocale;
  if (isSupportedLocale(cookieLocale)) {
    // 1. An explicit choice (language switcher) always wins.
    locale = cookieLocale;
  } else {
    const headerList = await headers();
    locale =
      // 2. The business's default language,
      (await localeFromTenant(headerList.get("x-tenant-slug"))) ??
      // 3. then the browser's,
      localeFromAcceptLanguage(headerList.get("accept-language")) ??
      // 4. then the platform default.
      defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
