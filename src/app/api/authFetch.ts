import { sessionService } from "../services/session.service";
import { refreshAccessToken } from "./client";
import { ApiError } from "@/app/api/errors";

export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export async function authFetch(
    url: string,
    options: RequestInit = {}
) {
    let token = sessionService.getAccessToken();

    const makeRequest = async (accessToken?: string) =>
        fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${accessToken || token}`,
                ...options.headers,
            },
        });

    let response = await makeRequest();

    if (response.status === 401) {
        try {
            const newToken = await refreshAccessToken();
            response = await makeRequest(newToken);
        } catch {
            sessionService.clearSession();

            window.location.href = "/";

            throw new Error("Session expired");
        }
    }

    const result = await response.json();

    if (!response.ok || !result.success) {
        // Tell the app shell (SubscriptionBanner) instead of every caller having
        // to special-case these two account-level states.
        const code = result?.errors?.code;
        if (typeof window !== "undefined") {
            if (response.status === 402 && code === "SUBSCRIPTION_REQUIRED") {
                window.dispatchEvent(new CustomEvent("cleansera:subscription-required", { detail: { message: result.message } }));
            } else if (response.status === 403 && code === "BUSINESS_SUSPENDED") {
                window.dispatchEvent(new CustomEvent("cleansera:business-suspended", { detail: { message: result.message } }));
            }
        }
        throw new ApiError(
            result.message || "Request failed",
            response.status,
            result.errors
        );
    }

    return result;
}