import type { Metadata } from "next";
import type { AppLocale } from "@/i18n/locales";
import { languageAlternates, localizedPath, ogAlternateLocales, ogLocale } from "@/lib/localePath";

/**
 * Canonical + hreflang + og:locale for a public page. The canonical is the
 * language-prefixed URL of the language being rendered, and each language
 * points at its twin. Without a known origin (local development) nothing is
 * emitted rather than a wrong host.
 */
export function pageSeo(origin: string | null, path: string, locale: AppLocale): Pick<Metadata, "metadataBase" | "alternates"> & {
  openGraph: { url?: string; locale: string; alternateLocale: string[] };
} {
  const og = { locale: ogLocale(locale), alternateLocale: ogAlternateLocales(locale) };
  if (!origin) return { openGraph: og };
  return {
    metadataBase: new URL(origin),
    alternates: { canonical: localizedPath(locale, path), languages: languageAlternates(path) },
    openGraph: { ...og, url: `${origin}${localizedPath(locale, path)}` },
  };
}
