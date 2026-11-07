"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Reveal } from "./Reveal";
import { SiteImage } from "./SiteImage";
import type { WidgetFaqItem } from "@/app/api/widget.api";
import { safeJsonLd } from "@/lib/jsonLd";

type SiteFaqProps = {
  items: WidgetFaqItem[] | null | undefined;
  primaryColor: string;
};

export function SiteFaq({ items, primaryColor }: SiteFaqProps) {
  const t = useTranslations("Site.faq");

  // Fall back to common cleaning FAQs if the API hasn't been populated yet.
  const FALLBACK: WidgetFaqItem[] = [
    {
      question: "How do I book a cleaning?",
      answer: "You can book entirely online in a few minutes. Choose your service, enter your address, pick a date and time that suits you, and confirm. You'll receive a confirmation by email straight away.",
    },
    {
      question: "Do I need to be home during the clean?",
      answer: "Not necessarily. Many clients provide a key or access code. Our team is fully vetted and insured. Just let us know your preference when you book.",
    },
    {
      question: "What products do you use?",
      answer: "We use professional-grade eco-friendly cleaning products that are safe for children, pets, and premium interiors. If you have specific requirements or allergies, let us know and we'll accommodate them.",
    },
    {
      question: "What is your cancellation policy?",
      answer: "You can cancel or reschedule free of charge up to 24 hours before your appointment. Cancellations made less than 24 hours in advance may incur a 50% fee.",
    },
    {
      question: "Do you offer a satisfaction guarantee?",
      answer: "Yes. If anything was missed or not cleaned to your standard, let us know within 24 hours and we'll return to fix it free of charge.",
    },
    {
      question: "What areas do you cover?",
      answer: "We currently serve Amsterdam, Rotterdam, Den Haag, Utrecht, and Amstelveen. Enter your postcode on our booking page to confirm we cover your area.",
    },
  ];

  const faqs = (items || []).filter((f) => f?.question?.trim() && f?.answer?.trim());
  const display = faqs.length > 0 ? faqs : FALLBACK;

  const [open, setOpen] = useState(0);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: display.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <section id="faq" className="site-section-cream scroll-mt-24 border-t border-[#d5e0eb] py-24 sm:py-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }}
      />
      <div className="site-container">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-16">
          <div>
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
            <div className="mt-10 divide-y divide-[#cddae7] border-y border-[#cddae7]">
              {display.map((faq, i) => {
                const isOpen = open === i;
                return (
                  <Reveal key={`${faq.question}-${i}`} delay={Math.min(i, 8) * 45}>
                    <article className="py-1">
                      <h3>
                        <button
                          id={`faq-question-${i}`}
                          type="button"
                          onClick={() => setOpen(isOpen ? -1 : i)}
                          className="flex w-full items-center gap-4 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b1a35] sm:py-5"
                          aria-expanded={isOpen}
                          aria-controls={`faq-answer-${i}`}
                        >
                          <span className="flex-1 text-sm font-semibold leading-snug text-[#0c121e] sm:text-base">
                            {faq.question}
                          </span>
                          <span
                            aria-hidden="true"
                            className="relative flex h-8 w-8 flex-none items-center justify-center rounded-full transition-colors"
                            style={{ color: primaryColor }}
                          >
                            <span className="h-px w-3.5 rounded-full bg-current" />
                            <span
                              className={`absolute h-3.5 w-px rounded-full bg-current transition-transform duration-200 ${
                                isOpen ? "scale-y-0" : "scale-y-100"
                              }`}
                            />
                          </span>
                        </button>
                      </h3>
                      <div
                        id={`faq-answer-${i}`}
                        role="region"
                        aria-labelledby={`faq-question-${i}`}
                        hidden={!isOpen}
                        className="pb-5 pr-8 sm:pb-6"
                      >
                        <p className="text-sm leading-relaxed text-[#375890] sm:text-base">
                          {faq.answer}
                        </p>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
          <Reveal delay={120} className="lg:sticky lg:top-28">
            <div className="rounded-[2rem] border border-[#d5e0eb] bg-white p-2 shadow-[0_18px_50px_rgba(12, 18, 30, 0.09)]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] sm:aspect-[16/10] lg:aspect-[4/5]">
                <SiteImage
                  src="/images/faq-interior.jpg"
                  alt="Sunlit living room with a clean, welcoming interior"
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
