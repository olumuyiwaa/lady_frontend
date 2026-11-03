"use server";

import { cookies } from "next/headers";
import { locales, defaultLocale, LOCALE_COOKIE, type AppLocale } from "./locales";

/**
 * Sets the locale cookie for one year. Called from LanguageSwitcher; the
 * caller is responsible for refreshing the page afterward (router.refresh())
 * so the new Server Component render picks it up — this action only ever
 * changes the cookie, never redirects, since there's no locale segment in
 * the URL to redirect to or from.
 */
export async function setLocale(locale: string) {
  const safe: AppLocale = (locales as readonly string[]).includes(locale)
    ? (locale as AppLocale)
    : defaultLocale;
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, safe, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
}
