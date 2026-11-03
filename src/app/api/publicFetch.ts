// Unauthenticated fetch wrapper for the public booking widget. No access
// token, no refresh flow — this hits the slug-resolved widget endpoints
// (/widget-embed/:subdomain/...), which are public by design.
import { ApiError } from "@/app/api/errors";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export async function publicFetch(url: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...options.headers,
        },
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result || !result.success) {
        const message =
            (result && result.message) || `Request failed (${response.status})`;
        throw new ApiError(message, response.status, result ? result.errors : undefined);
    }

    return result;
}
