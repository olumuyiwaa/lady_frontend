"use client";

/**
 * How customers pay (card online and/or cash / bank transfer) and the offline
 * payment instructions, for Business Settings. Card payments run on Lady
 * Greener's own Stripe account, so there is nothing to connect here.
 */

import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import {
  PreferredPaymentCollection,
  PaymentStatus,
  updateBusiness,
  getPaymentStatus,
} from "@/app/api/businesses.api";

type Props = {
  payment: PaymentStatus | null;
  onPaymentChange: (s: PaymentStatus) => void;
  onError: (msg: string) => void;
  onSaved: (msg: string) => void;
  /** Initial values from business record */
  initialPreferred?: PreferredPaymentCollection;
  initialOfflineInstructions?: string | null;
};

export default function PaymentPreferencesCard({
  payment,
  onPaymentChange,
  onError,
  onSaved,
  initialPreferred = "BOTH",
  initialOfflineInstructions = "",
}: Props) {
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [preferred, setPreferred] = useState<PreferredPaymentCollection>(initialPreferred);
  const [offlineInstructions, setOfflineInstructions] = useState(
    initialOfflineInstructions || ""
  );

  const onlineReady =
    payment?.onlineCardReady ?? payment?.readyForPayments ?? false;

  const savePaymentPrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      await updateBusiness({
        preferredPaymentCollection: preferred,
        offlinePaymentInstructions: offlineInstructions.trim() || null,
      });
      onSaved("Payment preferences saved");
      try {
        onPaymentChange(await getPaymentStatus());
      } catch {
        /* the preferences were saved; the status line just stays as it was */
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save payment preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  const statusLabel = onlineReady ? "Card payments enabled" : "Card payments not enabled";

  const statusClass = onlineReady
    ? "text-success-600 dark:text-success-400"
    : "text-gray-600 dark:text-gray-300";

  return (
    <section
      id="stripe"
      className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.02]"
    >
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Customer payments
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Card payments are optional. You can take bookings and pay cleaners without them —
          collect cash or bank transfer and mark payments received on each booking.
        </p>
      </div>

      {/* Card payment status (read-only) */}
      <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-800">
        <p className="text-xs uppercase text-gray-500">Card payments</p>
        <p className={`mt-1 font-medium ${statusClass}`}>{statusLabel}</p>
        {payment?.message && (
          <p className="mt-1 max-w-md text-xs text-gray-500 dark:text-gray-400">
            {payment.message}
          </p>
        )}
      </div>

      {/* Payment preference */}
      <form onSubmit={savePaymentPrefs} className="space-y-4 max-w-xl">
        <div>
          <Label>How do you collect customer payments?</Label>
          <select
            value={preferred}
            onChange={(e) => setPreferred(e.target.value as PreferredPaymentCollection)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="BOTH">Card (when available) + offline</option>
            {/*
              Selecting "card only" before Stripe is actually chargeable
              leaves customers with no way to pay at all — the backend
              rejects this too (belt and braces), but catching it here means
              the option simply isn't offered rather than saving and then
              showing an error.
            */}
            <option value="ONLINE_CARD" disabled={!onlineReady}>
              Prefer card online{onlineReady ? "" : " (not enabled yet)"}
            </option>
            <option value="MANUAL_OFFLINE">Offline only (cash / bank transfer)</option>
          </select>
        </div>
        <div>
          <Label>Offline payment instructions</Label>
          <textarea
            rows={4}
            value={offlineInstructions}
            onChange={(e) => setOfflineInstructions(e.target.value)}
            placeholder="Bank transfer to Your Business, sort code XX-XX-XX, account XXXXXXXX. Use booking reference as payment reference. Cash accepted on the day."
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500">
            Shown to customers when card checkout is not available.
          </p>
        </div>
        <Button type="submit" disabled={savingPrefs}>
          {savingPrefs ? "Saving…" : "Save payment preferences"}
        </Button>
      </form>
    </section>
  );
}
