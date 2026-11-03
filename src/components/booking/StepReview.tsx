"use client";

import { useLocale, useTranslations } from "next-intl";
import type { WidgetService, StorefrontCancellationPolicy } from "@/app/api/widget.api";
import type { BookingFormState } from "./types";
import { formatMoney, frequencyLabel, cancellationPolicyLabel } from "./types";
import { Turnstile, TURNSTILE_SITE_KEY } from "./Turnstile";

type Props = {
  state: BookingFormState;
  service: WidgetService | null;
  primaryColor?: string;
  submitting: boolean;
  submitError: string | null;
  captchaToken?: string | null;
  captchaNonce?: number;
  cancellationPolicy?: StorefrontCancellationPolicy | null;
  onCaptchaToken?: (token: string | null) => void;
  onConfirm: () => void;
};

export function StepReview({
  state,
  service,
  primaryColor = "#3F6B52",
  submitting,
  submitError,
  captchaToken = null,
  captchaNonce = 0,
  cancellationPolicy = null,
  onCaptchaToken = () => {},
  onConfirm,
}: Props) {
  const t = useTranslations("Booking.review");
  const tFreq = useTranslations("Booking.frequency");
  const tPolicy = useTranslations("Booking.cancellationPolicy");
  const locale = useLocale();
  const price = state.quote?.priceCents;
  const tax = state.quote?.tax;
  const needsCaptcha = Boolean(TURNSTILE_SITE_KEY) && !captchaToken;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-gray-900">{t("heading")}</h2>
        <p className="mt-1 text-sm text-gray-500">{t("subheading")}</p>
      </header>

      <dl className="rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        <ReviewRow label={t("service")} value={service?.name ?? "—"} />
        <ReviewRow label={t("frequency")} value={frequencyLabel(state.frequency, tFreq)} />
        <ReviewRow
          label={t("home")}
          value={t("homeSummary", { beds: state.rooms, baths: state.bathrooms, sqft: state.sqft || 0 })}
        />
        {state.addOnIds.length > 0 && service && (
          <ReviewRow
            label={t("addOns")}
            value={service.addOns
              .filter((a) => state.addOnIds.includes(a.id))
              .map((a) => a.name)
              .join(", ")}
          />
        )}
        <ReviewRow
          label={t("address")}
          value={[state.addressLine1, state.addressLine2, state.city, state.state, state.postalCode]
            .filter(Boolean)
            .join(", ")}
        />
        <ReviewRow
          label={t("when")}
          value={
            state.scheduledStart
              ? new Date(state.scheduledStart).toLocaleString(locale, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "—"
          }
        />
        <ReviewRow
          label={t("contact")}
          value={`${state.firstName} ${state.lastName} · ${state.phone}${
            state.email ? ` · ${state.email}` : ""
          }`}
        />
        {state.notes && <ReviewRow label={t("notes")} value={state.notes} />}
        <div className="flex justify-between items-center px-4 py-4 bg-gray-50">
          <dt className="text-sm font-semibold text-gray-700">{t("total")}</dt>
          <dd className="text-xl font-bold" style={{ color: primaryColor }}>
            {price != null ? formatMoney(price) : "—"}
          </dd>
        </div>
        {tax && tax.pricesIncludeVat && (
          <div className="flex justify-between px-4 pb-3 bg-gray-50 text-xs text-gray-500">
            <span>
              {t("inclVat", {
                rate: new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(tax.vatRateBps / 100),
              })}
            </span>
            <span>{formatMoney(tax.vatCents)}</span>
          </div>
        )}
      </dl>

      <p className="text-xs text-gray-500 leading-relaxed">
        {t("agreeToTerms")} {cancellationPolicyLabel(cancellationPolicy, tPolicy)}
      </p>

      {submitError && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{submitError}</div>
      )}

      <Turnstile onToken={onCaptchaToken} resetKey={captchaNonce} />

      <button
        type="button"
        disabled={submitting || price == null || needsCaptcha}
        onClick={onConfirm}
        className="w-full rounded-xl py-3.5 text-base font-semibold text-white shadow-sm disabled:opacity-60 transition"
        style={{ backgroundColor: primaryColor }}
      >
        {submitting
          ? t("booking")
          : price != null
            ? t("confirmBookingWithPrice", { price: formatMoney(price) })
            : t("confirmBooking")}
      </button>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3">
      <dt className="text-sm text-gray-500 shrink-0">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 text-right">{value}</dd>
    </div>
  );
}
