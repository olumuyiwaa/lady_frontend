// Types and pure helpers for the transaction log. No imports from the app, so
// the node test runner can load this file directly (tests/unit).

export type TransactionType =
  | "BOOKING_PAYMENT"
  | "DEPOSIT"
  | "TIP"
  | "REFUND"
  | "DISPUTE"
  | "CLEANER_PAYOUT"
  | "SUBSCRIPTION";
export type TransactionDirection = "IN" | "OUT";
export type TransactionStatus = "SUCCEEDED" | "PENDING" | "FAILED" | "REVERSED";
export type TransactionMethod = "STRIPE" | "CASH" | "BANK_TRANSFER" | "INVOICE" | "OTHER";

export const TRANSACTION_TYPES: TransactionType[] = [
  "BOOKING_PAYMENT", "DEPOSIT", "TIP", "REFUND", "DISPUTE", "CLEANER_PAYOUT", "SUBSCRIPTION",
];
export const TRANSACTION_STATUSES: TransactionStatus[] = ["SUCCEEDED", "PENDING", "FAILED", "REVERSED"];
export const TRANSACTION_METHODS: TransactionMethod[] = ["STRIPE", "CASH", "BANK_TRANSFER", "INVOICE", "OTHER"];

export type Transaction = {
  id: string;
  type: TransactionType;
  direction: TransactionDirection;
  status: TransactionStatus;
  method: TransactionMethod;
  /** Always positive minor units (cents); `direction` carries the sign. */
  amountCents: number;
  currency: string;
  occurredAt: string;
  description: string | null;
  counterpartyName: string | null;
  reference: string | null;
  bookingId: string | null;
  stripePaymentIntentId: string | null;
  stripeRefundId: string | null;
  stripeTransferId: string | null;
  stripeInvoiceId: string | null;
  stripeDisputeId: string | null;
  /** Rebuilt from older records: the date (or method) is a best guess. */
  approximate: boolean;
  /** Only present in the platform admin's view. */
  business?: { id: string; name: string; subdomain: string };
};

export type TransactionPagination = { page: number; limit: number; total: number; totalPages: number };

export type TransactionPage = { items: Transaction[]; pagination: TransactionPagination };

export type CurrencySummary = {
  currency: string;
  inCents: number;
  outCents: number;
  netCents: number;
  pendingOutCents: number;
  count: number;
  failedCount: number;
  byType: Partial<Record<TransactionType, { count: number; amountCents: number }>>;
  // Platform admin only:
  subscriptionRevenueCents?: number;
  stripeVolumeInCents?: number;
  refundedCents?: number;
  openDisputes?: number;
  failedSubscriptionPayments?: number;
};

export type TransactionSummary = { byCurrency: CurrencySummary[] };

export type TransactionFilters = {
  type?: TransactionType[];
  direction?: TransactionDirection;
  status?: TransactionStatus[];
  method?: TransactionMethod[];
  /** YYYY-MM-DD, inclusive, read as the business's local day by the server. */
  from?: string;
  to?: string;
  q?: string;
  /** Platform admin only. */
  businessId?: string;
  sort?: "occurredAt" | "amountCents";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
};

/** Only filters that are set; arrays become comma lists, which is what the API expects. */
export function toQuery(filters: TransactionFilters, opts: { paging?: boolean } = { paging: true }): string {
  const qs = new URLSearchParams();
  const put = (key: string, value: unknown) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      if (value.length) qs.set(key, value.join(","));
      return;
    }
    qs.set(key, String(value));
  };
  put("type", filters.type);
  put("direction", filters.direction);
  put("status", filters.status);
  put("method", filters.method);
  put("from", filters.from);
  put("to", filters.to);
  put("q", filters.q?.trim());
  put("businessId", filters.businessId);
  put("sort", filters.sort);
  put("order", filters.order);
  if (opts.paging !== false) {
    put("page", filters.page);
    put("limit", filters.limit);
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}


// ─── Presentation helpers (pure, unit-tested) ─────────────────────────

/** Local calendar date as YYYY-MM-DD, which is what <input type="date"> and the API use. */
export function toDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export type RangePreset = "last7" | "last30" | "thisMonth" | "lastMonth" | "thisYear" | "all";
export const RANGE_PRESETS: RangePreset[] = ["last7", "last30", "thisMonth", "lastMonth", "thisYear", "all"];

/** Inclusive from/to for a quick-range button; "all" clears both. */
export function presetRange(preset: RangePreset, today: Date = new Date()): { from: string; to: string } {
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  switch (preset) {
    case "last7":
      return { from: toDateInput(new Date(y, m, d - 6)), to: toDateInput(today) };
    case "last30":
      return { from: toDateInput(new Date(y, m, d - 29)), to: toDateInput(today) };
    case "thisMonth":
      return { from: toDateInput(new Date(y, m, 1)), to: toDateInput(today) };
    case "lastMonth":
      // Day 0 of this month is the last day of the previous one.
      return { from: toDateInput(new Date(y, m - 1, 1)), to: toDateInput(new Date(y, m, 0)) };
    case "thisYear":
      return { from: toDateInput(new Date(y, 0, 1)), to: toDateInput(today) };
    default:
      return { from: "", to: "" };
  }
}

/**
 * Which preset (if any) the current dates correspond to, so its button can look selected.
 *
 * Presets can describe the very same dates: on the 7th of a month "Last 7 days"
 * and "This month" are identical, and on 1 January "This year" equals "This
 * month". `clicked` is the button the user actually pressed; when its range
 * still matches it wins, so they never see a different button light up.
 */
export function activePreset(from: string, to: string, today: Date = new Date(), clicked: RangePreset | null = null): RangePreset | null {
  if (clicked) {
    const r = presetRange(clicked, today);
    if (r.from === from && r.to === to) return clicked;
  }
  for (const p of RANGE_PRESETS) {
    const r = presetRange(p, today);
    if (r.from === from && r.to === to) return p;
  }
  return null;
}

/** Cents with the sign a person expects: money out is negative. */
export function signedCents(t: { direction: TransactionDirection; amountCents: number }): number {
  return t.direction === "OUT" ? -t.amountCents : t.amountCents;
}

/**
 * Keeps the chosen currency while it still exists in the data; otherwise the
 * first one. Currencies are never added together, so only one is shown at a time.
 */
export function pickCurrency(summary: TransactionSummary | null, selected: string | null): string | null {
  const list = summary?.byCurrency ?? [];
  if (!list.length) return null;
  return list.some((c) => c.currency === selected) ? selected : list[0].currency;
}

/** How many filters narrow the view (the date range counts once). */
export function activeFilterCount(f: TransactionFilters): number {
  let n = 0;
  if (f.type?.length) n++;
  if (f.direction) n++;
  if (f.status?.length) n++;
  if (f.method?.length) n++;
  if (f.from || f.to) n++;
  if (f.q?.trim()) n++;
  if (f.businessId) n++;
  return n;
}
