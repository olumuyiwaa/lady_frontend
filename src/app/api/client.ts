const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8000/api/v1";

import { sessionService } from "../services/session.service";

// Refresh tokens rotate server-side (the old one is deleted the moment a new
// one is issued), so if two requests 401 at the same moment and each calls
// this independently, the second call's refreshToken is already consumed
// and fails — logging the user out even though the first refresh succeeded.
// This module-level promise makes every concurrent caller await the same
// in-flight refresh instead of racing separate ones.
let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        const refreshToken = sessionService.getRefreshToken();

        if (!refreshToken) {
            throw new Error("No refresh token found");
        }

        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data?.message || "Refresh failed");
        }

        sessionService.setTokens(data.data.accessToken, data.data.refreshToken);

        return data.data.accessToken;
    })();

    try {
        return await refreshPromise;
    } finally {
        refreshPromise = null;
    }
}