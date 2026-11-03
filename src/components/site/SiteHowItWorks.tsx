"use client";

import { useTranslations } from "next-intl";
import { Reveal } from "./Reveal";
import BeforeAfterSlider from "./BeforeAfterSlider";

type SiteHowItWorksProps = {
  primaryColor: string;
};

export function SiteHowItWorks({ primaryColor }: SiteHowItWorksProps) {
  const t = useTranslations("Site.howItWorks");

  const steps = [
    { step: "01", title: t("step1Title"), body: t("step1Body") },
    { step: "02", title: t("step2Title"), body: t("step2Body") },
    { step: "03", title: t("step3Title"), body: t("step3Body") },
  ];

  return (
    <section
      id="how-it-works"
      className="site-section-cream scroll-mt-24 border-t border-[#e7e3d9] py-20 sm:py-24"
    >
      <div className="site-container grid items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] lg:gap-20">
        <Reveal>
          <div className="site-process-image">
            <BeforeAfterSlider
              beforeSrc="/images/before-room.jpg"
              afterSrc="/images/after-room.jpg"
              beforeAlt={t("beforeAlt")}
              afterAlt={t("afterAlt")}
            />
          </div>
        </Reveal>

        <div>
          <Reveal>
            <div className="max-w-xl">
              <span className="site-eyebrow">
                <span
                  className="site-eyebrow-dot"
                  style={{ backgroundColor: primaryColor }}
                />
                {t("eyebrow")}
              </span>
              <h2 className="site-section-title mt-5">{t("title")}</h2>
              <p className="mt-4 text-base leading-relaxed text-[#616963] sm:text-lg">
                {t("subtitle")}
              </p>
            </div>
          </Reveal>
          <ol className="site-process-steps mt-8">
            {steps.map((item, i) => (
              <Reveal key={item.step} delay={i * 70}>
                <li className="site-process-step">
                  <span className="site-process-number">{item.step}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-[#102c24]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#616963]">
                      {item.body}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
