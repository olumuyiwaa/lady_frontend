/**
 * Customer self-service portal API client.
 *
 * Backend mounts:
 *   - Host-based:  /api/v1/portal/...
 *   - Slug-based:  /api/v1/portal-embed/:subdomain/...
 *
 * We prefer the slug path so each business works with zero DNS setup,
 * matching /book-now/[slug] → /widget-embed/[slug].
 */

import { getActiveCurrency } from "@/app/services/currency";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export type PortalCustomer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
};

export type TimelineStepKey =
  | "BOOKED"
  | "CONFIRMED"
  | "CLEANER_ASSIGNED"
  | "ON_THE_WAY"
  | "ARRIVED"
  | "COMPLETED"
  | "CANCELLED";

export type PortalTimeline = {
  steps: Array<{ key: TimelineStepKey; at: string | null; state: "done" | "current" | "upcoming" }>;
  current: TimelineStepKey;
};

export type PortalBooking = {
  id: string;
  status: string;
  scheduledStart: string;
  scheduledEnd: string;
  quotedPriceCents: number;
  paymentStatus?: string;
  amountPaidCents?: number | null;
  tipAmountCents?: number | null;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  cancelReason?: string | null;
  cancellationFeeCents?: number | null;
  service?: { id: string; name: string } | null;
  review?: { id: string; rating: number; comment?: string | null } | null;
  checklist?: { items: Array<{ label: string; done: boolean }>; completedAt?: string | null } | null;
  customAnswers?: Array<{ questionId: string; label: string; type: string; value: unknown }> | null;
  photos?: Array<{ id: string; stage: string; storageKey: string; url?: string | null }> | null;
  /** Progress steps; present on the single-booking endpoint. */
  timeline?: PortalTimeline | null;
  assignments?: Array<{
    id: string;
    onMyWayAt?: string | null;
    checkedInAt?: string | null;
    checkedOutAt?: string | null;
    cleaner?: {
      user?: { firstName: string; lastName: string } | null;
    } | null;
  }>;
};

async function portalFetch(
  slug: string | null,
  path: string,
  options: RequestInit = {},
  token?: string | null
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const base = slug
    ? `${API_BASE_URL}/portal-embed/${encodeURIComponent(slug)}`
    : `${API_BASE_URL}/portal`;

  const res = await fetch(`${base}${path}`, { ...options, headers });
  const result = await res.json().catch(() => ({}));

  if (!res.ok || result.success === false) {
    const message =
      result.message ||
      result.error ||
      (typeof result === "string" ? result : "Request failed");
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return result;
}

/** How a customer identifies themselves. A bare string is a phone number (older callers). */
export type PortalIdentity = string | { phone: string } | { email: string };

const identityBody = (who: PortalIdentity) => (typeof who === "string" ? { phone: who } : who);

export async function requestPortalAccess(slug: string | null, who: PortalIdentity) {
  const result = await portalFetch(slug, `/access/request`, {
    method: "POST",
    body: JSON.stringify(identityBody(who)),
  });
  return result.data as { sent: boolean };
}

export async function verifyPortalAccess(
  slug: string | null,
  who: PortalIdentity,
  code: string
) {
  const result = await portalFetch(slug, `/access/verify`, {
    method: "POST",
    body: JSON.stringify({ ...identityBody(who), code }),
  });
  return result.data as {
    token: string;
    customer: PortalCustomer;
  };
}

export async function listPortalBookings(slug: string | null, token: string) {
  const result = await portalFetch(slug, `/bookings`, { method: "GET" }, token);
  return result.data as PortalBooking[];
}

export async function getPortalBooking(
  slug: string | null,
  token: string,
  id: string
) {
  const result = await portalFetch(
    slug,
    `/bookings/${id}`,
    { method: "GET" },
    token
  );
  return result.data as PortalBooking;
}

/**
 * The invoice endpoint needs the bearer token, so it cannot be opened with a
 * plain link. Returns the invoice HTML for the caller to show in a new tab.
 */
export async function fetchPortalInvoiceHtml(
  slug: string | null,
  token: string,
  id: string
): Promise<string> {
  const base = slug
    ? `${API_BASE_URL}/portal-embed/${encodeURIComponent(slug)}`
    : `${API_BASE_URL}/portal`;
  const res = await fetch(`${base}/bookings/${id}/invoice/html`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "text/html" },
  });
  if (!res.ok) {
    const err = new Error("Request failed") as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.text();
}

export async function cancelPortalBooking(
  slug: string | null,
  token: string,
  id: string,
  reason?: string
) {
  const result = await portalFetch(
    slug,
    `/bookings/${id}/cancel`,
    { method: "POST", body: JSON.stringify({ reason }) },
    token
  );
  return result.data as PortalBooking;
}

export async function reschedulePortalBooking(
  slug: string | null,
  token: string,
  id: string,
  scheduledStart: string
) {
  const result = await portalFetch(
    slug,
    `/bookings/${id}/reschedule`,
    { method: "POST", body: JSON.stringify({ scheduledStart }) },
    token
  );
  return result.data as PortalBooking;
}

export async function leavePortalReview(
  slug: string | null,
  token: string,
  id: string,
  rating: number,
  comment?: string
) {
  const result = await portalFetch(
    slug,
    `/bookings/${id}/review`,
    { method: "POST", body: JSON.stringify({ rating, comment }) },
    token
  );
  return result.data;
}

export async function tipPortalBooking(
  slug: string | null,
  token: string,
  id: string,
  amountCents: number,
  successUrl: string,
  cancelUrl: string
) {
  const result = await portalFetch(
    slug,
    `/bookings/${id}/tip`,
    {
      method: "POST",
      body: JSON.stringify({ amountCents, successUrl, cancelUrl }),
    },
    token
  );
  return result.data as { url: string; sessionId: string };
}

export type PortalReward = {
  code: string;
  valueCents: number;
  expiresAt: string | null;
  status: "AVAILABLE" | "USED" | "EXPIRED";
};

export type PortalReferral = {
  /** False when the business has switched the programme off. */
  enabled: boolean;
  code: string;
  giveCents: number;
  getCents: number;
  friendsBooked: number;
  friendsCompleted: number;
  /** Promised for friends whose first visit is not done yet (or still in the hold period). */
  pendingCount: number;
  pendingCents: number;
  earnedCents: number;
  rewards: PortalReward[];
};

export type PortalCleanerChoice = { id: string; name: string; jobs: number };

export type PortalCleaners = {
  preferredCleanerId: string | null;
  cleaners: PortalCleanerChoice[];
};

export type PortalPreferences = { language: "nl" | "en"; whatsappOptIn: boolean };

export async function setPortalPreferences(
  slug: string | null,
  token: string,
  prefs: Partial<PortalPreferences>
) {
  const result = await portalFetch(slug, `/preferences`, { method: "PUT", body: JSON.stringify(prefs) }, token);
  return result.data as PortalPreferences;
}

export type PortalOverview = {
  /** Set when the customer is a business account. */
  company: { name: string; paymentTermsDays: number | null } | null;
  nextBooking: PortalBooking | null;
  counts: { upcoming: number; completed: number; total: number };
  unreadMessages: number;
  /** How we message this customer. */
  preferences?: PortalPreferences;
  preferredCleaner: PortalCleanerChoice | null;
  referral: {
    code: string;
    giveCents: number;
    getCents: number;
    friendsBooked: number;
    availableRewards: number;
  };
};

export type PortalChatMessage = {
  id: string;
  role: "CUSTOMER" | "CLEANER" | "STAFF";
  mine: boolean;
  name: string | null;
  body: string | null;
  createdAt: string;
  readAt: string | null;
};

export type PortalChat = {
  open: boolean;
  closedReason: "NO_CLEANER" | "CANCELLED" | "CLOSED" | null;
  with: string | null;
  messages: PortalChatMessage[];
};

export async function getPortalOverview(slug: string | null, token: string) {
  const result = await portalFetch(slug, `/overview`, { method: "GET" }, token);
  return result.data as PortalOverview;
}

export async function getPortalReferral(slug: string | null, token: string) {
  const result = await portalFetch(slug, `/referral`, { method: "GET" }, token);
  return result.data as PortalReferral;
}

export async function listPortalCleaners(slug: string | null, token: string) {
  const result = await portalFetch(slug, `/cleaners`, { method: "GET" }, token);
  return result.data as PortalCleaners;
}

/** Pass null to clear the preference. */
export async function setPortalPreferredCleaner(
  slug: string | null,
  token: string,
  cleanerId: string | null
) {
  const result = await portalFetch(
    slug,
    `/preferences/cleaner`,
    { method: "PUT", body: JSON.stringify({ cleanerId }) },
    token
  );
  return result.data as PortalCleaners;
}

export async function getPortalTimeline(slug: string | null, token: string, id: string) {
  const result = await portalFetch(slug, `/bookings/${id}/timeline`, { method: "GET" }, token);
  return result.data as PortalTimeline & { status: string };
}

export async function listPortalMessages(
  slug: string | null,
  token: string,
  id: string,
  after?: string
) {
  const qs = after ? `?after=${encodeURIComponent(after)}` : "";
  const result = await portalFetch(slug, `/bookings/${id}/messages${qs}`, { method: "GET" }, token);
  return result.data as PortalChat;
}

export async function postPortalMessage(
  slug: string | null,
  token: string,
  id: string,
  body: string
) {
  const result = await portalFetch(
    slug,
    `/bookings/${id}/messages`,
    { method: "POST", body: JSON.stringify({ body }) },
    token
  );
  return result.data as PortalChatMessage;
}

export function formatMoney(
  cents: number,
  currency: string = getActiveCurrency(),
  locale?: string
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/**
 * `t` must be scoped to the `Portal.status` namespace
 * (e.g. `useTranslations("Portal.status")`) — same pattern as
 * frequencyLabel/cancellationPolicyLabel in components/booking/types.ts.
 */
export function statusLabel(status: string, t: (key: string) => string) {
  const keys: Record<string, string> = {
    REQUESTED: "requested",
    CONFIRMED: "confirmed",
    ASSIGNED: "assigned",
    IN_PROGRESS: "inProgress",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
  };
  const key = keys[status];
  return key ? t(key) : status;
}

export function statusColor(status: string) {
  const map: Record<string, string> = {
    REQUESTED: "bg-amber-100 text-amber-800",
    CONFIRMED: "bg-sky-100 text-sky-800",
    ASSIGNED: "bg-indigo-100 text-indigo-800",
    IN_PROGRESS: "bg-violet-100 text-violet-800",
    COMPLETED: "bg-emerald-100 text-emerald-800",
    CANCELLED: "bg-gray-100 text-gray-600",
  };
  return map[status] || "bg-gray-100 text-gray-600";
}

export const COMPLAINT_CATEGORIES = ["QUALITY", "NO_SHOW", "LATE", "DAMAGE", "BEHAVIOUR", "SAFETY", "BILLING", "OTHER"] as const;
export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export type PortalComplaint = {
  id: string;
  reference: string;
  bookingId: string | null;
  category: string | null;
  status: string;
  description: string;
  createdAt: string;
  resolvedAt: string | null;
};

export async function createPortalComplaint(
  slug: string | null,
  token: string,
  bookingId: string,
  body: { category: ComplaintCategory; description: string }
) {
  const result = await portalFetch(
    slug,
    `/bookings/${bookingId}/complaint`,
    { method: "POST", body: JSON.stringify(body) },
    token
  );
  return result.data as { id: string; reference: string; category: string; priority: string; status: string };
}

export async function listPortalComplaints(slug: string | null, token: string) {
  const result = await portalFetch(slug, `/complaints`, { method: "GET" }, token);
  return result.data as PortalComplaint[];
}

export type B2BSummary = {
  month: string;
  currency: string;
  company: { name: string; kvkNumber: string | null; vatNumber: string | null; paymentTermsDays: number | null };
  visits: number;
  completedVisits: number;
  spendCents: number;
  travelCents: number;
  hours: number;
  previousSpendCents: number;
  locations: { key: string; label: string; visits: number; hours: number; spendCents: number }[];
  services: { name: string; visits: number; spendCents: number }[];
  invoices: {
    issuedCount: number;
    issuedCents: number;
    openCount: number;
    openCents: number;
    overdueCount: number;
    overdueCents: number;
  };
};

export async function getPortalB2BSummary(slug: string | null, token: string, month?: string) {
  const qs = month ? `?month=${encodeURIComponent(month)}` : "";
  const result = await portalFetch(slug, `/b2b/summary${qs}`, { method: "GET" }, token);
  return result.data as B2BSummary;
}

/** Fetches a binary B2B file (the quality report PDF) with the portal token. */
export async function fetchPortalB2BBlob(slug: string | null, token: string, path: string): Promise<Blob> {
  const base = slug
    ? `${API_BASE_URL}/portal-embed/${encodeURIComponent(slug)}`
    : `${API_BASE_URL}/portal`;
  const res = await fetch(`${base}${path}`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/pdf" } });
  if (!res.ok) {
    const err = new Error("Request failed") as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.blob();
}

/** Fetches a B2B file (CSV or statement HTML) with the portal token. */
export async function fetchPortalB2BFile(
  slug: string | null,
  token: string,
  path: string,
  accept: string
): Promise<string> {
  const base = slug
    ? `${API_BASE_URL}/portal-embed/${encodeURIComponent(slug)}`
    : `${API_BASE_URL}/portal`;
  const res = await fetch(`${base}${path}`, { headers: { Authorization: `Bearer ${token}`, Accept: accept } });
  if (!res.ok) {
    const err = new Error("Request failed") as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.text();
}
