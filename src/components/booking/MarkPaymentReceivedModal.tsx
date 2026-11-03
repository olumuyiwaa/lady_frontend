"use client";

/**
 * Use on booking detail / bookings list when paymentStatus !== "PAID".
 */

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { Modal } from "@/components/ui/modal";
import {
  markPaymentReceived,
  ManualPaymentMethod,
} from "@/app/api/bookings.api";
import { Booking, formatMoney } from "@/app/api/cleansera-types";

type Props = {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
  onError: (msg: string) => void;
};

export default function MarkPaymentReceivedModal({
  booking,
  isOpen,
  onClose,
  onSuccess,
  onError,
}: Props) {
  const t = useTranslations("Dashboard.markPaymentReceived");
  const [method, setMethod] = useState<ManualPaymentMethod>("BANK_TRANSFER");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  if (!booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await markPaymentReceived(booking.id, {
        method,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
      });
      onSuccess(updated);
      onClose();
      setReference("");
      setNote("");
      setMethod("BANK_TRANSFER");
    } catch (err) {
      onError(err instanceof Error ? err.message : t("failedToMark"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
        {t("heading")}
      </h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {t("description")}{" "}
        <strong>{formatMoney(booking.quotedPriceCents)}</strong>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>{t("method")}</Label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as ManualPaymentMethod)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="BANK_TRANSFER">{t("methodBankTransfer")}</option>
            <option value="CASH">{t("methodCash")}</option>
            <option value="INVOICE">{t("methodInvoice")}</option>
            <option value="OTHER">{t("methodOther")}</option>
          </select>
        </div>
        <div>
          <Label>{t("reference")}</Label>
          <Input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={t("referencePlaceholder")}
          />
        </div>
        <div>
          <Label>{t("note")}</Label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder={t("notePlaceholder")}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? t("saving") : t("markAsPaid")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
