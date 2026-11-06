"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  cancelReferralReward,
  forfeitPendingReward,
  getReferralSettings,
  getReferralStats,
  listReferrals,
  updateReferralSettings,
  type ReferralRow,
  type ReferralSettings,
  type ReferralStats,
} from "@/app/api/referrals.api";
import { formatMoney } from "@/components/booking/types";

const card = "rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]";
const input = "h-11 w-full rounded-lg border px-3 text-sm dark:border-gray-700 dark:bg-gray-800";
const toUnits = (cents: number) => (cents / 100).toFixed(2);
const toCents = (v: string) => Math.round(Number(v.replace(",", ".")) * 100);

export default function ReferralsPage() {
  const t = useTranslations("Dashboard.referrals");
  const tc = useTranslations("Dashboard.common");
  const locale = useLocale();

  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [flagged, setFlagged] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ enabled: true, give: "20.00", get: "20.00", days: "90", min: "0.00", hold: "0" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const PAGE_SIZE = 25;

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let stopped = false;
    (async () => {
      try {
        const [s, st, list] = await Promise.all([getReferralSettings(), getReferralStats(), listReferrals({ page, flagged })]);
        if (stopped) return;
        if (s.success) {
          const v = s.data as ReferralSettings;
          setForm({ enabled: v.enabled, give: toUnits(v.discountCents), get: toUnits(v.rewardCents), days: String(v.rewardValidDays), min: toUnits(v.minBookingCents), hold: String(v.holdDays ?? 0) });
        }
        if (st.success) setStats(st.data as ReferralStats);
        if (list.success) {
          setRows((list.data as { data: ReferralRow[] }).data ?? []);
          setTotal((list.data as { pagination?: { total: number } }).pagination?.total ?? 0);
        }
        setError("");
      } catch (e) {
        if (!stopped) setError(e instanceof Error ? e.message : tc("errorGeneric"));
      }
    })();
    return () => {
      stopped = true;
    };
  }, [page, flagged, reloadKey, tc]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await updateReferralSettings({
        enabled: form.enabled,
        discountCents: toCents(form.give),
        rewardCents: toCents(form.get),
        rewardValidDays: Number(form.days),
        minBookingCents: toCents(form.min),
        holdDays: Number(form.hold),
      });
      if (!res.success) throw new Error(res.message || tc("errorGeneric"));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("errorGeneric"));
    } finally {
      setSaving(false);
    }
  };

  const cancelReward = async (couponId: string) => {
    if (!confirm(t("cancelConfirm"))) return;
    try {
      const res = await cancelReferralReward(couponId);
      if (!res.success) throw new Error(res.message || tc("errorGeneric"));
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("errorGeneric"));
    }
  };

  const forfeit = async (bookingId: string) => {
    if (!confirm(t("forfeitConfirm"))) return;
    try {
      const res = await forfeitPendingReward(bookingId);
      if (!res.success) throw new Error(res.message || tc("errorGeneric"));
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("errorGeneric"));
    }
  };

  const date = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const statCards = stats
    ? [
        { label: t("stats.referrals"), value: String(stats.referrals) },
        { label: t("stats.completed"), value: String(stats.completed) },
        { label: t("stats.discountGiven"), value: formatMoney(stats.discountGivenCents) },
        { label: t("stats.rewardsPending"), value: formatMoney(stats.rewardsPendingCents) },
        { label: t("stats.rewardsOutstanding"), value: formatMoney(stats.rewardsOutstandingCents) },
        { label: t("stats.rewardsUsed"), value: formatMoney(stats.rewardsUsedCents) },
      ]
    : [];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-500/10">{error}</p>}

      {stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          {statCards.map((c) => (
            <div key={c.label} className={card}>
              <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
              <p className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={save} className={`${card} space-y-4`}>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t("settings.title")}</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
          {t("settings.enabled")}
        </label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(
            [
              ["give", t("settings.give"), "decimal"],
              ["get", t("settings.get"), "decimal"],
              ["days", t("settings.days"), "numeric"],
              ["min", t("settings.min"), "decimal"],
              ["hold", t("settings.hold"), "numeric"],
            ] as const
          ).map(([key, label, mode]) => (
            <label key={key} className="text-xs text-gray-600 dark:text-gray-300">
              {label}
              <input
                inputMode={mode}
                value={form[key]}
                disabled={!form.enabled}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className={`${input} mt-1`}
              />
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500">{t("settings.hint")}</p>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">
            {tc("save")}
          </button>
          {saved && <span className="text-sm text-emerald-600">{t("settings.saved")}</span>}
        </div>
      </form>

      <section className={card}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t("list.title")}</h2>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={flagged}
              onChange={(e) => {
                setPage(1);
                setFlagged(e.target.checked);
              }}
            />
            {t("list.flaggedOnly")}
          </label>
        </div>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">{t("list.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-2 pr-3">{t("list.date")}</th>
                  <th className="py-2 pr-3">{t("list.referrer")}</th>
                  <th className="py-2 pr-3">{t("list.friend")}</th>
                  <th className="py-2 pr-3">{t("list.discount")}</th>
                  <th className="py-2 pr-3">{t("list.reward")}</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {rows.map((r) => (
                  <tr key={r.bookingId}>
                    <td className="py-2 pr-3 whitespace-nowrap">{date(r.createdAt)}</td>
                    <td className="py-2 pr-3">
                      {r.referrer.name || "—"}
                      {r.flags.includes("HIGH_VOLUME") && (
                        <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                          {t("list.highVolume")}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {r.referredCustomer.name || "—"}
                      {r.bookingStatus === "CANCELLED" && <span className="ml-2 text-xs text-gray-400">({t("list.cancelled")})</span>}
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{formatMoney(r.discountCents)}</td>
                    <td className="py-2 pr-3">
                      {r.reward ? (
                        <span>
                          {formatMoney(r.reward.valueCents)} ·{" "}
                          {r.reward.status === "PENDING"
                            ? t(r.reward.waitingFor === "HOLD" ? "rewardStatus.PENDING_HOLD" : "rewardStatus.PENDING_VISIT")
                            : t(`rewardStatus.${r.reward.status}`)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {r.reward?.status === "AVAILABLE" && r.reward.couponId && (
                        <button type="button" onClick={() => cancelReward(r.reward!.couponId!)} className="text-xs font-medium text-red-600 hover:underline">
                          {t("list.cancelReward")}
                        </button>
                      )}
                      {r.reward?.status === "PENDING" && (
                        <button type="button" onClick={() => forfeit(r.bookingId)} className="text-xs font-medium text-red-600 hover:underline">
                          {t("list.forfeitReward")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="mt-3 flex items-center justify-end gap-2 text-sm">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border px-3 py-1 disabled:opacity-40">
              ‹
            </button>
            <span>
              {page} / {pages}
            </span>
            <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded-lg border px-3 py-1 disabled:opacity-40">
              ›
            </button>
          </div>
        )}
      </section>

      {stats && stats.topReferrers.length > 0 && (
        <section className={card}>
          <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">{t("top.title")}</h2>
          <ul className="space-y-1 text-sm">
            {stats.topReferrers.map((r) => (
              <li key={r.customerId} className="flex justify-between">
                <span>{r.name || "—"}</span>
                <span className="tabular-nums text-gray-500">{t("top.count", { count: r.count })}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
