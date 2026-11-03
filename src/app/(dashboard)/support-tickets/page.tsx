"use client";

import React, { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  listTickets,
  getTicket,
  createTicket,
  updateTicket,
  addTicketMessage,
  deleteTicket,
} from "@/app/api/supportTickets.api";
import RowActionsMenu from "@/components/tables/RowActionsMenu";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

type Ticket = {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: string | null;
  customerId?: string | null;
  bookingId?: string | null;
  assignedTo?: string | null;
  /** Who replies are emailed to. Set for website contact-form tickets. */
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  /** 'WEBSITE' when it came from the public site's contact form. */
  source?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  messages?: TicketMessage[];
};

type TicketMessage = {
  id: string;
  body: string;
  isInternal: boolean;
  authorId?: string | null;
  /** Only set when the reply was really handed to the mail provider. */
  emailedAt?: string | null;
  createdAt: string;
};

const STATUS_OPTIONS: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"];
const PRIORITY_OPTIONS: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const CATEGORY_OPTIONS = [
  "ACCOUNT_ACCESS",
  "CREDENTIALS",
  "SHIFTS_SCHEDULING",
  "PAYMENTS_BILLING",
  "TECHNICAL",
  "WEBSITE",
  "OTHER",
];

const STATUS_CLS: Record<TicketStatus, string> = {
  OPEN: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  IN_PROGRESS: "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300",
  WAITING_ON_CUSTOMER: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
  RESOLVED: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300",
  CLOSED: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

const PRIORITY_CLS: Record<TicketPriority, string> = {
  URGENT: "text-red-600 font-semibold",
  HIGH: "text-orange-600 font-medium",
  MEDIUM: "text-amber-600",
  LOW: "text-gray-500",
};

function fmt(value: string | null | undefined, locale: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

const inputCls =
  "h-11 w-full rounded-lg border px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function SupportTicketsPage() {
  const t = useTranslations("Dashboard.supportTickets");
  const tc = useTranslations("Dashboard.common");
  const locale = useLocale();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    subject: "",
    description: "",
    priority: "MEDIUM" as TicketPriority,
    category: "OTHER",
    customerId: "",
    bookingId: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [creating, setCreating] = useState(false);
  // Email typed in for a ticket that has none (replies need somewhere to go).
  const [emailDraft, setEmailDraft] = useState("");

  const [selected, setSelected] = useState<Ticket | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replyInternal, setReplyInternal] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const load = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await listTickets({
        q: q || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        page,
        limit: pagination.limit,
      });
      if (!res.success) throw new Error(res.message);
      setTickets(res.data?.data || []);
      setPagination(res.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (e: any) {
      setError(e.message || t("loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openTicket = async (id: string) => {
    setSelectedLoading(true);
    try {
      const res = await getTicket(id);
      if (!res.success) throw new Error(res.message);
      setSelected(res.data);
      setEmailDraft("");
    } catch (e: any) {
      setError(e.message || t("loadTicketFailed"));
    } finally {
      setSelectedLoading(false);
    }
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await createTicket({
        subject: createForm.subject,
        description: createForm.description,
        priority: createForm.priority,
        category: createForm.category,
        customerId: createForm.customerId || undefined,
        bookingId: createForm.bookingId || undefined,
        contactName: createForm.contactName.trim() || undefined,
        contactEmail: createForm.contactEmail.trim() || undefined,
        contactPhone: createForm.contactPhone.trim() || undefined,
      });
      if (!res.success) throw new Error(res.message);
      setShowCreate(false);
      setCreateForm({ subject: "", description: "", priority: "MEDIUM", category: "OTHER", customerId: "", bookingId: "", contactName: "", contactEmail: "", contactPhone: "" });
      load(1);
    } catch (e: any) {
      setError(e.message || t("createFailed"));
    } finally {
      setCreating(false);
    }
  };

  const patchSelected = async (patch: Record<string, unknown>) => {
    if (!selected) return;
    try {
      const res = await updateTicket(selected.id, patch);
      if (!res.success) throw new Error(res.message);
      setSelected({ ...selected, ...res.data });
      load(pagination.page);
    } catch (e: any) {
      setError(e.message || t("updateFailed"));
    }
  };

  const sendReply = async () => {
    if (!selected || !replyBody.trim()) return;
    setSendingReply(true);
    try {
      const res = await addTicketMessage(selected.id, replyBody.trim(), replyInternal);
      if (!res.success) throw new Error(res.message);
      setReplyBody("");
      setReplyInternal(false);
      // A customer-facing reply to a ticket with an address should have gone out
      // by email. If the server says it did not, say so rather than let the
      // team assume the customer was told.
      if (!replyInternal && selected.contactEmail && !res.data?.emailedAt) {
        setError(t("replyNotEmailed"));
      }
      await openTicket(selected.id);
    } catch (e: any) {
      setError(e.message || t("replyFailed"));
    } finally {
      setSendingReply(false);
    }
  };

  const removeTicket = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    try {
      const res = await deleteTicket(id);
      if (!res.success) throw new Error(res.message);
      if (selected?.id === id) setSelected(null);
      load(pagination.page);
    } catch (e: any) {
      setError(e.message || t("deleteFailed"));
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((s) => !s)}
          className="h-11 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white"
        >
          {showCreate ? tc("cancel") : t("newTicket")}
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10">{error}</div>}

      {showCreate && (
        <form onSubmit={onCreate} className="grid gap-3 rounded-2xl border p-5 sm:grid-cols-2 dark:border-gray-800">
          <input
            required
            placeholder={t("subject")}
            value={createForm.subject}
            onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
            className={`${inputCls} sm:col-span-2`}
          />
          <textarea
            required
            placeholder={t("describeIssue")}
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            className={`${inputCls} h-28 py-2 sm:col-span-2`}
          />
          <select
            value={createForm.priority}
            onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as TicketPriority })}
            className={inputCls}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{t(`priorities.${p}`)}</option>
            ))}
          </select>
          <select
            value={createForm.category}
            onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
            className={inputCls}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{t(`categories.${c}`)}</option>
            ))}
          </select>
          <input
            placeholder={t("relatedCustomer")}
            value={createForm.customerId}
            onChange={(e) => setCreateForm({ ...createForm, customerId: e.target.value })}
            className={inputCls}
          />
          <input
            placeholder={t("relatedBooking")}
            value={createForm.bookingId}
            onChange={(e) => setCreateForm({ ...createForm, bookingId: e.target.value })}
            className={inputCls}
          />
          <input
            placeholder={t("contactName")}
            value={createForm.contactName}
            maxLength={100}
            onChange={(e) => setCreateForm({ ...createForm, contactName: e.target.value })}
            className={inputCls}
          />
          <input
            type="email"
            placeholder={t("contactEmail")}
            value={createForm.contactEmail}
            maxLength={254}
            onChange={(e) => setCreateForm({ ...createForm, contactEmail: e.target.value })}
            className={inputCls}
          />
          <input
            type="tel"
            placeholder={t("contactPhone")}
            value={createForm.contactPhone}
            maxLength={40}
            onChange={(e) => setCreateForm({ ...createForm, contactPhone: e.target.value })}
            className={inputCls}
          />
          <button
            type="submit"
            disabled={creating}
            className="h-11 rounded-lg bg-brand-500 text-sm font-medium text-white disabled:opacity-60 sm:col-span-2"
          >
            {creating ? tc("loading") : t("createTicket")}
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          placeholder={t("searchPlaceholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(1)}
          className={`${inputCls} max-w-xs`}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputCls} max-w-[180px]`}>
          <option value="">{t("allStatuses")}</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{t(`statuses.${s}`)}</option>
          ))}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className={`${inputCls} max-w-[160px]`}>
          <option value="">{t("allPriorities")}</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{t(`priorities.${p}`)}</option>
          ))}
        </select>
        <button type="button" onClick={() => load(1)} className="h-11 rounded-lg border px-4 text-sm dark:border-gray-700">
          {t("apply")}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">{tc("loading")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border dark:border-gray-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3">{t("subject")}</th>
                <th className="px-4 py-3">{t("status")}</th>
                <th className="px-4 py-3">{t("priority")}</th>
                <th className="px-4 py-3">{t("category")}</th>
                <th className="px-4 py-3">{t("updated")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="cursor-pointer border-t hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                  onClick={() => openTicket(ticket.id)}
                >
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">
                    {ticket.subject}
                    {ticket.source === "WEBSITE" && (
                      <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                        {t("fromWebsite")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLS[ticket.status]}`}>
                      {t(`statuses.${ticket.status}`)}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-xs ${PRIORITY_CLS[ticket.priority]}`}>{t(`priorities.${ticket.priority}`)}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {ticket.category ? t(`categories.${ticket.category}`) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{fmt(ticket.updatedAt, locale)}</td>
                  <td className="px-4 py-3 text-right">
                    <RowActionsMenu
                      label={t("actionsFor", { subject: ticket.subject })}
                      actions={[
                        {
                          label: tc("delete"),
                          variant: "danger" as const,
                          onClick: () => removeTicket(ticket.id),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {!tickets.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    {t("empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-gray-500 dark:border-gray-800">
              <span>{t("pageSummary", { page: pagination.page, totalPages: pagination.totalPages, total: pagination.total })}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => load(pagination.page - 1)}
                  className="rounded border px-3 py-1 disabled:opacity-40 dark:border-gray-700"
                >
                  {tc("back")}
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => load(pagination.page + 1)}
                  className="rounded border px-3 py-1 disabled:opacity-40 dark:border-gray-700"
                >
                  {tc("next")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedLoading ? (
              <p className="text-sm text-gray-500">{tc("loading")}</p>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{selected.subject}</h2>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">{selected.description}</p>
                    {(selected.contactName || selected.contactEmail || selected.contactPhone) && (
                      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
                        <span className="text-xs uppercase text-gray-400">{t("contactFrom")}</span>
                        {selected.contactName && <span className="font-medium">{selected.contactName}</span>}
                        {selected.contactEmail && (
                          <a href={`mailto:${selected.contactEmail}`} className="text-brand-600 hover:underline">
                            {selected.contactEmail}
                          </a>
                        )}
                        {selected.contactPhone && (
                          <a href={`tel:${selected.contactPhone.replace(/[^\d+]/g, "")}`} className="text-brand-600 hover:underline">
                            {selected.contactPhone}
                          </a>
                        )}
                      </p>
                    )}
                  </div>
                  <button type="button" onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                    ✕
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">{t("status")}</label>
                    <select
                      value={selected.status}
                      onChange={(e) => patchSelected({ status: e.target.value })}
                      className={inputCls}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{t("priority")}</label>
                    <select
                      value={selected.priority}
                      onChange={(e) => patchSelected({ priority: e.target.value })}
                      className={inputCls}
                    >
                      {PRIORITY_OPTIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{t("category")}</label>
                    <select
                      value={selected.category || "OTHER"}
                      onChange={(e) => patchSelected({ category: e.target.value })}
                      className={inputCls}
                    >
                      {CATEGORY_OPTIONS.map((category) => (
                        <option key={category} value={category}>{t(`categories.${category}`)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("messages")}</h3>
                  <div className="mt-2 max-h-64 space-y-3 overflow-y-auto">
                    {(selected.messages || []).map((m) => (
                      <div
                        key={m.id}
                        className={`rounded-lg p-3 text-sm ${
                          m.isInternal
                            ? "bg-amber-50 dark:bg-amber-500/10"
                            : "bg-gray-50 dark:bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>
                            {m.isInternal ? t("internalNote") : t("reply")}
                            {!m.isInternal && selected.contactEmail && (
                              <span
                                className={`ml-2 ${m.emailedAt ? "text-green-600" : "text-amber-600"}`}
                              >
                                {m.emailedAt ? `✓ ${t("emailedOn", { date: fmt(m.emailedAt, locale) })}` : t("notEmailed")}
                              </span>
                            )}
                          </span>
                          <span>{fmt(m.createdAt, locale)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-gray-700 dark:text-gray-200">{m.body}</p>
                      </div>
                    ))}
                    {!selected.messages?.length && (
                      <p className="text-sm text-gray-400">{t("noMessages")}</p>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder={t("replyPlaceholder")}
                      className={`${inputCls} h-20 py-2`}
                    />
                    {!replyInternal && (
                      <p className={`text-xs ${selected.contactEmail ? "text-gray-500" : "text-amber-600"}`}>
                        {selected.contactEmail
                          ? t("replyWillEmail", { email: selected.contactEmail })
                          : t("replyNoEmail")}
                      </p>
                    )}
                    {!selected.contactEmail && (
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={emailDraft}
                          maxLength={254}
                          onChange={(e) => setEmailDraft(e.target.value)}
                          placeholder={t("addEmailPrompt")}
                          aria-label={t("addEmailPrompt")}
                          className={`${inputCls} h-9`}
                        />
                        <button
                          type="button"
                          disabled={!emailDraft.trim()}
                          onClick={async () => {
                            await patchSelected({ contactEmail: emailDraft.trim() });
                            setEmailDraft("");
                          }}
                          className="h-9 shrink-0 rounded-lg border px-3 text-sm disabled:opacity-50"
                        >
                          {t("saveEmail")}
                        </button>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs text-gray-500">
                        <input
                          type="checkbox"
                          checked={replyInternal}
                          onChange={(e) => setReplyInternal(e.target.checked)}
                        />
                        {t("internalNoteHint")}
                      </label>
                      <button
                        type="button"
                        disabled={sendingReply || !replyBody.trim()}
                        onClick={sendReply}
                        className="h-9 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white disabled:opacity-60"
                      >
                        {sendingReply ? t("sending") : t("send")}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
