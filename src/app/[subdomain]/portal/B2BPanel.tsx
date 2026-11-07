"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { fetchPortalB2BBlob, fetchPortalB2BFile, getPortalB2BSummary, type B2BSummary } from "@/app/api/portal.api";

type Props = {
    slug: string;
    token: string;
    companyName: string;
    money: (cents: number) => string;
    onUnauthorized: () => void;
    /** Branch manager: their locations only, and no company statement. */
    limited?: boolean;
};

const card = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 dark:bg-white/[0.04] dark:ring-white/10";
const cardTitle = "text-xs font-semibold uppercase tracking-widest text-brand-500 dark:text-brand-400";

function shiftMonth(month: string, delta: number) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Business view of the portal: spend per month, per location and service, open invoices and exports. */
export function B2BPanel({ slug, token, companyName, money, onUnauthorized, limited = false }: Props) {
    const t = useTranslations("PortalHome.b2b");
    const locale = useLocale();
    const [month, setMonth] = useState<string | undefined>(undefined);
    const [data, setData] = useState<B2BSummary | null>(null);
    const [failed, setFailed] = useState(false);
    const [busy, setBusy] = useState<"csv" | "statement" | "quality" | null>(null);

    useEffect(() => {
        let stopped = false;
        (async () => {
            try {
                const r = await getPortalB2BSummary(slug, token, month);
                if (stopped) return;
                setData(r);
                setFailed(false);
            } catch (e) {
                if ((e as { status?: number } | null)?.status === 401) onUnauthorized();
                if (!stopped) setFailed(true);
            }
        })();
        return () => {
            stopped = true;
        };
    }, [slug, token, month, onUnauthorized]);

    const current = data?.month ?? month;
    const monthLabel = useMemo(() => {
        if (!current) return "";
        const [y, m] = current.split("-").map(Number);
        return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
    }, [current, locale]);

    if (failed && !data) return null;
    if (!data) return <div className="h-48 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" aria-hidden />;

    const delta = data.spendCents - data.previousSpendCents;

    const download = async () => {
        if (busy) return;
        setBusy("csv");
        try {
            const csv = await fetchPortalB2BFile(slug, token, `/b2b/export.csv?month=${data.month}`, "text/csv");
            const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = `visits-${data.month}.csv`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 10_000);
        } catch (e) {
            if ((e as { status?: number } | null)?.status === 401) onUnauthorized();
        } finally {
            setBusy(null);
        }
    };

    const downloadQuality = async () => {
        if (busy) return;
        setBusy("quality");
        try {
            const blob = await fetchPortalB2BBlob(slug, token, `/b2b/quality.pdf?month=${data.month}`);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `quality-${data.month}.pdf`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 10_000);
        } catch (e) {
            if ((e as { status?: number } | null)?.status === 401) onUnauthorized();
        } finally {
            setBusy(null);
        }
    };

    const openStatement = async () => {
        if (busy) return;
        const win = window.open("about:blank", "_blank");
        setBusy("statement");
        try {
            const html = await fetchPortalB2BFile(slug, token, `/b2b/statement/html?month=${data.month}`, "text/html");
            const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
            if (win) win.location.href = url;
            else window.location.href = url;
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (e) {
            win?.close();
            if ((e as { status?: number } | null)?.status === 401) onUnauthorized();
        } finally {
            setBusy(null);
        }
    };

    const stat = (label: string, value: string, tone?: "warn") => (
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className={`mt-0.5 text-xl font-bold tabular-nums ${tone === "warn" ? "text-red-600" : "text-gray-900 dark:text-white"}`}>{value}</p>
        </div>
    );

    return (
        <section aria-label={t("heading")} className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className={cardTitle}>{t("heading")}</p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{companyName}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" aria-label={t("previousMonth")} onClick={() => setMonth(shiftMonth(data.month, -1))} className="rounded-lg border border-gray-200 px-2.5 py-1 text-sm dark:border-gray-700">
                        ‹
                    </button>
                    <span className="min-w-32 text-center text-sm font-medium capitalize text-gray-800 dark:text-white">{monthLabel}</span>
                    <button type="button" aria-label={t("nextMonth")} onClick={() => setMonth(shiftMonth(data.month, 1))} className="rounded-lg border border-gray-200 px-2.5 py-1 text-sm dark:border-gray-700">
                        ›
                    </button>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                {stat(t("spend"), money(data.spendCents))}
                {stat(t("visits"), String(data.visits))}
                {stat(t("hours"), `${data.hours} h`)}
                {stat(t("outstanding"), money(data.invoices.openCents))}
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {data.previousSpendCents > 0 || data.spendCents > 0
                    ? t("vsLastMonth", { amount: `${delta >= 0 ? "+" : "−"}${money(Math.abs(delta))}` })
                    : t("noVisits")}
                {data.invoices.overdueCount > 0 && (
                    <span className="ml-3 font-medium text-red-600">{t("overdue", { count: data.invoices.overdueCount, amount: money(data.invoices.overdueCents) })}</span>
                )}
                {data.company.paymentTermsDays ? <span className="ml-3">{t("terms", { days: data.company.paymentTermsDays })}</span> : null}
            </p>

            {data.locations.length > 0 && (
                <div className="mt-6">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">{t("byLocation")}</p>
                    <ul className="divide-y divide-gray-100 dark:divide-white/10">
                        {data.locations.map((l) => (
                            <li key={l.key} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                                <span className="min-w-0 truncate text-gray-800 dark:text-gray-200">{l.label}</span>
                                <span className="shrink-0 tabular-nums text-gray-500 dark:text-gray-400">
                                    {t("locationLine", { visits: l.visits, amount: money(l.spendCents) })}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {data.services.length > 0 && (
                <div className="mt-5">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">{t("byService")}</p>
                    <ul className="flex flex-wrap gap-2">
                        {data.services.map((s) => (
                            <li key={s.name} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 dark:bg-white/10 dark:text-gray-300">
                                {s.name} · {s.visits}× · {money(s.spendCents)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
                {!limited && <button type="button" onClick={openStatement} disabled={busy !== null} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">
                    {t("statement")}
                </button>}
                <button type="button" onClick={download} disabled={busy !== null} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">
                    {t("exportCsv")}
                </button>
                <button type="button" onClick={downloadQuality} disabled={busy !== null} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">
                    {t("qualityReport")}
                </button>
            </div>
        </section>
    );
}
