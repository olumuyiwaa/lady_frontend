"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { submitContact } from "@/app/api/widget.api";
import { fieldErrorMap, type ApiError } from "@/lib/formErrors";
import { Turnstile, TURNSTILE_SITE_KEY } from "@/components/booking/Turnstile";
import { Reveal } from "./Reveal";

type SiteContactProps = {
  subdomain: string;
  businessName: string;
  primaryColor: string;
  /** Public phone number, shown as an alternative to the form. */
  phoneNumber?: string | null;
};

type FieldKey = "name" | "email" | "phone" | "message";
type Fields = Record<FieldKey, string>;

const EMPTY: Fields = { name: "", email: "", phone: "", message: "" };

// Same rules as the API (widget.routes.js contactValidators), so the visitor is
// told before a round trip. The API remains the authority.
const EMAIL_RE = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]{2,}$/;
const PHONE_RE = /^[+\d\s().-]{5,40}$/;

function validate(f: Fields): FieldKey[] {
  const bad: FieldKey[] = [];
  if (!f.name.trim() || f.name.trim().length > 100) bad.push("name");
  if (!EMAIL_RE.test(f.email.trim()) || f.email.trim().length > 254) bad.push("email");
  if (f.phone.trim() && !PHONE_RE.test(f.phone.trim())) bad.push("phone");
  const len = f.message.trim().length;
  if (len < 10 || len > 3000) bad.push("message");
  return bad;
}

export function SiteContact({ subdomain, businessName, primaryColor, phoneNumber }: SiteContactProps) {
  const t = useTranslations("Site.contact");
  const uid = useId();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [honeypot, setHoneypot] = useState("");
  const [invalid, setInvalid] = useState<FieldKey[]>([]);
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [reference, setReference] = useState("");
  const [sentTo, setSentTo] = useState({ name: "", email: "" });
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaNonce, setCaptchaNonce] = useState(0);

  const needsCaptcha = Boolean(TURNSTILE_SITE_KEY) && !captchaToken;

  const set = (key: FieldKey) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    if (invalid.includes(key)) setInvalid((list) => list.filter((k) => k !== key));
  };

  const fieldError: Record<FieldKey, string> = {
    name: t("errName"),
    email: t("errEmail"),
    phone: t("errPhone"),
    message: fields.message.trim().length > 3000 ? t("errMessageLong") : t("errMessage"),
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setFormError("");

    const bad = validate(fields);
    setInvalid(bad);
    if (bad.length) {
      document.getElementById(`${uid}-${bad[0]}`)?.focus();
      return;
    }
    if (needsCaptcha) {
      setFormError(t("errCaptcha"));
      return;
    }

    setStatus("sending");
    try {
      const result = await submitContact(subdomain, {
        name: fields.name.trim(),
        email: fields.email.trim(),
        phone: fields.phone.trim() || undefined,
        message: fields.message.trim(),
        website: honeypot,
        captchaToken: captchaToken || undefined,
      });
      setReference(result.reference);
      setSentTo({ name: fields.name.trim(), email: fields.email.trim() });
      setFields(EMPTY);
      setStatus("sent");
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 422) {
        // Show OUR localized text for the fields the server rejected.
        const keys = Object.keys(fieldErrorMap(err)).filter((k): k is FieldKey =>
          ["name", "email", "phone", "message"].includes(k)
        );
        if (keys.length) setInvalid(keys);
        else setFormError(t("errGeneric"));
      } else if (apiErr.status === 429) {
        setFormError(t("errRateLimit"));
      } else if (apiErr.status === 400) {
        setFormError(t("errCaptcha"));
      } else {
        setFormError(t("errGeneric"));
      }
      setStatus("idle");
    } finally {
      // Turnstile tokens are single-use: always ask for a fresh one.
      setCaptchaToken(null);
      setCaptchaNonce((n) => n + 1);
    }
  }

  const inputClass = (key: FieldKey) =>
    `mt-1.5 block w-full rounded-xl border bg-white px-4 py-3 text-base text-[#102c24] outline-none transition placeholder:text-[#9aa19c] focus:ring-4 ${
      invalid.includes(key)
        ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
        : "border-[#d9d4c7] focus:border-[#102c24] focus:ring-[#102c24]/10"
    }`;

  const labelClass = "block text-sm font-medium text-[#102c24]";

  return (
    <section
      id="contact"
      className="site-section-cream scroll-mt-24 border-t border-[#e7e3d9] py-20 sm:py-24"
      aria-labelledby={`${uid}-title`}
    >
      <div className="site-container grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:gap-16">
        <Reveal>
          <div className="max-w-md">
            <span className="site-eyebrow">
              <span className="site-eyebrow-dot" style={{ backgroundColor: primaryColor }} />
              {t("eyebrow")}
            </span>
            <h2 id={`${uid}-title`} className="site-section-title mt-5">
              {t("title")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#616963] sm:text-lg">{t("subtitle")}</p>
            {phoneNumber ? (
              <p className="mt-6 text-base text-[#102c24]">
                {t("callInstead")}{" "}
                <a
                  href={`tel:${phoneNumber.replace(/[^\d+]/g, "")}`}
                  className="font-semibold underline decoration-2 underline-offset-4"
                >
                  {phoneNumber}
                </a>
              </p>
            ) : null}
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="rounded-2xl border border-[#e4dfd4] bg-white p-6 shadow-sm sm:p-8">
            {status === "sent" ? (
              <div role="status" aria-live="polite" className="py-6 text-center">
                <span
                  className="mx-auto grid h-12 w-12 place-items-center rounded-full text-white"
                  style={{ backgroundColor: primaryColor }}
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <h3 className="mt-5 text-xl font-semibold text-[#102c24]">{t("sentTitle")}</h3>
                <p className="mt-2 text-[#616963]">
                  {t("sentBody", { name: sentTo.name, business: businessName, email: sentTo.email })}
                </p>
                {reference ? (
                  <p className="mt-3 text-sm text-[#616963]">{t("reference", { reference })}</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="mt-6 text-sm font-semibold text-[#102c24] underline decoration-2 underline-offset-4"
                >
                  {t("another")}
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`${uid}-name`} className={labelClass}>
                      {t("nameLabel")}
                    </label>
                    <input
                      id={`${uid}-name`}
                      type="text"
                      autoComplete="name"
                      maxLength={100}
                      value={fields.name}
                      onChange={set("name")}
                      aria-invalid={invalid.includes("name")}
                      aria-describedby={invalid.includes("name") ? `${uid}-name-err` : undefined}
                      className={inputClass("name")}
                    />
                    {invalid.includes("name") && (
                      <p id={`${uid}-name-err`} role="alert" className="mt-1.5 text-sm text-red-600">
                        {fieldError.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor={`${uid}-email`} className={labelClass}>
                      {t("emailLabel")}
                    </label>
                    <input
                      id={`${uid}-email`}
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      maxLength={254}
                      value={fields.email}
                      onChange={set("email")}
                      aria-invalid={invalid.includes("email")}
                      aria-describedby={invalid.includes("email") ? `${uid}-email-err` : undefined}
                      className={inputClass("email")}
                    />
                    {invalid.includes("email") && (
                      <p id={`${uid}-email-err`} role="alert" className="mt-1.5 text-sm text-red-600">
                        {fieldError.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <label htmlFor={`${uid}-phone`} className={labelClass}>
                    {t("phoneLabel")}
                  </label>
                  <input
                    id={`${uid}-phone`}
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    maxLength={40}
                    value={fields.phone}
                    onChange={set("phone")}
                    aria-invalid={invalid.includes("phone")}
                    aria-describedby={invalid.includes("phone") ? `${uid}-phone-err` : undefined}
                    className={inputClass("phone")}
                  />
                  {invalid.includes("phone") && (
                    <p id={`${uid}-phone-err`} role="alert" className="mt-1.5 text-sm text-red-600">
                      {fieldError.phone}
                    </p>
                  )}
                </div>

                <div className="mt-5">
                  <label htmlFor={`${uid}-message`} className={labelClass}>
                    {t("messageLabel")}
                  </label>
                  <textarea
                    id={`${uid}-message`}
                    rows={5}
                    maxLength={3000}
                    value={fields.message}
                    onChange={set("message")}
                    placeholder={t("messagePlaceholder")}
                    aria-invalid={invalid.includes("message")}
                    aria-describedby={invalid.includes("message") ? `${uid}-message-err` : undefined}
                    className={`${inputClass("message")} resize-y`}
                  />
                  {invalid.includes("message") && (
                    <p id={`${uid}-message-err`} role="alert" className="mt-1.5 text-sm text-red-600">
                      {fieldError.message}
                    </p>
                  )}
                </div>

                {/* Honeypot: hidden from people and assistive tech; bots fill it. */}
                <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
                  <label>
                    Website
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </label>
                </div>

                <div className="mt-5">
                  <Turnstile onToken={setCaptchaToken} resetKey={captchaNonce} />
                </div>

                {formError && (
                  <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-6 text-base font-semibold text-white shadow-sm transition hover:opacity-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#102c24]/25 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ backgroundColor: primaryColor }}
                >
                  {status === "sending" ? t("sending") : t("send")}
                </button>
                <p className="mt-3 text-center text-xs text-[#7a817c]">{t("privacy")}</p>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
