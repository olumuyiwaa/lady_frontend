"use client";

import React, { useState } from "react";

type TwoFactorLoginModalProps = {
  userId: string;
  challengeToken: string;
  onVerify: (userId: string, challengeToken: string, totpCode: string) => Promise<void>;
  onSuccess: () => void;
  onClose: () => void;
};

export function TwoFactorLoginModal({
  userId,
  challengeToken,
  onVerify,
  onSuccess,
  onClose,
}: TwoFactorLoginModalProps) {
  const [totpCode, setTotpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (totpCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await onVerify(userId, challengeToken, totpCode);
      onSuccess();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Invalid verification code"
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
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Two-Factor Authentication
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
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter the 6-digit code from your authenticator app to complete sign-in.
          </p>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={totpCode}
              onChange={(e) =>
                setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              className="w-full text-center text-3xl tracking-[0.5em] font-mono border border-gray-300 dark:border-gray-600 rounded-lg py-4 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="000000"
              autoFocus
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 text-center">
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
            onClick={handleVerify}
            disabled={isLoading || totpCode.length !== 6}
            className="flex-1 py-3 text-sm font-medium bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition"
          >
            {isLoading ? "Verifying..." : "Verify"}
          </button>
        </div>
      </div>
    </div>
  );
}