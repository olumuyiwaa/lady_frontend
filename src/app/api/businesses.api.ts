import { authFetch } from "./authFetch";
import { Business } from "./cleansera-types";

export type BusinessAddress = {
    id: string;
    label: string | null;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    latitude: number | null;
    longitude: number | null;
    isPrimary: boolean;
};

export type ServiceArea = {
    id: string;
    name: string;
    centerLat: number;
    centerLng: number;
    radiusMeters: number;
};

export type BusinessHours = {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
};

export type Testimonial = { name: string; quote: string };
export type FaqItem = { question: string; answer: string };
export type SocialLinks = Partial<Record<"facebook" | "instagram" | "tiktok" | "linkedin" | "twitter", string>>;
export type SectionsEnabled = {
    about?: boolean;
    testimonials?: boolean;
    gallery?: boolean;
    faq?: boolean;
    order?: Array<"about" | "testimonials" | "gallery" | "faq">;
};
export type ThemeStyle = "MODERN" | "CLASSIC" | "BOLD";

export type BusinessBranding = {
    logoKey: string | null;
    primaryColor: string | null;
    accentColor: string | null;
    tagline: string | null;
    widgetEmbedEnabled: boolean;
    themeStyle: ThemeStyle;
    heroImageKey: string | null;
    aboutTitle: string | null;
    aboutBody: string | null;
    testimonials: Testimonial[] | null;
    faqItems: FaqItem[] | null;
    galleryImageKeys: string[];
    socialLinks: SocialLinks | null;
    sectionsEnabled: SectionsEnabled | null;
    // Resolved by the backend from the *Key fields above — always present
    // in a GET, never something the dashboard sends back on PUT.
    logoUrl?: string | null;
    heroImageUrl?: string | null;
    galleryImageUrls?: string[];
};

export type PreferredPaymentCollection = 'ONLINE_CARD' | 'MANUAL_OFFLINE' | 'BOTH';

export type StripeConnectStatus = {
    connected: boolean;
    onboarded: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    readyForPayments: boolean;
    optional: boolean;
    onlineCardReady: boolean;
    canAcceptCardPayments: boolean;
    canAcceptOfflinePayments: boolean;
    preferredPaymentCollection: PreferredPaymentCollection;
    offlinePaymentInstructions: string | null;
    message: string;
};

export async function getBusiness() {
    const result = await authFetch(`/businesses`, { method: "GET" });
    return result.data as Business & { addresses: BusinessAddress[]; hours: BusinessHours[] };
}

export async function updateBusiness(patch: {
    name?: string;
    timezone?: string;
    /** Language the public site shows to visitors who haven't chosen one. */
    defaultLocale?: "nl" | "en";
    customDomain?: string;
    preferredPaymentCollection?: PreferredPaymentCollection;
    offlinePaymentInstructions?: string | null;
    legalName?: string | null;
    kvkNumber?: string | null;
    vatNumber?: string | null;
    invoiceIban?: string | null;
    vatRateBps?: number;
    contactEmail?: string | null;
    contactPhone?: string | null;
}) {
    const result = await authFetch(`/businesses`, {
        method: "PUT",
        body: JSON.stringify(patch),
    });
    return result.data as Business;
}

export async function getBranding() {
    const result = await authFetch(`/businesses/branding`, { method: "GET" });
    return result.data as BusinessBranding;
}

export async function updateBranding(patch: Partial<BusinessBranding>) {
    const result = await authFetch(`/businesses/branding`, { method: "PUT", body: JSON.stringify(patch) });
    return result.data as BusinessBranding;
}

export async function getBrandingUploadUrl(kind: "logo" | "hero" | "gallery", file: File) {
    const result = await authFetch(`/businesses/branding/upload-url`, {
        method: "POST",
        body: JSON.stringify({ kind, filename: file.name, contentType: file.type }),
    });
    return result.data as { key: string; uploadUrl: string; publicUrl: string };
}

/** Uploads a branding image (logo/hero/gallery) and returns its permanent public key + URL. */
export async function uploadBrandingImage(kind: "logo" | "hero" | "gallery", file: File) {
    const { key, uploadUrl, publicUrl } = await getBrandingUploadUrl(kind, file);
    await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    return { key, publicUrl };
}

export async function listServiceAreas() {
    const result = await authFetch(`/businesses/service-areas`, { method: "GET" });
    return result.data as ServiceArea[];
}

export async function createServiceArea(payload: { name: string; centerLat: number; centerLng: number; radiusMeters: number }) {
    const result = await authFetch(`/businesses/service-areas`, { method: "POST", body: JSON.stringify(payload) });
    return result.data as ServiceArea;
}

export async function deleteServiceArea(id: string) {
    await authFetch(`/businesses/service-areas/${id}`, { method: "DELETE" });
}

export async function listHours() {
    const result = await authFetch(`/businesses/hours`, { method: "GET" });
    return result.data as BusinessHours[];
}

export async function updateHours(hours: BusinessHours[]) {
    const result = await authFetch(`/businesses/hours`, { method: "PUT", body: JSON.stringify(hours) });
    return result.data as BusinessHours[];
}

export async function getStripeConnectStatus() {
    const result = await authFetch(`/businesses/stripe-connect/status`, { method: "GET" });
    return result.data as StripeConnectStatus;
}

export async function startStripeConnectOnboarding(payload?: {
    refreshUrl?: string;
    returnUrl?: string;
}) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const result = await authFetch(`/businesses/stripe-connect/onboard`, {
        method: "POST",
        body: JSON.stringify({
            refreshUrl: payload?.refreshUrl ?? `${origin}/business-settings?stripe=refresh`,
            returnUrl: payload?.returnUrl ?? `${origin}/business-settings?stripe=return`,
        }),
    });
    return result.data as { accountId: string; url: string };
}

export async function refreshStripeConnectStatus() {
    const result = await authFetch(`/businesses/stripe-connect/refresh`, { method: "POST" });
    return result.data;
}

export type OnboardingStepKey = "stripeConnect" | "services" | "hours" | "serviceAreas";

export type OnboardingStatus = {
    isComplete: boolean;
    steps: {
        key: OnboardingStepKey;
        label: string;
        complete: boolean;
        required?: boolean;
    }[];
    nextIncompleteStep: OnboardingStepKey | null;
    requiredComplete?: boolean;
    optionalStepsRemaining?: OnboardingStepKey[];
};

export async function getOnboardingStatus() {
    const result = await authFetch(`/businesses/onboarding-status`, { method: "GET" });
    return result.data as OnboardingStatus;
}
