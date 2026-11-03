"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import {
  getBusiness,
  updateBusiness,
  getBranding,
  updateBranding,
  listHours,
  updateHours,
  listServiceAreas,
  createServiceArea,
  deleteServiceArea,
  ServiceArea,
  BusinessHours,
  BusinessBranding,
  StripeConnectStatus,
  refreshStripeConnectStatus,
  getStripeConnectStatus,
  startStripeConnectOnboarding,
} from "@/app/api/businesses.api";
import { Business } from "@/app/api/app-types";
import StripeConnectOptionalCard from "@/components/business/StripeConnectOptionalCard";
const DAY_COUNT = 7;

export default function BusinessSettingsPage() {
  const t = useTranslations("Dashboard.settings");
  const tc = useTranslations("Dashboard.common");
  const locale = useLocale();
  const [business, setBusiness] = useState<Business | null>(null);
  const [branding, setBranding] = useState<BusinessBranding | null>(null);
  const [hours, setHours] = useState<BusinessHours[]>([]);
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [areaForm, setAreaForm] = useState({ name: "", centerLat: "", centerLng: "", radiusMeters: "10000" });
  const [areaSaving, setAreaSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);

  const [nameForm, setNameForm] = useState({ name: "", timezone: "", defaultLocale: "nl" });
  const [taxForm, setTaxForm] = useState({ legalName: "", kvkNumber: "", vatNumber: "", invoiceIban: "", vatRateBps: "2100" });
  const [contactForm, setContactForm] = useState({ contactEmail: "", contactPhone: "" });
  const [brandForm, setBrandForm] = useState({ tagline: "", primaryColor: "", accentColor: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [b, br, h] = await Promise.all([getBusiness(), getBranding(), listHours()]);
      setBusiness(b);
      setBranding(br);
      setHours(h.length ? h : Array.from({ length: DAY_COUNT }, (_, i) => ({ dayOfWeek: i, openTime: "08:00", closeTime: "18:00", isClosed: i === 0 })));
      setNameForm({ name: b.name, timezone: b.timezone, defaultLocale: b.defaultLocale || "nl" });
      setTaxForm({
        legalName: b.legalName || "",
        kvkNumber: b.kvkNumber || "",
        vatNumber: b.vatNumber || "",
        invoiceIban: b.invoiceIban || "",
        vatRateBps: String(b.vatRateBps ?? 2100),
      });
      setContactForm({ contactEmail: b.contactEmail || "", contactPhone: b.contactPhone || "" });
      setBrandForm({ tagline: br.tagline || "", primaryColor: br.primaryColor || "", accentColor: br.accentColor || "" });
      setAreas(await listServiceAreas());
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const saveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved("");
    try {
      await updateBusiness({ ...nameForm, defaultLocale: nameForm.defaultLocale === "en" ? "en" : "nl" });
      setSaved(t("businessInfoSaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const saveTax = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved("");
    try {
      await updateBusiness({
        legalName: taxForm.legalName,
        kvkNumber: taxForm.kvkNumber,
        vatNumber: taxForm.vatNumber,
        invoiceIban: taxForm.invoiceIban,
        vatRateBps: Number(taxForm.vatRateBps),
      });
      setSaved(t("invoicingSaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("invoicingSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const saveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved("");
    try {
      // Blank clears the field (messages then go to account owners and managers).
      await updateBusiness({
        contactEmail: contactForm.contactEmail.trim(),
        contactPhone: contactForm.contactPhone.trim(),
      });
      setSaved(t("contactSaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("contactSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const saveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved("");
    try {
      await updateBranding(brandForm);
      setSaved(t("brandingSaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("brandingSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const saveHours = async () => {
    setSaving(true);
    setError("");
    setSaved("");
    try {
      await updateHours(hours);
      setSaved(t("hoursSaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("hoursSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  // state
  const [stripe, setStripe] = useState<StripeConnectStatus | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);

// on load + when ?stripe=return|refresh
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeParam = params.get("stripe");
    (async () => {
      if (stripeParam === "return" || stripeParam === "refresh") {
        try { await refreshStripeConnectStatus(); } catch {}
      }
      try {
        setStripe(await getStripeConnectStatus());
      } catch {}
    })();
  }, []);

  const connectStripe = async () => {
    setStripeLoading(true);
    try {
      const { url } = await startStripeConnectOnboarding();
      window.location.href = url; // Stripe hosted onboarding
    } catch (e) {
      setError(e instanceof Error ? e.message : t("stripeStartFailed"));
    } finally {
      setStripeLoading(false);
    }
  };

  const addServiceArea = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(areaForm.centerLat);
    const lng = parseFloat(areaForm.centerLng);
    const radius = parseInt(areaForm.radiusMeters, 10);
    if (!areaForm.name.trim() || Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(radius)) {
      setError(t("serviceAreaValidation"));
      return;
    }
    setAreaSaving(true);
    setError("");
    setSaved("");
    try {
      const created = await createServiceArea({ name: areaForm.name.trim(), centerLat: lat, centerLng: lng, radiusMeters: radius });
      setAreas((prev) => [...prev, created]);
      setAreaForm({ name: "", centerLat: "", centerLng: "", radiusMeters: "10000" });
      setSaved(t("serviceAreaAdded"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("serviceAreaAddFailed"));
    } finally {
      setAreaSaving(false);
    }
  };

  const removeServiceArea = async (id: string) => {
    if (!confirm(t("removeServiceAreaConfirm"))) return;
    setError("");
    try {
      await deleteServiceArea(id);
      setAreas((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("serviceAreaRemoveFailed"));
    }
  };

  if (loading) return <div className="p-6 text-sm text-gray-500">{tc("loading")}</div>;

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
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

      {/* General */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.02]">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("general")}</h2>
        <form onSubmit={saveGeneral} className="space-y-4 max-w-md">
          <div>
            <Label>{t("businessName")}</Label>
            <Input value={nameForm.name} onChange={(e) => setNameForm({ ...nameForm, name: e.target.value })} required />
          </div>
          <div>
            <Label>{t("timezone")}</Label>
            <Input value={nameForm.timezone} onChange={(e) => setNameForm({ ...nameForm, timezone: e.target.value })} placeholder="Europe/Amsterdam" required />
          </div>
          <div>
            <Label>{t("websiteLanguage")}</Label>
            <select
              value={nameForm.defaultLocale}
              onChange={(e) => setNameForm({ ...nameForm, defaultLocale: e.target.value })}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="nl">{t("languageNl")}</option>
              <option value="en">{t("languageEn")}</option>
            </select>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{t("websiteLanguageHint")}</p>
          </div>
          <Button type="submit" disabled={saving}>{saving ? tc("loading") : tc("save")}</Button>
        </form>
      </section>

      {/* Invoicing / BTW */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.02]">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("invoicingBtw")}</h2>
        <p className="mb-4 max-w-md text-xs text-gray-500 dark:text-gray-400">
          {t("btwHint")}
        </p>
        <form onSubmit={saveTax} className="space-y-4 max-w-md">
          <div>
            <Label>{t("legalName")}</Label>
            <Input value={taxForm.legalName} onChange={(e) => setTaxForm({ ...taxForm, legalName: e.target.value })} placeholder="Schoon Holding B.V." />
          </div>
          <div>
            <Label>{t("kvk")}</Label>
            <Input value={taxForm.kvkNumber} onChange={(e) => setTaxForm({ ...taxForm, kvkNumber: e.target.value })} placeholder="12345678" />
          </div>
          <div>
            <Label>{t("btwId")}</Label>
            <Input value={taxForm.vatNumber} onChange={(e) => setTaxForm({ ...taxForm, vatNumber: e.target.value })} placeholder="NL123456789B01" />
          </div>
          <div>
            <Label>{t("iban")}</Label>
            <Input value={taxForm.invoiceIban} onChange={(e) => setTaxForm({ ...taxForm, invoiceIban: e.target.value })} placeholder="NL91 ABNA 0417 1643 00" />
          </div>
          <div>
            <Label>{t("btwRate")}</Label>
            <select
              value={taxForm.vatRateBps}
              onChange={(e) => setTaxForm({ ...taxForm, vatRateBps: e.target.value })}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700"
            >
              <option value="2100">21% ({t("standardRate")})</option>
              <option value="900">9% ({t("reducedRate")})</option>
              <option value="0">0%</option>
            </select>
          </div>
          <Button type="submit" disabled={saving}>{saving ? t("saving") : t("saveInvoicing")}</Button>
        </form>
      </section>

      {/* Contact details */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.02]">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("contactDetails")}</h2>
        <p className="mb-4 max-w-md text-xs text-gray-500 dark:text-gray-400">{t("contactHint")}</p>
        <form onSubmit={saveContact} className="space-y-4 max-w-md">
          <div>
            <Label>{t("contactEmail")}</Label>
            <Input
              type="email"
              value={contactForm.contactEmail}
              onChange={(e) => setContactForm({ ...contactForm, contactEmail: e.target.value })}
              placeholder="info@yourbusiness.nl"
            />
          </div>
          <div>
            <Label>{t("contactPhone")}</Label>
            <Input
              type="tel"
              value={contactForm.contactPhone}
              onChange={(e) => setContactForm({ ...contactForm, contactPhone: e.target.value })}
              placeholder="+31 20 123 4567"
            />
          </div>
          <Button type="submit" disabled={saving}>{saving ? t("saving") : t("saveContact")}</Button>
        </form>
      </section>

      {/* Branding */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.02]">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("branding")}</h2>
        <form onSubmit={saveBranding} className="space-y-4 max-w-md">
          <div>
            <Label>{t("tagline")}</Label>
            <Input value={brandForm.tagline} onChange={(e) => setBrandForm({ ...brandForm, tagline: e.target.value })} placeholder="Spotless homes, every time" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("primaryColor")}</Label>
              <Input type="text" value={brandForm.primaryColor} onChange={(e) => setBrandForm({ ...brandForm, primaryColor: e.target.value })} placeholder="#2563eb" />
            </div>
            <div>
              <Label>{t("accentColor")}</Label>
              <Input type="text" value={brandForm.accentColor} onChange={(e) => setBrandForm({ ...brandForm, accentColor: e.target.value })} placeholder="#22c55e" />
            </div>
          </div>
          <Button type="submit" disabled={saving}>{saving ? tc("loading") : tc("save")}</Button>
        </form>
      </section>

      {/* Connect Stripe */}
      <StripeConnectOptionalCard
          stripe={stripe}
          onStripeChange={setStripe}
          onError={setError}
          onSaved={setSaved}
          initialPreferred={(business as any)?.preferredPaymentCollection || "BOTH"}
          initialOfflineInstructions={(business as any)?.offlinePaymentInstructions || ""}
      />

      {/* Hours */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.02]">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("openingHours")}</h2>
        <div className="space-y-3">
          {hours.map((h, i) => (
            <div key={h.dayOfWeek} className="flex items-center gap-4">
              <span className="w-24 text-sm text-gray-600 dark:text-gray-300">
                {new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2023, 0, h.dayOfWeek + 1)))}
              </span>
              <label className="flex items-center gap-2 text-xs text-gray-500">
                <input
                  type="checkbox"
                  checked={!h.isClosed}
                  onChange={(e) => {
                    const next = [...hours];
                    next[i] = { ...h, isClosed: !e.target.checked };
                    setHours(next);
                  }}
                />
                {t("open")}
              </label>
              {!h.isClosed && (
                <>
                  <input
                    type="time"
                    value={h.openTime}
                    onChange={(e) => {
                      const next = [...hours];
                      next[i] = { ...h, openTime: e.target.value };
                      setHours(next);
                    }}
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  <span className="text-gray-400">{tc("to")}</span>
                  <input
                    type="time"
                    value={h.closeTime}
                    onChange={(e) => {
                      const next = [...hours];
                      next[i] = { ...h, closeTime: e.target.value };
                      setHours(next);
                    }}
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </>
              )}
            </div>
          ))}
        </div>
        <Button className="mt-4" onClick={saveHours} disabled={saving}>{saving ? t("saving") : t("saveHours")}</Button>
      </section>

      {/* Service Areas */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.02]">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("serviceArea")}</h2>
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          {t("serviceAreaHint")}
        </p>

        {areas.length > 0 && (
          <ul className="mb-4 divide-y divide-gray-100 dark:divide-gray-800">
            {areas.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-700 dark:text-gray-200">
                  {a.name} — {a.centerLat.toFixed(4)}, {a.centerLng.toFixed(4)} · {(a.radiusMeters / 1000).toFixed(1)} {t("kilometerRadius")}
                </span>
                <button
                  type="button"
                  onClick={() => removeServiceArea(a.id)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  {tc("delete")}
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addServiceArea} className="grid gap-4 sm:grid-cols-2 max-w-2xl">
          <div>
            <Label>{t("areaName")}</Label>
            <Input value={areaForm.name} onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })} placeholder="Downtown Lagos" />
          </div>
          <div>
            <Label>{t("radiusMeters")}</Label>
            <Input type="number" value={areaForm.radiusMeters} onChange={(e) => setAreaForm({ ...areaForm, radiusMeters: e.target.value })} placeholder="10000" />
          </div>
          <div>
            <Label>{t("centerLat")}</Label>
            <Input type="number" value={areaForm.centerLat} onChange={(e) => setAreaForm({ ...areaForm, centerLat: e.target.value })} placeholder="6.5244" />
          </div>
          <div>
            <Label>{t("centerLng")}</Label>
            <Input type="number" value={areaForm.centerLng} onChange={(e) => setAreaForm({ ...areaForm, centerLng: e.target.value })} placeholder="3.3792" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={areaSaving}>{areaSaving ? t("adding") : t("addServiceArea")}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
