"use client";

import { useTranslations } from "next-intl";

/**
 * A backend outage is NOT "business not found". Show a retryable error so a
 * temporary API problem is not presented (or cached) as a missing site.
 */
export default function TenantError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("Site");
  return (
    <div
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <p className="text-lg font-semibold text-[#0e1624]">{t("errorTitle")}</p>
      <p className="max-w-sm text-sm text-[#5f6664]">{t("errorBody")}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-[#08162e] px-6 py-3 text-sm font-semibold text-white"
      >
        {t("retry")}
      </button>
    </div>
  );
}
