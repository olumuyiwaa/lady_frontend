"use client";

import { useLocale, useTranslations } from "next-intl";
import type { WidgetService, StorefrontCancellationPolicy } from "@/app/api/widget.api";
import type { BookingFormState } from "./types";
import { formatMoney, frequencyLabel, cancellationBadgeLabel } from "./types";

type Props = {
  state: BookingFormState;
  service: WidgetService | null;
  primaryColor?: string;
  cancellationPolicy?: StorefrontCancellationPolicy | null;
};

export function StickySummary({ state, service, primaryColor = "#3F6B52", cancellationPolicy = null }: Props) {
  const t = useTranslations("Booking.summary");
  const tFreq = useTranslations("Booking.frequency");
  const tPolicy = useTranslations("Booking.cancellationPolicy");
  const locale = useLocale();
  const price = state.quote?.priceCents;
  const minutes = state.quote?.estimatedMinutes ?? service?.estimatedMinutes;

  return (
    <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        {t("heading")}
      </h3>

      <div className="mt-4 space-y-3 text-sm">
        <Row label={t("service")} value={service?.name ?? "—"} />
        <Row label={t("frequency")} value={frequencyLabel(state.frequency, tFreq)} />
        {(state.rooms > 0 || state.bathrooms > 0) && (
          <Row
            label={t("homeSize")}
            value={t("homeSizeSummary", { beds: state.rooms, baths: state.bathrooms, sqft: state.sqft || 0 })}
          />
        )}
        {state.addOnIds.length > 0 && service && (
          <Row
            label={t("addOns")}
            value={service.addOns
              .filter((a) => state.addOnIds.includes(a.id))
              .map((a) => a.name)
              .join(", ")}
          />
        )}
        {state.addressLine1 && (
          <Row
            label={t("address")}
            value={[state.addressLine1, state.city, state.state]
              .filter(Boolean)
              .join(", ")}
          />
        )}
        {state.scheduledStart && (
          <Row
            label={t("when")}
            value={new Date(state.scheduledStart).toLocaleString(locale, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          />
        )}
        {minutes != null && <Row label={t("estDuration")} value={t("estMinutes", { count: minutes })} />}
      </div>

      <div className="mt-5 border-t border-gray-100 pt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-gray-600">{t("total")}</span>
          <div className="text-right">
            {state.quoteLoading ? (
              <span className="text-lg font-semibold text-gray-400">…</span>
            ) : price != null ? (
              <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                {formatMoney(price)}
              </span>
            ) : (
              <span className="text-lg font-semibold text-gray-400">—</span>
            )}
            {state.frequency !== "ONE_TIME" && price != null && (
              <p className="text-xs text-emerald-600 mt-0.5">
                {t("recurringDiscountApplied")}
              </p>
            )}
          </div>
        </div>
        {state.quoteError && (
          <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1.5">
            {state.quoteError}
          </p>
        )}
      </div>

      <ul className="mt-5 space-y-2 text-xs text-gray-500">
        <li className="flex items-start gap-2">
          <CheckIcon /> {t("trustBackgroundChecked")}
        </li>
        <li className="flex items-start gap-2">
          <CheckIcon /> {cancellationBadgeLabel(cancellationPolicy, tPolicy)}
        </li>
        <li className="flex items-start gap-2">
          <CheckIcon /> {t("trustInstantConfirmation")}
        </li>
      </ul>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 font-medium text-right">{value}</span>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5 mt-0.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
