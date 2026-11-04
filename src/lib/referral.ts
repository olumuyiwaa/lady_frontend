/**
 * "Give €20, Get €20" referral links.
 *
 * A friend's link looks like  https://site/?ref=ABC234. The code is kept for
 * the visit (localStorage, with a sessionStorage fallback) so it survives
 * moving around the site before the booking is made, and is sent with the
 * booking. The server only honours it for brand-new customers.
 */

const KEY = "todcleaning_referral";
const CODE_RE = /^[A-Za-z0-9]{4,12}$/;

function storages(): Storage[] {
  const out: Storage[] = [];
  try {
    if (typeof window !== "undefined") out.push(window.localStorage);
  } catch {
    /* blocked */
  }
  try {
    if (typeof window !== "undefined") out.push(window.sessionStorage);
  } catch {
    /* blocked */
  }
  return out;
}

export function isValidReferralCode(code: string | null | undefined): code is string {
  return !!code && CODE_RE.test(code);
}

/** Stores ?ref=CODE from the current URL, if present and well-formed. Returns the stored code. */
export function captureReferralFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("ref");
  if (isValidReferralCode(raw)) {
    const code = raw.toUpperCase();
    for (const s of storages()) {
      try {
        s.setItem(KEY, code);
        break;
      } catch {
        /* try the next one */
      }
    }
    return code;
  }
  return readReferralCode();
}

export function readReferralCode(): string | null {
  for (const s of storages()) {
    try {
      const v = s.getItem(KEY);
      if (isValidReferralCode(v)) return v.toUpperCase();
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function clearReferralCode() {
  for (const s of storages()) {
    try {
      s.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }
}

/** The link a customer shares with friends. */
export function referralLink(code: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/?ref=${encodeURIComponent(code)}`;
}
