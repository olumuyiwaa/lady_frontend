"use client";

import { isoDateInTimeZone } from "@/app/services/currency";
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
    listDocuments,
    createDocument,
    uploadDocumentFile,
    deleteDocument,
    listAudits,
    createAudit,
    updateAudit,
    listTrainingAcks,
    ComplianceDocument,
    ComplianceAudit,
    ComplianceDocType,
    ChemicalTrainingAck,
} from "@/app/api/compliance.api";

const DOC_TYPES: ComplianceDocType[] = [
    "SDS",
    "RISK_ASSESSMENT",
    "COSHH_ASSESSMENT",
    "TRAINING_RECORD",
    "INSPECTION_REPORT",
    "CERTIFICATE",
    "OTHER",
];

export default function CompliancePage() {
  const t = useTranslations("Dashboard.compliance");
  const tc = useTranslations("Dashboard.common");
    const locale = useLocale();
    const [tab, setTab] = useState<"documents" | "audits" | "training">("documents");
    const [docs, setDocs] = useState<ComplianceDocument[]>([]);
    const [audits, setAudits] = useState<ComplianceAudit[]>([]);
    const [acks, setAcks] = useState<ChemicalTrainingAck[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [typeFilter, setTypeFilter] = useState<ComplianceDocType | "ALL">("ALL");
    const [expiringSoon, setExpiringSoon] = useState(false);

    const [showDocModal, setShowDocModal] = useState(false);
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [docFile, setDocFile] = useState<File | null>(null);
    const [docForm, setDocForm] = useState({
        type: "SDS" as ComplianceDocType,
        title: "",
        version: "",
        expiresAt: "",
        notes: "",
    });

    const [auditForm, setAuditForm] = useState({
        title: "",
        type: "INTERNAL",
        conductedAt: isoDateInTimeZone(new Date()),
        score: "",
        notes: "",
    });

    const loadDocs = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await listDocuments({
                type: typeFilter === "ALL" ? undefined : typeFilter,
                expiringSoon: expiringSoon || undefined,
            });
            setDocs(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : t("loadDocumentsFailed"));
        } finally {
            setLoading(false);
        }
    }, [typeFilter, expiringSoon, t]);

    const loadAudits = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await listAudits();
            setAudits(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : t("loadAuditsFailed"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    const loadAcks = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await listTrainingAcks();
            setAcks(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : t("loadTrainingFailed"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        if (tab === "documents") loadDocs();
        else if (tab === "audits") loadAudits();
        else loadAcks();
    }, [tab, loadDocs, loadAudits, loadAcks]);

    const handleCreateDoc = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            if (!docFile) throw new Error(t("chooseFile"));
            // Upload first; the API only accepts a storageKey it issued for this business
            // (the old free-text key / "pending/…" placeholder is rejected).
            const uploaded = await uploadDocumentFile(docFile);
            await createDocument({
                type: docForm.type,
                title: docForm.title,
                storageKey: uploaded.storageKey,
                mimeType: uploaded.mimeType,
                fileSize: uploaded.fileSize,
                version: docForm.version || undefined,
                expiresAt: docForm.expiresAt || undefined,
                notes: docForm.notes || undefined,
            });
            setShowDocModal(false);
            setDocFile(null);
            setDocForm({ type: "SDS", title: "", version: "", expiresAt: "", notes: "" });
            await loadDocs();
        } catch (err) {
            setError(err instanceof Error ? err.message : t("createDocumentFailed"));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteDoc = async (id: string) => {
        if (!confirm(t("deleteDocumentConfirm"))) return;
        try {
            await deleteDocument(id);
            await loadDocs();
        } catch (err) {
            setError(err instanceof Error ? err.message : t("deleteDocumentFailed"));
        }
    };

    const handleCreateAudit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            await createAudit({
                title: auditForm.title,
                type: auditForm.type,
                conductedAt: new Date(auditForm.conductedAt).toISOString(),
                score: auditForm.score ? Number(auditForm.score) : undefined,
                notes: auditForm.notes || undefined,
            });
            setShowAuditModal(false);
            setAuditForm({ title: "", type: "INTERNAL", conductedAt: isoDateInTimeZone(new Date()), score: "", notes: "" });
            await loadAudits();
        } catch (err) {
            setError(err instanceof Error ? err.message : t("createAuditFailed"));
        } finally {
            setSaving(false);
        }
    };

    const closeAudit = async (audit: ComplianceAudit) => {
        try {
            await updateAudit(audit.id, { status: "CLOSED" });
            await loadAudits();
        } catch (err) {
            setError(err instanceof Error ? err.message : t("updateAuditFailed"));
        }
    };

    const isExpiringSoon = (expiresAt?: string | null) => {
        if (!expiresAt) return false;
        const d = new Date(expiresAt);
        const in30 = new Date();
        in30.setDate(in30.getDate() + 30);
        return d <= in30 && d >= new Date();
    };

    const isExpired = (expiresAt?: string | null) => {
        if (!expiresAt) return false;
        return new Date(expiresAt) < new Date();
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
                <div className="flex flex-wrap gap-2">
                    {tab === "documents" && (
                        <Button onClick={() => setShowDocModal(true)}>{t("addDocument")}</Button>
                    )}
                    {tab === "audits" && (
                        <Button onClick={() => setShowAuditModal(true)}>{t("newAudit")}</Button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                    {error}
                </div>
            )}

            {/* Tabs */}
            <div className="mb-4 flex flex-wrap gap-2">
                {(["documents", "audits", "training"] as const).map((tabKey) => (
                    <button
                        key={tabKey}
                        onClick={() => setTab(tabKey)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                            tab === tabKey
                                ? "bg-brand-500 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300"
                        }`}
                    >
                        {tabKey === "documents" ? t("documentsTab") : tabKey === "audits" ? t("auditsTab") : t("trainingTab")}
                    </button>
                ))}
            </div>

            {/* Document filters */}
            {tab === "documents" && (
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    {(["ALL", ...DOC_TYPES] as const).map((typeKey) => (
                        <button
                            key={typeKey}
                            onClick={() => setTypeFilter(typeKey)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                typeFilter === typeKey
                                    ? "bg-brand-500 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300"
                            }`}
                        >
                            {typeKey === "ALL" ? t("allTypes") : t(`docTypes.${typeKey}`)}
                        </button>
                    ))}
                    <label className="ml-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <input
                            type="checkbox"
                            checked={expiringSoon}
                            onChange={(e) => setExpiringSoon(e.target.checked)}
                            className="rounded"
                        />
                        {t("expiringSoonFilter")}
                    </label>
                </div>
            )}

            {/* ─── Documents table ───────────────────────────────── */}
            {tab === "documents" && (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]">
                    <div className="max-w-full overflow-x-auto">
                        <Table>
                            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                                <TableRow>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("titleField")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("type")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("version")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("expires")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("actions")}</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading && (
                                    <TableRow>
                                        <TableCell className="px-5 py-6 text-center text-gray-500" colSpan={5}>{tc("loading")}</TableCell>
                                    </TableRow>
                                )}
                                {!loading && docs.length === 0 && (
                                    <TableRow>
                                        <TableCell className="px-5 py-6 text-center text-gray-500" colSpan={5}>{t("emptyDocuments")}</TableCell>
                                    </TableRow>
                                )}
                                {!loading &&
                                    docs.map((doc) => (
                                        <TableRow key={doc.id}>
                                            <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                                                {doc.title}
                                            </TableCell>
                                            <TableCell className="px-5 py-4 text-sm text-gray-500">
                                                {t(`docTypes.${doc.type}`)}
                                            </TableCell>
                                            <TableCell className="px-5 py-4 text-sm text-gray-500">{doc.version || "—"}</TableCell>
                                            <TableCell className="px-5 py-4 text-sm">
                                                {doc.expiresAt ? (
                                                    <span className={
                                                        isExpired(doc.expiresAt)
                                                            ? "text-error-500"
                                                            : isExpiringSoon(doc.expiresAt)
                                                                ? "text-warning-500"
                                                                : "text-gray-500"
                                                    }>
                            {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(doc.expiresAt))}
                                                        {isExpired(doc.expiresAt) && ` (${t("expired")})`}
                                                        {isExpiringSoon(doc.expiresAt) && ` (${t("soon")})`}
                          </span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-5 py-4">
                                                <RowActionsMenu
                                                    label={t("actionsFor", { title: doc.title })}
                                                    actions={[
                                                        {
                                                            label: tc("delete"),
                                                            variant: "danger" as const,
                                                            onClick: () => handleDeleteDoc(doc.id),
                                                        },
                                                    ]}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* ─── Audits table ──────────────────────────────────── */}
            {tab === "audits" && (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]">
                    <div className="max-w-full overflow-x-auto">
                        <Table>
                            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                                <TableRow>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("titleField")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("type")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("date")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("score")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("status")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("actions")}</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading && (
                                    <TableRow>
                                        <TableCell className="px-5 py-6 text-center text-gray-500" colSpan={6}>{tc("loading")}</TableCell>
                                    </TableRow>
                                )}
                                {!loading && audits.length === 0 && (
                                    <TableRow>
                                        <TableCell className="px-5 py-6 text-center text-gray-500" colSpan={6}>{t("noAudits")}</TableCell>
                                    </TableRow>
                                )}
                                {!loading &&
                                    audits.map((a) => (
                                        <TableRow key={a.id}>
                                            <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                                                {a.title}
                                            </TableCell>
                                            <TableCell className="px-5 py-4 text-sm text-gray-500">{t(`auditTypes.${a.type}`)}</TableCell>
                                            <TableCell className="px-5 py-4 text-sm text-gray-500">
                                                {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(a.conductedAt))}
                                            </TableCell>
                                            <TableCell className="px-5 py-4 text-sm text-gray-500">
                                                {a.score != null ? `${a.score}/100` : "—"}
                                            </TableCell>
                                            <TableCell className="px-5 py-4">
                                                <Badge
                                                    color={a.status === "CLOSED" ? "success" : a.status === "IN_PROGRESS" ? "warning" : "info"}
                                                    size="sm"
                                                >
                                                    {t(`auditStatus.${a.status}`)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-5 py-4">
                                                <RowActionsMenu
                                                    label={t("actionsFor", { title: a.title })}
                                                    actions={
                                                        a.status !== "CLOSED"
                                                            ? [{ label: t("closeAudit"), onClick: () => closeAudit(a) }]
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

            {/* ─── Training acks table ───────────────────────────── */}
            {tab === "training" && (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]">
                    <div className="max-w-full overflow-x-auto">
                        <Table>
                            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                                <TableRow>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("cleaner")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("documentId")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("acknowledged")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("notes")}</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading && (
                                    <TableRow>
                                        <TableCell className="px-5 py-6 text-center text-gray-500" colSpan={4}>{tc("loading")}</TableCell>
                                    </TableRow>
                                )}
                                {!loading && acks.length === 0 && (
                                    <TableRow>
                                        <TableCell className="px-5 py-6 text-center text-gray-500" colSpan={4}>
                                            {t("trainingEmpty")}
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading &&
                                    acks.map((ack) => (
                                        <TableRow key={ack.id}>
                                            <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                                                {ack.cleaner
                                                    ? `${ack.cleaner.user.firstName} ${ack.cleaner.user.lastName}`
                                                    : ack.cleanerId}
                                            </TableCell>
                                            <TableCell className="px-5 py-4 text-sm text-gray-500 font-mono text-xs">
                                                {ack.documentId.slice(0, 12)}…
                                            </TableCell>
                                            <TableCell className="px-5 py-4 text-sm text-gray-500">
                                                {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(ack.acknowledgedAt))}
                                            </TableCell>
                                            <TableCell className="px-5 py-4 text-sm text-gray-500">{ack.notes || "—"}</TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* ─── Add Document Modal ────────────────────────────── */}
            <Modal isOpen={showDocModal} onClose={() => setShowDocModal(false)} className="max-w-md p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{t("addDocument")}</h2>
                <form onSubmit={handleCreateDoc} className="space-y-4">
                    <div>
                        <Label>{t("type")}</Label>
                        <select
                            value={docForm.type}
                            onChange={(e) => setDocForm({ ...docForm, type: e.target.value as ComplianceDocType })}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                        >
                            {DOC_TYPES.map((docType) => (
                                <option key={docType} value={docType}>{t(`docTypes.${docType}`)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label>{t("titleField")}</Label>
                        <Input value={docForm.title} onChange={(e) => setDocForm({ ...docForm, title: e.target.value })} required placeholder={t("fileExample")} />
                    </div>
                    <div>
                        <Label>{t("fileLabel")}</Label>
                        <input
                            type="file"
                            accept="application/pdf,image/jpeg,image/png,image/webp"
                            required
                            onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                            className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm dark:text-gray-300 dark:file:bg-gray-800"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>{t("version")}</Label>
                            <Input value={docForm.version} onChange={(e) => setDocForm({ ...docForm, version: e.target.value })} placeholder={t("versionExample")} />
                        </div>
                        <div>
                            <Label>{t("expires")}</Label>
                            <Input type="date" value={docForm.expiresAt} onChange={(e) => setDocForm({ ...docForm, expiresAt: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <Label>{t("notes")}</Label>
                        <Input value={docForm.notes} onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setShowDocModal(false)} type="button">{tc("cancel")}</Button>
                        <Button type="submit" disabled={saving}>{saving ? t("saving") : t("create")}</Button>
                    </div>
                </form>
            </Modal>

            {/* ─── New Audit Modal ───────────────────────────────── */}
            <Modal isOpen={showAuditModal} onClose={() => setShowAuditModal(false)} className="max-w-md p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{t("newAudit")}</h2>
                <form onSubmit={handleCreateAudit} className="space-y-4">
                    <div>
                        <Label>{t("titleField")}</Label>
                        <Input value={auditForm.title} onChange={(e) => setAuditForm({ ...auditForm, title: e.target.value })} required placeholder={t("auditTitleExample")} />
                    </div>
                    <div>
                        <Label>{t("type")}</Label>
                        <select
                            value={auditForm.type}
                            onChange={(e) => setAuditForm({ ...auditForm, type: e.target.value })}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                        >
                            <option value="INTERNAL">{t("internal")}</option>
                            <option value="OSHA_INSPECTION">{t("oshaInspection")}</option>
                            <option value="CLIENT">{t("clientAudit")}</option>
                            <option value="SDS_REVIEW">{t("sdsReview")}</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>{t("date")}</Label>
                            <Input type="date" value={auditForm.conductedAt} onChange={(e) => setAuditForm({ ...auditForm, conductedAt: e.target.value })} required />
                        </div>
                        <div>
                            <Label>{t("scoreRange")}</Label>
                            <Input type="number" min="0" max="100" value={auditForm.score} onChange={(e) => setAuditForm({ ...auditForm, score: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <Label>{t("notes")}</Label>
                        <Input value={auditForm.notes} onChange={(e) => setAuditForm({ ...auditForm, notes: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setShowAuditModal(false)} type="button">{tc("cancel")}</Button>
                        <Button type="submit" disabled={saving}>{saving ? t("saving") : t("create")}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}