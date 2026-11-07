"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { setPortalPreferences, type PortalPreferences } from "@/app/api/portal.api";

type Props = {
    slug: string | null;
    token: string;
    initial: PortalPreferences;
    onUnauthorized: () => void;
};

/** Language of our messages and WhatsApp consent, saved as soon as they change. */
export function PortalPreferencesCard({ slug, token, initial, onUnauthorized }: Props) {
    const t = useTranslations("PortalHome.preferences");
    const [prefs, setPrefs] = useState(initial);
    const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");

    const save = async (next: Partial<PortalPreferences>) => {
        const previous = prefs;
        setPrefs({ ...prefs, ...next });
        setStatus("saving");
        try {
            setPrefs(await setPortalPreferences(slug, token, next));
            setStatus("saved");
        } catch (e) {
            setPrefs(previous);
            if ((e as { status?: number } | null)?.status === 401) onUnauthorized();
            else setStatus("failed");
        }
    };

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]" aria-label={t("title")}>
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{t("title")}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
                <label className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-300">{t("language")}</span>
                    <select
                        value={prefs.language}
                        onChange={(e) => save({ language: e.target.value as PortalPreferences["language"] })}
                        className="h-9 rounded-lg border border-gray-300 px-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    >
                        <option value="nl">{t("dutch")}</option>
                        <option value="en">{t("english")}</option>
                    </select>
                </label>
                <label className="flex items-start gap-2">
                    <input
                        type="checkbox"
                        checked={prefs.whatsappOptIn}
                        onChange={(e) => save({ whatsappOptIn: e.target.checked })}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-gray-600 dark:text-gray-300">
                        {t("whatsapp")}
                        <span className="block text-xs text-gray-400">{t("whatsappHelp")}</span>
                    </span>
                </label>
                <span role="status" aria-live="polite" className={`text-xs ${status === "failed" ? "text-red-600" : "text-emerald-600"}`}>
                    {status === "saved" ? t("saved") : status === "failed" ? t("failed") : ""}
                </span>
            </div>
        </section>
    );
}
