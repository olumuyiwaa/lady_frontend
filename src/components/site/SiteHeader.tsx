"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useTenantPaths } from "@/lib/tenantPaths";
import { SiteImage } from "./SiteImage";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

type SiteHeaderProps = {
  subdomain: string;
  businessName: string;
  logoUrl?: string | null;
  hasAbout?: boolean;
  hasTestimonials?: boolean;
  hasFaq?: boolean;
  primaryColor: string;
  onBook?: () => void;
};

export function SiteHeader({
                             subdomain,
                             businessName,
                             logoUrl,
                             hasAbout,
                             hasTestimonials,
                             hasFaq,
                             primaryColor,
                             onBook,
                           }: SiteHeaderProps) {
  const t = useTranslations("Site.nav");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape closes the mobile menu (keyboard users had no way to dismiss it).
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const paths = useTenantPaths(subdomain);
  const portalHref = paths.portal;

  // Section links point at the home page ("/#services"), not just "#services":
  // this header is also used on the legal pages, which have no such sections,
  // so a bare hash did nothing there. On the home page the browser treats
  // "/#services" as an in-page jump (no reload).
  const nav = [
    { label: t("services"), href: `${paths.home}#services` },
    { label: t("howItWorks"), href: `${paths.home}#how-it-works` },
    ...(hasAbout ? [{ label: t("about"), href: `${paths.home}#about` }] : []),
    ...(hasTestimonials ? [{ label: t("reviews"), href: `${paths.home}#testimonials` }] : []),
    ...(hasFaq ? [{ label: t("faq"), href: `${paths.home}#faq` }] : []),
    { label: t("forBusiness"), href: paths.business },
    { label: t("contact"), href: `${paths.home}#contact` },
  ];

  function handleBook() {
    if (onBook) {
      onBook();
      setMenuOpen(false);
    }
  }

  return (
      <header className="site-header-shell site-container fixed inset-x-0 top-4 z-50 sm:top-5">
        <div className={`site-header-pill mx-auto flex max-w-[1680px] items-center justify-between gap-3 px-4 py-3 sm:px-7 ${scrolled ? "site-header-pill-scrolled" : ""}`}>
          <a href={`${paths.home}#top`} className="flex min-w-0 items-center gap-2.5 shrink-0">
            {logoUrl ? (
                <SiteImage
                    src={logoUrl}
                    alt={businessName}
                    width={52}
                    height={52}
                    preload
                    className="h-11 w-11 rounded-full object-contain sm:h-[52px] sm:w-[52px]"
                />
            ) : (
                <img
                    src="/images/logo/todcleaning-logo.png"
                    alt={businessName}
                    width={52}
                    height={52}
                    className="h-11 w-11 rounded-full object-contain sm:h-[52px] sm:w-[52px]"
                    loading="eager"
                    fetchPriority="high"
                />
            )}
            <span className="truncate text-base font-semibold tracking-tight text-[#0a2e22] sm:text-lg">
              {businessName}
            </span>
          </a>

          <nav className="hidden items-center gap-1 lg:flex" aria-label={t("siteNav")}>
            {nav.map((item) => (
                <a
                    key={item.href}
                    href={item.href}
                    className="rounded-full px-3 py-2 text-sm font-semibold text-[#1a2e25] transition-colors hover:bg-[#f0ede6] hover:text-[#0a2e22] xl:px-4"
                >
                  {item.label}
                </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 shrink-0 md:flex">
            <LanguageSwitcher />
            <Link
                href={portalHref}
                className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold text-[#1a2e25] transition-colors hover:bg-[#f0ede6]"
            >
              {t("portal")}
            </Link>
            <button
                type="button"
                onClick={handleBook}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0a2e22] px-5 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:brightness-110"
                style={{
                  boxShadow: "0 6px 20px rgba(10, 46, 34, .20)",
                }}
            >
              {t("book")}
              <span aria-hidden="true">↗</span>
            </button>
          </div>

          <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full border border-[#e6e4dc] bg-[#f8f8f5] lg:hidden"
              aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
              aria-expanded={menuOpen}
              aria-controls="site-mobile-menu"
              onClick={() => setMenuOpen((v) => !v)}
          >
          <span className="relative block h-3 w-5">
            <span
                className={`absolute left-0 top-0 h-[2px] w-full bg-[#171B1A] transition-transform ${
                    menuOpen ? "translate-y-[5px] rotate-45" : ""
                }`}
            />
            <span
                className={`absolute left-0 bottom-0 h-[2px] w-full bg-[#171B1A] transition-transform ${
                    menuOpen ? "-translate-y-[5px] -rotate-45" : ""
                }`}
            />
          </span>
          </button>
        </div>

        {menuOpen && (
            <div id="site-mobile-menu" className="site-mobile-menu mx-auto mt-3 max-w-[1680px] lg:hidden">
              <div className="flex flex-col p-3">
                {nav.map((item) => (
                    <a
                        key={item.href}
                        href={item.href}
                        className="rounded-xl px-3 py-3 text-sm font-semibold text-[#253d34] hover:bg-[#f3f0e9]"
                        onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                ))}
                <LanguageSwitcher className="mt-2 self-center" />
                <Link
                    href={portalHref}
                    className="mt-2 rounded-full border border-[#e6e4dc] px-4 py-3 text-center text-sm font-semibold text-[#253d34]"
                    onClick={() => setMenuOpen(false)}
                >
                  {t("portal")}
                </Link>
                <button
                    type="button"
                    onClick={handleBook}
                    className="mt-2 rounded-full bg-[#082e25] px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  {t("book")}
                </button>
              </div>
            </div>
        )}
      </header>
  );
}