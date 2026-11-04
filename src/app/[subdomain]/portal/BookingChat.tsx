"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { listPortalMessages, postPortalMessage, type PortalChat } from "@/app/api/portal.api";

const POLL_MS = 8_000;
const MAX_LEN = 1000;

type Props = {
    slug: string;
    token: string;
    bookingId: string;
    formatTime: (iso: string) => string;
    onUnauthorized?: () => void;
};

/**
 * Chat with the cleaner assigned to a booking. The customer portal has no
 * websocket access (its token is deliberately not allowed to join realtime
 * rooms), so the thread is polled while it is on screen and the tab is visible.
 */
export function BookingChat({ slug, token, bookingId, formatTime, onUnauthorized }: Props) {
    const t = useTranslations("PortalHome.chat");
    const [chat, setChat] = useState<PortalChat | null>(null);
    const [loadFailed, setLoadFailed] = useState(false);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const listRef = useRef<HTMLDivElement>(null);
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const handleError = useCallback(
        (e: unknown) => {
            if ((e as { status?: number } | null)?.status === 401) onUnauthorized?.();
        },
        [onUnauthorized]
    );

    useEffect(() => {
        let stopped = false;
        const refresh = async () => {
            try {
                const data = await listPortalMessages(slug, token, bookingId);
                if (stopped) return;
                setChat(data);
                setLoadFailed(false);
            } catch (e) {
                handleError(e);
                if (!stopped) setLoadFailed(true);
            }
        };
        (async () => {
            await refresh();
        })();
        const id = window.setInterval(() => {
            if (!document.hidden) void refresh();
        }, POLL_MS);
        return () => {
            stopped = true;
            window.clearInterval(id);
        };
    }, [slug, token, bookingId, handleError]);

    const count = chat?.messages.length ?? 0;
    useEffect(() => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [count]);

    const send = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const body = text.trim();
        if (!body || sending) return;
        setSending(true);
        setError("");
        try {
            const msg = await postPortalMessage(slug, token, bookingId, body);
            setText("");
            setChat((cur) => (cur ? { ...cur, messages: [...cur.messages, msg] } : cur));
        } catch (err) {
            handleError(err);
            setError(err instanceof Error && err.message ? err.message : t("sendFailed"));
        } finally {
            if (mounted.current) setSending(false);
        }
    };

    if (!chat) {
        return (
            <div className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">{t("heading")}</p>
                <p className="text-sm text-gray-400">{loadFailed ? t("loadFailed") : t("loading")}</p>
            </div>
        );
    }

    // Before a cleaner is assigned there is nobody to talk to: say so, show no empty box.
    if (!chat.open && chat.messages.length === 0) {
        // Nothing to say about a cancelled or long-finished booking: stay out of the way.
        if (chat.closedReason !== "NO_CLEANER") return null;
        return (
            <div className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">{t("heading")}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t(`closed.${chat.closedReason ?? "CLOSED"}` as "closed.CLOSED")}
                </p>
            </div>
        );
    }

    return (
        <div className="mt-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                {chat.with ? t("with", { name: chat.with }) : t("heading")}
            </p>

            <div
                ref={listRef}
                role="log"
                aria-live="polite"
                aria-label={t("heading")}
                className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-white/[0.03]"
            >
                {chat.messages.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-400">{t("empty")}</p>
                ) : (
                    chat.messages.map((m) => (
                        <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                                    m.mine
                                        ? "rounded-br-md bg-brand-500 text-white"
                                        : "rounded-bl-md bg-white text-gray-800 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700"
                                }`}
                            >
                                {!m.mine && m.name && (
                                    <p className="mb-0.5 text-[11px] font-semibold opacity-70">{m.name}</p>
                                )}
                                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                                <p className={`mt-1 text-[10px] ${m.mine ? "text-white/70" : "text-gray-400"}`}>
                                    {formatTime(m.createdAt)}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {chat.open ? (
                <form onSubmit={send} className="mt-2 flex items-end gap-2">
                    <label htmlFor={`chat-${bookingId}`} className="sr-only">
                        {t("placeholder")}
                    </label>
                    <textarea
                        id={`chat-${bookingId}`}
                        rows={1}
                        value={text}
                        maxLength={MAX_LEN}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                void send();
                            }
                        }}
                        placeholder={t("placeholder")}
                        className="min-h-[42px] flex-1 resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                    <button
                        type="submit"
                        disabled={sending || !text.trim()}
                        className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                    >
                        {t("send")}
                    </button>
                </form>
            ) : (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {t(`closed.${chat.closedReason ?? "CLOSED"}` as "closed.CLOSED")}
                </p>
            )}
            {error && (
                <p role="alert" className="mt-1.5 text-xs text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}
