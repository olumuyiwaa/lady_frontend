"use client";

import { useLocale, useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import type { Booking } from "@/app/api/app-types";
import { formatAnswer } from "@/lib/bookingQuestions";

type Props = { booking: Booking | null; onClose: () => void };

/**
 * Read-only view of everything the customer told us about a booking: contact
 * details, address, their notes, and answers to the business's own questions.
 * (The bookings list only shows summary columns.)
 */
export function BookingDetailsModal({ booking, onClose }: Props) {
  const t = useTranslations("Dashboard.bookings.details");
  const locale = useLocale();
  if (!booking) return null;

  const when = new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "short" }).format(new Date(booking.scheduledStart));
  const address = [booking.addressLine1, booking.addressLine2, [booking.postalCode, booking.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  const rows: Array<[string, string | null | undefined]> = [
    [t("customer"), booking.customer ? `${booking.customer.firstName} ${booking.customer.lastName}` : null],
    [t("phone"), booking.customer?.phone],
    [t("email"), booking.customer?.email],
    [t("service"), booking.service?.name],
    [t("when"), when],
    [t("address"), address],
  ];
  const notes: Array<[string, string | null | undefined]> = [
    [t("specialInstructions"), booking.specialInstructions],
    [t("parking"), booking.parkingInstructions],
    [t("pets"), booking.petNotes],
    [t("keyLocation"), booking.keyLocation],
    [t("accessCode"), booking.accessCode],
  ];
  const answers = booking.customAnswers ?? [];

  return (
    <Modal isOpen onClose={onClose} className="max-w-lg p-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{t("title")}</h2>
      <dl className="mt-4 space-y-2 text-sm">
        {rows.filter(([, v]) => v).map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
            <dd className="text-right text-gray-800 dark:text-white/90">{value}</dd>
          </div>
        ))}
      </dl>

      {answers.length > 0 && (
        <section className="mt-5">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">{t("answers")}</h3>
          <dl className="space-y-2 text-sm">
            {answers.map((a) => (
              <div key={a.questionId}>
                <dt className="text-gray-500 dark:text-gray-400">{a.label}</dt>
                <dd className="text-gray-800 dark:text-white/90">{formatAnswer(a.value, t("yes"), t("no"))}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {notes.some(([, v]) => v) && (
        <section className="mt-5">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">{t("notes")}</h3>
          <dl className="space-y-2 text-sm">
            {notes.filter(([, v]) => v).map(([label, value]) => (
              <div key={label}>
                <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="whitespace-pre-line text-gray-800 dark:text-white/90">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">
          {t("close")}
        </button>
      </div>
    </Modal>
  );
}
