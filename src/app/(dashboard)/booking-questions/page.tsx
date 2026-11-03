"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { listServices } from "@/app/api/services.api";
import {
  createBookingQuestion,
  deleteBookingQuestion,
  listBookingQuestions,
  updateBookingQuestion,
  type ManagedQuestion,
  type QuestionInput,
} from "@/app/api/bookingQuestions.api";
import type { BookingQuestionType } from "@/lib/bookingQuestions";

const TYPES: BookingQuestionType[] = ["TEXT", "LONG_TEXT", "SELECT", "MULTI_SELECT", "YES_NO", "NUMBER"];
const isChoice = (type: BookingQuestionType) => type === "SELECT" || type === "MULTI_SELECT";

type FormState = {
  id: string | null;
  label: string;
  helpText: string;
  type: BookingQuestionType;
  optionsText: string;
  required: boolean;
  isActive: boolean;
  serviceIds: string[];
};
const EMPTY: FormState = { id: null, label: "", helpText: "", type: "TEXT", optionsText: "", required: false, isActive: true, serviceIds: [] };

export default function BookingQuestionsPage() {
  const t = useTranslations("Dashboard.bookingQuestions");
  const { isOpen, openModal, closeModal } = useModal();
  const [questions, setQuestions] = useState<ManagedQuestion[]>([]);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [q, s] = await Promise.all([listBookingQuestions(), listServices()]);
      setQuestions(q);
      setServices(s.map((x) => ({ id: x.id, name: x.name })));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // Initial data load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const openNew = () => {
    setForm(EMPTY);
    setError("");
    openModal();
  };

  const openEdit = (q: ManagedQuestion) => {
    setForm({
      id: q.id,
      label: q.label,
      helpText: q.helpText ?? "",
      type: q.type,
      optionsText: q.options.join("\n"),
      required: q.required,
      isActive: q.isActive,
      serviceIds: q.serviceIds,
    });
    setError("");
    openModal();
  };

  const run = async (fn: () => Promise<void>, failMessage: string) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : failMessage);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: QuestionInput = {
      label: form.label.trim(),
      helpText: form.helpText.trim(),
      type: form.type,
      options: isChoice(form.type) ? form.optionsText.split("\n").map((o) => o.trim()).filter(Boolean) : [],
      required: form.required,
      isActive: form.isActive,
      serviceIds: form.serviceIds,
    };
    const ok = await run(async () => {
      if (form.id) await updateBookingQuestion(form.id, input);
      else await createBookingQuestion(input);
    }, t("saveFailed"));
    if (ok) closeModal();
  };

  const remove = (q: ManagedQuestion) => {
    if (!window.confirm(t("confirmDelete", { label: q.label }))) return;
    void run(() => deleteBookingQuestion(q.id), t("deleteFailed"));
  };

  // Swap display positions with a neighbour.
  const move = (index: number, delta: -1 | 1) => {
    const a = questions[index];
    const b = questions[index + delta];
    if (!a || !b) return;
    void run(async () => {
      // sortOrder values can tie (all zero); renumber so the swap always sticks.
      const order = questions.map((q) => q.id);
      [order[index], order[index + delta]] = [order[index + delta], order[index]];
      await Promise.all(order.map((id, i) => updateBookingQuestion(id, { sortOrder: i })));
    }, t("saveFailed"));
  };

  const serviceNames = (ids: string[]) =>
    ids.length === 0 ? t("allServices") : ids.map((id) => services.find((s) => s.id === id)?.name ?? "?").join(", ");

  const toggleService = (id: string) =>
    setForm((f) => ({ ...f, serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter((x) => x !== id) : [...f.serviceIds, id] }));

  const field = "w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2.5 text-sm dark:border-gray-700";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
        </div>
        <button type="button" onClick={openNew} className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
          {t("add")}
        </button>
      </div>

      {error && !isOpen && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">{t("loading")}</p>
      ) : questions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-white/[0.03]">
          {questions.map((q, i) => (
            <li key={q.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="flex flex-col">
                <button type="button" aria-label={t("moveUp")} disabled={busy || i === 0} onClick={() => move(i, -1)} className="px-1 text-gray-400 hover:text-gray-700 disabled:opacity-30">▲</button>
                <button type="button" aria-label={t("moveDown")} disabled={busy || i === questions.length - 1} onClick={() => move(i, 1)} className="px-1 text-gray-400 hover:text-gray-700 disabled:opacity-30">▼</button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                  {q.label}
                  {q.required && <span className="ml-1 text-red-600">*</span>}
                  {!q.isActive && <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-500">{t("inactive")}</span>}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {t(`types.${q.type}`)} · {serviceNames(q.serviceIds)}
                </p>
              </div>
              <button type="button" onClick={() => openEdit(q)} className="text-sm font-medium text-brand-600 hover:text-brand-700">{t("edit")}</button>
              <button type="button" onClick={() => remove(q)} disabled={busy} className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-60">{t("delete")}</button>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[560px] p-6 lg:p-8">
        <form onSubmit={save} className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{form.id ? t("editTitle") : t("addTitle")}</h2>
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <div>
            <label htmlFor="bq-label" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("label")}</label>
            <input id="bq-label" required maxLength={200} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={field} placeholder={t("labelPlaceholder")} />
          </div>
          <div>
            <label htmlFor="bq-help" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("helpText")}</label>
            <input id="bq-help" maxLength={300} value={form.helpText} onChange={(e) => setForm({ ...form, helpText: e.target.value })} className={field} />
          </div>
          <div>
            <label htmlFor="bq-type" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("type")}</label>
            <select id="bq-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as BookingQuestionType })} className={field}>
              {TYPES.map((ty) => <option key={ty} value={ty}>{t(`types.${ty}`)}</option>)}
            </select>
          </div>
          {isChoice(form.type) && (
            <div>
              <label htmlFor="bq-options" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("options")}</label>
              <textarea id="bq-options" rows={4} value={form.optionsText} onChange={(e) => setForm({ ...form, optionsText: e.target.value })} className={field} placeholder={t("optionsPlaceholder")} />
              <p className="mt-1 text-xs text-gray-500">{t("optionsHint")}</p>
            </div>
          )}
          <fieldset>
            <legend className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{t("appliesTo")}</legend>
            <p className="mb-2 text-xs text-gray-500">{t("appliesToHint")}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={form.serviceIds.includes(s.id)} onChange={() => toggleService(s.id)} />
                  {s.name}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={form.required} onChange={(e) => setForm({ ...form, required: e.target.checked })} /> {t("required")}
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> {t("active")}
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">{t("cancel")}</button>
            <button type="submit" disabled={busy} className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">{t("save")}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
