"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Reveal } from "./Reveal";
import type { WidgetFaqItem } from "@/app/api/widget.api";
import { safeJsonLd } from "@/lib/jsonLd";

type SiteFaqProps = {
  items: WidgetFaqItem[] | null | undefined;
  primaryColor: string;
};

export function SiteFaq({ items, primaryColor }: SiteFaqProps) {
  const t = useTranslations("Site.faq");
  const faqs = (items || []).filter((f) => f?.question?.trim() && f?.answer?.trim());
  const [open, setOpen] = useState(0);

  if (faqs.length === 0) return null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <section id="faq" className="site-section-light scroll-mt-24 border-t border-[#e8e3d8] py-24 sm:py-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }}
      />
      <div className="site-container">
        <Reveal>
          <div className="max-w-2xl">
            <span className="site-eyebrow">
              <span
                className="site-eyebrow-dot"
                style={{ backgroundColor: primaryColor, boxShadow: `0 0 0 4px ${primaryColor}18` }}
              />
              {t("eyebrow")}
            </span>
            <h2 className="site-section-title mt-5">{t("title")}</h2>
          </div>
        </Reveal>
        <div className="mt-10 max-w-3xl divide-y divide-[#e8e3d8] border-y border-[#e8e3d8]">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={faq.question}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 px-1 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold text-[#111918] sm:text-base">{faq.question}</span>
                  <span
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-base font-semibold transition-colors"
                    style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
                  >
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <p className="px-1 pb-5 text-sm leading-relaxed text-[#5c6b64]">{faq.answer}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
