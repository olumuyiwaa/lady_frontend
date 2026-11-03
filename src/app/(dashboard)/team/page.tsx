"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
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
import Select from "@/components/form/Select";
import { useAuth } from "@/app/auth/useAuth";
import { listStaff, inviteStaff, updateStaffRole, removeStaff } from "@/app/api/staff.api";
import { StaffMember, StaffRole, staffDisplayName } from "@/app/api/cleansera-types";

const ROLE_COLOR: Record<StaffRole, "success" | "warning" | "light"> = {
  BUSINESS_OWNER: "success",
  BUSINESS_MANAGER: "light",
  ORG_ADMIN: "warning",
};

export default function TeamPage() {
  const t = useTranslations("Dashboard.team");
  const tc = useTranslations("Dashboard.common");
  const { user } = useAuth();
  const isOwnerOrOrgAdmin = user?.businessRole === "BUSINESS_OWNER" || user?.businessRole === "ORG_ADMIN";

  const [members, setMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState<StaffMember | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", role: "BUSINESS_MANAGER" as StaffRole });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listStaff();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await inviteStaff({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        role: form.role,
      });
      setShowInviteModal(false);
      setForm({ firstName: "", lastName: "", email: "", phone: "", role: "BUSINESS_MANAGER" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("inviteFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (member: StaffMember, role: StaffRole) => {
    setError("");
    try {
      await updateStaffRole(member.id, role);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("updateRoleFailed"));
    }
  };

  const handleRemove = async () => {
    if (!showRemoveModal) return;
    setSaving(true);
    setError("");
    try {
      await removeStaff(showRemoveModal.id);
      setShowRemoveModal(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("removeFailed"));
    } finally {
      setSaving(false);
    }
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
        {isOwnerOrOrgAdmin && <Button onClick={() => setShowInviteModal(true)}>{t("invite")}</Button>}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("columns.name")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("columns.email")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("columns.role")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("columns.status")}</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{tc("actions")}</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading && (
                <TableRow>
                  <TableCell className="px-5 py-6 text-center text-gray-500" colSpan={5}>{tc("loading")}</TableCell>
                </TableRow>
              )}
              {!loading && members.length === 0 && (
                <TableRow>
                  <TableCell className="px-5 py-6 text-center text-gray-500" colSpan={5}>{t("empty")}</TableCell>
                </TableRow>
              )}
              {!loading &&
                members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {staffDisplayName(m)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{m.user.email}</TableCell>
                    <TableCell className="px-5 py-4">
                      {isOwnerOrOrgAdmin && m.role !== "BUSINESS_OWNER" && m.isActive ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m, e.target.value as StaffRole)}
                          className="rounded-lg border border-gray-200 bg-transparent px-2 py-1 text-sm dark:border-gray-700 dark:text-white/90"
                        >
                          <option value="BUSINESS_MANAGER">{t("role.manager")}</option>
                          <option value="ORG_ADMIN">{t("role.orgAdmin")}</option>
                        </select>
                      ) : (
                        <Badge color={ROLE_COLOR[m.role]} size="sm">{t(`role.${m.role}`)}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Badge color={m.isActive ? "success" : "light"} size="sm">
                        {m.isActive ? (m.joinedAt ? t("status.active") : t("status.invited")) : t("status.removed")}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <RowActionsMenu
                        label={t("actionsFor", { name: staffDisplayName(m) })}
                        actions={
                          isOwnerOrOrgAdmin && m.role !== "BUSINESS_OWNER" && m.isActive
                            ? [
                                {
                                  label: t("remove"),
                                  variant: "danger" as const,
                                  onClick: () => setShowRemoveModal(m),
                                },
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

      {/* Invite modal */}
      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} className="max-w-md p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{t("inviteTitle")}</h2>
        <form onSubmit={handleInvite} className="space-y-4">
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
            <Label>{t("phone")}</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label>{t("columns.role")}</Label>
            <Select
              options={[
                { value: "BUSINESS_MANAGER", label: t("roleOptions.manager") },
                { value: "ORG_ADMIN", label: t("roleOptions.orgAdmin") },
              ]}
              defaultValue={form.role}
              onChange={(value) => setForm({ ...form, role: value as StaffRole })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowInviteModal(false)} type="button">{tc("cancel")}</Button>
            <Button type="submit" disabled={saving}>{saving ? t("sending") : t("sendInvite")}</Button>
          </div>
        </form>
      </Modal>

      {/* Remove modal */}
      <Modal isOpen={!!showRemoveModal} onClose={() => setShowRemoveModal(null)} className="max-w-md p-6">
        <h2 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("removeTitle", { name: showRemoveModal ? staffDisplayName(showRemoveModal) : "" })}
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {t("removeHint")}
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => setShowRemoveModal(null)} type="button">{tc("cancel")}</Button>
          <Button onClick={handleRemove} disabled={saving}>{saving ? t("removing") : t("confirmRemove")}</Button>
        </div>
      </Modal>
    </div>
  );
}
