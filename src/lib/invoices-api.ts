/**
 * Invoice API helpers — UBL 2.1 download for Dutch accounting tools
 * (Exact Online, Moneybird, e-Boekhouden, SnelStart).
 *
 * Adjust API_BASE / path if your backend mounts invoices elsewhere.
 * Backend (P1.6 e011133) exposes UBL via the invoices module using
 * generateUBLInvoiceXML from src/lib/ubl.js.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "";

export type DownloadUblResult =
  | { ok: true; filename: string }
  | { ok: false; error: string };

/**
 * Download a UBL 2.1 XML invoice as a file.
 * Expected backend: GET /invoices/:id/ubl  → application/xml
 * Auth: same session / Bearer token as other dashboard calls.
 */
export async function downloadInvoiceUbl(
  invoiceId: string,
  options?: {
    /** Optional explicit invoice number for a nicer filename */
    invoiceNumber?: string | null;
    /** Pass your existing auth headers (cookie mode can omit) */
    headers?: HeadersInit;
    /** Override path if backend differs, e.g. `/api/v1/invoices/:id/ubl` */
    pathTemplate?: string;
  }
): Promise<DownloadUblResult> {
  const template =
    options?.pathTemplate || "/invoices/:id/ubl";
  const path = template.replace(":id", encodeURIComponent(invoiceId));
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/xml, text/xml, */*",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      let message = `Download failed (${res.status})`;
      try {
        const body = await res.json();
        if (body?.message || body?.error) {
          message = String(body.message || body.error);
        }
      } catch {
        /* ignore non-JSON error bodies */
      }
      return { ok: false, error: message };
    }

    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = /filename\*?=(?:UTF-8'')?["']?([^"';\n]+)/i.exec(
      disposition
    );
    const safeNumber = (options?.invoiceNumber || invoiceId)
      .replace(/[^\w.-]+/g, "_")
      .slice(0, 64);
    const filename = match?.[1]?.trim() || `factuur-${safeNumber}-ubl.xml`;

    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);

    return { ok: true, filename };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Network error while downloading UBL";
    return { ok: false, error: message };
  }
}

/**
 * Issue (create) an invoice for a booking, then optionally download UBL.
 * Align path with your existing "Invoice" action from bee6423.
 */
export async function issueInvoiceForBooking(
  bookingId: string,
  options?: { headers?: HeadersInit }
): Promise<{ ok: true; invoiceId: string; number?: string } | { ok: false; error: string }> {
  const url = `${API_BASE}/bookings/${encodeURIComponent(bookingId)}/invoice`;
  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options?.headers,
      },
    });
    if (!res.ok) {
      let message = `Could not create invoice (${res.status})`;
      try {
        const body = await res.json();
        if (body?.message || body?.error) {
          message = String(body.message || body.error);
        }
      } catch {
        /* ignore */
      }
      return { ok: false, error: message };
    }
    const data = await res.json();
    const invoiceId = data.id || data.invoiceId || data.invoice?.id;
    if (!invoiceId) {
      return { ok: false, error: "Invoice created but no id returned" };
    }
    return {
      ok: true,
      invoiceId: String(invoiceId),
      number: data.number || data.invoice?.number,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}
