"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getPortalTimeline, type PortalTimeline, type TimelineStepKey } from "@/app/api/portal.api";

const POLL_MS = 20_000;
const FINAL: TimelineStepKey[] = ["COMPLETED", "CANCELLED"];

type Props = {
    slug: string;
    token: string;
    bookingId: string;
    /** Timeline that came with the booking detail. */
    initial?: PortalTimeline | null;
    /** Formats an ISO instant in the business's timezone. */
    formatTime: (iso: string) => string;
    onUnauthorized?: () => void;
};

/**
 * Vertical progress tracker for one booking. While the visit is still under
 * way it refreshes itself every 20 seconds (and not while the tab is hidden),
 * so a customer watching sees "On the way" and "Cleaner arrived" appear.
 */
export function BookingTimeline({ slug, token, bookingId, initial, formatTime, onUnauthorized }: Props) {
    const t = useTranslations("PortalHome.timeline");
    // Anything fetched here wins over the (older) one that came with the detail.
    const [fresh, setFresh] = useState<PortalTimeline | null>(null);
    const timeline = fresh ?? initial ?? null;
    const live = !!timeline && !FINAL.includes(timeline.current);

    useEffect(() => {
        if (!live) return;
        let stopped = false;
        const tick = async () => {
            if (document.hidden) return;
            try {
                const r = await getPortalTimeline(slug, token, bookingId);
                if (!stopped) setFresh({ steps: r.steps, current: r.current });
            } catch (e) {
                if ((e as { status?: number } | null)?.status === 401) onUnauthorized?.();
                /* any other failure: keep showing what we have */
            }
        };
        const id = window.setInterval(tick, POLL_MS);
        return () => {
            stopped = true;
            window.clearInterval(id);
        };
    }, [live, slug, token, bookingId, onUnauthorized]);

    if (!timeline || timeline.steps.length === 0) return null;

    return (
        <div className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{t("heading")}</p>
                {live && (
                    <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                        <span className="relative flex h-2 w-2" aria-hidden>
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        {t("live")}
                    </span>
                )}
            </div>
            <ol className="space-y-0" aria-label={t("heading")}>
                {timeline.steps.map((step, i) => {
                    const last = i === timeline.steps.length - 1;
                    const cancelled = step.key === "CANCELLED";
                    const dot =
                        step.state === "done"
                            ? cancelled
                                ? "border-gray-400 bg-gray-400 text-white"
                                : "border-brand-500 bg-brand-500 text-white"
                            : step.state === "current"
                              ? "border-brand-500 bg-white text-brand-500 dark:bg-gray-900"
                              : "border-gray-300 bg-white text-transparent dark:border-gray-600 dark:bg-gray-900";
                    return (
                        <li
                            key={step.key}
                            className="relative flex gap-3 pb-4 last:pb-0"
                            aria-current={step.state === "current" ? "step" : undefined}
                        >
                            {!last && (
                                <span
                                    aria-hidden
                                    className={`absolute left-[9px] top-5 h-[calc(100%-1.25rem)] w-0.5 ${
                                        step.state === "done" ? "bg-brand-500/60" : "bg-gray-200 dark:bg-gray-700"
                                    }`}
                                />
                            )}
                            <span
                                aria-hidden
                                className={`relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${dot}`}
                            >
                                {step.state === "done" ? (cancelled ? "×" : "✓") : step.state === "current" ? "•" : ""}
                            </span>
                            <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                                <span
                                    className={`text-sm ${
                                        step.state === "upcoming"
                                            ? "text-gray-400 dark:text-gray-500"
                                            : step.state === "current"
                                              ? "font-semibold text-gray-900 dark:text-white"
                                              : "text-gray-700 dark:text-gray-300"
                                    }`}
                                >
                                    {t(`steps.${step.key}` as "steps.BOOKED")}
                                </span>
                                {step.at && (
                                    <span className="shrink-0 tabular-nums text-xs text-gray-500 dark:text-gray-400">
                                        {formatTime(step.at)}
                                    </span>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
