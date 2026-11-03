"use client";

import { useTranslations, useLocale } from "next-intl";
import { ProgressBar } from "./ProgressBar";
import { StickySummary } from "./StickySummary";
import { StepService } from "./StepService";
import { StepAddress } from "./StepAddress";
import { StepSchedule } from "./StepSchedule";
import { StepDetails } from "./StepDetails";
import { StepReview } from "./StepReview";
import { useBookingState } from "./useBookingState";
import type { BookingWizardProps } from "./types";
import { formatMoney } from "./types";
import { setActiveCurrency } from "@/app/services/currency";
import OfflinePaymentPanel from "@/components/payment/OfflinePaymentPanel";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

export function BookingWizard(props: BookingWizardProps) {
  // Show prices in this business's currency (idempotent, so safe during render).
  setActiveCurrency(props.business.currency);
  const t = useTranslations("Booking.wizard");
  const locale = useLocale();
  const {
    state,
    update,
    step,
    selectedService,
    slots,
    slotsLoading,
    slotsError,
    canGoNext,
    goNext,
    goBack,
    refreshQuote,
    submitting,
    submitError,
    confirmBooking,
    captchaToken,
    setCaptchaToken,
    captchaNonce,
    bookingResult,
    activeQuestions,
    setAnswer,
  } = useBookingState(props);

  const compact = props.compact ?? false;

  const primary =
    props.business.branding?.primaryColor ||
    props.business.branding?.accentColor ||
    "#3F6B52";

  // ─── Success screen ───────────────────────────────────────────
  if (bookingResult) {
      const payment = props.payment;
      const showOffline =
          payment && !payment.onlineCardReady && payment.offlineAccepted !== false;
    return (
      <div className={compact ? "mx-auto max-w-lg text-center py-2" : "mx-auto max-w-lg text-center py-12 px-4"}>
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: primary }}
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">{t("bookedHeading")}</h1>
        <p className="mt-2 text-gray-600">
          {state.email
            ? t("confirmationSentPhoneAndEmail", { phone: state.phone, email: state.email })
            : t("confirmationSentPhone", { phone: state.phone })}
        </p>
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 text-left text-sm space-y-2">
          <p>
            <span className="text-gray-500">{t("when")} </span>
            <strong>
              {new Date(bookingResult.scheduledStart).toLocaleString(locale, {
                weekday: "long",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </strong>
          </p>
          <p>
            <span className="text-gray-500">{t("total")} </span>
            <strong style={{ color: primary }}>
              {formatMoney(bookingResult.quotedPriceCents)}
            </strong>
          </p>
        {showOffline && (
            <div className="mt-6 text-left">
                <OfflinePaymentPanel
                    instructions={payment?.offlinePaymentInstructions}
                />
            </div>
        )}
          <p className="text-xs text-gray-400">{t("ref", { id: bookingResult.id.slice(0, 8).toUpperCase() })}</p>
        </div>
        <p className="mt-6 text-sm text-gray-500">
          {t("manageFromPortal")}
        </p>
      </div>
    );
  }

  return (
    <div className={compact ? "mx-auto w-full" : "mx-auto max-w-5xl px-4 py-8 sm:py-10"}>
      {/* Header — skipped in compact mode; the modal chrome already shows
          the business name, and duplicating it wastes vertical space in a
          panel that's already height-constrained. */}
      {!compact && (
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {props.business.branding?.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={props.business.branding.logoUrl}
                alt=""
                className="h-10 w-10 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{props.business.name}</h1>
              <p className="text-sm text-gray-500">{t("bookACleaning")}</p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>
      )}
      {compact && (
        <div className="mb-3 flex justify-end">
          <LanguageSwitcher />
        </div>
      )}

      <ProgressBar current={step} primaryColor={primary} />

      <div className={compact ? "" : "grid gap-8 lg:grid-cols-[1fr_320px]"}>
        {/* Steps */}
        <div className="min-w-0">
          {/* Card framing dropped in compact mode — the modal panel already
              provides the border/shadow/padding, so a nested card here would
              just double it up. */}
          <div className={compact ? "py-1" : "rounded-2xl border border-gray-200 bg-white p-5 sm:p-7 shadow-sm"}>
            {step === 1 && (
              <StepService
                state={state}
                services={props.services}
                selectedService={selectedService}
                update={update}
                primaryColor={primary}
              />
            )}
            {step === 2 && (
              <StepAddress
                state={state}
                update={update}
                primaryColor={primary}
                onValidateArea={refreshQuote}
                slug={props.slug}
              />
            )}
            {step === 3 && (
              <StepSchedule
                state={state}
                update={update}
                slots={slots}
                slotsLoading={slotsLoading}
                slotsError={slotsError}
                primaryColor={primary}
                slug={props.slug}
                timezone={props.business.timezone}
              />
            )}
            {step === 4 && (
              <StepDetails
                state={state}
                update={update}
                primaryColor={primary}
                onApplyCoupon={refreshQuote}
                onApplyGiftCard={refreshQuote}
                questions={activeQuestions}
                onAnswer={setAnswer}
              />
            )}
            {step === 5 && (
              <StepReview
                state={state}
                service={selectedService}
                primaryColor={primary}
                submitting={submitting}
                submitError={submitError}
                captchaToken={captchaToken}
                captchaNonce={captchaNonce}
                cancellationPolicy={props.cancellationPolicy}
                onCaptchaToken={setCaptchaToken}
                onConfirm={confirmBooking}
              />
            )}

            {/* Nav buttons (hidden on final step — confirm lives inside StepReview) */}
            {step < 5 && (
              <div className="mt-8 flex items-center justify-between gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={step === 1}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  {t("back")}
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canGoNext}
                  className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition"
                  style={{ backgroundColor: primary }}
                >
                  {t("continue")}
                </button>
              </div>
            )}
            {step === 5 && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={goBack}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  {t("editDetails")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sticky summary — desktop only, and only in the full-page layout.
            In compact mode the modal panel never reaches the lg breakpoint
            (max-w-lg), so this would never show anyway; skip rendering it. */}
        {!compact && (
          <div className="hidden lg:block">
            <StickySummary
              state={state}
              service={selectedService}
              primaryColor={primary}
              cancellationPolicy={props.cancellationPolicy}
            />
          </div>
        )}
      </div>

      {/* Price + continue bar. Full-page mode pins this to the viewport
          bottom on mobile (lg:hidden fixed …). That positioning breaks
          inside the modal — the modal panel floats mid-screen, so a
          viewport-fixed bar would render outside it — so compact mode uses
          a normal in-flow bar instead, shown at every width since the
          modal never reaches the desktop two-column layout above.
          Hidden on step 5 either way: StepReview has its own full-width
          "Confirm booking · $price" button, so a second Confirm button
          down here would just duplicate it. */}
      {step < 5 && (
        <div
          className={
            compact
              ? "mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
              : "lg:hidden fixed bottom-0 inset-x-0 border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-3 safe-area-pb"
          }
        >
          <div className={compact ? "flex items-center justify-between gap-3" : "flex items-center justify-between gap-3 max-w-5xl mx-auto"}>
            <div>
              <p className="text-xs text-gray-500">{t("total")}</p>
              <p className="text-lg font-bold" style={{ color: primary }}>
                {state.quoteLoading
                  ? "…"
                  : state.quote
                    ? formatMoney(state.quote.priceCents)
                    : "—"}
              </p>
            </div>
            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: primary }}
            >
              {t("continue")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
