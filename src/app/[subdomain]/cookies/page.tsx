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
    title: `Cookie Policy | ${data.business.name}`,
    description: `How ${data.business.name} uses cookies and similar technologies.`,
  };
}

export default async function CookiesPage({ params }: PageProps) {
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
      id: "what-are-cookies",
      title: "1. What Are Cookies?",
      content: [
        "Cookies are small text files stored on your device to help websites remember information about your visit — such as your preferences and browsing patterns.",
      ],
    },
    {
      id: "types",
      title: "2. Types of Cookies We Use",
      content: [
        "Essential Cookies — Necessary for the website to function correctly. Without them, core features such as navigation and booking forms will not work.",
        "Performance & Analytics Cookies — Used to understand how visitors interact with our website (Google Analytics, traffic measurement tools, user behaviour insights).",
        "Advertising & Remarketing Cookies — Allow us to show relevant ads to users who previously visited our site (Google Ads Remarketing, social media tracking pixels, conversion tracking).",
      ],
    },
    {
      id: "why",
      title: "3. Why We Use Cookies",
      content: [
        "To ensure smooth website functionality.",
        "To improve website loading speed.",
        "To analyse website performance.",
        "To enhance user experience.",
        "To personalise ads and marketing campaigns.",
      ],
    },
    {
      id: "third-party",
      title: "4. Third-Party Cookies",
      content: [
        "Our site may use cookies from trusted third-party providers including:",
        "Google Analytics",
        "Google Ads",
        "Facebook / Meta Pixel",
        "TikTok Ads Pixel",
        "These cookies help us measure traffic, conversions, and improve service quality. All data is anonymised according to GDPR requirements.",
      ],
    },
    {
      id: "managing",
      title: "5. Managing & Disabling Cookies",
      content: [
        "You can manage or disable cookies through your browser settings:",
        "Chrome: Settings → Privacy → Cookies",
        "Safari: Preferences → Privacy",
        "Firefox: Options → Privacy",
        "Edge: Settings → Site Permissions → Cookies",
        "Important: Disabling essential cookies may cause parts of our website to stop functioning correctly.",
      ],
    },
    {
      id: "gdpr",
      title: "6. Your GDPR Rights",
      content: [
        "You have the right to:",
        "Access your personal data.",
        "Request deletion of your data.",
        "Withdraw cookie consent at any time.",
        "Request data correction.",
        "Request restriction of data processing.",
      ],
    },
    {
      id: "updates",
      title: "7. Updates to This Cookie Policy",
      content: [
        "We may update this policy occasionally to reflect legal updates or improvements to our website. The latest version will always appear here.",
      ],
    },
    {
      id: "contact",
      title: "8. Contact",
      content: [
        "For questions about this Cookie Policy, please contact us:",
        ...(phone ? [`Phone: ${phone}`] : []),
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
      phone={phone}
      socialLinks={business.branding?.socialLinks ?? null}
      legal={business.legal}
      title="Cookie Policy"
      effectiveDate="Transparent Cookie Use — Compliant with GDPR and EU Regulations"
      intro={`This Cookie Policy explains how ${name} uses cookies and similar technologies on this website. By using our website, you consent to the use of cookies as described here.`}
      sections={sections}
    />
  );
}
