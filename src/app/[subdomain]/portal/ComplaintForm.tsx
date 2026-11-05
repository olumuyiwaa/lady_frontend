"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { COMPLAINT_CATEGORIES, createPortalComplaint, type ComplaintCategory } from "@/app/api/portal.api";

type Props = {
    slug: string;
    token: string;
    bookingId: string;
    onUnauthorized?: () => void;
};

/** "Report a problem" for a visit that has taken place. Creates a complaint ticket for the business. */
export function ComplaintForm({ slug, token, bookingId, onUnauthorized }: Props) {
    const t = useTranslations("PortalHome.complaint");
    const [open, setOpen] = useState(false);
    const [category, setCategory] = useState<ComplaintCategory>("QUALITY");
    const [text, setText] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [reference, setReference] = useState<string | null>(null);

    const submit = async () => {
        if (busy) return;
        setBusy(true);
        setError("");
        try {
            const r = await createPortalComplaint(slug, token, bookingId, { category, description: text.trim() });
            setReference(r.reference);
            setText("");
        } catch (e) {
            if ((e as { status?: number } | null)?.status === 401) onUnauthorized?.();
            setError(e instanceof Error ? e.message : t("failed"));
        } finally {
            setBusy(false);
        }
    };

    if (reference) {
        return (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                <p className="font-medium">{t("sent")}</p>
                <p className="mt-1 text-xs">{t("reference", { reference })}</p>
            </div>
        );
    }

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="mt-5 text-sm font-medium text-gray-500 underline decoration-dotted underline-offset-4 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
            >
                {t("open")}
            </button>
        );
    }

    return (
        <div className="mt-5 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-800 dark:text-white">{t("heading")}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("intro")}</p>
            <label className="mt-3 block text-xs font-medium text-gray-600 dark:text-gray-300" htmlFor={`cat-${bookingId}`}>
                {t("category")}
            </label>
            <select
                id={`cat-${bookingId}`}
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
                {COMPLAINT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                        {t(`categories.${c}`)}
                    </option>
                ))}
            </select>
            <label className="mt-3 block text-xs font-medium text-gray-600 dark:text-gray-300" htmlFor={`desc-${bookingId}`}>
                {t("description")}
            </label>
            <textarea
                id={`desc-${bookingId}`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                maxLength={2000}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            <div className="mt-3 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                >
                    {t("cancel")}
                </button>
                <button
                    type="button"
                    onClick={submit}
                    disabled={busy || text.trim().length < 10}
                    className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                    {busy ? t("sending") : t("submit")}
                </button>
            </div>
        </div>
    );
}
