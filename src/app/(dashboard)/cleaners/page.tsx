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
  listCleaners,
  onboardCleaner,
  offboardCleaner,
} from "@/app/api/cleaners.api";
import { Cleaner, CleanerStatus, cleanerDisplayName } from "@/app/api/cleansera-types";

const STATUS_COLOR: Record<CleanerStatus, "success" | "warning" | "error" | "light"> = {
  ACTIVE: "success",
  PENDING: "warning",
  SUSPENDED: "warning",
  OFFBOARDED: "light",
};

const STATUS_FILTERS: (CleanerStatus | "ALL")[] = ["ALL", "ACTIVE", "PENDING", "SUSPENDED", "OFFBOARDED"];

const STATUS_I18N: Record<CleanerStatus, "active" | "invited" | "suspended" | "offboarded"> = {
  ACTIVE: "active",
  PENDING: "invited",
  SUSPENDED: "suspended",
  OFFBOARDED: "offboarded",
};

export default function CleanersPage() {
  const t = useTranslations("Dashboard.cleaners");
  const tc = useTranslations("Dashboard.common");
  const ts = useTranslations("Dashboard.cleaners.status");
  const ta = useTranslations("Dashboard.cleaners.actions");
  const locale = useLocale();

  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [statusFilter, setStatusFilter] = useState<CleanerStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showOffboardModal, setShowOffboardModal] = useState<Cleaner | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", hireDate: "" });
  const [offboardReason, setOffboardReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listCleaners(statusFilter === "ALL" ? undefined : statusFilter);
      setCleaners(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, tc]);

  useEffect(() => {
    load();
  }, [load]);

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onboardCleaner({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        hireDate: form.hireDate || undefined,
      });
      setShowOnboardModal(false);
      setForm({ firstName: "", lastName: "", email: "", phone: "", hireDate: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("errorGeneric"));
    } finally {
      setSaving(false);
    }
  };

  const handleOffboard = async () => {
    if (!showOffboardModal) return;
    setSaving(true);
    setError("");
    try {
      await offboardCleaner(showOffboardModal.id, offboardReason || undefined);
      setShowOffboardModal(null);
      setOffboardReason("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("errorGeneric"));
    } finally {
      setSaving(false);
    }
  };

  const filterLabel = (s: CleanerStatus | "ALL") => {
    if (s === "ALL") return tc("all");
    return ts(STATUS_I18N[s]);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setShowOnboardModal(true)}>{t("invite")}</Button>
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
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("columns.name")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("columns.email")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("columns.phone")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("hired")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("columns.status")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{tc("actions")}</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading && (
                <TableRow>
                  <TableCell className="px-5 py-6 text-center text-gray-500" colSpan={6}>{tc("loading")}</TableCell>
                </TableRow>
              )}
              {!loading && cleaners.length === 0 && (
                <TableRow>
                  <TableCell className="px-5 py-6 text-center text-gray-500" colSpan={6}>{t("empty")}</TableCell>
                </TableRow>
              )}
              {!loading &&
                cleaners.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {cleanerDisplayName(c)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{c.user.email}</TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{c.user.phone || "—"}</TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {c.hireDate ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(c.hireDate)) : "—"}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Badge color={STATUS_COLOR[c.status]} size="sm">{ts(STATUS_I18N[c.status])}</Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <RowActionsMenu
                        label={`${tc("actions")} ${cleanerDisplayName(c)}`}
                        actions={[
                          ...(c.status === "ACTIVE"
                            ? [
                                {
                                  label: ta("offboard"),
                                  variant: "danger" as const,
                                  onClick: () => setShowOffboardModal(c),
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

      <Modal isOpen={showOnboardModal} onClose={() => setShowOnboardModal(false)} className="max-w-md p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{t("onboardTitle")}</h2>
        <form onSubmit={handleOnboard} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("firstName")}</Label>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div>
              <Label>{t("lastName")}</Label>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label>{t("columns.email")}</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <Label>{t("columns.phone")}</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label>{t("hireDate")}</Label>
            <Input type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowOnboardModal(false)} type="button">{tc("cancel")}</Button>
            <Button type="submit" disabled={saving}>{saving ? t("onboarding") : t("onboard")}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showOffboardModal} onClose={() => setShowOffboardModal(null)} className="max-w-md p-6">
        <h2 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("offboardTitle", { name: showOffboardModal ? cleanerDisplayName(showOffboardModal) : "" })}
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{t("offboardHint")}</p>
        <Label>{t("reasonOptional")}</Label>
        <Input value={offboardReason} onChange={(e) => setOffboardReason(e.target.value)} />
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setShowOffboardModal(null)} type="button">{tc("cancel")}</Button>
          <Button onClick={handleOffboard} disabled={saving}>{saving ? t("offboarding") : t("confirmOffboard")}</Button>
        </div>
      </Modal>
    </div>
  );
}
