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
  const items = (testimonials || []).filter((t) => t?.quote?.trim());
  if (items.length === 0) return null;

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
          {items.map((t, i) => (
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
