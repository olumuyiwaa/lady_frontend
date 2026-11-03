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
          {display.map((faq, i) => {
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
