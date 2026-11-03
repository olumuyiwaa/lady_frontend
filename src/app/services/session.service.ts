/**
 * Staff session token storage.
 *
 * Tokens live in sessionStorage rather than localStorage so they are:
 *   - scoped to the tab (closed tab = cleared tokens, no cold-storage exposure)
 *   - inaccessible to other tabs on the same origin
 *   - not persisted across browser restarts
 *
 * The trade-off is that opening a new tab requires the user to sign in again.
 * That is acceptable for a staff dashboard used on trusted devices.
 *
 * Long-term: replace with httpOnly cookies set by the API. That moves the
 * tokens out of JavaScript-readable storage entirely (the only true XSS
 * mitigation). Requires backend changes to POST /auth/login and a
 * /auth/refresh endpoint that reads the cookie rather than the body.
 */
export const sessionService = {
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("accessToken");
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("refreshToken");
  },

  setTokens(access: string, refresh: string) {
    sessionStorage.setItem("accessToken", access);
    sessionStorage.setItem("refreshToken", refresh);
  },

  clearSession() {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
  },
};
