"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { CompanyLocation, CompanyMember, CompanyMemberInput, CompanyMemberRole } from "@/app/api/portal.api";

const input = "h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white";

type Props = {
  /** Loads members and the branches that can be assigned. */
  load: () => Promise<{ members: CompanyMember[]; locations: CompanyLocation[] }>;
  create: (input: CompanyMemberInput) => Promise<unknown>;
  update: (id: string, input: CompanyMemberInput) => Promise<unknown>;
  /** Called when a request fails with 401 (portal session ended). */
  onUnauthorized?: () => void;
};

const empty = { firstName: "", lastName: "", email: "", phone: "", role: "BRANCH_MANAGER" as CompanyMemberRole, locationKeys: [] as string[] };

/**
 * Team of a business account: who can sign in, as admin (everything) or
 * branch manager (only the ticked locations). Shared by the customer portal
 * (company admins) and the staff dashboard.
 */
export function MembersEditor({ load, create, update, onUnauthorized }: Props) {
  const t = useTranslations("B2BTeam");
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [locations, setLocations] = useState<CompanyLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const fail = useCallback(
    (e: unknown) => {
      if ((e as { status?: number } | null)?.status === 401) onUnauthorized?.();
      setError(e instanceof Error && e.message ? e.message : t("failed"));
    },
    [onUnauthorized, t]
  );

  const refresh = useCallback(async () => {
    try {
      const r = await load();
      setMembers(r.members);
      setLocations(r.locations);
      setError("");
    } catch (e) {
      fail(e);
    } finally {
      setLoading(false);
    }
  }, [load, fail]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const labelOf = (key: string) => locations.find((l) => l.key === key)?.label || key;

  const open = (m?: CompanyMember) => {
    setError("");
    if (!m) {
      setForm(empty);
      setEditing("new");
      return;
    }
    setForm({ firstName: m.firstName, lastName: m.lastName, email: m.email || "", phone: m.phone || "", role: m.role, locationKeys: m.locationKeys });
    setEditing(m.id);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload: CompanyMemberInput = { ...form, locationKeys: form.role === "ADMIN" ? [] : form.locationKeys };
      if (editing === "new") await create(payload);
      else if (editing) await update(editing, payload);
      setEditing(null);
      await refresh();
    } catch (err) {
      fail(err);
    } finally {
      setSaving(false);
    }
  };

  const setActive = async (m: CompanyMember, isActive: boolean) => {
    if (!isActive && !confirm(t("deactivateConfirm", { name: m.firstName }))) return;
    setError("");
    try {
      await update(m.id, { isActive });
      await refresh();
    } catch (err) {
      fail(err);
    }
  };

  const toggleKey = (key: string) =>
    setForm((f) => ({ ...f, locationKeys: f.locationKeys.includes(key) ? f.locationKeys.filter((k) => k !== key) : [...f.locationKeys, key] }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-600 dark:text-gray-300">{t("intro")}</p>
        {editing === null && (
          <button type="button" onClick={() => open()} className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            {t("add")}
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {editing !== null && (
        <form onSubmit={submit} className="grid gap-3 rounded-xl border border-gray-200 p-4 md:grid-cols-2 dark:border-gray-800">
          <label className="text-sm">
            <span className="mb-1 block text-gray-600 dark:text-gray-300">{t("firstName")}</span>
            <input required className={input} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-gray-600 dark:text-gray-300">{t("lastName")}</span>
            <input className={input} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-gray-600 dark:text-gray-300">{t("email")}</span>
            <input type="email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-gray-600 dark:text-gray-300">{t("phone")}</span>
            <input type="tel" className={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <p className="text-xs text-gray-500 md:col-span-2">{t("loginHelp")}</p>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-gray-600 dark:text-gray-300">{t("role")}</span>
            <select className={input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as CompanyMemberRole })}>
              <option value="BRANCH_MANAGER">{t("roles.BRANCH_MANAGER")}</option>
              <option value="ADMIN">{t("roles.ADMIN")}</option>
            </select>
            <span className="mt-1 block text-xs text-gray-500">{t(`roleHelp.${form.role}`)}</span>
          </label>
          {form.role === "BRANCH_MANAGER" && (
            <fieldset className="md:col-span-2">
              <legend className="mb-1 text-sm text-gray-600 dark:text-gray-300">{t("locations")}</legend>
              {locations.length === 0 ? (
                <p className="text-xs text-gray-500">{t("noLocations")}</p>
              ) : (
                <div className="grid gap-1 sm:grid-cols-2">
                  {locations.map((l) => (
                    <label key={l.key} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input type="checkbox" className="mt-1" checked={form.locationKeys.includes(l.key)} onChange={() => toggleKey(l.key)} />
                      <span>{l.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          )}
          <div className="flex gap-2 md:col-span-2">
            <button type="submit" disabled={saving} className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
              {saving ? t("saving") : t("save")}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300">
              {t("cancel")}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">…</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-gray-500">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
          {members.map((m) => (
            <li key={m.id} className={`flex flex-wrap items-start justify-between gap-3 p-4 ${m.isActive ? "" : "opacity-60"}`}>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-white">
                  {m.firstName} {m.lastName}
                  <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">{t(`roles.${m.role}`)}</span>
                  {!m.isActive && <span className="ml-2 text-xs text-gray-500">{t("inactive")}</span>}
                </p>
                <p className="text-sm text-gray-500">{[m.email, m.phone].filter(Boolean).join(" · ")}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {m.role === "ADMIN" ? t("allLocations") : m.locationKeys.map(labelOf).join(" · ")}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => open(m)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">
                  {t("edit")}
                </button>
                <button type="button" onClick={() => setActive(m, !m.isActive)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">
                  {m.isActive ? t("deactivate") : t("reactivate")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
