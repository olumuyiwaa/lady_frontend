"use client";

import { isoDateInTimeZone } from "@/app/services/currency";
import { useEffect, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listDispatchItems, createAssignment, suggestCleaners, getCleanerDayRoute, DispatchAssignment, DayRoute } from "@/app/api/dispatch.api";
import { listBookings } from "@/app/api/bookings.api";
import { listCleaners } from "@/app/api/cleaners.api";
import { Booking, Cleaner, cleanerDisplayName } from "@/app/api/cleansera-types";

export default function DispatchPage() {
  const t = useTranslations("Dashboard.dispatch");
  const tc = useTranslations("Dashboard.common");
  const locale = useLocale();
  const [needsAssignment, setNeedsAssignment] = useState<Booking[]>([]);
  const [assignments, setAssignments] = useState<DispatchAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [suggestingFor, setSuggestingFor] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Cleaner[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);

  const [activeCleaners, setActiveCleaners] = useState<Cleaner[]>([]);
  const [routeCleanerId, setRouteCleanerId] = useState("");
  const [routeDate, setRouteDate] = useState(() => isoDateInTimeZone(new Date()));
  const [route, setRoute] = useState<DayRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");

  const checkRoute = async () => {
    if (!routeCleanerId) return;
    setRouteLoading(true);
    setRouteError("");
    setRoute(null);
    try {
      const r = await getCleanerDayRoute(routeCleanerId, routeDate);
      setRoute(r);
    } catch (err) {
      setRouteError(err instanceof Error ? err.message : t("routeCheckFailed"));
    } finally {
      setRouteLoading(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // "Needs assignment" = confirmed bookings with no cleaner yet.
      // "In progress" = existing assignments for jobs not yet completed.
      const [confirmed, assigned, inProgress, cleaners] = await Promise.all([
        listBookings("CONFIRMED"),
        listDispatchItems(),
        listBookings("IN_PROGRESS"),
        listCleaners("ACTIVE"),
      ]);
      setNeedsAssignment(confirmed);
      const activeAssignments = assigned.filter(
        (a) => a.booking?.status === "ASSIGNED" || a.booking?.status === "IN_PROGRESS"
      );
      setAssignments(activeAssignments.length ? activeAssignments : assigned);
      setActiveCleaners(cleaners);
      void inProgress; // already covered via assignments' nested booking.status
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const openSuggestions = async (bookingId: string) => {
    setError("");
    setSuggestingFor(bookingId);
    setSuggestions([]);
    try {
      const cleaners = await suggestCleaners(bookingId);
      setSuggestions(cleaners);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("suggestFailed"));
    }
  };

  const assign = async (bookingId: string, cleanerId?: string) => {
    setAssigning(bookingId);
    setError("");
    try {
      await createAssignment(bookingId, cleanerId);
      setSuggestingFor(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("assignFailed"));
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("subtitle")}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t("dayRoute")}
        </h2>
        <p className="mb-3 text-xs text-gray-400">
          {t("dayRouteHint")}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">{t("cleaner")}</label>
            <select
              value={routeCleanerId}
              onChange={(e) => setRouteCleanerId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
            >
              <option value="">{t("selectCleaner")}</option>
              {activeCleaners.map((c) => (
                <option key={c.id} value={c.id}>{cleanerDisplayName(c)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">{t("date")}</label>
            <input
              type="date"
              value={routeDate}
              onChange={(e) => setRouteDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
            />
          </div>
          <Button size="sm" onClick={checkRoute} disabled={!routeCleanerId || routeLoading}>
            {routeLoading ? t("checking") : t("checkRoute")}
          </Button>
        </div>

        {routeError && <p className="mt-3 text-sm text-error-500">{routeError}</p>}

        {route && (
          <div className="mt-4">
            {route.stops.length === 0 ? (
              <p className="text-sm text-gray-500">{t("noJobsForCleaner", { date: route.date })}</p>
            ) : (
              <ol className="space-y-2">
                {route.stops.map((stop, i) => {
                  const leg = route.legs[i - 1];
                  return (
                    <li key={stop.bookingId}>
                      {leg && (
                        <div
                          className={`ml-2 mb-2 border-l-2 pl-3 text-xs ${
                            leg.isTight
                              ? "border-error-400 text-error-500"
                              : "border-gray-200 text-gray-400 dark:border-gray-700"
                          }`}
                        >
                          {leg.distanceMeters != null
                            ? t("driveSummary", {
                                distance: (leg.distanceMeters / 1000).toFixed(1),
                                minutes: Math.round((leg.estimatedDriveSeconds || 0) / 60),
                              })
                            : t("distanceUnknown")}
                          {" — "}
                          {t("scheduledGap", { minutes: Math.round(leg.gapSeconds / 60) })}
                          {leg.isTight && ` — ${t("tightRoute")}`}
                        </div>
                      )}
                      <div className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-800">
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(stop.scheduledStart))}
                        </span>
                        <span className="ml-2 text-gray-500 dark:text-gray-400">{stop.address}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        )}
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {t("needsAssignmentCount", { count: needsAssignment.length })}
      </h2>
      <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("customer")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("service")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("scheduled")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("assign")}</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading && (
                <TableRow><TableCell className="px-5 py-6 text-center text-gray-500" colSpan={4}>{tc("loading")}</TableCell></TableRow>
              )}
              {!loading && needsAssignment.length === 0 && (
                <TableRow><TableCell className="px-5 py-6 text-center text-gray-500" colSpan={4}>{t("nothingWaiting")}</TableCell></TableRow>
              )}
              {!loading && needsAssignment.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                    {b.customer ? `${b.customer.firstName} ${b.customer.lastName}` : "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{b.service?.name || "—"}</TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(b.scheduledStart))}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    {suggestingFor === b.id ? (
                      <div className="space-y-2">
                        {suggestions.length === 0 ? (
                          <p className="text-xs text-gray-400">{t("noCleanersNearby")}</p>
                        ) : (
                          suggestions.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => assign(b.id, c.id)}
                              disabled={assigning === b.id}
                              className="block w-full rounded-md border border-gray-200 px-3 py-1.5 text-left text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
                            >
                              {cleanerDisplayName(c)}
                            </button>
                          ))
                        )}
                        <button onClick={() => setSuggestingFor(null)} className="text-xs text-gray-400 underline">{tc("cancel")}</button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <Button size="sm" onClick={() => openSuggestions(b.id)}>{t("suggestCleaner")}</Button>
                        <Button size="sm" variant="outline" disabled={assigning === b.id} onClick={() => assign(b.id)}>
                          {assigning === b.id ? t("assigning") : t("autoAssign")}
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {t("inProgressCount", { count: assignments.length })}
      </h2>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("customer")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("cleaner")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("scheduled")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{tc("status")}</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {!loading && assignments.length === 0 && (
                <TableRow><TableCell className="px-5 py-6 text-center text-gray-500" colSpan={4}>{t("noActiveJobs")}</TableCell></TableRow>
              )}
              {!loading && assignments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                    {a.booking?.customer ? `${a.booking.customer.firstName} ${a.booking.customer.lastName}` : "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {a.cleaner ? cleanerDisplayName(a.cleaner) : "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {a.booking ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(a.booking.scheduledStart)) : "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge color={a.booking?.status === "IN_PROGRESS" ? "warning" : "info"} size="sm">
                      {a.booking?.status || "ASSIGNED"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
