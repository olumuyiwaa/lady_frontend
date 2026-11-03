import { authFetch } from "./authFetch";
import { refreshAccessToken } from "./client";
import { sessionService } from "../services/session.service";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export type Invoice = {
  id: string;
  bookingId: string;
  number: string;
  currency: string;
  vatRateBps: number;
  netCents: number;
  vatCents: number;
  grossCents: number;
  issuedAt: string;
  paidAt: string | null;
};

/** Issues (or returns the existing) invoice for a booking. Idempotent. */
export async function issueInvoice(bookingId: string): Promise<Invoice> {
  const result = await authFetch(`/invoices/booking/${bookingId}`, { method: "POST" });
  return result.data as Invoice;
}

export async function listInvoices(params?: { from?: string; to?: string; limit?: number }): Promise<Invoice[]> {
  const qs = new URLSearchParams();
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  if (params?.limit) qs.set("limit", String(params.limit));
  const result = await authFetch(`/invoices${qs.toString() ? `?${qs}` : ""}`, { method: "GET" });
  return (result.data ?? []) as Invoice[];
}

/**
 * The printable invoice is HTML, not JSON, so it cannot go through authFetch
 * (which parses JSON), and a plain link cannot send the bearer token.
 */
export async function fetchInvoiceHtml(invoiceId: string): Promise<string> {
  const get = (token: string | null) =>
    fetch(`${API_BASE_URL}/invoices/${invoiceId}/html`, { headers: { Authorization: `Bearer ${token ?? ""}` } });

  let res = await get(sessionService.getAccessToken());
  if (res.status === 401) res = await get(await refreshAccessToken());
  if (!res.ok) throw new Error("Could not load the invoice");
  return res.text();
}

/** Opens the invoice in a new tab, ready to print or "Save as PDF". */
export async function openInvoice(invoiceId: string): Promise<void> {
  const html = await fetchInvoiceHtml(invoiceId);
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  window.open(url, "_blank", "noopener");
  // give the new tab time to load before releasing the blob
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Download UBL 2.1 XML for Exact / Moneybird / e-Boekhouden / SnelStart.
 * Matches backend GET /invoices/:id/ubl (Bearer auth).
 */
export async function downloadInvoiceUbl(
  invoiceId: string,
  invoiceNumber?: string | null
): Promise<void> {
  const get = (token: string | null) =>
    fetch(`${API_BASE_URL}/invoices/${invoiceId}/ubl`, {
      headers: {
        Authorization: `Bearer ${token ?? ""}`,
        Accept: "application/xml, text/xml, */*",
      },
    });

  let res = await get(sessionService.getAccessToken());
  if (res.status === 401) res = await get(await refreshAccessToken());
  if (!res.ok) {
    let message = `UBL download failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message || body?.error) message = String(body.message || body.error);
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = /filename\*?=(?:UTF-8'')?["']?([^"';\n]+)/i.exec(disposition);
  const safe = String(invoiceNumber || invoiceId).replace(/[^\w.-]+/g, "_").slice(0, 64);
  const filename = match?.[1]?.trim() || `${safe}.xml`;

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

/** Issue invoice for a booking, then download UBL XML. */
export async function issueAndDownloadUbl(bookingId: string): Promise<Invoice> {
  const invoice = await issueInvoice(bookingId);
  await downloadInvoiceUbl(invoice.id, invoice.number);
  return invoice;
}
