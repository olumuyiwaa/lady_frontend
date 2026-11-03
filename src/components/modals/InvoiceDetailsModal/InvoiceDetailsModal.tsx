"use client";

import React from "react";
import { Invoice } from "@/app/api/types";

interface InvoiceDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: Invoice | null;
}

function formatCurrency(value?: number | string | null) {
    const amount = Number(value || 0);
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(Number.isNaN(amount) ? 0 : amount);
}

function formatDate(value?: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
    }).format(date);
}

function formatDateTime(value?: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function formatLabel(value?: string | null) {
    if (!value) return "-";
    return value.replaceAll("_", " ");
}

function getStatusClass(status: string) {
    switch (status) {
        case "PAID":
        case "SETTLED":
            return "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300";
        case "ISSUED":
        case "PENDING":
            return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300";
        case "OVERDUE":
            return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300";
        case "VOID":
            return "bg-gray-100 text-gray-700 dark:bg-white/[0.06] dark:text-gray-300";
        case "DRAFT":
        default:
            return "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300";
    }
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-white/[0.03]">
            <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">{label}</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{value}</p>
        </div>
    );
}

export default function InvoiceDetailsModal({ isOpen, onClose, invoice }: InvoiceDetailsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto bg-gray-900/50 p-4">
            <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900 lg:p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Invoice Details</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Review invoice metadata, line items, and payment status.</p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                    >
                        ✕
                    </button>
                </div>

                {!invoice ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Select an invoice to view details.</p>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <p className="text-xl font-semibold text-gray-800 dark:text-white/90">{invoice.invoiceNumber}</p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{invoice.facility?.name || invoice.facilityId}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <DetailItem label="Status" value={formatLabel(invoice.status)} />
                            <DetailItem label="Total" value={formatCurrency(invoice.total)} />
                            <DetailItem label="Subtotal" value={formatCurrency(invoice.subtotal)} />
                            <DetailItem label="Tax" value={formatCurrency(invoice.tax)} />
                            <DetailItem label="Period Start" value={formatDate(invoice.periodStart)} />
                            <DetailItem label="Period End" value={formatDate(invoice.periodEnd)} />
                            <DetailItem label="Due At" value={formatDate(invoice.dueAt)} />
                            <DetailItem label="Paid At" value={formatDateTime(invoice.paidAt)} />
                        </div>

                        <div>
                            <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Line Items</h3>
                            <div className="space-y-3">
                                {invoice.lineItems?.length ? (
                                    invoice.lineItems.map((item, index) => (
                                        <div key={item.id || index} className="rounded-lg bg-gray-50 p-4 dark:bg-white/[0.03]">
                                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{item.description}</p>
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                {item.quantity} × {formatCurrency(item.unitRate)} = {formatCurrency(item.amount ?? Number(item.quantity || 0) * Number(item.unitRate || 0))}
                                            </p>
                                            {item.shiftId ? <p className="mt-1 text-xs text-gray-400">Shift: {item.shiftId}</p> : null}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No line items.</p>
                                )}
                            </div>
                        </div>

                        {invoice.notes ? <DetailItem label="Notes" value={invoice.notes} /> : null}
                    </div>
                )}
            </div>
        </div>
    );
}
