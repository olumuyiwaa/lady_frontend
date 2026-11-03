"use client";

import { useTranslations } from "next-intl";
import { STEPS } from "./types";

type Props = {
  current: number;
  primaryColor?: string;
};

export function ProgressBar({ current, primaryColor = "#3F6B52" }: Props) {
  const t = useTranslations("Booking.steps");
  return (
    <nav aria-label={t("navAriaLabel")} className="mb-8">
      <ol className="flex items-center gap-1 sm:gap-2">
        {STEPS.map((s, idx) => {
          const done = s.id < current;
          const active = s.id === current;
          return (
            <li key={s.id} className="flex flex-1 items-center gap-1 sm:gap-2">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`
                    flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-sm font-semibold
                    transition-colors
                    ${done ? "text-white" : ""}
                    ${active ? "text-white ring-2 ring-offset-2" : ""}
                    ${!done && !active ? "bg-gray-100 text-gray-500" : ""}
                  `}
                  style={{
                    backgroundColor: done || active ? primaryColor : undefined,
                    // @ts-expect-error CSS custom property
                    "--tw-ring-color": active ? primaryColor : undefined,
                  }}
                >
                  {done ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s.id
                  )}
                </div>
                <span
                  className={`hidden sm:block text-xs font-medium ${
                    active ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {t(s.key)}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className="h-0.5 flex-1 max-w-[40px] sm:max-w-none rounded"
                  style={{
                    backgroundColor: done ? primaryColor : "#E5E7EB",
                  }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
