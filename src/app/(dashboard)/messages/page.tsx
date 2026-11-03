"use client";

import { useLocale, useTranslations } from "next-intl";
import React, {
    FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useAuth } from "@/app/auth/useAuth";
import { useRouter } from "next/navigation";
import {
    listConversations,
    listMessages,
    searchMessagingRecipients,
    startConversation,
    sendMessage,
    markMessageRead,
    type ConversationListItem,
    type ChatMessage,
    type MessagingRecipient,
    type Pagination,
} from "@/app/api/messaging.api";

function formatTime(value: string | null | undefined, locale: string) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat(locale, {
        hour: "numeric",
        minute: "2-digit",
    }).format(d);
}

function formatDateTime(value: string | null | undefined, locale: string) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(d);
}

function conversationTitle(c: ConversationListItem, subjectTypeLabel: string) {
    if (c.subject?.name) return c.subject.name;
    return `${subjectTypeLabel} · ${c.subjectId.slice(0, 8)}`;
}

function conversationSubtitle(c: ConversationListItem, subjectTypeLabel: string) {
    if (c.subject?.email) return `${subjectTypeLabel} · ${c.subject.email}`;
    return subjectTypeLabel;
}

export default function MessagesPage() {
    const t = useTranslations("Dashboard.messages");
    const tc = useTranslations("Dashboard.common");
    const locale = useLocale();
    const subjectTypeLabel = (subjectType: string) =>
        subjectType === "CLEANER" ? t("subjectTypes.cleaner") : t("subjectTypes.customer");
    const { user } = useAuth();
    const router = useRouter();
    const currentUserId = useMemo(() => user?.id || "", [user]);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    const [conversations, setConversations] = useState<ConversationListItem[]>([]);
    const [convPagination, setConvPagination] = useState<Pagination | null>(null);
    const [convPage, setConvPage] = useState(1);

    const [selected, setSelected] = useState<ConversationListItem | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [msgPagination, setMsgPagination] = useState<Pagination | null>(null);

    const [messageText, setMessageText] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [loadingConvos, setLoadingConvos] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [starting, setStarting] = useState(false);

    // Start conversation search
    const [recipientSearch, setRecipientSearch] = useState("");
    const [recipients, setRecipients] = useState<MessagingRecipient[]>([]);
    const [selectedRecipient, setSelectedRecipient] =
        useState<MessagingRecipient | null>(null);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (user === null) router.replace("/");
    }, [user, router]);

    useEffect(() => {
        if (!error) return;
        const t = window.setTimeout(() => setError(""), 5000);
        return () => window.clearTimeout(t);
    }, [error]);

    useEffect(() => {
        if (!success) return;
        const t = window.setTimeout(() => setSuccess(""), 4000);
        return () => window.clearTimeout(t);
    }, [success]);

    const fetchConvos = useCallback(async () => {
        setLoadingConvos(true);
        setError("");
        try {
            const result = await listConversations(convPage, 20);
            setConversations(result.data);
            setConvPagination(result.pagination || null);
        } catch (err) {
            setError(err instanceof Error ? err.message : t("loadConversationsFailed"));
        } finally {
            setLoadingConvos(false);
        }
    }, [convPage, t]);

    useEffect(() => {
        fetchConvos();
    }, [fetchConvos]);

    const fetchMsgs = useCallback(async (conversationId: string, page = 1) => {
        setLoadingMessages(true);
        setError("");
        try {
            const result = await listMessages(conversationId, page, 50);
            setMessages(result.data);
            setMsgPagination(result.pagination || null);
            window.setTimeout(
                () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
                50
            );

            // Mark unread (not mine) as read
            for (const m of result.data) {
                if (m.senderUserId !== currentUserId && !m.readAt) {
                    markMessageRead(m.id).catch(() => {});
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t("loadMessagesFailed"));
        } finally {
            setLoadingMessages(false);
        }
    }, [currentUserId, t]);

    async function handleSelect(c: ConversationListItem) {
        setSelected(c);
        setMessages([]);
        setMessageText("");
        await fetchMsgs(c.id, 1);
    }

    // Debounced recipient search
    useEffect(() => {
        if (selectedRecipient) return;
        const q = recipientSearch.trim();
        if (q.length < 2) {
            setRecipients([]);
            return;
        }
        const t = window.setTimeout(async () => {
            setSearching(true);
            try {
                const rows = await searchMessagingRecipients(q);
                setRecipients(rows);
            } catch {
                setRecipients([]);
            } finally {
                setSearching(false);
            }
        }, 300);
        return () => window.clearTimeout(t);
    }, [recipientSearch, selectedRecipient]);

    async function handleStartConversation(e: FormEvent) {
        e.preventDefault();
        if (!selectedRecipient) {
            setError(t("selectRecipientFirst"));
            return;
        }
        setStarting(true);
        setError("");
        try {
            const conv = await startConversation({
                subjectType: selectedRecipient.subjectType,
                subjectId: selectedRecipient.subjectId,
            });
            setSuccess(t("conversationReady"));
            setSelectedRecipient(null);
            setRecipientSearch("");
            setRecipients([]);
            setConvPage(1);
            await fetchConvos();
            const item: ConversationListItem = {
                id: conv.id,
                businessId: conv.businessId,
                subjectType: conv.subjectType,
                subjectId: conv.subjectId,
                subject: conv.subject,
                createdAt: conv.createdAt,
                lastMessage: null,
                lastMessageAt: conv.createdAt,
            };
            setSelected(item);
            await fetchMsgs(conv.id, 1);
        } catch (err) {
            setError(err instanceof Error ? err.message : t("startConversationFailed"));
        } finally {
            setStarting(false);
        }
    }

    async function handleSend(e?: FormEvent) {
        e?.preventDefault();
        if (!selected || !messageText.trim()) return;
        setSending(true);
        setError("");
        try {
            const msg = await sendMessage(selected.id, messageText.trim());
            setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            setMessageText("");
            await fetchConvos();
            window.setTimeout(
                () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
                50
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : t("sendFailed"));
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="space-y-4 p-4 md:p-6">
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                </div>
            )}
            {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
                {/* Sidebar */}
                <div className="flex h-[calc(100vh-140px)] flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                        {t("title")}
                    </h2>
                    <p className="mb-3 text-xs text-gray-500">
                        {t("hint")}
                    </p>

                    <form
                        onSubmit={handleStartConversation}
                        className="mb-4 rounded-xl border border-gray-200 p-3 dark:border-gray-800"
                    >
                        <p className="mb-2 text-sm font-medium text-gray-800 dark:text-white/90">
                            {t("startConversation")}
                        </p>
                        <div className="relative">
                            <input
                                value={recipientSearch}
                                onChange={(e) => {
                                    setRecipientSearch(e.target.value);
                                    setSelectedRecipient(null);
                                }}
                                placeholder={t("searchPeople")}
                                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                            {recipientSearch.trim().length >= 2 && !selectedRecipient && (
                                <div className="absolute left-0 right-0 top-12 z-20 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
                                    {searching ? (
                                        <div className="px-3 py-2 text-sm text-gray-500">{t("searching")}</div>
                                    ) : recipients.length === 0 ? (
                                        <div className="px-3 py-2 text-sm text-gray-500">{t("noMatches")}</div>
                                    ) : (
                                        recipients.map((r) => (
                                            <button
                                                key={`${r.subjectType}:${r.subjectId}`}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedRecipient(r);
                                                    setRecipientSearch(r.name);
                                                    setRecipients([]);
                                                }}
                                                className="block w-full border-b border-gray-100 px-3 py-2 text-left hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
                                            >
                        <span className="block text-sm font-medium text-gray-800 dark:text-white/90">
                          {r.name}
                        </span>
                                                <span className="block text-xs text-gray-500">{r.subtitle}</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        {selectedRecipient && (
                            <p className="mt-2 text-xs text-brand-600 dark:text-brand-300">
                                {t("selectedRecipient", { name: selectedRecipient.name, type: subjectTypeLabel(selectedRecipient.subjectType) })}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={starting || !selectedRecipient}
                            className="mt-3 w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                        >
                            {starting ? t("starting") : t("start")}
                        </button>
                    </form>

                    <div className="flex-1 space-y-2 overflow-y-auto">
                        {loadingConvos ? (
                            <p className="text-sm text-gray-500">{tc("loading")}</p>
                        ) : conversations.length === 0 ? (
                            <p className="text-sm text-gray-500">{t("empty")}</p>
                        ) : (
                            conversations.map((c) => {
                                const active = selected?.id === c.id;
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => handleSelect(c)}
                                        className={`w-full rounded-xl border p-3 text-left transition ${
                                            active
                                                ? "border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10"
                                                : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
                                        }`}
                                    >
                                        <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                                            {conversationTitle(c, subjectTypeLabel(c.subjectType))}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-gray-500">
                                            {c.lastMessage?.body || conversationSubtitle(c, subjectTypeLabel(c.subjectType))}
                                        </p>
                                        <p className="mt-1 text-[10px] text-gray-400">
                                            {formatDateTime(c.lastMessageAt, locale)}
                                        </p>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {convPagination && convPagination.totalPages > 1 && (
                        <div className="mt-3 flex items-center justify-between gap-2">
                            <button
                                type="button"
                                disabled={!convPagination.hasPrev}
                                onClick={() => setConvPage((p) => Math.max(1, p - 1))}
                                className="rounded border px-2 py-1 text-xs disabled:opacity-40"
                            >
                                {tc("back")}
                            </button>
                            <span className="text-xs text-gray-500">
                {convPagination.page}/{convPagination.totalPages}
              </span>
                            <button
                                type="button"
                                disabled={!convPagination.hasNext}
                                onClick={() => setConvPage((p) => p + 1)}
                                className="rounded border px-2 py-1 text-xs disabled:opacity-40"
                            >
                                {tc("next")}
                            </button>
                        </div>
                    )}
                </div>

                {/* Thread */}
                <div className="flex h-[calc(100vh-140px)] flex-col rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                    {selected ? (
                        <>
                            <div className="border-b border-gray-200 bg-white px-5 py-3 dark:border-gray-800 dark:bg-gray-900">
                                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                                    {conversationTitle(selected, subjectTypeLabel(selected.subjectType))}
                                </h2>
                                <p className="text-xs text-gray-500">{conversationSubtitle(selected, subjectTypeLabel(selected.subjectType))}</p>
                            </div>

                            <div className="flex-1 space-y-3 overflow-y-auto p-5">
                                {loadingMessages && messages.length === 0 ? (
                                    <p className="text-sm text-gray-500">{tc("loading")}</p>
                                ) : messages.length === 0 ? (
                                    <p className="text-sm text-gray-500">{t("noMessagesHello")}</p>
                                ) : (
                                    messages.map((msg) => {
                                        const isMe = msg.senderUserId === currentUserId;
                                        const name = msg.sender
                                            ? `${msg.sender.firstName} ${msg.sender.lastName}`.trim()
                                            : t("userFallback");
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                            >
                                                <div
                                                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                                                        isMe
                                                            ? "rounded-tr-none bg-brand-600 text-white"
                                                            : "rounded-tl-none border border-gray-100 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                                    }`}
                                                >
                                                    {!isMe && (
                                                        <p className="mb-1 text-[11px] font-semibold opacity-80">{name}</p>
                                                    )}
                                                    <p className="whitespace-pre-wrap">{msg.body || msg.content}</p>
                                                    <p
                                                        className={`mt-1 text-[10px] ${
                                                            isMe ? "text-white/70" : "text-gray-400"
                                                        }`}
                                                    >
                                                        {formatTime(msg.createdAt, locale)}
                                                        {isMe && msg.readAt ? ` · ${t("read")}` : ""}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={bottomRef} />
                            </div>

                            <form
                                onSubmit={handleSend}
                                className="border-t border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
                            >
                                <div className="flex items-end gap-2 rounded-xl bg-gray-100 p-1.5 dark:bg-gray-800">
                  <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={t("placeholder")}
                      rows={1}
                      className="max-h-32 flex-1 resize-none border-none bg-transparent py-2.5 text-sm focus:ring-0 dark:text-white"
                      onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSend();
                          }
                      }}
                  />
                                    <button
                                        type="submit"
                                        aria-label={t("send")}
                                        disabled={sending || !messageText.trim()}
                                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white disabled:bg-gray-300 dark:disabled:bg-gray-700"
                                    >
                                        →
                                    </button>
                                </div>
                                <p className="mt-1 text-center text-[10px] text-gray-400">
                                    {t("keyboardHint")}
                                </p>
                            </form>
                        </>
                    ) : (
                        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {t("threadEmptyTitle")}
                            </h2>
                            <p className="mt-2 max-w-sm text-sm text-gray-500">
                                {t("threadEmptyHint")}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}