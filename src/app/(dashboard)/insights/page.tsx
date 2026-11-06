"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { isoDateInTimeZone } from "@/app/services/currency";
import { getInsights, Insights } from "@/app/api/reports.api";
import { formatMoney } from "@/app/api/app-types";
import Button from "@/components/ui/button/Button";

function range(days: number) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: isoDateInTimeZone(from), to: isoDateInTimeZone(to) };
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.02]">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function Bars({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-32 items-end gap-1">
      {values.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${labels[i]}: ${v}`}>
          <div className="w-full rounded-t bg-brand-500/80" style={{ height: `${(v / max) * 100}%`, minHeight: v ? 2 : 0 }} />
          <span className="text-[10px] text-gray-400">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function InsightsPage() {
  const t = useTranslations("Dashboard.insights");
  const locale = useLocale();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const r = range(days);
        const d = await getInsights(r.from, r.to);
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : t("loadFailed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [days, t]);

  // 2024-01-07 is a Sunday, so index 0 = Sunday matches getUTCDay()
  const weekdayName = (i: number, style: "short" | "long" = "short") =>
    new Intl.DateTimeFormat(locale, { weekday: style, timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 7 + i)));
  const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];

  const finding = (f: { key: string; params: Record<string, string | number | null> }) => {
    const p = { ...f.params } as Record<string, string | number>;
    if (typeof p.weekday === "number") p.weekday = weekdayName(p.weekday, "long");
    return t(`findings.${f.key}` as "findings.UNASSIGNED", p);
  };

  const pct = (n: number | null) => (n == null ? "—" : `${n}%`);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <Button key={d} size="sm" variant={days === d ? "primary" : "outline"} onClick={() => setDays(d)}>
              {t("lastDays", { days: d })}
            </Button>
          ))}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      {loading && !data && <p className="text-sm text-gray-500">{t("loading")}</p>}

      {data && (
        <div className={loading ? "opacity-60" : ""}>
          {data.findings.length > 0 && (
            <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
              <h2 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">{t("standsOut")}</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
                {data.findings.map((f, i) => <li key={i}>{finding(f)}</li>)}
              </ul>
            </div>
          )}

          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              label={t("revenue")}
              value={formatMoney(data.revenueCents)}
              sub={data.revenueChangePct == null ? undefined : t("vsPrevious", { pct: `${data.revenueChangePct > 0 ? "+" : ""}${data.revenueChangePct}` })}
            />
            <Stat label={t("bookings")} value={String(data.bookings)} sub={t("avgBooking", { amount: formatMoney(data.avgBookingCents) })} />
            <Stat label={t("returning")} value={pct(data.customers.returningRate)} sub={t("customersSub", { newCount: data.customers.new, total: data.customers.total })} />
            <Stat label={t("cancelRate")} value={pct(data.cancelRate)} sub={t("recurringSub", { share: pct(data.recurringShare) })} />
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">{t("byWeekday")}</h2>
              <Bars values={weekdayOrder.map((i) => data.byWeekday[i].bookings)} labels={weekdayOrder.map((i) => weekdayName(i))} />
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">{t("byHour")}</h2>
              <Bars
                values={data.byHour.slice(6, 21)}
                labels={data.byHour.slice(6, 21).map((_, i) => String(i + 6))}
              />
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">{t("services")}</h2>
            {data.services.length === 0 ? (
              <p className="text-sm text-gray-500">{t("noData")}</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {data.services.map((s) => (
                  <li key={s.name} className="flex justify-between gap-3">
                    <span className="text-gray-700 dark:text-gray-300">{s.name} <span className="text-gray-400">· {s.bookings}</span></span>
                    <span className="font-medium text-gray-800 dark:text-white/90">{formatMoney(s.revenueCents)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-start text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="px-4 py-3 text-start font-medium">{t("cleaner")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("jobs")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("hours")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("revenue")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("rating")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("onTime")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.cleaners.length === 0 && (
                  <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={6}>{t("noData")}</td></tr>
                )}
                {data.cleaners.map((c) => (
                  <tr key={c.cleanerId}>
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">{c.name || "—"}</td>
                    <td className="px-4 py-3 text-end">{c.jobs}</td>
                    <td className="px-4 py-3 text-end">{c.hours}</td>
                    <td className="px-4 py-3 text-end">{formatMoney(c.revenueCents)}</td>
                    <td className="px-4 py-3 text-end">{c.avgRating == null ? "—" : `${c.avgRating} (${c.ratings})`}</td>
                    <td className="px-4 py-3 text-end">{pct(c.onTimeRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
