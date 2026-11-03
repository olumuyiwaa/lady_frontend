"use client";

import { isoDateInTimeZone } from "@/app/services/currency";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  getReportKPIs,
  getRevenueByDay,
  getCleanerPerformance,
  ReportKPIs,
  RevenueDay,
  CleanerPerfRow,
} from "@/app/api/reports.api";
import { formatMoney } from "@/app/api/cleansera-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import MonthlySalesChart from "@/components/overview/MonthlySalesChart";
import StatisticsChart from "@/components/overview/StatisticsChart";
import MonthlyTarget from "@/components/overview/MonthlyTarget";
import { EcommerceMetrics } from "@/components/overview/EcommerceMetrics";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: isoDateInTimeZone(from),
    to: isoDateInTimeZone(to),
  };
}

export default function ReportsPage() {
  const t = useTranslations("Dashboard.reports");
  const tc = useTranslations("Dashboard.common");
  const [range, setRange] = useState(defaultRange);
  const [kpis, setKpis] = useState<ReportKPIs | null>(null);
  const [revenue, setRevenue] = useState<RevenueDay[]>([]);
  const [cleaners, setCleaners] = useState<CleanerPerfRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [k, r, c] = await Promise.all([
        getReportKPIs(range.from, range.to),
        getRevenueByDay(range.from, range.to),
        getCleanerPerformance(range.from, range.to),
      ]);
      setKpis(k);
      setRevenue(r);
      setCleaners(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to, t]);

  useEffect(() => {
    load();
  }, [load]);

  const cards = kpis
    ? [
        { label: t("revenue"), value: formatMoney(kpis.revenueCents) },
        { label: t("collected"), value: formatMoney(kpis.collectedCents) },
        { label: t("averageTicket"), value: formatMoney(kpis.avgTicketCents) },
        { label: t("jobs"), value: String(kpis.total) },
        { label: t("completed"), value: `${kpis.completed} (${kpis.completionRate}%)` },
        { label: t("cancelled"), value: `${kpis.cancelled} (${kpis.cancelRate}%)` },
        { label: t("noShows"), value: String(kpis.noShows) },
        { label: t("utilization"), value: `${kpis.utilizationPct}%` },
        { label: t("activeCleaners"), value: String(kpis.activeCleaners) },
        { label: t("customers"), value: String(kpis.totalCustomers) },
      ]
    : [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label>{t("from")}</Label>
            <Input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
          </div>
          <div>
            <Label>{tc("to")}</Label>
            <Input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
          </div>
          <Button onClick={load} disabled={loading}>{loading ? tc("loading") : tc("refresh")}</Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600">
          {error}
        </div>
      )}
        <MonthlySalesChart
            title={t("revenueByDay")}
            seriesName={t("revenue")}
            emptyMessage={t("noDataForPeriod")}
            data={revenue.map((d) => ({
                label: d.date.slice(5),
                value: (d.revenueCents || 0) / 100,
            }))}
            formatValue={(n) => formatMoney(Math.round(n * 100))}
            viewMoreHref={undefined}
            height={220}
        />

      <div className="my-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.02]"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{c.label}</p>
            <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <StatisticsChart
            title={t("revenueTrend")}
            subtitle={t("revenueTrendSubtitle")}
            emptyMessage={t("noStatisticsForRange")}
            categories={revenue.map((d) => d.date.slice(5))}
            series={[
              {
                name: t("revenue"),
                data: revenue.map((d) => (d.revenueCents || 0) / 100),
              },
            ]}
            formatY={(n) => formatMoney(Math.round(n * 100))}
            viewMoreHref={undefined}
          />
        </div>
        <MonthlyTarget
          title={t("completionRate")}
          progressPct={
            kpis
              ? kpis.completionRate <= 1
                ? kpis.completionRate * 100
                : kpis.completionRate
              : 0
          }
          targetLabel={t("completed")}
          targetValue={kpis ? String(kpis.completed) : "—"}
          revenueLabel={t("revenue")}
          revenueValue={kpis ? formatMoney(kpis.revenueCents) : "—"}
          todayLabel={t("utilization")}
          detailsLabel={tc("view")}
          todayValue={kpis ? `${Math.round(kpis.utilizationPct)}%` : "—"}
          viewMoreHref={undefined}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]">
        <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">{t("cleanerPerformance")}</h2>
        </div>
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("cleaner")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("jobs")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("completed")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("checkIns")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("revenue")}</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {cleaners.map((c) => (
                <TableRow key={c.cleanerId}>
                  <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">{c.name}</TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500">{c.jobs}</TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500">{c.completed}</TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500">{c.checkIns}</TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500">{formatMoney(c.revenueCents)}</TableCell>
                </TableRow>
              ))}
              {!loading && cleaners.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">
                    {t("noCleanerData")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
