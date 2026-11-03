"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { BookingQuestion } from "@/lib/bookingQuestions";
import { BookingWizard } from "@/components/booking/BookingWizard";
import type {
  StorefrontPayment,
  StorefrontCancellationPolicy,
  WidgetBusiness,
  WidgetService,
} from "@/app/api/widget.api";

type BookingWidgetModalProps = {
  open: boolean;
  onClose: () => void;
  subdomain: string;
  business: WidgetBusiness;
  services: WidgetService[];
  payment?: StorefrontPayment | null;
  cancellationPolicy?: StorefrontCancellationPolicy | null;
  questions?: BookingQuestion[];
  businessName?: string;
  primaryColor?: string;
  /** Prefills the wizard's postcode (set when the visitor used the storefront postcode check). */
  initialPostalCode?: string;
};

/**
 * Full-screen overlay modal that hosts the booking form.
 * Locks body scroll while open; closes on Escape or backdrop click.
 *
 * Booking itself is the same BookingWizard used at /book-now/[slug]
 * (rendered with compact), rather than a separate form implementation —
 * so the two entry points can't drift out of sync on validation, pricing,
 * or copy.
 */
export function BookingWidgetModal({
                                     open,
                                     onClose,
                                     subdomain,
                                     business,
                                     services,
                                     payment,
                                     cancellationPolicy,
                                     questions,
                                     businessName,
                                     primaryColor = "#3F6B52",
                                     initialPostalCode,
                                   }: BookingWidgetModalProps) {
  const t = useTranslations("Site.bookModal");
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
      <div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={businessName ? t("title", { name: businessName }) : t("titleFallback")}
      >
        {/* Backdrop */}
        <button
            type="button"
            className="absolute inset-0 bg-[#171B1A]/50 backdrop-blur-[2px]"
            aria-label={t("closeBooking")}
            onClick={onClose}
        />

        {/* Panel */}
        <div ref={panelRef} tabIndex={-1} className="relative z-[1] flex outline-none max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[20px] bg-white shadow-[0_24px_80px_rgba(22,35,28,0.28)] sm:rounded-[20px]">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-5">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {businessName ? t("title", { name: businessName }) : t("titleFallback")}
              </p>
              <p className="text-xs text-gray-500">{t("subtitle")}</p>
            </div>
            <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                aria-label={t("close")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                    d="M6 6l12 12M18 6 6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
            <BookingWizard
                key={open ? subdomain : "closed"}
                slug={subdomain}
                business={business}
                services={services}
                payment={payment}
                cancellationPolicy={cancellationPolicy}
                questions={questions}
                initialPostalCode={initialPostalCode}
                compact
            />
          </div>

          <div
              className="pointer-events-none absolute left-0 right-0 top-0 h-1"
              style={{ backgroundColor: primaryColor }}
              aria-hidden
          />
        </div>
      </div>
  );
}
