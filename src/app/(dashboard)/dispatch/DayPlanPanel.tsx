"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import { isoDateInTimeZone } from "@/app/services/currency";
import { applyDayPlan, getDayPlan, DayPlan } from "@/app/api/dispatch.api";

/** Proposes the lowest-driving assignment of a day's open jobs; nothing changes until Apply. */
export default function DayPlanPanel({ onApplied }: { onApplied: () => void }) {
  const t = useTranslations("Dashboard.dispatch.plan");
  const locale = useLocale();
  const [date, setDate] = useState(() => isoDateInTimeZone(new Date()));
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const time = (iso: string) => new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

  const build = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    setPlan(null);
    try {
      setPlan(await getDayPlan(date));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    if (!plan || plan.assignments.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const r = await applyDayPlan(plan.assignments.map((a) => ({ bookingId: a.bookingId, cleanerId: a.cleanerId })));
      setNotice(t("applied", { applied: r.applied, failed: r.failed }));
      setPlan(null);
      onApplied();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("applyFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.02]">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("title")}</h2>
      <p className="mb-3 text-xs text-gray-400">{t("hint")}</p>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">{t("date")}</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
          />
        </div>
        <Button size="sm" onClick={build} disabled={busy || !date}>{busy && !plan ? t("planning") : t("build")}</Button>
      </div>

      {error && <p className="mt-3 text-sm text-error-500">{error}</p>}
      {notice && <p className="mt-3 text-sm text-success-600">{notice}</p>}

      {plan && (
        <div className="mt-4">
          {plan.jobs === 0 ? (
            <p className="text-sm text-gray-500">{t("none", { date: plan.date })}</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">
                {t("summary", { count: plan.assignments.length, total: plan.jobs, km: plan.totalKm.toFixed(1) })}
                {plan.savedKm > 0 && <span className="ml-1 font-medium text-success-600"> {t("saved", { km: plan.savedKm.toFixed(1) })}</span>}
              </p>
              <ul className="space-y-2">
                {plan.assignments.map((a) => (
                  <li key={a.bookingId} className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-800">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        <span className="font-medium text-gray-800 dark:text-white/90">{time(a.scheduledStart)}–{time(a.scheduledEnd)}</span>
                        <span className="ml-2 text-gray-500 dark:text-gray-400">{a.customerName || "—"} · {a.address}</span>
                      </span>
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                        {a.cleanerName}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      {a.addedKm == null ? t("distanceUnknown") : t("added", { km: a.addedKm.toFixed(1) })}
                      {a.approximate && ` · ${t("approximate")}`}
                    </p>
                  </li>
                ))}
              </ul>
              {plan.unassigned.length > 0 && (
                <div className="mt-3 rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400">
                  <p className="font-medium">{t("couldNotPlace", { count: plan.unassigned.length })}</p>
                  <ul className="mt-1 list-disc pl-4">
                    {plan.unassigned.map((u) => (
                      <li key={u.bookingId}>{time(u.scheduledStart)} · {u.customerName || "—"} · {u.address}</li>
                    ))}
                  </ul>
                </div>
              )}
              {plan.assignments.length > 0 && (
                <div className="mt-4">
                  <Button size="sm" onClick={apply} disabled={busy}>{busy ? t("applying") : t("apply", { count: plan.assignments.length })}</Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
