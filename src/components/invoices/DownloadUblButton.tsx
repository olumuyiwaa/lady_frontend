"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { downloadInvoiceUbl } from "@/lib/invoices-api";

type Props = {
  invoiceId: string;
  /** Human-readable invoice number for the downloaded filename */
  invoiceNumber?: string | null;
  /** Optional auth headers if you don't use cookie sessions */
  authHeaders?: HeadersInit;
  /**
   * Override API path if your backend differs.
   * Default: `/invoices/:id/ubl`
   */
  pathTemplate?: string;
  /** Visual variant */
  variant?: "primary" | "secondary" | "ghost" | "menu";
  className?: string;
  /** Called after a successful download */
  onSuccess?: (filename: string) => void;
  /** Called on failure */
  onError?: (message: string) => void;
};

/**
 * "Download UBL" control for Exact / Moneybird / e-Boekhouden / SnelStart import.
 * File-based UBL 2.1 only — not Peppol network delivery.
 */
export function DownloadUblButton({
  invoiceId,
  invoiceNumber,
  authHeaders,
  pathTemplate,
  variant = "secondary",
  className = "",
  onSuccess,
  onError,
}: Props) {
  const t = useTranslations("Invoices");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (!invoiceId || busy) return;
    setBusy(true);
    setError(null);

    const result = await downloadInvoiceUbl(invoiceId, {
      invoiceNumber,
      headers: authHeaders,
      pathTemplate,
    });

    setBusy(false);

    if (result.ok) {
      onSuccess?.(result.filename);
    } else {
      setError(result.error);
      onError?.(result.error);
    }
  }, [
    invoiceId,
    invoiceNumber,
    authHeaders,
    pathTemplate,
    busy,
    onSuccess,
    onError,
  ]);

  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed";
  const variants: Record<NonNullable<Props["variant"]>, string> = {
    primary:
      "bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-2 shadow-sm",
    secondary:
      "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 px-3 py-2",
    ghost: "text-slate-700 hover:bg-slate-100 px-2 py-1.5",
    menu: "w-full justify-start text-left text-slate-700 hover:bg-slate-100 px-3 py-2",
  };

  return (
    <div className={variant === "menu" ? "w-full" : "inline-flex flex-col gap-1"}>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy || !invoiceId}
        className={`${base} ${variants[variant]} ${className}`}
        title={t("ubl.tooltip")}
        aria-busy={busy}
      >
        {busy ? (
          <>
            <Spinner />
            <span>{t("ubl.downloading")}</span>
          </>
        ) : (
          <>
            <XmlIcon />
            <span>{t("ubl.download")}</span>
          </>
        )}
      </button>
      {error ? (
        <p className="text-xs text-red-600 max-w-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function XmlIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13l-2 2 2 2" />
      <path d="M15 13l2 2-2 2" />
    </svg>
  );
}
