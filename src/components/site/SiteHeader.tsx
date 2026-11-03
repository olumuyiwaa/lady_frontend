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

  const nav = [
    { label: t("services"), href: "#services" },
    { label: t("howItWorks"), href: "#how-it-works" },
    ...(hasAbout ? [{ label: t("about"), href: "#about" }] : []),
    ...(hasTestimonials ? [{ label: t("reviews"), href: "#testimonials" }] : []),
    ...(hasFaq ? [{ label: t("faq"), href: "#faq" }] : []),
    { label: t("contact"), href: "#contact" },
  ];

  const initial = businessName.trim().charAt(0).toUpperCase() || "C";
  const paths = useTenantPaths(subdomain);
  const bookHref = paths.book;
  const portalHref = paths.portal;

  function handleBook(e: React.MouseEvent) {
    if (onBook) {
      e.preventDefault();
      onBook();
      setMenuOpen(false);
    }
  }

  return (
      <header className="site-header-shell fixed inset-x-0 top-4 z-50 px-4 sm:top-5 sm:px-7">
        <div className={`site-header-pill mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-7 ${scrolled ? "site-header-pill-scrolled" : ""}`}>
          <a href="#top" className="flex min-w-0 items-center gap-3 shrink-0">
            {logoUrl ? (
                <SiteImage
                    src={logoUrl}
                    alt={businessName}
                    width={48}
                    height={48}
                    preload
                    className="h-10 w-10 rounded-lg object-contain sm:h-12 sm:w-12"
                />
            ) : (
                <span
                    className="grid h-10 w-10 place-items-center rounded-lg text-base font-semibold text-white shadow-sm sm:h-12 sm:w-12"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
                    }}
                >
              {initial}
            </span>
            )}
            <span className="truncate text-base font-semibold tracking-tight text-[#102c24] sm:text-lg">
            {businessName}
          </span>
          </a>

          <nav className="hidden items-center gap-1 lg:flex" aria-label={t("siteNav")}>
            {nav.map((item) => (
                <a
                    key={item.href}
                    href={item.href}
                    className="rounded-full px-3 py-2 text-sm font-semibold text-[#253d34] transition-colors hover:bg-[#f3f0e9] hover:text-[#102c24] xl:px-4"
                >
                  {item.label}
                </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 shrink-0 md:flex">
            <LanguageSwitcher />
            <Link
                href={portalHref}
                className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold text-[#253d34] transition-colors hover:bg-[#f3f0e9]"
            >
              {t("portal")}
            </Link>
            <a
                href={bookHref}
                onClick={handleBook}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#082e25] px-5 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                style={{
                  boxShadow: "0 8px 24px rgba(8, 46, 37, .18)",
                }}
            >
              {t("book")}
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full border border-[#e6e4dc] bg-[#f8f8f5] lg:hidden"
              aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
              aria-expanded={menuOpen}
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
            <div className="site-mobile-menu mx-auto mt-3 max-w-[1400px] lg:hidden">
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
                <a
                    href={bookHref}
                    onClick={handleBook}
                    className="mt-2 rounded-full bg-[#082e25] px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  {t("book")}
                </a>
              </div>
            </div>
        )}
      </header>
  );
}