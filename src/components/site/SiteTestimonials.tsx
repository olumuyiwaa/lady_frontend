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
    <section id="testimonials" className="site-section-cream scroll-mt-24 border-t border-[#e7e3d9] py-20 sm:py-24">
      <div className="site-container">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <span className="site-eyebrow">
              <span
                className="site-eyebrow-dot"
                style={{ backgroundColor: primaryColor, boxShadow: `0 0 0 5px ${primaryColor}1f` }}
              />
              {tr("eyebrow")}
            </span>
            <h2 className="site-section-title mt-5">{tr("title")}</h2>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t, i) => (
            <Reveal key={`${t.name}-${i}`} delay={i * 80}>
              <figure className="h-full rounded-2xl border border-[#E8E4DE] bg-white p-6 shadow-sm">
                <blockquote className="font-serif text-lg leading-relaxed text-[#263a32]">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 text-sm font-semibold text-[#102c24]">
                  <span className="h-px w-8 bg-[#caa35e]" aria-hidden="true" />
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
