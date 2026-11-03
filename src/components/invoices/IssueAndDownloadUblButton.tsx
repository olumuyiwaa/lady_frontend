"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  downloadInvoiceUbl,
  issueInvoiceForBooking,
} from "@/lib/invoices-api";

type Props = {
  bookingId: string;
  /** If an invoice already exists for this booking, skip issue and download only */
  existingInvoiceId?: string | null;
  existingInvoiceNumber?: string | null;
  authHeaders?: HeadersInit;
  ublPathTemplate?: string;
  className?: string;
  onDone?: (info: { invoiceId: string; filename?: string }) => void;
  onError?: (message: string) => void;
};

/**
 * Booking row action: create invoice (if needed) then download UBL XML.
 * Use next to your existing "Invoice" / PDF actions from the dashboard.
 */
export function IssueAndDownloadUblButton({
  bookingId,
  existingInvoiceId,
  existingInvoiceNumber,
  authHeaders,
  ublPathTemplate,
  className = "",
  onDone,
  onError,
}: Props) {
  const t = useTranslations("Invoices");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);

    let invoiceId = existingInvoiceId || null;
    let invoiceNumber = existingInvoiceNumber || null;

    if (!invoiceId) {
      const issued = await issueInvoiceForBooking(bookingId, {
        headers: authHeaders,
      });
      if (!issued.ok) {
        setBusy(false);
        setError(issued.error);
        onError?.(issued.error);
        return;
      }
      invoiceId = issued.invoiceId;
      invoiceNumber = issued.number || null;
    }

    const dl = await downloadInvoiceUbl(invoiceId, {
      invoiceNumber,
      headers: authHeaders,
      pathTemplate: ublPathTemplate,
    });

    setBusy(false);

    if (!dl.ok) {
      setError(dl.error);
      onError?.(dl.error);
      return;
    }

    onDone?.({ invoiceId, filename: dl.filename });
  }, [
    bookingId,
    existingInvoiceId,
    existingInvoiceNumber,
    authHeaders,
    ublPathTemplate,
    busy,
    onDone,
    onError,
  ]);

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy || !bookingId}
        className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60 ${className}`}
        title={t("ubl.tooltip")}
      >
        {busy ? t("ubl.preparing") : t("ubl.downloadForBooking")}
      </button>
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
