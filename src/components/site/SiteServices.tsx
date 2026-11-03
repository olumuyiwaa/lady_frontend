"use client";

import { useTranslations } from "next-intl";
import { useTenantPaths } from "@/lib/tenantPaths";
import { Reveal } from "./Reveal";
import { formatMoneyUnits } from "@/app/services/currency";
import type { WidgetService } from "@/app/api/widget.api";

type SiteServicesProps = {
  subdomain: string;
  services: WidgetService[];
  primaryColor: string;
  onBook?: () => void;
  currency?: string;
};

function centsToDisplay(cents: number, currency?: string) {
  return formatMoneyUnits(cents / 100, currency, { whole: true });
}

/* SVG icons for the USP strip — keeps rendering crisp at any DPI */
const USP_ICONS = {
  payAfter: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="3"/>
      <path d="M2 10h20"/>
    </svg>
  ),
  eco: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22V12"/>
      <path d="M5 12C5 7 8.5 4 12 4c3.5 0 7 3 7 8-3.5 0-7-1-9-2.5"/>
    </svg>
  ),
  english: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>
    </svg>
  ),
  rated: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  moveOut: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  booking: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
};

export function SiteServices({ subdomain, services, primaryColor, onBook, currency }: SiteServicesProps) {
  const t = useTranslations("Site.services");
  const paths = useTenantPaths(subdomain);
  const bookHref = paths.book;

  function handleBook(e: React.MouseEvent) {
    if (onBook) {
      e.preventDefault();
      onBook();
    }
  }

  if (!services.length) {
    return (
      <section id="services" className="site-section-light scroll-mt-24 py-24 sm:py-32">
        <div className="site-container">
          <div className="mx-auto max-w-xl rounded-3xl border border-[#e8e3d8] bg-white px-8 py-12 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-[#111918]">{t("emptyTitle")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#5c6b64]">{t("emptyBody")}</p>
            <a href={paths.portal} className="mt-6 inline-flex text-sm font-semibold text-[#0a2e22] underline-offset-2 hover:underline">
              {t("portalLink")}
            </a>
          </div>
        </div>
      </section>
    );
  }

  const active = services.filter((s) => s.isActive !== false);

  const trustItems = [
    { icon: USP_ICONS.payAfter, label: t("trustPayAfter") },
    { icon: USP_ICONS.eco,      label: t("trustEco") },
    { icon: USP_ICONS.english,  label: t("trustEnglish") },
    { icon: USP_ICONS.rated,    label: t("trustRated") },
    { icon: USP_ICONS.moveOut,  label: t("trustMoveOut") },
    { icon: USP_ICONS.booking,  label: t("trustBooking") },
  ];

  return (
    <section id="services" className="site-section-light scroll-mt-24 py-24 sm:py-32">
      <div className="site-container">

        {/* Section header */}
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="site-eyebrow">
              <span className="site-eyebrow-dot" style={{ backgroundColor: primaryColor, boxShadow: `0 0 0 4px ${primaryColor}18` }} />
              {t("eyebrow")}
            </span>
            <h2 className="site-section-title mt-5">{t("title")}</h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#5c6b64] sm:text-lg">
              {t("subtitle")}
            </p>
          </div>
        </Reveal>

        {/* USP trust strip */}
        <Reveal>
          <ul
            className="my-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
            aria-label={t("trustLabel")}
          >
            {trustItems.map((item) => (
              <li
                key={item.label}
                className="flex flex-col items-center gap-3 rounded-2xl border border-[#ece7dc] bg-[#faf7f2] px-3 py-5 text-center"
                style={{ color: primaryColor }}
              >
                {item.icon}
                <span className="text-xs font-semibold leading-snug text-[#374b43]">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Service grid */}
        <ul className="site-service-grid mt-14">
          {active.map((svc, i) => {
            const price = centsToDisplay(svc.basePriceCents, currency);
            const modelLabel = t(`model.${svc.pricingModel}` as "model.FLAT");
            const addOnCount = svc.addOns?.length ?? 0;

            return (
              <Reveal key={svc.id} delay={i * 55}>
                <li className="site-service-card group">
                  <div className="site-service-card-top">
                    <span className="site-service-index">{String(i + 1).padStart(2, "0")}</span>
                    <span
                      className="site-service-model"
                      style={{ color: primaryColor, backgroundColor: `${primaryColor}14` }}
                    >
                      {modelLabel}
                    </span>
                  </div>

                  <h3 className="site-service-name">{svc.name}</h3>

                  {svc.description ? (
                    <p className="site-service-desc">{svc.description}</p>
                  ) : (
                    <p className="site-service-desc site-service-desc-muted">{t("noDescription")}</p>
                  )}

                  <div className="site-service-meta">
                    <div className="site-service-price-block">
                      <span className="site-service-price-label">{t("fromLabel")}</span>
                      <span className="site-service-price-value">{price}</span>
                    </div>
                    <div className="site-service-chips">
                      {svc.estimatedMinutes ? (
                        <span className="site-service-chip">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                            <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                          {t("approxMin", { count: svc.estimatedMinutes })}
                        </span>
                      ) : null}
                      {addOnCount > 0 ? (
                        <span className="site-service-chip">{t("addons", { count: addOnCount })}</span>
                      ) : null}
                    </div>
                  </div>

                  <a
                    href={bookHref}
                    onClick={handleBook}
                    className="site-service-cta"
                    style={{ "--service-color": primaryColor } as React.CSSProperties}
                  >
                    {t("bookThis")}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </li>
              </Reveal>
            );
          })}
        </ul>

      </div>
    </section>
  );
}
