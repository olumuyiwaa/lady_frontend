import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/locales";
import { canonicalOrigin } from "@/lib/tenantUrl";
import { pageSeo } from "@/lib/seo";
import { getStorefrontServer } from "@/app/api/storefront.server";
import { LegalPage } from "@/components/site/LegalPage";

type PageProps = { params: Promise<{ subdomain: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await params;
  const data = await getStorefrontServer(subdomain);
  if (!data) return { title: "Not found", robots: { index: false, follow: false } };
  const locale = (await getLocale()) as AppLocale;
  const seo = pageSeo(canonicalOrigin(data.business, subdomain), "/terms", locale);
  return {
    ...(seo.metadataBase ? { metadataBase: seo.metadataBase } : {}),
    ...(seo.alternates ? { alternates: seo.alternates } : {}),
    title: `Terms & Conditions | ${data.business.name}`,
    description: `Terms and conditions for ${data.business.name} cleaning services.`,
    openGraph: seo.openGraph,
  };
}

export default async function TermsPage({ params }: PageProps) {
  const { subdomain } = await params;
  const data = await getStorefrontServer(subdomain);
  if (!data) notFound();

  const { business } = data;
  const name = business.name;
  const phone = business.phone ?? null;
  const primaryColor = business.branding?.primaryColor ?? "#0b1a35";
  const accentColor = business.branding?.accentColor ?? "#6bb5e4";
  const logoUrl = business.branding?.logoUrl ?? null;

  const sections = [
    {
      id: "definitions",
      title: "1. Definitions",
      content: [
        `"Client" — The person booking or receiving cleaning services from ${name}.`,
        `"Company" — ${name}.`,
        '"Cleaner / Professional" — A trained cleaner assigned to perform the service.',
        '"Service" — Any cleaning or related service offered by the Company.',
      ],
    },
    {
      id: "booking",
      title: "2. Booking & Scheduling",
      content: [
        "Services must be booked online, by phone, or via our support channels. A booking is confirmed only after you receive a confirmation email or message.",
        "We reserve the right to refuse or cancel a booking for reasons including safety concerns, incorrect information, or unpaid invoices from previous bookings.",
      ],
    },
    {
      id: "access",
      title: "3. Access to the Property",
      content: [
        "Clients must provide safe and timely access to the property.",
        "If cleaners cannot access the property within 15 minutes of their scheduled arrival, the booking may be rescheduled for a fee or charged as a late cancellation (up to 50%).",
      ],
    },
    {
      id: "cancellations",
      title: "4. Cancellations & Rescheduling",
      content: [
        "Cancellations made less than 24 hours before the appointment may incur charges.",
        "24+ hours' notice — Free cancellation.",
        "Less than 24 hours — 50% cancellation fee.",
      ],
    },
    {
      id: "limitations",
      title: "5. Service Limitations",
      content: [
        "Our cleaners do not handle hazardous materials, biohazards, animal waste, pest infestations, mould removal, or heavy lifting above 20 kg.",
        "For safety reasons, cleaners cannot climb unstable surfaces or use client-provided ladders higher than 2 steps.",
      ],
    },
    {
      id: "satisfaction",
      title: "6. Satisfaction Guarantee",
      content: [
        "We offer a 24-hour satisfaction window. If any area was missed or improperly cleaned, notify us within 24 hours and we will return and fix the issue free of charge.",
        "Refunds are only considered after a re-clean attempt.",
      ],
    },
    {
      id: "payments",
      title: "7. Payments & Fees",
      content: [
        "Payments must be made via bank transfer, Tikkie, card, or approved online payment platforms. Late payments may result in service discontinuation.",
        "Recurring clients are billed weekly, biweekly, or monthly depending on the agreement.",
      ],
    },
    {
      id: "liability",
      title: "8. Damages & Liability",
      content: [
        `${name} carries liability coverage for accidental damages. However, we are not responsible for pre-existing damage, loose or unstable furniture, wear-and-tear deterioration, or items not securely stored.`,
        "All claims must be submitted within 24 hours of the cleaning.",
      ],
    },
    {
      id: "responsibilities",
      title: "9. Client Responsibilities",
      content: [
        "Provide accurate information when booking.",
        "Ensure property safety for our team.",
        "Notify us of pets or special conditions before arrival.",
        "Store valuables securely before the clean.",
      ],
    },
    {
      id: "website",
      title: "10. Use of Website & Content",
      content: [
        `All text, images, and content on this website are the property of ${name}. Unauthorised copying, reproduction, or misuse is strictly prohibited.`,
      ],
    },
    {
      id: "cookies",
      title: "11. Cookies & Tracking",
      content: [
        "We use cookies for functionality, analytics, and advertising optimisation. By using our site, you consent to cookie use in accordance with our Cookie Policy.",
      ],
    },
    {
      id: "changes",
      title: "12. Changes to These Terms",
      content: [
        "We may update these Terms from time to time. The updated version will always be available on this page.",
      ],
    },
    ...(phone
      ? [
          {
            id: "contact",
            title: "13. Contact",
            content: [`Phone: ${phone}`],
          },
        ]
      : []),
  ];

  return (
    <LegalPage
      subdomain={subdomain}
      businessName={name}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      accentColor={accentColor}
      hasAbout={Boolean(business.branding?.aboutTitle || business.branding?.aboutBody)}
      phone={phone}
      socialLinks={business.branding?.socialLinks ?? null}
      legal={business.legal}
      title="Terms & Conditions"
      effectiveDate="March 2021 — Updated for 2025"
      intro={`These Terms & Conditions govern the use of ${name} services and this website. By booking or using our services, you agree to the policies outlined below.`}
      sections={sections}
    />
  );
}
