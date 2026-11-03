"use client";

import { useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";

/* Small presentational pieces of the customer portal, split out of page.tsx. */


export function StatCard({
                      label,
                      value,
                      accent,
                  }: {
    label: string;
    value: number;
    accent?: boolean;
}) {
    return (
        <div
            className={`min-w-[5.5rem] rounded-2xl px-4 py-3 text-center shadow-theme-xs ring-1 ${
                accent
                    ? "bg-brand-500 text-white ring-brand-500"
                    : "bg-white text-gray-800 ring-gray-200 dark:bg-white/[0.03] dark:text-white/90 dark:ring-gray-800"
            }`}
        >
            <p
                className={`text-2xl font-semibold tabular-nums ${
                    accent ? "text-white" : "text-gray-800 dark:text-white/90"
                }`}
            >
                {value}
            </p>
            <p
                className={`text-[11px] font-medium uppercase tracking-wide ${
                    accent ? "text-brand-100" : "text-gray-500 dark:text-gray-400"
                }`}
            >
                {label}
            </p>
        </div>
    );
}

export function ActionBtn({
                       children,
                       onClick,
                       primary,
                       danger,
                   }: {
    children: React.ReactNode;
    onClick: () => void;
    primary?: boolean;
    danger?: boolean;
}) {
    const base =
        "rounded-xl px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1";
    if (danger) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={`${base} border border-red-200 text-red-600 hover:bg-red-50 focus:ring-red-200`}
            >
                {children}
            </button>
        );
    }
    if (primary) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={`${base} bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-300`}
            >
                {children}
            </button>
        );
    }
    return (
        <button
            type="button"
            onClick={onClick}
            className={`${base} border border-gray-200 text-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 focus:ring-gray-200`}
        >
            {children}
        </button>
    );
}

export function Modal({
                   title,
                   children,
                   onClose,
                   wide,
               }: {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    wide?: boolean;
}) {
    const t = useTranslations("Portal");
    const titleId = useId();
    const dialogRef = useRef<HTMLDivElement>(null);

    // Accessible dialog behaviour: move focus in on open, keep Tab inside, close
    // on Escape, and hand focus back to whatever opened it.
    useEffect(() => {
        const previouslyFocused = document.activeElement as HTMLElement | null;
        const node = dialogRef.current;
        node?.focus();
        return () => previouslyFocused?.focus?.();
    }, []);

    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
            return;
        }
        if (e.key !== "Tab") return;
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === dialogRef.current)) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && active === last) {
            e.preventDefault();
            first.focus();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/40 p-4 backdrop-blur-sm sm:items-center"
            onClick={onClose}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                onKeyDown={onKeyDown}
                className={`w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-lg outline-none dark:border-gray-800 dark:bg-gray-900 sm:p-7 ${
                    wide ? "max-w-lg" : "max-w-md"
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-5 flex items-center justify-between gap-3">
                    <h3 id={titleId} className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-300"
                        aria-label={t("closeAria")}
                    >
                        ✕
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

export function ModalActions({
                          onClose,
                          onConfirm,
                          confirmLabel,
                          disabled,
                          loading,
                      }: {
    onClose: () => void;
    onConfirm: () => void;
    confirmLabel: string;
    disabled?: boolean;
    loading?: boolean;
}) {
    const t = useTranslations("Portal");
    return (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800"
            >
                {t("modalCancel")}
            </button>
            <button
                type="button"
                onClick={onConfirm}
                disabled={disabled}
                className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 disabled:opacity-60"
            >
                {loading ? t("pleaseWait") : confirmLabel}
            </button>
        </div>
    );
}

export function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {label}
            </dt>
            <dd className="mt-0.5 text-sm font-medium text-gray-800 dark:text-white/90">{value || "—"}</dd>
        </div>
    );
}

/* Icons (inline SVG — no extra deps) */

export function SparkleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2l1.8 5.4L19 9.2l-5.2 1.8L12 16.4l-1.8-5.4L5 9.2l5.2-1.8L12 2zm6 10l.9 2.7L22 16l-3.1.9L18 20l-.9-3.1L14 16l3.1-.9L18 12zM6 14l.7 2.1L9 17l-2.3.7L6 20l-.7-2.3L3 17l2.3-.9L6 14z" />
        </svg>
    );
}

export function PlusIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
    );
}

export function CheckIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function CalendarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
        </svg>
    );
}

export function PinIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" />
            <circle cx="12" cy="10" r="2.5" />
        </svg>
    );
}

export function UserIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 19c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" strokeLinecap="round" />
        </svg>
    );
}