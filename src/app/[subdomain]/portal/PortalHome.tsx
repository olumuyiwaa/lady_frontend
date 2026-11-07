"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
    getPortalOverview,
    getPortalReferral,
    listPortalCleaners,
    setPortalPreferredCleaner,
    type PortalBooking,
    type PortalCleaners,
    type PortalOverview,
    type PortalReferral,
} from "@/app/api/portal.api";
import { referralLink } from "@/lib/referral";
import { cleanerName } from "./portalSession";
import { B2BPanel } from "./B2BPanel";
import { PortalPreferencesCard } from "./PortalPreferencesCard";

type Props = {
    slug: string;
    token: string;
    businessName: string;
    money: (cents: number) => string;
    formatWhen: (iso: string) => string;
    formatDate: (iso: string) => string;
    onBook: () => void;
    onOpenBooking: (b: PortalBooking) => void;
    onUnauthorized: () => void;
    /** Bump to reload (e.g. after a booking is made or cancelled). */
    refreshKey?: string | number;
};

const card =
    "flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 dark:bg-white/[0.04] dark:ring-white/10";
const cardTitle = "text-xs font-semibold uppercase tracking-widest text-brand-500 dark:text-brand-400";

/**
 * Home panel of the customer portal: the next visit, the "Give €20, Get €20"
 * referral card (with earned rewards) and the preferred-cleaner picker.
 */
export function PortalHome({
    slug,
    token,
    businessName,
    money,
    formatWhen,
    formatDate,
    onBook,
    onOpenBooking,
    onUnauthorized,
    refreshKey = 0,
}: Props) {
    const t = useTranslations("PortalHome");
    const [overview, setOverview] = useState<PortalOverview | null>(null);
    const [referral, setReferral] = useState<PortalReferral | null>(null);
    const [cleaners, setCleaners] = useState<PortalCleaners | null>(null);
    const [failed, setFailed] = useState(false);

    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [prefError, setPrefError] = useState("");
    const mounted = useRef(true);

    const handleError = useCallback(
        (e: unknown) => {
            if ((e as { status?: number } | null)?.status === 401) onUnauthorized();
        },
        [onUnauthorized]
    );

    useEffect(() => {
        mounted.current = true;
        (async () => {
            try {
                const [o, r, c] = await Promise.all([
                    getPortalOverview(slug, token),
                    getPortalReferral(slug, token),
                    listPortalCleaners(slug, token),
                ]);
                if (!mounted.current) return;
                setOverview(o);
                setReferral(r);
                setCleaners(c);
                setFailed(false);
            } catch (e) {
                handleError(e);
                if (mounted.current) setFailed(true);
            }
        })();
        return () => {
            mounted.current = false;
        };
    }, [slug, token, refreshKey, handleError]);

    if (failed && !overview) return null; // the bookings list below still works without the extras
    if (!overview || !referral || !cleaners) {
        return (
            <div className="grid gap-4 lg:grid-cols-3" aria-hidden>
                {[0, 1, 2].map((i) => (
                    <div key={i} className="h-44 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
                ))}
            </div>
        );
    }

    const next = overview.nextBooking;
    const cleaner = next ? cleanerName(next) : null;
    const link = referralLink(referral.code);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(link);
        } catch {
            // Clipboard API blocked (insecure context / permissions): fall back to a temp textarea.
            const ta = document.createElement("textarea");
            ta.value = link;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand("copy");
            } catch {
                /* nothing more we can do */
            }
            document.body.removeChild(ta);
        }
        setCopied(true);
        window.setTimeout(() => mounted.current && setCopied(false), 2000);
    };

    const share = async () => {
        const message = t("referral.shareMessage", {
            business: businessName,
            give: money(referral.giveCents),
            link,
        });
        if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
            try {
                await navigator.share({ title: businessName, text: message, url: link });
                return;
            } catch (e) {
                if ((e as { name?: string } | null)?.name === "AbortError") return;
            }
        }
        void copyLink();
    };

    const choose = async (value: string) => {
        setSaving(true);
        setSaved(false);
        setPrefError("");
        try {
            const updated = await setPortalPreferredCleaner(slug, token, value || null);
            if (!mounted.current) return;
            setCleaners(updated);
            setSaved(true);
            window.setTimeout(() => mounted.current && setSaved(false), 2500);
        } catch (e) {
            handleError(e);
            setPrefError(e instanceof Error && e.message ? e.message : t("preferred.saveFailed"));
        } finally {
            if (mounted.current) setSaving(false);
        }
    };

    const availableRewards = referral.rewards.filter((r) => r.status === "AVAILABLE");

    return (
        <div className="space-y-4">
        {overview.company && (
            <B2BPanel slug={slug} token={token} companyName={overview.company.name} money={money} onUnauthorized={onUnauthorized} />
        )}
        <section aria-label={t("heading")} className="grid gap-4 lg:grid-cols-3">
            {/* Next visit */}
            <div className={card}>
                <p className={cardTitle}>{t("next.title")}</p>
                {next ? (
                    <>
                        <p className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
                            {formatWhen(next.scheduledStart)}
                        </p>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            {next.service?.name}
                            {cleaner ? ` · ${t("next.with", { name: cleaner })}` : ` · ${t("next.cleanerTbd")}`}
                        </p>
                        {overview.unreadMessages > 0 && (
                            <p className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                                <span aria-hidden>●</span> {t("next.unread", { count: overview.unreadMessages })}
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={() => onOpenBooking(next)}
                            className="mt-auto pt-4 text-left text-sm font-semibold text-brand-500 hover:underline dark:text-brand-400"
                        >
                            {t("next.view")} →
                        </button>
                    </>
                ) : (
                    <>
                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t("next.none")}</p>
                        <button
                            type="button"
                            onClick={onBook}
                            className="mt-auto w-fit rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
                        >
                            {t("next.book")}
                        </button>
                    </>
                )}
            </div>

            {/* Referral (hidden when the business has switched it off) */}
            {referral.enabled && (
            <div className={card}>
                <p className={cardTitle}>
                    {t("referral.title", { give: money(referral.giveCents), get: money(referral.getCents) })}
                </p>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                    {t("referral.description", { give: money(referral.giveCents), get: money(referral.getCents) })}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/5">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{t("referral.yourCode")}</span>
                    <span className="font-mono text-base font-bold tracking-widest text-gray-900 dark:text-white">
                        {referral.code}
                    </span>
                </div>
                <div className="mt-3 flex gap-2">
                    <button
                        type="button"
                        onClick={copyLink}
                        className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
                    >
                        {copied ? t("referral.copied") : t("referral.copy")}
                    </button>
                    <button
                        type="button"
                        onClick={share}
                        className="flex-1 rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600"
                    >
                        {t("referral.share")}
                    </button>
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
                    {referral.friendsBooked > 0
                        ? t("referral.friends", { count: referral.friendsBooked })
                        : t("referral.noFriends")}
                </p>
                {referral.pendingCents > 0 && (
                    <p className="mt-1 text-xs font-medium text-brand-500 dark:text-brand-400">
                        {t("referral.pending", { amount: money(referral.pendingCents) })}
                    </p>
                )}
                {referral.rewards.length > 0 && (
                    <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                        <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t("referral.rewards", { count: availableRewards.length })}
                        </p>
                        <ul className="space-y-1.5">
                            {referral.rewards.slice(0, 4).map((r) => (
                                <li key={r.code} className="flex items-center justify-between gap-2 text-sm">
                                    <span>
                                        <span className="font-mono font-semibold tracking-wide text-gray-900 dark:text-white">
                                            {r.code}
                                        </span>{" "}
                                        <span className="text-gray-500 dark:text-gray-400">· {money(r.valueCents)}</span>
                                    </span>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                            r.status === "AVAILABLE"
                                                ? "bg-emerald-100 text-emerald-800"
                                                : "bg-gray-100 text-gray-600"
                                        }`}
                                        title={r.expiresAt && r.status === "AVAILABLE" ? t("referral.expires", { date: formatDate(r.expiresAt) }) : undefined}
                                    >
                                        {t(`referral.status.${r.status}` as "referral.status.USED")}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            )}

            {/* Preferred cleaner */}
            <div className={card}>
                <p className={cardTitle}>{t("preferred.title")}</p>
                {cleaners.cleaners.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t("preferred.empty")}</p>
                ) : (
                    <>
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{t("preferred.description")}</p>
                        <label htmlFor="preferred-cleaner" className="sr-only">
                            {t("preferred.title")}
                        </label>
                        <select
                            id="preferred-cleaner"
                            value={cleaners.preferredCleanerId ?? ""}
                            disabled={saving}
                            onChange={(e) => void choose(e.target.value)}
                            className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        >
                            <option value="">{t("preferred.none")}</option>
                            {cleaners.cleaners.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} · {t("preferred.visits", { count: c.jobs })}
                                </option>
                            ))}
                        </select>
                        <p className="mt-2 min-h-[1rem] text-xs" aria-live="polite">
                            {prefError ? (
                                <span className="text-red-600">{prefError}</span>
                            ) : saved ? (
                                <span className="text-emerald-600">{t("preferred.saved")}</span>
                            ) : (
                                <span className="text-gray-400">{t("preferred.note")}</span>
                            )}
                        </p>
                    </>
                )}
            </div>
        </section>
        {overview.preferences && (
            <PortalPreferencesCard slug={slug} token={token} initial={overview.preferences} onUnauthorized={onUnauthorized} />
        )}
        </div>
    );
}
