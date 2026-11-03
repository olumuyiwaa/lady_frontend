"use client";

/**
 * Optional Stripe Connect + offline payment preference for Business Settings.
 */

import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import {
  PreferredPaymentCollection,
  StripeConnectStatus,
  updateBusiness,
  startStripeConnectOnboarding,
  refreshStripeConnectStatus,
  getStripeConnectStatus,
} from "@/app/api/businesses.api";

type Props = {
  stripe: StripeConnectStatus | null;
  onStripeChange: (s: StripeConnectStatus) => void;
  onError: (msg: string) => void;
  onSaved: (msg: string) => void;
  /** Initial values from business record */
  initialPreferred?: PreferredPaymentCollection;
  initialOfflineInstructions?: string | null;
};

export default function StripeConnectOptionalCard({
  stripe,
  onStripeChange,
  onError,
  onSaved,
  initialPreferred = "BOTH",
  initialOfflineInstructions = "",
}: Props) {
  const [stripeLoading, setStripeLoading] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [preferred, setPreferred] = useState<PreferredPaymentCollection>(initialPreferred);
  const [offlineInstructions, setOfflineInstructions] = useState(
    initialOfflineInstructions || ""
  );

  const onlineReady =
    stripe?.onlineCardReady ?? stripe?.readyForPayments ?? false;

  const connectStripe = async () => {
    setStripeLoading(true);
    try {
      const { url } = await startStripeConnectOnboarding();
      window.location.href = url;
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not start Stripe onboarding");
    } finally {
      setStripeLoading(false);
    }
  };

  const refreshStatus = async () => {
    setStripeLoading(true);
    try {
      await refreshStripeConnectStatus();
      onStripeChange(await getStripeConnectStatus());
      onSaved("Stripe status refreshed");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not refresh Stripe status");
    } finally {
      setStripeLoading(false);
    }
  };

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
        onStripeChange(await getStripeConnectStatus());
      } catch {
        /* status endpoint may lag until backend patch is deployed */
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save payment preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  const statusLabel = onlineReady
    ? "Card payments enabled"
    : stripe?.connected
      ? "Connected — finish onboarding in Stripe"
      : "Not connected (optional)";

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
          Stripe Connect is <strong>optional</strong>. You can take bookings and pay cleaners
          without it — collect cash or bank transfer and mark payments received on each booking.
          Connect Stripe only if you want customers to pay by card online.
        </p>
      </div>

      {/* Stripe status */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 p-4 dark:border-gray-800">
        <div>
          <p className="text-xs uppercase text-gray-500">Stripe Connect</p>
          <p className={`mt-1 font-medium ${statusClass}`}>{statusLabel}</p>
          {stripe?.message && (
            <p className="mt-1 max-w-md text-xs text-gray-500 dark:text-gray-400">
              {stripe.message}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {onlineReady ? (
            <Button type="button" variant="outline" onClick={refreshStatus} disabled={stripeLoading}>
              {stripeLoading ? "…" : "Refresh status"}
            </Button>
          ) : (
            <>
              {stripe?.connected && (
                <Button type="button" variant="outline" onClick={refreshStatus} disabled={stripeLoading}>
                  {stripeLoading ? "…" : "Refresh"}
                </Button>
              )}
              <Button type="button" onClick={connectStripe} disabled={stripeLoading}>
                {stripeLoading ? "…" : stripe?.connected ? "Continue onboarding" : "Connect Stripe"}
              </Button>
            </>
          )}
        </div>
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
              Prefer card online{onlineReady ? "" : " (connect Stripe first)"}
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
