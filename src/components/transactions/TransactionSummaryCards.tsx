"use client";

import { useTranslations } from "next-intl";
import { formatMoneyUnits } from "@/app/services/currency";
import type { CurrencySummary } from "@/lib/transactionFilters";

type Props = {
  summary: CurrencySummary | null;
  scope: "business" | "admin";
  loading: boolean;
};

function Card({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: string; tone?: "default" | "good" | "bad" | "warn" }) {
  const color =
    tone === "good" ? "text-green-600 dark:text-green-400"
    : tone === "bad" ? "text-red-600 dark:text-red-400"
    : tone === "warn" ? "text-yellow-600 dark:text-yellow-400"
    : "text-gray-800 dark:text-white/90";
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="h-3 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
      <div className="mt-3 h-7 w-32 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

/**
 * Totals for the CURRENT filters (not just the visible page), in one currency.
 * Only completed payments count as money moved; open disputes and failures are
 * shown separately so they can't be mistaken for it.
 */
export function TransactionSummaryCards({ summary, scope, loading }: Props) {
  const t = useTranslations("Dashboard.transactions.summary");

  if (loading && !summary) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }
  if (!summary) return null;

  const cur = summary.currency;
  const money = (cents: number) => formatMoneyUnits(cents / 100, cur);
  const dim = loading ? "opacity-60 transition-opacity" : "transition-opacity";

  if (scope === "admin") {
    return (
      <div className={`grid grid-cols-2 gap-4 lg:grid-cols-5 ${dim}`}>
        <Card label={t("subscriptionRevenue")} value={money(summary.subscriptionRevenueCents ?? 0)} tone="good" />
        <Card label={t("stripeVolume")} value={money(summary.stripeVolumeInCents ?? 0)} hint={t("stripeVolumeHint")} />
        <Card label={t("refunded")} value={money(summary.refundedCents ?? 0)} />
        <Card label={t("openDisputes")} value={String(summary.openDisputes ?? 0)} tone={(summary.openDisputes ?? 0) > 0 ? "warn" : "default"} />
        <Card label={t("failedSubscriptions")} value={String(summary.failedSubscriptionPayments ?? 0)} tone={(summary.failedSubscriptionPayments ?? 0) > 0 ? "bad" : "default"} />
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-4 lg:grid-cols-4 ${dim}`}>
      <Card label={t("moneyIn")} value={money(summary.inCents)} tone="good" />
      <Card label={t("moneyOut")} value={money(summary.outCents)} />
      <Card label={t("net")} value={money(summary.netCents)} tone={summary.netCents < 0 ? "bad" : "default"} hint={t("count", { count: summary.count })} />
      {summary.pendingOutCents > 0 && (
        <Card label={t("onHold")} value={money(summary.pendingOutCents)} tone="warn" hint={t("onHoldHint")} />
      )}
      {/* Shown whenever there is something to flag, and as a quiet "0" when nothing else fills the row. */}
      {(summary.failedCount > 0 || summary.pendingOutCents === 0) && (
        <Card label={t("failed")} value={String(summary.failedCount)} tone={summary.failedCount > 0 ? "bad" : "default"} />
      )}
    </div>
  );
}
