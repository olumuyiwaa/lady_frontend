"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, Suspense } from "react";
import { authApi } from "@/app/api/auth.api";
import Link from "next/link";

// ─── Inner component (uses useSearchParams — must be inside Suspense) ─────────

function VerifyEmailForm() {
    const params = useSearchParams();
    const router = useRouter();

    const userId = params.get("userId") || "";
    const email  = params.get("email")  || "";

    const [code, setCode]           = useState(["", "", "", "", "", ""]);
    const [loading, setLoading]     = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError]         = useState<string | null>(null);
    const [resendMsg, setResendMsg] = useState<string | null>(null);
    const [resendCooldown, setResendCooldown] = useState(0);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // ── OTP input helpers ──────────────────────────────────────

    const handleChange = (index: number, value: string) => {
        // Accept only digits; handle paste of full 6-digit code
        if (value.length > 1) {
            const digits = value.replace(/\D/g, "").slice(0, 6).split("");
            const next = [...code];
            digits.forEach((d, i) => { if (index + i < 6) next[index + i] = d; });
            setCode(next);
            const focusIndex = Math.min(index + digits.length, 5);
            inputRefs.current[focusIndex]?.focus();
            return;
        }

        if (!/^\d?$/.test(value)) return; // digits only
        const next = [...code];
        next[index] = value;
        setCode(next);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const fullCode = code.join("");

    // ── Verify ────────────────────────────────────────────────

    const verify = async () => {
        setError(null);
        if (fullCode.length < 6) {
            setError("Please enter the full 6-digit code.");
            return;
        }
        if (!userId) {
            setError("Missing user session. Please sign up again.");
            return;
        }

        try {
            setLoading(true);
            const res = await authApi.verifyEmail({ userId, code: fullCode });
            if (!res.success) {
                setError(res.message || "Verification failed. Please try again.");
                return;
            }
            router.push("/?verified=true");
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Verification failed. Please check the code and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    // ── Resend ────────────────────────────────────────────────

    const resend = async () => {
        if (resendCooldown > 0 || !email) return;
        setError(null);
        setResendMsg(null);

        try {
            setResending(true);
            await authApi.resendVerification(email);
            setResendMsg("A new code has been sent to your email.");
            setCode(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();

            // 60-second cooldown
            let seconds = 60;
            setResendCooldown(seconds);
            const interval = setInterval(() => {
                seconds -= 1;
                setResendCooldown(seconds);
                if (seconds <= 0) clearInterval(interval);
            }, 1000);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to resend code. Please try again."
            );
        } finally {
            setResending(false);
        }
    };

    // ── Render ────────────────────────────────────────────────

    const maskedEmail = email
        ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + "*".repeat(Math.max(b.length, 3)) + c)
        : "";

    return (
        <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">

                {/* Icon */}
                <div className="mb-6 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                             className="text-brand-500">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                        </svg>
                    </div>
                </div>

                {/* Heading */}
                <div className="mb-6 text-center">
                    <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                        Check your email
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        We sent a 6-digit verification code to{" "}
                        {maskedEmail
                            ? <span className="font-medium text-gray-700 dark:text-gray-300">{maskedEmail}</span>
                            : "your email address"
                        }.
                    </p>
                </div>

                {/* OTP inputs */}
                <div className="flex justify-center gap-2 sm:gap-3 mb-6">
                    {code.map((digit, i) => (
                        <input
                            key={i}
                            ref={(el) => { inputRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={digit}
                            onChange={(e) => handleChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            onFocus={(e) => e.target.select()}
                            className={[
                                "h-12 w-12 sm:h-14 sm:w-14 rounded-xl border-2 text-center text-lg font-semibold",
                                "text-gray-800 dark:text-white/90",
                                "transition-all duration-150 focus:outline-none",
                                digit
                                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 dark:border-brand-500"
                                    : "border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900",
                                "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
                            ].join(" ")}
                        />
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                        {error}
                    </div>
                )}

                {/* Resend success */}
                {resendMsg && (
                    <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300">
                        {resendMsg}
                    </div>
                )}

                {/* Verify button */}
                <button
                    type="button"
                    onClick={verify}
                    disabled={loading || fullCode.length < 6}
                    className="flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Verifying...
            </span>
                    ) : (
                        "Verify Email"
                    )}
                </button>

                {/* Resend */}
                <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
                    Didn&apos;t receive the code?{" "}
                    {resendCooldown > 0 ? (
                        <span className="text-gray-400 dark:text-gray-600">
              Resend in {resendCooldown}s
            </span>
                    ) : (
                        <button
                            type="button"
                            onClick={resend}
                            disabled={resending}
                            className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 disabled:opacity-60"
                        >
                            {resending ? "Sending..." : "Resend code"}
                        </button>
                    )}
                </p>

                {/* Back to sign in */}
                <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    <Link
                        href="/public"
                        className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Back to Sign In
                    </Link>
                </p>

            </div>
        </div>
    );
}

// ─── Loading skeleton shown while params are being read ───────────────────────

function VerifyEmailSkeleton() {
    return (
        <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                <div className="mb-6 flex justify-center">
                    <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                </div>
                <div className="mb-6 space-y-2 text-center">
                    <div className="mx-auto h-6 w-48 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    <div className="mx-auto h-4 w-64 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
                </div>
                <div className="flex justify-center gap-3 mb-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-14 w-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    ))}
                </div>
                <div className="h-11 w-full rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
            </div>
        </div>
    );
}

// ─── Page export — Suspense wraps the component that calls useSearchParams ────

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<VerifyEmailSkeleton />}>
            <VerifyEmailForm />
        </Suspense>
    );
}