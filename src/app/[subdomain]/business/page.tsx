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
const FAQ = ["contract", "invoice", "insurance", "start", "sites", "changes"] as const;

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
          <div className="site-container max-w-6xl">
            <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: primary }}>{t("eyebrow")}</p>
                <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-[#0B2820] sm:text-5xl lg:text-6xl">{t("title")}</h1>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#374b43]">{t("subtitle")}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="#enquiry" className="inline-flex min-h-12 items-center rounded-full px-7 py-3 text-base font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:brightness-110" style={{ backgroundColor: primary }}>
                    {t("cta")}
                  </a>
                  {business.phone && (
                    <a href={`tel:${business.phone.replace(/[^\d+]/g, "")}`} className="inline-flex min-h-12 items-center rounded-full border border-[#d9d4c7] bg-white px-7 py-3 text-base font-semibold text-[#102c24] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#c8c0ad]">
                      {business.phone}
                    </a>
                  )}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  {(["invoice", "team", "portal"] as const).map((k) => (
                    <span key={k} className="rounded-full border border-[#d7d0c3] bg-white/80 px-3 py-2 text-[10px] font-semibold tracking-[0.14em] text-[#102c24] uppercase shadow-sm backdrop-blur-sm">
                      {t(`benefits.${k}.title`)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 rounded-[2rem] bg-white/40 blur-2xl" style={{ backgroundColor: `${primary}20` }} />
                <div className="relative overflow-hidden rounded-[2rem] border border-[#e7e0d3] bg-white p-5 shadow-[0_20px_60px_rgba(11,40,32,0.08)] sm:p-6">
                  <div className="flex items-center justify-between border-b border-[#efe8dd] pb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5c6d66]">Business care</p>
                      <h2 className="mt-1 text-xl font-bold text-[#102c24]">{business.name}</h2>
                    </div>
                    <div className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: primary }}>
                      Trusted
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {[
                      { label: t("benefits.invoice.title"), value: "1x" },
                      { label: t("benefits.team.title"), value: "Same team" },
                      { label: t("benefits.portal.title"), value: "Live" },
                      { label: t("benefits.reliability.title"), value: "On time" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-[#efe8dd] bg-[#F8F5F1] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5c6d66]">{item.label}</p>
                        <p className="mt-2 text-lg font-bold text-[#102c24]">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-[#dfe7e2] bg-[#f2f7f4] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5c6d66]">Service review</p>
                        <p className="mt-1 text-sm text-[#102c24]">Monthly invoice + site updates</p>
                      </div>
                      <span className="inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: primary }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20" aria-labelledby="benefits">
          <div className="site-container">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h2 id="benefits" className="text-2xl font-bold text-[#0B2820] sm:text-3xl">{t("benefitsTitle")}</h2>
              <p className="max-w-xl text-sm leading-relaxed text-[#4d5d55]">{t("subtitle")}</p>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFITS.map((k) => (
                <article key={k} className="group rounded-2xl border border-[#e4dfd4] bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#d7d0c3] hover:shadow-md">
                  <span className="mb-3 block h-1.5 w-12 rounded-full" style={{ backgroundColor: accent }} />
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
                <li key={k} className="rounded-xl border border-[#ebe3d7] bg-[#F6F2ED] px-5 py-4 text-sm font-medium text-[#102c24] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#d7d0c3] hover:bg-white">{t(`audience.${k}`)}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-14 sm:py-20" aria-labelledby="steps">
          <div className="site-container">
            <h2 id="steps" className="text-2xl font-bold text-[#0B2820] sm:text-3xl">{t("stepsTitle")}</h2>
            <ol className="mt-8 grid gap-5 md:grid-cols-3">
              {STEPS.map((k, i) => (
                <li key={k} className="rounded-2xl border border-[#e4dfd4] bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#d7d0c3] hover:shadow-md">
                  <span className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: primary }}>{i + 1}</span>
                  <h3 className="mt-4 text-lg font-semibold text-[#0B2820]">{t(`steps.${k}.title`)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#374b43]">{t(`steps.${k}.body`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="enquiry" className="scroll-mt-24 py-14 sm:py-20" aria-labelledby="enquiry-title">
          <div className="site-container max-w-6xl">
            <h2 id="enquiry-title" className="text-2xl font-bold text-[#0B2820] sm:text-3xl">{t("enquiryTitle")}</h2>
            <p className="mt-3 text-[#374b43]">{t("enquirySubtitle")}</p>
            <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-[#e8e3d8] bg-white p-7 shadow-sm sm:p-10">
                <BusinessEnquiryForm subdomain={subdomain} primaryColor={primary} />
              </div>

              <aside className="rounded-3xl border border-[#e8e3d8] bg-white p-7 shadow-sm sm:p-8">
                <h3 className="text-xl font-bold text-[#0B2820]">{t("faqTitle")}</h3>
                <dl className="mt-6 space-y-5">
                  {FAQ.map((k) => (
                    <div key={k}>
                      <dt className="font-semibold text-[#0B2820]">{t(`faq.${k}.q`)}</dt>
                      <dd className="mt-1 text-sm leading-relaxed text-[#374b43]">{t(`faq.${k}.a`)}</dd>
                    </div>
                  ))}
                </dl>
              </aside>
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
