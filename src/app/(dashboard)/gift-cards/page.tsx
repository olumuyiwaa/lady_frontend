"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  listGiftCards,
  issueGiftCard,
  deactivateGiftCard,
  type GiftCard,
} from "@/app/api/giftCards.api";
import RowActionsMenu from "@/components/tables/RowActionsMenu";
import { formatMoney } from "@/app/api/cleansera-types";
import { currencySymbol } from "@/app/services/currency";

function centsToDollars(cents: number) {
  // (name kept to limit the diff) formats in the business currency, not always dollars
  return formatMoney(cents);
}

export default function GiftCardsPage() {
  const t = useTranslations("Dashboard.giftCards");
  const tc = useTranslations("Dashboard.common");
  const locale = useLocale();
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    code: "",
    valueDollars: 50,
    recipientName: "",
    recipientEmail: "",
    message: "",
    expiresAt: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listGiftCards();
      setGiftCards((res.data as GiftCard[]) || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("loadFailed"));
      setGiftCards([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const onIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await issueGiftCard({
        code: form.code.trim() ? form.code.trim().toUpperCase() : undefined,
        initialValueCents: Math.round(Number(form.valueDollars) * 100),
        recipientName: form.recipientName.trim() || undefined,
        recipientEmail: form.recipientEmail.trim() || undefined,
        message: form.message.trim() || undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      });
      setForm({ code: "", valueDollars: 50, recipientName: "", recipientEmail: "", message: "", expiresAt: "" });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("issueFailed"));
    } finally {
      setBusy(false);
    }
  };

  const onDeactivate = async (id: string) => {
    if (!confirm(t("deactivateConfirm"))) return;
    setError("");
    try {
      await deactivateGiftCard(id);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("deactivateFailed"));
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("subtitle")}
        </p>
      </div>

      <form
        onSubmit={onIssue}
        className="grid gap-3 rounded-2xl border border-gray-200 p-5 sm:grid-cols-2 lg:grid-cols-6 dark:border-gray-800"
      >
        <input
          placeholder={t("codePlaceholder")}
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          className="h-11 rounded-lg border border-gray-300 px-3 text-sm uppercase dark:border-gray-700 dark:bg-gray-900 dark:text-white lg:col-span-2"
        />
        <input
          type="number"
          min={1}
          step="0.01"
          required
          value={form.valueDollars}
          onChange={(e) => setForm({ ...form, valueDollars: Number(e.target.value) })}
          placeholder={t("valuePlaceholder", { currency: currencySymbol() })}
          className="h-11 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
        <input
          placeholder={t("recipientNamePlaceholder")}
          value={form.recipientName}
          onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
          className="h-11 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
        <input
          type="email"
          placeholder={t("recipientEmailPlaceholder")}
          value={form.recipientEmail}
          onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
          className="h-11 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
        <input
          type="date"
          value={form.expiresAt}
          onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
          title={t("optionalExpiry")}
          className="h-11 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
        <input
          placeholder={t("messagePlaceholder")}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="h-11 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white lg:col-span-4"
        />
        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 lg:col-span-2"
        >
          {busy ? t("issuing") : t("issue")}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">{tc("loading")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3">{t("code")}</th>
                <th className="px-4 py-3">{t("recipient")}</th>
                <th className="px-4 py-3">{t("balance")}</th>
                <th className="px-4 py-3">{t("initialValue")}</th>
                <th className="px-4 py-3">{t("active")}</th>
                <th className="px-4 py-3">{t("expires")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {giftCards.map((g) => (
                <tr key={g.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3 font-mono font-medium">{g.code}</td>
                  <td className="px-4 py-3">{g.recipientName || g.recipientEmail || "—"}</td>
                  <td className="px-4 py-3">{centsToDollars(g.balanceCents)}</td>
                  <td className="px-4 py-3 text-gray-500">{centsToDollars(g.initialValueCents)}</td>
                  <td className="px-4 py-3">{g.isActive ? tc("yes") : tc("no")}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {g.expiresAt ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(g.expiresAt)) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <RowActionsMenu
                      label={t("actionsFor", { code: g.code })}
                      actions={
                        g.isActive
                          ? [{ label: t("deactivate"), variant: "danger" as const, onClick: () => onDeactivate(g.id) }]
                          : []
                      }
                    />
                  </td>
                </tr>
              ))}
              {!giftCards.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
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
