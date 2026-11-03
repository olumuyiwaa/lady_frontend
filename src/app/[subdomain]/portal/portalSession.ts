import type { PortalBooking, PortalCustomer } from "@/app/api/portal.api";

/**
 * Where the customer portal keeps its signed-in session. Everything that
 * touches browser storage lives here so the storage strategy (today
 * localStorage, per business slug) can be changed in ONE place.
 *
 * The key includes the slug because path-based tenancy on the app host shares
 * one origin between businesses: without it, signing in to one business would
 * look signed in to another.
 */
const tokenKey = (slug: string) => `ladygreener_portal_token_${slug}`;
const customerKey = (slug: string) => `ladygreener_portal_customer_${slug}`;
const tipPendingKey = (slug: string) => `ladygreener_portal_tip_pending_${slug}`;

export type StoredSession = { token: string; customer: PortalCustomer };

/** Saved session for this business, or null. A corrupt entry is discarded. */
export function readSession(slug: string): StoredSession | null {
  if (typeof window === "undefined" || !slug) return null;
  const token = localStorage.getItem(tokenKey(slug));
  const raw = localStorage.getItem(customerKey(slug));
  if (!token || !raw) return null;
  try {
    return { token, customer: JSON.parse(raw) as PortalCustomer };
  } catch {
    clearSession(slug);
    return null;
  }
}

export function saveSession(slug: string, session: StoredSession) {
  localStorage.setItem(tokenKey(slug), session.token);
  localStorage.setItem(customerKey(slug), JSON.stringify(session.customer));
}

export function clearSession(slug: string) {
  localStorage.removeItem(tokenKey(slug));
  localStorage.removeItem(customerKey(slug));
}

/** The booking a customer was tipping when they left for Stripe Checkout. */
export function rememberPendingTip(slug: string, bookingId: string) {
  sessionStorage.setItem(tipPendingKey(slug), bookingId);
}

/** Read-and-clear: the flag is only meaningful for one return trip. */
export function takePendingTip(slug: string): string | null {
  const id = sessionStorage.getItem(tipPendingKey(slug));
  sessionStorage.removeItem(tipPendingKey(slug));
  return id;
}

export function cleanerName(b: PortalBooking): string | null {
  const a = b.assignments?.[0]?.cleaner?.user;
  if (!a) return null;
  return `${a.firstName} ${a.lastName}`.trim();
}
