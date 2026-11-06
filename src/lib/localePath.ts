import { locales, type AppLocale } from "../i18n/locales.ts";

/** Public pages that exist in every language under /en and /nl. "/" is the home page. */
export const LOCALIZED_PATHS = ["/", "/business", "/terms", "/privacy", "/cookies"] as const;

const norm = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p) || "/";

/**
 * "/nl/terms" -> { locale: "nl", path: "/terms" }. Anything that is not a
 * localised public page (including "/nl/dashboard") is returned untouched with
 * locale null, so staff and portal URLs never gain a language prefix.
 */
export function splitLocalePrefix(pathname: string): { locale: AppLocale | null; path: string } {
  const m = /^\/([a-z]{2})(\/.*)?$/.exec(pathname);
  if (m && (locales as readonly string[]).includes(m[1])) {
    const rest = norm(m[2] || "/");
    if ((LOCALIZED_PATHS as readonly string[]).includes(rest)) return { locale: m[1] as AppLocale, path: rest };
  }
  return { locale: null, path: pathname };
}

/** "/terms" in Dutch is "/nl/terms"; the home page is "/nl". */
export function localizedPath(locale: AppLocale, path: string): string {
  const p = norm(path);
  return p === "/" ? `/${locale}` : `/${locale}${p}`;
}

/**
 * hreflang map for a public page, relative so metadataBase resolves it.
 * Only the home page has an unprefixed twin that can serve as x-default.
 */
export function languageAlternates(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of locales) out[l] = localizedPath(l, path);
  if (norm(path) === "/") out["x-default"] = "/";
  return out;
}

const OG_LOCALE: Record<AppLocale, string> = { en: "en_GB", nl: "nl_NL" };
export const ogLocale = (l: AppLocale) => OG_LOCALE[l];
export const ogAlternateLocales = (l: AppLocale) => locales.filter((x) => x !== l).map(ogLocale);
