"use client";

import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { AuthContextType, LoginOutcome, User } from "../api/types";
import { ApiError } from "../api/errors";
import { authApi, LoginPayload } from "../api/auth.api";
import { sessionService } from "../services/session.service";
import { socketService } from "@/app/services/socket.service";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAndSetUser = async () => {
    const me = await authApi.getMe();
    setUser(me);
  };

  const login = async (payload: LoginPayload): Promise<LoginOutcome> => {
    let envelope;
    try {
      envelope = await authApi.login(payload);
    } catch (err) {
      // The backend answers 401 + TWO_FACTOR_REQUIRED when the password was
      // right but the account needs an authenticator code: ask for it.
      if (err instanceof ApiError && err.code === "TWO_FACTOR_REQUIRED") {
        return { status: "two_factor_required" };
      }
      throw err;
    }

    // Account belongs to several workspaces: no tokens yet, choose one first.
    // (Previously this response was destructured as tokens, storing the
    // string "undefined" as the session.)
    if ("requiresBusinessSelection" in envelope.data) {
      return { status: "select_business", affiliations: envelope.data.affiliations };
    }

    // cleansera_sass nests tokens inside data — never at the envelope root
    const { accessToken, refreshToken } = envelope.data;
    sessionService.setTokens(accessToken, refreshToken);
    socketService.connect(accessToken);
    await fetchAndSetUser();
    return { status: "signed_in" };
  };

  const logout = async () => {
    try {
      const refreshToken = sessionService.getRefreshToken();
      if (refreshToken) await authApi.logout(refreshToken);
    } catch (err) {
      console.error("Logout API error:", err);
    }

    sessionService.clearSession();
    socketService.disconnect();
    setUser(null);
    window.location.href = "/";
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = sessionService.getAccessToken();
        if (!token) return;

        socketService.connect(token);
        await fetchAndSetUser();
      } catch {
        sessionService.clearSession();
        socketService.disconnect();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
