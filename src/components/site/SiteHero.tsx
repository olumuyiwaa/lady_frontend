"use client";

import type { CSSProperties, MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { useTenantPaths } from "@/lib/tenantPaths";
import { Reveal } from "./Reveal";
import { SiteImage } from "./SiteImage";
import { SitePostcodeCheck } from "./SitePostcodeCheck";

type SiteHeroProps = {
  subdomain: string;
  businessName: string;
  tagline?: string | null;
  heroImageUrl?: string | null;
  phoneNumber?: string | null;
  accentColor?: string | null;
  onBook?: () => void;
  /** Start a booking with a postcode the visitor already checked. */
  onBookWithPostcode?: (postalCode: string) => void;
};

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SiteHero({
  subdomain,
  businessName,
  tagline,
  heroImageUrl,
  phoneNumber,
  accentColor,
  onBook,
  onBookWithPostcode,
}: SiteHeroProps) {
  const t = useTranslations("Site.hero");
  const bookHref = useTenantPaths(subdomain).book;
  const accent = accentColor || "#D0AA62";
  const image = heroImageUrl || "/images/after-room.jpg";

  function handleBook(event: MouseEvent<HTMLAnchorElement>) {
    if (!onBook) return;
    event.preventDefault();
    onBook();
  }

  const copy = t("copy", { name: businessName });
  const fullCopy = tagline?.trim() ? `${copy} ${tagline.trim()}` : copy;

  return (
    <section
      className="site-hero relative isolate flex items-center overflow-hidden"
      style={{ "--site-accent": accent } as CSSProperties}
    >
      <div className="site-hero-photo absolute inset-0" aria-hidden="true">
        {/* SiteImage optimises our CDN host and falls back to a plain <img> for any other. */}
        <SiteImage src={image} alt="" fill preload sizes="100vw" className="object-cover" />
      </div>
      <div className="site-hero-overlay absolute inset-0" aria-hidden="true" />

      <div className="site-container relative z-[1] w-full pb-14 pt-44 sm:pb-20 sm:pt-48">
        {phoneNumber && (
          <a
            className="site-call-pill site-hero-call"
            href={`tel:${phoneNumber.replace(/[^+\d]/g, "")}`}
          >
            <span className="site-call-icon" aria-hidden="true">
              ☎
            </span>
            <span>{t("call", { phone: phoneNumber })}</span>
          </a>
        )}
        <Reveal>
          <div className="site-hero-content">
            <span className="site-eyebrow site-hero-eyebrow">
              <span className="site-eyebrow-dot" style={{ backgroundColor: accent }} />
              {t("eyebrow")}
            </span>

            <h1 className="site-hero-title mt-6">
              <span className="block">{businessName}</span>
              <span className="site-hero-title-accent block">{t("titleLine2")}</span>
            </h1>

            <p className="site-hero-copy mt-6 max-w-2xl">{fullCopy}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href={bookHref} onClick={handleBook} className="site-btn-primary site-btn-gold">
                {t("checkPrice")}
                <ArrowIcon />
              </a>
              <a href="#services" className="site-btn-secondary site-btn-dark">
                {t("exploreServices")}
              </a>
            </div>

            <SitePostcodeCheck subdomain={subdomain} businessName={businessName} onBook={onBookWithPostcode} />

            <div className="site-hero-proof mt-8" aria-label="Service highlights">
              <span>{t("proofTrusted")}</span>
              <span>{t("proofFlexible")}</span>
              <span>{t("proofClear")}</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
