"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import SearchSelect from "@/components/SearchSelect/SearchSelect";
import {
  adminTransactions,
  businessTransactions,
  RANGE_PRESETS,
  TRANSACTION_METHODS,
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
  activeFilterCount,
  activePreset,
  pickCurrency,
  presetRange,
} from "@/app/api/transactions.api";
import type {
  RangePreset,
  TransactionDirection,
  TransactionFilters,
  TransactionMethod,
  TransactionPage,
  TransactionStatus,
  TransactionSummary,
  TransactionType,
} from "@/app/api/transactions.api";
import { TransactionSummaryCards } from "./TransactionSummaryCards";
import { TransactionTable } from "./TransactionTable";

const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 400;

const FIELD =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";
const LABEL = "mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400";
const CARD = "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6";
const GHOST_BTN =
  "inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]";

type Form = {
  type: "" | TransactionType;
  direction: "" | TransactionDirection;
  status: "" | TransactionStatus;
  method: "" | TransactionMethod;
  from: string;
  to: string;
  q: string;
  businessId: string;
};
const EMPTY: Form = { type: "", direction: "", status: "", method: "", from: "", to: "", q: "", businessId: "" };

/**
 * The transaction log. One component for both audiences: a business sees its
 * own money, the platform admin sees every business (and can narrow to one).
 * The server decides what each caller may see; `scope` only picks the endpoint
 * and which columns and totals make sense.
 */
export function TransactionLog({ scope }: { scope: "business" | "admin" }) {
  const t = useTranslations("Dashboard.transactions");
  const tc = useTranslations("Dashboard.common");
  const locale = useLocale();
  const api = scope === "admin" ? adminTransactions : businessTransactions;

  // A link from elsewhere can pre-fill the search (?q=<booking id>).
  const initialQ = useSearchParams().get("q") ?? "";
  const [form, setForm] = useState<Form>({ ...EMPTY, q: initialQ });
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [businessLabel, setBusinessLabel] = useState("");
  const [page, setPage] = useState(1);
  // The quick-range button last pressed (cleared when the dates are edited by hand).
  const [clickedPreset, setClickedPreset] = useState<RangePreset | null>(null);
  const [sort, setSort] = useState<"occurredAt" | "amountCents">("occurredAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const [data, setData] = useState<TransactionPage | null>(null);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [reloadTick, setReloadTick] = useState(0);

  // Typing in search should not fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(form.q), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [form.q]);

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  // What the server is asked for. `q` uses the debounced value.
  const filters: TransactionFilters = useMemo(
    () => ({
      type: form.type ? [form.type] : undefined,
      direction: form.direction || undefined,
      status: form.status ? [form.status] : undefined,
      method: form.method ? [form.method] : undefined,
      from: form.from || undefined,
      to: form.to || undefined,
      q: debouncedQ || undefined,
      businessId: scope === "admin" ? form.businessId || undefined : undefined,
    }),
    [form.type, form.direction, form.status, form.method, form.from, form.to, form.businessId, debouncedQ, scope]
  );
  const filterKey = JSON.stringify(filters);
  const rangeInvalid = !!(form.from && form.to && form.from > form.to);

  // Only the latest request may update the screen: a slow earlier response
  // must never overwrite a newer one after the user changed a filter.
  const listSeq = useRef(0);
  const summarySeq = useRef(0);

  useEffect(() => {
    if (rangeInvalid) return;
    const seq = ++listSeq.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-change loading flag
    setLoading(true);
    setError("");
    api
      .list({ ...filters, page, limit: PAGE_SIZE, sort, order })
      .then((res) => seq === listSeq.current && setData(res))
      .catch((err) => seq === listSeq.current && setError(err instanceof Error ? err.message : t("loadFailed")))
      .finally(() => seq === listSeq.current && setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filterKey stands in for `filters`
  }, [filterKey, page, sort, order, api, reloadTick, rangeInvalid]);

  // Totals depend on the filters only, not on the page or sort.
  useEffect(() => {
    if (rangeInvalid) return;
    const seq = ++summarySeq.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-change loading flag
    setSummaryLoading(true);
    api
      .summary(filters)
      .then((res) => {
        if (seq !== summarySeq.current) return;
        setSummary(res);
        setCurrency((cur) => pickCurrency(res, cur));
      })
      .catch(() => seq === summarySeq.current && setSummary(null)) // the list shows the real error
      .finally(() => seq === summarySeq.current && setSummaryLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filterKey stands in for `filters`
  }, [filterKey, api, reloadTick, rangeInvalid]);

  const currentSummary = useMemo(
    () => summary?.byCurrency.find((c) => c.currency === currency) ?? null,
    [summary, currency]
  );

  const onSort = (key: "occurredAt" | "amountCents") => {
    if (key === sort) setOrder((o) => (o === "desc" ? "asc" : "desc"));
    else {
      setSort(key);
      setOrder("desc");
    }
    setPage(1);
  };

  const clearAll = () => {
    setForm({ ...EMPTY });
    setDebouncedQ("");
    setBusinessLabel("");
    setClickedPreset(null);
    setPage(1);
  };

  const applyPreset = (preset: RangePreset) => {
    const { from, to } = presetRange(preset);
    setForm((f) => ({ ...f, from, to }));
    setClickedPreset(preset);
    setPage(1);
  };

  const exportCsv = useCallback(async () => {
    setExporting(true);
    setExportError("");
    try {
      await api.exportCsv({ ...filters, sort, order });
    } catch (err) {
      // The server's wording is the useful part: "not included in your plan", "narrow the date range"...
      setExportError(err instanceof Error && err.message ? err.message : t("exportFailed"));
    } finally {
      setExporting(false);
    }
  }, [api, filters, sort, order, t]);

  const active = activeFilterCount({ ...filters, businessId: filters.businessId });
  const preset = activePreset(form.from, form.to, new Date(), clickedPreset);
  const pagination = data?.pagination;
  const items = data?.items ?? [];
  const nf = new Intl.NumberFormat(locale);
  const hasCurrencies = (summary?.byCurrency.length ?? 0) > 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={CARD}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {scope === "admin" ? t("subtitleAdmin") : t("subtitleBusiness")}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={exportCsv} disabled={exporting || loading || items.length === 0} className={GHOST_BTN}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {exporting ? t("exporting") : t("exportCsv")}
            </button>
            <button type="button" onClick={() => setReloadTick((n) => n + 1)} disabled={loading} className={GHOST_BTN}>
              {loading ? t("refreshing") : tc("refresh")}
            </button>
          </div>
        </div>
        {exportError && (
          <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {exportError}
          </div>
        )}
      </div>

      {/* Currency switch: currencies are never added together */}
      {hasCurrencies && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("currency")}>
          {summary!.byCurrency.map((c) => (
            <button
              key={c.currency}
              type="button"
              onClick={() => setCurrency(c.currency)}
              aria-pressed={c.currency === currency}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${c.currency === currency ? "bg-brand-500 text-white" : "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"}`}
            >
              {c.currency}
            </button>
          ))}
        </div>
      )}

      <TransactionSummaryCards summary={currentSummary} scope={scope} loading={summaryLoading} />

      {/* Filters */}
      <div className={CARD}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t("filters")}
            {active > 0 && <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">{active}</span>}
          </h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("filters")}>
            {RANGE_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => applyPreset(p)}
                aria-pressed={preset === p}
                className={`rounded-full px-3 py-1 text-xs font-medium ${preset === p ? "bg-brand-500 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"}`}
              >
                {t(`presets.${p}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div>
            <label htmlFor="tx-search" className={LABEL}>{tc("search")}</label>
            <input id="tx-search" type="search" value={form.q} onChange={(e) => update("q", e.target.value)} placeholder={t("search")} maxLength={100} className={FIELD} />
          </div>

          <div>
            <label htmlFor="tx-type" className={LABEL}>{t("columns.type")}</label>
            <select id="tx-type" value={form.type} onChange={(e) => update("type", e.target.value as Form["type"])} className={FIELD}>
              <option value="">{t("allTypes")}</option>
              {TRANSACTION_TYPES.map((v) => <option key={v} value={v}>{t(`types.${v}`)}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="tx-direction" className={LABEL}>{t("columns.amount")}</label>
            <select id="tx-direction" value={form.direction} onChange={(e) => update("direction", e.target.value as Form["direction"])} className={FIELD}>
              <option value="">{t("allDirections")}</option>
              <option value="IN">{t("directions.IN")}</option>
              <option value="OUT">{t("directions.OUT")}</option>
            </select>
          </div>

          <div>
            <label htmlFor="tx-status" className={LABEL}>{t("columns.status")}</label>
            <select id="tx-status" value={form.status} onChange={(e) => update("status", e.target.value as Form["status"])} className={FIELD}>
              <option value="">{t("allStatuses")}</option>
              {TRANSACTION_STATUSES.map((v) => <option key={v} value={v}>{t(`statuses.${v}`)}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="tx-method" className={LABEL}>{t("columns.method")}</label>
            <select id="tx-method" value={form.method} onChange={(e) => update("method", e.target.value as Form["method"])} className={FIELD}>
              <option value="">{t("allMethods")}</option>
              {TRANSACTION_METHODS.map((v) => <option key={v} value={v}>{t(`methods.${v}`)}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="tx-from" className={LABEL}>{tc("from")}</label>
            <input id="tx-from" type="date" value={form.from} max={form.to || undefined} onChange={(e) => update("from", e.target.value)} className={FIELD} />
          </div>

          <div>
            <label htmlFor="tx-to" className={LABEL}>{tc("to")}</label>
            <input id="tx-to" type="date" value={form.to} min={form.from || undefined} onChange={(e) => update("to", e.target.value)} className={FIELD} />
          </div>

          {scope === "admin" && (
            <SearchSelect
              label={t("business")}
              placeholder={t("searchBusiness")}
              type="business"
              onSelect={(id, hit) => {
                update("businessId", id);
                setBusinessLabel(hit.title);
              }}
              onClear={() => {
                update("businessId", "");
                setBusinessLabel("");
              }}
            />
          )}

          <div className="flex items-end">
            <button type="button" onClick={clearAll} disabled={active === 0} className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]">
              {t("clear")}
            </button>
          </div>
        </div>
        {scope === "admin" && businessLabel && <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t("business")}: {businessLabel}</p>}
        {rangeInvalid && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{t("invalidRange")}</p>}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {error ? (
          <div role="alert" className="flex flex-col items-start gap-3 p-6">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button type="button" onClick={() => setReloadTick((n) => n + 1)} className={GHOST_BTN}>{t("retry")}</button>
          </div>
        ) : !loading && items.length === 0 ? (
          <p className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">{active > 0 ? t("empty") : t("emptyAll")}</p>
        ) : (
          <TransactionTable
            items={items}
            loading={loading}
            showBusiness={scope === "admin"}
            sort={sort}
            order={order}
            onSort={onSort}
            onFilterBooking={(id) => {
              update("q", id);
              setDebouncedQ(id); // apply now, without waiting for the debounce
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}

        {pagination && !error && pagination.total > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
              {t("pageSummary", { page: pagination.page, totalPages: pagination.totalPages, count: nf.format(pagination.total) })}
            </p>
            <div className="flex gap-2">
              <button type="button" disabled={loading || pagination.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className={GHOST_BTN}>{tc("back")}</button>
              <button type="button" disabled={loading || pagination.page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className={GHOST_BTN}>{tc("next")}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
