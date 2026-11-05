/**
 * Public (unauthenticated) widget API client.
 * Used by the customer-facing booking form.
 *
 * Backend mounts:
 *   - Host-based:  /api/v1/widget/...
 *   - Slug-based:  /api/v1/widget-embed/:subdomain/...
 *
 * We use the slug path so businesses work with zero DNS setup:
 *   /book/[slug]  →  /widget-embed/[slug]/...
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

async function widgetFetch(
  slug: string,
  path: string,
  options: RequestInit = {}
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(
    `${API_BASE_URL}/widget-embed/${encodeURIComponent(slug)}${path}`,
    { ...options, headers }
  );

  const result = await res.json().catch(() => ({}));

  if (!res.ok || result.success === false) {
    const message =
      result.message ||
      result.error ||
      (typeof result === "string" ? result : "Request failed");
    const err = new Error(message) as Error & {
      status?: number;
      errors?: { field?: string; message?: string }[] | null;
    };
    err.status = res.status;
    // Per-field validation messages (HTTP 422), so forms can say what is wrong.
    err.errors = Array.isArray(result.errors) ? result.errors : null;
    throw err;
  }

  return result;
}

// ─── Types returned by the widget endpoints ─────────────────────

export type WidgetTestimonial = { name: string; quote: string };
export type WidgetFaqItem = { question: string; answer: string };
export type WidgetSocialLinks = Partial<Record<"facebook" | "instagram" | "tiktok" | "linkedin" | "twitter", string>>;
export type WidgetSectionsEnabled = {
  about?: boolean;
  testimonials?: boolean;
  gallery?: boolean;
  faq?: boolean;
  order?: Array<"about" | "testimonials" | "gallery" | "faq">;
};

export type WidgetBranding = {
  primaryColor?: string | null;
  logoUrl?: string | null;
  accentColor?: string | null;
  tagline?: string | null;
  themeStyle?: "MODERN" | "CLASSIC" | "BOLD";
  heroImageUrl?: string | null;
  aboutTitle?: string | null;
  aboutBody?: string | null;
  testimonials?: WidgetTestimonial[] | null;
  faqItems?: WidgetFaqItem[] | null;
  galleryImageUrls?: string[];
  socialLinks?: WidgetSocialLinks | null;
  sectionsEnabled?: WidgetSectionsEnabled | null;
  /** Average Google/review score shown in the hero social proof strip. */
  reviewScore?: number | null;
  /** Total verified review count shown alongside the score. */
  reviewCount?: number | null;
};

export type WidgetBusiness = {
  id: string;
  name: string;
  phone?: string | null;
  subdomain?: string | null;
  /** Verified custom domain (hostname only), when the business has one. Used for the canonical URL. */
  customDomain?: string | null;
  /** Language the storefront shows when the visitor has not chosen one. "nl" | "en". */
  defaultLocale?: string | null;
  branding?: WidgetBranding | null;
  /** IANA timezone, e.g. Europe/Amsterdam. Slots are computed in it. */
  timezone?: string;
  /** ISO 4217, lower-case, e.g. eur. */
  currency?: string;
  hours?: Array<{
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed?: boolean;
  }>;
  /** Company registration details a Dutch consumer-facing site must show. */
  legal?: {
    kvkNumber: string | null;
    vatNumber: string | null;
    address: { line1: string; postalCode: string; city: string; country?: string } | null;
  } | null;
};

export type WidgetAddOn = {
  id: string;
  name: string;
  priceCents: number;
  extraMinutes: number;
};

export type WidgetService = {
  id: string;
  name: string;
  description: string | null;
  pricingModel: "FLAT" | "PER_SQFT" | "PER_ROOM" | "HOURLY";
  basePriceCents: number;
  estimatedMinutes: number;
  isActive: boolean;
  addOns: WidgetAddOn[];
};

export type StorefrontPayment = {
  onlineCardReady: boolean;
  offlineAccepted: boolean;
  offlinePaymentInstructions: string | null;
};

/**
 * windowHours null means free cancellation any time (a business that's never
 * configured a policy) — not "no data yet". Mirrors
 * cancellationPolicy.js's own default on the backend, so the widget's copy
 * can never drift from what a cancellation will actually cost the customer.
 */
export type StorefrontCancellationPolicy = {
  windowHours: number | null;
  feeType: "PERCENT" | "AMOUNT" | null;
  feeValue: number | null;
};

export type StorefrontResponse = {
  business: WidgetBusiness;
  services: WidgetService[];
  /** The business's own booking-form questions. */
  questions?: import("@/lib/bookingQuestions").BookingQuestion[];
  onboardingComplete?: boolean;
  payment?: StorefrontPayment;
  cancellationPolicy?: StorefrontCancellationPolicy;
};

export type QuoteRequest = {
  serviceId: string;
  /** Lets the server look the address up for the service-area check. */
  postalCode?: string;
  addOnIds?: string[];
  latitude?: number | null;
  longitude?: number | null;
  scheduledStart?: string;
  couponCode?: string;
  giftCardCode?: string;
  /** Passed through for PER_ROOM / PER_SQFT / frequency discounts */
  rooms?: number;
  bathrooms?: number;
  sqft?: number;
  frequency?: "ONE_TIME" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
};

export type QuoteResponse = {
  serviceId: string;
  addOnIds: string[];
  priceCents: number;
  estimatedMinutes: number;
  breakdown?: Record<string, unknown>;
  /** Present when the business charges for travel; cents is 0 inside the free radius. */
  travelFee?: {
    enabled: boolean;
    cents: number;
    distanceKm?: number | null;
    billableKm?: number;
    freeKm?: number;
    perKmCents?: number;
  } | null;
  coupon?: {
    valid: boolean;
    reason?: string;
    couponId?: string;
    type?: string;
    value?: number;
  } | null;
  giftCard?: {
    valid: boolean;
    reason?: string;
    giftCardId?: string;
    balanceCents?: number;
    appliedCents?: number;
  } | null;
  /** Prices are VAT (BTW) inclusive; this says how much of priceCents is BTW. */
  tax?: {
    pricesIncludeVat: boolean;
    vatRateBps: number;
    vatCents: number;
    netCents: number;
  };
};

export type Slot = {
  start: string;
  end: string;
  available: number;
};

export type SlotsResponse = {
  date: string;
  slots: Slot[];
};

export type SubmitBookingPayload = {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  serviceId: string;
  addOnIds?: string[];
  scheduledStart: string;
  couponCode?: string;
  giftCardCode?: string;
  referralCode?: string;
  rooms?: number;
  bathrooms?: number;
  sqft?: number;
  frequency?: string;
  notes?: string;
  postalCode?: string;
  /** Answers to the business's custom questions. */
  answers?: import("@/lib/bookingQuestions").AnswerPayload[];
  /** Cloudflare Turnstile token; required by the API when TURNSTILE_SECRET_KEY is set. */
  captchaToken?: string;
};

export type JoinWaitlistPayload = {
  serviceId?: string;
  desiredStart: string;
  desiredEnd: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  captchaToken?: string;
};

// ─── API functions ──────────────────────────────────────────────

export async function getStorefront(slug: string) {
  const result = await widgetFetch(slug, "/storefront", { method: "GET" });
  return result.data as StorefrontResponse;
}

export type AddressLookupResult =
  | { found: false }
  | ({ found: true } & import("@/lib/nlAddress").AddressHit);

/** Postcode + house number -> street, city, coordinates (Dutch addresses). */
export async function lookupAddress(slug: string, postalCode: string, houseNumber: string) {
  const qs = new URLSearchParams({ postalCode, houseNumber });
  const result = await widgetFetch(slug, `/address-lookup?${qs.toString()}`, { method: "GET" });
  return result.data as AddressLookupResult;
}

export type ServiceAreaCheck = {
  /** Normalised, e.g. "1012AB". */
  postalCode: string;
  /** true = served, false = outside every service area, null = could not be verified. */
  covered: boolean | null;
  /** false = the business has not limited its area, so everyone is "covered". */
  restricted: boolean;
};

/** "Do you clean in my postcode?" - asked before the customer starts a booking. */
export async function checkServiceArea(slug: string, postalCode: string) {
  const qs = new URLSearchParams({ postalCode });
  const result = await widgetFetch(slug, `/service-area?${qs.toString()}`, { method: "GET" });
  return result.data as ServiceAreaCheck;
}

export async function getQuote(slug: string, body: QuoteRequest) {
  const result = await widgetFetch(slug, "/quote", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return result.data as QuoteResponse;
}

export async function getSlots(
  slug: string,
  params: {
    serviceId: string;
    date: string; // YYYY-MM-DD
    slotMinutes?: number;
  }
) {
  const qs = new URLSearchParams({
    serviceId: params.serviceId,
    date: params.date,
    ...(params.slotMinutes
      ? { slotMinutes: String(params.slotMinutes) }
      : {}),
  });
  const result = await widgetFetch(slug, `/slots?${qs.toString()}`, {
    method: "GET",
  });
  return result.data as SlotsResponse;
}

export async function submitBooking(slug: string, payload: SubmitBookingPayload) {
  const result = await widgetFetch(slug, "/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return result.data as {
    id: string;
    scheduledStart: string;
    quotedPriceCents: number;
    status: string;
    referralCode?: string;
    referralDiscountCents?: number;
    giftCard?: { giftCardId: string; appliedCents: number } | null;
    deposit?: { url: string; sessionId: string; depositRequiredCents: number } | null;
  };
}

export async function checkGiftCardBalance(slug: string, code: string) {
  const result = await widgetFetch(slug, `/gift-cards/${encodeURIComponent(code)}`, { method: "GET" });
  return result.data as { valid: boolean; reason?: string; balanceCents?: number };
}

/**
 * Joins the waitlist for a date range the widget had no open slot for.
 * The booking wizard's schedule step offers this when getSlots comes back
 * empty for every date the customer tries — see StepSchedule.tsx.
 */
export async function joinWaitlist(slug: string, payload: JoinWaitlistPayload) {
  const result = await widgetFetch(slug, "/waitlist", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return result.data as { id: string; status: string };
}

export type SubmitContactPayload = {
  name: string;
  email: string;
  phone?: string;
  message: string;
  /** Honeypot - must stay empty; real visitors never see the field. */
  website?: string;
  captchaToken?: string;
};

/**
 * A message from the storefront's contact form. Becomes a ticket for the
 * business and is emailed to them; the visitor gets an acknowledgement and a
 * reference number.
 */
export async function submitContact(slug: string, payload: SubmitContactPayload) {
  const result = await widgetFetch(slug, "/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return result.data as { reference: string };
}
