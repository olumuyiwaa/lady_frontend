"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
import Select from "@/components/form/Select";
import RowActionsMenu from "@/components/tables/RowActionsMenu";
import { listCleaners } from "@/app/api/cleaners.api";
import {
  listCompensations,
  setCompensation,
  listEarnings,
  listPayouts,
  createPayout,
  markPayoutPaid,
  payPayoutViaStripe,
  getPayrollSummary,
  PayrollSummary,
} from "@/app/api/payroll.api";
import {
  Cleaner,
  CleanerCompensation,
  CleanerEarning,
  Payout,
  CompensationType,
  cleanerDisplayName,
  compensationLabel,
  formatMoney,
} from "@/app/api/cleansera-types";

const PAYOUT_STATUS_COLOR: Record<Payout["status"], "warning" | "success" | "light"> = {
  PENDING: "warning",
  PAID: "success",
  CANCELED: "light",
};

export default function PayrollPage() {
  const t = useTranslations("Dashboard.payroll");
  const tc = useTranslations("Dashboard.common");
  const locale = useLocale();
  const [tab, setTab] = useState<"rates" | "earnings" | "payouts">("rates");

  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [compensations, setCompensations] = useState<CleanerCompensation[]>([]);
  const [earnings, setEarnings] = useState<CleanerEarning[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [rateModal, setRateModal] = useState<Cleaner | null>(null);
  const [rateForm, setRateForm] = useState<{ type: CompensationType; value: string }>({ type: "PERCENT", value: "" });

  const [payoutCleaner, setPayoutCleaner] = useState<Cleaner | null>(null);

  const compByCleanerId = useMemo(() => {
    const map = new Map<string, CleanerCompensation>();
    compensations.forEach((c) => map.set(c.cleanerId, c));
    return map;
  }, [compensations]);

  const pendingByCleanerId = useMemo(() => {
    const map = new Map<string, number>();
    earnings
      .filter((e) => e.status === "PENDING")
      .forEach((e) => map.set(e.cleanerId, (map.get(e.cleanerId) || 0) + e.amountCents));
    return map;
  }, [earnings]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [c, comp, e, p, s] = await Promise.all([
        listCleaners("ACTIVE"),
        listCompensations(),
        listEarnings(),
        listPayouts(),
        getPayrollSummary(),
      ]);
      setCleaners(c);
      setCompensations(comp);
      setEarnings(e);
      setPayouts(p);
      setSummary(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const openRateModal = (cleaner: Cleaner) => {
    const existing = compByCleanerId.get(cleaner.id);
    setRateForm({
      type: existing?.type || "PERCENT",
      value: existing ? String(existing.value) : "",
    });
    setRateModal(cleaner);
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateModal) return;
    setSaving(true);
    setError("");
    try {
      await setCompensation(rateModal.id, rateForm.type, parseInt(rateForm.value, 10));
      setRateModal(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveRateFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePayout = async () => {
    if (!payoutCleaner) return;
    setSaving(true);
    setError("");
    try {
      await createPayout(payoutCleaner.id);
      setPayoutCleaner(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("createPayoutFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (payout: Payout) => {
    setError("");
    try {
      await markPayoutPaid(payout.id, { method: "MANUAL_TRANSFER" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("markPaidFailed"));
    }
  };

  const [payingStripeId, setPayingStripeId] = useState<string | null>(null);

  const handlePayStripe = async (payout: Payout) => {
    setError("");
    setPayingStripeId(payout.id);
    try {
      await payPayoutViaStripe(payout.id);
      await load();
    } catch (err) {
      // Most common cause here is the business's own Connect balance not
      // having settled enough job payments yet — surfaced by the backend
      // as a 402 with a clear message, not a generic failure.
      setError(err instanceof Error ? err.message : t("stripePayoutFailed"));
    } finally {
      setPayingStripeId(null);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("subtitle")}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {summary && (
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("pendingPayroll")}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {formatMoney(summary.pendingEarningsCents)}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {t("cleanersOwed", { count: summary.cleanersWithPendingEarnings })}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("payoutsAwaiting")}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {formatMoney(summary.pendingPayoutsCents)}
            </p>
            <p className="mt-1 text-xs text-gray-400">{t("createdNotPaid")}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("paidToDate")}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {formatMoney(summary.lifetimePaidCents)}
            </p>
            <p className="mt-1 text-xs text-gray-400">{t("lifetimeAll")}</p>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {(["rates", "earnings", "payouts"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${
              tab === tabKey
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300"
            }`}
          >
            {t(`tabs.${tabKey}`)}
          </button>
        ))}
      </div>

      {tab === "rates" && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("cleaner")}</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("rate")}</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("pending")}</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("actions")}</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading && (
                  <TableRow>
                    <TableCell className="px-5 py-6 text-center text-gray-500" colSpan={4}>{tc("loading")}</TableCell>
                  </TableRow>
                )}
                {!loading && cleaners.length === 0 && (
                  <TableRow>
                    <TableCell className="px-5 py-6 text-center text-gray-500" colSpan={4}>{t("emptyCleaners")}</TableCell>
                  </TableRow>
                )}
                {!loading &&
                  cleaners.map((c) => {
                    const comp = compByCleanerId.get(c.id);
                    const pending = pendingByCleanerId.get(c.id) || 0;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                          {cleanerDisplayName(c)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {comp ? compensationLabel(comp) : <span className="italic text-gray-400">{t("notSet")}</span>}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {formatMoney(pending)}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <RowActionsMenu
                            label={t("actionsForCleaner", { name: cleanerDisplayName(c) })}
                            actions={[
                              { label: comp ? t("editRate") : t("setRate"), onClick: () => openRateModal(c) },
                              ...(pending > 0
                                ? [{ label: t("payOut"), onClick: () => setPayoutCleaner(c) }]
                                : []),
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {tab === "earnings" && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("cleaner")}</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("job")}</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("amount")}</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("earned")}</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("status")}</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading && (
                  <TableRow>
                    <TableCell className="px-5 py-6 text-center text-gray-500" colSpan={5}>{tc("loading")}</TableCell>
                  </TableRow>
                )}
                {!loading && earnings.length === 0 && (
                  <TableRow>
                    <TableCell className="px-5 py-6 text-center text-gray-500" colSpan={5}>
                      {t("noEarnings")}
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  earnings.map((e) => {
                    const cleaner = cleaners.find((c) => c.id === e.cleanerId);
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                          {cleaner ? cleanerDisplayName(cleaner) : e.cleanerId}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {e.booking ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(e.booking.scheduledAt)) : e.bookingId}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{formatMoney(e.amountCents)}</TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(e.earnedAt))}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <Badge color={e.status === "PAID" ? "success" : e.status === "VOIDED" ? "error" : "warning"} size="sm">
                            {t(`earningStatus.${e.status}`)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {tab === "payouts" && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("cleaner")}</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("period")}</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("total")}</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("status")}</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("actions")}</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading && (
                  <TableRow>
                    <TableCell className="px-5 py-6 text-center text-gray-500" colSpan={5}>{tc("loading")}</TableCell>
                  </TableRow>
                )}
                {!loading && payouts.length === 0 && (
                  <TableRow>
                    <TableCell className="px-5 py-6 text-center text-gray-500" colSpan={5}>{t("noPayouts")}</TableCell>
                  </TableRow>
                )}
                {!loading &&
                  payouts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                        {`${p.cleaner.user.firstName} ${p.cleaner.user.lastName}`.trim()}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(p.periodStart))} – {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(p.periodEnd))}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{formatMoney(p.totalCents)}</TableCell>
                      <TableCell className="px-5 py-4">
                        <Badge color={PAYOUT_STATUS_COLOR[p.status]} size="sm">{t(`payoutStatus.${p.status}`)}</Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <RowActionsMenu
                          label={t("actionsForPayout", { name: `${p.cleaner.user.firstName} ${p.cleaner.user.lastName}`.trim() })}
                          actions={
                            p.status === "PENDING"
                                ? [
                                  {
                                    label: t("markPaidManual"),
                                    onClick: () => handleMarkPaid(p),
                                  },
                                  ...(p.cleaner.user.stripePayoutsEnabled
                                      ? [
                                        {
                                          label: payingStripeId === p.id ? t("paying") : t("payViaStripe"),
                                          disabled: payingStripeId === p.id,
                                          onClick: () => handlePayStripe(p),
                                        },
                                      ]
                                      : []),
                                ]
                                : []
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Set/edit rate modal */}
      <Modal isOpen={!!rateModal} onClose={() => setRateModal(null)} className="max-w-md p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("payRateFor", { name: rateModal ? cleanerDisplayName(rateModal) : "" })}
        </h2>
        <form onSubmit={handleSaveRate} className="space-y-4">
          <div>
            <Label>{t("type")}</Label>
            <Select
              options={[
                { value: "PERCENT", label: t("rateTypes.percent") },
                { value: "FLAT_PER_JOB", label: t("rateTypes.flatPerJob") },
                { value: "HOURLY", label: t("rateTypes.hourly") },
              ]}
              defaultValue={rateForm.type}
              onChange={(value) => setRateForm({ ...rateForm, type: value as CompensationType })}
            />
          </div>
          <div>
            <Label>
              {rateForm.type === "PERCENT"
                ? t("percentRange")
                : rateForm.type === "FLAT_PER_JOB"
                ? t("amountPerJob")
                : t("amountPerHour")}
            </Label>
            <Input
              type="number"
              min="1"
              max={rateForm.type === "PERCENT" ? "100" : undefined}
              value={rateForm.value}
              onChange={(e) => setRateForm({ ...rateForm, value: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setRateModal(null)} type="button">{tc("cancel")}</Button>
            <Button type="submit" disabled={saving}>{saving ? tc("loading") : tc("save")}</Button>
          </div>
        </form>
      </Modal>

      {/* Create payout confirmation */}
      <Modal isOpen={!!payoutCleaner} onClose={() => setPayoutCleaner(null)} className="max-w-md p-6">
        <h2 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("confirmPayoutTitle", { name: payoutCleaner ? cleanerDisplayName(payoutCleaner) : "" })}
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {t("confirmPayoutBody", { amount: payoutCleaner ? formatMoney(pendingByCleanerId.get(payoutCleaner.id) || 0) : "" })}
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => setPayoutCleaner(null)} type="button">{tc("cancel")}</Button>
          <Button onClick={handleCreatePayout} disabled={saving}>{saving ? tc("loading") : t("createPayout")}</Button>
        </div>
      </Modal>
    </div>
  );
}
