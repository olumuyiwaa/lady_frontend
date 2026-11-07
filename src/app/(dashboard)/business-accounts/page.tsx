"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  createB2BMember,
  downloadB2BQualityPdf,
  getB2BQuality,
  listB2BAccounts,
  listB2BLocations,
  listB2BMembers,
  updateB2BMember,
  type B2BAccountRow,
  type B2BQualityReport,
  type QualityFigures,
} from "@/app/api/b2bAccounts.api";
import type { CompanyMemberInput } from "@/app/api/portal.api";
import { MembersEditor } from "@/components/b2b/MembersEditor";

const input = "h-11 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white";

const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

type Sort = "company" | "rating" | "punctuality" | "checklist" | "complaints";

/** Numbers that should alert a manager: low punctuality or checklist, any complaint, poor rating. */
function tone(kind: "rating" | "pct" | "complaints", v: number | null) {
  if (v == null) return "text-gray-400";
  if (kind === "complaints") return v > 0 ? "font-semibold text-red-600 dark:text-red-400" : "";
  if (kind === "rating") return v < 4 ? "font-semibold text-red-600 dark:text-red-400" : "";
  return v < 80 ? "font-semibold text-red-600 dark:text-red-400" : "";
}

export default function BusinessAccountsPage() {
  const t = useTranslations("Dashboard.businessAccounts");
  const locale = useLocale();
  const [month, setMonth] = useState(thisMonth());
  const [rows, setRows] = useState<B2BAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState<Sort>("company");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [report, setReport] = useState<B2BQualityReport | null>(null);
  const [tab, setTab] = useState<"quality" | "team">("quality");
  const [busyPdf, setBusyPdf] = useState(false);

  const money = (cents: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(cents / 100);
  const pct = (v: number | null) => (v == null ? "–" : `${v.toLocaleString(locale)}%`);
  const rating = (v: number | null) => (v == null ? "–" : v.toLocaleString(locale, { maximumFractionDigits: 1 }));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows((await listB2BAccounts(month)).accounts);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("loadFailed"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [month, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    if (!openId) return;
    let live = true;
    getB2BQuality(openId, month)
      .then((r) => live && setReport(r))
      .catch((e: unknown) => live && setError(e instanceof Error ? e.message : t("loadFailed")));
    return () => {
      live = false;
    };
  }, [openId, month, t]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const list = rows.filter((r) => !needle || r.companyName.toLowerCase().includes(needle) || r.contactName.toLowerCase().includes(needle));
    // Worst first for the quality columns, since that is what a manager looks for.
    const key: Record<Exclude<Sort, "company">, (r: B2BAccountRow) => number> = {
      rating: (r) => r.quality.averageRating ?? 99,
      punctuality: (r) => r.quality.punctualityPct ?? 999,
      checklist: (r) => r.quality.checklistCompletionPct ?? 999,
      complaints: (r) => -r.quality.complaints,
    };
    return [...list].sort((a, b) => (sort === "company" ? a.companyName.localeCompare(b.companyName) : key[sort](a) - key[sort](b)));
  }, [rows, search, sort]);

  const open = openId ? rows.find((r) => r.customerId === openId) : null;

  const pdf = async () => {
    if (!open) return;
    setBusyPdf(true);
    setError("");
    try {
      const blob = await downloadB2BQualityPdf(open.customerId, month);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quality-${open.companyName.replace(/[^a-z0-9]+/gi, "-")}-${month}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("actionFailed"));
    } finally {
      setBusyPdf(false);
    }
  };

  const loadTeam = useCallback(async () => {
    const id = openId as string;
    const [members, locations] = await Promise.all([listB2BMembers(id), listB2BLocations(id)]);
    return { members, locations };
  }, [openId]);

  const qualityRow = (f: QualityFigures, bold = false) => (
    <tr key={f.key} className={bold ? "bg-gray-50 font-medium dark:bg-white/[0.03]" : ""}>
      <td className="px-4 py-2">{f.label}</td>
      <td className="px-4 py-2">{f.visits}</td>
      <td className={`px-4 py-2 ${tone("rating", f.averageRating)}`}>{rating(f.averageRating)}{f.ratingCount ? ` (${f.ratingCount})` : ""}</td>
      <td className={`px-4 py-2 ${tone("pct", f.checklistCompletionPct)}`}>{pct(f.checklistCompletionPct)}</td>
      <td className={`px-4 py-2 ${tone("pct", f.punctualityPct)}`}>{pct(f.punctualityPct)}</td>
      <td className={`px-4 py-2 ${tone("complaints", f.complaints)}`}>{f.complaints}</td>
    </tr>
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search")} aria-label={t("search")} className={input} />
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={input} aria-label={t("sortBy")}>
            {(["company", "rating", "punctuality", "checklist", "complaints"] as Sort[]).map((s) => (
              <option key={s} value={s}>{t(`sort.${s}`)}</option>
            ))}
          </select>
          <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className={input} aria-label={t("month")} />
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">{t("loading")}</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-gray-500">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3">{t("company")}</th>
                <th className="px-4 py-3">{t("branches")}</th>
                <th className="px-4 py-3">{t("visits")}</th>
                <th className="px-4 py-3">{t("rating")}</th>
                <th className="px-4 py-3">{t("checklist")}</th>
                <th className="px-4 py-3">{t("punctuality")}</th>
                <th className="px-4 py-3">{t("complaints")}</th>
                <th className="px-4 py-3">{t("spend")}</th>
                <th className="px-4 py-3">{t("overdue")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr
                  key={r.customerId}
                  onClick={() => {
                    setReport(null);
                    setTab("quality");
                    setOpenId(r.customerId === openId ? null : r.customerId);
                  }}
                  className={`cursor-pointer border-t border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5 ${r.customerId === openId ? "bg-brand-50/50 dark:bg-brand-500/10" : ""}`}
                >
                  <td className="px-4 py-3">
                    <button type="button" className="text-left font-medium text-gray-900 dark:text-white" aria-expanded={r.customerId === openId}>
                      {r.companyName}
                    </button>
                    <div className="text-xs text-gray-500">{r.contactName}</div>
                  </td>
                  <td className="px-4 py-3">{r.branchCount}</td>
                  <td className="px-4 py-3">{r.quality.visits}</td>
                  <td className={`px-4 py-3 ${tone("rating", r.quality.averageRating)}`}>{rating(r.quality.averageRating)}</td>
                  <td className={`px-4 py-3 ${tone("pct", r.quality.checklistCompletionPct)}`}>{pct(r.quality.checklistCompletionPct)}</td>
                  <td className={`px-4 py-3 ${tone("pct", r.quality.punctualityPct)}`}>{pct(r.quality.punctualityPct)}</td>
                  <td className={`px-4 py-3 ${tone("complaints", r.quality.complaints)}`}>{r.quality.complaints}</td>
                  <td className="px-4 py-3">{money(r.spendCents)}</td>
                  <td className="px-4 py-3">{r.overdueInvoices > 0 ? <span className="font-semibold text-red-600 dark:text-red-400">{r.overdueInvoices}</span> : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <section aria-label={open.companyName} className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{open.companyName}</h2>
              <p className="text-sm text-gray-500">{[open.contactName, open.email, open.phone].filter(Boolean).join(" · ")}</p>
            </div>
            <div className="flex gap-2">
              {(["quality", "team"] as const).map((k) => (
                <button key={k} type="button" onClick={() => setTab(k)} aria-pressed={tab === k} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === k ? "bg-brand-500 text-white" : "border border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300"}`}>
                  {k === "team" ? `${t("team")} (${open.memberCount})` : t("qualityTab")}
                </button>
              ))}
              {tab === "quality" && (
                <button type="button" onClick={pdf} disabled={busyPdf} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">
                  {t("downloadPdf")}
                </button>
              )}
            </div>
          </div>

          {tab === "quality" ? (
            report ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-500">
                      <th className="px-4 py-2">{t("branch")}</th>
                      <th className="px-4 py-2">{t("visits")}</th>
                      <th className="px-4 py-2">{t("rating")}</th>
                      <th className="px-4 py-2">{t("checklist")}</th>
                      <th className="px-4 py-2">{t("punctuality")}</th>
                      <th className="px-4 py-2">{t("complaints")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.branches.map((b) => qualityRow(b))}
                    {report.branches.length > 1 && qualityRow({ ...report.total, label: t("total") }, true)}
                  </tbody>
                </table>
                {report.branches.length === 0 && <p className="py-3 text-sm text-gray-500">{t("noVisits")}</p>}
                <p className="mt-2 text-xs text-gray-500">{t("graceNote", { minutes: report.graceMinutes })}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t("loading")}</p>
            )
          ) : (
            <MembersEditor
              key={openId}
              load={loadTeam}
              create={(i: CompanyMemberInput) => createB2BMember(open.customerId, i).then((r) => { load(); return r; })}
              update={(id: string, i: CompanyMemberInput) => updateB2BMember(open.customerId, id, i).then((r) => { load(); return r; })}
            />
          )}
        </section>
      )}
    </div>
  );
}
