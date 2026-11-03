"use client";

import { useTranslations } from "next-intl";
import { useTenantPaths } from "@/lib/tenantPaths";
import { Reveal } from "./Reveal";

type SiteCtaBandProps = {
  subdomain: string;
  businessName: string;
  onBook?: () => void;
};

export function SiteCtaBand({
  subdomain,
  businessName,
  onBook,
}: SiteCtaBandProps) {
  const t = useTranslations("Site.ctaBand");
  const bookHref = useTenantPaths(subdomain).book;

  function handleBook(e: React.MouseEvent) {
    if (onBook) {
      e.preventDefault();
      onBook();
    }
  }

  return (
    <section className="site-cta-band py-24 sm:py-32">
      <div className="site-container">
        <Reveal>
          <div className="site-cta-content">
            <span className="site-cta-eyebrow">{t("eyebrow")}</span>
            <h2 className="site-cta-title mt-5">{t("title")}</h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              {t("body", { name: businessName })}
            </p>
            <a
              href={bookHref}
              onClick={handleBook}
              className="site-btn-primary site-btn-gold mt-9"
            >
              {t("check")}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
