"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  listDocuments,
  getUploadUrl,
  createDocument,
  getDownloadUrl,
  deleteDocument,
} from "@/app/api/cleanerDocuments.api";
import { authFetch } from "@/app/api/authFetch";
import RowActionsMenu from "@/components/tables/RowActionsMenu";

const DOC_TYPES = ["ID_CARD", "BACKGROUND_CHECK", "CERTIFICATION", "CONTRACT", "INSURANCE", "OTHER"];

export default function CleanerDocumentsPage() {
  const t = useTranslations("Dashboard.cleanerDocuments");
  const tc = useTranslations("Dashboard.common");
  const locale = useLocale();
  const [docs, setDocs] = useState<any[]>([]);
  const [cleaners, setCleaners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    cleanerId: "",
    title: "",
    type: "OTHER",
    file: null as File | null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, c] = await Promise.all([listDocuments(), authFetch("/cleaners")]);
      if (d.success) setDocs(d.data || []);
      if (c.success) setCleaners(Array.isArray(c.data) ? c.data : c.data?.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const onUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.file || !form.cleanerId || !form.title) return;
    setError("");
    try {
      const urlRes = await getUploadUrl(form.cleanerId, form.file.type, form.file.name);
      if (!urlRes.success) throw new Error(urlRes.message);
      const { uploadUrl, storageKey } = urlRes.data;
      await fetch(uploadUrl, {
        method: "PUT",
        body: form.file,
        headers: { "Content-Type": form.file.type },
      });
      const createRes = await createDocument({
        cleanerId: form.cleanerId,
        title: form.title,
        storageKey,
        type: form.type,
        mimeType: form.file.type,
        fileSize: form.file.size,
      });
      if (!createRes.success) throw new Error(createRes.message);
      setForm({ cleanerId: "", title: "", type: "OTHER", file: null });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("uploadFailed"));
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <form onSubmit={onUpload} className="grid gap-3 rounded-2xl border p-5 sm:grid-cols-2 lg:grid-cols-5 dark:border-gray-800">
        <select
          required
          value={form.cleanerId}
          onChange={(e) => setForm({ ...form, cleanerId: e.target.value })}
          className="h-11 rounded-lg border px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="">{t("selectCleaner")}</option>
          {cleaners.map((c) => (
            <option key={c.id} value={c.id}>
              {c.user?.firstName} {c.user?.lastName}
            </option>
          ))}
        </select>
        <input
          required
          placeholder={t("titlePlaceholder")}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="h-11 rounded-lg border px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="h-11 rounded-lg border px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          {DOC_TYPES.map((documentType) => (
            <option key={documentType} value={documentType}>
              {t(`types.${documentType}`)}
            </option>
          ))}
        </select>
        <div className="rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-white/[0.02]">
          <input
              type="file"
              required
              onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-gray-800 dark:file:text-gray-200 cursor-pointer"
          />
        </div>
        <button type="submit" className="h-11 rounded-lg bg-brand-500 text-sm font-medium text-white">
          {t("upload")}
        </button>
      </form>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading ? (
        <p className="text-sm text-gray-500">{tc("loading")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border dark:border-gray-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3">{t("cleaner")}</th>
                <th className="px-4 py-3">{t("titleColumn")}</th>
                <th className="px-4 py-3">{t("type")}</th>
                <th className="px-4 py-3">{t("uploaded")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-t dark:border-gray-800">
                  <td className="px-4 py-3">
                    {d.cleaner?.user?.firstName} {d.cleaner?.user?.lastName}
                  </td>
                  <td className="px-4 py-3">{d.title}</td>
                  <td className="px-4 py-3">{t(`types.${d.type}`)}</td>
                  <td className="px-4 py-3">{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(d.createdAt))}</td>
                  <td className="px-4 py-3">
                    <RowActionsMenu
                      label={t("actionsFor", { title: d.title })}
                      actions={[
                        {
                          label: t("download"),
                          onClick: async () => {
                            const res = await getDownloadUrl(d.id);
                            if (res.success && res.data?.downloadUrl) window.open(res.data.downloadUrl, "_blank");
                          },
                        },
                        {
                          label: tc("delete"),
                          variant: "danger" as const,
                          onClick: async () => {
                            await deleteDocument(d.id);
                            load();
                          },
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {!docs.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    {t("empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
