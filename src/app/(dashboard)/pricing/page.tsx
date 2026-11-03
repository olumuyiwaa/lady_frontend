"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { getPricing, updatePricing, PolicyValueType } from "@/app/api/pricing.api";
import { currencySymbol } from "@/app/services/currency";

// cents <-> a plain dollar/major-unit string for the input fields, so the
// business types "0.35" instead of "35" and never has to think in cents.
function centsToMajor(cents: number | null): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toString();
}
function majorToCents(major: string): number | null {
  if (major.trim() === "") return null;
  const n = Number(major);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

const FREQUENCIES = ["WEEKLY", "BIWEEKLY", "MONTHLY"] as const;

export default function PricingSettingsPage() {
  const t = useTranslations("Dashboard.pricing");
  const tc = useTranslations("Dashboard.common");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  // Per-business PER_SQFT / PER_ROOM rates. Left blank = fall back to the
  // platform default rate (today's one-rate-for-everyone behavior).
  const [rates, setRates] = useState({ perSqft: "", perRoom: "" });

  const [freqDiscounts, setFreqDiscounts] = useState<Record<string, string>>({
    WEEKLY: "",
    BIWEEKLY: "",
    MONTHLY: "",
  });

  const [deposit, setDeposit] = useState<{ type: PolicyValueType | ""; value: string }>({
    type: "",
    value: "",
  });

  const [cancellation, setCancellation] = useState<{
    windowHours: string;
    feeType: PolicyValueType | "";
    feeValue: string;
  }>({ windowHours: "", feeType: "", feeValue: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const p = await getPricing();
      setRates({ perSqft: centsToMajor(p.perSqftCents), perRoom: centsToMajor(p.perRoomCents) });
      const fd = p.frequencyDiscounts || {};
      setFreqDiscounts({
        WEEKLY: fd.WEEKLY != null ? String(Math.round(fd.WEEKLY * 100)) : "",
        BIWEEKLY: fd.BIWEEKLY != null ? String(Math.round(fd.BIWEEKLY * 100)) : "",
        MONTHLY: fd.MONTHLY != null ? String(Math.round(fd.MONTHLY * 100)) : "",
      });
      setDeposit({ type: p.depositType || "", value: p.depositValue != null ? String(p.depositValue) : "" });
      setCancellation({
        windowHours: p.cancellationWindowHours != null ? String(p.cancellationWindowHours) : "",
        feeType: p.cancellationFeeType || "",
        feeValue: p.cancellationFeeValue != null ? String(p.cancellationFeeValue) : "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const saveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved("");
    try {
      await updatePricing({
        perSqftCents: majorToCents(rates.perSqft),
        perRoomCents: majorToCents(rates.perRoom),
      });
      setSaved(t("ratesSaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("ratesSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const saveFrequency = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const discounts: Record<string, number> = {};
      for (const f of FREQUENCIES) {
        const v = freqDiscounts[f];
        if (v.trim() !== "") discounts[f] = Number(v) / 100;
      }
      await updatePricing({ frequencyDiscounts: discounts });
      setSaved(t("discountsSaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("discountsSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const saveDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved("");
    try {
      await updatePricing({
        depositType: deposit.type || null,
        depositValue: deposit.value.trim() !== "" ? Number(deposit.value) : null,
      });
      setSaved(t("depositSaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("depositSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const saveCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved("");
    try {
      await updatePricing({
        cancellationWindowHours: cancellation.windowHours.trim() !== "" ? Number(cancellation.windowHours) : null,
        cancellationFeeType: cancellation.feeType || null,
        cancellationFeeValue: cancellation.feeValue.trim() !== "" ? Number(cancellation.feeValue) : null,
      });
      setSaved(t("cancellationSaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("cancellationSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-gray-500">{tc("loading")}</div>;

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("businessOnlyHint")}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-600 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
          {saved}
        </div>
      )}

      {/* PER_SQFT / PER_ROOM rates */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.02]">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t("sizeBasedRates")}
        </h2>
        <p className="mb-4 text-xs text-gray-400">
          {t("sizeBasedRatesHint")}
        </p>
        <form onSubmit={saveRates} className="space-y-4 max-w-md">
          <div>
            <Label>{t("ratePerSquareFoot", { currency: currencySymbol() })}</Label>
            <Input
              type="number"
              step={0.01}
              min="0"
              placeholder={t("platformDefault", { amount: "0.10" })}
              value={rates.perSqft}
              onChange={(e) => setRates({ ...rates, perSqft: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("ratePerRoom", { currency: currencySymbol() })}</Label>
            <Input
              type="number"
              step={0.01}
              min="0"
              placeholder={t("platformDefault", { amount: "15.00" })}
              value={rates.perRoom}
              onChange={(e) => setRates({ ...rates, perRoom: e.target.value })}
            />
          </div>
          <Button type="submit" disabled={saving}>{saving ? tc("loading") : t("saveRates")}</Button>
        </form>
      </section>

      {/* Frequency discounts */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.02]">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t("frequencyDiscounts")}
        </h2>
        <form onSubmit={saveFrequency} className="space-y-4 max-w-md">
          {FREQUENCIES.map((f) => (
            <div key={f}>
              <Label>{t("frequencyDiscountLabel", { frequency: t(`frequency.${f}`) })}</Label>
              <Input
                type="number"
                step={1}
                min="0"
                max="100"
                placeholder="0"
                value={freqDiscounts[f]}
                onChange={(e) => setFreqDiscounts({ ...freqDiscounts, [f]: e.target.value })}
              />
            </div>
          ))}
          <Button type="submit" disabled={saving}>{saving ? tc("loading") : t("saveDiscounts")}</Button>
        </form>
      </section>

      {/* Deposit policy */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.02]">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t("depositPolicy")}
        </h2>
        <p className="mb-4 text-xs text-gray-400">{t("depositPolicyHint")}</p>
        <form onSubmit={saveDeposit} className="space-y-4 max-w-md">
          <div>
            <Label>{t("depositType")}</Label>
            <select
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={deposit.type}
              onChange={(e) => setDeposit({ ...deposit, type: e.target.value as PolicyValueType | "" })}
            >
              <option value="">{t("noDeposit")}</option>
              <option value="PERCENT">{t("percentOfJob")}</option>
              <option value="AMOUNT">{t("fixedAmount")}</option>
            </select>
          </div>
          {deposit.type && (
            <div>
              <Label>{deposit.type === "PERCENT" ? t("depositPercent") : t("depositAmount")}</Label>
              <Input
                type="number"
                min="0"
                value={deposit.value}
                onChange={(e) => setDeposit({ ...deposit, value: e.target.value })}
              />
            </div>
          )}
          <Button type="submit" disabled={saving}>{saving ? tc("loading") : t("saveDepositPolicy")}</Button>
        </form>
      </section>

      {/* Cancellation policy */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.02]">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t("cancellationPolicy")}
        </h2>
        <p className="mb-4 text-xs text-gray-400">
          {t("cancellationPolicyHint")}
        </p>
        <form onSubmit={saveCancellation} className="space-y-4 max-w-md">
          <div>
            <Label>{t("freeCancelWindow")}</Label>
            <Input
              type="number"
              min="0"
              placeholder="e.g. 24"
              value={cancellation.windowHours}
              onChange={(e) => setCancellation({ ...cancellation, windowHours: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("cancelFeeType")}</Label>
            <select
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={cancellation.feeType}
              onChange={(e) => setCancellation({ ...cancellation, feeType: e.target.value as PolicyValueType | "" })}
            >
              <option value="">{t("noFee")}</option>
              <option value="PERCENT">{t("percentOfJob")}</option>
              <option value="AMOUNT">{t("fixedAmount")}</option>
            </select>
          </div>
          {cancellation.feeType && (
            <div>
              <Label>{cancellation.feeType === "PERCENT" ? t("feePercent") : t("feeAmount")}</Label>
              <Input
                type="number"
                min="0"
                value={cancellation.feeValue}
                onChange={(e) => setCancellation({ ...cancellation, feeValue: e.target.value })}
              />
            </div>
          )}
          <Button type="submit" disabled={saving}>{saving ? tc("loading") : t("saveCancellationPolicy")}</Button>
        </form>
      </section>
    </div>
  );
}
