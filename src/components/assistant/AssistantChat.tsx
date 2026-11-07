"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { askAssistant, type AssistantTurn } from "@/app/api/widget.api";

type Props = {
  slug: string;
  businessName: string;
  primaryColor: string;
};

/**
 * "Ask <business>": a floating chat for questions about services, prices, areas and
 * booking, answered by the backend assistant from the business's own data.
 * The conversation lives in this component only (nothing is stored).
 */
export function AssistantChat({ slug, businessName, primaryColor }: Props) {
  const t = useTranslations("Assistant");
  const locale = useLocale();
  const language = locale.toLowerCase().startsWith("nl") ? "nl" : "en";
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<AssistantTurn[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [turns, busy, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = text.trim();
    if (!question || busy) return;
    const next = [...turns, { role: "user" as const, content: question }];
    setTurns(next);
    setText("");
    setBusy(true);
    setError(null);
    try {
      const { reply } = await askAssistant(slug, next, language);
      setTurns([...next, { role: "assistant", content: reply }]);
    } catch (err) {
      const status = (err as { status?: number } | null)?.status;
      setError(status === 429 ? t("limit") : t("error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[90] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <section
          role="dialog"
          aria-label={t("title", { business: businessName })}
          className="flex h-[min(32rem,calc(100vh-7rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        >
          <header className="flex items-center justify-between px-4 py-3 text-white" style={{ backgroundColor: primaryColor }}>
            <h2 className="text-sm font-semibold">{t("title", { business: businessName })}</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label={t("close")} className="rounded p-1 hover:bg-white/20">
              ✕
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm" aria-live="polite">
            <p className="rounded-xl bg-gray-100 px-3 py-2 text-gray-800">{t("greeting")}</p>
            {turns.map((m, i) => (
              <p
                key={i}
                className={`whitespace-pre-wrap rounded-xl px-3 py-2 ${m.role === "user" ? "ml-8 text-white" : "mr-8 bg-gray-100 text-gray-800"}`}
                style={m.role === "user" ? { backgroundColor: primaryColor } : undefined}
              >
                {m.content}
              </p>
            ))}
            {busy && <p className="mr-8 rounded-xl bg-gray-100 px-3 py-2 text-gray-500">{t("thinking")}</p>}
            {error && (
              <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-red-700">
                {error}
              </p>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={send} className="border-t border-gray-200 p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={text}
                maxLength={1000}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("placeholder")}
                aria-label={t("placeholder")}
                className="h-10 min-w-0 flex-1 rounded-lg border border-gray-300 px-3 text-sm text-gray-900"
              />
              <button type="submit" disabled={busy || !text.trim()} className="h-10 rounded-lg px-4 text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: primaryColor }}>
                {t("send")}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-gray-400">{t("disclaimer")}</p>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-14 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white shadow-lg"
        style={{ backgroundColor: primaryColor }}
      >
        <span aria-hidden>💬</span>
        <span className="hidden sm:inline">{t("open", { business: businessName })}</span>
        <span className="sr-only sm:hidden">{t("open", { business: businessName })}</span>
      </button>
    </div>
  );
}
