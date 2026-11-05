"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getLiveBoard, type LiveBoard, type LiveCleanerState } from "@/app/api/dispatch.api";

const LiveMapCanvas = dynamic(() => import("./LiveMapCanvas"), {
  ssr: false,
  loading: () => <div className="h-[560px] w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />,
});

const POLL_MS = 15_000;
const DOT: Record<LiveCleanerState, string> = {
  ON_JOB: "bg-emerald-500",
  EN_ROUTE: "bg-amber-500",
  NEXT_UP: "bg-blue-500",
  IDLE: "bg-gray-400",
};

export default function LiveMapPage() {
  const t = useTranslations("Dashboard.liveMap");
  const locale = useLocale();
  const [board, setBoard] = useState<LiveBoard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setBoard(await getLiveBoard());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loadFailed"));
    }
  }, [t]);

  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      if (stopped || document.hidden) return;
      await refresh();
    };
    void tick();
    const id = window.setInterval(tick, POLL_MS);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [refresh]);

  const labels = useMemo(() => ({ stale: t("positionOld"), unassigned: t("unassigned") }), [t]);
  const time = (iso: string) => new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(new Date(iso));
  const unassigned = board?.jobs.filter((j) => j.unassigned) ?? [];

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
      </div>
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-500/10">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">{t("cleaners")}</h2>
            {!board || board.cleaners.length === 0 ? (
              <p className="text-sm text-gray-400">{t("noCleaners")}</p>
            ) : (
              <ul className="space-y-1">
                {board.cleaners.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelected(c.id === selected ? null : c.id)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-white/5 ${
                        c.id === selected ? "bg-gray-50 dark:bg-white/5" : ""
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[c.state]}`} aria-hidden />
                        <span className="font-medium text-gray-800 dark:text-white/90">{c.name || "—"}</span>
                        <span className="ml-auto text-xs text-gray-500">{t(`state.${c.state}`)}</span>
                      </span>
                      {c.job && (
                        <span className="mt-0.5 block truncate pl-4 text-xs text-gray-500 dark:text-gray-400">
                          {time(c.job.scheduledStart)} · {c.job.address}
                        </span>
                      )}
                      {c.latitude == null ? (
                        <span className="block pl-4 text-[11px] text-gray-400">{t("noPosition")}</span>
                      ) : c.stale ? (
                        <span className="block pl-4 text-[11px] text-gray-400">{t("positionOld")}</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
              {t("unassignedHeading", { count: unassigned.length })}
            </h2>
            {unassigned.length === 0 ? (
              <p className="text-sm text-gray-400">{t("allAssigned")}</p>
            ) : (
              <ul className="space-y-2">
                {unassigned.map((j) => (
                  <li key={j.bookingId} className="text-xs text-gray-600 dark:text-gray-300">
                    <span className="font-medium">{time(j.scheduledStart)}</span> · {j.customerName} · {j.address}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        <LiveMapCanvas board={board} selectedCleanerId={selected} labels={labels} />
      </div>
    </div>
  );
}
