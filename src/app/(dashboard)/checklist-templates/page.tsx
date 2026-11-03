"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
    listChecklistTemplates,
    createChecklistTemplate,
    updateChecklistTemplate,
    deleteChecklistTemplate,
    ChecklistTemplate,
    ChecklistItem,
} from "@/app/api/checklistTemplates.api";

function emptyItems(): ChecklistItem[] {
    return [{ label: "", done: false }];
}

export default function ChecklistTemplatesPage() {
  const t = useTranslations("Dashboard.checklistTemplates");
  const tc = useTranslations("Dashboard.common");
    const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    const [name, setName] = useState("");
    const [items, setItems] = useState<ChecklistItem[]>(emptyItems());
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setTemplates(await listChecklistTemplates());
        } catch (e) {
            setError(e instanceof Error ? e.message : t("loadFailed"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        load();
    }, [load]);

    const resetForm = () => {
        setName("");
        setItems(emptyItems());
        setEditingId(null);
        setShowForm(false);
    };

    const startEdit = (t: ChecklistTemplate) => {
        setEditingId(t.id);
        setName(t.name);
        setItems(t.items.length ? t.items : emptyItems());
        setShowForm(true);
    };

    const startNew = () => {
        resetForm();
        setShowForm(true);
    };

    const updateItemLabel = (idx: number, label: string) => {
        setItems((prev) =>
            prev.map((it, i) => (i === idx ? { ...it, label } : it))
        );
    };

    const removeItem = (idx: number) => {
        setItems((prev) => prev.filter((_, i) => i !== idx));
    };

    const addItem = () => {
        setItems((prev) => [...prev, { label: "", done: false }]);
    };

    const onSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanItems = items
            .map((it) => ({ label: it.label.trim(), done: false }))
            .filter((it) => it.label);
        if (!name.trim() || cleanItems.length === 0) return;

        setSaving(true);
        setError("");
        try {
            if (editingId) {
                await updateChecklistTemplate(editingId, {
                    name: name.trim(),
                    items: cleanItems,
                });
            } else {
                await createChecklistTemplate({
                    name: name.trim(),
                    items: cleanItems,
                });
            }
            resetForm();
            load();
        } catch (e) {
            setError(e instanceof Error ? e.message : t("saveFailed"));
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async (id: string) => {
        if (!confirm(t("deleteConfirm"))) return;
        setError("");
        try {
            await deleteChecklistTemplate(id);
            load();
        } catch (e) {
            setError(e instanceof Error ? e.message : t("deleteFailed"));
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
                        {t("title")}</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {t("subtitle")}
                    </p>
                </div>
                <button
                    onClick={showForm ? resetForm : startNew}
                    className="h-10 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white dark:bg-white/10"
                >
                    {showForm ? tc("cancel") : t("new")}
                </button>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                </div>
            )}

            {showForm && (
                <form
                    onSubmit={onSave}
                    className="space-y-3 rounded-2xl border p-5 dark:border-gray-800"
                >
                    <input
                        required
                        placeholder={t("namePlaceholder")}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-11 w-full rounded-lg border px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                    />

                    <div className="space-y-2">
                        {items.map((it, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <input
                                    placeholder={t("stepPlaceholder", { number: idx + 1 })}
                                    value={it.label}
                                    onChange={(e) =>
                                        updateItemLabel(idx, e.target.value)
                                    }
                                    className="h-10 flex-1 rounded-lg border px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeItem(idx)}
                                    disabled={items.length === 1}
                                    className="text-xs font-medium text-red-600 disabled:opacity-30"
                                >
                                    {tc("delete")}
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={addItem}
                        className="text-sm font-medium text-gray-600 dark:text-gray-300"
                    >
                        + {t("addStep")}
                    </button>

                    <div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="h-11 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-white/10"
                        >
                            {saving
                                ? tc("loading")
                                : editingId
                                ? t("saveChanges")
                                : t("create")}
                        </button>
                    </div>
                </form>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {loading && (
                    <p className="text-sm text-gray-400">{tc("loading")}</p>
                )}
                {!loading && templates.length === 0 && (
                    <p className="text-sm text-gray-400">
                        No checklist templates yet.
                    </p>
                )}
                {templates.map((t) => (
                    <div
                        key={t.id}
                        className="rounded-2xl border p-4 dark:border-gray-800"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-800 dark:text-white/90">
                                {t.name}
                            </h3>
                            <div className="space-x-2 text-xs">
                                <button
                                    onClick={() => startEdit(t)}
                                    className="font-medium text-gray-600 dark:text-gray-300"
                                >
                                    {tc("edit")}
                                </button>
                                <button
                                    onClick={() => onDelete(t.id)}
                                    className="font-medium text-red-600"
                                >
                                    {tc("delete")}
                                </button>
                            </div>
                        </div>
                        <ul className="mt-2 space-y-1 text-sm text-gray-500">
                            {t.items.map((it, i) => (
                                <li key={i}>• {it.label}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}
