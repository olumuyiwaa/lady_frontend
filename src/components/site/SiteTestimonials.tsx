"use client";

import { useTranslations } from "next-intl";
import { Reveal } from "./Reveal";
import type { WidgetTestimonial } from "@/app/api/widget.api";

type SiteTestimonialsProps = {
  testimonials: WidgetTestimonial[] | null | undefined;
  primaryColor: string;
};

export function SiteTestimonials({ testimonials, primaryColor }: SiteTestimonialsProps) {
  const tr = useTranslations("Site.testimonials");

  // Fall back to representative reviews if the API hasn't been populated yet.
  const FALLBACK: WidgetTestimonial[] = [
    {
      name: "Sarah M.",
      quote: "Tod Cleaning Services did an amazing job on our apartment. Everything was spotless and the team was friendly and professional. Will definitely book again!",
    },
    {
      name: "James K.",
      quote: "Booked a move-out clean and the landlord was impressed. Got my full deposit back. Highly recommend for anyone moving out in Amsterdam.",
    },
    {
      name: "Priya N.",
      quote: "As an expat it was great to work with an English-speaking team. Booking online was so easy and the price was exactly as quoted.",
    },
    {
      name: "Tom V.",
      quote: "Used Tod Cleaning Services for our Airbnb between guests. Fast turnaround, fresh linens, everything restocked. Our guests noticed the difference.",
    },
    {
      name: "Anna L.",
      quote: "Deep clean before a house viewing — the place looked better than when we moved in. Eco-friendly products are a big plus for us.",
    },
    {
      name: "David R.",
      quote: "Reliable, punctual and thorough. We have a recurring weekly clean and the quality is consistently excellent. Great value.",
    },
  ];

  const items = (testimonials || []).filter((t) => t?.quote?.trim());
  const display = items.length > 0 ? items : FALLBACK;

  return (
    <section id="testimonials" className="site-section-cream scroll-mt-24 border-t border-[#e8e3d8] py-24 sm:py-32">
      <div className="site-container">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="site-eyebrow">
              <span
                className="site-eyebrow-dot"
                style={{ backgroundColor: primaryColor, boxShadow: `0 0 0 4px ${primaryColor}18` }}
              />
              {tr("eyebrow")}
            </span>
            <h2 className="site-section-title mt-5">{tr("title")}</h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {display.map((t, i) => (
            <Reveal key={`${t.name}-${i}`} delay={i * 80}>
              <figure className="flex h-full flex-col rounded-3xl border border-[#e8e3d8] bg-white p-8 shadow-sm">
                <blockquote className="flex-1 font-serif text-[1.05rem] leading-relaxed text-[#1d3228]">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-7 flex items-center gap-3 text-sm font-semibold text-[#111918]">
                  <span className="h-px w-6 bg-[#c9983a]" aria-hidden="true" />
                  {t.name}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
