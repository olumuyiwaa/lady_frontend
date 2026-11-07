"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { submitContact } from "@/app/api/widget.api";
import { Turnstile, TURNSTILE_SITE_KEY } from "@/components/booking/Turnstile";
import { composeBusinessMessage } from "@/lib/businessEnquiry";
import type { ApiError } from "@/lib/formErrors";

const EMAIL_RE = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]{2,}$/;
const PHONE_RE = /^[+\d\s().-]{5,40}$/;
const FREQ = ["WEEKLY", "BIWEEKLY", "MONTHLY", "ONEOFF", "UNSURE"] as const;

export function BusinessEnquiryForm({ subdomain, primaryColor }: { subdomain: string; primaryColor: string }) {
  const t = useTranslations("Site.business.form");
  const uid = useId();
  const [f, setF] = useState({ company: "", name: "", email: "", phone: "", sites: "1", frequency: "WEEKLY", details: "" });
  const [honeypot, setHoneypot] = useState("");
  const [bad, setBad] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [reference, setReference] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    setBad((b) => b.filter((x) => x !== k));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setError("");
    const problems: string[] = [];
    if (!f.company.trim()) problems.push("company");
    if (!f.name.trim()) problems.push("name");
    if (!EMAIL_RE.test(f.email.trim())) problems.push("email");
    if (f.phone.trim() && !PHONE_RE.test(f.phone.trim())) problems.push("phone");
    setBad(problems);
    if (problems.length) return;
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError(t("errCaptcha"));
      return;
    }
    setStatus("sending");
    try {
      const r = await submitContact(subdomain, {
        name: `${f.name.trim()} (${f.company.trim()})`.slice(0, 100),
        email: f.email.trim(),
        phone: f.phone.trim() || undefined,
        message: composeBusinessMessage(
          { company: f.company, sites: f.sites, frequency: t(`freq.${f.frequency}` as "freq.WEEKLY"), details: f.details },
          { company: t("company"), sites: t("sites"), frequency: t("frequency") }
        ),
        website: honeypot,
        captchaToken: captchaToken || undefined,
      });
      setReference(r.reference);
      setStatus("sent");
    } catch (err) {
      const s = (err as ApiError).status;
      setError(s === 429 ? t("errRateLimit") : s === 400 ? t("errCaptcha") : t("errGeneric"));
      setStatus("idle");
    } finally {
      setCaptchaToken(null);
      setNonce((n) => n + 1);
    }
  }

  const input = (k: string) =>
    `mt-1.5 block w-full rounded-xl border bg-white px-4 py-3 text-base text-[#101a2c] outline-none transition focus:ring-4 ${
      bad.includes(k) ? "border-red-400 focus:ring-red-500/15" : "border-[#c0d0e0] focus:border-[#101a2c] focus:ring-[#101a2c]/10"
    }`;
  const label = "block text-sm font-medium text-[#101a2c]";

  if (status === "sent") {
    return (
      <div role="status" aria-live="polite" className="py-6 text-center">
        <h3 className="text-xl font-semibold text-[#101a2c]">{t("sentTitle")}</h3>
        <p className="mt-2 text-[#616963]">{t("sentBody")}</p>
        {reference && <p className="mt-3 text-sm text-[#616963]">{t("reference", { reference })}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={status === "sending"}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-company`} className={label}>{t("company")} *</label>
          <input id={`${uid}-company`} value={f.company} onChange={set("company")} maxLength={80} autoComplete="organization" aria-invalid={bad.includes("company")} className={input("company")} />
          {bad.includes("company") && <p role="alert" className="mt-1.5 text-sm text-red-600">{t("errCompany")}</p>}
        </div>
        <div>
          <label htmlFor={`${uid}-name`} className={label}>{t("name")} *</label>
          <input id={`${uid}-name`} value={f.name} onChange={set("name")} maxLength={60} autoComplete="name" aria-invalid={bad.includes("name")} className={input("name")} />
          {bad.includes("name") && <p role="alert" className="mt-1.5 text-sm text-red-600">{t("errName")}</p>}
        </div>
        <div>
          <label htmlFor={`${uid}-email`} className={label}>{t("email")} *</label>
          <input id={`${uid}-email`} type="email" value={f.email} onChange={set("email")} maxLength={254} autoComplete="email" aria-invalid={bad.includes("email")} className={input("email")} />
          {bad.includes("email") && <p role="alert" className="mt-1.5 text-sm text-red-600">{t("errEmail")}</p>}
        </div>
        <div>
          <label htmlFor={`${uid}-phone`} className={label}>{t("phone")}</label>
          <input id={`${uid}-phone`} type="tel" value={f.phone} onChange={set("phone")} maxLength={40} autoComplete="tel" aria-invalid={bad.includes("phone")} className={input("phone")} />
          {bad.includes("phone") && <p role="alert" className="mt-1.5 text-sm text-red-600">{t("errPhone")}</p>}
        </div>
        <div>
          <label htmlFor={`${uid}-sites`} className={label}>{t("sites")}</label>
          <select id={`${uid}-sites`} value={f.sites} onChange={set("sites")} className={input("sites")}>
            {["1", "2-5", "6-20", "20+"].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${uid}-freq`} className={label}>{t("frequency")}</label>
          <select id={`${uid}-freq`} value={f.frequency} onChange={set("frequency")} className={input("frequency")}>
            {FREQ.map((v) => <option key={v} value={v}>{t(`freq.${v}`)}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-5">
        <label htmlFor={`${uid}-details`} className={label}>{t("details")}</label>
        <textarea id={`${uid}-details`} rows={4} maxLength={2000} value={f.details} onChange={set("details")} placeholder={t("detailsPlaceholder")} className={`${input("details")} resize-y`} />
      </div>
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label>Website<input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></label>
      </div>
      <div className="mt-5"><Turnstile onToken={setCaptchaToken} resetKey={nonce} /></div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full px-7 py-3 text-base font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        style={{ backgroundColor: primaryColor }}
      >
        {status === "sending" ? t("sending") : t("send")}
      </button>
      <p className="mt-3 text-xs text-[#7a817c]">{t("privacy")}</p>
    </form>
  );
}
