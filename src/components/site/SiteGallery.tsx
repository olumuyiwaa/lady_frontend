"use client";

import { useTranslations } from "next-intl";
import { Reveal } from "./Reveal";
import { SiteImage } from "./SiteImage";

type SiteGalleryProps = {
  imageUrls: string[] | null | undefined;
  businessName?: string;
  primaryColor: string;
};

export function SiteGallery({ imageUrls, primaryColor, businessName }: SiteGalleryProps) {
  const t = useTranslations("Site.gallery");
  const images = (imageUrls || []).filter(Boolean);
  if (images.length === 0) return null;

  return (
    <section id="gallery" className="scroll-mt-24 border-t border-[#E8E4DE] bg-white py-16 sm:py-20">
      <div className="site-container">
        <Reveal>
          <div className="max-w-2xl">
            <span className="site-eyebrow">
              <span
                className="site-eyebrow-dot"
                style={{ backgroundColor: primaryColor, boxShadow: `0 0 0 5px ${primaryColor}1f` }}
              />
              {t("eyebrow")}
            </span>
            <h2 className="site-section-title mt-5">{t("title")}</h2>
          </div>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((url, i) => (
            <Reveal key={url} delay={Math.min(i, 8) * 40}>
              <SiteImage
                src={url}
                alt={businessName ? `${businessName} – ${i + 1}` : `Photo ${i + 1}`}
                width={400}
                height={400}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="aspect-square w-full rounded-xl border border-[#E8E4DE] object-cover"
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
