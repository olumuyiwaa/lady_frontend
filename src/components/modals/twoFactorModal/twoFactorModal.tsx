"use client";

import React, { useState } from "react";
import { authFetch } from "@/app/api/authFetch";

type Step = "idle" | "setup" | "verify" | "success";

type SetupData = {
    qrCodeUrl: string;   // data URI or remote URL returned by /auth/2fa/setup
    secret: string;      // manual-entry key
};

type TwoFactorModalProps = {
    isEnabled: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

export function TwoFactorModal({
                                   isEnabled,
                                   onClose,
                                   onSuccess,
                               }: TwoFactorModalProps) {
    const [step, setStep] = useState<Step>("setup");
    const [setupData, setSetupData] = useState<SetupData | null>(null);
    const [totpCode, setTotpCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [secretCopied, setSecretCopied] = useState(false);

    // ── Step 1: call /auth/2fa/setup ──────────────────────────────────────
    async function handleSetup() {
        setIsLoading(true);
        setError("");

        try {
            const result = await authFetch("/auth/2fa/setup", { method: "POST" });

            if (!result.success) throw new Error(result.message);

            setSetupData(result.data);
            setStep("verify");
        } catch (err: any) {
            setError(err.message ?? "Failed to generate 2FA secret.");
        } finally {
            setIsLoading(false);
        }
    }

    // ── Step 2: call /auth/2fa/enable ─────────────────────────────────────
    async function handleEnable() {
        if (totpCode.length !== 6) {
            setError("Please enter the 6-digit code from your authenticator app.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const result = await authFetch("/auth/2fa/enable", {
                method: "POST",
                body: JSON.stringify({ totpCode }),
            });

            if (!result.success) throw new Error(result.message);

            setStep("success");
        } catch (err: any) {
            setError(err.message ?? "Invalid code. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    function copySecret() {
        if (!setupData?.secret) return;
        navigator.clipboard.writeText(setupData.secret);
        setSecretCopied(true);
        setTimeout(() => setSecretCopied(false), 2000);
    }

    // ── Auto-trigger setup on first open ─────────────────────────────────
    React.useEffect(() => {
        handleSetup();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                            <ShieldIcon />
                        </span>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                            Enable Two-Factor Authentication
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5">

                    {/* ── Loading skeleton while fetching QR ── */}
                    {step === "setup" && (
                        <div className="flex flex-col items-center gap-4 py-6">
                            <div className="h-44 w-44 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
                            <div className="h-4 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                        </div>
                    )}

                    {/* ── QR + manual key ── */}
                    {step === "verify" && setupData && (
                        <div className="space-y-5">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Scan the QR code with your authenticator app (Google Authenticator,
                                Authy, etc.), then enter the 6-digit code below.
                            </p>

                            {/* QR Code */}
                            <div className="flex justify-center">
                                <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={setupData.qrCodeUrl}
                                        alt="2FA QR Code"
                                        width={176}
                                        height={176}
                                        className="h-44 w-44"
                                    />
                                </div>
                            </div>

                            {/* Manual entry key */}
                            <div>
                                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
                                    Can't scan? Enter this key manually
                                </p>
                                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                                    <code className="flex-1 break-all font-mono text-xs text-gray-700 dark:text-gray-300">
                                        {setupData.secret}
                                    </code>
                                    <button
                                        onClick={copySecret}
                                        className="flex-shrink-0 rounded p-1 text-gray-400 transition hover:text-brand-500"
                                        title="Copy to clipboard"
                                    >
                                        {secretCopied ? <CheckIcon /> : <CopyIcon />}
                                    </button>
                                </div>
                            </div>

                            {/* TOTP input */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Verification Code
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={totpCode}
                                    onChange={(e) =>
                                        setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-center font-mono text-lg tracking-[0.5em] text-gray-900 placeholder-gray-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                            </div>

                            {error && (
                                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                                    {error}
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── Success state ── */}
                    {step === "success" && (
                        <div className="flex flex-col items-center gap-4 py-6 text-center">
                            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                                <LargeCheckIcon />
                            </span>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    2FA Enabled
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Your account is now protected with two-factor authentication.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                    {step !== "success" && (
                        <button
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </button>
                    )}

                    {step === "verify" && (
                        <button
                            onClick={handleEnable}
                            disabled={isLoading || totpCode.length !== 6}
                            className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isLoading ? "Verifying..." : "Verify & Enable"}
                        </button>
                    )}

                    {step === "success" && (
                        <button
                            onClick={() => { onSuccess(); onClose(); }}
                            className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
                        >
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Inline SVG icons (no extra dependency) ───────────────────────────────────

function ShieldIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function CopyIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

function LargeCheckIcon() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}