import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/locales";
import { canonicalOrigin } from "@/lib/tenantUrl";
import { pageSeo } from "@/lib/seo";
import { safeJsonLd } from "@/lib/jsonLd";
import { getStorefrontServer } from "@/app/api/storefront.server";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { BusinessEnquiryForm } from "@/components/site/BusinessEnquiryForm";

type PageProps = { params: Promise<{ subdomain: string }> };

const BENEFITS = ["invoice", "team", "locations", "portal", "reliability", "compliance"] as const;
const AUDIENCE = ["offices", "retail", "hospitality", "property", "health", "education"] as const;
const STEPS = ["enquire", "walkthrough", "start"] as const;
const FAQ = ["contract", "invoice", "insurance", "start"] as const;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await params;
  const data = await getStorefrontServer(subdomain);
  if (!data) return { title: "Not found", robots: { index: false, follow: false } };
  const t = await getTranslations("Site.business");
  const locale = (await getLocale()) as AppLocale;
  const seo = pageSeo(canonicalOrigin(data.business, subdomain), "/business", locale);
  const title = `${t("metaTitle")} | ${data.business.name}`;
  return {
    ...(seo.metadataBase ? { metadataBase: seo.metadataBase } : {}),
    ...(seo.alternates ? { alternates: seo.alternates } : {}),
    title,
    description: t("metaDescription"),
    openGraph: { title, description: t("metaDescription"), type: "website", ...seo.openGraph },
  };
}

export default async function BusinessPage({ params }: PageProps) {
  const { subdomain } = await params;
  const data = await getStorefrontServer(subdomain);
  if (!data) notFound();
  const t = await getTranslations("Site.business");
  const { business } = data;
  const primary = business.branding?.primaryColor ?? "#0B352A";
  const accent = business.branding?.accentColor ?? "#D0AA62";
  const origin = canonicalOrigin(business, subdomain);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: t("metaTitle"),
        serviceType: "Commercial cleaning",
        description: t("metaDescription"),
        provider: { "@type": "LocalBusiness", name: business.name, ...(origin ? { url: origin } : {}) },
        audience: { "@type": "BusinessAudience", name: t("audienceTitle") },
        ...(business.legal?.address?.country ? { areaServed: business.legal.address.country } : {}),
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((k) => ({
          "@type": "Question",
          name: t(`faq.${k}.q`),
          acceptedAnswer: { "@type": "Answer", text: t(`faq.${k}.a`) },
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <SiteHeader
        subdomain={subdomain}
        businessName={business.name}
        logoUrl={business.branding?.logoUrl ?? null}
        primaryColor={primary}
        hasAbout={Boolean(business.branding?.aboutTitle || business.branding?.aboutBody)}
        hasTestimonials
        hasFaq
      />
      <main className="min-h-screen bg-[#F6F2ED]">
        <section className="pt-32 pb-14 sm:pt-40 sm:pb-20" style={{ background: `linear-gradient(160deg, ${primary}1f 0%, transparent 65%)` }}>
          <div className="site-container max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: primary }}>{t("eyebrow")}</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#0B2820] sm:text-5xl">{t("title")}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#374b43]">{t("subtitle")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#enquiry" className="inline-flex min-h-12 items-center rounded-full px-7 py-3 text-base font-semibold text-white transition hover:brightness-110" style={{ backgroundColor: primary }}>
                {t("cta")}
              </a>
              {business.phone && (
                <a href={`tel:${business.phone.replace(/[^\d+]/g, "")}`} className="inline-flex min-h-12 items-center rounded-full border border-[#d9d4c7] bg-white px-7 py-3 text-base font-semibold text-[#102c24]">
                  {business.phone}
                </a>
              )}
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20" aria-labelledby="benefits">
          <div className="site-container">
            <h2 id="benefits" className="text-2xl font-bold text-[#0B2820] sm:text-3xl">{t("benefitsTitle")}</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFITS.map((k) => (
                <article key={k} className="rounded-2xl border border-[#e4dfd4] bg-white p-6">
                  <span className="mb-3 block h-1 w-10 rounded-full" style={{ backgroundColor: accent }} />
                  <h3 className="text-lg font-semibold text-[#0B2820]">{t(`benefits.${k}.title`)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#374b43]">{t(`benefits.${k}.body`)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[#e4dfd4] bg-white py-14 sm:py-20" aria-labelledby="audience">
          <div className="site-container">
            <h2 id="audience" className="text-2xl font-bold text-[#0B2820] sm:text-3xl">{t("audienceTitle")}</h2>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {AUDIENCE.map((k) => (
                <li key={k} className="rounded-xl bg-[#F6F2ED] px-5 py-4 text-sm font-medium text-[#102c24]">{t(`audience.${k}`)}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-14 sm:py-20" aria-labelledby="steps">
          <div className="site-container">
            <h2 id="steps" className="text-2xl font-bold text-[#0B2820] sm:text-3xl">{t("stepsTitle")}</h2>
            <ol className="mt-8 grid gap-5 md:grid-cols-3">
              {STEPS.map((k, i) => (
                <li key={k} className="rounded-2xl border border-[#e4dfd4] bg-white p-6">
                  <span className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: primary }}>{i + 1}</span>
                  <h3 className="mt-4 text-lg font-semibold text-[#0B2820]">{t(`steps.${k}.title`)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#374b43]">{t(`steps.${k}.body`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-[#e4dfd4] bg-white py-14 sm:py-20" aria-labelledby="faq">
          <div className="site-container max-w-3xl">
            <h2 id="faq" className="text-2xl font-bold text-[#0B2820] sm:text-3xl">{t("faqTitle")}</h2>
            <dl className="mt-8 space-y-6">
              {FAQ.map((k) => (
                <div key={k}>
                  <dt className="font-semibold text-[#0B2820]">{t(`faq.${k}.q`)}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-[#374b43]">{t(`faq.${k}.a`)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="enquiry" className="scroll-mt-24 py-14 sm:py-20" aria-labelledby="enquiry-title">
          <div className="site-container max-w-3xl">
            <h2 id="enquiry-title" className="text-2xl font-bold text-[#0B2820] sm:text-3xl">{t("enquiryTitle")}</h2>
            <p className="mt-3 text-[#374b43]">{t("enquirySubtitle")}</p>
            <div className="mt-8 rounded-3xl border border-[#e8e3d8] bg-white p-7 shadow-sm sm:p-10">
              <BusinessEnquiryForm subdomain={subdomain} primaryColor={primary} />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter
        subdomain={subdomain}
        businessName={business.name}
        logoUrl={business.branding?.logoUrl ?? null}
        phoneNumber={business.phone ?? null}
        primaryColor={primary}
        accentColor={accent}
        socialLinks={business.branding?.socialLinks ?? null}
        legal={business.legal}
      />
    </>
  );
}
