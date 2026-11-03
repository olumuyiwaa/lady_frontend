"use client";

import React, { useState } from "react";
import { authApi } from "@/app/api/auth.api";

type Disable2FAModalProps = {
  onSuccess: () => void;
  onClose: () => void;
};

export function Disable2FAModal({ onSuccess, onClose }: Disable2FAModalProps) {
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleDisable = async () => {
    if (!password) { setError("Password is required"); return; }
    if (totpCode.length !== 6) { setError("Enter your 6-digit authenticator code"); return; }

    setIsLoading(true);
    setError("");
    try {
      await authApi.disable2FA({ totpCode, password });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to disable 2FA"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Disable Two-Factor Auth
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 px-4 py-3">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Disabling 2FA will reduce your account security. You'll need your
              current password and authenticator code to confirm.
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 pr-10 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* TOTP */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Authenticator Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={totpCode}
              onChange={(e) =>
                setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              onKeyDown={(e) => e.key === "Enter" && handleDisable()}
              placeholder="000000"
              className="w-full text-center text-2xl tracking-[0.5em] font-mono border border-gray-300 dark:border-gray-600 rounded-lg py-3 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDisable}
            disabled={isLoading || !password || totpCode.length !== 6}
            className="flex-1 py-3 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition"
          >
            {isLoading ? "Disabling..." : "Disable 2FA"}
          </button>
        </div>
      </div>
    </div>
  );
}