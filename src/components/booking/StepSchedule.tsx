"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Slot } from "@/app/api/widget.api";
import { joinWaitlist } from "@/app/api/widget.api";
import { Turnstile, TURNSTILE_SITE_KEY } from "./Turnstile";
import type { BookingFormState } from "./types";
import { isoDateInTimeZone } from "@/app/services/currency";

type Props = {
  state: BookingFormState;
  update: (patch: Partial<BookingFormState>) => void;
  slots: Slot[];
  slotsLoading: boolean;
  slotsError: string | null;
  primaryColor?: string;
  slug: string;
  /** Business timezone (IANA). Days and times are shown in it, not the visitor's. */
  timezone?: string;
};

export function StepSchedule({
  state,
  update,
  slots,
  slotsLoading,
  slotsError,
  primaryColor = "#3F6B52",
  slug,
  timezone,
}: Props) {
  const t = useTranslations("Booking.schedule");
  // Locale for date/time formatting — explicit rather than the browser's own
  // (the `undefined` locale argument default), so a customer who switches
  // the widget to NL sees "wo" (woensdag) and "14:00" consistently, not a
  // mix of translated UI text next to English weekday abbreviations from
  // whatever their OS happens to be set to.
  const locale = useLocale();
  // Build next 14 days for the date picker
  // Calendar days start from "today" in the BUSINESS's timezone and are kept as
  // noon-UTC anchors, so adding days cannot slip over a DST change and the
  // YYYY-MM-DD sent to the API is the day that is displayed.
  const todayIso = isoDateInTimeZone(new Date(), timezone);
  const [ty, tm, td] = todayIso.split("-").map(Number);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.UTC(ty, tm - 1, td + i, 12));
    return { date: d, iso: d.toISOString().slice(0, 10) };
  });

  const selectDate = (iso: string) => {
    update({ selectedDate: iso, scheduledStart: null });
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-gray-900">{t("heading")}</h2>
        <p className="mt-1 text-sm text-gray-500">{t("subheading")}</p>
      </header>

      {/* Date strip */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {days.map(({ date: d, iso }) => {
          const active = state.selectedDate === iso;
          const isToday = iso === todayIso;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => selectDate(iso)}
              className={`
                flex flex-col items-center min-w-[64px] rounded-xl border px-3 py-2.5 transition
                ${active ? "text-white border-transparent shadow-sm" : "border-gray-200 text-gray-700 hover:border-gray-300"}
              `}
              style={{ backgroundColor: active ? primaryColor : undefined }}
            >
              <span className="text-[10px] uppercase font-medium opacity-80">
                {d.toLocaleDateString(locale, { weekday: "short", timeZone: "UTC" })}
              </span>
              <span className="text-lg font-semibold leading-tight">
                {d.getUTCDate()}
              </span>
              <span className="text-[10px] opacity-80">
                {isToday
                  ? t("today")
                  : d.toLocaleDateString(locale, { month: "short", timeZone: "UTC" })}
              </span>
            </button>
          );
        })}
      </div>

      {/* Time slots */}
      {!state.selectedDate && (
        <p className="text-sm text-gray-500">{t("selectDatePrompt")}</p>
      )}

      {state.selectedDate && slotsLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-8 justify-center">
          <Spinner /> {t("loadingTimes")}
        </div>
      )}

      {state.selectedDate && !slotsLoading && slotsError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{slotsError}</p>
      )}

      {state.selectedDate && !slotsLoading && !slotsError && slots.length === 0 && (
        <div className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-6 text-center space-y-3">
          <p>{t("noTimesAvailable")}</p>
          <WaitlistJoin
            slug={slug}
            serviceId={state.serviceId}
            selectedDate={state.selectedDate}
            primaryColor={primaryColor}
          />
        </div>
      )}

      {state.selectedDate && !slotsLoading && slots.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map((slot) => {
            const active = state.scheduledStart === slot.start;
            const label = new Date(slot.start).toLocaleTimeString(locale, {
              hour: "numeric",
              minute: "2-digit",
              timeZone: timezone,
            });
            return (
              <button
                key={slot.start}
                type="button"
                onClick={() => update({ scheduledStart: slot.start })}
                className={`
                  rounded-lg border px-2 py-2.5 text-sm font-medium transition
                  ${active ? "text-white border-transparent" : "border-gray-200 text-gray-800 hover:border-gray-300"}
                `}
                style={{ backgroundColor: active ? primaryColor : undefined }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/**
 * Inline "notify me" form for a day with no open slots. Kept self-contained
 * (its own email/phone fields) rather than waiting for the wizard's later
 * contact-details step, since a customer who hits a dead end here shouldn't
 * have to fill out the whole rest of the form just to ask to be notified.
 */
function WaitlistJoin({
  slug,
  serviceId,
  selectedDate,
  primaryColor,
}: {
  slug: string;
  serviceId: string | null;
  selectedDate: string;
  primaryColor: string;
}) {
  const t = useTranslations("Booking.schedule.waitlist");
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaNonce, setCaptchaNonce] = useState(0);

  if (done) {
    return <p className="text-sm font-medium text-green-700">{t("joined")}</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium underline"
        style={{ color: primaryColor }}
      >
        {t("notifyMe")}
      </button>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const isEmail = contact.includes("@");
      const dayStart = new Date(`${selectedDate}T00:00:00`);
      const dayEnd = new Date(`${selectedDate}T23:59:59`);
      await joinWaitlist(slug, {
        serviceId: serviceId || undefined,
        desiredStart: dayStart.toISOString(),
        desiredEnd: dayEnd.toISOString(),
        contactEmail: isEmail ? contact : undefined,
        contactPhone: isEmail ? undefined : contact,
        captchaToken: captchaToken || undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("joinError"));
    } finally {
      setSubmitting(false);
      setCaptchaToken(null);
      setCaptchaNonce((n) => n + 1);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 justify-center items-center">
      <input
        required
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder={t("contactPlaceholder")}
        className="h-10 rounded-lg border border-gray-300 px-3 text-sm w-full sm:w-56"
      />
      <Turnstile onToken={setCaptchaToken} resetKey={captchaNonce} />
      <button
        type="submit"
        disabled={submitting || (Boolean(TURNSTILE_SITE_KEY) && !captchaToken)}
        className="h-10 rounded-lg px-4 text-sm font-medium text-white disabled:opacity-60"
        style={{ backgroundColor: primaryColor }}
      >
        {submitting ? t("joining") : t("joinWaitlist")}
      </button>
      {error && <p className="text-xs text-red-600 basis-full">{error}</p>}
    </form>
  );
}
