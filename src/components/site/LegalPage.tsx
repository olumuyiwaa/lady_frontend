import Link from "next/link";
import type { WidgetBusiness } from "@/app/api/widget.api";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export type LegalSection = {
  id: string;
  title: string;
  content: string[];
};

type LegalPageProps = {
  subdomain: string;
  businessName: string;
  logoUrl?: string | null;
  primaryColor: string;
  accentColor: string;
  phone?: string | null;
  socialLinks?: Parameters<typeof SiteFooter>[0]["socialLinks"];
  legal?: WidgetBusiness["legal"];
  /** Page heading, e.g. "Privacy Policy" */
  title: string;
  /** Shown below the title, e.g. "Effective Date: March 2021" */
  effectiveDate?: string;
  /** Short intro paragraph */
  intro?: string;
  sections: LegalSection[];
};

/**
 * Shared layout for all three legal pages (Terms, Privacy, Cookies).
 * Uses the same SiteHeader/SiteFooter shell as the storefront so navigation
 * is consistent, but replaces the hero content with a plain document layout.
 */
export function LegalPage({
  subdomain,
  businessName,
  logoUrl,
  primaryColor,
  accentColor,
  phone,
  socialLinks,
  legal,
  title,
  effectiveDate,
  intro,
  sections,
}: LegalPageProps) {
  return (
    <>
      <SiteHeader
        subdomain={subdomain}
        businessName={businessName}
        logoUrl={logoUrl}
        primaryColor={primaryColor}
      />

      <main className="min-h-screen bg-[#F6F2ED]">
        {/* Hero band */}
        <section
          className="pt-32 pb-10 sm:pt-36 sm:pb-12"
          style={{
            background: `linear-gradient(160deg, ${primaryColor}18 0%, transparent 60%)`,
            borderBottom: "1px solid #e4dfd4",
          }}
        >
          <div className="site-container">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-[#5a7069]">
              <Link href={`/${subdomain}`} className="hover:text-[#102c24]">
                {businessName}
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-[#102c24]">{title}</span>
            </nav>

            <h1
              className="text-3xl font-bold tracking-tight text-[#0B2820] sm:text-4xl"
              style={{ fontFamily: "inherit" }}
            >
              {title}
            </h1>
            {effectiveDate && (
              <p className="mt-2 text-sm text-[#6b8078]">{effectiveDate}</p>
            )}
            {intro && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#374b43]">
                {intro}
              </p>
            )}
          </div>
        </section>

        {/* Document body */}
        <section className="py-12 sm:py-16">
          <div className="site-container">
            <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-16">
              {/* Sticky sidebar TOC — hidden on mobile */}
              <aside className="hidden lg:block">
                <nav aria-label="On this page" className="sticky top-28">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#6b8078]">
                    On this page
                  </p>
                  <ul className="space-y-1">
                    {sections.map((s) => (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          className="block rounded-md px-2 py-1.5 text-sm text-[#4a6358] transition-colors hover:bg-[#eceae4] hover:text-[#102c24]"
                        >
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>

              {/* Sections */}
              <div className="space-y-10">
                {sections.map((s) => (
                  <article
                    key={s.id}
                    id={s.id}
                    className="scroll-mt-28 rounded-2xl border border-[#e4dfd4] bg-white px-6 py-7 sm:px-8 sm:py-8"
                  >
                    <h2 className="mb-4 text-lg font-semibold text-[#0B2820]">{s.title}</h2>
                    <div className="space-y-3">
                      {s.content.map((para, i) => (
                        <p key={i} className="text-sm leading-relaxed text-[#374b43]">
                          {para}
                        </p>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter
        subdomain={subdomain}
        businessName={businessName}
        phoneNumber={phone}
        primaryColor={primaryColor}
        accentColor={accentColor}
        socialLinks={socialLinks}
        legal={legal}
      />
    </>
  );
}
