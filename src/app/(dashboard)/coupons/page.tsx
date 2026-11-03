"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  listCoupons,
  createCoupon,
  deleteCoupon,
  type Coupon,
  type CouponType,
} from "@/app/api/coupons.api";
import RowActionsMenu from "@/components/tables/RowActionsMenu";

export default function CouponsPage() {
  const t = useTranslations("Dashboard.coupons");
  const tc = useTranslations("Dashboard.common");
  const locale = useLocale();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "PERCENT" as CouponType,
    value: 10,
    expiresAt: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listCoupons();
      setCoupons((res.data as Coupon[]) || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("loadFailed"));
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await createCoupon({
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      });
      setForm({ code: "", type: "PERCENT", value: 10, expiresAt: "" });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("createFailed"));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm(t("deactivateConfirm"))) return;
    setError("");
    try {
      await deleteCoupon(id);
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
            onSubmit={onCreate}
            className="grid gap-3 rounded-2xl border border-gray-200 p-5 sm:grid-cols-2 lg:grid-cols-5 dark:border-gray-800"
        >
          <input
              required
              placeholder={t("codePlaceholder")}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="h-11 rounded-lg border border-gray-300 px-3 text-sm uppercase dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as CouponType })}
              className="h-11 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="PERCENT">{t("percent")}</option>
            <option value="AMOUNT">{t("fixedAmount")}</option>
          </select>
          <input
              type="number"
              min={0}
              required
              value={form.value}
              onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
              className="h-11 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder={t("valueExample", { value: form.type === "PERCENT" ? "10" : "500" })}
          />
          <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="h-11 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              title={t("optionalExpiry")}
          />
          <button
              type="submit"
              disabled={busy}
              className="h-11 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {busy ? tc("loading") : t("create")}
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
                  <th className="px-4 py-3">{t("type")}</th>
                  <th className="px-4 py-3">{t("value")}</th>
                  <th className="px-4 py-3">{t("active")}</th>
                  <th className="px-4 py-3">{t("redeemed")}</th>
                  <th className="px-4 py-3">{t("expires")}</th>
                  <th className="px-4 py-3" />
                </tr>
                </thead>
                <tbody>
                {coupons.map((c) => (
                    <tr key={c.id} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                      <td className="px-4 py-3">{c.type === "PERCENT" ? t("percent") : t("fixedAmount")}</td>
                      <td className="px-4 py-3">
                        {c.type === "PERCENT" ? `${c.value}%` : t("centsValue", { value: c.value })}
                      </td>
                      <td className="px-4 py-3">{c.isActive ? tc("yes") : tc("no")}</td>
                      <td className="px-4 py-3">{c.redeemedCount ?? 0}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {c.expiresAt ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(c.expiresAt)) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <RowActionsMenu
                          label={t("actionsFor", { code: c.code })}
                          actions={
                            c.isActive
                              ? [{ label: t("deactivate"), variant: "danger" as const, onClick: () => onDelete(c.id) }]
                              : []
                          }
                        />
                      </td>
                    </tr>
                ))}
                {!coupons.length && (
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