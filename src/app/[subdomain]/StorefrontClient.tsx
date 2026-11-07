"use client";

import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { StorefrontResponse } from "@/app/api/widget.api";
import { AssistantChat } from "@/components/assistant/AssistantChat";
import { setActiveCurrency } from "@/app/services/currency";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteHero } from "@/components/site/SiteHero";
import { SiteServices } from "@/components/site/SiteServices";
import { SiteHowItWorks } from "@/components/site/SiteHowItWorks";
import { SiteAbout } from "@/components/site/SiteAbout";
import { SiteTestimonials } from "@/components/site/SiteTestimonials";
import { SiteGallery } from "@/components/site/SiteGallery";
import { SiteFaq } from "@/components/site/SiteFaq";
import { SiteCtaBand } from "@/components/site/SiteCtaBand";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteContact } from "@/components/site/SiteContact";
import { BookingWidgetModal } from "@/components/widget/BookingWidgetModal";
import { brandForWhiteText } from "@/lib/color";
import { resolveSectionOrder, type SectionKey } from "@/lib/sections";
import { captureReferralFromUrl } from "@/lib/referral";

const DEFAULT_PRIMARY = "#0b1a35";
const DEFAULT_ACCENT = "#6bb5e4";

export function StorefrontClient({
  subdomain,
  data,
}: {
  subdomain: string;
  data: StorefrontResponse;
}) {
  const [bookOpen, setBookOpen] = useState(false);
  // Postcode the visitor already confirmed on the storefront; prefilled in the wizard.
  const [bookPostcode, setBookPostcode] = useState<string | undefined>(undefined);
  const openBook = useCallback(() => {
    setBookPostcode(undefined);
    setBookOpen(true);
  }, []);
  const openBookWithPostcode = useCallback((postalCode: string) => {
    setBookPostcode(postalCode);
    setBookOpen(true);
  }, []);
  const closeBook = useCallback(() => setBookOpen(false), []);

  const business = data.business;
  const branding = business.branding;

  // A friend's referral link (?ref=CODE): remember it so the booking can use it.
  useEffect(() => {
    captureReferralFromUrl();
  }, []);

  // Align money formatting in the booking modal with this business.
  useEffect(() => {
    setActiveCurrency(business.currency);
  }, [business.currency]);

  const primaryColor = branding?.primaryColor || DEFAULT_PRIMARY;
  const accentColor = branding?.accentColor || DEFAULT_ACCENT;
  // Tenants choose their own colours; white text on a pale primary is unreadable.
  const safePrimary = brandForWhiteText(primaryColor, DEFAULT_PRIMARY);
  const name = business.name;
  const tNav = useTranslations("Site.nav");
  const logoUrl = branding?.logoUrl ?? null;
  const tagline = branding?.tagline ?? null;
  const themeStyle = branding?.themeStyle || "MODERN";

  const sectionsConfig = branding?.sectionsEnabled;
  const isEnabled = (key: SectionKey) => (sectionsConfig ? sectionsConfig[key] !== false : true);

  // Each section still renders nothing when it has no real content; this only
  // controls visibility and order.
  const optionalSections: Record<SectionKey, ReactNode> = {
    about: isEnabled("about") ? (
      <SiteAbout
        key="about"
        title={branding?.aboutTitle ?? null}
        body={branding?.aboutBody ?? null}
        heroImageUrl={branding?.heroImageUrl ?? null}
        primaryColor={safePrimary}
      />
    ) : null,
    testimonials: isEnabled("testimonials") ? (
      <SiteTestimonials key="testimonials" testimonials={branding?.testimonials} primaryColor={safePrimary} />
    ) : null,
    gallery: isEnabled("gallery") ? (
      <SiteGallery
        key="gallery"
        imageUrls={branding?.galleryImageUrls}
        primaryColor={safePrimary}
        businessName={name}
      />
    ) : null,
    faq: isEnabled("faq") ? (
      <SiteFaq key="faq" items={branding?.faqItems} primaryColor={safePrimary} />
    ) : null,
  };

  // Tenant colours as CSS variables so site.css (hero, buttons) and any child
  // can follow them instead of hard-coding the default green/gold.
  const themeVars = {
    "--site-primary": safePrimary,
    "--site-accent": accentColor,
  } as CSSProperties;

  return (
    <div data-theme-style={themeStyle} style={themeVars}>
      {/* First tab stop: lets keyboard and screen-reader users jump past the header. Invisible until focused. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-white focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-[#0e1624] focus:shadow-lg focus:ring-2 focus:ring-[#0e1624]"
      >
        {tNav("skipToContent")}
      </a>
      <SiteHeader
        subdomain={subdomain}
        businessName={name}
        logoUrl={logoUrl}
        primaryColor={safePrimary}
        hasAbout={Boolean(branding?.aboutTitle || branding?.aboutBody)}
        hasTestimonials={true}
        hasFaq={true}
        onBook={openBook}
      />
      <main id="main-content" tabIndex={-1} className="outline-none">
        <SiteHero
          subdomain={subdomain}
          businessName={name}
          tagline={tagline}
          heroImageUrl={branding?.heroImageUrl}
          phoneNumber={business.phone}
          accentColor={accentColor}
          reviewScore={branding?.reviewScore ?? 4.8}
          reviewCount={branding?.reviewCount ?? 146}
          onBook={openBook}
          onBookWithPostcode={openBookWithPostcode}
        />
        <SiteServices
          subdomain={subdomain}
          services={data.services}
          primaryColor={safePrimary}
          onBook={openBook}
          currency={business.currency}
        />
        <SiteHowItWorks primaryColor={safePrimary} />
        {resolveSectionOrder(sectionsConfig?.order).map((key) => optionalSections[key])}
        <SiteContact
          subdomain={subdomain}
          businessName={name}
          primaryColor={safePrimary}
          phoneNumber={business.phone}
        />
        <SiteCtaBand subdomain={subdomain} businessName={name} onBook={openBook} />
      </main>
      <SiteFooter
        subdomain={subdomain}
        businessName={name}
        logoUrl={logoUrl}
        onBook={openBook}
        phoneNumber={business.phone}
        socialLinks={branding?.socialLinks}
        primaryColor={safePrimary}
        accentColor={accentColor}
        legal={business.legal}
      />

      {data.assistantEnabled && <AssistantChat slug={subdomain} businessName={name} primaryColor={safePrimary} />}

      <BookingWidgetModal
        open={bookOpen}
        onClose={closeBook}
        subdomain={subdomain}
        business={business}
        services={data.services}
        businessName={name}
        primaryColor={safePrimary}
        payment={data.payment}
        cancellationPolicy={data.cancellationPolicy}
        questions={data.questions}
        initialPostalCode={bookPostcode}
      />
    </div>
  );
}
