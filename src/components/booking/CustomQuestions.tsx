"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import type { AnswerValue, Answers, BookingQuestion } from "@/lib/bookingQuestions";

type Props = {
  questions: BookingQuestion[];
  answers: Answers;
  onChange: (questionId: string, value: AnswerValue | undefined) => void;
  primaryColor?: string;
  /** Show "required" hints on unanswered required questions. */
  showErrors?: boolean;
};

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2";

/** The business's own questions, rendered by type. */
export function CustomQuestions({ questions, answers, onChange, primaryColor = "#20407A" }: Props) {
  const t = useTranslations("Booking.questions");
  const base = useId();
  if (questions.length === 0) return null;
  const ring = { ["--tw-ring-color" as string]: primaryColor };

  return (
    <section className="space-y-5" aria-label={t("heading")}>
      <h3 className="text-sm font-semibold text-gray-900">{t("heading")}</h3>
      {questions.map((q) => {
        const id = `${base}-${q.id}`;
        const value = answers[q.id];
        const hintId = q.helpText ? `${id}-hint` : undefined;
        const label = (
          <>
            {q.label}
            {q.required ? (
              <span className="ml-0.5 text-red-600" aria-hidden>
                *
              </span>
            ) : (
              <span className="ml-1 text-xs font-normal text-gray-400">{t("optional")}</span>
            )}
          </>
        );

        return (
          <div key={q.id}>
            {q.type === "YES_NO" || q.type === "MULTI_SELECT" ? (
              <fieldset aria-describedby={hintId} aria-required={q.required}>
                <legend className="mb-1 block text-sm font-medium text-gray-700">{label}</legend>
                {q.type === "YES_NO" ? (
                  <div className="flex gap-3">
                    {[true, false].map((opt) => (
                      <label
                        key={String(opt)}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm ${
                          value === opt ? "border-transparent text-white" : "border-gray-300 text-gray-700"
                        }`}
                        style={value === opt ? { backgroundColor: primaryColor } : undefined}
                      >
                        <input
                          type="radio"
                          name={id}
                          className="sr-only"
                          checked={value === opt}
                          onChange={() => onChange(q.id, opt)}
                        />
                        {opt ? t("yes") : t("no")}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {q.options.map((opt) => {
                      const selected = Array.isArray(value) && value.includes(opt);
                      return (
                        <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => {
                              const current = Array.isArray(value) ? value : [];
                              const next = selected ? current.filter((x) => x !== opt) : [...current, opt];
                              onChange(q.id, next.length ? next : undefined);
                            }}
                            style={{ accentColor: primaryColor }}
                          />
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                )}
              </fieldset>
            ) : (
              <>
                <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
                  {label}
                </label>
                {q.type === "LONG_TEXT" ? (
                  <textarea
                    id={id}
                    rows={3}
                    maxLength={2000}
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => onChange(q.id, e.target.value)}
                    aria-describedby={hintId}
                    aria-required={q.required}
                    className={inputClass}
                    style={ring}
                  />
                ) : q.type === "SELECT" ? (
                  <select
                    id={id}
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => onChange(q.id, e.target.value || undefined)}
                    aria-describedby={hintId}
                    aria-required={q.required}
                    className={inputClass}
                    style={ring}
                  >
                    <option value="">{t("choose")}</option>
                    {q.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : q.type === "NUMBER" ? (
                  <input
                    id={id}
                    type="number"
                    inputMode="decimal"
                    value={typeof value === "number" ? value : ""}
                    onChange={(e) => onChange(q.id, e.target.value === "" ? undefined : Number(e.target.value))}
                    aria-describedby={hintId}
                    aria-required={q.required}
                    className={inputClass}
                    style={ring}
                  />
                ) : (
                  <input
                    id={id}
                    type="text"
                    maxLength={500}
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => onChange(q.id, e.target.value)}
                    aria-describedby={hintId}
                    aria-required={q.required}
                    className={inputClass}
                    style={ring}
                  />
                )}
              </>
            )}
            {q.helpText && (
              <p id={hintId} className="mt-1 text-xs text-gray-500">
                {q.helpText}
              </p>
            )}
          </div>
        );
      })}
    </section>
  );
}
