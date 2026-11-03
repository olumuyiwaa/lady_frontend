"use client";

import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatMoneyUnits } from "@/app/services/currency";
import { signedCents } from "@/lib/transactionFilters";
import type { Transaction } from "@/lib/transactionFilters";
import { StatusBadge, TypeBadge } from "./TransactionBadges";

type SortKey = "occurredAt" | "amountCents";

type Props = {
  items: Transaction[];
  loading: boolean;
  showBusiness: boolean;
  sort: SortKey;
  order: "asc" | "desc";
  onSort: (key: SortKey) => void;
  /** Narrow the log to one booking (the "show everything for this booking" action). */
  onFilterBooking: (bookingId: string) => void;
};

const TH = "px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400";

function CopyButton({ value }: { value: string }) {
  const t = useTranslations("Dashboard.transactions.detail");
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard blocked: the value is still selectable on screen */
        }
      }}
      className="rounded px-1.5 py-0.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
    >
      {done ? t("copied") : t("copy")}
    </button>
  );
}

/**
 * Money out reads as a minus and is struck through when it never really moved
 * (failed or reversed), so a column of amounts can be skimmed honestly.
 */
function Amount({ tx }: { tx: Transaction }) {
  const cents = signedCents(tx);
  const settled = tx.status === "SUCCEEDED";
  const text = `${cents > 0 ? "+" : cents < 0 ? "−" : ""}${formatMoneyUnits(Math.abs(cents) / 100, tx.currency)}`;
  const color = !settled
    ? "text-gray-400 dark:text-gray-500"
    : tx.direction === "IN"
      ? "text-green-600 dark:text-green-400"
      : "text-gray-800 dark:text-white/90";
  const strike = tx.status === "FAILED" || tx.status === "REVERSED" ? "line-through" : "";
  return <span className={`whitespace-nowrap font-medium tabular-nums ${color} ${strike}`}>{text}</span>;
}

function SortHeader({ label, active, order, onClick, align = "left" }: { label: string; active: boolean; order: "asc" | "desc"; onClick: () => void; align?: "left" | "right" }) {
  return (
    <th scope="col" className={`${TH} ${align === "right" ? "text-right" : ""}`} aria-sort={active ? (order === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-gray-800 dark:hover:text-white">
        {label}
        <span aria-hidden="true" className={active ? "" : "opacity-30"}>{active ? (order === "asc" ? "↑" : "↓") : "↕"}</span>
      </button>
    </th>
  );
}

export function TransactionTable({ items, loading, showBusiness, sort, order, onSort, onFilterBooking }: Props) {
  const t = useTranslations("Dashboard.transactions");
  const locale = useLocale();
  const [expanded, setExpanded] = useState<string | null>(null);

  const when = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(d);
  };

  const detailRows = (tx: Transaction) =>
    [
      [t("detail.booking"), tx.bookingId],
      [t("detail.reference"), tx.reference],
      [t("detail.payment"), tx.stripePaymentIntentId],
      [t("detail.refund"), tx.stripeRefundId],
      [t("detail.transfer"), tx.stripeTransferId],
      [t("detail.invoice"), tx.stripeInvoiceId],
      [t("detail.dispute"), tx.stripeDisputeId],
    ].filter((r): r is [string, string] => !!r[1]);

  const cols = 7 + (showBusiness ? 1 : 0);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full" aria-busy={loading}>
        <caption className="sr-only">{t("title")}</caption>
        <thead className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
          <tr>
            <th className="w-10 px-4 py-3"><span className="sr-only">{t("expand")}</span></th>
            <SortHeader label={t("columns.date")} active={sort === "occurredAt"} order={order} onClick={() => onSort("occurredAt")} />
            {showBusiness && <th scope="col" className={TH}>{t("columns.business")}</th>}
            <th scope="col" className={TH}>{t("columns.type")}</th>
            <th scope="col" className={TH}>{t("columns.details")}</th>
            <th scope="col" className={TH}>{t("columns.method")}</th>
            <th scope="col" className={TH}>{t("columns.status")}</th>
            <SortHeader label={t("columns.amount")} active={sort === "amountCents"} order={order} onClick={() => onSort("amountCents")} align="right" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {loading && items.length === 0
            ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-4"><div className="h-4 w-4 animate-pulse rounded bg-gray-100 dark:bg-gray-800" /></td>
                  {Array.from({ length: cols - 1 }).map((__, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-800" style={{ width: `${55 + ((i + j) * 9) % 40}%` }} /></td>
                  ))}
                </tr>
              ))
            : items.map((tx) => {
                const open = expanded === tx.id;
                const rows = detailRows(tx);
                const panelId = `tx-detail-${tx.id}`;
                return (
                  <React.Fragment key={tx.id}>
                    <tr className={`hover:bg-gray-50 dark:hover:bg-white/[0.02] ${loading ? "opacity-60" : ""}`}>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => setExpanded(open ? null : tx.id)}
                          aria-expanded={open}
                          aria-controls={panelId}
                          aria-label={open ? t("collapse") : t("expand")}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? "rotate-90" : ""}`} aria-hidden="true">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {when(tx.occurredAt)}
                        {tx.approximate && (
                          <span title={t("approximateHint")} className="ml-2 cursor-help rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            ≈ {t("approximate")}
                          </span>
                        )}
                      </td>
                      {showBusiness && <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{tx.business?.name ?? "—"}</td>}
                      <td className="px-5 py-4"><TypeBadge type={tx.type} label={t(`types.${tx.type}`)} /></td>
                      <td className="max-w-xs px-5 py-4 text-sm">
                        <p className="truncate text-gray-800 dark:text-white/90">{tx.description || t(`types.${tx.type}`)}</p>
                        {tx.counterpartyName && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{tx.counterpartyName}</p>}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{t(`methods.${tx.method}`)}</td>
                      <td className="px-5 py-4"><StatusBadge status={tx.status} label={t(`statuses.${tx.status}`)} /></td>
                      <td className="px-5 py-4 text-right text-sm"><Amount tx={tx} /></td>
                    </tr>
                    {open && (
                      <tr id={panelId} className="bg-gray-50 dark:bg-white/[0.02]">
                        <td />
                        <td colSpan={cols - 1} className="px-5 py-4">
                          {rows.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t("detail.none")}</p>
                          ) : (
                            <dl className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
                              {rows.map(([label, value]) => (
                                <div key={label} className="flex items-center gap-2 text-sm">
                                  <dt className="w-32 shrink-0 text-gray-500 dark:text-gray-400">{label}</dt>
                                  <dd className="min-w-0 truncate font-mono text-xs text-gray-800 dark:text-gray-200" title={value}>{value}</dd>
                                  <CopyButton value={value} />
                                </div>
                              ))}
                            </dl>
                          )}
                          {tx.bookingId && (
                            <button type="button" onClick={() => onFilterBooking(tx.bookingId as string)} className="mt-3 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                              {t("detail.showBooking")}
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}
