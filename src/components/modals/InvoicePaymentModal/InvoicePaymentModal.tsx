"use client";

// NOT CURRENTLY WIRED UP — no page imports this modal, and the backend has
// no matching endpoint that issues a payment-intent clientSecret. It also
// runs against Lady Greener's agreed subscription-only billing model: job/
// booking payments happen outside the platform, so there's no invoice for
// Lady Greener itself to collect on. This is the "optional per-booking Stripe
// payment link" feature flagged as a possible v1.1 addition, left half-built
// — if picking it back up, it needs a backend route before it does anything;
// if abandoning it, this file and its backend counterpart can both go.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Invoice } from "@/app/api/types";
import {authFetch} from "@/app/api/authFetch";

// ─── Stripe type stubs (no @types/stripe-js needed if already installed) ────
declare global {
    interface Window {
        Stripe?: (key: string) => StripeInstance;
    }
}
interface StripeInstance {
    elements: (options: object) => StripeElements;
    confirmCardPayment: (
        clientSecret: string,
        data: object
    ) => Promise<{ paymentIntent?: { status: string }; error?: { message: string } }>;
}
interface StripeElements {
    create: (type: string, options?: object) => StripeElement;
    getElement: (type: string) => StripeElement | null;
}
interface StripeElement {
    mount: (selector: string | HTMLElement) => void;
    unmount: () => void;
    on: (event: string, handler: (e: { error?: { message: string } }) => void) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value?: number | string | null) {
    const amount = Number(value || 0);
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
        Number.isNaN(amount) ? 0 : amount
    );
}

function loadStripeScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.Stripe) return resolve();
        const existing = document.getElementById("stripe-js");
        if (existing) {
            existing.addEventListener("load", () => resolve());
            return;
        }
        const script = document.createElement("script");
        script.id = "stripe-js";
        script.src = "https://js.stripe.com/v3/";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Stripe.js"));
        document.head.appendChild(script);
    });
}

// ─── Step types ───────────────────────────────────────────────────────────────

type Step = "idle" | "loading_intent" | "ready" | "processing" | "success" | "error";

// ─── Component ───────────────────────────────────────────────────────────────

export default function InvoicePaymentModal({
                                                invoice,
                                                isOpen,
                                                onClose,
                                                onPaymentSuccess,
                                            }: {
    invoice: Invoice;
    isOpen: boolean;
    onClose: () => void;
    onPaymentSuccess: () => void;
}) {
    const [step, setStep] = useState<Step>("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [cardError, setCardError] = useState("");
    const [clientSecret, setClientSecret] = useState("");

    const stripeRef = useRef<StripeInstance | null>(null);
    const elementsRef = useRef<StripeElements | null>(null);
    const cardRef = useRef<StripeElement | null>(null);
    const cardMountRef = useRef<HTMLDivElement | null>(null);

    // ── Fetch PaymentIntent from your backend ──────────────────────────────
    const initPayment = useCallback(async () => {
        setStep("loading_intent");
        setErrorMsg("");
        setCardError("");

        try {
            const result = await authFetch(`/billing/invoices/${invoice.id}/pay`, {
                method: "POST",
            });

            if (!result.success) throw new Error(result.message || "Could not initiate payment.");

            const secret: string = result.data.clientSecret;
            setClientSecret(secret);

            // ── Load Stripe.js then mount card element ─────────────────────
            await loadStripeScript();

            const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
            if (!publishableKey) throw new Error("Stripe publishable key is not set.");

            const stripe = window.Stripe!(publishableKey);
            stripeRef.current = stripe;

            const isDark = document.documentElement.classList.contains("dark");

            const elements = stripe.elements({
                appearance: {
                    theme: isDark ? "night" : "stripe",
                    variables: {
                        colorPrimary: "#465fff",
                        colorBackground: isDark ? "#111827" : "#ffffff",
                        colorText: isDark ? "#e5e7eb" : "#1d2939",
                        colorDanger: "#d92d20",
                        fontFamily: "inherit",
                        spacingUnit: "4px",
                        borderRadius: "8px",
                    },
                },
                clientSecret: secret,
            });
            elementsRef.current = elements;

            const card = elements.create("card");
            cardRef.current = card;

            card.on("change", (e) => {
                setCardError(e.error?.message || "");
            });

            setStep("ready");

            // Mount after state update so the div is in the DOM
            setTimeout(() => {
                if (cardMountRef.current) {
                    card.mount(cardMountRef.current);
                }
            }, 50);
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
            setStep("error");
        }
    }, [invoice.id]);

    // ── Auto-init when modal opens ─────────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            initPayment();
        }
        return () => {
            // Cleanup card element on unmount
            cardRef.current?.unmount();
            cardRef.current = null;
            elementsRef.current = null;
        };
    }, [isOpen, initPayment]);

    // ── Submit payment ─────────────────────────────────────────────────────
    async function handlePay() {
        if (!stripeRef.current || !clientSecret) return;

        setStep("processing");
        setErrorMsg("");

        const cardElement = elementsRef.current?.getElement("card");
        if (!cardElement) {
            setErrorMsg("Card element not ready. Please refresh and try again.");
            setStep("ready");
            return;
        }

        const { paymentIntent, error } = await stripeRef.current.confirmCardPayment(clientSecret, {
            payment_method: { card: cardElement },
        });

        if (error) {
            setErrorMsg(error.message || "Payment failed.");
            setStep("ready");
            return;
        }

        if (paymentIntent?.status === "succeeded") {
            setStep("success");
            // Give the user a moment to see the success state, then close
            setTimeout(() => {
                onPaymentSuccess();
                onClose();
            }, 2000);
        } else {
            setErrorMsg("Payment could not be confirmed. Please try again.");
            setStep("ready");
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-gray-900">

                {/* ── Header ── */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
                            {/* Card icon */}
                            <svg className="h-4 w-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Pay Invoice
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {invoice.invoiceNumber}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={step === "processing"}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 dark:hover:bg-white/[0.06]"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="px-6 py-5 space-y-5">

                    {/* Amount summary */}
                    <div className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/[0.04]">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Amount due</span>
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(invoice.total)}
                            </span>
                        </div>
                        {invoice.facility?.name && (
                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                Billed to {invoice.facility.name}
                            </p>
                        )}
                    </div>

                    {/* ── Loading intent state ── */}
                    {step === "loading_intent" && (
                        <div className="flex flex-col items-center gap-3 py-6">
                            <Spinner />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Preparing secure payment…
                            </p>
                        </div>
                    )}

                    {/* ── Card element (ready / processing) ── */}
                    {(step === "ready" || step === "processing") && (
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Card details
                                </label>
                                {/* Stripe mounts into this div */}
                                <div
                                    ref={cardMountRef}
                                    className="h-11 rounded-lg border border-gray-300 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800"
                                />
                                {cardError && (
                                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{cardError}</p>
                                )}
                            </div>

                            {/* Stripe branding */}
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                                </svg>
                                Secured by Stripe
                            </div>
                        </div>
                    )}

                    {/* ── Success state ── */}
                    {step === "success" && (
                        <div className="flex flex-col items-center gap-3 py-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 dark:bg-green-500/10">
                                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">Payment successful</p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {formatCurrency(invoice.total)} paid · closing…
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Error state (intent failed) ── */}
                    {step === "error" && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10">
                            <p className="text-sm text-red-700 dark:text-red-300">{errorMsg}</p>
                            <button
                                type="button"
                                onClick={initPayment}
                                className="mt-2 text-xs font-medium text-red-600 underline hover:no-underline dark:text-red-400"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {/* Inline error during card confirmation */}
                    {(step === "ready" || step === "processing") && errorMsg && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10">
                            <p className="text-sm text-red-700 dark:text-red-300">{errorMsg}</p>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                {(step === "ready" || step === "processing") && (
                    <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={step === "processing"}
                            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handlePay}
                            disabled={step === "processing" || !!cardError}
                            className="flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {step === "processing" ? (
                                <>
                                    <Spinner small />
                                    Processing…
                                </>
                            ) : (
                                <>
                                    Pay {formatCurrency(invoice.total)}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function Spinner({ small }: { small?: boolean }) {
    const size = small ? "h-3.5 w-3.5" : "h-6 w-6";
    return (
        <svg
            className={`${size} animate-spin text-brand-500`}
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
    );
}