import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefrontServer } from "@/app/api/storefront.server";
import { safeJsonLd } from "@/lib/jsonLd";
import { canonicalOrigin } from "@/lib/tenantUrl";
import { StorefrontClient } from "./StorefrontClient";

type PageProps = { params: Promise<{ subdomain: string }> };

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function plainText(input: string | null | undefined, max: number) {
  const text = (input || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/**
 * Rendered on the server so crawlers (and link previews) see the business,
 * not a "Loading…" shell. The fetch is cached for a few minutes and shared
 * with the page render below.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await params;
  const data = await getStorefrontServer(subdomain);
  if (!data) return { title: "Not found", robots: { index: false, follow: false } };

  const { business } = data;
  const branding = business.branding;
  const description =
    plainText(branding?.tagline, 160) ||
    plainText(branding?.aboutBody, 160) ||
    plainText(data.services?.map((s) => s.name).join(", "), 160);
  const image = branding?.heroImageUrl || branding?.logoUrl || undefined;
  const origin = canonicalOrigin(business, subdomain);

  return {
    // Lets relative URLs (canonical, og:url) resolve against the business's
    // own domain; without it Next falls back to localhost/the app host.
    ...(origin ? { metadataBase: new URL(origin), alternates: { canonical: "/" } } : {}),
    title: business.name,
    description: description || undefined,
    openGraph: {
      title: business.name,
      description: description || undefined,
      type: "website",
      ...(origin ? { url: origin } : {}),
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: business.name },
  };
}

export default async function BusinessSitePage({ params }: PageProps) {
  const { subdomain } = await params;
  const data = await getStorefrontServer(subdomain);
  // A real 404 (not a 200 "not found" page) so unknown tenants are not indexed.
  if (!data) notFound();

  const { business } = data;
  const branding = business.branding;

  const openingHours = (business.hours || [])
    .filter((h) => !h.isClosed && h.openTime && h.closeTime && DAY_NAMES[h.dayOfWeek])
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DAY_NAMES[h.dayOfWeek],
      opens: h.openTime,
      closes: h.closeTime,
    }));

  const origin = canonicalOrigin(business, subdomain);
  const address = business.legal?.address;
  const currency = (business.currency || "eur").toUpperCase();
  const offers = (data.services || [])
    .filter((s) => s.isActive !== false)
    .map((s) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: s.name,
        ...(s.description ? { description: plainText(s.description, 300) } : {}),
      },
      // Only FLAT prices are a real price; per m²/room/hour prices are a rate,
      // and publishing them as a price would be misleading.
      ...(s.pricingModel === "FLAT" && s.basePriceCents > 0
        ? { price: (s.basePriceCents / 100).toFixed(2), priceCurrency: currency }
        : {}),
    }));

  const sameAs = Object.values(branding?.socialLinks || {}).filter(Boolean);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    ...(origin ? { url: origin } : {}),
    ...(business.phone ? { telephone: business.phone } : {}),
    ...(address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: address.line1,
            postalCode: address.postalCode,
            addressLocality: address.city,
            ...(address.country ? { addressCountry: address.country } : {}),
          },
        }
      : {}),
    ...(offers.length
      ? { hasOfferCatalog: { "@type": "OfferCatalog", name: business.name, itemListElement: offers } }
      : {}),
    ...(branding?.logoUrl ? { logo: branding.logoUrl } : {}),
    ...(branding?.heroImageUrl ? { image: branding.heroImageUrl } : {}),
    ...(branding?.tagline ? { description: branding.tagline } : {}),
    ...(openingHours.length ? { openingHoursSpecification: openingHours } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // safeJsonLd escapes "<" etc.: tenant-authored values must not be able
        // to close the script tag.
        dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }}
      />
      <StorefrontClient subdomain={subdomain} data={data} />
    </>
  );
}
