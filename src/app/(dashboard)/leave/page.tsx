"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  approveLeave,
  cancelLeave,
  listLeave,
  recordLeave,
  rejectLeave,
  type Leave,
  type LeaveConflict,
  type LeaveStatus,
  type LeaveType,
} from "@/app/api/leave.api";
import { listCleaners } from "@/app/api/cleaners.api";
import type { Cleaner } from "@/app/api/app-types";
import RowActionsMenu from "@/components/tables/RowActionsMenu";

const STATUS_OPTIONS: (LeaveStatus | "")[] = ["PENDING", "APPROVED", "REJECTED", "CANCELLED", ""];
const TYPES: LeaveType[] = ["VACATION", "SICK", "PERSONAL", "OTHER"];
const input = "h-11 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white";

/** The last day of leave shown to people: endsAt is the start of the day after. */
function lastDay(endsAt: string) {
  return new Date(new Date(endsAt).getTime() - 12 * 3600 * 1000);
}

export default function LeavePage() {
  const t = useTranslations("Dashboard.leave");
  const tc = useTranslations("Dashboard.common");
  const locale = useLocale();
  const [items, setItems] = useState<Leave[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [status, setStatus] = useState<LeaveStatus | "">("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [conflicts, setConflicts] = useState<LeaveConflict[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ cleanerId: "", type: "VACATION" as LeaveType, startDate: "", endDate: "", reason: "" });
  const [saving, setSaving] = useState(false);

  const day = (iso: string | Date) => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
  const dateTime = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await listLeave({ status: status || undefined }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("loadFailed"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [status, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    listCleaners("ACTIVE")
      .then((res) => setCleaners(((res as { data?: Cleaner[] }).data || res) as Cleaner[]))
      .catch(() => setCleaners([]));
  }, []);

  const decide = async (id: string, kind: "approve" | "reject") => {
    const note = window.prompt(t(kind === "approve" ? "approveNote" : "rejectNote")) ?? undefined;
    if (note === undefined && kind === "reject") return;
    setError("");
    try {
      const out = kind === "approve" ? await approveLeave(id, note || undefined) : await rejectLeave(id, note || undefined);
      setConflicts(out.conflicts || []);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("actionFailed"));
    }
  };

  const onCancel = async (id: string) => {
    if (!confirm(t("cancelConfirm"))) return;
    setError("");
    try {
      await cancelLeave(id);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("actionFailed"));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const out = await recordLeave({ ...form, reason: form.reason || undefined });
      setConflicts(out.conflicts || []);
      setShowForm(false);
      setForm({ cleanerId: "", type: "VACATION", startDate: "", endDate: "", reason: "" });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value as LeaveStatus | "")} className={input} aria-label={t("status")}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s || "ALL"} value={s}>
                {s ? t(`statuses.${s}`) : t("allStatuses")}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setShowForm((v) => !v)} className="h-11 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600">
            {t("record")}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {conflicts.length > 0 && (
        <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <p className="font-medium">{t("conflictsTitle", { count: conflicts.length })}</p>
          <ul className="mt-1 list-disc pl-5">
            {conflicts.map((c) => (
              <li key={c.id}>
                {dateTime(c.scheduledStart)} · {[c.addressLine1, c.city].filter(Boolean).join(", ")}
              </li>
            ))}
          </ul>
          <p className="mt-1">{t("conflictsHelp")}</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="grid gap-3 rounded-xl border border-gray-200 p-4 md:grid-cols-5 dark:border-gray-800">
          <select required value={form.cleanerId} onChange={(e) => setForm({ ...form, cleanerId: e.target.value })} className={input} aria-label={t("cleaner")}>
            <option value="">{t("chooseCleaner")}</option>
            {cleaners.map((c) => (
              <option key={c.id} value={c.id}>
                {c.user.firstName} {c.user.lastName}
              </option>
            ))}
          </select>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as LeaveType })} className={input} aria-label={t("type")}>
            {TYPES.map((x) => (
              <option key={x} value={x}>
                {t(`types.${x}`)}
              </option>
            ))}
          </select>
          <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: form.endDate || e.target.value })} className={input} aria-label={t("from")} />
          <input required type="date" min={form.startDate} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={input} aria-label={t("to")} />
          <input value={form.reason} maxLength={500} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder={t("reason")} className={input} aria-label={t("reason")} />
          <div className="md:col-span-5">
            <button type="submit" disabled={saving} className="h-11 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">
              {saving ? tc("loading") : t("saveApproved")}
            </button>
            <span className="ml-3 text-xs text-gray-500">{t("recordHelp")}</span>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">{tc("loading")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3">{t("cleaner")}</th>
                <th className="px-4 py-3">{t("type")}</th>
                <th className="px-4 py-3">{t("dates")}</th>
                <th className="px-4 py-3">{t("reason")}</th>
                <th className="px-4 py-3">{t("status")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((l) => {
                const name = l.cleaner ? `${l.cleaner.user.firstName} ${l.cleaner.user.lastName}` : l.cleanerId;
                const actions =
                  l.status === "PENDING"
                    ? [
                        { label: t("approve"), onClick: () => decide(l.id, "approve") },
                        { label: t("reject"), variant: "danger" as const, onClick: () => decide(l.id, "reject") },
                      ]
                    : l.status === "APPROVED" && new Date(l.endsAt) > new Date()
                      ? [{ label: t("cancel"), variant: "danger" as const, onClick: () => onCancel(l.id) }]
                      : [];
                return (
                  <tr key={l.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3">{name}</td>
                    <td className="px-4 py-3">{t(`types.${l.type}`)}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {day(l.startsAt)} – {day(lastDay(l.endsAt))}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {l.reason || "—"}
                      {l.decisionNote ? <div className="text-xs">{l.decisionNote}</div> : null}
                    </td>
                    <td className="px-4 py-3">{t(`statuses.${l.status}`)}</td>
                    <td className="px-4 py-3">
                      <RowActionsMenu label={t("actionsFor", { name })} actions={actions} />
                    </td>
                  </tr>
                );
              })}
              {!items.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    {t("empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
