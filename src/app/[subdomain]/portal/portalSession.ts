import type { PortalBooking, PortalCustomer } from "@/app/api/portal.api";

/**
 * Customer portal session storage.
 *
 * The auth token lives in sessionStorage (tab-scoped, not persisted to disk,
 * inaccessible to other tabs). Customer profile data also lives in
 * sessionStorage — it is low-sensitivity but keeping it alongside the token
 * avoids an extra API call on tab reload and ensures both are cleared together.
 *
 * The key includes the slug because path-based tenancy on the app host shares
 * one origin between businesses: without it, signing in to one business would
 * appear signed in to another.
 *
 * Long-term: replace with httpOnly cookies set by the API, which would remove
 * the token from JS-readable storage entirely.
 */
const tokenKey    = (slug: string) => `ladygreener_portal_token_${slug}`;
const customerKey = (slug: string) => `ladygreener_portal_customer_${slug}`;
const tipPendingKey = (slug: string) => `ladygreener_portal_tip_pending_${slug}`;

export type StoredSession = { token: string; customer: PortalCustomer };

/** Saved session for this business, or null. A corrupt entry is discarded. */
export function readSession(slug: string): StoredSession | null {
  if (typeof window === "undefined" || !slug) return null;
  const token = sessionStorage.getItem(tokenKey(slug));
  const raw   = sessionStorage.getItem(customerKey(slug));
  if (!token || !raw) return null;
  try {
    return { token, customer: JSON.parse(raw) as PortalCustomer };
  } catch {
    clearSession(slug);
    return null;
  }
}

export function saveSession(slug: string, session: StoredSession) {
  sessionStorage.setItem(tokenKey(slug), session.token);
  sessionStorage.setItem(customerKey(slug), JSON.stringify(session.customer));
}

export function clearSession(slug: string) {
  sessionStorage.removeItem(tokenKey(slug));
  sessionStorage.removeItem(customerKey(slug));
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
