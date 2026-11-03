import { authFetch } from "@/app/api/authFetch";
import { publicFetch } from "@/app/api/publicFetch";

// ─── Shared envelope ──────────────────────────────────────────
// Every cleansera_sass response follows this shape: { success, message, data }.
// Unlike some other backends, tokens live INSIDE data — never at the
// envelope root — for both /auth/login and /auth/refresh.
interface ApiEnvelope<T> {
    success: boolean;
    message: string | null;
    data: T;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface RegisterBusinessPayload {
    businessName: string;
    subdomain: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
}

export interface LoginPayload {
    email: string;
    password: string;
    /** Required by the backend for accounts with two-factor authentication. */
    twoFactorCode?: string;
    /** Pick a workspace when the account belongs to more than one. */
    businessId?: string;
}

export interface Affiliation {
    businessId: string;
    businessName: string;
    subdomain: string;
    role: string;
}

/** /auth/login answers with tokens, or asks the user to choose a workspace first. */
export type LoginResponse =
    | AuthTokens
    | { requiresBusinessSelection: true; affiliations: Affiliation[] };

export interface CurrentUser {
    id: string;
    email: string;
    phone: string | null;
    firstName: string;
    lastName: string;
    isEmailVerified: boolean;
    twoFactorEnabled: boolean;
    createdAt: string;
    globalRole: "SUPER_ADMIN" | "PLATFORM_USER";
    businessId: string | null;
    businessRole: "BUSINESS_OWNER" | "BUSINESS_MANAGER" | "ORG_ADMIN" | "CLEANER" | null;
    business: { id: string; name: string; subdomain: string; timezone: string } | null;
}

async function post<T>(path: string, body?: unknown): Promise<ApiEnvelope<T>> {
    return authFetch(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined });
}

// Endpoints used before there is a session. These must NOT go through
// authFetch: it treats every 401 as "access token expired", tries to refresh,
// finds no refresh token, and reloads the page with "Session expired" — so a
// wrong password never showed its error, and the two-factor prompt (which the
// backend signals with a 401) could never appear.
async function publicPost<T>(path: string, body?: unknown): Promise<ApiEnvelope<T>> {
    return publicFetch(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined });
}

export const authApi = {
    register: (payload: RegisterBusinessPayload) => publicPost<AuthTokens>("/auth/register", payload),

    login: (payload: LoginPayload) => publicPost<LoginResponse>("/auth/login", payload),

    refresh: (refreshToken: string) => publicPost<AuthTokens>("/auth/refresh", { refreshToken }),

    logout: (refreshToken: string) => post<null>("/auth/logout", { refreshToken }),

    requestPasswordReset: (email: string) => publicPost<null>("/auth/password-reset/request", { email }),

    confirmPasswordReset: (token: string, password: string) =>
        publicPost<null>("/auth/password-reset/confirm", { token, password }),

    requestEmailVerify: () => post<null>("/auth/email/verify/request"),

    confirmEmailVerify: (code: string) => post<null>("/auth/email/verify/confirm", { code }),

    generate2FA: () => post<{ otpauth_url: string; base32: string }>("/auth/2fa/generate"),

    verifyEnable2FA: (token: string) => post<null>("/auth/2fa/verify-enable", { token }),

    // Turning 2FA off needs the account password and a current authenticator
    // code; the backend rejects the request without both. (`totpCode` is the
    // name the modal uses; the API calls it `code`.)
    disable2FA: (confirmation: { password: string; totpCode?: string; code?: string }) =>
        post<null>("/auth/2fa/disable", {
            password: confirmation.password,
            code: confirmation.code ?? confirmation.totpCode,
        }),

    // ─── Convenience aliases used by the auth pages ──────────────────
    // cleansera_sass's email-verify routes require an authenticated
    // session (they act on req.user, not a userId/email from the request
    // body), so these ignore any userId/email argument the page passes
    // and act on whoever's currently logged in.
    forgotPassword: (email: string) => publicPost<null>("/auth/password-reset/request", { email }),

    resetPassword: (payload: { token: string; password: string }) =>
        publicPost<null>("/auth/password-reset/confirm", payload),

    verifyEmail: (payload: { userId?: string; code: string }) =>
        post<null>("/auth/email/verify/confirm", { code: payload.code }),

    resendVerification: (_email?: string) => post<null>("/auth/email/verify/request"),

    getMe: async () => {
        const result = await authFetch("/auth/me", { method: "GET" });
        return result.data as CurrentUser;
    },
};
