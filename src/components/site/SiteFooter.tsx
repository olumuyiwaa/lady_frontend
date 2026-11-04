"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { WidgetBusiness } from "@/app/api/widget.api";
import { readableTextOn } from "@/lib/color";
import { useTenantPaths } from "@/lib/tenantPaths";

type SiteFooterProps = {
  subdomain: string;
  businessName: string;
  logoUrl?: string | null;
  onBook?: () => void;
  phoneNumber?: string | null;
  socialLinks?: Partial<
    Record<"facebook" | "instagram" | "tiktok" | "linkedin" | "twitter", string>
  > | null;
  primaryColor?: string;
  accentColor?: string;
  /** Company details required on Dutch consumer-facing sites. */
  legal?: WidgetBusiness["legal"];
};

const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  twitter: "X (Twitter)",
};

export function SiteFooter({
  subdomain,
  businessName,
  logoUrl,
  onBook,
  phoneNumber,
  socialLinks,
  primaryColor = "#0B352A",
  accentColor = "#D0AA62",
  legal,
}: SiteFooterProps) {
  const t = useTranslations("Site.footer");
  const tn = useTranslations("Site.nav");
  const paths = useTenantPaths(subdomain);
  const bookHref = paths.book;
  const socialEntries = Object.entries(socialLinks || {}).filter(([, url]) => !!url);

  function handleBook(e: React.MouseEvent) {
    if (onBook) {
      e.preventDefault();
      onBook();
    }
  }

  return (
    <footer id="site-footer" className="site-footer border-t border-[#e4dfd4]">
      <div className="site-container py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr_1fr] sm:gap-12">
          <div>
            <div className="flex items-center gap-2.5">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={businessName}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/images/logo/todcleaning-logo.png"
                  alt={businessName}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-contain"
                  loading="lazy"
                />
              )}
              <span className="text-base font-semibold text-white/85 hover:text-white">
                {businessName}
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#c7d1cb]">
              {t("blurb")}
            </p>
            {phoneNumber && (
              <a
                href={`tel:${phoneNumber.replace(/[^+\d]/g, "")}`}
                className="mt-3 inline-block text-sm font-medium text-white/85 hover:text-white"
              >
                {phoneNumber}
              </a>
            )}
            {socialEntries.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {socialEntries.map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-white/75 underline-offset-2 hover:text-white hover:underline"
                  >
                    {SOCIAL_LABELS[platform] || platform}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em]"
              style={{ color: accentColor }}>
              {t("explore")}
            </h2>
            <a href={`${paths.home}#services`} className="text-sm text-white/80 hover:text-white">
              {tn("services")}
            </a>
            <a href={`${paths.home}#how-it-works`} className="text-sm text-white/80 hover:text-white">
              {tn("howItWorks")}
            </a>
            <Link href={paths.portal} className="text-sm text-white/80 hover:text-white">
              {t("portal")}
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em]"
              style={{ color: accentColor }}>
              {t("legal")}
            </h2>
            <Link href={paths.privacy} className="text-sm text-white/80 hover:text-white">
              {t("legalPrivacy")}
            </Link>
            <Link href={paths.terms} className="text-sm text-white/80 hover:text-white">
              {t("legalTerms")}
            </Link>
            <Link href={paths.cookies} className="text-sm text-white/80 hover:text-white">
              {t("legalCookies")}
            </Link>
          </div>

          <div className="flex flex-col gap-3 sm:items-start">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em]"
              style={{ color: accentColor }}>
              {t("ready")}
            </h2>
            <a
              href={bookHref}
              onClick={handleBook}
              className="inline-flex min-h-[46px] items-center justify-center rounded-full px-6 text-sm font-bold"
              style={{ backgroundColor: accentColor, color: readableTextOn(accentColor, "#092f26") }}
            >
              {t("book")}
            </a>
            <a
              href={`${paths.home}#services`}
              className="text-sm font-medium text-white/75 hover:text-white"
            >
              {t("viewServices")}
            </a>
          </div>
        </div>

        {legal && (legal.kvkNumber || legal.vatNumber || legal.address) && (
          <address className="mt-10 text-xs not-italic leading-relaxed text-white/60">
            <span className="font-medium text-white/80">{businessName}</span>
            {legal.address && (
              <span>
                {" · "}
                {legal.address.line1}, {legal.address.postalCode} {legal.address.city}
              </span>
            )}
            {legal.kvkNumber && <span>{" · "}{t("legalKvk", { number: legal.kvkNumber })}</span>}
            {legal.vatNumber && <span>{" · "}{t("legalVat", { number: legal.vatNumber })}</span>}
          </address>
        )}

        <div className="mt-6 flex flex-col-reverse items-start justify-between gap-3 border-t border-white/15 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-white/55">
            © {new Date().getFullYear()} {businessName}. {t("rights")}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href={paths.privacy} className="text-xs text-white/45 hover:text-white/80">
              {t("legalPrivacy")}
            </Link>
            <Link href={paths.terms} className="text-xs text-white/45 hover:text-white/80">
              {t("legalTerms")}
            </Link>
            <Link href={paths.cookies} className="text-xs text-white/45 hover:text-white/80">
              {t("legalCookies")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
