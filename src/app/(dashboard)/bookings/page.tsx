"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import RowActionsMenu from "@/components/tables/RowActionsMenu";
import {
  listBookings,
  createBooking,
  confirmBooking,
  completeBooking,
  assignBookingCleaner,
  cancelBooking,
  rescheduleBooking,
  updateBookingPayment,
} from "@/app/api/bookings.api";
import { createPaymentLink } from "@/app/api/bookings.api.paymentLink";
import { issueInvoice, openInvoice, issueAndDownloadUbl } from "@/app/api/invoices.api";
import { listCustomersForBooking, createCustomer } from "@/app/api/customers.api";
import { listServices } from "@/app/api/services.api";
import { Booking, BookingStatus, Customer, Service, formatMoney } from "@/app/api/cleansera-types";
import MarkPaymentReceivedModal from "@/components/booking/MarkPaymentReceivedModal";
import { BookingDetailsModal } from "@/components/booking/BookingDetailsModal";

const STATUS_COLOR: Record<BookingStatus, "success" | "warning" | "error" | "light" | "info"> = {
  REQUESTED: "warning",
  CONFIRMED: "info",
  ASSIGNED: "info",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "light",
};

const STATUS_FILTERS: (BookingStatus | "ALL")[] = [
  "ALL", "REQUESTED", "CONFIRMED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED",
];

const STATUS_I18N: Record<BookingStatus, "requested" | "confirmed" | "assigned" | "inProgress" | "completed" | "cancelled"> = {
  REQUESTED: "requested",
  CONFIRMED: "confirmed",
  ASSIGNED: "assigned",
  IN_PROGRESS: "inProgress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export default function BookingsPage() {
  const t = useTranslations("Dashboard.bookings");
  const tc = useTranslations("Dashboard.common");
  const ts = useTranslations("Dashboard.bookings.status");
  const ta = useTranslations("Dashboard.bookings.actions");
  const locale = useLocale();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [paymentLinkBusyId, setPaymentLinkBusyId] = useState<string | null>(null);
  const [invoiceBusyId, setInvoiceBusyId] = useState<string | null>(null);
  const [ublBusyId, setUblBusyId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailsBooking, setDetailsBooking] = useState<Booking | null>(null);
  const [newCustomerMode, setNewCustomerMode] = useState(false);
  const [actionBooking, setActionBooking] = useState<Booking | null>(null);
  const [actionType, setActionType] = useState<"cancel" | "reschedule" | "payment" | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleStart, setRescheduleStart] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"UNPAID" | "PAID" | "PARTIAL" | "REFUNDED">("PAID");
  const [paymentNote, setPaymentNote] = useState("");

  const [form, setForm] = useState({
    customerId: "",
    newCustomer: { firstName: "", lastName: "", phone: "", email: "" },
    serviceId: "",
    addressLine1: "",
    city: "",
    state: "",
    scheduledStart: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [b, c, s] = await Promise.all([
        listBookings(statusFilter === "ALL" ? undefined : statusFilter),
        listCustomersForBooking(),
        listServices(),
      ]);
      setBookings(b);
      setCustomers(c);
      setServices(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, tc]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      let customerId = form.customerId;
      if (newCustomerMode) {
        const created = await createCustomer(form.newCustomer);
        customerId = created.id;
      }
      await createBooking({
        customerId,
        serviceId: form.serviceId,
        addressLine1: form.addressLine1,
        city: form.city,
        state: form.state,
        scheduledStart: new Date(form.scheduledStart).toISOString(),
      });
      setShowCreateModal(false);
      setForm({
        customerId: "", newCustomer: { firstName: "", lastName: "", phone: "", email: "" },
        serviceId: "", addressLine1: "", city: "", state: "", scheduledStart: "",
      });
      setNewCustomerMode(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("errorGeneric"));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async (id: string) => {
    setError("");
    try {
      await confirmBooking(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("errorGeneric"));
    }
  };

  const handleComplete = async (id: string) => {
    setError("");
    try {
      await completeBooking(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("errorGeneric"));
    }
  };

  const handleAutoAssign = async (id: string) => {
    setError("");
    try {
      await assignBookingCleaner(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("errorGeneric"));
    }
  };

  const handleGetPaymentLink = async (id: string) => {
    setError("");
    setPaymentLinkBusyId(id);
    try {
      const result = await createPaymentLink(id);
      const url = result?.data?.url;
      if (!url) throw new Error(ta("paymentLinkMissing"));
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          // clipboard may fail; window.open still works
        }
      }
      window.open(url, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("errorGeneric"));
    } finally {
      setPaymentLinkBusyId(null);
    }
  };

  const handleInvoice = async (id: string) => {
    setError("");
    setInvoiceBusyId(id);
    try {
      const invoice = await issueInvoice(id);
      await openInvoice(invoice.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("errorGeneric"));
    } finally {
      setInvoiceBusyId(null);
    }
  };

  const handleDownloadUbl = async (id: string) => {
    setError("");
    setUblBusyId(id);
    try {
      await issueAndDownloadUbl(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("errorGeneric"));
    } finally {
      setUblBusyId(null);
    }
  };

  const openAction = (b: Booking, type: "cancel" | "reschedule" | "payment") => {
    setActionBooking(b);
    setActionType(type);
    setCancelReason("");
    setPaymentNote("");
    setPaymentStatus((b.paymentStatus as any) || "PAID");
    if (type === "reschedule") {
      const d = new Date(b.scheduledStart);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setRescheduleStart(local);
    }
  };

  const closeAction = () => {
    setActionBooking(null);
    setActionType(null);
  };

  const submitAction = async () => {
    if (!actionBooking || !actionType) return;
    setSaving(true);
    setError("");
    try {
      if (actionType === "cancel") {
        await cancelBooking(actionBooking.id, cancelReason || undefined);
      } else if (actionType === "reschedule") {
        await rescheduleBooking(actionBooking.id, new Date(rescheduleStart).toISOString());
      } else if (actionType === "payment") {
        await updateBookingPayment(actionBooking.id, paymentStatus, paymentNote || undefined);
      }
      closeAction();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("errorGeneric"));
    } finally {
      setSaving(false);
    }
  };

  const [payBooking, setPayBooking] = useState<Booking | null>(null);

  const filterLabel = (s: BookingStatus | "ALL") => {
    if (s === "ALL") return t("filters.all");
    return ts(STATUS_I18N[s]);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>{t("new")}</Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              statusFilter === s
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300"
            }`}
          >
            {filterLabel(s)}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("columns.customer")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("columns.service")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("columns.when")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("columns.total")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("columns.status")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{tc("actions")}</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading && (
                <TableRow><TableCell className="px-5 py-6 text-center text-gray-500" colSpan={6}>{tc("loading")}</TableCell></TableRow>
              )}
              {!loading && bookings.length === 0 && (
                <TableRow><TableCell className="px-5 py-6 text-center text-gray-500" colSpan={6}>{t("empty")}</TableCell></TableRow>
              )}
              {!loading &&
                bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {b.customer ? `${b.customer.firstName} ${b.customer.lastName}` : "—"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{b.service?.name || "—"}</TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(b.scheduledStart))}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatMoney(b.quotedPriceCents)}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Badge color={STATUS_COLOR[b.status]} size="sm">{ts(STATUS_I18N[b.status])}</Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <RowActionsMenu
                        label={`${tc("actions")} ${b.id}`}
                        actions={[
                          { label: ta("viewDetails"), onClick: () => setDetailsBooking(b) },
                          ...(b.status === "REQUESTED"
                            ? [{ label: ta("confirm"), onClick: () => handleConfirm(b.id) }]
                            : []),
                          ...(b.status === "CONFIRMED"
                            ? [{ label: ta("assign"), onClick: () => handleAutoAssign(b.id) }]
                            : []),
                          ...(b.status === "ASSIGNED" || b.status === "IN_PROGRESS"
                            ? [{ label: ta("complete"), onClick: () => handleComplete(b.id) }]
                            : []),
                          ...(!["COMPLETED", "CANCELLED"].includes(b.status)
                            ? [
                                { label: ta("reschedule"), onClick: () => openAction(b, "reschedule") },
                                {
                                  label: ta("cancel"),
                                  variant: "danger" as const,
                                  onClick: () => openAction(b, "cancel"),
                                },
                              ]
                            : []),
                          {
                            label: `${t("columns.payment")}: ${b.paymentStatus ? t(`paymentStatus.${b.paymentStatus.toLowerCase()}`) : t("paymentStatus.unpaid")}`,
                            onClick: () => openAction(b, "payment"),
                          },
                          ...(b.paymentStatus !== "PAID" && b.status !== "CANCELLED"
                            ? [
                                { label: ta("markPaid"), onClick: () => setPayBooking(b) },
                              ]
                            : []),
                          ...(b.status !== "CANCELLED"
                            ? [
                                {
                                  label: invoiceBusyId === b.id ? ta("preparingInvoice") : ta("invoice"),
                                  disabled: invoiceBusyId === b.id,
                                  onClick: () => handleInvoice(b.id),
                                },
                                {
                                  label: ublBusyId === b.id ? ta("preparingUbl") : ta("downloadUbl"),
                                  disabled: ublBusyId === b.id,
                                  onClick: () => handleDownloadUbl(b.id),
                                },
                              ]
                            : []),
                          ...(b.paymentStatus !== "PAID" && b.status !== "CANCELLED"
                            ? [
                                {
                                  label:
                                    paymentLinkBusyId === b.id ? ta("creatingLink") : ta("paymentLink"),
                                  disabled: paymentLinkBusyId === b.id,
                                  onClick: () => handleGetPaymentLink(b.id),
                                },
                              ]
                            : []),
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} className="max-w-lg p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{t("new")}</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>{t("columns.customer")}</Label>
              <button
                type="button"
                onClick={() => setNewCustomerMode(!newCustomerMode)}
                className="text-xs font-medium text-brand-500 hover:text-brand-600"
              >
                {newCustomerMode ? t("chooseExistingCustomer") : t("newCustomer")}
              </button>
            </div>

            {!newCustomerMode ? (
              <select
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                required
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">{t("selectCustomer")}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.phone}</option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder={t("firstName")} value={form.newCustomer.firstName}
                  onChange={(e) => setForm({ ...form, newCustomer: { ...form.newCustomer, firstName: e.target.value } })} required />
                <Input placeholder={t("lastName")} value={form.newCustomer.lastName}
                  onChange={(e) => setForm({ ...form, newCustomer: { ...form.newCustomer, lastName: e.target.value } })} required />
                <Input placeholder={t("phone")} value={form.newCustomer.phone}
                  onChange={(e) => setForm({ ...form, newCustomer: { ...form.newCustomer, phone: e.target.value } })} required />
                <Input placeholder={t("emailOptional")} value={form.newCustomer.email}
                  onChange={(e) => setForm({ ...form, newCustomer: { ...form.newCustomer, email: e.target.value } })} />
              </div>
            )}
          </div>

          <div>
            <Label>{t("columns.service")}</Label>
            <select
              value={form.serviceId}
              onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
              required
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">{t("selectService")}</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {formatMoney(s.basePriceCents)}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>{t("columns.address")}</Label>
            <Input placeholder={t("addressLine1")} value={form.addressLine1}
              onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder={t("city")} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            <Input placeholder={t("state")} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
          </div>

          <div>
            <Label>{t("scheduledStart")}</Label>
            <Input type="datetime-local" value={form.scheduledStart} onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })} required />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>{tc("cancel")}</Button>
            <Button type="submit" disabled={saving}>{saving ? tc("loading") : t("createBooking")}</Button>
          </div>
        </form>
      </Modal>

      <BookingDetailsModal booking={detailsBooking} onClose={() => setDetailsBooking(null)} />

      <MarkPaymentReceivedModal
          booking={payBooking}
          isOpen={!!payBooking}
          onClose={() => setPayBooking(null)}
          onSuccess={() => { setPayBooking(null); load(); }}
          onError={setError}
      />

      <Modal isOpen={!!actionType && !!actionBooking} onClose={closeAction} className="max-w-md p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          {actionType === "cancel" && t("modalCancelTitle")}
          {actionType === "reschedule" && t("modalRescheduleTitle")}
          {actionType === "payment" && t("modalPaymentTitle")}
        </h2>
        {actionType === "cancel" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{t("modalCancelHint")}</p>
            <div>
              <Label>{t("reasonOptional")}</Label>
              <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder={t("reasonPlaceholder")} />
            </div>
          </div>
        )}
        {actionType === "reschedule" && (
          <div className="space-y-4">
            <div>
              <Label>{t("newStartTime")}</Label>
              <Input type="datetime-local" value={rescheduleStart} onChange={(e) => setRescheduleStart(e.target.value)} required />
            </div>
          </div>
        )}
        {actionType === "payment" && (
          <div className="space-y-4">
            <div>
              <Label>{t("columns.payment")}</Label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="UNPAID">{t("paymentStatus.unpaid")}</option>
                <option value="PAID">{t("paymentStatus.paid")}</option>
                <option value="PARTIAL">{t("paymentStatus.partial")}</option>
                <option value="REFUNDED">{t("paymentStatus.refunded")}</option>
              </select>
            </div>
            <div>
              <Label>{t("noteOptional")}</Label>
              <Input value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder={t("notePlaceholder")} />
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={closeAction}>{tc("close")}</Button>
          <Button type="button" disabled={saving} onClick={submitAction}>
            {saving ? tc("loading") : tc("save")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
