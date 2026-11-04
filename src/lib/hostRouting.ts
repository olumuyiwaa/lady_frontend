/**
 * Splits one Next.js app across two hosts:
 *
 *   todcleaning.nl         storefront + customer portal
 *   admin.todcleaning.nl   staff sign-in and the dashboard
 *
 * Both hosts serve the same deployment. The admin host is switched on by
 * NEXT_PUBLIC_ADMIN_URL; when it is unset (local development) everything is
 * served from one origin and no redirects happen.
 */

/** First path segments that belong to the staff dashboard and its sign-in flow. */
export const ADMIN_SEGMENTS = new Set([
  "signin", "forgot-password", "reset-password", "verify-email", "onboarding",
  "audit-trail", "booking-questions", "bookings", "business-settings", "calendar",
  "checklist-templates", "cleaner-documents", "cleaners", "compliance", "coupons",
  "customers", "dashboard", "dispatch", "gift-cards", "inventory", "messages",
  "notifications", "payroll", "pricing", "profile", "recurring-schedules", "reports",
  "reviews", "services", "support-tickets", "team", "transactions", "waitlist", "website",
]);

/** First path segments that only make sense on the public site. */
export const PUBLIC_SEGMENTS = new Set(["portal", "terms", "privacy", "cookies", "book-now"]);

const firstSegment = (pathname: string) => pathname.split("/")[1] || "";

function parse(value: string | undefined): URL | null {
  const raw = (value || "").trim();
  if (!raw) return null;
  try {
    return new URL(raw.includes("://") ? raw : `https://${raw}`);
  } catch {
    return null;
  }
}

export interface HostRouteInput {
  host: string;
  pathname: string;
  search?: string;
  adminUrl?: string;
  siteUrl?: string;
}

export interface HostRoute {
  /** Absolute URL to redirect to, or null to serve the request here. */
  redirectTo: string | null;
  /** True when the request is on the admin host (it should not be indexed). */
  isAdminHost: boolean;
}

export function resolveHostRoute({ host, pathname, search = "", adminUrl, siteUrl }: HostRouteInput): HostRoute {
  const admin = parse(adminUrl);
  if (!admin) return { redirectTo: null, isAdminHost: false };

  const onAdmin = host.toLowerCase() === admin.host.toLowerCase();
  const segment = firstSegment(pathname);

  if (onAdmin) {
    if (pathname === "/") return { redirectTo: `${admin.origin}/signin`, isAdminHost: true };
    const site = parse(siteUrl);
    if (site && PUBLIC_SEGMENTS.has(segment)) {
      return { redirectTo: `${site.origin}${pathname}${search}`, isAdminHost: true };
    }
    return { redirectTo: null, isAdminHost: true };
  }

  if (ADMIN_SEGMENTS.has(segment)) {
    return { redirectTo: `${admin.origin}${pathname}${search}`, isAdminHost: false };
  }
  return { redirectTo: null, isAdminHost: false };
}

/** Where the footer "Staff login" link points. */
export function staffLoginHref(adminUrl: string | undefined): string {
  const admin = parse(adminUrl);
  return admin ? `${admin.origin}/signin` : "/signin";
}
