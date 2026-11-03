import { API_BASE_URL, authFetch } from "@/app/api/authFetch";
import { refreshAccessToken } from "@/app/api/client";
import { ApiError } from "@/app/api/errors";
import { sessionService } from "@/app/services/session.service";
import { toQuery } from "@/lib/transactionFilters";
import type { TransactionFilters, TransactionPage, TransactionSummary } from "@/lib/transactionFilters";

// Re-exported so components have one place to import from.
export * from "@/lib/transactionFilters";

/** Filename from a Content-Disposition header, or the fallback. */
function filenameFrom(header: string | null, fallback: string): string {
  const m = header && /filename="?([^";]+)"?/i.exec(header);
  return m ? m[1] : fallback;
}

/**
 * authFetch always parses JSON, so a CSV download needs its own request. It
 * follows the same rules: bearer token, one silent refresh on 401, and the
 * server's own error message (e.g. "not included in your plan") on failure.
 */
async function downloadCsv(path: string, fallbackName: string): Promise<void> {
  const request = (token?: string | null) =>
    fetch(`${API_BASE_URL}${path}`, { headers: { Accept: "text/csv", Authorization: `Bearer ${token}` } });

  let res = await request(sessionService.getAccessToken());
  if (res.status === 401) {
    try {
      res = await request(await refreshAccessToken());
    } catch {
      sessionService.clearSession();
      window.location.href = "/";
      throw new Error("Session expired");
    }
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.message || "Export failed", res.status, body?.errors);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filenameFrom(res.headers.get("Content-Disposition"), fallbackName);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function api(base: string, fallbackName: string) {
  return {
    async list(filters: TransactionFilters): Promise<TransactionPage> {
      const result = await authFetch(`${base}${toQuery(filters)}`);
      return result.data as TransactionPage;
    },
    async summary(filters: TransactionFilters): Promise<TransactionSummary> {
      // Totals describe the whole filtered set, so paging/sorting are left out.
      const result = await authFetch(`${base}/summary${toQuery({ ...filters, sort: undefined, order: undefined }, { paging: false })}`);
      return result.data as TransactionSummary;
    },
    exportCsv(filters: TransactionFilters): Promise<void> {
      return downloadCsv(`${base}/export${toQuery(filters, { paging: false })}`, fallbackName);
    },
  };
}

/** The signed-in business's own transactions. */
export const businessTransactions = api("/transactions", "transactions.csv");
/** Every business on the platform (super admin only). */
export const adminTransactions = api("/super-admin/transactions", "platform-transactions.csv");
