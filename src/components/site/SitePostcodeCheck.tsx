"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { checkServiceArea } from "@/app/api/widget.api";
import { isDutchPostcode } from "@/lib/nlAddress";

type Status = "idle" | "checking" | "covered" | "outside" | "unknown" | "invalid" | "error";

type Props = {
  subdomain: string;
  businessName: string;
  /** Start a booking with this (normalised) postcode already filled in. */
  onBook?: (postalCode: string) => void;
};

const pretty = (pc: string) => (pc.length === 6 ? `${pc.slice(0, 4)} ${pc.slice(4)}` : pc);

/**
 * "Do we clean in your area?" - the first thing a visitor wants to know, asked
 * up front instead of at the end of the booking form. Answers in a second;
 * a covered postcode carries straight into the booking wizard.
 */
export function SitePostcodeCheck({ subdomain, businessName, onBook }: Props) {
  const t = useTranslations("Site.postcode");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [checked, setChecked] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (status === "checking") return;
    if (!isDutchPostcode(value)) {
      setStatus("invalid");
      return;
    }
    setStatus("checking");
    try {
      const result = await checkServiceArea(subdomain, value.trim());
      setChecked(pretty(result.postalCode));
      setStatus(result.covered === true ? "covered" : result.covered === false ? "outside" : "unknown");
    } catch {
      setStatus("error");
    }
  }

  const message =
    status === "covered" ? t("covered", { postalCode: checked })
    : status === "outside" ? t("outside", { name: businessName, postalCode: checked })
    : status === "unknown" ? t("unknown", { postalCode: checked })
    : status === "invalid" ? t("invalid")
    : status === "error" ? t("error")
    : "";
  const canBook = status === "covered" || status === "unknown";

  return (
    <div className="mt-8 w-full max-w-xl">
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row" noValidate>
        <label htmlFor="site-postcode" className="sr-only">
          {t("label")}
        </label>
        <input
          id="site-postcode"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (status !== "checking") setStatus("idle");
          }}
          placeholder={t("placeholder")}
          autoComplete="postal-code"
          inputMode="text"
          maxLength={7}
          aria-invalid={status === "invalid"}
          aria-describedby="site-postcode-result"
          className="h-12 flex-1 rounded-full border border-white/30 bg-white/95 px-5 text-sm text-[#0e1624] outline-none placeholder:text-[#7a817c] focus:ring-2 focus:ring-white/60"
        />
        <button
          type="submit"
          disabled={status === "checking" || !value.trim()}
          className="h-12 rounded-full bg-white/15 px-6 text-sm font-semibold text-white ring-1 ring-white/40 backdrop-blur transition hover:bg-white/25 disabled:opacity-60"
        >
          {status === "checking" ? t("checking") : t("check")}
        </button>
      </form>

      <div id="site-postcode-result" role="status" aria-live="polite" className="mt-3 min-h-[1.5rem] text-sm text-white">
        {message && <p className="leading-relaxed">{message}</p>}
        {canBook && onBook && (
          <button
            type="button"
            onClick={() => onBook(checked.replace(/\s/g, ""))}
            className="mt-2 inline-flex rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#0e1624] transition hover:bg-white/90"
          >
            {t("book")}
          </button>
        )}
        {status === "outside" && (
          <a
            href="#contact"
            className="mt-2 inline-flex rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#0e1624] transition hover:bg-white/90"
          >
            {t("contact")}
          </a>
        )}
      </div>
    </div>
  );
}
