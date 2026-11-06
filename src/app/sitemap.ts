import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { locales } from "@/i18n/locales";
import { LOCALIZED_PATHS, languageAlternates, localizedPath } from "@/lib/localePath";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  const proto =
    h.get("x-forwarded-proto")?.split(",")[0].trim() || (/^(localhost|127\.)/.test(host) ? "http" : "https");
  const origin = `${proto}://${host}`;

  const entries: MetadataRoute.Sitemap = [];
  for (const path of LOCALIZED_PATHS) {
    const home = path === "/";
    const languages = Object.fromEntries(
      Object.entries(languageAlternates(path)).map(([lang, p]) => [lang, `${origin}${p}`])
    );
    // The unprefixed home page is the x-default and is listed too.
    const urls = [...locales.map((l) => `${origin}${localizedPath(l, path)}`), ...(home ? [`${origin}/`] : [])];
    for (const url of urls) {
      entries.push({
        url,
        changeFrequency: home ? "weekly" : "yearly",
        priority: home ? 1 : 0.3,
        alternates: { languages },
      });
    }
  }
  return entries;
}
