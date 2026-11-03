/**
 * Locale constants with zero server-only dependencies (no next/headers),
 * so client components can import them directly. request.ts (which does
 * import next/headers, for reading the locale cookie server-side) imports
 * these from here rather than the other way around — a client component
 * importing anything from request.ts pulls next/headers into the client
 * bundle, which Next.js rejects at build time.
 */

export const locales = ["en", "nl"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "en";
export const LOCALE_COOKIE = "cleansera_locale";

export function isSupportedLocale(value: string | undefined | null): value is AppLocale {
  return !!value && (locales as readonly string[]).includes(value);
}
