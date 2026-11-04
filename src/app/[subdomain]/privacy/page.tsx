import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefrontServer } from "@/app/api/storefront.server";
import { LegalPage } from "@/components/site/LegalPage";

type PageProps = { params: Promise<{ subdomain: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await params;
  const data = await getStorefrontServer(subdomain);
  if (!data) return { title: "Not found", robots: { index: false, follow: false } };
  return {
    title: `Privacy Policy | ${data.business.name}`,
    description: `How ${data.business.name} collects, uses, and protects your personal information.`,
  };
}

export default async function PrivacyPage({ params }: PageProps) {
  const { subdomain } = await params;
  const data = await getStorefrontServer(subdomain);
  if (!data) notFound();

  const { business } = data;
  const name = business.name;
  const phone = business.phone ?? null;
  const primaryColor = business.branding?.primaryColor ?? "#0B352A";
  const accentColor = business.branding?.accentColor ?? "#D0AA62";
  const logoUrl = business.branding?.logoUrl ?? null;

  const sections = [
    {
      id: "collected",
      title: "1. Information We Collect",
      content: [
        "We collect the following types of personal data when you submit a form, request a booking, or contact us:",
        "Name and contact details (phone number, email address).",
        "Address for cleaning services.",
        "Service details and preferences.",
        "Billing information (if applicable).",
        "IP address and browser details.",
        "Messages or notes you provide.",
      ],
    },
    {
      id: "use",
      title: "2. How We Use Your Information",
      content: [
        "Your information is used to deliver our services safely and efficiently:",
        "To schedule, manage, and complete cleaning services.",
        "To contact you regarding bookings, updates, or questions.",
        "To improve our website and customer experience.",
        "To process payments and generate invoices.",
        "To comply with Dutch laws and regulations.",
      ],
    },
    {
      id: "legal-basis",
      title: "3. Legal Basis for Processing",
      content: [
        "We process your personal data under the following legal bases:",
        "Contractual necessity — to provide the cleaning service you requested.",
        "Legitimate interest — improving service quality and communication.",
        "Consent — when you submit personal data through our forms.",
        "Legal obligation — maintaining tax or administrative records.",
      ],
    },
    {
      id: "storage",
      title: "4. How We Store & Protect Your Data",
      content: [
        "We store your information securely using encrypted systems and modern security practices. Only authorised personnel have access to customer data.",
      ],
    },
    {
      id: "sharing",
      title: "5. Sharing of Information",
      content: [
        "We never sell your personal information.",
        "We may share your data only with:",
        "Professional cleaners assigned to your booking.",
        "Payment processors (e.g. Stripe, bank systems).",
        "Legal authorities only when required by law.",
      ],
    },
    {
      id: "cookies",
      title: "6. Cookies & Tracking",
      content: [
        "This website uses cookies for website functionality, analytics (Google Analytics), and advertising optimisation (Google Ads). See our Cookie Policy for full details.",
      ],
    },
    {
      id: "rights",
      title: "7. Your Rights (GDPR)",
      content: [
        "You have the right to:",
        "Access your personal data.",
        "Request corrections.",
        'Request deletion ("right to be forgotten").',
        "Withdraw consent at any time.",
        "Request data portability.",
      ],
    },
    {
      id: "contact",
      title: "8. Contact Us",
      content: [
        "For privacy-related questions or GDPR requests, please contact us:",
        ...(phone ? [`Phone: ${phone}`] : []),
      ],
    },
    {
      id: "updates",
      title: "9. Updates to This Policy",
      content: [
        "We may update this Privacy Policy from time to time. Any changes will be posted on this page with a new effective date.",
      ],
    },
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
      title="Privacy Policy"
      effectiveDate="March 2021 — Updated for 2025"
      intro={`At ${name}, your privacy is extremely important to us. This Privacy Policy explains how we collect, use, store, and protect your personal information when you visit our website, book our services, or communicate with us.`}
      sections={sections}
    />
  );
}
