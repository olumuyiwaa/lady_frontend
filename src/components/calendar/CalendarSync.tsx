"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import {
  createCalendarFeed,
  listCalendarFeeds,
  revokeCalendarFeed,
  type CalendarFeed,
  type CreatedCalendarFeed,
} from "@/app/api/calendar";

/**
 * "Sync to your calendar": creates a private subscription link that Google,
 * Apple or Outlook calendar can follow, and lists/revokes existing links. The
 * link is the credential, so it is shown exactly once, right after creation.
 */
export function CalendarSync() {
  const t = useTranslations("Dashboard.calendar.sync");
  const locale = useLocale();
  const { isOpen, openModal, closeModal } = useModal();
  const [feeds, setFeeds] = useState<CalendarFeed[]>([]);
  const [created, setCreated] = useState<CreatedCalendarFeed | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString(locale === "nl" ? "nl-NL" : "en-GB", { dateStyle: "medium", timeStyle: "short" }) : null;

  const load = async () => {
    try {
      setFeeds(await listCalendarFeeds());
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loadFailed"));
    }
  };

  const open = () => {
    setError("");
    setCreated(null);
    setCopied(false);
    openModal();
    void load();
  };

  const create = async () => {
    setBusy(true);
    setError("");
    try {
      const feed = await createCalendarFeed();
      setCreated(feed);
      setCopied(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("createFailed"));
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    setBusy(true);
    setError("");
    try {
      await revokeCalendarFeed(id);
      if (created?.id === id) setCreated(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("revokeFailed"));
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setError(t("copyFailed"));
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
      >
        {t("button")}
      </button>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[560px] p-6 lg:p-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{t("title")}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("intro")}</p>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {created && (
          <div className="mt-5 rounded-xl border border-brand-200 bg-brand-25 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{t("createdNote")}</p>
            <input
              readOnly
              value={created.url}
              onFocus={(e) => e.currentTarget.select()}
              aria-label={t("linkLabel")}
              className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copy(created.url)}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                {copied ? t("copied") : t("copy")}
              </button>
              <a
                href={created.webcalUrl}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
              >
                {t("openInApp")}
              </a>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t("privacyNote")}</p>
          </div>
        )}

        <div className="mt-5">
          <button
            type="button"
            onClick={create}
            disabled={busy}
            className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {t("create")}
          </button>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">{t("existing")}</p>
          {feeds.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("none")}</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {feeds.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0 text-gray-700 dark:text-gray-300">
                    <span className="block truncate">{f.label || t("unnamed", { date: fmt(f.createdAt) ?? "" })}</span>
                    <span className="block text-xs text-gray-400">
                      {f.lastAccessedAt ? t("lastUsed", { date: fmt(f.lastAccessedAt) ?? "" }) : t("neverUsed")}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => revoke(f.id)}
                    disabled={busy}
                    className="shrink-0 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
                  >
                    {t("revoke")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </>
  );
}
