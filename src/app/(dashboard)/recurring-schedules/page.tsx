"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
    listRecurringSchedules,
    createRecurringSchedule,
    cancelRecurringSchedule,
    pauseRecurringSchedule,
    resumeRecurringSchedule,
} from "@/app/api/bookings.api";
import { listCustomersForBooking } from "@/app/api/customers.api";
import { listServices } from "@/app/api/services.api";
import RowActionsMenu from "@/components/tables/RowActionsMenu";
import {
    RecurringSchedule,
    RecurrenceFrequency,
    Customer,
    Service,
} from "@/app/api/cleansera-types";

export default function RecurringSchedulesPage() {
  const t = useTranslations("Dashboard.recurringSchedules");
  const tc = useTranslations("Dashboard.common");
    const locale = useLocale();
    const [schedules, setSchedules] = useState<RecurringSchedule[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        customerId: "",
        serviceId: "",
        frequency: "WEEKLY" as RecurrenceFrequency,
        dayOfWeek: 1,
        startTime: "09:00",
    });

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [s, c, sv] = await Promise.all([
                listRecurringSchedules(),
                listCustomersForBooking(),
                listServices(),
            ]);
            setSchedules(s || []);
            setCustomers(c || []);
            setServices(sv || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : t("loadFailed"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        load();
    }, [load]);

    const onCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.customerId || !form.serviceId) return;
        setError("");
        try {
            await createRecurringSchedule(form);
            setForm({
                customerId: "",
                serviceId: "",
                frequency: "WEEKLY",
                dayOfWeek: 1,
                startTime: "09:00",
            });
            setShowForm(false);
            load();
        } catch (e) {
            setError(e instanceof Error ? e.message : t("createFailed"));
        }
    };

    const withBusy = async (id: string, fn: () => Promise<unknown>) => {
        setBusyId(id);
        setError("");
        try {
            await fn();
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : t("actionFailed"));
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
                        {t("title")}</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {t("subtitle")}
                    </p>
                </div>
                <button
                    onClick={() => setShowForm((v) => !v)}
                    className="h-10 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white dark:bg-white/10"
                >
                    {showForm ? tc("cancel") : t("new")}
                </button>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                </div>
            )}

            {showForm && (
                <form
                    onSubmit={onCreate}
                    className="grid gap-3 rounded-2xl border p-5 sm:grid-cols-5 dark:border-gray-800"
                >
                    <select
                        required
                        value={form.customerId}
                        onChange={(e) =>
                            setForm({ ...form, customerId: e.target.value })
                        }
                        className="h-11 rounded-lg border px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                    >
                        <option value="">{t("customerPlaceholder")}</option>
                        {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.firstName} {c.lastName}
                            </option>
                        ))}
                    </select>
                    <select
                        required
                        value={form.serviceId}
                        onChange={(e) =>
                            setForm({ ...form, serviceId: e.target.value })
                        }
                        className="h-11 rounded-lg border px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                    >
                        <option value="">{t("servicePlaceholder")}</option>
                        {services.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={form.frequency}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                frequency: e.target.value as RecurrenceFrequency,
                            })
                        }
                        className="h-11 rounded-lg border px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                    >
                        <option value="WEEKLY">{t("weekly")}</option>
                        <option value="BIWEEKLY">{t("biweekly")}</option>
                        <option value="MONTHLY">{t("monthly")}</option>
                    </select>
                    <select
                        value={form.dayOfWeek}
                        onChange={(e) =>
                            setForm({ ...form, dayOfWeek: Number(e.target.value) })
                        }
                        className="h-11 rounded-lg border px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                    >
                        {Array.from({ length: 7 }, (_, i) => (
                            <option key={i} value={i}>
                                {new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2023, 0, i + 1)))}
                            </option>
                        ))}
                    </select>
                    <input
                        type="time"
                        required
                        value={form.startTime}
                        onChange={(e) =>
                            setForm({ ...form, startTime: e.target.value })
                        }
                        className="h-11 rounded-lg border px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                    />
                    <button
                        type="submit"
                        className="col-span-full h-11 rounded-lg bg-gray-900 text-sm font-medium text-white dark:bg-white/10"
                    >
                        {t("createSchedule")}
                    </button>
                </form>
            )}

            <div className="overflow-x-auto rounded-2xl border dark:border-gray-800">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 dark:bg-white/5">
                        <tr>
                            <th className="p-3">{t("customer")}</th>
                            <th className="p-3">{t("service")}</th>
                            <th className="p-3">{t("cadence")}</th>
                            <th className="p-3">{t("nextRun")}</th>
                            <th className="p-3">{t("status")}</th>
                            <th className="p-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={6} className="p-4 text-center text-gray-400">
                                    {tc("loading")}
                                </td>
                            </tr>
                        )}
                        {!loading && schedules.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-4 text-center text-gray-400">
                                    {t("empty")}
                                </td>
                            </tr>
                        )}
                        {schedules.map((s) => (
                            <tr
                                key={s.id}
                                className="border-t dark:border-gray-800"
                            >
                                <td className="p-3">
                                    {s.customer
                                        ? `${s.customer.firstName} ${s.customer.lastName}`
                                        : s.customerId}
                                </td>
                                <td className="p-3">
                                    {s.service?.name || s.serviceId}
                                </td>
                                <td className="p-3">
                                    {s.frequency === "WEEKLY"
                                        ? t("weekly")
                                        : s.frequency === "BIWEEKLY"
                                        ? t("biweekly")
                                        : t("monthly")}{" "}
                                    · {new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2023, 0, s.dayOfWeek + 1)))} {s.startTime}
                                </td>
                                <td className="p-3">
                                    {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(s.nextRunDate))}
                                </td>
                                <td className="p-3">
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                            s.status === "ACTIVE"
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                : s.status === "PAUSED"
                                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                : "bg-gray-100 text-gray-500 dark:bg-white/10"
                                        }`}
                                    >
                                        {s.status === "ACTIVE"
                                            ? t("active")
                                            : s.status === "PAUSED"
                                            ? t("paused")
                                            : t("cancelled")}
                                    </span>
                                </td>
                                <td className="p-3 text-right">
                                    <RowActionsMenu
                                        label={t("actionsFor", { id: s.id })}
                                        actions={[
                                            ...(s.status === "ACTIVE"
                                                ? [
                                                      {
                                                          label: t("pause"),
                                                          disabled: busyId === s.id,
                                                          onClick: () =>
                                                              withBusy(s.id, () => pauseRecurringSchedule(s.id)),
                                                      },
                                                  ]
                                                : []),
                                            ...(s.status === "PAUSED"
                                                ? [
                                                      {
                                                          label: t("resume"),
                                                          disabled: busyId === s.id,
                                                          onClick: () =>
                                                              withBusy(s.id, () => resumeRecurringSchedule(s.id)),
                                                      },
                                                  ]
                                                : []),
                                            ...(s.status !== "CANCELLED"
                                                ? [
                                                      {
                                                          label: t("cancel"),
                                                          variant: "danger" as const,
                                                          disabled: busyId === s.id,
                                                          onClick: () => {
                                                              if (
                                                                  !confirm(
                                                                      t("cancelConfirm")
                                                                  )
                                                              )
                                                                  return;
                                                              withBusy(s.id, () => cancelRecurringSchedule(s.id));
                                                          },
                                                      },
                                                  ]
                                                : []),
                                        ]}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
