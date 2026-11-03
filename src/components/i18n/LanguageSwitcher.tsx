"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { setLocale } from "@/i18n/setLocale";
import { locales, type AppLocale } from "@/i18n/locales";

const LABELS: Record<AppLocale, string> = { en: "EN", nl: "NL" };

/**
 * Two-way toggle rather than a dropdown — there are only two locales today,
 * and a toggle makes both options visible at a glance instead of hiding the
 * current one behind a click. Add a <select> instead if a third locale
 * shows up later.
 */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const current = useLocale() as AppLocale;
  const t = useTranslations("Dashboard.common");
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<AppLocale | null>(null);

  const active = optimistic ?? current;

  function choose(locale: AppLocale) {
    if (locale === active) return;
    setOptimistic(locale);
    startTransition(async () => {
      await setLocale(locale);
      // Full reload rather than router.refresh(): this app has no client
      // router instance threaded down to every widget entry point (the
      // embeddable modal, the standalone /book-now page), and a reload is
      // the one approach that works identically from all of them.
      window.location.reload();
    });
  }

  return (
    <div
      className={`inline-flex items-center rounded-full border border-gray-200 bg-white p-0.5 text-xs font-medium dark:border-gray-700 dark:bg-gray-900 ${className}`}
      role="group"
      aria-label={t("language")}
    >
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          disabled={pending}
          onClick={() => choose(locale)}
          aria-pressed={active === locale}
          className={`rounded-full px-2.5 py-1 transition ${
            active === locale
              ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          {LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
