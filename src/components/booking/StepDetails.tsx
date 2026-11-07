"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { AnswerValue, BookingQuestion } from "@/lib/bookingQuestions";
import { readReferralCode } from "@/lib/referral";
import { CustomQuestions } from "./CustomQuestions";
import { formatMoney, type BookingFormState } from "./types";

type Props = {
  state: BookingFormState;
  update: (patch: Partial<BookingFormState>) => void;
  primaryColor?: string;
  onApplyCoupon?: () => void;
  onApplyGiftCard?: () => void;
  /** The business's own questions that apply to the chosen service. */
  questions?: BookingQuestion[];
  onAnswer?: (questionId: string, value: AnswerValue | undefined) => void;
};

export function StepDetails({
  state,
  update,
  primaryColor = "#3F6B52",
  onApplyCoupon,
  onApplyGiftCard,
  questions = [],
  onAnswer,
}: Props) {
  const t = useTranslations("Booking.details");
  // Present when the visitor arrived through a friend's ?ref= link.
  const [referral] = useState(() => readReferralCode());
  return (
    <div className="space-y-6">
      {referral && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
          {t("referralNote")}
        </p>
      )}

      <header>
        <h2 className="text-xl font-semibold text-gray-900">{t("heading")}</h2>
        <p className="mt-1 text-sm text-gray-500">{t("subheading")}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label={t("firstName")}
          required
          value={state.firstName}
          onChange={(v) => update({ firstName: v })}
          primaryColor={primaryColor}
          autoComplete="given-name"
        />
        <Field
          label={t("lastName")}
          required
          value={state.lastName}
          onChange={(v) => update({ lastName: v })}
          primaryColor={primaryColor}
          autoComplete="family-name"
        />
      </div>

      <Field
        label={t("phone")}
        required
        type="tel"
        value={state.phone}
        onChange={(v) => update({ phone: v })}
        primaryColor={primaryColor}
        autoComplete="tel"
        placeholder={t("phonePlaceholder")}
      />

      <label className="flex items-start gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={state.whatsappOptIn}
          onChange={(e) => update({ whatsappOptIn: e.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-gray-300"
        />
        <span>{t("whatsappOptIn")}</span>
      </label>

      <Field
        label={t("email")}
        type="email"
        value={state.email}
        onChange={(v) => update({ email: v })}
        primaryColor={primaryColor}
        autoComplete="email"
        placeholder={t("emailPlaceholder")}
      />

      {onAnswer && (
        <CustomQuestions
          questions={questions}
          answers={state.answers}
          onChange={onAnswer}
          primaryColor={primaryColor}
        />
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("specialInstructions")}
        </label>
        <textarea
          rows={3}
          value={state.notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder={t("specialInstructionsPlaceholder")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none"
          style={{ ["--tw-ring-color" as string]: primaryColor }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("couponCode")}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={state.couponCode}
            onChange={(e) => update({ couponCode: e.target.value.toUpperCase() })}
            placeholder={t("couponCodePlaceholder")}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-0"
            style={{ ["--tw-ring-color" as string]: primaryColor }}
          />
          <button
            type="button"
            onClick={onApplyCoupon}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {t("apply")}
          </button>
        </div>
        {state.quote?.coupon && (
          <p
            className={`mt-1.5 text-xs ${
              state.quote.coupon.valid ? "text-emerald-600" : "text-amber-700"
            }`}
          >
            {state.quote.coupon.valid
              ? t("couponApplied")
              : t("couponInvalid", { reason: state.quote.coupon.reason || t("invalidReasonFallback") })}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("giftCardCode")}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={state.giftCardCode}
            onChange={(e) => update({ giftCardCode: e.target.value.toUpperCase() })}
            placeholder={t("giftCardCodePlaceholder")}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-0"
            style={{ ["--tw-ring-color" as string]: primaryColor }}
          />
          <button
            type="button"
            onClick={onApplyGiftCard}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {t("apply")}
          </button>
        </div>
        {state.quote?.giftCard && (
          <p
            className={`mt-1.5 text-xs ${
              state.quote.giftCard.valid ? "text-emerald-600" : "text-amber-700"
            }`}
          >
            {state.quote.giftCard.valid
              ? t("giftCardApplied", {
                  applied:
                    state.quote.giftCard.appliedCents != null
                      ? t("giftCardOff", { amount: formatMoney(state.quote.giftCard.appliedCents) })
                      : "",
                  balance: formatMoney(state.quote.giftCard.balanceCents ?? 0),
                })
              : t("giftCardInvalid", { reason: state.quote.giftCard.reason || t("invalidReasonFallback") })}
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  primaryColor,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  primaryColor: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
        style={{ ["--tw-ring-color" as string]: primaryColor }}
      />
    </div>
  );
}
