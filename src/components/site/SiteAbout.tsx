"use client";

import { useTranslations } from "next-intl";
import { Reveal } from "./Reveal";
import { SiteImage } from "./SiteImage";

type SiteAboutProps = {
  title: string | null;
  body: string | null;
  heroImageUrl: string | null;
  primaryColor: string;
};

export function SiteAbout({ title, body, heroImageUrl, primaryColor }: SiteAboutProps) {
  const t = useTranslations("Site.about");

  // Nothing configured — skip entirely rather than render an empty shell.
  // A business toggling this section on before writing anything can't
  // accidentally publish a blank block.
  if (!title && !body) return null;

  return (
    <section id="about" className="site-section-light scroll-mt-24 border-t border-[#d5e0eb] py-24 sm:py-32">
      <div className="site-container grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-24">
        <Reveal>
          <div>
            <span className="site-eyebrow">
              <span
                className="site-eyebrow-dot"
                style={{ backgroundColor: primaryColor, boxShadow: `0 0 0 4px ${primaryColor}18` }}
              />
              {t("eyebrow")}
            </span>
            {title && (
              <h2 className="site-section-title mt-5">{title}</h2>
            )}
            {body && (
              <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-[#375890] sm:text-lg">{body}</p>
            )}
          </div>
        </Reveal>
        {heroImageUrl && (
          <Reveal delay={80}>
            <SiteImage
              src={heroImageUrl}
              alt=""
              width={900}
              height={680}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="aspect-[4/3] w-full rounded-3xl border border-[#d5e0eb] object-cover shadow-md"
            />
          </Reveal>
        )}
      </div>
    </section>
  );
}
