"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
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
  /** Average review score, e.g. 4.8 */
  reviewScore?: number | null;
  /** Total number of reviews */
  reviewCount?: number | null;
  onBook?: () => void;
  /** Start a booking with a postcode the visitor already checked. */
  onBookWithPostcode?: (postalCode: string) => void;
};

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
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
  reviewScore,
  reviewCount,
  onBook,
  onBookWithPostcode,
}: SiteHeroProps) {
  const t = useTranslations("Site.hero");
  const accent = accentColor || "#38a0d8";
  const image = heroImageUrl || "/images/after-room.jpg";

  const copy = t("copy", { name: businessName });
  const fullCopy = tagline?.trim() ? tagline.trim() : copy;

  return (
    <section
      className="site-hero relative isolate flex items-center overflow-hidden"
      style={{ "--site-accent": accent } as CSSProperties}
    >
      {/* Background photo */}
      <div className="site-hero-photo absolute inset-0" aria-hidden="true">
        <SiteImage src={image} alt="" fill preload sizes="100vw" className="object-cover" />
      </div>
      {/* Overlay */}
      <div className="site-hero-overlay absolute inset-0" aria-hidden="true" />
      {/* Subtle grid texture */}
      <div className="site-hero-grid" aria-hidden="true" />

      <div className="site-container relative z-[1] w-full pb-20 pt-48 sm:pb-28 sm:pt-52 lg:pt-56 lg:pb-32">

        {/* Floating phone pill — centred above fold */}
        {phoneNumber && (
          <a
            className="site-call-pill site-hero-call"
            href={`tel:${phoneNumber.replace(/[^+\d]/g, "")}`}
          >
            <span className="site-call-icon" aria-hidden="true">☎</span>
            <span>{t("call", { phone: phoneNumber })}</span>
          </a>
        )}

        <Reveal>
          <div className="site-hero-content">

            {/* Eyebrow */}
            <span className="site-eyebrow site-hero-eyebrow">
              <span className="site-eyebrow-dot" style={{ backgroundColor: accent }} />
              {t("eyebrow")}
            </span>

            {/* Headline */}
            <h1 className="site-hero-title mt-7">
              <span className="block">{businessName}</span>
              <span className="site-hero-title-accent block">{t("titleLine2")}</span>
            </h1>

            {/* Subheading */}
            <p className="site-hero-copy mt-6">{fullCopy}</p>

            {/* CTAs */}
            <div className="mt-9 flex flex-wrap gap-3">
              <button type="button" onClick={onBook} className="site-btn-primary site-btn-gold">
                {t("checkPrice")}
                <ArrowIcon />
              </button>
              <a href="#services" className="site-btn-secondary site-btn-dark">
                {t("exploreServices")}
              </a>
            </div>

            {/* Postcode checker */}
            <SitePostcodeCheck
              subdomain={subdomain}
              businessName={businessName}
              onBook={onBookWithPostcode}
            />

            {/* Proof strip */}
            <div className="site-hero-proof mt-9" aria-label="Service highlights">
              {reviewScore && reviewCount ? (
                <span className="site-hero-proof-reviews">
                  <span className="site-hero-proof-stars" aria-hidden="true">★★★★★</span>
                  {t("proofReviews", { score: reviewScore.toFixed(1), count: reviewCount })}
                </span>
              ) : null}
              <span>{t("proofEco")}</span>
              <span>{t("proofPayAfter")}</span>
              <span>{t("proofEnglish")}</span>
            </div>

          </div>
        </Reveal>
      </div>
    </section>
  );
}
