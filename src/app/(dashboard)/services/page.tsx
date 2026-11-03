"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  listServices,
  createService,
  updateService,
  deleteService,
  addServiceAddOn,
  updateServiceAddOn,
  deleteServiceAddOn,
} from "@/app/api/services.api";
import { PricingModel, Service, ServiceAddOn, formatMoney } from "@/app/api/cleansera-types";
import { currencySymbol } from "@/app/services/currency";

const PRICING_MODELS: PricingModel[] = ["FLAT", "PER_SQFT", "PER_ROOM", "HOURLY"];

const emptyForm = {
  name: "",
  description: "",
  pricingModel: "FLAT" as PricingModel,
  basePrice: "" as string | number,
  estimatedMinutes: 60 as string | number,
};

const inputCls =
  "h-11 w-full rounded-lg border px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function ServicesPage() {
  const t = useTranslations("Dashboard.services");
  const tc = useTranslations("Dashboard.common");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [addOnForm, setAddOnForm] = useState({ name: "", price: "" as string | number, extraMinutes: "" as string | number });
  const [addOnBusy, setAddOnBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listServices();
      setServices(data);
    } catch (e: any) {
      setError(e.message || t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createService({
        name: form.name,
        description: form.description || undefined,
        pricingModel: form.pricingModel,
        basePriceCents: Math.round(Number(form.basePrice) * 100),
        estimatedMinutes: Number(form.estimatedMinutes),
      });
      setForm(emptyForm);
      setShowCreate(false);
      load();
    } catch (e: any) {
      setError(e.message || t("createFailed"));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: Service) => {
    try {
      await updateService(s.id, { isActive: !s.isActive });
      load();
    } catch (e: any) {
      setError(e.message || t("updateFailed"));
    }
  };

  const removeService = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    try {
      await deleteService(id);
      load();
    } catch (e: any) {
      setError(e.message || t("deleteFailed"));
    }
  };

  const submitAddOn = async (serviceId: string, e: React.FormEvent) => {
    e.preventDefault();
    setAddOnBusy(true);
    try {
      await addServiceAddOn(serviceId, {
        name: addOnForm.name,
        priceCents: Math.round(Number(addOnForm.price || 0) * 100),
        extraMinutes: Number(addOnForm.extraMinutes || 0),
      });
      setAddOnForm({ name: "", price: "", extraMinutes: "" });
      load();
    } catch (e: any) {
      setError(e.message || t("addAddonFailed"));
    } finally {
      setAddOnBusy(false);
    }
  };

  const removeAddOn = async (serviceId: string, addOnId: string) => {
    try {
      await deleteServiceAddOn(serviceId, addOnId);
      load();
    } catch (e: any) {
      setError(e.message || t("deleteAddonFailed"));
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((s) => !s)}
          className="h-11 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white"
        >
          {showCreate ? tc("cancel") : t("new")}
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10">{error}</div>}

      {showCreate && (
        <form onSubmit={onCreate} className="grid gap-3 rounded-2xl border p-5 sm:grid-cols-2 dark:border-gray-800">
          <input
            required
            placeholder={t("namePlaceholder")}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={`${inputCls} sm:col-span-2`}
          />
          <textarea
            placeholder={t("descOptional")}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={`${inputCls} h-20 py-2 sm:col-span-2`}
          />
          <div>
            <select
              value={form.pricingModel}
              onChange={(e) => setForm({ ...form, pricingModel: e.target.value as PricingModel })}
              className={inputCls}
            >
              {PRICING_MODELS.map((p) => (
                <option key={p} value={p}>{t(`pricingModels.${p}.label`)}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              {t(`pricingModels.${form.pricingModel}.hint`)}
            </p>
          </div>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            placeholder={form.pricingModel === "HOURLY" ? t("hourlyRatePlaceholder", { currency: currencySymbol() }) : t("basePricePlaceholder", { currency: currencySymbol() })}
            value={form.basePrice}
            onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
            className={inputCls}
          />
          <input
            required
            type="number"
            min="15"
            step="15"
            placeholder={t("estimatedMinutes")}
            value={form.estimatedMinutes}
            onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
            className={inputCls}
          />
          <button
            type="submit"
            disabled={saving}
            className="h-11 rounded-lg bg-brand-500 text-sm font-medium text-white disabled:opacity-60 sm:col-span-2"
          >
            {saving ? tc("loading") : t("createService")}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">{tc("loading")}</p>
      ) : (
        <div className="space-y-3">
          {services.map((s) => (
            <div key={s.id} className="rounded-xl border dark:border-gray-800">
              <div
                className="flex cursor-pointer items-center justify-between px-4 py-3"
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 dark:text-white/90">{s.name}</span>
                    {!s.isActive && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800">
                        {t("inactive")}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {t(`pricingModels.${s.pricingModel}.label`)} · {formatMoney(s.basePriceCents)} {t("basePriceLabel")} ·{" "}
                    {t("serviceSummary", { minutes: s.estimatedMinutes, count: s.addOns?.length || 0 })}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm" onClick={(e) => e.stopPropagation()}>
                  <button type="button" onClick={() => toggleActive(s)} className="text-gray-500 hover:underline">
                    {s.isActive ? t("deactivate") : t("activate")}
                  </button>
                  <button type="button" onClick={() => removeService(s.id)} className="text-red-600 hover:underline">
                    {tc("delete")}
                  </button>
                </div>
              </div>

              {expanded === s.id && (
                <div className="border-t px-4 py-4 dark:border-gray-800">
                  {s.description && <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">{s.description}</p>}

                  <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t("addons")}</h4>
                  <div className="mb-3 space-y-2">
                    {(s.addOns || []).map((a: ServiceAddOn) => (
                      <div key={a.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-white/[0.03]">
                        <span>{a.name}</span>
                        <span className="flex items-center gap-3 text-gray-500">
                          {formatMoney(a.priceCents)} · +{a.extraMinutes}min
                          <button
                            type="button"
                            onClick={() => removeAddOn(s.id, a.id)}
                            className="text-red-600 hover:underline"
                          >
                            {tc("delete")}
                          </button>
                        </span>
                      </div>
                    ))}
                    {!s.addOns?.length && <p className="text-sm text-gray-400">{t("noAddons")}</p>}
                  </div>

                  <form onSubmit={(e) => submitAddOn(s.id, e)} className="flex flex-wrap gap-2">
                    <input
                      required
                      placeholder={t("addonNamePh")}
                      value={addOnForm.name}
                      onChange={(e) => setAddOnForm({ ...addOnForm, name: e.target.value })}
                      className={`${inputCls} max-w-[220px]`}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={t("pricePlaceholder", { currency: currencySymbol() })}
                      value={addOnForm.price}
                      onChange={(e) => setAddOnForm({ ...addOnForm, price: e.target.value })}
                      className={`${inputCls} max-w-[120px]`}
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder={t("extraMinutes")}
                      value={addOnForm.extraMinutes}
                      onChange={(e) => setAddOnForm({ ...addOnForm, extraMinutes: e.target.value })}
                      className={`${inputCls} max-w-[140px]`}
                    />
                    <button
                      type="submit"
                      disabled={addOnBusy}
                      className="h-11 rounded-lg border px-4 text-sm disabled:opacity-60 dark:border-gray-700"
                    >
                      {addOnBusy ? tc("loading") : tc("add")}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
          {!services.length && (
            <div className="rounded-xl border p-8 text-center text-sm text-gray-500 dark:border-gray-800">
              {t("emptyHint")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
